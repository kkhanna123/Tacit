"""Run engine — executes the §6.3 data flow with a full audit trail of run steps."""
import uuid

from sqlmodel import Session, select

from . import compiler, providers
from .harness import (
    apply_deterministic_repairs,
    build_repair_instructions,
    run_output_validators,
    run_preflight,
    summarize,
)
from .models import (
    AuditEvent,
    Learning,
    OutputArtifact,
    Run,
    RunStep,
    Skill,
    SkillVersion,
)
from .tokens import estimate_cost, estimate_tokens


def _id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


def _step(session: Session, run_id: str, seq: int, step_type: str,
          input_json: dict, output_json: dict, status: str = "ok", latency_ms: int = 0) -> None:
    session.add(RunStep(
        id=_id("step"), run_id=run_id, seq=seq, step_type=step_type,
        input_json=input_json, output_json=output_json, status=status, latency_ms=latency_ms,
    ))


def _audit(session: Session, org_id: str, actor: str, action: str,
           object_type: str, object_id: str, after=None) -> None:
    session.add(AuditEvent(
        id=_id("audit"), org_id=org_id, actor_user_id=actor, action=action,
        object_type=object_type, object_id=object_id, after_json=after,
    ))


def _default_validators() -> list[dict]:
    return [
        {"type": "no_empty_output", "min_words": 20},
        {"type": "context_budget", "max_prompt_tokens": 1500},
    ]


def execute_baseline(session: Session, org_id: str, project_id: str, user_id: str,
                     request_text: str, provider: str) -> Run:
    """What the user does today: vague ask + raw docs pasted in, judged against the
    same deterministic contract Enterprise Mind uses."""
    run = Run(
        id=_id("run"), org_id=org_id, project_id=project_id, user_id=user_id,
        run_mode="baseline", provider=provider, model="mock-demo-1" if provider == "mock" else provider,
        raw_user_request=request_text, status="running",
    )
    session.add(run)
    session.commit()

    prompt = compiler.compile_baseline_prompt(request_text, session, project_id)
    prompt_tokens = estimate_tokens(prompt)
    run.token_estimate_input = prompt_tokens
    run.baseline_token_estimate = prompt_tokens

    # Judge the baseline against the contract the task *should* satisfy.
    routed = compiler.route_intent(session, project_id, request_text)
    validators = _default_validators()
    if routed["matched_skill_id"]:
        skill = session.get(Skill, routed["matched_skill_id"])
        sv = session.get(SkillVersion, skill.current_version_id)
        validators = sv.validators_json

    seq = 0
    _step(session, run.id, seq := seq + 1, "context_compile",
          {"strategy": "raw paste (no compilation)"},
          {"prompt_tokens": prompt_tokens,
           "note": "User pasted the full raw notes dump under a vague request."})

    preflight = run_preflight(prompt_tokens, validators)
    _step(session, run.id, seq := seq + 1, "preflight",
          {"prompt_tokens": prompt_tokens}, {"results": preflight},
          status="ok" if all(r["status"] == "pass" for r in preflight) else "failed")

    resp = providers.call_provider(provider, prompt, "You are a helpful assistant.", "baseline")
    run.token_actual_input = resp["input_tokens"]
    run.token_actual_output = resp["output_tokens"]
    _step(session, run.id, seq := seq + 1, "provider_call",
          {"provider": resp["provider"], "model": resp["model"], "prompt_preview": prompt[:600]},
          {"output_tokens": resp["output_tokens"], "finish_reason": resp["finish_reason"]},
          latency_ms=resp["latency_ms"])

    output_results = run_output_validators(resp["text"], validators)
    all_results = preflight + output_results
    stats = summarize(all_results)
    _step(session, run.id, seq := seq + 1, "final_validate",
          {"validators": [v["type"] for v in validators]},
          {"results": all_results, "summary": stats},
          status="ok" if stats["failed"] == 0 else "failed")

    passed = stats["failed"] == 0
    session.add(OutputArtifact(
        id=_id("art"), run_id=run.id, artifact_type="markdown", content=resp["text"],
        validation_status="passed" if passed else "failed", is_final=True,
    ))

    run.status = "passed" if passed else "failed"
    run.harness_pass_count = stats["passed"]
    run.harness_fail_count = stats["failed"]
    run.cost_estimate = estimate_cost(resp["input_tokens"], resp["output_tokens"], provider)
    session.add(run)
    _audit(session, org_id, user_id, "run_executed", "run", run.id,
           {"mode": "baseline", "status": run.status})
    session.commit()
    session.refresh(run)
    return run


