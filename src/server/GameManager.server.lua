-- GameManager: drives the lobby → countdown → playing → ended state machine
local Players      = game:GetService("Players")
local RunService   = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared    = ReplicatedStorage:WaitForChild("Shared")
local Remotes   = ReplicatedStorage:WaitForChild("Remotes")
local Config    = require(Shared:WaitForChild("GameConfig"))

local PhaseChanged    = Remotes:WaitForChild("GamePhaseChanged")
local ShowNotif       = Remotes:WaitForChild("ShowNotification")
local PlayerWon       = Remotes:WaitForChild("PlayerWon")
local UpdateLeaderboard = Remotes:WaitForChild("UpdateLeaderboard")

-- ─── State ──────────────────────────────────────────────────────────────────
local currentPhase   = Config.PHASES.LOBBY
local phaseTimer     = Config.TIMING.LOBBY_DURATION
local alivePlayers   = {} -- { [player] = true }
local gameStartTime  = 0
local placementOrder = {} -- filled as players die

-- ─── Helpers ────────────────────────────────────────────────────────────────
local function broadcastPhase(phase, timeLeft)
	PhaseChanged:FireAllClients(phase, timeLeft)
end

local function notify(player, title, body, color)
	ShowNotif:FireClient(player, title, body, color or Color3.fromRGB(255,255,255))
end

local function notifyAll(title, body, color)
	for _, p in ipairs(Players:GetPlayers()) do
		notify(p, title, body, color)
	end
end

local function countAlive()
	local n = 0
	for _ in pairs(alivePlayers) do n = n + 1 end
	return n
end

local function getAliveList()
	local list = {}
	for p in pairs(alivePlayers) do table.insert(list, p) end
	return list
end

-- ─── Phase transitions ───────────────────────────────────────────────────────
local function startLobby()
	currentPhase = Config.PHASES.LOBBY
	_G.CurrentGamePhase = currentPhase
	_G.GameIsPlaying    = false
	phaseTimer   = Config.TIMING.LOBBY_DURATION
	alivePlayers = {}
	placementOrder = {}
	broadcastPhase(currentPhase, phaseTimer)
	notifyAll("LOBBY", "Waiting for players... Game starts in " .. phaseTimer .. "s", Color3.fromRGB(100, 200, 255))
end

local function startCountdown()
	currentPhase = Config.PHASES.COUNTDOWN
	_G.CurrentGamePhase = currentPhase
	phaseTimer   = Config.TIMING.COUNTDOWN_DURATION
	broadcastPhase(currentPhase, phaseTimer)
	notifyAll("GET READY!", "Game starting in " .. phaseTimer .. " seconds!", Color3.fromRGB(255, 200, 50))

	-- Register all current players as alive
	alivePlayers = {}
	for _, p in ipairs(Players:GetPlayers()) do
		alivePlayers[p] = true
	end
end

