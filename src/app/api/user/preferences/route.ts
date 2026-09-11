import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  focusDefaultMinutes: z.number().int().min(1).max(240).optional(),
  reduceMotion: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const user = await db.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: { theme: true, focusDefaultMinutes: true, reduceMotion: true },
  });

  return NextResponse.json({ user });
}
