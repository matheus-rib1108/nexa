import { db } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";

export type Mission = { key: string; label: string; done: boolean };

export async function getTodayMissions(userId: string): Promise<{ missions: Mission[]; allDone: boolean; alreadyClaimed: boolean }> {
  const today = startOfDay(new Date());
  const todayEnd = endOfDay(today);

  const [focusToday, completedToday, habitToday, claim] = await Promise.all([
    db.focusSession.findFirst({
      where: { userId, completed: true, startedAt: { gte: today, lte: todayEnd }, durationMinutes: { gte: 25 } },
    }),
    db.task.count({ where: { userId, status: "concluida", completedAt: { gte: today, lte: todayEnd } } }),
    db.habitLog.findFirst({ where: { habit: { userId }, date: today, completed: true } }),
    db.securityLog.findFirst({ where: { userId, type: "mission_bonus", createdAt: { gte: today, lte: todayEnd } } }),
  ]);

  const missions: Mission[] = [
    { key: "focus25", label: "Fazer uma sessão de foco de 25 minutos", done: !!focusToday },
    { key: "complete3", label: "Concluir 3 tarefas", done: completedToday >= 3 },
    { key: "habit", label: "Marcar um hábito como feito", done: !!habitToday },
  ];

  return { missions, allDone: missions.every((m) => m.done), alreadyClaimed: !!claim };
}
