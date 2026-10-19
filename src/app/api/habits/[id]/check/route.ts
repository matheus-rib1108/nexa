import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { startOfDay } from "date-fns";
import { recalcHabitStreak } from "@/server/habits";
import { awardXp } from "@/server/xp";
import { checkAndUnlockAchievements } from "@/server/achievements";
import { XP_REWARDS } from "@/lib/gamification";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const habit = await db.habit.findUnique({ where: { id } });
  if (!habit || habit.userId !== session.user.id) {
    return NextResponse.json({ error: "Hábito não encontrado" }, { status: 404 });
  }

  const today = startOfDay(new Date());
  const existing = await db.habitLog.findUnique({ where: { habitId_date: { habitId: id, date: today } } });

  let nowCompleted: boolean;
  if (existing) {
    nowCompleted = !existing.completed;
    await db.habitLog.update({ where: { id: existing.id }, data: { completed: nowCompleted } });
  } else {
    nowCompleted = true;
    await db.habitLog.create({ data: { habitId: id, date: today, completed: true } });
  }

  const result = await recalcHabitStreak(id);

  // XP só na primeira marcação do dia: desmarcar e marcar de novo não dá XP extra.
  if (nowCompleted && !existing) {
    await awardXp(session.user.id, XP_REWARDS.HABIT_CHECK);
    await checkAndUnlockAchievements(session.user.id);
  }

  return NextResponse.json({ completedToday: nowCompleted, ...result });
}
