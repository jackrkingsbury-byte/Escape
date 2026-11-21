#!/usr/bin/env node
// render.mjs — MODULE D (SPEC §8): headless Chromium frame capture → ffmpeg.
//
//   node render.mjs [--out out/inthistown.mp4] [--from 0] [--to <duration>] [--fps 30] [--scale 0.6667]
//                   [--workers 2] [--preview 2.0] [--timeline audio/timeline.json] [--shots /src/shots.js] [--crf 18]
//   extras:         [--preset medium] [--capture dataurl|cdp|screenshot] [--quality 92] [--audio path|none]
//                   [--bench 40]   measure capture methods (1 worker) and exit
//                   [--times 1.5,3,12.25]  with --preview: render exactly these times instead of every N s
//                   [--check-determinism]  render probe times in scrambled orders + sequentially in a 2nd process,
//                                  require byte-identical frames (use --times to choose probes), then exit
//                   [--strict]     abort on the first page error     [--keep] keep segment files
//                   [--aa 0]       disable MSAA                       [--timeout 300] page-ready timeout (s)
//                   [--query "composite=gpu&debug=1"]  extra index.html query params
//
// Every frame i (0 ≤ i < N, N = round((to-from)·fps)) is rendered at t = from + i/fps, so the video is exactly
// N/fps seconds. --workers N splits [0, N) into N contiguous chunks rendered by N separate Chromium processes
// (SwiftShader is per-process, so separate browsers really run in parallel), each piped into its own ffmpeg
// (H.264 yuv420p CRF), then the segments are concatenated by stream copy and the audio is muxed once
// (AAC 192k, padded/trimmed to the exact video duration, +faststart).
// --preview N: no video; saves out/preview/t_<sec>.png every N seconds + out/preview/contact.jpg (labelled sheet).
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { startServer, CHROME_ARGS, ROOT } from './tools/serve.mjs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = require('playwright')); }

// ───────────────────────────── args
const argv = process.argv.slice(2);
const A = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith('--')) continue;
  const eq = a.indexOf('=');
  if (eq > 0) A[a.slice(2, eq)] = a.slice(eq + 1);
  else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) A[a.slice(2)] = argv[++i];
  else A[a.slice(2)] = true;
}
const opt = {
  out: A.out || 'out/inthistown.mp4',
  from: A.from != null ? +A.from : 0,
  to: A.to != null ? +A.to : null,
  fps: A.fps != null ? +A.fps : null,
  scale: A.scale != null ? +A.scale : 0.6667,
  workers: Math.max(1, +(A.workers || 2)),
  preview: A.preview != null && A.preview !== true ? +A.preview : (A.preview === true ? 2 : null),
  times: A.times ? String(A.times).split(',').map(Number).filter(Number.isFinite) : null,
  timeline: A.timeline || 'audio/timeline.json',
  shots: A.shots || '/src/shots.js',
  crf: A.crf != null ? +A.crf : 18,
  preset: A.preset || 'medium',
  capture: A.capture || 'dataurl',
  quality: A.quality != null ? +A.quality : 92,
  audio: A.audio ?? null,
  bench: A.bench != null ? (A.bench === true ? 40 : +A.bench) : 0,
  det: !!A['check-determinism'],
  strict: !!A.strict,
  keep: !!A.keep,
  aa: A.aa != null ? String(A.aa) !== '0' : true,
  timeout: (A.timeout != null ? +A.timeout : 300) * 1000,
  query: typeof A.query === 'string' ? A.query : '',
};
if (opt.times && opt.preview == null && !A['check-determinism']) opt.preview = 0;
const rel = (p) => path.resolve(ROOT, p);
const fmtT = (s) => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60); return m ? `${m}m${String(s % 60).padStart(2, '0')}s` : `${s}s`; };
const log = (...m) => console.log('[render]', ...m);

// ───────────────────────────── processes / cleanup
const browsers = new Set(), procs = new Set();
let server = null;
async function cleanup() {
  for (const p of procs) { try { p.kill('SIGKILL'); } catch {} }
  for (const b of browsers) { try { await b.close(); } catch {} }
  if (server) { try { server.srv.close(); } catch {} }
}
process.on('SIGINT', async () => { log('interrupted'); await cleanup(); process.exit(130); });

function run(cmd, args, { input } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: [input ? 'pipe' : 'ignore', 'pipe', 'pipe'] });
    procs.add(p);
    let out = '', err = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err += d; });
    p.on('error', reject);
    p.on('close', (code) => { procs.delete(p); code === 0 ? resolve(out) : reject(new Error(`${cmd} exited ${code}: ${err.slice(-2000)}`)); });
    if (input) p.stdin.end(input);
  });
}

