import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getTodayMissions } from "@/server/missions";
import { awardXp } from "@/server/xp";
import { XP_REWARDS } from "@/lib/gamification";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { allDone, alreadyClaimed } = await getTodayMissions(session.user.id);
  if (!allDone || alreadyClaimed) {
    return NextResponse.json({ error: "Missão ainda não concluída ou já resgatada" }, { status: 400 });
  }

  await db.securityLog.create({ data: { userId: session.user.id, type: "mission_bonus" } });
  const result = await awardXp(session.user.id, XP_REWARDS.MISSION_COMPLETED);

  return NextResponse.json({ ok: true, ...result });
}
