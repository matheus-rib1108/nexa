import { db } from "@/lib/db";
import { differenceInCalendarDays, startOfToday } from "date-fns";

export type DeadlineItem = {
  id: string;
  title: string;
  date: Date;
  type: "task" | "exam";
  daysUntil: number;
  bucket: "urgente" | "proximo" | "atencao" | "futuro";
};

function bucketFor(daysUntil: number): DeadlineItem["bucket"] {
  if (daysUntil <= 1) return "urgente";
  if (daysUntil <= 3) return "proximo";
  if (daysUntil <= 7) return "atencao";
  return "futuro";
}

export async function getDeadlineRadar(userId: string) {
  const today = startOfToday();

  const [tasks, exams] = await Promise.all([
    db.task.findMany({
      where: {
        userId,
        dueDate: { gte: today },
        status: { in: ["pendente", "em_andamento"] },
      },
      orderBy: { dueDate: "asc" },
    }),
    db.exam.findMany({
      where: { userId, date: { gte: today } },
      orderBy: { date: "asc" },
      include: { subject: true },
    }),
  ]);

  const items: DeadlineItem[] = [
    ...tasks.map((t) => {
      const daysUntil = differenceInCalendarDays(t.dueDate!, today);
      return { id: t.id, title: t.title, date: t.dueDate!, type: "task" as const, daysUntil, bucket: bucketFor(daysUntil) };
    }),
    ...exams.map((e) => {
      const daysUntil = differenceInCalendarDays(e.date, today);
      return {
        id: e.id,
        title: `Prova de ${e.subject?.name ?? e.title}`,
        date: e.date,
        type: "exam" as const,
        daysUntil,
        bucket: bucketFor(daysUntil),
      };
    }),
  ].sort((a, b) => a.daysUntil - b.daysUntil);

  const withinWeek = items.filter((i) => i.daysUntil <= 7);
  const overloaded = withinWeek.length >= 4;

  const suggestion = overloaded
    ? withinWeek.find((i) => i.daysUntil > 1 && i.daysUntil <= 6) ?? withinWeek[withinWeek.length - 1]
    : null;

  return { items, overloaded, weekCount: withinWeek.length, suggestion };
}
