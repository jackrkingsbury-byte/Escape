import type { Backend } from './types';
import shim from '../../../supabase/local/shim.sql?raw';

// Every migration, in order, bundled as text. The offline engine runs exactly
// the SQL the online server runs.
const migrationModules = import.meta.glob('../../../supabase/migrations/*.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const DATA_DIR = 'idb://steal-the-tech';
const UID_KEY = 'stt.offline.uid';

function hashString(s: string): string {
  let h1 = 0xdeadbeef ^ s.length;
  let h2 = 0x41c6ce57 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

function uuid(): string {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function safeGet(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function safeSet(k: string, v: string | null) {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    /* private mode */
  }
}

export class OfflineBackend implements Backend {
  mode = 'offline' as const;
  label = 'Offline practice (this device)';
  private worker: Worker | null = null;
  private seq = 0;
  private pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void }>();
  private progress?: (msg: string, pct: number) => void;
  private uid: string | null = safeGet(UID_KEY);

  constructor(private pgliteUrl: string) {}

  private send<T>(msg: Record<string, unknown>): Promise<T> {
    const id = ++this.seq;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker!.postMessage({ ...msg, id });
    });
  }

  async init(onProgress?: (msg: string, pct: number) => void) {
    this.progress = onProgress;
    this.worker = new Worker(new URL('./pglite.worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'progress') {
        this.progress?.(m.msg, m.pct);
        return;
      }
      const p = this.pending.get(m.id);
      if (!p) return;
      this.pending.delete(m.id);
      if (m.ok) p.resolve(m.data);
      else p.reject(new Error(m.error));
    };
    this.worker.onerror = (e) => {
      for (const p of this.pending.values()) p.reject(new Error(e.message || 'Engine crashed'));
      this.pending.clear();
    };
    const files = [
      { name: 'local runtime', sql: shim },
      ...Object.keys(migrationModules)
        .sort()
        .map((k) => ({
          name: k.split('/').pop()!.replace(/^\d+_/, '').replace('.sql', ''),
          sql: migrationModules[k],
        })),
    ];
    const hash = hashString(files.map((f) => f.sql).join('\n'));
    await this.send({ type: 'init', url: this.pgliteUrl, files, hash, dataDir: DATA_DIR });
  }

  userId() {
    return this.uid;
  }
  isGuest() {
    return true;
  }
  email() {
    return null;
  }
  async signInGuest() {
    if (!this.uid) {
      this.uid = uuid();
      safeSet(UID_KEY, this.uid);
    }
  }
  async signOut() {
    /* offline profile stays on this device */
  }

  rpc<T = any>(fn: string, p: Record<string, unknown> = {}): Promise<T> {
    if (!this.uid) return Promise.reject(new Error('You need to be signed in to play.'));
    return this.send<T>({ type: 'rpc', uid: this.uid, fn, p });
  }

  async reset() {
    try {
      await this.send({ type: 'close' });
    } catch {
      /* ignore */
    }
    this.worker?.terminate();
    this.worker = null;
    safeSet(UID_KEY, null);
    const names = new Set<string>(['/pglite/steal-the-tech', 'steal-the-tech']);
    try {
      const dbs = (await (indexedDB as any).databases?.()) || [];
      for (const d of dbs) if (d.name && d.name.includes('steal-the-tech')) names.add(d.name);
    } catch {
      /* not supported */
    }
    await Promise.all(
      [...names].map(
        (n) =>
          new Promise<void>((res) => {
            const r = indexedDB.deleteDatabase(n);
            r.onsuccess = r.onerror = r.onblocked = () => res();
          }),
      ),
    );
  }
}
