"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Empty, StatusStamp } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function RunsPage() {
  const { data: runs } = useQuery({ queryKey: ["runs"], queryFn: () => api.runs() });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[19px] font-extrabold tracking-tight">Runs</h1>
        <p className="text-[13px] text-ink-2">
          Every execution is logged, inspectable, and compared against its raw-baseline estimate.
        </p>
      </header>

      {(runs ?? []).length === 0 ? (
        <Empty title="No runs yet" hint="Open Chat and run a task to create the first run record." />
      ) : (
        <div className="hairline-card overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-line">
                {["time", "mode", "request", "project", "skill", "tok in", "tok out", "baseline est", "checks", "saved"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(runs ?? []).map((r: any) => (
                <tr key={r.id} className="border-b border-line last:border-0 hover:bg-paper">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-ink-2">
                    {new Date(r.created_at + "Z").toLocaleTimeString()}
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-mono text-[10.5px] uppercase text-ink-2">
                      {r.run_mode === "baseline" ? "baseline" : "e-mind"}
                    </span>
                  </td>
                  <td className="max-w-56 truncate px-3 py-2">
                    <Link href={`/runs/${r.id}`} className="font-semibold hover:underline">
                      {r.raw_user_request}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-ink-2">{r.project_name}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-ink-2">
                    {r.skill_name ? `${r.skill_name} v${r.skill_version}` : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px]">{r.token_estimate_input.toLocaleString()}</td>
                  <td className="px-3 py-2 font-mono text-[11px]">{r.token_actual_output.toLocaleString()}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-ink-2">
                    {r.baseline_token_estimate.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <StatusStamp status={r.status} />
                    <span className="ml-1.5 font-mono text-[10.5px] text-ink-2">
                      {r.harness_pass_count}/{r.harness_pass_count + r.harness_fail_count}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px]">
                    {r.tokens_saved > 0 ? (
                      <span className="font-semibold text-pass">−{r.tokens_saved.toLocaleString()}</span>
                    ) : (
                      <span className="text-ink-3">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
