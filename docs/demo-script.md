# Enterprise Mind — 3-minute demo script

Everything runs on the mock provider: deterministic, zero API spend, same numbers every time.

## Setup (once)

```bash
./dev.sh   # starts API on :8000 and web on :3000
```

Open http://localhost:3000 — you are Marcus Webb, an analyst at Northstar Capital Demo,
working in the **Healthcare AI Diligence** project.

## Beat 1 — the baseline failure (~40s)

1. Go to **Chat**. The task box says `make this client ready` — exactly the vague prompt
   analysts type today.
2. Note the **context pill**: Enterprise Mind already knows this routes to the memo skill and
   would need ~826 context tokens, while a raw paste would be ~3,500.
3. Click **Run raw baseline**. This simulates what people do now: the vague ask plus the entire
   14KB research-notes dump.
4. Result: a verbose, hype-laden answer that **fails 5 of 6 deterministic checks** — no required
   sections, three banned phrases, over length, missing confidence/source-limitation concepts,
   and the prompt itself blew the context budget.

## Beat 2 — the Enterprise Mind run (~40s)

1. Click **Run with Enterprise Mind**.
2. The comparison strip appears: **context tokens −64%** (3,506 → 1,248), **harness 1/6 → 6/6**,
   verdict **client-ready**.
3. Click **inspect run** on the Enterprise Mind card. Walk the pipeline rail: intent route →
   context compile → preflight → provider call → postprocess → **repair pass** → final validate.
4. Show the repair: the model output contained "It is important to note" once; the deterministic
   repair pass stripped it — click **show pre-repair** on the output to prove it.
5. Show the **Context** tab: every included card has a reason; the raw notes body is explicitly
   excluded.

## Beat 3 — cross-seat reuse (~40s)

1. Switch project (top bar) to **Enterprise Software Diligence**.
2. Go to **Skills** → **Board Update Condenser** (built by Portfolio Ops). Click **Install**.
   Point out the banner: structure, schema, validators, and rails transfer — no content from the
   owner's project.
3. Back to **Chat**, type `condense this into a board update`, run with Enterprise Mind.
   It passes 6/6 immediately using this project's local context (Relay CI facts).

## Beat 4 — governed learning (~40s)

1. Go to **Admin**. The learning queue shows a proposal: *"Add required 'Open Questions' section
   to Investment Memo Bullet Generator"* with evidence (3 of last 4 runs manually appended it).
2. Click **Approve & promote**. The skill bumps to **v1.1.0**; the harness contract updates.
3. Switch back to Healthcare AI Diligence, rerun the memo task: the output now includes
   **## Open Questions**, passes 6/6, and needed no repair.
4. Finish on the Admin tiles: tokens saved, pass rate, repair rate, audit trail — the ROI story.

## Reset between demos

```bash
./dev.sh reset
```
