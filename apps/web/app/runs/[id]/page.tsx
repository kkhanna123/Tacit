"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Eyebrow, Spinner } from "@/components/ui";
import { OutputPanel, RunHeader, RunInspector } from "@/components/run-inspector";

export default function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: detail } = useQuery({ queryKey: ["run", id], queryFn: () => api.run(id) });

  if (!detail) return <Spinner label="loading run…" />;

  return (
    <div className="space-y-4">
      <div>
        <Link href="/runs" className="font-mono text-[11px] text-ink-2 underline">
          ← runs
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <Eyebrow>run · {detail.run.id}</Eyebrow>
            <h1 className="mt-1 text-[17px] font-extrabold tracking-tight">
              &ldquo;{detail.run.raw_user_request}&rdquo;
            </h1>
            <div className="mt-2">
              <RunHeader detail={detail} />
            </div>
          </div>
          <div className="hairline-card shrink-0 px-4 py-2 text-right">
            <div className="eyebrow">tokens saved</div>
            <div className="font-mono text-[18px] font-semibold text-pass">
              {detail.tokens_saved > 0 ? `−${detail.tokens_saved.toLocaleString()}` : "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <OutputPanel detail={detail} />
        </div>
        <div className="lg:col-span-2">
          <RunInspector detail={detail} />
        </div>
      </div>
    </div>
  );
}
