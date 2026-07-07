"use client";

import { Suspense, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { api, pct } from "@/lib/api";
import { useProject } from "@/components/providers";
import { Eyebrow, Spinner, StatusStamp } from "@/components/ui";
import { OutputPanel, RunHeader, RunInspector } from "@/components/run-inspector";

/* eslint-disable @typescript-eslint/no-explicit-any */

function ChatInner() {
  const { projectId } = useProject();
  const params = useSearchParams();
  const [request, setRequest] = useState(params.get("q") ?? "make this client ready");
  const [provider, setProvider] = useState("mock");
  const [baseline, setBaseline] = useState<any>(null);
  const [enterprise, setEnterprise] = useState<any>(null);
  const [inspecting, setInspecting] = useState<"baseline" | "enterprise" | null>(null);

  const { data: preview } = useQuery({
    queryKey: ["preview", projectId, request],
    queryFn: () => api.preview(projectId, request),
    enabled: request.length > 2,
  });

  const baselineRun = useMutation({
    mutationFn: () => api.runBaseline(projectId, request, provider),
    onSuccess: setBaseline,
  });
  const enterpriseRun = useMutation({
    mutationFn: () => api.runEnterprise(projectId, request, provider),
    onSuccess: (d) => {
      setEnterprise(d);
      setInspecting(null);
    },
  });

  const active = inspecting === "baseline" ? baseline : inspecting === "enterprise" ? enterprise : null;
  const shown = enterprise ?? baseline;

  return (
    <div className="space-y-4">
      {/* Task entry */}
      <div className="hairline-card p-4">
        <Eyebrow>task</Eyebrow>
        <textarea
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          rows={2}
          placeholder="Ask anything. Enterprise Mind will add the right context, skill, and rails."
          className="mt-2 w-full resize-none rounded border border-line-2 bg-paper px-3 py-2 text-[14px] focus:border-ink"
        />
        {/* Context pill — what a run would use, before you spend a token */}
        {preview && (
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-ink-2">
            <span className="rounded-full border border-line-2 bg-paper px-2.5 py-1">
              Using: <span className="font-semibold text-ink">{preview.route.project_name}</span>
              {preview.skill_name && (
                <>
                  {" · "}
                  <span className="font-semibold text-ink">
                    {preview.skill_name} v{preview.skill_version}
                  </span>
                </>
              )}
              {" · "}
              {preview.context_pack_tokens.toLocaleString()} context tokens
            </span>
            <span className="text-ink-3">
              raw paste would be ~{preview.baseline_estimate.toLocaleString()} tokens
            </span>
            {preview.route.confidence !== "high" && (
              <span className="text-warn">no installed skill matched — generic contract</span>
            )}
          </div>
        )}
        <div className="mt-3 flex items-center gap-2">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="rounded border border-line-2 bg-card px-2 py-1.5 text-[12.5px]"
          >
            <option value="mock">Mock (deterministic demo)</option>
            <option value="anthropic">Claude (BYO key)</option>
            <option value="openai">OpenAI (BYO key)</option>
          </select>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => baselineRun.mutate()}
              disabled={baselineRun.isPending}
              className="rounded border border-line-2 bg-card px-3.5 py-1.5 text-[13px] font-semibold text-ink-2 hover:border-ink hover:text-ink disabled:opacity-50"
            >
              Run raw baseline
            </button>
            <button
              onClick={() => enterpriseRun.mutate()}
              disabled={enterpriseRun.isPending}
              className="rounded bg-ink px-3.5 py-1.5 text-[13px] font-semibold text-white hover:bg-ink/90 disabled:opacity-50"
            >
              Run with Enterprise Mind
            </button>
          </div>
        </div>
        {(baselineRun.isPending || enterpriseRun.isPending) && (
          <div className="mt-3">
            <Spinner
              label={
                baselineRun.isPending
                  ? "running raw baseline (request + full notes dump)…"
                  : "routing intent → compiling context pack → applying skill → harness…"
              }
            />
          </div>
        )}
        {(baselineRun.error || enterpriseRun.error) && (
          <div className="mt-3 rounded border border-fail/30 bg-fail-tint px-3 py-2 text-[12.5px] text-fail">
            {String(baselineRun.error ?? enterpriseRun.error)}
          </div>
        )}
      </div>

      {/* Comparison strip */}
      {baseline && enterprise && <ComparisonStrip baseline={baseline} enterprise={enterprise} />}

      {/* Result cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {[
          ["baseline", baseline, "Raw baseline"],
          ["enterprise", enterprise, "Enterprise Mind"],
        ].map(([key, detail, title]: any) =>
          detail ? (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold">{title}</span>
                  <RunBadge detail={detail} />
                </div>
                <button
                  onClick={() => setInspecting(inspecting === key ? null : key)}
                  className="font-mono text-[11px] text-ink-2 underline hover:text-ink"
                >
                  {inspecting === key ? "close inspector" : "inspect run"}
                </button>
              </div>
              <OutputPanel detail={detail} />
            </div>
          ) : (
            <div key={key} className="hidden lg:block" />
          )
        )}
      </div>

      {/* Inspector drawer */}
      {active && (
        <div className="fixed inset-y-0 right-0 z-30 w-[520px] overflow-y-auto border-l border-line bg-paper shadow-xl">
          <div className="sticky top-0 flex items-center justify-between border-b border-line bg-card px-4 py-3">
            <div>
              <Eyebrow>run inspector</Eyebrow>
              <div className="mt-1">
                <RunHeader detail={active} />
              </div>
            </div>
            <button
              onClick={() => setInspecting(null)}
              className="rounded border border-line-2 px-2 py-1 font-mono text-[11px] hover:border-ink"
            >
              esc ✕
            </button>
          </div>
          <div className="p-4">
            <RunInspector detail={active} />
          </div>
        </div>
      )}

      {!shown && (
        <div className="hairline-card px-6 py-12 text-center">
          <div className="text-[15px] font-semibold">Run the same vague request both ways.</div>
          <div className="mx-auto mt-1 max-w-md text-[13px] text-ink-2">
            The baseline pastes the full notes dump under &ldquo;{request || "your request"}&rdquo;.
            Enterprise Mind routes it to a project, compiles a compact context pack, applies the
            installed skill, and validates the output deterministically.
          </div>
        </div>
      )}
    </div>
  );
}

