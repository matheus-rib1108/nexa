import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { verifyMasterPassword } from "@/lib/crypto";
import { vaultUnlockSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const limited = rateLimit(`vault-unlock:${session.user.id}`, 8, 5 * 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente em alguns minutos." }, { status: 429 });
  }

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { vaultMasterHash: true } });
  if (!user?.vaultMasterHash) return NextResponse.json({ error: "Cofre não configurado" }, { status: 400 });

  const parsed = vaultUnlockSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const valid = await verifyMasterPassword(parsed.data.masterPassword, user.vaultMasterHash);
  if (!valid) {
    return NextResponse.json({ error: "Senha mestra incorreta" }, { status: 401 });
  }

  await db.securityLog.create({ data: { userId: session.user.id, type: "vault_unlock" } });

  return NextResponse.json({ ok: true });
}
