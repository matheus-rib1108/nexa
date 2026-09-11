import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { z } from "zod";

const schema = z.object({ password: z.string().min(1) });

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Confirme sua senha para excluir a conta" }, { status: 400 });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });

  // Todas as relações do usuário estão configuradas com onDelete: Cascade no
  // schema do Prisma, então excluir o usuário remove em cascata suas
  // tarefas, notas, hábitos, itens do Cofre, etc.
  await db.user.delete({ where: { id: user.id } });

  return NextResponse.json({ ok: true });
}
