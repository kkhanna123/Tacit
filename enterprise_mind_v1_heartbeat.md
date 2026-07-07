# Enterprise Mind V1 Heartbeat

## 0. Product thesis

Enterprise Mind is not another chatbot. It is a deterministic context, skill, harness, and governance layer that sits between enterprise users and the LLMs they already use. Its job is to make bad prompting hard, make good outputs repeatable, make enterprise context reusable across seats, and make quality/token improvements measurable.

The wedge is an “enterprise intent tree + shared skill registry + deterministic run harness” that lets one project’s best context, prompts, rails, validators, and output formats be safely reused by another seat without dumping the whole project history into every prompt.

## 1. Questions to answer before locking V1

### 1.1 Buyer and user
1. Is the V1 buyer an AI-native startup, a professional-services firm, a finance/investment firm, a legal/compliance team, or an engineering org?
2. Is the first daily user a nontechnical employee using chat, a power user building reusable workflows, or an admin trying to govern many seats?
3. Is the “enterprise mind” primarily for knowledge work outputs, coding/agent work, sales/support workflows, finance workflows, or all of these eventually?
4. Is the first demo supposed to sell to founders/operators, CIO/IT, CFO/compliance, or team leads?
5. What is the first department where cross-seat learning is most obviously valuable: investment research, sales, customer success, engineering, legal, operations, or finance?

### 1.2 Provider strategy
1. Should V1 call Anthropic/OpenAI APIs directly with user-provided API keys, or should it primarily generate context packs that users paste/open inside Claude or ChatGPT?
2. Are we assuming enterprise customers have API access bundled with their Claude/OpenAI subscriptions, or only chat app subscriptions?
3. Should V1 be provider-neutral from day one, or should the demo be optimized for one provider and export to the other?
4. Does V1 need to support Claude Skills, OpenAI GPTs/actions, MCP connectors, and raw API calls, or should it define its own canonical skill format first and compile outward later?
5. Should Enterprise Mind ever store user prompts/outputs, or should it store only structured metadata, context cards, skill manifests, and eval scores?

### 1.3 Security and permissioning
1. Can one seat reuse another seat’s skill automatically, or only after the owner/admin publishes it to the org library?
2. What content is allowed to generalize across seats: raw prompts, output snippets, deterministic validators, skill manifests, summary learnings, or only admin-approved templates?
3. Do we need hard project-level walls for confidential client matters, deal teams, legal issues, HR issues, and regulated data?
4. Does the first version need SOC2-grade audit logging, SSO, SCIM, and RBAC, or just a clear architecture placeholder?
5. Should the demo show admin approval before a cross-seat learning becomes reusable?

### 1.4 Deterministic core
1. What counts as a “deterministic harness” in V1: schema validation, golden test cases, token budget checks, citation checks, source coverage checks, forbidden-content checks, or all of these?
2. Should harnesses test prompts before production use, outputs after generation, or both?
3. Do we want automatic prompt editing to be fully deterministic in V1, or should it be LLM-suggested and human-approved?
4. Should the system retry failed outputs automatically, or should it surface a repair prompt that the user can run?
5. What is the minimum quantitative proof for the demo: token reduction, fewer retries, higher schema pass rate, better evaluator score, less human edit distance, or faster completion?

### 1.5 UI and user experience
1. Should the UI feel like a normal chat app with hidden power features, or should it expose the intent tree and harnesses from the beginning?
2. Should power users edit YAML/Markdown manifests directly, or only through forms?
3. Should the “intent tree” be visual like a collapsible tree, document-like like Notion, or invisible behind a context drawer?
4. Does the first demo need a desktop app shell, or is a polished browser UI enough?
5. Should users be able to switch provider/model per run, or should the admin set the provider for the whole org?

### 1.6 First killer demo
1. What exact repeated task should the demo optimize? Examples: “draft investment memo,” “generate client-ready slide bullets,” “write support response,” “summarize deal diligence,” “produce engineering PRD,” or “audit agent run.”
2. What bad-user failure should the demo idiotproof? Examples: vague prompt, wrong format, too much context, missing source citations, leaking internal info, output too long, no deterministic checks.
3. What reusable skill should appear to come from a different seat/project?
4. What does “wow” look like in 90 seconds?
5. Do we need fake enterprise data, a seeded demo workspace, or real imported docs?

## 2. Default assumptions used for this heartbeat

Because the V1 needs to be buildable, the heartbeat assumes:

1. The first demo is a polished web app, not a native desktop app.
2. The first wedge is “shared enterprise context and skill reuse,” not full autonomous enterprise optimization.
3. The LLM provider strategy is BYO API key for actual calls, plus exportable prompt/context packages for users who only have Claude/ChatGPT app subscriptions.
4. V1 stores structured workflow data and user-approved context, not unrestricted raw chat history by default.
5. Cross-seat learning is publish/approve-based, never automatic leakage.
6. The system’s own canonical format comes first; Claude Skills, OpenAI GPTs/actions, MCP, and provider-specific exports are compilation targets later.
7. The first quantitative demo metric is token reduction plus schema/pass-rate improvement on a repeated task.
8. The first UI hides complexity by default but exposes every underlying object for power users.

## 3. North star

Build an enterprise control plane that turns scattered LLM usage into reusable, measurable, governed workflows.

Enterprise Mind should eventually answer:

- What is this user trying to do?
- Which project, department, client, artifact, and workflow does this belong to?
- What context is actually needed?
- Which skill, rail, prompt, schema, and harness should apply?
- What can be safely reused from prior work?
- Did the output satisfy deterministic requirements?
- Did this run improve quality or reduce token spend?
- Which learning should be generalized to the enterprise?

