// Every button in the game goes through these wrappers: call the server, give
// feedback (sound/toast), then re-sync. The client never decides outcomes.
import { G, setG, toast, toClient, item, openPanel, banner, mutationDef, type OpenDropResult } from './store';
import { syncNow, refreshWorld, refreshMarket, refreshBelt } from './session';
import { play, reveal } from './sound';
import { money, shortMoney } from './format';
import { RARITY } from './rarity';
import type { BaseView, PlayerItem, Rarity } from '../backend/types';

export async function call<T = any>(fn: string, p: Record<string, unknown> = {}, opts: { quiet?: boolean; sync?: boolean } = {}): Promise<T> {
  const b = G().backend;
  if (!b) throw new Error('Not connected');
  try {
    const r = await b.rpc<T>(fn, p);
    if (opts.sync !== false) syncNow();
    return r;
  } catch (e: any) {
    const msg = String(e?.message || e).replace(/^.*?ERROR:\s*/i, '');
    if (!opts.quiet) {
      play('error');
      toast({ kind: 'bad', icon: '⛔', title: msg });
    }
    throw new Error(msg);
  }
}

// ── Drops ────────────────────────────────────────────────────────────────
export async function openDrop(drop: string, useToken = false) {
  if (G().drop) return;
  setG({ drop: { drop, startedAt: Date.now(), result: null, error: null } });
  play('shake');
  try {
    const r = await call<OpenDropResult>('stt_open_drop', { drop, use_token: useToken }, { quiet: true });
    setG((s) => ({ drop: s.drop ? { ...s.drop, result: r } : null }));
    refreshWorld();
  } catch (e: any) {
    play('error');
    setG({ drop: null });
    toast({ kind: 'bad', icon: '⛔', title: e.message });
  }
}

export function revealSound(rarity: string) {
  reveal(rarity as any);
}

// ── Base management ──────────────────────────────────────────────────────
export async function place(playerItemId: string, slot: number | null = null) {
  await call('stt_place', { player_item_id: playerItemId, slot });
  play('click');
  refreshWorld();
}
export async function store(playerItemId: string) {
  await call('stt_store', { player_item_id: playerItemId });
  play('click');
  refreshWorld();
}
export async function vault(playerItemId: string) {
  const r = await call<{ saved_from_raid: boolean }>('stt_vault', { player_item_id: playerItemId });
  play(r.saved_from_raid ? 'defend' : 'click');
  if (r.saved_from_raid) toast({ kind: 'good', icon: '🔒', title: 'Locked in the vault!', body: 'The thief will leave empty-handed.' });
  refreshWorld();
}
export async function autoArrange() {
  await call('stt_auto_arrange');
  play('coin');
  toast({ kind: 'good', icon: '✨', title: 'Base arranged', body: 'Your best earners are on display.' });
  refreshWorld();
}
export async function quickSell(playerItemId: string, itemId: string) {
  const r = await call<{ price: number }>('stt_quick_sell', { player_item_id: playerItemId });
  play('cash');
  toast({ kind: 'good', icon: '💵', itemId, title: `Sold for ${money(r.price)}`, body: item(itemId)?.name });
  refreshWorld();
}
export async function upgrade(kind: 'base' | 'security' | 'vault') {
  const r = await call<{ name: string; level: number }>('stt_upgrade', { kind });
  play('levelup');
  toast({ kind: 'epic', icon: kind === 'base' ? '🏗️' : kind === 'security' ? '🔐' : '🏦', title: `${r.name} unlocked!`, body: `${kind.toUpperCase()} level ${r.level}` });
  refreshWorld();
}

