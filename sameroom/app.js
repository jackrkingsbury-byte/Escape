/* Same Room — the app.

   Screens: home -> gate -> room (room / people / connections) -> thread.
   The gate is the interesting one. It is what a person sees when they are not
   at the venue: the room's pulse, their distance, and nothing that was said. */
(function (root) {
'use strict';

const C = root.SameRoomCore;
const Store = root.SameRoomStore;

const $ = (sel) => document.querySelector(sel);
const view = $('#view');
const composerSlot = $('#composerSlot');
const sheetSlot = $('#sheetSlot');

/* ------------------------------------------------------------------ state -- */

const state = {
  backend: null,
  me: { id: '', name: '', emoji: '🦊' },
  /* Last browser fix: {lat, lng, accuracyM, at}. Null until permission. */
  fix: null,
  fixError: null,
  locating: false,
  screen: 'home',        // home | gate | room | thread | host
  tab: 'room',           // room | people | connections
  eventId: null,
  event: null,
  gate: null,
  threadId: null,
  rooms: [],
  peek: null,
  messages: [],
  people: [],
  threads: [],
  dms: [],
  checkedIn: false,
  lastHeartbeat: null,
  /* When we first noticed you outside the fence — the grace clock runs from here. */
  leftFenceAt: null,
  banner: null,
  busy: false,
};

let composerKey = null;
let heartbeatTimer = null;
let tickTimer = null;
let unsubscribe = null;

/* -------------------------------------------------------------- utilities -- */

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function toast(message, kind) {
  const el = document.createElement('div');
  el.className = `toast${kind ? ` ${kind}` : ''}`;
  el.textContent = message;
  $('#toasts').appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .3s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 320);
  }, 2600);
}

const EMOJI_CHOICES = ['🦊', '🐙', '🦉', '🐝', '🦄', '🐳', '🦋', '🐢', '🦁', '🐸',
  '🦩', '🐼', '🦚', '🐧', '🦔', '🐨', '🦜', '🦡', '🦈', '🐬', '🌵', '🍄', '⚡', '🔮'];

/* ------------------------------------------------------------- geolocation -- */

/* One watcher for the whole app. Everything that needs to know where you are
   reads state.fix; nothing calls the browser API directly. */
function startLocating(onFirst) {
  if (!navigator.geolocation) {
    state.fixError = 'This browser has no location services.';
    render();
    return;
  }
  state.locating = true;
  state.fixError = null;
  render();

  let settled = false;
  navigator.geolocation.watchPosition(
    (pos) => {
      const next = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracyM: pos.coords.accuracy,
        at: Date.now(),
      };
      /* A fix that jumps faster than a plane is not a person walking. We keep
         using it (the server decides what counts) but we say so. */
      const speed = C.speedCheck(state.fix, next);
      if (speed && !speed.plausible) {
        toast('That was a very fast trip. Check your location settings.', 'bad');
      }
      state.fix = next;
      state.locating = false;
      state.fixError = null;
      if (!settled) { settled = true; if (onFirst) onFirst(next); }
      onFixChanged();
    },
    (err) => {
      state.locating = false;
      state.fixError = err.code === 1
        ? 'Location is blocked. Same Room can’t tell you’re here without it.'
        : 'Couldn’t get a location fix. Try again outdoors or near a window.';
      render();
    },
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
  );
}

async function onFixChanged() {
  if (state.screen === 'home') await loadRooms();
  else if (state.screen === 'gate' || state.screen === 'room') await syncRoom();
  else render();
}

/* ------------------------------------------------------------------- data -- */

async function loadRooms() {
  try {
    state.rooms = await state.backend.nearby(state.fix);
  } catch (err) {
    state.rooms = [];
    state.banner = err.message;
  }
  render();
}

/* What a locked-out visitor is allowed to know: head count, pulse, distance.
   Deliberately the only fetch the gate screen makes. */
async function refreshPeek() {
  if (!state.event) return;
  try {
    state.peek = await state.backend.peek(state.event, state.fix);
    if (state.peek && state.peek.event) {
      state.event = { ...state.event, ...state.peek.event };
    }
  } catch (err) { /* peek is a nicety; the gate still works without it */ }
}

/* Everything the room screen needs, in the right order: gate first, because a
   locked-out visitor must never trigger a fetch of what was said inside. */
async function syncRoom() {
  const b = state.backend;
  if (!state.event) return;

  state.gate = C.fenceCheck(state.event, state.fix, Date.now());
  await refreshPeek();

  if (!state.gate.allowed && !state.checkedIn) {
    state.screen = 'gate';
    render();
    return;
  }

  if (!state.checkedIn) {
    const res = await b.checkIn(state.event, state.fix);
    if (!res || !res.ok) {
      state.checkedIn = false;
      state.screen = 'gate';
      if (res && res.reason) state.gate = { ...state.gate, reason: res.reason, allowed: false };
      render();
      return;
    }
    state.checkedIn = true;
    state.screen = 'room';
    if (b.watchRoom) b.watchRoom(state.event.id);
    toast('You’re in the room.', 'good');
  }

  try {
    const [messages, people, threads] = await Promise.all([
      b.messages(state.event.id),
      b.people(state.event.id),
      b.threads(),
    ]);
    state.messages = messages;
    state.people = people;
    state.threads = threads;
  } catch (err) {
    /* Presence lapsed between the gate check and the fetch: fall back to the
       locked screen rather than showing a stale room. */
    if (err.reason === 'not_present') {
      state.checkedIn = false;
      state.screen = 'gate';
    } else {
      state.banner = err.message;
    }
  }
  render();
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(async () => {
    if (!state.event || !state.checkedIn) return;
    try {
      const res = await state.backend.heartbeat(state.event.id, state.fix);
      state.lastHeartbeat = { at: Date.now(), ...res };
      if (res.ok) {
        state.leftFenceAt = null;
      } else {
        /* Stepped outside. The grace clock starts at the door, not at this
           ping, or it would reset itself every twenty seconds. */
        if (!state.leftFenceAt) state.leftFenceAt = Date.now();
        state.gate = C.fenceCheck(state.event, state.fix, Date.now());
      }
    } catch (err) { /* offline; the next tick tries again */ }
    /* Runs whether or not you are inside: it is what notices that the grace
       window has run out and closes the room behind you. */
    await refreshRoomContents();
  }, C.RULES.heartbeatMs);

  tickTimer = setInterval(async () => {
    /* The locked screen is only worth looking at if it stays live — the head
       count and the pulse are the reason to walk over. */
    if (state.screen === 'gate') { await refreshPeek(); render(); }
    else if (state.screen === 'room') render();
  }, 5000);
}
function stopHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  if (tickTimer) clearInterval(tickTimer);
  heartbeatTimer = tickTimer = null;
}

