"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TaskRow } from "@/components/tasks/task-row";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import { TaskBreakModal } from "@/components/tasks/task-break-modal";
import type { SerializedTask, Category, Subject } from "@/types/task";

const STATUS_FILTERS = [
  { key: "ativas", label: "Ativas" },
  { key: "concluidas", label: "Concluídas" },
  { key: "todas", label: "Todas" },
] as const;

export function TasksBoard({
  initialTasks,
  categories,
  subjects,
}: {
  initialTasks: SerializedTask[];
  categories: Category[];
  subjects: Subject[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]["key"]>("ativas");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<SerializedTask | null>(null);
  const [breakingTask, setBreakingTask] = useState<SerializedTask | null>(null);

  async function refresh() {
    const res = await fetch("/api/tasks?topLevelOnly=true");
    const data = await res.json();
    setTasks(data.tasks);
  }

  async function toggleComplete(task: SerializedTask) {
    const nextStatus = task.status === "concluida" ? "pendente" : "concluida";
    setTasks((prev) => updateTaskInTree(prev, task.id, { status: nextStatus }));
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    refresh();
  }

  async function handleDelete(task: SerializedTask) {
    if (!confirm(`Excluir "${task.title}"?`)) return;
    setTasks((prev) => removeTaskFromTree(prev, task.id));
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
  }

  const filtered = useMemo(() => {
    if (filter === "ativas") return tasks.filter((t) => t.status !== "concluida" && t.status !== "arquivada");
    if (filter === "concluidas") return tasks.filter((t) => t.status === "concluida");
    return tasks;
  }, [tasks, filter]);

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tarefas</h1>
        <Button
          onClick={() => {
            setEditingTask(null);
            setFormOpen(true);
          }}
        >
          <Plus size={16} /> Nova tarefa
        </Button>
      </div>

      <div className="flex gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
              filter === f.key ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="p-2">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">Nenhuma tarefa por aqui.</p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggleComplete={toggleComplete}
                onEdit={(t) => {
                  setEditingTask(t);
                  setFormOpen(true);
                }}
                onDelete={handleDelete}
                onBreak={(t) => setBreakingTask(t)}
              />
            ))}
          </div>
        )}
      </Card>

      <TaskFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={refresh}
        categories={categories}
        subjects={subjects}
        task={editingTask}
      />

      {breakingTask && (
        <TaskBreakModal
          key={breakingTask.id}
          open={!!breakingTask}
          onClose={() => setBreakingTask(null)}
          onSaved={refresh}
          taskId={breakingTask.id}
          title={breakingTask.title}
          description={breakingTask.description}
        />
      )}
    </div>
  );
}

// A API só carrega um nível de subtarefas, então um nó filho pode chegar
// aqui sem seu próprio campo `subtasks` — tratamos como lista vazia.
function updateTaskInTree(
  tasks: SerializedTask[],
  id: string,
  patch: Partial<SerializedTask>,
): SerializedTask[] {
  return tasks.map((t) => {
    if (t.id === id) return { ...t, ...patch };
    const subtasks = t.subtasks ?? [];
    if (subtasks.length) return { ...t, subtasks: updateTaskInTree(subtasks, id, patch) };
    return t;
  });
}

function removeTaskFromTree(tasks: SerializedTask[], id: string): SerializedTask[] {
  return tasks
    .filter((t) => t.id !== id)
    .map((t) => ({ ...t, subtasks: removeTaskFromTree(t.subtasks ?? [], id) }));
}
