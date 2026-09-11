import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres"),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const limited = rateLimit(`change-password:${session.user.id}`, 8, 5 * 60 * 1000);
  if (!limited.allowed) return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Senha atual incorreta" }, { status: 401 });

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash, sessionVersion: { increment: 1 } },
  });
  await db.securityLog.create({ data: { userId: user.id, type: "password_change" } });

  return NextResponse.json({ ok: true });
}
