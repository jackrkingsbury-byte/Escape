import { create } from 'zustand';
import type { ZoneId } from './layout';

export interface Prompt {
  kind: 'zone' | 'plot';
  id: ZoneId | string;
  label: string;
  icon: string;
  playerId?: string;
  mine?: boolean;
}

export interface Selected {
  playerItemId: string;
  itemId: string;
  ownerId: string;
  ownerName: string;
  mine: boolean;
  sx: number;
  sy: number;
}

export interface WorldUI {
  prompt: Prompt | null;
  hover: { itemId: string; ownerName: string; sx: number; sy: number } | null;
  selected: Selected | null;
  here: { playerId: string; name: string; mine: boolean } | null;
  fade: number;
}

export const useWorldUI = create<WorldUI>(() => ({ prompt: null, hover: null, selected: null, here: null, fade: 0 }));
