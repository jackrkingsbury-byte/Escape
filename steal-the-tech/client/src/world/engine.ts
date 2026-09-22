// The 2.5D world: loop, camera, input, avatars, bases and effects.
import type { CatalogItem, Rarity, WorldPlayer, PlayerItem } from '../backend/types';
import { G, setG, openPanel, toClient, price, type PanelId } from '../game/store';
import { RARITY } from '../game/rarity';
import { shortMoney, hashHue, duration, perSec } from '../game/format';
import { play } from '../game/sound';
import {
  WORLD_W, WORLD_H, ZONES, PLOTS, COLLIDERS, PLOT_W, PLOT_H, SPAWN, inRect, plotRect, plotDoor, plotInside, slotPos,
  type PlotDef, type Rect, type ZoneId,
} from './layout';
import {
  drawGround, drawRoads, drawPlaza, drawPlazaHologram, drawMarket, drawDropZone, drawDropMachine, drawRaidBoard,
  drawTradeHub, drawStage, drawObelisk, drawKiosk, drawMuseum, drawLamp, drawTree, drawPlotFloor, drawPad,
  drawPlacedItem, drawSecurity, drawShield, drawSign, drawAvatar, glow, text, itemDrawSize,
  type ThemeColors, type DropMachineInfo,
} from './draw';
import { useWorldUI } from './ui';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  kind: 'spark' | 'text' | 'confetti' | 'smoke';
  text?: string;
  rot?: number;
}

interface Walker {
  id: string;
  name: string;
  hue: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  speed: number;
  walk: number;
  dir: number;
  wait: number;
  level: number;
}

interface Hit {
  x: number;
  y: number;
  w: number;
  h: number;
  playerItemId: string;
  itemId: string;
  ownerId: string;
  ownerName: string;
  mine: boolean;
}

const ZONE_PANEL: Record<ZoneId, PanelId> = {
  market: 'market',
  drops: 'drops',
  raid: 'raid',
  trade: 'trade',
  event: 'event',
  leaderboard: 'leaderboard',
  quests: 'quests',
  collection: 'collection',
};

const SHOPKEEPERS = [
  { x: 1900, y: 1030, hat: '🎩', name: 'Max the Broker', lines: ['Prices move every few seconds.', 'Buy low, sell to someone else.', 'Low supply + high demand = 📈'] },
  { x: 2390, y: 1600, hat: '📦', name: 'Dropmaster Dee', lines: ['Feeling lucky?', 'Secrets are out there…', 'Event Drops only during events!'] },
  { x: 1190, y: 1330, hat: '🕶️', name: 'The Fixer', lines: ['Everyone has something worth taking.', 'Security slows you down. Revenge speeds you up.', 'Check the board.'] },
  { x: 1170, y: 1745, hat: '🧢', name: 'Deal-Maker Dex', lines: ['Both sides must confirm.', 'Fair trades make friends.', 'NPCs love a premium offer.'] },
  { x: 2120, y: 2120, hat: '🎤', name: 'MC Volt', lines: ['Events shake up the market!', 'Stay tuned for the next event.', 'Make some noise!'] },
];

const LAMPS: [number, number][] = [];
for (let x = 700; x < 2950; x += 280) {
  LAMPS.push([x, 555]);
  LAMPS.push([x, 2255]);
}
for (let y = 700; y < 2200; y += 300) {
  LAMPS.push([610, y]);
  LAMPS.push([2990, y]);
}
const TREES: [number, number, number][] = [
  [1300, 1500, 150], [2300, 1750, 290], [1300, 1100, 180], [2300, 1050, 300], [1450, 1700, 160], [2200, 1900, 270],
  [650, 2100, 150], [2950, 2100, 300], [650, 700, 170], [2950, 700, 280],
];

