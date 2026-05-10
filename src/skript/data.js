// Skript syntax database for SkStudio
// Compatible with modern Skript (2.9+) targeting Minecraft 1.20+
// Each entry: { label, detail, doc, snippet, category, since? }

export const EVENTS = [
  // Player
  { label: "on join", detail: "event", doc: "Called when a player joins the server.", snippet: "on join:\n\t$0", category: "player" },
  { label: "on first join", detail: "event", doc: "Called the first time a player joins the server.", snippet: "on first join:\n\t$0", category: "player" },
  { label: "on quit", detail: "event", doc: "Called when a player leaves the server.", snippet: "on quit:\n\t$0", category: "player" },
  { label: "on disconnect", detail: "event", doc: "Alias for on quit.", snippet: "on disconnect:\n\t$0", category: "player" },
  { label: "on chat", detail: "event", doc: "Called when a player sends a chat message.", snippet: "on chat:\n\t$0", category: "player" },
  { label: "on command", detail: "event", doc: "Called when a player runs a command.", snippet: "on command:\n\t$0", category: "player" },
  { label: "on death", detail: "event", doc: "Called when an entity dies. Filter with `on death of player`.", snippet: "on death${1: of ${2:player}}:\n\t$0", category: "player" },
  { label: "on respawn", detail: "event", doc: "Called when a player respawns.", snippet: "on respawn:\n\t$0", category: "player" },
  { label: "on damage", detail: "event", doc: "Called when an entity takes damage.", snippet: "on damage:\n\t$0", category: "player" },
  { label: "on player teleport", detail: "event", doc: "Called when a player teleports.", snippet: "on player teleport:\n\t$0", category: "player" },
  { label: "on world change", detail: "event", doc: "Called when a player switches worlds.", snippet: "on world change:\n\t$0", category: "player" },
  { label: "on sneak toggle", detail: "event", doc: "Called when a player starts/stops sneaking.", snippet: "on sneak toggle:\n\t$0", category: "player" },
  { label: "on sprint toggle", detail: "event", doc: "Called when a player starts/stops sprinting.", snippet: "on sprint toggle:\n\t$0", category: "player" },
  { label: "on flight toggle", detail: "event", doc: "Called when a player toggles flight.", snippet: "on flight toggle:\n\t$0", category: "player" },
  { label: "on swap hands", detail: "event", doc: "Called when a player swaps items between hands (F key).", snippet: "on swap hands:\n\t$0", category: "player" },
  { label: "on item drop", detail: "event", doc: "Called when a player drops an item.", snippet: "on item drop:\n\t$0", category: "player" },
  { label: "on item pickup", detail: "event", doc: "Called when a player picks up an item.", snippet: "on item pickup:\n\t$0", category: "player" },

  // Click events
  { label: "on click", detail: "event", doc: "Called when a player clicks.", snippet: "on click:\n\t$0", category: "interaction" },
  { label: "on right click", detail: "event", doc: "Called when a player right clicks.", snippet: "on right click${1: on ${2:block}}:\n\t$0", category: "interaction" },
  { label: "on left click", detail: "event", doc: "Called when a player left clicks.", snippet: "on left click${1: on ${2:block}}:\n\t$0", category: "interaction" },
  { label: "on inventory click", detail: "event", doc: "Called when a player clicks in an inventory.", snippet: "on inventory click:\n\t$0", category: "interaction" },
  { label: "on inventory close", detail: "event", doc: "Called when a player closes an inventory.", snippet: "on inventory close:\n\t$0", category: "interaction" },
  { label: "on inventory open", detail: "event", doc: "Called when a player opens an inventory.", snippet: "on inventory open:\n\t$0", category: "interaction" },

  // Block / world
  { label: "on break", detail: "event", doc: "Called when a block is broken.", snippet: "on break${1: of ${2:stone}}:\n\t$0", category: "world" },
  { label: "on place", detail: "event", doc: "Called when a block is placed.", snippet: "on place${1: of ${2:stone}}:\n\t$0", category: "world" },
  { label: "on block update", detail: "event", doc: "Called when a block updates.", snippet: "on block update:\n\t$0", category: "world" },
  { label: "on explode", detail: "event", doc: "Called when something explodes.", snippet: "on explode:\n\t$0", category: "world" },
  { label: "on burn", detail: "event", doc: "Called when a block burns up.", snippet: "on burn:\n\t$0", category: "world" },
  { label: "on grow", detail: "event", doc: "Called when a plant/tree grows.", snippet: "on grow:\n\t$0", category: "world" },

  // Server
  { label: "on load", detail: "event", doc: "Called when the script loads.", snippet: "on load:\n\t$0", category: "server" },
  { label: "on unload", detail: "event", doc: "Called when the script unloads.", snippet: "on unload:\n\t$0", category: "server" },
  { label: "on enable", detail: "event", doc: "Called when a script is enabled.", snippet: "on enable:\n\t$0", category: "server" },
  { label: "on disable", detail: "event", doc: "Called when a script is disabled.", snippet: "on disable:\n\t$0", category: "server" },
  { label: "every", detail: "event", doc: "Periodic event. Example: `every 5 seconds`.", snippet: "every ${1:5} ${2|seconds,minutes,ticks,hours|}:\n\t$0", category: "server" },

  // Entity / Combat
  { label: "on entity spawn", detail: "event", doc: "Called when an entity spawns.", snippet: "on entity spawn:\n\t$0", category: "entity" },
  { label: "on entity death", detail: "event", doc: "Called when any entity dies.", snippet: "on entity death:\n\t$0", category: "entity" },
  { label: "on shoot", detail: "event", doc: "Called when an entity shoots a projectile.", snippet: "on shoot:\n\t$0", category: "entity" },
  { label: "on projectile hit", detail: "event", doc: "Called when a projectile hits something.", snippet: "on projectile hit:\n\t$0", category: "entity" },
];

