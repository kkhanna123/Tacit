"""Deterministic harness engine.

Every validator is a pure function: (output_text, config) -> result dict.
No LLM judging in the pass/fail path.
"""
import re
from typing import Optional

from .tokens import estimate_tokens


def _result(vtype: str, label: str, status: str, details: str, evidence=None) -> dict:
    return {
        "validator": vtype,
        "label": label,
        "status": status,  # pass | fail
        "details": details,
        "evidence": evidence or [],
    }


def _find_sections(text: str) -> list[str]:
    sections = []
    for line in text.splitlines():
        m = re.match(r"^\s{0,3}#{1,6}\s+(.+?)\s*$", line)
        if m:
            sections.append(m.group(1).strip())
            continue
        m = re.match(r"^\s*\*\*(.+?)\*\*\s*$", line)
        if m:
            sections.append(m.group(1).strip().rstrip(":"))
    return sections


def validate_markdown_sections(text: str, cfg: dict) -> dict:
    required = cfg.get("required_sections", [])
    found = [s.lower() for s in _find_sections(text)]
    missing = [s for s in required if not any(s.lower() in f for f in found)]
    if missing:
        return _result(
            "markdown_sections", "Required sections", "fail",
            f"Missing {len(missing)} of {len(required)} required sections.",
            [f"Missing: {s}" for s in missing],
        )
    return _result(
        "markdown_sections", "Required sections", "pass",
        f"All {len(required)} required sections present.",
    )


def validate_forbidden_phrases(text: str, cfg: dict) -> dict:
    phrases = cfg.get("phrases", [])
    lowered = text.lower()
    hits = []
    for p in phrases:
        count = lowered.count(p.lower())
        if count:
            hits.append(f'"{p}" ×{count}')
    if hits:
        return _result(
            "forbidden_phrases", "Forbidden phrases", "fail",
            f"{len(hits)} banned phrase(s) found.", hits,
        )
    return _result("forbidden_phrases", "Forbidden phrases", "pass", "0 banned phrases found.")


def validate_length(text: str, cfg: dict) -> dict:
    max_words = cfg.get("max_words")
    max_bullets = cfg.get("max_bullets_per_section")
    words = len(text.split())
    problems, evidence = [], []
    if max_words and words > max_words:
        problems.append(f"{words} words > limit of {max_words}")
    if max_bullets:
        section, counts = None, {}
        for line in text.splitlines():
            if re.match(r"^\s{0,3}#{1,6}\s+", line) or re.match(r"^\s*\*\*(.+?)\*\*\s*$", line):
                section = line.strip("# *").rstrip(":")
                counts[section] = 0
            elif re.match(r"^\s*[-*•]\s+", line) and section:
                counts[section] += 1
        over = {s: c for s, c in counts.items() if c > max_bullets}
        for s, c in over.items():
            problems.append(f'"{s}" has {c} bullets > limit of {max_bullets}')
    if problems:
        return _result("length", "Length limits", "fail", "; ".join(problems), evidence)
    return _result("length", "Length limits", "pass", f"{words} words, within limits.")


def validate_required_concepts(text: str, cfg: dict) -> dict:
    concepts = cfg.get("concepts", [])
    lowered = text.lower()
    missing = [c for c in concepts if c.lower() not in lowered]
    if missing:
        return _result(
            "required_concepts", "Required concepts", "fail",
            "Output never addresses required concept(s).",
            [f"Missing: {c}" for c in missing],
        )
    return _result(
        "required_concepts", "Required concepts", "pass",
        f"All {len(concepts)} required concepts addressed.",
    )


def validate_no_empty_output(text: str, cfg: dict) -> dict:
    min_words = cfg.get("min_words", 20)
    if len(text.split()) < min_words:
        return _result("no_empty_output", "Non-empty output", "fail",
                       f"Output under {min_words} words.")
    return _result("no_empty_output", "Non-empty output", "pass", "Output is substantive.")


def validate_context_budget(prompt_tokens: int, cfg: dict) -> dict:
    limit = cfg.get("max_prompt_tokens", 3000)
    if prompt_tokens > limit:
        return _result(
            "context_budget", "Context budget", "fail",
            f"Compiled prompt is {prompt_tokens:,} tokens > budget of {limit:,}.",
            ["User pasted full raw documents instead of a compiled context pack."],
        )
    return _result(
        "context_budget", "Context budget", "pass",
        f"Compiled prompt is {prompt_tokens:,} tokens, within budget of {limit:,}.",
    )


OUTPUT_VALIDATORS = {
    "markdown_sections": validate_markdown_sections,
    "forbidden_phrases": validate_forbidden_phrases,
    "length": validate_length,
    "required_concepts": validate_required_concepts,
    "no_empty_output": validate_no_empty_output,
}


def run_output_validators(text: str, validator_configs: list[dict]) -> list[dict]:
    results = []
    for cfg in validator_configs:
        vtype = cfg.get("type")
        fn = OUTPUT_VALIDATORS.get(vtype)
        if fn:
            results.append(fn(text, cfg))
    return results


def run_preflight(prompt_tokens: int, validator_configs: list[dict]) -> list[dict]:
    results = []
    for cfg in validator_configs:
        if cfg.get("type") == "context_budget":
            results.append(validate_context_budget(prompt_tokens, cfg))
    return results


def summarize(results: list[dict]) -> dict:
    passed = sum(1 for r in results if r["status"] == "pass")
    return {"passed": passed, "failed": len(results) - passed, "total": len(results)}


def build_repair_instructions(failed: list[dict]) -> str:
    """Deterministic repair prompt: exact corrections, no new facts."""
    lines = ["The previous output failed deterministic validators. Fix ONLY these issues:"]
    for r in failed:
        lines.append(f"- [{r['validator']}] {r['details']}")
        for e in r.get("evidence", []):
            lines.append(f"    - {e}")
    lines.append("Do not add new facts or sources. Preserve all valid content.")
    return "\n".join(lines)


def apply_deterministic_repairs(text: str, results: list[dict]) -> tuple[str, list[str]]:
    """Safe, rule-based edits only (V1 allows one repair pass)."""
    repairs: list[str] = []
    repaired = text
    for r in results:
        if r["validator"] == "forbidden_phrases" and r["status"] == "fail":
            for ev in r.get("evidence", []):
                m = re.match(r'"(.+?)"', ev)
                if not m:
                    continue
                phrase = m.group(1)
                pattern = re.compile(re.escape(phrase) + r"[,:]?\s*(that\s+)?", re.IGNORECASE)
                if pattern.search(repaired):
                    repaired = pattern.sub("", repaired)
                    repairs.append(f'Removed forbidden phrase "{phrase}"')
    # Tidy double spaces / capitalize bullet starts broken by removal.
    repaired = re.sub(r"  +", " ", repaired)
    repaired = re.sub(
        r"^(\s*[-*]\s+)([a-z])",
        lambda m: m.group(1) + m.group(2).upper(),
        repaired, flags=re.MULTILINE,
    )
    return repaired, repairs