// ── Stealing: GRAB at the podium, then CARRY it home ─────────────────────
export async function startSteal(playerItemId: string, revenge = false) {
  if (G().steal && !G().steal!.result) {
    toast({ kind: 'bad', icon: '🥷', title: 'Finish your current raid first.' });
    return;
  }
  const r = await call<any>('stt_start_steal', { player_item_id: playerItemId, revenge });
  play('grab');
  setG({
    steal: {
      raidId: r.raid_id,
      itemId: r.item_id,
      playerItemId,
      defender: r.defender,
      defenderId: r.defender_id,
      startedAt: toClient(r.started_at),
      endsAt: toClient(r.ends_at),
      chance: r.chance,
      tutorial: r.tutorial,
      revenge: r.revenge,
      defended: false,
      phase: 'grab',
      grabbedAt: 0,
      carryUntil: 0,
      deliverAfter: 0,
      mutation: r.mutation ?? null,
      result: null,
      finishing: false,
    },
  });
}

function applyRaidResult(r: any) {
  const st = G().steal;
  if (!st) return;
  if (r.status === 'active' && r.phase === 'carry') {
    setG({
      steal: {
        ...st,
        finishing: false,
        defended: !!r.defended,
        phase: 'carry',
        grabbedAt: toClient(r.grabbed_at),
        carryUntil: toClient(r.carry_until),
        deliverAfter: toClient(r.deliver_after),
      },
    });
    play('run');
    banner({ kind: 'good', title: 'GOT IT! RUN!', sub: `Get it back to your base before ${st.defender} catches you`, itemId: st.itemId, mutation: st.mutation, ttl: 2200 });
    return;
  }
  const caught = /caught|Tagged/i.test(r.note || '');
  setG({ steal: { ...st, finishing: false, defended: !!r.defended, result: { status: r.status, fine: r.fine, note: r.note, caught } } });
  if (r.status === 'success') {
    play('steal_ok');
    reveal((item(st.itemId)?.rarity as Rarity) || 'common');
  } else {
    play(r.status === 'blocked' ? 'defend' : 'zap');
  }
  refreshWorld();
}

/** Grab time is up: the server rolls the security check. */
export async function finishSteal() {
  const st = G().steal;
  if (!st || st.finishing || st.result || st.phase !== 'grab') return;
  setG({ steal: { ...st, finishing: true } });
  try {
    const r = await call<any>('stt_finish_steal', { raid_id: st.raidId }, { quiet: true });
    applyRaidResult(r);
  } catch (e: any) {
    setG({ steal: { ...G().steal!, finishing: false } });
    if (/Still grabbing/.test(e.message)) window.setTimeout(finishSteal, 700); // clock skew
    else toast({ kind: 'bad', icon: '⛔', title: e.message });
  }
}

/** Made it home with the loot. */
export async function deliverSteal() {
  const st = G().steal;
  if (!st || st.finishing || st.result || st.phase !== 'carry') return;
  setG({ steal: { ...st, finishing: true } });
  try {
    const r = await call<any>('stt_deliver_steal', { raid_id: st.raidId }, { quiet: true });
    applyRaidResult(r);
  } catch (e: any) {
    setG({ steal: { ...G().steal!, finishing: false } });
    if (!/Keep running/.test(e.message)) toast({ kind: 'bad', icon: '⛔', title: e.message });
  }
}

/** Back off (free) or report that the owner's security caught you. */
export async function abortSteal(reason: 'abort' | 'caught') {
  const st = G().steal;
  if (!st || st.finishing || st.result) return;
  setG({ steal: { ...st, finishing: true } });
  try {
    const r = await call<any>('stt_abort_steal', { raid_id: st.raidId, reason }, { quiet: true });
    if (reason === 'abort') {
      setG({ steal: null });
      toast({ kind: 'info', icon: '🫥', title: 'You backed off', body: 'No harm done — lay low for a few seconds.' });
      refreshWorld();
      return;
    }
    applyRaidResult(r);
  } catch {
    setG({ steal: { ...G().steal!, finishing: false } });
  }
}

