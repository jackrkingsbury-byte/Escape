import { create } from 'zustand';

export type PromptKind = 'zone' | 'plot' | 'belt' | 'steal' | 'tag' | 'grab' | 'carry' | 'info';

export interface Prompt {
  kind: PromptKind;
  id: string;
  label: string;
  icon: string;
  sub?: string;
  disabled?: boolean;
  tone?: 'primary' | 'hot' | 'good' | 'gold';
  playerId?: string;
  mine?: boolean;
}

export interface Selected {
  playerItemId: string;
  itemId: string;
  ownerId: string;
  ownerName: string;
  mine: boolean;
  mutation?: string | null;
  beltId?: number;
  price?: number;
  sx: number;
  sy: number;
}

export interface WorldUI {
  prompt: Prompt | null;
  hover: { itemId: string; ownerName: string; mutation?: string | null; price?: number; sx: number; sy: number } | null;
  selected: Selected | null;
  here: { playerId: string; name: string; mine: boolean } | null;
  fade: number;
  /** Direction to my base while carrying loot (radians, screen-space) and distance in metres. */
  home: { angle: number; dist: number; inside: boolean } | null;
}

export const useWorldUI = create<WorldUI>(() => ({ prompt: null, hover: null, selected: null, here: null, fade: 0, home: null }));
