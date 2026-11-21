/* WiFi Check logic tests. Run: node wifi/test/lib.test.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  normMac, isPrivateMac, parseNeighbors, parseOui, lookupVendor, deviceKind,
  prettyVendor, activities, diagnose, busyLag, duration, downloadTime, fmtMbps,
} from '../lib.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
let failures = 0;
const ok = (c, m, extra = '') => {
  console.log(`${c ? 'PASS' : 'FAIL'}  ${m}${extra !== '' ? '  ← ' + extra : ''}`);
  if (!c) failures++;
};
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), m, JSON.stringify(a));

console.log('── MAC addresses ──');
eq(normMac('a4-83-e7-12-34-56'), 'A4:83:E7:12:34:56', 'Windows dashes');
eq(normMac('a4:83:e7:2:4:5'), 'A4:83:E7:02:04:05', 'macOS drops leading zeros');
eq(normMac('a483.e712.3456'), 'A4:83:E7:12:34:56', 'Cisco dots');
eq(normMac('nope'), null, 'junk is null');
eq(normMac('a4:83:e7:12:34'), null, 'five octets is null');
ok(isPrivateMac('DA:A1:19:00:00:01'), 'DA:… is a private (randomised) address');
ok(isPrivateMac('06:00:00:00:00:00') && isPrivateMac('0A:00:00:00:00:00') && isPrivateMac('0E:00:00:00:00:00'), '2/6/A/E second digit = private');
ok(!isPrivateMac('A4:83:E7:12:34:56'), 'A4:… is a real maker address');

console.log('── parse: our Windows script ──');
const win = `GATEWAY 192.168.1.1
192.168.1.1 30-B5-C2-11-22-33 router.home
192.168.1.23 A4-83-E7-12-34-56 Jacks-iPhone
192.168.1.40 DA-A1-19-AA-BB-CC
192.168.1.52 24-A1-60-01-02-03 192.168.1.52
`;
let r = parseNeighbors(win);
eq(r.gateway, '192.168.1.1', 'gateway from GATEWAY line');
eq(r.devices.length, 4, 'four devices');
eq(r.devices[1], { ip: '192.168.1.23', mac: 'A4:83:E7:12:34:56', name: 'Jacks-iPhone' }, 'name after MAC');
eq(r.devices[2].name, '', 'no name → empty');
eq(r.devices[3].name, '', 'name that is just the IP is dropped');

console.log('── parse: Windows arp -a ──');
const winArp = `
Interface: 192.168.0.14 --- 0x7
  Internet Address      Physical Address      Type
  192.168.0.1           c8-3a-35-aa-bb-cc     dynamic
  192.168.0.25          f0-b4-79-01-02-03     dynamic
  192.168.0.255         ff-ff-ff-ff-ff-ff     static
  224.0.0.22            01-00-5e-00-00-16     static
  239.255.255.250       01-00-5e-7f-ff-fa     static
  255.255.255.255       ff-ff-ff-ff-ff-ff     static

Interface: 172.29.96.1 --- 0x2c
  Internet Address      Physical Address      Type
  172.29.111.255        ff-ff-ff-ff-ff-ff     static
`;
r = parseNeighbors(winArp);
eq(r.devices.map((d) => d.ip), ['192.168.0.1', '192.168.0.25'], 'broadcast, multicast and virtual adapters skipped');
eq(r.devices[0].name, '', '"dynamic" is not a name');
eq(r.gateway, '192.168.0.1', 'gateway guessed as the .1');

console.log('── parse: macOS arp -a ──');
const mac = `GATEWAY 10.0.0.1
? (10.0.0.1) at 8:3a:88:1:2:3 on en0 ifscope [ethernet]
johns-macbook.lan (10.0.0.12) at 3c:22:fb:aa:bb:cc on en0 ifscope [ethernet]
? (10.0.0.30) at (incomplete) on en0 ifscope [ethernet]
? (10.0.0.44) at 7c:bb:8a:1:2:3 on en0 ifscope [ethernet]
? (224.0.0.251) at 1:0:5e:0:0:fb on en0 ifscope permanent [ethernet]
? (10.0.0.255) at ff:ff:ff:ff:ff:ff on en0 ifscope [ethernet]
`;
r = parseNeighbors(mac);
eq(r.devices.map((d) => d.ip), ['10.0.0.1', '10.0.0.12', '10.0.0.44'], 'incomplete, multicast and broadcast skipped');
eq(r.devices[0].mac, '08:3A:88:01:02:03', 'zero-padded');
eq(r.devices[1].name, 'johns-macbook.lan', 'hostname before the brackets');
eq(r.devices[2].name, '', '"?" is not a name');

console.log('── parse: Linux ip neigh ──');
r = parseNeighbors(`192.168.50.1 dev wlan0 lladdr 04:d9:f5:11:22:33 REACHABLE
192.168.50.77 dev wlan0 lladdr b8:27:eb:44:55:66 STALE
192.168.50.80 dev wlan0  FAILED`);
eq(r.devices.length, 2, 'two neighbours, FAILED skipped');
eq(r.devices[0].name, '', 'REACHABLE is not a name');
eq(r.devices[1].name, '', 'STALE is not a name');

console.log('── parse: odd input ──');
eq(parseNeighbors('').devices, [], 'empty text');
eq(parseNeighbors('hello\nworld').devices, [], 'no addresses');
r = parseNeighbors('192.168.1.5 a4-83-e7-12-34-56 x\n192.168.1.5 a4-83-e7-12-34-56');
eq(r.devices.length, 1, 'duplicates merged');
r = parseNeighbors('   Default Gateway . . . . . . . . . : 192.168.8.1\n192.168.8.1 00-11-22-33-44-55 dynamic\n192.168.8.9 00-11-22-33-44-66 dynamic');
eq(r.gateway, '192.168.8.1', 'gateway from ipconfig text');

console.log('── maker lookup ──');
const oui = parseOui(fs.readFileSync(path.join(dir, '..', 'oui.txt'), 'utf8'));
ok(oui.size > 30000, 'OUI table loads', oui.size);
eq(lookupVendor('F0:B4:79:00:00:00', oui), 'Apple', 'Apple prefix');
eq(lookupVendor('B8:27:EB:00:00:00', oui), 'Raspberry Pi Foundation', 'Raspberry Pi prefix');
eq(lookupVendor('DA:A1:19:00:00:00', oui), null, 'private address has no maker');
eq(deviceKind('7C:BB:8A:00:00:00', lookupVendor('7C:BB:8A:00:00:00', oui)).kind, 'console', 'Nintendo → console');
eq(deviceKind('24:A1:60:00:00:00', lookupVendor('24:A1:60:00:00:00', oui)).kind, 'iot', 'Espressif → smart home gadget');
eq(deviceKind('DA:A1:19:00:00:00', null).kind, 'phone', 'private address → phone/laptop');
eq(deviceKind('00:00:00:00:00:01', 'XYZ Engineering').kind, 'unknown', '"Engineering" does not match "ring"');
eq(deviceKind('00:00:00:00:00:01', 'Intelligent Widgets').kind, 'unknown', '"Intelligent" does not match "Intel"');
eq(prettyVendor('SAMSUNG ELECTRONICS'), 'Samsung Electronics', 'shouty names made readable');
eq(prettyVendor('Apple'), 'Apple', 'normal names untouched');

console.log('── what the speed means ──');
const fast = { down: 300, up: 40, ping: 12, jitter: 2, loadedPing: 25 };
const slow = { down: 3, up: 0.8, ping: 90, jitter: 45, loadedPing: 400 };
ok(activities(fast).every((a) => a.rating === 'good'), 'fast line: everything good');
ok(activities(slow).every((a) => a.rating === 'bad'), 'slow line: everything bad');
eq(busyLag(fast), 13, 'busy lag = loaded − idle');
eq(busyLag({ ping: 10 }), null, 'busy lag needs both numbers');
eq(duration(30), '30 sec', 'seconds');
eq(duration(600), '10 min', 'minutes');
eq(duration(8000), '2 h 13 min', 'hours');
eq(downloadTime(100, 100), '2 h 13 min', '100 GB at 100 Mbps');
eq(fmtMbps(312.4), '312', 'big numbers rounded');
eq(fmtMbps(48.25), '48.3', 'mid numbers 1 dp');
eq(fmtMbps(4.5), '4.5', 'small numbers');

console.log('── diagnosis ──');
let d = diagnose([], 0);
eq(d.tone, 'info', 'no tests → prompt to run one');
d = diagnose([{ ...fast, near: false, room: 'Bedroom' }], 0);
eq(d.tone, 'good', 'fast test → good');
d = diagnose([{ ...fast, near: true }, { down: 40, up: 10, ping: 25, jitter: 5, loadedPing: 40, near: false, room: 'Bedroom' }], 300);
eq(d.tone, 'bad', 'far room much slower → bad');
ok(/doesn.t reach the bedroom/i.test(d.headline), 'blames the signal, names the room', d.headline);
eq(d.fixes.slice(0, 3), ['move', 'band', 'mesh'], 'signal fixes first');
d = diagnose([{ down: 60, up: 10, ping: 20, jitter: 3, loadedPing: 30, near: true }], 500);
ok(/next to the router/i.test(d.headline), 'slow next to router → line/router problem', d.headline);
ok(d.fixes.includes('isp') && d.fixes[0] === 'restart', 'restart first, provider in the list');
d = diagnose([{ down: 200, up: 20, ping: 15, jitter: 3, loadedPing: 260, near: true }], 0);
ok(/lag spikes/i.test(d.headline), 'bufferbloat named', d.headline);
eq(d.fixes[0], 'qos', 'QoS first for bufferbloat');
d = diagnose([{ down: 80, up: 20, ping: 20, jitter: 3, loadedPing: 30, near: false, room: 'Kitchen' }], 500);
ok(d.findings.some((f) => /next to the router/.test(f)), 'asks for a next-to-router test when unsure');

console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
