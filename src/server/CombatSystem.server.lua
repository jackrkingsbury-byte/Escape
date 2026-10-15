-- CombatSystem: melee and ranged damage with kill rewards
local Players       = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared  = ReplicatedStorage:WaitForChild("Shared")
local Config  = require(Shared:WaitForChild("GameConfig"))
local ItemData = require(Shared:WaitForChild("ItemData"))

-- ─── Per-player in-game inventory ─────────────────────────────────────────────
-- Format: { [userId] = { items = { name = count }, equipped = "Fists" } }
local inventories = {}

local function getInv(player)
	if not inventories[player.UserId] then
		inventories[player.UserId] = { items = {}, equipped = "Fists" }
	end
	return inventories[player.UserId]
end

local function addItem(player, itemName, count)
	local inv = getInv(player)
	inv.items[itemName] = (inv.items[itemName] or 0) + (count or 1)
	-- Broadcast to client
	local Remotes   = ReplicatedStorage:WaitForChild("Remotes")
	local UpdateInv = Remotes:FindFirstChild("UpdateInventory")
	if UpdateInv then
		UpdateInv:FireClient(player, inv.items)
	end
end

local function removeItem(player, itemName, count)
	local inv = getInv(player)
	local have = inv.items[itemName] or 0
	inv.items[itemName] = math.max(0, have - (count or 1))
	if inv.items[itemName] == 0 then inv.items[itemName] = nil end
end

local function hasItems(player, ingredients)
	local inv = getInv(player)
	for item, qty in pairs(ingredients) do
		if (inv.items[item] or 0) < qty then return false end
	end
	return true
end

_G.AddItem    = addItem
_G.RemoveItem = removeItem
_G.GetInv     = getInv

-- ─── Crafting handler ─────────────────────────────────────────────────────────
local Remotes   = ReplicatedStorage:WaitForChild("Remotes")
local CraftItem = Remotes:WaitForChild("CraftItem")
local ShowNotif = Remotes:WaitForChild("ShowNotification")

CraftItem.OnServerEvent:Connect(function(player, recipeName)
	local recipe = Config.CRAFTING[recipeName]
	if not recipe then return end
	if not hasItems(player, recipe.ingredients) then
		ShowNotif:FireClient(player, "CRAFT FAILED", "Not enough materials!", Color3.fromRGB(255,80,80))
		return
	end
	-- Consume
	for item, qty in pairs(recipe.ingredients) do
		removeItem(player, item, qty)
	end
	-- Grant
	addItem(player, recipeName, 1)
	ShowNotif:FireClient(player, "CRAFTED!", "You made a " .. recipeName .. "!", Color3.fromRGB(100,255,150))
end)

-- ─── Cooldown tracking ────────────────────────────────────────────────────────
local lastAttack = {} -- { [userId] = tick() }

local function canAttack(player, cooldown)
	local last = lastAttack[player.UserId] or 0
	if tick() - last >= cooldown then
		lastAttack[player.UserId] = tick()
		return true
	end
	return false
end

-- ─── Damage a character ───────────────────────────────────────────────────────
local function dealDamage(attacker, targetChar, damage)
	local hum = targetChar:FindFirstChildOfClass("Humanoid")
	if not hum or hum.Health <= 0 then return end

	hum:TakeDamage(damage)

	if hum.Health <= 0 then
		-- Find target player
		local targetPlayer = Players:GetPlayerFromCharacter(targetChar)
		if targetPlayer then
			-- Give kill reward
			if _G.RecordKill then _G.RecordKill(attacker) end
			-- Eliminate from game
			if _G.EliminatePlayer then
				_G.EliminatePlayer(targetPlayer, attacker.Name)
			end
			-- Drop loot
			dropLoot(targetChar)
		end
	end
end

-- Drop a random resource on death
function dropLoot(char)
	local root = char:FindFirstChild("HumanoidRootPart")
	if not root then return end
	local pos = root.Position

	-- Drop a few random items as world parts
	local drops = {
		{ name = "Wood",    color = Color3.fromRGB(150,100,50) },
		{ name = "Stone",   color = Color3.fromRGB(150,150,150) },
		{ name = "Berries", color = Color3.fromRGB(200,50,50) },
	}
	local pick = drops[math.random(#drops)]
	local part = Instance.new("Part")
	part.Name      = pick.name
	part.Size      = Vector3.new(1,1,1)
	part.BrickColor = BrickColor.new("Bright red")
	part.Color     = pick.color
	part.Anchored  = false
	part.Position  = pos + Vector3.new(math.random(-3,3), 2, math.random(-3,3))
	part.Parent    = game:GetService("Workspace")

	-- Tag for ResourceSpawner to handle pickup
	local tag = Instance.new("StringValue")
	tag.Name  = "ResourceType"
	tag.Value = pick.name
	tag.Parent = part

	-- Auto-despawn after 60 seconds
	game:GetService("Debris"):AddItem(part, 60)
end

-- ─── Tool touch hit detection (simple melee) ─────────────────────────────────
local function setupWeaponTool(player, toolName)
	local char = player.Character
	if not char then return end
	local tool = char:FindFirstChild(toolName)
	if not tool then return end
	local handle = tool:FindFirstChild("Handle")
	if not handle then return end

	local weaponData = ItemData.WEAPONS[toolName]
	if not weaponData then return end

	handle.Touched:Connect(function(hit)
		local targetChar = hit.Parent
		if targetChar == char then return end
		local hum = targetChar:FindFirstChildOfClass("Humanoid")
		if not hum then return end

		if not canAttack(player, weaponData.cooldown) then return end
		dealDamage(player, targetChar, weaponData.damage)
	end)
end

-- ─── Character spawned: wire up default fist damage ──────────────────────────
Players.PlayerAdded:Connect(function(player)
	player.CharacterAdded:Connect(function(char)
		inventories[player.UserId] = { items = {}, equipped = "Fists" }

		-- Starter pack: if player has it, grant sword + medkit
		task.wait(2)
		if _G.StarterPackGranted and _G.StarterPackGranted[player.UserId] then
			addItem(player, "Sword",  1)
			addItem(player, "Medkit", 1)
		end
	end)

	player.CharacterRemoving:Connect(function()
		inventories[player.UserId] = nil
	end)
end)

Players.PlayerRemoving:Connect(function(player)
	inventories[player.UserId] = nil
	lastAttack[player.UserId]  = nil
end)

print("[CombatSystem] Loaded.")
