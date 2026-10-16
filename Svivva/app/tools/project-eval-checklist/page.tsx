"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MiniAppShell } from "@/components/tools/mini-app-shell";
import { getFeatureMiniApp } from "@/lib/tools/feature-mini-apps";
import { PROJECT_EVAL_ITEMS } from "@/lib/tools/mini-slices/feature-tool-helpers";

const APP = getFeatureMiniApp("project-eval-checklist")!;

export default function ProjectEvalChecklistPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const done = useMemo(
    () => PROJECT_EVAL_ITEMS.filter((i) => checked[i.id]).length,
    [checked],
  );

  return (
    <MiniAppShell app={APP} nextLabel="Projects">
      <ul className="space-y-3">
        {PROJECT_EVAL_ITEMS.map((item) => (
          <li key={item.id}>
            <label className="flex items-center gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={!!checked[item.id]}
                onChange={(e) =>
                  setChecked((prev) => ({ ...prev, [item.id]: e.target.checked }))
                }
              />
              {item.label}
            </label>
          </li>
        ))}
      </ul>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
        <p className="text-sm" data-testid="text-eval-done">
          {done}/{PROJECT_EVAL_ITEMS.length} ready
        </p>
        <Link href="/dashboard/projects">
          <Button className="gap-2 bg-[#5B8DA8]">
            <ListChecks className="w-4 h-4" />
            Open Projects
          </Button>
        </Link>
      </div>
    </MiniAppShell>
  );
}
