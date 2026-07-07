"""Deterministic token estimation (chars/4 heuristic, same rule everywhere).

Provider adapters overwrite estimates with actual counts when available;
the mock provider reports the estimate as actual.
"""
import math


def estimate_tokens(text: str) -> int:
    if not text:
        return 0
    return max(1, math.ceil(len(text) / 4))


def estimate_cost(input_tokens: int, output_tokens: int, provider: str = "mock") -> float:
    # Demo pricing approximation (per 1M tokens): $3 in / $15 out.
    return round((input_tokens * 3 + output_tokens * 15) / 1_000_000, 6)
