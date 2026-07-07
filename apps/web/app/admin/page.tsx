"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Eyebrow, StatusStamp } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function AdminPage() {
  const qc = useQueryClient();
  const { data: m } = useQuery({ queryKey: ["metrics"], queryFn: api.metrics });
  const { data: learnings } = useQuery({ queryKey: ["learnings"], queryFn: api.learnings });
  const { data: audit } = useQuery({ queryKey: ["audit"], queryFn: api.auditEvents });
  const [promotion, setPromotion] = useState<any>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["learnings"] });
    qc.invalidateQueries({ queryKey: ["metrics"] });
    qc.invalidateQueries({ queryKey: ["audit"] });
    qc.invalidateQueries({ queryKey: ["skills"] });
  };
  const approve = useMutation({
    mutationFn: (id: string) => api.approveLearning(id),
    onSuccess: (d) => {
      setPromotion(d.promotion);
      refresh();
    },
  });
  const reject = useMutation({ mutationFn: (id: string) => api.rejectLearning(id), onSuccess: refresh });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[19px] font-extrabold tracking-tight">Admin</h1>
        <p className="text-[13px] text-ink-2">
          Usage, quality, and the approval gate for everything that generalizes across seats.
        </p>
      </header>

      {/* Usage */}
      <div className="grid gap-4 md:grid-cols-5">
        <Tile label="total runs" value={String(m?.usage?.total_runs ?? 0)} />
        <Tile label="tokens saved" value={(m?.usage?.tokens_saved_vs_baseline ?? 0).toLocaleString()} good />
        <Tile label="pass rate" value={m?.quality?.pass_rate != null ? `${Math.round(m.quality.pass_rate * 100)}%` : "—"} good={m?.quality?.pass_rate >= 0.8} />
        <Tile label="repair rate" value={m?.quality?.repair_rate != null ? `${Math.round(m.quality.repair_rate * 100)}%` : "—"} />
        <Tile label="cost est." value={`$${m?.usage?.cost_estimate ?? 0}`} />
      </div>

      {/* Learnings queue */}
      <section className="hairline-card">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-[13.5px] font-bold">Learning queue</h2>
          <span className="font-mono text-[10.5px] text-ink-3">
            {m?.learnings?.proposed ?? 0} proposed · {m?.learnings?.approved ?? 0} approved ·{" "}
            {m?.learnings?.rejected ?? 0} rejected
          </span>
        </div>
        {(learnings ?? []).map((l: any) => (
          <div key={l.id} className="border-b border-line px-4 py-3 last:border-0">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-[3px] border border-line bg-paper px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-ink-2">
                    {l.learning_type}
                  </span>
                  <span className="text-[13.5px] font-semibold">{l.title}</span>
                  <StatusStamp status={l.status} />
                  <span className="font-mono text-[10px] text-ink-3">
                    confidence {Math.round(l.confidence * 100)}% · by {l.proposed_by}
                  </span>
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{l.body}</p>
                <details className="mt-1.5">
                  <summary className="cursor-pointer font-mono text-[10.5px] text-ink-3 hover:text-ink">
                    evidence
                  </summary>
                  <pre className="blob mt-1 rounded border border-line bg-paper p-2">
                    {JSON.stringify(l.evidence_json, null, 2)}
                  </pre>
                </details>
              </div>
              {l.status === "proposed" && (
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => approve.mutate(l.id)}
                    disabled={approve.isPending}
                    className="rounded bg-pass px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    Approve &amp; promote
                  </button>
                  <button
                    onClick={() => reject.mutate(l.id)}
                    disabled={reject.isPending}
                    className="rounded border border-line-2 px-3 py-1.5 text-[12px] font-semibold text-ink-2 hover:border-fail hover:text-fail disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </section>

      {promotion && (
        <div className="rounded border border-pass/30 bg-pass-tint px-4 py-3 text-[12.5px] text-pass">
          <span className="font-semibold">Promoted.</span>{" "}
          {promotion.new_version
            ? `${promotion.skill} bumped to v${promotion.new_version} — future runs use the new contract.`
            : promotion.rail
            ? `Rail added to ${promotion.target}.`
            : promotion.patch
            ? `System instructions patched on ${promotion.skill}.`
            : "Applied."}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Skills table */}
        <section className="hairline-card self-start">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-[13.5px] font-bold">Skills</h2>
          </div>
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-line">
                {["skill", "owner", "runs", "pass", "savings", "installs"].map((h) => (
                  <th key={h} className="px-3 py-1.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-ink-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(m?.skills ?? []).map((s: any) => (
                <tr key={s.id} className="border-b border-line last:border-0">
                  <td className="px-3 py-2 font-semibold">{s.name}</td>
                  <td className="px-3 py-2 text-ink-2">{s.owner}</td>
                  <td className="px-3 py-2 font-mono">{s.runs}</td>
                  <td className="px-3 py-2 font-mono">
                    {s.pass_rate != null ? `${Math.round(s.pass_rate * 100)}%` : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-pass">
                    {s.avg_token_savings_pct != null ? `−${s.avg_token_savings_pct}%` : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono">{s.installs.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-line px-4 py-2.5">
            <Eyebrow>common failures</Eyebrow>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {(m?.quality?.common_failures ?? []).map((f: any) => (
                <span key={f.label} className="rounded-[3px] bg-fail-tint px-1.5 py-0.5 font-mono text-[10.5px] text-fail">
                  {f.label} ×{f.count}
                </span>
              ))}
              {(m?.quality?.common_failures ?? []).length === 0 && (
                <span className="text-[12px] text-ink-3">none recorded yet</span>
              )}
            </div>
          </div>
        </section>

        {/* Access + audit */}
        <section className="space-y-4 self-start">
          <div className="hairline-card">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-[13.5px] font-bold">Access</h2>
            </div>
            {(m?.access?.users ?? []).map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 border-b border-line px-4 py-2 last:border-0">
                <span className="text-[13px] font-semibold">{u.name}</span>
                <span className="font-mono text-[10.5px] text-ink-3">{u.email}</span>
                <span className="ml-auto rounded-[3px] border border-line bg-paper px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-ink-2">
                  {u.role}
                </span>
              </div>
            ))}
          </div>
          <div className="hairline-card">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-[13.5px] font-bold">Audit trail</h2>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {(audit ?? []).map((e: any) => (
                <div key={e.id} className="border-b border-line px-4 py-1.5 font-mono text-[10.5px] last:border-0">
                  <span className="text-ink-3">{new Date(e.created_at + "Z").toLocaleTimeString()}</span>{" "}
                  <span className="font-semibold text-ink">{e.action}</span>{" "}
                  <span className="text-ink-2">
                    {e.object_type}:{e.object_id.slice(0, 18)}
                  </span>{" "}
                  <span className="text-ink-3">by {e.actor_user_id}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Tile({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="hairline-card px-4 py-3">
      <div className="eyebrow">{label}</div>
      <div className={`mt-1 font-mono text-[20px] font-semibold tracking-tight ${good ? "text-pass" : "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}
