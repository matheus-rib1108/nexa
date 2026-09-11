import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  steps: z.array(z.string().trim().min(1).max(200)).min(1).max(30),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const parent = await db.task.findUnique({ where: { id } });
  if (!parent || parent.userId !== session.user.id) {
    return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const existingCount = await db.task.count({ where: { parentTaskId: id } });

  const created = await db.$transaction(
    parsed.data.steps.map((title, i) =>
      db.task.create({
        data: {
          userId: session.user.id,
          title,
          parentTaskId: id,
          order: existingCount + i,
          priority: parent.priority,
          categoryId: parent.categoryId,
        },
      }),
    ),
  );

  return NextResponse.json({ subtasks: created }, { status: 201 });
}
