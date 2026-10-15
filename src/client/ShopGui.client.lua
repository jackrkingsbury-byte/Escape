-- ShopGui: Robux store for VIP pass, Lucky Chest, Coin Boost, and cosmetic skins
local Players        = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MarketplaceService = game:GetService("MarketplaceService")
local TweenService   = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")

local player  = Players.LocalPlayer
local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local Shared  = ReplicatedStorage:WaitForChild("Shared")
local Config  = require(Shared:WaitForChild("GameConfig"))

local OpenShop       = Remotes:WaitForChild("OpenShop")
local ShowNotif      = Remotes:WaitForChild("ShowNotification")
local PurchaseProduct = Remotes:WaitForChild("PurchaseProduct")

local M = Config.MONETIZATION

-- ─── Screen Gui ───────────────────────────────────────────────────────────────
local screenGui = Instance.new("ScreenGui")
screenGui.Name         = "ShopGui"
screenGui.ResetOnSpawn = false
screenGui.DisplayOrder = 20
screenGui.Parent       = player.PlayerGui

-- ─── Backdrop ────────────────────────────────────────────────────────────────
local backdrop = Instance.new("Frame")
backdrop.Size = UDim2.new(1,0,1,0)
backdrop.BackgroundColor3 = Color3.fromRGB(0,0,0)
backdrop.BackgroundTransparency = 0.5
backdrop.BorderSizePixel = 0
backdrop.Visible = false
backdrop.Parent = screenGui

-- ─── Main panel ───────────────────────────────────────────────────────────────
local panel = Instance.new("Frame")
panel.Name   = "ShopPanel"
panel.Size   = UDim2.new(0, 680, 0, 580)
panel.Position = UDim2.new(0.5,-340, 0.5,-290)
panel.BackgroundColor3 = Color3.fromRGB(12, 12, 18)
panel.BorderSizePixel = 0
panel.Visible = false
panel.Parent = screenGui
local pc = Instance.new("UICorner"); pc.CornerRadius=UDim.new(0,18); pc.Parent=panel

-- Title bar
local titleBar = Instance.new("Frame")
titleBar.Size = UDim2.new(1,0,0,56)
titleBar.BackgroundColor3 = Color3.fromRGB(140, 80, 20)
titleBar.BorderSizePixel = 0
titleBar.Parent = panel
local tc=Instance.new("UICorner");tc.CornerRadius=UDim.new(0,18);tc.Parent=titleBar

local titleLabel = Instance.new("TextLabel")
titleLabel.Size = UDim2.new(1,-70,1,0)
titleLabel.Position = UDim2.new(0,18,0,0)
titleLabel.Text = "🛒  STORM ISLE SHOP"
titleLabel.TextColor3 = Color3.fromRGB(255,255,255)
titleLabel.Font = Enum.Font.GothamBold
titleLabel.TextSize = 24
titleLabel.BackgroundTransparency = 1
titleLabel.TextXAlignment = Enum.TextXAlignment.Left
titleLabel.Parent = titleBar

local closeBtn = Instance.new("TextButton")
closeBtn.Size = UDim2.new(0,40,0,40)
closeBtn.Position = UDim2.new(1,-50,0,8)
closeBtn.Text = "✕"
closeBtn.TextSize = 20
closeBtn.TextColor3 = Color3.fromRGB(255,255,255)
closeBtn.BackgroundColor3 = Color3.fromRGB(200,50,50)
closeBtn.BorderSizePixel = 0
closeBtn.Font = Enum.Font.GothamBold
closeBtn.Parent = titleBar
local cbc=Instance.new("UICorner");cbc.CornerRadius=UDim.new(0,8);cbc.Parent=closeBtn

-- Tab bar
local tabBar = Instance.new("Frame")
tabBar.Size = UDim2.new(1,-16,0,40)
tabBar.Position = UDim2.new(0,8,0,64)
tabBar.BackgroundColor3 = Color3.fromRGB(25,20,35)
tabBar.BorderSizePixel = 0
tabBar.Parent = panel
local tab2=Instance.new("UICorner");tab2.CornerRadius=UDim.new(0,10);tab2.Parent=tabBar
local tabLayout=Instance.new("UIListLayout");tabLayout.FillDirection=Enum.FillDirection.Horizontal;tabLayout.Padding=UDim.new(0,6);tabLayout.Parent=tabBar;tabLayout.VerticalAlignment=Enum.VerticalAlignment.Center;tabLayout.HorizontalAlignment=Enum.HorizontalAlignment.Center

