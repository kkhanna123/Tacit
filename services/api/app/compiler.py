"""Prompt compiler: request + intent path + skill + context pack -> PromptBundle.

Deterministic by design — same inputs, same bundle, same hash.
"""
import hashlib
import json
import re
from typing import Optional

from sqlmodel import Session, select

from .models import ContextPack, IntentNode, Project, Skill, SkillInstall, SkillVersion
from .tokens import estimate_tokens

SKILL_KEYWORDS = {
    "investment-memo-bullets": ["memo", "bullet", "client ready", "client-ready", "ic ", "diligence summary"],
    "board-update-condenser": ["board", "condense", "board update", "update for the board"],
    "risk-register-generator": ["risk register"],
}

INTENT_PATH_ORDER = ["org", "department", "project", "workflow", "artifact", "guardrail", "source"]


def normalize_request(text: str) -> dict:
    lowered = text.lower()
    artifact = "markdown"
    task_type = "generate"
    if any(k in lowered for k in ["bullet", "memo"]):
        task_type = "summarize_to_memo"
    elif any(k in lowered for k in ["board", "condense"]):
        task_type = "condense_update"
    audience = "client" if "client" in lowered else ("board" if "board" in lowered else "internal")
    return {
        "task_type": task_type,
        "artifact_type": artifact,
        "audience": audience,
        "keywords": sorted(set(re.findall(r"[a-z][a-z-]{3,}", lowered)))[:12],
    }


def route_intent(session: Session, project_id: str, request_text: str) -> dict:
    """Hybrid deterministic route: explicit project + keyword match to installed skills."""
    project = session.get(Project, project_id)
    lowered = request_text.lower()

    installs = session.exec(select(SkillInstall).where(SkillInstall.project_id == project_id)).all()
    installed_skills = [session.get(Skill, i.skill_id) for i in installs]

    matched_skill, matched_terms = None, []
    for skill in installed_skills:
        terms = [t for t in SKILL_KEYWORDS.get(skill.slug, []) if t in lowered]
        if terms and (matched_skill is None or len(terms) > len(matched_terms)):
            matched_skill, matched_terms = skill, terms

    workflow = session.exec(
        select(IntentNode).where(IntentNode.project_id == project_id, IntentNode.node_type == "workflow")
    ).first()

    confidence = "high" if matched_skill and len(matched_terms) >= 1 else "low"
    return {
        "project_id": project_id,
        "project_name": project.name if project else None,
        "workflow_node_id": workflow.id if workflow else None,
        "workflow_title": workflow.title if workflow else None,
        "matched_skill_id": matched_skill.id if matched_skill else None,
        "matched_skill_slug": matched_skill.slug if matched_skill else None,
        "matched_terms": matched_terms,
        "confidence": confidence,
        "method": "explicit_project + keyword_match",
    }


def intent_path_nodes(session: Session, project_id: str) -> list[IntentNode]:
    org_level = session.exec(
        select(IntentNode).where(IntentNode.project_id == None)  # noqa: E711
    ).all()
    project_level = session.exec(
        select(IntentNode).where(IntentNode.project_id == project_id, IntentNode.status == "active")
    ).all()
    nodes = [n for n in org_level if n.status == "active"] + list(project_level)
    order = {t: i for i, t in enumerate(INTENT_PATH_ORDER)}
    return sorted(nodes, key=lambda n: (order.get(n.node_type, 99), n.priority))


def node_context_card(node: IntentNode) -> str:
    """Compact context card — bullets + hard constraints, never the full body."""
    lines = [f"### {node.title} [{node.node_type}]"]
    for bullet in node.canonical_context or []:
        lines.append(f"- {bullet}")
    constraints = node.constraints or {}
    for must in constraints.get("must", []):
        lines.append(f"- MUST: {must}")
    for must_not in constraints.get("must_not", []):
        lines.append(f"- MUST NOT: {must_not}")
    return "\n".join(lines)