/** Owner fights back. `tag` = you caught the thief in person. */
export async function defend(raidId: string, tag = false) {
  const r = await call<any>('stt_defend', { raid_id: raidId, tag });
  if (tag) {
    play('tag');
    banner({ kind: 'good', title: 'TAGGED!', sub: r.fine ? `They dropped it and paid you ${money(r.fine)}` : 'They dropped your item', itemId: r.item_id });
    refreshWorld();
  } else {
    play('defend');
    toast({ kind: 'good', icon: '🚨', title: 'ALARM SOUNDED!', body: 'Their odds just collapsed — now go catch them!' });
  }
  return r;
}

// ── The Tech Belt ────────────────────────────────────────────────────────
export interface BeltBuyResult {
  player_item: PlayerItem;
  item_id: string;
  rarity: Rarity;
  mutation: string | null;
  is_new: boolean;
  placed: boolean;
  slot: number | null;
  price: number;
  cash: number;
}

export async function buyBelt(beltId: number): Promise<BeltBuyResult | null> {
  const s = G();
  const row = s.belt.find((b) => b.id === beltId);
  if (!row) return null;
  if (s.me && s.me.cash < row.price) {
    play('error');
    toast({ kind: 'bad', icon: '💸', itemId: row.item_id, title: `Need ${money(row.price - s.me.cash)} more`, body: 'Walk over your podiums to collect your cash.' });
    return null;
  }
  // Optimistic: it hops off the belt right away; the server has the final word.
  setG({ belt: s.belt.map((b) => (b.id === beltId ? { ...b, sold_to: s.me?.id ?? null, buyer: s.me?.username ?? null, sold_at: new Date(Date.now() + G().serverOffset).toISOString(), mine: true } : b)), beltAt: Date.now() });
  try {
    const r = await call<BeltBuyResult>('stt_buy_belt', { belt_id: beltId }, { quiet: true });
    const it = item(r.item_id);
    const tier = RARITY[r.rarity]?.tier ?? 1;
    if (s.me) setG({ me: { ...G().me!, cash: r.cash } });
    play('buy');
    if (r.mutation) {
      play('mutation');
      const m = mutationDef(r.mutation);
      banner({ kind: 'epic', title: `${m?.label ?? r.mutation} ${it?.name ?? ''}!`, sub: `${m?.mult ?? ''}× income & value`, itemId: r.item_id, mutation: r.mutation });
    } else if (tier >= 5) {
      reveal(r.rarity);
      banner({ kind: 'epic', title: `${RARITY[r.rarity].label}!`, sub: it?.name, itemId: r.item_id });
    }
    if (!r.placed) toast({ kind: 'info', icon: '📦', itemId: r.item_id, title: 'Base full — sent to storage', body: 'Upgrade your base or swap it in from BASE.' });
    if (r.is_new) toast({ kind: 'good', icon: '✨', itemId: r.item_id, title: 'NEW DISCOVERY!', body: it?.name });
    refreshWorld();
    return r;
  } catch (e: any) {
    play('error');
    toast({ kind: 'bad', icon: /Too slow/.test(e.message) ? '🐌' : '⛔', itemId: row.item_id, title: e.message });
    refreshBelt();
    return null;
  }
}

// ── Podium cash ──────────────────────────────────────────────────────────
export async function collect(playerItemId: string | null): Promise<number> {
  try {
    const r = await call<{ collected: number; cash: number }>('stt_collect', playerItemId ? { player_item_id: playerItemId } : {}, { quiet: true, sync: false });
    if (G().me) setG({ me: { ...G().me!, cash: r.cash, pending: Math.max(0, (G().me!.pending || 0) - r.collected) } });
    syncNow();
    return r.collected;
  } catch {
    return 0;
  }
}

// ── Base lock ────────────────────────────────────────────────────────────
export async function lockBase(): Promise<boolean> {
  try {
    const r = await call<{ lock_until: string; seconds: number }>('stt_lock_base', {}, { quiet: true });
    if (G().me) setG({ me: { ...G().me!, lock_until: r.lock_until } });
    play('laser');
    banner({ kind: 'info', title: '🔒 BASE LOCKED', sub: `Lasers up for ${r.seconds}s — nobody gets in`, color: '#f43f5e', ttl: 1800 });
    return true;
  } catch (e: any) {
    toast({ kind: 'info', icon: '🔒', title: e.message });
    return false;
  }
}

