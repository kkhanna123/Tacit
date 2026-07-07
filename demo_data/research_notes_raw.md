# RAW NOTES DUMP — Clinia Health (AI workflow software) — DO NOT SEND TO CLIENT

paste of everything from the shared drive + call notes + slack thread, sorry it's messy, was going to clean up before IC but ran out of time

## call w/ CEO (Mara Lindqvist) 6/12

- founded 2021, spun out of a Stanford clinical informatics lab
- product = AI layer that sits on top of Epic/Cerner and drafts prior-auth packets, referral letters, and post-visit summaries
- she kept saying it's a "game changer" for mid-market clinics, used the phrase maybe 6 times
- claims 340 provider organizations live, but later in the call said 340 "signed" and ~210 "fully deployed" — need to reconcile
- ARR: she said $18.4M run-rate, up from $6.1M last year. CFO deck says $17.2M. discrepancy might be timing of Q2 upsells, ask on follow-up
- gross margin claimed 71%, includes inference costs, says they cut inference spend 40% by routing easy cases to a small fine-tuned model
- churn: "basically zero logo churn" — but two health systems in Ohio paused deployments in Q1 (she volunteered this, credit to her)
- pricing: per-seat $120-180/mo for clinical staff, plus platform fee. blended ACV ~$85k
- says Epic integration took 14 months to certify, thinks that's the moat, competitors are "12-18 months behind"
- fundraise: raising $40M Series B at $320M pre, wants to close by end of Q3

## call w/ VP Eng (Dev Okafor) 6/14

- team of 38 eng, 9 on ML
- stack: fine-tuned Llama variants for drafting + GPT-4-class model for complex cases, all behind their own routing layer
- hallucination rate: internal eval says 2.3% of drafts contain at least one unsupported clinical claim, down from 7% a year ago. drafts are ALWAYS reviewed by clinician before sending — that's the safety story
- they log every edit clinicians make and use it for eval, not training (BAA restrictions), says training on customer data would be "suicide" in healthcare
- SOC2 Type II, HITRUST in progress, expects certification Q4
- HIPAA: BAAs with all customers, PHI never leaves their VPC, model providers under zero-retention agreements
- Epic integration is through official APIs (FHIR + private APIs under the Epic partnership program) — NOT screen scraping, this matters, two competitors got kicked off Epic for scraping last year
- biggest eng risk he flagged himself: Epic is building overlapping features ("In Basket" draft replies), timeline unknown, he thinks Epic will stay horizontal and shallow

## customer ref calls

### ref 1 — COO of 40-clinic orthopedic group in Texas (6/18)

- live 11 months, 380 seats
- prior-auth turnaround went from 5.2 days to 1.9 days average, that's their headline number, audited internally
- staff love it, one prior-auth specialist said she'd quit if they took it away
- BUT: implementation was rough, took 5 months vs promised 6 weeks, needed a dedicated Clinia engineer on-site twice
- ROI: they cut 6 FTE contractors in the prior-auth department, ~$390k/yr savings vs ~$520k/yr cost... wait, that's negative? no — 6 contractors + overtime reduction + faster revenue cycle (claims going out 3 days earlier improved cash collections), CFO says net positive by month 7, I need to get the actual model from them
- renewal: signed 3-yr renewal at 20% price increase, that's the strongest signal in the whole diligence

### ref 2 — CMIO of regional health system, 2 hospitals + 60 clinics, midwest (6/19)

- live 6 months, pilot of 150 seats in ambulatory only
- more skeptical. quality "fine but the last 10% of edge cases eats the time savings" — complex oncology prior-auths still done fully manually
- said Clinia's clinical accuracy is "noticeably better than the EHR-native drafts" but "the gap is closing"
- deployment stalled at pilot because IT is consumed by an Epic version upgrade until Q1 next year — this is the pattern behind the Ohio "pauses" too I think, not product quality, but it still hits NDR
- would they churn? "no, but we're not expanding until the Epic upgrade is done"

### ref 3 — declined to talk (deal-breaker? no — they're mid-implementation and legal blocked external calls, per Mara)

## market notes (from Leo's desk research, pasted from slack)

