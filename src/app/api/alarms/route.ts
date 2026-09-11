import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  label: z.string().trim().min(1).max(80),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário inválido"),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
  sound: z.string().max(30).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const alarms = await db.alarm.findMany({ where: { userId: session.user.id }, orderBy: { time: "asc" } });
  return NextResponse.json({ alarms });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });

  const alarm = await db.alarm.create({
    data: {
      userId: session.user.id,
      label: parsed.data.label,
      time: parsed.data.time,
      daysOfWeek: JSON.stringify(parsed.data.daysOfWeek),
      sound: parsed.data.sound ?? "padrao",
    },
  });

  return NextResponse.json({ alarm }, { status: 201 });
}
