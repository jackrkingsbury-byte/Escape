import { useEffect, useRef, useState } from 'react';
import { useGame, openPanel, liveCash, toClient, item as catItem, price, mutMult, type PanelId } from '../game/store';
import { EMPTY } from '../game/store';
import { money, perSec, shortMoney, duration, hashHue } from '../game/format';
import { feedLine } from '../game/session';
import { useWorldUI } from '../world/ui';
import { engine } from '../world/engine';
import { play } from '../game/sound';
import { visit } from '../game/actions';
import { ItemIcon, MutBadge, RarityLabel, useNow } from './common';
import type { Rarity } from '../backend/types';

export function Hud() {
  const me = useGame((s) => s.me);
  const ev = useGame((s) => s.last?.event);
  const next = useGame((s) => s.last?.next_event_at);
  const feedCount = useGame((s) => s.feed.length);
  const claimable = useGame((s) => (s.last?.quests_claimable || 0) + (s.me?.daily.can_claim ? 1 : 0));
  const online = useGame((s) => s.last?.online ?? 0);
  const mode = useGame((s) => s.backend?.mode);
  const cashRef = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(feedCount);
  useNow(1000);

  // Cash rolls up (never jumps) and the counter bumps on every gain.
  useEffect(() => {
    let raf = 0;
    let shown = liveCash();
    let lastTarget = shown;
    const tick = () => {
      const target = liveCash();
      if (target !== lastTarget) {
        if (target > lastTarget && cashRef.current) {
          cashRef.current.classList.remove('bump');
          void cashRef.current.offsetWidth;
          cashRef.current.classList.add('bump');
        }
        lastTarget = target;
      }
      const diff = target - shown;
      shown = Math.abs(diff) < 1 ? target : shown + diff * 0.18;
      if (cashRef.current) cashRef.current.textContent = money(Math.round(shown));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!me) return null;
  const xpPct = Math.max(0, Math.min(100, ((me.xp - me.xp_level) / Math.max(1, me.xp_next - me.xp_level)) * 100));
  const hue = hashHue(me.id);
  return (
    <div className="hud">
      <div className="hud-me" onClick={() => openPanel('profile')} title="Your profile">
        <div className="avatar-dot" style={{ background: `hsl(${hue},70%,55%)` }}>
          {me.username[0].toUpperCase()}
          <span className="lvl">{me.level}</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="name">
            {me.username} {me.prestige > 0 && <span className="tag" style={{ color: '#f0abfc' }}>P{me.prestige}</span>}
          </div>
          <div className="title">{me.title} · Lv {me.level}</div>
          <div className="xp" title={`${me.xp - me.xp_level} / ${me.xp_next - me.xp_level} XP`}>
            <i style={{ width: xpPct + '%' }} />
          </div>
        </div>
      </div>
      <div className="hud-mid">
        <div className="hud-cash" onClick={() => openPanel('base')} title="Your cash — tap for your base">
          <div className="cash" ref={cashRef} data-testid="cash">{money(me.cash)}</div>
          <div className="sub">
            <span className="inc">+{perSec(me.income)}</span>
            <span>BASE <b>{shortMoney(me.base_value)}</b></span>
          </div>
        </div>
        <BaseChips />
        {ev ? (
          <div className="event-pill" onClick={() => openPanel('event')}>
            <span style={{ fontSize: 20 }}>{ev.icon}</span>
            <span>{ev.title}</span>
            <small>{duration(toClient(ev.ends_at) - Date.now())}</small>
          </div>
        ) : next ? (
          <div className="event-pill next" onClick={() => openPanel('event')}>
            🎪 <small>NEXT EVENT {duration(toClient(next) - Date.now())}</small>
          </div>
        ) : null}
      </div>
      <div className="hud-right">
        <button className="icon-btn" title="Missions & daily reward" onClick={() => openPanel('quests')}>
          🎯{claimable > 0 && <span className="badge">{claimable}</span>}
        </button>
        <button className="icon-btn" title="Live feed" onClick={() => { setSeen(feedCount); openPanel('feed'); }}>
          🔔{feedCount - seen > 0 && <span className="badge">{Math.min(99, feedCount - seen)}</span>}
        </button>
        <button className="icon-btn" title="Settings" onClick={() => openPanel('settings')}>⚙️</button>
        <span className="tag online" title={mode === 'online' ? 'Players online now' : 'Offline practice mode — NPC players are simulated on this device'}>
          {mode === 'online' ? `● ${online} ONLINE` : '● OFFLINE MODE'}
        </span>
      </div>
    </div>
  );
}

/** "💰 $4.2K waiting" + lock status — tap to go home. */
function BaseChips() {
  const me = useGame((s) => s.me);
  const items = useGame((s) => s.myItems);
  const here = useWorldUI((s) => s.here);
  useNow(500);
  if (!me) return null;
  let pending = 0;
  for (const pi of items) {
    if (pi.location !== 'display') continue;
    const it = catItem(pi.item_id);
    if (!it) continue;
    const secs = Math.min(43200, Math.max(0, (Date.now() - toClient(pi.accrued_at)) / 1000));
    pending += it.base_income * mutMult(pi.mutation) * (1 + me.income_bonus) * secs;
  }
  const lockLeft = me.lock_until ? toClient(me.lock_until) - Date.now() : 0;
  const home = !!here?.mine;
  return (
    <div className="chips">
      <button className={'chip pending' + (pending > me.income * 60 ? ' hot' : '')} data-testid="pending-chip" onClick={() => { if (!home) engine?.travelHome(); }} title="Cash waiting on your podiums — walk over them to collect">
        💰 {shortMoney(pending)} <small>{home ? 'WALK OVER PODIUMS' : 'WAITING · GO HOME'}</small>
      </button>
      <button className={'chip lock' + (lockLeft > 0 ? ' on' : '')} onClick={() => { if (!home) engine?.travelHome(); }} title="Step on the red pad at your door to lock your base">
        {lockLeft > 0 ? `🔒 LOCKED ${Math.ceil(lockLeft / 1000)}s` : '🔓 UNLOCKED'}
      </button>
    </div>
  );
}

export function Ticker() {
  const feed = useGame((s) => s.feed);
  const lines = feed.filter((e) => e.target_id === null).slice(-14).map((e) => ({ id: e.id, l: feedLine(e) })).filter((x) => x.l);
  if (!lines.length) return null;
  return (
    <div className="ticker" aria-hidden>
      <div className="track" key={lines[lines.length - 1].id}>
        {lines.map(({ id, l }) => (
          <span key={id} className={'t-' + l!.tone}>{l!.icon} {l!.text}</span>
        ))}
      </div>
    </div>
  );
}

const NAV: { id: PanelId; e: string; label: string; desk?: boolean }[] = [
  { id: 'base', e: '🏠', label: 'BASE' },
  { id: 'drops', e: '📦', label: 'DROPS' },
  { id: 'collection', e: '🎒', label: 'COLLECTION' },
  { id: 'market', e: '📈', label: 'MARKET' },
  { id: 'raid', e: '🥷', label: 'RAID' },
  { id: 'trade', e: '🤝', label: 'TRADE' },
  { id: 'leaderboard', e: '🏆', label: 'RANKS' },
  { id: 'profile', e: '👤', label: 'PROFILE', desk: true },
  { id: 'settings', e: '⚙️', label: 'SETTINGS', desk: true },
];

export function NavBar() {
  const panel = useGame((s) => s.panel);
  const trades = useGame((s) => s.last?.trades.incoming || 0);
  const revenge = useGame((s) => s.last?.revenge || 0);
  const tokens = useGame((s) => Object.values(s.me?.drop_tokens || {}).reduce((a, b) => a + (b || 0), 0));
  const badges: Partial<Record<PanelId, number>> = { trade: trades, raid: revenge, drops: tokens };
  return (
    <nav className="nav">
      <div className="nav-inner">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={(panel === n.id ? 'on' : '') + (n.desk ? ' desk-only' : '')}
            data-testid={'nav-' + n.id}
            onClick={() => {
              play('click');
              openPanel(panel === n.id ? null : n.id);
            }}
          >
            <span className="e">{n.e}</span>
            {n.label}
            {badges[n.id] ? <span className="badge">{badges[n.id]}</span> : null}
          </button>
        ))}
      </div>
    </nav>
  );
}

