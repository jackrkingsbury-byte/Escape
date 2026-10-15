-- StormManager: shrinks the safe zone and damages players outside it
local Players       = game:GetService("Players")
local RunService    = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace     = game:GetService("Workspace")

local Shared  = ReplicatedStorage:WaitForChild("Shared")
local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local Config  = require(Shared:WaitForChild("GameConfig"))

local StormUpdate = Remotes:WaitForChild("StormUpdate")
local PhaseChanged = Remotes:WaitForChild("GamePhaseChanged")

-- ─── Storm state ─────────────────────────────────────────────────────────────
local safeRadius    = Config.MAP.INITIAL_SAFE_RADIUS
local stormActive   = false
local gameActive    = false
local stormPart     = nil   -- visual cylinder / sphere representing the safe zone ring

-- ─── Storm visual (a large transparent cylinder) ────────────────────────────
local function createStormVisual()
	-- Outer wall: tall, semi-transparent purple cylinder
	local storm = Instance.new("Part")
	storm.Name            = "StormWall"
	storm.Anchored        = true
	storm.CanCollide      = false
	storm.Transparency    = 0.35
	storm.Material        = Enum.Material.Neon
	storm.BrickColor      = BrickColor.new("Dark indigo")
	storm.Shape           = Enum.PartType.Cylinder
	-- Size: diameter = 2 * safeRadius, height = 500 (tall wall)
	storm.Size            = Vector3.new(500, safeRadius * 2, safeRadius * 2)
	storm.CFrame          = CFrame.new(Config.MAP.CENTER) * CFrame.Angles(0, 0, math.pi / 2)
	storm.Parent          = Workspace
	return storm
end

local function updateStormVisual()
	if stormPart then
		stormPart.Size = Vector3.new(500, safeRadius * 2, safeRadius * 2)
	end
end

-- ─── Damage players outside the safe zone ────────────────────────────────────
local lastDamageTime = {}

local function applyStormDamage(dt)
	for _, player in ipairs(Players:GetPlayers()) do
		local char = player.Character
		if not char then continue end
		local root = char:FindFirstChild("HumanoidRootPart")
		local hum  = char:FindFirstChildOfClass("Humanoid")
		if not root or not hum or hum.Health <= 0 then continue end

		local pos      = root.Position
		local center2D = Vector3.new(Config.MAP.CENTER.X, pos.Y, Config.MAP.CENTER.Z)
		local dist     = (pos - center2D).Magnitude

		if dist > safeRadius then
			local damage = Config.MAP.STORM_DAMAGE_PER_SEC * dt
			hum:TakeDamage(damage)
		end
	end
end

-- ─── Hunger drain & starving damage ──────────────────────────────────────────
local playerHunger = {} -- { [userId] = hungerValue }

local function initHunger(player)
	playerHunger[player.UserId] = Config.PLAYER.MAX_HUNGER
end

local function applyHungerDrain(dt)
	for _, player in ipairs(Players:GetPlayers()) do
		local char = player.Character
		if not char then continue end
		local hum = char:FindFirstChildOfClass("Humanoid")
		if not hum or hum.Health <= 0 then continue end

		local uid = player.UserId
		if not playerHunger[uid] then playerHunger[uid] = Config.PLAYER.MAX_HUNGER end

		playerHunger[uid] = math.max(0, playerHunger[uid] - Config.PLAYER.HUNGER_DRAIN * dt)

		-- Send hunger to HUD
		local UpdateHUD = Remotes:FindFirstChild("UpdateHUD")
		if UpdateHUD then
			UpdateHUD:FireClient(player, "hunger", math.floor(playerHunger[uid]))
		end

		-- Starving
		if playerHunger[uid] <= Config.PLAYER.STARVING_THRESHOLD then
			hum:TakeDamage(Config.PLAYER.STARVING_DAMAGE * dt)
			hum.WalkSpeed = Config.PLAYER.WALKSPEED_STARVING
		else
			hum.WalkSpeed = Config.PLAYER.WALKSPEED_BASE
		end
	end
end

-- Expose hunger so Campfire / Berries can restore it
_G.GetHunger   = function(player) return playerHunger[player.UserId] or 0 end
_G.RestoreHunger = function(player, amount)
	local uid = player.UserId
	playerHunger[uid] = math.min(Config.PLAYER.MAX_HUNGER, (playerHunger[uid] or 0) + amount)
