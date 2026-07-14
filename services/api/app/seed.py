"""Idempotent demo workspace seeder — loads demo_data/ into the object ledger."""
import hashlib
import json
import os

import yaml
from sqlmodel import Session, select

from .models import (
    AuditEvent,
    Harness,
    HarnessCase,
    IntentNode,
    Learning,
    Org,
    OrgMembership,
    Project,
    Skill,
    SkillInstall,
    SkillVersion,
    User,
)

DEMO_DATA_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "demo_data",
)


def _load(name: str):
    with open(os.path.join(DEMO_DATA_DIR, name)) as f:
        return json.load(f)


def _manifest_yaml(skill: dict, version: dict) -> str:
    return yaml.safe_dump({
        "name": skill["name"],
        "slug": skill["slug"],
        "version": version["version_semver"],
        "owner": skill["owner_label"],
        "description": skill["description"],
        "intended_users": ["analysts", "partners"],
        "intended_tasks": ["repeatable client-facing output generation"],
        "forbidden_tasks": ["raw data-room exports", "legal advice"],
        "required_inputs": version.get("input_schema_json", {}).get("required", []),
        "output_type": version.get("output_schema_json", {}).get("artifact_type", "markdown"),
        "token_budget": version.get("token_budget", 700),
        "compatible_providers": version.get("compatible_providers", ["mock"]),
        "default_model_policy": "org_default",
        "permission_scope": skill.get("visibility", "org"),
        "validators": [v["type"] for v in version.get("validators_json", [])],
        "changelog": version.get("release_notes", ""),
    }, sort_keys=False)


def _skill_md(skill: dict, version: dict) -> str:
    schema = version.get("output_schema_json", {})
    sections = schema.get("required_sections", [])
    good = [e for e in version.get("examples_json", []) if e.get("kind") == "good"]
    bad = [e for e in version.get("examples_json", []) if e.get("kind") == "bad"]
    lines = [
        f"# {skill['name']}",
        "",
        "## When to use",
        f"{skill['description']}",
        "",
        "## When not to use",
        "- Raw data-room exports, legal opinions, or anything outside the output contract.",
        "",
        "## Required inputs",
        *[f"- {r}" for r in version.get("input_schema_json", {}).get("required", ["user_request"])],
        "",
        "## Output contract",
        *[f"- Section: {s}" for s in sections],
        f"- Max {schema.get('max_bullets_per_section', 4)} bullets per section, {schema.get('max_words', 450)} words total.",
        "",
        "## Rails",
        *[f"- {r}" for r in version.get("rails_json", [])],
        "",
        "## Good example",
        *[f"> {e['text']}" for e in good],
        "",
        "## Bad example",
        *[f"> {e['text']}" for e in bad],
        "",
        "## Common failures and repair rules",
        "- Hedging/hype phrases: removed deterministically by the repair pass.",
        "- Missing sections: repair prompt lists exact missing headings; one repair pass max.",
    ]
    return "\n".join(lines)


def seed(session: Session) -> None:
    if session.exec(select(Org)).first():
        return

    ws = _load("workspace.json")
    session.add(Org(**ws["org"]))
    for u in ws["users"]:
        session.add(User(**u))
    for m in ws["memberships"]:
        session.add(OrgMembership(**m))
    for p in ws["projects"]:
        session.add(Project(**p))

    for node in _load("intent_nodes.json"):
        body_file = node.pop("body_file", None)
        if body_file:
            with open(os.path.join(DEMO_DATA_DIR, body_file)) as f:
                node["body"] = f.read()
        session.add(IntentNode(**node))

    for s in _load("skills.json"):
        versions = s.pop("versions")
        installs = s.pop("installs", [])
        skill = Skill(**s)
        session.add(skill)
        last_version_id = None
        for v in versions:
            v["manifest_yaml"] = _manifest_yaml(s, v)
            v["skill_md"] = _skill_md(s, v)
            v["checksum"] = hashlib.sha256(
                (v["manifest_yaml"] + v["system_instructions"]).encode()
            ).hexdigest()[:16]
            sv = SkillVersion(skill_id=skill.id, **v)
            session.add(sv)
            last_version_id = sv.id
        skill.current_version_id = last_version_id
        for i, project_id in enumerate(installs):
            session.add(SkillInstall(
                id=f"install_{skill.id}_{i}", skill_id=skill.id,
                project_id=project_id, installed_by=s.get("owner_user_id", ""),
            ))

    for h in _load("harnesses.json"):
        cases = h.pop("cases", [])
        session.add(Harness(**h))
        for c in cases:
            session.add(HarnessCase(harness_id=h["id"], **c))

    for l in _load("learnings.json"):
        session.add(Learning(**l))

    session.add(AuditEvent(
        id="audit_seed", org_id=ws["org"]["id"], actor_user_id="system",
        action="workspace_seeded", object_type="org", object_id=ws["org"]["id"],
        after_json={"source": "demo_data/"},
    ))
    session.commit()