export class WorldEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;
  private t = 0;
  private dpr = 1;
  private vw = 0;
  private vh = 0;

  // player
  px = SPAWN.x;
  py = SPAWN.y;
  private walk = 0;
  private dir = 1;
  private moving = false;
  private target: { x: number; y: number; zone?: ZoneId; plotId?: string } | null = null;
  private keys = new Set<string>();
  private joy = { x: 0, y: 0 };
  private stepTimer = 0;

  // camera
  camX = SPAWN.x;
  camY = SPAWN.y;
  zoom = 1;
  private shake = 0;

  private particles: Particle[] = [];
  private walkers: Walker[] = [];
  private hits: Hit[] = [];
  private plotOwner = new Map<number, WorldPlayer>();
  private ownerPlot = new Map<string, PlotDef>();
  private cashTimer = 0;
  private bubble: { i: number; line: string; until: number } | null = null;
  private lastSteal: string | null = null;
  private carrying: { item: CatalogItem; until: number } | null = null;
  private emote: { e: string; until: number } | null = null;
  private lastFocus: string | null = null;
  private lastRaidFx: string | null = null;
  private lastWorldAt = 0;
  private unsub: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerleave', () => useWorldUI.setState({ hover: null }));
    canvas.addEventListener('wheel', this.onWheel, { passive: true });
    // Start at my base.
    this.px = SPAWN.x;
    this.py = SPAWN.y;
    this.unsub = null;
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.unsub?.();
  }

  // ── Public API used by React ─────────────────────────────────────────
  setJoystick(x: number, y: number) {
    this.joy = { x, y };
    if (x || y) this.target = null;
  }

  interact() {
    const p = useWorldUI.getState().prompt;
    if (!p) return;
    play('click');
    if (p.kind === 'zone') openPanel(ZONE_PANEL[p.id as ZoneId]);
    else if (p.mine) openPanel('base');
    else openPanel('visit', { playerId: p.playerId });
  }

  doEmote(e: string) {
    this.emote = { e, until: performance.now() + 3000 };
    this.burst(this.px, this.py - 80, 10, '#fde047');
  }

  travelTo(x: number, y: number) {
    useWorldUI.setState({ fade: 1 });
    play('whoosh');
    window.setTimeout(() => {
      this.px = x;
      this.py = y;
      this.camX = x;
      this.camY = y;
      this.target = null;
      useWorldUI.setState({ fade: 0 });
    }, 180);
  }

  travelToZone(id: ZoneId) {
    const z = ZONES.find((z) => z.id === id);
    if (z) this.travelTo(z.anchor.x, z.anchor.y);
  }

  travelHome() {
    this.travelTo(SPAWN.x, SPAWN.y);
  }

  plotOf(playerId: string): PlotDef | undefined {
    return this.ownerPlot.get(playerId);
  }

  // ── Input ─────────────────────────────────────────────────────────────
  private resize = () => {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, G().settings.quality === 'low' ? 1 : 2);
    this.vw = Math.max(1, r.width);
    this.vh = Math.max(1, r.height);
    this.canvas.width = Math.round(this.vw * this.dpr);
    this.canvas.height = Math.round(this.vh * this.dpr);
    const base = Math.min(this.vw / 1250, this.vh / 820);
    this.zoom = Math.max(0.42, Math.min(1.05, base * 0.95));
  };

  private typing(e: KeyboardEvent) {
    const el = e.target as HTMLElement | null;
    return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
  }

  private onKey = (e: KeyboardEvent) => {
    if (this.typing(e)) return;
    const k = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
      if (G().panel && k.startsWith('arrow')) return;
      this.keys.add(k);
      this.target = null;
      e.preventDefault();
    } else if ((k === 'e' || k === ' ' || k === 'enter') && !G().panel) {
      this.interact();
      e.preventDefault();
    }
  };
  private onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase());
  private onBlur = () => this.keys.clear();

  private toWorld(clientX: number, clientY: number) {
    const r = this.canvas.getBoundingClientRect();
    const sx = clientX - r.left;
    const sy = clientY - r.top;
    return { x: (sx - this.vw / 2) / this.zoom + this.camX, y: (sy - this.vh / 2) / this.zoom + this.camY, sx, sy };
  }

  private hitAt(wx: number, wy: number): Hit | null {
    for (let i = this.hits.length - 1; i >= 0; i--) {
      const h = this.hits[i];
      if (wx >= h.x && wx <= h.x + h.w && wy >= h.y && wy <= h.y + h.h) return h;
    }
    return null;
  }

  private onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const w = this.toWorld(e.clientX, e.clientY);
    const hit = this.hitAt(w.x, w.y);
    if (hit) {
      play('click');
      useWorldUI.setState({ selected: { ...hit, sx: w.sx, sy: w.sy } });
      return;
    }
    useWorldUI.setState({ selected: null });
    const zone = ZONES.find((z) => inRect(w.x, w.y, z.trigger) || this.zoneBuildingHit(z.id, w.x, w.y));
    if (zone) {
      this.target = { x: zone.anchor.x, y: zone.anchor.y, zone: zone.id };
      return;
    }
    this.target = { x: w.x, y: w.y };
    this.burst(w.x, w.y, 5, '#67e8f9', 'spark', 0.4);
  };

  private zoneBuildingHit(id: ZoneId, x: number, y: number) {
    const boxes: Partial<Record<ZoneId, Rect>> = {
      market: { x: 1440, y: 680, w: 720, h: 280 },
      drops: { x: 2380, y: 1080, w: 620, h: 280 },
      raid: { x: 700, y: 1000, w: 460, h: 220 },
      trade: { x: 720, y: 1480, w: 420, h: 150 },
      event: { x: 1500, y: 1700, w: 600, h: 330 },
      leaderboard: { x: 1490, y: 990, w: 70, h: 230 },
      quests: { x: 2040, y: 1110, w: 80, h: 110 },
      collection: { x: 2030, y: 1510, w: 110, h: 110 },
    };
    const b = boxes[id];
    return b ? inRect(x, y, b) : false;
  }

  private onPointerMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    const w = this.toWorld(e.clientX, e.clientY);
    const hit = this.hitAt(w.x, w.y);
    const cur = useWorldUI.getState().hover;
    if (hit) {
      if (!cur || cur.itemId !== hit.itemId || Math.abs(cur.sx - w.sx) > 4 || Math.abs(cur.sy - w.sy) > 4) {
        useWorldUI.setState({ hover: { itemId: hit.itemId, ownerName: hit.ownerName, sx: w.sx, sy: w.sy } });
      }
      this.canvas.style.cursor = 'pointer';
    } else {
      if (cur) useWorldUI.setState({ hover: null });
      const zone = ZONES.find((z) => inRect(w.x, w.y, z.trigger) || this.zoneBuildingHit(z.id, w.x, w.y));
      this.canvas.style.cursor = zone ? 'pointer' : 'default';
    }
  };

  private onWheel = (e: WheelEvent) => {
    this.zoom = Math.max(0.35, Math.min(1.8, this.zoom * (e.deltaY > 0 ? 0.92 : 1.08)));
  };

  // ── Effects ──────────────────────────────────────────────────────────
  burst(x: number, y: number, n: number, color: string, kind: Particle['kind'] = 'spark', speed = 1) {
    if (G().settings.quality === 'low') n = Math.ceil(n / 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = (40 + Math.random() * 160) * speed;
      this.particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (kind === 'confetti' ? 120 : 30),
        life: 0, max: 0.6 + Math.random() * 0.9, color: kind === 'confetti' ? `hsl(${Math.random() * 360},90%,60%)` : color,
        size: kind === 'confetti' ? 4 + Math.random() * 3 : 2 + Math.random() * 3, kind, rot: Math.random() * 6,
      });
    }
  }

  floatText(x: number, y: number, s: string, color: string) {
    this.particles.push({ x, y, vx: 0, vy: -40, life: 0, max: 1.6, color, size: 16, kind: 'text', text: s });
  }

  // ── Loop ─────────────────────────────────────────────────────────────
  private frame = (now: number) => {
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min(0.05, (now - (this.last || now)) / 1000);
    this.last = now;
    this.t += dt;
    try {
      this.update(dt, now);
      this.render(now);
    } catch (e) {
      console.error(e);
    }
  };

  private assignPlots() {
    const s = G();
    if (s.worldAt === this.lastWorldAt) return;
    this.lastWorldAt = s.worldAt;
    const me = s.me;
    this.plotOwner.clear();
    this.ownerPlot.clear();
    const mine = s.world.find((p) => p.id === me?.id);
    if (mine) {
      this.plotOwner.set(0, mine);
      this.ownerPlot.set(mine.id, PLOTS[0]);
    }
    const others = s.world.filter((p) => p.id !== me?.id);
    const rick = others.find((p) => p.username === 'RookieRick');
    const humans = others.filter((p) => !p.is_bot);
    const bots = others.filter((p) => p.is_bot && p !== rick);
    const order = [...(rick ? [rick] : []), ...humans, ...bots];
    order.slice(0, PLOTS.length - 1).forEach((p, i) => {
      this.plotOwner.set(i + 1, p);
      this.ownerPlot.set(p.id, PLOTS[i + 1]);
    });
    // NPC walkers for bots
    const have = new Set(this.walkers.map((w) => w.id));
    for (const b of bots.slice(0, 9)) {
      if (have.has(b.id)) continue;
      const pl = this.ownerPlot.get(b.id);
      const d = pl ? plotDoor(pl) : { x: 1800, y: 1400 };
      this.walkers.push({ id: b.id, name: b.username, hue: hashHue(b.id), x: d.x, y: d.y, tx: d.x, ty: d.y, speed: 70 + Math.random() * 50, walk: 0, dir: 1, wait: Math.random() * 3, level: b.level });
    }
  }

  private collide(x: number, y: number) {
    for (const c of COLLIDERS) if (inRect(x, y, c, 8)) return true;
    return false;
  }

  private update(dt: number, now: number) {
    const s = G();
    this.assignPlots();
    // focus requests (tutorial / visiting)
    if (s.focusPlot && s.focusPlot !== this.lastFocus) {
      this.lastFocus = s.focusPlot;
      const pl = this.ownerPlot.get(s.focusPlot);
      if (pl) {
        const inside = plotInside(pl);
        this.travelTo(inside.x, inside.y);
      }
      window.setTimeout(() => {
        setG({ focusPlot: null });
        this.lastFocus = null;
      }, 400);
    }

    // movement
    let mx = 0;
    let my = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) mx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) mx += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) my -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) my += 1;
    if (this.joy.x || this.joy.y) {
      mx = this.joy.x;
      my = this.joy.y;
    }
    if (!mx && !my && this.target) {
      const dx = this.target.x - this.px;
      const dy = this.target.y - this.py;
      const d = Math.hypot(dx, dy);
      if (d < 10) {
        const tg = this.target;
        this.target = null;
        if (tg.zone) openPanel(ZONE_PANEL[tg.zone]);
      } else {
        mx = dx / d;
        my = dy / d;
      }
    }
    const len = Math.hypot(mx, my);
    this.moving = len > 0.05;
    if (this.moving) {
      const speed = 320 * Math.min(1, len);
      const nx = mx / Math.max(1, len);
      const ny = my / Math.max(1, len);
      const tx = Math.max(20, Math.min(WORLD_W - 20, this.px + nx * speed * dt));
      const ty = Math.max(40, Math.min(WORLD_H - 20, this.py + ny * speed * dt));
      if (!this.collide(tx, this.py)) this.px = tx;
      else if (this.target) this.target = null;
      if (!this.collide(this.px, ty)) this.py = ty;
      else if (this.target) this.target = null;
      this.walk += dt * 6;
      if (Math.abs(nx) > 0.1) this.dir = nx > 0 ? 1 : -1;
      this.stepTimer += dt;
      if (this.stepTimer > 0.32) {
        this.stepTimer = 0;
        if (s.settings.quality === 'high') this.trail();
      }
    }

    // camera
    const k = 1 - Math.exp(-dt * 6);
    this.camX += (this.px - this.camX) * k;
    this.camY += (this.py - 40 - this.camY) * k;
    this.shake = Math.max(0, this.shake - dt * 2);

    // prompts
    this.updatePrompt();

    // walkers
    for (const w of this.walkers) {
      if (w.wait > 0) {
        w.wait -= dt;
        continue;
      }
      const dx = w.tx - w.x;
      const dy = w.ty - w.y;
      const d = Math.hypot(dx, dy);
      if (d < 8) {
        w.wait = 2 + Math.random() * 5;
        const choices = [...ZONES.map((z) => z.anchor), { x: 1800 + (Math.random() - 0.5) * 300, y: 1400 + 180 }];
        const pl = this.ownerPlot.get(w.id);
        if (pl && Math.random() < 0.3) choices.push(plotDoor(pl));
        const c = choices[Math.floor(Math.random() * choices.length)];
        w.tx = c.x + (Math.random() - 0.5) * 80;
        w.ty = c.y + (Math.random() - 0.5) * 40;
      } else {
        w.x += (dx / d) * w.speed * dt;
        w.y += (dy / d) * w.speed * dt;
        w.walk += dt * 5;
        w.dir = dx > 0 ? 1 : -1;
      }
    }

    // particles
    for (const p of this.particles) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'confetti') p.vy += 260 * dt;
      else if (p.kind === 'spark') {
        p.vx *= 0.92;
        p.vy *= 0.92;
      }
    }
    this.particles = this.particles.filter((p) => p.life < p.max);

    // floating income over my base
    this.cashTimer += dt;
    if (this.cashTimer > 3) {
      this.cashTimer = 0;
      this.incomePops();
    }

    // steal / raid effects
    const st = s.steal;
    if (st && st.raidId !== this.lastSteal) {
      this.lastSteal = st.raidId;
      const pl = this.ownerPlot.get(st.defenderId);
      if (pl) {
        const owner = this.plotOwner.get(pl.index);
        const it = owner?.items.find((i) => i.id === st.playerItemId);
        const pos = it ? slotPos(pl, owner!.slots, it.slot) : plotInside(pl);
        this.travelTo(pos.x + 30, pos.y + 24);
      }
    }
    if (st?.result && st.raidId === this.lastSteal && !(st as any)._fx) {
      (st as any)._fx = true;
      if (st.result.status === 'success') {
        const it = s.itemsById[st.itemId];
        if (it) this.carrying = { item: it, until: now + 5000 };
        this.burst(this.px, this.py - 60, 60, '#fde047', 'confetti');
        this.shake = 0.6;
      } else {
        this.burst(this.px, this.py - 40, 30, '#94a3b8', 'smoke', 0.6);
        this.shake = 0.4;
      }
    }
    const inc = s.last?.incoming_raids[0];
    if (inc && inc.id !== this.lastRaidFx) {
      this.lastRaidFx = inc.id;
      this.shake = 0.8;
    }
  }

  private trail() {
    const me = G().me;
    const tr = me?.cosmetics?.trail;
    if (!tr || tr === 'trail-none') return;
    const c = tr === 'trail-cash' ? '#4ade80' : tr === 'trail-glitch' ? '#22d3ee' : tr === 'trail-comet' ? '#c084fc' : '#fde047';
    if (tr === 'trail-cash') this.particles.push({ x: this.px, y: this.py - 10, vx: 0, vy: -20, life: 0, max: 0.9, color: c, size: 12, kind: 'text', text: '$' });
    else this.burst(this.px, this.py - 12, 4, c, 'spark', 0.3);
  }

  private incomePops() {
    const s = G();
    const me = s.me;
    const pl = PLOTS[0];
    if (!me) return;
    const bonus = 1 + (me.income_bonus || 0);
    const view = this.viewRect();
    if (!inRect(pl.x + PLOT_W / 2, pl.y + PLOT_H / 2, view, 300)) return;
    for (const pi of s.myItems) {
      if (pi.location !== 'display' || pi.slot == null) continue;
      const it = s.itemsById[pi.item_id];
      if (!it) continue;
      const pos = slotPos(pl, me.slots, pi.slot);
      this.floatText(pos.x + (Math.random() - 0.5) * 16, pos.y - itemDrawSize(it, pos.cell) - 6, '+' + shortMoney(it.base_income * bonus * 3), '#4ade80');
    }
  }

  private updatePrompt() {
    const ui = useWorldUI.getState();
    let prompt: typeof ui.prompt = null;
    let here: typeof ui.here = null;
    for (const z of ZONES) {
      if (inRect(this.px, this.py, z.trigger)) {
        prompt = { kind: 'zone', id: z.id, label: z.label, icon: z.icon };
        break;
      }
    }
    if (!prompt) {
      for (const [idx, owner] of this.plotOwner) {
        const pl = PLOTS[idx];
        if (inRect(this.px, this.py, plotRect(pl), 10)) {
          const mine = idx === 0;
          prompt = { kind: 'plot', id: owner.id, label: mine ? 'MY BASE' : `${owner.username}'s BASE`, icon: mine ? '🏠' : '🥷', playerId: owner.id, mine };
          here = { playerId: owner.id, name: owner.username, mine };
          break;
        }
      }
    }
    if (prompt?.id !== ui.prompt?.id || here?.playerId !== ui.here?.playerId) useWorldUI.setState({ prompt, here });
  }

  private viewRect(): Rect {
    const w = this.vw / this.zoom;
    const h = this.vh / this.zoom;
    return { x: this.camX - w / 2, y: this.camY - h / 2, w, h };
  }

  // ── Render ───────────────────────────────────────────────────────────
  private theme(p: WorldPlayer): ThemeColors {
    const cos = G().catalog?.cosmetics || [];
    const find = (id?: string) => cos.find((c) => c.id === id)?.data || {};
    const th = find(p.cosmetics?.theme || 'theme-neon');
    return {
      floor: th.floor || '#131a2e',
      wall: th.wall || '#1e293b',
      wallPattern: find(p.cosmetics?.wall).pattern || 'panel',
      glow: th.glow || '#22d3ee',
      pattern: find(p.cosmetics?.floor).pattern || 'grid',
      light: find(p.cosmetics?.lighting).color || th.glow || '#22d3ee',
      platform: find(p.cosmetics?.platform).style || 'basic',
    };
  }

  private render(now: number) {
    const c = this.ctx;
    const s = G();
    const quality = s.settings.quality;
    const t = s.settings.reduceMotion ? this.t * 0.25 : this.t;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.fillStyle = '#070b16';
    c.fillRect(0, 0, this.vw, this.vh);
    const sh = s.settings.reduceMotion ? 0 : this.shake * 8;
    const ox = (Math.random() - 0.5) * sh;
    const oy = (Math.random() - 0.5) * sh;
    c.setTransform(this.dpr * this.zoom, 0, 0, this.dpr * this.zoom, this.dpr * (this.vw / 2 - this.camX * this.zoom + ox), this.dpr * (this.vh / 2 - this.camY * this.zoom + oy));
    const view = this.viewRect();

    drawGround(c, view, t, quality);
    drawRoads(c, t);
    drawPlaza(c, t, undefined, quality);
    // zone floors
    const ev = s.last?.event || null;
    const machines = this.machines();
    drawDropZone(c, t, machines, quality);

    // plot floors + pads (ground layer)
    this.hits = [];
    const sprites: { y: number; draw: () => void }[] = [];
    const me = s.me;
    const nowServer = Date.now();
    for (const [idx, owner] of this.plotOwner) {
      const pl = PLOTS[idx];
      if (!inRect(pl.x + PLOT_W / 2, pl.y + PLOT_H / 2, view, PLOT_W)) continue;
      const mine = idx === 0;
      const th = this.theme(owner);
      drawPlotFloor(c, pl, th, t, mine, true);
      const items = mine && me ? this.myDisplayed() : owner.items;
      const slots = mine && me ? me.slots : owner.slots;
      const bySlot = new Map(items.map((i) => [i.slot, i]));
      const fx = (s.catalog?.cosmetics.find((x) => x.id === owner.cosmetics?.item_fx)?.data.style) || '';
      for (let i = 0; i < slots; i++) {
        const pos = slotPos(pl, slots, i);
        const pi = bySlot.get(i);
        const it = pi ? s.itemsById[pi.item_id] : undefined;
        drawPad(c, pos.x, pos.y, pos.cell, it ? (it.rarity as Rarity) : null, th.platform, t, !it, false);
        if (it && pi) {
          const underRaid = !!(pi as any).under_raid || (mine && s.last?.incoming_raids.some((r) => r.player_item_id === pi.id));
          const hot = !!pi.hot_until && toClient(pi.hot_until) > nowServer;
          sprites.push({
            y: pos.y,
            draw: () => {
              const r = drawPlacedItem(c, it, pos.x, pos.y, pos.cell, t, quality, fx, hot);
              if (underRaid) {
                c.strokeStyle = `rgba(239,68,68,${0.6 + 0.4 * Math.sin(t * 12)})`;
                c.lineWidth = 3;
                c.strokeRect(r.cx - r.size / 2, r.cy - r.size / 2, r.size, r.size);
              }
            },
          });
          const size = itemDrawSize(it, pos.cell);
          this.hits.push({ x: pos.x - size / 2, y: pos.y - size * 0.92, w: size, h: size * 0.95, playerItemId: pi.id, itemId: it.id, ownerId: owner.id, ownerName: owner.username, mine });
        }
      }
      sprites.push({ y: pl.door === 'top' ? pl.y + PLOT_H - 20 : pl.y + 20, draw: () => drawSign(c, pl, owner.username, shortMoney(mine && me ? me.base_value : owner.base_value), `SEC ${mine && me ? me.security_level : owner.security_level}`, th.light === 'rainbow' ? '#e879f9' : th.light, owner.is_bot, mine) });
      const secLvl = mine && me ? me.security_level : owner.security_level;
      const doorY = pl.door === 'bottom' ? pl.y + PLOT_H : pl.door === 'top' ? pl.y : pl.y + PLOT_H / 2 + 55;
      sprites.push({ y: doorY, draw: () => drawSecurity(c, pl, secLvl, t, quality) });
      const shieldUntil = mine && me ? me.shield_until : owner.shield_until;
      if (shieldUntil && toClient(shieldUntil) > nowServer) {
        sprites.push({ y: pl.y + PLOT_H + 1, draw: () => {
          drawShield(c, pl, t);
          text(c, '🛡️ SHIELDED ' + duration(toClient(shieldUntil) - Date.now()), pl.x + PLOT_W / 2, pl.door === 'top' ? pl.y + 18 : pl.y + PLOT_H - 16, 14, '#bfdbfe', { stroke: '#0b1020' });
        } });
      }
      if (!mine && owner.protected) {
        sprites.push({ y: pl.y + PLOT_H + 2, draw: () => text(c, '🐣 NEW PLAYER — PROTECTED', pl.x + PLOT_W / 2, pl.door === 'top' ? pl.y + 36 : pl.y + PLOT_H - 16, 13, '#fde68a', { stroke: '#0b1020' }) });
      }
      if (mine && me) {
        const vaultUsed = s.myItems.filter((i) => i.location === 'vault').length;
        sprites.push({ y: pl.y + PLOT_H - 30, draw: () => {
          c.fillStyle = '#334155';
          c.fillRect(pl.x + PLOT_W - 70, pl.y + PLOT_H - 70, 50, 44);
          c.fillStyle = '#94a3b8';
          c.beginPath();
          c.arc(pl.x + PLOT_W - 45, pl.y + PLOT_H - 48, 12, 0, Math.PI * 2);
          c.fill();
          text(c, `🔒 ${vaultUsed}/${me.vault_capacity}`, pl.x + PLOT_W - 45, pl.y + PLOT_H - 82, 12, '#e2e8f0', { stroke: '#0b1020' });
        } });
      }
    }

    // static structures
    const ticker = this.ticker();
    sprites.push({ y: 950, draw: () => drawMarket(c, t, ticker, quality) });
    machines.forEach((m, i) => {
      const mx = 2440 + i * 100;
      sprites.push({ y: 1330, draw: () => drawDropMachine(c, m, mx, 1330, t, quality) });
    });
    const targets = this.boardTargets();
    sprites.push({ y: 1220, draw: () => drawRaidBoard(c, t, targets, quality) });
    sprites.push({ y: 1630, draw: () => drawTradeHub(c, t, quality) });
    const evInfo = ev ? { title: ev.title, icon: ev.icon, left: duration(toClient(ev.ends_at) - Date.now()) } : null;
    const nextIn = s.last?.next_event_at ? duration(toClient(s.last.next_event_at) - Date.now()) : '—';
    sprites.push({ y: 2030, draw: () => drawStage(c, t, evInfo, nextIn, quality) });
    const top = [...s.world].sort((a, b) => b.base_value - a.base_value).map((p) => p.username);
    sprites.push({ y: 1215, draw: () => drawObelisk(c, t, top, quality) });
    sprites.push({ y: 1210, draw: () => drawKiosk(c, t, s.last?.quests_claimable || 0, quality) });
    const totalItems = s.catalog ? s.catalog.items.filter((i) => i.droppable || i.event_only).length : 1;
    sprites.push({ y: 1615, draw: () => drawMuseum(c, t, Math.round(((me?.collection_count || 0) / totalItems) * 100), quality) });
    const hero = s.itemsById['quantum-120-void-oled'];
    sprites.push({ y: 1400, draw: () => drawPlazaHologram(c, t, hero, quality) });
    for (const [lx, ly] of LAMPS) if (inRect(lx, ly, view, 100)) sprites.push({ y: ly, draw: () => drawLamp(c, lx, ly, t, '#fde68a', quality) });
    for (const [tx, ty, hue] of TREES) if (inRect(tx, ty, view, 100)) sprites.push({ y: ty, draw: () => drawTree(c, tx, ty, t, hue) });

    // shopkeepers
    if (!this.bubble || now > this.bubble.until) {
      if (Math.random() < 0.004) {
        const i = Math.floor(Math.random() * SHOPKEEPERS.length);
        const l = SHOPKEEPERS[i].lines;
        this.bubble = { i, line: l[Math.floor(Math.random() * l.length)], until: now + 4000 };
      }
    }
    SHOPKEEPERS.forEach((npc, i) => {
      if (!inRect(npc.x, npc.y, view, 100)) return;
      sprites.push({ y: npc.y, draw: () => {
        drawAvatar(c, { x: npc.x, y: npc.y, hue: 40 + i * 60, dir: -1, walk: 0, moving: false, name: npc.name, npcHat: npc.hat }, t, s.settings.showNames);
        if (this.bubble && this.bubble.i === i && now < this.bubble.until) this.speech(npc.x, npc.y - 110, this.bubble.line);
      } });
    });

    // walkers (NPC bots)
    for (const w of this.walkers) {
      if (!inRect(w.x, w.y, view, 80)) continue;
      sprites.push({ y: w.y, draw: () => drawAvatar(c, { x: w.x, y: w.y, hue: w.hue, dir: w.dir, walk: w.walk, moving: w.wait <= 0, name: w.name, level: w.level, bot: true }, t, s.settings.showNames) });
    }

    // online peers
    const b = s.backend;
    if (b?.presence && me) {
      b.presence.update({ id: me.id, name: me.username, x: Math.round(this.px), y: Math.round(this.py), dir: this.dir, moving: this.moving, emote: this.emote && now < this.emote.until ? this.emote.e : null, trail: me.cosmetics?.trail });
      for (const p of b.presence.peers()) {
        if (!inRect(p.x, p.y, view, 80)) continue;
        sprites.push({ y: p.y, draw: () => drawAvatar(c, { x: p.x, y: p.y, hue: hashHue(p.id), dir: p.dir, walk: this.t * 5, moving: p.moving, name: p.name, emote: p.emote }, t, s.settings.showNames) });
      }
    }

    // raider at my base
    const inc = s.last?.incoming_raids[0];
    if (inc) {
      const pl = PLOTS[0];
      const pi = s.myItems.find((i) => i.id === inc.player_item_id);
      if (pi && pi.slot != null && me) {
        const pos = slotPos(pl, me.slots, pi.slot);
        const start = toClient(inc.started_at);
        const end = toClient(inc.ends_at);
        const prog = Math.max(0, Math.min(1, (Date.now() - start) / Math.max(1, end - start)));
        sprites.push({ y: pos.y + 20, draw: () => {
          glow(c, pos.x, pos.y - 30, 120, 'rgba(239,68,68,0.5)', 0.6 + 0.3 * Math.sin(t * 10));
          drawAvatar(c, { x: pos.x - 34, y: pos.y + 20, hue: hashHue(inc.attacker_id), dir: 1, walk: this.t * 8, moving: false, name: inc.attacker, bot: inc.attacker_bot, stealing: prog }, t, true);
        } });
      }
    }

    // me
    const st = s.steal;
    const stealing = st && !st.result ? Math.max(0, Math.min(1, (Date.now() - st.startedAt) / Math.max(1, st.endsAt - st.startedAt))) : null;
    if (this.carrying && now > this.carrying.until) this.carrying = null;
    if (me) {
      const np = s.catalog?.cosmetics.find((x) => x.id === me.cosmetics?.nameplate)?.data.style;
      sprites.push({ y: this.py, draw: () => drawAvatar(c, { x: this.px, y: this.py, hue: hashHue(me.id), dir: this.dir, walk: this.walk, moving: this.moving, name: me.username, level: me.level, nameplate: np, emote: this.emote && now < this.emote.until ? this.emote.e : null, carrying: this.carrying?.item, stealing, me: true }, t, true) });
    }

    sprites.sort((a, b) => a.y - b.y);
    for (const sp of sprites) sp.draw();

    // move target marker
    if (this.target) {
      c.strokeStyle = 'rgba(103,232,249,0.8)';
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(this.target.x, this.target.y, 14 + Math.sin(t * 6) * 3, 6, 0, 0, Math.PI * 2);
      c.stroke();
    }

    // particles
    for (const p of this.particles) {
      const a = 1 - p.life / p.max;
      c.globalAlpha = Math.max(0, a);
      if (p.kind === 'text') {
        text(c, p.text || '', p.x, p.y, p.size, p.color, { stroke: '#052e16', weight: 900 });
      } else if (p.kind === 'confetti') {
        c.fillStyle = p.color;
        c.save();
        c.translate(p.x, p.y);
        c.rotate((p.rot || 0) + p.life * 8);
        c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        c.restore();
      } else if (p.kind === 'smoke') {
        c.fillStyle = p.color;
        c.beginPath();
        c.arc(p.x, p.y, p.size * (1 + p.life * 4), 0, Math.PI * 2);
        c.fill();
      } else {
        c.fillStyle = p.color;
        c.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    c.globalAlpha = 1;

    // vignette (screen space)
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (quality === 'high') {
      const g = c.createRadialGradient(this.vw / 2, this.vh / 2, Math.min(this.vw, this.vh) * 0.35, this.vw / 2, this.vh / 2, Math.max(this.vw, this.vh) * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.55)');
      c.fillStyle = g;
      c.fillRect(0, 0, this.vw, this.vh);
    }
    if (inc) {
      c.fillStyle = `rgba(220,38,38,${0.08 + 0.08 * Math.sin(this.t * 8)})`;
      c.fillRect(0, 0, this.vw, this.vh);
    }
    this.minimap(c);
  }

  private speech(x: number, y: number, s: string) {
    const c = this.ctx;
    c.font = "700 14px 'Rajdhani', system-ui, sans-serif";
    const w = c.measureText(s).width + 20;
    c.fillStyle = 'rgba(255,255,255,0.95)';
    c.beginPath();
    c.roundRect?.(x - w / 2, y - 16, w, 30, 10);
    if (!c.roundRect) c.rect(x - w / 2, y - 16, w, 30);
    c.fill();
    text(c, s, x, y - 1, 14, '#0f172a', { weight: 700 });
  }

  private myDisplayed(): (PlayerItem & { slot: number })[] {
    return G().myItems.filter((i) => i.location === 'display' && i.slot != null) as any;
  }

  private machines(): DropMachineInfo[] {
    const s = G();
    const drops = s.catalog?.drops || [];
    const me = s.me;
    return drops.map((d) => ({
      id: d.id,
      name: d.name,
      price: shortMoney(d.price),
      locked: !me || me.level < d.min_level || (d.event_only && !s.last?.event) || (d.requires_key && (me.secret_keys || 0) < 1),
      tokens: me?.drop_tokens?.[d.id] || 0,
    }));
  }

  private ticker() {
    const s = G();
    const rows = Object.values(s.market)
      .filter((r) => {
        const it = s.itemsById[r.item_id];
        return it && RARITY[it.rarity as Rarity].tier >= 4;
      })
      .sort((a, b) => Math.abs(b.change_24h) - Math.abs(a.change_24h))
      .slice(0, 10);
    return rows.map((r) => ({ name: s.itemsById[r.item_id]?.name || r.item_id, change: r.change_24h, price: shortMoney(r.price) }));
  }

  private boardTargets() {
    const s = G();
    return [...s.world]
      .filter((p) => p.id !== s.me?.id)
      .sort((a, b) => b.base_value - a.base_value)
      .slice(0, 4)
      .map((p) => ({ name: p.username, value: shortMoney(p.base_value), sec: p.security_level, bot: p.is_bot }));
  }

  private minimap(c: CanvasRenderingContext2D) {
    if (this.vw < 700) return;
    const w = 170;
    const h = (w * WORLD_H) / WORLD_W;
    const x = this.vw - w - 16;
    const y = this.vh - h - 96;
    const sx = w / WORLD_W;
    const sy = h / WORLD_H;
    c.fillStyle = 'rgba(2,6,23,0.75)';
    c.fillRect(x - 4, y - 4, w + 8, h + 8);
    c.strokeStyle = 'rgba(56,189,248,0.4)';
    c.strokeRect(x - 4, y - 4, w + 8, h + 8);
    for (const [idx, owner] of this.plotOwner) {
      const p = PLOTS[idx];
      c.fillStyle = idx === 0 ? '#facc15' : owner.is_bot ? '#475569' : '#38bdf8';
      c.fillRect(x + p.x * sx, y + p.y * sy, PLOT_W * sx, PLOT_H * sy);
    }
    for (const z of ZONES) {
      c.fillStyle = '#e879f9';
      c.fillRect(x + z.anchor.x * sx - 2, y + z.anchor.y * sy - 2, 4, 4);
    }
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(x + this.px * sx, y + this.py * sy, 3.5, 0, Math.PI * 2);
    c.fill();
    const v = this.viewRect();
    c.strokeStyle = 'rgba(255,255,255,0.5)';
    c.strokeRect(x + v.x * sx, y + v.y * sy, v.w * sx, v.h * sy);
  }
}

export let engine: WorldEngine | null = null;
export function setEngine(e: WorldEngine | null) {
  engine = e;
}

export function priceOf(id: string) {
  return price(id);
}
export const incomeLabel = perSec;
