import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({ name: z.string().trim().min(1).max(80), color: z.string().max(20).optional() });

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const subjects = await db.subject.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { tasks: true, exams: true } },
    },
  });

  return NextResponse.json({ subjects });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const subject = await db.subject.upsert({
    where: { userId_name: { userId: session.user.id, name: parsed.data.name } },
    update: {},
    create: { userId: session.user.id, name: parsed.data.name, color: parsed.data.color ?? "#6366f1" },
  });

  return NextResponse.json({ subject }, { status: 201 });
}
