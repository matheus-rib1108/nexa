import { db } from "@/lib/db";
import { endOfDay, startOfToday, addDays } from "date-fns";
import { getActiveTopLevelTasks, sortBySmartPriority } from "@/server/priority";

export async function getDashboardData(userId: string) {
  const today = startOfToday();
  const todayEnd = endOfDay(today);

  const [activeTasks, completedToday, focusToday, exams] = await Promise.all([
    getActiveTopLevelTasks(userId),
    db.task.findMany({
      where: { userId, status: "concluida", completedAt: { gte: today, lte: todayEnd } },
      select: { id: true },
    }),
    db.focusSession.findMany({
      where: { userId, completed: true, startedAt: { gte: today, lte: todayEnd } },
      select: { actualSeconds: true, durationMinutes: true },
    }),
    db.exam.findMany({
      where: { userId, date: { gte: today } },
      orderBy: { date: "asc" },
      take: 5,
      include: { subject: true },
    }),
  ]);

  const ordered = sortBySmartPriority(activeTasks);
  const priorityToday = ordered.filter((t) => t.isPriorityToday);
  const others = ordered.filter((t) => !t.isPriorityToday);

  const upcomingTaskDeadlines = ordered
    .filter((t) => t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const focusMinutesToday = Math.round(
    focusToday.reduce((sum, s) => sum + (s.actualSeconds ? s.actualSeconds / 60 : s.durationMinutes), 0),
  );

  return {
    priorityToday,
    others,
    upcomingTaskDeadlines,
    exams,
    stats: {
      completedToday: completedToday.length,
      pending: activeTasks.length,
      focusMinutesToday,
    },
  };
}

export function inSevenDays() {
  return addDays(new Date(), 7);
}
