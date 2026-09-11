import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { vaultMasterHash: true } });
  return NextResponse.json({ configured: !!user?.vaultMasterHash });
}
