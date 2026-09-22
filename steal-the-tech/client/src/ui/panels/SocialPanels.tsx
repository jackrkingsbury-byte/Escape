import { useEffect, useState } from 'react';
import { useGame, G, openPanel, toClient } from '../../game/store';
import { EMPTY } from '../../game/store';
import { money, shortMoney, perSec, ago, hashHue, duration } from '../../game/format';
import { visit, buyCosmetic, equip, prestige } from '../../game/actions';
import { Panel, Tabs, ItemCard, Stat, useNow } from '../common';
import { confirmAction } from '../overlays';
import type { LeaderRow, Profile } from '../../backend/types';

const BOARDS = [
  { id: 'richest', label: '💵 Richest', fmt: (v: number) => money(v) },
  { id: 'base_value', label: '🏠 Base value', fmt: (v: number) => money(v) },
  { id: 'items', label: '📦 Most items', fmt: (v: number) => v + ' items' },
  { id: 'secrets', label: '🕳️ Secrets', fmt: (v: number) => v + ' secret' + (v === 1 ? '' : 's') },
  { id: 'raids', label: '🥷 Raids won', fmt: (v: number) => v + ' steals' },
  { id: 'trades', label: '🤝 Trades', fmt: (v: number) => v + ' trades' },
  { id: 'level', label: '⭐ Level', fmt: (_: number, r: LeaderRow) => `Lv ${r.level}${r.prestige ? ` · P${r.prestige}` : ''}` },
  { id: 'collection', label: '🎒 Collection', fmt: (v: number) => v + ' found' },
] as const;

