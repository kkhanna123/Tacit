# Enterprise Mind V1

A deterministic enterprise AI control plane — the workflow memory and testing layer that makes
enterprise LLM usage reusable, cheaper, and less dumb. Built around five core objects:
**Intent Tree · Skill · Context Pack · Harness · Run**.

One vague request in → routed to the right project/workflow, compiled with a compact context
pack and a reusable skill, validated by deterministic harnesses, and compared against a raw
baseline for token usage and output quality.

## Quick start

Requirements: Node 18+, [uv](https://docs.astral.sh/uv/) (for Python 3.12).

```bash
./dev.sh          # installs deps if needed, starts API :8000 + web :3000
./dev.sh reset    # wipe the database back to the pristine seeded demo state
./dev.sh stop     # stop both servers
```

Open **http://localhost:3000**. The seeded workspace is *Northstar Capital Demo* — an
investment-research firm mid-diligence on a healthcare AI company. Follow
[`docs/demo-script.md`](docs/demo-script.md) for the 3-minute demo narrative:

1. **Baseline** — `make this client ready` + a 14KB notes dump → verbose hype, fails 5/6 checks.
2. **Enterprise Mind** — same request → routed, skill-backed, 64% fewer context tokens, 6/6
   checks (including one visible deterministic repair).
3. **Cross-seat reuse** — install Portfolio Ops' *Board Update Condenser* into a second project;
   structure and validators transfer, content never does.
4. **Governed learning** — approve the proposed *Open Questions* learning in Admin; the skill
   bumps to v1.1.0 and future runs pick up the new contract.

Everything runs on the **mock provider** by default (deterministic, zero spend). For live calls,
export `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` before starting and pick the provider in Chat.

## Layout

```
apps/web            Next.js 16 UI (chat, intent tree, skill library, runs, admin)
services/api        FastAPI backend (compiler, harness engine, provider adapters, ledger)
packages/schemas    Canonical JSON Schemas (PromptBundle, ProviderResponse, SkillManifest, …)
demo_data           Seeded workspace + deterministic mock outputs
docs                Architecture, data model, API, demo script
```

See [`docs/architecture.md`](docs/architecture.md) for the design and the determinism boundary,
and [`enterprise_mind_v1_heartbeat.md`](enterprise_mind_v1_heartbeat.md) for the product spec
this implements.
