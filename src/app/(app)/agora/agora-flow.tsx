"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock3, CheckCircle2, Sparkles } from "lucide-react";

type NextAction = {
  task: { id: string; title: string };
  subtask: { id: string; title: string } | null;
  actionTitle: string;
  estimatedMinutes: number | null;
} | null;

export function AgoraFlow({ initial }: { initial: NextAction }) {
  const router = useRouter();
  const [action, setAction] = useState(initial);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [justCompleted, setJustCompleted] = useState<string | null>(null);

  async function fetchNext() {
    const res = await fetch("/api/next-action");
    const data = await res.json();
    setAction(data.nextAction);
    setStarted(false);
  }

  async function handleComplete() {
    if (!action) return;
    setLoading(true);
    const targetId = action.subtask?.id ?? action.task.id;
    await fetch(`/api/tasks/${targetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "concluida" }),
    });
    setJustCompleted(action.actionTitle);
    await fetchNext();
    router.refresh();
    setLoading(false);
  }

  if (!action) {
    return (
      <Card className="text-center">
        {justCompleted && (
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-sm font-medium text-success">
            <CheckCircle2 size={16} /> Muito bem!
          </p>
        )}
        <Sparkles className="mx-auto mb-3 text-primary" size={32} />
        <h2 className="mb-2 text-lg font-semibold">Nada pendente agora</h2>
        <p className="mb-4 text-sm text-muted">
          Você concluiu tudo que estava em foco. Adicione novas tarefas quando quiser.
        </p>
        <Link href="/tarefas">
          <Button variant="secondary">Ir para Tarefas</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="text-center">
      {justCompleted && (
        <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-sm font-medium text-success">
          <CheckCircle2 size={16} /> Muito bem!
        </p>
      )}
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">🎯 Agora</p>
      <h1 className="mb-2 text-2xl font-semibold leading-snug">{action.actionTitle}</h1>
      {action.subtask && <p className="mb-3 text-sm text-muted">Parte de: {action.task.title}</p>}
      {action.estimatedMinutes && (
        <p className="mb-6 flex items-center justify-center gap-1.5 text-sm text-muted">
          <Clock3 size={14} /> {action.estimatedMinutes} minutos
        </p>
      )}
      <div className="flex flex-col items-center gap-3">
        {!started ? (
          <Button size="lg" className="w-full max-w-xs" onClick={() => setStarted(true)}>
            Começar
          </Button>
        ) : (
          <Button size="lg" className="w-full max-w-xs" onClick={handleComplete} disabled={loading}>
            {loading ? "Salvando..." : "Concluir"}
          </Button>
        )}
        <Link href={`/foco?taskId=${action.subtask?.id ?? action.task.id}`} className="text-sm font-medium text-primary hover:underline">
          Focar nisso com o timer
        </Link>
      </div>
    </Card>
  );
}