export function LeaderboardPanel() {
  const [kind, setKind] = useState<(typeof BOARDS)[number]['id']>('base_value');
  const [data, setData] = useState<{ rows: LeaderRow[]; me: LeaderRow | null } | null>(null);
  const tick = useNow(15000);
  useEffect(() => {
    G().backend?.rpc('stt_leaderboard', { kind }).then(setData).catch(() => {});
  }, [kind, tick]);
  const b = BOARDS.find((x) => x.id === kind)!;
  return (
    <Panel title="LEADERBOARDS" icon="🏆">
      <Tabs value={kind} onChange={setKind} tabs={BOARDS.map((x) => ({ id: x.id, label: x.label }))} />
      {!data ? (
        <div className="empty">Loading…</div>
      ) : (
        <>
          {data.me && (
            <div className="li me">
              <div className="rank">#{data.me.rank}</div>
              <div className="grow"><div className="t1">You</div></div>
              <b className="mono">{b.fmt(Number(data.me.score), data.me)}</b>
            </div>
          )}
          <div className="list">
            {data.rows.map((r) => (
              <div key={r.id} className={'li click' + (r.me ? ' me' : '')} onClick={() => openPanel('profile', { playerId: r.id })}>
                <div className={'rank r' + r.rank}>{r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}</div>
                <div className="avatar-dot" style={{ width: 34, height: 34, fontSize: 15, background: `hsl(${hashHue(r.id)},70%,55%)` }}>{r.username[0]}</div>
                <div className="grow">
                  <div className="t1">{r.username} {r.is_bot && <span className="tag bot">NPC</span>}</div>
                  <div className="t2">Lv {r.level}{r.prestige ? ` · Prestige ${r.prestige}` : ''}</div>
                </div>
                <b className="mono">{b.fmt(Number(r.score), r)}</b>
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}

type PTab = 'profile' | 'achievements' | 'style' | 'prestige' | 'activity';

export function ProfilePanel() {
  const arg = useGame((s) => s.panelArg) || {};
  const me = useGame((s) => s.me)!;
  const playerId: string = arg.playerId || me.id;
  const isMe = playerId === me.id;
  const [tab, setTab] = useState<PTab>('profile');
  const [p, setP] = useState<Profile | null>(null);
  const tick = useNow(10000);
  useEffect(() => {
    G().backend?.rpc<Profile>('stt_profile', isMe ? {} : { player_id: playerId }).then(setP).catch(() => {});
  }, [playerId, tick, me.level, me.owned_cosmetics.length]);
  useEffect(() => setTab('profile'), [playerId]);
  if (!p) return <Panel title="PROFILE" icon="👤"><div className="empty">Loading…</div></Panel>;
  const tabs: { id: PTab; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'achievements', label: 'Achievements' },
    ...(isMe ? ([{ id: 'style', label: 'Cosmetics' }, { id: 'prestige', label: 'Prestige' }, { id: 'activity', label: 'Activity' }] as const) : []),
  ];
  return (
    <Panel title={isMe ? 'MY PROFILE' : 'PLAYER'} icon="👤">
      <div className="row">
        <div className="avatar-dot" style={{ width: 64, height: 64, fontSize: 28, background: `hsl(${hashHue(p.id)},70%,55%)` }}>
          {p.username[0].toUpperCase()}
          <span className="lvl">{p.level}</span>
        </div>
        <div className="grow">
          <div style={{ fontWeight: 900, fontSize: 24, lineHeight: 1.1 }}>{p.username} {p.is_bot && <span className="tag bot">NPC</span>}</div>
          <div className="muted" style={{ fontWeight: 800 }}>{p.title} · Level {p.level}{p.prestige ? ` · ✨ Prestige ${p.prestige}` : ''}</div>
          <div className="row" style={{ gap: 6, marginTop: 4 }}>
            {p.online && <span className="tag online">ONLINE</span>}
            {p.protected && <span className="tag">🐣 PROTECTED</span>}
            {p.shield_until && toClient(p.shield_until) > Date.now() && <span className="tag">🛡️ SHIELDED</span>}
          </div>
        </div>
      </div>
      {p.bio && <div className="muted" style={{ fontStyle: 'italic' }}>“{p.bio}”</div>}
      {!isMe && (
        <div className="row wrap">
          <button className="btn grow" onClick={() => visit(p.id)}>🏠 VISIT BASE</button>
          <button className="btn grow" onClick={() => openPanel('trade', { tab: 'new', with: p.id })}>🤝 TRADE</button>
          <button className="btn hot grow" onClick={() => visit(p.id)}>🥷 RAID</button>
          <button className="btn grow" onClick={() => openPanel('collection', { playerId: p.id })}>🎒 COLLECTION</button>
        </div>
      )}
      <Tabs value={tab} onChange={setTab} tabs={tabs} />
      {tab === 'profile' && <ProfileMain p={p} />}
      {tab === 'achievements' && <Achievements p={p} />}
      {tab === 'style' && isMe && <Cosmetics />}
      {tab === 'prestige' && isMe && <Prestige />}
      {tab === 'activity' && isMe && <Activity />}
    </Panel>
  );
}

function ProfileMain({ p }: { p: Profile }) {
  return (
    <>
      <div className="stats">
        <Stat k="Base value" v={shortMoney(p.base_value)} cls="good-t" />
        <Stat k="Income" v={perSec(p.income)} />
        <Stat k="Collection" v={`${Math.round((p.collection / Math.max(1, p.collection_total)) * 100)}%`} />
        <Stat k="Legendary+" v={p.rare_items} />
        <Stat k="Secrets" v={p.secrets.length} />
        <Stat k="Steals" v={p.stats.steals_won ?? 0} />
        <Stat k="Defended" v={p.stats.raids_defended ?? 0} />
        <Stat k="Trades" v={p.stats.trades_done ?? 0} />
        <Stat k="Drops opened" v={p.stats.drops_opened ?? 0} />
        <Stat k="Base / Security" v={`L${p.base_level} / L${p.security_level}`} />
      </div>
      {p.secrets.length > 0 && (
        <>
          <h3>🕳️ Secret items</h3>
          <div className="grid items">{p.secrets.map((s, i) => <ItemCard key={i} id={s.item_id} serial={s.serial} />)}</div>
        </>
      )}
      <h3>Showcase</h3>
      {p.showcase.length === 0 ? <div className="muted">Nothing on display.</div> : <div className="grid items">{p.showcase.map((s, i) => <ItemCard key={i} id={s.item_id} serial={s.serial} />)}</div>}
      <h3>Recent achievements</h3>
      {p.achievements.length === 0 ? <div className="muted">None yet.</div> : (
        <div className="row wrap">
          {p.achievements.slice(0, 8).map((a) => (
            <span key={a.id} className="tag" style={{ fontSize: 13, padding: '4px 10px' }}>{a.icon} {a.title}</span>
          ))}
        </div>
      )}
      <div className="dim" style={{ fontSize: 13 }}>Joined {ago(p.created_at)}</div>
    </>
  );
}

function Achievements({ p }: { p: Profile }) {
  const defs = useGame((s) => s.catalog?.achievements ?? EMPTY);
  const got = new Map(p.achievements.map((a) => [a.id, a]));
  return (
    <>
      <div className="muted" style={{ fontWeight: 700 }}>{got.size}/{defs.length} unlocked</div>
      <div className="list">
        {defs.map((a) => {
          const g = got.get(a.id);
          return (
            <div key={a.id} className="li" style={{ opacity: g ? 1 : 0.5 }}>
              <div style={{ fontSize: 28, filter: g ? 'none' : 'grayscale(1)' }}>{a.icon}</div>
              <div className="grow">
                <div className="t1">{a.title}</div>
                <div className="t2">{a.description}{a.reward_cash ? ` · ${money(a.reward_cash)}` : ''}{a.xp ? ` · ${a.xp} XP` : ''}</div>
              </div>
              {g ? <span className="tag online">✓ {ago(g.unlocked_at)}</span> : <span className="tag">LOCKED</span>}
            </div>
          );
        })}
      </div>
    </>
  );
}

const SLOTS: { id: string; label: string }[] = [
  { id: 'theme', label: 'Base theme' },
  { id: 'floor', label: 'Floor' },
  { id: 'lighting', label: 'Lighting' },
  { id: 'platform', label: 'Display platforms' },
  { id: 'item_fx', label: 'Item animation' },
  { id: 'trail', label: 'Player trail' },
  { id: 'nameplate', label: 'Nameplate' },
  { id: 'emote', label: 'Emotes' },
  { id: 'wall', label: 'Walls' },
];

function Cosmetics() {
  const me = useGame((s) => s.me)!;
  const cos = useGame((s) => s.catalog?.cosmetics ?? EMPTY);
  return (
    <>
      <div className="muted" style={{ fontWeight: 700 }}>Cosmetics are purely visual — they never make you stronger.</div>
      {SLOTS.map((slot) => {
        const list = cos.filter((c) => c.slot === slot.id);
        if (!list.length) return null;
        return (
          <div key={slot.id} className="card tight">
            <b>{slot.label}</b>
            <div className="list" style={{ marginTop: 8 }}>
              {list.map((c) => {
                const owned = me.owned_cosmetics.includes(c.id);
                const equipped = me.cosmetics?.[slot.id] === c.id;
                const lockText = c.unlock ? (c.unlock.startsWith('level:') ? `Level ${c.unlock.split(':')[1]}` : c.unlock.startsWith('prestige:') ? `Prestige ${c.unlock.split(':')[1]}` : 'Quest reward') : null;
                const unlockable = c.unlock && ((c.unlock.startsWith('level:') && me.level >= Number(c.unlock.split(':')[1])) || (c.unlock.startsWith('prestige:') && me.prestige >= Number(c.unlock.split(':')[1])));
                return (
                  <div key={c.id} className="li" style={{ padding: '8px 10px' }}>
                    {c.data.glow || c.data.color ? <span style={{ width: 22, height: 22, borderRadius: 7, background: c.data.color === 'rainbow' ? 'linear-gradient(90deg,#f43f5e,#fbbf24,#22d3ee,#a855f7)' : c.data.glow || c.data.color }} /> : c.data.emoji ? <span style={{ fontSize: 22 }}>{c.data.emoji}</span> : <span>🎨</span>}
                    <div className="grow t1" style={{ fontSize: 15 }}>{c.name}</div>
                    {equipped ? (
                      <span className="tag online">EQUIPPED</span>
                    ) : owned ? (
                      slot.id === 'emote' ? <span className="tag">OWNED</span> : <button className="btn small primary" onClick={() => equip(c.id).catch(() => {})}>EQUIP</button>
                    ) : c.unlock ? (
                      <button className="btn small" disabled={!unlockable} onClick={() => buyCosmetic(c.id).catch(() => {})}>{unlockable ? 'CLAIM' : `🔒 ${lockText}`}</button>
                    ) : (
                      <button className="btn small gold" disabled={me.cash < c.price} onClick={() => buyCosmetic(c.id).catch(() => {})}>{shortMoney(c.price)}</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}

function Prestige() {
  const me = useGame((s) => s.me)!;
  const rules = useGame((s) => s.catalog?.rules);
  const need = rules?.prestige_level ?? 25;
  const next = me.prestige + 1;
  const luck = next <= 0 ? 0 : Math.min(50, 3 * next - 1);
  return (
    <div className="col">
      <div className="card" style={{ borderColor: '#c084fc', background: 'rgba(124,58,237,0.1)' }}>
        <div className="display" style={{ fontSize: 22, fontWeight: 900 }}>✨ PRESTIGE {next}</div>
        <div className="muted" style={{ fontWeight: 700, marginTop: 6 }}>Reach level {need} to prestige. You'll restart with permanent bonuses:</div>
        <ul style={{ fontWeight: 800, lineHeight: 1.6 }}>
          <li className="good-t">+{5 * next}% income forever</li>
          <li className="good-t">+{luck}% luck on Rare-or-better drops</li>
          <li>Prestige-only base themes, trails & emotes</li>
          <li>30-minute raid shield after the reset</li>
        </ul>
        <div className="muted" style={{ fontWeight: 700 }}>
          <b>You keep:</b> vault items, your collection book, cosmetics, achievements, secret keys.<br />
          <b>You lose:</b> cash, displayed & stored items, base & security upgrades, level.
        </div>
      </div>
      <div className="bar gold"><i style={{ width: `${Math.min(100, (me.level / need) * 100)}%` }} /></div>
      <div className="muted center" style={{ fontWeight: 800 }}>Level {me.level}/{need}</div>
      <button
        className="btn purple big block"
        disabled={me.level < need}
        onClick={() =>
          confirmAction({
            title: `Prestige to P${next}?`,
            body: 'Everything outside your vault (except your Starter TV) is gone. Put your favourites in the vault first!',
            confirmLabel: 'PRESTIGE',
            danger: true,
            hold: true,
            onConfirm: () => prestige().catch(() => {}),
          })
        }
      >
        {me.level < need ? `LOCKED — LEVEL ${need}` : 'PRESTIGE NOW'}
      </button>
    </div>
  );
}

function Activity() {
  const [a, setA] = useState<any>(null);
  useEffect(() => {
    G().backend?.rpc('stt_activity').then(setA).catch(() => {});
  }, []);
  if (!a) return <div className="empty">Loading…</div>;
  return (
    <>
      <div className="muted" style={{ fontWeight: 700 }}>Every cash movement is recorded on the server (passive income is shown as your total earned).</div>
      <table className="tbl">
        <tbody>
          {a.transactions.map((t: any) => (
            <tr key={t.id}>
              <td>{t.kind.replace(/_/g, ' ')}</td>
              <td className={'mono ' + (t.amount >= 0 ? 'up' : 'down')} style={{ textAlign: 'right' }}>{t.amount >= 0 ? '+' : ''}{money(t.amount)}</td>
              <td className="dim" style={{ textAlign: 'right' }}>{ago(t.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export { duration };