The product should feel simple to a bad user and powerful to a power user.

## 4. V1 product definition

### 4.1 V1 one-liner

A chat-like enterprise AI workspace that compiles a user’s vague request into a context-minimal, skill-backed, harness-tested provider prompt, then measures whether the output was cheaper and better than the baseline.

### 4.2 V1 core objects

V1 has five canonical object types:

1. Intent Tree
   - A structured map of what the company, department, project, workflow, and task are trying to accomplish.
   - Purpose: avoid re-sending giant project histories and instead load the smallest relevant context pack.

2. Skill
   - A reusable workflow package containing instructions, examples, output schemas, validators, rails, and optional scripts.
   - Purpose: let a seat reuse a high-quality workflow from another seat without copying a whole conversation.

3. Context Pack
   - A compact, versioned bundle of project facts, constraints, source references, style preferences, and output expectations.
   - Purpose: replace “dump every doc into context” with deterministic retrieval and compression.

4. Harness
   - A deterministic test suite for prompts and outputs.
   - Purpose: measure schema validity, token budget, missing citations, source coverage, banned phrases, wrong format, and regression cases.

5. Run
   - A logged execution of a task through the compiler, provider, postprocessor, and harness.
   - Purpose: create auditability and measurable improvement over baseline prompts.

### 4.3 V1 user-visible features

1. Chat-like task entry
   - User types a normal request.
   - System detects likely project/workflow.
   - System proposes or applies a context pack and skill.
   - User sees a clean answer, not internal machinery.

2. Context drawer
   - Shows what context was included and what was excluded.
   - Displays token estimate before run.
   - Lets power users pin/unpin intent nodes, documents, and constraints.

3. Skill library
   - Org-level registry of reusable skills.
   - Users can install a skill into a project.
   - Admins can approve publishing across the org.

4. Intent tree editor
   - Collapsible tree view.
   - Users can define company, department, project, workflow, and task nodes.
   - Each node has goals, constraints, source-of-truth docs, output preferences, and disallowed behaviors.

5. Harness results
   - After a run, the system shows pass/fail checks.
   - It shows token cost compared with baseline.
   - It shows which repairs were applied.

6. Admin dashboard
   - Token spend by project/workflow/skill.
   - Pass rate by skill.
   - Retry rate.
   - Reused context pack count.
   - Candidate learnings awaiting approval.

## 5. V1 non-goals

Do not build these in V1:

1. Full autonomous self-modifying enterprise agent.
2. Screen-scraping Claude or ChatGPT desktop apps.
3. Unapproved cross-seat memory sharing.
4. Full SOC2 implementation.
5. Native desktop app.
6. Browser extension.
7. Workflow automation that writes to enterprise systems.
8. A general vector-search chatbot over all company docs.
9. Fully automatic prompt mutation in production without audit.
10. A marketplace of third-party skills.
11. Finetuning.
12. Training on customer data.

The V1 must prove the deterministic control layer, not every long-term feature.

## 6. Architecture

### 6.1 Chosen stack

Frontend:
- Next.js with TypeScript.
- Tailwind plus shadcn-style components.
- React Query for API state.
- Monaco editor for power-user YAML/Markdown editing.
- Tree component for intent tree.

Backend:
- FastAPI with Pydantic models.
- Python service because harnesses, prompt compilation, validation, and provider adapters will be easiest to iterate in Python.
- SQLAlchemy or SQLModel for persistence.

Database:
- Postgres as the system of record.
- pgvector for embeddings and retrieval.
- JSONB for manifests, schemas, and config blobs.

Object storage:
- Local filesystem for demo.
- S3-compatible storage later.

Queue:
- Synchronous execution in first demo.
- Celery/RQ later for eval batches and background harnesses.

Provider layer:
- Anthropic adapter.
- OpenAI adapter.
- Mock provider adapter for deterministic tests and demos without spend.

Auth:
- Demo auth with email/password or magic link.
- Org/seat/project roles in app database.
- SSO later.

### 6.2 Top-level services

1. Web App
   - User-facing chat/workspace/admin UI.

2. API Server
   - CRUD for orgs, projects, skills, intent trees, context packs, harnesses, and runs.
   - Runs compiler pipeline.

3. Prompt Compiler
   - Converts user request + intent tree + skill + context pack + rails into provider-specific prompt/messages.

4. Context Router
   - Maps a user request to relevant project, workflow, and intent nodes.
   - Retrieves the smallest relevant context pack.

5. Skill Registry
   - Stores canonical skills, versions, manifests, examples, validators, and approval status.

6. Harness Engine
   - Runs deterministic validators before and after LLM calls.
   - Produces pass/fail/repair-needed results.

7. Provider Adapters
   - Normalize OpenAI, Anthropic, mock provider calls into one internal response object.

8. Telemetry Engine
   - Tracks token estimates, actual token usage when available, pass rates, retry counts, and quality metrics.

9. Learning Queue
   - Identifies candidate reusable learnings from successful or repaired runs.
   - Requires human/admin approval before promotion.

### 6.3 Data flow for one user request

1. User enters task: “Make this into client-ready investment memo bullets.”
2. API creates Run record with status = draft.
3. Intent Router classifies request against available projects/workflows.
4. System selects project: “Healthcare AI diligence.”
5. System selects skill: “Investment memo bullet generator.”
6. System builds context pack from relevant intent nodes and pinned facts.
7. Preflight harness runs:
   - Checks required fields exist.
   - Checks context pack is under token budget.
   - Checks user request is not missing a required source.
