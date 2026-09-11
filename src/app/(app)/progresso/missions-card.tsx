"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Target } from "lucide-react";
import { cn } from "@/lib/cn";

type Mission = { key: string; label: string; done: boolean };

export function MissionsCard() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [allDone, setAllDone] = useState(false);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [celebrated, setCelebrated] = useState(false);

  useEffect(() => {
    fetch("/api/missions")
      .then((r) => r.json())
      .then((d) => {
        setMissions(d.missions ?? []);
        setAllDone(d.allDone);
        setAlreadyClaimed(d.alreadyClaimed);
      });
  }, []);

  async function claim() {
    setClaiming(true);
    const res = await fetch("/api/missions/claim", { method: "POST" });
    if (res.ok) {
      setAlreadyClaimed(true);
      setCelebrated(true);
    }
    setClaiming(false);
  }

  return (
    <Card>
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Target size={16} className="text-primary" /> Missão de hoje
      </p>
      <div className="space-y-2">
        {missions.map((m) => (
          <div key={m.key} className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border",
                m.done ? "border-success bg-success text-white" : "border-border",
              )}
            >
              {m.done && <Check size={12} strokeWidth={3} />}
            </span>
            <span className={cn(m.done && "text-muted line-through")}>{m.label}</span>
          </div>
        ))}
      </div>

      {celebrated || alreadyClaimed ? (
        <p className="mt-4 rounded-lg bg-success-soft px-3 py-2 text-center text-sm font-medium text-success">
          🎉 Missão concluída — bônus de XP resgatado!
        </p>
      ) : allDone ? (
        <Button className="mt-4 w-full" onClick={claim} disabled={claiming}>
          {claiming ? "Resgatando..." : "🎉 Resgatar recompensa"}
        </Button>
      ) : null}
    </Card>
  );
}
