"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useProject, useProjects } from "@/components/providers";
import { Eyebrow, StatusStamp } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function SkillsPage() {
  const { projectId } = useProject();
  const { data: projects } = useProjects();
  const { data: skills } = useQuery({ queryKey: ["skills"], queryFn: api.skills });
  const qc = useQueryClient();

  const install = useMutation({
    mutationFn: (skillId: string) => api.installSkill(skillId, projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["skills"] }),
  });

  const projectName = (projects ?? []).find((p: any) => p.id === projectId)?.name ?? projectId;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[19px] font-extrabold tracking-tight">Skill Library</h1>
        <p className="text-[13px] text-ink-2">
          Reusable workflows. Installing a skill transfers structure, validators, and rails — never
          another project&rsquo;s content.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {(skills ?? []).map((s: any) => {
          const installedHere = s.metrics.installs.includes(projectId);
          return (
            <div key={s.id} className="hairline-card flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Eyebrow>skill · v{s.current_version}</Eyebrow>
                  <Link href={`/skills/${s.id}`} className="mt-0.5 block text-[15px] font-bold hover:underline">
                    {s.name}
                  </Link>
                  <div className="font-mono text-[10.5px] text-ink-3">
                    by {s.owner_label} · {s.slug}
                  </div>
                </div>
                <StatusStamp status={s.status} />
              </div>
              <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-ink-2">{s.description}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3">
                <Metric label="pass rate" value={s.metrics.pass_rate != null ? `${Math.round(s.metrics.pass_rate * 100)}%` : "—"} />
                <Metric label="avg savings" value={s.metrics.avg_token_savings_pct != null ? `−${s.metrics.avg_token_savings_pct}%` : "—"} />
                <Metric label="installs" value={String(s.metrics.installs.length)} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                {installedHere ? (
                  <span className="rounded-[3px] bg-pass-tint px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-pass">
                    installed in {projectName}
                  </span>
                ) : s.status === "approved" ? (
                  <button
                    onClick={() => install.mutate(s.id)}
                    disabled={install.isPending}
                    className="rounded bg-ink px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-ink/90 disabled:opacity-50"
                  >
                    Install into {projectName}
                  </button>
                ) : (
                  <span className="font-mono text-[10.5px] text-ink-3">
                    pending org review — not installable
                  </span>
                )}
                <Link href={`/skills/${s.id}`} className="ml-auto font-mono text-[11px] text-ink-2 underline hover:text-ink">
                  details →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className="font-mono text-[13px] font-semibold">{value}</div>
    </div>
  );
}
