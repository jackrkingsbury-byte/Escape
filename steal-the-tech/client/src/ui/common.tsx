import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { CatalogItem, Rarity } from '../backend/types';
import { itemUrl } from '../art/items';
import { useGame, openPanel, item as catItem, price as mprice } from '../game/store';
import { RARITY } from '../game/rarity';
import { money, perSec, shortMoney } from '../game/format';
import { play } from '../game/sound';

export function ItemIcon({ id, size = 40, className = '' }: { id: string; size?: number; className?: string }) {
  const it = useGame((s) => s.itemsById[id]);
  if (!it) return <span style={{ width: size, height: size, display: 'inline-block' }} />;
  return <img className={'item-icon ' + className} src={itemUrl(it, size > 80 ? 160 : 96)} width={size} height={size} alt={it.name} draggable={false} />;
}

export function RarityLabel({ r }: { r: Rarity }) {
  return <span className={`rlabel r-${r}`}>{RARITY[r]?.label ?? r}</span>;
}

export function SupplyBadge({ it }: { it: CatalogItem }) {
  const minted = useGame((s) => s.market[it.id]?.minted);
  if (!it.max_supply) return null;
  return (
    <span className="supply">
      {minted ?? '?'}/{it.max_supply}
    </span>
  );
}

export function ItemCard({
  id, serial, onClick, selected, unknown, footer, badge, showIncome = true,
}: {
  id: string;
  serial?: number | null;
  onClick?: () => void;
  selected?: boolean;
  unknown?: boolean;
  footer?: ReactNode;
  badge?: ReactNode;
  showIncome?: boolean;
}) {
  const it = useGame((s) => s.itemsById[id]);
  const p = useGame((s) => s.market[id]?.price);
  if (!it) return null;
  const r = it.rarity as Rarity;
  return (
    <div className={`icard r-${r} ${selected ? 'sel' : ''} ${unknown ? 'unknown' : ''}`} onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className="corner">{badge}</div>
      <div className="corner-r">{!unknown && it.max_supply ? <SupplyBadge it={it} /> : null}</div>
      <img className="art" src={itemUrl(it, 160)} alt={unknown ? 'Unknown item' : it.name} draggable={false} />
      <div className="nm">{unknown ? '???' : it.name}</div>
      <div style={{ margin: '4px 0' }}>
        <RarityLabel r={r} />
        {serial ? <span className="dim" style={{ fontWeight: 800, fontSize: 12, marginLeft: 6 }}>#{serial}</span> : null}
      </div>
      {!unknown && (
        <>
          <div className="val">{shortMoney(p ?? it.base_value)}</div>
          {showIncome && <div className="inc">+{perSec(it.base_income)}</div>}
        </>
      )}
      {footer}
    </div>
  );
}

/** Press-and-hold button for irreversible actions (trades, big purchases, prestige). */
export function HoldButton({ children, onConfirm, className = 'btn primary big block', ms = 900, disabled }: { children: ReactNode; onConfirm: () => void; className?: string; ms?: number; disabled?: boolean }) {
  const [p, setP] = useState(0);
  const raf = useRef(0);
  const start = useRef(0);
  const done = useRef(false);
  const stop = () => {
    cancelAnimationFrame(raf.current);
    if (!done.current) setP(0);
  };
  const begin = () => {
    if (disabled) return;
    done.current = false;
    start.current = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - start.current) / ms);
      setP(k);
      if (k >= 1) {
        done.current = true;
        play('coin');
        onConfirm();
        window.setTimeout(() => setP(0), 300);
        return;
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return (
    <button
      className={className + ' hold'}
      disabled={disabled}
      onPointerDown={begin}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onConfirm();
        }
      }}
    >
      <i className="fill" style={{ transform: `scaleX(${p})` }} />
      <span>{p > 0 && p < 1 ? 'KEEP HOLDING…' : children}</span>
    </button>
  );
}

