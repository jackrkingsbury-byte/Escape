import { createBackend } from '../backend';
import type { Backend, Catalog, FeedEvent, MarketRow, SyncResult, WorldPlayer } from '../backend/types';
import { G, setG, toast, openPanel, item } from './store';
import { play, reveal, setMusic, setMuted, setVolume } from './sound';
import { money } from './format';
import { RARITY } from './rarity';
import { SPAWN } from '../world/layout';

let syncTimer: number | null = null;
let worldTimer: number | null = null;
let marketTimer: number | null = null;
let syncing = false;
let syncAgain = false;
let unPush: (() => void) | null = null;
let lastAlarmRaid: string | null = null;

export async function boot(mode: 'offline' | 'online') {
  const s = G().settings;
  setVolume(s.volume);
  setMuted(s.muted);
  setMusic(s.music);
  setG({ phase: 'loading', loadingMsg: 'Starting…', loadingPct: 2, fatal: null });
  let backend: Backend;
  try {
    backend = createBackend(mode);
    setG({ backend });
    await backend.init((msg, pct) => setG({ loadingMsg: msg, loadingPct: pct }));
  } catch (e: any) {
    const msg = String(e?.message || e);
    setG({
      phase: 'error',
      fatal:
        mode === 'offline'
          ? `Couldn't start the offline game engine. ${msg}. Check your connection (the engine downloads once from cdn.jsdelivr.net) and reload.`
          : `Couldn't reach the online servers: ${msg}`,
    });
    return;
  }
  if (mode === 'offline') await backend.signInGuest();
  if (!backend.userId()) {
    setG({ phase: 'auth' });
    return;
  }
  await enter();
}

/** After authentication: load the catalog and our player (or ask for a name). */
export async function enter() {
  const b = G().backend!;
  setG({ phase: 'loading', loadingMsg: 'Loading the catalog…', loadingPct: 96 });
  try {
    const catalog = await b.rpc<Catalog>('stt_catalog');
    const itemsById = Object.fromEntries(catalog.items.map((i) => [i.id, i]));
    setG({ catalog, itemsById });
    const s = await b.rpc<SyncResult>('stt_sync', { since: -1, items_rev: -1 });
    if (s.needs_join) {
      setG({ phase: 'join' });
      return;
    }
    applySync(s, true);
    await Promise.all([refreshMarket(), refreshWorld()]);
    start();
  } catch (e: any) {
    setG({ phase: 'error', fatal: String(e?.message || e) });
  }
}

export async function join(username: string) {
  const b = G().backend!;
  const s = await b.rpc<SyncResult>('stt_join', { username });
  applySync(s, true);
  await Promise.all([refreshMarket(), refreshWorld()]);
  start();
}

function start() {
  setG({ phase: 'playing' });
  const me = G().me!;
  if (me.tutorial_step < 99) setG({ tutorialOpen: true });
  stop();
  const b = G().backend!;
  const online = b.mode === 'online';
  syncTimer = window.setInterval(() => syncNow(), online ? 3000 : 2000);
  worldTimer = window.setInterval(() => refreshWorld(), 12000);
  marketTimer = window.setInterval(() => refreshMarket(), 15000);
  // Realtime: react instantly to events addressed to me (raids on my base, offers, sales…).
  // Global events arrive with the regular poll so one big event doesn't stampede every client.
  if (b.onPush) unPush = b.onPush((row) => { if (row.target_id && row.target_id === G().me?.id) syncNow(); });
  if (b.presence) b.presence.start({ id: me.id, name: me.username, x: SPAWN.x, y: SPAWN.y, dir: 1, moving: false, trail: me.cosmetics?.trail });
  document.addEventListener('visibilitychange', onVisible);
}

function onVisible() {
  if (document.visibilityState === 'visible') {
    syncNow();
    refreshWorld();
  }
}

export function stop() {
  if (syncTimer) clearInterval(syncTimer);
  if (worldTimer) clearInterval(worldTimer);
  if (marketTimer) clearInterval(marketTimer);
  syncTimer = worldTimer = marketTimer = null;
  unPush?.();
  unPush = null;
  document.removeEventListener('visibilitychange', onVisible);
}

