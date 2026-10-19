import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { differenceInCalendarDays, startOfToday } from "date-fns";
import { generateStudyPlan } from "@/lib/study-plan";
import { ownsRefs } from "@/server/ownership";

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  subjectId: z.string().optional().nullable(),
  date: z.string().min(1).refine((s) => !isNaN(Date.parse(s)), "Data inválida"),
  topics: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const exams = await db.exam.findMany({
    where: {
      userId: session.user.id,
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: { subject: true },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ exams });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  if (!(await ownsRefs(session.user.id, { subjectId: parsed.data.subjectId }))) {
    return NextResponse.json({ error: "Matéria não encontrada" }, { status: 404 });
  }

  const examDate = new Date(parsed.data.date);
  const daysUntilExam = differenceInCalendarDays(examDate, startOfToday());
  const studyPlan = generateStudyPlan(parsed.data.topics ?? [], daysUntilExam);

  const exam = await db.exam.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title,
      subjectId: parsed.data.subjectId || null,
      date: examDate,
      topics: parsed.data.topics?.length ? JSON.stringify(parsed.data.topics) : null,
      studyPlan: studyPlan.length ? JSON.stringify(studyPlan) : null,
    },
    include: { subject: true },
  });

  return NextResponse.json({ exam }, { status: 201 });
}
