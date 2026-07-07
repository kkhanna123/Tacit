"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Eyebrow, StatusStamp } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function HomePage() {
  const router = useRouter();
  const [task, setTask] = useState("");
  const { data: metrics } = useQuery({ queryKey: ["metrics"], queryFn: api.metrics });
  const { data: runs } = useQuery({ queryKey: ["runs"], queryFn: () => api.runs() });
  const { data: skills } = useQuery({ queryKey: ["skills"], queryFn: api.skills });
  const { data: learnings } = useQuery({ queryKey: ["learnings"], queryFn: api.learnings });

  const pending = (learnings ?? []).filter((l: any) => l.status === "proposed");

  return (
    <div className="space-y-5">
      {/* Start a task */}
      <div className="hairline-card p-5">
        <h1 className="text-[19px] font-extrabold tracking-tight">Start a task</h1>
        <p className="mt-0.5 text-[13px] text-ink-2">
          One vague request in — a routed, context-minimal, harness-tested output back.
        </p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/chat?q=${encodeURIComponent(task || "make this client ready")}`);
          }}
        >
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Ask anything. Enterprise Mind will add the right context, skill, and rails."
            className="flex-1 rounded border border-line-2 bg-paper px-3 py-2 text-[14px] focus:border-ink"
          />
          <button className="rounded bg-ink px-4 py-2 text-[13px] font-semibold text-white hover:bg-ink/90">
            Open in Chat
          </button>
        </form>
      </div>

      {/* This week */}
      <div className="grid gap-4 md:grid-cols-4">
        <Tile
          label="tokens saved vs baseline"
          value={(metrics?.usage?.tokens_saved_vs_baseline ?? 0).toLocaleString()}
          good
        />
        <Tile
          label="harness pass rate"
          value={metrics?.quality?.pass_rate != null ? `${Math.round(metrics.quality.pass_rate * 100)}%` : "—"}
          good={metrics?.quality?.pass_rate >= 0.8}
        />
        <Tile label="runs" value={String(metrics?.usage?.total_runs ?? 0)} />
        <Tile label="learnings pending approval" value={String(pending.length)} warn={pending.length > 0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent runs */}
        <section className="hairline-card">
          <SectionHead title="Recent runs" href="/runs" />
          {(runs ?? []).slice(0, 5).map((r: any) => (
            <Link
              key={r.id}
              href={`/runs/${r.id}`}
              className="flex items-center gap-3 border-t border-line px-4 py-2.5 hover:bg-paper"
            >
              <StatusStamp status={r.status} />
              <span className="truncate text-[13px]">{r.raw_user_request}</span>
              <span className="ml-auto shrink-0 font-mono text-[10.5px] text-ink-3">
                {r.run_mode === "baseline" ? "baseline" : r.skill_name ?? "generic"}
              </span>
            </Link>
          ))}
          {(runs ?? []).length === 0 && (
            <div className="border-t border-line px-4 py-6 text-[12.5px] text-ink-2">
              No runs yet. Open Chat and run the demo request both ways.
            </div>
          )}
        </section>

        {/* Installed skills */}
        <section className="hairline-card">
          <SectionHead title="Skill library" href="/skills" />
          {(skills ?? []).map((s: any) => (
            <Link
              key={s.id}
              href={`/skills/${s.id}`}
              className="flex items-center gap-3 border-t border-line px-4 py-2.5 hover:bg-paper"
            >
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold">{s.name}</div>
                <div className="font-mono text-[10.5px] text-ink-3">
                  v{s.current_version} · {s.owner_label} · installed in {s.metrics.installs.length}{" "}
                  project{s.metrics.installs.length === 1 ? "" : "s"}
                </div>
              </div>
              <span className="ml-auto shrink-0">
                <StatusStamp status={s.status} />
              </span>
            </Link>
          ))}
        </section>
      </div>

      {/* Pending learnings */}
      {pending.length > 0 && (
        <section className="hairline-card border-warn/40">
          <SectionHead title="Learnings awaiting approval" href="/admin" />
          {pending.map((l: any) => (
            <div key={l.id} className="border-t border-line px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="rounded-[3px] bg-paper px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-ink-2">
                  {l.learning_type}
                </span>
                <span className="text-[13px] font-semibold">{l.title}</span>
              </div>
              <div className="mt-0.5 line-clamp-2 text-[12.5px] text-ink-2">{l.body}</div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function Tile({ label, value, good, warn }: { label: string; value: string; good?: boolean; warn?: boolean }) {
  return (
    <div className="hairline-card px-4 py-3">
      <div className="eyebrow">{label}</div>
      <div
        className={`mt-1 font-mono text-[22px] font-semibold tracking-tight ${
          warn ? "text-warn" : good ? "text-pass" : "text-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function SectionHead({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <h2 className="text-[13.5px] font-bold">{title}</h2>
      <Link href={href} className="font-mono text-[11px] text-ink-2 underline hover:text-ink">
        view all →
      </Link>
    </div>
  );
}