export async function signOutToTitle() {
  stop();
  const b = G().backend;
  b?.presence?.stop();
  await b?.signOut().catch(() => {});
  setG({ phase: 'title', backend: null, me: null, last: null, myItems: [], feed: [], feedSince: -1, panel: null });
}

export async function syncNow() {
  const b = G().backend;
  if (!b || !b.userId()) return;
  if (syncing) {
    syncAgain = true;
    return;
  }
  syncing = true;
  try {
    const { feedSince, me } = G();
    const s = await b.rpc<SyncResult>('stt_sync', { since: feedSince, items_rev: me?.items_rev ?? -1 });
    if (!s.needs_join) applySync(s, false);
  } catch (e) {
    console.warn('sync failed', e);
  } finally {
    syncing = false;
    if (syncAgain) {
      syncAgain = false;
      syncNow();
    }
  }
}

function applySync(s: SyncResult, initial: boolean) {
  const prev = G().me;
  const serverOffset = s.server_time - Date.now();
  const patch: any = { last: s, me: s.me, syncedAt: Date.now(), serverOffset };
  if (s.items) patch.myItems = s.items;
  if (s.feed.length) {
    const maxId = s.feed[s.feed.length - 1].id;
    patch.feedSince = Math.max(G().feedSince, maxId);
    patch.feed = [...G().feed, ...s.feed.filter((e) => e.id > G().feedSince)].slice(-120);
  } else if (initial) {
    patch.feedSince = 0;
  }
  setG(patch);
  if (!initial && prev) {
    for (const e of s.feed) handleEvent(e);
  }
  // Incoming raid alarm
  const raid = s.incoming_raids[0];
  if (raid && raid.id !== lastAlarmRaid) {
    lastAlarmRaid = raid.id;
    play('alarm');
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
  }
  // Outgoing raid: server tells us if the owner hit the alarm
  const st = G().steal;
  if (st && s.outgoing_raid && s.outgoing_raid.id === st.raidId && s.outgoing_raid.defended && !st.defended) {
    setG({ steal: { ...st, defended: true } });
    play('alarm');
  }
}

export async function refreshMarket() {
  const b = G().backend;
  if (!b) return;
  try {
    const m = await b.rpc<{ items: MarketRow[] }>('stt_market');
    setG({ market: Object.fromEntries(m.items.map((r) => [r.item_id, r])), marketAt: Date.now() });
  } catch (e) {
    console.warn('market failed', e);
  }
}

export async function refreshWorld() {
  const b = G().backend;
  if (!b) return;
  try {
    const w = await b.rpc<{ players: WorldPlayer[] }>('stt_world');
    setG({ world: w.players, worldAt: Date.now() });
  } catch (e) {
    console.warn('world failed', e);
  }
}

const itemName = (id?: string) => (id && item(id)?.name) || 'an item';

