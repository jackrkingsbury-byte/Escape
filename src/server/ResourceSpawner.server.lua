-- ResourceSpawner: places resource nodes and loot chests around the island
local Workspace  = game:GetService("Workspace")
local Players    = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared   = ReplicatedStorage:WaitForChild("Shared")
local Config   = require(Shared:WaitForChild("GameConfig"))
local ItemData = require(Shared:WaitForChild("ItemData"))

-- ─── Weighted random loot ─────────────────────────────────────────────────────
local function weightedLoot()
	local total = 0
	for _, entry in ipairs(Config.LOOT_SPAWNS) do total = total + entry.weight end
	local roll = math.random(total)
	local cum  = 0
	for _, entry in ipairs(Config.LOOT_SPAWNS) do
		cum = cum + entry.weight
		if roll <= cum then return entry.item end
	end
	return "Wood"
end

-- ─── Spawn a resource node ────────────────────────────────────────────────────
local NODE_TYPES = {
	Tree  = { color = Color3.fromRGB(80, 130, 50),  size = Vector3.new(3, 8, 3),  drop = "Wood",    amount = {3,6} },
	Rock  = { color = Color3.fromRGB(130, 130, 130), size = Vector3.new(4, 3, 4), drop = "Stone",   amount = {2,5} },
	Bush  = { color = Color3.fromRGB(50, 180, 60),  size = Vector3.new(3, 2, 3),  drop = "Berries", amount = {2,4} },
	Vine  = { color = Color3.fromRGB(80, 160, 50),  size = Vector3.new(1, 4, 1),  drop = "Vine",    amount = {2,4} },
	Shroom= { color = Color3.fromRGB(200, 80, 200), size = Vector3.new(2, 2, 2),  drop = "Mushroom",amount = {1,3} },
}

local nodeFolder = Instance.new("Folder")
nodeFolder.Name   = "ResourceNodes"
nodeFolder.Parent = Workspace

local chestFolder = Instance.new("Folder")
chestFolder.Name  = "LootChests"
chestFolder.Parent = Workspace

local function spawnNode(nodeType, position)
	local data = NODE_TYPES[nodeType]
	if not data then return end

	local part = Instance.new("Part")
	part.Name      = nodeType .. "Node"
	part.Size      = data.size
	part.BrickColor = BrickColor.new("Bright green")
	part.Color     = data.color
	part.Anchored  = true
	part.Position  = position
	part.Material  = Enum.Material.SmoothPlastic
	part.Parent    = nodeFolder

	-- Billboard label
	local bb = Instance.new("BillboardGui")
	bb.Size   = UDim2.new(0, 80, 0, 30)
	bb.StudsOffset = Vector3.new(0, data.size.Y / 2 + 1, 0)
	bb.AlwaysOnTop = false
	bb.Parent = part
	local label = Instance.new("TextLabel")
	label.Size = UDim2.new(1, 0, 1, 0)
	label.Text = "[E] " .. nodeType
	label.TextColor3 = Color3.fromRGB(255,255,255)
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.GothamBold
	label.TextScaled = true
	label.Parent = bb

	-- Drop resources on touch (simple proximity harvest)
	local harvested = {}
	part.Touched:Connect(function(hit)
		local player = Players:GetPlayerFromCharacter(hit.Parent)
		if not player then return end
		if harvested[player.UserId] then return end
		harvested[player.UserId] = true

		local qty = math.random(data.amount[1], data.amount[2])
		if _G.AddItem then _G.AddItem(player, data.drop, qty) end

		local ShowNotif = ReplicatedStorage:WaitForChild("Remotes"):FindFirstChild("ShowNotification")
		if ShowNotif then
			ShowNotif:FireClient(player, data.drop:upper(), "+" .. qty .. " " .. data.drop, Color3.fromRGB(100,220,100))
		end

		-- Visually deplete
		part.Transparency = 0.6
		bb.Enabled = false
		task.delay(30, function()
			if part and part.Parent then
				part.Transparency = 0
				bb.Enabled = true
				harvested = {}
			end
		end)
	end)

	return part
