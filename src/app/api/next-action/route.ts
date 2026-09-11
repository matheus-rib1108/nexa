import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getNextAction } from "@/server/priority";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const nextAction = await getNextAction(session.user.id);
  return NextResponse.json({ nextAction });
}
