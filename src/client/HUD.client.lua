-- HUD: health bar, hunger bar, coin counter, storm ring, kill feed, timer
local Players        = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService     = game:GetService("RunService")
local TweenService   = game:GetService("TweenService")

local player  = Players.LocalPlayer
local Remotes = ReplicatedStorage:WaitForChild("Remotes")

local UpdateHUD      = Remotes:WaitForChild("UpdateHUD")
local PhaseChanged   = Remotes:WaitForChild("GamePhaseChanged")
local StormUpdate    = Remotes:WaitForChild("StormUpdate")
local ShowNotif      = Remotes:WaitForChild("ShowNotification")
local PlayerDied     = Remotes:WaitForChild("PlayerDied")
local PlayerWon      = Remotes:WaitForChild("PlayerWon")
local UpdateLeaderboard = Remotes:WaitForChild("UpdateLeaderboard")

-- ─── Build ScreenGui ──────────────────────────────────────────────────────────
local screenGui        = Instance.new("ScreenGui")
screenGui.Name         = "StormIsleHUD"
screenGui.ResetOnSpawn = false
screenGui.DisplayOrder = 10
screenGui.Parent       = player.PlayerGui

-- ─── Utility ─────────────────────────────────────────────────────────────────
local function makeFrame(parent, name, size, pos, color, transparency)
	local f = Instance.new("Frame")
	f.Name = name
	f.Size = size
	f.Position = pos
	f.BackgroundColor3 = color or Color3.fromRGB(30, 30, 30)
	f.BackgroundTransparency = transparency or 0
	f.BorderSizePixel = 0
	f.Parent = parent
	return f
end

local function makeLabel(parent, name, text, size, pos, textColor, fontSize)
	local l = Instance.new("TextLabel")
	l.Name = name
	l.Size = size
	l.Position = pos
	l.Text = text
	l.TextColor3 = textColor or Color3.fromRGB(255,255,255)
	l.BackgroundTransparency = 1
	l.Font = Enum.Font.GothamBold
	l.TextSize = fontSize or 18
	l.TextXAlignment = Enum.TextXAlignment.Left
	l.Parent = parent
	return l
end

-- ─── Bottom-left stat panel ───────────────────────────────────────────────────
local statPanel = makeFrame(screenGui, "StatPanel",
	UDim2.new(0, 260, 0, 110),
	UDim2.new(0, 16, 1, -126),
	Color3.fromRGB(10, 10, 10), 0.45)
local corner1 = Instance.new("UICorner"); corner1.CornerRadius = UDim.new(0,10); corner1.Parent = statPanel

-- Health bar
local hpBg = makeFrame(statPanel, "HPBg", UDim2.new(1,-16,0,20), UDim2.new(0,8,0,10), Color3.fromRGB(60,0,0))
local c2 = Instance.new("UICorner"); c2.CornerRadius=UDim.new(0,6); c2.Parent=hpBg
local hpBar = makeFrame(hpBg, "HPBar", UDim2.new(1,0,1,0), UDim2.new(0,0,0,0), Color3.fromRGB(220,60,60))
local c3=Instance.new("UICorner");c3.CornerRadius=UDim.new(0,6);c3.Parent=hpBar
local hpLabel = makeLabel(hpBg, "HPLabel", "HP  100/100", UDim2.new(1,0,1,0), UDim2.new(0,4,0,0), Color3.new(1,1,1), 13)

-- Hunger bar
local hungerBg = makeFrame(statPanel, "HungerBg", UDim2.new(1,-16,0,20), UDim2.new(0,8,0,36), Color3.fromRGB(60,40,0))
local c4=Instance.new("UICorner");c4.CornerRadius=UDim.new(0,6);c4.Parent=hungerBg
local hungerBar = makeFrame(hungerBg,"HungerBar",UDim2.new(1,0,1,0),UDim2.new(0,0,0,0),Color3.fromRGB(220,160,30))
local c5=Instance.new("UICorner");c5.CornerRadius=UDim.new(0,6);c5.Parent=hungerBar
local hungerLabel = makeLabel(hungerBg,"HungerLabel","Hunger  100",UDim2.new(1,0,1,0),UDim2.new(0,4,0,0),Color3.new(1,1,1),13)

-- Coins
local coinLabel = makeLabel(statPanel,"CoinLabel","🪙 0 coins",UDim2.new(1,-16,0,24),UDim2.new(0,8,0,62),Color3.fromRGB(255,215,0),16)
-- Kills/Wins
local killLabel = makeLabel(statPanel,"KillLabel","⚔ 0 kills  |  🏆 0 wins",UDim2.new(1,-16,0,20),UDim2.new(0,8,0,86),Color3.fromRGB(200,200,200),13)

