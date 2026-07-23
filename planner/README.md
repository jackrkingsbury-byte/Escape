# 🌱 Grove — Watch, Do & Grow

A single-file web app (`index.html`, no build step) that combines two things:

### 📺 Watch & Do — an idea planner
Queue up videos you want to watch and things you want to do. Each item can have
an optional link and note. Filter by *to watch / to do / done*, check things off,
and delete what you no longer want.

### 🌳 15-Year Nutrient Growth helper
A long-haul habit tracker. Each day you log up to five "nutrients"
(water, sunlight, real food, rest, mind). Every logged day feeds a tree that
grows through 8 stages across a **15-year** timeline — sprout → seedling →
young shoot → potted plant → tree → evergreen → grove → landmark.

Tracks:
- **Day streak** 🔥 and **days fed** 🌿
- **Growth points** ✨ (one per nutrient logged)
- **Days remaining** in the 15-year run 📅
- A **12-month heatmap** of your activity

## Using it
Just open `planner/index.html` in a browser. Everything is saved locally in the
browser (`localStorage`) under the key `grove.v1` — no account, no server.
Dark mode toggle in the top-right. "Reset the 15-year clock" restarts the grove
without touching your watch & do list.
