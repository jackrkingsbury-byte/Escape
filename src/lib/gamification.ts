/**
 * Progression math. Mirrors the SQL in complete_mission():
 * cumulative XP required for level n = 100 * (n-1)^1.5
 */

export function levelForXp(xp: number): number {
  return Math.max(1, Math.floor(Math.pow(xp / 100, 1 / 1.5)) + 1);
}

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.ceil(100 * Math.pow(level - 1, 1.5));
}

export function levelProgress(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  percent: number;
} {
  const level = levelForXp(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const percent = Math.min(
    100,
    Math.round(((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)
  );
  return { level, currentLevelXp, nextLevelXp, percent };
}

export const XP_BY_DIFFICULTY: Record<string, number> = {
  easy: 15,
  medium: 25,
  hard: 50,
  epic: 100,
};

export const LEVEL_TITLES: [number, string][] = [
  [1, "Initiate"],
  [3, "Apprentice"],
  [5, "Operator"],
  [8, "Specialist"],
  [12, "Veteran"],
  [18, "Elite"],
  [25, "Master"],
  [35, "Grandmaster"],
  [50, "Ascendant"],
];

export function levelTitle(level: number): string {
  let title = LEVEL_TITLES[0][1];
  for (const [min, t] of LEVEL_TITLES) {
    if (level >= min) title = t;
  }
  return title;
}
