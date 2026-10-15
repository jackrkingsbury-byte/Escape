-- CraftingGui: open with [C] key, shows recipes and current inventory
local Players        = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")
local TweenService   = game:GetService("TweenService")

local player  = Players.LocalPlayer
local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local Shared  = ReplicatedStorage:WaitForChild("Shared")

local CraftItem    = Remotes:WaitForChild("CraftItem")
local UpdateInv    = Remotes:WaitForChild("UpdateInventory")
local ShowNotif    = Remotes:WaitForChild("ShowNotification")
local Config       = require(Shared:WaitForChild("GameConfig"))

-- ─── State ────────────────────────────────────────────────────────────────────
local inventory = {}
local isOpen    = false

-- ─── Build UI ─────────────────────────────────────────────────────────────────
local screenGui = Instance.new("ScreenGui")
screenGui.Name         = "CraftingGui"
screenGui.ResetOnSpawn = false
screenGui.DisplayOrder = 15
screenGui.Parent       = player.PlayerGui

local panel = Instance.new("Frame")
panel.Name   = "CraftingPanel"
panel.Size   = UDim2.new(0, 500, 0, 520)
panel.Position = UDim2.new(0.5, -250, 0.5, -260)
panel.BackgroundColor3 = Color3.fromRGB(15, 15, 20)
panel.BackgroundTransparency = 0.05
panel.BorderSizePixel = 0
panel.Visible = false
panel.Parent  = screenGui

local corner = Instance.new("UICorner")
corner.CornerRadius = UDim.new(0, 16)
corner.Parent = panel

-- Title bar
local titleBar = Instance.new("Frame")
titleBar.Size  = UDim2.new(1, 0, 0, 50)
titleBar.BackgroundColor3 = Color3.fromRGB(80, 30, 130)
titleBar.BorderSizePixel = 0
titleBar.Parent = panel
local titleCorner = Instance.new("UICorner"); titleCorner.CornerRadius=UDim.new(0,16); titleCorner.Parent=titleBar

local titleLabel = Instance.new("TextLabel")
titleLabel.Size = UDim2.new(1,-60,1,0)
titleLabel.Position = UDim2.new(0,16,0,0)
titleLabel.Text = "⚒  CRAFTING"
titleLabel.TextColor3 = Color3.fromRGB(255,255,255)
titleLabel.Font = Enum.Font.GothamBold
titleLabel.TextSize = 22
titleLabel.BackgroundTransparency = 1
titleLabel.TextXAlignment = Enum.TextXAlignment.Left
titleLabel.Parent = titleBar

local closeBtn = Instance.new("TextButton")
closeBtn.Size = UDim2.new(0,36,0,36)
closeBtn.Position = UDim2.new(1,-46,0,7)
closeBtn.Text = "✕"
closeBtn.TextSize = 18
closeBtn.TextColor3 = Color3.fromRGB(255,255,255)
closeBtn.BackgroundColor3 = Color3.fromRGB(180,50,50)
closeBtn.BorderSizePixel = 0
closeBtn.Font = Enum.Font.GothamBold
closeBtn.Parent = titleBar
local cc=Instance.new("UICorner");cc.CornerRadius=UDim.new(0,8);cc.Parent=closeBtn

-- Inventory strip
local invStrip = Instance.new("Frame")
invStrip.Size = UDim2.new(1,-16,0,60)
invStrip.Position = UDim2.new(0,8,0,58)
invStrip.BackgroundColor3 = Color3.fromRGB(25,25,35)
invStrip.BorderSizePixel = 0
invStrip.Parent = panel
local is2=Instance.new("UICorner");is2.CornerRadius=UDim.new(0,10);is2.Parent=invStrip

