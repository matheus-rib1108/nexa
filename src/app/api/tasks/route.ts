import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { taskSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const topLevelOnly = searchParams.get("topLevelOnly") === "true";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const tasks = await db.task.findMany({
    where: {
      userId: session.user.id,
      ...(status ? { status } : {}),
      ...(topLevelOnly ? { parentTaskId: null } : {}),
      ...(from || to
        ? {
            dueDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: {
      subtasks: { orderBy: { order: "asc" } },
      category: true,
      subject: true,
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = taskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const data = parsed.data;

  let order = 0;
  if (data.parentTaskId) {
    const siblingCount = await db.task.count({ where: { parentTaskId: data.parentTaskId } });
    order = siblingCount;
  }

  const task = await db.task.create({
    data: {
      userId: session.user.id,
      title: data.title,
      description: data.description || null,
      categoryId: data.categoryId || null,
      subjectId: data.subjectId || null,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      dueTime: data.dueTime || null,
      estimatedMinutes: data.estimatedMinutes ?? null,
      tags: data.tags && data.tags.length ? JSON.stringify(data.tags) : null,
      notes: data.notes || null,
      isPriorityToday: data.isPriorityToday ?? false,
      parentTaskId: data.parentTaskId || null,
      order,
    },
    include: { subtasks: true, category: true, subject: true },
  });

  return NextResponse.json({ task }, { status: 201 });
}
