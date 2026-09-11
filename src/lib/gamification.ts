// Curva de XP simples e previsível: cada nível exige um pouco mais que o anterior.
// Nível N começa em xpForLevel(N) de XP acumulado.
export function xpForLevel(level: number): number {
  return Math.round(50 * (level - 1) * level * 0.5 + 50 * (level - 1));
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function xpProgress(xp: number) {
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  return {
    level,
    currentLevelXp: xp - floor,
    neededForNextLevel: ceil - floor,
    percent: Math.min(100, Math.round(((xp - floor) / (ceil - floor)) * 100)),
  };
}

export const XP_REWARDS = {
  TASK_COMPLETED: 20,
  SUBTASK_COMPLETED: 8,
  FOCUS_SESSION: 50,
  HABIT_CHECK: 15,
  MISSION_COMPLETED: 100,
} as const;

export const HABIT_STAGE_BY_STREAK = (streak: number): string => {
  if (streak >= 21) return "bloom";
  if (streak >= 10) return "tree";
  if (streak >= 3) return "sprout";
  return "seed";
};

export const HABIT_STAGE_EMOJI: Record<string, string> = {
  seed: "🌱",
  sprout: "🌿",
  tree: "🌳",
  bloom: "🌸",
};
