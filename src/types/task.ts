export type SerializedTask = {
  id: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  category: { id: string; name: string; color: string } | null;
  subjectId: string | null;
  subject: { id: string; name: string; color: string } | null;
  priority: "baixa" | "media" | "alta";
  status: "pendente" | "em_andamento" | "concluida" | "atrasada" | "arquivada";
  dueDate: string | null;
  dueTime: string | null;
  estimatedMinutes: number | null;
  tags: string | null;
  notes: string | null;
  isPriorityToday: boolean;
  parentTaskId: string | null;
  order: number;
  completedAt: string | null;
  createdAt: string;
  // As consultas só carregam um nível de subtarefas: um item dentro de
  // `subtasks` nunca traz seu próprio `subtasks` preenchido.
  subtasks?: SerializedTask[];
};

export type Category = { id: string; name: string; color: string; icon: string };
export type Subject = { id: string; name: string; color: string };
