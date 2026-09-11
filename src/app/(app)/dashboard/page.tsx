import Link from "next/link";
import { requireUserId } from "@/lib/session";
import { db } from "@/lib/db";
import { getDashboardData } from "@/server/dashboard";
import { getNextAction } from "@/server/priority";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskCheckItem } from "@/components/tasks/task-check-item";
import { isToday, isTomorrow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Flame, ListChecks, Clock3, ArrowRight } from "lucide-react";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function dueLabel(date: Date) {
  if (isToday(date)) return "Hoje";
  if (isTomorrow(date)) return "Amanhã";
  return format(date, "EEEE", { locale: ptBR });
}

export default async function DashboardPage() {
  const userId = await requireUserId();
  const user = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
  const [data, nextAction] = await Promise.all([getDashboardData(userId), getNextAction(userId)]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold">
          {greeting()}, {user?.name} 👋
        </h1>
        <p className="text-sm text-muted">Aqui está o que importa agora.</p>
      </div>

      <Card className="border-primary/30 bg-primary-soft/40">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
          🎯 Sua próxima ação
        </p>
        {nextAction ? (
          <>
            <h2 className="mb-1 text-xl font-semibold">{nextAction.actionTitle}</h2>
            {nextAction.subtask && (
              <p className="mb-2 text-xs text-muted">Parte de: {nextAction.task.title}</p>
            )}
            {nextAction.estimatedMinutes && (
              <p className="mb-4 flex items-center gap-1.5 text-sm text-muted">
                <Clock3 size={14} /> Aproximadamente {nextAction.estimatedMinutes} minutos
              </p>
            )}
            <Link href="/agora">
              <Button size="lg">
                Começar agora <ArrowRight size={16} />
              </Button>
            </Link>
          </>
        ) : (
          <>
            <h2 className="mb-3 text-lg font-semibold">Tudo limpo por aqui ✨</h2>
            <p className="mb-4 text-sm text-muted">
              Nenhuma tarefa pendente. Que tal jogar tudo que está na cabeça no Brain Dump?
            </p>
            <Link href="/brain-dump">
              <Button variant="secondary">Abrir Brain Dump</Button>
            </Link>
          </>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-soft text-success">
            <ListChecks size={18} />
          </div>
          <div>
            <p className="text-lg font-semibold">{data.stats.completedToday}</p>
            <p className="text-xs text-muted">concluídas hoje</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-soft text-warning">
            <Flame size={18} />
          </div>
          <div>
            <p className="text-lg font-semibold">{data.stats.pending}</p>
            <p className="text-xs text-muted">pendentes</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Clock3 size={18} />
          </div>
          <div>
            <p className="text-lg font-semibold">{data.stats.focusMinutesToday} min</p>
            <p className="text-xs text-muted">de foco hoje</p>
          </div>
        </Card>
      </div>

      {data.priorityToday.length > 0 && (
        <Card>
          <p className="mb-2 text-sm font-semibold text-danger">🔴 Prioridades de hoje</p>
          <div className="divide-y divide-border">
            {data.priorityToday.map((t) => (
              <TaskCheckItem key={t.id} id={t.id} title={t.title} meta={t.dueDate ? dueLabel(new Date(t.dueDate)) : undefined} />
            ))}
          </div>
        </Card>
      )}

      {data.others.length > 0 && (
        <Card>
          <p className="mb-2 text-sm font-semibold text-warning">🟡 Outras tarefas</p>
          <div className="divide-y divide-border">
            {data.others.slice(0, 6).map((t) => (
              <TaskCheckItem key={t.id} id={t.id} title={t.title} />
            ))}
          </div>
          <Link href="/tarefas" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
            Ver todas as tarefas →
          </Link>
        </Card>
      )}

      {(data.upcomingTaskDeadlines.length > 0 || data.exams.length > 0) && (
        <Card>
          <p className="mb-3 text-sm font-semibold">📅 Próximos prazos</p>
          <div className="space-y-2">
            {data.upcomingTaskDeadlines.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <span>{t.title}</span>
                <Badge tone="default">{dueLabel(new Date(t.dueDate!))}</Badge>
              </div>
            ))}
            {data.exams.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm">
                <span>
                  {e.title}
                  {e.subject && !e.title.toLowerCase().includes(e.subject.name.toLowerCase())
                    ? ` (${e.subject.name})`
                    : ""}
                </span>
                <Badge tone="primary">{dueLabel(new Date(e.date))}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
