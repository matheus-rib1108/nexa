import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { focusSessionCompleteSchema } from "@/lib/validation";
import { awardXp } from "@/server/xp";
import { checkAndUnlockAchievements } from "@/server/achievements";
import { XP_REWARDS } from "@/lib/gamification";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const existing = await db.focusSession.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });
  }

  const parsed = focusSessionCompleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const focusSession = await db.focusSession.update({
    where: { id },
    data: {
      actualSeconds: parsed.data.actualSeconds,
      completed: parsed.data.completed,
      endedAt: new Date(),
    },
  });

  if (parsed.data.completed && !existing.completed) {
    await awardXp(session.user.id, XP_REWARDS.FOCUS_SESSION);
    await checkAndUnlockAchievements(session.user.id);
  }

  return NextResponse.json({ focusSession });
}
