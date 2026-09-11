// Planejador de provas (seção 19): distribui os conteúdos informados pelos
// dias disponíveis até a prova, reservando o último dia antes da prova para
// uma revisão geral. É uma heurística determinística — não uma IA generativa.

export type StudyPlanItem = { dayOffset: number; minutes: number; activity: string };

export function generateStudyPlan(topics: string[], daysUntilExam: number): StudyPlanItem[] {
  if (daysUntilExam <= 0) return [];

  const topicsToSchedule = topics.length > 0 ? topics : ["Conteúdo geral"];
  const studyDays = Math.max(1, daysUntilExam - (daysUntilExam >= 2 ? 1 : 0));
  const plan: StudyPlanItem[] = [];

  for (let i = 0; i < studyDays; i++) {
    const topic = topicsToSchedule[i % topicsToSchedule.length];
    const isLastStudyDay = i === studyDays - 1;
    const isExerciseDay = isLastStudyDay && topicsToSchedule.length > 1;
    plan.push({
      dayOffset: i + 1,
      minutes: isExerciseDay ? 25 : 20,
      activity: isExerciseDay ? `Exercícios de ${topic}` : `Revisar ${topic}`,
    });
  }

  if (daysUntilExam >= 2) {
    plan.push({ dayOffset: daysUntilExam, minutes: 30, activity: "Revisão geral de tudo" });
  }

  return plan;
}
