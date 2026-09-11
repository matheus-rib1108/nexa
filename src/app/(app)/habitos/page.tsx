import { requireUserId } from "@/lib/session";
import { db } from "@/lib/db";
import { HabitGarden } from "./habit-garden";
import { subDays, startOfDay } from "date-fns";

export default async function HabitosPage() {
  const userId = await requireUserId();
  const since = subDays(startOfDay(new Date()), 13);

  const habits = await db.habit.findMany({
    where: { userId, archivedAt: null },
    orderBy: { createdAt: "asc" },
    include: { logs: { where: { date: { gte: since } } } },
  });

  return <HabitGarden initialHabits={JSON.parse(JSON.stringify(habits))} />;
}