export const EFFECTS = [
  // Messaging — most common
  { label: "send", detail: "effect", doc: "Sends a message to a player or set of players.", snippet: 'send "${1:message}" to ${2:player}', category: "messaging" },
  { label: "broadcast", detail: "effect", doc: "Broadcasts a message to all players.", snippet: 'broadcast "${1:message}"', category: "messaging" },
  { label: "send title", detail: "effect", doc: "Sends a title to a player.", snippet: 'send title "${1:title}" with subtitle "${2:subtitle}" to ${3:player}', category: "messaging" },
  { label: "send action bar", detail: "effect", doc: "Sends an action bar message.", snippet: 'send action bar "${1:text}" to ${2:player}', category: "messaging" },

  // Variables / state
  { label: "set", detail: "effect", doc: "Sets a variable or property to a value.", snippet: "set ${1:thing} to ${2:value}", category: "variables" },
  { label: "add", detail: "effect", doc: "Adds a value to a variable, list, or property.", snippet: "add ${1:value} to ${2:thing}", category: "variables" },
  { label: "remove", detail: "effect", doc: "Removes a value from a variable, list, or property.", snippet: "remove ${1:value} from ${2:thing}", category: "variables" },
  { label: "delete", detail: "effect", doc: "Deletes a variable.", snippet: "delete ${1:variable}", category: "variables" },
  { label: "clear", detail: "effect", doc: "Clears a variable or list.", snippet: "clear ${1:thing}", category: "variables" },

  // Movement — preferred high-level over manual velocity
  {
    label: "push",
    detail: "effect",
    doc: "Pushes an entity in a direction at a speed. **Prefer this over manually setting velocity** — cleaner syntax and handles edge cases.\n\nExample: `push player upwards at speed 1`",
    snippet: "push ${1:player} ${2|upwards,downwards,forwards,backwards,north,south,east,west|} at speed ${3:1}",
    category: "movement",
    smart: true,
  },
  { label: "teleport", detail: "effect", doc: "Teleports an entity to a location.", snippet: "teleport ${1:player} to ${2:location}", category: "movement" },
  { label: "force", detail: "effect", doc: "Forces an entity to do something (walk, swim, etc.).", snippet: "force ${1:player} to walk", category: "movement" },
  { label: "launch", detail: "effect", doc: "Launches a projectile or entity.", snippet: "launch ${1:arrow} from ${2:player} at speed ${3:2}", category: "movement" },

  // Inventory
  { label: "give", detail: "effect", doc: "Gives an item to a player.", snippet: "give ${1:player} ${2:1} ${3:diamond}", category: "inventory" },
  { label: "take", detail: "effect", doc: "Takes an item from a player.", snippet: "take ${1:1} ${2:diamond} from ${3:player}", category: "inventory" },
  { label: "equip", detail: "effect", doc: "Equips a piece of armor.", snippet: "equip ${1:player} with ${2:diamond chestplate}", category: "inventory" },
  { label: "drop", detail: "effect", doc: "Drops items at a location.", snippet: "drop ${1:diamond} at ${2:location}", category: "inventory" },

  // Health / state
  { label: "heal", detail: "effect", doc: "Heals an entity to full or by amount.", snippet: "heal ${1:player}", category: "stats" },
  { label: "damage", detail: "effect", doc: "Damages an entity.", snippet: "damage ${1:player} by ${2:5}", category: "stats" },
  { label: "kill", detail: "effect", doc: "Kills an entity.", snippet: "kill ${1:entity}", category: "stats" },
  { label: "feed", detail: "effect", doc: "Restores food/saturation.", snippet: "feed ${1:player}", category: "stats" },

  // Effects / particles / sound
  { label: "apply", detail: "effect", doc: "Applies a potion effect.", snippet: "apply ${1:speed} ${2:1} to ${3:player} for ${4:10 seconds}", category: "effects" },
  { label: "play sound", detail: "effect", doc: "Plays a sound to a player.", snippet: 'play sound "${1:entity.player.levelup}" to ${2:player}', category: "effects" },
  { label: "spawn particle", detail: "effect", doc: "Spawns particles at a location.", snippet: "spawn ${1:1} of ${2:flame} at ${3:location}", category: "effects" },

  // Block / world
  { label: "set block", detail: "effect", doc: "Sets a block at a location.", snippet: "set block at ${1:location} to ${2:stone}", category: "world" },
  { label: "spawn", detail: "effect", doc: "Spawns an entity at a location.", snippet: "spawn ${1:zombie} at ${2:location}", category: "world" },
  { label: "make", detail: "effect", doc: "Makes an entity do something.", snippet: "make ${1:player} ${2:say} \"${3:hello}\"", category: "world" },

  // Control flow
  { label: "wait", detail: "effect", doc: "Pauses execution. Example: `wait 1 second`.", snippet: "wait ${1:1} ${2|second,seconds,tick,ticks,minute,minutes|}", category: "control" },
  { label: "stop", detail: "effect", doc: "Stops the trigger.", snippet: "stop", category: "control" },
  { label: "exit", detail: "effect", doc: "Exits a loop.", snippet: "exit ${1:loop}", category: "control" },
  { label: "cancel event", detail: "effect", doc: "Cancels the event.", snippet: "cancel event", category: "control" },
  { label: "execute", detail: "effect", doc: "Executes a command as a player or console.", snippet: 'execute ${1:player} command "/${2:say hi}"', category: "control" },
];

