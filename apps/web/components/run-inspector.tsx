"use client";

import { useState } from "react";
import { Eyebrow, Memo, PassDot, StatusStamp, TokenMeter, ValidatorRow } from "./ui";

/* eslint-disable @typescript-eslint/no-explicit-any */

const STEP_LABELS: Record<string, string> = {
  intent_route: "Intent route",
  context_compile: "Context compile",
  preflight: "Preflight harness",
  provider_call: "Provider call",
  postprocess: "Postprocess validate",
  repair: "Repair pass",
  final_validate: "Final validate",
};

export function PipelineRail({ steps }: { steps: any[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="hairline-card divide-y divide-line">
      {steps.map((step, i) => {
        const ok = step.status === "ok";
        const isOpen = open === step.id;
        return (
          <div key={step.id} className="step-in" style={{ animationDelay: `${i * 80}ms` }}>
            <button
              onClick={() => setOpen(isOpen ? null : step.id)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-paper"
            >
              <span className="w-5 text-right font-mono text-[10px] text-ink-3">{step.seq}</span>
              <PassDot ok={ok} />
              <span className="text-[13px] font-semibold">
                {STEP_LABELS[step.step_type] ?? step.step_type}
              </span>
              <span className="font-mono text-[10px] text-ink-3">{step.step_type}</span>
              <span className="ml-auto font-mono text-[10px] text-ink-3">
                {step.latency_ms ? `${step.latency_ms} ms` : ""} {isOpen ? "▾" : "▸"}
              </span>
            </button>
            {isOpen && (
              <div className="grid gap-2 border-t border-line bg-paper px-4 py-3 md:grid-cols-2">
                <div>
                  <Eyebrow>input</Eyebrow>
                  <pre className="blob mt-1 max-h-64 overflow-auto rounded border border-line bg-card p-2">
                    {JSON.stringify(step.input_json, null, 2)}
                  </pre>
                </div>
                <div>
                  <Eyebrow>output</Eyebrow>
                  <pre className="blob mt-1 max-h-64 overflow-auto rounded border border-line bg-card p-2">
                    {JSON.stringify(step.output_json, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function finalValidatorResults(detail: any): any[] {
  const final = [...(detail?.steps ?? [])].reverse().find((s: any) => s.step_type === "final_validate");
  return final?.output_json?.results ?? [];
}

export function RunInspector({ detail }: { detail: any }) {
  const [tab, setTab] = useState("pipeline");
  const run = detail.run;
  const results = finalValidatorResults(detail);
  const tabs = [
    ["pipeline", "Pipeline"],
    ["harness", "Harness"],
    ["context", "Context"],
    ["skill", "Skill"],
    ["bundle", "Bundle"],
    ["tokens", "Tokens"],
  ];
  return (
    <div>
      <div className="mb-3 flex gap-1 border-b border-line">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-2 text-[12.5px] ${
              tab === key
                ? "-mb-px border-b-2 border-ink font-semibold"
                : "text-ink-2 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "pipeline" && <PipelineRail steps={detail.steps} />}

      {tab === "harness" && (
        <div className="hairline-card">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <Eyebrow>harness · deterministic validators</Eyebrow>
            <span className="font-mono text-[11px]">
              <span className="font-semibold text-pass">{run.harness_pass_count}</span>
              <span className="text-ink-3">/{run.harness_pass_count + run.harness_fail_count} pass</span>
            </span>
          </div>
          {results.map((r: any, i: number) => (
            <ValidatorRow key={i} result={r} />
          ))}
        </div>
      )}

      {tab === "context" && (
        <div className="space-y-3">
          {detail.context_pack ? (
            <>
              <div className="hairline-card p-3">
                <Eyebrow>context pack · v{detail.context_pack.version}</Eyebrow>
                <div className="mt-1 text-[13px] font-semibold">{detail.context_pack.name}</div>
                <div className="font-mono text-[11px] text-ink-2">
                  {detail.context_pack.token_estimate.toLocaleString()} tokens ·{" "}
                  {detail.context_pack.source_intent_node_ids.length} intent nodes
                </div>
              </div>
              <div className="hairline-card p-3">
                <Eyebrow>included (with reasons)</Eyebrow>
                <ul className="mt-2 space-y-1.5">
                  {(detail.context_pack.manifest_json?.included_nodes ?? []).map((n: any) => (
                    <li key={n.id} className="text-[12.5px]">
                      <span className="font-semibold">{n.title}</span>{" "}
                      <span className="font-mono text-[10px] text-ink-3">
                        [{n.type}] {n.tokens} tok
                      </span>
                      <div className="text-[12px] text-ink-2">{n.reason}</div>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 border-t border-line pt-2">
                  <Eyebrow>excluded</Eyebrow>
                  <ul className="mt-1 space-y-1">
                    {(detail.context_pack.manifest_json?.excluded ?? []).map((x: any, i: number) => (
                      <li key={i} className="text-[12px] text-ink-2">
                        <span className="font-semibold text-ink">{x.what}</span> — {x.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="hairline-card p-3">
                <Eyebrow>compiled text</Eyebrow>
                <pre className="blob mt-2 max-h-80 overflow-auto">{detail.context_pack.compiled_text}</pre>
              </div>
            </>
          ) : (
            <div className="hairline-card p-4 text-[12.5px] text-ink-2">
              No context pack — this was a raw baseline run. The full notes dump went straight into
              the prompt.
            </div>
          )}
        </div>
      )}

      {tab === "skill" && (
        <div className="hairline-card p-3">
          {detail.skill ? (
            <>
              <Eyebrow>skill</Eyebrow>
              <div className="mt-1 text-[14px] font-semibold">{detail.skill.name}</div>
              <div className="font-mono text-[11px] text-ink-2">
                {detail.skill.slug} · v{detail.skill.version}
              </div>
              <a href={`/skills/${detail.skill.id}`} className="mt-2 inline-block text-[12.5px] font-semibold underline">
                Open in Skill Library →
              </a>
            </>
          ) : (
            <div className="text-[12.5px] text-ink-2">
              No skill applied — {run.run_mode === "baseline" ? "baseline runs use the raw prompt as-is." : "no installed skill matched this request."}
            </div>
          )}
        </div>
      )}

      {tab === "bundle" && (
        <div className="hairline-card p-3">
          <div className="flex items-center justify-between">
            <Eyebrow>prompt bundle</Eyebrow>
            {run.compiled_prompt_hash && (
              <span className="font-mono text-[10px] text-ink-3">
                sha {run.compiled_prompt_hash}
              </span>
            )}
          </div>
          {detail.prompt_bundle ? (
            <pre className="blob mt-2 max-h-96 overflow-auto">
              {JSON.stringify(detail.prompt_bundle, null, 2)}
            </pre>
          ) : (
            <div className="mt-2 text-[12.5px] text-ink-2">
              Baseline runs have no compiled bundle — the raw request plus pasted notes went to the
              provider unchanged.
            </div>
          )}
        </div>
      )}

      {tab === "tokens" && (
        <div className="hairline-card p-4">
          <Eyebrow>token comparison</Eyebrow>
          <div className="mt-3">
            <TokenMeter
              baseline={run.baseline_token_estimate}
              compiled={run.token_estimate_input}
              budget={1500}
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-3">
            <TokenStat label="input (actual)" value={run.token_actual_input} />
            <TokenStat label="output" value={run.token_actual_output} />
            <TokenStat label="cost est." value={`$${run.cost_estimate}`} />
          </div>
        </div>
      )}
    </div>
  );
}

function TokenStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className="mt-0.5 font-mono text-[13px] font-semibold">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

export function RunHeader({ detail }: { detail: any }) {
  const run = detail.run;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <StatusStamp status={run.status} large />
      <span className="rounded-[3px] border border-line-2 bg-card px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-2">
        {run.run_mode === "baseline" ? "raw baseline" : "enterprise mind"}
      </span>
      {detail.skill && (
        <span className="font-mono text-[11px] text-ink-2">
          {detail.skill.slug}@{detail.skill.version}
        </span>
      )}
      <span className="font-mono text-[11px] text-ink-3">
        {run.provider}/{run.model}
      </span>
      {run.repairs_applied > 0 && (
        <span className="rounded-[3px] bg-warn-tint px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-warn">
          {run.repairs_applied} repair applied
        </span>
      )}
    </div>
  );
}

export function OutputPanel({ detail }: { detail: any }) {
  const artifacts = detail.artifacts ?? [];
  const preRepair = artifacts.find((a: any) => !a.is_final);
  const [showOriginal, setShowOriginal] = useState(false);
  const content = showOriginal && preRepair ? preRepair.content : detail.final_output;
  return (
    <div className="hairline-card">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <Eyebrow>output artifact · markdown</Eyebrow>
        <div className="flex items-center gap-2">
          {preRepair && detail.run.repairs_applied > 0 && (
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="rounded border border-line-2 px-2 py-0.5 font-mono text-[10px] text-ink-2 hover:border-ink"
            >
              {showOriginal ? "show repaired" : "show pre-repair"}
            </button>
          )}
          <StatusStamp status={detail.final_status ?? "pending"} />
        </div>
      </div>
      <div className="px-5 py-4">{content && <Memo>{content}</Memo>}</div>
    </div>
  );
}
