import { Suspense } from "react";
import { requireUserId } from "@/lib/session";
import { db } from "@/lib/db";
import { TimerScreen } from "./timer-screen";

export default async function FocoPage({
  searchParams,
}: {
  searchParams: Promise<{ taskId?: string; preset?: string }>;
}) {
  const userId = await requireUserId();
  const { taskId, preset } = await searchParams;

  let taskTitle: string | null = null;
  if (taskId) {
    const task = await db.task.findUnique({ where: { id: taskId } });
    if (task && task.userId === userId) taskTitle = task.title;
  }

  const user = await db.user.findUnique({ where: { id: userId }, select: { focusDefaultMinutes: true } });
  const defaultMinutes = preset ? parseInt(preset, 10) || 25 : user?.focusDefaultMinutes ?? 25;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 md:p-8">
      <Suspense>
        <TimerScreen taskTitle={taskTitle} defaultMinutes={defaultMinutes} />
      </Suspense>
    </div>
  );
}
