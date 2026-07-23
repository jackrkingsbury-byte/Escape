# GROW — watch · do · grow

A tiny, private, single-file web app that pairs an **idea planner** with a
**15-year nutrient growth helper**. Everything lives in one `index.html` — no
build step, no account, no server. Your data stays in the browser
(localStorage).

## What it does

**📋 Planner** — Capture the videos you want to *watch* and the things you want
to *do* before they slip away. Each idea gets a type, category, priority,
optional link, and notes. Move it through *Idea → Planned → In progress → Done*,
and filter by type or status.

**🌱 15-Year Growth** — Pick a few things you want to grow (fitness, a language,
a fruit tree — anything). Each becomes a **growth area** rendered as a 15-year
grid. Every video watched or thing done is a **nutrient**: log it and it darkens
the current year's cell and moves you toward your target. Small inputs,
compounded over 15 years.

**The loop** — When you point an idea at a growth area and mark it done, GROW
automatically logs a nutrient for you. The planner and the tracker stay in sync,
so today's small action visibly feeds the long game.

## Run it

Just open `index.html` in any browser. To host it, drop the file on any static
host (Netlify, GitHub Pages, etc.).

## Data

- Stored only in this browser via `localStorage` (key `grow_v1`).
- **Export / Import** a `.json` backup or **Clear all** from the *About* tab.
- **Load example data** from the Planner tab to see it populated.