local invLabel = Instance.new("TextLabel")
invLabel.Name = "InvLabel"
invLabel.Size = UDim2.new(1,-8,1,0)
invLabel.Position = UDim2.new(0,8,0,0)
invLabel.Text = "Inventory: (empty)"
invLabel.TextColor3 = Color3.fromRGB(200,200,200)
invLabel.Font = Enum.Font.Gotham
invLabel.TextSize = 13
invLabel.TextWrapped = true
invLabel.BackgroundTransparency = 1
invLabel.TextXAlignment = Enum.TextXAlignment.Left
invLabel.TextYAlignment = Enum.TextYAlignment.Center
invLabel.Parent = invStrip

-- Recipe scroll
local scrollFrame = Instance.new("ScrollingFrame")
scrollFrame.Size = UDim2.new(1,-16,1,-140)
scrollFrame.Position = UDim2.new(0,8,0,126)
scrollFrame.BackgroundTransparency = 1
scrollFrame.BorderSizePixel = 0
scrollFrame.ScrollBarThickness = 6
scrollFrame.ScrollBarImageColor3 = Color3.fromRGB(100,60,180)
scrollFrame.Parent = panel

local listLayout = Instance.new("UIListLayout")
listLayout.SortOrder = Enum.SortOrder.LayoutOrder
listLayout.Padding = UDim.new(0,8)
listLayout.Parent = scrollFrame

-- ─── Update inventory display ──────────────────────────────────────────────────
local function refreshInvLabel()
	if next(inventory) == nil then
		invLabel.Text = "Inventory: (empty)"
		return
	end
	local parts = {}
	for item, qty in pairs(inventory) do
		table.insert(parts, item .. " x" .. qty)
	end
	invLabel.Text = "Inventory: " .. table.concat(parts, "  |  ")
end

-- ─── Build recipe cards ────────────────────────────────────────────────────────
local recipeCards = {}

local function canCraft(ingredients)
	for item, qty in pairs(ingredients) do
		if (inventory[item] or 0) < qty then return false end
	end
	return true
end

local function buildRecipeCards()
	for _, child in ipairs(scrollFrame:GetChildren()) do
		if child:IsA("Frame") then child:Destroy() end
	end
	recipeCards = {}

	local order = 0
	for recipeName, recipe in pairs(Config.CRAFTING) do
		order = order + 1
		local card = Instance.new("Frame")
		card.Size = UDim2.new(1,0,0,80)
		card.BackgroundColor3 = Color3.fromRGB(25,20,40)
		card.BorderSizePixel = 0
		card.LayoutOrder = order
		card.Parent = scrollFrame
		local cc2=Instance.new("UICorner");cc2.CornerRadius=UDim.new(0,10);cc2.Parent=card

		local nameLabel = Instance.new("TextLabel")
		nameLabel.Size = UDim2.new(0.55,0,0,28)
		nameLabel.Position = UDim2.new(0,10,0,8)
		nameLabel.Text = recipeName
		nameLabel.TextColor3 = Color3.fromRGB(255,255,255)
		nameLabel.Font = Enum.Font.GothamBold
		nameLabel.TextSize = 16
		nameLabel.BackgroundTransparency = 1
		nameLabel.TextXAlignment = Enum.TextXAlignment.Left
		nameLabel.Parent = card

		local descLabel = Instance.new("TextLabel")
		descLabel.Size = UDim2.new(0.55,0,0,22)
		descLabel.Position = UDim2.new(0,10,0,36)
		descLabel.Text = recipe.description or ""
		descLabel.TextColor3 = Color3.fromRGB(160,160,180)
		descLabel.Font = Enum.Font.Gotham
		descLabel.TextSize = 12
		descLabel.BackgroundTransparency = 1
		descLabel.TextXAlignment = Enum.TextXAlignment.Left
		descLabel.TextWrapped = true
		descLabel.Parent = card

		-- Ingredients
		local ingParts = {}
		for item, qty in pairs(recipe.ingredients) do
			table.insert(ingParts, qty .. "x " .. item)
		end
		local ingLabel = Instance.new("TextLabel")
		ingLabel.Size = UDim2.new(0.55,0,0,18)
		ingLabel.Position = UDim2.new(0,10,0,58)
		ingLabel.Text = table.concat(ingParts, ", ")
		ingLabel.TextColor3 = Color3.fromRGB(120,220,120)
		ingLabel.Font = Enum.Font.Gotham
		ingLabel.TextSize = 12
		ingLabel.BackgroundTransparency = 1
		ingLabel.TextXAlignment = Enum.TextXAlignment.Left
		ingLabel.Parent = card

		-- Craft button
		local craftBtn = Instance.new("TextButton")
		craftBtn.Name = "CraftBtn"
		craftBtn.Size = UDim2.new(0,120,0,44)
		craftBtn.Position = UDim2.new(1,-130,0.5,-22)
		craftBtn.Font = Enum.Font.GothamBold
		craftBtn.TextSize = 15
		craftBtn.BorderSizePixel = 0
		craftBtn.Parent = card
		local cbc=Instance.new("UICorner");cbc.CornerRadius=UDim.new(0,10);cbc.Parent=craftBtn

		local function refreshCard()
			if canCraft(recipe.ingredients) then
				craftBtn.Text = "CRAFT"
				craftBtn.BackgroundColor3 = Color3.fromRGB(60,180,80)
				craftBtn.TextColor3 = Color3.fromRGB(255,255,255)
				craftBtn.Active = true
			else
				craftBtn.Text = "NEED MORE"
				craftBtn.BackgroundColor3 = Color3.fromRGB(60,60,60)
				craftBtn.TextColor3 = Color3.fromRGB(140,140,140)
				craftBtn.Active = false
			end
		end
		refreshCard()
		table.insert(recipeCards, { refresh = refreshCard })

		craftBtn.Activated:Connect(function()
			if not canCraft(recipe.ingredients) then return end
			CraftItem:FireServer(recipeName)
		end)
	end

	-- Update canvas size
	local totalHeight = order * 88
	scrollFrame.CanvasSize = UDim2.new(0,0,0,totalHeight)