async function refreshRoomContents() {
  if (!state.event || !state.checkedIn) return;
  try {
    const [messages, people] = await Promise.all([
      state.backend.messages(state.event.id),
      state.backend.people(state.event.id),
    ]);
    state.messages = messages;
    state.people = people;
    render();
  } catch (err) {
    if (err.reason === 'not_present') {
      state.checkedIn = false;
      state.screen = 'gate';
      render();
    }
  }
}

/* ---------------------------------------------------------------- routing -- */

function goHome() {
  state.screen = 'home';
  state.eventId = state.event = state.gate = state.peek = null;
  state.checkedIn = false;
  state.leftFenceAt = null;
  state.lastHeartbeat = null;
  state.messages = state.people = [];
  stopHeartbeat();
  if (state.backend.watchRoom) state.backend.watchRoom(null);
  composerKey = null;
  loadRooms();
}

async function openRoom(event) {
  state.event = event;
  state.eventId = event.id;
  state.checkedIn = false;
  state.leftFenceAt = null;
  state.lastHeartbeat = null;
  state.tab = 'room';
  state.screen = 'gate';
  composerKey = null;
  render();
  await syncRoom();
  startHeartbeat();
}

async function openThread(threadId) {
  state.threadId = threadId;
  state.screen = 'thread';
  composerKey = null;
  try {
    state.dms = await state.backend.dms(threadId);
    state.threads = await state.backend.threads();
  } catch (err) {
    toast(err.message, 'bad');
    return;
  }
  render();
}

/* ----------------------------------------------------------------- radar -- */

/* A picture of one number: how far you are from the fence. Nothing here is
   anyone else's position — only yours and the venue's. */
function radarSVG(gate) {
  const size = 200, cx = size / 2, cy = size / 2;
  const dist = gate.distanceM == null ? 0 : gate.distanceM;
  const span = Math.max(gate.radiusM * 1.8, dist * 1.35, 40);
  const scale = (cy - 16) / span;
  const fenceR = Math.max(4, gate.radiusM * scale);
  const bearing = gate.bearingDeg == null ? 0 : gate.bearingDeg;
  /* The venue sits at the centre; you sit at your bearing and distance from it. */
  const rad = ((bearing + 180) % 360) * Math.PI / 180;
  const yr = Math.min(cy - 10, dist * scale);
  const yx = cx + Math.sin(rad) * yr;
  const yy = cy - Math.cos(rad) * yr;
  const inside = gate.inside;

  return `<div class="radar-wrap"><svg class="radar" viewBox="0 0 ${size} ${size}" aria-label="How far you are from the venue">
    <circle class="grid" cx="${cx}" cy="${cy}" r="${(cy - 16) * 0.66}"/>
    <circle class="grid" cx="${cx}" cy="${cy}" r="${cy - 16}"/>
    <circle class="fence${inside ? ' inside' : ''}" cx="${cx}" cy="${cy}" r="${fenceR}"/>
    ${inside ? '' : `<line class="link" x1="${cx}" y1="${cy}" x2="${yx.toFixed(1)}" y2="${yy.toFixed(1)}"/>`}
    <circle class="venue" cx="${cx}" cy="${cy}" r="4"/>
    ${inside ? `<circle class="ring" cx="${yx.toFixed(1)}" cy="${yy.toFixed(1)}" r="6"/>` : ''}
    <circle class="you${inside ? '' : ' out'}" cx="${yx.toFixed(1)}" cy="${yy.toFixed(1)}" r="6"/>
    <text x="${cx}" y="${size - 3}" text-anchor="middle">${esc(C.fuzzyDistance(span))} across</text>
  </svg></div>`;
}

/* ----------------------------------------------------------------- views -- */

