// Every button in the game goes through these wrappers: call the server, give
// feedback (sound/toast), then re-sync. The client never decides outcomes.
import { G, setG, toast, toClient, item, openPanel, type OpenDropResult } from './store';
import { syncNow, refreshWorld, refreshMarket } from './session';
import { play, reveal } from './sound';
import { money } from './format';

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

// ── Stealing ─────────────────────────────────────────────────────────────
export async function startSteal(playerItemId: string, revenge = false) {
  if (G().steal && !G().steal!.result) {
    toast({ kind: 'bad', icon: '🥷', title: 'Finish your current raid first.' });
    return;
  }
  const r = await call<any>('stt_start_steal', { player_item_id: playerItemId, revenge });
  play('whoosh');
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
      result: null,
      finishing: false,
    },
  });
}

export async function finishSteal() {
  const st = G().steal;
  if (!st || st.finishing || st.result) return;
  setG({ steal: { ...st, finishing: true } });
  try {
    const r = await call<any>('stt_finish_steal', { raid_id: st.raidId }, { quiet: true });
    setG({ steal: { ...G().steal!, finishing: false, defended: r.defended, result: { status: r.status, fine: r.fine, note: r.note } } });
    play(r.status === 'success' ? 'steal_ok' : 'steal_fail');
    if (r.status === 'success') reveal(item(st.itemId)?.rarity || 'common');
    refreshWorld();
  } catch (e: any) {
    // Too early (clock skew) — retry shortly.
    setG({ steal: { ...G().steal!, finishing: false } });
    if (/Still stealing/.test(e.message)) window.setTimeout(finishSteal, 800);
    else toast({ kind: 'bad', icon: '⛔', title: e.message });
  }
}

export async function defend(raidId: string) {
  await call('stt_defend', { raid_id: raidId });
  play('defend');
  toast({ kind: 'good', icon: '🚨', title: 'ALARM SOUNDED!', body: 'The thief\'s odds just collapsed.' });
}

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
