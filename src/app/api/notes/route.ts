import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { noteSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  const notes = await db.note.findMany({
    where: {
      userId: session.user.id,
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { content: { contains: q } },
              { tags: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json({ notes });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const parsed = noteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const note = await db.note.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title,
      content: parsed.data.content,
      tags: parsed.data.tags?.length ? JSON.stringify(parsed.data.tags) : null,
      isFavorite: parsed.data.isFavorite ?? false,
    },
  });

  return NextResponse.json({ note }, { status: 201 });
}