// ───────────────────────────── worker (one Chromium + one page)
let pageErrors = 0;
async function openWorker(k) {
  const browser = await chromium.launch({ args: CHROME_ARGS });
  browsers.add(browser);
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const seen = new Map();
  const onMsg = (kind, text) => {
    if (/GPU stall due to ReadPixels|GL Driver Message/.test(text)) return;
    const n = (seen.get(text) || 0) + 1; seen.set(text, n);
    if (n <= 2) console.log(`[w${k} ${kind}] ${text}${n === 2 ? '  (repeats suppressed)' : ''}`);
    if (kind === 'error' || kind === 'pageerror') { pageErrors++; if (opt.strict) { console.error('[render] --strict: aborting on page error'); cleanup().then(() => process.exit(2)); } }
  };
  page.on('console', (m) => {
    if (m.type() !== 'error' && m.type() !== 'warning') return;
    const loc = m.location && m.location();
    onMsg(m.type(), m.text() + (/Failed to load resource/.test(m.text()) && loc && loc.url ? ` — ${loc.url.replace(server.url, '')}` : ''));
  });
  page.on('pageerror', (e) => onMsg('pageerror', e.message));
  const q = new URLSearchParams({ render: '1', timeline: opt.timeline, shotsModule: opt.shots, scale: String(opt.scale) });
  if (!opt.aa) q.set('aa', '0');
  if (opt.query) for (const [k, v] of new URLSearchParams(opt.query)) q.set(k, v);
  q.set('t', String(opt.from));
  await page.goto(`${server.url}/index.html?${q}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: opt.timeout, polling: 100 });
  const err = await page.evaluate(() => window.__error || null);
  if (err) throw new Error(`page reported an error:\n${err}`);
  const info = await page.evaluate(() => ({ duration: window.__engine.duration, fps: window.__engine.fps, audio: window.__engine.audio, shots: window.__engine.shots }));
  const cdp = await page.context().newCDPSession(page);
  return { k, browser, page, cdp, info };
}

const CAPTURE = {
  // render in-page, encode the 1080×1920 composite canvas as JPEG in-page, ship base64 back
  async dataurl(w, t) {
    const b64 = await w.page.evaluate(async ([tt, q]) => {
      await window.__engine.renderAt(tt);
      const s = window.__engine.frameDataURL('image/jpeg', q);
      return s.slice(s.indexOf(',') + 1);
    }, [t, opt.quality / 100]);
    return Buffer.from(b64, 'base64');
  },
  // render in-page, then raw CDP screenshot of the viewport (canvas is shown 1:1 at 1080×1920)
  async cdp(w, t) {
    await w.page.evaluate((tt) => window.__engine.renderAt(tt), t);
    const { data } = await w.cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: opt.quality, optimizeForSpeed: true, fromSurface: true, captureBeyondViewport: false });
    return Buffer.from(data, 'base64');
  },
  // render in-page, then Playwright's page.screenshot
  async screenshot(w, t) {
    await w.page.evaluate((tt) => window.__engine.renderAt(tt), t);
    return await w.page.screenshot({ type: 'jpeg', quality: opt.quality });
  },
};
if (!CAPTURE[opt.capture]) { console.error(`unknown --capture ${opt.capture} (use ${Object.keys(CAPTURE).join('|')})`); process.exit(1); }

function encoder(file, fps) {
  // JPEG frames are sRGB pixels stored as full-range BT.601-matrix YCbCr. Convert ONLY the matrix (+ range) to
  // limited-range BT.709 and tag it, so players that assume BT.709 for HD show the colours Chromium rendered
  // (measured: 46.5 dB PSNR vs the source frame; untagged 601 output drops to 34 dB in a 709-assuming player).
  const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-vf', 'colorspace=all=bt709:ispace=bt470bg:iprimaries=bt709:itrc=bt709:irange=pc:range=tv:format=yuv420p:fast=0',
    '-c:v', 'libx264', '-preset', opt.preset, '-crf', String(opt.crf), '-pix_fmt', 'yuv420p',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-threads', '2', '-r', String(fps), '-an', file];
  const p = spawn('ffmpeg', args, { stdio: ['pipe', 'ignore', 'pipe'] });
  procs.add(p);
  let err = '';
  p.stderr.on('data', (d) => { err += d; });
  const done = new Promise((resolve, reject) => p.on('close', (code) => { procs.delete(p); code === 0 ? resolve() : reject(new Error(`ffmpeg encoder exited ${code}: ${err.slice(-1500)}`)); }));
  const write = (buf) => new Promise((resolve, reject) => { p.stdin.write(buf, (e) => (e ? reject(e) : resolve())); });
  return { write, end: () => { p.stdin.end(); return done; }, done };
}

// ───────────────────────────── modes
async function bench(w, info) {
  const N = opt.bench, fps = opt.fps || info.fps;
  const t0 = opt.from || Math.max(0, info.duration * 0.4);
  const times = (off) => Array.from({ length: N }, (_, i) => Math.min(info.duration - 1e-3, t0 + (off + i) / fps));
  for (const t of times(-3).slice(0, 3)) await w.page.evaluate((tt) => window.__engine.renderAt(tt), t);   // warm-up
  const res = [];
  {
    const ts = times(0); const T = Date.now();
    for (const t of ts) await w.page.evaluate((tt) => window.__engine.renderAt(tt), t);
    res.push({ method: 'render only (no capture)', ms: (Date.now() - T) / N, kb: 0 });
  }
  const inPage = await w.page.evaluate(() => window.__engine.stats());
  for (const m of Object.keys(CAPTURE)) {
    const ts = times(0); let bytes = 0; const T = Date.now();
    for (const t of ts) bytes += (await CAPTURE[m](w, t)).length;
    res.push({ method: m, ms: (Date.now() - T) / N, kb: bytes / N / 1024 });
  }
  const base = res[0].ms;
  log(`bench: ${N} consecutive frames from t=${t0.toFixed(2)}s, 1080×1920 output, 3D ${inPage.internal.join('×')}, MSAA ${opt.aa ? 'on' : 'off'}, JPEG q${opt.quality}`);
  log(`in-page breakdown (last frame): ${JSON.stringify(inPage.timing, (k, v) => (typeof v === 'number' ? +v.toFixed(1) : v))}  draw calls ${inPage.calls}, tris ${inPage.triangles}`);
  console.log('  method                        ms/frame   capture overhead   KB/frame');
  for (const r of res) console.log(`  ${r.method.padEnd(28)} ${r.ms.toFixed(1).padStart(8)}   ${(r.ms - base).toFixed(1).padStart(16)}   ${r.kb.toFixed(0).padStart(8)}`);
  const best = res.slice(1).sort((a, b) => a.ms - b.ms)[0];
  log(`fastest capture: ${best.method}`);
}

// Random-access determinism check: page A renders the probe times in a scrambled order (twice, different orders),
// page B (a separate Chromium process) renders each probe time after its 3 preceding frames, like a sequential
// render. All three PNGs of every probe time must be byte-identical. Mismatches are saved to out/preview/det_*.png.
async function determinism(workers, info) {
  const fps = opt.fps || info.fps, dur = opt.to ?? info.duration;
  const snap = (x) => Math.round(x * fps) / fps;
  let probes = opt.times && opt.times.length ? opt.times.map(snap) : null;
  if (!probes) {
    const s = new Set();
    for (const sh of info.shots) { s.add(snap(sh.start)); s.add(snap(Math.min(sh.end - 1 / fps, sh.start + 0.5 * (sh.end - sh.start)))); }
    for (let i = 1; i <= 4; i++) s.add(snap(dur * (i / 5) + 0.123));
    probes = [...s].filter((t) => t >= 0 && t < dur);
  }
  probes.sort((a, b) => a - b);
  const grab = async (w, t) => {
    const b64 = await w.page.evaluate(async (tt) => { await window.__engine.renderAt(tt); const s = window.__engine.frameDataURL('image/png'); return s.slice(s.indexOf(',') + 1); }, t);
    return { b64, h: (await import('node:crypto')).createHash('sha1').update(b64).digest('hex').slice(0, 12) };
  };
  const [A, B] = workers;
  const order1 = probes.slice().reverse();
  const order2 = probes.map((_, i) => probes[(i * 7 + 3) % probes.length]).filter((t, i, a) => a.indexOf(t) === i);
  for (const t of probes) if (!order2.includes(t)) order2.push(t);
  const ra1 = {}, ra2 = {}, seq = {};
  for (const t of order1) ra1[t] = await grab(A, t);
  for (const t of order2) ra2[t] = await grab(A, t);
  for (const t of probes) { for (let k = 3; k >= 1; k--) if (t - k / fps >= 0) await grab(B, t - k / fps); seq[t] = await grab(B, t); }
  let bad = 0;
  const dir = rel('out/preview'); fs.mkdirSync(dir, { recursive: true });
  for (const t of probes) {
    const ok = ra1[t].h === ra2[t].h && ra1[t].h === seq[t].h;
    if (!ok) {
      bad++;
      fs.writeFileSync(path.join(dir, `det_${t.toFixed(3)}_A.png`), Buffer.from(ra1[t].b64, 'base64'));
      fs.writeFileSync(path.join(dir, `det_${t.toFixed(3)}_B.png`), Buffer.from(seq[t].b64, 'base64'));
    }
    log(`t=${t.toFixed(3)}  random-access ${ra1[t].h} / ${ra2[t].h}   sequential(other process) ${seq[t].h}  ${ok ? 'OK' : 'MISMATCH'}`);
  }
  log(bad ? `determinism: ${bad}/${probes.length} probe times differ (saved out/preview/det_*_A/B.png)` : `determinism: all ${probes.length} probe times identical across orders and processes`);
  return bad;
}

async function preview(workers, info) {
  const dir = rel('out/preview');
  fs.mkdirSync(dir, { recursive: true });
  const to = opt.to ?? info.duration;
  const times = opt.times || (() => { const r = []; for (let t = opt.from; t < to - 1e-6; t += opt.preview) r.push(+t.toFixed(3)); return r; })();
  const chunks = workers.map((_, i) => times.slice(Math.floor(i * times.length / workers.length), Math.floor((i + 1) * times.length / workers.length)));
  const thumbs = new Array(times.length);
  let done = 0; const T = Date.now();
  await Promise.all(workers.map(async (w, wi) => {
    const base = times.indexOf(chunks[wi][0]);
    for (let j = 0; j < chunks[wi].length; j++) {
      const t = chunks[wi][j];
      const r = await w.page.evaluate(async (tt) => {
        await window.__engine.renderAt(tt);
        const png = window.__engine.frameDataURL('image/png');
        const th = window.__engine.frameDataURL('image/jpeg', 0.85, 216);
        return { png: png.slice(png.indexOf(',') + 1), th, shot: window.__engine.shotAt(tt) };
      }, t);
      const name = `t_${t.toFixed(2).padStart(6, '0')}.png`;
      fs.writeFileSync(path.join(dir, name), Buffer.from(r.png, 'base64'));
      thumbs[base + j] = { t, th: r.th, label: `${t.toFixed(2)}s  #${r.shot.index} ${r.shot.name}` };
      done++;
    }
  }));
  log(`preview: ${done} frames in ${fmtT((Date.now() - T) / 1000)} → out/preview/t_*.png`);
  // contact sheet, composed in a blank page
  const page = await workers[0].browser.newPage();
  const cols = Math.min(8, thumbs.length), tw = 216, th = 384, lh = 30;
  const rows = Math.ceil(thumbs.length / cols);
  const sheet = await page.evaluate(async ({ thumbs, cols, rows, tw, th, lh }) => {
    const c = document.createElement('canvas'); c.width = cols * tw; c.height = rows * (th + lh);
    const g = c.getContext('2d'); g.fillStyle = '#111'; g.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < thumbs.length; i++) {
      const img = new Image(); img.src = thumbs[i].th; await img.decode();
      const x = (i % cols) * tw, y = Math.floor(i / cols) * (th + lh);
      g.drawImage(img, x, y, tw, th);
      g.fillStyle = '#fff'; g.font = '600 13px sans-serif'; g.textBaseline = 'middle';
      g.save(); g.beginPath(); g.rect(x, y + th, tw, lh); g.clip(); g.fillText(thumbs[i].label, x + 5, y + th + lh / 2); g.restore();
      g.strokeStyle = '#000'; g.strokeRect(x + 0.5, y + 0.5, tw - 1, th + lh - 1);
    }
    const s = c.toDataURL('image/jpeg', 0.9); return s.slice(s.indexOf(',') + 1);
  }, { thumbs, cols, rows, tw, th, lh });
  fs.writeFileSync(path.join(dir, 'contact.jpg'), Buffer.from(sheet, 'base64'));
  await page.close();
  log('contact sheet → out/preview/contact.jpg');
}

