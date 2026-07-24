# MoodWave — mood → playlist, straight to Spotify

A single-file web app that turns a **mood** plus the **artists you love** into a
full playlist — and saves it straight to a real Spotify account. No build step,
no server, no backend. Everything lives in one `index.html`.

Built to be **sold**: it ships with a product landing page, three pricing tiers
wired into the app, and a demo mode so customers can try it before they connect
or pay.

## What it does

- **🎛 The Studio** — pick one or more moods (Hype, Heartbreak, Late Night,
  Workout, Focus, Romance, Party…), add any artists (tap a preset like Travis
  Scott / SZA / The Weeknd, or type your own), set the length and explicit
  filter, and hit **Generate**.
- **✨ Demo mode (default)** — works instantly with a built-in catalogue of
  popular artists, so anyone can see a real playlist with zero setup. Perfect
  for demos and the free tier.
- **🟢 Live Spotify mode** — once connected, MoodWave pulls each artist's real
  top tracks plus mood-matched search results, ranks them for the vibe, and can
  **create the playlist right in the user's Spotify account** — ready to press
  play.
- **💾 History** — Pro users keep every playlist they make, with one-tap
  "Open in Spotify".
- **📋 Copy anywhere** — export the tracklist as plain text for notes, socials,
  or another service.
- Light/dark theme, fully responsive, keyboard-friendly.

## How the "mood" works

Each mood is mapped to a target for **energy**, **positivity (valence)** and
**tempo**, plus genre and keyword cues. The engine scores every candidate track
against that target *and* against the artists you picked, caps how many songs
any single artist can contribute (so it never gets repetitive), then orders the
result to build or wind down to match the feeling.

## Connect Spotify (2-minute, one-time setup)

The app uses Spotify's official **PKCE OAuth** — client-side only, no secret, no
server. The user logs in on Spotify's own page; MoodWave never sees a password
and never touches the account until they tap **Save**.

1. Go to <https://developer.spotify.com/dashboard> → **Create app**.
2. Add the **Redirect URI** shown in the app's *Spotify setup* dialog
   (it's your exact page URL, e.g. `https://you.github.io/moodwave/`).
3. Enable **Web API**, save, copy the **Client ID**.
4. Paste it into *Spotify setup* → **Connect Spotify**.

> Spotify requires an `https` (or `127.0.0.1` loopback) redirect URI, so host it
> on GitHub Pages / Netlify / any static host. Opening the raw `file://` won't
> allow the Spotify login — but demo mode still works there.

## Selling it — going live

It's yours to rebrand and resell (single self-contained file):

- **Payments.** The pricing buttons and the *Unlock Pro* modal are stubs. Point
  them at your checkout (Stripe Payment Link, Gumroad, Yoco, Lemon Squeezy…).
  On a successful payment, set the plan to Pro:

  ```js
  state.plan = "pro"; save(); updatePlanUI();
  ```

  For real gating you'd verify the purchase server-side and store an unlock
  token; the client flag here is the illustrative version.
- **Branding.** Change the name, the `--brand`/`--pop` colours at the top of the
  `<style>`, the logo mark, and the copy. Add custom mood packs by editing the
  `MOODS` array.
- **Spotify app.** Ship your own Client ID (or keep asking each user for theirs).

## Run it

Just open `index.html` in a browser for demo mode. To host it, drop the file on
any static host — GitHub Pages, Netlify, Vercel, Cloudflare Pages.

## Data & privacy

- App state (moods, artists, plan, saved playlists) is stored only in the
  browser via `localStorage` (key `moodwave_v1`).
- Spotify tokens are stored separately (`moodwave_tok`) and can be wiped with
  **Disconnect**.
- Nothing is sent anywhere except Spotify's own API, and only when the user acts.