export const CONDITIONS = [
  { label: "is", detail: "condition", doc: "Checks equality.", snippet: "${1:player} is ${2:op}", category: "comparison" },
  { label: "is not", detail: "condition", doc: "Checks inequality.", snippet: "${1:player} is not ${2:op}", category: "comparison" },
  { label: "contains", detail: "condition", doc: "Checks if a list/string contains a value.", snippet: "${1:list} contains ${2:value}", category: "comparison" },
  { label: "has permission", detail: "condition", doc: "Checks if a player has a permission.", snippet: '${1:player} has permission "${2:perm.node}"', category: "permission" },
  { label: "is online", detail: "condition", doc: "Checks if a player is online.", snippet: "${1:player} is online", category: "player" },
  { label: "is op", detail: "condition", doc: "Checks if a player is an operator.", snippet: "${1:player} is op", category: "player" },
  { label: "is sneaking", detail: "condition", doc: "Checks if a player is sneaking.", snippet: "${1:player} is sneaking", category: "player" },
  { label: "is sprinting", detail: "condition", doc: "Checks if a player is sprinting.", snippet: "${1:player} is sprinting", category: "player" },
  { label: "is flying", detail: "condition", doc: "Checks if a player is flying.", snippet: "${1:player} is flying", category: "player" },
  { label: "can fly", detail: "condition", doc: "Checks if a player can fly.", snippet: "${1:player} can fly", category: "player" },
  { label: "is holding", detail: "condition", doc: "Checks if a player is holding an item.", snippet: "${1:player} is holding ${2:diamond}", category: "inventory" },
  { label: "has", detail: "condition", doc: "Checks if a player has an item.", snippet: "${1:player} has ${2:diamond}", category: "inventory" },
  { label: "is set", detail: "condition", doc: "Checks if a variable is set.", snippet: "{${1:var}} is set", category: "variables" },
  { label: "exists", detail: "condition", doc: "Checks if something exists.", snippet: "${1:thing} exists", category: "general" },
];

