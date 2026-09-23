import type { Rarity } from '../backend/types';

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'ultra', 'limited', 'secret'];

export const RARITY: Record<Rarity, { label: string; color: string; glow: string; tier: number }> = {
  common: { label: 'COMMON', color: '#a3aec2', glow: 'rgba(163,174,194,0.0)', tier: 1 },
  uncommon: { label: 'UNCOMMON', color: '#4ade80', glow: 'rgba(74,222,128,0.35)', tier: 2 },
  rare: { label: 'RARE', color: '#38bdf8', glow: 'rgba(56,189,248,0.55)', tier: 3 },
  epic: { label: 'EPIC', color: '#a855f7', glow: 'rgba(168,85,247,0.65)', tier: 4 },
  legendary: { label: 'LEGENDARY', color: '#fbbf24', glow: 'rgba(251,191,36,0.7)', tier: 5 },
  mythic: { label: 'MYTHIC', color: '#f43f5e', glow: 'rgba(244,63,94,0.75)', tier: 6 },
  ultra: { label: 'ULTRA', color: '#e879f9', glow: 'rgba(232,121,249,0.8)', tier: 7 },
  limited: { label: 'LIMITED', color: '#fb923c', glow: 'rgba(251,146,60,0.75)', tier: 8 },
  secret: { label: 'SECRET', color: '#f8fafc', glow: 'rgba(248,250,252,0.9)', tier: 9 },
};

export const tierOf = (r: Rarity) => RARITY[r]?.tier ?? 1;

export const CATEGORY_ICON: Record<string, string> = {
  TECH: '📺',
  GAMING: '🎮',
  CARS: '🏎️',
  FASHION: '👟',
  LUXURY: '💎',
  SPORTS: '🏆',
  RANDOM: '🎲',
};

export const rainbow = (t: number, s = 90, l = 65) => `hsl(${(t * 120) % 360}, ${s}%, ${l}%)`;
