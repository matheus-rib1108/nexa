// Gerador de quebra de tarefas (Task Break) baseado em regras/templates.
//
// Importante: isto NÃO é uma IA generativa. É um conjunto de modelos por
// palavra-chave que cobre os casos mais comuns (trabalhos escolares, provas,
// tarefas domésticas, mensagens/burocracia). Quando nenhum modelo específico
// combina, cai num roteiro genérico de 4 passos. O usuário sempre revisa e
// edita a lista antes de salvar (nenhuma subtarefa é criada sem confirmação).

type Template = { keywords: string[]; steps: string[] };

const TEMPLATES: Template[] = [
  {
    keywords: ["trabalho", "redação", "relatório", "projeto escolar", "monografia", "artigo"],
    steps: [
      "Escolher o tema",
      "Pesquisar informações",
      "Separar as fontes",
      "Criar a introdução",
      "Fazer o desenvolvimento",
      "Criar a conclusão",
      "Revisar",
      "Entregar",
    ],
  },
  {
    keywords: ["prova", "estudar", "revisão", "simulado"],
    steps: [
      "Reunir o material de estudo",
      "Revisar o conteúdo principal",
      "Fazer exercícios de prática",
      "Revisar os pontos com mais dúvida",
      "Fazer uma revisão final",
    ],
  },
  {
    keywords: ["quarto", "arrumar o quarto", "limpar o quarto"],
    steps: ["Pegar as roupas espalhadas", "Guardar os sapatos", "Jogar o lixo fora", "Arrumar a cama", "Organizar a mesa"],
  },
  {
    keywords: ["mochila"],
    steps: [
      "Tirar tudo da mochila",
      "Separar o que não vai usar mais",
      "Conferir a agenda de amanhã",
      "Guardar os materiais do dia seguinte",
    ],
  },
  {
    keywords: ["apresentação", "seminário", "slides"],
    steps: [
      "Definir o roteiro da apresentação",
      "Criar os slides principais",
      "Adicionar imagens/gráficos",
      "Ensaiar a fala",
      "Revisar o tempo total",
    ],
  },
  {
    keywords: ["e-mail", "email", "mensagem", "responder"],
    steps: ["Reler o que foi pedido", "Escrever um rascunho curto", "Revisar antes de enviar", "Enviar"],
  },
];

const GENERIC_STEPS = [
  "Reunir o que for necessário para começar",
  "Fazer a primeira parte pequena",
  "Continuar até a metade",
  "Revisar o que foi feito",
  "Concluir",
];

export function generateBreakdownSteps(title: string, description?: string): string[] {
  const haystack = `${title} ${description ?? ""}`.toLowerCase();

  for (const template of TEMPLATES) {
    if (template.keywords.some((kw) => haystack.includes(kw))) {
      return template.steps;
    }
  }

  return GENERIC_STEPS;
}
