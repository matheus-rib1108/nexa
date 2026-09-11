import { db } from "@/lib/db";
import type { Task } from "@prisma/client";

const PRIORITY_WEIGHT: Record<string, number> = { alta: 3, media: 2, baixa: 1 };

export type TaskWithSubtasks = Task & { subtasks: Task[] };

/**
 * Ordena tarefas ativas colocando primeiro: prioridade de hoje > prazo mais
 * próximo > prioridade (alta/média/baixa) > mais antiga primeiro.
 * Usado pelo Dashboard, pelo modo AGORA e pela tela de Tarefas ("Smart Priority").
 */
export function sortBySmartPriority<T extends Pick<Task, "isPriorityToday" | "dueDate" | "priority" | "createdAt">>(
  tasks: T[],
): T[] {
  return [...tasks].sort((a, b) => {
    if (a.isPriorityToday !== b.isPriorityToday) return a.isPriorityToday ? -1 : 1;

    const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    if (aDue !== bDue) return aDue - bDue;

    const aPriority = PRIORITY_WEIGHT[a.priority] ?? 0;
    const bPriority = PRIORITY_WEIGHT[b.priority] ?? 0;
    if (aPriority !== bPriority) return bPriority - aPriority;

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export async function getActiveTopLevelTasks(userId: string): Promise<TaskWithSubtasks[]> {
  const tasks = await db.task.findMany({
    where: {
      userId,
      parentTaskId: null,
      status: { in: ["pendente", "em_andamento"] },
    },
    include: {
      subtasks: { orderBy: { order: "asc" } },
    },
  });
  return tasks;
}

export type NextAction = {
  task: Task;
  subtask: Task | null;
  actionTitle: string;
  estimatedMinutes: number | null;
};

/**
 * Resolve a "próxima ação": pega a tarefa de maior prioridade e, se ela tiver
 * subtarefas pendentes, aponta para a primeira subtarefa (a menor ação
 * concreta possível) em vez da tarefa inteira.
 */
export async function getNextAction(userId: string): Promise<NextAction | null> {
  const tasks = await getActiveTopLevelTasks(userId);
  if (tasks.length === 0) return null;

  const ordered = sortBySmartPriority(tasks);
  const top = ordered[0];

  const pendingSubtask = top.subtasks.find((s) => s.status === "pendente" || s.status === "em_andamento");

  if (pendingSubtask) {
    return {
      task: top,
      subtask: pendingSubtask,
      actionTitle: pendingSubtask.title,
      estimatedMinutes: pendingSubtask.estimatedMinutes,
    };
  }

  return {
    task: top,
    subtask: null,
    actionTitle: top.title,
    estimatedMinutes: top.estimatedMinutes,
  };
}
