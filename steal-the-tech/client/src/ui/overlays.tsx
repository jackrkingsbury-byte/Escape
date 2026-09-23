import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame, setG, G, openPanel, toClient, item as catItem, price, mutationDef, mutMult } from '../game/store';
import { RARITY, RARITY_ORDER } from '../game/rarity';
import { money, perSec, duration } from '../game/format';
import { play, reveal } from '../game/sound';
import { openDrop, finishSteal, defend, vault, tutorial, abortSteal } from '../game/actions';
import { itemUrl } from '../art/items';
import { drawCrate } from '../art/crate';
import { ItemIcon, RarityLabel, useNow, ItemCard, HoldButton, MutBadge } from './common';
import { engine } from '../world/engine';
import type { Rarity } from '../backend/types';

function CrateCanvas({ dropId, size = 190 }: { dropId: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let raf = 0;
    const cv = ref.current!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = size * dpr;
    cv.height = size * dpr;
    const c = cv.getContext('2d')!;
    const t0 = performance.now();
    const loop = (now: number) => {
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, size, size);
      drawCrate(c, size * 0.45, size * 0.55, size * 0.62, dropId, (now - t0) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [dropId, size]);
  return <canvas ref={ref} style={{ width: size, height: size }} />;
}

function Confetti({ n = 80, colors }: { n?: number; colors?: string[] }) {
  const bits = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 1.8 + Math.random() * 2,
        color: colors ? colors[i % colors.length] : `hsl(${Math.random() * 360},90%,60%)`,
        rot: Math.random() * 360,
      })),
    [n, colors],
  );
  return (
    <>
      {bits.map((b, i) => (
        <i key={i} className="confetti" style={{ left: b.left + '%', background: b.color, animationDuration: b.dur + 's', animationDelay: b.delay + 's', transform: `rotate(${b.rot}deg)` }} />
      ))}
    </>
  );
}

