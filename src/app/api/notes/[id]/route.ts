import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { noteSchema } from "@/lib/validation";

async function getOwnedNote(userId: string, id: string) {
  const note = await db.note.findUnique({ where: { id } });
  if (!note || note.userId !== userId) return null;
  return note;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedNote(session.user.id, id);
  if (!existing) return NextResponse.json({ error: "Nota não encontrada" }, { status: 404 });

  const parsed = noteSchema.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const note = await db.note.update({
    where: { id },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.content !== undefined ? { content: parsed.data.content } : {}),
      ...(parsed.data.tags !== undefined ? { tags: parsed.data.tags.length ? JSON.stringify(parsed.data.tags) : null } : {}),
      ...(parsed.data.isFavorite !== undefined ? { isFavorite: parsed.data.isFavorite } : {}),
    },
  });

  return NextResponse.json({ note });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedNote(session.user.id, id);
  if (!existing) return NextResponse.json({ error: "Nota não encontrada" }, { status: 404 });

  await db.note.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