export function Toasts() {
  const toasts = useGame((s) => s.toasts);
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={'toast ' + t.kind}>
          {t.itemId ? <ItemIcon id={t.itemId} size={40} /> : <span className="ti">{t.icon}</span>}
          <div className="grow">
            <div className="tt">{t.icon && t.itemId ? t.icon + ' ' : ''}{t.title}</div>
            {t.body && <div className="tb">{t.body}</div>}
          </div>
          {t.action && (
            <button className="btn small primary" onClick={() => { t.action!.run(); useGame.setState((s) => ({ toasts: s.toasts.filter((x) => x.id !== t.id) })); }}>
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export function ZonePrompt() {
  const prompt = useWorldUI((s) => s.prompt);
  const panel = useGame((s) => s.panel);
  const [touch, setTouch] = useState(false);
  useEffect(() => setTouch(matchMedia('(pointer: coarse)').matches), []);
  const passive = prompt && (prompt.kind === 'carry' || prompt.kind === 'info');
  return (
    <>
      {prompt && !panel && (
        <div className={'prompt k-' + prompt.kind}>
          <button
            className={'btn big ' + (prompt.tone || 'primary') + (passive ? ' passive' : '')}
            data-testid="interact"
            disabled={prompt.disabled}
            onClick={() => { if (!passive) engine?.interact(); }}
          >
            {!touch && !passive && <span className="kbd">E</span>} <span className="pi">{prompt.icon}</span>
            <span className="pl">
              <b>{prompt.label}</b>
              {prompt.sub && <small>{prompt.sub}</small>}
            </span>
          </button>
        </div>
      )}
      {touch && !panel && (
        <div className="touch-actions">
          <button className="round jump" aria-label="Jump" onPointerDown={() => engine?.jump()}>⤒</button>
          <button className="round sprint" aria-label="Sprint" onPointerDown={() => engine?.setSprint(true)} onPointerUp={() => engine?.setSprint(false)} onPointerCancel={() => engine?.setSprint(false)} onPointerLeave={() => engine?.setSprint(false)}>⚡</button>
        </div>
      )}
    </>
  );
}

/** While you carry stolen loot: RUN HOME + a compass arrow to your base. */
export function CarryHud() {
  const st = useGame((s) => s.steal);
  const home = useWorldUI((s) => s.home);
  const now = useNow(100);
  if (!st || st.result || st.phase !== 'carry') return null;
  const left = Math.max(0, st.carryUntil - now);
  const urgent = left < 12000;
  return (
    <div className={'carry-hud' + (urgent ? ' urgent' : '')} data-testid="carry-hud">
      <div className="arrow" style={{ transform: `rotate(${home?.angle ?? 0}rad)` }}>➤</div>
      <div>
        <div className="t">{home?.inside ? 'SAFE AT HOME!' : 'RUN HOME!'}</div>
        <div className="s">
          <ItemIcon id={st.itemId} size={28} mutation={st.mutation} /> {home ? `${Math.round(home.dist)}m` : ''} · {duration(left)} left
        </div>
      </div>
    </div>
  );
}

export function HoverTip() {
  const hover = useWorldUI((s) => s.hover);
  const sel = useWorldUI((s) => s.selected);
  if (!hover || sel) return null;
  const it = catItem(hover.itemId);
  if (!it) return null;
  const m = mutMult(hover.mutation);
  return (
    <div className="hover-tip" style={{ left: hover.sx, top: hover.sy }}>
      <MutBadge m={hover.mutation} /> <RarityLabel r={it.rarity as Rarity} /> {it.name}
      <div className="muted" style={{ fontSize: 12 }}>
        {shortMoney(hover.price ?? price(it.id, hover.mutation))} · +{perSec(it.base_income * m)} · {hover.ownerName}
      </div>
    </div>
  );
}

export function ItemPopover() {
  const sel = useWorldUI((s) => s.selected);
  const steal = useGame((s) => s.steal);
  if (!sel) return null;
  const it = catItem(sel.itemId);
  if (!it) return null;
  const close = () => useWorldUI.setState({ selected: null });
  const left = Math.max(8, Math.min(window.innerWidth - 258, sel.sx - 125));
  const top = Math.max(90, Math.min(window.innerHeight - 330, sel.sy - 300));
  const m = mutMult(sel.mutation);
  const belt = sel.beltId != null;
  return (
    <div className="popover" style={{ left, top }} onPointerDown={(e) => e.stopPropagation()}>
      <div className="row">
        <ItemIcon id={it.id} size={64} mutation={sel.mutation} />
        <div className="grow">
          <div style={{ fontWeight: 900, lineHeight: 1.1 }}>{it.name}</div>
          <RarityLabel r={it.rarity as Rarity} /> <MutBadge m={sel.mutation} />
          <div className="good-t" style={{ fontWeight: 900 }}>{money(belt ? sel.price : price(it.id, sel.mutation))}</div>
          <div className="muted" style={{ fontSize: 13, fontWeight: 700 }}>+{perSec(it.base_income * m)} · {belt ? 'on the Tech Belt' : sel.mine ? 'Yours' : sel.ownerName}</div>
        </div>
      </div>
      <div className="col" style={{ marginTop: 10, gap: 8 }}>
        {belt ? (
          <button className="btn good block" data-testid="popover-buy" onClick={() => { close(); (engine as any)?.runToBuy(sel.beltId); }}>
            🛒 RUN & BUY · {shortMoney(sel.price)}
          </button>
        ) : sel.mine ? (
          <button className="btn primary block" onClick={() => { close(); openPanel('base', { select: sel.playerItemId }); }}>MANAGE</button>
        ) : (
          <>
            <button
              className="btn hot block"
              data-testid="popover-steal"
              disabled={!!steal && !steal.result}
              onClick={() => { close(); engine?.runToSteal(sel.ownerId, sel.playerItemId); }}
            >
              🥷 GO STEAL IT
            </button>
            <button className="btn block" onClick={() => { close(); visit(sel.ownerId); }}>VIEW BASE</button>
          </>
        )}
        <button className="btn ghost small" onClick={close}>CLOSE</button>
      </div>
    </div>
  );
}

export function Joystick() {
  const [pos, setPos] = useState<{ x: number; y: number; kx: number; ky: number } | null>(null);
  const id = useRef<number | null>(null);
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = matchMedia('(pointer: coarse)');
    setCoarse(mq.matches);
    const on = () => setCoarse(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  if (!coarse) return null;
  const R = 55;
  const move = (e: React.PointerEvent) => {
    if (id.current !== e.pointerId || !pos) return;
    let dx = e.clientX - pos.x;
    let dy = e.clientY - pos.y;
    const d = Math.hypot(dx, dy);
    if (d > R) {
      dx = (dx / d) * R;
      dy = (dy / d) * R;
    }
    setPos({ ...pos, kx: dx, ky: dy });
    engine?.setJoystick(dx / R, dy / R);
  };
  const end = () => {
    id.current = null;
    setPos(null);
    engine?.setJoystick(0, 0);
  };
  return (
    <>
      <div
        className="joy-zone"
        onPointerDown={(e) => {
          id.current = e.pointerId;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          setPos({ x: e.clientX, y: e.clientY, kx: 0, ky: 0 });
        }}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      />
      {pos ? (
        <div className="joystick" style={{ left: pos.x - 75, top: pos.y - 75, pointerEvents: 'none' }}>
          <div className="knob" style={{ transform: `translate(${pos.kx}px, ${pos.ky}px)` }} />
        </div>
      ) : (
        <div className="joystick" style={{ left: 24, bottom: 110, opacity: 0.55, pointerEvents: 'none' }}>
          <div className="knob" />
        </div>
      )}
    </>
  );
}

export function EmoteBar() {
  const me = useGame((s) => s.me);
  const cos = useGame((s) => s.catalog?.cosmetics ?? EMPTY);
  const [open, setOpen] = useState(false);
  if (!me) return null;
  const emotes = cos.filter((c) => c.slot === 'emote' && me.owned_cosmetics.includes(c.id));
  return (
    <div className="col emote-bar">
      {open && (
        <div className="card tight row wrap" style={{ maxWidth: 240 }}>
          {emotes.map((e) => (
            <button key={e.id} className="icon-btn" onClick={() => { engine?.doEmote(e.data.emoji); setOpen(false); play('click'); }}>{e.data.emoji}</button>
          ))}
        </div>
      )}
      <div className="row">
        <button className="icon-btn" title="Emotes" onClick={() => setOpen(!open)}>😀</button>
        <button className="icon-btn" title="Go home" onClick={() => { engine?.travelHome(); }}>🏠</button>
      </div>
    </div>
  );
}