-- ─── Top-center timer + phase ─────────────────────────────────────────────────
local topBar = makeFrame(screenGui,"TopBar",UDim2.new(0,260,0,44),UDim2.new(0.5,-130,0,12),Color3.fromRGB(10,10,10),0.45)
local c6=Instance.new("UICorner");c6.CornerRadius=UDim.new(0,10);c6.Parent=topBar
local phaseLabel = makeLabel(topBar,"PhaseLabel","LOBBY",UDim2.new(1,0,0.5,0),UDim2.new(0,0,0,0),Color3.fromRGB(100,200,255),16)
phaseLabel.TextXAlignment = Enum.TextXAlignment.Center
local timerLabel = makeLabel(topBar,"TimerLabel","30s",UDim2.new(1,0,0.5,0),UDim2.new(0,0,0.5,0),Color3.fromRGB(255,255,255),15)
timerLabel.TextXAlignment = Enum.TextXAlignment.Center

-- ─── Top-right: alive count + leaderboard ─────────────────────────────────────
local aliveFrame = makeFrame(screenGui,"AliveFrame",UDim2.new(0,180,0,40),UDim2.new(1,-196,0,12),Color3.fromRGB(10,10,10),0.45)
local c7=Instance.new("UICorner");c7.CornerRadius=UDim.new(0,10);c7.Parent=aliveFrame
local aliveLabel = makeLabel(aliveFrame,"AliveLabel","Alive: --",UDim2.new(1,0,1,0),UDim2.new(0,8,0,0),Color3.fromRGB(255,150,50),15)
aliveLabel.TextXAlignment=Enum.TextXAlignment.Center

-- ─── Notification toast ───────────────────────────────────────────────────────
local toastFrame = makeFrame(screenGui,"Toast",UDim2.new(0,380,0,60),UDim2.new(0.5,-190,0,-80),Color3.fromRGB(20,20,20),0.2)
local c8=Instance.new("UICorner");c8.CornerRadius=UDim.new(0,12);c8.Parent=toastFrame
local toastTitle = makeLabel(toastFrame,"Title","",UDim2.new(1,-16,0,22),UDim2.new(0,8,0,4),Color3.fromRGB(255,215,0),16)
local toastBody  = makeLabel(toastFrame,"Body", "",UDim2.new(1,-16,0,22),UDim2.new(0,8,0,26),Color3.fromRGB(220,220,220),13)
toastFrame.Visible = false

local toastQueue = {}
local toastActive = false

local function showToast(title, body, color)
	table.insert(toastQueue, {title=title, body=body, color=color or Color3.fromRGB(255,215,0)})
end

local function processToast()
	if toastActive or #toastQueue == 0 then return end
	toastActive = true
	local t = table.remove(toastQueue, 1)
	toastTitle.Text = t.title
	toastTitle.TextColor3 = t.color
	toastBody.Text  = t.body
	toastFrame.Visible = true
	toastFrame.Position = UDim2.new(0.5,-190,0,-80)
	TweenService:Create(toastFrame, TweenInfo.new(0.3,Enum.EasingStyle.Back), {Position=UDim2.new(0.5,-190,0,12)}):Play()
	task.delay(2.5, function()
		TweenService:Create(toastFrame, TweenInfo.new(0.3,Enum.EasingStyle.Quad), {Position=UDim2.new(0.5,-190,0,-80)}):Play()
		task.delay(0.35, function()
			toastFrame.Visible = false
			toastActive = false
			processToast()
		end)
	end)
end

-- ─── Winner / death splash ────────────────────────────────────────────────────
local function showSplash(title, sub, titleColor)
	local splash = Instance.new("Frame")
	splash.Size = UDim2.new(1,0,1,0)
	splash.BackgroundColor3 = Color3.fromRGB(0,0,0)
	splash.BackgroundTransparency = 0.4
	splash.ZIndex = 20
	splash.Parent = screenGui

	local mainLabel = Instance.new("TextLabel")
	mainLabel.Size = UDim2.new(1,0,0,80)
	mainLabel.Position = UDim2.new(0,0,0.35,0)
	mainLabel.Text = title
	mainLabel.TextColor3 = titleColor or Color3.fromRGB(255,215,0)
	mainLabel.Font = Enum.Font.GothamBold
	mainLabel.TextSize = 64
	mainLabel.BackgroundTransparency = 1
	mainLabel.TextXAlignment = Enum.TextXAlignment.Center
	mainLabel.ZIndex = 21
	mainLabel.Parent = splash

	local subLabel = Instance.new("TextLabel")
	subLabel.Size = UDim2.new(1,0,0,40)
	subLabel.Position = UDim2.new(0,0,0.35,90)
	subLabel.Text = sub
	subLabel.TextColor3 = Color3.fromRGB(220,220,220)
	subLabel.Font = Enum.Font.Gotham
	subLabel.TextSize = 28
	subLabel.BackgroundTransparency = 1
	subLabel.TextXAlignment = Enum.TextXAlignment.Center
	subLabel.ZIndex = 21
	subLabel.Parent = splash

	task.delay(5, function() if splash and splash.Parent then splash:Destroy() end end)