function renderHome() {
  const rooms = C.sortRooms(state.rooms, state.fix, Date.now());
  const hasFix = C.isPoint(state.fix);

  const locate = hasFix ? '' : `
    <div class="locate">
      <h2>Where are you?</h2>
      <p>Same Room needs your location for one thing only: to prove you are standing
         where the room is. Your coordinates never leave this device except to answer
         that question.</p>
      <button class="btn btn-primary btn-block" id="btnLocate" ${state.locating ? 'disabled' : ''}>
        ${state.locating ? 'Looking…' : 'Find rooms around me'}
      </button>
      ${state.fixError ? `<div class="err">${esc(state.fixError)}</div>` : ''}
    </div>`;

  const list = !hasFix ? '' : (rooms.length ? rooms.map(({ event, gate }) => {
    const open = C.phaseIsOpen(gate.phase);
    const badge = gate.inside && open
      ? '<span class="pill live"><span class="dot pulse"></span>You’re here</span>'
      : (open ? '<span class="pill locked">Locked</span>'
              : `<span class="pill">${esc(C.phraseForPhase(event, Date.now()))}</span>`);
    return `<button class="room-card${gate.inside && open ? ' is-open' : ''}" data-room="${esc(event.id)}">
      <span class="av">${esc((event.demo ? '🧪' : '◎'))}</span>
      <span class="body">
        <span class="name">${esc(event.name)}${event.demo ? ' <span class="pill demo">demo</span>' : ''}</span>
        <span class="meta">${esc(event.venue || 'Somewhere')} · ${esc(C.phraseForPhase(event, Date.now()))}</span>
      </span>
      <span class="right">
        ${badge}
        <span class="dist muted">${esc(C.fuzzyDistance(gate.distanceM))}</span>
        <span class="tiny faint">${event.liveCount || 0} in the room</span>
      </span>
    </button>`;
  }).join('') : '<div class="empty">No rooms near you right now.<br/>Start one, or enter a code someone gave you.</div>');

  view.innerHTML = `
    <div class="hero">
      <h1>The chat only opens when you’re there</h1>
      <p>Walk into the venue and the room unlocks. Walk out and it closes behind you.
         Connect with someone inside and that one thread stays open — wherever you both go.</p>
    </div>

    ${locate}

    <div class="card" style="margin-top:12px">
      <label class="field" style="margin-bottom:8px"><span>Got a code?</span></label>
      <div class="code-entry">
        <input id="codeInput" type="text" inputmode="latin" autocomplete="off"
               maxlength="8" placeholder="ABC123" value="${esc(state.codeDraft || '')}" />
        <button class="btn btn-primary" id="btnCode">Go</button>
      </div>
      ${state.codeError ? `<div class="err">${esc(state.codeError)}</div>` : ''}
    </div>

    ${hasFix ? `<div class="section-head"><h2>Rooms around you</h2><span class="sp"></span>
      <span class="tiny faint mono">±${Math.round(state.fix.accuracyM || 0)} m</span></div>${list}` : ''}

    <div class="section-head"><h2>Hosting something?</h2></div>
    <button class="btn btn-ghost btn-block" id="btnHost">Draw a room around a place</button>

    <footer>
      <p><strong>${esc(state.backend.label)}</strong> —
      ${state.backend.isLocal
        ? 'rooms live on this device only. Point it at a Supabase project in settings for real ones.'
        : 'rooms are shared and live.'}</p>
      <p style="margin-top:8px">Location is used to answer one question — are you inside this venue —
      and is never shown to anyone as a coordinate. <a href="#" id="lnkPrivacy">How it works</a></p>
    </footer>`;

  if ($('#btnLocate')) $('#btnLocate').onclick = () => startLocating();
  $('#btnHost').onclick = () => { state.screen = 'host'; render(); };
  $('#lnkPrivacy').onclick = (e) => { e.preventDefault(); showPrivacy(); };
  const codeInput = $('#codeInput');
  codeInput.oninput = () => {
    state.codeDraft = C.normalizeCode(codeInput.value);
    codeInput.value = state.codeDraft;
  };
  codeInput.onkeydown = (e) => { if (e.key === 'Enter') enterCode(); };
  $('#btnCode').onclick = enterCode;
  view.querySelectorAll('[data-room]').forEach((el) => {
    el.onclick = () => {
      const event = state.rooms.find((r) => r.id === el.dataset.room);
      if (event) openRoom(event);
    };
  });
}

async function enterCode() {
  const code = C.normalizeCode(state.codeDraft || '');
  state.codeError = null;
  if (!C.isCompleteCode(code)) {
    state.codeError = 'A room code is six characters.';
    return render();
  }
  try {
    const event = await state.backend.findByCode(code);
    if (!event) {
      state.codeError = 'No room with that code.';
      return render();
    }
    state.codeDraft = '';
    openRoom(event);
  } catch (err) {
    state.codeError = err.message;
    render();
  }
}

/* The locked screen. This is the product: you can see that something is
   happening and exactly how far you are from being part of it. */
