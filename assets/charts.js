/* ═══════════════════════════════════════════════════════════════
   GRADEFORGE AI X — SVG CHART TOOLKIT
   Zero dependencies. Everything renders offline.
   ═══════════════════════════════════════════════════════════════ */

GF.charts = (() => {
  const C = {};
  let gid = 0;
  const nextId = (p) => `${p}-${++gid}`;

  const GRAD_STOPS = `
    <stop offset="0%" stop-color="#34DBEF"/>
    <stop offset="55%" stop-color="#4F8BFF"/>
    <stop offset="100%" stop-color="#8B7CF6"/>`;

  /* ----- circular gauge ----- */
  C.ring = (value, { size = 150, stroke = 11, color = null, track = true } = {}) => {
    const id = nextId("rg");
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const v = GF.clamp(value ?? 0, 0, 100);
    const off = circ * (1 - v / 100);
    const strokeRef = color ? color : `url(#${id})`;
    return `
    <svg class="ring-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${GRAD_STOPS}</linearGradient></defs>
      ${track ? `<circle class="ring-track" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}"/>` : ""}
      <circle class="ring-val" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none"
        stroke="${strokeRef}" stroke-width="${stroke}"
        stroke-dasharray="${circ}" stroke-dashoffset="${off}"
        transform="rotate(-90 ${size / 2} ${size / 2})"/>
    </svg>`;
  };

  /* ----- sparkline ----- */
  C.sparkline = (values, { w = 120, h = 34, color = "#35DDEF" } = {}) => {
    if (!values || values.length < 2) {
      return `<svg width="${w}" height="${h}"><line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}" stroke="rgba(255,255,255,.15)" stroke-dasharray="3 4"/></svg>`;
    }
    const min = Math.min(...values), max = Math.max(...values);
    const span = max - min || 1;
    const pad = 3;
    const pts = values.map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / span) * (h - pad * 2);
      return [x, y];
    });
    const path = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    const last = pts[pts.length - 1];
    return `
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <path d="${path}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
      <circle cx="${last[0]}" cy="${last[1]}" r="3" fill="${color}" style="filter:drop-shadow(0 0 4px ${color})"/>
    </svg>`;
  };

  /* ----- area line chart ----- */
  C.lineChart = (points, { w = 560, h = 190, yMin = null, yMax = null } = {}) => {
    // points: [{label, value}]
    if (!points || points.length < 2) {
      return `<div class="empty"><div class="e-ico">📈</div><div class="e-title">Not enough data yet</div><div class="e-sub">Log at least two marks to unlock your performance curve.</div></div>`;
    }
    const id = nextId("lc");
    const vals = points.map(p => p.value);
    const lo = yMin ?? Math.max(0, Math.floor((Math.min(...vals) - 8) / 10) * 10);
    const hi = yMax ?? Math.min(100, Math.ceil((Math.max(...vals) + 8) / 10) * 10);
    const span = hi - lo || 1;
    const padL = 34, padR = 14, padT = 12, padB = 26;
    const iw = w - padL - padR, ih = h - padT - padB;
    const px = (i) => padL + (i / (points.length - 1)) * iw;
    const py = (v) => padT + ih - ((v - lo) / span) * ih;

    const linePath = points.map((p, i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${py(p.value).toFixed(1)}`).join(" ");
    const areaPath = `${linePath} L${px(points.length - 1).toFixed(1)},${(padT + ih).toFixed(1)} L${padL},${(padT + ih).toFixed(1)} Z`;

    const gridLines = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const v = lo + (span * i) / steps;
      const y = py(v);
      gridLines.push(`<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="rgba(148,180,255,.08)"/>
        <text x="${padL - 8}" y="${y + 3.5}" text-anchor="end" font-size="9.5" fill="#5F7194" font-family="JetBrains Mono,monospace">${Math.round(v)}</text>`);
    }
    const labelEvery = Math.ceil(points.length / 7);
    const xLabels = points.map((p, i) =>
      i % labelEvery === 0 || i === points.length - 1
        ? `<text x="${px(i)}" y="${h - 8}" text-anchor="middle" font-size="9.5" fill="#5F7194" font-family="Inter,sans-serif">${GF.esc(p.label)}</text>`
        : ""
    ).join("");
    const dots = points.map((p, i) =>
      `<circle cx="${px(i).toFixed(1)}" cy="${py(p.value).toFixed(1)}" r="3.2" fill="#0A1228" stroke="url(#${id}-s)" stroke-width="2"><title>${GF.esc(p.label)}: ${Math.round(p.value)}%</title></circle>`
    ).join("");

    return `
    <svg width="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="display:block">
      <defs>
        <linearGradient id="${id}-s" x1="0" y1="0" x2="1" y2="0">${GRAD_STOPS}</linearGradient>
        <linearGradient id="${id}-a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#4F8BFF" stop-opacity=".30"/>
          <stop offset="100%" stop-color="#4F8BFF" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${gridLines.join("")}
      <path d="${areaPath}" fill="url(#${id}-a)"/>
      <path d="${linePath}" fill="none" stroke="url(#${id}-s)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 5px rgba(53,221,239,.35))"/>
      ${dots}
      ${xLabels}
    </svg>`;
  };

  /* ----- horizontal bars ----- */
  C.barRow = (label, value, color, sub = "") => {
    const v = GF.clamp(value ?? 0, 0, 100);
    return `
    <div class="mt-12">
      <div class="spread" style="margin-bottom:5px">
        <span class="small" style="font-weight:700">${GF.esc(label)}</span>
        <span class="small mono" style="color:${color};font-weight:700">${Math.round(v)}%${sub ? ` <span class="muted">${GF.esc(sub)}</span>` : ""}</span>
      </div>
      <div class="progress-line"><div class="pl-fill" style="width:${v}%;background:${color};box-shadow:0 0 10px ${color}66"></div></div>
    </div>`;
  };

  /* ----- study heatmap (last 12 weeks) ----- */
  C.heatmap = (sessions) => {
    const byDate = {};
    sessions.forEach(s => { byDate[s.date] = (byDate[s.date] || 0) + s.minutes; });
    const cells = [];
    const today = new Date(GF.todayISO() + "T00:00:00");
    const totalDays = 12 * 7;
    // align so the grid ends on today's weekday column
    const start = new Date(today);
    start.setDate(start.getDate() - (totalDays - 1));
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = GF.localISO(d);
      const min = byDate[iso] || 0;
      const lvl = min === 0 ? 0 : min < 25 ? 1 : min < 50 ? 2 : min < 90 ? 3 : 4;
      cells.push(`<div class="hm-cell ${lvl ? "l" + lvl : ""}" title="${GF.fmtDate(iso)} — ${min} min"></div>`);
    }
    return `<div class="heatmap">${cells.join("")}</div>`;
  };

  return C;
})();