end

-- ─── Show/Hide ────────────────────────────────────────────────────────────────
local function open()
	if isOpen then return end
	isOpen = true
	buildRecipeCards()
	panel.Visible = true
	panel.Size = UDim2.new(0,500,0,0)
	TweenService:Create(panel, TweenInfo.new(0.25, Enum.EasingStyle.Back), {Size=UDim2.new(0,500,0,520)}):Play()
end

local function close()
	if not isOpen then return end
	isOpen = false
	TweenService:Create(panel, TweenInfo.new(0.2, Enum.EasingStyle.Quad), {Size=UDim2.new(0,500,0,0)}):Play()
	task.delay(0.22, function() panel.Visible = false end)
end

closeBtn.Activated:Connect(close)

UserInputService.InputBegan:Connect(function(input, processed)
	if processed then return end
	if input.KeyCode == Enum.KeyCode.C then
		if isOpen then close() else open() end
	end
	if input.KeyCode == Enum.KeyCode.Escape and isOpen then close() end
end)

-- ─── Inventory updates ────────────────────────────────────────────────────────
UpdateInv.OnClientEvent:Connect(function(inv)
	inventory = inv or {}
	refreshInvLabel()
	-- Refresh craft button states
	for _, card in ipairs(recipeCards) do
		card.refresh()
	end
end)

-- Hint label
local hintLabel = Instance.new("TextLabel")
hintLabel.Size = UDim2.new(0,200,0,30)
hintLabel.Position = UDim2.new(0,16,1,-48)
hintLabel.Text = "Press [C] to craft"
hintLabel.TextColor3 = Color3.fromRGB(160,160,160)
hintLabel.Font = Enum.Font.Gotham
hintLabel.TextSize = 13
hintLabel.BackgroundTransparency = 1
hintLabel.Parent = screenGui

print("[CraftingGui] Loaded.")