-- Content scroll frame
local contentFrame = Instance.new("ScrollingFrame")
contentFrame.Size = UDim2.new(1,-16,1,-116)
contentFrame.Position = UDim2.new(0,8,0,112)
contentFrame.BackgroundTransparency = 1
contentFrame.BorderSizePixel = 0
contentFrame.ScrollBarThickness = 6
contentFrame.ScrollBarImageColor3 = Color3.fromRGB(140,80,20)
contentFrame.Parent = panel

local contentGrid = Instance.new("UIGridLayout")
contentGrid.CellSize = UDim2.new(0,200,0,220)
contentGrid.CellPaddingSize = UDim2.new(0,10,0,10)
contentGrid.SortOrder = Enum.SortOrder.LayoutOrder
contentGrid.HorizontalAlignment = Enum.HorizontalAlignment.Center
contentGrid.Parent = contentFrame

-- ─── Helpers ─────────────────────────────────────────────────────────────────
local isOpen = false
local currentTab = "Featured"

local function clearContent()
	for _, c in ipairs(contentFrame:GetChildren()) do
		if c:IsA("Frame") then c:Destroy() end
	end
end

local rarityColors = {
	Common    = Color3.fromRGB(180,180,180),
	Rare      = Color3.fromRGB(60,130,255),
	Epic      = Color3.fromRGB(160,40,255),
	Legendary = Color3.fromRGB(255,185,0),
}

local function makeCard(parent, title, subtitle, price, priceLabel, bgColor, order, onBuy)
	local card = Instance.new("Frame")
	card.Size = UDim2.new(0,200,0,220)
	card.BackgroundColor3 = bgColor or Color3.fromRGB(25,20,40)
	card.BorderSizePixel = 0
	card.LayoutOrder = order
	card.Parent = parent
	local cc2=Instance.new("UICorner");cc2.CornerRadius=UDim.new(0,14);cc2.Parent=card

	-- Preview area
	local preview = Instance.new("Frame")
	preview.Size = UDim2.new(1,0,0,110)
	preview.BackgroundColor3 = bgColor and bgColor:Lerp(Color3.new(1,1,1),0.15) or Color3.fromRGB(40,35,60)
	preview.BorderSizePixel = 0
	preview.Parent = card
	local pc2=Instance.new("UICorner");pc2.CornerRadius=UDim.new(0,14);pc2.Parent=preview

	local iconLabel = Instance.new("TextLabel")
	iconLabel.Size = UDim2.new(1,0,1,0)
	iconLabel.Text = "⚡"  -- placeholder; replace with ImageLabel + asset
	iconLabel.TextSize = 48
	iconLabel.BackgroundTransparency = 1
	iconLabel.TextXAlignment = Enum.TextXAlignment.Center
	iconLabel.TextYAlignment = Enum.TextYAlignment.Center
	iconLabel.Parent = preview

	local titleL = Instance.new("TextLabel")
	titleL.Size = UDim2.new(1,-8,0,24)
	titleL.Position = UDim2.new(0,4,0,114)
	titleL.Text = title
	titleL.TextColor3 = Color3.fromRGB(255,255,255)
	titleL.Font = Enum.Font.GothamBold
	titleL.TextSize = 14
	titleL.BackgroundTransparency = 1
	titleL.TextXAlignment = Enum.TextXAlignment.Center
	titleL.TextWrapped = true
	titleL.Parent = card

	local subL = Instance.new("TextLabel")
	subL.Size = UDim2.new(1,-8,0,20)
	subL.Position = UDim2.new(0,4,0,136)
	subL.Text = subtitle
	subL.TextColor3 = Color3.fromRGB(180,180,200)
	subL.Font = Enum.Font.Gotham
	subL.TextSize = 11
	subL.BackgroundTransparency = 1
	subL.TextXAlignment = Enum.TextXAlignment.Center
	subL.TextWrapped = true
	subL.Parent = card

	local buyBtn = Instance.new("TextButton")
	buyBtn.Size = UDim2.new(1,-16,0,36)
	buyBtn.Position = UDim2.new(0,8,1,-44)
	buyBtn.Text = priceLabel or (price .. " 🔷")
	buyBtn.Font = Enum.Font.GothamBold
	buyBtn.TextSize = 14
	buyBtn.TextColor3 = Color3.fromRGB(255,255,255)
	buyBtn.BackgroundColor3 = Color3.fromRGB(0,120,215)
	buyBtn.BorderSizePixel = 0
	buyBtn.Parent = card
	local bbc=Instance.new("UICorner");bbc.CornerRadius=UDim.new(0,10);bbc.Parent=buyBtn

	buyBtn.Activated:Connect(onBuy)

	return card, iconLabel
