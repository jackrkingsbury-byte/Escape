// Crisp HTML labels pinned to 3D positions (name tags, belt price tags, cash
// piles on podiums, grab timers). One absolutely-positioned layer, pooled divs.
import * as THREE from 'three';

export interface Label {
  el: HTMLDivElement;
  target: THREE.Object3D | null;
  pos: THREE.Vector3; // used when target is null
  offsetY: number;
  maxDist: number;
  html: string;
  cls: string;
  visible: boolean;
  scaleWithDistance: boolean;
}

const v = new THREE.Vector3();

export class LabelLayer {
  private root: HTMLDivElement;
  private labels = new Map<string, Label>();

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'label-layer';
    parent.appendChild(this.root);
  }

  destroy() {
    this.root.remove();
    this.labels.clear();
  }

  get(key: string) {
    return this.labels.get(key);
  }

  /** Create or update a label. */
  set(key: string, o: { target?: THREE.Object3D | null; pos?: THREE.Vector3; offsetY?: number; html: string; cls?: string; maxDist?: number; scale?: boolean }) {
    let l = this.labels.get(key);
    if (!l) {
      const el = document.createElement('div');
      el.className = 'wlabel ' + (o.cls || '');
      this.root.appendChild(el);
      l = { el, target: null, pos: new THREE.Vector3(), offsetY: 0, maxDist: 40, html: '', cls: o.cls || '', visible: true, scaleWithDistance: o.scale !== false };
      this.labels.set(key, l);
    }
    l.target = o.target ?? null;
    if (o.pos) l.pos.copy(o.pos);
    l.offsetY = o.offsetY ?? 0;
    l.maxDist = o.maxDist ?? 40;
    l.scaleWithDistance = o.scale !== false;
    if (o.cls !== undefined && o.cls !== l.cls) {
      l.cls = o.cls;
      l.el.className = 'wlabel ' + o.cls;
    }
    if (o.html !== l.html) {
      l.html = o.html;
      l.el.innerHTML = o.html;
    }
    l.visible = true;
    return l;
  }

  hide(key: string) {
    const l = this.labels.get(key);
    if (l) l.visible = false;
  }

  remove(key: string) {
    const l = this.labels.get(key);
    if (!l) return;
    l.el.remove();
    this.labels.delete(key);
  }

  removePrefix(prefix: string) {
    for (const k of [...this.labels.keys()]) if (k.startsWith(prefix)) this.remove(k);
  }

  keys() {
    return this.labels.keys();
  }

  update(camera: THREE.PerspectiveCamera, w: number, h: number) {
    const cam = camera.position;
    for (const l of this.labels.values()) {
      if (!l.visible) {
        if (l.el.style.display !== 'none') l.el.style.display = 'none';
        continue;
      }
      if (l.target) {
        if (!l.target.parent) {
          l.el.style.display = 'none';
          continue;
        }
        l.target.getWorldPosition(v);
      } else v.copy(l.pos);
      v.y += l.offsetY;
      const dist = v.distanceTo(cam);
      if (dist > l.maxDist) {
        if (l.el.style.display !== 'none') l.el.style.display = 'none';
        continue;
      }
      v.project(camera);
      if (v.z > 1 || v.z < -1 || v.x < -1.3 || v.x > 1.3 || v.y < -1.3 || v.y > 1.3) {
        if (l.el.style.display !== 'none') l.el.style.display = 'none';
        continue;
      }
      const x = (v.x * 0.5 + 0.5) * w;
      const y = (-v.y * 0.5 + 0.5) * h;
      const s = l.scaleWithDistance ? Math.max(0.55, Math.min(1.15, 14 / dist)) : 1;
      if (l.el.style.display === 'none') l.el.style.display = '';
      l.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%) scale(${s.toFixed(3)})`;
      l.el.style.zIndex = String(1000 - Math.round(dist));
    }
  }
}

// ── Floating pop text ("+$1,240", "ZAPPED!") ─────────────────────────────
export class Pops {
  private root: HTMLDivElement;
  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'pop-layer';
    parent.appendChild(this.root);
  }
  destroy() {
    this.root.remove();
  }
  at(camera: THREE.PerspectiveCamera, w: number, h: number, pos: THREE.Vector3, text: string, cls = '', size = 1) {
    v.copy(pos).project(camera);
    if (v.z > 1) return;
    const x = (v.x * 0.5 + 0.5) * w;
    const y = (-v.y * 0.5 + 0.5) * h;
    this.screen(x, y, text, cls, size);
  }
  screen(x: number, y: number, text: string, cls = '', size = 1) {
    if (this.root.childElementCount > 40) this.root.firstElementChild?.remove();
    const el = document.createElement('div');
    el.className = 'pop ' + cls;
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.fontSize = 22 * size + 'px';
    el.style.setProperty('--dx', (Math.random() - 0.5) * 40 + 'px');
    this.root.appendChild(el);
    window.setTimeout(() => el.remove(), 1500);
  }
}
