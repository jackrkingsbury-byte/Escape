import { useEffect, useState } from 'react';
import { useGame, G, openPanel, toClient, setG, item as catItem, price } from '../../game/store';
import { money, shortMoney, duration, ago, perSec } from '../../game/format';
import { startSteal, visit } from '../../game/actions';
import { Panel, Tabs, ItemIcon, RarityLabel, ItemCard, PlayerName, useNow, Stat } from '../common';
import type { BaseView, RaidTarget, Rarity } from '../../backend/types';

type Tab = 'targets' | 'revenge' | 'history';

export function RaidPanel() {
  const revengeCount = useGame((s) => s.last?.revenge || 0);
  const [tab, setTab] = useState<Tab>(revengeCount ? 'revenge' : 'targets');
  const me = useGame((s) => s.me)!;
  const now = useNow(1000);
  const cd = me.raid_cooldown_until ? toClient(me.raid_cooldown_until) - now : 0;
  return (
    <Panel title="RAID BOARD" icon="🥷">
      <div className="card tight" style={{ background: 'rgba(244,63,94,0.08)' }}>
        <b>Pick a target. Is the reward worth the risk?</b>
        <div className="muted" style={{ fontWeight: 700 }}>
          Higher security = lower odds and longer steals. Owners get warned and can sound the alarm or vault the item. Fail and you pay a small fine and lay low.
        </div>
        {cd > 0 && <div className="bad-t" style={{ fontWeight: 900, marginTop: 4 }}>⏳ Laying low — next raid in {duration(cd)}</div>}
      </div>
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ id: 'targets', label: 'Targets' }, { id: 'revenge', label: 'Revenge', badge: revengeCount }, { id: 'history', label: 'History' }]} />
      {tab === 'targets' && <Targets />}
      {tab === 'revenge' && <Revenge />}
      {tab === 'history' && <History />}
    </Panel>
  );
}

