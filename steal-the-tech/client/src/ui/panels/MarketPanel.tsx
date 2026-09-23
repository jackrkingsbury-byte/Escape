import { useEffect, useMemo, useState } from 'react';
import { useGame, G, item as catItem } from '../../game/store';
import { EMPTY } from '../../game/store';
import { money, shortMoney, pct, ago, demandLabel, perSec } from '../../game/format';
import { buyListing, cancelListing } from '../../game/actions';
import { RARITY, RARITY_ORDER, CATEGORY_ICON } from '../../game/rarity';
import { Panel, Tabs, ItemIcon, RarityLabel, PriceChart, Stat, HoldButton, PlayerName, MutBadge } from '../common';
import { ItemActions } from './BasePanel';
import type { Listing, MarketItemDetail, Rarity } from '../../backend/types';

type Tab = 'board' | 'deals' | 'mine';
type Range = '1H' | '24H' | '7D' | '30D' | 'ALL';

export function MarketPanel() {
  const arg = useGame((s) => s.panelArg);
  const [tab, setTab] = useState<Tab>(arg?.tab || 'board');
  const [itemId, setItemId] = useState<string | null>(arg?.item || null);
  useEffect(() => {
    if (arg?.item) setItemId(arg.item);
    if (arg?.tab) setTab(arg.tab);
  }, [arg]);
  return (
    <Panel title="CENTRAL MARKET" icon="📈">
      {itemId ? (
        <ItemMarket id={itemId} onBack={() => setItemId(null)} />
      ) : (
        <>
          <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ id: 'board', label: 'Price board' }, { id: 'deals', label: 'Buy listings' }, { id: 'mine', label: 'My listings' }]} />
          {tab === 'board' && <Board onPick={setItemId} />}
          {tab === 'deals' && <Deals onPick={setItemId} />}
          {tab === 'mine' && <MyListings onPick={setItemId} />}
        </>
      )}
    </Panel>
  );
}

