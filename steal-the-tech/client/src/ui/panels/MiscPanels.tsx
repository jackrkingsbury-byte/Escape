import { useEffect, useState } from 'react';
import { useGame, G, setG, toClient, openPanel, updateSettings, toast } from '../../game/store';
import { EMPTY } from '../../game/store';
import { money, duration, ago } from '../../game/format';
import { claimQuest, claimDaily } from '../../game/actions';
import { feedLine, signOutToTitle, syncNow } from '../../game/session';
import { setMusic, setMuted, setVolume, play } from '../../game/sound';
import { Panel, Tabs, ItemIcon, useNow } from '../common';
import { confirmAction } from '../overlays';
import { engine } from '../../world/engine';
import type { Quest } from '../../backend/types';

const DAILY = [
  { d: 1, icon: '💵', label: 'Cash' },
  { d: 2, icon: '📦', label: '2× Basic Drop' },
  { d: 3, icon: '💵', label: 'Cash' },
  { d: 4, icon: '💠', label: 'Rare item' },
  { d: 5, icon: '🎁', label: 'Premium Drop' },
  { d: 6, icon: '💰', label: 'Big cash' },
  { d: 7, icon: '🌟', label: 'Event item + Secret Key' },
];

export function QuestsPanel() {
  const me = useGame((s) => s.me)!;
  const [quests, setQuests] = useState<Quest[] | null>(null);
  const [tab, setTab] = useState<'daily' | 'weekly'>('daily');
  const tick = useNow(4000);
  const [claimed, setClaimed] = useState<any>(null);
  const load = () => G().backend?.rpc<{ quests: Quest[] }>('stt_quests').then((r) => setQuests(r.quests)).catch(() => {});
  useEffect(() => {
    load();
  }, [tick]);
  const daily = me.daily;
  const list = (quests || []).filter((q) => q.period === tab);
  return (
    <Panel title="MISSIONS" icon="🎯">
      <div className="card" style={{ borderColor: daily.can_claim ? '#facc15' : undefined }}>
        <div className="row between">
          <b style={{ fontSize: 18 }}>📅 DAILY REWARD · streak {daily.streak}</b>
          {!daily.can_claim && <span className="muted">next in {duration(toClient(daily.resets_at) - Date.now())}</span>}
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginTop: 10 }}>
          {DAILY.map((x) => {
            const isNext = x.d === daily.next_day && daily.can_claim;
            const done = daily.can_claim ? x.d < daily.next_day : x.d <= (((daily.streak - 1) % 7) + 1) && daily.streak > 0;
            return (
              <div key={x.d} className="stat center" style={{ padding: 6, borderColor: isNext ? '#facc15' : undefined, background: done ? 'rgba(74,222,128,0.12)' : undefined }}>
                <div className="k">DAY {x.d}</div>
                <div style={{ fontSize: 24 }}>{done ? '✅' : x.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 800, lineHeight: 1.1 }}>{x.label}</div>
              </div>
            );
          })}
        </div>
        <button
          className="btn gold big block"
          style={{ marginTop: 10 }}
          disabled={!daily.can_claim}
          data-testid="claim-daily"
          onClick={() =>
            claimDaily()
              .then((r) => setClaimed(r))
              .catch(() => {})
          }
        >
          {daily.can_claim ? `CLAIM DAY ${daily.next_day}` : 'CLAIMED — COME BACK TOMORROW'}
        </button>
        {claimed && (
          <div className="row" style={{ marginTop: 8, fontWeight: 800 }}>
            {claimed.item_id && <ItemIcon id={claimed.item_id} size={48} />}
            <span>
              Day {claimed.day}: {claimed.cash ? money(claimed.cash) : ''} {claimed.count ? `${claimed.count}× ${claimed.drop} drop` : ''} {claimed.item_id ? 'a new item!' : ''} {claimed.secret_keys ? '+ 1 Secret Key 🗝️' : ''}
            </span>
          </div>
        )}
        <div className="dim" style={{ fontSize: 12, marginTop: 6 }}>Miss a day and the streak restarts at Day 1.</div>
      </div>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'daily', label: 'Daily' }, { id: 'weekly', label: 'Weekly' }]} />
      {!quests ? (
        <div className="empty">Loading…</div>
      ) : (
        <>
          {list[0] && <div className="muted" style={{ fontWeight: 700 }}>Resets in {duration(toClient(list[0].resets_at) - Date.now())}</div>}
          <div className="list">
            {list.map((q) => {
              const done = q.progress >= q.target;
              const r = q.reward;
              return (
                <div key={q.id} className="li" style={{ flexWrap: 'wrap' }}>
                  <div className="grow" style={{ minWidth: 180 }}>
                    <div className="t1">{q.claimed ? '✅ ' : ''}{q.title}</div>
                    <div className="t2">
                      Reward: {r.cash ? `${money(r.cash)}+` : ''} {r.xp ? `${r.xp} XP` : ''} {r.tokens ? Object.entries(r.tokens).map(([k, v]) => `${v}× ${k} drop`).join(', ') : ''} {r.secret_keys ? '🗝️ Secret Key' : ''} {r.cosmetic ? '🎨 cosmetic' : ''}
                    </div>
                    <div className="bar good" style={{ marginTop: 6 }}><i style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }} /></div>
                    <div className="dim" style={{ fontSize: 12, fontWeight: 800 }}>{q.metric === 'earn_cash' ? `${money(q.progress)} / ${money(q.target)}` : `${q.progress} / ${q.target}`}</div>
                  </div>
                  <button className="btn good" disabled={!done || q.claimed} onClick={() => claimQuest(q.id).then(load).catch(() => {})}>
                    {q.claimed ? 'DONE' : done ? 'CLAIM' : 'IN PROGRESS'}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Panel>
  );
}

export function EventPanel() {
  const ev = useGame((s) => s.last?.event);
  const next = useGame((s) => s.last?.next_event_at);
  const types = useGame((s) => s.catalog?.event_types ?? EMPTY);
  useNow(1000);
  return (
    <Panel title="EVENT STAGE" icon="🎪">
      {ev ? (
        <div className="card" style={{ borderColor: '#fb923c', background: 'rgba(251,146,60,0.08)' }}>
          <div style={{ fontSize: 44 }}>{ev.icon}</div>
          <div className="display" style={{ fontSize: 26, fontWeight: 900 }}>{ev.title}</div>
          <div className="muted" style={{ fontWeight: 700, margin: '6px 0' }}>{ev.description}</div>
          <div className="row wrap" style={{ fontWeight: 800 }}>
            {ev.category && <span className="tag">Category: {ev.category}</span>}
            {ev.price_mult !== 1 && <span className="tag">Prices ×{ev.price_mult}</span>}
            {ev.income_mult !== 1 && <span className="tag">Income ×{ev.income_mult}</span>}
            {ev.luck_mult !== 1 && <span className="tag">Mythic+ luck ×{ev.luck_mult}</span>}
          </div>
          <div className="display" style={{ fontSize: 22, marginTop: 10 }}>{duration(toClient(ev.ends_at) - Date.now())} left</div>
          <button className="btn primary big block" style={{ marginTop: 10 }} onClick={() => openPanel('drops')}>🎁 OPEN EVENT DROPS</button>
        </div>
      ) : (
        <div className="card center">
          <div className="muted display" style={{ letterSpacing: '0.2em' }}>NEXT EVENT IN</div>
          <div className="display" style={{ fontSize: 40, fontWeight: 900 }}>{next ? duration(toClient(next) - Date.now()) : '—'}</div>
          <div className="muted" style={{ fontWeight: 700 }}>Events rotate all day. Each one shakes up the market.</div>
        </div>
      )}
      <h3>Possible events</h3>
      <div className="list">
        {types.map((t) => (
          <div key={t.id} className="li">
            <div style={{ fontSize: 28 }}>{t.icon}</div>
            <div className="grow">
              <div className="t1">{t.title}</div>
              <div className="t2">{t.description}</div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function FeedPanel() {
  const feed = useGame((s) => s.feed);
  const [tab, setTab] = useState<'all' | 'me'>('all');
  const me = useGame((s) => s.me)!;
  const rows = [...feed].reverse().filter((e) => (tab === 'me' ? e.target_id === me.id : true));
  return (
    <Panel title="LIVE FEED" icon="🔔">
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'all', label: 'Everything' }, { id: 'me', label: 'For me' }]} />
      {rows.length === 0 ? (
        <div className="empty">Quiet… for now.</div>
      ) : (
        <div className="list">
          {rows.map((e) => {
            const l = feedLine(e);
            if (!l) return null;
            const itemId = e.payload?.item_id;
            return (
              <div key={e.id} className="li">
                {itemId ? <ItemIcon id={itemId} size={36} /> : <span style={{ fontSize: 24 }}>{l.icon}</span>}
                <div className="grow">
                  <div className="t1" style={{ fontSize: 15 }}>{l.icon} {l.text}</div>
                  <div className="t2">{ago(e.created_at, Date.now() + G().serverOffset)}</div>
                </div>
                {e.kind === 'item_stolen' && e.target_id === me.id && (
                  <button className="btn small hot" onClick={() => openPanel('visit', { playerId: e.payload.attacker_id, revenge: true })}>REVENGE</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

export function SettingsPanel() {
  const s = useGame((x) => x.settings);
  const backend = useGame((x) => x.backend);
  const me = useGame((x) => x.me);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  return (
    <Panel title="SETTINGS" icon="⚙️">
      <div className="card col">
        <b>🔊 Sound</b>
        <div className="row">
          <span className="muted" style={{ width: 80 }}>Volume</span>
          <input type="range" min={0} max={1} step={0.05} value={s.volume} onChange={(e) => { const v = Number(e.target.value); updateSettings({ volume: v }); setVolume(v); }} onPointerUp={() => play('coin')} />
        </div>
        <label className="row"><input type="checkbox" checked={s.muted} onChange={(e) => { updateSettings({ muted: e.target.checked }); setMuted(e.target.checked); }} /> Mute everything</label>
        <label className="row"><input type="checkbox" checked={s.music} onChange={(e) => { updateSettings({ music: e.target.checked }); setMusic(e.target.checked); }} /> Ambient music</label>
      </div>
      <div className="card col">
        <b>🎨 Graphics</b>
        <div className="row wrap">
          {(['high', 'low'] as const).map((q) => (
            <button key={q} className={'btn small ' + (s.quality === q ? 'primary' : '')} onClick={() => { updateSettings({ quality: q }); window.dispatchEvent(new Event('resize')); }}>{q === 'high' ? 'High (glow, particles)' : 'Battery saver'}</button>
          ))}
        </div>
        <label className="row"><input type="checkbox" checked={s.reduceMotion} onChange={(e) => updateSettings({ reduceMotion: e.target.checked })} /> Reduce motion & screen shake</label>
        <label className="row"><input type="checkbox" checked={s.showNames} onChange={(e) => updateSettings({ showNames: e.target.checked })} /> Show player names</label>
      </div>
      <div className="card col">
        <b>🎮 Controls</b>
        <div className="muted" style={{ fontWeight: 700, lineHeight: 1.5 }}>
          Desktop: <b>WASD / arrows</b> to walk, <b>click</b> the ground to walk there, <b>click</b> buildings or items, <b>E</b> to enter, <b>scroll</b> to zoom.<br />
          Mobile: drag anywhere on the <b>left side</b> for the joystick, <b>tap</b> to walk / pick items, big button to enter.
        </div>
        <div className="row wrap">
          <button className="btn small" onClick={() => { engine?.travelHome(); openPanel(null); }}>🏠 Teleport home</button>
          <button className="btn small" onClick={() => { setG({ tutorialOpen: true }); openPanel(null); }}>🎓 Replay tutorial</button>
        </div>
      </div>
      <div className="card col">
        <b>👤 Account</b>
        <div className="muted" style={{ fontWeight: 700 }}>
          Mode: <b>{backend?.mode === 'online' ? 'ONLINE (shared server)' : 'OFFLINE PRACTICE'}</b>
          {backend?.mode === 'offline' && ' — your progress is saved on this device. Other players you see are NPCs simulated locally.'}
        </div>
        {backend?.mode === 'online' && backend.isGuest() && backend.upgradeGuest && (
          <div className="col">
            <div className="muted" style={{ fontWeight: 700 }}>You're playing as a guest. Save your account to keep it on any device:</div>
            <input className="field" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="field" type="password" placeholder="password (6+ chars)" value={pw} onChange={(e) => setPw(e.target.value)} />
            <button className="btn primary" onClick={() => backend.upgradeGuest!(email, pw).then(() => toast({ kind: 'good', icon: '✅', title: 'Account saved — check your inbox to confirm.' })).catch((e) => toast({ kind: 'bad', icon: '⛔', title: e.message }))}>SAVE ACCOUNT</button>
          </div>
        )}
        {backend?.mode === 'online' && !backend.isGuest() && <div className="muted">Signed in as {backend.email()}</div>}
        <div className="row wrap">
          <button className="btn small" onClick={() => syncNow()}>🔄 Resync</button>
          <button className="btn small" onClick={() => signOutToTitle()}>{backend?.mode === 'online' ? 'Sign out' : 'Back to title'}</button>
          {backend?.mode === 'offline' && backend.reset && (
            <button
              className="btn small hot"
              onClick={() =>
                confirmAction({
                  title: 'Delete offline save?',
                  body: `This permanently deletes ${me?.username}'s offline progress on this device.`,
                  confirmLabel: 'DELETE',
                  danger: true,
                  hold: true,
                  onConfirm: async () => {
                    await backend.reset!();
                    location.reload();
                  },
                })
              }
            >
              🗑️ Reset offline save
            </button>
          )}
        </div>
      </div>
      <div className="card">
        <b>🛡️ Fair play & economy</b>
        <div className="muted" style={{ fontWeight: 700, lineHeight: 1.45 }}>
          Everything uses fictional in-game cash. There is no real-money purchasing, trading, betting, deposits, withdrawals or crypto. Drops are funded only by cash you earn in the game, and every drop shows its odds. All money, items, trades, raids and market sales are decided and recorded by the server.
        </div>
      </div>
      <div className="dim center" style={{ fontSize: 12 }}>STEAL THE TECH · all brands, items and art are fictional and drawn in code.</div>
    </Panel>
  );
}