function RunBadge({ detail }: { detail: any }) {
  const run = detail.run;
  return (
    <span className="flex items-center gap-2">
      <StatusStamp status={run.status} />
      <span className="font-mono text-[11px] text-ink-2">
        {run.harness_pass_count}/{run.harness_pass_count + run.harness_fail_count} checks
      </span>
    </span>
  );
}

function ComparisonStrip({ baseline, enterprise }: { baseline: any; enterprise: any }) {
  const b = baseline.run;
  const e = enterprise.run;
  const saved = e.baseline_token_estimate - e.token_estimate_input;
  const savedPct = pct(saved, e.baseline_token_estimate);
  const bTotal = b.harness_pass_count + b.harness_fail_count;
  const eTotal = e.harness_pass_count + e.harness_fail_count;
  return (
    <div className="hairline-card grid divide-x divide-line md:grid-cols-3">
      <Stat
        label="context tokens"
        value={`−${savedPct}%`}
        sub={`${b.token_estimate_input.toLocaleString()} → ${e.token_estimate_input.toLocaleString()} tok`}
        good
      />
      <Stat
        label="harness pass rate"
        value={`${b.harness_pass_count}/${bTotal} → ${e.harness_pass_count}/${eTotal}`}
        sub={e.repairs_applied > 0 ? `incl. ${e.repairs_applied} deterministic repair` : "no repairs needed"}
        good={e.harness_fail_count === 0}
      />
      <Stat
        label="verdict"
        value={e.harness_fail_count === 0 ? "client-ready" : "needs work"}
        sub={
          b.harness_fail_count > 0
            ? `baseline failed ${b.harness_fail_count} deterministic checks`
            : "baseline also passed"
        }
        good={e.harness_fail_count === 0}
      />
    </div>
  );
}

function Stat({ label, value, sub, good }: { label: string; value: string; sub: string; good?: boolean }) {
  return (
    <div className="px-4 py-3">
      <div className="eyebrow">{label}</div>
      <div className={`mt-1 font-mono text-[19px] font-semibold ${good ? "text-pass" : "text-ink"}`}>
        {value}
      </div>
      <div className="text-[11.5px] text-ink-2">{sub}</div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatInner />
    </Suspense>
  );
}
