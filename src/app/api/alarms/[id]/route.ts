import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  label: z.string().trim().min(1).max(80).optional(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  sound: z.string().max(30).optional(),
  enabled: z.boolean().optional(),
});

async function getOwnedAlarm(userId: string, id: string) {
  const alarm = await db.alarm.findUnique({ where: { id } });
  if (!alarm || alarm.userId !== userId) return null;
  return alarm;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedAlarm(session.user.id, id);
  if (!existing) return NextResponse.json({ error: "Alarme não encontrado" }, { status: 404 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const alarm = await db.alarm.update({
    where: { id },
    data: {
      ...(parsed.data.label !== undefined ? { label: parsed.data.label } : {}),
      ...(parsed.data.time !== undefined ? { time: parsed.data.time } : {}),
      ...(parsed.data.daysOfWeek !== undefined ? { daysOfWeek: JSON.stringify(parsed.data.daysOfWeek) } : {}),
      ...(parsed.data.sound !== undefined ? { sound: parsed.data.sound } : {}),
      ...(parsed.data.enabled !== undefined ? { enabled: parsed.data.enabled } : {}),
    },
  });

  return NextResponse.json({ alarm });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedAlarm(session.user.id, id);
  if (!existing) return NextResponse.json({ error: "Alarme não encontrado" }, { status: 404 });

  await db.alarm.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
