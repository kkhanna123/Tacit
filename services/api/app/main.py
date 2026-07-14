"""Enterprise Mind V1 API — FastAPI backend for the demo web app."""
import uuid
from collections import Counter
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import Session, select

from . import compiler, runner
from .db import get_session, init_db
from .harness import run_output_validators, summarize
from .models import (
    AuditEvent,
    ContextPack,
    Harness,
    HarnessCase,
    IntentNode,
    Learning,
    Org,
    OrgMembership,
    OutputArtifact,
    Project,
    Run,
    RunStep,
    Skill,
    SkillInstall,
    SkillVersion,
    User,
)
from .providers import pick_mock_output
from .seed import seed

app = FastAPI(title="Enterprise Mind V1", version="0.1.0")

# Local dev origins + any comma-separated EM_CORS_ORIGINS, plus Vercel
# deployment/preview domains so the deployed web app works without extra config.
import os as _os

_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
_origins += [o.strip() for o in _os.environ.get("EM_CORS_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)

DEMO_USER_ID = "user_marcus"
DEMO_ORG_ID = "org_northstar"


@app.on_event("startup")
def on_startup():
    init_db()
    from .db import engine
    with Session(engine) as session:
        seed(session)


def _id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


def _audit(session: Session, action: str, object_type: str, object_id: str,
           after=None, actor: str = DEMO_USER_ID) -> None:
    session.add(AuditEvent(
        id=_id("audit"), org_id=DEMO_ORG_ID, actor_user_id=actor, action=action,
        object_type=object_type, object_id=object_id, after_json=after,
    ))


# ---------------------------------------------------------------- auth / org

@app.get("/me")
def me(session: Session = Depends(get_session)):
    user = session.get(User, DEMO_USER_ID)
    org = session.get(Org, DEMO_ORG_ID)
    membership = session.exec(
        select(OrgMembership).where(OrgMembership.user_id == DEMO_USER_ID)
    ).first()
    return {"user": user, "org": org, "role": membership.role if membership else "user"}


@app.get("/orgs")
def orgs(session: Session = Depends(get_session)):
    return session.exec(select(Org)).all()


# ------------------------------------------------------------------ projects

class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    department: str = ""


@app.get("/projects")
def list_projects(session: Session = Depends(get_session)):
    projects = session.exec(select(Project)).all()
    out = []
    for p in projects:
        installs = session.exec(select(SkillInstall).where(SkillInstall.project_id == p.id)).all()
        runs = session.exec(select(Run).where(Run.project_id == p.id)).all()
        out.append({**p.model_dump(), "installed_skills": len(installs), "run_count": len(runs)})
    return out


@app.post("/projects")
def create_project(body: ProjectCreate, session: Session = Depends(get_session)):
    project = Project(id=_id("proj"), org_id=DEMO_ORG_ID, created_by=DEMO_USER_ID,
                      **body.model_dump())
    session.add(project)
    _audit(session, "project_created", "project", project.id, {"name": project.name})
    session.commit()
    session.refresh(project)
    return project


@app.get("/projects/{project_id}")
def get_project(project_id: str, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(404, "project not found")
    return project


# --------------------------------------------------------------- intent tree

class IntentNodeUpsert(BaseModel):
    title: Optional[str] = None
    node_type: Optional[str] = None
    summary: Optional[str] = None
    body: Optional[str] = None
    canonical_context: Optional[list] = None
    constraints: Optional[dict] = None
    output_preferences: Optional[list] = None
    token_budget: Optional[int] = None
    visibility: Optional[str] = None
    tags: Optional[list] = None
    parent_id: Optional[str] = None


@app.get("/projects/{project_id}/intent-nodes")
def list_intent_nodes(project_id: str, session: Session = Depends(get_session)):
    nodes = compiler.intent_path_nodes(session, project_id)
    return [
        {**n.model_dump(exclude={"body"}),
         "has_body": bool(n.body),
         "body_preview": (n.body[:400] + "…") if len(n.body or "") > 400 else (n.body or ""),
         "card": compiler.node_context_card(n),
         "card_tokens": compiler.estimate_tokens(compiler.node_context_card(n))}
        for n in nodes
    ]


@app.post("/projects/{project_id}/intent-nodes")
def create_intent_node(project_id: str, body: IntentNodeUpsert,
                       session: Session = Depends(get_session)):
    node = IntentNode(
        id=_id("node"), org_id=DEMO_ORG_ID, project_id=project_id,
        node_type=body.node_type or "task", title=body.title or "Untitled node",
        summary=body.summary or "", body=body.body or "",
        canonical_context=body.canonical_context or [],
        constraints=body.constraints or {}, tags=body.tags or [],
        token_budget=body.token_budget or 200, parent_id=body.parent_id,
    )
    session.add(node)
    _audit(session, "context_node_created", "intent_node", node.id, {"title": node.title})
    session.commit()
    session.refresh(node)
    return node


@app.patch("/intent-nodes/{node_id}")
def update_intent_node(node_id: str, body: IntentNodeUpsert,
                       session: Session = Depends(get_session)):
    node = session.get(IntentNode, node_id)
    if not node:
        raise HTTPException(404, "node not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(node, field, value)
    node.version += 1
    session.add(node)
    _audit(session, "context_node_edited", "intent_node", node.id,
           {"version": node.version})
    session.commit()
    session.refresh(node)
    return node


@app.delete("/intent-nodes/{node_id}")
def delete_intent_node(node_id: str, session: Session = Depends(get_session)):
    node = session.get(IntentNode, node_id)
    if not node:
        raise HTTPException(404, "node not found")
    node.status = "archived"
    session.add(node)
    _audit(session, "context_node_archived", "intent_node", node.id)
    session.commit()
    return {"ok": True}


@app.post("/projects/{project_id}/compile-context-pack")
def compile_pack(project_id: str, session: Session = Depends(get_session)):
    pack = compiler.compile_context_pack(session, project_id)
    return pack


# -------------------------------------------------------------------- skills

def _skill_metrics(session: Session, skill: Skill) -> dict:
    version_ids = [v.id for v in session.exec(
        select(SkillVersion).where(SkillVersion.skill_id == skill.id)).all()]
    runs = session.exec(select(Run).where(
        Run.selected_skill_version_id.in_(version_ids))).all() if version_ids else []  # type: ignore[union-attr]
    passed = [r for r in runs if r.status in ("passed", "repaired")]
    savings = [
        1 - (r.token_estimate_input / r.baseline_token_estimate)
        for r in runs if r.baseline_token_estimate
    ]
    installs = session.exec(select(SkillInstall).where(SkillInstall.skill_id == skill.id)).all()
    return {
        "runs": len(runs),
        "pass_rate": round(len(passed) / len(runs), 2) if runs else None,
        "avg_token_savings_pct": round(100 * sum(savings) / len(savings)) if savings else None,
        "installs": [i.project_id for i in installs],
    }


@app.get("/skills")
def list_skills(session: Session = Depends(get_session)):
    skills = session.exec(select(Skill)).all()
    out = []
    for s in skills:
        current = session.get(SkillVersion, s.current_version_id) if s.current_version_id else None
        out.append({
            **s.model_dump(),
            "current_version": current.version_semver if current else None,
            "token_budget": current.token_budget if current else None,
            "metrics": _skill_metrics(session, s),
        })
    return out


@app.get("/skills/{skill_id}")
def get_skill(skill_id: str, session: Session = Depends(get_session)):
    skill = session.get(Skill, skill_id)
    if not skill:
        raise HTTPException(404, "skill not found")
    versions = session.exec(
        select(SkillVersion).where(SkillVersion.skill_id == skill_id)
        .order_by(SkillVersion.created_at.desc())
    ).all()
    harness = session.exec(select(Harness).where(Harness.skill_id == skill_id)).first()
    cases = session.exec(
        select(HarnessCase).where(HarnessCase.harness_id == harness.id)
    ).all() if harness else []
    return {
        **skill.model_dump(),
        "metrics": _skill_metrics(session, skill),
        "versions": versions,
        "harness": harness,
        "harness_cases": cases,
    }


class InstallBody(BaseModel):
    project_id: str


@app.post("/skills/{skill_id}/install")
def install_skill(skill_id: str, body: InstallBody, session: Session = Depends(get_session)):
    skill = session.get(Skill, skill_id)
    if not skill:
        raise HTTPException(404, "skill not found")
    if skill.status != "approved":
        raise HTTPException(400, "Only org-approved skills can be installed into a project.")
    existing = session.exec(select(SkillInstall).where(
        SkillInstall.skill_id == skill_id, SkillInstall.project_id == body.project_id)).first()
    if existing:
        return {"ok": True, "already_installed": True}
    install = SkillInstall(id=_id("install"), skill_id=skill_id,
                           project_id=body.project_id, installed_by=DEMO_USER_ID)
    session.add(install)
    _audit(session, "skill_installed", "skill", skill_id,
           {"project_id": body.project_id,
            "note": "Structure, validators, and rails transfer — no source project content."})
    session.commit()
    return {"ok": True, "already_installed": False}


# ----------------------------------------------------------------- harnesses

class HarnessRunBody(BaseModel):
    output_text: Optional[str] = None


@app.get("/harnesses")
def list_harnesses(session: Session = Depends(get_session)):
    harnesses = session.exec(select(Harness)).all()
    out = []
    for h in harnesses:
        cases = session.exec(select(HarnessCase).where(HarnessCase.harness_id == h.id)).all()
        out.append({**h.model_dump(), "cases": cases})
    return out


@app.post("/harnesses/{harness_id}/run")
def run_harness(harness_id: str, body: HarnessRunBody, session: Session = Depends(get_session)):
    harness = session.get(Harness, harness_id)
    if not harness:
        raise HTTPException(404, "harness not found")
    text = body.output_text
    if not text and harness.skill_id:
        skill = session.get(Skill, harness.skill_id)
        current = session.get(SkillVersion, skill.current_version_id)
        text = pick_mock_output("enterprise_mind", skill.slug, current.version_semver)
    validators = harness.config_json.get("validators", [])
    results = run_output_validators(text or "", validators)
    return {"harness_id": harness_id, "results": results, "summary": summarize(results)}


# ------------------------------------------------------------------- preview

@app.get("/preview")
def preview(project_id: str, request: str = "", session: Session = Depends(get_session)):
    """What a run *would* use: route, skill, pack size — without executing."""
    routed = compiler.route_intent(session, project_id, request or "client ready memo bullets")
    pack = compiler.compile_context_pack(session, project_id, persist=False)
    skill_name, skill_version = None, None
    if routed["matched_skill_id"]:
        skill = session.get(Skill, routed["matched_skill_id"])
        sv = session.get(SkillVersion, skill.current_version_id)
        skill_name, skill_version = skill.name, sv.version_semver
    source = session.exec(select(IntentNode).where(
        IntentNode.project_id == project_id, IntentNode.node_type == "source")).first()
    baseline_estimate = compiler.estimate_tokens(
        (request or "") + "\n\n" + (source.body if source else ""))
    return {
        "route": routed,
        "skill_name": skill_name,
        "skill_version": skill_version,
        "context_pack_tokens": pack.token_estimate,
        "baseline_estimate": baseline_estimate,
    }


# ---------------------------------------------------------------------- runs

class RunCreate(BaseModel):
    project_id: str
    request: str
    provider: str = "mock"


@app.post("/runs/baseline")
def run_baseline(body: RunCreate, session: Session = Depends(get_session)):
    try:
        run = runner.execute_baseline(session, DEMO_ORG_ID, body.project_id,
                                      DEMO_USER_ID, body.request, body.provider)
    except RuntimeError as e:
        raise HTTPException(400, str(e))
    return get_run(run.id, session)


@app.post("/runs/enterprise-mind")
def run_enterprise(body: RunCreate, session: Session = Depends(get_session)):
    try:
        run = runner.execute_enterprise(session, DEMO_ORG_ID, body.project_id,
                                        DEMO_USER_ID, body.request, body.provider)
    except RuntimeError as e:
        raise HTTPException(400, str(e))
    return get_run(run.id, session)


@app.get("/runs")
def list_runs(project_id: Optional[str] = None, session: Session = Depends(get_session)):
    q = select(Run).order_by(Run.created_at.desc())
    if project_id:
        q = q.where(Run.project_id == project_id)
    runs = session.exec(q).all()
    out = []
    for r in runs:
        project = session.get(Project, r.project_id)
        user = session.get(User, r.user_id)
        sv = session.get(SkillVersion, r.selected_skill_version_id) if r.selected_skill_version_id else None
        skill = session.get(Skill, sv.skill_id) if sv else None
        out.append({
            **r.model_dump(),
            "project_name": project.name if project else None,
            "user_name": user.name if user else None,
            "skill_name": skill.name if skill else None,
            "skill_version": sv.version_semver if sv else None,
            "tokens_saved": (r.baseline_token_estimate - r.token_estimate_input)
                            if (r.run_mode == "enterprise_mind" and r.baseline_token_estimate) else 0,
        })
    return out


@app.get("/runs/{run_id}")
def get_run(run_id: str, session: Session = Depends(get_session)):
    run = session.get(Run, run_id)
    if not run:
        raise HTTPException(404, "run not found")
    steps = session.exec(
        select(RunStep).where(RunStep.run_id == run_id).order_by(RunStep.seq)
    ).all()
    artifacts = session.exec(
        select(OutputArtifact).where(OutputArtifact.run_id == run_id)
        .order_by(OutputArtifact.created_at)
    ).all()
    sv = session.get(SkillVersion, run.selected_skill_version_id) if run.selected_skill_version_id else None
    skill = session.get(Skill, sv.skill_id) if sv else None
    pack = session.get(ContextPack, run.selected_context_pack_id) if run.selected_context_pack_id else None
    project = session.get(Project, run.project_id)
    final = next((a for a in reversed(artifacts) if a.is_final), None)
    bundle = next((s.input_json.get("bundle") for s in steps
                   if s.step_type == "preflight" and s.input_json.get("bundle")), None)
    return {
        "run": run,
        "project_name": project.name if project else None,
        "steps": steps,
        "artifacts": artifacts,
        "final_output": final.content if final else None,
        "final_status": final.validation_status if final else None,
        "skill": {"id": skill.id, "name": skill.name, "slug": skill.slug,
                  "version": sv.version_semver} if skill else None,
        "context_pack": pack,
        "prompt_bundle": bundle,
        "tokens_saved": (run.baseline_token_estimate - run.token_estimate_input)
                        if (run.run_mode == "enterprise_mind" and run.baseline_token_estimate) else 0,
    }


@app.post("/runs/{run_id}/accept-output")
def accept_output(run_id: str, session: Session = Depends(get_session)):
    run = session.get(Run, run_id)
    if not run:
        raise HTTPException(404, "run not found")
    _audit(session, "output_accepted", "run", run_id)
    session.commit()
    return {"ok": True}


# ----------------------------------------------------------------- learnings

class LearningDecision(BaseModel):
    approved_by: str = "user_priya"


def _promote_learning(session: Session, learning: Learning) -> dict:
    """Apply an approved learning to the object it targets. Versioned, audited."""
    if learning.learning_type == "skill_update":
        change = learning.evidence_json.get("proposed_change", {})
        slug = learning.evidence_json.get("affected_skill")
        skill = session.exec(select(Skill).where(Skill.slug == slug)).first()
        if not skill:
            return {"applied": False, "reason": "target skill not found"}
        current = session.get(SkillVersion, skill.current_version_id)
        major, minor, _ = (current.version_semver.split(".") + ["0", "0"])[:3]
        new_semver = f"{major}.{int(minor) + 1}.0"

        new_schema = dict(current.output_schema_json)
        new_validators = [dict(v) for v in current.validators_json]
        section = "Open Questions"
        new_schema["required_sections"] = list(new_schema.get("required_sections", [])) + [section]
        for v in new_validators:
            if v["type"] == "markdown_sections":
                v["required_sections"] = list(v["required_sections"]) + [section]
            if v["type"] == "length":
                v["max_words"] = v.get("max_words", 450) + 80  # room for the new section

        new_version = SkillVersion(
            id=_id("sv"), skill_id=skill.id, version_semver=new_semver,
            manifest_yaml=current.manifest_yaml.replace(current.version_semver, new_semver),
            skill_md=current.skill_md + f"\n\n## Changelog {new_semver}\n- Added required section: {section} (promoted from learning {learning.id}).",
            system_instructions=current.system_instructions.replace(
                "Thesis, Evidence, Risks, Source Limitations, Next Steps",
                "Thesis, Evidence, Risks, Source Limitations, Open Questions, Next Steps",
            ),
            input_schema_json=current.input_schema_json,
            output_schema_json=new_schema,
            examples_json=current.examples_json,
            validators_json=new_validators,
            rails_json=current.rails_json,
            token_budget=current.token_budget,
            compatible_providers=current.compatible_providers,
            release_notes=f"Promoted learning: {learning.title}",
            approved_by=learning.approved_by,
        )
        session.add(new_version)
        skill.current_version_id = new_version.id
        session.add(skill)

        harness = session.exec(select(Harness).where(Harness.skill_id == skill.id)).first()
        if harness:
            cfg = dict(harness.config_json)
            cfg["validators"] = new_validators
            harness.config_json = cfg
            session.add(harness)
        return {"applied": True, "skill": skill.slug, "new_version": new_semver,
                "change": change}

    if learning.learning_type == "new_rail":
        rail = learning.evidence_json.get("proposed_change", {}).get("rail")
        node = session.exec(select(IntentNode).where(IntentNode.node_type == "org")).first()
        if node and rail:
            constraints = dict(node.constraints or {})
            constraints["must"] = list(constraints.get("must", [])) + [rail.replace("MUST: ", "")]
            node.constraints = constraints
            node.version += 1
            session.add(node)
            return {"applied": True, "target": node.title, "rail": rail}

    if learning.learning_type == "prompt_patch":
        change = learning.evidence_json.get("proposed_change", {})
        append = change.get("system_instructions", "").replace("append: ", "")
        # Patch every skill whose runs evidenced the failure; here: memo skill.
        skill = session.exec(select(Skill).where(Skill.slug == "investment-memo-bullets")).first()
        if skill and append:
            current = session.get(SkillVersion, skill.current_version_id)
            current.system_instructions = current.system_instructions + " " + append
            session.add(current)
            return {"applied": True, "skill": skill.slug, "patch": append}

    return {"applied": False, "reason": "no promotion handler for this learning type"}


@app.get("/learnings")
def list_learnings(session: Session = Depends(get_session)):
    return session.exec(select(Learning).order_by(Learning.created_at.desc())).all()


@app.post("/learnings/{learning_id}/approve")
def approve_learning(learning_id: str, body: LearningDecision,
                     session: Session = Depends(get_session)):
    learning = session.get(Learning, learning_id)
    if not learning:
        raise HTTPException(404, "learning not found")
    if learning.status != "proposed":
        raise HTTPException(400, f"learning is already {learning.status}")
    learning.status = "approved"
    learning.approved_by = body.approved_by
    result = _promote_learning(session, learning)
    session.add(learning)
    _audit(session, "learning_approved", "learning", learning.id, result,
           actor=body.approved_by)
    session.commit()
    return {"learning": learning, "promotion": result}


@app.post("/learnings/{learning_id}/reject")
def reject_learning(learning_id: str, body: LearningDecision,
                    session: Session = Depends(get_session)):
    learning = session.get(Learning, learning_id)
    if not learning:
        raise HTTPException(404, "learning not found")
    learning.status = "rejected"
    session.add(learning)
    _audit(session, "learning_rejected", "learning", learning.id, actor=body.approved_by)
    session.commit()
    return learning


# --------------------------------------------------------------------- admin

@app.get("/admin/metrics")
def admin_metrics(session: Session = Depends(get_session)):
    runs = session.exec(select(Run)).all()
    em_runs = [r for r in runs if r.run_mode == "enterprise_mind"]
    finished = [r for r in runs if r.status in ("passed", "failed", "repaired")]
    passed = [r for r in finished if r.status in ("passed", "repaired")]
    tokens_saved = sum(
        max(0, r.baseline_token_estimate - r.token_estimate_input) for r in em_runs)

    failure_counter: Counter = Counter()
    steps = session.exec(select(RunStep).where(RunStep.step_type == "final_validate")).all()
    for s in steps:
        for res in s.output_json.get("results", []):
            if res.get("status") == "fail":
                failure_counter[res.get("label", res.get("validator"))] += 1

    skills = session.exec(select(Skill)).all()
    skill_rows = []
    for s in skills:
        m = _skill_metrics(session, s)
        skill_rows.append({"id": s.id, "name": s.name, "status": s.status,
                           "owner": s.owner_label, **m})

    learnings = session.exec(select(Learning)).all()
    users = session.exec(select(User)).all()
    memberships = {m.user_id: m.role for m in session.exec(select(OrgMembership)).all()}
    projects = session.exec(select(Project)).all()
    packs = session.exec(select(ContextPack)).all()
    pack_reuse = sum(1 for r in em_runs if r.selected_context_pack_id)

    return {
        "usage": {
            "total_runs": len(runs),
            "enterprise_runs": len(em_runs),
            "baseline_runs": len(runs) - len(em_runs),
            "total_input_tokens": sum(r.token_actual_input for r in runs),
            "total_output_tokens": sum(r.token_actual_output for r in runs),
            "tokens_saved_vs_baseline": tokens_saved,
            "cost_estimate": round(sum(r.cost_estimate for r in runs), 4),
        },
        "quality": {
            "pass_rate": round(len(passed) / len(finished), 2) if finished else None,
            "repair_rate": round(
                sum(1 for r in finished if r.repairs_applied > 0) / len(finished), 2)
                if finished else None,
            "common_failures": [{"label": k, "count": v}
                                for k, v in failure_counter.most_common(6)],
        },
        "skills": skill_rows,
        "learnings": {
            "proposed": sum(1 for l in learnings if l.status == "proposed"),
            "approved": sum(1 for l in learnings if l.status == "approved"),
            "rejected": sum(1 for l in learnings if l.status == "rejected"),
        },
        "access": {
            "users": [{"id": u.id, "name": u.name, "email": u.email,
                       "role": memberships.get(u.id, "user")} for u in users],
            "projects": [{"id": p.id, "name": p.name, "department": p.department}
                         for p in projects],
        },
        "context_packs": {"total": len(packs), "runs_reusing_packs": pack_reuse},
    }


@app.get("/admin/audit-events")
def audit_events(session: Session = Depends(get_session)):
    return session.exec(
        select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(100)
    ).all()
