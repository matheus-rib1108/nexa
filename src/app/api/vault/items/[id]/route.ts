import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { verifyMasterPassword, encryptVaultSecret } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const updateSchema = z.object({
  categoryLabel: z.enum(["Senhas", "Contas", "Códigos", "Informações privadas"]).optional(),
  name: z.string().trim().min(1).max(200).optional(),
  username: z.string().max(200).optional().or(z.literal("")),
  urlLink: z.string().max(500).optional().or(z.literal("")),
  note: z.string().max(2000).optional().or(z.literal("")),
  secret: z.string().max(2000).optional(),
  masterPassword: z.string().min(1),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const existing = await db.vaultItem.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { vaultMasterHash: true, vaultSalt: true },
  });
  if (!user?.vaultMasterHash || !user.vaultSalt) {
    return NextResponse.json({ error: "Cofre não configurado" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  // Mesmo limite do /unlock: sem ele, esta rota permitiria força bruta na senha mestra.
  if (!rateLimit(`vault-unlock:${session.user.id}`, 8, 5 * 60 * 1000).allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente em alguns minutos." }, { status: 429 });
  }
  const valid = await verifyMasterPassword(parsed.data.masterPassword, user.vaultMasterHash);
  if (!valid) return NextResponse.json({ error: "Senha mestra incorreta" }, { status: 401 });

  let secretFields = {};
  if (parsed.data.secret !== undefined) {
    const { encryptedSecret, iv, authTag } = await encryptVaultSecret(parsed.data.secret, parsed.data.masterPassword, user.vaultSalt);
    secretFields = { encryptedSecret, iv, authTag };
  }

  const item = await db.vaultItem.update({
    where: { id },
    data: {
      ...(parsed.data.categoryLabel !== undefined ? { categoryLabel: parsed.data.categoryLabel } : {}),
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.username !== undefined ? { username: parsed.data.username || null } : {}),
      ...(parsed.data.urlLink !== undefined ? { urlLink: parsed.data.urlLink || null } : {}),
      ...(parsed.data.note !== undefined ? { note: parsed.data.note || null } : {}),
      ...secretFields,
    },
    select: { id: true, categoryLabel: true, name: true, username: true, urlLink: true, note: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const existing = await db.vaultItem.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
  }

  await db.vaultItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
