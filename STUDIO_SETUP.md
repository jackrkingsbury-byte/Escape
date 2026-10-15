# 📋 Copy-Paste Setup Guide (No Rojo, No Command Line)

This is the simplest way to get **Storm Isle: Last Survivor** into Roblox.
You do everything by clicking inside Roblox Studio and pasting code.

> ⚠️ **You need a Windows PC or Mac.** Roblox Studio does not exist for iPad/tablet.
> Borrow a computer for ~30 minutes — once you Publish, the game lives on Roblox's
> servers and you never need the computer again to keep it online.

---

## Step 0 — Install Roblox Studio (one time)

1. On the computer, go to **https://create.roblox.com**
2. Click **Start Creating** → it downloads Roblox Studio
3. Open Studio and **sign in with your Roblox account** ← *this is how your account gets connected*
4. Click **New** → **Baseplate** template. You now have a flat world to build on.

---

## Step 1 — Understand the Explorer

On the right side of Studio is the **Explorer** window (if you don't see it:
top menu → **View** → **Explorer**). It's a tree of "services". You'll be
pasting scripts into three of them:

- **ServerScriptService** → game logic (the brain)
- **ReplicatedStorage** → shared data both sides can read
- **StarterPlayer → StarterPlayerScripts** → the player's screen (HUD, menus)

To add something: **hover over a service → click the ⊕ button → pick the type.**

---

## Step 2 — Add the two shared modules

These hold all the settings and item lists.

1. In Explorer, hover **ReplicatedStorage** → ⊕ → **Folder**. Rename it `Shared`.
   *(Right-click → Rename, or select it and press F2.)*
2. Hover the new **Shared** folder → ⊕ → **ModuleScript**. Rename it `GameConfig`.
   - Double-click it, delete the default text, paste the contents of
     **`src/shared/GameConfig.lua`**.
3. Hover **Shared** again → ⊕ → **ModuleScript**. Rename it `ItemData`.
   - Paste the contents of **`src/shared/ItemData.lua`**.

---

## Step 3 — Add the server scripts

For **each** file below: hover **ServerScriptService** → ⊕ → **Script**,
rename it to the name shown, then paste the matching file's contents.

| Rename the Script to | Paste from |
|---|---|
| `Installer`          | `src/server/Installer.server.lua` ← **add this FIRST** |
| `GameManager`        | `src/server/GameManager.server.lua` |
| `PlayerManager`      | `src/server/PlayerManager.server.lua` |
| `MonetizationService`| `src/server/MonetizationService.server.lua` |
| `StormManager`       | `src/server/StormManager.server.lua` |
| `CombatSystem`       | `src/server/CombatSystem.server.lua` |
| `ResourceSpawner`    | `src/server/ResourceSpawner.server.lua` |

> The `Installer` script auto-creates all the "Remotes" for you, so you can
> skip making those by hand. Just make sure it's there.

---

## Step 4 — Add the client scripts

These must be **LocalScripts** (not regular Scripts) and go in a special spot.

1. In Explorer, expand **StarterPlayer** → click **StarterPlayerScripts**.
2. For each file: hover **StarterPlayerScripts** → ⊕ → **LocalScript**,
   rename, and paste.

| Rename the LocalScript to | Paste from |
|---|---|
| `HUD`         | `src/client/HUD.client.lua` |
| `CraftingGui` | `src/client/CraftingGui.client.lua` |
| `ShopGui`     | `src/client/ShopGui.client.lua` |

---

## Step 5 — Turn on saving (DataStores)

So players keep their coins and skins between sessions:

1. Top menu → **Home** → **Game Settings**
2. Left tab → **Security**
3. Turn ON **Enable Studio Access to API Services**
4. Click **Save**

*(This also requires the game to be published — Step 7.)*

---

## Step 6 — Quick test

1. Press the **Play** button (top, looks like ▶).
2. You should see the HUD appear (health/hunger bars bottom-left, shop button top-right).
3. Press **P** → the shop opens. Press **C** → the crafting menu opens.
4. To test the full match flow with the lobby timer, use **Test → Start** with
   **2+ players** (set the player count dropdown to 2).

If something doesn't show up, open **View → Output** to see error messages —
they'll tell you which script name is misspelled or missing.

---

## Step 7 — Publish & connect monetisation

1. Top menu → **File** → **Publish to Roblox As...** → give it a name
   (e.g. *Storm Isle: Last Survivor*) → **Create**.
2. Go to **https://create.roblox.com** → click your game → **Monetization**.
3. Create these and copy each ID:
   - **Passes**: VIP, Starter Pack
   - **Developer Products**: Lucky Chest, Coin Boost
4. Back in Studio, open the `GameConfig` module and replace the `0` values
   under `MONETIZATION` with your real IDs:
   ```lua
   PASS_VIP_ID            = 123456789,
   PASS_STARTER_PACK_ID   = 987654321,
   PRODUCT_LUCKY_CHEST_ID = 111111111,
   PRODUCT_COIN_BOOST_ID  = 222222222,
   ```
5. **Publish again** (File → Publish to Roblox — same place, it updates).
6. On the game's page, set it to **Public** so anyone can play.

🎉 **You're live.** Robux from passes/products flows into your account's pending
balance and pays out per Roblox's payout schedule.

---

## Handy: how players control the game

| Key | Action |
|---|---|
| Walk into a tree/rock/bush | Harvest wood, stone, berries |
| **C** | Open crafting menu |
| **P** | Open shop |
| Walk into a yellow chest | Grab random loot |

---

## If you get stuck

Open **View → Output** in Studio. Almost every problem is one of:
- A script pasted into the wrong service (Server vs StarterPlayerScripts)
- A Script that should be a **LocalScript** (the 3 client ones)
- A typo in a renamed script
- API Services not enabled (Step 5)

Fix the name/location, press Play again.
