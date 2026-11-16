// Chess Lens — Stockfish (WASM, single-threaded) in a Web Worker, spoken to over UCI.

export class Engine {
  constructor(url) {
    this.url = url;
    this.worker = null;
    this.ready = null;
    this.listeners = new Set();
    this.searching = null; // { id, resolve, lines }
    this.nextId = 1;
  }

  start() {
    if (this.ready) return this.ready;
    this.worker = new Worker(this.url);
    this.worker.onmessage = (e) => this._line(String(e.data));
    this.worker.onerror = (e) => this.listeners.forEach((l) => l({ type: 'error', message: e.message || 'engine failed to load' }));
    this.ready = (async () => {
      await this._waitFor('uci', 'uciok');
      this.name = this._name || 'Stockfish';
      await this._waitFor('isready', 'readyok');
    })();
    return this.ready;
  }

  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }

  _send(cmd) { this.worker.postMessage(cmd); }

  _waitFor(cmd, token) {
    return new Promise((resolve) => {
      const off = this.on((m) => { if (m.type === 'raw' && m.line.startsWith(token)) { off(); resolve(); } });
      this._send(cmd);
    });
  }

  _line(line) {
    if (line.startsWith('id name ')) this._name = line.slice(8);
    this.listeners.forEach((l) => l({ type: 'raw', line }));
    const s = this.searching;
    if (!s) return;
    if (line.startsWith('info ') && line.includes(' pv ')) {
      const info = parseInfo(line);
      if (!info) return;
      s.lines[info.multipv - 1] = info;
      this.listeners.forEach((l) => l({ type: 'info', id: s.id, info, lines: s.lines.slice() }));
    } else if (line.startsWith('bestmove')) {
      const best = line.split(/\s+/)[1];
      this.searching = null;
      s.resolve({ id: s.id, bestmove: best === '(none)' ? null : best, lines: s.lines });
    }
  }

  async stop() {
    if (!this.searching) return;
    const done = new Promise((resolve) => {
      const off = this.on((m) => { if (m.type === 'raw' && m.line.startsWith('bestmove')) { off(); resolve(); } });
    });
    this._send('stop');
    await done;
  }

  /**
   * Analyse a FEN. opts: { movetime (ms) | depth, multipv }.
   * Returns a promise (with .id set synchronously) that resolves when the search ends.
   * Starting a new analysis supersedes any pending one; superseded calls resolve with stale: true.
   */
  analyse(fen, opts = {}) {
    const id = this.nextId++;
    this.latest = id;
    const job = (async () => {
      await this.start();
      await (this.queue = (this.queue || Promise.resolve()).then(() => this.stop()));
      if (id !== this.latest) return { id, stale: true, bestmove: null, lines: [] };
      this._send('ucinewgame');
      this._send(`setoption name MultiPV value ${opts.multipv || 3}`);
      this._send(`position fen ${fen}`);
      await this._waitFor('isready', 'readyok');
      if (id !== this.latest) return { id, stale: true, bestmove: null, lines: [] };
      return new Promise((resolve) => {
        this.searching = { id, resolve, lines: [] };
        this._send(opts.depth ? `go depth ${opts.depth}` : `go movetime ${opts.movetime || 2000}`);
      });
    })();
    job.id = id;
    return job;
  }
}

export function parseInfo(line) {
  const t = line.split(/\s+/);
  const out = { multipv: 1 };
  for (let i = 1; i < t.length; i++) {
    switch (t[i]) {
      case 'depth': out.depth = +t[++i]; break;
      case 'seldepth': out.seldepth = +t[++i]; break;
      case 'multipv': out.multipv = +t[++i]; break;
      case 'nodes': out.nodes = +t[++i]; break;
      case 'nps': out.nps = +t[++i]; break;
      case 'time': out.time = +t[++i]; break;
      case 'score':
        out.score = { type: t[++i], value: +t[++i] };
        if (t[i + 1] === 'lowerbound' || t[i + 1] === 'upperbound') out.score.bound = t[++i];
        break;
      case 'pv': out.pv = t.slice(i + 1); i = t.length; break;
      default: break;
    }
  }
  return out.pv && out.score ? out : null;
}
