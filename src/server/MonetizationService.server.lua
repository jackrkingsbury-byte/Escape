-- MonetizationService: handles Game Passes and Developer Products
-- This is the revenue engine — wire up your IDs in GameConfig.MONETIZATION
local Players            = game:GetService("Players")
local MarketplaceService = game:GetService("MarketplaceService")
local ReplicatedStorage  = game:GetService("ReplicatedStorage")

local Shared  = ReplicatedStorage:WaitForChild("Shared")
local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local Config  = require(Shared:WaitForChild("GameConfig"))

local ShowNotif = Remotes:WaitForChild("ShowNotification")
local UpdateHUD = Remotes:WaitForChild("UpdateHUD")

local M = Config.MONETIZATION

-- ─── Rarity → reward skins pool for Lucky Chest ──────────────────────────────
local rarityPools = { Common = {}, Rare = {}, Epic = {}, Legendary = {} }
for _, skin in ipairs(Config.SKINS) do
	table.insert(rarityPools[skin.rarity] or rarityPools.Common, skin.id)
end

local function weightedRarity()
	local w = Config.CHEST_WEIGHTS
	local total = w.Common + w.Rare + w.Epic + w.Legendary
	local roll  = math.random(total)
	if roll <= w.Common then return "Common"
	elseif roll <= w.Common + w.Rare then return "Rare"
	elseif roll <= w.Common + w.Rare + w.Epic then return "Epic"
	else return "Legendary"
	end
end

local function openLuckyChest(player)
	local profile = _G.GetProfile and _G.GetProfile(player)
	if not profile then return end

	local rarity = weightedRarity()
	local pool   = rarityPools[rarity]

	-- Filter out already-owned skins
	local available = {}
	for _, skinId in ipairs(pool) do
		if not table.find(profile.ownedSkins, skinId) then
			table.insert(available, skinId)
		end
	end

	-- All skins of this rarity owned → give coins consolation
	if #available == 0 then
		local consolation = 150
		if _G.AwardCoins then _G.AwardCoins(player, consolation) end
		ShowNotif:FireClient(player, "LUCKY CHEST",
			"You own all " .. rarity .. " skins! Consolation: +" .. consolation .. " coins.",
			Color3.fromRGB(200, 200, 200))
		return
	end

	local won = available[math.random(#available)]
	table.insert(profile.ownedSkins, won)

	local colors = {
		Common    = Color3.fromRGB(200,200,200),
		Rare      = Color3.fromRGB(80,150,255),
		Epic      = Color3.fromRGB(180,50,255),
		Legendary = Color3.fromRGB(255,200,0),
	}
	ShowNotif:FireClient(player, "LUCKY CHEST — " .. rarity:upper(),
		"You unlocked: " .. won .. " skin!",
		colors[rarity])
end

-- ─── Game Pass check on join ──────────────────────────────────────────────────
local function checkPasses(player)
	-- Poll until PlayerManager has loaded the profile
	local tries = 0
	repeat
		task.wait(1)
		tries = tries + 1
	until (_G.GetProfile and _G.GetProfile(player)) or tries > 10

	local profile = _G.GetProfile and _G.GetProfile(player)
	if not profile then return end

	local function checkPass(passId, flag, label)
		if passId == 0 then return end
		local ok, owns = pcall(function()
			return MarketplaceService:UserOwnsGamePassAsync(player.UserId, passId)
		end)
		if ok and owns and not profile[flag] then
			profile[flag] = true
			ShowNotif:FireClient(player, label .. " ACTIVE",
				"Your " .. label .. " perks are active this session!",
				Color3.fromRGB(255, 215, 0))
		end
	end

	checkPass(M.PASS_VIP_ID,          "hasVIP",         "VIP")
	checkPass(M.PASS_STARTER_PACK_ID,  "hasStarterPack", "Starter Pack")

	-- Grant starter pack items (one-time per session)
	if profile.hasStarterPack then
		ShowNotif:FireClient(player, "STARTER PACK",
			"Sword + Medkit added to your inventory!",
			Color3.fromRGB(100, 255, 150))
		-- inventory grant is handled in ResourceSpawner via _G flag
		_G.StarterPackGranted = _G.StarterPackGranted or {}
		_G.StarterPackGranted[player.UserId] = true
	end
end

Players.PlayerAdded:Connect(function(player)
	task.spawn(checkPasses, player)
end)

-- ─── Developer Product receipts ──────────────────────────────────────────────
MarketplaceService.ProcessReceipt = function(receiptInfo)
	local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
	if not player then
		-- Player left; retry later
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	local productId = receiptInfo.ProductId

	if productId == M.PRODUCT_LUCKY_CHEST_ID then
		openLuckyChest(player)

	elseif productId == M.PRODUCT_COIN_BOOST_ID then
		local profile = _G.GetProfile and _G.GetProfile(player)
		if profile then
			profile.coinBoostExpiry = os.time() + Config.ECONOMY.COIN_BOOST_DURATION
			ShowNotif:FireClient(player, "COIN BOOST ACTIVE!",
				"3x coins for the next hour!",
				Color3.fromRGB(255, 215, 0))
		end
	end

	return Enum.ProductPurchaseDecision.PurchaseGranted
end

-- ─── Prompt helpers for client ShopGui ────────────────────────────────────────
local PurchaseProduct = Remotes:WaitForChild("PurchaseProduct")
PurchaseProduct.OnServerInvoke = function(player, productType, id)
	if productType == "GamePass" then
		MarketplaceService:PromptGamePassPurchase(player, id)
		return true
	elseif productType == "DevProduct" then
		MarketplaceService:PromptProductPurchase(player, id)
		return true
	elseif productType == "Skin" then
		local ok, reason = _G.PurchaseSkin and _G.PurchaseSkin(player, id)
		return ok, reason
	end
	return false, "unknown_type"
end

print("[MonetizationService] Loaded. Revenue engine ready.")
