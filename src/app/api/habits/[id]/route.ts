import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const habit = await db.habit.findUnique({ where: { id } });
  if (!habit || habit.userId !== session.user.id) {
    return NextResponse.json({ error: "Hábito não encontrado" }, { status: 404 });
  }

  await db.habit.update({ where: { id }, data: { archivedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