function renderGate() {
  const gate = state.gate || C.fenceCheck(state.event, state.fix, Date.now());
  const peek = state.peek || {};
  const open = C.phaseIsOpen(gate.phase);
  const dir = gate.bearingDeg == null ? '' :
    `<span class="arrow" style="transform:rotate(${gate.bearingDeg}deg)">↑</span> ${esc(C.compass(gate.bearingDeg))}`;

  const headline = gate.distanceM == null
    ? '—'
    : (gate.inside ? 'You’re inside' : C.fuzzyDistance(gate.distanceM));

  const why = !open
    ? C.gateCopy(gate.reason)
    : (gate.reason === 'fix_too_vague'
      ? `Your phone is only sure to ±${Math.round((state.fix && state.fix.accuracyM) || 0)} m.
         This room needs ±${gate.accuracyBudgetM || C.accuracyBudget(gate.radiusM)} m or better.`
      : gate.inside ? 'Checking you in…'
      : `Get within ${esc(gate.radiusM)} m of the door and the room opens by itself.`);

  view.innerHTML = `
    <div class="row" style="margin-bottom:10px">
      <button class="icon-btn" id="btnBack">←</button>
      <div style="min-width:0">
        <div style="font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(state.event.name)}</div>
        <div class="tiny muted">${esc(state.event.venue || 'Somewhere')} · ${esc(C.phraseForPhase(state.event, Date.now()))}</div>
      </div>
    </div>

    <div class="card gate">
      ${radarSVG(gate)}
      <div class="big">${esc(headline)}</div>
      <div class="tiny faint mono">${dir}</div>
      <div class="why">${why}</div>

      <div class="through-the-door">
        <div class="tile"><div class="n">${peek.liveCount == null ? '—' : peek.liveCount}</div><div class="k">in the room</div></div>
        <div class="tile"><div class="n">${peek.pulse == null ? '—' : peek.pulse}</div><div class="k">said /5 min</div></div>
        <div class="tile"><div class="n">${esc(state.event.radiusM)}<span class="tiny">m</span></div><div class="k">door radius</div></div>
      </div>

      <div class="blurred">
        <div class="fake"></div><div class="fake"></div><div class="fake"></div><div class="fake"></div>
        <div class="over">${open ? 'Readable from inside only' : esc(C.gateCopy(gate.reason))}</div>
      </div>

      <div class="stack" style="margin-top:16px">
        <button class="btn btn-primary btn-block" id="btnRetry" ${state.locating ? 'disabled' : ''}>
          ${state.locating ? 'Looking…' : 'Check again'}
        </button>
        ${state.event.demo ? '' : `<button class="btn btn-quiet" id="btnShare">Share this room</button>`}
      </div>
      ${state.fixError ? `<div class="err">${esc(state.fixError)}</div>` : ''}
    </div>

    <div class="note" style="margin-top:12px">
      Same Room checks the distance in the database, not in this page — so a
      patched app can’t let itself in. ${state.backend.isLocal
        ? 'On this device that check runs locally; connect a project for the real one.' : ''}
    </div>`;

  $('#btnBack').onclick = goHome;
  $('#btnRetry').onclick = () => {
    if (!C.isPoint(state.fix)) startLocating(() => syncRoom());
    else syncRoom();
  };
  if ($('#btnShare')) $('#btnShare').onclick = () => shareRoom(state.event);
}

function renderRoom() {
  const gate = state.gate || {};
  const drifting = !!state.leftFenceAt;
  const graceLeft = drifting
    ? C.countdown(C.graceLeftMs({ inside: false, leftFenceAt: state.leftFenceAt }, Date.now()))
    : null;
  const waiting = state.people.filter((p) => p.wavedMe && !p.threadId).length;

  const head = `
    <div class="room-head">
      <div class="line1">
        <button class="icon-btn" id="btnBack">←</button>
        <div class="title">${esc(state.event.name)}</div>
        <button class="icon-btn" id="btnRoomInfo">i</button>
      </div>
      <div class="line2">
        <span class="pill live"><span class="dot pulse"></span>${state.people.length + 1} here</span>
        <span class="pill">${esc(C.phraseForPhase(state.event, Date.now()))}</span>
        ${gate.distanceM != null ? `<span class="pill locked mono">${esc(C.fuzzyDistance(gate.distanceM))} from centre</span>` : ''}
        ${state.event.demo ? '<span class="pill demo">demo room</span>' : ''}
      </div>
    </div>`;

  const tabs = `
    <div class="tabs">
      <button class="tab${state.tab === 'room' ? ' active' : ''}" data-tab="room">Room</button>
      <button class="tab${state.tab === 'people' ? ' active' : ''}" data-tab="people">
        People${waiting ? ` <span class="badge">${waiting}</span>` : ''}
      </button>
      <button class="tab${state.tab === 'connections' ? ' active' : ''}" data-tab="connections">Connections</button>
    </div>`;

  let body = '';
  if (state.tab === 'room') {
    body = state.messages.length
      ? `<div class="feed" id="feed">${state.messages.map(messageHTML).join('')}</div>`
      : '<div class="empty">Nobody has said anything yet.<br/>You could be first.</div>';
  } else if (state.tab === 'people') {
    body = state.people.length
      ? state.people.map(personHTML).join('')
      : '<div class="empty">You’re the only one checked in right now.</div>';
  } else {
    const mine = state.threads;
    body = mine.length
      ? mine.map(threadHTML).join('')
      : `<div class="empty">No connections yet.<br/>Wave at someone in <b>People</b> — if they wave back,
         you get a thread that outlives the event.</div>`;
  }

  view.innerHTML = head +
    (drifting ? `<div class="drift">👟 You’ve stepped outside. The room closes in ${esc(graceLeft)}.</div>` : '') +
    tabs + body;

  $('#btnBack').onclick = goHome;
  $('#btnRoomInfo').onclick = () => showRoomInfo();
  view.querySelectorAll('[data-tab]').forEach((el) => {
    el.onclick = () => { state.tab = el.dataset.tab; composerKey = null; render(); };
  });
  view.querySelectorAll('[data-wave]').forEach((el) => {
    el.onclick = () => waveAt(el.dataset.wave);
  });
  view.querySelectorAll('[data-open-thread]').forEach((el) => {
    el.onclick = () => openThread(el.dataset.openThread);
  });
  view.querySelectorAll('[data-person-menu]').forEach((el) => {
    el.onclick = () => showPersonMenu(el.dataset.personMenu);
  });

  if (state.tab === 'room') scrollFeedToBottom();
}

function messageHTML(m) {
  const av = m.emoji || C.avatarFor(m.userId).emoji;
  return `<div class="msg${m.mine ? ' mine' : ''}${m.demo ? ' demo' : ''}">
    <span class="av">${esc(av)}</span>
    <span class="bubble">
      <span class="who">${esc(m.mine ? 'You' : (m.name || 'Someone'))} · ${esc(C.relativeTime(m.createdAt))}</span>
      <div class="text">${esc(m.body)}</div>
    </span>
  </div>`;
}