8. Prompt Compiler creates provider-specific message bundle.
9. Provider Adapter calls chosen model or mock provider.
10. Output Postprocessor validates result:
   - Schema valid?
   - Required sections present?
   - Too verbose?
   - Unsupported claims?
   - Forbidden phrases?
11. Repair loop runs at most one deterministic/LLM-assisted repair pass in V1.
12. Final output is shown to user.
13. Run metrics are saved.
14. Candidate learning is proposed only if it improves a repeated issue.

## 7. Deterministic databasing method

### 7.1 Principle

Enterprise Mind should not store “memory” as random chat blobs. It should store typed, permissioned, versioned objects that can be deterministically retrieved, compiled, tested, and audited.

### 7.2 Storage model

Use Postgres as a typed object ledger with these design rules:

1. Every reusable object has:
   - owner_id
   - org_id
   - project_id when applicable
   - visibility
   - version
   - status
   - created_by
   - approved_by
   - created_at
   - updated_at
   - checksum

2. Every object change creates an immutable revision.

3. Cross-seat reuse happens by referencing approved object versions, not copying raw chat history.

4. Context is assembled from small typed records, not entire conversations.

5. The system can explain why every context item was included.

### 7.3 Core tables

#### orgs
Fields:
- id
- name
- slug
- plan
- created_at

Purpose:
- Tenant boundary.

#### users
Fields:
- id
- email
- name
- created_at

Purpose:
- Human seats.

#### org_memberships
Fields:
- id
- org_id
- user_id
- role: owner | admin | builder | user | viewer
- status

Purpose:
- Access control.

#### projects
Fields:
- id
- org_id
- name
- description
- default_provider
- default_model
- visibility
- created_by
- created_at

Purpose:
- Project-level workspace.

#### project_memberships
Fields:
- id
- project_id
- user_id
- role: owner | editor | runner | viewer

Purpose:
- Project permissions.

#### intent_nodes
Fields:
- id
- org_id
- project_id nullable
- parent_id nullable
- node_type: org | department | project | workflow | task | artifact | convention | guardrail | source | output_schema
- title
- summary
- body
- priority
- token_budget
- visibility
- source_refs
- tags
- embedding
- version
- status

Purpose:
- Canonical intent tree.

#### context_packs
Fields:
- id
- org_id
- project_id
- name
- description
- manifest_json
- compiled_text
- token_estimate
- source_intent_node_ids
- source_document_ids
- version
- status

Purpose:
- Precompiled minimal context bundles.

#### skills
Fields:
- id
- org_id
- name
- slug
- description
- owner_user_id
- visibility: private | project | org | public_later
- current_version_id
- status: draft | review | approved | deprecated

Purpose:
- Reusable workflow package.

#### skill_versions
Fields:
- id
- skill_id
- version_semver
- manifest_yaml
- skill_md
- system_instructions
- input_schema_json
- output_schema_json
- examples_json
- validators_json
- rails_json
- token_budget
- compatible_providers
- checksum
- release_notes
- approved_by
- created_at

Purpose:
- Immutable skill releases.

#### harnesses
Fields:
- id
- org_id
- project_id nullable
- skill_version_id nullable
- name
- description
- config_json
- status

Purpose:
- Deterministic tests.

#### harness_cases
Fields:
- id
- harness_id
- name
- input_json
- expected_properties_json
- validators_json
- baseline_prompt nullable
- golden_output nullable
- tags

Purpose:
- Eval cases and regression tests.

#### runs
Fields:
- id
- org_id
- project_id
- user_id
- provider
- model
- raw_user_request
- normalized_intent
- selected_skill_version_id
- selected_context_pack_id
- compiled_prompt_hash
- status
- token_estimate_input
- token_actual_input
- token_actual_output
- baseline_token_estimate
- cost_estimate
- quality_score nullable
- created_at

Purpose:
- Execution record.

#### run_steps
Fields:
- id
- run_id
- step_type: intent_route | context_compile | preflight | provider_call | postprocess | repair | final_validate
- input_json
- output_json
- status
- latency_ms
- created_at

Purpose:
- Audit trail.

#### output_artifacts
Fields:
- id
- run_id
- artifact_type: text | markdown | json | file | table
- content
- schema_json nullable
- validation_status
- created_at

Purpose:
- Generated outputs.

#### learnings
Fields:
- id
- org_id
- project_id nullable
- source_run_ids
- learning_type: prompt_patch | new_rail | context_fact | skill_update | harness_case | style_preference
- title
- body
- evidence_json
- confidence
- proposed_by
- status: proposed | approved | rejected | archived
- approved_by nullable

Purpose:
- Cross-seat generalization queue.

#### audit_events
Fields:
- id
- org_id
- actor_user_id
- action
- object_type
- object_id
- before_json nullable
- after_json nullable
- created_at

Purpose:
- Governance and traceability.

### 7.4 Why this is deterministic

The deterministic part is not the LLM response. The deterministic part is:

1. Which typed context objects are eligible.
2. Which versions are approved.
3. Which context pack is selected.
4. Which skill version is applied.
5. Which rails are enforced.
6. Which validators run.
7. Which repair path is allowed.
8. Which output version becomes accepted.
9. Which learning is allowed to generalize.

The LLM becomes one component inside a controlled workflow, not the source of truth.

## 8. Intent tree design

### 8.1 What the intent tree solves

Most enterprise AI waste comes from repeatedly explaining:

