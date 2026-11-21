/* WiFi Check: the logic, with no page code in it.
   index.html imports this file, and so do the tests in test/. */

/* ───────────────────────── MAC addresses ───────────────────────── */

/** Turn any MAC spelling into "AA:BB:CC:DD:EE:FF", or null if it isn't one.
 *  Handles a4-83-e7-.. (Windows), a4:83:e7:.. and a4:3:e7:.. (macOS drops
 *  leading zeros) and a483.e712.3456 (Cisco style). */
export function normMac(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase();
  let parts;
  if (/^[0-9a-f]{4}\.[0-9a-f]{4}\.[0-9a-f]{4}$/.test(s)) {
    parts = s.replace(/\./g, '').match(/../g);
  } else {
    parts = s.split(/[:-]/);
    if (parts.length !== 6 || parts.some((p) => !/^[0-9a-f]{1,2}$/.test(p))) return null;
    parts = parts.map((p) => p.padStart(2, '0'));
  }
  return parts.join(':').toUpperCase();
}

const firstOctet = (mac) => parseInt(mac.slice(0, 2), 16);

/** Phones, tablets and laptops hide their real address behind a made-up
 *  "private" one (iPhone, Android 10+, Windows 11, recent Macs). Those
 *  have the "locally administered" bit set: 2nd hex digit is 2, 6, A or E. */
export const isPrivateMac = (mac) => (firstOctet(mac) & 0x02) === 0x02;
export const isMulticastMac = (mac) => (firstOctet(mac) & 0x01) === 0x01;

/* ───────────────────────── IPv4 helpers ───────────────────────── */

const IP_RE = /\b(\d{1,3}(?:\.\d{1,3}){3})\b/;
const MAC_RE = /\b([0-9a-f]{1,2}(?:[:-][0-9a-f]{1,2}){5}|[0-9a-f]{4}\.[0-9a-f]{4}\.[0-9a-f]{4})\b/i;

export function validIp(ip) {
  const p = ip.split('.').map(Number);
  return p.length === 4 && p.every((n) => Number.isInteger(n) && n >= 0 && n <= 255);
}
/** Addresses that are never a real device on your WiFi. */
function skipIp(ip) {
  const p = ip.split('.').map(Number);
  if (p[0] === 0 || p[0] === 127) return true; // nothing / this machine
  if (p[0] >= 224) return true; // multicast + broadcast
  if (p[0] === 169 && p[1] === 254) return true; // self-assigned, not really on the network
  if (p[3] === 255 || p[3] === 0) return true; // subnet broadcast / network address
  return false;
}
const subnet24 = (ip) => ip.split('.').slice(0, 3).join('.');

/* ───────────────────────── parse a device list ───────────────────────── */

const NOT_A_NAME = new Set(['dynamic', 'static', 'reachable', 'stale', 'delay', 'probe', 'permanent', 'incomplete', 'ifscope', 'on', 'at', 'dev', 'lladdr', 'router']);

/** Read whatever the person pasted (our scan script, `arp -a` on Windows,
 *  macOS or Linux, or `ip neigh`) and return { gateway, devices }.
 *  devices: [{ ip, mac, name }] in IP order, one per address. */
