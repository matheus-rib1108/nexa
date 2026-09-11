import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const minutes = parseInt(searchParams.get("minutes") ?? "5", 10);

  const tasks = await db.task.findMany({
    where: {
      userId: session.user.id,
      status: { in: ["pendente", "em_andamento"] },
      estimatedMinutes: { lte: minutes },
    },
    orderBy: { estimatedMinutes: "asc" },
    take: 8,
    include: { category: true },
  });

  return NextResponse.json({ tasks });
}