- prior-auth automation TAM estimates all over the place: $1.2B (narrow, just prior-auth drafting) to $9B (all clinical admin documentation). the $9B number is from a vendor-sponsored report, discount it
- CMS final rule on prior-auth (Jan 2026) requires payers to respond in 72hrs for urgent — this INCREASES volume pressure on providers short-term, tailwind for Clinia
- competitors: Cohere Health (payer-side, different buyer), Latent (seed stage, scraping-based, on thin ice with Epic), Epic native features (the real threat), and one stealth co founded by ex-Nuance people that raised $60M
- Nuance/Microsoft DAX is adjacent (ambient documentation) not directly competitive but owns the mindshare budget line
- consolidation risk: if Epic ships good-enough native drafting in 2 releases, mid-market clinics won't pay for a third-party layer. counter: Epic has announced 40+ AI features and shipped maybe 8, and provider orgs don't trust Epic's AI quality yet
- pricing pressure: none observed yet, Clinia raised prices 20% on renewals with no reported pushback

## finance snapshot (from dataroom, Q1)

- $17.2M ARR (their number, need to tie to contracts), 118% NDR, 94% gross logo retention
- burn: $1.4M/mo, 21 months runway before this raise
- CAC payback 19 months (mid-market healthcare, that's actually fine)
- 71% gross margin claimed — our recompute with cloud + inference + deployment engineers allocated puts it at 64-66%, still acceptable, flag the delta
- rule of 40: growth ~180% + margin -35% = comfortably above, but growth decelerating (Q1 net-new ARR flat QoQ)

## open threads / todo

- reconcile 18.4 vs 17.2 ARR — ask for contract-level tie-out
- get ortho group's actual ROI model
- Epic partnership agreement: what are termination rights? THIS IS THE BIG ONE, if Epic can kick them off the partner program the moat inverts
- pull the two Ohio pause accounts, get names, call them directly
- validate hallucination eval methodology — 2.3% of drafts with clinician review might be fine, but what's the near-miss rate on the ones clinicians DIDN'T catch? is there a second-review sample?
- legal: any FDA SaMD exposure if they expand from admin drafting into clinical decision support? current product is probably fine (administrative), expansion roadmap mentions "care gap identification" which gets closer to the line
- insurance: do they carry AI E&O? (new but becoming standard ask)

## slack thread w/ Priya (partner) 6/20 — pasted

priya: where are we on clinia
me: refs done, 2 of 3 strong, finance mostly ties, epic dependency is the core risk
priya: IC wants it thursday. can you get me client-ready bullets by wed
me: yes
priya: keep it tight. last memo was 9 pages, half the IC didn't read it. thesis/evidence/risks/next steps, confidence levels, flag what we haven't verified. no adjectives.
me: 👍
priya: and don't bury the epic thing. it's the whole deal.

## misc / parking lot

- Mara mentioned offhand that a "top-3 payer" approached them about licensing the drafting engine payer-side — interesting optionality, zero diligence done on it, do not put in memo as fact
- their NPS is 72 (n=214, quarterly in-app survey) — good but self-reported
- glassdoor: 4.1, eng reviews fine, two sales reviews mention "comp plan changed twice this year"
- the deck's "78% reduction in prior-auth labor" slide is from ONE customer (the ortho group) — do not generalize it
- board: lead from Series A is Foundry Health Ventures, taking pro-rata, not leading B (they say it's fund lifecycle, verify)
- travel note: site visit to Austin office possible week of 7/14 if we go to term sheet

## appendix A — CEO call transcript excerpt (auto-transcribed, unedited, 6/12)

[00:14:22] Mara: ...so the way to think about it is, every prior auth that goes out the door today, somebody sat there for forty-five minutes assembling the clinical justification, pulling chart notes, finding the right CPT codes, matching payer-specific requirements, and payers change those requirements constantly, like Aetna changed their imaging prior auth forms three times last year, three times, and every time that happens the clinic's staff has to relearn the process, and that's where we come in because our system watches the payer portals and keeps the requirement templates current, so the draft that comes out is already formatted to what the payer wants this week, not what they wanted in January...

[00:15:10] Mara: ...and honestly the thing our customers tell us, and you'll hear this in your reference calls I'm sure, is that the staff who do this work are burned out and impossible to retain, the average tenure of a prior auth specialist at a mid-market clinic is under two years, so even setting aside the labor cost savings, which are real, the continuity value of having the institutional knowledge live in the system instead of in someone's head who's going to quit in eighteen months, that's the thing that makes the CFO sign...

[00:17:41] Mara: ...on the Epic question, look, I won't pretend it's not a dependency, it is, but I'd frame it this way, we spent fourteen months getting certified under their partner program, we have a named partner manager, we're in their app orchard marketplace, we co-present at HIMSS, and the reality is Epic makes real money from the program, they're not going to burn the ecosystem to ship a mediocre in-house feature, and everything Epic has shipped AI-wise so far has been, and I'm being generous, shallow, their in-basket draft replies are a party trick, our customers turned them off...

[00:21:03] Mara: ...the payer thing I mentioned, I want to be careful here because there's an NDA, but conceptually, if the same drafting engine that helps a provider assemble a prior auth can help a payer's utilization management team triage it, you've cut the cycle time on both sides, and there's a world where we're the neutral standard in the middle, that's the big company outcome, but I want to be clear that's optionality, not plan of record, the plan of record is own provider-side clinical admin drafting end to end...

## appendix B — dataroom index (as of 6/16, items we have NOT yet reviewed marked TODO)

1. Certificate of incorporation + amendments — reviewed, clean
2. Cap table (pre-B) — reviewed; option pool 11%, no unusual terms
3. Series A docs — reviewed; standard NVCA, 1x non-participating
4. Customer contracts, top 20 by ARR — TODO, this is where the ARR tie-out happens
5. Epic partnership agreement — REQUESTED, not yet provided, second request sent 6/19
6. Revenue by month, 24 months — reviewed, seasonality in Q4 (budget flush)
7. Churn/cohort analysis — reviewed; gross logo retention 94% checks out, but cohort table excludes the two Ohio "paused" accounts from the churn calc, flagged
8. Security: SOC2 Type II report — reviewed, two minor findings, both remediated
9. HIPAA BAAs, sample — reviewed, standard
10. Model provider agreements (zero retention) — reviewed for OpenAI + Anthropic, TODO for the fine-tune hosting vendor
11. Employee census + key person deps — reviewed; 2 of 9 ML eng joined from the Stanford lab, retention packages TBD in this round
12. Litigation — none disclosed
13. IP assignment — TODO, spot-check the Stanford spinout IP terms, university may retain license rights
14. Insurance certificates — reviewed; NO AI E&O policy currently, broker quote in progress per CFO
15. Board minutes, last 8 quarters — TODO, requested 6/19

## appendix C — competitor teardown notes (Leo, pasted 6/20)

Cohere Health: payer-side UM automation, raised $200M+, different buyer (health plans), occasionally shows up in the same RFP when a health system wants "both sides" — not a near-term threat but a consolidation acquirer candidate. Latent: seed stage, $4M raised, screen-scraping approach to EHR integration, two of their pilot customers reportedly got warning letters from Epic legal, their pitch is "no integration needed" which is exactly the thing that gets you kicked off the platform, expect them to pivot or die. Stealth co (ex-Nuance folks): raised $60M from a16z + GC, rumored to be going after ambient documentation + admin drafting combined, no product in market yet, watch closely, they could commoditize the drafting layer with a bundled offering. Epic native: shipped in-basket draft replies (weak per customer feedback), announced prior-auth "assistance" features at UGM for "future release," no date, Epic's historical AI ship rate is 8 of 40+ announced features in two years. Microsoft/Nuance DAX: ambient clinical documentation, owns the physician documentation budget line, adjacent not competitive, but if they move down-market into admin drafting they have the Epic relationship to do it, this is the sleeping giant scenario. Overall: Clinia's 12-18 month integration lead is real but the defensibility question is entirely about whether the Epic partner agreement has teeth, everything else is execution.

## appendix D — payer mix + revenue quality notes (from CFO follow-up email 6/21)

Top 10 customers = 34% of ARR (fine). Largest = 6.1% (fine). Contract lengths: 62% annual, 31% two-year, 7% three-year (the ortho renewal). Payment terms net-30, DSO 41 days. 14% of ARR is on legacy pricing from 2023 pilots, repricing opportunity at renewal per CFO, we should NOT underwrite that. Services revenue is 8% of total revenue and negative margin (implementation), they call it "land cost," fair but it means the 71% blended gross margin overstates software margin durability if implementation attach stays high — ties to the ref 1 complaint about the 5-month implementation. Deferred revenue balance ties to ARR within 3%, good sign. One anomaly: Q1 shows a $410k one-time "data migration services" line from a single health system, CFO says non-recurring, excluded from ARR, verified excluded, fine.
