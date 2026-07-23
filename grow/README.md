# GROW — watch · do · grow

A tiny, private, single-file web app that pairs an **idea planner** with a
**15-year nutrient growth helper**. Everything lives in one `index.html` — no
build step, no account, no server. Your data stays in the browser
(localStorage).

## What it does

**◎ Dashboard** — The whole loop at a glance: momentum stats, a quick-add box,
your **Next up** queue (ordered by priority + due date), a **Due & overdue**
list, and a **growth snapshot** with a pace badge per area.

**📋 Planner** — Capture the videos you want to *watch* and the things you want
to *do* before they slip away. Each idea gets a type, category, priority, due
date, link, and notes. Work it through *Idea → Planned → In progress → Done* as
a **list** or a **drag-and-drop Kanban board**. Live **search**, multiple
**sort** orders, **edit** any idea, and **undo** on delete. Finish a video and
GROW asks for a quick **star rating + one takeaway**.

**🌱 15-Year Growth** — Pick a few things you want to grow (fitness, a language,
a fruit tree — anything). Each becomes a **growth area** with:
- a 15-year heatmap grid (one cell per year, shaded by nutrients logged);
- a live **cumulative SVG chart** against your target line;
- a **pace projection** — ahead / on track / behind, with an ETA year;
- a milestone progress bar and a prunable **nutrient log**.

Every video watched or thing done is a **nutrient**: small inputs, compounded
over 15 years.

**The loop** — When you point an idea at a growth area and mark it done, GROW
automatically logs a nutrient for you. Planner and tracker stay in sync, so
today's small action visibly feeds the long game.

## Keyboard shortcuts

<kbd>/</kbd> search · <kbd>N</kbd> new idea · <kbd>1</kbd>–<kbd>4</kbd> switch
tabs · <kbd>Esc</kbd> close dialog.

## Run it

Just open `index.html` in any browser. To host it, drop the file on any static
host (Netlify, GitHub Pages, etc.).

## Data

- Stored only in this browser via `localStorage` (key `grow_v1`).
- **Export / Import** a `.json` backup or **Clear all** from the *About* tab.
- **Load example data** from the Planner tab to see it populated.