- what the company does
- what the project is
- what the user is trying to accomplish
- what format is expected
- what sources matter
- what words/style are forbidden
- what prior decisions have already been made
- what “good” looks like

The intent tree stores this once, in compact typed nodes, then compiles only the relevant path into the prompt.

### 8.2 Tree levels

V1 should support this hierarchy:

1. Organization
   - Company mission, business model, writing standards, global privacy rules, approved providers.

2. Department
   - Function-specific goals and norms: finance, sales, engineering, legal, support, research.

3. Project
   - Specific initiative, client, deal, product, repo, or workflow area.

4. Workflow
   - Repeatable process: produce memo, draft response, summarize meeting, generate PRD, audit agent run.

5. Task
   - User’s immediate requested action.

6. Artifact
   - Expected output type: memo, email, slide bullets, JSON, code patch, QA checklist.

7. Guardrail
   - Deterministic constraints and forbidden behavior.

8. Source
   - Source-of-truth docs, URLs, snippets, database records, or uploaded files.

9. Output Schema
   - Required fields, sections, examples, tone, length, and validation rules.

### 8.3 Intent node schema

Each node should have:

- title
- node_type
- summary: 1-3 lines
- canonical_context: compact facts that may be inserted into prompts
- source_refs: optional links to source objects
- constraints: must/should/must_not
- output_preferences
- token_budget
- freshness
- owner
- visibility
- tags
- embedding

### 8.4 Intent path compilation

For a run, compile:

1. Organization global rules.
2. Department rules when relevant.
3. Project objective.
4. Workflow instructions.
5. Skill instructions.
6. Task-specific user request.
7. Output schema.
8. Minimal source facts.
9. Guardrails.

Do not include unrelated sibling nodes.

### 8.5 Context card

Every node can produce a “context card”:

- 3-8 bullet summary.
- hard constraints.
- relevant source references.
- output format expectations.
- freshness date.
- token estimate.

The prompt compiler should use context cards, not full node bodies, unless the user expands context.

### 8.6 Intent routing algorithm for V1

Use a hybrid deterministic + semantic route:

1. Exact project/workflow selection if user is already inside a project.
2. Keyword match against project and workflow names.
3. Embedding search against intent node summaries.
4. Optional LLM classification only when top candidates are ambiguous.
5. Confidence threshold:
   - high: auto-select
   - medium: show user “Using X context” with one-click change
   - low: ask user to choose project/workflow

## 9. Skill system

### 9.1 Skill definition

A skill is a versioned workflow package that tells the system how to do a repeatable task with less context, higher reliability, and measurable quality.

### 9.2 Canonical V1 skill folder

Each skill should be exportable as:

```text
skill-name/
  skill.yaml
  SKILL.md
  input_schema.json
  output_schema.json
  examples/
    good_01.md
    bad_01.md
  validators/
    validators.yaml
  harness/
    cases.yaml
  rails/
    rails.yaml
  README.md
```

### 9.3 skill.yaml fields

Required:

- name
- slug
- version
- owner
- description
- intended_users
- intended_tasks
- forbidden_tasks
- required_inputs
- output_type
- token_budget
- compatible_providers
- default_model_policy
- permission_scope
- validators
- harness
- changelog

### 9.4 SKILL.md fields

The SKILL.md should contain:

1. When to use this skill.
2. When not to use this skill.
3. Required user inputs.
4. Required context.
5. Output contract.
6. Style rules.
7. Source rules.
8. Examples of good outputs.
9. Examples of bad outputs.
10. Common failures and repair rules.

### 9.5 Skill lifecycle

1. Draft
   - Created by a user or imported from a project.

2. Local Test
   - Runs against harness cases.

3. Project Approved
   - Usable inside one project.

4. Org Review
   - Admin or skill owner reviews for broader reuse.

5. Org Approved
   - Available in org library.

6. Deprecated
   - Still available for old runs but not recommended.

### 9.6 Skill install flow

1. User opens Skill Library.
2. Searches for a workflow.
3. Clicks skill.
4. Sees description, owner, examples, token budget, pass rate, and required inputs.
5. Installs into project.
6. Skill becomes available to the prompt compiler.
7. Run history records the exact skill version used.

### 9.7 Cross-seat skill reuse

A skill from one seat should never leak private project content unless explicitly included in the approved skill package.

Allowed to share:
- instructions
- schema
- validators
- rails
- synthetic examples
- sanitized examples
- deterministic scripts
- aggregate metrics

Not allowed by default:
- raw chats
- client names
- confidential docs
- private outputs
- deal-specific details
- HR/legal/medical content

## 10. Prompt compiler

### 10.1 Purpose

The prompt compiler turns messy human requests into precise provider-ready messages.

It does not try to be creative. It tries to be consistent.

### 10.2 Compiler inputs

- raw_user_request
- org rules
- project intent path
- selected skill version
- context pack
- output schema
- rails
- provider/model profile
- token budget
- previous failed run optional

### 10.3 Compiler stages

1. Normalize user request
   - Extract task type, artifact type, requested audience, tone, length, and constraints.

2. Select intent path
   - Pick relevant org/department/project/workflow/task nodes.

3. Select skill
   - Match task to installed skills.
   - Fall back to generic assistant skill when none fits.

4. Build context pack
   - Retrieve compact facts.
   - Deduplicate.
   - Rank by relevance.
   - Enforce token budget.

5. Apply rails
   - Add must/must_not constraints.
   - Add source rules.
   - Add privacy rules.

6. Compile provider message
   - Anthropic format.
   - OpenAI format.
   - Mock provider format.

