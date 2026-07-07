"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useProject, useProjects } from "@/components/providers";
import { Eyebrow, Memo, StatusStamp, ValidatorRow } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function SkillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { projectId } = useProject();
  const { data: projects } = useProjects();
  const qc = useQueryClient();
  const { data: skill } = useQuery({ queryKey: ["skill", id], queryFn: () => api.skill(id) });
  const [tab, setTab] = useState("overview");
  const [harnessResult, setHarnessResult] = useState<any>(null);

  const install = useMutation({
    mutationFn: () => api.installSkill(id, projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skill", id] });
      qc.invalidateQueries({ queryKey: ["skills"] });
    },
  });
  const runHarness = useMutation({
    mutationFn: () => api.runHarness(skill.harness.id),
    onSuccess: setHarnessResult,
  });

  if (!skill) return null;
  const current = skill.versions.find((v: any) => v.id === skill.current_version_id) ?? skill.versions[0];
  const installedHere = skill.metrics.installs.includes(projectId);
  const projectName = (projects ?? []).find((p: any) => p.id === projectId)?.name ?? projectId;

  const tabs = [
    ["overview", "Overview"],
    ["skillmd", "SKILL.md"],
    ["manifest", "Manifest"],
    ["validators", "Validators"],
    ["versions", "Versions"],
  ];

  return (
    <div className="space-y-4">
      <Link href="/skills" className="font-mono text-[11px] text-ink-2 underline">
        ← skill library
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow>skill · {skill.slug}</Eyebrow>
          <h1 className="mt-1 text-[19px] font-extrabold tracking-tight">{skill.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <StatusStamp status={skill.status} />
            <span className="font-mono text-[11px] text-ink-2">
              v{current?.version_semver} · by {skill.owner_label} · visibility: {skill.visibility}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {skill.harness && (
            <button
              onClick={() => runHarness.mutate()}
              disabled={runHarness.isPending}
              className="rounded border border-line-2 bg-card px-3 py-1.5 text-[12.5px] font-semibold text-ink-2 hover:border-ink hover:text-ink disabled:opacity-50"
            >
              Run harness
            </button>
          )}
          {installedHere ? (
            <span className="rounded-[3px] bg-pass-tint px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-pass">
              installed in {projectName}
            </span>
          ) : skill.status === "approved" ? (
            <button
              onClick={() => install.mutate()}
              disabled={install.isPending}
              className="rounded bg-ink px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-ink/90 disabled:opacity-50"
            >
              Install into {projectName}
            </button>
          ) : null}
        </div>
      </div>

      {install.isSuccess && (
        <div className="rounded border border-pass/30 bg-pass-tint px-3 py-2 text-[12.5px] text-pass">
          Installed. Structure, schema, validators, and rails transferred — no content from the
          owner&rsquo;s project. Runs in {projectName} now use its local context pack.
        </div>
      )}

      {harnessResult && (
        <div className="hairline-card">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <Eyebrow>harness run · against current version&rsquo;s output</Eyebrow>
            <span className="font-mono text-[11px]">
              <span className="font-semibold text-pass">{harnessResult.summary.passed}</span>
              <span className="text-ink-3">/{harnessResult.summary.total} pass</span>
            </span>
          </div>
          {harnessResult.results.map((r: any, i: number) => (
            <ValidatorRow key={i} result={r} />
          ))}
        </div>
      )}

      <div className="flex gap-1 border-b border-line">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-2 text-[12.5px] ${
              tab === key ? "-mb-px border-b-2 border-ink font-semibold" : "text-ink-2 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="hairline-card p-4">
            <Eyebrow>output contract</Eyebrow>
            <ul className="mt-2 space-y-1 text-[13px]">
              {(current?.output_schema_json?.required_sections ?? []).map((s: string) => (
                <li key={s} className="font-mono text-[12px]">
                  ## {s}
                </li>
              ))}
            </ul>
            <div className="mt-2 font-mono text-[11px] text-ink-2">
              ≤ {current?.output_schema_json?.max_bullets_per_section} bullets/section · ≤{" "}
              {current?.output_schema_json?.max_words} words · budget {current?.token_budget} tok
            </div>
          </div>
          <div className="hairline-card p-4">
            <Eyebrow>rails</Eyebrow>
            <ul className="mt-2 space-y-1.5">
              {(current?.rails_json ?? []).map((r: string, i: number) => (
                <li key={i} className="text-[12.5px]">
                  <span className={`font-mono text-[10px] font-bold ${r.startsWith("MUST NOT") ? "text-fail" : "text-pass"}`}>
                    {r.split(":")[0]}
                  </span>
                  <span className="text-ink-2">:{r.split(":").slice(1).join(":")}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="hairline-card p-4 lg:col-span-2">
            <Eyebrow>examples</Eyebrow>
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              {(current?.examples_json ?? []).map((e: any, i: number) => (
                <div key={i} className={`rounded border p-3 ${e.kind === "good" ? "border-pass/30 bg-pass-tint" : "border-fail/30 bg-fail-tint"}`}>
                  <div className={`eyebrow ${e.kind === "good" ? "!text-pass" : "!text-fail"}`}>
                    {e.kind} — {e.note}
                  </div>
                  <div className="mt-1.5 text-[12.5px]">{e.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "skillmd" && (
        <div className="hairline-card px-5 py-4">
          <Memo>{current?.skill_md ?? ""}</Memo>
        </div>
      )}

      {tab === "manifest" && (
        <div className="hairline-card p-4">
          <Eyebrow>skill.yaml · checksum {current?.checksum}</Eyebrow>
          <pre className="blob mt-2">{current?.manifest_yaml}</pre>
        </div>
      )}

      {tab === "validators" && (
        <div className="space-y-4">
          <div className="hairline-card p-4">
            <Eyebrow>validators (run on every output)</Eyebrow>
            <pre className="blob mt-2">{JSON.stringify(current?.validators_json, null, 2)}</pre>
          </div>
          <div className="hairline-card p-4">
            <Eyebrow>harness cases</Eyebrow>
            {(skill.harness_cases ?? []).map((c: any) => (
              <div key={c.id} className="mt-2 rounded border border-line bg-paper p-3">
                <div className="font-mono text-[11.5px] font-semibold">{c.name}</div>
                <pre className="blob mt-1 text-ink-2">
                  {JSON.stringify(c.expected_properties_json, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "versions" && (
        <div className="hairline-card divide-y divide-line">
          {skill.versions.map((v: any) => (
            <div key={v.id} className="flex items-center gap-3 px-4 py-3">
              <span className="font-mono text-[13px] font-bold">v{v.version_semver}</span>
              {v.id === skill.current_version_id && (
                <span className="rounded-[3px] bg-pass-tint px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-pass">
                  current
                </span>
              )}
              <span className="text-[12.5px] text-ink-2">{v.release_notes}</span>
              <span className="ml-auto font-mono text-[10.5px] text-ink-3">
                {v.approved_by ? `approved by ${v.approved_by}` : "unapproved"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
