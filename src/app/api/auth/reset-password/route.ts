import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/crypto";
import { hashPassword } from "@/lib/password";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const tokenHash = hashToken(parsed.data.token);
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash } });

  const invalid = NextResponse.json({ error: "Link inválido ou expirado" }, { status: 400 });
  if (!record || record.usedAt || record.expiresAt < new Date()) return invalid;

  const passwordHash = await hashPassword(parsed.data.password);

  // Marca o token como usado de forma atômica: dois pedidos simultâneos não passam juntos.
  const claimed = await db.passwordResetToken.updateMany({
    where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (claimed.count === 0) return invalid;

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    }),
    db.securityLog.create({ data: { userId: record.userId, type: "password_change" } }),
  ]);

  return NextResponse.json({ message: "Senha redefinida com sucesso." });
}