function Targets() {
  const [sort, setSort] = useState<'recommended' | 'value' | 'security'>('recommended');
  const [rows, setRows] = useState<RaidTarget[] | null>(null);
  const now = useNow(5000);
  useEffect(() => {
    G().backend?.rpc<RaidTarget[]>('stt_raid_targets', { sort }).then(setRows).catch(() => setRows([]));
  }, [sort, now]);
  return (
    <>
      <div className="row wrap">
        {(['recommended', 'value', 'security'] as const).map((s) => (
          <button key={s} className={'btn small ' + (sort === s ? 'primary' : '')} onClick={() => setSort(s)}>
            {s === 'recommended' ? 'Near my level' : s === 'value' ? 'Richest bases' : 'Weakest security'}
          </button>
        ))}
      </div>
      {!rows ? (
        <div className="empty">Scouting targets…</div>
      ) : (
        <div className="list">
          {rows.map((t) => {
            const shielded = t.shield_until && toClient(t.shield_until) > Date.now();
            const blocked = t.protected || (shielded && !t.revenge) || t.shown === 0;
            return (
              <div key={t.id} className="li" style={t.revenge ? { borderColor: '#f43f5e' } : undefined}>
                <div className="grow">
                  <div className="t1">
                    <PlayerName id={t.id} name={t.username} bot={t.is_bot} level={t.level} />
                    {t.online && !t.is_bot && <span className="tag online" style={{ marginLeft: 6 }}>ONLINE</span>}
                    {t.revenge && <span className="tag" style={{ marginLeft: 6, color: '#fda4af' }}>⚔️ REVENGE</span>}
                  </div>
                  <div className="t2">
                    Base <b className="good-t">{shortMoney(t.base_value)}</b> · Security <b>L{t.security_level}</b> {t.security_name}
                  </div>
                  {t.top_item && (
                    <div className="t2 row" style={{ gap: 6 }}>
                      <ItemIcon id={t.top_item.item_id} size={26} /> Top item: {catItem(t.top_item.item_id)?.name} ({shortMoney(t.top_item.price)})
                    </div>
                  )}
                  {t.protected && <div className="t2">🐣 New-player protection</div>}
                  {shielded && <div className="t2">🛡️ Shielded {duration(toClient(t.shield_until!) - Date.now())}{t.revenge ? ' (revenge ignores it)' : ''}</div>}
                </div>
                <button className="btn hot" disabled={!!blocked} onClick={() => visit(t.id, t.revenge)}>RAID</button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function Revenge() {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => {
    G().backend?.rpc<any[]>('stt_revenge').then(setRows).catch(() => setRows([]));
  }, []);
  if (!rows) return <div className="empty">Loading…</div>;
  if (!rows.length) return <div className="empty">Nobody has robbed you in the last 24 hours. Keep it that way — upgrade security!</div>;
  return (
    <div className="list">
      {rows.map((r) => (
        <div key={r.raid_id} className="li" style={{ borderColor: '#f43f5e' }}>
          <ItemIcon id={r.item_id} size={48} />
          <div className="grow">
            <div className="t1">🚨 {r.attacker}{r.attacker_bot ? ' 🤖' : ''} stole your {catItem(r.item_id)?.name}</div>
            <div className="t2">
              {ago(r.resolved_at)} · {r.on_display ? 'It\'s on display in their base!' : r.still_theirs ? 'They\'re hiding it in storage.' : 'They got rid of it.'} · revenge expires in {duration(toClient(r.expires_at) - Date.now())}
            </div>
          </div>
          <button className="btn hot" onClick={() => visit(r.attacker_id, true)}>REVENGE</button>
        </div>
      ))}
    </div>
  );
}

function History() {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => {
    G().backend?.rpc<any>('stt_activity').then((a) => setRows(a.raids)).catch(() => setRows([]));
  }, []);
  if (!rows) return <div className="empty">Loading…</div>;
  if (!rows.length) return <div className="empty">No raids yet.</div>;
  return (
    <div className="list">
      {rows.map((r) => (
        <div key={r.id} className="li">
          <ItemIcon id={r.item_id} size={40} />
          <div className="grow">
            <div className="t1">
              {r.mine ? `You → ${r.defender}` : `${r.attacker} → you`}{' '}
              <span className={r.status === 'success' ? (r.mine ? 'good-t' : 'bad-t') : r.mine ? 'bad-t' : 'good-t'}>
                {r.status === 'success' ? 'STOLEN' : r.status === 'active' ? 'IN PROGRESS' : r.status === 'blocked' ? 'BLOCKED' : 'FAILED'}
              </span>
            </div>
            <div className="t2">{catItem(r.item_id)?.name} · {ago(r.at)}{r.fine ? ` · fine ${money(r.fine)}` : ''}{r.defended ? ' · alarm' : ''}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function VisitPanel() {
  const arg = useGame((s) => s.panelArg) || {};
  const me = useGame((s) => s.me)!;
  const steal = useGame((s) => s.steal);
  const [b, setB] = useState<BaseView | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const now = useNow(4000);
  const playerId: string | undefined = arg.playerId;
  useEffect(() => {
    if (!playerId) return;
    if (playerId === me.id) {
      openPanel('base');
      return;
    }
    G().backend?.rpc<BaseView>('stt_base', { player_id: playerId }).then(setB).catch((e) => setErr(String(e.message)));
  }, [playerId, now, steal?.result]);
  useEffect(() => {
    if (playerId) setG({ focusPlot: playerId });
  }, [playerId]);
  if (!playerId) return null;
  if (err) return <Panel title="BASE" icon="🥷"><div className="empty">{err}</div></Panel>;
  if (!b) return <Panel title="VISITING…" icon="🥷"><div className="empty">Walking over…</div></Panel>;
  const shielded = b.shield_until && toClient(b.shield_until) > Date.now();
  const revenge = !!arg.revenge || b.revenge_available;
  const busy = !!steal && !steal.result;
  const cd = me.raid_cooldown_until ? toClient(me.raid_cooldown_until) - Date.now() : 0;
  return (
    <Panel title={`${b.username.toUpperCase()}'S BASE`} icon={b.is_bot ? '🤖' : '🥷'}>
      <div className="row wrap">
        <PlayerName id={b.id} name={b.username} bot={b.is_bot} level={b.level} />
        {b.online && !b.is_bot && <span className="tag online">ONLINE — they'll see you coming</span>}
        {b.prestige > 0 && <span className="tag">P{b.prestige}</span>}
      </div>
      {b.bio && <div className="muted" style={{ fontStyle: 'italic' }}>“{b.bio}”</div>}
      <div className="stats">
        <Stat k="Base value" v={shortMoney(b.base_value)} cls="good-t" />
        <Stat k="Income" v={perSec(b.income)} />
        <Stat k="Security" v={`L${b.security_level}`} />
        <Stat k="Vault" v={`${b.vault_used} locked`} />
      </div>
      <div className="card tight">
        <b>🔐 {b.security_name}</b>
        <div className="muted" style={{ fontWeight: 700 }}>
          {b.raid_block ? `⛔ ${b.raid_block}` : revenge ? '⚔️ REVENGE: +15% odds, faster steals, ignores shields.' : shielded ? '🛡️ Shielded.' : 'Open for business. Choose wisely.'}
        </div>
        {cd > 0 && <div className="bad-t" style={{ fontWeight: 800 }}>⏳ You're laying low for {duration(cd)}.</div>}
      </div>
      <div className="row wrap">
        <button className="btn small grow" onClick={() => openPanel('trade', { tab: 'new', with: b.id })}>🤝 TRADE</button>
        <button className="btn small grow" onClick={() => openPanel('profile', { playerId: b.id })}>👤 PROFILE</button>
        <button className="btn small grow" onClick={() => openPanel('collection', { playerId: b.id })}>🎒 COLLECTION</button>
      </div>
      <h3>On display ({b.items.length}/{b.slots})</h3>
      {b.items.length === 0 ? (
        <div className="empty">Nothing on display. Smart… or broke.</div>
      ) : (
        <div className="grid items">
          {[...b.items].sort((x, y) => price(y.item_id) - price(x.item_id)).map((pi) => {
            const it = catItem(pi.item_id);
            if (!it) return null;
            const disabled = pi.soulbound || pi.under_raid || !!b.raid_block || busy || cd > 0;
            return (
              <ItemCard
                key={pi.id}
                id={pi.item_id}
                serial={pi.serial}
                badge={pi.under_raid ? <span className="tag">🚨 BEING STOLEN</span> : pi.soulbound ? <span className="tag">★ SAFE</span> : null}
                footer={
                  !pi.soulbound && (
                    <div className="col" style={{ gap: 4, marginTop: 6, position: 'relative', zIndex: 2 }}>
                      <div className="muted" style={{ fontSize: 12, fontWeight: 800 }}>
                        {Math.round((pi.chance ?? 0) * 100)}% · {pi.seconds}s
                      </div>
                      <button
                        className="btn hot small block"
                        disabled={disabled}
                        data-testid="steal"
                        onClick={(e) => {
                          e.stopPropagation();
                          startSteal(pi.id, revenge).catch(() => {});
                        }}
                      >
                        🥷 STEAL
                      </button>
                    </div>
                  )
                }
              />
            );
          })}
        </div>
      )}
      <div className="dim" style={{ fontSize: 13 }}>Odds shown are before the owner reacts. An alarm cuts them by 70%.</div>
    </Panel>
  );
}

export function RarityDot({ r }: { r: Rarity }) {
  return <RarityLabel r={r} />;
}