export const EXPRESSIONS = [
  // Player
  { label: "player", detail: "expression", doc: "The event player.", snippet: "player", category: "player" },
  { label: "victim", detail: "expression", doc: "The damaged entity in damage events.", snippet: "victim", category: "combat" },
  { label: "attacker", detail: "expression", doc: "The attacking entity in damage events.", snippet: "attacker", category: "combat" },
  { label: "damage", detail: "expression", doc: "The damage amount in damage events.", snippet: "damage", category: "combat" },
  { label: "name of %player%", detail: "expression", doc: "Player's name.", snippet: "name of ${1:player}", category: "player" },
  { label: "uuid of %player%", detail: "expression", doc: "Player's UUID.", snippet: "uuid of ${1:player}", category: "player" },
  { label: "display name of %player%", detail: "expression", doc: "Player's display name.", snippet: "display name of ${1:player}", category: "player" },
  { label: "health of %entity%", detail: "expression", doc: "Entity's current health.", snippet: "health of ${1:player}", category: "player" },
  { label: "max health of %entity%", detail: "expression", doc: "Entity's max health.", snippet: "max health of ${1:player}", category: "player" },
  { label: "food level of %player%", detail: "expression", doc: "Player's food level.", snippet: "food level of ${1:player}", category: "player" },
  { label: "level of %player%", detail: "expression", doc: "Player's experience level.", snippet: "level of ${1:player}", category: "player" },
  { label: "gamemode of %player%", detail: "expression", doc: "Player's gamemode.", snippet: "gamemode of ${1:player}", category: "player" },
  { label: "location of %entity%", detail: "expression", doc: "Entity's location.", snippet: "location of ${1:player}", category: "player" },
  { label: "world of %entity%", detail: "expression", doc: "World the entity is in.", snippet: "world of ${1:player}", category: "player" },
  { label: "target of %player%", detail: "expression", doc: "What the player is looking at.", snippet: "target of ${1:player}", category: "player" },
  { label: "all players", detail: "expression", doc: "All online players.", snippet: "all players", category: "player" },
  { label: "all entities", detail: "expression", doc: "All entities, optionally filtered.", snippet: "all entities${1: in ${2:world}}", category: "entity" },

  // Inventory
  { label: "tool of %player%", detail: "expression", doc: "Item the player is holding.", snippet: "tool of ${1:player}", category: "inventory" },
  { label: "offhand tool of %player%", detail: "expression", doc: "Item in the player's offhand.", snippet: "offhand tool of ${1:player}", category: "inventory" },
  { label: "inventory of %player%", detail: "expression", doc: "Player's inventory.", snippet: "inventory of ${1:player}", category: "inventory" },
  { label: "helmet of %player%", detail: "expression", doc: "Player's helmet slot.", snippet: "helmet of ${1:player}", category: "inventory" },
  { label: "chestplate of %player%", detail: "expression", doc: "Player's chestplate slot.", snippet: "chestplate of ${1:player}", category: "inventory" },

  // World
  { label: "block at %location%", detail: "expression", doc: "Block at a given location.", snippet: "block at ${1:location}", category: "world" },
  { label: "blocks within", detail: "expression", doc: "All blocks in a region.", snippet: "blocks within ${1:loc1} and ${2:loc2}", category: "world" },
  { label: "spawn of %world%", detail: "expression", doc: "World spawn location.", snippet: "spawn of ${1:world}", category: "world" },
  { label: "time of %world%", detail: "expression", doc: "Current time of a world.", snippet: "time of ${1:world}", category: "world" },

  // Math / utility
  { label: "random number", detail: "expression", doc: "Random number in a range.", snippet: "random number between ${1:1} and ${2:10}", category: "math" },
  { label: "random integer", detail: "expression", doc: "Random whole number.", snippet: "random integer between ${1:1} and ${2:10}", category: "math" },
  { label: "size of %list%", detail: "expression", doc: "Size of a list.", snippet: "size of ${1:list}", category: "math" },
  { label: "length of %string%", detail: "expression", doc: "Length of a string.", snippet: "length of ${1:string}", category: "math" },

  // Vector — generally prefer push/teleport over raw vectors
  { label: "vector", detail: "expression", doc: "Vector with x, y, z components.\n\nFor pushing entities, prefer the `push` effect.", snippet: "vector(${1:0}, ${2:1}, ${3:0})", category: "vector" },
];