// ── Reads the 3D world needs ─────────────────────────────────────────────
export async function fetchBase(playerId: string): Promise<BaseView | null> {
  try {
    return await call<BaseView>('stt_base', { player_id: playerId }, { quiet: true, sync: false });
  } catch {
    return null;
  }
}

export const priceTag = (n: number) => shortMoney(n);

// ── Market ───────────────────────────────────────────────────────────────
export async function list(playerItemId: string, priceValue: number) {
  await call('stt_list', { player_item_id: playerItemId, price: Math.round(priceValue) });
  play('coin');
  toast({ kind: 'good', icon: '🏷️', title: 'Listed on the market', body: money(priceValue) });
  refreshMarket();
  refreshWorld();
}
export async function cancelListing(listingId: string) {
  await call('stt_cancel_listing', { listing_id: listingId });
  play('click');
  refreshMarket();
}
export async function buyListing(listingId: string, itemId: string, priceValue: number) {
  await call('stt_buy_listing', { listing_id: listingId });
  play('buy');
  toast({ kind: 'good', icon: '🛒', itemId, title: `Bought ${item(itemId)?.name ?? 'item'}`, body: money(priceValue) });
  refreshMarket();
  refreshWorld();
}

// ── Trades ───────────────────────────────────────────────────────────────
export async function proposeTrade(p: { to: string; offer_items: string[]; offer_cash: number; request_items: string[]; request_cash: number; message?: string }) {
  await call('stt_trade_propose', p);
  play('trade');
  toast({ kind: 'good', icon: '📨', title: 'Offer sent', body: 'Both sides must confirm before anything moves.' });
}
export async function respondTrade(tradeId: string, accept: boolean) {
  const r = await call<{ ok: boolean; reason?: string }>('stt_trade_respond', { trade_id: tradeId, accept });
  if (accept && r.ok === false) toast({ kind: 'bad', icon: '⚠️', title: 'Trade failed', body: r.reason });
  refreshWorld();
  return r;
}
export async function cancelTrade(tradeId: string) {
  await call('stt_trade_cancel', { trade_id: tradeId });
}

// ── Progression ──────────────────────────────────────────────────────────
export async function claimQuest(id: string) {
  const r = await call<any>('stt_claim_quest', { quest_id: id });
  play('cash');
  const bits = [r.cash ? `+${money(r.cash)}` : '', r.xp ? `+${r.xp} XP` : '', r.tokens ? Object.entries(r.tokens).map(([k, v]) => `+${v} ${k} drop`).join(' ') : '', r.secret_keys ? `+${r.secret_keys} Secret Key` : ''];
  toast({ kind: 'epic', icon: '🎯', title: 'Quest complete!', body: bits.filter(Boolean).join('  ') });
}
export async function claimDaily() {
  const r = await call<any>('stt_claim_daily');
  play('cash');
  refreshWorld();
  return r;
}
export async function buyCosmetic(id: string) {
  await call('stt_buy_cosmetic', { cosmetic_id: id });
  play('buy');
}
export async function equip(id: string) {
  await call('stt_equip', { cosmetic_id: id });
  play('click');
  refreshWorld();
}
export async function setFocus(focus: string) {
  await call('stt_set_focus', { focus });
  play('click');
}
export async function prestige() {
  const r = await call<any>('stt_prestige');
  play('levelup');
  toast({ kind: 'epic', icon: '✨', title: `PRESTIGE ${r.prestige}!`, body: 'Permanent bonuses unlocked.', ttl: 8000 });
  refreshWorld();
}
export async function tutorial(step: number) {
  return call<any>('stt_tutorial', { step }, { quiet: true });
}

export function visit(playerId: string, revenge = false) {
  setG({ focusPlot: playerId });
  openPanel('visit', { playerId, revenge });
}