end

-- ─── Update stats ─────────────────────────────────────────────────────────────
local stats = { hp=100, maxHp=100, hunger=100, coins=0, kills=0, wins=0 }

UpdateHUD.OnClientEvent:Connect(function(key, value)
	if key == "coins" then
		stats.coins = value
		coinLabel.Text = string.format("🪙 %d coins", value)
	elseif key == "kills" then
		stats.kills = value
		killLabel.Text = string.format("⚔ %d kills  |  🏆 %d wins", stats.kills, stats.wins)
	elseif key == "wins" then
		stats.wins = value
		killLabel.Text = string.format("⚔ %d kills  |  🏆 %d wins", stats.kills, stats.wins)
	elseif key == "hunger" then
		stats.hunger = value
		hungerLabel.Text = "Hunger  " .. value
		hungerBar.Size = UDim2.new(math.max(0, value/100), 0, 1, 0)
		if value <= 15 then
			hungerBar.BackgroundColor3 = Color3.fromRGB(220,60,30)
		else
			hungerBar.BackgroundColor3 = Color3.fromRGB(220,160,30)
		end
	end
end)

-- ─── Health bar from character ─────────────────────────────────────────────────
RunService.Heartbeat:Connect(function()
	local char = player.Character
	if not char then return end
	local hum = char:FindFirstChildOfClass("Humanoid")
	if not hum then return end
	local hp = math.floor(hum.Health)
	local maxHp = math.floor(hum.MaxHealth)
	hpLabel.Text = string.format("HP  %d/%d", hp, maxHp)
	hpBar.Size = UDim2.new(math.max(0, hp/maxHp), 0, 1, 0)
	if hp/maxHp < 0.3 then
		hpBar.BackgroundColor3 = Color3.fromRGB(255,50,50)
	else
		hpBar.BackgroundColor3 = Color3.fromRGB(220,60,60)
	end

	-- Process toast queue
	processToast()
end)

-- ─── Phase & timer ────────────────────────────────────────────────────────────
local currentPhase = "Lobby"
local timeLeft     = 30

PhaseChanged.OnClientEvent:Connect(function(phase, time)
	currentPhase = phase
	timeLeft     = time
	phaseLabel.Text = phase:upper()
	if phase == "Lobby" then
		phaseLabel.TextColor3 = Color3.fromRGB(100,200,255)
	elseif phase == "Countdown" then
		phaseLabel.TextColor3 = Color3.fromRGB(255,200,50)
	elseif phase == "Playing" then
		phaseLabel.TextColor3 = Color3.fromRGB(100,255,100)
	else
		phaseLabel.TextColor3 = Color3.fromRGB(200,100,255)
	end
end)

RunService.Heartbeat:Connect(function(dt)
	timeLeft = math.max(0, timeLeft - dt)
	timerLabel.Text = string.format("%d:%02d", math.floor(timeLeft/60), math.floor(timeLeft%60))
end)

-- ─── Alive counter ────────────────────────────────────────────────────────────
UpdateLeaderboard.OnClientEvent:Connect(function(aliveList)
	aliveLabel.Text = "Alive: " .. #aliveList
end)

-- ─── Notifications ────────────────────────────────────────────────────────────
ShowNotif.OnClientEvent:Connect(function(title, body, color)
	showToast(title, body, color)
end)

PlayerDied.OnClientEvent:Connect(function(name, placement)
	if name == player.Name then
		showSplash("ELIMINATED", "You placed #" .. placement, Color3.fromRGB(255,80,80))
	end
end)

PlayerWon.OnClientEvent:Connect(function(winnerName)
	if winnerName == player.Name then
		showSplash("VICTORY!", "You are the Last Survivor!", Color3.fromRGB(255,215,0))
	else
		showSplash(winnerName .. " WINS!", "Better luck next round!", Color3.fromRGB(200,200,200))
	end
end)

-- ─── Minimap compass (simple direction indicator) ────────────────────────────
-- Shows which direction the storm center is when outside
task.spawn(function()
	while true do
		task.wait(0.5)
		-- Future enhancement: draw arrow pointing toward safe zone
	end
end)

print("[HUD] Loaded.")
