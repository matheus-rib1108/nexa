"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pause, Play, Square, Headphones, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { playAmbientSound, stopAmbientSound, AMBIENT_SOUND_LABELS, type AmbientSoundKey } from "@/lib/ambient-sound";

const PRESETS = [2, 5, 10, 15, 25, 45];

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export function TimerScreen({ taskTitle, defaultMinutes }: { taskTitle: string | null; defaultMinutes: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const taskId = params.get("taskId");

  const [phase, setPhase] = useState<"setup" | "running" | "done">("setup");
  const [durationMinutes, setDurationMinutes] = useState(defaultMinutes);
  const [customMinutes, setCustomMinutes] = useState("");
  const [ambientSound, setAmbientSound] = useState<AmbientSoundKey>("silencio");
  const [remaining, setRemaining] = useState(defaultMinutes * 60);
  const [running, setRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const startedTotalRef = useRef(defaultMinutes * 60);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          finish(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    return () => stopAmbientSound();
  }, []);

  async function start() {
    const res = await fetch("/api/focus-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, durationMinutes, ambientSound }),
    });
    const data = await res.json();
    setSessionId(data.focusSession?.id ?? null);
    startedTotalRef.current = durationMinutes * 60;
    setRemaining(durationMinutes * 60);
    setPhase("running");
    setRunning(true);
    if (ambientSound !== "silencio") playAmbientSound(ambientSound);
  }

  async function finish(completedNaturally: boolean) {
    setRunning(false);
    stopAmbientSound();
    const elapsed = startedTotalRef.current - remaining;
    if (sessionId) {
      await fetch(`/api/focus-sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actualSeconds: completedNaturally ? startedTotalRef.current : elapsed,
          completed: completedNaturally,
        }),
      });
    }
    setPhase("done");
    router.refresh();
  }

  if (phase === "setup") {
    return (
      <Card className="w-full max-w-md text-center">
        <Headphones className="mx-auto mb-3 text-primary" size={28} />
        <h1 className="mb-1 text-xl font-semibold">Focus Mode</h1>
        {taskTitle && <p className="mb-4 text-sm text-muted">Foco em: {taskTitle}</p>}

        <p className="mb-2 text-left text-sm font-medium">Duração</p>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => {
                setDurationMinutes(p);
                setCustomMinutes("");
              }}
              className={cn(
                "rounded-xl border py-2.5 text-sm font-medium",
                durationMinutes === p ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-surface-muted",
              )}
            >
              {p} min
            </button>
          ))}
        </div>
        <input
          type="number"
          min={1}
          max={240}
          placeholder="Personalizado (min)"
          value={customMinutes}
          onChange={(e) => {
            setCustomMinutes(e.target.value);
            const v = parseInt(e.target.value, 10);
            if (v > 0) setDurationMinutes(v);
          }}
          className="mb-4 h-10 w-full rounded-xl border border-border bg-surface px-3 text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />

        <p className="mb-2 text-left text-sm font-medium">Som ambiente</p>
        <div className="mb-6 grid grid-cols-3 gap-2">
          {(Object.keys(AMBIENT_SOUND_LABELS) as AmbientSoundKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setAmbientSound(key)}
              className={cn(
                "rounded-xl border py-2 text-xs font-medium",
                ambientSound === key ? "border-accent bg-accent-soft text-accent" : "border-border hover:bg-surface-muted",
              )}
            >
              {AMBIENT_SOUND_LABELS[key]}
            </button>
          ))}
        </div>

        <Button size="lg" className="w-full" onClick={start}>
          Iniciar foco
        </Button>
      </Card>
    );
  }

  if (phase === "running") {
    const percent = Math.round(((startedTotalRef.current - remaining) / startedTotalRef.current) * 100);
    return (
      <div className="flex w-full max-w-md flex-col items-center text-center">
        {taskTitle && <p className="mb-2 text-sm text-muted">{taskTitle}</p>}
        <div className="relative mb-8 flex h-64 w-64 items-center justify-center rounded-full border-8 border-surface-muted">
          <div
            className="absolute inset-0 rounded-full border-8 border-primary transition-all"
            style={{ clipPath: `inset(0 ${100 - percent}% 0 0)` }}
          />
          <span className="text-5xl font-semibold tabular-nums">{formatTime(remaining)}</span>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="lg" onClick={() => setRunning((r) => !r)}>
            {running ? <Pause size={18} /> : <Play size={18} />} {running ? "Pausar" : "Continuar"}
          </Button>
          <Button variant="danger" size="lg" onClick={() => finish(false)}>
            <Square size={18} /> Finalizar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md text-center">
      <CheckCircle2 className="mx-auto mb-3 text-success" size={36} />
      <h2 className="mb-2 text-xl font-semibold">Sessão concluída!</h2>
      <p className="mb-6 text-sm text-muted">Muito bem. Cada sessão de foco conta.</p>
      <div className="flex justify-center gap-3">
        <Button variant="secondary" onClick={() => setPhase("setup")}>
          Nova sessão
        </Button>
        <Button onClick={() => router.push("/dashboard")}>Voltar ao início</Button>
      </div>
    </Card>
  );
}
