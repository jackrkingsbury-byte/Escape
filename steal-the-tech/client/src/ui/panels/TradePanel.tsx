import { useEffect, useMemo, useState } from 'react';
import { useGame, G, toClient, price, item as catItem } from '../../game/store';
import { money, shortMoney, ago } from '../../game/format';
import { proposeTrade, respondTrade, cancelTrade } from '../../game/actions';
import { Panel, Tabs, ItemIcon, ItemCard, HoldButton, PlayerName, useNow } from '../common';
import type { BaseView, RaidTarget, Trade } from '../../backend/types';

type Tab = 'incoming' | 'outgoing' | 'new' | 'history';

export function TradePanel() {
  const arg = useGame((s) => s.panelArg) || {};
  const incoming = useGame((s) => s.last?.trades.incoming || 0);
  const [tab, setTab] = useState<Tab>(arg.tab || (incoming ? 'incoming' : 'new'));
  const [trades, setTrades] = useState<Trade[] | null>(null);
  const tick = useNow(5000);
  const reload = () => G().backend?.rpc<Trade[]>('stt_trades').then(setTrades).catch(() => setTrades([]));
  useEffect(() => {
    reload();
  }, [tick, incoming]);
  useEffect(() => {
    if (arg.tab) setTab(arg.tab);
  }, [arg.tab]);
  const inc = (trades || []).filter((t) => t.status === 'pending' && t.incoming);
  const out = (trades || []).filter((t) => t.status === 'pending' && !t.incoming);
  const hist = (trades || []).filter((t) => t.status !== 'pending');
  return (
    <Panel title="TRADE HUB" icon="🤝">
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'incoming', label: 'Incoming', badge: inc.length },
          { id: 'outgoing', label: 'Outgoing', badge: 0 },
          { id: 'new', label: 'New trade' },
          { id: 'history', label: 'History' },
        ]}
      />
      {tab === 'incoming' && (inc.length ? inc.map((t) => <TradeCard key={t.id} t={t} onDone={reload} />) : <div className="empty">No offers waiting. Show off something good and they'll come.</div>)}
      {tab === 'outgoing' && (out.length ? out.map((t) => <TradeCard key={t.id} t={t} onDone={reload} />) : <div className="empty">No open offers.</div>)}
      {tab === 'new' && <Builder initialWith={arg.with} onSent={() => { reload(); setTab('outgoing'); }} />}
      {tab === 'history' && (hist.length ? hist.map((t) => <TradeCard key={t.id} t={t} onDone={reload} />) : <div className="empty">No trades yet.</div>)}
    </Panel>
  );
}

function Side({ title, items, cash }: { title: string; items: { id: string; item_id: string; serial: number | null; available?: boolean }[]; cash: number }) {
  return (
    <div className="card tight grow" style={{ minWidth: 0 }}>
      <div className="muted" style={{ fontWeight: 900, fontSize: 12, letterSpacing: '0.1em' }}>{title}</div>
      <div className="row wrap" style={{ gap: 6, marginTop: 6 }}>
        {items.map((i) => (
          <div key={i.id} title={catItem(i.item_id)?.name} style={{ opacity: i.available === false ? 0.35 : 1, textAlign: 'center', width: 64 }}>
            <ItemIcon id={i.item_id} size={52} />
            <div style={{ fontSize: 11, fontWeight: 800, lineHeight: 1.05 }}>{catItem(i.item_id)?.name.slice(0, 18)}</div>
          </div>
        ))}
        {cash > 0 && <div className="good-t" style={{ fontWeight: 900, fontSize: 18 }}>+ {money(cash)}</div>}
        {!items.length && !cash && <div className="dim">nothing</div>}
      </div>
    </div>
  );
}

