import { requireUserId } from "@/lib/session";
import { db } from "@/lib/db";
import { TasksBoard } from "./tasks-board";
import type { SerializedTask } from "@/types/task";

export default async function TarefasPage() {
  const userId = await requireUserId();

  const [tasks, categories, subjects] = await Promise.all([
    db.task.findMany({
      where: { userId, parentTaskId: null },
      include: {
        subtasks: { orderBy: { order: "asc" } },
        category: true,
        subject: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.category.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    db.subject.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <TasksBoard
      initialTasks={JSON.parse(JSON.stringify(tasks)) as SerializedTask[]}
      categories={categories}
      subjects={subjects}
    />
  );
}
