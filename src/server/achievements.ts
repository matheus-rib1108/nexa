import { db } from "@/lib/db";
import { awardXp } from "@/server/xp";

export const ACHIEVEMENT_DEFS = [
  { key: "first_task", name: "Primeira tarefa", description: "Concluiu a primeira tarefa no NEXA", icon: "CheckCircle2", xpReward: 30 },
  { key: "task_10", name: "Em ritmo", description: "Concluiu 10 tarefas", icon: "ListChecks", xpReward: 60 },
  { key: "task_50", name: "Imparável", description: "Concluiu 50 tarefas", icon: "Trophy", xpReward: 150 },
  { key: "focus_5", name: "Foco em dia", description: "Completou 5 sessões de foco", icon: "Headphones", xpReward: 60 },
  { key: "habit_streak_7", name: "Uma semana de hábito", description: "Manteve um hábito por 7 dias seguidos", icon: "Sprout", xpReward: 80 },
  { key: "level_5", name: "Nível 5", description: "Alcançou o nível 5", icon: "Star", xpReward: 100 },
] as const;

export async function checkAndUnlockAchievements(userId: string) {
  const [taskCompletedCount, focusCompletedCount, maxHabitStreak, user] = await Promise.all([
    db.task.count({ where: { userId, status: "concluida" } }),
    db.focusSession.count({ where: { userId, completed: true } }),
    db.habit.aggregate({ where: { userId }, _max: { bestStreak: true } }),
    db.user.findUnique({ where: { id: userId }, select: { level: true } }),
  ]);

  const unlockedKeys = new Set(
    (
      await db.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
      })
    ).map((ua) => ua.achievement.key),
  );

  const toUnlock: string[] = [];
  if (taskCompletedCount >= 1) toUnlock.push("first_task");
  if (taskCompletedCount >= 10) toUnlock.push("task_10");
  if (taskCompletedCount >= 50) toUnlock.push("task_50");
  if (focusCompletedCount >= 5) toUnlock.push("focus_5");
  if ((maxHabitStreak._max.bestStreak ?? 0) >= 7) toUnlock.push("habit_streak_7");
  if ((user?.level ?? 1) >= 5) toUnlock.push("level_5");

  const newlyUnlocked = toUnlock.filter((k) => !unlockedKeys.has(k));
  if (newlyUnlocked.length === 0) return [];

  for (const key of newlyUnlocked) {
    const def = ACHIEVEMENT_DEFS.find((d) => d.key === key)!;
    const achievement = await db.achievement.upsert({
      where: { key },
      update: {},
      create: def,
    });
    await db.userAchievement.create({ data: { userId, achievementId: achievement.id } });
    await awardXp(userId, achievement.xpReward);
  }

  return newlyUnlocked;
}
