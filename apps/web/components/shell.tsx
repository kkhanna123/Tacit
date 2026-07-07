"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useProject, useProjects } from "./providers";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/projects", label: "Projects" },
  { href: "/skills", label: "Skills" },
  { href: "/intent-tree", label: "Intent Tree" },
  { href: "/runs", label: "Runs" },
  { href: "/admin", label: "Admin" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { projectId, setProjectId } = useProject();
  const { data: projects } = useProjects();
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: api.me });

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-52 flex-col border-r border-line bg-card">
        <div className="border-b border-line px-4 py-4">
          <div className="text-[15px] font-extrabold tracking-tight">Enterprise Mind</div>
          <div className="eyebrow mt-0.5">deterministic control plane</div>
        </div>
        <nav className="flex-1 py-2">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative block px-4 py-2 text-[13px] ${
                  active
                    ? "font-semibold text-ink before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:bg-ink"
                    : "text-ink-2 hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line px-4 py-3">
          <div className="text-[12.5px] font-semibold">{me?.user?.name ?? "…"}</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
            {me?.role ?? ""} · {me?.org?.name ?? ""}
          </div>
        </div>
      </aside>

      <div className="ml-52 flex-1">
        <header className="sticky top-0 z-10 flex h-12 items-center gap-3 border-b border-line bg-paper/90 px-6 backdrop-blur">
          <span className="eyebrow">project</span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="rounded border border-line-2 bg-card px-2 py-1 text-[12.5px] font-medium"
          >
            {(projects ?? []).map((p: { id: string; name: string }) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <div className="ml-auto flex items-center gap-4">
            <span className="font-mono text-[10.5px] text-ink-3">
              compiled prompt target &lt; 1,500 tok
            </span>
            <span className="rounded-[3px] border border-line-2 bg-card px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-2">
              provider: mock
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
