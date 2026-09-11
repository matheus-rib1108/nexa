import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { habitSchema } from "@/lib/validation";
import { subDays, startOfDay } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const since = subDays(startOfDay(new Date()), 13);

  const habits = await db.habit.findMany({
    where: { userId: session.user.id, archivedAt: null },
    orderBy: { createdAt: "asc" },
    include: { logs: { where: { date: { gte: since } } } },
  });

  return NextResponse.json({ habits });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const parsed = habitSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const habit = await db.habit.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      icon: parsed.data.icon ?? "Sparkles",
      frequency: parsed.data.frequency ?? "daily",
    },
    include: { logs: true },
  });

  return NextResponse.json({ habit }, { status: 201 });
}
