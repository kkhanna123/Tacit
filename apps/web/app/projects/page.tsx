"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useProject } from "@/components/providers";
import { Eyebrow } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function ProjectsPage() {
  const { projectId, setProjectId } = useProject();
  const router = useRouter();
  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: api.projects });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[19px] font-extrabold tracking-tight">Projects</h1>
        <p className="text-[13px] text-ink-2">
          Hard walls between workspaces. Skills cross them by approval; content never does.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {(projects ?? []).map((p: any) => (
          <div key={p.id} className={`hairline-card p-4 ${p.id === projectId ? "border-ink" : ""}`}>
            <Eyebrow>project · {p.department}</Eyebrow>
            <div className="mt-1 flex items-center gap-2">
              <h2 className="text-[15px] font-bold">{p.name}</h2>
              {p.id === projectId && (
                <span className="rounded-[3px] bg-ink px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-white">
                  active
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">{p.description}</p>
            <div className="mt-3 flex items-center gap-4 border-t border-line pt-3 font-mono text-[11px] text-ink-2">
              <span>{p.installed_skills} skills installed</span>
              <span>{p.run_count} runs</span>
              <span className="uppercase">{p.default_provider}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  setProjectId(p.id);
                  router.push("/chat");
                }}
                className="rounded bg-ink px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-ink/90"
              >
                Work in this project
              </button>
              <button
                onClick={() => {
                  setProjectId(p.id);
                  router.push("/intent-tree");
                }}
                className="rounded border border-line-2 bg-card px-3 py-1.5 text-[12px] font-semibold text-ink-2 hover:border-ink hover:text-ink"
              >
                Intent tree
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
