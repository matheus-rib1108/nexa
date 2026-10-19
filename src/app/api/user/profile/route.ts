import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { optionalDate } from "@/lib/validation";

const schema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().max(80).optional().or(z.literal("")),
  birthDate: optionalDate.optional(),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const user = await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.lastName !== undefined ? { lastName: parsed.data.lastName || null } : {}),
      ...(parsed.data.birthDate !== undefined ? { birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null } : {}),
    },
    select: { name: true, lastName: true, birthDate: true },
  });

  return NextResponse.json({ user });
}
