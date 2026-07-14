# Enterprise Mind V1 — Architecture

Enterprise Mind is a deterministic context, skill, harness, and governance layer between
enterprise users and the LLMs they already use. It is **not** a chatbot: the LLM is one
component inside a controlled workflow, never the source of truth.

## Monorepo

```
enterpriseMind/
  apps/web            Next.js 16 + TypeScript + Tailwind v4 + React Query
  services/api        FastAPI + SQLModel (SQLite for demo; schema ports to Postgres)
    demo_data         Seeded Northstar Capital workspace (org, projects, intent nodes, skills, harnesses, learnings, mock outputs)
  packages/schemas    Canonical JSON Schemas (PromptBundle, ProviderResponse, SkillManifest, ValidatorConfig)
  docs                This folder
```

Deployment: each app is its own Vercel project (root directories `apps/web` and `services/api`);
the API runs on Vercel's Python runtime with SQLite in `/tmp` (reseeds per cold start).

## Five core objects

1. **Intent Tree** — typed nodes (org → department → project → workflow → artifact → guardrail → source).
   Each node compiles to a compact *context card*; full bodies never enter prompts.
2. **Skill** — versioned workflow package: system instructions, input/output schemas, validators,
   rails, examples. Installing a skill into a project transfers structure only, never content.
3. **Context Pack** — versioned bundle compiled from the intent path's cards
   (select-then-compress). The manifest records *why* each item was included and what was excluded.
4. **Harness** — deterministic validators run before (preflight) and after (postprocess) every
   provider call. No LLM-as-judge in the pass/fail path.
5. **Run** — a logged execution with a full step-level audit trail
   (`intent_route → context_compile → preflight → provider_call → postprocess → repair → final_validate`).

## Data flow for one request

1. `POST /runs/enterprise-mind` creates a Run.
2. **Intent router** (deterministic: explicit project + keyword match against installed skills)
   selects workflow and skill; low confidence falls back to a generic contract.
3. **Context router** compiles the project's context pack from intent-path cards.
4. **Prompt compiler** builds the canonical PromptBundle (hashed for auditability).
5. **Preflight harness** checks the compiled prompt (context budget, required fields).
6. **Provider adapter** executes (mock by default; Anthropic/OpenAI via BYO API key env vars).
7. **Postprocess harness** validates the output; at most **one** repair pass runs
   (deterministic edits only, e.g. stripping forbidden phrases). No agentic loops.
8. Final artifact, validator results, token metrics, and audit events are persisted.
9. If the same repair repeats across runs, a **Learning** is *proposed* — never auto-applied.

## Determinism boundary

Deterministic: object selection, versions, context compilation, rails, validators, repair rules,
promotion of learnings. Non-deterministic: only the provider call itself (and the mock provider
makes even that deterministic for demos).

## Provider strategy

- **Mock mode** (default): deterministic outputs from `services/api/demo_data/mock_outputs.json`, zero spend.
- **BYO key mode**: set `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` in the API's environment and pick
  the provider in the chat screen. All adapters return the normalized ProviderResponse.
- **Export mode** (later): compile the bundle for pasting into Claude/ChatGPT apps.

## Cross-seat learning governance

Learnings are typed objects (`prompt_patch`, `new_rail`, `context_fact`, `skill_update`,
`harness_case`, `style_preference`) with evidence and confidence. Approval in the Admin screen
promotes them: a `skill_update` mints a new immutable SkillVersion (semver bump) and updates the
harness; future runs pick up the new contract automatically. Rejection archives them. Every
decision lands in the audit trail.

## Deliberate demo simplifications

- SQLite instead of Postgres (same SQLModel schema; pgvector/embedding routing stubbed by
  keyword matching for V1).
- Single demo user (`Marcus Webb`, builder) — no auth, per heartbeat §23.
- Synchronous runs — no queue.
- Token estimation is chars/4 everywhere; real provider counts overwrite when available.