function handleEvent(e: FeedEvent) {
  const me = G().me;
  const p = e.payload || {};
  const mine = e.target_id && me && e.target_id === me.id;
  const byMe = e.actor_id && me && e.actor_id === me.id;
  switch (e.kind) {
    case 'secret_found':
      setG({ bigReveal: e });
      reveal('secret');
      break;
    case 'big_pull':
      if (!byMe)
        toast({ kind: 'epic', icon: '🌈', itemId: p.item_id, title: `${p.player} pulled ${RARITY[p.rarity as keyof typeof RARITY]?.label ?? ''} ${p.item}!`, body: p.serial ? `Serial #${p.serial}/${p.max_supply}` : undefined });
      break;
    case 'steal':
      if (!byMe && e.target_id === null)
        toast({ kind: 'info', icon: '🔥', itemId: p.item_id, title: `${p.attacker} stole ${p.item}`, body: `from ${p.defender}${p.revenge ? ' — REVENGE!' : ''}` });
      break;
    case 'raid_alert':
      toast({ kind: 'bad', icon: '🚨', itemId: p.item_id, title: 'RAID ALERT', body: `Someone is attempting to steal ${p.defender}'s ${String(p.rarity).toUpperCase()} ${p.item}!` });
      break;
    case 'market_alert':
      toast({
        kind: p.direction === 'up' ? 'good' : 'bad',
        icon: p.direction === 'up' ? '🔥' : '📉',
        itemId: p.item_id,
        title: 'MARKET ALERT',
        body: `${p.item} is ${p.direction === 'up' ? 'suddenly trending' : 'crashing'} (${p.change > 0 ? '+' : ''}${p.change}% in 1h)`,
        action: { label: 'VIEW', run: () => openPanel('market', { item: p.item_id }) },
      });
      break;
    case 'supply_alert':
      toast({ kind: 'epic', icon: '⚠️', itemId: p.item_id, title: p.remaining === 0 ? `${p.item} SOLD OUT` : `ONLY ${p.remaining} LEFT`, body: `${p.item} — supply ${p.max_supply - p.remaining}/${p.max_supply}` });
      break;
    case 'event_start':
      play('levelup');
      toast({ kind: 'epic', icon: p.icon, title: `${p.title} IS LIVE`, body: p.description, ttl: 8000, action: { label: 'EVENT DROP', run: () => openPanel('drops') } });
      break;
    case 'event_end':
      toast({ kind: 'info', icon: p.icon, title: `${p.title} has ended` });
      break;
    case 'raid_warning':
      // the alarm overlay is driven by incoming_raids
      break;
    case 'item_stolen':
      if (mine) {
        play('steal_fail');
        toast({
          kind: 'bad',
          icon: '🚨',
          itemId: p.item_id,
          title: 'ITEM STOLEN',
          body: `${p.attacker} stole your ${String(p.rarity || '').toUpperCase()} ${p.item || itemName(p.item_id)}.`,
          ttl: 9000,
          action: { label: 'REVENGE', run: () => openPanel('visit', { playerId: p.attacker_id, revenge: true }) },
        });
      }
      break;
    case 'raid_over':
      if (mine) {
        const blocked = p.status === 'blocked';
        play('defend');
        toast({
          kind: 'good',
          icon: '🛡️',
          itemId: p.item_id,
          title: blocked ? 'THEFT BLOCKED' : 'RAID STOPPED',
          body: blocked
            ? `${p.attacker} left empty-handed — your ${itemName(p.item_id)} is safe.`
            : `${p.attacker} got caught${p.fine ? ` and paid you a ${money(p.fine)} bounty` : ''}.`,
        });
      }
      break;
    case 'raid_result': {
      const st = G().steal;
      if (mine && (!st || st.raidId !== p.raid_id)) {
        toast({
          kind: p.status === 'success' ? 'good' : 'bad',
          icon: p.status === 'success' ? '🔥' : '🚨',
          itemId: p.item_id,
          title: p.status === 'success' ? 'ITEM STOLEN!' : 'RAID FAILED',
          body: p.status === 'success' ? `You got ${itemName(p.item_id)} from ${p.defender}.` : p.note || '',
        });
      }
      break;
    }
    case 'raid_defended':
      break;
    case 'trade_offer':
      if (mine) {
        play('notify');
        toast({ kind: 'info', icon: '📨', title: `Trade offer from ${p.from}`, body: `They offer ${money(p.offer_value)} in value for ${money(p.request_value)}.`, ttl: 8000, action: { label: 'VIEW', run: () => openPanel('trade', { tab: 'incoming' }) } });
      }
      break;
    case 'trade_declined':
      if (mine) toast({ kind: 'bad', icon: '🙅', title: `${p.by} declined your offer`, body: p.note || undefined, ttl: 8000 });
      break;
    case 'trade_failed':
      if (mine) toast({ kind: 'bad', icon: '⚠️', title: 'Trade failed', body: p.reason });
      break;
    case 'trade_done':
      if (mine) {
        play('trade');
        toast({ kind: 'good', icon: '🤝', title: `Trade complete with ${p.with}` });
      }
      break;
    case 'listing_sold':
      if (mine) {
        play('cash');
        toast({ kind: 'good', icon: '💰', itemId: p.item_id, title: 'SOLD!', body: `${p.buyer} bought your ${p.item} for ${money(p.price)} (fee ${money(p.fee)}).` });
      }
      break;
    case 'achievement':
      if (mine) {
        play('levelup');
        toast({ kind: 'epic', icon: p.icon, title: `Achievement: ${p.title}`, body: [p.cash ? `+${money(p.cash)}` : '', p.xp ? `+${p.xp} XP` : ''].filter(Boolean).join('  '), ttl: 6000 });
      }
      break;
    case 'level_up':
      if (mine) {
        play('levelup');
        setG({ levelUp: { level: p.level, title: p.title, cash: p.cash } });
      }
      break;
    case 'prestige':
      if (!byMe) toast({ kind: 'epic', icon: '✨', title: `${p.player} reached PRESTIGE ${p.prestige}` });
      break;
    case 'big_trade':
      toast({ kind: 'info', icon: '🤝', title: 'MEGA TRADE', body: `${p.a} ⇄ ${p.b} — ${money(p.value)} changed hands` });
      break;
    case 'big_sale':
      if (!byMe) toast({ kind: 'info', icon: '💸', itemId: p.item_id, title: `${p.buyer} bought ${p.item}`, body: `for ${money(p.price)} from ${p.seller}` });
      break;
  }
}