def compile_context_pack(session: Session, project_id: str, persist: bool = True) -> ContextPack:
    project = session.get(Project, project_id)
    nodes = intent_path_nodes(session, project_id)
    cards = [node_context_card(n) for n in nodes]
    compiled = "\n\n".join(cards)
    node_ids = [n.id for n in nodes]

    manifest = {
        "strategy": "select-then-compress",
        "included_nodes": [
            {"id": n.id, "title": n.title, "type": n.node_type,
             "tokens": estimate_tokens(node_context_card(n)),
             "reason": f"{n.node_type} node on the intent path for this project"}
            for n in nodes
        ],
        "excluded": [
            {"what": "raw research notes body", "reason": "full body excluded; compact fact card used instead"},
            {"what": "sibling projects' nodes", "reason": "outside this project's intent path"},
        ],
    }

    existing = session.exec(
        select(ContextPack)
        .where(ContextPack.project_id == project_id, ContextPack.status == "active")
        .order_by(ContextPack.version.desc())
    ).first()
    if existing and existing.compiled_text == compiled:
        return existing

    pack = ContextPack(
        id=f"pack_{project_id}_{(existing.version + 1) if existing else 1}",
        org_id=project.org_id,
        project_id=project_id,
        name=f"{project.name} Context Pack",
        description="Compiled from intent-path context cards (select-then-compress).",
        manifest_json=manifest,
        compiled_text=compiled,
        token_estimate=estimate_tokens(compiled),
        source_intent_node_ids=node_ids,
        version=(existing.version + 1) if existing else 1,
    )
    if persist:
        if existing:
            existing.status = "superseded"
            session.add(existing)
        session.add(pack)
        session.commit()
        session.refresh(pack)
    return pack


def build_prompt_bundle(
    request_text: str,
    normalized: dict,
    pack: ContextPack,
    skill_version: Optional[SkillVersion],
    provider: str,
) -> dict:
    rails = list(skill_version.rails_json) if skill_version else [
        "MUST: follow org style rules in the context pack",
        "MUST NOT: use promotional adjectives",
    ]
    bundle = {
        "system_contract": (
            "You are Enterprise Mind, a deterministic enterprise output compiler. "
            "Follow the skill instructions and rails exactly. Output only the requested artifact."
        ),
        "developer_contract": (
            "Use ONLY facts present in the context pack or the user request. "
            "Flag anything unverified inline. Respect every MUST / MUST NOT rail."
        ),
        "task": request_text,
        "normalized_intent": normalized,
        "context_pack": pack.compiled_text,
        "skill_instructions": skill_version.system_instructions if skill_version else "Generic assistant contract: answer concisely in markdown.",
        "output_schema": skill_version.output_schema_json if skill_version else {},
        "rails": rails,
        "examples": skill_version.examples_json if skill_version else [],
        "token_budget": skill_version.token_budget if skill_version else 800,
        "provider_profile": provider,
    }
    return bundle


def bundle_text(bundle: dict) -> str:
    """Flattened text used for token estimation and hashing."""
    parts = [
        bundle["system_contract"], bundle["developer_contract"], bundle["task"],
        bundle["context_pack"], bundle["skill_instructions"],
        json.dumps(bundle["output_schema"]), "\n".join(bundle["rails"]),
        json.dumps(bundle["examples"]),
    ]
    return "\n\n".join(parts)


def bundle_hash(bundle: dict) -> str:
    return hashlib.sha256(bundle_text(bundle).encode()).hexdigest()[:16]


def compile_baseline_prompt(request_text: str, session: Session, project_id: str) -> str:
    """What users do today: paste the raw dump under a vague ask."""
    source = session.exec(
        select(IntentNode).where(IntentNode.project_id == project_id, IntentNode.node_type == "source")
    ).first()
    raw = source.body if source and source.body else ""
    return f"{request_text}\n\n{raw}"
