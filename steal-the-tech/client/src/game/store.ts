import { create } from 'zustand';
import type {
  Backend, BeltItem, Catalog, CatalogItem, FeedEvent, MarketRow, Me, PlayerItem, SyncResult, WorldPlayer, Rarity,
} from '../backend/types';

export type PanelId =
  | 'base' | 'drops' | 'collection' | 'market' | 'raid' | 'trade' | 'leaderboard' | 'profile'
  | 'settings' | 'quests' | 'visit' | 'event' | 'feed';

export interface Toast {
  id: number;
  kind: 'info' | 'good' | 'bad' | 'epic';
  title: string;
  body?: string;
  icon?: string;
  itemId?: string;
  action?: { label: string; run: () => void };
  at: number;
  ttl: number;
}

export interface OpenDropResult {
  player_item: PlayerItem;
  item_id: string;
  rarity: Rarity;
  mutation: string | null;
  serial: number | null;
  is_new: boolean;
  placed: boolean;
  slot: number | null;
  xp: number;
  cash: number;
  drop: string;
}

export interface DropAnim {
  drop: string;
  startedAt: number;
  result: OpenDropResult | null;
  error: string | null;
}

export interface StealState {
  raidId: string;
  itemId: string;
  playerItemId: string;
  defender: string;
  defenderId: string;
  startedAt: number; // client ms
  endsAt: number; // client ms
  chance: number;
  tutorial: boolean;
  revenge: boolean;
  defended: boolean;
  phase: 'grab' | 'carry';
  grabbedAt: number;
  carryUntil: number;
  deliverAfter: number;
  mutation: string | null;
  result: null | { status: string; fine: number; note: string | null; caught?: boolean };
  finishing: boolean;
}

export interface Banner {
  id: number;
  kind: 'good' | 'bad' | 'epic' | 'secret' | 'info';
  title: string;
  sub?: string;
  itemId?: string;
  mutation?: string | null;
  color?: string;
  ttl: number;
}

export interface Settings {
  volume: number;
  muted: boolean;
  music: boolean;
  quality: 'high' | 'low';
  reduceMotion: boolean;
  showNames: boolean;
  joystickLeft: boolean;
}

const defaultSettings: Settings = {
  volume: 0.6,
  muted: false,
  music: false,
  quality: 'high',
  reduceMotion: false,
  showNames: true,
  joystickLeft: true,
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem('stt.settings');
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  // Phones start on the lighter renderer (no bloom/shadows); switch any time in Settings.
  const coarse = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
  return { ...defaultSettings, quality: coarse ? 'low' : 'high' };
}

export interface GameState {
  phase: 'title' | 'loading' | 'auth' | 'join' | 'playing' | 'error';
  backend: Backend | null;
  loadingMsg: string;
  loadingPct: number;
  fatal: string | null;

  catalog: Catalog | null;
  itemsById: Record<string, CatalogItem>;

  last: SyncResult | null;
  me: Me | null;
  myItems: PlayerItem[];
  syncedAt: number; // client ms when `me` was received
  serverOffset: number; // server ms - client ms
  feed: FeedEvent[];
  feedSince: number;

  market: Record<string, MarketRow>;
  marketAt: number;
  world: WorldPlayer[];
  worldAt: number;
  belt: BeltItem[];
  beltAt: number;

  panel: PanelId | null;
  panelArg: any;
  toasts: Toast[];
  drop: DropAnim | null;
  steal: StealState | null;
  bigReveal: FeedEvent | null;
  banner: Banner | null;
  levelUp: { level: number; title: string; cash: number } | null;
  confirm: null | { title: string; body: string; confirmLabel: string; danger?: boolean; hold?: boolean; onConfirm: () => void };
  settings: Settings;
  tutorialOpen: boolean;
  focusPlot: string | null; // player id the camera should travel to
}

export const useGame = create<GameState>(() => ({
  phase: 'title',
  backend: null,
  loadingMsg: '',
  loadingPct: 0,
  fatal: null,
  catalog: null,
  itemsById: {},
  last: null,
  me: null,
  myItems: [],
  syncedAt: 0,
  serverOffset: 0,
  feed: [],
  feedSince: -1,
  market: {},
  marketAt: 0,
  world: [],
  worldAt: 0,
  belt: [],
  beltAt: 0,
  panel: null,
  panelArg: null,
  toasts: [],
  drop: null,
  steal: null,
  bigReveal: null,
  banner: null,
  levelUp: null,
  confirm: null,
  settings: loadSettings(),
  tutorialOpen: false,
  focusPlot: null,
}));

// Stable empty array for selectors (zustand v5 needs referentially stable results).
export const EMPTY: any[] = [];

export const G = () => useGame.getState();
export const setG = (p: Partial<GameState> | ((s: GameState) => Partial<GameState>)) => useGame.setState(p as any);

export const serverNow = () => Date.now() + G().serverOffset;
export const toClient = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() - G().serverOffset : 0);

let toastSeq = 0;
export function toast(t: Omit<Toast, 'id' | 'at' | 'ttl'> & { ttl?: number }) {
  const id = ++toastSeq;
  const entry: Toast = { ttl: 5000, ...t, id, at: Date.now() };
  setG((s) => ({ toasts: [...s.toasts.slice(-5), entry] }));
  window.setTimeout(() => setG((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), entry.ttl);
}

export function openPanel(panel: PanelId | null, arg: any = null) {
  setG({ panel, panelArg: arg });
}

export function updateSettings(p: Partial<Settings>) {
  const settings = { ...G().settings, ...p };
  setG({ settings });
  try {
    localStorage.setItem('stt.settings', JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

/** Cash in the bank (income waits on your podiums until you collect it). */
export function liveCash(): number {
  return G().me?.cash ?? 0;
}

let bannerSeq = 0;
export function banner(b: Omit<Banner, 'id' | 'ttl'> & { ttl?: number }) {
  const id = ++bannerSeq;
  setG({ banner: { ttl: 2600, ...b, id } });
  window.setTimeout(() => {
    if (G().banner?.id === id) setG({ banner: null });
  }, b.ttl ?? 2600);
}

export function mutationDef(id: string | null | undefined) {
  if (!id) return null;
  return G().catalog?.mutations?.find((m) => m.id === id) ?? null;
}

export const mutMult = (id: string | null | undefined) => mutationDef(id)?.mult ?? 1;

/** Income/s of one displayed item of mine right now (mirrors the server's formula). */
export function itemRate(itemId: string, mutation: string | null | undefined): number {
  const s = G();
  const it = s.itemsById[itemId];
  if (!it) return 0;
  const ev = s.last?.event;
  const evMult = ev && ev.category && ev.category === it.category ? ev.income_mult : 1;
  return it.base_income * mutMult(mutation) * evMult * (1 + (s.me?.income_bonus || 0));
}

/** Cash waiting on one of my podiums (client estimate; the server decides). */
export function pendingOf(pi: PlayerItem, override?: number): number {
  if (pi.location !== 'display') return 0;
  const since = override ?? toClient(pi.accrued_at);
  const secs = Math.min(43200, Math.max(0, (Date.now() - since) / 1000));
  return Math.floor(itemRate(pi.item_id, pi.mutation) * secs);
}

export function item(id: string): CatalogItem | undefined {
  return G().itemsById[id];
}

export function price(id: string, mutation?: string | null): number {
  const base = G().market[id]?.price ?? G().itemsById[id]?.base_value ?? 0;
  return mutation ? Math.round(base * mutMult(mutation)) : base;
}
