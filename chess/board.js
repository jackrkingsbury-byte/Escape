// Chess Lens — an interactive SVG chessboard: tap-to-move or drag-and-drop, legal-move dots,
// last-move / check / hint highlights, arrows, and a promotion picker.
import { PIECE_SVG } from './pieces.js';

const FILES = 'abcdefgh';
const LIGHT = '#ebecd0', DARK = '#739552';
const pieceUrl = (ch) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(PIECE_SVG[ch]);
const URLS = Object.fromEntries(Object.keys(PIECE_SVG).map((k) => [k, pieceUrl(k)]));

export class Board {
  /**
   * opts.onMove(from, to) → Promise<boolean> — called for a legal-looking user move.
   * opts.dests(square) → string[] — legal destinations for the piece on `square` (empty if not movable).
   */
  constructor(el, opts) {
    this.el = el;
    this.opts = opts;
    this.state = { pieces: {}, orientation: 'white', lastMove: null, check: null, hintFrom: null, arrows: [], interactive: true };
    this.selected = null;
    this.drag = null;
    el.classList.add('cl-board');
    el.addEventListener('pointerdown', (e) => this._down(e));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /** pieces: { e4: 'P', ... } */
  set(patch) {
    Object.assign(this.state, patch);
    if (this.selected && !this.opts.dests(this.selected).length) this.selected = null;
    this.render();
  }

  _xy(sq) {
    const f = FILES.indexOf(sq[0]), r = 8 - +sq[1];
    return this.state.orientation === 'black' ? [7 - f, 7 - r] : [f, r];
  }

  _sq(x, y) {
    if (x < 0 || y < 0 || x > 7 || y > 7) return null;
    const [f, r] = this.state.orientation === 'black' ? [7 - x, 7 - y] : [x, y];
    return FILES[f] + (8 - r);
  }

  _squareAt(clientX, clientY) {
    const rect = this.el.getBoundingClientRect();
    const x = Math.floor(((clientX - rect.left) / rect.width) * 8);
    const y = Math.floor(((clientY - rect.top) / rect.height) * 8);
    return this._sq(x, y);
  }

  render() {
    const s = this.state;
    let svg = '<svg viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg">';
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        svg += `<rect x="${x}" y="${y}" width="1" height="1" fill="${(x + y) % 2 ? DARK : LIGHT}"/>`;
      }
    }
    const tint = (sq, color, op) => {
      const [x, y] = this._xy(sq);
      svg += `<rect x="${x}" y="${y}" width="1" height="1" fill="${color}" opacity="${op}"/>`;
    };
    if (s.lastMove) { tint(s.lastMove.from, 'rgb(255,255,51)', 0.4); tint(s.lastMove.to, 'rgb(255,255,51)', 0.4); }
    if (this.selected) tint(this.selected, 'rgb(20,85,30)', 0.45);
    if (s.hintFrom) tint(s.hintFrom, 'rgb(74,144,217)', 0.55);
    if (s.check) {
      const [x, y] = this._xy(s.check);
      svg += `<defs><radialGradient id="chk"><stop offset="0%" stop-color="#ff0000" stop-opacity="1"/><stop offset="45%" stop-color="#e70000" stop-opacity=".9"/><stop offset="100%" stop-color="#a50000" stop-opacity="0"/></radialGradient></defs>`;
      svg += `<rect x="${x}" y="${y}" width="1" height="1" fill="url(#chk)"/>`;
    }
    for (let i = 0; i < 8; i++) {
      const file = s.orientation === 'black' ? FILES[7 - i] : FILES[i];
      const rank = s.orientation === 'black' ? i + 1 : 8 - i;
      svg += `<text x="${i + 0.95}" y="7.94" font-size=".19" text-anchor="end" font-family="system-ui,sans-serif" font-weight="700" fill="${i % 2 ? DARK : LIGHT}">${file}</text>`;
      svg += `<text x=".05" y="${i + 0.21}" font-size=".19" font-family="system-ui,sans-serif" font-weight="700" fill="${i % 2 ? LIGHT : DARK}">${rank}</text>`;
    }
    for (const [sq, ch] of Object.entries(s.pieces)) {
      const [x, y] = this._xy(sq);
      const ghost = this.drag && this.drag.from === sq && this.drag.moved;
      svg += `<image href="${URLS[ch]}" x="${x}" y="${y}" width="1" height="1"${ghost ? ' opacity=".3"' : ''} data-sq="${sq}"/>`;
    }
    if (this.selected) {
      for (const d of this.opts.dests(this.selected)) {
        const [x, y] = this._xy(d);
        svg += s.pieces[d]
          ? `<circle cx="${x + 0.5}" cy="${y + 0.5}" r=".46" fill="none" stroke="rgba(20,85,30,.5)" stroke-width=".08"/>`
          : `<circle cx="${x + 0.5}" cy="${y + 0.5}" r=".16" fill="rgba(20,85,30,.5)"/>`;
      }
    }
    for (const a of s.arrows) svg += this._arrow(a);
    svg += '</svg>';
    this.el.querySelector('svg')?.remove();
    this.el.insertAdjacentHTML('afterbegin', svg);
  }

  _arrow({ from, to, color = '#15781b', width = 0.16, opacity = 0.85 }) {
    const [x0, y0] = this._xy(from).map((v) => v + 0.5);
    const [x1, y1] = this._xy(to).map((v) => v + 0.5);
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len, px = -uy, py = ux;
    const head = 0.42, hw = width * 2.3;
    const ex = x1 - ux * head, ey = y1 - uy * head, sx = x0 + ux * 0.18, sy = y0 + uy * 0.18;
    return `<g opacity="${opacity}" pointer-events="none"><line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>` +
      `<polygon points="${x1 - ux * 0.08},${y1 - uy * 0.08} ${ex + px * hw / 2},${ey + py * hw / 2} ${ex - px * hw / 2},${ey - py * hw / 2}" fill="${color}"/></g>`;
  }

  async _tryMove(from, to) {
    this.selected = null;
    this.render();
    await this.opts.onMove(from, to);
  }

  _down(e) {
    if (!this.state.interactive || (e.button !== undefined && e.button !== 0)) return;
    const sq = this._squareAt(e.clientX, e.clientY);
    if (!sq) return;
    e.preventDefault();
    // second tap of tap-to-move
    if (this.selected && sq !== this.selected && this.opts.dests(this.selected).includes(sq)) {
      this._tryMove(this.selected, sq);
      return;
    }
    if (!this.opts.dests(sq).length) {
      if (this.selected) { this.selected = null; this.render(); }
      return;
    }
    const wasSelected = this.selected === sq;
    this.selected = sq;
    this.drag = { from: sq, moved: false, startX: e.clientX, startY: e.clientY, wasSelected };
    this.render();
    const rect = this.el.getBoundingClientRect();
    const size = rect.width / 8;
    const img = document.createElement('img');
    img.src = URLS[this.state.pieces[sq]];
    img.className = 'cl-drag';
    img.style.width = img.style.height = size + 'px';
    const place = (cx, cy) => { img.style.transform = `translate(${cx - size / 2}px, ${cy - size / 2}px)`; };
    const move = (ev) => {
      if (!this.drag) return;
      if (!this.drag.moved && Math.hypot(ev.clientX - this.drag.startX, ev.clientY - this.drag.startY) > size * 0.12) {
        this.drag.moved = true;
        document.body.appendChild(img);
        this.render();
      }
      if (this.drag.moved) place(ev.clientX, ev.clientY);
    };
    const up = (ev) => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      removeEventListener('pointercancel', up);
      img.remove();
      const d = this.drag;
      this.drag = null;
      if (!d) return;
      const target = this._squareAt(ev.clientX, ev.clientY);
      if (d.moved) {
        if (target && target !== d.from && this.opts.dests(d.from).includes(target)) { this._tryMove(d.from, target); return; }
        this.render();
        return;
      }
      // a plain tap on an already selected piece deselects it
      if (d.wasSelected) { this.selected = null; this.render(); }
    };
    place(e.clientX, e.clientY);
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
  }

  /** Ask which piece to promote to. Resolves 'q' | 'r' | 'b' | 'n' (or null if dismissed). */
  choosePromotion(square, color) {
    return new Promise((resolve) => {
      const [x, y] = this._xy(square);
      const box = document.createElement('div');
      box.className = 'cl-promo';
      const down = y < 4; // picker grows away from the edge
      box.style.left = (x * 12.5) + '%';
      box.style.top = (down ? y * 12.5 : (y - 3) * 12.5) + '%';
      const order = down ? ['q', 'r', 'b', 'n'] : ['n', 'b', 'r', 'q'];
      for (const p of order) {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.p = p;
        b.title = { q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight' }[p];
        b.innerHTML = `<img src="${URLS[color === 'w' ? p.toUpperCase() : p]}" alt="${b.title}">`;
        box.appendChild(b);
      }
      const done = (v) => { box.remove(); resolve(v); };
      box.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        const b = e.target.closest('button');
        done(b ? b.dataset.p : null);
      });
      this.el.appendChild(box);
    });
  }
}
