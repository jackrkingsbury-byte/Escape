-- Shared game configuration for Storm Isle: Last Survivor
local GameConfig = {}

GameConfig.PHASES = {
	LOBBY     = "Lobby",
	COUNTDOWN = "Countdown",
	PLAYING   = "Playing",
	ENDED     = "Ended",
}

GameConfig.TIMING = {
	LOBBY_DURATION      = 30,   -- seconds to wait for players
	COUNTDOWN_DURATION  = 10,   -- pre-game countdown
	MAX_GAME_DURATION   = 600,  -- 10-minute hard cap
	STORM_DELAY         = 90,   -- storm begins at 90s
	STORM_TICK_INTERVAL = 2,    -- shrink check every 2s
	WIN_DISPLAY_TIME    = 8,    -- seconds to show winner screen
}

GameConfig.MAP = {
	CENTER              = Vector3.new(0, 50, 0),
	INITIAL_SAFE_RADIUS = 550,
	FINAL_SAFE_RADIUS   = 35,
	SHRINK_PER_TICK     = 4,    -- studs per tick
	STORM_DAMAGE_PER_SEC = 8,
	PARACHUTE_HEIGHT    = 300,
}

GameConfig.PLAYER = {
	MAX_HEALTH           = 100,
	VIP_BONUS_HEALTH     = 30,
	MAX_HUNGER           = 100,
	HUNGER_DRAIN         = 0.25, -- per second
	STARVING_THRESHOLD   = 15,
	STARVING_DAMAGE      = 3,    -- damage/sec when starving
	WALKSPEED_BASE       = 16,
	WALKSPEED_STARVING   = 10,
	RESPAWN_DISABLED     = true, -- no respawn; last alive wins
}

GameConfig.ECONOMY = {
	KILL_REWARD              = 50,
	PLACEMENT_REWARDS        = {500, 250, 125, 75, 50},
	SURVIVAL_PER_MINUTE      = 10,
	STARTING_COINS           = 0,
	VIP_COIN_MULTIPLIER      = 2.0,
	COIN_BOOST_MULTIPLIER    = 3.0,
	COIN_BOOST_DURATION      = 3600,
}

-- !! Replace IDs with yours from Creator Hub after uploading !!
GameConfig.MONETIZATION = {
	PASS_VIP_ID            = 0,  -- Game Pass ID
	PASS_STARTER_PACK_ID   = 0,  -- Game Pass ID
	PRODUCT_LUCKY_CHEST_ID = 0,  -- Developer Product ID
	PRODUCT_COIN_BOOST_ID  = 0,  -- Developer Product ID

	-- Display prices (Robux) — set the real price in Creator Hub
	PRICE_VIP              = 399,
	PRICE_STARTER_PACK     = 149,
	PRICE_LUCKY_CHEST      = 49,
	PRICE_COIN_BOOST       = 79,
}

GameConfig.CRAFTING = {
	Sword = {
		ingredients = { Wood = 3, Stone = 2 },
		description = "A solid melee weapon. 35 damage per hit.",
		damage      = 35,
		icon        = "rbxassetid://0",
	},
	Bow = {
		ingredients = { Wood = 5, Vine = 2 },
		description = "Ranged attacker. 25 damage, 80 stud range.",
		damage      = 25,
		range       = 80,
		icon        = "rbxassetid://0",
	},
	Campfire = {
		ingredients = { Wood = 4, Stone = 1 },
		description = "Restores 40 hunger when you sit nearby.",
		healHunger  = 40,
		icon        = "rbxassetid://0",
	},
	WoodWall = {
		ingredients = { Wood = 8 },
		description = "Temporary cover with 200 HP.",
		wallHealth  = 200,
		icon        = "rbxassetid://0",
	},
	Medkit = {
		ingredients = { Berries = 4, Vine = 2 },
		description = "Instantly restores 60 health.",
		healHealth  = 60,
		icon        = "rbxassetid://0",
	},
	SpeedPotion = {
		ingredients = { Berries = 2, Mushroom = 3 },
		description = "Boosts walkspeed x1.5 for 30 seconds.",
		speedMult   = 1.5,
		duration    = 30,
		icon        = "rbxassetid://0",
	},
}

GameConfig.LOOT_SPAWNS = {
	-- Weighted table: higher weight = more common
	{ item = "Wood",    weight = 30 },
	{ item = "Stone",   weight = 25 },
	{ item = "Berries", weight = 20 },
	{ item = "Vine",    weight = 15 },
	{ item = "Mushroom",weight = 10 },
	{ item = "Sword",   weight = 8  },
	{ item = "Bow",     weight = 5  },
	{ item = "Medkit",  weight = 4  },
}

-- Cosmetic skins available from the shop or lucky chest
GameConfig.SKINS = {
	{ id = "Inferno",    rarity = "Rare",      price = 300,  bodyColor = Color3.fromRGB(200, 50, 0)   },
	{ id = "Arctic",     rarity = "Rare",      price = 300,  bodyColor = Color3.fromRGB(180, 220, 255) },
	{ id = "Void",       rarity = "Epic",      price = 600,  bodyColor = Color3.fromRGB(60, 0, 120)   },
	{ id = "Gilded",     rarity = "Epic",      price = 600,  bodyColor = Color3.fromRGB(220, 180, 0)  },
	{ id = "Celestial",  rarity = "Legendary", price = 1200, bodyColor = Color3.fromRGB(100, 200, 255) },
	{ id = "Shadowborn",rarity = "Legendary", price = 1200, bodyColor = Color3.fromRGB(20, 20, 40)   },
}

-- Lucky Chest pull weights
GameConfig.CHEST_WEIGHTS = {
	Common    = 55,
	Rare      = 30,
	Epic      = 12,
	Legendary = 3,
}

return GameConfig