export function parseNeighbors(text) {
  const lines = String(text || '').split(/\r?\n/);
  let gateway = null;
  const seen = new Map();

  for (const line of lines) {
    const gw = line.match(/^\s*GATEWAY\s+(\d{1,3}(?:\.\d{1,3}){3})\b/i) ||
      line.match(/Default Gateway[ .]*:\s*(\d{1,3}(?:\.\d{1,3}){3})\b/i);
    if (gw && validIp(gw[1])) { gateway = gw[1]; continue; }

    if (/incomplete/i.test(line)) continue;
    const ipM = line.match(IP_RE);
    const macM = line.match(MAC_RE);
    if (!ipM || !macM) continue;
    const ip = ipM[1];
    const mac = normMac(macM[1]);
    if (!mac || !validIp(ip) || skipIp(ip)) continue;
    if (mac === 'FF:FF:FF:FF:FF:FF' || mac === '00:00:00:00:00:00' || isMulticastMac(mac)) continue;

    let name = '';
    // macOS / Linux arp -a:  "johns-iphone.lan (192.168.1.23) at a4:83:e7:..."
    const named = line.match(/^\s*([^\s()]+)\s+\(\d{1,3}(?:\.\d{1,3}){3}\)\s+at\s/i);
    if (named && named[1] !== '?') name = named[1];
    // our Windows script:  "192.168.1.23 A4-83-E7-12-34-56 DESKTOP-AB12"
    if (!name) {
      const after = line.slice(line.indexOf(macM[1]) + macM[1].length).trim().split(/\s+/)[0] || '';
      if (after && !NOT_A_NAME.has(after.toLowerCase()) && !/^\[/.test(after) && !/^en\d|^eth|^wl|^bridge|^utun/i.test(after) && after !== ip) name = after;
    }
    name = name.replace(/\.$/, '');
    if (name === ip) name = '';

    const key = ip + '|' + mac;
    if (!seen.has(key)) seen.set(key, { ip, mac, name });
    else if (name && !seen.get(key).name) seen.get(key).name = name;
  }

  let devices = [...seen.values()];
  // A Windows arp -a also lists VPN and virtual adapters. If we know the
  // router, keep only the devices on the router's own network.
  if (gateway) {
    const net = subnet24(gateway);
    const local = devices.filter((d) => subnet24(d.ip) === net);
    if (local.length) devices = local;
  }
  devices.sort((a, b) => ipNum(a.ip) - ipNum(b.ip));
  if (!gateway) gateway = guessGateway(devices);
  return { gateway, devices };
}

const ipNum = (ip) => ip.split('.').reduce((n, p) => n * 256 + Number(p), 0);

/** Without a GATEWAY line, the router is nearly always .1 or .254. */
function guessGateway(devices) {
  const ones = devices.filter((d) => /\.1$/.test(d.ip));
  if (ones.length === 1) return ones[0].ip;
  const two54 = devices.filter((d) => /\.254$/.test(d.ip));
  if (!ones.length && two54.length === 1) return two54[0].ip;
  return null;
}

/* ───────────────────────── manufacturer lookup ───────────────────────── */

/** oui.txt holds one maker per line: "Apple|F0B479A483E7..." (6-hex prefixes
 *  run together). Returns a Map prefix → maker. */
export function parseOui(text) {
  const map = new Map();
  for (const line of String(text).split('\n')) {
    const bar = line.lastIndexOf('|');
    if (bar < 1) continue;
    const name = line.slice(0, bar);
    const hex = line.slice(bar + 1).trim();
    for (let i = 0; i + 6 <= hex.length; i += 6) map.set(hex.slice(i, i + 6), name);
  }
  return map;
}

export function lookupVendor(mac, table) {
  if (!mac || !table || isPrivateMac(mac)) return null;
  return table.get(mac.replace(/:/g, '').slice(0, 6)) || null;
}

/** IEEE names are often SHOUTED ("SAMSUNG ELECTRONICS"). Make them readable,
 *  but leave short or hyphenated tokens alone (LG, SKY UK, TP-LINK). */
export function prettyVendor(name) {
  if (!name || name !== name.toUpperCase()) return name;
  return name.replace(/\b[A-Z]{4,}\b/g, (w) => (/-/.test(w) ? w : w[0] + w.slice(1).toLowerCase()));
}

/* What kind of thing a maker usually means on a home network. Order matters:
   first match wins. */
const words = (...w) => new RegExp('\\b(?:' + w.map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'i');
const KINDS = [
  [words('sony interactive'), 'console', 'PlayStation'],
  [words('nintendo'), 'console', 'Nintendo Switch'],
  [words('valve'), 'console', 'Steam Deck'],
  [words('microsoft'), 'console', 'Xbox, Surface or Windows PC'],
  [words('apple'), 'phone', 'iPhone, iPad, Mac, Apple TV or HomePod'],
  [words('amazon', 'ring'), 'speaker', 'Echo, Fire TV, Kindle or Ring'],
  [words('google', 'nest labs'), 'speaker', 'Pixel, Nest speaker / camera or Chromecast'],
  [words('roku'), 'tv', 'Roku streaming stick or TV'],
  [words('sonos'), 'speaker', 'Sonos speaker'],
  [words('bose', 'harman', 'jbl', 'bang & olufsen', 'devialet'), 'speaker', 'Speaker or soundbar'],
  [words('samsung'), 'phone', 'Samsung phone, tablet or TV'],
  [words('lg electronics', 'lg innotek'), 'tv', 'LG TV, phone or appliance'],
  [words('tcl', 'hisense', 'vizio', 'panasonic', 'sharp', 'funai', 'tp vision', 'vestel', 'skyworth'), 'tv', 'Smart TV'],
  [words('espressif', 'tuya', 'shelly', 'allterco', 'meross', 'lifx', 'signify', 'philips lighting', 'wiz connected', 'govee', 'sengled', 'yeelight', 'lumi united', 'broadlink', 'sonoff', 'itead', 'wyze', 'ecobee', 'tado', 'netatmo', 'hive', 'ezviz', 'arlo', 'blink', 'eufy', 'anker', 'reolink', 'hikvision', 'dahua'), 'iot', 'Smart home gadget (plug, bulb, camera, doorbell…)'],
  [words('raspberry'), 'computer', 'Raspberry Pi'],
  [words('xiaomi', 'huawei', 'honor', 'oneplus', 'oppo', 'vivo mobile', 'motorola', 'realme', 'nothing technology', 'zte', 'fairphone', 'hmd global'), 'phone', 'Phone or tablet'],
  [words('garmin', 'fitbit', 'withings', 'polar'), 'iot', 'Watch or fitness gadget'],
  [words('hewlett', 'hp', 'canon', 'seiko epson', 'epson', 'brother', 'xerox', 'lexmark', 'kyocera'), 'printer', 'Printer (or an HP laptop)'],
  [words('intel', 'realtek', 'liteon', 'lite-on', 'azurewave', 'hon hai', 'foxconn', 'cloud network technology', 'qualcomm', 'mediatek', 'murata', 'universal global scientific', 'rivet networks', 'chicony', 'wistron', 'quanta', 'compal', 'pegatron', 'dell', 'lenovo', 'acer', 'asustek', 'micro-star', 'msi', 'gigabyte', 'framework computer'), 'computer', 'Laptop or PC'],
  [words('tp-link', 'netgear', 'arris', 'technicolor', 'sagemcom', 'askey', 'zyxel', 'ubiquiti', 'eero', 'linksys', 'belkin', 'd-link', 'commscope', 'sercomm', 'plume design', 'actiontec', 'arcadyan', 'humax', 'calix', 'vantiva', 'avm', 'draytek', 'mikrotik', 'cisco', 'juniper', 'ruckus', 'aruba', 'cambium', 'tenda', 'mercusys', 'cudy', 'gl technologies', 'nokia shanghai bell', 'nokia solutions', 'sky uk', 'british telecommunications', 'virgin media', 'deutsche telekom'), 'router', 'Router, mesh point or WiFi extender'],
  [words('nvidia'), 'tv', 'NVIDIA Shield or gaming PC'],
  [words('tesla'), 'iot', 'Tesla car or Powerwall'],
  [words('peloton'), 'iot', 'Peloton'],
  [words('dyson', 'miele', 'bosch', 'siemens', 'whirlpool', 'haier', 'irobot', 'roborock', 'ecovacs'), 'iot', 'Smart appliance or robot vacuum'],
];

/** { kind, guess } for a device, from its maker and whether its address is private. */
export function deviceKind(mac, vendor) {
  if (mac && isPrivateMac(mac)) {
    return { kind: 'phone', guess: 'Phone, tablet or laptop with a private address' };
  }
  if (vendor) {
    for (const [re, kind, guess] of KINDS) if (re.test(vendor)) return { kind, guess };
    return { kind: 'unknown', guess: 'Made by ' + vendor };
  }
  return { kind: 'unknown', guess: 'Unknown maker' };
}

/* ───────────────────────── speed: what it means ───────────────────────── */

/** Lag added when the connection is busy (ms). Big number = "bufferbloat":
 *  games and calls stutter whenever someone else downloads or streams. */
export function busyLag(t) {
  if (t.loadedPing == null || t.ping == null) return null;
  return Math.max(0, t.loadedPing - t.ping);
}

/** One line per everyday activity: good / ok / bad. */
export function activities(t) {
  const lag = busyLag(t) ?? 0;
  const grade = (good, ok) => (good ? 'good' : ok ? 'ok' : 'bad');
  const out = [
    { id: 'hd', label: 'HD streaming (YouTube, Netflix)', rating: grade(t.down >= 8, t.down >= 4),
      note: t.down >= 8 ? `about ${Math.floor(t.down / 5)} HD streams at once` : 'may buffer or drop to low quality' },
    { id: '4k', label: '4K streaming', rating: grade(t.down >= 25, t.down >= 15),
      note: t.down >= 15 ? `about ${Math.max(1, Math.floor(t.down / 20))} at a time` : 'needs 15–25 Mbps per screen' },
    { id: 'game', label: 'Online gaming', rating: grade(t.ping < 50 && lag < 60 && t.jitter < 20, t.ping < 100 && lag < 150 && t.jitter < 40),
      note: t.ping < 50 && lag < 60 ? 'low ping, smooth' : lag >= 60 ? 'lag spikes when others use the WiFi' : 'ping is on the high side' },
    { id: 'call', label: 'Video calls (FaceTime, Zoom, Discord)', rating: grade(t.up >= 3 && t.down >= 3 && t.jitter < 30, t.up >= 1.5 && t.down >= 1.5),
      note: t.up < 3 ? 'upload is the weak spot' : t.jitter >= 30 ? 'unsteady, may freeze' : 'should be clear' },
    { id: 'upload', label: 'Uploading videos / streaming on Twitch', rating: grade(t.up >= 10, t.up >= 5),
      note: `a 1 GB video takes ${duration((8e9) / (t.up * 1e6))}` },
  ];
  return out;
}

/** "2 h 13 min" style. */
export function duration(seconds) {
  if (!isFinite(seconds) || seconds <= 0) return '—';
  if (seconds < 90) return `${Math.max(1, Math.round(seconds))} sec`;
  const m = Math.round(seconds / 60);
  if (m < 90) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${m % 60} min`;
}

/** How long a download of `gb` gigabytes takes at `mbps`. */
export const downloadTime = (gb, mbps) => duration((gb * 8e9) / (mbps * 1e6));

/* ───────────────────────── diagnosis ───────────────────────── */

/* Every fix the page can recommend. The page shows the title, why and how. */
export const FIXES = {
  restart: { title: 'Restart your router', mins: 5 },
  hogs: { title: 'Find what’s hogging the WiFi', mins: 5 },
  move: { title: 'Move the router somewhere better', mins: 10 },
  band: { title: 'Use the 5 GHz WiFi when you’re close', mins: 2 },
  cable: { title: 'Plug in a cable for the console, PC or TV', mins: 5 },
  mesh: { title: 'Add mesh WiFi for rooms it doesn’t reach', mins: 30 },
  channel: { title: 'Change the WiFi channel', mins: 5 },
  qos: { title: 'Turn on QoS / gaming mode to stop lag spikes', mins: 5 },
  device: { title: 'Fix the slow device itself', mins: 5 },
  update: { title: 'Update the router', mins: 10 },
  isp: { title: 'Call your provider, with proof', mins: 20 },
  password: { title: 'Change the WiFi password', mins: 10 },
};

/** Look at the speed tests and say what's wrong and what to do first.
 *  tests: newest last. Each: { down, up, ping, jitter, loadedPing, near, room, t }.
 *  Returns { tone: good|ok|bad|info, headline, detail, fixes: [ids], findings: [text] }. */
export function diagnose(tests, planMbps) {
  const list = (tests || []).filter((t) => t && isFinite(t.down));
  if (!list.length) {
    return { tone: 'info', headline: 'Run a test to see what’s going on', detail: 'It takes about 30 seconds.', fixes: ['restart', 'move', 'band', 'hogs'], findings: [] };
  }
  const latest = list[list.length - 1];
  const near = [...list].reverse().find((t) => t.near);
  const plan = planMbps > 0 ? planMbps : null;
  const lag = busyLag(latest) ?? 0;
  const findings = [];
  const fixes = [];
  const add = (...ids) => ids.forEach((id) => { if (!fixes.includes(id)) fixes.push(id); });
  let tone = 'good';
  let headline = '';
  let detail = '';
  const fmt = (n) => fmtMbps(n) + ' Mbps';

  // 1. Where is the problem: the internet line, or the WiFi signal?
  if (near && plan && near.down < plan * 0.5) {
    tone = 'bad';
    headline = 'Slow even right next to the router';
    detail = `Next to the router you got ${fmt(near.down)} on a ${fmt(plan)} plan. That points at the router or your provider, not at WiFi range.`;
    findings.push('Speed next to the router is less than half of what you pay for.');
    add('restart', 'hogs', 'update', 'isp');
  } else if (near && !latest.near && latest.down < near.down * 0.5) {
    tone = 'bad';
    headline = `Your internet is fine. The WiFi just doesn’t reach ${latest.room ? 'the ' + latest.room.toLowerCase().replace(/^the /, '') : 'this spot'} well`;
    detail = `${fmt(near.down)} next to the router, only ${fmt(latest.down)} here. The signal is fading before it gets to you.`;
    findings.push('Speed drops by more than half away from the router: weak signal, not a slow line.');
    add('move', 'band', 'mesh', 'channel');
  } else if (plan && latest.down < plan * 0.5) {
    tone = 'bad';
    headline = `Getting ${fmt(latest.down)} on a ${fmt(plan)} plan`;
    detail = 'That’s less than half your plan. Run one more test standing next to the router: it tells you whether the WiFi signal or the line itself is the problem.';
    findings.push('Less than half your plan speed.');
    add('restart', 'move', 'band', 'hogs');
  } else if (latest.down < 10) {
    tone = 'bad';
    headline = 'This connection is slow';
    detail = near ? 'Even near the router it’s slow. Restart the router, then check for devices hogging it.' : 'Test again next to the router to see if it’s the signal or the line.';
    findings.push('Under 10 Mbps download.');
    add('restart', 'hogs', near ? 'isp' : 'move', 'band');
  }

  // 2. Lag: idle ping, jitter and "busy lag" (bufferbloat).
  if (lag >= 100) {
    if (tone === 'good') { tone = 'bad'; headline = 'Big lag spikes when the WiFi is busy'; detail = `Ping jumps from ${Math.round(latest.ping)} ms to ${Math.round(latest.loadedPing)} ms when something downloads. That’s what makes games rubber-band and calls freeze.`; }
    findings.push(`Ping rises by ${Math.round(lag)} ms under load (bufferbloat).`);
    add('qos', 'hogs', 'cable');
  } else if (lag >= 40) {
    if (tone === 'good') { tone = 'ok'; headline = 'Some lag when the WiFi is busy'; detail = `Ping goes up by ${Math.round(lag)} ms while downloading. Fine for streaming, noticeable in fast games.`; }
    findings.push(`Ping rises by ${Math.round(lag)} ms under load.`);
    add('qos', 'cable');
  }
  if (latest.ping >= 80) {
    if (tone === 'good') { tone = 'ok'; headline = 'High ping'; detail = `${Math.round(latest.ping)} ms even when nothing else is going on. Fine for streaming, sluggish for gaming.`; }
    findings.push(`Idle ping ${Math.round(latest.ping)} ms.`);
    add('cable', 'restart', 'band');
  }
  if (latest.jitter >= 30) {
    if (tone === 'good') { tone = 'ok'; headline = 'The connection is unsteady'; detail = `Ping swings by about ${Math.round(latest.jitter)} ms. Usually interference or a weak signal.`; }
    findings.push(`Jitter ${Math.round(latest.jitter)} ms: the signal is unsteady.`);
    add('band', 'channel', 'move');
  }
  if (latest.up < 3) {
    if (tone === 'good') { tone = 'ok'; headline = 'Upload is slow'; detail = `${fmt(latest.up)} up. Video calls and sending videos will struggle.`; }
    findings.push(`Upload only ${fmt(latest.up)}.`);
    add('hogs', 'band');
  }

  if (tone === 'good') {
    headline = latest.down >= 100 ? 'Your WiFi is fast here' : 'Your WiFi is in decent shape here';
    detail = `${fmt(latest.down)} down, ${fmt(latest.up)} up, ${Math.round(latest.ping)} ms ping.` +
      (near || latest.near ? '' : ' Test in the rooms where it feels slow, and once next to the router, to compare.');
    add('band', 'cable', 'update');
  }
  if (!near && !latest.near && tone !== 'good') findings.push('Tip: run one test right next to the router so the app can tell signal problems from line problems.');
  add('restart', 'device');
  return { tone, headline, detail, fixes, findings };
}

export function fmtMbps(n) {
  if (n == null || !isFinite(n)) return '—';
  if (n >= 100) return String(Math.round(n));
  if (n >= 10) return n.toFixed(1).replace(/\.0$/, '');
  return n.toFixed(2).replace(/0$/, '').replace(/\.0$/, '');
}