function Fairness({ give, get }: { give: number; get: number }) {
  const ratio = give + get === 0 ? 0.5 : get / (give + get);
  return (
    <div>
      <div className="row between" style={{ fontWeight: 800, fontSize: 13 }}>
        <span className="muted">You give {shortMoney(give)}</span>
        <span className={get >= give ? 'good-t' : 'bad-t'}>{get >= give ? 'In your favour' : 'Against you'}</span>
        <span className="muted">You get {shortMoney(get)}</span>
      </div>
      <div className="fair" style={{ marginTop: 6 }}>
        <i style={{ left: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

function TradeCard({ t, onDone }: { t: Trade; onDone: () => void }) {
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const me = useGame((s) => s.me)!;
  const give = t.incoming ? t.request_value : t.offer_value;
  const get = t.incoming ? t.offer_value : t.request_value;
  const other = t.incoming ? { id: t.from_id, name: t.from, bot: t.from_bot } : { id: t.to_id, name: t.to, bot: t.to_bot };
  return (
    <div className="card" style={t.status === 'pending' && t.incoming ? { borderColor: '#22d3ee' } : undefined}>
      <div className="row between">
        <div>
          {t.incoming ? 'From ' : 'To '}
          <PlayerName id={other.id} name={other.name} bot={other.bot} />
        </div>
        <span className="tag" style={{ color: t.status === 'accepted' ? '#86efac' : t.status === 'pending' ? '#67e8f9' : '#fda4af' }}>{t.status}</span>
      </div>
      {t.message && <div className="muted" style={{ fontStyle: 'italic', margin: '6px 0' }}>“{t.message}”</div>}
      <div className="row" style={{ alignItems: 'stretch', marginTop: 6 }}>
        <Side title={t.incoming ? 'THEY GIVE YOU' : 'YOU GIVE'} items={t.offer_items} cash={t.offer_cash} />
        <div style={{ alignSelf: 'center', fontSize: 22 }}>⇄</div>
        <Side title={t.incoming ? 'YOU GIVE' : 'YOU GET'} items={t.request_items} cash={t.request_cash} />
      </div>
      <div style={{ marginTop: 10 }}>
        <Fairness give={give} get={get} />
      </div>
      {t.note && <div className="muted" style={{ marginTop: 6, fontWeight: 700 }}>{t.note}</div>}
      <div className="dim" style={{ fontSize: 12, marginTop: 4 }}>{ago(t.created_at)}</div>
      {t.status === 'pending' && t.incoming && !review && (
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn grow" disabled={busy} onClick={async () => { setBusy(true); try { await respondTrade(t.id, false); onDone(); } finally { setBusy(false); } }}>DECLINE</button>
          <button className="btn good grow" disabled={busy || me.cash < t.request_cash} onClick={() => setReview(true)}>REVIEW & ACCEPT</button>
        </div>
      )}
      {review && (
        <div className="card" style={{ marginTop: 10, borderColor: '#4ade80', background: 'rgba(74,222,128,0.06)' }}>
          <b style={{ fontSize: 18 }}>FINAL CONFIRMATION</b>
          <div className="muted" style={{ fontWeight: 700, margin: '6px 0 10px' }}>
            You give {t.request_items.length} item(s){t.request_cash ? ` + ${money(t.request_cash)}` : ''} and receive {t.offer_items.length} item(s){t.offer_cash ? ` + ${money(t.offer_cash)}` : ''}. This can't be undone.
          </div>
          <HoldButton className="btn good big block" onConfirm={async () => { setBusy(true); try { await respondTrade(t.id, true); } catch { /* toast shown */ } finally { setBusy(false); setReview(false); onDone(); } }}>
            HOLD TO ACCEPT
          </HoldButton>
          <button className="btn ghost block" style={{ marginTop: 6 }} onClick={() => setReview(false)}>BACK</button>
        </div>
      )}
      {t.status === 'pending' && !t.incoming && (
        <button className="btn block" style={{ marginTop: 10 }} onClick={() => cancelTrade(t.id).then(onDone).catch(() => {})}>CANCEL OFFER</button>
      )}
    </div>
  );
}

function Builder({ initialWith, onSent }: { initialWith?: string; onSent: () => void }) {
  const me = useGame((s) => s.me)!;
  const myItems = useGame((s) => s.myItems);
  const [people, setPeople] = useState<RaidTarget[] | null>(null);
  const [partner, setPartner] = useState<string | null>(initialWith || null);
  const [base, setBase] = useState<BaseView | null>(null);
  const [give, setGive] = useState<string[]>([]);
  const [get, setGet] = useState<string[]>([]);
  const [giveCash, setGiveCash] = useState('');
  const [getCash, setGetCash] = useState('');
  const [msg, setMsg] = useState('');
  const [review, setReview] = useState(false);
  const [q, setQ] = useState('');
  useEffect(() => {
    G().backend?.rpc<RaidTarget[]>('stt_raid_targets', { sort: 'value' }).then(setPeople).catch(() => setPeople([]));
  }, []);
  useEffect(() => {
    setBase(null);
    setGet([]);
    if (partner) G().backend?.rpc<BaseView>('stt_base', { player_id: partner }).then(setBase).catch(() => {});
  }, [partner]);
  const tradeable = useMemo(
    () => myItems.filter((p) => !p.soulbound && p.location !== 'listed' && !(p.hot_until && toClient(p.hot_until) > Date.now()) && catItem(p.item_id)?.tradeable).sort((a, b) => price(b.item_id) - price(a.item_id)),
    [myItems],
  );
  const toggle = (arr: string[], set: (v: string[]) => void, id: string) => set(arr.includes(id) ? arr.filter((x) => x !== id) : arr.length >= 8 ? arr : [...arr, id]);
  const giveVal = give.reduce((a, id) => a + price(myItems.find((p) => p.id === id)?.item_id || ''), 0) + (Number(giveCash) || 0);
  const getVal = get.reduce((a, id) => a + price(base?.items.find((p) => p.id === id)?.item_id || ''), 0) + (Number(getCash) || 0);
  const valid = partner && (give.length || get.length) && (Number(giveCash) || 0) <= me.cash;

  if (!partner) {
    const list = (people || []).filter((p) => !q || p.username.toLowerCase().includes(q.toLowerCase()));
    return (
      <>
        <div className="muted" style={{ fontWeight: 700 }}>Who do you want to trade with? NPC traders answer in seconds; real players get a notification.</div>
        <input className="field" placeholder="Search players…" value={q} onChange={(e) => setQ(e.target.value)} />
        {!people ? <div className="empty">Loading…</div> : (
          <div className="list">
            {list.map((p) => (
              <div key={p.id} className="li click" onClick={() => setPartner(p.id)}>
                <div className="grow">
                  <div className="t1">{p.username} {p.is_bot && <span className="tag bot">NPC</span>} {p.online && !p.is_bot && <span className="tag online">ONLINE</span>}</div>
                  <div className="t2">Lv {p.level} · base {shortMoney(p.base_value)} · {p.shown} items on display</div>
                </div>
                <span className="btn small">CHOOSE</span>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  if (review) {
    const giveItems = give.map((id) => myItems.find((p) => p.id === id)!).filter(Boolean);
    const getItems = get.map((id) => base?.items.find((p) => p.id === id)!).filter(Boolean);
    return (
      <div className="col">
        <b style={{ fontSize: 20 }}>FINAL CONFIRMATION</b>
        <div className="muted" style={{ fontWeight: 700 }}>Sending this offer to {base?.username}. Nothing moves until they accept too — and if anything changes hands in the meantime, the trade safely fails.</div>
        <div className="row" style={{ alignItems: 'stretch' }}>
          <Side title="YOU GIVE" items={giveItems.map((p) => ({ id: p.id, item_id: p.item_id, serial: p.serial }))} cash={Number(giveCash) || 0} />
          <div style={{ alignSelf: 'center', fontSize: 22 }}>⇄</div>
          <Side title="YOU GET" items={getItems.map((p) => ({ id: p.id, item_id: p.item_id, serial: p.serial }))} cash={Number(getCash) || 0} />
        </div>
        <Fairness give={giveVal} get={getVal} />
        <HoldButton
          className="btn primary big block"
          onConfirm={() =>
            proposeTrade({ to: partner, offer_items: give, offer_cash: Number(giveCash) || 0, request_items: get, request_cash: Number(getCash) || 0, message: msg })
              .then(() => { setGive([]); setGet([]); setGiveCash(''); setGetCash(''); setReview(false); onSent(); })
              .catch(() => setReview(false))
          }
        >
          HOLD TO SEND OFFER
        </HoldButton>
        <button className="btn block" onClick={() => setReview(false)}>EDIT</button>
      </div>
    );
  }

  return (
    <div className="col">
      <div className="row between">
        <b>Trading with {base?.username ?? '…'} {base?.is_bot && <span className="tag bot">NPC</span>}</b>
        <button className="btn small ghost" onClick={() => setPartner(null)}>CHANGE</button>
      </div>
      <h3>You offer</h3>
      {tradeable.length === 0 ? <div className="muted">You have nothing tradeable yet.</div> : (
        <div className="grid items">
          {tradeable.map((p) => <ItemCard key={p.id} id={p.item_id} serial={p.serial} selected={give.includes(p.id)} onClick={() => toggle(give, setGive, p.id)} showIncome={false} badge={p.location === 'vault' ? <span className="tag">🔒</span> : null} />)}
        </div>
      )}
      <input className="field" inputMode="numeric" placeholder={`+ cash (you have ${money(me.cash)})`} value={giveCash} onChange={(e) => setGiveCash(e.target.value.replace(/[^0-9]/g, ''))} />
      <h3>You request</h3>
      {!base ? <div className="empty">Loading their base…</div> : base.items.filter((p) => !p.soulbound).length === 0 ? <div className="muted">They have nothing on display to trade.</div> : (
        <div className="grid items">
          {base.items.filter((p) => !p.soulbound).map((p) => <ItemCard key={p.id} id={p.item_id} serial={p.serial} selected={get.includes(p.id)} onClick={() => toggle(get, setGet, p.id)} showIncome={false} />)}
        </div>
      )}
      <input className="field" inputMode="numeric" placeholder="+ cash you want from them" value={getCash} onChange={(e) => setGetCash(e.target.value.replace(/[^0-9]/g, ''))} />
      <textarea className="field" maxLength={140} placeholder="Message (optional)" value={msg} onChange={(e) => setMsg(e.target.value)} />
      <Fairness give={giveVal} get={getVal} />
      <button className="btn primary big block" disabled={!valid} onClick={() => setReview(true)}>REVIEW OFFER</button>
    </div>
  );
}