function personHTML(p) {
  const where = p.inside === false ? 'just stepped out'
    : (p.band ? C.bandCopy(p.band) : 'somewhere in here');
  let action;
  if (p.threadId) {
    action = `<button class="btn btn-ghost btn-sm" data-open-thread="${esc(p.threadId)}">Open</button>`;
  } else if (p.iWaved) {
    action = `<span class="pill acc">waved</span>`;
  } else if (p.wavedMe) {
    action = `<button class="btn btn-primary btn-sm" data-wave="${esc(p.id)}">Wave back</button>`;
  } else {
    action = `<button class="btn btn-ghost btn-sm" data-wave="${esc(p.id)}">Wave</button>`;
  }
  return `<div class="person${p.threadId ? ' matched' : ''}">
    <span class="av">${esc(p.emoji || C.avatarFor(p.id).emoji)}</span>
    <span class="body">
      <span class="name">${esc(p.name || 'Someone')}
        ${p.wavedMe && !p.threadId ? '<span class="pill acc">waved at you</span>' : ''}
        ${p.demo ? '<span class="pill demo">demo</span>' : ''}</span>
      <span class="where">${esc(where)}</span>
    </span>
    ${action}
    <button class="icon-btn" data-person-menu="${esc(p.id)}" title="More">⋯</button>
  </div>`;
}

function threadHTML(t) {
  return `<button class="thread-card" data-open-thread="${esc(t.id)}">
    <span class="av">${esc(t.withEmoji || '🦊')}</span>
    <span class="body">
      <span class="name" style="font-weight:600">${esc(t.withName)}</span>
      <span class="last">${esc(t.lastBody || `met at ${t.eventName}`)}</span>
    </span>
    <span class="tiny faint">${esc(C.relativeTime(t.lastAt))}</span>
  </button>`;
}

function renderThread() {
  const t = state.threads.find((x) => x.id === state.threadId);
  if (!t) { goHome(); return; }
  view.innerHTML = `
    <div class="room-head">
      <div class="line1">
        <button class="icon-btn" id="btnBack">←</button>
        <span class="av">${esc(t.withEmoji || '🦊')}</span>
        <div class="title">${esc(t.withName)}</div>
      </div>
      <div class="line2"><span class="pill">met at ${esc(t.eventName)}</span>
        <span class="pill acc">stays open anywhere</span></div>
    </div>
    ${state.dms.length
      ? `<div class="feed" id="feed">${state.dms.map((d) => messageHTML({
          ...d, name: d.mine ? 'You' : t.withName, emoji: d.mine ? state.me.emoji : t.withEmoji,
        })).join('')}</div>`
      : `<div class="empty">You both waved. Say something.</div>`}`;
  $('#btnBack').onclick = () => {
    state.screen = state.event ? 'room' : 'home';
    state.tab = 'connections';
    composerKey = null;
    if (!state.event) goHome(); else render();
  };
  scrollFeedToBottom();
}

