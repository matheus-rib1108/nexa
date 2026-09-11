import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Informe seu nome").max(80),
  lastName: z.string().trim().max(80).optional().or(z.literal("")),
  email: z.string().email("E-mail inválido").toLowerCase(),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres").max(200),
  birthDate: z.string().optional().or(z.literal("")),
});

export const onboardingSchema = z.object({
  goals: z.array(z.string()).min(1),
  challenges: z.array(z.string()).min(1),
  timeAvailable: z.string().min(1),
});

export const PRIORITIES = ["baixa", "media", "alta"] as const;
export const TASK_STATUSES = ["pendente", "em_andamento", "concluida", "atrasada", "arquivada"] as const;

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório").max(200),
  description: z.string().max(4000).optional().or(z.literal("")),
  categoryId: z.string().optional().nullable(),
  subjectId: z.string().optional().nullable(),
  priority: z.enum(PRIORITIES).default("media"),
  dueDate: z.string().optional().nullable(),
  dueTime: z.string().optional().nullable(),
  estimatedMinutes: z.number().int().positive().max(1440).optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(4000).optional().or(z.literal("")),
  isPriorityToday: z.boolean().optional(),
  parentTaskId: z.string().optional().nullable(),
});

export const taskUpdateSchema = taskSchema.partial().extend({
  status: z.enum(TASK_STATUSES).optional(),
  order: z.number().int().optional(),
});

export const habitSchema = z.object({
  name: z.string().trim().min(1).max(120),
  icon: z.string().max(40).optional(),
  frequency: z.string().max(40).optional(),
});

export const noteSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório").max(200),
  content: z.string().max(20000),
  tags: z.array(z.string()).optional(),
  isFavorite: z.boolean().optional(),
});

export const brainDumpSchema = z.object({
  rawText: z.string().trim().min(1).max(10000),
});

export const focusSessionSchema = z.object({
  taskId: z.string().optional().nullable(),
  durationMinutes: z.number().int().positive().max(240),
  ambientSound: z.string().max(40).optional().nullable(),
});

export const focusSessionCompleteSchema = z.object({
  actualSeconds: z.number().int().nonnegative(),
  completed: z.boolean(),
});

export const vaultSetupSchema = z.object({
  masterPassword: z.string().min(8, "A senha mestra deve ter pelo menos 8 caracteres").max(200),
});

export const vaultUnlockSchema = z.object({
  masterPassword: z.string().min(1),
});

export const vaultItemSchema = z.object({
  categoryLabel: z.enum(["Senhas", "Contas", "Códigos", "Informações privadas"]).default("Senhas"),
  name: z.string().trim().min(1).max(200),
  username: z.string().max(200).optional().or(z.literal("")),
  urlLink: z.string().max(500).optional().or(z.literal("")),
  note: z.string().max(2000).optional().or(z.literal("")),
  secret: z.string().min(1).max(2000),
  masterPassword: z.string().min(1),
});
