// The 3D world: renderer, third-person controller, bases with podiums, the
// Tech Belt, NPC robots, thieves & chasers, and every bit of juice (coins,
// sparks, confetti, shake, bloom). The server decides outcomes; this file
// only shows them and sends your intents.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { BaseView, BeltItem, CatalogItem, IncomingRaid, PlayerItem, WorldPlayer } from '../backend/types';
import { G, setG, openPanel, toClient, price, pendingOf, itemRate, mutationDef, banner, type PanelId } from '../game/store';
import { RARITY } from '../game/rarity';
import { shortMoney, hashHue, perSec, duration } from '../game/format';
import { play, coinCombo, reveal } from '../game/sound';
import { buyBelt, collect, lockBase, abortSteal, deliverSteal, defend, fetchBase, startSteal } from '../game/actions';
import {
  BELT, PLOTS, PLOT_W, PLOT_D, SPAWN, WORLD, ZONES, beltX, circleHitsBox, collectPad, doorGate, inPlot, inZone, lockPad,
  platePos, plotDoor, plotInside, plotToWorld, slotPos, staticColliders, vaultPos, worldToPlot,
  type Box2, type PlotDef, type ZoneId,
} from './layout';
import {
  animateAvatar, buildAvatar, buildItem, buildPodium, canvasTex, gBox, gCyl, gRBox, gSph, glow, glowRing,
  rarityBeam, std, tickMutations, MUTATION_COLORS, type AvatarRig, type ItemModel, type PodiumModel,
} from './models';
import { buildScenery, type Scenery } from './scenery';
import { FX } from './fx';
import { LabelLayer, Pops } from './labels';
import { useWorldUI, type Prompt } from './ui';

const ZONE_PANEL: Record<ZoneId, PanelId> = {
  market: 'market', drops: 'drops', raid: 'raid', trade: 'trade', event: 'event', leaderboard: 'leaderboard', quests: 'quests', collection: 'collection',
};

const WALK = 7.2;
const SPRINT = 10.5;
const CARRY = 6.4;
const R = 0.45; // player radius

interface PodiumView {
  slot: number;
  pod: PodiumModel;
  pos: THREE.Vector3;
  plate: THREE.Vector3;
  size: number;
  sig: string;
  model: ItemModel | null;
  beam: THREE.Mesh | null;
  piid: string | null;
  itemId: string | null;
  mutation: string | null;
  tier: number;
  hidden: boolean;
}

interface PlotView {
  def: PlotDef;
  owner: WorldPlayer;
  mine: boolean;
  group: THREE.Group;
  podiums: PodiumView[];
  slots: number;
  themeSig: string;
  lasers: THREE.Group;
  shield: THREE.Mesh;
  gate: Box2;
  sec: THREE.Group;
  secLevel: number;
}

interface BeltView {
  row: BeltItem;
  it: CatalogItem;
  model: ItemModel;
  spawnedAt: number;
  endsAt: number;
  beam: THREE.Mesh | null;
  announced: boolean;
  leave: null | { from: THREE.Vector3; to: THREE.Vector3; t0: number; dur: number; fly: boolean };
  done: boolean;
  phase: number;
}

interface Walker {
  id: string;
  name: string;
  level: number;
  rig: AvatarRig;
  pos: THREE.Vector3;
  target: THREE.Vector3 | null;
  wait: number;
  speed: number;
  mode: 'wander' | 'thief' | 'chase' | 'stunned';
  raid: IncomingRaid | null;
  carry: ItemModel | null;
  carryKey: string;
  stun: number;
  stuck: number;
  lastPos: THREE.Vector3;
  ghost: boolean;
  facing: number;
  speedNow: number;
  bot: boolean;
}

interface Chaser {
  kind: 'owner' | 'drone';
  walker?: Walker;
  obj?: THREE.Group;
  pos: THREE.Vector3;
  speed: number;
  t: number;
}

interface PeerView {
  id: string;
  rig: AvatarRig;
  pos: THREE.Vector3;
  target: THREE.Vector3;
  facing: number;
  carry: ItemModel | null;
  carryId: string | null;
  seen: number;
}

const tmpV = new THREE.Vector3();
const tmpV2 = new THREE.Vector3();

export class WorldEngine {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(55, 1, 0.1, 700);
  private composer: EffectComposer | null = null;
  private bloom: UnrealBloomPass | null = null;
  private sun: THREE.DirectionalLight;
  private scenery: Scenery;
  private fx = new FX();
  private labels: LabelLayer;
  private pops: Pops;
  private minimap: HTMLCanvasElement;
  private raf = 0;
  private last = 0;
  private t = 0;
  private w = 1;
  private h = 1;
  private quality: 'high' | 'low' = 'high';
  private slowmo = 0;

  // player
  pos = new THREE.Vector3(SPAWN.x, 0, SPAWN.z);
  private vel = new THREE.Vector3();
  private vy = 0;
  private grounded = true;
  private facing = Math.PI;
  private rig: AvatarRig;
  private speedNow = 0;
  private keys = new Set<string>();
  private joy = { x: 0, y: 0 };
  private sprint = false;
  private target: { x: number; z: number; then?: () => void } | null = null;
  private chaseId: string | null = null;
  private beltFocus: number | null = null;
  private emote: { e: string; until: number } | null = null;
  private carryModel: ItemModel | null = null;
  private lastPromptKey = '';

  // camera
  private camYaw = Math.PI; // start looking into my base from the belt side
  private camPitch = 0.62;
  private camDist = 14;
  private yawGoal: number | null = null;
  private shake = 0;
  private fovKick = 0;
  private drag: { id: number; x: number; y: number; moved: boolean; button: number } | null = null;
  private touches = new Map<number, { x: number; y: number }>();
  private pinch = 0;

  // world
  private colliders: Box2[] = staticColliders();
  private plots = new Map<number, PlotView>();
  private assign = new Map<string, number>();
  private ownerPlot = new Map<string, PlotDef>();
  private lastWorldAt = -1;
  private lastItemsRef: PlayerItem[] | null = null;
  private lastMeSig = '';
  private belt = new Map<number, BeltView>();
  private lastBeltAt = -1;
  private walkers = new Map<string, Walker>();
  private shopkeepers: { rig: AvatarRig; pos: THREE.Vector3; lines: string[]; name: string; key: string }[] = [];
  private bubble: { i: number; until: number } | null = null;
  private peers = new Map<string, PeerView>();
  private chasers: Chaser[] = [];
  private chaseRaid = '';
  private pickables: THREE.Object3D[] = [];
  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  // gameplay bookkeeping
  private localAccrued = new Map<string, number>();
  private plateCooldown = new Map<string, number>();
  private onPlate: string | null = null;
  private onColPad = false;
  private combo = 0;
  private comboAt = 0;
  private lockCooldown = 0;
  private collectAllCooldown = 0;
  private baseInfo = new Map<string, { at: number; data: BaseView | null; loading: boolean }>();
  private tagged = new Set<string>();
  private lastStealSig = '';
  private deliverTry = 0;
  private grabPos: THREE.Vector3 | null = null;
  private lastSteal: string | null = null;
  private screensAt = 0;
  private homeAt = 0;
  private hoverAt = 0;
  private mapAt = 0;
  private lastFocus: string | null = null;
  private knock = new THREE.Vector3();
  private stepAt = 0;

  constructor(canvas: HTMLCanvasElement, overlay: HTMLElement) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.scene.background = new THREE.Color('#0a0f24');
    this.scene.fog = new THREE.Fog('#0a0f24', 70, 230);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.42;
    pmrem.dispose();

    const hemi = new THREE.HemisphereLight('#9db8ff', '#2a1740', 0.75);
    this.scene.add(hemi);
    this.sun = new THREE.DirectionalLight('#fff4e0', 1.25);
    this.sun.position.set(30, 60, 25);
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -38;
    sc.right = 38;
    sc.top = 38;
    sc.bottom = -38;
    sc.near = 1;
    sc.far = 160;
    this.sun.shadow.bias = -0.0008;
    this.scene.add(this.sun, this.sun.target);

    const s = G();
    this.scenery = buildScenery((s.catalog?.drops || []).map((d) => d.id));
    this.scene.add(this.scenery.group);
    this.scene.add(this.fx.group);

    this.labels = new LabelLayer(overlay);
    this.pops = new Pops(overlay);
    this.minimap = document.createElement('canvas');
    this.minimap.className = 'minimap';
    this.minimap.width = 220;
    this.minimap.height = 110;
    overlay.appendChild(this.minimap);

    const me = s.me;
    this.rig = buildAvatar({ shirt: `hsl(${hashHue(me?.id || 'me')},70%,52%)`, accent: '#fde047', crown: (me?.prestige || 0) > 0 });
    this.scene.add(this.rig.root);
    this.pos.set(SPAWN.x, 0, SPAWN.z);
    this.facing = 0; // face into my base
    this.buildShopkeepers();
    this.buildZoneLabels();