function renderHost() {
  const now = new Date();
  const round = (d) => new Date(Math.round(d.getTime() / 900000) * 900000);
  const fmt = (d) => {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const d = state.hostDraft || (state.hostDraft = {
    name: '', venue: '',
    lat: state.fix ? state.fix.lat : null,
    lng: state.fix ? state.fix.lng : null,
    radiusM: 100,
    startsAt: fmt(round(now)),
    endsAt: fmt(round(new Date(now.getTime() + 4 * 3600000))),
    isPublic: true,
  });

  view.innerHTML = `
    <div class="row" style="margin-bottom:12px">
      <button class="icon-btn" id="btnBack">←</button><h2>Draw a room</h2>
    </div>
    <div class="card">
      <label class="field"><span>What is it?</span>
        <input type="text" id="hName" maxlength="60" placeholder="Rooftop session" value="${esc(d.name)}" /></label>
      <label class="field"><span>Where (just for the name)</span>
        <input type="text" id="hVenue" maxlength="80" placeholder="The Old Biscuit Mill" value="${esc(d.venue)}" /></label>

      <label class="field"><span>The door</span></label>
      <div class="row" style="margin-bottom:10px">
        <button class="btn btn-ghost btn-sm" id="hHere">Use where I am</button>
        <span class="tiny mono ${d.lat == null ? 'faint' : 'muted'}">
          ${d.lat == null ? 'no location set' : `${d.lat.toFixed(5)}, ${d.lng.toFixed(5)}`}</span>
      </div>

      <label class="field"><span>How far counts as "here" — ${d.radiusM} m</span>
        <input type="range" id="hRadius" min="${C.RULES.minRadiusM}" max="${C.RULES.maxRadiusM}" step="5" value="${d.radiusM}" /></label>
      <p class="tiny faint" style="margin:-6px 0 14px">
        A single room is 25–60 m. A club or hall, 80–150 m. A festival field, 300 m+.
        Bigger means easier to fake your way into.</p>

      <label class="field"><span>Doors</span>
        <input type="datetime-local" id="hStart" value="${esc(d.startsAt)}" /></label>
      <label class="field"><span>Ends</span>
        <input type="datetime-local" id="hEnd" value="${esc(d.endsAt)}" /></label>

      <label class="switch" style="margin-bottom:14px">
        <input type="checkbox" id="hPublic" ${d.isPublic ? 'checked' : ''} />
        <span>List it for anyone standing nearby (otherwise the code is the only way in)</span>
      </label>

      <button class="btn btn-primary btn-block" id="hCreate">Create the room</button>
      ${state.hostError ? `<div class="err">${esc(state.hostError)}</div>` : ''}
    </div>`;

  $('#btnBack').onclick = goHome;
  const bind = (id, key, transform) => {
    const el = $(id);
    el.oninput = () => { d[key] = transform ? transform(el.value) : el.value; };
  };
  bind('#hName', 'name'); bind('#hVenue', 'venue');
  bind('#hStart', 'startsAt'); bind('#hEnd', 'endsAt');
  $('#hRadius').oninput = (e) => { d.radiusM = Number(e.target.value); render(); };
  $('#hPublic').onchange = (e) => { d.isPublic = e.target.checked; };
  $('#hHere').onclick = () => {
    if (C.isPoint(state.fix)) { d.lat = state.fix.lat; d.lng = state.fix.lng; render(); }
    else startLocating((fix) => { d.lat = fix.lat; d.lng = fix.lng; render(); });
  };
  $('#hCreate').onclick = async () => {
    state.hostError = null;
    try {
      const event = await state.backend.createEvent({
        ...d,
        startsAt: new Date(d.startsAt).toISOString(),
        endsAt: new Date(d.endsAt).toISOString(),
      });
      state.hostDraft = null;
      showCreated(event);
    } catch (err) {
      state.hostError = err.message;
      render();
    }
  };
}

/* -------------------------------------------------------------- composer -- */

/* Built once per context and left alone, so re-rendering the feed never eats
   what someone is halfway through typing. */
function renderComposer() {
  const wantKey = state.screen === 'room' && state.tab === 'room' && state.checkedIn
    ? `room:${state.eventId}`
    : (state.screen === 'thread' ? `thread:${state.threadId}` : null);

  /* No composer wanted: clear it, even if the key already matched — otherwise
     switching to a tab you can't type on would leave the last box behind. */
  if (!wantKey) {
    composerKey = null;
    composerSlot.innerHTML = '';
    return;
  }
  if (wantKey === composerKey) return;
  composerKey = wantKey;
  composerSlot.innerHTML = '';

  const box = document.createElement('div');
  box.className = 'composer';
  box.innerHTML = `<div class="composer-in">
      <textarea id="say" rows="1" maxlength="${C.RULES.maxMessage}"
        placeholder="${wantKey.startsWith('room') ? 'Say something to the room' : 'Message'}"></textarea>
      <button class="btn btn-primary" id="sayBtn" title="Send">↑</button>
    </div>`;
  composerSlot.appendChild(box);

  const ta = box.querySelector('#say');
  const grow = () => {
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(120, ta.scrollHeight)}px`;
  };
  ta.oninput = grow;
  ta.onkeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };
  box.querySelector('#sayBtn').onclick = send;

  async function send() {
    const body = C.sanitizeMessage(ta.value);
    if (!body) return;
    ta.value = ''; grow();
    try {
      if (composerKey.startsWith('room')) {
        await state.backend.post(state.eventId, body);
        await refreshRoomContents();
      } else {
        await state.backend.sendDm(state.threadId, body);
        state.dms = await state.backend.dms(state.threadId);
        render();
      }
    } catch (err) {
      toast(err.message || 'Couldn’t send that.', 'bad');
      ta.value = body; grow();
    }
  }
}

function scrollFeedToBottom() {
  const feed = $('#feed');
  if (!feed) return;
  requestAnimationFrame(() => {
    root.scrollTo({ top: document.body.scrollHeight, behavior: 'auto' });
  });
}

/* ---------------------------------------------------------------- sheets -- */

function sheet(html, onMount) {
  sheetSlot.innerHTML = `<div class="sheet-back" id="sheetBack"><div class="sheet">${html}</div></div>`;
  const back = $('#sheetBack');
  back.onclick = (e) => { if (e.target === back) closeSheet(); };
  if (onMount) onMount();
}
function closeSheet() { sheetSlot.innerHTML = ''; }

function showOnboarding() {
  const pick = state.me.emoji || '🦊';
  sheet(`
    <h2>Pick a face and a name</h2>
    <p class="sub">This is all anyone in a room sees. No account, no phone number,
       no photo. You can change it whenever.</p>
    <label class="field"><span>Name</span>
      <input type="text" id="obName" maxlength="${C.RULES.maxName}" placeholder="What people call you"
             value="${esc(state.me.name || '')}" /></label>
    <label class="field"><span>Face</span></label>
    <div class="emoji-grid" id="obGrid">
      ${EMOJI_CHOICES.map((e) => `<button data-e="${e}" class="${e === pick ? 'on' : ''}">${e}</button>`).join('')}
    </div>
    <button class="btn btn-primary btn-block" id="obGo" style="margin-top:16px">That’s me</button>
    <div class="err hide" id="obErr"></div>`, () => {
    let chosen = pick;
    $('#obGrid').querySelectorAll('button').forEach((b) => {
      b.onclick = () => {
        chosen = b.dataset.e;
        $('#obGrid').querySelectorAll('button').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
      };
    });
    $('#obGo').onclick = async () => {
      const name = C.sanitizeName($('#obName').value);
      if (name.length < 2) {
        const err = $('#obErr');
        err.textContent = 'Give people something to call you.';
        err.classList.remove('hide');
        return;
      }
      state.me = await state.backend.setProfile({ name, emoji: chosen });
      closeSheet();
      render();
    };
  });
}

function showSettings() {
  const cfg = Store.loadConfig();
  sheet(`
    <div class="sheet-head">
      <div><h2>You &amp; settings</h2>
        <p class="sub" style="margin:0">${esc(state.backend.label)}</p></div>
      <span class="sp"></span>
      <button class="icon-btn" id="stClose">✕</button>
    </div>

    <div class="row" style="margin-bottom:16px">
      <span class="av">${esc(state.me.emoji)}</span>
      <div style="flex:1"><div style="font-weight:600">${esc(state.me.name || 'Nameless')}</div>
        <div class="tiny faint mono">${esc((state.me.id || '').slice(0, 12))}</div></div>
      <button class="btn btn-ghost btn-sm" id="stEdit">Edit</button>
    </div>

    <div class="note" style="margin-bottom:16px">
      ${state.backend.isLocal
        ? 'Rooms are stored on this device. To run real ones with real strangers, point Same Room at a Supabase project — the schema is in <span class="mono">sameroom/supabase/0001_init.sql</span>.'
        : 'Connected. Rooms, presence and messages are shared and enforced server-side.'}
    </div>

    <label class="field"><span>Supabase project URL</span>
      <input type="url" id="stUrl" placeholder="https://xxxx.supabase.co" value="${esc(cfg.url)}" /></label>
    <label class="field"><span>Anon (publishable) key</span>
      <input type="password" id="stKey" placeholder="eyJ…" value="${esc(cfg.anonKey)}" /></label>
    <p class="tiny faint" style="margin:-4px 0 14px">
      The anon key is meant to be public — row-level security is what protects the data.
      Anonymous sign-ins must be enabled on the project.</p>
    <button class="btn btn-primary btn-block" id="stSave">Save and reconnect</button>

    <div style="margin-top:20px;border-top:1px solid var(--line);padding-top:16px">
      <button class="btn btn-danger btn-block" id="stWipe">Wipe everything on this device</button>
      <p class="tiny faint center" style="margin-top:10px">
        <a href="#" id="stPrivacy">What Same Room knows about you</a></p>
    </div>`, () => {
    $('#stClose').onclick = closeSheet;
    $('#stEdit').onclick = () => { closeSheet(); showOnboarding(); };
    $('#stPrivacy').onclick = (e) => { e.preventDefault(); showPrivacy(); };
    $('#stSave').onclick = async () => {
      Store.saveConfig({ url: $('#stUrl').value, anonKey: $('#stKey').value });
      toast('Reconnecting…');
      closeSheet();
      await boot();
    };
    $('#stWipe').onclick = async () => {
      if (!root.confirm('Delete your identity, rooms and messages stored on this device?')) return;
      await state.backend.reset();
      localStorage.removeItem(Store.KEYS.me);
      localStorage.removeItem(Store.KEYS.data);
      closeSheet();
      await boot();
      toast('Wiped.');
    };
  });
}

function showPrivacy() {
  sheet(`
    <div class="sheet-head"><div><h2>What Same Room knows</h2></div>
      <span class="sp"></span><button class="icon-btn" id="pvClose">✕</button></div>
    <div class="stack">
      <div class="note"><b>Your coordinates answer one question:</b> are you inside this venue's
        circle right now? The answer is stored. The coordinates are stored only as your latest
        fix, are never returned to another person, and are deleted when you leave the room.</div>
      <div class="note"><b>Other people are distances, not dots.</b> Anyone in a room with you
        is described as “a few steps away” or “across the room” — a band computed server-side.
        No map, no trail, no exact position, ever.</div>
      <div class="note"><b>The room is deaf from outside.</b> Messages are readable only while
        you are checked in. That is a database rule, not a screen that hides things.</div>
      <div class="note"><b>Rooms are temporary.</b> Messages are purged 24 hours after the event
        ends. Connections you made are kept — those are yours.</div>
      <div class="note warn"><b>The honest limit:</b> any phone can be told to report a false
        position, by a developer tool or a mock-location app. Same Room checks the distance in
        the database, rejects fixes that are too vague, and refuses jumps that are faster than
        a plane — but no web app can prove a stranger is really standing where their phone says.
        Treat the fence as a good door, not a lock.</div>
    </div>`, () => { $('#pvClose').onclick = closeSheet; });
}

function showRoomInfo() {
  const e = state.event;
  sheet(`
    <div class="sheet-head"><div><h2>${esc(e.name)}</h2>
      <p class="sub" style="margin:0">${esc(e.venue || 'Somewhere')}</p></div>
      <span class="sp"></span><button class="icon-btn" id="riClose">✕</button></div>
    <div class="stack">
      <div class="row"><span class="pill">${esc(C.phraseForPhase(e, Date.now()))}</span>
        <span class="pill locked">${esc(e.radiusM)} m door</span>
        ${e.isPublic ? '<span class="pill acc">listed nearby</span>' : '<span class="pill">code only</span>'}</div>
      <div class="code-out">${esc(e.code || '——————')}</div>
      <button class="btn btn-ghost btn-block" id="riShare">Share this room</button>
      <button class="btn btn-danger btn-block" id="riLeave">Leave the room</button>
    </div>`, () => {
    $('#riClose').onclick = closeSheet;
    $('#riShare').onclick = () => shareRoom(e);
    $('#riLeave').onclick = async () => {
      await state.backend.leave(e.id);
      closeSheet();
      goHome();
      toast('You left.');
    };
  });
}

function showCreated(event) {
  sheet(`
    <h2>Your room is open</h2>
    <p class="sub">Anyone standing inside ${esc(event.venue || 'the venue')} who enters this code
       gets in. Anyone else gets the locked screen.</p>
    <div class="code-out">${esc(event.code)}</div>
    <div class="stack">
      <button class="btn btn-primary btn-block" id="crShare">Share it</button>
      <button class="btn btn-ghost btn-block" id="crGo">Go to the room</button>
    </div>`, () => {
    $('#crShare').onclick = () => shareRoom(event);
    $('#crGo').onclick = () => { closeSheet(); openRoom(event); };
  });
}

function showPersonMenu(userId) {
  const p = state.people.find((x) => x.id === userId);
  if (!p) return;
  sheet(`
    <div class="sheet-head"><span class="av">${esc(p.emoji)}</span>
      <div><h2 style="font-size:1.1rem">${esc(p.name)}</h2>
        <p class="sub" style="margin:0">${esc(p.band ? C.bandCopy(p.band) : 'in this room')}</p></div>
      <span class="sp"></span><button class="icon-btn" id="pmClose">✕</button></div>
    <div class="stack">
      ${p.iWaved && !p.threadId
        ? '<button class="btn btn-ghost btn-block" id="pmUnwave">Take back my wave</button>' : ''}
      <button class="btn btn-danger btn-block" id="pmBlock">Block ${esc(p.name)}</button>
      <button class="btn btn-quiet btn-block" id="pmReport">Report to the host</button>
    </div>`, () => {
    $('#pmClose').onclick = closeSheet;
    if ($('#pmUnwave')) $('#pmUnwave').onclick = async () => {
      await state.backend.unwave(state.eventId, userId);
      closeSheet(); await refreshRoomContents();
    };
    $('#pmBlock').onclick = async () => {
      await state.backend.block(userId);
      closeSheet(); await refreshRoomContents();
      toast('Blocked. You won’t see each other again.');
    };
    $('#pmReport').onclick = async () => {
      const reason = root.prompt('What happened?') || '';
      if (!reason.trim()) return;
      await state.backend.report(userId, state.eventId, reason);
      closeSheet();
      toast('Reported.');
    };
  });
}

async function showThreadsList() {
  try {
    state.threads = await state.backend.threads();
  } catch (err) { /* nothing to show */ }
  sheet(`
    <div class="sheet-head"><div><h2>Your connections</h2>
      <p class="sub" style="margin:0">People you both waved at. These stay open anywhere.</p></div>
      <span class="sp"></span><button class="icon-btn" id="thClose">✕</button></div>
    ${state.threads.length
      ? state.threads.map(threadHTML).join('')
      : '<div class="empty">Nothing yet. Connections start inside a room.</div>'}`, () => {
    $('#thClose').onclick = closeSheet;
    sheetSlot.querySelectorAll('[data-open-thread]').forEach((el) => {
      el.onclick = () => { closeSheet(); openThread(el.dataset.openThread); };
    });
  });
}

async function shareRoom(event) {
  const url = `${location.origin}${location.pathname}#${event.code}`;
  const text = `“${event.name}” on Same Room — code ${event.code}. You have to be there to read it.`;
  try {
    if (navigator.share) {
      await navigator.share({ title: event.name, text, url });
      return;
    }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    toast('Copied.', 'good');
  } catch (err) { /* share sheet dismissed */ }
}

async function waveAt(userId) {
  try {
    const res = await state.backend.wave(state.eventId, userId);
    if (res && res.mutual) {
      toast('You both waved — thread open.', 'good');
    } else if (res && res.ok) {
      toast('Waved. They’ll see it.');
    } else {
      toast('They’ve left the room.', 'bad');
    }
    await refreshRoomContents();
  } catch (err) {
    toast(err.message, 'bad');
  }
}

/* ----------------------------------------------------------------- render -- */

function render() {
  if (!state.backend) return;
  if (state.screen === 'home') renderHome();
  else if (state.screen === 'gate' && state.event) renderGate();
  else if (state.screen === 'room' && state.event) renderRoom();
  else if (state.screen === 'thread') renderThread();
  else if (state.screen === 'host') renderHost();
  else renderHome();
  renderComposer();
}

/* ------------------------------------------------------------------- boot -- */

async function boot() {
  stopHeartbeat();
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }

  state.backend = await Store.createBackend();
  if (Store.lastError) {
    toast('Couldn’t reach that project — using this device.', 'bad');
    Store.lastError = null;
  }
  state.me = await state.backend.me();
  unsubscribe = state.backend.subscribe(() => {
    if (state.screen === 'room') refreshRoomContents();
    else if (state.screen === 'thread') {
      state.backend.dms(state.threadId).then((d) => { state.dms = d; render(); }).catch(() => {});
    } else if (state.screen === 'home') loadRooms();
  });

  state.screen = 'home';
  render();

  if (!state.me.name) showOnboarding();

  /* If location was already granted, pick up where we left off without asking. */
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' });
      if (status.state === 'granted') startLocating(() => openFromHash());
    } catch (err) { /* Safari and friends: the button is still there */ }
  }
  openFromHash();
}

