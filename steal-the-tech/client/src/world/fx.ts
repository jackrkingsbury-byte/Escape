// Particles: glowing sparks (points), spinning coins and confetti (instanced),
// shockwave rings. Everything is pooled — nothing allocates per frame.
import * as THREE from 'three';
import { softDotTexture, gCyl, std } from './models';

const MAX_SPARKS = 1600;
const MAX_COINS = 260;
const MAX_CONF = 420;

interface Coin {
  p: THREE.Vector3;
  v: THREE.Vector3;
  life: number;
  max: number;
  spin: number;
  target: THREE.Vector3 | null;
  delay: number;
}

const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();
const tmpS = new THREE.Vector3();
const tmpC = new THREE.Color();

export class FX {
  group = new THREE.Group();
  // sparks
  private sPos = new Float32Array(MAX_SPARKS * 3);
  private sVel = new Float32Array(MAX_SPARKS * 3);
  private sCol = new Float32Array(MAX_SPARKS * 3);
  private sSize = new Float32Array(MAX_SPARKS);
  private sLife = new Float32Array(MAX_SPARKS);
  private sMax = new Float32Array(MAX_SPARKS);
  private sGrav = new Float32Array(MAX_SPARKS);
  private sAlpha = new Float32Array(MAX_SPARKS);
  private sNext = 0;
  private sGeo = new THREE.BufferGeometry();
  // coins
  private coins: Coin[] = [];
  private coinMesh: THREE.InstancedMesh;
  // confetti
  private conf: { p: THREE.Vector3; v: THREE.Vector3; r: THREE.Vector3; w: THREE.Vector3; life: number; max: number; col: THREE.Color }[] = [];
  private confMesh: THREE.InstancedMesh;
  // rings
  private rings: { m: THREE.Mesh; life: number; max: number; to: number }[] = [];
  lowQuality = false;

