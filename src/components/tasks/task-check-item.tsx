"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export function TaskCheckItem({
  id,
  title,
  meta,
  done = false,
}: {
  id: string;
  title: string;
  meta?: string;
  done?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [optimisticDone, setOptimisticDone] = useState(done);

  async function toggle() {
    setLoading(true);
    setOptimisticDone(!optimisticDone);
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: optimisticDone ? "pendente" : "concluida" }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-muted">
      <button
        onClick={toggle}
        disabled={loading}
        aria-label={optimisticDone ? "Marcar como pendente" : "Marcar como concluída"}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          optimisticDone ? "border-success bg-success text-white" : "border-border",
        )}
      >
        {optimisticDone && <Check size={12} strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", optimisticDone && "text-muted line-through")}>{title}</p>
        {meta && <p className="text-xs text-muted">{meta}</p>}
      </div>
    </div>
  );
}