def execute_enterprise(session: Session, org_id: str, project_id: str, user_id: str,
                       request_text: str, provider: str) -> Run:
    run = Run(
        id=_id("run"), org_id=org_id, project_id=project_id, user_id=user_id,
        run_mode="enterprise_mind", provider=provider,
        model="mock-demo-1" if provider == "mock" else provider,
        raw_user_request=request_text, status="running",
    )
    session.add(run)
    session.commit()
    seq = 0

    # 1. Intent route
    normalized = compiler.normalize_request(request_text)
    routed = compiler.route_intent(session, project_id, request_text)
    run.normalized_intent = {**normalized, "route": routed}
    _step(session, run.id, seq := seq + 1, "intent_route",
          {"request": request_text}, {"normalized": normalized, "route": routed})

    skill_version = None
    skill = None
    if routed["matched_skill_id"]:
        skill = session.get(Skill, routed["matched_skill_id"])
        skill_version = session.get(SkillVersion, skill.current_version_id)
        run.selected_skill_version_id = skill_version.id

    # 2. Context pack (select-then-compress)
    pack = compiler.compile_context_pack(session, project_id)
    run.selected_context_pack_id = pack.id
    _step(session, run.id, seq := seq + 1, "context_compile",
          {"strategy": "select-then-compress", "intent_nodes": pack.source_intent_node_ids},
          {"pack_id": pack.id, "pack_version": pack.version,
           "token_estimate": pack.token_estimate, "manifest": pack.manifest_json})

    # 3. Compile bundle
    bundle = compiler.build_prompt_bundle(request_text, normalized, pack, skill_version, provider)
    prompt_text = compiler.bundle_text(bundle)
    prompt_tokens = estimate_tokens(prompt_text)
    run.token_estimate_input = prompt_tokens
    run.compiled_prompt_hash = compiler.bundle_hash(bundle)

    # Baseline comparison estimate: what this request would have cost raw.
    baseline_prompt = compiler.compile_baseline_prompt(request_text, session, project_id)
    run.baseline_token_estimate = estimate_tokens(baseline_prompt)

    validators = skill_version.validators_json if skill_version else _default_validators()

    # 4. Preflight
    preflight = run_preflight(prompt_tokens, validators)
    _step(session, run.id, seq := seq + 1, "preflight",
          {"prompt_tokens": prompt_tokens, "bundle_hash": run.compiled_prompt_hash,
           "bundle": bundle},
          {"results": preflight},
          status="ok" if all(r["status"] == "pass" for r in preflight) else "failed")

    # 5. Provider call
    resp = providers.call_provider(
        provider, prompt_text, bundle["system_contract"], "enterprise_mind",
        skill_slug=skill.slug if skill else None,
        version_semver=skill_version.version_semver if skill_version else None,
    )
    run.token_actual_input = resp["input_tokens"]
    run.token_actual_output = resp["output_tokens"]
    _step(session, run.id, seq := seq + 1, "provider_call",
          {"provider": resp["provider"], "model": resp["model"],
           "skill": skill.slug if skill else None,
           "skill_version": skill_version.version_semver if skill_version else None},
          {"output_tokens": resp["output_tokens"], "finish_reason": resp["finish_reason"]},
          latency_ms=resp["latency_ms"])

    # 6. Postprocess + at most ONE repair pass (heartbeat §11.5)
    output = resp["text"]
    results = run_output_validators(output, validators)
    session.add(OutputArtifact(
        id=_id("art"), run_id=run.id, artifact_type="markdown", content=output,
        validation_status="passed" if all(r["status"] == "pass" for r in results) else "failed",
        is_final=False,
    ))
    _step(session, run.id, seq := seq + 1, "postprocess",
          {"validators": [v["type"] for v in validators]},
          {"results": results, "summary": summarize(results)})

    repairs: list[str] = []
    failed = [r for r in results if r["status"] == "fail"]
    if failed:
        repaired, repairs = apply_deterministic_repairs(output, failed)
        if repairs:
            output = repaired
            results = run_output_validators(output, validators)
            run.repairs_applied = len(repairs)
        _step(session, run.id, seq := seq + 1, "repair",
              {"repair_instructions": build_repair_instructions(failed)},
              {"repairs_applied": repairs, "results_after": results,
               "summary": summarize(results)},
              status="ok" if all(r["status"] == "pass" for r in results) else "failed")

    # 7. Final validate
    all_results = preflight + results
    stats = summarize(all_results)
    _step(session, run.id, seq := seq + 1, "final_validate",
          {"validators": [v["type"] for v in validators]},
          {"results": all_results, "summary": stats},
          status="ok" if stats["failed"] == 0 else "failed")

    passed = stats["failed"] == 0
    session.add(OutputArtifact(
        id=_id("art"), run_id=run.id, artifact_type="markdown", content=output,
        validation_status=("repaired" if repairs else "passed") if passed else "failed",
        is_final=True,
    ))

    run.status = ("repaired" if repairs else "passed") if passed else "failed"
    run.harness_pass_count = stats["passed"]
    run.harness_fail_count = stats["failed"]
    run.cost_estimate = estimate_cost(resp["input_tokens"], resp["output_tokens"], provider)
    session.add(run)
    _audit(session, org_id, user_id, "run_executed", "run", run.id,
           {"mode": "enterprise_mind", "status": run.status,
            "tokens_saved": run.baseline_token_estimate - run.token_estimate_input})

    _maybe_propose_learning(session, org_id, project_id, run, skill, repairs)
    session.commit()
    session.refresh(run)
    return run


def _maybe_propose_learning(session: Session, org_id: str, project_id: str,
                            run: Run, skill, repairs: list[str]) -> None:
    """Propose (never auto-apply) a learning when the same repair repeats (§12.3)."""
    if not repairs or not skill:
        return
    title = f"Recurring repair in '{skill.name}': model output includes banned hedging phrases"
    existing = session.exec(select(Learning).where(Learning.title == title)).first()
    if existing:
        return
    repaired_runs = session.exec(
        select(Run).where(Run.project_id == project_id,
                          Run.run_mode == "enterprise_mind",
                          Run.repairs_applied > 0)
    ).all()
    if len(repaired_runs) < 2:
        return
    session.add(Learning(
        id=_id("learning"), org_id=org_id, project_id=project_id,
        source_run_ids=[r.id for r in repaired_runs][-4:],
        learning_type="prompt_patch",
        title=title,
        body=("The deterministic repair pass removed a forbidden hedging phrase in "
              f"{len(repaired_runs)} runs of this skill. Proposal: patch the skill's system "
              "instructions to prohibit hedging openers explicitly, so outputs pass without repair."),
        evidence_json={"occurrences": len(repaired_runs),
                       "repairs": repairs,
                       "proposed_change": {"system_instructions": "append: Never open a bullet with hedging phrases such as 'It is important to note'."}},
        confidence=0.7,
        proposed_by="system",
        status="proposed",
    ))