end
_G.RestoreHealth = function(player, amount)
	local char = player.Character
	if not char then return end
	local hum = char:FindFirstChildOfClass("Humanoid")
	if hum then
		hum.Health = math.min(hum.MaxHealth, hum.Health + amount)
	end
end

-- ─── Listen for phase changes ─────────────────────────────────────────────────
PhaseChanged.OnClientEvent = nil -- server-side; we use the remote fired to all clients

-- The GameManager fires PhaseChanged as a RemoteEvent to clients.
-- We handle phase logic internally by watching GameManager's _G globals.
-- Poll phase from GameManager:
task.spawn(function()
	while true do
		task.wait(1)
		-- We can't directly read GameManager's local var; use a shared BindableValue instead.
		-- For simplicity, we rely on the fact that GameManager starts storm after STORM_DELAY.
	end
end)

-- ─── Main tick ───────────────────────────────────────────────────────────────
local stormStartTime = nil
local lastTick = tick()

-- Storm activates STORM_DELAY seconds after the game starts.
-- We watch _G.GameStartTime set by GameManager.
task.spawn(function()
	-- Wait for game to start
	while not _G.GameIsPlaying do task.wait(1) end

	stormPart = createStormVisual()

	task.wait(Config.TIMING.STORM_DELAY)
	stormActive = true
	stormStartTime = tick()

	-- Announce storm
	for _, p in ipairs(Players:GetPlayers()) do
		local ShowNotif = Remotes:FindFirstChild("ShowNotification")
		if ShowNotif then
			ShowNotif:FireClient(p, "STORM INCOMING!",
				"The storm is closing in — stay inside the circle!", Color3.fromRGB(180, 0, 255))
		end
	end
end)

-- Heartbeat
RunService.Heartbeat:Connect(function()
	local now = tick()
	local dt  = now - lastTick
	lastTick  = now

	if not _G.GameIsPlaying then return end

	-- Hunger drain always active during gameplay
	applyHungerDrain(dt)

	if not stormActive then return end

	-- Shrink safe zone every STORM_TICK_INTERVAL seconds
	local timeSinceStorm = now - (stormStartTime or now)
	local shrinkTicks    = math.floor(timeSinceStorm / Config.TIMING.STORM_TICK_INTERVAL)
	local targetRadius   = math.max(
		Config.MAP.FINAL_SAFE_RADIUS,
		Config.MAP.INITIAL_SAFE_RADIUS - shrinkTicks * Config.MAP.SHRINK_PER_TICK
	)

	if math.abs(safeRadius - targetRadius) > 0.5 then
		safeRadius = targetRadius
		updateStormVisual()
		StormUpdate:FireAllClients(safeRadius, Config.MAP.CENTER)
	end

	-- Storm damage
	applyStormDamage(dt)
end)

-- Set _G flag when phase changes (GameManager sets this)
-- Since GameManager can't directly set our local, we use a polling pattern.
task.spawn(function()
	local lastPhase = ""
	while true do
		task.wait(0.5)
		local phase = _G.CurrentGamePhase or ""
		if phase ~= lastPhase then
			lastPhase = phase
			if phase == "Playing" then
				_G.GameIsPlaying = true
				-- Reset per-game state
				safeRadius    = Config.MAP.INITIAL_SAFE_RADIUS
				stormActive   = false
				stormStartTime = nil
				for _, p in ipairs(Players:GetPlayers()) do
					initHunger(p)
				end
				if stormPart then stormPart:Destroy(); stormPart = nil end
			elseif phase == "Lobby" or phase == "Ended" then
				_G.GameIsPlaying = false
				stormActive = false
				if stormPart then stormPart:Destroy(); stormPart = nil end
			end
		end
	end
end)

-- Patch GameManager to set _G.CurrentGamePhase
-- (GameManager fires PhaseChanged remote; we listen server-side via a BindableEvent)
-- A cleaner approach: GameManager publishes via _G.CurrentGamePhase directly.
-- Add that line at the top of each startXxx() call.
-- The GameManager script already sets phase in currentPhase; we bind it below:
task.spawn(function()
	task.wait(2) -- let GameManager initialise
	-- Monkey-patch: watch the RemoteEvent for phase changes (fired to ALL clients includes server via BindableEvent)
	-- Since we can't listen to RemoteEvent server-side, we poll _G
	while true do
		task.wait(1)
		-- GameManager sets _G.CurrentGamePhase in its loop — added below
	end
end)

Players.PlayerAdded:Connect(function(player)
	initHunger(player)
end)

print("[StormManager] Loaded.")
