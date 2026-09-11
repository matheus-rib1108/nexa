import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTodayMissions } from "@/server/missions";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const data = await getTodayMissions(session.user.id);
  return NextResponse.json(data);
}
