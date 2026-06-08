-- Item definitions: resources, weapons, consumables
local ItemData = {}

ItemData.RESOURCES = {
	Wood    = { displayName = "Wood",     stackMax = 99, icon = "rbxassetid://0" },
	Stone   = { displayName = "Stone",    stackMax = 99, icon = "rbxassetid://0" },
	Berries = { displayName = "Berries",  stackMax = 99, icon = "rbxassetid://0" },
	Vine    = { displayName = "Vine",     stackMax = 99, icon = "rbxassetid://0" },
	Mushroom= { displayName = "Mushroom", stackMax = 99, icon = "rbxassetid://0" },
}

ItemData.WEAPONS = {
	Sword = {
		displayName = "Sword",
		damage      = 35,
		cooldown    = 0.6,
		range       = 5,
		icon        = "rbxassetid://0",
		toolHandle  = "SwordHandle",
	},
	Bow = {
		displayName = "Bow",
		damage      = 25,
		cooldown    = 1.2,
		range       = 80,
		projectile  = "Arrow",
		icon        = "rbxassetid://0",
		toolHandle  = "BowHandle",
	},
	Fists = {
		displayName = "Fists",
		damage      = 10,
		cooldown    = 0.8,
		range       = 4,
		icon        = "rbxassetid://0",
		toolHandle  = nil,
	},
}

ItemData.CONSUMABLES = {
	Medkit = {
		displayName = "Medkit",
		healHealth  = 60,
		useTime     = 2.5,
		icon        = "rbxassetid://0",
	},
	Campfire = {
		displayName = "Campfire",
		healHunger  = 40,
		placeable   = true,
		icon        = "rbxassetid://0",
	},
	SpeedPotion = {
		displayName = "Speed Potion",
		speedMult   = 1.5,
		duration    = 30,
		useTime     = 1.0,
		icon        = "rbxassetid://0",
	},
}

ItemData.STRUCTURES = {
	WoodWall = {
		displayName = "Wood Wall",
		health      = 200,
		material    = Enum.Material.Wood,
		color       = Color3.fromRGB(150, 100, 50),
		size        = Vector3.new(8, 6, 1),
	},
}

-- How much a resource node drops when destroyed
ItemData.NODE_DROPS = {
	TreeNode  = { resource = "Wood",    min = 3, max = 6 },
	RockNode  = { resource = "Stone",   min = 2, max = 5 },
	BushNode  = { resource = "Berries", min = 2, max = 4 },
	VineNode  = { resource = "Vine",    min = 2, max = 4 },
	ShroomNode= { resource = "Mushroom",min = 1, max = 3 },
}

return ItemData
