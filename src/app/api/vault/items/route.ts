import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { verifyMasterPassword, encryptVaultSecret } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { vaultItemSchema } from "@/lib/validation";

// Nunca retorna encryptedSecret/iv/authTag na listagem — apenas metadados.
// O segredo só é decifrado sob demanda em /api/vault/items/[id]/reveal.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const items = await db.vaultItem.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      categoryLabel: true,
      name: true,
      username: true,
      urlLink: true,
      note: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { vaultMasterHash: true, vaultSalt: true },
  });
  if (!user?.vaultMasterHash || !user.vaultSalt) {
    return NextResponse.json({ error: "Cofre não configurado" }, { status: 400 });
  }

  const parsed = vaultItemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });

  // Mesmo limite do /unlock: sem ele, esta rota permitiria força bruta na senha mestra.
  if (!rateLimit(`vault-unlock:${session.user.id}`, 8, 5 * 60 * 1000).allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente em alguns minutos." }, { status: 429 });
  }
  const valid = await verifyMasterPassword(parsed.data.masterPassword, user.vaultMasterHash);
  if (!valid) return NextResponse.json({ error: "Senha mestra incorreta" }, { status: 401 });

  const { encryptedSecret, iv, authTag } = await encryptVaultSecret(
    parsed.data.secret,
    parsed.data.masterPassword,
    user.vaultSalt,
  );

  const item = await db.vaultItem.create({
    data: {
      userId: session.user.id,
      categoryLabel: parsed.data.categoryLabel,
      name: parsed.data.name,
      username: parsed.data.username || null,
      urlLink: parsed.data.urlLink || null,
      note: parsed.data.note || null,
      encryptedSecret,
      iv,
      authTag,
    },
    select: { id: true, categoryLabel: true, name: true, username: true, urlLink: true, note: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ item }, { status: 201 });
}