7. Preflight validate
   - Required fields present.
   - Context under budget.
   - No forbidden context.
   - Output schema attached.

8. Execute
   - Call provider adapter.

9. Postprocess
   - Validate output.
   - Apply deterministic edits when safe.
   - Attempt one repair when needed.

### 10.4 Prompt bundle structure

Internal canonical bundle:

```json
{
  "system_contract": "...",
  "developer_contract": "...",
  "task": "...",
  "context_pack": "...",
  "skill_instructions": "...",
  "output_schema": {},
  "rails": [],
  "examples": [],
  "token_budget": 2500,
  "provider_profile": "anthropic|openai|mock"
}
```

### 10.5 Token budget policy

Each run gets four budgets:

1. Max provider input tokens.
2. Max reusable context tokens.
3. Max skill instruction tokens.
4. Max output tokens.

Default V1 budgets:

- user request: unlimited but usually small
- org/project intent: 300-700 tokens
- skill instructions: 400-900 tokens
- source facts: 500-1500 tokens
- output schema/rails: 200-700 tokens
- total compiled prompt target: under 3,000 tokens for demo workflows

### 10.6 Context compression rule

Never summarize everything. Select first, then compress.

Bad:
- Dump all project docs into an LLM and ask it to summarize.

Good:
- Retrieve relevant intent nodes.
- Retrieve relevant source facts.
- Compile a small context card.
- Validate against task requirements.

## 11. Harness engine

### 11.1 Purpose

The harness engine makes the product more than a prompt library.

It tests whether a prompt/output satisfies deterministic expectations.

### 11.2 V1 validators

Implement these first:

1. JSON schema validator
   - Checks structured outputs.

2. Markdown section validator
   - Checks required headings/sections.

3. Length validator
   - Checks word, bullet, paragraph, or token limits.

4. Forbidden phrase validator
   - Catches banned language.

5. Required phrase/concept validator
   - Ensures required concepts appear.

6. Citation/source placeholder validator
   - Ensures claims requiring sources are marked.

7. Context budget validator
   - Ensures compiled prompt is not too large.

8. No-empty-fields validator
   - Checks required output fields are non-empty.

9. Tone/style validator V1-lite
   - Deterministic heuristics, not full semantic judge.

10. Diff validator
   - Compares output against baseline/golden structure.

### 11.3 LLM-as-judge policy

Do not make LLM-as-judge the core V1 proof.

Use LLM scoring only as secondary, clearly labeled, and never as the only pass/fail criterion.

### 11.4 Harness case example

```yaml
name: client_ready_memo_bullets_basic
input:
  user_request: "Turn this into client-ready bullets."
  context_pack: demo_healthcare_ai_context
expected_properties:
  required_sections:
    - "Thesis"
    - "Evidence"
    - "Risks"
    - "Next Steps"
  max_bullets_per_section: 4
  forbidden_phrases:
    - "game changer"
    - "revolutionary"
    - "it is important to note"
  must_include:
    - "source limitation"
    - "confidence level"
validators:
  - markdown_sections
  - forbidden_phrases
  - length
  - required_concepts
```

### 11.5 Repair policy

V1 allows one repair attempt.

Repair prompt should include:
- failed validators
- original output
- exact corrections needed
- no new source facts unless provided

Do not allow infinite agentic loops.

## 12. Cross-seat learning

### 12.1 Principle

The system should learn across the enterprise without becoming creepy, leaky, or ungovernable.

Therefore, V1 learns through typed, reviewable learning objects.

### 12.2 Learning object types

1. Prompt Patch
   - “For investment memo bullets, explicitly ask for risks before recommendation.”

2. Rail
   - “Do not use promotional adjectives in client-facing diligence outputs.”

3. Harness Case
   - “Add regression test for missing source limitations.”

4. Skill Update
   - “New required section: ‘Open Questions.’”

5. Context Fact
   - “This project’s canonical customer segment is mid-market clinics.”

6. Style Preference
   - “This team prefers punchy bullets, no long paragraphs.”

### 12.3 Learning promotion flow

1. System observes repeated failure or successful repair.
2. It proposes a learning.
3. Owner reviews evidence.
4. Owner edits or rejects.
5. Admin approves for project or org scope.
6. Learning becomes part of a skill, rail, or intent node version.
7. Future runs reference the approved object.

### 12.4 What not to do

Do not silently train on everyone’s chats.
Do not auto-share raw outputs.
Do not use one user’s private context to answer another user.
Do not let “learning” bypass project permissions.

## 13. UI spec

### 13.1 UI philosophy

The UI should feel like Claude/OpenAI desktop apps in simplicity, but reveal power-user machinery through side drawers and inspector panels.

Default user experience:
- one input box
- one output panel
- one context indicator
- one pass/fail quality indicator

Power-user experience:
- inspect prompt bundle
- edit context pack
- view skill manifest
- run harness
- compare baseline vs compiled prompt
- publish learning

### 13.2 Layout

Left sidebar:
- Home
- Chat
- Projects
- Skills
- Intent Tree
- Runs
- Admin

Top bar:
- org switcher
- project switcher
- provider/model selector
- token budget indicator
- user menu

Main panel:
- chat/task thread
- generated output
- run status

Right drawer:
- Context Used
- Skill Applied
- Harness Results
- Token Savings
- Prompt Bundle

### 13.3 Home screen

Show:
- “Start a task” input
- recent projects
- installed skills
- recent runs
- pending learnings
- token saved this week
- pass rate this week

### 13.4 Chat screen

Components:

1. Task input
   - Placeholder: “Ask anything. Enterprise Mind will add the right context, skill, and rails.”

