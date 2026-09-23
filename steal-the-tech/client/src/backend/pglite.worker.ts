/// <reference lib="webworker" />
// Offline mode engine: a real PostgreSQL (PGlite, compiled to WASM) running the
// exact same migrations as the online server, persisted to IndexedDB.
// Runs in a worker so world ticks never stutter the renderer.

type InitMsg = { id: number; type: 'init'; url: string; files: { name: string; sql: string }[]; hash: string; dataDir: string };
type RpcMsg = { id: number; type: 'rpc'; uid: string; fn: string; p: unknown };
type CloseMsg = { id: number; type: 'close' };
type Msg = InitMsg | RpcMsg | CloseMsg;

let db: any = null;

// PGlite's IndexedDB layer probes for files that don't exist yet on first boot and
// lets that (expected) Emscripten ErrnoError escape as an unhandled rejection.
// It is harmless — boot continues — so keep it out of the console.
self.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
  if (e.reason && (e.reason.name === 'ErrnoError' || String(e.reason).includes('ErrnoError'))) e.preventDefault();
});

const post = (m: unknown) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(m);

async function init(m: InitMsg) {
  post({ type: 'progress', msg: 'Downloading game engine…', pct: 5 });
  const mod = await import(/* @vite-ignore */ m.url);
  post({ type: 'progress', msg: 'Booting the Tech City server…', pct: 25 });
  db = await mod.PGlite.create(m.dataDir, { relaxedDurability: true });
  await db.exec(`create table if not exists public.stt_local_meta (k text primary key, v text)`);
  const r = await db.query(`select v from public.stt_local_meta where k = 'hash'`);
  if (!r.rows.length || r.rows[0].v !== m.hash) {
    let i = 0;
    for (const f of m.files) {
      post({ type: 'progress', msg: `Installing ${f.name}…`, pct: 30 + Math.round((i / m.files.length) * 60) });
      await db.exec(f.sql);
      i++;
    }
    await db.query(
      `insert into public.stt_local_meta (k, v) values ('hash', $1) on conflict (k) do update set v = excluded.v`,
      [m.hash],
    );
  }
  post({ type: 'progress', msg: 'Waking up the city…', pct: 95 });
}

async function rpc(m: RpcMsg) {
  if (!/^stt_[a-z_]+$/.test(m.fn)) throw new Error('Bad function');
  return db.transaction(async (tx: any) => {
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [m.uid]);
    const r = await tx.query(`select public.${m.fn}($1::jsonb) as r`, [JSON.stringify(m.p ?? {})]);
    return r.rows[0].r;
  });
}

self.onmessage = async (e: MessageEvent<Msg>) => {
  const m = e.data;
  try {
    let data: unknown = null;
    if (m.type === 'init') await init(m);
    else if (m.type === 'rpc') data = await rpc(m);
    else if (m.type === 'close') {
      if (db) await db.close();
      db = null;
    }
    post({ id: m.id, ok: true, data });
  } catch (err: any) {
    post({ id: m.id, ok: false, error: String(err?.message ?? err) });
  }
};