export function Panel({ title, icon, children, onClose, head }: { title: string; icon: string; children: ReactNode; onClose?: () => void; head?: ReactNode }) {
  return (
    <div className="panel-wrap">
      <div className="panel" role="dialog" aria-label={title}>
        <div className="panel-head">
          <span className="e">{icon}</span>
          <h2>{title}</h2>
          {head}
          <button className="icon-btn" aria-label="Close" onClick={() => { play('click'); (onClose || (() => openPanel(null)))(); }}>✕</button>
        </div>
        <div className="panel-body">{children}</div>
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; badge?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} className={value === t.id ? 'on' : ''} onClick={() => { play('tick'); onChange(t.id); }}>
          {t.label}
          {t.badge ? <span className="badge">{t.badge}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Stat({ k, v, cls = '' }: { k: string; v: ReactNode; cls?: string }) {
  return (
    <div className="stat">
      <div className="k">{k}</div>
      <div className={'v ' + cls}>{v}</div>
    </div>
  );
}

export function PlayerName({ id, name, bot, level }: { id: string; name: string; bot?: boolean; level?: number }) {
  return (
    <span className="row" style={{ gap: 6, display: 'inline-flex' }}>
      <b style={{ cursor: 'pointer' }} onClick={() => openPanel('profile', { playerId: id })}>{name}</b>
      {bot && <span className="tag bot">NPC</span>}
      {level ? <span className="tag">Lv {level}</span> : null}
    </span>
  );
}

export function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function ItemDetail({ id, serial, owned }: { id: string; serial?: number | null; owned?: number }) {
  const it = catItem(id);
  const m = useGame((s) => s.market[id]);
  if (!it) return null;
  return (
    <div className="col">
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div style={{ width: 130, flex: '0 0 130px' }}>
          <ItemCard id={id} serial={serial} showIncome={false} />
        </div>
        <div className="col grow" style={{ gap: 6 }}>
          <div style={{ fontWeight: 900, fontSize: 20 }}>{it.name}</div>
          <div className="muted" style={{ fontWeight: 700 }}>{it.brand} · {it.category} · {it.kind.replace('_', ' ')}</div>
          {it.flavor && <div style={{ fontStyle: 'italic', color: '#c7d2fe' }}>“{it.flavor}”</div>}
          <div className="stats">
            <Stat k="Market" v={money(m?.price ?? it.base_value)} />
            <Stat k="Base" v={money(it.base_value)} />
            <Stat k="Income" v={perSec(it.base_income)} cls="good-t" />
            <Stat k="Supply" v={it.max_supply ? `${m?.minted ?? '?'}/${it.max_supply}` : m?.supply ?? '—'} />
            {owned != null && <Stat k="You own" v={owned} />}
          </div>
          {!it.tradeable && <div className="tag">Soulbound · can't be sold, traded or stolen</div>}
        </div>
      </div>
    </div>
  );
}

// ── Price chart (single series: price over time) ─────────────────────
export function PriceChart({ points, height = 220 }: { points: [number, number][]; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(520);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const geo = useMemo(() => {
    if (points.length < 2) return null;
    const padL = 56;
    const padR = 58;
    const padT = 14;
    const padB = 26;
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    let y0 = Math.min(...ys);
    let y1 = Math.max(...ys);
    const span = y1 - y0 || y1 * 0.1 || 1;
    // clean ticks
    const step = niceStep(span / 4);
    y0 = Math.floor((y0 - span * 0.05) / step) * step;
    y1 = Math.ceil((y1 + span * 0.05) / step) * step;
    const ticks: number[] = [];
    for (let v = y0; v <= y1 + 1e-9; v += step) ticks.push(v);
    const X = (v: number) => padL + ((v - x0) / Math.max(1, x1 - x0)) * (w - padL - padR);
    const Y = (v: number) => padT + (1 - (v - y0) / Math.max(1e-9, y1 - y0)) * (height - padT - padB);
    const line = points.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join('');
    const area = `${line}L${X(x1)},${Y(y0)}L${X(x0)},${Y(y0)}Z`;
    return { X, Y, line, area, ticks, x0, x1, padL, padR, padT, padB };
  }, [points, w, height]);

  if (!geo) return <div className="empty">Not enough history yet — check back soon.</div>;
  const last = points[points.length - 1];
  const up = last[1] >= points[0][1];
  const stroke = '#22d3ee';
  const onMove = (e: React.PointerEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - r.left;
    let best = 0;
    let bd = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(geo.X(p[0]) - x);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    setHover(best);
  };
  const hp = hover != null ? points[hover] : null;
  const fmtT = (ms: number) => {
    const d = new Date(ms);
    const span = geo.x1 - geo.x0;
    return span > 3 * 86400e3 ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };
  return (
    <div className="chart-wrap" ref={ref} onPointerMove={onMove} onPointerLeave={() => setHover(null)} style={{ touchAction: 'pan-y' }}>
      <svg width={w} height={height} role="img" aria-label="Price history">
        {geo.ticks.map((v) => (
          <g key={v}>
            <line x1={geo.padL} x2={w - geo.padR} y1={geo.Y(v)} y2={geo.Y(v)} stroke="rgba(148,163,184,0.16)" strokeWidth={1} />
            <text x={geo.padL - 8} y={geo.Y(v) + 4} textAnchor="end" fill="#94a3b8" fontSize="12" fontWeight={700}>{shortMoney(v)}</text>
          </g>
        ))}
        <text x={geo.padL} y={height - 6} fill="#64748b" fontSize="12" fontWeight={700}>{fmtT(geo.x0)}</text>
        <text x={w - geo.padR} y={height - 6} fill="#64748b" fontSize="12" fontWeight={700} textAnchor="end">{fmtT(geo.x1)}</text>
        <path d={geo.area} fill={stroke} opacity={0.1} />
        <path d={geo.line} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={geo.X(last[0])} cy={geo.Y(last[1])} r={5} fill={stroke} stroke="#0a0f20" strokeWidth={2} />
        <text x={geo.X(last[0]) + 9} y={geo.Y(last[1]) + 4} fill="#e2e8f0" fontSize="13" fontWeight={800}>{shortMoney(last[1])}</text>
        {hp && (
          <>
            <line x1={geo.X(hp[0])} x2={geo.X(hp[0])} y1={geo.padT} y2={height - geo.padB} stroke="rgba(226,232,240,0.5)" strokeWidth={1} />
            <circle cx={geo.X(hp[0])} cy={geo.Y(hp[1])} r={5} fill={stroke} stroke="#0a0f20" strokeWidth={2} />
          </>
        )}
      </svg>
      {hp && (
        <div className="chart-tip" style={{ left: geo.X(hp[0]), top: geo.Y(hp[1]) }}>
          <b>{money(hp[1])}</b> <span className="muted">· {new Date(hp[0]).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )}
      <div className="dim" style={{ fontSize: 12, fontWeight: 700 }}>{up ? '▲' : '▼'} over this range · hover or drag for exact prices</div>
    </div>
  );
}

function niceStep(raw: number) {
  const p = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1e-9))));
  const n = raw / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

export const priceOf = mprice;