2. Context pill
   - Example: “Using: Healthcare AI Diligence / Investment Memo Skill / 1,240 context tokens.”

3. Provider selector
   - Claude
   - OpenAI
   - Mock

4. Run button
   - “Run with Enterprise Mind”

5. Baseline button
   - “Run raw baseline” for demo comparison.

6. Output panel
   - Final response.
   - Validation badge.

7. Inspector drawer
   - Shows what happened.

### 13.5 Intent tree screen

Left:
- collapsible tree

Center:
- selected node editor

Right:
- compiled context card preview
- token estimate
- linked skills
- linked harnesses

Node editor fields:
- title
- type
- summary
- canonical context
- constraints
- output preferences
- source refs
- token budget
- visibility

### 13.6 Skill library screen

List cards:
- name
- owner
- description
- version
- status
- pass rate
- average token savings
- installs

Skill detail:
- overview
- when to use
- output contract
- examples
- validators
- harness cases
- versions
- install button
- publish/request approval button

### 13.7 Runs screen

Table columns:
- time
- user
- project
- skill
- provider
- status
- token input
- token output
- baseline estimate
- pass/fail
- savings

Run detail:
- raw request
- selected intent path
- compiled context pack
- prompt bundle
- provider output
- validators
- repairs
- final output
- candidate learning

### 13.8 Admin screen

Sections:

1. Usage
   - total runs
   - total tokens
   - tokens saved vs baseline
   - cost estimate

2. Quality
   - pass rate
   - repair rate
   - most common failures

3. Skills
   - top skills by usage
   - top skills by savings
   - skills needing review

4. Learnings
   - proposed
   - approved
   - rejected

5. Access
   - users
   - projects
   - roles

## 14. Provider integration strategy

### 14.1 V1 reality

The product should not assume that a ChatGPT or Claude app subscription automatically grants a third-party app the ability to call that model through the user’s subscription.

Therefore V1 supports three modes:

1. BYO API Key Mode
   - User or org enters provider API key.
   - Enterprise Mind calls the model directly.
   - Best for demo and measurable metrics.

2. Export Mode
   - Enterprise Mind compiles the optimized prompt/context package.
   - User copies it into Claude/ChatGPT.
   - Enterprise Mind can still measure estimated tokens and run local validators on pasted output.

3. Mock Mode
   - Used for deterministic demo flows, local tests, and UI development.

### 14.2 Provider adapter contract

All providers return:

```json
{
  "provider": "anthropic|openai|mock",
  "model": "string",
  "input_tokens": 0,
  "output_tokens": 0,
  "latency_ms": 0,
  "raw_response": {},
  "text": "string",
  "tool_calls": [],
  "finish_reason": "string"
}
```

### 14.3 Provider-specific compilation

Do not let provider differences leak throughout the app.

The compiler should produce an internal PromptBundle, then provider adapters translate it.

### 14.4 Future provider compilation targets

Later:
- Claude Skill package export.
- Claude MCP connector.
- OpenAI GPT/action export.
- ChatGPT connector/app integration.
- Slack/Teams wrapper.
- Browser extension.

## 15. Demo scenario

### 15.1 Recommended demo

Use an investment-research / enterprise-strategy workflow because it naturally shows:

- vague prompts
- high context load
- style sensitivity
- source discipline
- reusable templates
- cross-seat skills
- token waste
- measurable output quality

### 15.2 Demo workspace

Org:
- “Northstar Capital Demo”

Departments:
- Investment Research
- Portfolio Ops

Projects:
- “Healthcare AI Diligence”
- “Enterprise Software Diligence”

Skills:
- Investment Memo Bullet Generator
- Risk Register Generator
- Board Update Condenser

Intent nodes:
- org style rules
- investment team rules
- healthcare AI project objective
- diligence memo workflow
- client-ready bullet artifact
- source limitation guardrail

### 15.3 Demo sequence

1. Baseline run
   - User types vague prompt: “make this client ready.”
   - Raw model produces verbose/generic output.
   - Harness flags missing risks, missing source limitations, too much fluff.
   - Token estimate is high because user pasted too much context.

2. Enterprise Mind run
   - Same user request.
   - System routes to project/workflow.
   - Applies Investment Memo Bullet Generator skill.
   - Uses 1 compact context pack instead of full docs.
   - Output passes deterministic validators.
   - UI shows token reduction and pass-rate improvement.

3. Cross-seat reuse
   - Another user in Enterprise Software Diligence installs Board Update Condenser skill created by Portfolio Ops.
   - The skill transfers structure and validators, not confidential project content.
   - New workflow works immediately with local project context.

4. Learning proposal
   - System notices repeated repair: outputs missing “Open Questions.”
   - Proposes adding “Open Questions” to the skill schema.
   - Admin approves.
   - Skill version increments.

### 15.4 Demo acceptance target

By the end of the demo, the viewer should believe:

1. This reduces context stuffing.
2. This makes outputs more consistent.
3. This creates reusable enterprise workflows.
4. This can be governed by admins.
5. This can prove ROI with token and quality metrics.

## 16. Implementation phases

### Phase 0: repo and design lock

Goal:
- Create clean monorepo and lock canonical schemas.

Deliverables:
- README
- architecture doc
- data model doc
- seed demo data plan
- environment setup

Repo:

```text
enterprise-mind/
  apps/
    web/
  services/
    api/
  packages/
    schemas/
    prompt-compiler/
    harness-core/
  demo_data/
  docs/
```

### Phase 1: UI shell

Goal:
- Make the app feel real before deep backend work.

