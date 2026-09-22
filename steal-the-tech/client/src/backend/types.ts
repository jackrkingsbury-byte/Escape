// Shapes returned by the server RPCs (see supabase/migrations/*_api.sql).

export type Rarity =
  | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'ultra' | 'secret' | 'limited';
export type Category = 'TECH' | 'GAMING' | 'CARS' | 'FASHION' | 'LUXURY' | 'SPORTS';
export type Location = 'display' | 'vault' | 'inventory' | 'listed';

export interface CatalogItem {
  id: string;
  name: string;
  brand: string;
  kind: string;
  category: Category;
  rarity: Rarity;
  base_value: number;
  base_income: number;
  max_supply: number | null;
  tradeable: boolean;
  droppable: boolean;
  event_only: boolean;
  color: string;
  accent: string;
  flavor: string;
}

export interface RarityDef {
  id: Rarity;
  tier: number;
  label: string;
  color: string;
  steal_penalty: number;
  steal_extra_seconds: number;
  xp: number;
}

export interface DropDef {
  id: string;
  name: string;
  price: number;
  min_level: number;
  requires_key: boolean;
  event_only: boolean;
  weights: Partial<Record<Rarity, number>>;
  xp: number;
  description: string;
}

export interface UpgradeDef {
  kind: 'base' | 'security' | 'vault';
  level: number;
  cost: number;
  value: number;
  name: string;
}

export interface QuestDef {
  id: string;
  period: 'daily' | 'weekly';
  title: string;
  metric: string;
  target: number;
  reward: QuestReward;
}
export interface QuestReward {
  cash?: number;
  income_secs?: number;
  xp?: number;
  tokens?: Record<string, number>;
  secret_keys?: number;
  cosmetic?: string;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  xp: number;
  reward_cash: number;
}

export interface CosmeticDef {
  id: string;
  slot: string;
  name: string;
  price: number;
  unlock: string | null;
  data: Record<string, string>;
}

export interface EventTypeDef {
  id: string;
  title: string;
  icon: string;
  description: string;
  category: string | null;
}

export interface Catalog {
  items: CatalogItem[];
  rarities: RarityDef[];
  drops: DropDef[];
  upgrades: UpgradeDef[];
  quests: QuestDef[];
  achievements: AchievementDef[];
  cosmetics: CosmeticDef[];
  event_types: EventTypeDef[];
  level_titles: { level: number; title: string }[];
  rules: {
    quick_sell_rate: number;
    market_fee: number;
    list_min: number;
    list_max: number;
    prestige_level: number;
    focus_level: number;
    protection_level: number;
    shield_minutes: number;
    hot_minutes: number;
    offline_cap_hours: number;
  };
}

export interface PlayerItem {
  id: string;
  item_id: string;
  location: Location;
  slot: number | null;
  serial: number | null;
  soulbound: boolean;
  hot_until: string | null;
  acquired_via: string;
  acquired_at: string;
  stolen_from: string | null;
}

export interface Me {
  id: string;
  username: string;
  cash: number;
  income: number;
  base_value: number;
  xp: number;
  level: number;
  title: string;
  xp_level: number;
  xp_next: number;
  prestige: number;
  income_bonus: number;
  luck: number;
  focus: string;
  drop_tokens: Record<string, number>;
  secret_keys: number;
  tutorial_step: number;
  tutorial_flags: Record<string, boolean>;
  cosmetics: Record<string, string>;
  owned_cosmetics: string[];
  raid_cooldown_until: string | null;
  items_rev: number;
  base_level: number;
  slots: number;
  security_level: number;
  vault_level: number;
  vault_capacity: number;
  shield_until: string | null;
  stats: Record<string, number>;
  daily: { can_claim: boolean; streak: number; next_day: number; resets_at: string };
  collection_count: number;
  created_at: string;
}

export interface FeedEvent {
  id: number;
  kind: string;
  target_id: string | null;
  actor_id: string | null;
  payload: Record<string, any>;
  created_at: string;
}

export interface IncomingRaid {
  id: string;
  attacker: string;
  attacker_id: string;
  attacker_bot: boolean;
  item_id: string;
  player_item_id: string;
  started_at: string;
  ends_at: string;
  defended: boolean;
  revenge: boolean;
}

export interface OutgoingRaid {
  id: string;
  defender: string;
  defender_id: string;
  item_id: string;
  player_item_id: string;
  started_at: string;
  ends_at: string;
  defended: boolean;
  chance: number;
  revenge: boolean;
  tutorial: boolean;
}

export interface LiveEvent {
  type: string;
  title: string;
  icon: string;
  description: string;
  category: string | null;
  price_mult: number;
  income_mult: number;
  luck_mult: number;
  starts_at: string;
  ends_at: string;
}

