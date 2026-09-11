import { db } from "@/lib/db";
import { startOfDay, subDays } from "date-fns";
import { HABIT_STAGE_BY_STREAK } from "@/lib/gamification";

export async function recalcHabitStreak(habitId: string) {
  const logs = await db.habitLog.findMany({ where: { habitId, completed: true } });
  const dates = new Set(logs.map((l) => startOfDay(l.date).getTime()));

  let streak = 0;
  let cursor = startOfDay(new Date());
  while (dates.has(cursor.getTime())) {
    streak++;
    cursor = subDays(cursor, 1);
  }

  const habit = await db.habit.findUnique({ where: { id: habitId } });
  const bestStreak = Math.max(streak, habit?.bestStreak ?? 0);
  const stage = HABIT_STAGE_BY_STREAK(streak);

  await db.habit.update({ where: { id: habitId }, data: { streak, bestStreak, stage } });
  return { streak, bestStreak, stage };
}
