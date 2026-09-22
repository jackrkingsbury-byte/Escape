import { useEffect, useState } from 'react';
import { useGame, toClient, openPanel } from '../../game/store';
import { money, duration } from '../../game/format';
import { openDrop, setFocus } from '../../game/actions';
import { RARITY, RARITY_ORDER, CATEGORY_ICON } from '../../game/rarity';
import { Panel, RarityLabel, Tabs, ItemCard, ItemDetail, useNow } from '../common';
import type { Category, Rarity } from '../../backend/types';

export function DropsPanel() {
  const cat = useGame((s) => s.catalog)!;
  const me = useGame((s) => s.me)!;
  const ev = useGame((s) => s.last?.event);
  const busy = useGame((s) => !!s.drop);
  useNow(1000);
  return (
    <Panel title="DROP ZONE" icon="📦">
      <div className="card tight" style={{ background: 'rgba(34,211,238,0.07)' }}>
        <b>All drops are bought with cash you earn in the game.</b>
        <div className="muted" style={{ fontWeight: 700 }}>No real money, no deposits, no cash-outs. Odds are shown on every machine{me.luck > 0 ? ` · your Prestige luck: +${Math.round(me.luck * 100)}% on Rare+` : ''}.</div>
      </div>
      {ev && (
        <div className="card" style={{ borderColor: 'rgba(251,146,60,0.6)' }}>
          <b>{ev.icon} {ev.title} is live — {duration(toClient(ev.ends_at) - Date.now())} left</b>
          <div className="muted" style={{ fontWeight: 700 }}>{ev.description}</div>
        </div>
      )}
      {cat.drops.map((d) => {
        const tokens = me.drop_tokens?.[d.id] || 0;
        const lockedLevel = me.level < d.min_level;
        const lockedEvent = d.event_only && !ev;
        const lockedKey = d.requires_key && me.secret_keys < 1;
        const locked = lockedLevel || lockedEvent || lockedKey;
        const afford = me.cash >= d.price;
        const total = Object.values(d.weights).reduce((a, b) => a + (b || 0), 0);
        return (
          <div key={d.id} className="card" data-testid={'drop-' + d.id} style={{ opacity: locked ? 0.7 : 1 }}>
            <div className="row between">
              <div>
                <div className="display" style={{ fontWeight: 900, fontSize: 19 }}>{d.name}</div>
                <div className="muted" style={{ fontWeight: 700 }}>{d.description}</div>
              </div>
              <div className="good-t display" style={{ fontSize: 20, fontWeight: 900 }}>{money(d.price)}</div>
            </div>
            <div className="row wrap" style={{ gap: 6, margin: '10px 0' }}>
              {RARITY_ORDER.filter((r) => d.weights[r]).map((r) => (
                <span key={r} className="row" style={{ gap: 4, display: 'inline-flex' }}>
                  <RarityLabel r={r as Rarity} />
                  <b style={{ fontSize: 13 }}>{fmtOdds(((d.weights[r] || 0) / total) * 100)}</b>
                </span>
              ))}
            </div>
            {locked ? (
              <div className="muted" style={{ fontWeight: 800 }}>
                🔒 {lockedLevel ? `Unlocks at level ${d.min_level}` : lockedEvent ? 'Only during live events' : `Needs a Secret Key (you have ${me.secret_keys}) — earn them from weekly missions and 7-day streaks`}
              </div>
            ) : (
              <div className="row">
                {tokens > 0 && (
                  <button className="btn good big grow" disabled={busy} onClick={() => openDrop(d.id, true)}>
                    OPEN FREE ({tokens})
                  </button>
                )}
                <button className="btn primary big grow" disabled={busy || !afford} onClick={() => openDrop(d.id, false)} data-testid={'open-' + d.id}>
                  {afford ? 'OPEN' : `NEED ${money(d.price - me.cash)}`}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </Panel>
  );
}

function fmtOdds(p: number) {
  if (p >= 10) return p.toFixed(0) + '%';
  if (p >= 1) return p.toFixed(1) + '%';
  return p.toFixed(2) + '%';
}

const CATS: (Category | 'ALL')[] = ['ALL', 'TECH', 'GAMING', 'CARS', 'FASHION', 'LUXURY', 'SPORTS'];

export function CollectionPanel() {
  const cat = useGame((s) => s.catalog)!;
  const me = useGame((s) => s.me)!;
  const myItems = useGame((s) => s.myItems);
  const arg = useGame((s) => s.panelArg);
  const [tab, setTab] = useState<Category | 'ALL'>('ALL');
  const [sel, setSel] = useState<string | null>(null);
  const [data, setData] = useState<{ discovered: { item_id: string }[]; owned: Record<string, number>; username: string } | null>(null);
  const viewing: string = arg?.playerId || me.id;
  const myCount = myItems.length;
  useEffect(() => {
    useGame.getState().backend?.rpc('stt_collection', viewing === me.id ? {} : { player_id: viewing }).then(setData).catch(() => {});
  }, [viewing, me.id, myCount]);
  const found = new Set((data?.discovered || []).map((d) => d.item_id));
  const all = cat.items.filter((i) => i.droppable || i.event_only);
  const shown = all.filter((i) => tab === 'ALL' || i.category === tab).sort((a, b) => RARITY[a.rarity].tier - RARITY[b.rarity].tier || a.base_value - b.base_value);
  const pct = (list: typeof all) => (list.length ? Math.round((list.filter((i) => found.has(i.id)).length / list.length) * 100) : 0);
  const mineView = viewing === me.id;
  const ownedCount = (id: string) => (mineView ? myItems.filter((p) => p.item_id === id).length : data?.owned?.[id] || 0);
  return (
    <Panel title={mineView ? 'COLLECTION' : `${data?.username ?? ''}'S COLLECTION`} icon="🎒">
      <div className="card">
        <div className="row between">
          <b style={{ fontSize: 18 }}>{found.size}/{all.length} discovered</b>
          <b className="gold-t display" style={{ fontSize: 22 }}>{pct(all)}%</b>
        </div>
        <div className="bar gold" style={{ marginTop: 8 }}><i style={{ width: pct(all) + '%' }} /></div>
        <div className="grid three" style={{ marginTop: 10 }}>
          {CATS.slice(1).map((c) => {
            const l = all.filter((i) => i.category === c);
            return (
              <div key={c} className="stat" style={{ cursor: 'pointer' }} onClick={() => setTab(c)}>
                <div className="k">{CATEGORY_ICON[c]} {c}</div>
                <div className="v">{pct(l)}%</div>
              </div>
            );
          })}
        </div>
      </div>
      {mineView && (
        <div className="card tight">
          <div className="row between wrap">
            <b>🎯 Collection focus: {me.focus}</b>
            {me.level < (cat.rules.focus_level || 5) && <span className="muted">Unlocks at level {cat.rules.focus_level}</span>}
          </div>
          <div className="muted" style={{ fontWeight: 700, margin: '4px 0 8px' }}>Choose what your drops lean towards. Random keeps everything in play.</div>
          <div className="row wrap">
            {(['RANDOM', 'TECH', 'GAMING', 'CARS', 'FASHION', 'LUXURY', 'SPORTS'] as const).map((f) => (
              <button key={f} className={'btn small ' + (me.focus === f ? 'primary' : '')} disabled={f !== 'RANDOM' && me.level < (cat.rules.focus_level || 5)} onClick={() => setFocus(f).catch(() => {})}>
                {CATEGORY_ICON[f]} {f}
              </button>
            ))}
          </div>
        </div>
      )}
      <Tabs value={tab} onChange={setTab} tabs={CATS.map((c) => ({ id: c, label: c === 'ALL' ? 'ALL' : `${CATEGORY_ICON[c]} ${c}` }))} />
      {sel && (
        <div className="card">
          <ItemDetail id={sel} owned={ownedCount(sel)} />
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn primary" onClick={() => openPanel('market', { item: sel })}>📈 MARKET</button>
            <button className="btn ghost" onClick={() => setSel(null)}>CLOSE</button>
          </div>
        </div>
      )}
      <div className="grid items">
        {shown.map((i) => {
          const known = found.has(i.id);
          return (
            <ItemCard
              key={i.id}
              id={i.id}
              unknown={!known}
              onClick={known ? () => setSel(i.id) : undefined}
              badge={known && ownedCount(i.id) > 0 ? <span className="tag">×{ownedCount(i.id)}</span> : i.event_only ? <span className="tag">EVENT</span> : null}
            />
          );
        })}
      </div>
    </Panel>
  );
}