  constructor() {
    this.sGeo.setAttribute('position', new THREE.BufferAttribute(this.sPos, 3).setUsage(THREE.DynamicDrawUsage));
    this.sGeo.setAttribute('color', new THREE.BufferAttribute(this.sCol, 3).setUsage(THREE.DynamicDrawUsage));
    this.sGeo.setAttribute('size', new THREE.BufferAttribute(this.sSize, 1).setUsage(THREE.DynamicDrawUsage));
    this.sGeo.setAttribute('alpha', new THREE.BufferAttribute(this.sAlpha, 1).setUsage(THREE.DynamicDrawUsage));
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: softDotTexture() }, scale: { value: 400 } },
      vertexShader: `
        attribute float size; attribute float alpha; attribute vec3 color;
        varying vec3 vColor; varying float vAlpha; uniform float scale;
        void main() {
          vColor = color; vAlpha = alpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * scale / max(0.1, -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform sampler2D map; varying vec3 vColor; varying float vAlpha;
        void main() {
          vec4 t = texture2D(map, gl_PointCoord);
          if (vAlpha <= 0.0) discard;
          gl_FragColor = vec4(vColor * 1.6, t.a * vAlpha);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const pts = new THREE.Points(this.sGeo, mat);
    pts.frustumCulled = false;
    this.group.add(pts);

    this.coinMesh = new THREE.InstancedMesh(gCyl(0.16, 0.16, 0.04, 14), std('#fbbf24', { metal: 1, rough: 0.25, emissive: '#6b4a00', ei: 0.6 }), MAX_COINS);
    this.coinMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.coinMesh.count = 0;
    this.coinMesh.frustumCulled = false;
    this.group.add(this.coinMesh);

    const cm = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false });
    this.confMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.16, 0.09), cm, MAX_CONF);
    this.confMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.confMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_CONF * 3), 3);
    this.confMesh.count = 0;
    this.confMesh.frustumCulled = false;
    this.group.add(this.confMesh);
  }

  setPixelScale(h: number) {
    ((this.group.children[0] as THREE.Points).material as THREE.ShaderMaterial).uniforms.scale.value = h * 0.55;
  }

  spark(p: THREE.Vector3, o: { n?: number; color?: string | THREE.Color; speed?: number; size?: number; life?: number; gravity?: number; up?: number; spread?: number; rainbow?: boolean } = {}) {
    let n = o.n ?? 20;
    if (this.lowQuality) n = Math.ceil(n / 3);
    const col = tmpC.set(o.color ?? '#fde047');
    for (let k = 0; k < n; k++) {
      const i = this.sNext;
      this.sNext = (this.sNext + 1) % MAX_SPARKS;
      const a = Math.random() * Math.PI * 2;
      const e = (Math.random() - 0.3) * Math.PI * (o.spread ?? 0.9);
      const s = (o.speed ?? 4) * (0.35 + Math.random() * 0.8);
      this.sPos[i * 3] = p.x + (Math.random() - 0.5) * 0.2;
      this.sPos[i * 3 + 1] = p.y + (Math.random() - 0.5) * 0.2;
      this.sPos[i * 3 + 2] = p.z + (Math.random() - 0.5) * 0.2;
      this.sVel[i * 3] = Math.cos(a) * Math.cos(e) * s;
      this.sVel[i * 3 + 1] = Math.sin(e) * s + (o.up ?? 2);
      this.sVel[i * 3 + 2] = Math.sin(a) * Math.cos(e) * s;
      if (o.rainbow) tmpC.setHSL(Math.random(), 1, 0.6);
      this.sCol[i * 3] = o.rainbow ? tmpC.r : col.r;
      this.sCol[i * 3 + 1] = o.rainbow ? tmpC.g : col.g;
      this.sCol[i * 3 + 2] = o.rainbow ? tmpC.b : col.b;
      if (!o.rainbow) tmpC.copy(col);
      this.sSize[i] = (o.size ?? 0.35) * (0.6 + Math.random() * 0.8);
      this.sLife[i] = 0;
      this.sMax[i] = (o.life ?? 0.9) * (0.6 + Math.random() * 0.7);
      this.sGrav[i] = o.gravity ?? 6;
      this.sAlpha[i] = 1;
    }
  }

  /** Coins that burst out and (optionally) fly into `target`. */
  coinsBurst(from: THREE.Vector3, n: number, target: THREE.Vector3 | null = null) {
    if (this.lowQuality) n = Math.ceil(n / 2);
    for (let k = 0; k < n; k++) {
      if (this.coins.length >= MAX_COINS) this.coins.shift();
      const a = Math.random() * Math.PI * 2;
      const s = 2 + Math.random() * 3.5;
      this.coins.push({
        p: from.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.4, Math.random() * 0.3, (Math.random() - 0.5) * 0.4)),
        v: new THREE.Vector3(Math.cos(a) * s * 0.6, 4 + Math.random() * 4, Math.sin(a) * s * 0.6),
        life: 0,
        max: target ? 1.6 : 1.4 + Math.random() * 0.6,
        spin: (Math.random() - 0.5) * 20,
        target,
        delay: k * 0.012,
      });
    }
  }

  confetti(p: THREE.Vector3, n = 120, spread = 4) {
    if (this.lowQuality) n = Math.ceil(n / 3);
    for (let k = 0; k < n; k++) {
      if (this.conf.length >= MAX_CONF) this.conf.shift();
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * spread;
      this.conf.push({
        p: p.clone(),
        v: new THREE.Vector3(Math.cos(a) * s, 5 + Math.random() * 6, Math.sin(a) * s),
        r: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6),
        w: new THREE.Vector3((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14),
        life: 0,
        max: 2.2 + Math.random() * 1.5,
        col: new THREE.Color().setHSL(Math.random(), 0.9, 0.6),
      });
    }
  }

  ring(p: THREE.Vector3, color: string, to = 5, life = 0.7) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 48), new THREE.MeshBasicMaterial({ color, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.copy(p);
    m.position.y += 0.08;
    this.group.add(m);
    this.rings.push({ m, life: 0, max: life, to });
  }

  update(dt: number) {
    // sparks
    for (let i = 0; i < MAX_SPARKS; i++) {
      if (this.sAlpha[i] <= 0) continue;
      this.sLife[i] += dt;
      if (this.sLife[i] >= this.sMax[i]) {
        this.sAlpha[i] = 0;
        continue;
      }
      this.sVel[i * 3 + 1] -= this.sGrav[i] * dt;
      this.sVel[i * 3] *= 0.985;
      this.sVel[i * 3 + 2] *= 0.985;
      this.sPos[i * 3] += this.sVel[i * 3] * dt;
      this.sPos[i * 3 + 1] += this.sVel[i * 3 + 1] * dt;
      this.sPos[i * 3 + 2] += this.sVel[i * 3 + 2] * dt;
      this.sAlpha[i] = 1 - this.sLife[i] / this.sMax[i];
    }
    (this.sGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.sGeo.attributes.alpha as THREE.BufferAttribute).needsUpdate = true;
    (this.sGeo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    (this.sGeo.attributes.size as THREE.BufferAttribute).needsUpdate = true;

    // coins
    let n = 0;
    this.coins = this.coins.filter((c) => {
      c.delay -= dt;
      if (c.delay > 0) return true;
      c.life += dt;
      if (c.life > c.max) return false;
      if (c.target && c.life > 0.45) {
        const k = Math.min(1, (c.life - 0.45) / 0.5);
        c.p.lerp(c.target, 0.12 + k * 0.35);
        if (c.p.distanceToSquared(c.target) < 0.15) return false;
      } else {
        c.v.y -= 14 * dt;
        c.p.addScaledVector(c.v, dt);
        if (c.p.y < 0.05) {
          c.p.y = 0.05;
          c.v.y *= -0.35;
          c.v.x *= 0.6;
          c.v.z *= 0.6;
        }
      }
      tmpE.set(Math.PI / 2, c.life * c.spin, 0);
      tmpQ.setFromEuler(tmpE);
      const sc = c.max - c.life < 0.25 ? (c.max - c.life) / 0.25 : 1;
      tmpS.setScalar(sc);
      tmpM.compose(c.p, tmpQ, tmpS);
      this.coinMesh.setMatrixAt(n++, tmpM);
      return true;
    });
    this.coinMesh.count = n;
    this.coinMesh.instanceMatrix.needsUpdate = true;

    // confetti
    let m = 0;
    const keep: typeof this.conf = [];
    for (const c of this.conf) {
      c.life += dt;
      if (c.life > c.max) continue;
      c.v.y -= 7 * dt;
      c.v.multiplyScalar(0.985);
      if (c.v.y < -2.2) c.v.y = -2.2;
      c.p.addScaledVector(c.v, dt);
      c.r.addScaledVector(c.w, dt);
      tmpE.set(c.r.x, c.r.y, c.r.z);
      tmpQ.setFromEuler(tmpE);
      tmpS.setScalar(1);
      tmpM.compose(c.p, tmpQ, tmpS);
      this.confMesh.setMatrixAt(m, tmpM);
      this.confMesh.setColorAt(m, c.col);
      m++;
      keep.push(c);
    }
    this.conf = keep;
    this.confMesh.count = m;
    this.confMesh.instanceMatrix.needsUpdate = true;
    if (this.confMesh.instanceColor) this.confMesh.instanceColor.needsUpdate = true;

    // rings
    this.rings = this.rings.filter((r) => {
      r.life += dt;
      const k = r.life / r.max;
      if (k >= 1) {
        this.group.remove(r.m);
        r.m.geometry.dispose();
        (r.m.material as THREE.Material).dispose();
        return false;
      }
      r.m.scale.setScalar(0.5 + k * r.to);
      (r.m.material as THREE.MeshBasicMaterial).opacity = 1 - k;
      return true;
    });
  }
}