async function video(workers, info) {
  const fps = opt.fps || info.fps;
  const to = opt.to ?? info.duration;
  const N = Math.max(1, Math.round((to - opt.from) * fps));
  const dur = N / fps;
  const segDir = rel(`out/frames/seg_${process.pid}`);
  fs.mkdirSync(segDir, { recursive: true });
  const W = workers.length;
  const ranges = workers.map((_, i) => [Math.floor(i * N / W), Math.floor((i + 1) * N / W)]);
  log(`video: ${N} frames (${opt.from}s → ${(opt.from + dur).toFixed(3)}s @ ${fps} fps) with ${W} worker(s), capture=${opt.capture}`);
  const stat = workers.map(() => ({ done: 0, ms: 0 }));
  const T0 = Date.now();
  const report = () => {
    const done = stat.reduce((a, s) => a + s.done, 0);
    const el = (Date.now() - T0) / 1000;
    const per = done ? (el * 1000) / done : 0;
    const perW = stat.map((s) => (s.done ? (s.ms / s.done).toFixed(0) : '-')).join('/');
    log(`${done}/${N} frames (${(100 * done / N).toFixed(1)}%)  ${per.toFixed(0)} ms/frame overall, ${perW} ms/frame per worker  elapsed ${fmtT(el)}  ETA ${done ? fmtT((N - done) * per / 1000) : '?'}`);
  };
  const timer = setInterval(report, 5000);
  const segs = [];
  try {
    await Promise.all(workers.map(async (w, wi) => {
      const [a, b] = ranges[wi];
      if (b <= a) return;
      const file = path.join(segDir, `seg_${String(wi).padStart(2, '0')}.mp4`);
      segs[wi] = file;
      const enc = encoder(file, fps);
      enc.done.catch(() => {});
      for (let i = a; i < b; i++) {
        const t = opt.from + i / fps;
        const T = Date.now();
        const buf = await CAPTURE[opt.capture](w, t);
        stat[wi].ms += Date.now() - T;
        await enc.write(buf);
        stat[wi].done++;
      }
      await enc.end();
    }));
  } finally { clearInterval(timer); }
  report();
  const renderSec = (Date.now() - T0) / 1000;
  // concat + mux
  const list = path.join(segDir, 'list.txt');
  fs.writeFileSync(list, segs.filter(Boolean).map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n') + '\n');
  let audio = opt.audio === 'none' ? null : (opt.audio || info.audio);
  if (audio && !fs.existsSync(rel(audio))) { log(`WARNING: audio file ${audio} not found — writing a silent video`); audio = null; }
  const outFile = rel(opt.out);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const args = ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list];
  if (audio) args.push('-ss', String(opt.from), '-i', rel(audio));
  args.push('-map', '0:v:0');
  if (audio) args.push('-map', '1:a:0', '-af', 'apad', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2');
  args.push('-c:v', 'copy', '-t', dur.toFixed(6), '-movflags', '+faststart', outFile);
  await run('ffmpeg', args);
  if (!opt.keep) fs.rmSync(segDir, { recursive: true, force: true });
  // verify
  const probe = JSON.parse(await run('ffprobe', ['-v', 'error', '-count_frames', '-show_entries',
    'stream=codec_type,codec_name,pix_fmt,width,height,nb_read_frames,r_frame_rate,duration,sample_rate,channels:format=duration,size',
    '-of', 'json', outFile]));
  const v = probe.streams.find((s) => s.codec_type === 'video'), au = probe.streams.find((s) => s.codec_type === 'audio');
  log(`wrote ${opt.out}: ${v.width}×${v.height} ${v.codec_name} ${v.pix_fmt} ${v.r_frame_rate} fps, ${v.nb_read_frames} frames, ` +
    `video ${(+v.duration).toFixed(3)}s, container ${(+probe.format.duration).toFixed(3)}s, ` +
    (au ? `audio ${au.codec_name} ${au.sample_rate}Hz ${au.channels}ch ${(+au.duration).toFixed(3)}s, ` : 'no audio, ') +
    `${(probe.format.size / 1048576).toFixed(1)} MB; rendered in ${fmtT(renderSec)} (${(renderSec * 1000 / N).toFixed(0)} ms/frame)`);
  if (+v.nb_read_frames !== N) log(`WARNING: expected ${N} frames, got ${v.nb_read_frames}`);
  if (pageErrors) log(`NOTE: ${pageErrors} page error message(s) were logged during the render (see above)`);
}

// ───────────────────────────── main
try {
  server = await startServer();
  const nW = opt.bench ? 1 : opt.det ? 2 : opt.workers;
  const workers = await Promise.all(Array.from({ length: nW }, (_, k) => openWorker(k)));
  const info = workers[0].info;
  log(`loaded ${opt.shots} + ${opt.timeline}: duration ${info.duration}s @ ${info.fps} fps, ${info.shots.length} shots`);
  let code = 0;
  if (opt.bench) await bench(workers[0], info);
  else if (opt.det) code = (await determinism(workers, info)) ? 3 : 0;
  else if (opt.preview != null) await preview(workers, info);
  else await video(workers, info);
  await cleanup();
  process.exit(code);
} catch (e) {
  console.error('[render] FAILED:', e && e.stack ? e.stack : e);
  await cleanup();
  process.exit(1);
}
