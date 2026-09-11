import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  await db.user.update({ where: { id: session.user.id }, data: { sessionVersion: { increment: 1 } } });
  await db.securityLog.create({ data: { userId: session.user.id, type: "logout_all" } });

  return NextResponse.json({ ok: true });
}
