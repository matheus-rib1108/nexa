"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";

type CalendarTask = {
  id: string;
  title: string;
  dueDate: string;
  priority: string;
  status: string;
};

type CalendarExam = { id: string; title: string; date: string; subject: { name: string } | null };

export function CalendarView() {
  const [month, setMonth] = useState(() => new Date());
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [exams, setExams] = useState<CalendarExam[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const days = useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }), [gridStart, gridEnd]);

  useEffect(() => {
    const from = gridStart.toISOString();
    const to = gridEnd.toISOString();
    fetch(`/api/tasks?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d) => setTasks(d.tasks ?? []));
    fetch(`/api/exams?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d) => setExams(d.exams ?? []))
      .catch(() => setExams([]));
  }, [gridStart, gridEnd]);

  async function moveTask(taskId: string, newDate: Date) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, dueDate: newDate.toISOString() } : t)));
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueDate: newDate.toISOString().slice(0, 10) }),
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold capitalize">{format(month, "MMMM yyyy", { locale: ptBR })}</h1>
        <div className="flex gap-1">
          <button onClick={() => setMonth((m) => subMonths(m, 1))} className="rounded-lg p-2 hover:bg-surface-muted">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => setMonth(new Date())} className="rounded-lg px-3 py-2 text-sm hover:bg-surface-muted">
            Hoje
          </button>
          <button onClick={() => setMonth((m) => addMonths(m, 1))} className="rounded-lg p-2 hover:bg-surface-muted">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <Card className="overflow-x-auto p-2">
        <div className="grid min-w-[640px] grid-cols-7 gap-1">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
            <div key={d} className="px-2 py-1 text-center text-xs font-semibold text-muted">
              {d}
            </div>
          ))}
          {days.map((day) => {
            const dayTasks = tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day));
            const dayExams = exams.filter((e) => isSameDay(new Date(e.date), day));
            return (
              <div
                key={day.toISOString()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragId) moveTask(dragId, day);
                  setDragId(null);
                }}
                className={cn(
                  "min-h-[92px] rounded-lg border border-border/60 p-1.5",
                  !isSameMonth(day, month) && "opacity-40",
                  isToday(day) && "border-primary bg-primary-soft/30",
                )}
              >
                <p className="mb-1 text-xs font-medium text-muted">{format(day, "d")}</p>
                <div className="space-y-1">
                  {dayExams.map((e) => (
                    <div key={e.id} className="truncate rounded-md bg-danger-soft px-1.5 py-0.5 text-[11px] font-medium text-danger">
                      🚨 {e.title}
                    </div>
                  ))}
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={() => setDragId(t.id)}
                      className={cn(
                        "cursor-grab truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                        t.status === "concluida"
                          ? "bg-success-soft text-success line-through"
                          : "bg-primary-soft text-primary",
                      )}
                    >
                      {t.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      <p className="text-xs text-muted">Arraste uma tarefa para outro dia para mudar o prazo.</p>
    </div>
  );
}
