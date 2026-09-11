import { db } from "@/lib/db";
import { levelFromXp } from "@/lib/gamification";

export async function awardXp(userId: string, amount: number) {
  const user = await db.user.update({
    where: { id: userId },
    data: { xp: { increment: amount } },
    select: { xp: true },
  });
  const level = levelFromXp(user.xp);
  if (level !== undefined) {
    await db.user.update({ where: { id: userId }, data: { level } });
  }
  return { xp: user.xp, level };
}
