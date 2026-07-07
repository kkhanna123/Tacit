"use client";

import ReactMarkdown from "react-markdown";

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="eyebrow">{children}</div>;
}

const STATUS_STYLES: Record<string, string> = {
  passed: "bg-pass-tint text-pass border-pass/30",
  repaired: "bg-pass-tint text-pass border-pass/30",
  failed: "bg-fail-tint text-fail border-fail/30",
  running: "bg-warn-tint text-warn border-warn/30",
  proposed: "bg-warn-tint text-warn border-warn/30",
  approved: "bg-pass-tint text-pass border-pass/30",
  rejected: "bg-fail-tint text-fail border-fail/30",
  review: "bg-warn-tint text-warn border-warn/30",
  draft: "bg-paper text-ink-2 border-line-2",
  deprecated: "bg-paper text-ink-3 border-line-2",
};

export function StatusStamp({ status, large }: { status: string; large?: boolean }) {
  const style = STATUS_STYLES[status] ?? "bg-paper text-ink-2 border-line-2";
  return (
    <span
      className={`inline-flex items-center border font-mono font-semibold uppercase tracking-[0.12em] ${style} ${
        large ? "px-2.5 py-1 text-[11px]" : "px-1.5 py-0.5 text-[9.5px]"
      } rounded-[3px]`}
    >
      {status}
    </span>
  );
}

export function PassDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-flex h-4 w-4 items-center justify-center rounded-full font-mono text-[9px] font-bold ${
        ok ? "bg-pass text-white" : "bg-fail text-white"
      }`}
      aria-label={ok ? "pass" : "fail"}
    >
      {ok ? "✓" : "✕"}
    </span>
  );
}

export function TokenMeter({
  baseline,
  compiled,
  budget,
}: {
  baseline: number;
  compiled: number;
  budget?: number;
}) {
  const max = Math.max(baseline, compiled, 1);
  const saved = baseline - compiled;
  const savedPct = baseline ? Math.round((saved / baseline) * 100) : 0;
  return (
    <div className="space-y-2">
      <Row label="raw baseline" value={baseline} max={max} tone="fail" />
      <Row label="compiled" value={compiled} max={max} tone="pass" budget={budget} />
      {saved > 0 && (
        <div className="font-mono text-[11px] text-pass">
          −{saved.toLocaleString()} tokens ({savedPct}% smaller)
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  max,
  tone,
  budget,
}: {
  label: string;
  value: number;
  max: number;
  tone: "pass" | "fail";
  budget?: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="eyebrow">{label}</span>
        <span className="font-mono text-[11px] text-ink">
          {value.toLocaleString()} tok
          {budget ? <span className="text-ink-3"> / {budget.toLocaleString()} budget</span> : null}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-line">
        <div
          className={`h-1.5 rounded-full ${tone === "pass" ? "bg-pass" : "bg-fail/70"}`}
          style={{ width: `${Math.max(3, (value / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}

export function Memo({ children }: { children: string }) {
  return (
    <div className="memo text-[13.5px]">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}

export function ValidatorRow({ result }: { result: Record<string, unknown> }) {
  const ok = result.status === "pass";
  const evidence = (result.evidence as string[]) ?? [];
  return (
    <div className="flex gap-2.5 border-b border-line px-3 py-2.5 last:border-0">
      <div className="pt-0.5">
        <PassDot ok={ok} />
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-semibold">{result.label as string}</span>
          <span className="font-mono text-[10px] text-ink-3">{result.validator as string}</span>
        </div>
        <div className="text-[12.5px] text-ink-2">{result.details as string}</div>
        {evidence.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {evidence.map((e, i) => (
              <li key={i} className="font-mono text-[11px] text-fail">
                {e}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[11px] text-ink-2">
      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-line-2 border-t-ink" />
      {label}
    </div>
  );
}

export function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="hairline-card px-6 py-10 text-center">
      <div className="text-[14px] font-semibold">{title}</div>
      <div className="mt-1 text-[12.5px] text-ink-2">{hint}</div>
    </div>
  );
}
