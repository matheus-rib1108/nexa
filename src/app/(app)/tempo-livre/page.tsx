"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, Badge } from "@/components/ui/card";
import { TaskCheckItem } from "@/components/tasks/task-check-item";
import { Timer } from "lucide-react";
import { cn } from "@/lib/cn";

const OPTIONS = [5, 10, 15, 30];

type QuickTask = { id: string; title: string; estimatedMinutes: number | null; category: { name: string } | null };

function TempoLivreContent() {
  const params = useSearchParams();
  const [minutes, setMinutes] = useState(parseInt(params.get("minutes") ?? "5", 10));
  const [tasks, setTasks] = useState<QuickTask[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (m: number) => {
    setLoading(true);
    const res = await fetch(`/api/tasks/quick?minutes=${m}`);
    const data = await res.json();
    setTasks(data.tasks ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Busca de dados ao trocar o filtro de minutos — o aviso de lint sobre
    // "setState em efeito" é esperado aqui: é o padrão usual de fetch
    // disparado por mudança de parâmetro.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(minutes);
  }, [minutes, load]);

  return (
    <div className="mx-auto max-w-xl space-y-5 p-4 md:p-8">
      <div className="text-center">
        <Timer className="mx-auto mb-2 text-accent" size={28} />
        <h1 className="text-xl font-semibold">Tenho um tempinho livre</h1>
        <p className="text-sm text-muted">Escolha quanto tempo você tem e veja o que dá para fazer.</p>
      </div>

      <div className="flex justify-center gap-2">
        {OPTIONS.map((m) => (
          <button
            key={m}
            onClick={() => setMinutes(m)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium",
              minutes === m ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted",
            )}
          >
            {m} min
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <p className="p-4 text-center text-sm text-muted">Procurando tarefas pequenas...</p>
        ) : tasks.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted">
            <p className="mb-2">Nenhuma tarefa com duração estimada até {minutes} min ainda.</p>
            <p>Dica: ao criar uma tarefa, preencha a &quot;duração estimada&quot; para ela aparecer aqui.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <TaskCheckItem id={t.id} title={t.title} meta={t.category?.name} />
                </div>
                <Badge tone="accent">{t.estimatedMinutes} min</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="text-center">
        <Link href="/resgate" className="text-sm font-medium text-primary hover:underline">
          Não sei nem por onde começar →
        </Link>
      </div>
    </div>
  );
}

export default function TempoLivrePage() {
  return (
    <Suspense>
      <TempoLivreContent />
    </Suspense>
  );
}
