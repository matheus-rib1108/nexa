import { db } from "@/lib/db";

// Impede ligar um registro a categoria/matéria/tarefa de outro usuário (IDOR).
export async function ownsRefs(
  userId: string,
  refs: { categoryId?: string | null; subjectId?: string | null; parentTaskId?: string | null },
): Promise<boolean> {
  const checks = await Promise.all([
    refs.categoryId ? db.category.count({ where: { id: refs.categoryId, userId } }) : 1,
    refs.subjectId ? db.subject.count({ where: { id: refs.subjectId, userId } }) : 1,
    refs.parentTaskId ? db.task.count({ where: { id: refs.parentTaskId, userId } }) : 1,
  ]);
  return checks.every((n) => n > 0);
}