function Board({ onPick }: { onPick: (id: string) => void }) {
  const market = useGame((s) => s.market);
  const items = useGame((s) => s.catalog?.items ?? EMPTY);
  const [q, setQ] = useState('');
  const [catF, setCatF] = useState('ALL');
  const [rar, setRar] = useState('ALL');
  const [sort, setSort] = useState<'change' | 'price' | 'demand' | 'name'>('change');
  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return items
      .filter((i) => i.tradeable)
      .filter((i) => (catF === 'ALL' || i.category === catF) && (rar === 'ALL' || i.rarity === rar) && (!ql || i.name.toLowerCase().includes(ql)))
      .map((i) => ({ i, m: market[i.id] }))
      .filter((r) => r.m)
      .sort((a, b) => {
        if (sort === 'price') return b.m.price - a.m.price;
        if (sort === 'demand') return b.m.demand - a.m.demand;
        if (sort === 'name') return a.i.name.localeCompare(b.i.name);
        return b.m.change_24h - a.m.change_24h;
      });
  }, [items, market, q, catF, rar, sort]);
  return (
    <>
      <input className="field" placeholder="Search items…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="row wrap">
        <select className="field" style={{ width: 'auto', flex: 1 }} value={catF} onChange={(e) => setCatF(e.target.value)}>
          <option value="ALL">All categories</option>
          {['TECH', 'GAMING', 'CARS', 'FASHION', 'LUXURY', 'SPORTS'].map((c) => <option key={c} value={c}>{CATEGORY_ICON[c]} {c}</option>)}
        </select>
        <select className="field" style={{ width: 'auto', flex: 1 }} value={rar} onChange={(e) => setRar(e.target.value)}>
          <option value="ALL">All rarities</option>
          {RARITY_ORDER.map((r) => <option key={r} value={r}>{RARITY[r].label}</option>)}
        </select>
        <select className="field" style={{ width: 'auto', flex: 1 }} value={sort} onChange={(e) => setSort(e.target.value as any)}>
          <option value="change">Top movers (24H)</option>
          <option value="price">Highest price</option>
          <option value="demand">Highest demand</option>
          <option value="name">Name</option>
        </select>
      </div>
      <table className="tbl">
        <thead>
          <tr><th>ITEM</th><th style={{ textAlign: 'right' }}>PRICE</th><th style={{ textAlign: 'right' }}>24H</th><th style={{ textAlign: 'right' }}>DEMAND</th></tr>
        </thead>
        <tbody>
          {rows.map(({ i, m }) => {
            const d = demandLabel(m.demand);
            return (
              <tr key={i.id} className="click" onClick={() => onPick(i.id)}>
                <td>
                  <div className="row" style={{ gap: 8 }}>
                    <ItemIcon id={i.id} size={38} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ lineHeight: 1.1 }}>{i.name}</div>
                      <RarityLabel r={i.rarity as Rarity} />
                      {i.max_supply ? <span className="supply" style={{ marginLeft: 4 }}>{m.minted ?? 0}/{i.max_supply}</span> : null}
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: 'right' }} className="mono">{shortMoney(m.price)}</td>
                <td style={{ textAlign: 'right' }} className={'mono ' + (m.change_24h > 0 ? 'up' : m.change_24h < 0 ? 'down' : 'flat')}>{pct(m.change_24h)}</td>
                <td style={{ textAlign: 'right' }} className={d.cls}>{d.label}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function Deals({ onPick }: { onPick: (id: string) => void }) {
  const [rows, setRows] = useState<Listing[] | null>(null);
  const me = useGame((s) => s.me)!;
  const load = () => G().backend?.rpc<Listing[]>('stt_listings', {}).then(setRows).catch(() => setRows([]));
  useEffect(() => {
    load();
    const t = window.setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);
  if (!rows) return <div className="empty">Loading listings…</div>;
  if (!rows.length) return <div className="empty">No listings right now. Check back soon — traders list new stock all the time.</div>;
  return (
    <div className="list">
      {rows.map((l) => {
        const it = catItem(l.item_id!);
        if (!it) return null;
        const ratio = l.market ? l.price / l.market : 1;
        return (
          <div key={l.id} className="li">
            <ItemIcon id={it.id} size={48} />
            <div className="grow" style={{ cursor: 'pointer' }} onClick={() => onPick(it.id)}>
              <div className="t1">{it.name}{l.serial ? ` #${l.serial}` : ''} <MutBadge m={l.mutation} /></div>
              <div className="t2">
                <RarityLabel r={it.rarity as Rarity} /> by {l.seller}{l.seller_bot ? ' 🤖' : ''} · {ratio < 0.97 ? <span className="good-t">{Math.round((1 - ratio) * 100)}% under market</span> : ratio > 1.03 ? <span className="bad-t">{Math.round((ratio - 1) * 100)}% over market</span> : 'at market'}
              </div>
            </div>
            {l.mine ? (
              <button className="btn small" onClick={() => cancelListing(l.id).then(load).catch(() => {})}>CANCEL</button>
            ) : (
              <button className="btn small good" disabled={me.cash < l.price} onClick={() => buyListing(l.id, it.id, l.price).then(load).catch(() => {})}>{shortMoney(l.price)}</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MyListings({ onPick }: { onPick: (id: string) => void }) {
  const listings = useGame((s) => s.last?.listings ?? EMPTY);
  const market = useGame((s) => s.market);
  if (!listings.length) return <div className="empty">You have no active listings. Open an item in your BASE and tap SELL to list it.</div>;
  return (
    <div className="list">
      {listings.map((l) => {
        const it = catItem(l.item_id);
        if (!it) return null;
        return (
          <div key={l.id} className="li">
            <ItemIcon id={it.id} size={48} />
            <div className="grow" style={{ cursor: 'pointer' }} onClick={() => onPick(it.id)}>
              <div className="t1">{it.name}</div>
              <div className="t2">Listed {money(l.price)} · market {money(market[it.id]?.price)} · {ago(l.created_at)}</div>
            </div>
            <button className="btn small" onClick={() => cancelListing(l.id).catch(() => {})}>CANCEL</button>
          </div>
        );
      })}
    </div>
  );
}

function ItemMarket({ id, onBack }: { id: string; onBack: () => void }) {
  const it = catItem(id)!;
  const me = useGame((s) => s.me)!;
  const myItems = useGame((s) => s.myItems);
  const mine = useMemo(() => myItems.filter((p) => p.item_id === id && p.location !== 'listed'), [myItems, id]);
  const [range, setRange] = useState<Range>('24H');
  const [d, setD] = useState<MarketItemDetail | null>(null);
  const [sellId, setSellId] = useState<string | null>(null);
  const [buy, setBuy] = useState<Listing | null>(null);
  const load = () => G().backend?.rpc<MarketItemDetail>('stt_market_item', { item_id: id, range }).then(setD).catch(() => {});
  useEffect(() => {
    load();
    const t = window.setInterval(load, 10000);
    return () => clearInterval(t);
  }, [id, range]);
  const points = useMemo<[number, number][]>(() => {
    if (!d) return [];
    const pts = d.history.map((h) => [h[0], h[1]] as [number, number]);
    pts.push([Date.now() + G().serverOffset, d.price]);
    return pts;
  }, [d]);
  const demand = d ? demandLabel(d.demand) : null;
  return (
    <>
      <button className="btn small ghost" style={{ alignSelf: 'flex-start' }} onClick={onBack}>← ALL ITEMS</button>
      <div className="row">
        <ItemIcon id={id} size={84} />
        <div className="grow">
          <div style={{ fontWeight: 900, fontSize: 21, lineHeight: 1.1 }}>{it.name}</div>
          <RarityLabel r={it.rarity as Rarity} /> <span className="muted" style={{ fontWeight: 700 }}>{it.category} · +{perSec(it.base_income)}</span>
          {d && (
            <div className="row" style={{ gap: 12, marginTop: 4 }}>
              <span className="display" style={{ fontSize: 26, fontWeight: 900 }}>{money(d.price)}</span>
              <span className={d.change_24h >= 0 ? 'up' : 'down'} style={{ fontWeight: 900, fontSize: 18 }}>{pct(d.change_24h)} 24H</span>
            </div>
          )}
        </div>
      </div>
      <Tabs<Range> value={range} onChange={setRange} tabs={(['1H', '24H', '7D', '30D', 'ALL'] as Range[]).map((r) => ({ id: r, label: r }))} />
      <div className="card tight">
        <div style={{ fontWeight: 800, fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>PRICE — {range}</div>
        {d ? <PriceChart points={points} /> : <div className="empty">Loading…</div>}
      </div>
      {d && (
        <div className="stats">
          <Stat k="Base price" v={shortMoney(it.base_value)} />
          <Stat k="Current" v={shortMoney(d.price)} />
          <Stat k="Demand" v={<span className={demand!.cls}>{demand!.label}</span>} />
          <Stat k="Supply" v={it.max_supply ? `${d.minted ?? 0}/${it.max_supply}` : d.supply} />
          <Stat k="Owners" v={d.owners} />
          <Stat k="Listed" v={d.listed} />
          <Stat k="Sales 24H" v={d.volume_24h} />
          <Stat k="You own" v={d.mine} />
        </div>
      )}
      <h3>Listings</h3>
      {!d ? null : d.listings.length === 0 ? (
        <div className="empty" style={{ padding: 12 }}>No one is selling this right now.</div>
      ) : (
        <div className="list">
          {d.listings.map((l) => (
            <div key={l.id} className="li">
              <div className="grow">
                <div className="t1">{money(l.price)} {l.serial ? <span className="supply">#{l.serial}</span> : null} <MutBadge m={l.mutation} /></div>
                <div className="t2">
                  <PlayerName id={l.seller_id} name={l.seller} bot={l.seller_bot} /> · {ago(l.created_at)}
                </div>
              </div>
              {l.mine ? (
                <button className="btn small" onClick={() => cancelListing(l.id).then(load).catch(() => {})}>CANCEL</button>
              ) : (
                <button className="btn good small" disabled={me.cash < l.price} onClick={() => setBuy(l)}>BUY</button>
              )}
            </div>
          ))}
        </div>
      )}
      {buy && (
        <div className="card" style={{ borderColor: '#4ade80' }}>
          <b>Buy {it.name} for {money(buy.price)}?</b>
          <div className="muted" style={{ fontWeight: 700, margin: '4px 0 10px' }}>Seller: {buy.seller}. You'll have {money(me.cash - buy.price)} left.</div>
          <HoldButton className="btn good big block" onConfirm={() => { buyListing(buy.id, it.id, buy.price).then(() => { setBuy(null); load(); }).catch(() => setBuy(null)); }}>HOLD TO BUY</HoldButton>
          <button className="btn block ghost" style={{ marginTop: 6 }} onClick={() => setBuy(null)}>CANCEL</button>
        </div>
      )}
      <h3>Sell yours</h3>
      {mine.length === 0 ? (
        <div className="muted" style={{ fontWeight: 700 }}>You don't own this item.</div>
      ) : (
        <div className="col">
          <div className="row wrap">
            {mine.map((p) => (
              <button key={p.id} className={'btn small ' + (sellId === p.id ? 'primary' : '')} onClick={() => setSellId(p.id)}>
                {p.location.toUpperCase()}{p.serial ? ` #${p.serial}` : ''}
              </button>
            ))}
          </div>
          {sellId && mine.find((p) => p.id === sellId) && <ItemActions pi={mine.find((p) => p.id === sellId)!} onDone={() => { setSellId(null); load(); }} />}
        </div>
      )}
      <h3>Recent sales</h3>
      {d && d.sales.length === 0 && <div className="muted">No recent sales.</div>}
      {d && d.sales.length > 0 && (
        <table className="tbl">
          <tbody>
            {d.sales.map((s, i) => (
              <tr key={i}>
                <td className="mono">{money(s.price)}</td>
                <td className="muted">{s.kind === 'quick_sell' ? 'Quick sell' : `${s.seller ?? '?'} → ${s.buyer ?? '?'}`}</td>
                <td className="dim" style={{ textAlign: 'right' }}>{ago(s.at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
