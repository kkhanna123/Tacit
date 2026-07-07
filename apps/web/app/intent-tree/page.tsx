"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useProject } from "@/components/providers";
import { Eyebrow, Spinner } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */

const TYPE_ORDER = ["org", "department", "project", "workflow", "artifact", "guardrail", "source"];

export default function IntentTreePage() {
  const { projectId } = useProject();
  const qc = useQueryClient();
  const { data: nodes } = useQuery({
    queryKey: ["intent", projectId],
    queryFn: () => api.intentNodes(projectId),
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const selected = (nodes ?? []).find((n: any) => n.id === selectedId) ?? (nodes ?? [])[0];

  const compile = useMutation({
    mutationFn: () => api.compilePack(projectId),
  });

  if (!nodes) return <Spinner label="loading intent tree…" />;

  const sorted = [...nodes].sort(
    (a: any, b: any) => TYPE_ORDER.indexOf(a.node_type) - TYPE_ORDER.indexOf(b.node_type)
  );
  const totalTokens = nodes.reduce((sum: number, n: any) => sum + n.card_tokens, 0);

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-[19px] font-extrabold tracking-tight">Intent Tree</h1>
          <p className="text-[13px] text-ink-2">
            Typed nodes on this project&rsquo;s intent path. Runs compile their context cards — never
            full bodies.
          </p>
        </div>
        <button
          onClick={() => compile.mutate()}
          disabled={compile.isPending}
          className="rounded bg-ink px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-ink/90 disabled:opacity-50"
        >
          Compile context pack
        </button>
      </header>

      {compile.data && (
        <div className="rounded border border-pass/30 bg-pass-tint px-3 py-2 font-mono text-[11.5px] text-pass">
          Compiled {compile.data.name} v{compile.data.version} —{" "}
          {compile.data.token_estimate.toLocaleString()} tokens from{" "}
          {compile.data.source_intent_node_ids.length} nodes.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Tree */}
        <div className="hairline-card self-start lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <Eyebrow>intent path</Eyebrow>
            <span className="font-mono text-[10.5px] text-ink-3">{totalTokens} card tok total</span>
          </div>
          {sorted.map((n: any) => {
            const depth = TYPE_ORDER.indexOf(n.node_type);
            const isCollapsed = collapsed[n.id];
            return (
              <div key={n.id} className="border-b border-line last:border-0">
                <button
                  onClick={() => setSelectedId(n.id)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-paper ${
                    selected?.id === n.id ? "bg-paper" : ""
                  }`}
                  style={{ paddingLeft: `${12 + Math.max(0, depth) * 14}px` }}
                >
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setCollapsed({ ...collapsed, [n.id]: !isCollapsed });
                    }}
                    className="font-mono text-[10px] text-ink-3"
                  >
                    {isCollapsed ? "▸" : "▾"}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[12.5px] font-semibold">{n.title}</span>
                      <span className="shrink-0 rounded-[3px] bg-paper px-1 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-3 border border-line">
                        {n.node_type}
                      </span>
                    </div>
                    {!isCollapsed && <div className="truncate text-[11.5px] text-ink-2">{n.summary}</div>}
                  </div>
                  <span className="ml-auto shrink-0 font-mono text-[10px] text-ink-3">
                    {n.card_tokens} tok
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Node editor */}
        <div className="lg:col-span-2">
          {selected && <NodeEditor key={selected.id} node={selected} onSaved={() => qc.invalidateQueries({ queryKey: ["intent", projectId] })} />}
        </div>

        {/* Card preview */}
        <div className="hairline-card self-start p-3 lg:col-span-1">
          <Eyebrow>context card preview</Eyebrow>
          {selected && (
            <>
              <pre className="blob mt-2">{selected.card}</pre>
              <div className="mt-2 border-t border-line pt-2 font-mono text-[10.5px] text-ink-2">
                {selected.card_tokens} tok / budget {selected.token_budget}
              </div>
              {selected.has_body && (
                <div className="mt-1 font-mono text-[10px] text-warn">
                  full body ({selected.body_preview.length > 0 ? "large" : ""}) excluded from prompts
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function NodeEditor({ node, onSaved }: { node: any; onSaved: () => void }) {
  const [title, setTitle] = useState(node.title);
  const [summary, setSummary] = useState(node.summary);
  const [bullets, setBullets] = useState((node.canonical_context ?? []).join("\n"));
  const [must, setMust] = useState((node.constraints?.must ?? []).join("\n"));
  const [mustNot, setMustNot] = useState((node.constraints?.must_not ?? []).join("\n"));
  const [budget, setBudget] = useState(node.token_budget);
  useEffect(() => {
    setTitle(node.title);
    setSummary(node.summary);
    setBullets((node.canonical_context ?? []).join("\n"));
    setMust((node.constraints?.must ?? []).join("\n"));
    setMustNot((node.constraints?.must_not ?? []).join("\n"));
    setBudget(node.token_budget);
  }, [node]);

  const save = useMutation({
    mutationFn: () =>
      api.updateNode(node.id, {
        title,
        summary,
        canonical_context: bullets.split("\n").filter(Boolean),
        constraints: {
          must: must.split("\n").filter(Boolean),
          must_not: mustNot.split("\n").filter(Boolean),
        },
        token_budget: Number(budget) || node.token_budget,
      }),
    onSuccess: onSaved,
  });

  return (
    <div className="hairline-card p-4">
      <div className="flex items-center justify-between">
        <Eyebrow>
          node editor · v{node.version} · {node.visibility}
        </Eyebrow>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="rounded bg-ink px-2.5 py-1 text-[11.5px] font-semibold text-white hover:bg-ink/90 disabled:opacity-50"
        >
          {save.isSuccess && !save.isPending ? "Saved ✓" : "Save (new revision)"}
        </button>
      </div>
      <Field label="title">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
      </Field>
      <Field label="summary">
        <input value={summary} onChange={(e) => setSummary(e.target.value)} className="input" />
      </Field>
      <Field label="canonical context (one bullet per line)">
        <textarea value={bullets} onChange={(e) => setBullets(e.target.value)} rows={6} className="input" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="must">
          <textarea value={must} onChange={(e) => setMust(e.target.value)} rows={3} className="input" />
        </Field>
        <Field label="must not">
          <textarea value={mustNot} onChange={(e) => setMustNot(e.target.value)} rows={3} className="input" />
        </Field>
      </div>
      <Field label="token budget">
        <input value={budget} onChange={(e) => setBudget(e.target.value)} className="input w-28" />
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <div className="eyebrow mb-1">{label}</div>
      {children}
    </div>
  );
}