local function teleportToIsland()
	-- Scatter players around the island center at parachute height
	local players = Players:GetPlayers()
	local radius  = 200
	for i, player in ipairs(players) do
		local angle = (i / #players) * math.pi * 2
		local x = math.cos(angle) * radius
		local z = math.sin(angle) * radius
		local spawnCF = CFrame.new(x, Config.MAP.PARACHUTE_HEIGHT, z)

		local char = player.Character
		if char then
			local root = char:FindFirstChild("HumanoidRootPart")
			if root then root.CFrame = spawnCF end
		end
	end
end

local function startPlaying()
	currentPhase = Config.PHASES.PLAYING
	_G.CurrentGamePhase = currentPhase
	_G.GameIsPlaying    = true
	_G.GameStartTime    = tick()
	phaseTimer   = Config.TIMING.MAX_GAME_DURATION
	gameStartTime = tick()
	broadcastPhase(currentPhase, phaseTimer)
	teleportToIsland()
	notifyAll("SURVIVE!", "Collect loot, craft gear, outlast everyone!", Color3.fromRGB(255, 80, 80))
end

local function endGame(winner)
	currentPhase = Config.PHASES.ENDED
	_G.CurrentGamePhase = currentPhase
	_G.GameIsPlaying    = false

	if winner then
		notifyAll("WINNER!", winner.Name .. " is the Last Survivor!", Color3.fromRGB(255, 215, 0))
		PlayerWon:FireAllClients(winner.Name)

		-- Award winner coins via PlayerManager binding
		local PlayerManager = game:GetService("ServerScriptService"):FindFirstChild("PlayerManager")
		if PlayerManager then
			-- PlayerManager listens for this BindableEvent
			local awardEvent = game:GetService("ServerScriptService"):FindFirstChild("AwardCoins")
			if awardEvent then
				local minutesSurvived = math.floor((tick() - gameStartTime) / 60)
				local reward = Config.ECONOMY.PLACEMENT_REWARDS[1]
					+ minutesSurvived * Config.ECONOMY.SURVIVAL_PER_MINUTE
				awardEvent:Fire(winner, reward)
			end
		end
	else
		notifyAll("DRAW!", "Everyone was eliminated. No winner this round.", Color3.fromRGB(180, 180, 180))
	end

	task.delay(Config.TIMING.WIN_DISPLAY_TIME, function()
		startLobby()
	end)
end

-- ─── Player death hook (called from CombatSystem) ────────────────────────────
local PlayerDied = Remotes:WaitForChild("PlayerDied")

local function onPlayerEliminated(player, killerName)
	if not alivePlayers[player] then return end
	alivePlayers[player] = nil
	table.insert(placementOrder, 1, player) -- most-recent death at front

	local placement = countAlive() + 1
	notify(player, "ELIMINATED", "You placed #" .. placement .. ". Better luck next time!", Color3.fromRGB(255,80,80))
	if killerName then
		notifyAll("KILL", killerName .. " eliminated " .. player.Name .. "! (" .. countAlive() .. " left)", Color3.fromRGB(255,120,50))
	end

	PlayerDied:FireAllClients(player.Name, placement)

	-- Check win condition
	local alive = countAlive()
	if alive <= 1 then
		local remaining = getAliveList()
		endGame(remaining[1] or nil)
	end
end

-- Expose globally so CombatSystem / StormManager can call it
_G.EliminatePlayer = onPlayerEliminated

-- ─── Player left mid-game ────────────────────────────────────────────────────
Players.PlayerRemoving:Connect(function(player)
	if currentPhase == Config.PHASES.PLAYING then
		onPlayerEliminated(player, nil)
	end
	alivePlayers[player] = nil
end)

-- ─── Main loop ───────────────────────────────────────────────────────────────
local lastTick = tick()

RunService.Heartbeat:Connect(function()
	local now  = tick()
	local dt   = now - lastTick
	lastTick   = now

	if currentPhase == Config.PHASES.LOBBY then
		-- Auto-start with minimum players, or on timer
		local playerCount = #Players:GetPlayers()
		phaseTimer = phaseTimer - dt
		if playerCount >= Config.PLAYER.RESPAWN_DISABLED and playerCount < 2 then
			-- not enough players; reset timer
			phaseTimer = Config.TIMING.LOBBY_DURATION
		elseif phaseTimer <= 0 or (playerCount >= 10) then
			if playerCount >= 2 then
				startCountdown()
			else
				phaseTimer = Config.TIMING.LOBBY_DURATION
			end
		end

	elseif currentPhase == Config.PHASES.COUNTDOWN then
		phaseTimer = phaseTimer - dt
		if phaseTimer <= 0 then
			startPlaying()
		end

	elseif currentPhase == Config.PHASES.PLAYING then
		phaseTimer = phaseTimer - dt
		if phaseTimer <= 0 then
			-- Time ran out — whoever is alive wins (or no winner if somehow empty)
			local remaining = getAliveList()
			if #remaining == 1 then
				endGame(remaining[1])
			elseif #remaining > 1 then
				-- Multiple survivors: sudden death — pick one at random
				endGame(remaining[math.random(#remaining)])
			else
				endGame(nil)
			end
		end
	end
end)

-- ─── Leaderboard broadcast (every 5 seconds during play) ──────────────────
task.spawn(function()
	while true do
		task.wait(5)
		if currentPhase == Config.PHASES.PLAYING then
			local list = {}
			for p in pairs(alivePlayers) do
				table.insert(list, p.Name)
			end
			UpdateLeaderboard:FireAllClients(list)
		end
	end
end)

-- Kick off
startLobby()
print("[GameManager] Storm Isle initialised.")
