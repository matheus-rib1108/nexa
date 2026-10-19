import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateRawToken, hashToken } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutos
const GENERIC = { message: "Se este e-mail estiver cadastrado, enviaremos um link de redefinição." };

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  // Resposta idêntica exista ou não a conta, para não revelar quais e-mails estão cadastrados.
  const genericResponse = NextResponse.json(GENERIC);

  if (!rateLimit(`forgot:${email}`, 3, 15 * 60 * 1000).allowed) return genericResponse;

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return genericResponse;

  const rawToken = generateRawToken();
  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  // O link só pode sair por e-mail. Sem serviço de e-mail configurado, só o ambiente local mostra o link.
  if (process.env.NODE_ENV === "development") {
    return NextResponse.json({ ...GENERIC, devResetUrl: `/redefinir-senha?token=${rawToken}` });
  }
  return genericResponse;
}
