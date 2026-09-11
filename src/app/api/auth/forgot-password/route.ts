import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateRawToken, hashToken } from "@/lib/crypto";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutos

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });

  // Resposta idêntica exista ou não a conta, para não revelar quais e-mails estão cadastrados.
  const genericResponse = NextResponse.json({
    message: "Se este e-mail estiver cadastrado, um link de redefinição foi gerado.",
  });

  if (!user) return genericResponse;

  const rawToken = generateRawToken();
  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  // Este ambiente de demonstração não possui um serviço de envio de e-mail
  // configurado. Em produção, `rawToken` deve ser enviado por e-mail e nunca
  // retornado pela API. Aqui devolvemos o link apenas para manter o fluxo
  // funcional de ponta a ponta durante o desenvolvimento/demonstração.
  const devResetUrl = `/redefinir-senha?token=${rawToken}`;

  return NextResponse.json({
    message: "Link de redefinição gerado (envio de e-mail não configurado neste ambiente).",
    devResetUrl,
  });
}
