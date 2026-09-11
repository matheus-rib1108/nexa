import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { focusSessionSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const parsed = focusSessionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  if (parsed.data.taskId) {
    const task = await db.task.findUnique({ where: { id: parsed.data.taskId } });
    if (!task || task.userId !== session.user.id) {
      return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
    }
  }

  const focusSession = await db.focusSession.create({
    data: {
      userId: session.user.id,
      taskId: parsed.data.taskId || null,
      durationMinutes: parsed.data.durationMinutes,
      ambientSound: parsed.data.ambientSound || null,
    },
  });

  return NextResponse.json({ focusSession }, { status: 201 });
}
