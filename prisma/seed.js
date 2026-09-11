// Dados de demonstração (seção 49 da especificação). Roda com:
//   node prisma/seed.js
// Cria um usuário de exemplo com tarefas, matérias, prova, hábitos, notas e
// sessões de foco reais no banco — nada é simulado no frontend.
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const db = new PrismaClient();

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  const email = "matheus@nexa.app";
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Usuário de demonstração já existe:", email);
    return;
  }

  const passwordHash = await bcrypt.hash("nexa1234", 12);

  const user = await db.user.create({
    data: {
      name: "Matheus",
      lastName: "Ribeiro",
      email,
      passwordHash,
      xp: 180,
      level: 1,
      onboardingCompleted: true,
      onboardingGoals: JSON.stringify(["Estudos", "Casa"]),
      onboardingChallenges: JSON.stringify(["Procrastinação", "Gerenciar tempo"]),
      onboardingTimeAvailable: "30 min a 1 hora",
    },
  });

  const [escola, casa] = await Promise.all([
    db.category.create({ data: { userId: user.id, name: "Escola", color: "#6d5ef1" } }),
    db.category.create({ data: { userId: user.id, name: "Casa", color: "#22a06b" } }),
  ]);

  const [matematica, historia, fisica, quimica] = await Promise.all([
    ["Matemática", "#6d5ef1"],
    ["História", "#f5a524"],
    ["Física", "#14b8a6"],
    ["Química", "#e5484d"],
  ].map(([name, color]) => db.subject.create({ data: { userId: user.id, name, color } })));

  await db.task.create({
    data: {
      userId: user.id,
      title: "Estudar matemática",
      description: "Revisar equações do 2º grau",
      categoryId: escola.id,
      subjectId: matematica.id,
      priority: "alta",
      isPriorityToday: true,
      dueDate: daysFromNow(1),
      estimatedMinutes: 30,
    },
  });

  const trabalhoHistoria = await db.task.create({
    data: {
      userId: user.id,
      title: "Fazer trabalho de história",
      categoryId: escola.id,
      subjectId: historia.id,
      priority: "alta",
      isPriorityToday: true,
      dueDate: daysFromNow(4),
      estimatedMinutes: 120,
    },
  });

  const historySteps = [
    "Escolher o tema",
    "Pesquisar informações",
    "Separar as fontes",
    "Criar a introdução",
    "Fazer o desenvolvimento",
    "Criar a conclusão",
    "Revisar",
    "Entregar",
  ];
  await db.$transaction(
    historySteps.map((title, i) =>
      db.task.create({
        data: { userId: user.id, title, parentTaskId: trabalhoHistoria.id, order: i, priority: "alta" },
      }),
    ),
  );

  await db.task.create({
    data: {
      userId: user.id,
      title: "Organizar mochila",
      categoryId: casa.id,
      priority: "baixa",
      estimatedMinutes: 10,
    },
  });

  await db.task.create({
    data: {
      userId: user.id,
      title: "Responder mensagem da Ana",
      categoryId: casa.id,
      priority: "baixa",
      estimatedMinutes: 5,
    },
  });

  await db.task.create({
    data: {
      userId: user.id,
      title: "Arrumar quarto",
      categoryId: casa.id,
      priority: "media",
      estimatedMinutes: 15,
      status: "concluida",
      completedAt: new Date(),
    },
  });

  const examDate = daysFromNow(5);
  await db.exam.create({
    data: {
      userId: user.id,
      subjectId: quimica.id,
      title: "Prova de Química",
      date: examDate,
      topics: JSON.stringify(["Tabela periódica", "Ligações químicas", "Estequiometria"]),
      studyPlan: JSON.stringify([
        { dayOffset: 1, minutes: 20, activity: "Revisar Tabela periódica" },
        { dayOffset: 2, minutes: 20, activity: "Revisar Ligações químicas" },
        { dayOffset: 3, minutes: 20, activity: "Revisar Estequiometria" },
        { dayOffset: 4, minutes: 25, activity: "Exercícios de Estequiometria" },
        { dayOffset: 5, minutes: 30, activity: "Revisão geral de tudo" },
      ]),
    },
  });

  await db.exam.create({
    data: {
      userId: user.id,
      subjectId: fisica.id,
      title: "Prova de Física",
      date: daysFromNow(8),
      topics: JSON.stringify(["Cinemática"]),
    },
  });

  const beberAgua = await db.habit.create({
    data: { userId: user.id, name: "Beber água", icon: "Droplet", streak: 3, bestStreak: 5, stage: "sprout" },
  });
  for (let i = 0; i < 3; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    await db.habitLog.create({ data: { habitId: beberAgua.id, date, completed: true } });
  }

  await db.habit.create({ data: { userId: user.id, name: "Ler 10 minutos", icon: "BookOpen" } });

  await db.note.create({
    data: {
      userId: user.id,
      title: "Ideia para o projeto",
      content: "Criar um aplicativo de estudos com flashcards e resumos por matéria.",
      tags: JSON.stringify(["projetos"]),
    },
  });
  await db.note.create({
    data: {
      userId: user.id,
      title: "Nome do professor",
      content: "Professor de história: João Marcos. Sala 12.",
      isFavorite: true,
    },
  });

  const now = new Date();
  await db.focusSession.create({
    data: {
      userId: user.id,
      durationMinutes: 25,
      actualSeconds: 1500,
      completed: true,
      startedAt: new Date(now.getTime() - 30 * 60 * 1000),
      endedAt: new Date(now.getTime() - 5 * 60 * 1000),
    },
  });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  await db.focusSession.create({
    data: {
      userId: user.id,
      durationMinutes: 25,
      actualSeconds: 1500,
      completed: true,
      startedAt: yesterday,
      endedAt: yesterday,
    },
  });

  await db.alarm.create({
    data: { userId: user.id, label: "Acordar", time: "07:00", daysOfWeek: JSON.stringify([1, 2, 3, 4, 5]) },
  });

  console.log("Seed concluído. Login de demonstração:");
  console.log("  e-mail: matheus@nexa.app");
  console.log("  senha:  nexa1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
