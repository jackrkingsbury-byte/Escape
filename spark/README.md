# SPARK — feel off? spark yourself back.

A tiny, private, single-file web app for the moment you feel **drained, foggy,
wired, or can't start**. Tell SPARK how you feel and it matches you to a booster
**proven in real, peer-reviewed research** — then walks you through it live, from
a 30-second reset to a 20-minute recharge. Everything lives in one `index.html`:
no build step, no account, no server. Your data stays in the browser
(localStorage).

## What it does

**⚡ Boost** — Pick how you feel right now (drained · foggy · wired but tired ·
can't start · afternoon crash · stressed) and SPARK surfaces the boosters most
likely to help, top pick first. It's time-of-day aware ("this is the classic
2–4pm dip"), and if you can't even decide, **Just spark me** or **Surprise me**
drops you straight into a session.

**🗂 Boosters** — The full toolkit of 12 boosters. Filter by what you need
(energy · focus · calm) and how long you've got (≤1 / ≤5 / ≤20 min). Tap any
card to start — the study behind it travels with it.

**🔬 Research** — The evidence base. Every booster is here because a real study
found it moves energy, focus or calm. Each entry gives the finding, a plain-
English "what it means for you," the full citation, and a link to read the
original paper. Effects are presented honestly — reliable nudges, not miracles.

**📈 Track** — Research tells you what works *on average*; this tells you what
works for *you*. Every finished session logs a one-tap "did it help?", building
a personal ranking of your best boosters, a lift-rate, and a day streak.

## The boosters (and the research behind them)

| Booster | Helps with | Study |
|---|---|---|
| Physiological sigh | stress, wired, fog | Balban et al. 2023, *Cell Reports Medicine* |
| Box breathing | stress, wired | Balban et al. 2023, *Cell Reports Medicine* |
| Stair / movement snack | tired, crash | Randolph & O'Connor 2017, *Physiology & Behavior* |
| The 10-minute walk | tired, tension | Thayer 1987, *J. Personality & Social Psychology* |
| Nature reset | fog, focus | Berman, Jonides & Kaplan 2008, *Psychological Science* |
| 10-minute power nap | tired, crash | Brooks & Lack 2006, *Sleep* |
| Caffeine nap | deep slump | Reyner & Horne 1997, *Psychophysiology* |
| Hydrate now | fog, fatigue | Armstrong, Ganio et al. 2012, *J. Nutrition* |
| Focus sprint | can't start | Ariga & Lleras 2011, *Cognition* |
| Chew gum | dull task, focus | Smith 2010, *Nutritional Neuroscience* |
| Bright light hit | fatigue, dim room | Smolders & de Kort 2013, *J. Environmental Psychology* |
| Cold splash | slump, post-lunch | Hayashi et al. 2003, *Clinical Neurophysiology* |

Full citations and source links live inside the **Research** tab.

## Guided sessions

- **Breathing** boosters (sigh, box) animate a live orb — inhale as it grows,
  exhale as it shrinks — with soft audio cues and a countdown.
- **Timer** boosters (movement, walk, nature, nap, caffeine nap, light, focus
  sprint) run a progress ring with timed on-screen prompts ("halfway — stand
  tall", "10-sec reset: restate your goal").
- **Action** boosters (hydrate, gum, cold splash) show the steps and a single
  confirm — cold splash includes a short "brace" countdown.

Every session ends with a one-tap "How do you feel now?" that feeds your Track
history.

## Keyboard shortcuts

<kbd>1</kbd>–<kbd>4</kbd> switch tabs · <kbd>Esc</kbd> close a session.

## Run it

Just open `index.html` in any browser. To host it, drop the file on any static
host (GitHub Pages, Netlify, etc.).

## Data & privacy

- Stored only in this browser via `localStorage` (key `spark_v1`) — your
  session log, sound preference and theme. Nothing leaves your device.
- **Clear log** from the Track tab wipes your history.

## Not medical advice

SPARK offers general, research-informed self-care nudges. The studies behind it
are mostly small, short-term lab studies, and people vary. Persistent fatigue,
brain fog or low mood deserves a healthcare professional — not a breathing app.
