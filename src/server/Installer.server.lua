-- Installer: auto-creates all RemoteEvents / RemoteFunctions at runtime.
-- This means you do NOT have to manually make the "Remotes" folder in Studio.
-- Paste this script into ServerScriptService and it sets everything up on start.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Create (or find) the Remotes folder
local remotes = ReplicatedStorage:FindFirstChild("Remotes")
if not remotes then
	remotes = Instance.new("Folder")
	remotes.Name = "Remotes"
	remotes.Parent = ReplicatedStorage
end

-- All RemoteEvents the game uses
local events = {
	"UpdateHUD",
	"GamePhaseChanged",
	"StormUpdate",
	"ShowNotification",
	"UpdateInventory",
	"CraftItem",
	"OpenShop",
	"PlayerDied",
	"PlayerWon",
	"UpdateLeaderboard",
}

for _, name in ipairs(events) do
	if not remotes:FindFirstChild(name) then
		local ev = Instance.new("RemoteEvent")
		ev.Name = name
		ev.Parent = remotes
	end
end

-- RemoteFunctions
local functions = {
	"PurchaseProduct",
}

for _, name in ipairs(functions) do
	if not remotes:FindFirstChild(name) then
		local fn = Instance.new("RemoteFunction")
		fn.Name = name
		fn.Parent = remotes
	end
end

print("[Installer] Remotes ready — all RemoteEvents/RemoteFunctions created.")
