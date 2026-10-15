-- PlayerManager: persistent player data (coins, skins, boosts) via DataStore
local Players       = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerScriptService = game:GetService("ServerScriptService")

local Shared  = ReplicatedStorage:WaitForChild("Shared")
local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local Config  = require(Shared:WaitForChild("GameConfig"))

local UpdateHUD  = Remotes:WaitForChild("UpdateHUD")
local ShowNotif  = Remotes:WaitForChild("ShowNotification")

local playerStore = DataStoreService:GetDataStore("StormIsle_PlayerData_v1")

-- ─── Default profile ─────────────────────────────────────────────────────────
local function defaultProfile()
	return {
		coins          = 0,
		totalKills     = 0,
		totalWins      = 0,
		gamesPlayed    = 0,
		equippedSkin   = "Default",
		ownedSkins     = { "Default" },
		coinBoostExpiry= 0,        -- os.time() when boost expires
		hasVIP         = false,
		hasStarterPack = false,
	}
end

-- ─── In-memory cache ─────────────────────────────────────────────────────────
local profiles = {} -- { [userId] = profileTable }

local function getProfile(player)
	return profiles[player.UserId]
end

-- ─── Load / Save ─────────────────────────────────────────────────────────────
local function loadProfile(player)
	local success, data = pcall(function()
		return playerStore:GetAsync("Player_" .. player.UserId)
	end)
	if success and data then
		-- Merge defaults so new keys are always present
		local profile = defaultProfile()
		for k, v in pairs(data) do
			profile[k] = v
		end
		profiles[player.UserId] = profile
	else
		profiles[player.UserId] = defaultProfile()
	end
end

local function saveProfile(player)
	local profile = getProfile(player)
	if not profile then return end
	pcall(function()
		playerStore:SetAsync("Player_" .. player.UserId, profile)
	end)
end

-- ─── Coin helpers ─────────────────────────────────────────────────────────────
local function getCoinMultiplier(player)
	local profile = getProfile(player)
	if not profile then return 1 end
	local mult = 1
	if profile.hasVIP then
		mult = mult * Config.ECONOMY.VIP_COIN_MULTIPLIER
	end
	if profile.coinBoostExpiry > os.time() then
		mult = mult * Config.ECONOMY.COIN_BOOST_MULTIPLIER
	end
	return mult
end

local function awardCoins(player, baseAmount)
	local profile = getProfile(player)
	if not profile then return end
	local actual = math.floor(baseAmount * getCoinMultiplier(player))
	profile.coins = profile.coins + actual
	UpdateHUD:FireClient(player, "coins", profile.coins)
	if actual > 0 then
		ShowNotif:FireClient(player, "COINS", "+" .. actual .. " coins!", Color3.fromRGB(255, 215, 0))
	end
	return actual
end

-- ─── Game stat recording ──────────────────────────────────────────────────────
local function recordKill(player)
	local profile = getProfile(player)
	if not profile then return end
	profile.totalKills = profile.totalKills + 1
	awardCoins(player, Config.ECONOMY.KILL_REWARD)
end

local function recordWin(player, placement)
	local profile = getProfile(player)
	if not profile then return end
	if placement == 1 then
		profile.totalWins = profile.totalWins + 1
	end
	profile.gamesPlayed = profile.gamesPlayed + 1
	local baseReward = Config.ECONOMY.PLACEMENT_REWARDS[math.min(placement, #Config.ECONOMY.PLACEMENT_REWARDS)]
	awardCoins(player, baseReward or 0)
end

-- ─── Skin management ─────────────────────────────────────────────────────────
local function applySkin(player, skinId)
	local profile = getProfile(player)
	if not profile then return end
	if not table.find(profile.ownedSkins, skinId) then return false, "not_owned" end

	profile.equippedSkin = skinId

	-- Apply body color from skin config
	for _, skin in ipairs(Config.SKINS) do
		if skin.id == skinId then
			local char = player.Character
			if char then
				local humanoid = char:FindFirstChildOfClass("Humanoid")
				if humanoid then
					local desc = humanoid:GetAppliedDescription()
					local c = skin.bodyColor
					desc.HeadColor = c; desc.TorsoColor = c
					desc.LeftArmColor = c; desc.RightArmColor = c
					desc.LeftLegColor = c; desc.RightLegColor = c
					humanoid:ApplyDescription(desc)
				end
			end
			break
		end
	end
	return true
end

local function purchaseSkin(player, skinId)
	local profile = getProfile(player)
	if not profile then return false, "no_profile" end
	if table.find(profile.ownedSkins, skinId) then return false, "already_owned" end

	for _, skin in ipairs(Config.SKINS) do
		if skin.id == skinId then
			if profile.coins < skin.price then return false, "not_enough_coins" end
			profile.coins = profile.coins - skin.price
			table.insert(profile.ownedSkins, skinId)
			UpdateHUD:FireClient(player, "coins", profile.coins)
			applySkin(player, skinId)
			return true
		end
	end
	return false, "skin_not_found"
end

-- ─── Expose globals for other scripts ────────────────────────────────────────
_G.AwardCoins    = awardCoins
_G.RecordKill    = recordKill
_G.RecordWin     = recordWin
_G.GetProfile    = getProfile
_G.PurchaseSkin  = purchaseSkin
_G.ApplySkin     = applySkin

-- ─── Award coin BindableEvent (for GameManager) ──────────────────────────────
local awardEvent = Instance.new("BindableEvent")
awardEvent.Name  = "AwardCoins"
awardEvent.Parent = ServerScriptService
awardEvent.Event:Connect(function(player, amount)
	awardCoins(player, amount)
end)

-- ─── Re-apply skin on character spawn ────────────────────────────────────────
Players.PlayerAdded:Connect(function(player)
	loadProfile(player)

	player.CharacterAdded:Connect(function()
		task.wait(1) -- wait for character to fully load
		local profile = getProfile(player)
		if profile and profile.equippedSkin ~= "Default" then
			applySkin(player, profile.equippedSkin)
		end

		-- Send initial HUD data
		task.wait(0.5)
		local p = getProfile(player)
		if p then
			UpdateHUD:FireClient(player, "coins", p.coins)
			UpdateHUD:FireClient(player, "kills", p.totalKills)
			UpdateHUD:FireClient(player, "wins",  p.totalWins)
		end
	end)
end)

Players.PlayerRemoving:Connect(function(player)
	saveProfile(player)
	profiles[player.UserId] = nil
end)

-- Auto-save every 5 minutes
task.spawn(function()
	while true do
		task.wait(300)
		for _, player in ipairs(Players:GetPlayers()) do
			saveProfile(player)
		end
	end
end)

print("[PlayerManager] Loaded.")
