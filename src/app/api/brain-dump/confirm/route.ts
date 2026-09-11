import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const CATEGORY_COLORS: Record<string, string> = {
  Escola: "#6d5ef1",
  Compras: "#f5a524",
  Pessoas: "#14b8a6",
  Casa: "#22a06b",
};

const schema = z.object({
  items: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(200),
        category: z.enum(["Escola", "Compras", "Pessoas", "Casa", "Outros"]),
      }),
    )
    .min(1)
    .max(50),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const categoryNames = [...new Set(parsed.data.items.map((i) => i.category).filter((c) => c !== "Outros"))];

  const categoryMap = new Map<string, string>();
  for (const name of categoryNames) {
    const category = await db.category.upsert({
      where: { userId_name: { userId: session.user.id, name } },
      update: {},
      create: { userId: session.user.id, name, color: CATEGORY_COLORS[name] ?? "#6366f1" },
    });
    categoryMap.set(name, category.id);
  }

  const created = await db.$transaction(
    parsed.data.items.map((item) =>
      db.task.create({
        data: {
          userId: session.user.id,
          title: item.title,
          categoryId: item.category !== "Outros" ? categoryMap.get(item.category) : null,
        },
      }),
    ),
  );

  return NextResponse.json({ tasks: created }, { status: 201 });
}
