"""Provider adapters. All providers return the same normalized response object.

Mock is the default — deterministic outputs, zero spend (heartbeat §14, §22.11).
Anthropic/OpenAI adapters activate when API keys are present in the environment.
"""
import json
import os
import urllib.request

from .tokens import estimate_tokens

DEMO_DATA_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "demo_data",
)

with open(os.path.join(DEMO_DATA_DIR, "mock_outputs.json")) as f:
    MOCK_OUTPUTS = json.load(f)


def _response(provider: str, model: str, text: str, input_tokens: int,
              output_tokens: int, latency_ms: int, raw=None) -> dict:
    return {
        "provider": provider,
        "model": model,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "latency_ms": latency_ms,
        "raw_response": raw or {},
        "text": text,
        "tool_calls": [],
        "finish_reason": "stop",
    }


def _semver_at_least(semver: str, major: int, minor: int) -> bool:
    try:
        parts = [int(p) for p in semver.split(".")[:2]]
        return (parts[0], parts[1]) >= (major, minor)
    except (ValueError, IndexError):
        return False


def pick_mock_output(run_mode: str, skill_slug, version_semver) -> str:
    if run_mode == "baseline":
        return MOCK_OUTPUTS["baseline_memo"]
    if skill_slug == "investment-memo-bullets":
        if version_semver and _semver_at_least(version_semver, 1, 1):
            return MOCK_OUTPUTS["memo_v1_1"]
        return MOCK_OUTPUTS["memo_v1"]
    if skill_slug == "board-update-condenser":
        return MOCK_OUTPUTS["board_update"]
    return MOCK_OUTPUTS["generic"]


def call_mock(prompt_text: str, run_mode: str, skill_slug=None, version_semver=None) -> dict:
    text = pick_mock_output(run_mode, skill_slug, version_semver)
    input_tokens = estimate_tokens(prompt_text)
    # Deterministic pseudo-latency so run logs look real but repeatable.
    latency = 400 + (len(prompt_text) % 300)
    return _response("mock", "mock-demo-1", text, input_tokens, estimate_tokens(text), latency)


def call_anthropic(prompt_text: str, system: str, model: str = "claude-sonnet-5") -> dict:
    api_key = os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("EM_ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("No ANTHROPIC_API_KEY set. Use the mock provider, or export a key (BYO key mode).")
    body = json.dumps({
        "model": model,
        "max_tokens": 1500,
        "system": system,
        "messages": [{"role": "user", "content": prompt_text}],
    }).encode()
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=body,
        headers={"x-api-key": api_key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read())
    text = "".join(b.get("text", "") for b in data.get("content", []))
    usage = data.get("usage", {})
    return _response("anthropic", model, text, usage.get("input_tokens", 0),
                     usage.get("output_tokens", 0), 0, data)


def call_openai(prompt_text: str, system: str, model: str = "gpt-4o") -> dict:
    api_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("EM_OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("No OPENAI_API_KEY set. Use the mock provider, or export a key (BYO key mode).")
    body = json.dumps({
        "model": model,
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt_text}],
    }).encode()
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=body,
        headers={"Authorization": f"Bearer {api_key}", "content-type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read())
    text = data["choices"][0]["message"]["content"]
    usage = data.get("usage", {})
    return _response("openai", model, text, usage.get("prompt_tokens", 0),
                     usage.get("completion_tokens", 0), 0, data)


def call_provider(provider: str, prompt_text: str, system: str, run_mode: str,
                  skill_slug=None, version_semver=None) -> dict:
    if provider == "anthropic":
        return call_anthropic(prompt_text, system)
    if provider == "openai":
        return call_openai(prompt_text, system)
    return call_mock(prompt_text, run_mode, skill_slug, version_semver)