export const TYPES = [
  "player", "entity", "block", "item", "itemstack", "inventory",
  "world", "location", "vector", "chunk", "biome",
  "number", "integer", "boolean", "string", "text",
  "list", "objects", "timespan", "date", "color",
  "potion effect type", "enchantment", "gamemode", "weather",
];

// Smart hints: detect anti-patterns and suggest better syntax
export const SMART_HINTS = [
  {
    pattern: /set velocity of/i,
    suggestion: "push",
    title: "Consider using `push` instead",
    message: "The `push` effect is cleaner and more readable than manually setting velocity.\n\nExample:\n  push player upwards at speed 1",
  },
  {
    pattern: /loop all players:\s*$/i,
    suggestion: "broadcast",
    title: "Consider using `broadcast` instead",
    message: "If you're sending the same message to all players, `broadcast` is one line.",
  },
  {
    pattern: /wait \d+ tick(s)?\s*$/i,
    suggestion: "use seconds for clarity",
    title: "Tip: 20 ticks = 1 second",
    message: "Skript supports `seconds` for readability. `wait 1 second` is the same as `wait 20 ticks`.",
  },
];

// Common Skript snippets the user can trigger by name
export const SNIPPETS = [
  {
    label: "command",
    detail: "snippet — full command",
    doc: "A complete command definition with permission and trigger.",
    snippet:
      "command /${1:name} ${2:<text>}:\n" +
      "\tdescription: ${3:Description here}\n" +
      "\tpermission: ${4:my.permission}\n" +
      "\tpermission message: &cYou don't have permission!\n" +
      "\ttrigger:\n" +
      "\t\t$0",
    category: "scaffold",
  },
  {
    label: "function",
    detail: "snippet — function",
    doc: "A function definition.",
    snippet:
      "function ${1:name}(${2:arg}: ${3:player}) :: ${4:text}:\n" +
      "\t$0",
    category: "scaffold",
  },
  {
    label: "loop players",
    detail: "snippet",
    doc: "Loop through all players.",
    snippet: "loop all players:\n\t$0",
    category: "scaffold",
  },
  {
    label: "if-else",
    detail: "snippet",
    doc: "Conditional with else branch.",
    snippet: "if ${1:condition}:\n\t${2:# do thing}\nelse:\n\t$0",
    category: "scaffold",
  },
  {
    label: "options",
    detail: "snippet — config options",
    doc: "An options block for configurable values.",
    snippet: "options:\n\t${1:prefix}: ${2:&8[&aSkStudio&8]}\n\t$0",
    category: "scaffold",
  },
];
