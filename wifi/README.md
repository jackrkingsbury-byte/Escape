# WiFi Check: test it, see who's on it, make it faster

A web page that works on a phone or a computer. It tests your WiFi speed room by room, lists
every device on your network, and puts the fixes that match your problem in order. It has no
account, no server and no build step. Results stay in your browser.

Live (once merged to `main`): `https://<user>.github.io/Escape/wifi/`

## The three tabs

**Speed.** Press **Run speed test**. In about 30 seconds you get download, upload, ping, jitter
and **busy lag**: how much your ping goes up while something is downloading. Busy lag is what
makes games rubber-band and calls freeze when someone else is streaming. You also see what the
speed is good for (HD and 4K streaming, gaming, calls, uploads) and how long a 100 GB game takes
to download.

Tell it where you are (*Next to the router* or a room name) and, if you like, your plan's speed.
Test once next to the router and once where it feels slow. The page compares the two:

| What it sees | What it tells you |
|---|---|
| Fast next to the router, slow in the bedroom | The internet is fine and the WiFi signal doesn't reach. Move the router, use 5 GHz, add mesh. |
| Slow even next to the router (under half your plan) | The router or your provider is the problem. Restart, find the hogs, update, then call them. |
| Ping jumps a lot under load | Bufferbloat. Turn on QoS / gaming mode, or use a cable for the console. |

**Who's on it.** A web page isn't allowed to scan your home network, so there are two routes:

1. **Your router's app or page.** Pick your provider or router brand (BT/EE, Sky, Virgin Media,
   Xfinity, Spectrum, Verizon, AT&T, T-Mobile, Google Nest, eero, TP-Link, Netgear, ASUS,
   Linksys, or *Other*) for exact steps and a button that opens the router page.
2. **A scan from a laptop.** Copy the script for Windows (PowerShell) or Mac (Terminal), paste it,
   press Enter. It pings every address on the router's network, prints the device list, and copies
   it to the clipboard. Then press **Paste from clipboard**. The script only reads; it installs
   and changes nothing. Plain `arp -a` output from Windows, Mac or Linux works too.

Every device gets a maker (from the IEEE MAC list in `oui.txt`) and a best guess, like "Nintendo
Switch", "Smart home gadget", or "Phone, tablet or laptop with a private address". Name each one,
mark it **Mine** or **Don't know it**, and the next scan flags anything **New**. Names and marks
are saved in the browser.

**Make it faster.** Twelve fixes (restart, hogs, router placement, 5 GHz, cable, mesh, channel,
QoS, the device itself, firmware, calling your provider, new password). The ones that match your
last test come first. Tick them off as you go. The "call your provider" fix fills in a script with
your real numbers.

## Privacy

- The speed test talks to Cloudflare's speed servers (`speed.cloudflare.com`). The engine's
  result logging to Cloudflare is turned off (`logAimApiUrl: null`).
- The device list is parsed in the page and never sent anywhere. `oui.txt` (the maker list) is
  downloaded from this site the first time you look at devices.
- Fonts come from Google Fonts, like the other Escape pages.

## Files

| File | What |
|---|---|
| `index.html` | The page: layout, speed test wiring, router guides, scan scripts, fix texts. |
| `lib.js` | The logic, with no page code in it: parsing device lists, MAC → maker → kind, speed verdicts, diagnosis. |
| `oui.txt` | MAC prefix → maker, from the IEEE list (about 280 KB gzipped). Only loaded on the devices tab. |
| `vendor/speedtest.js` | [`@cloudflare/speedtest`](https://github.com/cloudflare/speedtest) 1.17.0, MIT, unmodified. |
| `tools/build-oui.mjs` | Rebuilds `oui.txt` from the [`oui-data`](https://www.npmjs.com/package/oui-data) package. |
| `test/lib.test.mjs` | Logic tests: every paste format, maker lookup, verdicts, diagnosis. |
| `test/page.test.mjs` | Drives the real page in Chromium. A local mock stands in for Cloudflare at about 200 Mbps, so the real engine runs a full test. |

## Run it locally

ES modules don't load from `file://`, so serve the folder:

```sh
cd wifi && python3 -m http.server 8000   # then open http://localhost:8000
```

Tests:

```sh
node wifi/test/lib.test.mjs
node wifi/test/page.test.mjs            # SHOTS=/some/dir to save screenshots
```

Refresh the maker list:

```sh
npm pack oui-data && tar xzf oui-data-*.tgz
node wifi/tools/build-oui.mjs package/index.json
```

## Limits

- It can't change router settings for you. It tells you exactly where each setting lives.
- The scan sees devices that are awake. Phones asleep in a pocket may only show up on a second
  run, and the computer running the scan doesn't list itself.
- Phones with a private address may get a new one now and then, so they can show up as "new".
- The scan assumes a normal home network (a /24 subnet, such as 192.168.1.x).