// ── Drop opening ─────────────────────────────────────────────────────────
export function DropOverlay() {
  const drop = useGame((s) => s.drop);
  const catalog = useGame((s) => s.catalog);
  const me = useGame((s) => s.me);
  const [now, setNow] = useState(performance.now());
  const revealed = useRef<string | null>(null);
  useEffect(() => {
    if (!drop) return;
    let raf = 0;
    const loop = () => {
      setNow(performance.now());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [drop]);
  if (!drop || !catalog) return null;
  const def = catalog.drops.find((d) => d.id === drop.drop);
  const elapsed = Date.now() - drop.startedAt;
  const r = drop.result;
  const tier = r ? RARITY[r.rarity].tier : 0;
  const suspense = tier >= 6 ? 1300 : 0; // mythic+ get an extra beat of darkness
  const chargeMs = 1900;
  const phase = !r || elapsed < chargeMs ? 'charge' : elapsed < chargeMs + suspense ? 'suspense' : 'reveal';
  const possible = def ? RARITY_ORDER.filter((x) => (def.weights as any)[x]) : RARITY_ORDER;
  const flashR = possible[Math.floor(now / Math.max(60, 260 - elapsed / 10)) % possible.length] as Rarity;
  if (phase === 'charge' && Math.floor(elapsed / 220) !== Math.floor((elapsed - 16) / 220)) play('shake');
  if (phase === 'reveal' && r && revealed.current !== r.player_item.id) {
    revealed.current = r.player_item.id;
    reveal(r.rarity);
    if (r.mutation) play('mutation');
    if (navigator.vibrate && tier >= 5) navigator.vibrate(tier >= 7 ? [100, 50, 100, 50, 300] : 120);
  }
  const it = r ? catItem(r.item_id) : null;
  const close = () => setG({ drop: null });
  const tokens = me?.drop_tokens?.[drop.drop] || 0;
  const again = () => {
    setG({ drop: null });
    window.setTimeout(() => openDrop(drop.drop, tokens > 0), 50);
  };
  const rc = r ? (r.rarity === 'ultra' ? '#e879f9' : RARITY[r.rarity].color) : RARITY[flashR].color;
  return (
    <div className={`drop-stage r-${r?.rarity ?? 'common'}`} style={{ ['--rc' as any]: rc }} data-testid="drop-overlay">
      {phase === 'charge' && (
        <>
          <div className="drop-rays" style={{ ['--ray' as any]: RARITY[flashR].color + '33' }} />
          <div className="muted display" style={{ fontSize: 18, letterSpacing: '0.2em' }}>{def?.name}</div>
          <div className={'drop-crate shake' + (elapsed > 1200 ? ' hard' : '')} style={{ filter: `drop-shadow(0 0 ${20 + elapsed / 40}px ${RARITY[flashR].color})` }}>
            <CrateCanvas dropId={drop.drop} />
          </div>
          <div className="reveal-rarity" style={{ color: RARITY[flashR].color, fontSize: 28, opacity: 0.8 }}>{RARITY[flashR].label}?</div>
        </>
      )}
      {phase === 'suspense' && (
        <>
          <div className="drop-crate shake hard" style={{ filter: 'brightness(0.4) drop-shadow(0 0 40px #fff)' }}>
            <CrateCanvas dropId={drop.drop} />
          </div>
          <div className="reveal-rarity" style={{ color: '#fff', fontSize: 30 }}>SOMETHING RARE…</div>
        </>
      )}
      {phase === 'reveal' && r && it && (
        <>
          <div className="drop-flash" />
          <div className="drop-rays" style={{ ['--ray' as any]: rc + '44' }} />
          {tier >= 5 && <Confetti n={tier >= 7 ? 140 : 70} colors={tier === 9 ? ['#c084fc', '#fff', '#7c3aed'] : undefined} />}
          {r.is_new && <span className="new-badge">NEW DISCOVERY!</span>}
          <div className="reveal-item">
            <img src={itemUrl(it, 256)} alt={it.name} className={r.mutation ? 'mutf-' + r.mutation : ''} />
          </div>
          {r.mutation && <div className="reveal-mut"><MutBadge m={r.mutation} /> MUTATION!</div>}
          <div className="reveal-rarity">{RARITY[r.rarity].label}</div>
          <div className="reveal-name">{it.name}</div>
          {r.serial && it.max_supply && <div className="supply" style={{ fontSize: 14, marginTop: 6 }}>SERIAL #{r.serial} / {it.max_supply}</div>}
          <div className="row" style={{ justifyContent: 'center', gap: 18, marginTop: 10, fontWeight: 900, fontSize: 18 }}>
            <span className="good-t">{money(price(it.id, r.mutation))}</span>
            <span className="muted">+{perSec(it.base_income * mutMult(r.mutation))}</span>
            <span className="gold-t">+{r.xp} XP</span>
          </div>
          <div className="muted" style={{ fontWeight: 700, marginTop: 4 }}>
            {r.placed ? '✅ Now on display in your base — earning money.' : '📦 Your base is full — it went to storage. Swap it in from BASE.'}
          </div>
          <div className="row" style={{ marginTop: 18, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn big" onClick={close} data-testid="drop-close">CONTINUE</button>
            <button className="btn big primary" onClick={again}>{tokens > 0 ? `OPEN ANOTHER (${tokens} FREE)` : `OPEN ANOTHER · ${money(def?.price ?? 0)}`}</button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Stealing (attacker): GRAB bar, then the result ───────────────────────
export function StealOverlay() {
  const st = useGame((s) => s.steal);
  const now = useNow(100);
  const fired = useRef<string | null>(null);
  useEffect(() => {
    if (st && !st.result && st.phase === 'grab' && now >= st.endsAt && fired.current !== st.raidId) {
      fired.current = st.raidId;
      finishSteal();
    }
  }, [st, now]);
  if (!st) return null;
  const it = catItem(st.itemId);
  const total = Math.max(1, st.endsAt - st.startedAt);
  const prog = Math.max(0, Math.min(1, (now - st.startedAt) / total));
  const close = () => setG({ steal: null });
  if (!st.result) {
    if (st.phase === 'carry') return null; // CarryHud takes over
    return (
      <div className="steal-box" data-testid="steal-box">
        <div className="row between">
          <div className="big">GRABBING…</div>
          <div className="display" style={{ fontSize: 22 }}>{duration(st.endsAt - now)}</div>
        </div>
        <div className="row" style={{ margin: '8px 0' }}>
          <ItemIcon id={st.itemId} size={56} mutation={st.mutation} />
          <div className="grow">
            <div style={{ fontWeight: 900 }}>{it?.name} <MutBadge m={st.mutation} /></div>
            <div className="muted" style={{ fontWeight: 700 }}>
              from {st.defender} · {Math.round(st.chance * (st.defended ? 0.3 : 1) * 100)}% to beat the lasers{st.revenge ? ' · REVENGE BONUS' : ''}{st.tutorial ? ' · beginner raid' : ''}
            </div>
          </div>
        </div>
        <div className="steal-bar"><i style={{ width: prog * 100 + '%' }} /></div>
        {st.defended && <div className="bad-t" style={{ fontWeight: 900, marginTop: 8 }}>🚨 THE OWNER HIT THE ALARM! Your odds collapsed.</div>}
        {st.finishing ? (
          <div className="muted" style={{ marginTop: 6, fontWeight: 700 }}>Cracking the lasers…</div>
        ) : (
          <div className="row" style={{ marginTop: 8, justifyContent: 'space-between' }}>
            <span className="muted" style={{ fontWeight: 700 }}>Then RUN it home — the owner can tag you.</span>
            <button className="btn small ghost" onClick={() => abortSteal('abort')}>BACK OFF</button>
          </div>
        )}
      </div>
    );
  }
  const ok = st.result.status === 'success';
  const blocked = st.result.status === 'blocked';
  const title = ok ? 'ITEM STOLEN!' : blocked ? 'BLOCKED!' : st.result.caught ? 'CAUGHT!' : /Too slow/i.test(st.result.note || '') ? 'TOO SLOW!' : 'ZAPPED!';
  return (
    <div className="overlay" onClick={close}>
      <div className={'modal center result ' + (ok ? 'win' : 'lose')} onClick={(e) => e.stopPropagation()} data-testid="steal-result">
        {ok && <Confetti n={90} />}
        <div className="result-icon">{ok ? '🔥' : blocked ? '🔒' : st.result.caught ? '🫵' : '⚡'}</div>
        <h2 className={'result-title ' + (ok ? 'good-t' : 'bad-t')}>{title}</h2>
        <div style={{ maxWidth: 180, margin: '10px auto' }}>
          <ItemCard id={st.itemId} mutation={st.mutation} />
        </div>
        {ok ? (
          <p className="muted" style={{ fontWeight: 700 }}>It's on your podium now, earning for you. It's <b className="bad-t">🔥 HOT</b> for 5 minutes — no selling yet, and {st.defender} can take REVENGE.</p>
        ) : (
          <p className="muted" style={{ fontWeight: 700 }}>
            {st.result.note || 'You got caught.'} {st.result.fine > 0 && <>You paid a <b className="bad-t">{money(st.result.fine)}</b> fine to {st.defender}.</>} Lay low for a moment before your next raid.
          </p>
        )}
        <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
          <button className="btn big" onClick={close}>CONTINUE</button>
          <button className="btn big hot" onClick={() => { close(); openPanel('raid'); }}>RAID AGAIN</button>
        </div>
      </div>
    </div>
  );
}

// ── Being raided (defender) ──────────────────────────────────────────────
export function RaidAlarm() {
  const raid = useGame((s) => s.last?.incoming_raids[0]);
  const me = useGame((s) => s.me);
  const vaultUsed = useGame((s) => s.myItems.filter((i) => i.location === 'vault').length);
  const mutation = useGame((s) => (raid ? s.myItems.find((i) => i.id === raid.player_item_id)?.mutation ?? null : null));
  const now = useNow(100);
  const [busy, setBusy] = useState(false);
  if (!raid || !me) return null;
  const it = catItem(raid.item_id);
  const carry = raid.phase === 'carry';
  const end = carry ? toClient(raid.deliver_after) : toClient(raid.ends_at);
  const start = carry ? toClient(raid.grabbed_at) : toClient(raid.started_at);
  const left = end - now;
  const prog = Math.max(0, Math.min(1, (now - start) / Math.max(1, end - start)));
  const canVault = vaultUsed < me.vault_capacity;
  return (
    <div className={'alarm' + (carry ? ' carry' : '')} role="alert" data-testid="raid-alarm">
      <div className="row between">
        <h3>{carry ? '🏃 THEY GRABBED IT — TAG THEM!' : "🚨 YOU'RE BEING ROBBED"}</h3>
        <b className="display" style={{ fontSize: 22, color: '#fecaca' }}>{left > 0 ? duration(left) : '…'}</b>
      </div>
      <div className="row" style={{ margin: '8px 0' }}>
        <ItemIcon id={raid.item_id} size={56} mutation={mutation} />
        <div className="grow">
          <div style={{ fontWeight: 900, color: '#fff' }}>{raid.attacker}{raid.attacker_bot ? ' 🤖' : ''} {carry ? 'is running off with your' : 'is grabbing your'}</div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>{it && <RarityLabel r={it.rarity as Rarity} />} <MutBadge m={mutation} /> {it?.name}</div>
        </div>
      </div>
      <div className="steal-bar" style={{ marginBottom: 10 }}><i style={{ width: prog * 100 + '%' }} /></div>
      {carry ? (
        <div className="row">
          <button className="btn hot grow big" onClick={() => engine?.chase(raid.attacker_id)} data-testid="chase">👊 CHASE & TAG</button>
        </div>
      ) : (
        <div className="row">
          <button className="btn hot grow big" disabled={raid.defended || busy || left <= 0} data-testid="defend" onClick={async () => { setBusy(true); try { await defend(raid.id); } finally { setBusy(false); } }}>
            {raid.defended ? '🚨 ALARM ON' : '🚨 ALARM'}
          </button>
          <button className="btn good grow big" disabled={!canVault || busy || left <= 0} onClick={async () => { setBusy(true); try { await vault(raid.player_item_id); } finally { setBusy(false); } }}>
            🔒 VAULT {canVault ? '' : '(FULL)'}
          </button>
          <button className="btn grow big" onClick={() => engine?.chase(raid.attacker_id)}>👊 TAG</button>
        </div>
      )}
      <div style={{ color: '#fecaca', fontSize: 13, fontWeight: 700, marginTop: 6 }}>
        {carry ? 'Run into them to tag them — they drop your item and pay you a bounty.' : 'Alarm cuts their odds by 70%. Vault = theft fails. Or run over and tag them!'}
      </div>
    </div>
  );
}

// ── Big centre-screen banners (rare spawns, GOT IT, TAGGED…) ─────────────
export function Banner() {
  const b = useGame((s) => s.banner);
  if (!b) return null;
  const m = mutationDef(b.mutation);
  return (
    <div key={b.id} className={'banner k-' + b.kind} style={{ ['--bc' as any]: b.color || (m ? m.color : undefined), ['--ttl' as any]: b.ttl + 'ms' }} data-testid="banner">
      {b.itemId && <ItemIcon id={b.itemId} size={64} mutation={b.mutation} />}
      <div>
        <div className={'bt' + (b.mutation === 'rainbow' ? ' rainbow-text' : '')}>{b.title}</div>
        {b.sub && <div className="bs">{b.sub}</div>}
      </div>
    </div>
  );
}

// ── Server-wide SECRET announcement ─────────────────────────────────────
export function BigReveal() {
  const e = useGame((s) => s.bigReveal);
  useEffect(() => {
    if (!e) return;
    const t = window.setTimeout(() => setG({ bigReveal: null }), 7000);
    return () => clearTimeout(t);
  }, [e]);
  if (!e) return null;
  const p = e.payload;
  const it = catItem(p.item_id);
  return (
    <div className="big-reveal" onClick={() => setG({ bigReveal: null })}>
      <Confetti n={120} colors={['#c084fc', '#ffffff', '#7c3aed', '#f0abfc']} />
      <div className="col" style={{ alignItems: 'center' }}>
        <h1>🚨 SECRET DISCOVERED 🚨</h1>
        <div className="muted display" style={{ letterSpacing: '0.3em' }}>PLAYER</div>
        <div style={{ fontSize: 34, fontWeight: 900 }}>{p.player}{p.is_bot ? ' 🤖' : ''}</div>
        {it && <img src={itemUrl(it, 256)} alt="" style={{ width: 220, filter: 'drop-shadow(0 0 40px #c084fc)' }} className="reveal-item" />}
        <div className="muted display" style={{ letterSpacing: '0.3em' }}>FOUND</div>
        <div style={{ fontSize: 30, fontWeight: 900, color: '#f5f3ff', textShadow: '0 0 20px #c084fc' }}>{p.item}</div>
        {p.serial && <div className="supply" style={{ fontSize: 15 }}>#{p.serial} of {p.max_supply}</div>}
        <div className="dim" style={{ marginTop: 10 }}>tap to continue</div>
      </div>
    </div>
  );
}

export function LevelUp() {
  const l = useGame((s) => s.levelUp);
  const blocking = useGame((s) => !!s.drop || !!s.steal?.result);
  useEffect(() => {
    if (!l || blocking) return;
    const t = window.setTimeout(() => setG({ levelUp: null }), 3200);
    return () => clearTimeout(t);
  }, [l, blocking]);
  if (!l || blocking) return null; // waits politely behind drop reveals and steal results
  return (
    <div className="levelup" onClick={() => setG({ levelUp: null })} data-testid="level-up">
      <Confetti n={40} colors={['#fde047', '#f59e0b', '#fff']} />
      <div className="lu-k">LEVEL UP</div>
      <div className="lu-n">{l.level}</div>
      <div className="lu-t">{l.title}{l.cash > 0 && <b className="good-t"> · +{money(l.cash)}</b>}</div>
    </div>
  );
}

export function ConfirmDialog() {
  const c = useGame((s) => s.confirm);
  if (!c) return null;
  const close = () => setG({ confirm: null });
  return (
    <div className="overlay" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{c.title}</h2>
        <p className="muted" style={{ fontWeight: 700, fontSize: 17, whiteSpace: 'pre-line' }}>{c.body}</p>
        <div className="col">
          {c.hold ? (
            <HoldButton className={'btn big block ' + (c.danger ? 'hot' : 'primary')} onConfirm={() => { close(); c.onConfirm(); }}>
              HOLD TO {c.confirmLabel}
            </HoldButton>
          ) : (
            <button className={'btn big block ' + (c.danger ? 'hot' : 'primary')} onClick={() => { close(); c.onConfirm(); }}>{c.confirmLabel}</button>
          )}
          <button className="btn block" onClick={close}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}

export function confirmAction(p: { title: string; body: string; confirmLabel: string; danger?: boolean; hold?: boolean; onConfirm: () => void }) {
  setG({ confirm: p });
}

// ── Tutorial ────────────────────────────────────────────────────────────
type Wait = 'collect' | 'belt' | 'lock' | 'drop' | 'grab' | 'steal';
interface Step {
  title: string;
  body: string;
  button?: string;
  onEnter?: () => void;
  onButton?: () => void;
  waitFor?: Wait;
  item?: string;
  hint?: string;
}

const WAIT_TEXT: Record<Wait, string> = {
  collect: 'walk onto the green plate',
  belt: 'buy something off the belt',
  lock: 'step on the red LOCK pad',
  drop: 'open the drop',
  grab: 'grab an item',
  steal: 'get it home',
};

export function Tutorial() {
  const open = useGame((s) => s.tutorialOpen);
  const me = useGame((s) => s.me);
  const world = useGame((s) => s.world);
  const panel = useGame((s) => s.panel);
  const drop = useGame((s) => s.drop);
  const steal = useGame((s) => s.steal);
  const [step, setStep] = useState(() => Math.max(1, Math.min(12, (G().me?.tutorial_step || 0) + 1)));
  const entered = useRef(0);
  const rick = world.find((p) => p.username === 'RookieRick');
  const basicPrice = useGame((s) => s.catalog?.drops.find((d) => d.id === 'basic')?.price ?? 0);
  useNow(500);

  const steps: Record<number, Step> = {
    1: { title: '👋 Welcome to STEAL THE TECH', body: 'Buy gadgets off the TECH BELT, show them off in your base, collect the cash they make — and STEAL what you can\'t afford.', button: "LET'S GO" },
    2: { title: '🏠 This is your base', body: 'Your NOVA Starter TV sits on a podium and piles up cash every second — even while you\'re away. It\'s soulbound: nobody can steal it.', item: 'nova-starter-tv', button: 'NICE', onEnter: () => engine?.travelHome() },
    3: { title: '💰 Collect your cash', body: 'Walk onto the glowing GREEN plate in front of your TV. Cha-ching!', waitFor: 'collect', hint: 'WASD / arrows or the joystick to move · drag to look around', onEnter: () => engine?.lookAtMyBase() },
    4: { title: '🛒 The Tech Belt', body: 'Gadgets walk along the belt through the middle of the city. We sent you $600 — walk up to one and BUY it. Anyone can buy what\'s on the belt, so be quick!', waitFor: 'belt', onEnter: () => engine?.lookAtBelt() },
    5: { title: '🌈 Rarities & mutations', body: 'COMMON → UNCOMMON → RARE → EPIC → LEGENDARY → MYTHIC → ULTRA → SECRET. GOLD, DIAMOND, NEON, HOLO, GLITCH and RAINBOW mutations multiply income and value up to 10×. When a Legendary+ hits the belt, the whole city hears about it — run!', button: 'GOT IT' },
    6: { title: '🔒 Lock your base', body: 'Thieves can walk right in. Step on the red LOCK pad by your door: lasers keep everyone out for a while. Re-lock when they switch off!', waitFor: 'lock', onEnter: () => engine?.travelHome() },
    7: { title: '📦 Mystery drops', body: `We also sent you ${money(basicPrice)} — one BASIC DROP. The Drop Zone is at the west end of the belt. 3% of pulls come out MUTATED.`, button: 'OPEN DROPS', onButton: () => openPanel('drops'), waitFor: 'drop' },
    8: { title: '🏚️ Meet your neighbour', body: `This is ${rick?.username ?? 'RookieRick'}'s base. Every base in Tech City is open for business…`, button: 'NEXT', onEnter: () => { if (rick) setG({ focusPlot: rick.id }); } },
    9: { title: '🥷 Grab something', body: 'Walk up to any item on his podiums and press STEAL. Stay close while you GRAB it — his security is basic, this one always works.', waitFor: 'grab' },
    10: { title: '🏃 RUN HOME!', body: 'It\'s not yours until it\'s inside YOUR base. Follow the arrow! (Owners can tag you on the way — Rick\'s just a rookie.)', waitFor: 'steal' },
    11: { title: '📈 The market', body: 'Every item has a live price driven by supply and demand. List items for others to buy, snap up bargains, and watch events move prices.', button: 'OPEN MARKET', onButton: () => openPanel('market') },
    12: { title: '🚀 Go build an empire', body: 'Collect often, lock up when you leave, watch the belt for rare drops — and people WILL come for your best stuff. Here\'s a free Basic Drop to start.', button: 'FINISH' },
  };

  const cur = steps[step];
  useEffect(() => {
    if (!open || !cur) return;
    if (entered.current === step) return;
    entered.current = step;
    tutorial(step).catch(() => {});
    cur.onEnter?.();
  }, [step, open]);

  // automatic progress for action steps
  useEffect(() => {
    if (!open || !me) return;
    const st = me.stats || {};
    const stole = (st.steals_won || 0) > 0 || !!me.tutorial_flags?.tutorial_raid;
    if (step === 3 && (st.collects || 0) > 0) setStep(4);
    if (step === 4 && (st.belt_buys || 0) > 0) setStep(5);
    if (step === 6 && me.lock_until && toClient(me.lock_until) > Date.now()) setStep(7);
    if (step === 7 && (st.drops_opened || 0) > 0 && !drop) setStep(8);
    if (step === 9 && ((steal && !steal.result && steal.phase === 'carry') || stole)) setStep(10);
    if (step === 10 && stole && (!steal || steal.result)) setStep(11);
  }, [me, drop, steal, step, open]);

  if (!open || !me || !cur) return null;
  if (drop || (steal && steal.result)) return null;
  const advance = () => {
    play('click');
    cur.onButton?.();
    if (cur.waitFor) return; // the action itself moves us on
    if (step >= 12) {
      tutorial(12).catch(() => {});
      setG({ tutorialOpen: false });
      openPanel(null);
      return;
    }
    setStep(step + 1);
  };
  const skip = () => {
    tutorial(12).catch(() => {});
    setG({ tutorialOpen: false });
  };
  const side = !!panel;
  return (
    <div className={'tutorial' + (side ? ' side' : '')} data-testid="tutorial">
      <div className="row between">
        <span className="steps">TUTORIAL · {step}/12</span>
        <button className="btn ghost small" onClick={skip}>SKIP</button>
      </div>
      <h3>{cur.title}</h3>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        {cur.item && <ItemIcon id={cur.item} size={72} />}
        <p className="grow">{cur.body}</p>
      </div>
      {cur.hint && <div className="muted" style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{cur.hint}</div>}
      {cur.button && (
        <button className="btn primary block big" onClick={advance} data-testid="tutorial-next">{cur.button}</button>
      )}
      {cur.waitFor && (
        <div className="muted tut-wait" style={{ fontWeight: 800 }}>⏳ Waiting for you to {WAIT_TEXT[cur.waitFor]}…</div>
      )}
    </div>
  );
}