Deliverables:
- sidebar
- top bar
- chat screen
- project switcher
- right inspector drawer
- fake run result
- fake token savings card

Acceptance:
- A user can see the product vision in 30 seconds.

### Phase 2: database and CRUD

Goal:
- Persist core objects.

Deliverables:
- Postgres schema
- migrations
- org/user/project CRUD
- intent node CRUD
- skill CRUD
- harness CRUD
- run records

Acceptance:
- Seeded demo workspace loads from database.

### Phase 3: intent tree and context packs

Goal:
- Let users define project intent and compile context cards.

Deliverables:
- intent tree editor
- context card preview
- context pack model
- token estimator
- simple retrieval by project/workflow/tag/embedding

Acceptance:
- A run can include a compact context pack from selected intent nodes.

### Phase 4: skill registry

Goal:
- Create, install, version, and apply skills.

Deliverables:
- canonical skill manifest
- SKILL.md editor
- skill library UI
- install-to-project flow
- skill versioning

Acceptance:
- A skill can be applied to a run and shown in the inspector.

### Phase 5: prompt compiler and provider adapters

Goal:
- Turn request + context + skill into provider prompt.

Deliverables:
- PromptBundle schema
- compiler stages
- Anthropic adapter
- OpenAI adapter
- mock adapter
- provider settings UI

Acceptance:
- Same task can run through mock, Anthropic, or OpenAI adapter.

### Phase 6: harness engine

Goal:
- Validate output deterministically.

Deliverables:
- schema validator
- markdown section validator
- length validator
- forbidden phrase validator
- required concept validator
- harness result UI

Acceptance:
- A bad output fails visibly.
- A repaired/good output passes visibly.

### Phase 7: baseline comparison and metrics

Goal:
- Prove quality/token improvement.

Deliverables:
- raw baseline run
- Enterprise Mind run
- token estimate comparison
- pass/fail comparison
- run history table
- admin dashboard MVP

Acceptance:
- Demo can show better pass rate and lower context tokens on the same task.

### Phase 8: learning queue

Goal:
- Show how enterprise learning generalizes safely.

Deliverables:
- candidate learning object
- approval UI
- promote learning to skill/rail/harness
- skill version bump

Acceptance:
- Admin can approve a learning and see it affect future runs.

## 17. API routes

### Auth/org
- POST /auth/login
- GET /me
- GET /orgs
- POST /orgs

### Projects
- GET /projects
- POST /projects
- GET /projects/{project_id}
- PATCH /projects/{project_id}

### Intent tree
- GET /projects/{project_id}/intent-nodes
- POST /projects/{project_id}/intent-nodes
- PATCH /intent-nodes/{node_id}
- DELETE /intent-nodes/{node_id}
- POST /projects/{project_id}/compile-context-pack

### Skills
- GET /skills
- POST /skills
- GET /skills/{skill_id}
- POST /skills/{skill_id}/versions
- POST /skills/{skill_id}/install
- POST /skill-versions/{version_id}/approve
- POST /skill-versions/{version_id}/deprecate

### Harnesses
- GET /harnesses
- POST /harnesses
- POST /harnesses/{harness_id}/run

### Runs
- POST /runs/baseline
- POST /runs/enterprise-mind
- GET /runs
- GET /runs/{run_id}
- POST /runs/{run_id}/repair
- POST /runs/{run_id}/accept-output

### Learnings
- GET /learnings
- POST /learnings
- POST /learnings/{learning_id}/approve
- POST /learnings/{learning_id}/reject

### Admin
- GET /admin/metrics
- GET /admin/audit-events

## 18. First seeded objects

### Org style node

Title:
- Northstar Capital Style Rules

Canonical context:
- Write in concise, high-signal bullets.
- Avoid hype language.
- Separate thesis, evidence, risks, and next steps.
- State confidence level when evidence is incomplete.
- Mark source limitations explicitly.

### Department node

Title:
- Investment Research Department

Canonical context:
- Outputs should support diligence, IC discussion, and client-ready memos.
- Claims should be tied to source facts when possible.
- Risks should be surfaced before recommendations.

### Project node

Title:
- Healthcare AI Diligence

Canonical context:
- The project evaluates AI workflow software for provider organizations.
- Key concerns: ROI, implementation burden, privacy, hallucination risk, integration with EHR/workflow systems, and defensibility.

### Skill

Name:
- Investment Memo Bullet Generator

When to use:
- Turning messy research notes into client-ready memo bullets.

Output contract:
- Thesis
- Evidence
- Risks
- Source Limitations
- Open Questions
- Next Steps

Forbidden phrases:
- game changer
- revolutionary
- transformative unless directly sourced
- it is important to note

### Harness

Name:
- Investment Memo Bullet Harness

Validators:
- required sections
- max bullets
- forbidden phrases
- required risk section
- required source limitation section
- max output length

## 19. Quality and ROI metrics

### 19.1 Token metrics

Track:
- baseline input tokens
- compiled input tokens
- output tokens
- total tokens
- context pack tokens
- skill tokens
- tokens saved vs baseline
- cost estimate saved

### 19.2 Quality metrics

Track:
- harness pass rate
- number of failed validators
- repair rate
- output accepted rate
- human edit distance later
- thumbs up/down later
- skill-level pass rate

### 19.3 Enterprise metrics

Track:
- skill reuse count
- context pack reuse count
- cross-seat installs
- approved learnings
- rejected learnings
- most common failure modes
- top token-wasting workflows

### 19.4 V1 demo metrics to show

Use concrete demo labels:

