import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1).max(60),
  color: z.string().max(20).optional(),
  icon: z.string().max(40).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const categories = await db.category.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const category = await db.category.upsert({
    where: { userId_name: { userId: session.user.id, name: parsed.data.name } },
    update: {},
    create: {
      userId: session.user.id,
      name: parsed.data.name,
      color: parsed.data.color ?? "#6366f1",
      icon: parsed.data.icon ?? "Circle",
    },
  });

  return NextResponse.json({ category }, { status: 201 });
}