export interface SyncResult {
  needs_join?: boolean;
  server_time: number;
  me: Me;
  items: PlayerItem[] | null;
  listings: { id: string; player_item_id: string; item_id: string; price: number; created_at: string }[];
  incoming_raids: IncomingRaid[];
  outgoing_raid: OutgoingRaid | null;
  event: LiveEvent | null;
  next_event_at: string | null;
  feed: FeedEvent[];
  trades: { incoming: number; outgoing: number };
  quests_claimable: number;
  revenge: number;
  online: number;
}

export interface PlotItem {
  id: string;
  item_id: string;
  slot: number;
  serial: number | null;
  soulbound: boolean;
  hot_until: string | null;
  under_raid: boolean;
  chance?: number;
  seconds?: number;
}

export interface WorldPlayer {
  id: string;
  username: string;
  is_bot: boolean;
  level: number;
  prestige: number;
  title: string;
  bio: string;
  base_level: number;
  slots: number;
  security_level: number;
  vault_level: number;
  vault_used: number;
  cosmetics: Record<string, string>;
  base_value: number;
  shield_until: string | null;
  protected: boolean;
  online: boolean;
  items: PlotItem[];
}

export interface BaseView extends WorldPlayer {
  revenge_available: boolean;
  raid_block: string | null;
  security_name: string;
  income: number;
  is_me: boolean;
}

export interface MarketRow {
  item_id: string;
  price: number;
  demand: number;
  supply: number;
  listed: number;
  volume_24h: number;
  minted: number | null;
  change_24h: number;
  low: number | null;
}

export interface MarketItemDetail {
  item_id: string;
  range: string;
  price: number;
  demand: number;
  supply: number;
  listed: number;
  volume_24h: number;
  change_24h: number;
  owners: number;
  minted: number | null;
  mine: number;
  history: [number, number, number, number, number, number][];
  sales: { price: number; kind: string; at: string; buyer: string | null; seller: string | null }[];
  listings: Listing[];
}

export interface Listing {
  id: string;
  item_id?: string;
  price: number;
  market?: number;
  seller: string;
  seller_id: string;
  seller_bot: boolean;
  serial: number | null;
  created_at: string;
  mine: boolean;
}

export interface Trade {
  id: string;
  from_id: string;
  from: string;
  from_bot: boolean;
  to_id: string;
  to: string;
  to_bot: boolean;
  offer_cash: number;
  request_cash: number;
  message: string;
  status: string;
  note: string | null;
  created_at: string;
  resolved_at: string | null;
  incoming: boolean;
  offer_items: { id: string; item_id: string; serial: number | null; available: boolean }[];
  request_items: { id: string; item_id: string; serial: number | null; available: boolean }[];
  offer_value: number;
  request_value: number;
}

export interface RaidTarget {
  id: string;
  username: string;
  is_bot: boolean;
  level: number;
  prestige: number;
  security_level: number;
  security_name: string;
  shield_until: string | null;
  protected: boolean;
  online: boolean;
  base_value: number;
  shown: number;
  top_item: { item_id: string; price: number; serial: number | null } | null;
  revenge: boolean;
}

export interface Profile {
  id: string;
  username: string;
  is_bot: boolean;
  bio: string;
  level: number;
  title: string;
  prestige: number;
  base_value: number;
  income: number;
  base_level: number;
  security_level: number;
  cosmetics: Record<string, string>;
  collection: number;
  collection_total: number;
  rare_items: number;
  secrets: { item_id: string; serial: number | null }[];
  showcase: { item_id: string; serial: number | null }[];
  achievements: { id: string; title: string; icon: string; unlocked_at: string }[];
  stats: Record<string, number>;
  online: boolean;
  shield_until: string | null;
  protected: boolean;
  created_at: string;
  is_me: boolean;
}

export interface Quest extends QuestDef {
  progress: number;
  claimed: boolean;
  resets_at: string;
}

export interface LeaderRow {
  rank: number;
  id: string;
  username: string;
  is_bot: boolean;
  level: number;
  prestige: number;
  score: number;
  me: boolean;
}

// Presence (online mode only): other avatars walking around the world.
export interface PeerState {
  id: string;
  name: string;
  x: number;
  y: number;
  dir: number;
  moving: boolean;
  emote?: string | null;
  emoteAt?: number;
  trail?: string;
  color?: string;
  t: number;
}

export type BackendMode = 'offline' | 'online';

export interface Backend {
  mode: BackendMode;
  label: string;
  init(onProgress?: (msg: string, pct: number) => void): Promise<void>;
  userId(): string | null;
  isGuest(): boolean;
  email(): string | null;
  signInGuest(): Promise<void>;
  signInEmail?(email: string, password: string, create: boolean): Promise<void>;
  upgradeGuest?(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  rpc<T = any>(fn: string, p?: Record<string, unknown>): Promise<T>;
  /** Called with each live-feed row the server pushes (online mode). */
  onPush?(cb: (row: { target_id: string | null; kind: string }) => void): () => void;
  presence?: {
    start(me: Omit<PeerState, 't'>): void;
    update(me: Omit<PeerState, 't'>): void;
    peers(): PeerState[];
    stop(): void;
  };
  reset?(): Promise<void>;
}