- “Context tokens reduced by 62%”
- “Harness pass rate: 4/6 → 6/6”
- “Required sections: missing → complete”
- “Forbidden phrases: 3 → 0”
- “Skill reused across 2 projects”

Only show these as seeded demo metrics unless measured live.

## 20. Security model

### 20.1 Permission levels

Org roles:
- owner
- admin
- builder
- user
- viewer

Project roles:
- owner
- editor
- runner
- viewer

Skill visibility:
- private
- project
- org-approved
- deprecated

Learning scope:
- private
- project
- department
- org

### 20.2 Default sharing policy

Default: private to project.

A user may publish a skill to project library.
An admin may approve a skill for org-wide library.
A learning may not become org-wide without approval.

### 20.3 Audit events

Log:
- skill created
- skill approved
- skill installed
- context node edited
- learning proposed
- learning approved
- provider key changed
- run executed
- output accepted

### 20.4 Data minimization

Do not store more than needed.

For demo:
- store raw prompt and output only inside run history.
- make this clear in settings.
- later allow no-retention mode where only metadata is stored.

## 21. Failure modes and mitigations

### Failure: product becomes another generic chat UI
Mitigation:
- Make context, skill, harness, and token comparison visible in every run.

### Failure: intent tree is too much work
Mitigation:
- Seed it from a short onboarding form.
- Allow users to accept generated draft nodes.
- Make editing optional.

### Failure: users do not understand skills
Mitigation:
- Call them “Reusable Workflows” in the UI.
- Keep “Skill” as internal/power-user term.

### Failure: cross-seat learning scares buyers
Mitigation:
- Approval queue.
- No raw chat sharing by default.
- Clear scope labels.

### Failure: deterministic harness feels weak
Mitigation:
- Start with obvious validators that catch visible failures.
- Show before/after side by side.

### Failure: token savings are hard to prove
Mitigation:
- Include baseline run.
- Estimate tokens before run.
- Use provider token counts when available.

### Failure: provider integrations become a rabbit hole
Mitigation:
- BYO API key + export mode first.
- Provider-specific enterprise integrations later.

## 22. Agent implementation instructions

An implementation agent should follow these rules:

1. Do not start with the provider integration.
2. Start with the UI shell and seeded demo data.
3. Preserve the five core objects: intent tree, skill, context pack, harness, run.
4. Do not collapse the product into a generic RAG chatbot.
5. Do not remove deterministic validators.
6. Do not make cross-seat learning automatic.
7. Do not build native desktop in V1.
8. Do not add complex background job infrastructure until synchronous runs work.
9. Keep schemas strict and versioned.
10. Make every run inspectable.
11. Build mock provider first so the product can demo without API spend.
12. Then add Anthropic/OpenAI adapters.
13. Prefer explicit typed objects over unstructured memory.
14. Keep the UI simple by default, but expose raw manifests for power users.
15. Every feature must support the demo narrative: cheaper context, better output, reusable workflow.

## 23. First build prompt for coding agent

Use this prompt to begin implementation:

You are building Enterprise Mind V1, a deterministic enterprise AI control plane. Build a polished demo web app and backend around five core objects: Intent Tree, Skill, Context Pack, Harness, and Run. Do not build a generic chatbot. The app must show how a vague user request is routed to the right project/workflow, compiled with a compact context pack and reusable skill, validated by deterministic harnesses, and compared against a raw baseline for token usage and output quality.

Use a monorepo:
- apps/web: Next.js TypeScript UI
- services/api: FastAPI backend
- packages/schemas: shared JSON/Pydantic/Zod-style schemas where practical
- demo_data: seeded org/project/skill/harness/run objects
- docs: architecture and API notes

Implement first:
1. UI shell with sidebar, top bar, chat screen, right inspector drawer.
2. Seeded demo workspace called Northstar Capital Demo.
3. Intent tree editor with collapsible nodes.
4. Skill library with Investment Memo Bullet Generator.
5. Mock provider run that returns deterministic demo outputs.
6. Harness validators for required sections, forbidden phrases, length, and required concepts.
7. Baseline vs Enterprise Mind comparison screen.
8. Run detail inspector showing raw request, selected intent path, skill, context pack, prompt bundle, output, validators, and token estimates.

Do not implement auth beyond a demo user yet. Do not implement SSO. Do not implement native desktop. Do not implement background jobs. Do not implement unrestricted file ingestion. Do not silently share data across users. Cross-seat learning must appear as an approval queue, not automatic memory.

Acceptance criteria:
- The demo can show one vague prompt producing a bad baseline and a better Enterprise Mind output.
- The Enterprise Mind output uses a smaller context pack.
- Harness results visibly improve.
- A reusable skill can be installed into a second project.
- A candidate learning can be approved and promoted to a new skill version.

## 24. V1 definition of done

The V1 demo is done when:

1. A user can create or select a project.
2. A user can view/edit an intent tree.
3. A user can install a skill.
4. A user can run a vague task.
5. The system selects context and skill.
6. The system compiles a prompt bundle.
7. The mock or real provider returns output.
8. Harness validators run.
9. The UI shows pass/fail results.
10. The UI compares baseline vs Enterprise Mind.
11. The run is saved and inspectable.
12. A learning can be proposed and approved.
13. The admin dashboard shows token and quality metrics.
14. The product tells a clear story in under 3 minutes.

## 25. The most important product judgment

The first version should not try to be “the AI that manages all enterprise AI.” That is too broad.

The first version should be “the workflow memory and testing layer that makes enterprise AI usage reusable, cheaper, and less dumb.”

Win that wedge first.
