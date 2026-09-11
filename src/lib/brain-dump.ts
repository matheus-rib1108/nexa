// Categorização automática do Brain Dump por palavras-chave (heurística, não IA generativa).
// O usuário sempre revisa a lista organizada antes de salvar qualquer item como tarefa.

export type BrainDumpCategory = "Escola" | "Compras" | "Pessoas" | "Casa" | "Outros";

const CATEGORY_KEYWORDS: Record<Exclude<BrainDumpCategory, "Outros">, string[]> = {
  Escola: [
    "estudar",
    "prova",
    "trabalho",
    "escola",
    "matéria",
    "uniforme",
    "aula",
    "dever",
    "professor",
    "faculdade",
    "atividade",
    "apresentação",
    "redação",
  ],
  Compras: ["comprar", "cartolina", "mercado", "loja", "material escolar", "farmácia"],
  Pessoas: ["responder", "ligar", "avisar", "falar com", "encontrar", "chamar", "convidar", "mensagem"],
  Casa: ["arrumar", "organizar", "limpar", "lavar", "guardar", "quarto", "cozinha", "roupa", "mochila"],
};

const FILLER_PREFIXES = [
  /^tenho (que|de)\s+/i,
  /^preciso\s+(de\s+)?/i,
  /^e\s+/i,
  /^não\s+esquecer\s+(de\s+)?/i,
  /^lembrar\s+(de\s+)?/i,
];

function cleanSegment(segment: string): string {
  let text = segment.trim();
  for (const pattern of FILLER_PREFIXES) {
    text = text.replace(pattern, "");
  }
  text = text.trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function splitIntoSegments(rawText: string): string[] {
  const lines = rawText.split(/\n+/).filter((l) => l.trim());
  const segments: string[] = [];

  for (const line of lines) {
    const parts = line
      .split(/,| e (?=[a-zà-úA-ZÀ-Ú])/)
      .map((p) => p.trim())
      .filter(Boolean);
    segments.push(...(parts.length > 0 ? parts : [line]));
  }

  return segments.map(cleanSegment).filter(Boolean);
}

function categorize(segment: string): BrainDumpCategory {
  const lower = segment.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return category as BrainDumpCategory;
  }
  return "Outros";
}

export function organizeBrainDump(rawText: string): Record<BrainDumpCategory, string[]> {
  const segments = splitIntoSegments(rawText);
  const result: Record<BrainDumpCategory, string[]> = {
    Escola: [],
    Compras: [],
    Pessoas: [],
    Casa: [],
    Outros: [],
  };

  for (const segment of segments) {
    result[categorize(segment)].push(segment);
  }

  return result;
}