end

-- ─── Tab content builders ──────────────────────────────────────────────────────
local function buildFeatured()
	clearContent()

	-- VIP Pass
	local _, icon1 = makeCard(contentFrame, "⭐ VIP PASS",
		"2x coins • +30 HP • Gold name tag",
		M.PRICE_VIP, M.PRICE_VIP .. " 🔷 Robux",
		Color3.fromRGB(40, 30, 10), 1,
		function()
			if M.PASS_VIP_ID == 0 then
				ShowNotif:FireClient and nil
				-- Fire server to prompt purchase
				PurchaseProduct:InvokeServer("GamePass", M.PASS_VIP_ID)
			else
				PurchaseProduct:InvokeServer("GamePass", M.PASS_VIP_ID)
			end
		end)
	icon1.Text = "👑"

	-- Starter Pack
	local _, icon2 = makeCard(contentFrame, "🎒 STARTER PACK",
		"Sword + Medkit at game start",
		M.PRICE_STARTER_PACK, M.PRICE_STARTER_PACK .. " 🔷 Robux",
		Color3.fromRGB(20, 40, 20), 2,
		function()
			PurchaseProduct:InvokeServer("GamePass", M.PASS_STARTER_PACK_ID)
		end)
	icon2.Text = "🎒"

	-- Lucky Chest
	local _, icon3 = makeCard(contentFrame, "🎁 LUCKY CHEST",
		"Random cosmetic skin — Rare to Legendary",
		M.PRICE_LUCKY_CHEST, M.PRICE_LUCKY_CHEST .. " 🔷 Robux",
		Color3.fromRGB(30, 20, 50), 3,
		function()
			PurchaseProduct:InvokeServer("DevProduct", M.PRODUCT_LUCKY_CHEST_ID)
		end)
	icon3.Text = "🎁"

	-- Coin Boost
	local _, icon4 = makeCard(contentFrame, "⚡ COIN BOOST",
		"3x coin earn for 1 hour",
		M.PRICE_COIN_BOOST, M.PRICE_COIN_BOOST .. " 🔷 Robux",
		Color3.fromRGB(40, 35, 10), 4,
		function()
			PurchaseProduct:InvokeServer("DevProduct", M.PRODUCT_COIN_BOOST_ID)
		end)
	icon4.Text = "⚡"

	contentFrame.CanvasSize = UDim2.new(0, 0, 0, math.ceil(4/3) * 230)
end

