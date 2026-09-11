import { db } from "@/lib/db";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function getWeeklyStats(userId: string) {
  const days = Array.from({ length: 7 }, (_, i) => subDays(startOfDay(new Date()), 6 - i));

  const results = await Promise.all(
    days.map(async (day) => {
      const count = await db.task.count({
        where: { userId, status: "concluida", completedAt: { gte: day, lte: endOfDay(day) } },
      });
      return { label: format(day, "EEEEEE", { locale: ptBR }), count };
    }),
  );

  return results;
}

export async function getOverallStats(userId: string) {
  const [completedTotal, pendingTotal, overdueTotal, focusSessions, activeDaysRaw] = await Promise.all([
    db.task.count({ where: { userId, status: "concluida" } }),
    db.task.count({ where: { userId, status: { in: ["pendente", "em_andamento"] } } }),
    db.task.count({
      where: { userId, status: { in: ["pendente", "em_andamento"] }, dueDate: { lt: startOfDay(new Date()) } },
    }),
    db.focusSession.findMany({ where: { userId, completed: true }, select: { actualSeconds: true, durationMinutes: true, startedAt: true } }),
    db.task.findMany({
      where: { userId, status: "concluida" },
      select: { completedAt: true },
    }),
  ]);

  const totalFocusMinutes = Math.round(
    focusSessions.reduce((sum, s) => sum + (s.actualSeconds ? s.actualSeconds / 60 : s.durationMinutes), 0),
  );

  const activeDays = new Set(
    [...activeDaysRaw.map((t) => t.completedAt), ...focusSessions.map((f) => f.startedAt)]
      .filter((d): d is Date => !!d)
      .map((d) => startOfDay(d).toISOString()),
  ).size;

  return { completedTotal, pendingTotal, overdueTotal, totalFocusMinutes, focusSessionsCount: focusSessions.length, activeDays };
}
