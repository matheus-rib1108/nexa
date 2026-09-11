import { requireUserId } from "@/lib/session";
import { db } from "@/lib/db";
import { AlarmsBoard } from "./alarms-board";

export default async function AlarmesPage() {
  const userId = await requireUserId();
  const alarms = await db.alarm.findMany({ where: { userId }, orderBy: { time: "asc" } });
  return <AlarmsBoard initialAlarms={alarms} />;
}
