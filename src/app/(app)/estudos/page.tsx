import { requireUserId } from "@/lib/session";
import { db } from "@/lib/db";
import { StudyBoard } from "./study-board";

export default async function EstudosPage() {
  const userId = await requireUserId();

  const [subjects, exams] = await Promise.all([
    db.subject.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      include: { _count: { select: { tasks: true, exams: true } } },
    }),
    db.exam.findMany({
      where: { userId },
      orderBy: { date: "asc" },
      include: { subject: true },
    }),
  ]);

  return <StudyBoard initialSubjects={JSON.parse(JSON.stringify(subjects))} initialExams={JSON.parse(JSON.stringify(exams))} />;
}
