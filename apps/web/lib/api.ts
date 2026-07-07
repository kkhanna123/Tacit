const BASE = process.env.NEXT_PUBLIC_EM_API ?? "http://localhost:8000";

async function req(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  me: () => req("/me"),
  projects: () => req("/projects"),
  skills: () => req("/skills"),
  skill: (id: string) => req(`/skills/${id}`),
  installSkill: (id: string, projectId: string) =>
    req(`/skills/${id}/install`, { method: "POST", body: JSON.stringify({ project_id: projectId }) }),
  intentNodes: (projectId: string) => req(`/projects/${projectId}/intent-nodes`),
  updateNode: (id: string, patch: object) =>
    req(`/intent-nodes/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  compilePack: (projectId: string) =>
    req(`/projects/${projectId}/compile-context-pack`, { method: "POST" }),
  preview: (projectId: string, request: string) =>
    req(`/preview?project_id=${projectId}&request=${encodeURIComponent(request)}`),
  runBaseline: (projectId: string, request: string, provider: string) =>
    req("/runs/baseline", { method: "POST", body: JSON.stringify({ project_id: projectId, request, provider }) }),
  runEnterprise: (projectId: string, request: string, provider: string) =>
    req("/runs/enterprise-mind", { method: "POST", body: JSON.stringify({ project_id: projectId, request, provider }) }),
  runs: (projectId?: string) => req(`/runs${projectId ? `?project_id=${projectId}` : ""}`),
  run: (id: string) => req(`/runs/${id}`),
  runHarness: (id: string, outputText?: string) =>
    req(`/harnesses/${id}/run`, { method: "POST", body: JSON.stringify({ output_text: outputText ?? null }) }),
  learnings: () => req("/learnings"),
  approveLearning: (id: string) =>
    req(`/learnings/${id}/approve`, { method: "POST", body: JSON.stringify({}) }),
  rejectLearning: (id: string) =>
    req(`/learnings/${id}/reject`, { method: "POST", body: JSON.stringify({}) }),
  metrics: () => req("/admin/metrics"),
  auditEvents: () => req("/admin/audit-events"),
};

export function pct(saved: number, baseline: number): number {
  if (!baseline) return 0;
  return Math.round((saved / baseline) * 100);
}
