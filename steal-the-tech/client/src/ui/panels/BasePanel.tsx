import { useMemo, useState } from 'react';
import { useGame, openPanel, toClient, price, item as catItem, pendingOf } from '../../game/store';
import { useWorldUI } from '../../world/ui';
import { engine } from '../../world/engine';
import { EMPTY } from '../../game/store';
import { money, perSec, shortMoney, duration } from '../../game/format';
import { place, store, vault, autoArrange, quickSell, upgrade, list } from '../../game/actions';
import { Panel, ItemCard, Tabs, Stat, ItemDetail, useNow } from '../common';
import { confirmAction } from '../overlays';
import { tierOf } from '../../game/rarity';
import type { PlayerItem, Rarity } from '../../backend/types';

type Tab = 'display' | 'storage' | 'vault' | 'upgrades';

export function BasePanel() {
  const me = useGame((s) => s.me)!;
  const items = useGame((s) => s.myItems);
  const upgrades = useGame((s) => s.catalog?.upgrades ?? EMPTY);
  const arg = useGame((s) => s.panelArg);
  const listings = useGame((s) => s.last?.listings ?? EMPTY);
  const [tab, setTab] = useState<Tab>('display');
  const [sel, setSel] = useState<string | null>(arg?.select ?? null);
  const [pickSlot, setPickSlot] = useState<number | null>(null);
  const now = useNow(1000);

  const displayed = useMemo(() => new Map(items.filter((i) => i.location === 'display').map((i) => [i.slot!, i])), [items]);
  const storage = items.filter((i) => i.location === 'inventory');
  const vaulted = items.filter((i) => i.location === 'vault');
  const listed = items.filter((i) => i.location === 'listed');
  const selected = items.find((i) => i.id === sel) || null;
  const byValue = (a: PlayerItem, b: PlayerItem) => price(b.item_id) - price(a.item_id);

  const nextUp = (kind: 'base' | 'security' | 'vault', lvl: number) => upgrades.find((u) => u.kind === kind && u.level === lvl + 1);
  const curUp = (kind: 'base' | 'security' | 'vault', lvl: number) => upgrades.find((u) => u.kind === kind && u.level === lvl);
  const shieldLeft = me.shield_until ? toClient(me.shield_until) - now : 0;
  const atHome = !!useWorldUI((s) => s.here?.mine);
  const pendingTotal = items.reduce((a, pi) => a + pendingOf(pi), 0);

  return (
    <Panel title="MY BASE" icon="🏠" head={<button className="btn small" onClick={() => autoArrange()}>✨ AUTO-FILL</button>}>
      <div className="card tight collect-tip">
        💰 <b>{shortMoney(pendingTotal)}</b> waiting on your podiums — walk over the green plates (or the 💰 pad at your door) to collect.
        {!atHome && <button className="btn small good" style={{ marginLeft: 8 }} onClick={() => { engine?.travelHome(); openPanel(null); }}>GO HOME</button>}
      </div>
      <div className="stats">
        <Stat k="Base value" v={money(me.base_value)} cls="good-t" />
        <Stat k="Income" v={'+' + perSec(me.income)} cls="good-t" />
        <Stat k="Display" v={`${displayed.size}/${me.slots}`} />
        <Stat k="Security" v={`L${me.security_level}`} />
        <Stat k="Vault" v={`${vaulted.length}/${me.vault_capacity}`} />
        {shieldLeft > 0 && <Stat k="Shield" v={duration(shieldLeft)} />}
      </div>
      <Tabs<Tab>
        value={tab}
        onChange={(t) => { setTab(t); setPickSlot(null); }}
        tabs={[
          { id: 'display', label: `Display ${displayed.size}/${me.slots}` },
          { id: 'storage', label: `Storage ${storage.length}` },
          { id: 'vault', label: `Vault ${vaulted.length}/${me.vault_capacity}` },
          { id: 'upgrades', label: 'Upgrades' },
        ]}
      />

      {selected && (
        <div className="card">
          <ItemDetail id={selected.item_id} serial={selected.serial} />
          <ItemActions pi={selected} onDone={() => setSel(null)} />
        </div>
      )}

      {tab === 'display' && (
        <>
          <div className="muted" style={{ fontWeight: 700 }}>Items on display earn income — and can be stolen. Tap an empty slot to fill it.</div>
          <div className="grid items">
            {Array.from({ length: me.slots }, (_, i) => {
              const pi = displayed.get(i);
              if (!pi)
                return (
                  <div key={i} className="icard" style={{ display: 'grid', placeItems: 'center', minHeight: 170, borderStyle: 'dashed', opacity: 0.8 }} onClick={() => setPickSlot(i)}>
                    <div style={{ fontSize: 30 }}>＋</div>
                    <div className="muted" style={{ fontWeight: 800 }}>SLOT {i + 1}</div>
                  </div>
                );
              return <ItemCard key={pi.id} id={pi.item_id} mutation={pi.mutation} serial={pi.serial} selected={sel === pi.id} onClick={() => setSel(pi.id)} badge={pi.soulbound ? <span className="tag">★</span> : pi.hot_until && toClient(pi.hot_until) > now ? <span className="tag">🔥</span> : null} />;
            })}
          </div>
          {pickSlot !== null && (
            <div className="card">
              <div className="row between">
                <b>Fill slot {pickSlot + 1}</b>
                <button className="btn small ghost" onClick={() => setPickSlot(null)}>✕</button>
              </div>
              {storage.length + vaulted.length === 0 ? (
                <div className="empty">Nothing in storage. Open drops, trade or steal to get more!</div>
              ) : (
                <div className="grid items" style={{ marginTop: 8 }}>
                  {[...storage, ...vaulted].sort(byValue).map((pi) => (
                    <ItemCard key={pi.id} id={pi.item_id} mutation={pi.mutation} serial={pi.serial} badge={pi.location === 'vault' ? <span className="tag">🔒</span> : null} onClick={() => { place(pi.id, pickSlot).catch(() => {}); setPickSlot(null); }} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'storage' && (
        <>
          <div className="muted" style={{ fontWeight: 700 }}>Stored items are safe from thieves but earn nothing. {listed.length > 0 && `${listed.length} item(s) listed on the market.`}</div>
          {storage.length === 0 && listed.length === 0 ? (
            <div className="empty">Storage is empty.</div>
          ) : (
            <div className="grid items">
              {storage.sort(byValue).map((pi) => (
                <ItemCard key={pi.id} id={pi.item_id} mutation={pi.mutation} serial={pi.serial} selected={sel === pi.id} onClick={() => setSel(pi.id)} badge={pi.hot_until && toClient(pi.hot_until) > now ? <span className="tag">🔥 HOT</span> : null} />
              ))}
              {listed.map((pi) => {
                const l = listings.find((x) => x.player_item_id === pi.id);
                return <ItemCard key={pi.id} id={pi.item_id} mutation={pi.mutation} serial={pi.serial} onClick={() => openPanel('market', { tab: 'mine' })} badge={<span className="tag">🏷️ {l ? shortMoney(l.price) : 'LISTED'}</span>} />;
              })}
            </div>
          )}
        </>
      )}

      {tab === 'vault' && (
        <>
          <div className="card tight" style={{ background: 'rgba(74,222,128,0.08)' }}>
            <b>🔒 VAULT {vaulted.length}/{me.vault_capacity}</b>
            <div className="muted" style={{ fontWeight: 700 }}>Vaulted items can never be stolen and survive Prestige — but they don't earn income. Vault something mid-raid to foil the thief!</div>
          </div>
          {vaulted.length === 0 ? (
            <div className="empty">Your vault is empty.</div>
          ) : (
            <div className="grid items">
              {vaulted.sort(byValue).map((pi) => (
                <ItemCard key={pi.id} id={pi.item_id} mutation={pi.mutation} serial={pi.serial} selected={sel === pi.id} onClick={() => setSel(pi.id)} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'upgrades' && (
        <div className="col">
          {(
            [
              ['base', '🏗️ BASE', me.base_level, (v: number) => `${v} display slots`, 'More slots = more income on display.'],
              ['security', '🔐 SECURITY', me.security_level, (v: number) => `Level ${v}`, 'Each level cuts raiders\' success chance by 7% and makes steals take longer.'],
              ['vault', '🏦 VAULT', me.vault_level, (v: number) => `${v} protected items`, 'Vaulted items can never be stolen.'],
            ] as const
          ).map(([kind, label, lvl, fmt, desc]) => {
            const cur = curUp(kind, lvl);
            const nx = nextUp(kind, lvl);
            return (
              <div key={kind} className="card">
                <div className="row between">
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 18 }}>{label} · L{lvl}</div>
                    <div className="muted" style={{ fontWeight: 700 }}>{cur?.name} — {cur ? fmt(cur.value) : ''}</div>
                  </div>
                  {nx ? (
                    <button className="btn gold" disabled={me.cash < nx.cost} onClick={() => upgrade(kind).catch(() => {})}>
                      {money(nx.cost)}
                    </button>
                  ) : (
                    <span className="tag">MAX</span>
                  )}
                </div>
                {nx && (
                  <div className="muted" style={{ marginTop: 6, fontWeight: 700 }}>
                    Next: <b style={{ color: '#fde68a' }}>{nx.name}</b> — {fmt(nx.value)}. {desc}
                  </div>
                )}
                <div className="bar gold" style={{ marginTop: 8 }}>
                  <i style={{ width: `${(lvl / upgrades.filter((u) => u.kind === kind).length) * 100}%` }} />
                </div>
              </div>
            );
          })}
          <div className="card tight">
            <b>Security levels</b>
            <div className="muted" style={{ fontWeight: 700 }}>1 Basic Alarm · 2 Camera · 3 Security Door · 4 Advanced Scanner · 5 Elite Security · 6 Quantum Security</div>
          </div>
        </div>
      )}
    </Panel>
  );
}

export function ItemActions({ pi, onDone }: { pi: PlayerItem; onDone?: () => void }) {
  const me = useGame((s) => s.me)!;
  const vaultUsed = useGame((s) => s.myItems.filter((i) => i.location === 'vault').length);
  const rules = useGame((s) => s.catalog?.rules);
  const m = useGame((s) => s.market[pi.item_id]);
  const mult = useGame((s) => (pi.mutation ? s.catalog?.mutations?.find((x) => x.id === pi.mutation)?.mult ?? 1 : 1));
  const [listing, setListing] = useState(false);
  const it = catItem(pi.item_id)!;
  const mp = Math.round((m?.price ?? it.base_value) * mult);
  const [lp, setLp] = useState(String(Math.round(mp * 1.05)));
  const hot = !!pi.hot_until && toClient(pi.hot_until) > Date.now();
  const quick = Math.floor(mp * (rules?.quick_sell_rate ?? 0.6));
  const done = () => onDone?.();
  const bigTier = tierOf(it.rarity as Rarity) >= 5;
  if (pi.location === 'listed') return <div className="muted">Listed on the market.</div>;
  return (
    <div className="col" style={{ marginTop: 10 }}>
      <div className="row wrap">
        {pi.location !== 'display' && <button className="btn primary" onClick={() => place(pi.id).then(done).catch(() => {})}>⬆ DISPLAY</button>}
        {pi.location === 'display' && <button className="btn" onClick={() => store(pi.id).then(done).catch(() => {})}>⬇ STORE</button>}
        {pi.location !== 'vault' && (
          <button className="btn good" disabled={vaultUsed >= me.vault_capacity} onClick={() => vault(pi.id).then(done).catch(() => {})}>
            🔒 VAULT {vaultUsed >= me.vault_capacity ? '(FULL)' : ''}
          </button>
        )}
        {!pi.soulbound && it.tradeable && (
          <>
            <button className="btn gold" disabled={hot} onClick={() => setListing(!listing)}>🏷️ SELL</button>
          </>
        )}
      </div>
      {hot && <div className="bad-t" style={{ fontWeight: 800 }}>🔥 Too hot to sell for {duration(toClient(pi.hot_until!) - Date.now())}.</div>}
      {listing && !hot && (
        <div className="card">
          <div className="row between">
            <b>Sell {it.name}</b>
            <span className="muted">Market {money(mp)}</span>
          </div>
          <div className="grid two" style={{ marginTop: 8 }}>
            <div className="col">
              <div className="muted" style={{ fontWeight: 800 }}>QUICK SELL (instant)</div>
              <button
                className="btn"
                onClick={() =>
                  bigTier
                    ? confirmAction({ title: 'Quick sell?', body: `Sell ${it.name} instantly for ${money(quick)} (60% of market)?`, confirmLabel: 'SELL', danger: true, hold: true, onConfirm: () => quickSell(pi.id, it.id).then(done).catch(() => {}) })
                    : quickSell(pi.id, it.id).then(done).catch(() => {})
                }
              >
                {money(quick)}
              </button>
            </div>
            <div className="col">
              <div className="muted" style={{ fontWeight: 800 }}>LIST FOR (players buy)</div>
              <input className="field" inputMode="numeric" value={lp} onChange={(e) => setLp(e.target.value.replace(/[^0-9]/g, ''))} />
            </div>
          </div>
          <div className="row wrap" style={{ marginTop: 8 }}>
            {[0.95, 1, 1.1, 1.25].map((k) => (
              <button key={k} className="btn small" onClick={() => setLp(String(Math.round(mp * k)))}>{k === 1 ? 'MARKET' : `${k > 1 ? '+' : ''}${Math.round((k - 1) * 100)}%`}</button>
            ))}
          </div>
          <div className="muted" style={{ fontWeight: 700, marginTop: 6 }}>
            You receive {money(Math.max(0, Number(lp) - Math.ceil(Number(lp) * (rules?.market_fee ?? 0.05))))} after the 5% market fee. Allowed range {shortMoney(mp * (rules?.list_min ?? 0.25))}–{shortMoney(mp * (rules?.list_max ?? 5))}.
          </div>
          <button className="btn gold block big" style={{ marginTop: 8 }} onClick={() => list(pi.id, Number(lp)).then(done).catch(() => {})}>
            LIST FOR {money(Number(lp) || 0)}
          </button>
        </div>
      )}
    </div>
  );
}
