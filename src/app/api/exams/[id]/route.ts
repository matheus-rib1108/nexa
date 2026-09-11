import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const exam = await db.exam.findUnique({ where: { id } });
  if (!exam || exam.userId !== session.user.id) {
    return NextResponse.json({ error: "Prova não encontrada" }, { status: 404 });
  }

  await db.exam.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