end

-- ─── Spawn a loot chest ───────────────────────────────────────────────────────
local function spawnChest(position)
	local chest = Instance.new("Part")
	chest.Name      = "LootChest"
	chest.Size      = Vector3.new(3, 2, 2)
	chest.BrickColor = BrickColor.new("Bright yellow")
	chest.Anchored  = true
	chest.Position  = position
	chest.Material  = Enum.Material.SmoothPlastic
	chest.Parent    = chestFolder

	-- Label
	local bb = Instance.new("BillboardGui")
	bb.Size    = UDim2.new(0, 100, 0, 35)
	bb.StudsOffset = Vector3.new(0, 2, 0)
	bb.AlwaysOnTop = false
	bb.Parent  = chest
	local label = Instance.new("TextLabel")
	label.Size = UDim2.new(1,0,1,0)
	label.Text = "CHEST"
	label.TextColor3 = Color3.fromRGB(255, 215, 0)
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.GothamBold
	label.TextScaled = true
	label.Parent = bb

	local opened = {}
	chest.Touched:Connect(function(hit)
		local player = Players:GetPlayerFromCharacter(hit.Parent)
		if not player then return end
		if opened[player.UserId] then return end
		opened[player.UserId] = true

		-- Give 2-4 random loot items
		local grants = {}
		for _ = 1, math.random(2, 4) do
			local item = weightedLoot()
			local qty  = math.random(1, 3)
			if _G.AddItem then _G.AddItem(player, item, qty) end
			grants[item] = (grants[item] or 0) + qty
		end

		local msg = ""
		for item, qty in pairs(grants) do
			msg = msg .. "+" .. qty .. " " .. item .. "  "
		end

		local ShowNotif = ReplicatedStorage:WaitForChild("Remotes"):FindFirstChild("ShowNotification")
		if ShowNotif then
			ShowNotif:FireClient(player, "CHEST OPENED!", msg, Color3.fromRGB(255,215,0))
		end

		-- Deplete chest visually
		chest.Transparency = 0.8
		bb.Enabled = false
		task.delay(60, function()
			if chest and chest.Parent then
				chest.Transparency = 0
				bb.Enabled = true
				opened = {}
			end
		end)
	end)
end

-- ─── Generate island terrain nodes on game start ─────────────────────────────
local function clearNodes()
	nodeFolder:ClearAllChildren()
	chestFolder:ClearAllChildren()
end

local function populateIsland()
	clearNodes()
	local center = Config.MAP.CENTER
	local radius = Config.MAP.INITIAL_SAFE_RADIUS - 30
	local groundY = 3  -- assumed flat terrain Y

	local nodeTypes = {"Tree","Tree","Tree","Rock","Rock","Bush","Vine","Shroom"}

	-- Scatter 120 resource nodes
	for _ = 1, 120 do
		local angle = math.random() * math.pi * 2
		local dist  = math.random(20, radius)
		local x = center.X + math.cos(angle) * dist
		local z = center.Z + math.sin(angle) * dist
		local nodeType = nodeTypes[math.random(#nodeTypes)]
		spawnNode(nodeType, Vector3.new(x, groundY, z))
	end

	-- Scatter 20 loot chests
	for _ = 1, 20 do
		local angle = math.random() * math.pi * 2
		local dist  = math.random(30, radius)
		local x = center.X + math.cos(angle) * dist
		local z = center.Z + math.sin(angle) * dist
		spawnChest(Vector3.new(x, groundY, z))
	end

	print("[ResourceSpawner] Island populated: 120 nodes, 20 chests.")
end

-- ─── Listen for game phase ────────────────────────────────────────────────────
task.spawn(function()
	local lastPhase = ""
	while true do
		task.wait(1)
		local phase = _G.CurrentGamePhase or ""
		if phase ~= lastPhase then
			lastPhase = phase
			if phase == "Playing" then
				populateIsland()
			elseif phase == "Lobby" then
				clearNodes()
			end
		end
	end
end)

print("[ResourceSpawner] Loaded.")