/* A shared link (#ABC123) drops you straight at that room's door. */
async function openFromHash() {
  const code = C.normalizeCode(location.hash.replace('#', ''));
  if (!C.isCompleteCode(code)) return;
  try {
    const event = await state.backend.findByCode(code);
    if (event) { history.replaceState(null, '', location.pathname); openRoom(event); }
  } catch (err) { /* fall through to home */ }
}

/* --------------------------------------------------------------- chrome -- */

$('#btnSettings').onclick = showSettings;
$('#btnThreads').onclick = showThreadsList;
$('#brandHome').onclick = goHome;
$('#brandHome').onkeydown = (e) => { if (e.key === 'Enter') goHome(); };
$('#btnTheme').onclick = () => {
  const el = document.documentElement;
  const next = el.dataset.theme === 'dark' ? 'light' : 'dark';
  el.dataset.theme = next;
  try { localStorage.setItem('sameroom.theme', next); } catch (err) { /* private mode */ }
};
try {
  const saved = localStorage.getItem('sameroom.theme');
  if (saved) document.documentElement.dataset.theme = saved;
} catch (err) { /* private mode */ }

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
/* Coming back to the tab after a while: re-check where you are before trusting
   the room you were in. */
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && (state.screen === 'room' || state.screen === 'gate')) syncRoom();
});

boot();
})(typeof globalThis !== 'undefined' ? globalThis : this);