local function buildSkins()
	clearContent()
	for i, skin in ipairs(Config.SKINS) do
		local rColor = rarityColors[skin.rarity] or Color3.fromRGB(180,180,180)
		local card, icon = makeCard(contentFrame, skin.id,
			skin.rarity .. " Skin",
			skin.price, skin.price .. " coins",
			Color3.fromRGB(20,15,30), i,
			function()
				PurchaseProduct:InvokeServer("Skin", skin.id)
			end)
		icon.Text = "🧑"
		-- Tint preview to skin color
		local preview = card:FindFirstChild("Frame")
		if preview then preview.BackgroundColor3 = skin.bodyColor end
		-- Rarity badge
		local badge = Instance.new("TextLabel")
		badge.Size = UDim2.new(0,80,0,18)
		badge.Position = UDim2.new(0,8,0,8)
		badge.Text = skin.rarity:upper()
		badge.TextColor3 = rColor
		badge.Font = Enum.Font.GothamBold
		badge.TextSize = 11
		badge.BackgroundColor3 = Color3.fromRGB(10,10,10)
		badge.BackgroundTransparency = 0.3
		badge.ZIndex = 3
		badge.Parent = card
		local bc=Instance.new("UICorner");bc.CornerRadius=UDim.new(0,6);bc.Parent=badge
	end
	local rows = math.ceil(#Config.SKINS / 3)
	contentFrame.CanvasSize = UDim2.new(0,0,0,rows * 230)
end

-- ─── Tab buttons ──────────────────────────────────────────────────────────────
local tabs = {
	{ name = "Featured", builder = buildFeatured },
	{ name = "Skins",    builder = buildSkins },
}
local tabButtons = {}

for i, tab in ipairs(tabs) do
	local btn = Instance.new("TextButton")
	btn.Size = UDim2.new(0, 120, 0, 30)
	btn.Text = tab.name
	btn.Font = Enum.Font.GothamBold
	btn.TextSize = 14
	btn.BackgroundColor3 = Color3.fromRGB(50,40,70)
	btn.TextColor3 = Color3.fromRGB(200,200,200)
	btn.BorderSizePixel = 0
	btn.Parent = tabBar
	local bc2=Instance.new("UICorner");bc2.CornerRadius=UDim.new(0,8);bc2.Parent=btn
	tabButtons[i] = btn

	btn.Activated:Connect(function()
		currentTab = tab.name
		for j, b in ipairs(tabButtons) do
			if j == i then
				b.BackgroundColor3 = Color3.fromRGB(140,80,20)
				b.TextColor3 = Color3.fromRGB(255,255,255)
			else
				b.BackgroundColor3 = Color3.fromRGB(50,40,70)
				b.TextColor3 = Color3.fromRGB(200,200,200)
			end
		end
		tab.builder()
	end)
end
-- Default: first tab active
tabButtons[1].BackgroundColor3 = Color3.fromRGB(140,80,20)
tabButtons[1].TextColor3 = Color3.fromRGB(255,255,255)

-- ─── Open / Close ─────────────────────────────────────────────────────────────
local function open()
	if isOpen then return end
	isOpen = true
	buildFeatured()
	backdrop.Visible = true
	panel.Visible = true
	panel.Position = UDim2.new(0.5,-340,0.5,-290)
	panel.Size = UDim2.new(0,680,0,0)
	TweenService:Create(panel, TweenInfo.new(0.3,Enum.EasingStyle.Back), {Size=UDim2.new(0,680,0,580)}):Play()
end

local function close()
	if not isOpen then return end
	isOpen = false
	TweenService:Create(panel, TweenInfo.new(0.2), {Size=UDim2.new(0,680,0,0)}):Play()
	task.delay(0.22, function()
		panel.Visible = false
		backdrop.Visible = false
	end)
end

closeBtn.Activated:Connect(close)
backdrop.InputBegan:Connect(function(input)
	if input.UserInputType == Enum.UserInputType.MouseButton1 then close() end
end)

UserInputService.InputBegan:Connect(function(input, processed)
	if processed then return end
	if input.KeyCode == Enum.KeyCode.P then
		if isOpen then close() else open() end
	end
	if input.KeyCode == Enum.KeyCode.Escape and isOpen then close() end
end)

OpenShop.OnClientEvent:Connect(function()
	if not isOpen then open() end
end)

-- ─── Shop button in top-right HUD (always visible) ────────────────────────────
local shopBtn = Instance.new("TextButton")
shopBtn.Size = UDim2.new(0,110,0,36)
shopBtn.Position = UDim2.new(1,-126,0,60)
shopBtn.Text = "🛒 SHOP [P]"
shopBtn.Font = Enum.Font.GothamBold
shopBtn.TextSize = 13
shopBtn.TextColor3 = Color3.fromRGB(255,255,255)
shopBtn.BackgroundColor3 = Color3.fromRGB(140,80,20)
shopBtn.BorderSizePixel = 0
shopBtn.Parent = screenGui
local sbc=Instance.new("UICorner");sbc.CornerRadius=UDim.new(0,10);sbc.Parent=shopBtn
shopBtn.Activated:Connect(function() if isOpen then close() else open() end end)

print("[ShopGui] Loaded.")
