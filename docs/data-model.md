# Data model

Postgres-style typed object ledger (SQLite in the demo, same SQLModel schema). Rules:

- Every reusable object carries org/project scope, visibility, version, status, and audit fields.
- Changes create revisions (intent nodes bump `version`; skills mint immutable `skill_versions`).
- Cross-seat reuse references approved object versions — raw chat history is never copied.
- Context is assembled from small typed records; the pack manifest explains every inclusion.

## Tables

| Table | Purpose |
| --- | --- |
| `orgs`, `users`, `org_memberships` | Tenancy and org roles (owner/admin/builder/user/viewer) |
| `projects` | Workspace walls; default provider/model per project |
| `intent_nodes` | Typed intent tree (org/department/project/workflow/task/artifact/guardrail/source/output_schema) with canonical_context bullets, constraints, token budgets |
| `context_packs` | Versioned compiled packs: manifest (inclusions + reasons + exclusions), compiled text, token estimate |
| `skills` | Registry entry: slug, owner, visibility, status, pointer to current version |
| `skill_versions` | Immutable releases: manifest YAML, SKILL.md, system instructions, input/output schemas, validators, rails, examples, checksum |
| `skill_installs` | Which skills are usable in which projects (install = structure transfer only) |
| `harnesses`, `harness_cases` | Deterministic validator suites + regression cases |
| `runs` | Execution records: mode (baseline/enterprise_mind), token estimates vs actuals, baseline comparison, pass/fail counts, repairs, prompt hash |
| `run_steps` | Step-level audit trail (7 step types) with input/output JSON and latency |
| `output_artifacts` | Generated outputs; pre-repair and final versions both kept |
| `learnings` | Typed cross-seat learning queue (proposed/approved/rejected) with evidence and confidence |
| `audit_events` | Governance log: who did what to which object, before/after |

## Why this is deterministic

The LLM response is the only non-deterministic element. Everything that decides *what reaches the
model* and *whether its output is accepted* — eligible objects, approved versions, pack
selection, skill version, rails, validators, the single repair path, and learning promotion — is
typed, versioned, and reproducible (the compiled bundle is content-hashed onto the run).
