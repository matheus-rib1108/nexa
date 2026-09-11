import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Busca global: propositalmente NÃO inclui o Cofre. Itens do Cofre exigem a
// senha mestra para serem decifrados e nunca aparecem em uma busca comum.
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ tasks: [], notes: [], subjects: [], exams: [] });

  const userId = session.user.id;

  const [tasks, notes, subjects, exams] = await Promise.all([
    db.task.findMany({
      where: { userId, title: { contains: q } },
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
    db.note.findMany({
      where: { userId, OR: [{ title: { contains: q } }, { content: { contains: q } }] },
      take: 10,
      orderBy: { updatedAt: "desc" },
    }),
    db.subject.findMany({ where: { userId, name: { contains: q } }, take: 10 }),
    db.exam.findMany({ where: { userId, title: { contains: q } }, take: 10 }),
  ]);

  return NextResponse.json({ tasks, notes, subjects, exams });
}
