# API notes

FastAPI service on `:8000`. Interactive docs at http://localhost:8000/docs.

## Auth / org
- `GET /me` — demo user, org, role
- `GET /orgs`

## Projects
- `GET /projects` · `POST /projects` · `GET /projects/{id}`

## Intent tree
- `GET /projects/{id}/intent-nodes` — intent path (org-level + project nodes) with compiled
  context cards and per-card token counts
- `POST /projects/{id}/intent-nodes` · `PATCH /intent-nodes/{id}` (bumps version, audited) ·
  `DELETE /intent-nodes/{id}` (archives)
- `POST /projects/{id}/compile-context-pack` — new pack version if cards changed

## Skills
- `GET /skills` — with live metrics (pass rate, avg token savings, installs)
- `GET /skills/{id}` — versions, manifest, SKILL.md, harness + cases
- `POST /skills/{id}/install` — `{project_id}`; approved skills only

## Harnesses
- `GET /harnesses`
- `POST /harnesses/{id}/run` — `{output_text?}`; defaults to the skill's current mock output

## Runs
- `POST /runs/baseline` — `{project_id, request, provider}`; raw request + full notes dump,
  judged against the same skill contract
- `POST /runs/enterprise-mind` — full pipeline (route → pack → bundle → preflight → provider →
  postprocess → ≤1 repair → final validate)
- `GET /runs` · `GET /runs/{id}` (steps, artifacts, pack, bundle, skill) ·
  `POST /runs/{id}/accept-output`
- `GET /preview?project_id&request` — route + pack size + baseline estimate, without executing

## Learnings
- `GET /learnings`
- `POST /learnings/{id}/approve` — promotes: `skill_update` mints a new SkillVersion (semver
  minor bump) and updates the harness; `new_rail` appends to org rules; `prompt_patch` patches
  skill instructions
- `POST /learnings/{id}/reject`

## Admin
- `GET /admin/metrics` — usage, quality, skills, learnings, access, context-pack reuse
- `GET /admin/audit-events`

## Providers

`provider` on runs is `mock` (default, deterministic), `anthropic`, or `openai`.
Real providers need `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` in the API process env (BYO key mode).
