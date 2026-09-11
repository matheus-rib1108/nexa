import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { verifyMasterPassword, decryptVaultSecret } from "@/lib/crypto";
import { vaultUnlockSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const limited = rateLimit(`vault-reveal:${session.user.id}`, 30, 5 * 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente em alguns minutos." }, { status: 429 });
  }

  const { id } = await params;
  const item = await db.vaultItem.findUnique({ where: { id } });
  if (!item || item.userId !== session.user.id) {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { vaultMasterHash: true, vaultSalt: true },
  });
  if (!user?.vaultMasterHash || !user.vaultSalt) {
    return NextResponse.json({ error: "Cofre não configurado" }, { status: 400 });
  }

  const parsed = vaultUnlockSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const valid = await verifyMasterPassword(parsed.data.masterPassword, user.vaultMasterHash);
  if (!valid) return NextResponse.json({ error: "Senha mestra incorreta" }, { status: 401 });

  const secret = await decryptVaultSecret(item.encryptedSecret, item.iv, item.authTag, parsed.data.masterPassword, user.vaultSalt);

  return NextResponse.json({ secret });
}
