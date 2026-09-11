import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hashMasterPassword, generateVaultSalt } from "@/lib/crypto";
import { vaultSetupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { vaultMasterHash: true } });
  if (user?.vaultMasterHash) {
    return NextResponse.json({ error: "O Cofre já está configurado" }, { status: 409 });
  }

  const parsed = vaultSetupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });

  const vaultMasterHash = await hashMasterPassword(parsed.data.masterPassword);
  const vaultSalt = generateVaultSalt();

  await db.user.update({
    where: { id: session.user.id },
    data: { vaultMasterHash, vaultSalt, vaultCreatedAt: new Date() },
  });

  await db.securityLog.create({ data: { userId: session.user.id, type: "vault_unlock" } });

  return NextResponse.json({ ok: true });
}
