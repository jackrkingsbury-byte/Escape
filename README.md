# Storm Isle: Last Survivor

A Roblox survival battle-royale where 2–30 players parachute onto a tropical island, scavenge loot, craft weapons, and fight to be the **last one alive** as a deadly storm closes in.

---

## Why people will click

| Hook | Mechanic |
|---|---|
| **Survival + BR** | Two proven genres combined — shrinking storm forces constant action |
| **Crafting tension** | Do you build a wall or a sword? Risk/reward decisions every 30 seconds |
| **Visual threat** | Neon purple storm wall is always visible — constant urgency |
| **Quick rounds** | ~5–10 min matches, instant requeue — optimised for watch-time |

---

## Monetisation (Robux Revenue)

| Product | Price | What it does |
|---|---|---|
| **VIP Pass** | 399 R$ | 2× coins every match, +30 HP, gold name tag, exclusive lobby area |
| **Starter Pack** | 149 R$ | Sword + Medkit pre-loaded at game start |
| **Lucky Chest** | 49 R$ | Random skin drop (Rare → Legendary) with consolation coins |
| **Coin Boost** | 79 R$ | 3× coin earn for 1 hour |
| **Skin Shop** | 300–1200 coins | 6 cosmetic skins purchasable with in-game coins (earned by playing) |

> Prices and IDs are set in **Roblox Creator Hub** — update `GameConfig.MONETIZATION` with your real IDs.

---

## Project structure

```
StormIsle/
├── default.project.json        ← Rojo project (sync to Studio)
└── src/
    ├── server/
    │   ├── GameManager.server.lua       State machine: lobby→countdown→playing→ended
    │   ├── PlayerManager.server.lua     DataStore persistence (coins, skins, stats)
    │   ├── MonetizationService.server.lua  Game passes + developer products
    │   ├── StormManager.server.lua      Safe-zone shrink + hunger drain
    │   ├── CombatSystem.server.lua      Melee/ranged damage, crafting handler
    │   └── ResourceSpawner.server.lua   Scatter 120 nodes + 20 loot chests on island
    ├── shared/
    │   ├── GameConfig.lua               All tunable constants (one place to balance)
    │   └── ItemData.lua                 Item/weapon/structure definitions
    └── client/
        ├── HUD.client.lua               HP/hunger bars, coin counter, toast notifs
        ├── CraftingGui.client.lua       [C] key crafting menu
        └── ShopGui.client.lua           [P] key Robux shop + skin browser
```

---

## Setup (5 steps)

### 1. Install Rojo
Download from https://rojo.space and install the Roblox Studio plugin.

### 2. Clone and sync
```bash
git clone <this-repo>
cd StormIsle
rojo serve
```
Open Roblox Studio → Rojo plugin → Connect to localhost:34872.

### 3. Build the island map
In Studio, under **Workspace**, create:
- A large flat `Part` (terrain) at Y=0, ~1200×1200 studs, named `IslandBase`
- A `SpawnLocation` at the island center for lobby
- (Optional) Palm trees, rocks, huts as decorative models — the code spawns functional nodes on top automatically

### 4. Register monetisation IDs
1. Go to [Creator Hub](https://create.roblox.com) → your game → **Monetisation**
2. Create the 4 products listed above
3. Copy the IDs into `src/shared/GameConfig.lua` under `MONETIZATION`:

```lua
PASS_VIP_ID            = 123456789,   -- your real IDs
PASS_STARTER_PACK_ID   = 987654321,
PRODUCT_LUCKY_CHEST_ID = 111111111,
PRODUCT_COIN_BOOST_ID  = 222222222,
```

### 5. Publish and test
Publish to Roblox, enable **Team Test** with 2+ players, verify:
- [ ] Lobby countdown fires at 2+ players
- [ ] Storm visual appears at 90s
- [ ] Killing a player fires kill-coin reward
- [ ] Lucky Chest purchase triggers skin roll
- [ ] DataStore saves coins between sessions

---

## Controls (players)

| Key | Action |
|---|---|
| `E` / walk into node | Harvest resource |
| `C` | Open crafting menu |
| `P` | Open shop |
| Click tool | Attack / place structure |

---

## Tuning knobs (all in `GameConfig.lua`)

- `TIMING.STORM_DELAY` — how long before storm starts (default 90s)
- `MAP.SHRINK_PER_TICK` — how fast storm closes in (default 4 studs/tick)
- `PLAYER.HUNGER_DRAIN` — starvation speed (default 0.25/s)
- `ECONOMY.KILL_REWARD` — coins per kill (default 50)
- `CHEST_WEIGHTS` — adjust Legendary drop rate (default 3%)

---

## Thumbnail / title tips

Roblox CTR is driven by the thumbnail. Suggested title: **"STORM ISLE ⚡ [SURVIVAL]"**

Thumbnail concepts (generate in Roblox Studio camera):
- Dramatic angle: character sprinting with sword while purple storm wall looms behind
- Text overlay: "LAST ONE STANDING WINS 🏆"
- High contrast — bright orange vs purple works extremely well in Roblox browse