    this.applyQuality(true);
    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerUp);
    canvas.addEventListener('pointerleave', () => useWorldUI.setState({ hover: null }));
    canvas.addEventListener('wheel', this.onWheel, { passive: true });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.labels.destroy();
    this.pops.destroy();
    this.minimap.remove();
    this.renderer.dispose();
  }

  // ── Public API (React calls these) ───────────────────────────────────
  setJoystick(x: number, y: number) {
    this.joy = { x, y };
    if (x || y) this.target = null;
  }
  setSprint(on: boolean) {
    this.sprint = on;
  }
  jump() {
    if (!this.grounded || this.stealPhase() === 'grab') return;
    this.vy = 8.2;
    this.grounded = false;
    play('jump');
    this.fx.spark(this.pos.clone().setY(0.1), { n: 8, color: '#a5f3fc', speed: 2, up: 0.5, size: 0.25 });
  }

  /** The big contextual button (E / tap). */
  interact() {
    const p = useWorldUI.getState().prompt;
    if (!p || p.disabled) return;
    switch (p.kind) {
      case 'zone':
        play('click');
        openPanel(ZONE_PANEL[p.id as ZoneId]);
        break;
      case 'plot':
        play('click');
        if (p.mine) openPanel('base');
        else if (p.playerId) openPanel('visit', { playerId: p.playerId });
        break;
      case 'belt':
        this.tryBuy(Number(p.id));
        break;
      case 'steal':
        this.tryStartSteal(p.id);
        break;
      case 'grab':
        abortSteal('abort');
        break;
      case 'tag':
        this.tryTag(p.id);
        break;
      default:
        break;
    }
  }

  doEmote(e: string) {
    this.emote = { e, until: performance.now() + 3000 };
    this.fx.spark(tmpV.copy(this.pos).setY(2.6), { n: 14, color: '#fde047', speed: 3 });
  }

  private travelSeq = 0;
  travelTo(x: number, z: number, faceBelt = true) {
    useWorldUI.setState({ fade: 1, selected: null });
    play('whoosh');
    const seq = ++this.travelSeq;
    window.setTimeout(() => {
      if (seq !== this.travelSeq) return;
      this.pos.set(x, 0, z);
      this.vel.set(0, 0, 0);
      this.target = null;
      if (faceBelt) {
        // land facing into the base, camera on the belt side looking in
        this.facing = z > 0 ? 0 : Math.PI;
        this.camYaw = z > 0 ? Math.PI : 0;
      }
      this.snapCamera();
      useWorldUI.setState({ fade: 0 });
    }, 180);
  }
  travelHome() {
    this.travelTo(SPAWN.x, SPAWN.z);
  }
  travelToZone(id: ZoneId) {
    const z = ZONES.find((q) => q.id === id);
    if (!z) return;
    this.travelTo(z.anchor.x, z.anchor.z, false);
    // look at the zone's building: west-end zones face west, east-end zones face east
    const west = z.anchor.x < 0;
    const lookZ = Math.abs(z.anchor.z) > 20 ? Math.sign(z.anchor.z) : 0;
    window.setTimeout(() => {
      this.camYaw = Math.atan2(west ? 1 : -1, -lookZ * 0.8);
      this.facing = Math.atan2(west ? -1 : 1, lookZ * 0.8);
      this.yawGoal = null;
      this.snapCamera();
    }, 200);
  }
  travelToPlot(playerId: string) {
    const d = this.ownerPlot.get(playerId);
    if (d) {
      const p = plotInside(d);
      this.travelTo(p.x, p.z);
    }
  }
  plotOf(playerId: string): PlotDef | undefined {
    return this.ownerPlot.get(playerId);
  }
  /** From a panel's STEAL button: go stand at the podium, then start the grab. */
  stealFromPanel(ownerId: string, playerItemId: string, revenge = false) {
    const pv = this.findPodium(ownerId, playerItemId);
    if (!pv) {
      startSteal(playerItemId, revenge).catch(() => {});
      return;
    }
    const front = pv.plate;
    this.travelTo(front.x, front.z, false);
    this.facing = Math.atan2(pv.pos.x - front.x, pv.pos.z - front.z);
    window.setTimeout(() => {
      this.grabPos = pv.pos.clone();
      startSteal(playerItemId, revenge).catch(() => {});
    }, 260);
  }
  debugState() {
    const info = this.renderer.info.render;
    return {
      calls: info.calls,
      triangles: info.triangles,
      x: this.pos.x, z: this.pos.z, prompt: useWorldUI.getState().prompt,
      belt: [...this.belt.values()].filter((b) => b.model.root.visible && !b.leave).map((b) => ({ id: b.row.id, item: b.row.item_id, x: b.model.root.position.x, price: b.row.price, sold: !!b.row.sold_to })),
      plots: [...this.plots.values()].map((p) => ({ index: p.def.index, owner: p.owner.username, items: p.podiums.filter((x) => x.piid).length })),
      walkers: this.walkers.size,
    };
  }
  teleport(x: number, z: number) {
    this.travelSeq++;
    useWorldUI.setState({ fade: 0 });
    this.pos.set(x, 0, z);
    this.target = null;
    this.snapCamera();
  }

  // ── Setup helpers ────────────────────────────────────────────────────
  private resize = () => {
    const r = this.canvas.getBoundingClientRect();
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
    const dpr = Math.min(window.devicePixelRatio || 1, this.quality === 'high' ? 1.75 : 1);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.w, this.h, false);
    this.camera.aspect = this.w / this.h;
    this.camera.updateProjectionMatrix();
    this.composer?.setSize(this.w, this.h);
    this.composer?.setPixelRatio(dpr);
    this.fx.setPixelScale(this.h);
    if (this.w < 700 && this.camDist > 15) this.camDist = 15;
  };

  private applyQuality(force = false) {
    const q = G().settings.quality;
    if (!force && q === this.quality) return;
    this.quality = q;
    this.renderer.shadowMap.enabled = q === 'high';
    this.sun.castShadow = q === 'high';
    this.fx.lowQuality = q === 'low';
    if (q === 'high') {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloom = new UnrealBloomPass(new THREE.Vector2(this.w / 2, this.h / 2), 0.62, 0.5, 0.9);
      this.composer.addPass(this.bloom);
      this.composer.addPass(new OutputPass());
    } else {
      this.composer?.dispose();
      this.composer = null;
      this.bloom = null;
    }
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && m.material) {
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        for (const mt of mats) mt.needsUpdate = true;
      }
    });
    this.resize();
  }

  private buildShopkeepers() {
    const spots: [number, number, string, string, string[]][] = [
      [-95, 3, '#f59e0b', 'Max the Broker', ['Prices move every few seconds.', 'Low supply + high demand = 📈', 'Buy low, flip it later.']],
      [-72, 11, '#e879f9', 'Dropmaster Dee', ['Feeling lucky?', 'Secrets are out there…', '3% of drops come out MUTATED!']],
      [73, -9, '#f43f5e', 'The Fixer', ['Grab it, then RUN.', 'Owners can tag you. Be quick.', 'Locked bases? Wait them out.']],
      [73, 9, '#4ade80', 'Deal-Maker Dex', ['Both sides must confirm.', 'NPCs love a premium offer.', 'Fair trades make friends.']],
      [89, 6, '#22d3ee', 'MC Volt', ['Events shake up the whole city!', 'Watch the belt during events.', 'Make some noise!']],
    ];
    spots.forEach(([x, z, shirt, name, lines], i) => {
      const rig = buildAvatar({ shirt, accent: '#ffffff', crown: i === 0 });
      rig.root.position.set(x, 0, z);
      rig.root.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
      this.scene.add(rig.root);
      const key = 'shop' + i;
      this.shopkeepers.push({ rig, pos: new THREE.Vector3(x, 0, z), lines, name, key });
      this.labels.set(key, { target: rig.root, offsetY: 2.9, html: `<span class="nm npc">${name}</span>`, cls: 'tag', maxDist: 34 });
    });
  }

  private buildZoneLabels() {
    for (const z of ZONES) {
      const p = this.scenery.zoneLabelPos[z.id];
      this.labels.set('zone:' + z.id, { pos: p, html: `<span class="zn">${z.icon} ${z.label}</span>`, cls: 'zone', maxDist: 120, scale: false });
    }
    this.labels.set('zone:factory', { pos: this.scenery.zoneLabelPos.factory, html: `<span class="zn">🏭 TECH FACTORY</span>`, cls: 'zone', maxDist: 120, scale: false });
    this.labels.set('zone:recycler', { pos: this.scenery.zoneLabelPos.recycler, html: `<span class="zn">♻️ RECYCLER</span>`, cls: 'zone', maxDist: 120, scale: false });
    const drops = G().catalog?.drops || [];
    for (const m of this.scenery.machines) {
      const d = drops.find((x) => x.id === m.id);
      if (d) this.labels.set('mach:' + m.id, { pos: m.pos, html: `<b>${d.name}</b><i>${shortMoney(d.price)}</i>`, cls: 'mach', maxDist: 40 });
    }
  }

  // ── Main loop ────────────────────────────────────────────────────────
  private frame = (now: number) => {
    this.raf = requestAnimationFrame(this.frame);
    let dt = Math.min(0.05, (now - (this.last || now)) / 1000);
    this.last = now;
    if (this.slowmo > 0) {
      this.slowmo -= dt;
      dt *= 0.35;
    }
    this.t += dt;
    try {
      this.update(dt, now);
      this.render();
    } catch (e) {
      console.error(e);
    }
  };

  private update(dt: number, now: number) {
    const s = G();
    if (Math.floor(this.t * 2) !== Math.floor((this.t - dt) * 2)) this.applyQuality();
    tickMutations(this.t);
    this.syncPlots();
    this.syncBelt();
    this.syncWalkers();
    this.syncSteal();
    this.focusRequests();

    this.updatePlayer(dt);
    this.updateCamera(dt);
    this.updatePlots(dt);
    this.updateBelt(dt);
    this.updateWalkers(dt);
    this.updateChasers(dt);
    this.updatePeers(dt);
    this.updateShopkeepers(dt, now);
    this.updateInteractions(dt);
    this.fx.update(dt);
    this.scenery.update(this.t, dt);
    for (const m of this.scenery.machines) m.crate.position.y = 2.35 + Math.sin(this.t * 2 + m.pos.z) * 0.12;

    if (now - this.screensAt > 2000) {
      this.screensAt = now;
      this.drawScreens();
    }
    if (now - this.mapAt > 140) {
      this.mapAt = now;
      this.drawMinimap();
    }
    // sun & shadow follow the player
    this.sun.position.set(this.pos.x + 30, 60, this.pos.z + 25);
    this.sun.target.position.set(this.pos.x, 0, this.pos.z);
    void s;
  }

  private render() {
    this.labels.update(this.camera, this.w, this.h);
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  // ── Plots ────────────────────────────────────────────────────────────
  private syncPlots() {
    const s = G();
    const me = s.me;
    if (!me) return;
    const meSig = `${me.slots}|${me.security_level}|${JSON.stringify(me.cosmetics)}|${me.lock_until}|${me.shield_until}`;
    const incomingSig = (s.last?.incoming_raids || []).map((r) => r.id + r.phase).join(',');
    if (s.worldAt === this.lastWorldAt && s.myItems === this.lastItemsRef && meSig + incomingSig === this.lastMeSig) return;
    this.lastWorldAt = s.worldAt;
    this.lastItemsRef = s.myItems;
    this.lastMeSig = meSig + incomingSig;

    // stable plot assignment
    const others = s.world.filter((p) => p.id !== me.id);
    const present = new Set(others.map((p) => p.id));
    for (const [id, idx] of this.assign) if (!present.has(id) || idx === 0) this.assign.delete(id);
    const used = new Set(this.assign.values());
    const rick = others.find((p) => p.username === 'RookieRick');
    const order = [...(rick ? [rick] : []), ...others.filter((p) => !p.is_bot).sort((a, b) => Number(b.online) - Number(a.online)), ...others.filter((p) => p.is_bot && p !== rick)];
    for (const p of order) {
      if (this.assign.has(p.id)) continue;
      const free = PLOTS.find((d) => d.index > 0 && !used.has(d.index));
      if (!free) break;
      this.assign.set(p.id, free.index);
      used.add(free.index);
    }
    const mineWP: WorldPlayer = s.world.find((p) => p.id === me.id) || {
      id: me.id, username: me.username, is_bot: false, level: me.level, prestige: me.prestige, title: me.title, bio: '', base_level: me.base_level,
      slots: me.slots, security_level: me.security_level, vault_level: me.vault_level, vault_used: 0, cosmetics: me.cosmetics, base_value: me.base_value,
      shield_until: me.shield_until, lock_until: me.lock_until, protected: me.level < 3, online: true, items: [],
    };
    this.ownerPlot.clear();
    const want = new Map<number, WorldPlayer>([[0, { ...mineWP, slots: me.slots, security_level: me.security_level, cosmetics: me.cosmetics, lock_until: me.lock_until, shield_until: me.shield_until }]]);
    for (const [id, idx] of this.assign) {
      const wp = others.find((p) => p.id === id);
      if (wp) want.set(idx, wp);
    }
    for (const [idx, wp] of want) this.ownerPlot.set(wp.id, PLOTS[idx]);
    // remove plots that lost their owner
    for (const [idx, pv] of this.plots) {
      if (!want.has(idx) || want.get(idx)!.id !== pv.owner.id) {
        this.scene.remove(pv.group);
        this.labels.removePrefix(`plot${idx}:`);
        this.plots.delete(idx);
      }
    }
    for (const [idx, wp] of want) {
      const def = PLOTS[idx];
      const mine = idx === 0;
      let pv = this.plots.get(idx);
      const themeSig = JSON.stringify(wp.cosmetics || {}) + '|' + wp.slots + '|' + wp.security_level;
      if (!pv || pv.themeSig !== themeSig) {
        if (pv) {
          this.scene.remove(pv.group);
          this.labels.removePrefix(`plot${idx}:`);
        }
        pv = this.buildPlot(def, wp, mine, themeSig);
        this.plots.set(idx, pv);
      }
      pv.owner = wp;
      // items
      const items: { piid: string; itemId: string; mutation: string | null; slot: number; hidden: boolean }[] = [];
      if (mine) {
        const carried = new Set((s.last?.incoming_raids || []).filter((r) => r.phase === 'carry').map((r) => r.player_item_id));
        for (const pi of s.myItems) if (pi.location === 'display' && pi.slot != null) items.push({ piid: pi.id, itemId: pi.item_id, mutation: pi.mutation, slot: pi.slot, hidden: carried.has(pi.id) });
      } else {
        const myCarry = s.steal && !s.steal.result && s.steal.phase === 'carry' ? s.steal.playerItemId : null;
        for (const it of wp.items) items.push({ piid: it.id, itemId: it.item_id, mutation: it.mutation, slot: it.slot, hidden: it.id === myCarry || it.raid?.phase === 'carry' });
      }
      const bySlot = new Map(items.map((x) => [x.slot, x]));
      for (const pod of pv.podiums) this.setPodiumItem(pv, pod, bySlot.get(pod.slot) || null);
    }
    this.rebuildPickables();
  }

  private theme(p: WorldPlayer) {
    const cos = G().catalog?.cosmetics || [];
    const find = (id?: string) => cos.find((c) => c.id === id)?.data || {};
    const th = find(p.cosmetics?.theme || 'theme-neon');
    return {
      floor: th.floor || '#131a2e',
      wall: th.wall || '#1e293b',
      glow: th.glow || '#22d3ee',
      pattern: find(p.cosmetics?.floor).pattern || 'grid',
      light: find(p.cosmetics?.lighting).color || th.glow || '#22d3ee',
    };
  }

  private floorTex(pattern: string, floor: string, glowC: string) {
    return canvasTex(
      256,
      256,
      (c) => {
        c.fillStyle = floor;
        c.fillRect(0, 0, 256, 256);
        c.strokeStyle = glowC + '55';
        c.lineWidth = 3;
        if (pattern === 'checker') {
          c.fillStyle = 'rgba(255,255,255,0.06)';
          for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if ((x + y) % 2) c.fillRect(x * 64, y * 64, 64, 64);
        } else if (pattern === 'hex') {
          for (let y = 0; y < 5; y++)
            for (let x = 0; x < 5; x++) {
              const cx = x * 58 + (y % 2) * 29;
              const cy = y * 50;
              c.beginPath();
              for (let k = 0; k < 6; k++) c.lineTo(cx + Math.cos((k * Math.PI) / 3) * 28, cy + Math.sin((k * Math.PI) / 3) * 28);
              c.closePath();
              c.stroke();
            }
        } else if (pattern === 'marble') {
          c.strokeStyle = 'rgba(255,255,255,0.12)';
          for (let i = 0; i < 12; i++) {
            c.beginPath();
            c.moveTo(Math.random() * 256, 0);
            c.bezierCurveTo(Math.random() * 256, 90, Math.random() * 256, 170, Math.random() * 256, 256);
            c.stroke();
          }
        } else {
          for (let i = 0; i <= 256; i += 64) {
            c.beginPath();
            c.moveTo(i, 0);
            c.lineTo(i, 256);
            c.stroke();
            c.beginPath();
            c.moveTo(0, i);
            c.lineTo(256, i);
            c.stroke();
          }
        }
      },
      true,
    );
  }

  private buildPlot(def: PlotDef, owner: WorldPlayer, mine: boolean, themeSig: string): PlotView {
    const g = new THREE.Group();
    this.scene.add(g);
    const th = this.theme(owner);
    const c = plotToWorld(def, 0, PLOT_D / 2);
    const ft = this.floorTex(th.pattern, th.floor, th.glow);
    ft.repeat.set(PLOT_W / 6, PLOT_D / 6);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(PLOT_W, 0.14, PLOT_D), new THREE.MeshStandardMaterial({ map: ft, roughness: 0.7, metalness: 0.2 }));
    floor.position.set(c.x, 0.07, c.z);
    floor.receiveShadow = true;
    g.add(floor);
    const wallM = std(th.wall, { metal: 0.4, rough: 0.5 });
    const glowM = glow(mine ? '#fde047' : th.glow);
    const wall = (lx0: number, ld0: number, lx1: number, ld1: number, hgt: number) => {
      const a = plotToWorld(def, lx0, ld0);
      const b = plotToWorld(def, lx1, ld1);
      const len = Math.hypot(b.x - a.x, b.z - a.z);
      const m = new THREE.Mesh(gBox(len, hgt, 0.4), wallM);
      m.position.set((a.x + b.x) / 2, hgt / 2, (a.z + b.z) / 2);
      m.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
      const strip = new THREE.Mesh(gBox(len, 0.08, 0.44), glowM);
      strip.position.set(m.position.x, hgt + 0.02, m.position.z);
      strip.rotation.y = m.rotation.y;
      g.add(strip);
    };
    wall(-PLOT_W / 2, 0, -PLOT_W / 2, PLOT_D, 1.3);
    wall(PLOT_W / 2, 0, PLOT_W / 2, PLOT_D, 1.3);
    wall(-PLOT_W / 2, PLOT_D, PLOT_W / 2, PLOT_D, 1.3);
    wall(-4.5, PLOT_D, 4.5, PLOT_D, 3.6);
    // door pillars
    for (const sx of [-1, 1]) {
      const p = plotToWorld(def, sx * (PLOT_W / 2), 0);
      const pil = new THREE.Mesh(gRBox(0.7, 3.2, 0.7, 0.1), wallM);
      pil.position.set(p.x, 1.6, p.z);
      pil.castShadow = true;
      g.add(pil);
      const cap = new THREE.Mesh(gBox(0.75, 0.2, 0.75), glowM);
      cap.position.set(p.x, 3.25, p.z);
      g.add(cap);
    }
    // lasers (visible while locked)
    const lasers = new THREE.Group();
    const la = plotToWorld(def, 0, 0.2);
    for (let i = 0; i < 6; i++) {
      const b = new THREE.Mesh(gBox(PLOT_W - 0.8, 0.05, 0.05), glow('#ff2a4f'));
      b.position.set(la.x, 0.35 + i * 0.42, la.z);
      lasers.add(b);
    }
    lasers.visible = false;
    g.add(lasers);
    // pads: lock (left) + collect all (right)
    const lp = lockPad(def);
    const lockTex = canvasTex(128, 128, (cx) => {
      cx.fillStyle = '#3f0a14';
      cx.beginPath();
      cx.arc(64, 64, 60, 0, Math.PI * 2);
      cx.fill();
      cx.strokeStyle = '#ff4d6d';
      cx.lineWidth = 8;
      cx.stroke();
      cx.font = '64px system-ui, sans-serif';
      cx.textAlign = 'center';
      cx.textBaseline = 'middle';
      cx.fillText('🔒', 64, 68);
    });
    const lockPadM = new THREE.Mesh(gCyl(1, 1, 0.08, 32), [std('#3f0a14'), new THREE.MeshBasicMaterial({ map: lockTex, toneMapped: false }), std('#3f0a14')] as any);
    lockPadM.position.set(lp.x, 0.16, lp.z);
    g.add(lockPadM);
    const cp = collectPad(def);
    const colTex = canvasTex(128, 128, (cx) => {
      cx.fillStyle = '#052e16';
      cx.beginPath();
      cx.arc(64, 64, 60, 0, Math.PI * 2);
      cx.fill();
      cx.strokeStyle = '#4ade80';
      cx.lineWidth = 8;
      cx.stroke();
      cx.font = '64px system-ui, sans-serif';
      cx.textAlign = 'center';
      cx.textBaseline = 'middle';
      cx.fillText('💰', 64, 68);
    });
    const colPadM = new THREE.Mesh(gCyl(1, 1, 0.08, 32), [std('#052e16'), new THREE.MeshBasicMaterial({ map: colTex, toneMapped: false }), std('#052e16')] as any);
    colPadM.position.set(cp.x, 0.16, cp.z);
    g.add(colPadM);
    // vault safe
    const vp = vaultPos(def);
    const safe = new THREE.Mesh(gRBox(1.6, 1.8, 1.4, 0.1), std('#475569', { metal: 0.9, rough: 0.3 }));
    safe.position.set(vp.x, 0.9, vp.z);
    safe.castShadow = true;
    g.add(safe);
    const dial = new THREE.Mesh(gCyl(0.3, 0.3, 0.1, 18), std('#cbd5e1', { metal: 1, rough: 0.2 }));
    dial.rotation.x = Math.PI / 2;
    dial.position.set(vp.x, 1.0, vp.z - def.side * 0.72);
    g.add(dial);
    // security gadgets
    const sec = new THREE.Group();
    g.add(sec);
    this.buildSecurity(def, sec, owner.security_level);
    // shield dome
    const shield = new THREE.Mesh(new THREE.SphereGeometry(16, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#60a5fa', transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }));
    shield.scale.set(0.72, 0.5, 0.86);
    shield.position.set(c.x, 0, c.z);
    shield.visible = false;
    g.add(shield);
    // podiums
    const podiums: PodiumView[] = [];
    for (let i = 0; i < owner.slots; i++) {
      const sp = slotPos(def, owner.slots, i);
      const pp = platePos(def, owner.slots, i);
      const pod = buildPodium(sp.size, '#475569', 0);
      pod.root.position.set(sp.x, 0.14, sp.z);
      g.add(pod.root);
      pod.plate.position.set(pp.x - sp.x, 0.0, pp.z - sp.z);
      pod.plate.visible = mine;
      podiums.push({ slot: i, pod, pos: new THREE.Vector3(sp.x, 0.62, sp.z), plate: new THREE.Vector3(pp.x, 0, pp.z), size: sp.size, sig: '', model: null, beam: null, piid: null, itemId: null, mutation: null, tier: 0, hidden: false });
    }
    const pv: PlotView = { def, owner, mine, group: g, podiums, slots: owner.slots, themeSig, lasers, shield, gate: doorGate(def), sec, secLevel: owner.security_level };
    return pv;
  }

  private buildSecurity(def: PlotDef, g: THREE.Group, level: number) {
    if (level >= 2) {
      for (const sx of [-1, 1]) {
        const p = plotToWorld(def, sx * (PLOT_W / 2 - 0.2), PLOT_D - 0.3);
        const cam = new THREE.Mesh(gBox(0.5, 0.3, 0.3), std('#e2e8f0', { metal: 0.6 }));
        cam.position.set(p.x, 1.7, p.z);
        const led = new THREE.Mesh(gSph(0.06, 8, 6), glow('#ef4444'));
        led.position.set(p.x, 1.75, p.z - def.side * 0.18);
        g.add(cam, led);
      }
    }
    if (level >= 4) {
      for (const sx of [-1, 1]) {
        const p = plotToWorld(def, sx * (PLOT_W / 2 - 0.6), 0.6);
        const tur = new THREE.Mesh(gCyl(0.25, 0.35, 0.6, 10), std('#334155', { metal: 0.8 }));
        tur.position.set(p.x, 3.6, p.z);
        const eye = new THREE.Mesh(gSph(0.12, 10, 8), glow('#f43f5e'));
        eye.position.set(p.x, 3.7, p.z - def.side * 0.3);
        g.add(tur, eye);
      }
    }
    if (level >= 6) {
      const ring = glowRing('#a855f7', 3);
      const c = plotToWorld(def, 0, PLOT_D / 2);
      ring.position.set(c.x, 0.2, c.z);
      ring.scale.set(3.2, 3.9, 1);
      g.add(ring);
    }
  }

  private setPodiumItem(pv: PlotView, pod: PodiumView, it: { piid: string; itemId: string; mutation: string | null; hidden: boolean } | null) {
    const sig = it ? `${it.piid}|${it.itemId}|${it.mutation}` : '';
    if (sig === pod.sig) {
      if (pod.model) pod.model.root.visible = !(it?.hidden ?? false);
      pod.hidden = !!it?.hidden;
      return;
    }
    pod.sig = sig;
    if (pod.model) {
      pod.model.root.parent?.remove(pod.model.root);
      pod.model = null;
    }
    if (pod.beam) {
      pod.beam.parent?.remove(pod.beam);
      pod.beam = null;
    }
    pod.piid = it?.piid ?? null;
    pod.itemId = it?.itemId ?? null;
    pod.mutation = it?.mutation ?? null;
    pod.tier = 0;
    const ringMat = pod.pod.ring.material as THREE.MeshBasicMaterial;
    if (!it) {
      pod.pod.ring.material = glow('#334155');
      this.labels.remove(`plot${pv.def.index}:pod${pod.slot}`);
      return;
    }
    void ringMat;
    const cat = G().itemsById[it.itemId];
    if (!cat) return;
    const tier = RARITY[cat.rarity]?.tier ?? 1;
    pod.tier = tier;
    const col = cat.rarity === 'ultra' ? '#e879f9' : RARITY[cat.rarity].color;
    pod.pod.ring.material = glow(it.mutation ? MUTATION_COLORS[it.mutation] || col : col);
    const m = buildItem(cat, it.mutation);
    const sc = Math.max(0.42, Math.min(1.05, (pod.size * 1.25) / Math.max(0.8, m.width)));
    m.root.scale.setScalar(sc);
    m.root.position.copy(pod.pos);
    m.root.position.y = 0.62;
    m.root.rotation.y = pv.def.side > 0 ? Math.PI : 0; // face the door
    m.root.userData = { pick: 'podium', plot: pv.def.index, slot: pod.slot, piid: it.piid, itemId: it.itemId, ownerId: pv.owner.id, ownerName: pv.owner.username, mine: pv.mine, mutation: it.mutation };
    m.root.visible = !it.hidden;
    pod.hidden = it.hidden;
    pv.group.add(m.root);
    pod.model = m;
    if (tier >= 5 || it.mutation === 'rainbow' || it.mutation === 'glitch') {
      const beam = rarityBeam(it.mutation ? MUTATION_COLORS[it.mutation] || col : col, tier >= 7 ? 14 : 9, pod.size * 0.45);
      beam.position.x = pod.pos.x;
      beam.position.z = pod.pos.z;
      beam.position.y += 0.5;
      pv.group.add(beam);
      pod.beam = beam;
    }
  }

  private rebuildPickables() {
    this.pickables = [];
    for (const pv of this.plots.values()) for (const pod of pv.podiums) if (pod.model && !pod.hidden) this.pickables.push(pod.model.root);
    for (const b of this.belt.values()) if (!b.leave && !b.done) this.pickables.push(b.model.root);
  }

  private findPodium(ownerId: string, piid: string): PodiumView | null {
    const d = this.ownerPlot.get(ownerId);
    if (!d) return null;
    const pv = this.plots.get(d.index);
    return pv?.podiums.find((p) => p.piid === piid) || null;
  }

  private updatePlots(dt: number) {
    const s = G();
    const me = s.me;
    const nowS = Date.now();
    for (const pv of this.plots.values()) {
      const lockUntil = pv.mine ? me?.lock_until : pv.owner.lock_until;
      const locked = !!lockUntil && toClient(lockUntil) > nowS;
      pv.lasers.visible = locked;
      if (locked) for (const [i, b] of pv.lasers.children.entries()) b.visible = Math.sin(this.t * 20 + i) > -0.6;
      const shieldUntil = pv.mine ? me?.shield_until : pv.owner.shield_until;
      pv.shield.visible = !!shieldUntil && toClient(shieldUntil) > nowS;
      if (pv.shield.visible) (pv.shield.material as THREE.MeshBasicMaterial).opacity = 0.08 + Math.sin(this.t * 3) * 0.04;
      // podium idle animation + labels
      const near = inPlot(pv.def, this.pos.x, this.pos.z, 4) || this.pos.distanceTo(tmpV.set(pv.def.cx, 0, pv.def.side * 18)) < 26;
      for (const pod of pv.podiums) {
        if (!pod.model) continue;
        const b = pod.model.body;
        b.rotation.y = Math.sin(this.t * 0.6 + pod.slot) * 0.35;
        b.position.y = Math.sin(this.t * 1.6 + pod.slot) * 0.05;
        if (pod.tier >= 6 && Math.random() < dt * 2.5 && near && !pod.hidden) this.fx.spark(tmpV.copy(pod.pos).setY(1.4), { n: 2, color: RARITY[G().itemsById[pod.itemId!]?.rarity || 'mythic'].color, speed: 1.2, up: 1.5, gravity: 0, size: 0.3, life: 1.2 });
        if (pod.mutation === 'rainbow' && Math.random() < dt * 4 && near) this.fx.spark(tmpV.copy(pod.pos).setY(1.2), { n: 2, rainbow: true, speed: 1.5, up: 1.2, gravity: 0, size: 0.28 });
        if (pod.mutation === 'glitch' && pod.model) pod.model.body.position.x = Math.random() < 0.05 ? (Math.random() - 0.5) * 0.15 : 0;
        // eyes follow the player
        this.lookEyes(pod.model, pod.model.root);
        // labels
        const key = `plot${pv.def.index}:pod${pod.slot}`;
        if (pv.mine && pod.piid && !pod.hidden) {
          const pi = s.myItems.find((x) => x.id === pod.piid);
          if (pi) {
            const amt = pendingOf(pi, this.localAccrued.get(pi.id));
            const rate = itemRate(pi.item_id, pi.mutation);
            const big = amt > rate * 90;
            pod.pod.plateMat.opacity = amt >= 1 ? 0.35 + (big ? 0.35 + Math.sin(this.t * 6) * 0.2 : 0.1) : 0.12;
            this.labels.set(key, { pos: tmpV.copy(pod.pos).setY(pod.pos.y + (pod.model.height * pod.model.root.scale.x) + 0.5), html: `<b>${shortMoney(amt)}</b><i>+${perSec(rate)}</i>`, cls: 'cash' + (big ? ' big' : ''), maxDist: 34 });
          }
        } else if (!pv.mine && pod.itemId && near && !pod.hidden) {
          const cat = s.itemsById[pod.itemId];
          if (cat) {
            const mut = pod.mutation ? mutationDef(pod.mutation) : null;
            this.labels.set(key, {
              pos: tmpV.copy(pod.pos).setY(pod.pos.y + pod.model.height * pod.model.root.scale.x + 0.4),
              html: `${mut ? `<u class="mut m-${pod.mutation}">${mut.label}</u>` : ''}<s class="r-${cat.rarity}">${RARITY[cat.rarity].label}</s><b>${cat.name}</b><i>${shortMoney(price(cat.id, pod.mutation))}</i>`,
              cls: 'podtag',
              maxDist: 18,
            });
          }
        } else this.labels.hide(key);
      }
      // sign
      const signP = plotToWorld(pv.def, 0, PLOT_D + 0.2);
      const lockLeft = locked ? Math.ceil((toClient(lockUntil) - nowS) / 1000) : 0;
      const shieldLeft = pv.shield.visible ? toClient(shieldUntil!) - nowS : 0;
      const val = pv.mine && me ? me.base_value : pv.owner.base_value;
      const secL = pv.mine && me ? me.security_level : pv.owner.security_level;
      this.labels.set(`plot${pv.def.index}:sign`, {
        pos: tmpV.set(signP.x, 4.6, signP.z),
        html: `<b>${pv.mine ? '⭐ YOUR BASE' : (pv.owner.is_bot ? '🤖 ' : '') + esc(pv.owner.username)}</b><i>${shortMoney(val)} · SEC ${secL}</i>${locked ? `<em class="lk">🔒 LOCKED ${lockLeft}s</em>` : shieldLeft > 0 ? `<em class="sh">🛡️ ${duration(shieldLeft)}</em>` : !pv.mine && pv.owner.protected ? '<em class="sh">🐣 PROTECTED</em>' : ''}`,
        cls: 'sign' + (pv.mine ? ' mine' : ''),
        maxDist: 90,
        scale: false,
      });
      if (pv.mine && me) {
        const lp = lockPad(pv.def);
        const ready = !me.lock_until || toClient(me.lock_until) < nowS - (G().catalog?.rules.lock_recharge ?? 10) * 1000;
        const recharge = me.lock_until ? Math.ceil((toClient(me.lock_until) + 10000 - nowS) / 1000) : 0;
        this.labels.set(`plot0:lockpad`, { pos: tmpV.set(lp.x, 1.3, lp.z), html: locked ? `<b>🔒 ${lockLeft}s</b>` : ready ? `<b>STEP TO LOCK</b><i>${me.lock_seconds}s of lasers</i>` : `<b>RECHARGING</b><i>${recharge}s</i>`, cls: 'pad lock' + (locked ? ' on' : ''), maxDist: 26 });
        const cp = collectPad(pv.def);
        this.labels.set(`plot0:colpad`, { pos: tmpV.set(cp.x, 1.3, cp.z), html: `<b>COLLECT ALL</b><i>${shortMoney(this.totalPending())}</i>`, cls: 'pad col', maxDist: 26 });
      }
    }
  }

  private totalPending(): number {
    let t = 0;
    for (const pi of G().myItems) if (pi.location === 'display') t += pendingOf(pi, this.localAccrued.get(pi.id));
    return t;
  }

  private lookEyes(m: ItemModel, root: THREE.Object3D) {
    if (!m.pupils.length) return;
    m.body.worldToLocal(tmpV2.copy(this.pos).setY(1.6));
    for (const p of m.pupils) {
      const base = p.userData.base as THREE.Vector3;
      const dx = Math.max(-1, Math.min(1, tmpV2.x * 0.08));
      const dy = Math.max(-1, Math.min(1, (tmpV2.y - base.y) * 0.08));
      p.position.set(base.x + dx * 0.04, base.y + dy * 0.035, base.z);
    }
    void root;
  }

  // ── Belt ─────────────────────────────────────────────────────────────
  private syncBelt() {
    const s = G();
    if (s.beltAt === this.lastBeltAt) return;
    this.lastBeltAt = s.beltAt;
    const seen = new Set<number>();
    for (const row of s.belt) {
      seen.add(row.id);
      let bv = this.belt.get(row.id);
      if (!bv) {
        const it = s.itemsById[row.item_id];
        if (!it) continue;
        const model = buildItem(it, row.mutation, { legs: true });
        model.root.userData = { pick: 'belt', beltId: row.id, itemId: row.item_id, mutation: row.mutation };
        model.root.visible = false;
        this.scene.add(model.root);
        const tier = RARITY[it.rarity]?.tier ?? 1;
        let beam: THREE.Mesh | null = null;
        if (tier >= 5 || row.mutation === 'rainbow' || row.mutation === 'glitch') {
          beam = rarityBeam(row.mutation ? MUTATION_COLORS[row.mutation] : it.rarity === 'ultra' ? '#e879f9' : RARITY[it.rarity].color, tier >= 7 ? 22 : 12, 0.9);
          model.root.add(beam);
        }
        bv = { row, it, model, spawnedAt: toClient(row.spawned_at), endsAt: toClient(row.ends_at), beam, announced: false, leave: null, done: false, phase: Math.random() * 6 };
        this.belt.set(row.id, bv);
      }
      bv.row = row;
    }
    for (const [id, bv] of this.belt) {
      if (!seen.has(id) && !bv.leave) {
        // gone from the server list: it left the belt (recycled) or was bought long ago
        this.removeBelt(id);
      }
    }
    this.rebuildPickables();
  }

  private removeBelt(id: number) {
    const bv = this.belt.get(id);
    if (!bv) return;
    this.scene.remove(bv.model.root);
    this.labels.remove('belt:' + id);
    this.belt.delete(id);
  }

  private updateBelt(dt: number) {
    const now = Date.now();
    const me = G().me;
    for (const [id, bv] of this.belt) {
      const r = bv.model.root;
      if (bv.leave) {
        const k = Math.min(1, (now - bv.leave.t0) / bv.leave.dur);
        r.position.lerpVectors(bv.leave.from, bv.leave.to, k);
        if (bv.leave.fly) {
          r.position.y += Math.sin(k * Math.PI) * 3 + k * 4;
          r.scale.setScalar(Math.max(0.01, 1 - k));
        } else {
          r.position.y = Math.abs(Math.sin(k * Math.PI * Math.max(2, bv.leave.dur / 350))) * 0.5 + (k < 0.12 ? Math.sin((k / 0.12) * Math.PI) * 1.2 : 0);
          this.walkLegs(bv, dt, 2.2);
          r.rotation.y = Math.atan2(bv.leave.to.x - bv.leave.from.x, bv.leave.to.z - bv.leave.from.z);
        }
        if (k >= 1) {
          if (!bv.done) {
            bv.done = true;
            this.fx.spark(r.position.clone().setY(1), { n: 30, color: RARITY[bv.it.rarity].color, speed: 4 });
            this.fx.ring(r.position.clone().setY(0.2), RARITY[bv.it.rarity].color, 3);
            if (bv.row.sold_to === me?.id) play('pop');
          }
          this.removeBelt(id);
        }
        continue;
      }
      if (bv.row.sold_to && !bv.leave) {
        this.startLeave(bv);
        continue;
      }
      const tt = (now - bv.spawnedAt) / Math.max(1, bv.endsAt - bv.spawnedAt);
      if (tt < 0) {
        r.visible = false;
        continue;
      }
      if (tt > 1.02) {
        r.visible = false;
        this.labels.hide('belt:' + id);
        if (tt > 1.3) this.removeBelt(id);
        continue;
      }
      r.visible = true;
      r.position.set(beltX(tt), BELT.height, BELT.z);
      r.rotation.y = Math.PI / 2 + Math.sin(this.t * 3 + bv.phase) * 0.15;
      const edge = Math.min(tt / 0.03, (1 - tt) / 0.03, 1);
      r.scale.setScalar(Math.max(0.05, edge));
      this.walkLegs(bv, dt, 1);
      this.lookEyes(bv.model, r);
      if (bv.beam) bv.beam.visible = true;
      if (!bv.announced) {
        bv.announced = true;
        this.announceBelt(bv, tt);
      }
      // label
      const d = r.position.distanceTo(this.pos);
      const rateStr = perSec(bv.it.base_income * (mutationDef(bv.row.mutation)?.mult ?? 1));
      const mut = bv.row.mutation ? mutationDef(bv.row.mutation) : null;
      const afford = !me || me.cash >= bv.row.price;
      this.labels.set('belt:' + id, {
        target: r,
        offsetY: bv.model.height * r.scale.y + 0.55,
        html: `${mut ? `<u class="mut m-${bv.row.mutation}">${mut.label} ×${mut.mult}</u>` : ''}<s class="r-${bv.it.rarity}">${RARITY[bv.it.rarity].label}</s><b>${esc(bv.it.name)}</b><i class="${afford ? 'ok' : 'no'}">${shortMoney(bv.row.price)}</i><em>+${rateStr}</em>`,
        cls: 'belttag r-' + bv.it.rarity + (d < 3.2 ? ' near' : ''),
        maxDist: 30 + (RARITY[bv.it.rarity].tier >= 5 ? 40 : 0),
      });
      if (RARITY[bv.it.rarity].tier >= 6 && Math.random() < dt * 5) this.fx.spark(tmpV.copy(r.position).setY(1.2), { n: 2, color: RARITY[bv.it.rarity].color, speed: 1.5, gravity: 0, up: 1, size: 0.3 });
      if (bv.row.mutation === 'rainbow' && Math.random() < dt * 6) this.fx.spark(tmpV.copy(r.position).setY(1), { n: 2, rainbow: true, speed: 1.5, gravity: 0, up: 1 });
    }
  }

  private walkLegs(bv: BeltView, dt: number, speed: number) {
    bv.phase += dt * 9 * speed;
    const sw = Math.sin(bv.phase) * 0.7;
    if (bv.model.legs[0]) bv.model.legs[0].rotation.x = sw;
    if (bv.model.legs[1]) bv.model.legs[1].rotation.x = -sw;
    bv.model.body.position.y = 0.34 + Math.abs(Math.sin(bv.phase)) * 0.06;
    bv.model.body.rotation.z = Math.sin(bv.phase) * 0.06;
  }

  private announceBelt(bv: BeltView, tt: number) {
    const tier = RARITY[bv.it.rarity]?.tier ?? 1;
    const mut = bv.row.mutation;
    if (tt > 0.15) return; // only hype fresh arrivals
    if (tier >= 8 || bv.it.rarity === 'secret') {
      play('hype');
      reveal(bv.it.rarity);
      this.shake = Math.max(this.shake, 0.5);
      banner({ kind: 'secret', title: `⚠️ ${RARITY[bv.it.rarity].label} ON THE BELT ⚠️`, sub: `${bv.it.name} · ${shortMoney(bv.row.price)} — GO GO GO`, itemId: bv.it.id, mutation: mut, ttl: 4200 });
    } else if (tier >= 5 || mut === 'rainbow' || mut === 'glitch') {
      play('hype');
      banner({ kind: 'epic', title: `${mut ? (mutationDef(mut)?.label ?? '') + ' ' : ''}${RARITY[bv.it.rarity].label} ON THE BELT!`, sub: `${bv.it.name} · ${shortMoney(bv.row.price)}`, itemId: bv.it.id, mutation: mut, color: RARITY[bv.it.rarity].color, ttl: 3000 });
    } else if (tier >= 4 || mut) {
      play('spawn');
    }
    this.fx.spark(new THREE.Vector3(BELT.x0 + 1, 2.5, 0), { n: tier >= 5 ? 60 : 14, color: mut ? MUTATION_COLORS[mut] : RARITY[bv.it.rarity].color, speed: 5, rainbow: mut === 'rainbow' });
  }

  private startLeave(bv: BeltView) {
    const s = G();
    const from = bv.model.root.position.clone();
    if (!bv.model.root.visible) {
      this.removeBelt(bv.row.id);
      return;
    }
    const buyer = bv.row.sold_to!;
    const d = this.ownerPlot.get(buyer);
    let to: THREE.Vector3;
    let fly = false;
    if (d) {
      if (buyer === s.me?.id) {
        const free = this.plots.get(0)?.podiums.find((p) => !p.piid);
        to = free ? free.pos.clone().setY(0.6) : new THREE.Vector3(plotInside(d).x, 0, plotInside(d).z);
      } else {
        const ins = plotToWorld(d, (Math.random() - 0.5) * 8, 8 + Math.random() * 8);
        to = new THREE.Vector3(ins.x, 0, ins.z);
      }
    } else {
      to = from.clone().add(new THREE.Vector3(0, 0, 0.1));
      fly = true;
    }
    const dist = from.distanceTo(to);
    bv.leave = { from, to, t0: Date.now(), dur: fly ? 900 : Math.max(900, (dist / 9) * 1000), fly };
    this.labels.set('belt:' + bv.row.id, {
      target: bv.model.root,
      offsetY: bv.model.height + 0.5,
      html: `<b>${buyer === s.me?.id ? '✅ YOURS!' : '🛒 ' + esc(bv.row.buyer || '?')}</b>`,
      cls: 'belttag sold',
      maxDist: 40,
    });
    if (buyer === s.me?.id) {
      this.fx.spark(from.clone().setY(1), { n: 40, color: '#4ade80', speed: 5 });
      this.fx.ring(from.clone().setY(0.35), '#4ade80', 4);
    }
    this.rebuildPickables();
  }

  private nearestBelt(maxD: number): BeltView | null {
    let best: BeltView | null = null;
    let bd = maxD;
    for (const bv of this.belt.values()) {
      if (bv.leave || bv.row.sold_to || !bv.model.root.visible) continue;
      const p = bv.model.root.position;
      const d = Math.hypot(p.x - this.pos.x, p.z - this.pos.z);
      if (d < bd) {
        bd = d;
        best = bv;
      }
    }
    return best;
  }

  private tryBuy(id: number) {
    const bv = this.belt.get(id);
    if (!bv || bv.row.sold_to) return;
    const me = G().me;
    if (me && me.cash < bv.row.price) {
      buyBelt(id); // explains how much more you need
      this.pops.at(this.camera, this.w, this.h, tmpV.copy(bv.model.root.position).setY(2), 'NEED ' + shortMoney(bv.row.price - me.cash), 'bad', 0.9);
      return;
    }
    this.fx.coinsBurst(this.pos.clone().setY(1.4), 10, bv.model.root.position.clone().setY(1));
    this.pops.at(this.camera, this.w, this.h, tmpV.copy(bv.model.root.position).setY(2.2), '-' + shortMoney(bv.row.price), 'spend', 1);
    buyBelt(id).then((r) => {
      if (r) {
        const tier = RARITY[r.rarity]?.tier ?? 1;
        if (tier >= 5 || r.mutation) {
          this.fx.confetti(this.pos.clone().setY(2), tier >= 7 ? 200 : 90);
          this.fovKick = 8;
          this.slowmo = 0.35;
        }
      }
    });
  }

  // ── Walkers (NPC robots) ─────────────────────────────────────────────
  private syncWalkers() {
    const s = G();
    for (const p of s.world) {
      if (!p.is_bot || this.walkers.has(p.id)) continue;
      this.walkers.set(p.id, this.makeWalker(p.id, p.username, p.level, true));
    }
  }

  private makeWalker(id: string, name: string, level: number, bot: boolean): Walker {
    const hue = hashHue(id);
    const rig = buildAvatar({ shirt: `hsl(${hue},55%,45%)`, bot, accent: `hsl(${(hue + 180) % 360},90%,60%)` });
    const d = this.ownerPlot.get(id);
    const start = d ? plotToWorld(d, (Math.random() - 0.5) * 10, 3 + Math.random() * 10) : { x: (Math.random() - 0.5) * 100, z: (Math.random() < 0.5 ? -1 : 1) * 4 };
    rig.root.position.set(start.x, 0, start.z);
    this.scene.add(rig.root);
    const w: Walker = { id, name, level, rig, pos: rig.root.position, target: null, wait: Math.random() * 3, speed: 3 + Math.random(), mode: 'wander', raid: null, carry: null, carryKey: '', stun: 0, stuck: 0, lastPos: new THREE.Vector3(), ghost: !bot, facing: 0, speedNow: 0, bot };
    this.labels.set('w:' + id, { target: rig.root, offsetY: 2.75, html: `<span class="nm ${bot ? 'bot' : ''}">${bot ? '🤖 ' : ''}${esc(name)}</span><span class="lv">${level}</span>`, cls: 'tag', maxDist: 36 });
    return w;
  }

  private wanderTarget(w: Walker): THREE.Vector3 {
    const d = this.ownerPlot.get(w.id);
    const r = Math.random();
    if (d && r < 0.4) {
      const p = plotToWorld(d, (Math.random() - 0.5) * 12, 2 + Math.random() * 16);
      return new THREE.Vector3(p.x, 0, p.z);
    }
    if (r < 0.75) return new THREE.Vector3(-50 + Math.random() * 100, 0, (Math.random() < 0.5 ? -1 : 1) * (2.6 + Math.random() * 2.2));
    const z = ZONES[Math.floor(Math.random() * ZONES.length)];
    return new THREE.Vector3(z.anchor.x + (Math.random() - 0.5) * 6, 0, z.anchor.z + (Math.random() - 0.5) * 6);
  }

  private updateWalkers(dt: number) {
    const s = G();
    const now = Date.now();
    const incoming = s.last?.incoming_raids || [];
    const byAttacker = new Map(incoming.map((r) => [r.attacker_id, r]));
    // human thieves (online) get a scripted "ghost" so you can see and tag them
    for (const r of incoming) {
      if (!this.walkers.has(r.attacker_id)) this.walkers.set(r.attacker_id, this.makeWalker(r.attacker_id, r.attacker, 1, false));
    }
    const myPlot = this.plots.get(0);
    for (const [id, w] of this.walkers) {
      const raid = byAttacker.get(id) || null;
      if (raid && w.mode !== 'chase') {
        w.mode = 'thief';
        w.raid = raid;
      } else if (!raid && w.mode === 'thief') {
        this.releaseThief(w);
      }
      if (w.ghost && !raid && w.mode !== 'thief') {
        // ghosts only exist while they're robbing you
        this.scene.remove(w.rig.root);
        this.labels.remove('w:' + id);
        this.walkers.delete(id);
        continue;
      }
      if (w.stun > 0) {
        w.stun -= dt;
        w.rig.root.rotation.y += dt * 12;
        animateAvatar(w.rig, dt, { speed: 0, t: this.t });
        continue;
      }
      let goal: THREE.Vector3 | null = null;
      let speed = w.speed;
      let grabbing = false;
      if (w.mode === 'thief' && w.raid && myPlot) {
        const pod = myPlot.podiums.find((p) => p.piid === w.raid!.player_item_id);
        const podPos = pod ? pod.plate.clone() : new THREE.Vector3(plotInside(myPlot.def).x, 0, plotInside(myPlot.def).z);
        if (w.raid.phase === 'grab') {
          const door = plotDoor(myPlot.def);
          if (w.pos.distanceTo(podPos) > 30) {
            w.pos.set(door.x + (Math.random() - 0.5) * 2, 0, door.z);
            this.fx.spark(w.pos.clone().setY(1), { n: 30, color: '#94a3b8', speed: 3 });
          }
          goal = podPos;
          speed = 6.2;
          if (w.pos.distanceTo(podPos) < 0.6) {
            grabbing = true;
            goal = null;
            if (pod) w.facing = Math.atan2(pod.pos.x - w.pos.x, pod.pos.z - w.pos.z);
          }
          const left = Math.max(0, toClient(w.raid.ends_at) - now);
          this.labels.set('w:' + id, { target: w.rig.root, offsetY: 2.75, html: `<span class="nm thief">🥷 ${esc(w.name)}</span><span class="lv warn">GRABBING ${Math.ceil(left / 1000)}s</span>`, cls: 'tag alert', maxDist: 60 });
        } else {
          // carrying my item back to their base
          if (!w.carry) {
            const cat = s.itemsById[w.raid.item_id];
            if (cat) {
              const pi = s.myItems.find((x) => x.id === w.raid!.player_item_id);
              w.carry = buildItem(cat, pi?.mutation ?? null);
              w.carry.root.scale.setScalar(0.75);
              w.rig.hold.add(w.carry.root);
            }
          }
          const home = this.ownerPlot.get(id);
          const dest = home ? plotToWorld(home, 0, 6) : { x: w.pos.x + 40, z: 20 };
          goal = new THREE.Vector3(dest.x, 0, dest.z);
          const tLeft = Math.max(0.4, (toClient(w.raid.deliver_after || w.raid.ends_at) - now) / 1000);
          speed = Math.max(4.2, Math.min(7.6, w.pos.distanceTo(goal) / tLeft));
          this.labels.set('w:' + id, { target: w.rig.root, offsetY: 3.4, html: `<span class="nm thief">🏃 ${esc(w.name)}</span><span class="lv warn">HAS YOUR ITEM — TAG THEM!</span>`, cls: 'tag alert', maxDist: 90 });
        }
      } else if (w.mode === 'wander') {
        if (w.wait > 0) w.wait -= dt;
        else if (!w.target || w.pos.distanceTo(w.target) < 0.8) {
          w.target = this.wanderTarget(w);
          w.wait = 1 + Math.random() * 5;
        }
        goal = w.wait > 0 ? null : w.target;
        speed = w.speed;
      } else if (w.mode === 'chase') {
        goal = null; // driven by updateChasers
      }
      if (goal) {
        tmpV.subVectors(goal, w.pos).setY(0);
        const d = tmpV.length();
        if (d > 0.1) {
          tmpV.multiplyScalar(Math.min(d, speed * dt) / d);
          this.moveWithCollision(w.pos, tmpV.x, tmpV.z, true, w.mode === 'thief');
          w.facing = Math.atan2(tmpV.x, tmpV.z);
          w.speedNow = speed;
        } else w.speedNow = 0;
        // stuck detection
        if (w.pos.distanceTo(w.lastPos) < speed * dt * 0.2) {
          w.stuck += dt;
          if (w.stuck > 1.5 && w.mode === 'wander') {
            w.target = this.wanderTarget(w);
            w.stuck = 0;
          }
        } else w.stuck = 0;
        w.lastPos.copy(w.pos);
      } else if (w.mode !== 'chase') w.speedNow = 0;
      w.rig.root.rotation.y = lerpAngle(w.rig.root.rotation.y, w.facing, 1 - Math.exp(-dt * 10));
      animateAvatar(w.rig, dt, { speed: w.speedNow, carrying: !!w.carry, grabbing, t: this.t });
      if (w.mode === 'wander') this.labels.set('w:' + id, { target: w.rig.root, offsetY: 2.75, html: `<span class="nm ${w.bot ? 'bot' : ''}">${w.bot ? '🤖 ' : ''}${esc(w.name)}</span><span class="lv">${w.level}</span>`, cls: 'tag', maxDist: 36 });
    }
  }

  private releaseThief(w: Walker) {
    if (w.carry) {
      w.rig.hold.remove(w.carry.root);
      w.carry = null;
    }
    w.mode = 'wander';
    w.raid = null;
    w.target = null;
  }

  private tryTag(attackerId: string) {
    const w = this.walkers.get(attackerId);
    const raid = w?.raid;
    if (!w || !raid || this.tagged.has(raid.id)) return;
    this.tagged.add(raid.id);
    w.stun = 1.6;
    this.fx.spark(w.pos.clone().setY(1.4), { n: 60, color: '#fde047', speed: 6 });
    this.fx.ring(w.pos.clone(), '#fde047', 4);
    this.shake = Math.max(this.shake, 0.4);
    this.pops.at(this.camera, this.w, this.h, tmpV.copy(w.pos).setY(2.6), 'TAGGED!', 'tag', 1.6);
    play('tag');
    defend(raid.id, true)
      .then(() => {
        this.releaseThief(w);
        w.stun = 2;
        this.fx.confetti(this.pos.clone().setY(2), 80);
      })
      .catch(() => {
        this.tagged.delete(raid.id);
      });
  }

  // ── Chasers (when you run off with a bot's item) ─────────────────────
  private startChase() {
    const st = G().steal;
    if (!st || st.tutorial) return;
    const owner = G().world.find((p) => p.id === st.defenderId);
    if (!owner || !owner.is_bot) return;
    const d = this.ownerPlot.get(owner.id);
    const w = this.walkers.get(owner.id);
    if (w) {
      w.mode = 'chase';
      w.raid = null;
      this.chasers.push({ kind: 'owner', walker: w, pos: w.pos, speed: 6.0, t: 0 });
      this.labels.set('w:' + w.id, { target: w.rig.root, offsetY: 2.75, html: `<span class="nm thief">😡 ${esc(w.name)}</span><span class="lv warn">CHASING YOU</span>`, cls: 'tag alert', maxDist: 90 });
    }
    if (d && owner.security_level >= 2) {
      const drone = this.makeDrone();
      const back = plotToWorld(d, 0, PLOT_D - 2);
      drone.position.set(back.x, 2.4, back.z);
      this.scene.add(drone);
      this.chasers.push({ kind: 'drone', obj: drone, pos: drone.position, speed: 5.3 + 0.3 * owner.security_level, t: 0 });
      this.labels.set('drone', { target: drone, offsetY: 1.1, html: `<span class="nm thief">🚨 SECURITY DRONE</span>`, cls: 'tag alert', maxDist: 90 });
      play('alarm');
    }
  }

  private makeDrone() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(gRBox(0.9, 0.35, 0.9, 0.12), std('#1e293b', { metal: 0.8, rough: 0.3 }));
    g.add(body);
    const eye = new THREE.Mesh(gSph(0.16, 12, 10), glow('#ef4444'));
    eye.position.set(0, -0.05, 0.45);
    g.add(eye);
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + (i * Math.PI) / 2;
      const rot = new THREE.Mesh(gCyl(0.3, 0.3, 0.03, 12), std('#94a3b8', { opacity: 0.6 }));
      rot.position.set(Math.cos(a) * 0.62, 0.2, Math.sin(a) * 0.62);
      rot.userData.spin = 40;
      g.add(rot);
    }
    const beam = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.4, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#ef4444', transparent: true, opacity: 0.15, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }));
    beam.position.y = -1.3;
    g.add(beam);
    return g;
  }

  private stopChase() {
    for (const c of this.chasers) {
      if (c.kind === 'owner' && c.walker) {
        c.walker.mode = 'wander';
        c.walker.target = null;
      }
      if (c.kind === 'drone' && c.obj) {
        this.fx.spark(c.obj.position.clone(), { n: 30, color: '#94a3b8', speed: 3 });
        this.scene.remove(c.obj);
        this.labels.remove('drone');
      }
    }
    this.chasers = [];
  }

  private updateChasers(dt: number) {
    if (!this.chasers.length) return;
    const st = G().steal;
    if (!st || st.result || st.phase !== 'carry') {
      this.stopChase();
      return;
    }
    const myDef = PLOTS[0];
    const safe = inPlot(myDef, this.pos.x, this.pos.z, 0.2);
    for (const c of this.chasers) {
      c.t += dt;
      const sp = c.speed + Math.max(0, c.t - 4) * 0.14;
      tmpV.subVectors(this.pos, c.pos).setY(0);
      const d = tmpV.length();
      if (d > 0.05) {
        tmpV.multiplyScalar(Math.min(d, sp * dt) / d);
        const nx = c.pos.x + tmpV.x;
        const nz = c.pos.z + tmpV.z;
        if (!inPlot(myDef, nx, nz, 0.3)) {
          if (c.kind === 'drone') {
            c.pos.x = nx;
            c.pos.z = nz;
          } else this.moveWithCollision(c.pos, tmpV.x, tmpV.z, true, false);
        }
      }
      if (c.kind === 'drone' && c.obj) {
        c.obj.position.y = 2.4 + Math.sin(this.t * 4) * 0.2;
        c.obj.lookAt(this.pos.x, 2.2, this.pos.z);
        c.obj.children.forEach((ch) => {
          if (ch.userData.spin) ch.rotation.y += dt * ch.userData.spin;
        });
      }
      if (c.kind === 'owner' && c.walker) {
        c.walker.facing = Math.atan2(tmpV.x, tmpV.z);
        c.walker.speedNow = sp;
      }
      if (!safe && Math.hypot(this.pos.x - c.pos.x, this.pos.z - c.pos.z) < 1.15) {
        this.onCaught();
        return;
      }
    }
  }

  private onCaught() {
    const st = G().steal;
    if (!st || st.finishing || st.result) return;
    this.stopChase();
    this.zapFx('CAUGHT!');
    abortSteal('caught');
  }

  // ── Steal flow visuals ───────────────────────────────────────────────
  private stealPhase(): 'grab' | 'carry' | null {
    const st = G().steal;
    if (!st || st.result) return null;
    return st.phase;
  }

  private syncSteal() {
    const st = G().steal;
    const sig = st ? `${st.raidId}|${st.phase}|${st.result?.status ?? ''}` : '';
    if (sig === this.lastStealSig) return;
    const prev = this.lastStealSig;
    this.lastStealSig = sig;
    if (!st) {
      this.dropCarry();
      this.stopChase();
      this.grabPos = null;
      return;
    }
    if (st.raidId !== this.lastSteal) {
      this.lastSteal = st.raidId;
      const pv = this.findPodium(st.defenderId, st.playerItemId);
      if (pv) {
        if (!this.grabPos || this.grabPos.distanceTo(pv.pos) > 0.5) this.grabPos = pv.pos.clone();
        if (Math.hypot(this.pos.x - pv.plate.x, this.pos.z - pv.plate.z) > 3.5) this.travelTo(pv.plate.x, pv.plate.z, false);
        this.facing = Math.atan2(pv.pos.x - pv.plate.x, pv.pos.z - pv.plate.z);
      }
      this.fx.spark(this.pos.clone().setY(1.5), { n: 20, color: '#f43f5e', speed: 3 });
    }
    if (st.result) {
      const ok = st.result.status === 'success';
      this.stopChase();
      if (ok) {
        this.dropCarry();
        const tier = RARITY[G().itemsById[st.itemId]?.rarity || 'common'].tier;
        this.fx.confetti(this.pos.clone().setY(2.2), 160 + tier * 20);
        this.fx.coinsBurst(this.pos.clone().setY(1.5), 30);
        this.fx.ring(this.pos.clone(), '#fde047', 7);
        this.fovKick = 10;
        this.slowmo = 0.5;
        this.pops.at(this.camera, this.w, this.h, tmpV.copy(this.pos).setY(3), 'STOLEN!', 'win', 2);
      } else {
        this.dropCarry();
        if (st.result.status !== 'blocked' && !prev.endsWith('failed')) this.zapFx(st.result.caught ? 'CAUGHT!' : 'ZAPPED!');
      }
      return;
    }
    if (st.phase === 'carry') {
      const cat = G().itemsById[st.itemId];
      if (cat && !this.carryModel) {
        this.carryModel = buildItem(cat, st.mutation);
        this.carryModel.root.scale.setScalar(0.8);
        this.rig.hold.add(this.carryModel.root);
      }
      this.fx.spark(this.pos.clone().setY(2.6), { n: 50, color: '#fde047', speed: 5 });
      this.fx.ring(this.pos.clone(), '#fde047', 3);
      this.fovKick = 6;
      if (this.chaseRaid !== st.raidId) {
        this.chaseRaid = st.raidId;
        this.startChase();
      }
    }
  }

  private dropCarry() {
    if (this.carryModel) {
      this.rig.hold.remove(this.carryModel.root);
      this.carryModel = null;
    }
  }

  private zapFx(text: string) {
    play('zap');
    this.shake = Math.max(this.shake, 0.9);
    this.fx.spark(this.pos.clone().setY(1.3), { n: 90, color: '#67e8f9', speed: 7, gravity: 2, size: 0.3 });
    this.fx.spark(this.pos.clone().setY(1.3), { n: 40, color: '#ffffff', speed: 9, gravity: 1, size: 0.22 });
    this.fx.ring(this.pos.clone(), '#67e8f9', 5, 0.5);
    this.pops.at(this.camera, this.w, this.h, tmpV.copy(this.pos).setY(3), text, 'zap', 1.8);
    // knock the player back toward the walkway
    const away = this.grabPos ? tmpV.subVectors(this.pos, this.grabPos).setY(0) : tmpV.set(0, 0, 1);
    if (away.lengthSq() < 0.01) away.set(0, 0, 1);
    away.normalize().multiplyScalar(9);
    this.knock.copy(away);
    this.vy = 5;
    this.grounded = false;
  }

  // ── Player ───────────────────────────────────────────────────────────
  private moveWithCollision(p: THREE.Vector3, dx: number, dz: number, npc = false, ignoreGates = false) {
    const tryAxis = (nx: number, nz: number) => {
      if (nx < WORLD.minX || nx > WORLD.maxX || nz < WORLD.minZ || nz > WORLD.maxZ) return false;
      for (const b of this.colliders) if (circleHitsBox(nx, nz, R, b)) return false;
      if (!ignoreGates) {
        for (const pv of this.plots.values()) {
          if (pv.mine && !npc) continue;
          const lu = pv.mine ? G().me?.lock_until : pv.owner.lock_until;
          if (!lu || toClient(lu) <= Date.now()) continue;
          // lasers keep people out (you can always leave)
          if (!inPlot(pv.def, p.x, p.z, -0.2) && circleHitsBox(nx, nz, R, pv.gate)) return false;
        }
      }
      return true;
    };
    let moved = false;
    if (tryAxis(p.x + dx, p.z)) {
      p.x += dx;
      moved = true;
    }
    if (tryAxis(p.x, p.z + dz)) {
      p.z += dz;
      moved = true;
    }
    return moved;
  }

  private updatePlayer(dt: number) {
    const s = G();
    const phase = this.stealPhase();
    let mx = 0;
    let my = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) mx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) mx += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) my += 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) my -= 1;
    if (this.joy.x || this.joy.y) {
      mx = this.joy.x;
      my = -this.joy.y;
    }
    if (mx || my) this.chaseId = null;
    if (this.chaseId) {
      const w = this.walkers.get(this.chaseId);
      if (!w || w.mode !== 'thief' || !w.raid || this.tagged.has(w.raid.id)) this.chaseId = null;
      else this.target = { x: w.pos.x, z: w.pos.z };
    }
    const fx = -Math.sin(this.camYaw);
    const fz = -Math.cos(this.camYaw);
    const rx = Math.cos(this.camYaw);
    const rz = -Math.sin(this.camYaw);
    let dx = rx * mx + fx * my;
    let dz = rz * mx + fz * my;
    if (!mx && !my && this.target) {
      const tx = this.target.x - this.pos.x;
      const tz = this.target.z - this.pos.z;
      const d = Math.hypot(tx, tz);
      if (d < 0.5) {
        const then = this.target.then;
        this.target = null;
        then?.();
      } else {
        dx = tx / d;
        dz = tz / d;
      }
    }
    const len = Math.hypot(dx, dz);
    let speed = phase === 'carry' ? CARRY : this.sprint || this.keys.has('shift') ? SPRINT : WALK;
    if (phase === 'grab') speed = 0;
    const want = new THREE.Vector3(len > 0.01 ? (dx / Math.max(1, len)) * speed : 0, 0, len > 0.01 ? (dz / Math.max(1, len)) * speed : 0);
    this.vel.lerp(want, 1 - Math.exp(-dt * 12));
    this.vel.add(this.knock);
    this.knock.multiplyScalar(Math.exp(-dt * 6));
    if (this.knock.lengthSq() < 0.01) this.knock.set(0, 0, 0);
    const moved = this.moveWithCollision(this.pos, this.vel.x * dt, this.vel.z * dt);
    if (!moved && this.target) this.target = null;
    this.speedNow = Math.hypot(this.vel.x, this.vel.z);
    if (this.speedNow > 0.4) this.facing = lerpAngle(this.facing, Math.atan2(this.vel.x, this.vel.z), 1 - Math.exp(-dt * 14));
    // jump / gravity
    this.vy -= 24 * dt;
    this.pos.y += this.vy * dt;
    if (this.pos.y <= 0) {
      if (!this.grounded && this.vy < -6) play('land');
      this.pos.y = 0;
      this.vy = 0;
      this.grounded = true;
    }
    this.rig.root.position.copy(this.pos);
    this.rig.root.rotation.y = this.facing;
    const emoting = !!this.emote && performance.now() < this.emote.until;
    animateAvatar(this.rig, dt, { speed: this.speedNow, carrying: phase === 'carry', grabbing: phase === 'grab', air: !this.grounded, t: this.t, emote: emoting });
    if (this.carryModel) this.carryModel.body.rotation.y += dt * 2;
    // footsteps & trail
    if (this.speedNow > 1 && this.grounded) {
      this.stepAt += dt * this.speedNow;
      if (this.stepAt > 2.4) {
        this.stepAt = 0;
        const tr = s.me?.cosmetics?.trail;
        if (tr && tr !== 'trail-none') {
          const c = tr === 'trail-cash' ? '#4ade80' : tr === 'trail-glitch' ? '#22d3ee' : tr === 'trail-comet' ? '#c084fc' : '#fde047';
          this.fx.spark(this.pos.clone().setY(0.2), { n: 6, color: c, speed: 1, up: 1, size: 0.3 });
        }
        if (phase === 'carry') this.fx.spark(this.pos.clone().setY(0.2), { n: 4, color: '#fde047', speed: 1.5, up: 0.8, size: 0.25 });
      }
    }
    // my name tag
    const me = s.me;
    if (me) {
      const em = emoting ? `<span class="emo">${this.emote!.e}</span>` : '';
      this.labels.set('me', { target: this.rig.root, offsetY: phase === 'carry' ? 3.7 : 2.45, html: `${em}<span class="nm me">${esc(me.username)}</span><span class="lv">${me.level}</span>`, cls: 'tag', maxDist: 80 });
    }
    // presence
    const b = s.backend;
    if (b?.presence && me) {
      let plot: string | null = null;
      let x = this.pos.x;
      let y = this.pos.z;
      for (const pv of this.plots.values()) {
        if (inPlot(pv.def, this.pos.x, this.pos.z, 0.5)) {
          plot = pv.owner.id;
          const l = worldToPlot(pv.def, this.pos.x, this.pos.z);
          x = l.lx;
          y = l.ld;
          break;
        }
      }
      b.presence.update({ id: me.id, name: me.username, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, dir: this.facing, moving: this.speedNow > 0.5, plot, carry: phase === 'carry' ? s.steal?.itemId ?? null : null, emote: emoting ? this.emote!.e : null, trail: me.cosmetics?.trail });
    }
  }

  private updatePeers(dt: number) {
    const b = G().backend;
    if (!b?.presence) return;
    const now = performance.now();
    const seen = new Set<string>();
    for (const p of b.presence.peers()) {
      if (this.walkers.has(p.id)) continue; // they're robbing me: shown as a scripted thief
      seen.add(p.id);
      let x = p.x;
      let z = p.y;
      if (p.plot) {
        const d = this.ownerPlot.get(p.plot);
        if (!d) continue;
        const w = plotToWorld(d, p.x, p.y);
        x = w.x;
        z = w.z;
      }
      let pv = this.peers.get(p.id);
      if (!pv) {
        const rig = buildAvatar({ shirt: `hsl(${hashHue(p.id)},70%,52%)`, accent: '#f0abfc' });
        rig.root.position.set(x, 0, z);
        this.scene.add(rig.root);
        pv = { id: p.id, rig, pos: rig.root.position, target: new THREE.Vector3(x, 0, z), facing: p.dir, carry: null, carryId: null, seen: now };
        this.peers.set(p.id, pv);
      }
      pv.target.set(x, 0, z);
      pv.facing = p.dir;
      pv.seen = now;
      if ((p.carry || null) !== pv.carryId) {
        if (pv.carry) pv.rig.hold.remove(pv.carry.root);
        pv.carry = null;
        pv.carryId = p.carry || null;
        const cat = p.carry ? G().itemsById[p.carry] : null;
        if (cat) {
          pv.carry = buildItem(cat, null);
          pv.carry.root.scale.setScalar(0.75);
          pv.rig.hold.add(pv.carry.root);
        }
      }
      this.labels.set('peer:' + p.id, { target: pv.rig.root, offsetY: pv.carry ? 3.9 : 2.8, html: `${p.emote ? `<span class="emo">${p.emote}</span>` : ''}<span class="nm peer">${esc(p.name)}</span>`, cls: 'tag', maxDist: 50 });
    }
    for (const [id, pv] of this.peers) {
      if (!seen.has(id)) {
        this.scene.remove(pv.rig.root);
        this.labels.remove('peer:' + id);
        this.peers.delete(id);
        continue;
      }
      const d = pv.pos.distanceTo(pv.target);
      if (d > 12) pv.pos.copy(pv.target);
      else pv.pos.lerp(pv.target, 1 - Math.exp(-dt * 8));
      pv.rig.root.rotation.y = lerpAngle(pv.rig.root.rotation.y, pv.facing, 1 - Math.exp(-dt * 10));
      animateAvatar(pv.rig, dt, { speed: d * 6, carrying: !!pv.carry, t: this.t });
    }
  }

  private updateShopkeepers(dt: number, now: number) {
    if (!this.bubble || now > this.bubble.until) {
      if (this.bubble) {
        const sk = this.shopkeepers[this.bubble.i];
        this.labels.set(sk.key, { target: sk.rig.root, offsetY: 2.9, html: `<span class="nm npc">${sk.name}</span>`, cls: 'tag', maxDist: 34 });
        this.bubble = null;
      }
      if (Math.random() < dt * 0.25) {
        const i = Math.floor(Math.random() * this.shopkeepers.length);
        const sk = this.shopkeepers[i];
        const line = sk.lines[Math.floor(Math.random() * sk.lines.length)];
        this.bubble = { i, until: now + 4200 };
        this.labels.set(sk.key, { target: sk.rig.root, offsetY: 2.9, html: `<span class="say">${line}</span><span class="nm npc">${sk.name}</span>`, cls: 'tag', maxDist: 34 });
      }
    }
    for (const sk of this.shopkeepers) animateAvatar(sk.rig, dt, { speed: 0, t: this.t + sk.pos.x, emote: this.bubble?.i === this.shopkeepers.indexOf(sk) });
  }

  // ── Interactions & prompts ───────────────────────────────────────────
  private updateInteractions(dt: number) {
    const s = G();
    const me = s.me;
    if (!me) return;
    if (!this.plots.get(0) || !inPlot(PLOTS[0], this.pos.x, this.pos.z, 0)) {
      this.onPlate = null;
      this.onColPad = false;
    }
    const st = s.steal;
    const phase = this.stealPhase();
    const nowC = Date.now();
    let prompt: Prompt | null = null;
    let here: { playerId: string; name: string; mine: boolean } | null = null;
    const myPlot = this.plots.get(0);
    const inMine = myPlot ? inPlot(myPlot.def, this.pos.x, this.pos.z, 0) : false;

    // where am I?
    for (const pv of this.plots.values()) {
      if (inPlot(pv.def, this.pos.x, this.pos.z, 0)) {
        here = { playerId: pv.owner.id, name: pv.owner.username, mine: pv.mine };
        break;
      }
    }

    if (phase === 'grab' && st) {
      if (this.grabPos && Math.hypot(this.pos.x - this.grabPos.x, this.pos.z - this.grabPos.z) > 5.5 && !st.finishing) abortSteal('abort');
    } else if (phase === 'carry' && st) {
      const left = Math.max(0, st.carryUntil - nowC);
      if (inMine) {
        prompt = { kind: 'carry', id: st.raidId, label: nowC >= st.deliverAfter - 300 ? 'DELIVERING…' : 'SAFE! HOLD ON…', icon: '🏠', tone: 'good' };
        if (nowC >= st.deliverAfter - 300 && !st.finishing && nowC - this.deliverTry > 800) {
          this.deliverTry = nowC;
          deliverSteal();
        }
      } else prompt = { kind: 'carry', id: st.raidId, label: `RUN HOME! ${Math.ceil(left / 1000)}s`, icon: '🏃', sub: 'Get it inside your base', tone: 'gold' };
    }

    // thieves in my base → tag them
    if (!prompt) {
      for (const w of this.walkers.values()) {
        if (w.mode !== 'thief' || !w.raid || w.stun > 0 || this.tagged.has(w.raid.id)) continue;
        const d = Math.hypot(w.pos.x - this.pos.x, w.pos.z - this.pos.z);
        if (d < 1.5) {
          this.tryTag(w.id);
          break;
        }
        if (d < 4) {
          prompt = { kind: 'tag', id: w.id, label: `TAG ${w.name}!`, icon: '👊', tone: 'hot' };
          break;
        }
      }
    }

    // belt
    if (!prompt && !phase && Math.abs(this.pos.z) < 5.2) {
      // stick with the item you're next to until it walks out of reach
      let bv = this.beltFocus != null ? this.belt.get(this.beltFocus) ?? null : null;
      if (bv && (bv.leave || bv.row.sold_to || !bv.model.root.visible || Math.hypot(bv.model.root.position.x - this.pos.x, bv.model.root.position.z - this.pos.z) > 4.6)) bv = null;
      if (!bv) bv = this.nearestBelt(3.3);
      this.beltFocus = bv ? bv.row.id : null;
      if (bv) {
        const afford = me.cash >= bv.row.price;
        prompt = {
          kind: 'belt', id: String(bv.row.id), icon: '🛒', tone: afford ? 'good' : undefined,
          label: afford ? `BUY ${bv.it.name}` : `NEED ${shortMoney(bv.row.price - me.cash)} MORE`,
          sub: `${shortMoney(bv.row.price)} · +${perSec(bv.it.base_income * (mutationDef(bv.row.mutation)?.mult ?? 1))}${bv.row.mutation ? ' · ' + (mutationDef(bv.row.mutation)?.label ?? '') : ''}`,
        };
      }
    }

    // someone else's base: steal
    if (!prompt && !phase && here && !here.mine) {
      const pv = this.plots.get(this.ownerPlot.get(here.playerId)!.index)!;
      let best: PodiumView | null = null;
      let bd = 2.6;
      for (const pod of pv.podiums) {
        if (!pod.model || pod.hidden) continue;
        const d = Math.min(Math.hypot(pod.pos.x - this.pos.x, pod.pos.z - this.pos.z), Math.hypot(pod.plate.x - this.pos.x, pod.plate.z - this.pos.z) + 0.3);
        if (d < bd) {
          bd = d;
          best = pod;
        }
      }
      if (best && best.itemId) {
        const info = this.getBaseInfo(pv.owner.id);
        const item = info?.items.find((x) => x.id === best!.piid);
        const cat = s.itemsById[best.itemId];
        const soul = item?.soulbound;
        const block = info?.raid_block;
        const cd = me.raid_cooldown_until && toClient(me.raid_cooldown_until) > nowC ? Math.ceil((toClient(me.raid_cooldown_until) - nowC) / 1000) : 0;
        const chance = item?.chance != null ? Math.round(item.chance * 100) : null;
        prompt = {
          kind: 'steal', id: best.piid!, icon: '🥷', tone: 'hot',
          label: soul ? 'STARTER — CAN\'T STEAL' : block ? block.replace(/\.$/, '') : cd ? `LAY LOW ${cd}s` : `STEAL ${cat?.name ?? ''}`,
          sub: soul || block || cd ? undefined : `${chance != null ? chance + '% · ' : ''}${item?.seconds ?? '?'}s grab · then RUN`,
          disabled: !!(soul || block || cd),
          playerId: pv.owner.id,
        };
      }
      if (!prompt) prompt = { kind: 'plot', id: here.playerId, label: `${here.name}'s BASE`, icon: '👀', playerId: here.playerId, mine: false };
    }

    // my base: pads + podium plates
    if (inMine && myPlot && !phase) {
      const lp = lockPad(myPlot.def);
      if (Math.hypot(lp.x - this.pos.x, lp.z - this.pos.z) < 1.1 && nowC > this.lockCooldown) {
        this.lockCooldown = nowC + 3000;
        const locked = me.lock_until && toClient(me.lock_until) > nowC;
        if (!locked) {
          lockBase().then((ok) => {
            if (ok) {
              this.fx.spark(new THREE.Vector3(lp.x, 0.5, lp.z), { n: 50, color: '#ff2a4f', speed: 5 });
              const gp = plotToWorld(myPlot.def, 0, 0.2);
              this.fx.ring(new THREE.Vector3(gp.x, 0.2, gp.z), '#ff2a4f', 9);
            }
          });
        }
      }
      const cp = collectPad(myPlot.def);
      const onPad = Math.hypot(cp.x - this.pos.x, cp.z - this.pos.z) < 1.1;
      if (onPad && !this.onColPad && nowC > this.collectAllCooldown) {
        this.collectAllCooldown = nowC + 1500;
        this.collectAll(new THREE.Vector3(cp.x, 0.4, cp.z));
      }
      this.onColPad = onPad;
      // step onto a plate = collect it once (step off and on again for more)
      let on: string | null = null;
      for (const pod of myPlot.podiums) {
        if (!pod.piid || pod.hidden) continue;
        if (Math.hypot(pod.plate.x - this.pos.x, pod.plate.z - this.pos.z) < 0.85) {
          on = pod.piid;
          if (this.onPlate !== pod.piid) this.collectPodium(pod);
          break;
        }
      }
      this.onPlate = on;
      if (!prompt) prompt = { kind: 'plot', id: me.id, label: 'MANAGE MY BASE', icon: '🏠', playerId: me.id, mine: true };
    }

    // zones
    if (!prompt && !phase) {
      for (const z of ZONES) {
        if (inZone(z, this.pos.x, this.pos.z)) {
          prompt = { kind: 'zone', id: z.id, label: `ENTER ${z.label}`, icon: z.icon, tone: 'primary' };
          break;
        }
      }
    }

    const key = prompt ? `${prompt.kind}|${prompt.id}|${prompt.label}|${prompt.sub}|${prompt.disabled}` : '';
    const ui = useWorldUI.getState();
    if (key !== this.lastPromptKey || here?.playerId !== ui.here?.playerId) {
      this.lastPromptKey = key;
      useWorldUI.setState({ prompt, here });
    }
    // carry compass (10 Hz)
    if (nowC - this.homeAt > 100) {
      this.homeAt = nowC;
      if (phase === 'carry' && myPlot) {
        const home = plotInside(myPlot.def);
        const dx = home.x - this.pos.x;
        const dz = home.z - this.pos.z;
        const ang = Math.atan2(dx, dz) - Math.atan2(-Math.sin(this.camYaw), -Math.cos(this.camYaw));
        useWorldUI.setState({ home: { angle: -ang, dist: Math.hypot(dx, dz), inside: inMine } });
      } else if (ui.home) useWorldUI.setState({ home: null });
    }
    // combo decay
    if (this.combo && nowC - this.comboAt > 1500) this.combo = 0;
    void dt;
  }

  private getBaseInfo(ownerId: string): BaseView | null {
    const now = Date.now();
    const e = this.baseInfo.get(ownerId);
    if (!e || (now - e.at > 12000 && !e.loading)) {
      const entry = e || { at: now, data: null, loading: true };
      entry.loading = true;
      entry.at = now;
      this.baseInfo.set(ownerId, entry);
      fetchBase(ownerId).then((d) => {
        entry.data = d;
        entry.loading = false;
        entry.at = Date.now();
      });
    }
    return this.baseInfo.get(ownerId)?.data ?? null;
  }

  private tryStartSteal(piid: string) {
    const st = G().steal;
    if (st && !st.result) return;
    const pv = [...this.plots.values()].find((p) => p.podiums.some((x) => x.piid === piid));
    const pod = pv?.podiums.find((x) => x.piid === piid);
    if (pod) {
      this.grabPos = pod.pos.clone();
      this.facing = Math.atan2(pod.pos.x - this.pos.x, pod.pos.z - this.pos.z);
    }
    if (st?.result) setG({ steal: null });
    startSteal(piid)
      .then(() => {
        if (pv) this.baseInfo.delete(pv.owner.id);
        this.shake = Math.max(this.shake, 0.2);
      })
      .catch(() => {});
  }

  private collectPodium(pod: PodiumView) {
    const now = Date.now();
    if ((this.plateCooldown.get(pod.piid!) || 0) > now) return;
    const pi = G().myItems.find((x) => x.id === pod.piid);
    if (!pi) return;
    const amt = pendingOf(pi, this.localAccrued.get(pi.id));
    if (amt < 1) return;
    this.plateCooldown.set(pod.piid!, now + 1200);
    this.localAccrued.set(pi.id, now);
    this.combo = now - this.comboAt < 1500 ? this.combo + 1 : 1;
    this.comboAt = now;
    coinCombo(this.combo);
    const from = pod.pos.clone().setY(1.2);
    this.fx.coinsBurst(from, Math.max(5, Math.min(34, Math.round(Math.log10(amt + 1) * 7))), this.pos.clone().setY(1.3));
    this.fx.spark(from, { n: 18, color: '#4ade80', speed: 3 });
    this.pops.at(this.camera, this.w, this.h, tmpV.copy(from).setY(2.2), '+' + shortMoney(amt), 'cash', Math.min(1.8, 0.9 + Math.log10(amt + 1) * 0.12));
    if (this.combo >= 3) this.pops.at(this.camera, this.w, this.h, tmpV.copy(this.pos).setY(3.2), `x${this.combo} COMBO!`, 'combo', 1.1 + Math.min(0.8, this.combo * 0.05));
    collect(pi.id).then((got) => {
      if (got <= 0) this.localAccrued.delete(pi.id);
    });
  }

  private collectAll(at: THREE.Vector3) {
    const total = this.totalPending();
    if (total < 1) {
      this.pops.at(this.camera, this.w, this.h, tmpV.copy(at).setY(2), 'NOTHING YET', 'dim', 0.8);
      return;
    }
    const now = Date.now();
    for (const pi of G().myItems) if (pi.location === 'display') this.localAccrued.set(pi.id, now);
    for (const pod of this.plots.get(0)?.podiums || []) if (pod.piid && !pod.hidden) this.fx.coinsBurst(pod.pos.clone().setY(1.2), 6, this.pos.clone().setY(1.3));
    coinCombo(6);
    play('cash');
    this.pops.at(this.camera, this.w, this.h, tmpV.copy(at).setY(2.4), '+' + shortMoney(total), 'cash', 1.8);
    this.fovKick = 4;
    collect(null);
  }

  private focusRequests() {
    const s = G();
    if (s.focusPlot && s.focusPlot !== this.lastFocus) {
      this.lastFocus = s.focusPlot;
      this.travelToPlot(s.focusPlot);
      window.setTimeout(() => {
        setG({ focusPlot: null });
        this.lastFocus = null;
      }, 400);
    }
  }

  // ── Camera ───────────────────────────────────────────────────────────
  private snapCamera() {
    this.updateCamera(1, true);
  }

  private updateCamera(dt: number, snap = false) {
    if (this.yawGoal != null) {
      this.camYaw = lerpAngle(this.camYaw, this.yawGoal, 1 - Math.exp(-dt * 4));
      if (Math.abs(angleDiff(this.camYaw, this.yawGoal)) < 0.01) this.yawGoal = null;
    }
    const target = tmpV.copy(this.pos).add(new THREE.Vector3(0, 1.7, 0));
    const cp = Math.cos(this.camPitch);
    const desired = tmpV2.set(target.x + Math.sin(this.camYaw) * cp * this.camDist, target.y + Math.sin(this.camPitch) * this.camDist, target.z + Math.cos(this.camYaw) * cp * this.camDist);
    if (snap) this.camera.position.copy(desired);
    else this.camera.position.lerp(desired, 1 - Math.exp(-dt * 10));
    if (this.shake > 0 && !G().settings.reduceMotion) {
      const k = this.shake * 0.4;
      this.camera.position.x += (Math.random() - 0.5) * k;
      this.camera.position.y += (Math.random() - 0.5) * k;
      this.camera.position.z += (Math.random() - 0.5) * k;
    }
    this.shake = Math.max(0, this.shake - dt * 2.2);
    this.camera.lookAt(target);
    const fov = 55 + this.fovKick;
    if (Math.abs(this.camera.fov - fov) > 0.01) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
    this.fovKick = Math.max(0, this.fovKick - dt * 14);
  }

  // ── Input ────────────────────────────────────────────────────────────
  private typing(e: KeyboardEvent) {
    const el = e.target as HTMLElement | null;
    return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
  }

  private onKey = (e: KeyboardEvent) => {
    if (this.typing(e)) return;
    const k = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) {
      if (G().panel && k.startsWith('arrow')) return;
      this.keys.add(k);
      this.target = null;
      if (k.startsWith('arrow')) e.preventDefault();
    } else if (k === ' ' && !G().panel) {
      this.jump();
      e.preventDefault();
    } else if ((k === 'e' || k === 'enter') && !G().panel) {
      if (!e.repeat) this.interact();
      e.preventDefault();
    }
  };
  private onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase());
  private onBlur = () => this.keys.clear();

  private onPointerDown = (e: PointerEvent) => {
    this.canvas.setPointerCapture?.(e.pointerId);
    this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.touches.size === 2) {
      const [a, b] = [...this.touches.values()];
      this.pinch = Math.hypot(a.x - b.x, a.y - b.y);
      this.drag = null;
      return;
    }
    this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, button: e.button };
  };

  private onPointerMove = (e: PointerEvent) => {
    if (this.touches.has(e.pointerId)) this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.touches.size === 2) {
      const [a, b] = [...this.touches.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (this.pinch > 0) this.camDist = clamp(this.camDist * (this.pinch / Math.max(1, d)), 5, 28);
      this.pinch = d;
      return;
    }
    if (this.drag && this.drag.id === e.pointerId) {
      const dx = e.clientX - this.drag.x;
      const dy = e.clientY - this.drag.y;
      if (!this.drag.moved && Math.hypot(dx, dy) > 6) this.drag.moved = true;
      if (this.drag.moved) {
        this.yawGoal = null;
        this.camYaw -= dx * 0.006;
        this.camPitch = clamp(this.camPitch + dy * 0.004, 0.12, 1.3);
        this.drag.x = e.clientX;
        this.drag.y = e.clientY;
      }
      return;
    }
    if (e.pointerType === 'mouse') {
      const now = performance.now();
      if (now - this.hoverAt < 60) return;
      this.hoverAt = now;
      const hit = this.pick(e.clientX, e.clientY);
      const cur = useWorldUI.getState().hover;
      if (hit) {
        const r = this.canvas.getBoundingClientRect();
        const sx = e.clientX - r.left;
        const sy = e.clientY - r.top;
        if (!cur || cur.itemId !== hit.itemId || Math.abs(cur.sx - sx) > 4 || Math.abs(cur.sy - sy) > 4) {
          const b = hit.beltId ? this.belt.get(hit.beltId) : null;
          useWorldUI.setState({ hover: { itemId: hit.itemId, ownerName: b ? 'Tech Belt' : hit.ownerName || '', mutation: hit.mutation, price: b?.row.price, sx, sy } });
        }
        this.canvas.style.cursor = 'pointer';
      } else {
        if (cur) useWorldUI.setState({ hover: null });
        this.canvas.style.cursor = 'grab';
      }
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    this.touches.delete(e.pointerId);
    if (this.touches.size < 2) this.pinch = 0;
    const d = this.drag;
    if (!d || d.id !== e.pointerId) return;
    this.drag = null;
    if (d.moved || d.button === 2) return;
    this.click(e.clientX, e.clientY);
  };

  private onWheel = (e: WheelEvent) => {
    this.camDist = clamp(this.camDist * (1 + e.deltaY * 0.0012), 5, 28);
  };

  private ndc(x: number, y: number) {
    const r = this.canvas.getBoundingClientRect();
    return new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
  }

  private pick(x: number, y: number): any {
    this.raycaster.setFromCamera(this.ndc(x, y), this.camera);
    const hits = this.raycaster.intersectObjects(this.pickables, true);
    for (const h of hits) {
      let o: THREE.Object3D | null = h.object;
      while (o && !o.userData.pick) o = o.parent;
      if (o && o.visible) return o.userData;
    }
    return null;
  }

  private click(x: number, y: number) {
    const hit = this.pick(x, y);
    const r = this.canvas.getBoundingClientRect();
    if (hit) {
      play('click');
      if (hit.pick === 'belt') {
        const bv = this.belt.get(hit.beltId);
        if (!bv || bv.row.sold_to) return;
        useWorldUI.setState({ selected: { playerItemId: '', itemId: hit.itemId, ownerId: '', ownerName: 'Tech Belt', mine: false, mutation: hit.mutation, beltId: hit.beltId, price: bv.row.price, sx: x - r.left, sy: y - r.top } });
      } else {
        useWorldUI.setState({ selected: { playerItemId: hit.piid, itemId: hit.itemId, ownerId: hit.ownerId, ownerName: hit.ownerName, mine: hit.mine, mutation: hit.mutation, sx: x - r.left, sy: y - r.top } });
      }
      return;
    }
    useWorldUI.setState({ selected: null });
    this.raycaster.setFromCamera(this.ndc(x, y), this.camera);
    const p = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.groundPlane, p)) return;
    const zone = ZONES.find((z) => p.x >= z.x0 - 6 && p.x <= z.x1 + 6 && p.z >= z.z0 - 4 && p.z <= z.z1 + 4);
    if (zone && Math.hypot(p.x - this.pos.x, p.z - this.pos.z) > 3) {
      this.target = { x: zone.anchor.x, z: zone.anchor.z, then: () => openPanel(ZONE_PANEL[zone.id]) };
    } else this.target = { x: p.x, z: p.z };
    this.fx.ring(p, '#67e8f9', 1.2, 0.4);
  }

  /** Smoothly swing the camera so it looks from the player toward (x, z). */
  lookToward(x: number, z: number) {
    const dx = x - this.pos.x;
    const dz = z - this.pos.z;
    if (Math.hypot(dx, dz) < 0.1) return;
    // camera sits opposite the look direction
    this.yawGoal = Math.atan2(-dx, -dz);
  }
  lookAtBelt() {
    this.lookToward(this.pos.x, 0);
  }
  lookAtMyBase() {
    const d = PLOTS[0];
    const c = plotToWorld(d, 0, 12);
    this.lookToward(c.x, c.z);
  }

  /** Auto-run after a thief until you tag them (from the raid alarm). */
  chase(attackerId: string) {
    const w = this.walkers.get(attackerId);
    if (!w) return;
    this.chaseId = attackerId;
    play('run');
    if (this.pos.distanceTo(w.pos) > 45) {
      const p = w.pos.clone().add(new THREE.Vector3(2, 0, 2));
      this.travelTo(p.x, p.z, false);
    }
  }

  /** Walk to a belt item and buy it (from the popover). */
  runToBuy(beltId: number) {
    const bv = this.belt.get(beltId);
    if (!bv) return;
    const d = Math.hypot(bv.model.root.position.x - this.pos.x, bv.model.root.position.z - this.pos.z);
    if (d < 3.3) {
      this.tryBuy(beltId);
      return;
    }
    // intercept: aim ahead of it on the walkway
    const lead = Math.min(10, d / 7) * ((BELT.x1 - BELT.x0) / 36);
    const side = this.pos.z >= 0 ? 2.4 : -2.4;
    this.target = {
      x: Math.min(BELT.x1 - 1, bv.model.root.position.x + lead),
      z: side,
      then: () => {
        const b2 = this.belt.get(beltId);
        if (b2 && !b2.row.sold_to && Math.hypot(b2.model.root.position.x - this.pos.x, b2.model.root.position.z - this.pos.z) < 4.5) this.tryBuy(beltId);
      },
    };
  }

  /** Walk to a podium in someone's base and start stealing it (from the popover). */
  runToSteal(ownerId: string, piid: string) {
    const pod = this.findPodium(ownerId, piid);
    if (!pod) {
      this.stealFromPanel(ownerId, piid);
      return;
    }
    this.target = { x: pod.plate.x, z: pod.plate.z, then: () => this.tryStartSteal(piid) };
  }

  // ── Screens & minimap ────────────────────────────────────────────────
  private drawScreens() {
    const s = G();
    const sc = this.scenery.screens;
    // market ticker
    {
      const { c, w, h } = sc.market;
      c.fillStyle = '#050816';
      c.fillRect(0, 0, w, h);
      c.font = "900 44px 'Orbitron', sans-serif";
      c.fillStyle = '#22d3ee';
      c.fillText('CENTRAL MARKET', 24, 58);
      const rows = Object.values(s.market)
        .filter((r) => (RARITY[s.itemsById[r.item_id]?.rarity]?.tier ?? 0) >= 3)
        .sort((a, b) => Math.abs(b.change_24h) - Math.abs(a.change_24h))
        .slice(0, 6);
      c.font = "700 30px 'Rajdhani', sans-serif";
      rows.forEach((r, i) => {
        const x = 24 + (i % 3) * 330;
        const y = 120 + Math.floor(i / 3) * 70;
        c.fillStyle = '#e2e8f0';
        c.fillText((s.itemsById[r.item_id]?.name || r.item_id).slice(0, 16), x, y);
        c.fillStyle = r.change_24h >= 0 ? '#4ade80' : '#f87171';
        c.fillText(`${r.change_24h >= 0 ? '▲' : '▼'} ${Math.abs(r.change_24h).toFixed(1)}%  ${shortMoney(r.price)}`, x, y + 32);
      });
      sc.market.tex.needsUpdate = true;
    }
    // raid board
    {
      const { c, w, h } = sc.raid;
      c.fillStyle = '#12060b';
      c.fillRect(0, 0, w, h);
      c.font = "900 38px 'Orbitron', sans-serif";
      c.fillStyle = '#fb7185';
      c.fillText('MOST WANTED', 24, 52);
      const top = s.world.filter((p) => p.id !== s.me?.id).sort((a, b) => b.base_value - a.base_value).slice(0, 5);
      c.font = "800 30px 'Rajdhani', sans-serif";
      top.forEach((p, i) => {
        const y = 110 + i * 54;
        c.fillStyle = '#fde68a';
        c.fillText(`${i + 1}. ${p.is_bot ? '🤖 ' : ''}${p.username}`, 24, y);
        c.fillStyle = '#4ade80';
        c.textAlign = 'right';
        c.fillText(`${shortMoney(p.base_value)} · SEC ${p.security_level}${p.lock_until && toClient(p.lock_until) > Date.now() ? ' 🔒' : ''}`, w - 20, y);
        c.textAlign = 'left';
      });
      sc.raid.tex.needsUpdate = true;
    }
    // stage
    {
      const { c, w, h } = sc.stage;
      const ev = s.last?.event;
      const g = c.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#2e1065');
      g.addColorStop(1, '#831843');
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
      c.textAlign = 'center';
      c.fillStyle = '#fff';
      c.font = "900 54px 'Orbitron', sans-serif";
      if (ev) {
        c.fillText(`${ev.icon} ${ev.title}`, w / 2, 150);
        c.font = "700 34px 'Rajdhani', sans-serif";
        c.fillText(ev.description.slice(0, 48), w / 2, 220);
        c.fillStyle = '#fde047';
        c.fillText('ENDS IN ' + duration(toClient(ev.ends_at) - Date.now()), w / 2, 300);
      } else {
        c.fillText('NEXT EVENT', w / 2, 150);
        c.fillStyle = '#fde047';
        c.font = "900 64px 'Orbitron', sans-serif";
        c.fillText(s.last?.next_event_at ? duration(toClient(s.last.next_event_at) - Date.now()) : '—', w / 2, 250);
      }
      c.textAlign = 'left';
      sc.stage.tex.needsUpdate = true;
    }
    // hall of fame
    {
      const { c, w, h } = sc.fame;
      c.fillStyle = '#0b1020';
      c.fillRect(0, 0, w, h);
      c.textAlign = 'center';
      c.font = "900 28px 'Orbitron', sans-serif";
      c.fillStyle = '#fbbf24';
      c.fillText('HALL OF', w / 2, 50);
      c.fillText('FAME', w / 2, 84);
      const top = [...s.world].sort((a, b) => b.base_value - a.base_value).slice(0, 5);
      c.font = "800 24px 'Rajdhani', sans-serif";
      top.forEach((p, i) => {
        c.fillStyle = i === 0 ? '#fde047' : '#e2e8f0';
        c.fillText(`${['👑', '🥈', '🥉', '4', '5'][i]} ${p.username.slice(0, 12)}`, w / 2, 150 + i * 60);
        c.fillStyle = '#4ade80';
        c.fillText(shortMoney(p.base_value), w / 2, 176 + i * 60);
      });
      c.textAlign = 'left';
      sc.fame.tex.needsUpdate = true;
    }
    // kiosk
    {
      const { c, w, h } = sc.kiosk;
      c.fillStyle = '#1e1b4b';
      c.fillRect(0, 0, w, h);
      c.textAlign = 'center';
      c.font = "900 30px 'Orbitron', sans-serif";
      c.fillStyle = '#fde047';
      c.fillText('MISSIONS', w / 2, 70);
      const n = (s.last?.quests_claimable || 0) + (s.me?.daily.can_claim ? 1 : 0);
      c.font = "900 90px 'Orbitron', sans-serif";
      c.fillStyle = n ? '#4ade80' : '#64748b';
      c.fillText(String(n), w / 2, 180);
      c.font = "700 24px 'Rajdhani', sans-serif";
      c.fillStyle = '#e2e8f0';
      c.fillText(n ? 'READY TO CLAIM' : 'keep playing', w / 2, 230);
      c.textAlign = 'left';
      sc.kiosk.tex.needsUpdate = true;
    }
    // museum
    {
      const { c, w, h } = sc.museum;
      c.fillStyle = '#f8fafc';
      c.fillRect(0, 0, w, h);
      c.textAlign = 'center';
      c.fillStyle = '#0f172a';
      c.font = "900 24px 'Orbitron', sans-serif";
      c.fillText('MUSEUM', w / 2, 40);
      const total = s.catalog ? s.catalog.items.filter((i) => i.droppable || i.event_only).length : 1;
      c.font = "900 44px 'Orbitron', sans-serif";
      c.fillStyle = '#7c3aed';
      c.fillText(Math.round(((s.me?.collection_count || 0) / total) * 100) + '%', w / 2, 100);
      c.textAlign = 'left';
      sc.museum.tex.needsUpdate = true;
    }
    // drop machine locks
    const drops = s.catalog?.drops || [];
    for (const m of this.scenery.machines) {
      const d = drops.find((x) => x.id === m.id);
      const locked = !s.me || !d || s.me.level < d.min_level || (d.event_only && !s.last?.event) || (d.requires_key && (s.me.secret_keys || 0) < 1);
      m.light.opacity = locked ? 0.25 : 1;
      m.light.transparent = locked;
      const tokens = s.me?.drop_tokens?.[m.id] || 0;
      if (d) this.labels.set('mach:' + m.id, { pos: m.pos, html: `<b>${d.name}</b><i>${locked ? '🔒 ' + (d.event_only ? 'EVENTS ONLY' : d.requires_key ? 'NEEDS KEY' : 'LV ' + d.min_level) : shortMoney(d.price)}</i>${tokens ? `<em>${tokens} FREE</em>` : ''}`, cls: 'mach' + (locked ? ' locked' : ''), maxDist: 40 });
    }
  }

  private drawMinimap() {
    const cv = this.minimap;
    if (this.w < 700) {
      cv.style.display = 'none';
      return;
    }
    cv.style.display = '';
    const c = cv.getContext('2d')!;
    const W = cv.width;
    const H = cv.height;
    const sx = W / (WORLD.maxX - WORLD.minX);
    const sz = H / (WORLD.maxZ - WORLD.minZ);
    const X = (x: number) => (x - WORLD.minX) * sx;
    const Z = (z: number) => (z - WORLD.minZ) * sz;
    c.clearRect(0, 0, W, H);
    c.fillStyle = 'rgba(2,6,23,0.8)';
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#334155';
    c.fillRect(X(BELT.x0), Z(-1.7), (BELT.x1 - BELT.x0) * sx, 3.4 * sz);
    for (const pv of this.plots.values()) {
      const a = plotToWorld(pv.def, -PLOT_W / 2, 0);
      const b = plotToWorld(pv.def, PLOT_W / 2, PLOT_D);
      c.fillStyle = pv.mine ? '#facc15' : pv.owner.is_bot ? '#475569' : '#38bdf8';
      c.fillRect(X(Math.min(a.x, b.x)), Z(Math.min(a.z, b.z)), PLOT_W * sx, PLOT_D * sz);
      const lu = pv.mine ? G().me?.lock_until : pv.owner.lock_until;
      if (lu && toClient(lu) > Date.now()) {
        c.fillStyle = '#ef4444';
        c.fillRect(X(Math.min(a.x, b.x)), Z(pv.def.side > 0 ? a.z : a.z - 1), PLOT_W * sx, 2);
      }
    }
    for (const z of ZONES) {
      c.fillStyle = '#e879f9';
      c.fillRect(X(z.anchor.x) - 2, Z(z.anchor.z) - 2, 4, 4);
    }
    for (const bv of this.belt.values()) {
      if (!bv.model.root.visible || bv.leave) continue;
      const tier = RARITY[bv.it.rarity].tier;
      if (tier < 3 && !bv.row.mutation) continue;
      c.fillStyle = bv.row.mutation ? MUTATION_COLORS[bv.row.mutation] : RARITY[bv.it.rarity].color;
      c.beginPath();
      c.arc(X(bv.model.root.position.x), Z(0), tier >= 5 ? 3.5 : 2, 0, Math.PI * 2);
      c.fill();
    }
    for (const w of this.walkers.values()) {
      c.fillStyle = w.mode === 'thief' || w.mode === 'chase' ? '#f43f5e' : '#94a3b8';
      c.fillRect(X(w.pos.x) - 1.5, Z(w.pos.z) - 1.5, 3, 3);
    }
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(X(this.pos.x), Z(this.pos.z), 3.5, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(56,189,248,0.5)';
    c.strokeRect(0.5, 0.5, W - 1, H - 1);
  }
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function angleDiff(a: number, b: number) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function lerpAngle(a: number, b: number, k: number) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}

function esc(s: string) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

export let engine: WorldEngine | null = null;
export function setEngine(e: WorldEngine | null) {
  engine = e;
}

