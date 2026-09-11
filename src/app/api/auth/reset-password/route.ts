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

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    db.securityLog.create({ data: { userId: record.userId, type: "password_change" } }),
  ]);

  return NextResponse.json({ message: "Senha redefinida com sucesso." });
}