export function feedLine(e: FeedEvent): { icon: string; text: string; tone: string } | null {
  const p = e.payload || {};
  switch (e.kind) {
    case 'secret_found': return { icon: '🕳️', text: `${p.player} found the SECRET ${p.item}!`, tone: 'secret' };
    case 'big_pull': return { icon: '🌈', text: `${p.player} pulled ${String(p.rarity).toUpperCase()} ${p.item}${p.serial ? ` #${p.serial}` : ''}`, tone: String(p.rarity) };
    case 'steal': return { icon: '🔥', text: `${p.attacker} stole ${p.item} from ${p.defender}${p.revenge ? ' (revenge!)' : ''}`, tone: 'bad' };
    case 'raid_alert': return { icon: '🚨', text: `Someone is trying to steal ${p.defender}'s ${p.item}!`, tone: 'bad' };
    case 'market_alert': return { icon: p.direction === 'up' ? '📈' : '📉', text: `${p.item} ${p.change > 0 ? '+' : ''}${p.change}% in the last hour`, tone: p.direction === 'up' ? 'good' : 'bad' };
    case 'supply_alert': return { icon: '⚠️', text: `Only ${p.remaining} ${p.item} left (of ${p.max_supply})`, tone: 'limited' };
    case 'event_start': return { icon: p.icon, text: `${p.title} is live!`, tone: 'epic' };
    case 'event_end': return { icon: p.icon, text: `${p.title} ended`, tone: 'info' };
    case 'player_joined': return { icon: '👋', text: `${p.player} moved into Tech City`, tone: 'info' };
    case 'level_milestone': return { icon: '⭐', text: `${p.player} reached level ${p.level} — ${p.title}`, tone: 'info' };
    case 'prestige': return { icon: '✨', text: `${p.player} prestiged (P${p.prestige})`, tone: 'epic' };
    case 'big_trade': return { icon: '🤝', text: `${p.a} ⇄ ${p.b}: ${money(p.value)} trade`, tone: 'info' };
    case 'big_sale': return { icon: '💸', text: `${p.buyer} bought ${p.item} for ${money(p.price)}`, tone: 'good' };
    case 'upgrade': return { icon: '🏗️', text: `${p.player} upgraded to ${p.name}`, tone: 'info' };
    case 'item_stolen': return { icon: '🚨', text: `${p.attacker} stole your ${p.item}`, tone: 'bad' };
    case 'raid_over': return { icon: '🛡️', text: `You stopped ${p.attacker}`, tone: 'good' };
    case 'raid_result': return { icon: p.status === 'success' ? '🥷' : '❌', text: p.status === 'success' ? `You stole ${p.item} from ${p.defender}` : `Raid on ${p.defender} failed`, tone: p.status === 'success' ? 'good' : 'bad' };
    case 'trade_offer': return { icon: '📨', text: `${p.from} sent you an offer`, tone: 'info' };
    case 'trade_done': return { icon: '🤝', text: `Trade with ${p.with} complete`, tone: 'good' };
    case 'listing_sold': return { icon: '💰', text: `${p.buyer} bought your ${p.item} for ${money(p.price)}`, tone: 'good' };
    case 'achievement': return { icon: p.icon, text: `Achievement unlocked: ${p.title}`, tone: 'epic' };
    case 'level_up': return { icon: '⬆️', text: `You reached level ${p.level}`, tone: 'good' };
    default: return null;
  }
}

export function showRevealFor(rarity: string) {
  reveal(rarity as any);
}
