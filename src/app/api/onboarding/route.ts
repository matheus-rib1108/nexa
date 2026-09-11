import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { onboardingSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const parsed = onboardingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  await db.user.update({
    where: { id: session.user.id },
    data: {
      onboardingCompleted: true,
      onboardingGoals: JSON.stringify(parsed.data.goals),
      onboardingChallenges: JSON.stringify(parsed.data.challenges),
      onboardingTimeAvailable: parsed.data.timeAvailable,
    },
  });

  return NextResponse.json({ ok: true });
}
