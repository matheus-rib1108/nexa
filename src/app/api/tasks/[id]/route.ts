import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { taskUpdateSchema } from "@/lib/validation";
import { ownsRefs } from "@/server/ownership";
import { awardXp } from "@/server/xp";
import { checkAndUnlockAchievements } from "@/server/achievements";
import { XP_REWARDS } from "@/lib/gamification";

async function getOwnedTask(userId: string, taskId: string) {
  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task || task.userId !== userId) return null;
  return task;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedTask(session.user.id, id);
  if (!existing) return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = taskUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }
  const data = parsed.data;
  if (!(await ownsRefs(session.user.id, { categoryId: data.categoryId, subjectId: data.subjectId }))) {
    return NextResponse.json({ error: "Referência não encontrada" }, { status: 404 });
  }

  const wasCompleted = existing.status === "concluida";
  const willBeCompleted = data.status === "concluida";

  const task = await db.task.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description || null } : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId || null } : {}),
      ...(data.subjectId !== undefined ? { subjectId: data.subjectId || null } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.dueDate !== undefined ? { dueDate: data.dueDate ? new Date(data.dueDate) : null } : {}),
      ...(data.dueTime !== undefined ? { dueTime: data.dueTime || null } : {}),
      ...(data.estimatedMinutes !== undefined ? { estimatedMinutes: data.estimatedMinutes } : {}),
      ...(data.tags !== undefined ? { tags: data.tags.length ? JSON.stringify(data.tags) : null } : {}),
      ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
      ...(data.isPriorityToday !== undefined ? { isPriorityToday: data.isPriorityToday } : {}),
      ...(data.order !== undefined ? { order: data.order } : {}),
      ...(willBeCompleted && !wasCompleted ? { completedAt: new Date() } : {}),
      ...(data.status !== undefined && data.status !== "concluida" ? { completedAt: null } : {}),
    },
    include: { subtasks: true, category: true, subject: true },
  });

  if (willBeCompleted && !wasCompleted) {
    const reward = existing.parentTaskId ? XP_REWARDS.SUBTASK_COMPLETED : XP_REWARDS.TASK_COMPLETED;
    await awardXp(session.user.id, reward);
    await checkAndUnlockAchievements(session.user.id);
  }

  return NextResponse.json({ task });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedTask(session.user.id, id);
  if (!existing) return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });

  await db.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
