"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Pencil, Trash2, Boxes, CalendarDays, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/card";
import type { SerializedTask } from "@/types/task";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PRIORITY_TONE: Record<string, "danger" | "warning" | "default"> = {
  alta: "danger",
  media: "warning",
  baixa: "default",
};

export function TaskRow({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onBreak,
  depth = 0,
}: {
  task: SerializedTask;
  onToggleComplete: (task: SerializedTask) => void;
  onEdit: (task: SerializedTask) => void;
  onDelete: (task: SerializedTask) => void;
  onBreak: (task: SerializedTask) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  // A busca de tarefas só inclui um nível de subtarefas (o Task Break não
  // cria netos), então uma subtarefa recebida aqui pode não trazer seu
  // próprio campo `subtasks` — tratamos como lista vazia nesse caso.
  const subtasks = task.subtasks ?? [];
  const hasSubtasks = subtasks.length > 0;
  const done = task.status === "concluida";
  const completedSubtasks = subtasks.filter((s) => s.status === "concluida").length;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-surface-muted",
          depth > 0 && "ml-7",
        )}
      >
        {hasSubtasks && depth === 0 ? (
          <button onClick={() => setExpanded((v) => !v)} className="text-muted">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <span className="w-4" />
        )}

        <button
          onClick={() => onToggleComplete(task)}
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
            done ? "border-success bg-success text-white" : "border-border",
          )}
          aria-label="Alternar conclusão"
        >
          {done && <Check size={12} strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn("truncate text-sm font-medium", done && "text-muted line-through")}>{task.title}</p>
            {task.isPriorityToday && <Star size={13} className="fill-warning text-warning" />}
            {task.priority !== "media" && (
              <Badge tone={PRIORITY_TONE[task.priority]}>{task.priority === "alta" ? "Alta" : "Baixa"}</Badge>
            )}
            {task.category && <Badge tone="primary">{task.category.name}</Badge>}
            {hasSubtasks && (
              <span className="text-xs text-muted">
                {completedSubtasks}/{subtasks.length} etapas
              </span>
            )}
          </div>
          {(task.dueDate || task.estimatedMinutes) && (
            <div className="mt-0.5 flex items-center gap-3 text-xs text-muted">
              {task.dueDate && (
                <span className="flex items-center gap-1">
                  <CalendarDays size={12} />
                  {format(new Date(task.dueDate), "d 'de' MMM", { locale: ptBR })}
                  {task.dueTime ? ` às ${task.dueTime}` : ""}
                </span>
              )}
              {task.estimatedMinutes && <span>~{task.estimatedMinutes} min</span>}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {depth === 0 && (
            <button
              onClick={() => onBreak(task)}
              title="Quebrar tarefa"
              className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-primary"
            >
              <Boxes size={16} />
            </button>
          )}
          <button
            onClick={() => onEdit(task)}
            title="Editar"
            className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-foreground"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => onDelete(task)}
            title="Excluir"
            className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-danger"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {hasSubtasks && expanded && (
        <div>
          {subtasks.map((sub) => (
            <TaskRow
              key={sub.id}
              task={sub}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              onBreak={onBreak}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
