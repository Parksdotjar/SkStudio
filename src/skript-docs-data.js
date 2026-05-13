// Skript documentation data — v2.15.2
// Each entry: { id, title, category, since, description, patterns, examples, returnType, cancellable, note }

export const DOCS_CATEGORIES = [
  { id: "intro",       label: "Introduction",   icon: "📖" },
  { id: "structures",  label: "Structures",      icon: "🏗" },
  { id: "events",      label: "Events",          icon: "⚡" },
  { id: "conditions",  label: "Conditions",      icon: "❓" },
  { id: "effects",     label: "Effects",         icon: "⚙" },
  { id: "expressions", label: "Expressions",     icon: "📦" },
  { id: "types",       label: "Types",           icon: "🔷" },
  { id: "functions",   label: "Functions",       icon: "ƒ" },
];

export const DOCS_ENTRIES = [

  // ── INTRODUCTION ───────────────────────────────────────────────────────────

  {
    id: "intro-welcome",
    title: "Welcome to Skript",
    category: "intro",
    since: "1.0",
    description: `Skript is a Bukkit plugin that allows server administrators and developers to write custom scripts for their Minecraft servers without knowing Java. Scripts are written in plain English and interpreted at runtime, making Skript ideal for quick customisation of gameplay mechanics.

Scripts live in the **plugins/Skript/scripts/** directory. Any file with a **.sk** extension is automatically loaded when the server starts or when you run \`/skript reload all\`.

Skript follows an event-driven model — code runs in response to game events. Every script is composed of one or more **event handlers** that contain **conditions** and **effects**.`,
    examples: [`on join:
    send "Welcome to the server, %player%!" to player

on damage:
    if victim is a player:
        send "Ouch! You took %damage% damage." to victim`],
  },

  {
    id: "intro-syntax",
    title: "Syntax Overview",
    category: "intro",
    since: "1.0",
    description: `Skript uses indentation (4 spaces or 1 tab) to define code blocks. There is no punctuation required at the end of lines.

**Variables** are declared with curly braces: \`{variable}\`. Global variables persist across scripts; local variables use an underscore prefix: \`{_local}\`. List variables use double colons: \`{list::*}\`.

**Comments** start with \`#\` and are ignored by the parser.

**Placeholders** are wrapped in percent signs: \`%player%\`, \`%damage%\`.

Skript is case-insensitive for all keywords and most expressions.`,
    examples: [`# This is a comment
set {score::%player%} to {score::%player%} + 1
broadcast "%player% now has %{score::%player%}% points"

# List variable usage
add "sword" to {inventory::*}
loop {inventory::*}:
    send "You have: %loop-value%"`],
  },

  {
    id: "intro-variables",
    title: "Variables",
    category: "intro",
    since: "1.0",
    description: `Variables are Skript's primary storage mechanism. All variables start and end with a curly brace.

| Type | Syntax | Scope |
|------|--------|-------|
| Global | \`{name}\` | Persists between reloads, saved to disk |
| Local | \`{_name}\` | Only exists inside the current event/function |
| List | \`{list::*}\` | Acts like an array; iterate with \`loop\` |

Variable names are case-insensitive and can contain letters, numbers, hyphens, underscores, and percent-sign wrapped expressions. For example: \`{kills::%player%}\` creates a per-player variable.

Variables are stored in **variables.csv** inside the Skript data folder by default.`,
    examples: [`# Setting variables
set {_x} to 10
set {points::%player%} to 0
add 1 to {points::%player%}

# List variables
add player to {online-players::*}
remove player from {online-players::*}
loop {online-players::*}:
    send "Online: %loop-value%"`],
  },

  {
    id: "intro-loops",
    title: "Loops",
    category: "intro",
    since: "1.0",
    description: `Loops repeat a block of code for every element in a collection or for a fixed number of iterations.

**Loop list variable:** iterates every value in a list variable.
**Loop number:** runs a set number of times.
**Loop entities/players:** iterates all matching game entities.

Inside a loop, use \`loop-value\` (or \`loop-index\` for the key) to reference the current iteration's value. Use \`exit loop\` to break out early, or \`continue\` to skip to the next iteration.`,
    examples: [`# Loop a list
loop {members::*}:
    send "Hello, %loop-value%!"

# Loop a number
loop 5 times:
    send "Iteration %loop-number%"

# Loop entities
loop all players in radius 10 of player:
    send "Near you: %loop-player%"

# Exit early
loop {items::*}:
    if loop-value is a diamond:
        exit loop`],
  },

  {
    id: "intro-functions",
    title: "Functions",
    category: "intro",
    since: "2.2",
    description: `Functions are reusable code blocks that accept parameters and can return a value. They are defined at the top level of a script and can be called from anywhere.

Parameters are typed — you must specify the type of each parameter. Functions can optionally return a value using the \`return\` effect.

**Local functions** (prefixed with \`local\`) are only accessible from within the same script file and take priority over global functions with the same name.`,
    examples: [`function greet(p: player, msg: text):
    send "%msg%, %{_p}%!" to {_p}

function clamp(n: number, min: number, max: number) :: number:
    if {_n} < {_min}:
        return {_min}
    if {_n} > {_max}:
        return {_max}
    return {_n}

# Calling functions
greet(player, "Welcome")
set {_result} to clamp(150, 0, 100)`],
  },

  // ── STRUCTURES ─────────────────────────────────────────────────────────────

  {
    id: "struct-command",
    title: "Command",
    category: "structures",
    since: "1.0",
    patterns: ["command <name> [<arguments>]"],
    description: `Registers a custom server command. The command name is required; arguments are optional and can be typed.

**Optional entries inside a command:**
- \`aliases:\` — alternative names for the command
- \`description:\` — shown in \`/help\`
- \`usage:\` — displayed when the command is used incorrectly
- \`permission:\` — permission node required to run the command
- \`permission message:\` — message sent when player lacks permission
- \`cooldown:\` — time between uses per player
- \`cooldown message:\` — message shown during cooldown
- \`cooldown bypass:\` — permission to bypass the cooldown
- \`cooldown storage:\` — variable storing the cooldown reset time
- \`executable by:\` — restrict to \`players\` or \`console\`
- \`trigger:\` — the code block that runs when the command is executed`,
    examples: [`command /heal [<player=%player%>]:
    permission: admin.heal
    permission message: You don't have permission to heal players.
    description: Heals the target player.
    trigger:
        heal arg-1
        send "You have been healed!" to arg-1

command /points [<text>]:
    usage: /points [add|remove|check] [amount] [player]
    trigger:
        if arg-1 is "add":
            add 10 to {points::%player%}
            send "Added 10 points."`],
  },

  {
    id: "struct-event",
    title: "Event Handler",
    category: "structures",
    since: "1.0, 2.6, 2.9",
    patterns: [
      "on <event>",
      "on [uncancelled|cancelled] <event>",
      "on <event> with priority <priority>",
    ],
    description: `Listens for a game event and runs the contained code block when it fires.

Event handlers run in priority order: **lowest → low → normal → high → highest → monitor**. The default priority is \`normal\`. The \`monitor\` priority should only be used for observation — not for modifying or cancelling events.

Use \`on uncancelled <event>\` to ignore already-cancelled events, or \`on cancelled <event>\` to only run when the event has already been cancelled.

Multiple event patterns can be specified on a single handler by separating them with \`or\`:`,
    examples: [`on join:
    send "Welcome, %player%!" to player

on damage with priority high:
    if {god::%victim%} is true:
        cancel event

on break or place:
    broadcast "%player% modified a block at %location of event-block%"

on uncancelled death of a player:
    broadcast "%player% has died!"`],
  },

  {
    id: "struct-function-def",
    title: "Function",
    category: "structures",
    since: "2.2, 2.7",
    patterns: [
      "function <name>(<params>) [:: <returnType>]:",
      "local function <name>(<params>) [:: <returnType>]:",
    ],
    description: `Defines a reusable function. Parameters are comma-separated \`name: type\` pairs. Return type is specified after \`::\`.

Local functions are file-scoped and take priority over global functions of the same name during script execution. This allows you to override or shadow global utilities.

Functions support default parameter values by assigning a literal in the signature.`,
    examples: [`# No return value
function announce(msg: text):
    broadcast {_msg}

# With return
function max(a: number, b: number) :: number:
    if {_a} > {_b}:
        return {_a}
    return {_b}

# Local function
local function formatTime(t: timespan) :: text:
    return "%minutes of {_t}%m %seconds of {_t}%s"

# Calling
set {_bigger} to max(10, 20)
announce("Server restarting in 5 minutes")`],
  },

  {
    id: "struct-options",
    title: "Options",
    category: "structures",
    since: "1.0",
    patterns: ["options:"],
    description: `Defines reusable constants within a script. Options are referenced using \`{@name}\` syntax and are substituted at parse time — they are not runtime variables.

Options are local to the script file they are defined in. Use them to centralise configuration values like permission nodes, prefixes, or cooldowns.`,
    examples: [`options:
    prefix: &7[&aServer&7]
    admin-perm: server.admin
    spawn: world, 0, 64, 0

on join:
    send "{@prefix} &aWelcome!" to player

command /tp-spawn:
    permission: {@admin-perm}
    trigger:
        teleport player to {@spawn}`],
  },

  {
    id: "struct-variables",
    title: "Variables Section",
    category: "structures",
    since: "1.0",
    patterns: ["variables:"],
    description: `Initialises variables when the script loads. Variables defined in this section will only be set if they do not already have a value. This prevents overwriting existing data on reload.

Commonly used to set default values for global configuration variables.`,
    examples: [`variables:
    {settings::max-homes} = 3
    {settings::prefix} = "&7[Server]"
    {settings::pvp-enabled} = true

on join:
    if {homes::%player%::*} is not set:
        message "Use /sethome to set your first home."  to player`],
  },

  {
    id: "struct-aliases",
    title: "Aliases",
    category: "structures",
    since: "1.0",
    patterns: ["aliases:"],
    description: `Registers custom item aliases for use throughout the script. Aliases can represent a single item, a list of items, or items with specific data values.

Defined aliases are accessible in the same script and globally after being loaded.`,
    examples: [`aliases:
    blacklisted items = TNT, bedrock, obsidian, barrier
    god apples = enchanted golden apple

on place:
    if event-block is a blacklisted item:
        cancel event
        send "&cYou cannot place that block!"`],
  },

  {
    id: "struct-using",
    title: "Using Experimental Feature",
    category: "structures",
    since: "2.9.0",
    patterns: ["using [[the] experiment] <feature>"],
    description: `Enables an opt-in experimental feature for the script. Experimental features are subject to change or removal in future versions.

Available experiments vary by Skript version. Check the release notes or the Skript GitHub for the current list of available experiments.`,
    examples: [`using script reflection

on load:
    set {_script} to current script
    loop functions of {_script}:
        log "Function: %loop-value%"`],
  },

  // ── EVENTS ─────────────────────────────────────────────────────────────────

  {
    id: "event-join",
    title: "Join",
    category: "events",
    since: "1.0",
    cancellable: false,
    patterns: ["on join", "on player join"],
    description: `Fired when a player connects to the server. The join message can be modified or suppressed by setting the join message expression.`,
    examples: [`on join:
    set join message to "&a%player% joined the game"
    give player a diamond sword
    if player has played before:
        send "Welcome back, %player%!"
    else:
        send "Welcome to the server for the first time, %player%!"`],
  },

  {
    id: "event-quit",
    title: "Quit",
    category: "events",
    since: "1.0",
    cancellable: false,
    patterns: ["on quit", "on player quit", "on player leave", "on disconnect"],
    description: `Fired when a player disconnects from the server. The quit message can be modified or suppressed.`,
    examples: [`on quit:
    set quit message to "&c%player% left the game"
    remove player from {online-players::*}`],
  },

  {
    id: "event-death",
    title: "Death",
    category: "events",
    since: "1.0",
    cancellable: false,
    patterns: ["on death", "on death of <entity>"],
    description: `Fired when any entity dies. Use expressions like \`victim\` to get the dying entity and \`attacker\` to get who killed it (if applicable). The death message can be modified or cleared.`,
    examples: [`on death of a player:
    set death message to "%player% was eliminated"
    add 1 to {deaths::%player%}

on death of a zombie:
    drop a diamond at location of victim`],
  },

  {
    id: "event-damage",
    title: "Damage",
    category: "events",
    since: "1.0",
    cancellable: true,
    patterns: ["on damage", "on damage of <entity>", "on <entity> damage"],
    description: `Fired when an entity takes damage. Access the damage amount with \`damage\`, the entity taking damage with \`victim\`, and the source of damage with \`attacker\` or \`damage cause\`.

Setting the \`damage\` expression modifies how much damage is dealt.`,
    examples: [`on damage:
    if victim is a player:
        if {god::%victim%} is true:
            cancel event

on damage of a player:
    if attacker is a player:
        add 1 to {pvp-hits::%attacker%}
    set damage to damage * 1.5  # 50% damage boost`],
  },

  {
    id: "event-chat",
    title: "Chat",
    category: "events",
    since: "1.0",
    cancellable: true,
    patterns: ["on chat"],
    description: `Fired when a player sends a chat message. The message and format can be modified using the \`chat message\` and \`chat format\` expressions. Recipients can be controlled with \`chat recipients\`.`,
    examples: [`on chat:
    set chat format to "&7[&a%player%&7] &f%message%"

on chat:
    if message contains "badword":
        cancel event
        send "&cYour message contained a banned word." to player`],
  },

  {
    id: "event-command",
    title: "Command",
    category: "events",
    since: "1.0",
    cancellable: true,
    patterns: ["on command"],
    description: `Fired when any command is run, including both console and player commands. Access the full command string with \`full command\` or just the command name with \`command\`.`,
    examples: [`on command:
    if {muted::%player%} is true:
        cancel event
        send "&cYou are muted." to player`],
  },

  {
    id: "event-break",
    title: "Break / Mine",
    category: "events",
    since: "1.0",
    cancellable: true,
    patterns: ["on break", "on mine", "on break of <block>"],
    description: `Fired when a player breaks a block. Use \`event-block\` to get the broken block. \`on mine\` fires only when a block is broken with the correct tool (drops are given), while \`on break\` fires for all block destruction.`,
    examples: [`on break of ore:
    if player does not have silk touch:
        cancel event
        drop fortune drops of event-block at location of event-block

on mine of diamond ore:
    add 1 to {diamonds-mined::%player%}`],
  },

  {
    id: "event-place",
    title: "Place",
    category: "events",
    since: "1.0",
    cancellable: true,
    patterns: ["on place", "on place of <block>", "on block place"],
    description: `Fired when a player places a block. Use \`event-block\` for the placed block and \`player\` for who placed it.`,
    examples: [`on place of tnt:
    if player does not have permission "build.tnt":
        cancel event
        send "&cYou cannot place TNT here."`],
  },

  {
    id: "event-interact",
    title: "Click / Interact",
    category: "events",
    since: "1.0",
    cancellable: true,
    patterns: [
      "on click",
      "on right click",
      "on left click",
      "on right click on <block>",
      "on interact",
    ],
    description: `Fired when a player clicks or interacts with a block or entity. Distinguish between left and right click, or whether a block or entity was targeted.

Use \`event-block\` for the clicked block and \`clicked entity\` for the targeted entity. \`click type\` returns \`right click\` or \`left click\`.`,
    examples: [`on right click on a chest:
    send "You opened a chest at %location of event-block%"

on left click:
    if player is holding a blaze rod:
        cancel event
        shoot a fireball from player`],
  },

  {
    id: "event-move",
    title: "Move",
    category: "events",
    since: "1.0",
    cancellable: true,
    patterns: ["on move", "on player move", "on move on <block>"],
    description: `Fired every time a player changes position or rotation. This event fires very frequently — keep its handler as lightweight as possible to avoid server performance issues.

Use \`on move on <blocktype>\` to only fire when a player moves onto a specific block type.`,
    examples: [`on move on magma block:
    damage player by 1

on move:
    if player is in region "spawn-pvp":
        if {pvp-enabled} is false:
            cancel event`],
  },

  {
    id: "event-spawn",
    title: "Spawn",
    category: "events",
    since: "1.0",
    cancellable: true,
    patterns: ["on spawn", "on spawn of <entity>"],
    description: `Fired when an entity spawns in the world. Access the spawned entity with \`event-entity\`. You can check the spawn reason using the \`spawn reason\` expression.`,
    examples: [`on spawn of a creeper:
    if world is "peaceful_world":
        cancel event

on spawn of a zombie:
    equip event-entity with an iron sword`],
  },

  {
    id: "event-respawn",
    title: "Respawn",
    category: "events",
    since: "1.0",
    cancellable: false,
    patterns: ["on respawn"],
    description: `Fired when a player respawns after death. The respawn location can be modified using the \`respawn location\` expression.`,
    examples: [`on respawn:
    teleport player to {spawn-location}
    send "&aYou have been respawned!"
    give player a bread`],
  },

  {
    id: "event-levelchange",
    title: "Level Change",
    category: "events",
    since: "1.0",
    cancellable: false,
    patterns: ["on level change"],
    description: `Fired when a player's experience level changes. \`past event-number\` gives the old level and \`event-number\` gives the new level.`,
    examples: [`on level change:
    if level of player is 30:
        send "&aYou reached level 30! You can now enchant items."`],
  },

  {
    id: "event-firstjoin",
    title: "First Join",
    category: "events",
    since: "1.0",
    cancellable: false,
    patterns: ["on first join"],
    description: `Fired the first time a player ever joins the server. Useful for setting up default data or sending a welcome package.`,
    examples: [`on first join:
    send "&aWelcome to the server! You have been given a starter kit." to player
    give player 64 bread, a stone sword, and a leather armor set
    set {rank::%player%} to "newcomer"
    broadcast "&e%player% joined for the first time!"`],
  },

  {
    id: "event-inventory-click",
    title: "Inventory Click",
    category: "events",
    since: "1.0",
    cancellable: true,
    patterns: ["on inventory click"],
    description: `Fired when a player clicks inside any inventory. Access the clicked inventory with \`event-inventory\`, the slot number with \`event-slot\`, and the item with \`clicked item\` or \`cursor item\`.`,
    examples: [`on inventory click:
    if name of event-inventory is "Custom Shop":
        cancel event
        # handle custom shop logic`],
  },

  {
    id: "event-pickup",
    title: "Pick Up",
    category: "events",
    since: "1.0",
    cancellable: true,
    patterns: ["on pick up", "on pickup", "on item pickup"],
    description: `Fired when a player picks up an item from the ground. Access the item entity with \`event-item\` and the item stack with \`item of event-item\`.`,
    examples: [`on pick up:
    if item of event-item is a diamond:
        add 1 to {diamonds-collected::%player%}
        send "&b+1 Diamond collected!" to player`],
  },

  {
    id: "event-drop",
    title: "Drop",
    category: "events",
    since: "1.0",
    cancellable: true,
    patterns: ["on drop", "on item drop"],
    description: `Fired when a player drops an item from their inventory.`,
    examples: [`on drop:
    if {drop-disabled::%player%} is true:
        cancel event`],
  },

  {
    id: "event-server-start",
    title: "Server Start / Stop",
    category: "events",
    since: "1.0",
    cancellable: false,
    patterns: ["on server start", "on server stop"],
    description: `Fired when the server starts or stops. The server start event is useful for initializing data. The stop event can be used for clean-up or saving data before shutdown.`,
    examples: [`on server start:
    set {server-start-time} to now
    broadcast "&aServer has started!"

on server stop:
    broadcast "&cServer is shutting down. Goodbye!"`],
  },

  {
    id: "event-script-load",
    title: "Script Load / Unload",
    category: "events",
    since: "1.0",
    cancellable: false,
    patterns: ["on script load", "on load", "on script unload", "on unload"],
    description: `Fired when the script itself is loaded or unloaded. \`on load\` is the most common — use it to run initialization code when the script starts.`,
    examples: [`on load:
    set {_version} to "1.0.0"
    log "[MyPlugin] v%{_version}% loaded successfully"

on unload:
    save world "world"
    log "[MyPlugin] Unloaded and world saved."`],
  },

  {
    id: "event-weather",
    title: "Weather Change",
    category: "events",
    since: "1.0",
    cancellable: true,
    patterns: ["on weather change"],
    description: `Fired when the weather in a world changes. Access the world with \`event-world\` and the new weather type with \`event-weather\`.`,
    examples: [`on weather change:
    if event-world is "spawn":
        cancel event  # always sunny at spawn`],
  },

  {
    id: "event-teleport",
    title: "Teleport",
    category: "events",
    since: "1.0",
    cancellable: true,
    patterns: ["on teleport"],
    description: `Fired when an entity is teleported. Access the origin with \`past event-location\` and the destination with \`event-location\`.`,
    examples: [`on teleport:
    if player is in region "no-teleport":
        cancel event
        send "&cTeleportation is not allowed here."`],
  },

  {
    id: "event-explosion",
    title: "Explode",
    category: "events",
    since: "1.0",
    cancellable: true,
    patterns: ["on explode", "on explosion"],
    description: `Fired when an explosion occurs. The exploded blocks can be accessed via \`exploded blocks\`. You can prevent block destruction by cancelling the event or clearing \`exploded blocks\`.`,
    examples: [`on explode:
    clear exploded blocks  # No block damage, but still knocks back entities

on explode:
    if location of explosion is in region "protected":
        cancel event`],
  },

  {
    id: "event-craft",
    title: "Craft",
    category: "events",
    since: "1.0",
    cancellable: true,
    patterns: ["on craft"],
    description: `Fired when a player crafts an item. Access the crafting result with \`crafted item\` and the ingredients with the \`ingredient\` expressions.`,
    examples: [`on craft:
    if crafted item is a diamond sword:
        set crafted item to a diamond sword named "Starting Blade"`],
  },

  {
    id: "event-smelt",
    title: "Smelt",
    category: "events",
    since: "1.0",
    cancellable: true,
    patterns: ["on smelt"],
    description: `Fired when an item finishes smelting in a furnace. Access the result with \`smelted item\`.`,
    examples: [`on smelt:
    if smelted item is an iron ingot:
        set smelted item to 2 iron ingots`],
  },

  {
    id: "event-fishing",
    title: "Fishing",
    category: "events",
    since: "1.0",
    cancellable: true,
    patterns: ["on fishing", "on fish"],
    description: `Fired during various stages of fishing. Use the \`fishing state\` expression to determine the phase: \`fishing\`, \`caught fish\`, \`caught entity\`, \`in ground\`, \`failed attempt\`.`,
    examples: [`on fishing:
    if fishing state is "caught fish":
        if caught item is a cod:
            set caught item to a salmon`],
  },

  {
    id: "event-periodical",
    title: "Periodical (Every ...)",
    category: "events",
    since: "1.0",
    cancellable: false,
    patterns: [
      "every <timespan>",
      "every <timespan> in [world[s]] <worlds>",
    ],
    description: `Runs a block of code on a repeating timer. The interval can be any timespan expression. Optionally restrict execution to specific worlds.`,
    examples: [`every 1 minute:
    broadcast "&eAutomatic broadcast: Stay hydrated!"

every 30 seconds in world "resource":
    loop all players in "resource":
        send "&7The resource world will reset in %{reset-time}%." to loop-player

every 5 ticks:
    loop all players:
        add 1 to {playtime-ticks::%loop-player%}`],
  },

  // ── CONDITIONS ─────────────────────────────────────────────────────────────

  {
    id: "cond-comparison",
    title: "Comparison",
    category: "conditions",
    since: "1.0",
    patterns: [
      "<expr> is <expr>",
      "<expr> is not <expr>",
      "<expr> is greater than <expr>",
      "<expr> is less than <expr>",
      "<expr> is greater than or equal to <expr>",
      "<expr> is less than or equal to <expr>",
    ],
    description: `Compares two values. The standard English forms \`is\`, \`is not\`, \`is greater than\`, \`is less than\`, \`is at least\`, and \`is at most\` are all valid.

Comparison works on numbers, text (alphabetical), timespans, dates, and most other types.`,
    examples: [`if level of player >= 30:
    send "You can enchant!"

if {kills::%player%} > 100:
    give player a title "Veteran"

if name of player is not "Admin":
    send "You are not an admin."`],
  },

  {
    id: "cond-ispermission",
    title: "Has Permission",
    category: "conditions",
    since: "1.0",
    patterns: [
      "<player> has [the] permission <text>",
      "<player> does not have [the] permission <text>",
    ],
    description: `Checks whether a player has a specific permission node. Compatible with any permissions plugin that hooks into Bukkit's permission system.`,
    examples: [`if player has permission "server.admin":
    send "&aAdmin commands unlocked."

if player does not have permission "vip.fly":
    deny flight for player`],
  },

  {
    id: "cond-isset",
    title: "Is Set",
    category: "conditions",
    since: "1.0",
    patterns: [
      "<expr> is set",
      "<expr> is not set",
    ],
    description: `Checks whether a variable or expression has a value. A variable is "not set" if it has never been assigned or was deleted with \`delete {variable}\`.`,
    examples: [`if {home::%player%} is not set:
    send "You have not set a home yet. Use /sethome."
else:
    teleport player to {home::%player%}`],
  },

  {
    id: "cond-contains",
    title: "Contains",
    category: "conditions",
    since: "1.0",
    patterns: [
      "<list> contains <object>",
      "<text> contains <text>",
    ],
    description: `Checks if a list variable contains a specific value, or if a string contains a substring.`,
    examples: [`if {banned-players::*} contains player:
    kick player due to "You are banned."

if message contains "help":
    send "&eNeed help? Try /help."`],
  },

  {
    id: "cond-chance",
    title: "Chance",
    category: "conditions",
    since: "1.0",
    patterns: ["chance of <number>%"],
    description: `Returns true with the specified probability. \`chance of 50%\` will be true approximately half the time. Values are clamped between 0 and 100.`,
    examples: [`on death of a zombie:
    if chance of 10%:
        drop a diamond at location of victim`],
  },

  {
    id: "cond-isplayer",
    title: "Is a Player / Entity Type",
    category: "conditions",
    since: "1.0",
    patterns: [
      "<entity> is a player",
      "<entity> is [a[n]] <entity type>",
    ],
    description: `Checks the type of an entity. Useful in generic event handlers shared by multiple entity types.`,
    examples: [`on damage:
    if victim is a player:
        send "You took %damage% damage." to victim
    if attacker is a zombie:
        apply poison to victim for 3 seconds`],
  },

  {
    id: "cond-isonline",
    title: "Is Online",
    category: "conditions",
    since: "1.0",
    patterns: [
      "<offline player> is online",
      "<offline player> is not online",
    ],
    description: `Checks whether an offline player is currently connected to the server.`,
    examples: [`if {_target} is online:
    send "Your friend is online!" to player
else:
    send "They are offline."`],
  },

  {
    id: "cond-empty",
    title: "Is Empty",
    category: "conditions",
    since: "1.0",
    patterns: [
      "<list> is empty",
      "<inventory> is empty",
      "<text> is empty",
    ],
    description: `Checks whether a list, inventory, or text has no contents.`,
    examples: [`if {party::%player%::*} is empty:
    send "You are not in a party."

if inventory of player is empty:
    send "Your inventory is completely empty!"`],
  },

  {
    id: "cond-startswith",
    title: "Starts / Ends With",
    category: "conditions",
    since: "2.0",
    patterns: [
      "<text> starts with <text>",
      "<text> ends with <text>",
    ],
    description: `Checks whether a string begins or ends with a specific substring. Case-insensitive by default.`,
    examples: [`if message starts with "/":
    cancel event
    send "&cDo not type commands in chat."

if name of player ends with "Bot":
    kick player due to "Bot accounts are not allowed."`],
  },

  {
    id: "cond-matches",
    title: "Matches (Regex)",
    category: "conditions",
    since: "2.2-dev16",
    patterns: ["<text> matches <regex>"],
    description: `Tests a string against a Java regular expression pattern. The pattern is a standard Java regex string.`,
    examples: [`if message matches "^[a-zA-Z0-9_]+$":
    # message is alphanumeric
    send "Valid input."
else:
    send "Input contains invalid characters."`],
  },

  {
    id: "cond-flying",
    title: "Is Flying",
    category: "conditions",
    since: "1.0",
    patterns: ["<player> is flying", "<player> is not flying"],
    description: `Checks whether a player is currently in flight mode.`,
    examples: [`if player is flying:
    send "You are flying! Land to continue."`],
  },

  {
    id: "cond-sneaking",
    title: "Is Sneaking",
    category: "conditions",
    since: "1.0",
    patterns: ["<player> is sneaking", "<player> is not sneaking"],
    description: `Checks whether a player is currently holding the sneak key.`,
    examples: [`on right click:
    if player is sneaking:
        open {secret-chest-inventory} to player`],
  },

  {
    id: "cond-burning",
    title: "Is Burning",
    category: "conditions",
    since: "1.0",
    patterns: ["<entity> is on fire", "<entity> is burning"],
    description: `Checks whether an entity currently has fire ticks (is on fire).`,
    examples: [`on damage:
    if victim is burning:
        set damage to damage * 1.25  # bonus damage to burning entities`],
  },

  {
    id: "cond-hasmeta",
    title: "Has Metadata",
    category: "conditions",
    since: "2.0",
    patterns: [
      "<object> has [the] metadata [tag] <text>",
      "<object> does not have [the] metadata [tag] <text>",
    ],
    description: `Checks whether an entity or block has a specific metadata key attached. Metadata is temporary and not persisted across server restarts. For persistent data, use persistent data tags.`,
    examples: [`if player has metadata "in-arena":
    cancel event
    send "&cYou cannot do that inside an arena."`],
  },

  {
    id: "cond-pvp",
    title: "PvP",
    category: "conditions",
    since: "1.0",
    patterns: ["pvp is enabled [in <world>]", "pvp is disabled [in <world>]"],
    description: `Checks whether PvP is currently enabled in a world.`,
    examples: [`on damage:
    if attacker is a player:
        if pvp is disabled in world of victim:
            cancel event`],
  },

  // ── EFFECTS ────────────────────────────────────────────────────────────────

  {
    id: "eff-message",
    title: "Message",
    category: "effects",
    since: "1.0",
    patterns: [
      "(message|send) <text> to <players>",
      "(message|send) <players> <text>",
    ],
    description: `Sends a chat message to one or more players. Supports color codes using \`&\` notation and Skript's built-in color names.

Use \`send "" to player\` to send an empty line. Multiple messages can be sent at once using a list.`,
    examples: [`send "&aHello, %player%!" to player
message "&cYou are not allowed here." to all players
send "&e--- &6Server Info &e---", " &7Players: &f%size of all players%", "&e---" to player`],
  },

  {
    id: "eff-broadcast",
    title: "Broadcast",
    category: "effects",
    since: "1.0",
    patterns: [
      "broadcast <text> [to <world>]",
    ],
    description: `Sends a message to all players on the server, or to all players in a specific world. Supports color codes.`,
    examples: [`broadcast "&6[Announcement] &eThe resource world will reset in 10 minutes!"
broadcast "&aA chest has spawned at the center!" to world "survival"`],
  },

  {
    id: "eff-teleport",
    title: "Teleport",
    category: "effects",
    since: "1.0",
    patterns: [
      "teleport <entity> to <location>",
    ],
    description: `Teleports an entity to a specific location. The destination can be any location expression, a block, or a saved variable.`,
    examples: [`teleport player to {spawn}
teleport player to location of target entity
teleport all players to location 0, 100, 0 in world "hub"`],
  },

  {
    id: "eff-give",
    title: "Give",
    category: "effects",
    since: "1.0",
    patterns: [
      "give <items> to <players>",
      "give <players> <items>",
    ],
    description: `Gives one or more items to a player. If the player's inventory is full, items drop at their location.`,
    examples: [`give player a diamond sword named "Legendary Blade"
give player 64 cooked beef and 5 golden apples
give all players a firework rocket`],
  },

  {
    id: "eff-kill",
    title: "Kill",
    category: "effects",
    since: "1.0",
    patterns: ["kill <entities>"],
    description: `Instantly kills one or more entities. This triggers the death event.`,
    examples: [`kill all monsters in radius 20 of player
kill player  # forces a death event`],
  },

  {
    id: "eff-damage",
    title: "Damage",
    category: "effects",
    since: "1.0",
    patterns: [
      "damage <entities> by <number> [heart[s]]",
    ],
    description: `Deals a specified amount of damage to one or more entities. The damage value is in half-hearts.`,
    examples: [`damage player by 4  # 2 hearts
damage all monsters in radius 10 of player by 20
damage attacker by 2 hearts`],
  },

  {
    id: "eff-heal",
    title: "Heal",
    category: "effects",
    since: "1.0",
    patterns: [
      "heal <entities> [by <number>]",
    ],
    description: `Restores health to one or more entities. Without a specific amount, restores to maximum health.`,
    examples: [`heal player  # full heal
heal player by 4  # 2 hearts
heal all players by 2`],
  },

  {
    id: "eff-cancel",
    title: "Cancel Event",
    category: "effects",
    since: "1.0",
    patterns: ["cancel [the] event"],
    description: `Cancels the current event, preventing the default game action from occurring. Not all events are cancellable. Cancelling a \`damage\` event prevents the damage; cancelling a \`break\` event prevents the block from being broken, etc.`,
    examples: [`on break:
    if {protected::%location of event-block%} is true:
        cancel event
        send "&cThis area is protected!"`],
  },

  {
    id: "eff-spawn",
    title: "Spawn",
    category: "effects",
    since: "1.0",
    patterns: [
      "spawn [a[n]] <entity type> [at <location>]",
      "spawn <number> <entity type> [at <location>]",
    ],
    description: `Spawns one or more entities at a specified location. The newly spawned entity can be captured with a \`spawned entity\` expression immediately after.`,
    examples: [`spawn a zombie at player
spawn 5 creepers at location 0, 64, 0 in world "survival"
spawn a zombie at player:
    set name of last spawned entity to "Boss Zombie"
    give last spawned entity a diamond sword`],
  },

  {
    id: "eff-set",
    title: "Set / Change",
    category: "effects",
    since: "1.0",
    patterns: [
      "set <expr> to <value>",
      "add <value> to <expr>",
      "remove <value> from <expr>",
      "delete <expr>",
      "reset <expr>",
    ],
    description: `The primary way to modify variables and properties. All five operations are supported:

- **set** — assigns a value
- **add** — increments a numeric or list expression
- **remove** — decrements or removes from a list
- **delete** — removes the variable entirely
- **reset** — resets to the default value`,
    examples: [`set {score::%player%} to 0
add 10 to {score::%player%}
remove 5 from {score::%player%}
delete {temp::*}
reset health of player  # resets to max health`],
  },

  {
    id: "eff-ban",
    title: "Ban",
    category: "effects",
    since: "1.0",
    patterns: [
      "ban <player> [for <reason>] [for <duration>]",
      "ban ip of <player> [for <reason>]",
    ],
    description: `Bans a player from the server, optionally with a reason and expiration time. A temporary ban automatically unban after the duration.`,
    examples: [`ban player due to "Cheating"
ban player for "Spamming" for 7 days
ban ip of player for "VPN usage"`],
  },

  {
    id: "eff-kick",
    title: "Kick",
    category: "effects",
    since: "1.0",
    patterns: ["kick <player> [due to <reason>]"],
    description: `Disconnects a player from the server with an optional message.`,
    examples: [`kick player due to "&cYou have been kicked for inactivity."`],
  },

  {
    id: "eff-apply-potion",
    title: "Apply Potion Effect",
    category: "effects",
    since: "1.0",
    patterns: [
      "apply <potion effect> to <entities>",
      "apply <potion effect type> [of tier <number>] to <entities> for <timespan>",
    ],
    description: `Applies a potion effect to one or more entities. Specify the effect type, amplifier tier (0-based), and duration. Multiple effects can be applied in one statement.`,
    examples: [`apply speed to player for 30 seconds
apply poison of tier 2 to all monsters in radius 5 of player for 10 seconds
apply night vision to player for 10 minutes`],
  },

  {
    id: "eff-delay",
    title: "Delay",
    category: "effects",
    since: "1.0",
    patterns: ["wait <timespan>", "delay [the trigger] by <timespan>"],
    description: `Pauses execution of the current script section for a specified duration. Code after the wait continues asynchronously after the delay.

Note: variables changed after a \`wait\` may have different values than before the delay, since other code may have run in the meantime.`,
    examples: [`on join:
    send "Welcome!"
    wait 3 seconds
    send "Tip: Use /help to see available commands."

every 1 minute:
    broadcast "Server restart in 60 seconds!"
    wait 50 seconds
    broadcast "Server restart in 10 seconds!"
    wait 10 seconds
    stop server`],
  },

  {
    id: "eff-lightning",
    title: "Lightning",
    category: "effects",
    since: "1.0",
    patterns: [
      "strike lightning [effect] at <location>",
    ],
    description: `Strikes lightning at a location. \`lightning effect\` creates a visual-only lightning bolt with no damage, while \`lightning\` without \`effect\` deals damage and can start fires.`,
    examples: [`strike lightning at player
strike lightning effect at location of target block`],
  },

  {
    id: "eff-explosion",
    title: "Explosion",
    category: "effects",
    since: "1.0",
    patterns: [
      "create [a[n] [safe]] explosion [of force <number>] at <location>",
    ],
    description: `Creates an explosion at a specified location. \`safe explosion\` does not break blocks. Force is measured in the same units as TNT (4.0 by default).`,
    examples: [`create an explosion of force 10 at player
create a safe explosion of force 4 at location of target block`],
  },

  {
    id: "eff-playsound",
    title: "Play Sound",
    category: "effects",
    since: "1.0",
    patterns: [
      "play sound <text> [at <location>] [to <players>] [with volume <number>] [and pitch <number>]",
    ],
    description: `Plays a Minecraft sound to specific players at a specific location. Volume is a float (0.0+), pitch is between 0.5 and 2.0. Sound names are Bukkit sound identifiers.`,
    examples: [`play sound "entity.player.levelup" to player
play sound "block.note_block.pling" at location of player to player with volume 1 and pitch 1.5
play sound "ui.toast.challenge_complete" to all players`],
  },

  {
    id: "eff-title",
    title: "Send Title",
    category: "effects",
    since: "2.3",
    patterns: [
      "send title <title> [with subtitle <subtitle>] [for <duration> [with fadein <fadeIn> and fadeout <fadeOut>]] to <players>",
    ],
    description: `Displays a large title on a player's screen. The subtitle appears below the main title. Fade-in and fade-out are in ticks.`,
    examples: [`send title "&6Welcome!" with subtitle "&7Good to see you, %player%" to player
send title "&cYou Died" for 3 seconds to player`],
  },

  {
    id: "eff-actionbar",
    title: "Action Bar",
    category: "effects",
    since: "2.3",
    patterns: ["send action bar <text> to <players>"],
    description: `Displays a message in the action bar (above the hotbar) to a player. The action bar disappears after a few seconds unless refreshed.`,
    examples: [`send action bar "&aHealth: &c%health of player%❤" to player

every 1 second:
    loop all players:
        send action bar "&7Playtime: &f%{playtime::%loop-player%}% seconds" to loop-player`],
  },

  {
    id: "eff-op",
    title: "Op / Deop",
    category: "effects",
    since: "1.0",
    patterns: ["op <player>", "deop <player>"],
    description: `Grants or removes operator status from a player.`,
    examples: [`op player
deop all offline players`],
  },

  {
    id: "eff-keepinventory",
    title: "Keep Inventory / Experience",
    category: "effects",
    since: "1.0",
    patterns: ["keep [the] [player's] (inventory|items|xp|experience) [on death]"],
    description: `Prevents a player's inventory or experience from being dropped on death. Must be used inside a death or respawn event.`,
    examples: [`on death:
    if {vip::%player%} is true:
        keep inventory and experience`],
  },

  {
    id: "eff-command",
    title: "Execute Command",
    category: "effects",
    since: "1.0",
    patterns: [
      "execute <text> [as <player>] as console",
      "make <player> [forcibly] run [command] <text>",
    ],
    description: `Runs a command as a player or as the server console. Use \`make player run\` to execute as a specific player (respecting their permissions), or add \`as console\` to run with full server permissions.`,
    examples: [`make player run command "/warp hub"
execute "give %player% diamond 64" as console
make console execute "ban %player% Automated ban"`],
  },

  {
    id: "eff-log",
    title: "Log",
    category: "effects",
    since: "1.0",
    patterns: [
      "log <text> [to <file>]",
    ],
    description: `Writes a message to the server console or a log file. If a file path is specified, the message is appended to that file relative to the server root.`,
    examples: [`log "[ShopPlugin] %player% purchased a diamond sword"
log "Purchase log: %player%, item: %event-item%, time: %now%" to "plugins/ShopPlugin/purchases.log"`],
  },

  {
    id: "eff-sort",
    title: "Sort",
    category: "effects",
    since: "2.2",
    patterns: [
      "sort <list variable> in (ascending|descending) order",
    ],
    description: `Sorts a list variable in place. Works on numbers, text (alphabetical), and objects with natural ordering.`,
    examples: [`set {scores::player1} to 50
set {scores::player2} to 30
set {scores::player3} to 80
sort {scores::*} in descending order
send "Top player: %first element of {scores::*}%"`],
  },

  {
    id: "eff-replace",
    title: "Replace",
    category: "effects",
    since: "2.0",
    patterns: [
      "replace [all] <text> in <text variable> with <text>",
      "replace [all] <text variable> with <text> in <text variable>",
    ],
    description: `Replaces occurrences of a substring within a text variable. Modifies the variable in-place.`,
    examples: [`set {_msg} to "Hello world"
replace "world" in {_msg} with "Minecraft"
# {_msg} is now "Hello Minecraft"`],
  },

  {
    id: "eff-loop-effect",
    title: "Exit / Continue",
    category: "effects",
    since: "1.0",
    patterns: [
      "exit [the] [current] loop",
      "exit [<number>] (loop[s]|section[s]|trigger[s])",
      "continue [the loop]",
    ],
    description: `Controls loop flow. \`exit loop\` breaks out of the nearest loop. \`continue\` skips the remainder of the current iteration. Specify a number to break out of multiple nested loops.`,
    examples: [`loop all players:
    if loop-player is player:
        continue  # skip self
    if {_count} >= 5:
        exit loop  # stop after 5 players`],
  },

  // ── EXPRESSIONS ────────────────────────────────────────────────────────────

  {
    id: "expr-player",
    title: "Player",
    category: "expressions",
    since: "1.0",
    returnType: "Player",
    patterns: ["player", "the player"],
    description: `References the player involved in the current event. Available in most player-triggered events such as join, chat, damage, interact, etc.

In events that don't have a directly associated player, use the appropriate specific expression (e.g., \`attacker\`, \`victim\`, \`shooter\`).`,
    examples: [`on join:
    send "Hello, %player%!" to player
    teleport player to {spawn}`],
  },

  {
    id: "expr-location",
    title: "Location",
    category: "expressions",
    since: "1.0",
    returnType: "Location",
    patterns: [
      "location of <entity/block>",
      "location[s] <x>, <y>, <z> [in <world>]",
      "<x>, <y>, <z> [in <world>]",
    ],
    description: `Represents a position in a Minecraft world. Locations have x, y, z coordinates and an optional yaw and pitch.

Locations can be constructed inline or retrieved from entities and blocks.`,
    examples: [`teleport player to location 0, 64, 0 in "world"
set {_loc} to location of player
set {_loc} to block at player`],
  },

  {
    id: "expr-health",
    title: "Health",
    category: "expressions",
    since: "1.0",
    returnType: "Number",
    patterns: [
      "[the] health of <living entity>",
      "<living entity>'s health",
    ],
    description: `Gets or sets the current health of a living entity. Health is measured in half-hearts — a full health bar is 20. Values outside the valid range are clamped to \`0..max health\`.`,
    examples: [`send "HP: %health of player%/20" to player
set health of player to max health of player  # full heal
add 4 to health of player  # +2 hearts`],
  },

  {
    id: "expr-level",
    title: "Experience Level",
    category: "expressions",
    since: "1.0",
    returnType: "Integer",
    patterns: [
      "[the] [xp|experience] level of <player>",
      "<player>'s [xp|experience] level",
    ],
    description: `Gets or sets a player's experience level.`,
    examples: [`if level of player >= 30:
    send "You can enchant!"
add 5 to level of player
set level of player to 0`],
  },

  {
    id: "expr-world",
    title: "World",
    category: "expressions",
    since: "1.0",
    returnType: "World",
    patterns: [
      "world [of <location/entity>]",
      "<entity>'s world",
      "the world <name>",
    ],
    description: `Gets the world that an entity or location is in, or retrieves a world by name.`,
    examples: [`if world of player is world "nether":
    send "You are in the Nether."
broadcast "World info: %world of player%"`],
  },

  {
    id: "expr-name",
    title: "Name",
    category: "expressions",
    since: "1.0",
    returnType: "Text",
    patterns: [
      "[the] (name|display name) of <entity/item/inventory>",
      "<entity/item>'s (name|display name)",
    ],
    description: `Gets or sets the name of an entity, item, or inventory. For players, this returns their in-game username. Use \`set name of item to\` to apply a custom name to an item.`,
    examples: [`send "Your name: %name of player%"
set name of target entity to "Guardian"
set name of {_sword} to "&6Legendary Blade"
if name of event-item is "Special Key":
    open {_door-inventory} to player`],
  },

  {
    id: "expr-inventory",
    title: "Inventory",
    category: "expressions",
    since: "1.0",
    returnType: "Inventory",
    patterns: [
      "[the] inventory of <entity/block>",
      "<entity/block>'s inventory",
    ],
    description: `Gets the inventory of a player, entity, or block. The result is an inventory object that can be opened, modified, or queried.`,
    examples: [`open inventory of chest at location 0 64 0 in world to player
if inventory of player contains a diamond:
    send "You have a diamond!"`],
  },

  {
    id: "expr-gamemode",
    title: "Game Mode",
    category: "expressions",
    since: "1.0",
    returnType: "Game Mode",
    patterns: [
      "[the] (game[ ]mode|gm) of <player>",
      "<player>'s (game[ ]mode|gm)",
    ],
    description: `Gets or sets a player's game mode. Valid values: \`survival\`, \`creative\`, \`adventure\`, \`spectator\`.`,
    examples: [`if gamemode of player is creative:
    send "You are in creative mode."
set gamemode of player to survival`],
  },

  {
    id: "expr-item-in-hand",
    title: "Item in Hand",
    category: "expressions",
    since: "1.0",
    returnType: "Item",
    patterns: [
      "[the] (item|tool) [in [the] (main[ ]hand|off[ ]hand)] of <player>",
      "main[ ]hand [item] of <player>",
    ],
    description: `Gets or sets the item the player is holding in their main or off hand.`,
    examples: [`if item in hand of player is a diamond sword:
    damage target entity by 10
set tool of player to a pickaxe`],
  },

  {
    id: "expr-loop-value",
    title: "Loop Value / Index",
    category: "expressions",
    since: "1.0",
    returnType: "Object",
    patterns: ["loop-value", "loop-index", "loop-<type>", "loop-number"],
    description: `Inside a loop, \`loop-value\` contains the current element. \`loop-index\` contains the key (for list variables). \`loop-number\` is available when looping a number.

When nesting loops, append a number to distinguish levels: \`loop-value-1\`, \`loop-value-2\`, etc.`,
    examples: [`loop {party::*}:
    send "Party member: %loop-value%"
    send "Slot: %loop-index%"

loop 10 times:
    send "Iteration: %loop-number%"`],
  },

  {
    id: "expr-all-players",
    title: "All Players",
    category: "expressions",
    since: "1.0",
    returnType: "Player",
    patterns: [
      "all [online] players",
      "every player",
    ],
    description: `Returns a list of all currently online players. Can be used with \`loop\` or in effect targets.`,
    examples: [`broadcast "Server restarting!" to all players
loop all players:
    send "Hello, %loop-player%!"`],
  },

  {
    id: "expr-random",
    title: "Random",
    category: "expressions",
    since: "1.0",
    returnType: "Object",
    patterns: [
      "a random (element|number|integer) (in|from|between) <range>",
      "a random element [out] of <list>",
    ],
    description: `Returns a random value. Works for numbers within a range, random elements from a list, or random items from an expression.`,
    examples: [`set {_n} to a random integer between 1 and 100
set {_winner} to a random element out of {entrants::*}
drop a random element of (diamond, emerald, gold ingot) at player`],
  },

  {
    id: "expr-time",
    title: "Time / Now",
    category: "expressions",
    since: "1.0",
    returnType: "Date",
    patterns: ["now", "the current [date and] time"],
    description: `Returns the current server date and time as a \`date\` object. Useful for timestamping events or calculating durations.`,
    examples: [`set {login-time::%player%} to now

on quit:
    set {_playtime} to difference between {login-time::%player%} and now
    add {_playtime} to {total-playtime::%player%}`],
  },

  {
    id: "expr-distance",
    title: "Distance",
    category: "expressions",
    since: "1.0",
    returnType: "Number",
    patterns: [
      "distance between <location> and <location>",
    ],
    description: `Calculates the Euclidean distance in blocks between two locations.`,
    examples: [`if distance between player and location 0 64 0 in world is less than 10:
    send "You are near spawn."`],
  },

  {
    id: "expr-size",
    title: "Size / Amount",
    category: "expressions",
    since: "1.0",
    returnType: "Integer",
    patterns: [
      "(size|length|amount|number) of <list/text>",
      "size of <list variable>",
    ],
    description: `Returns the number of elements in a list variable, the number of characters in a text, or the amount of a specific item in an inventory.`,
    examples: [`send "Party size: %size of {party::%player%::*}%"
if size of {banned::*} > 100:
    log "Warning: large ban list"`],
  },

  {
    id: "expr-format-date",
    title: "Formatted Date",
    category: "expressions",
    since: "2.2",
    returnType: "Text",
    patterns: [
      "<date> formatted as <text>",
    ],
    description: `Formats a date object as a human-readable string using Java's SimpleDateFormat pattern. Common patterns: \`dd/MM/yyyy\`, \`HH:mm:ss\`, \`yyyy-MM-dd HH:mm\`.`,
    examples: [`set {_now} to now formatted as "dd/MM/yyyy HH:mm"
send "Current time: %{_now}%"`],
  },

  // ── TYPES ──────────────────────────────────────────────────────────────────

  {
    id: "type-player",
    title: "Player",
    category: "types",
    since: "1.0",
    description: `Represents an online player. Extends \`entity\` and \`offline player\`. All player-specific expressions and effects require this type.

Players have properties like name, UUID, gamemode, health, food level, inventory, experience, and many more.`,
    examples: [`set {_p} to player
if {_p} is online:
    send "Hello!" to {_p}`],
  },

  {
    id: "type-entity",
    title: "Entity",
    category: "types",
    since: "1.0",
    description: `The base type for all entities in the world: players, mobs, projectiles, vehicles, item entities, etc. All specific entity types (zombie, creeper, etc.) are subtypes.

Entity type names match Bukkit's EntityType enum, written in plain English (e.g., \`zombie\`, \`creeper\`, \`arrow\`, \`item\`).`,
    examples: [`loop entities in radius 10 of player:
    if loop-entity is a living entity:
        damage loop-entity by 2`],
  },

  {
    id: "type-item",
    title: "Item / Item Stack",
    category: "types",
    since: "1.0",
    description: `Represents an item with a material type, amount, display name, lore, and enchantments. Item stacks are the actual instances with quantities; item types are the abstract type definition.

Item names follow Minecraft's material names in plain English (e.g., \`diamond sword\`, \`oak log\`, \`golden apple\`).`,
    examples: [`give player a diamond sword named "Hero's Blade" with lore "A legendary weapon"
if player's tool is a pickaxe:
    send "Mining time!"`],
  },

  {
    id: "type-location",
    title: "Location",
    category: "types",
    since: "1.0",
    description: `A point in a world with x, y, z coordinates and optionally yaw and pitch (facing direction). Used for teleportation, spawning, checking proximity, and more.`,
    examples: [`set {_home} to location of player
teleport player to {_home}
set {_custom} to location(100, 64, -200, "world")`],
  },

  {
    id: "type-block",
    title: "Block",
    category: "types",
    since: "1.0",
    description: `Represents a block in the world at a specific location. Blocks have a material type and optional block data (facing direction, growth stage, etc.).`,
    examples: [`set block at player to stone
set {_b} to block at location 0 64 0 in world
if {_b} is a chest:
    open {_b} to player`],
  },

  {
    id: "type-world",
    title: "World",
    category: "types",
    since: "1.0",
    description: `Represents a Minecraft world. Worlds have properties like time, weather, difficulty, and spawn location.`,
    examples: [`set time in world "survival" to midnight
set weather of world of player to sunny`],
  },

  {
    id: "type-number",
    title: "Number",
    category: "types",
    since: "1.0",
    description: `Any numeric value. Skript uses floating-point numbers by default. Integers are a subtype. Numbers support standard arithmetic: \`+\`, \`-\`, \`*\`, \`/\`, \`^\`.`,
    examples: [`set {_x} to 3.14
set {_result} to {_x} * 2 + 1
set {_int} to floor({_x})  # 3`],
  },

  {
    id: "type-text",
    title: "Text",
    category: "types",
    since: "1.0",
    description: `A string of characters. Skript treats text as immutable. Use double quotes to define literals. Color codes with \`&\` are supported in messages.

Strings can be concatenated using the \`%\` placeholder syntax inline: \`"Hello %player%"\`.`,
    examples: [`set {_greeting} to "Hello, %player%!"
set {_len} to length of {_greeting}
send colored {_greeting} to player`],
  },

  {
    id: "type-timespan",
    title: "Timespan",
    category: "types",
    since: "1.0",
    description: `A duration of time. Can be expressed in ticks, seconds, minutes, hours, days. Used with delays, cooldowns, potion durations, and comparisons.

1 tick = 50ms. 20 ticks = 1 second.`,
    examples: [`wait 5 seconds
apply speed to player for 30 seconds
if {_cooldown} < 1 minute:
    send "Cooldown: %{_cooldown}%"`],
  },

  {
    id: "type-vector",
    title: "Vector",
    category: "types",
    since: "2.2",
    description: `A 3D mathematical vector with x, y, z components. Used for movement, direction, and physics calculations. Vectors can be added, subtracted, scaled, and normalized.`,
    examples: [`set {_vel} to vector(0, 0.5, 0)
set velocity of player to {_vel}
set {_dir} to normalized vector from player to target
launch player in direction {_dir} with speed 2`],
  },

  {
    id: "type-boolean",
    title: "Boolean",
    category: "types",
    since: "1.0",
    description: `A true/false value. Conditions return booleans. Variables can store \`true\` or \`false\`.`,
    examples: [`set {pvp-enabled} to true
if {pvp-enabled} is true:
    # pvp logic`],
  },

  {
    id: "type-color",
    title: "Color",
    category: "types",
    since: "1.0",
    description: `Represents a Minecraft chat color or dye color. Named colors include \`red\`, \`blue\`, \`green\`, \`yellow\`, \`aqua\`, \`white\`, \`black\`, \`dark red\`, etc.

Can also be represented as hex in chat format codes with \`&\` prefixes.`,
    examples: [`color items in {_armor::*} with blue
set {_c} to red
dye target entity with {_c}`],
  },

  {
    id: "type-inventory",
    title: "Inventory",
    category: "types",
    since: "1.0",
    description: `An item container with a fixed number of slots. Can represent a player inventory, chest, custom GUI, etc. Inventories can be opened to players and modified programmatically.`,
    examples: [`set {_inv} to a chest inventory with 27 slots named "Custom Shop"
set slot 0 of {_inv} to a diamond named "Buy Diamond - $100"
open {_inv} to player`],
  },

  // ── FUNCTIONS ──────────────────────────────────────────────────────────────

  {
    id: "func-date",
    title: "date()",
    category: "functions",
    since: "2.2",
    returnType: "Date",
    patterns: ["date(<year>, <month>, <day> [, <hour>, <minute>, <second> [, <millisecond>]])"],
    description: `Creates a \`date\` object from specific year, month, day, and optionally time components. Months are 1-indexed (1 = January).`,
    examples: [`set {_d} to date(2025, 1, 1)
send "New Year: %{_d} formatted as \"dd/MM/yyyy\"%"`],
  },

  {
    id: "func-max",
    title: "max()",
    category: "functions",
    since: "2.2",
    returnType: "Number",
    patterns: ["max(<numbers>)"],
    description: `Returns the largest value from a list of numbers.`,
    examples: [`set {_biggest} to max(10, 50, 25, 3)  # 50
set {_hp} to max(0, health of player - 5)`],
  },

  {
    id: "func-min",
    title: "min()",
    category: "functions",
    since: "2.2",
    returnType: "Number",
    patterns: ["min(<numbers>)"],
    description: `Returns the smallest value from a list of numbers.`,
    examples: [`set {_smallest} to min(10, 50, 25, 3)  # 3
set {_cap} to min(health of player, 20)`],
  },

  {
    id: "func-abs",
    title: "abs()",
    category: "functions",
    since: "2.2",
    returnType: "Number",
    patterns: ["abs(<number>)"],
    description: `Returns the absolute value of a number (removes the negative sign).`,
    examples: [`set {_distance} to abs({_x2} - {_x1})`],
  },

  {
    id: "func-floor",
    title: "floor()",
    category: "functions",
    since: "2.2",
    returnType: "Long",
    patterns: ["floor(<number>)"],
    description: `Rounds a number down to the nearest integer.`,
    examples: [`set {_n} to floor(3.9)  # 3
set {_blocks} to floor(distance between player and target)`],
  },

  {
    id: "func-ceil",
    title: "ceil()",
    category: "functions",
    since: "2.2",
    returnType: "Long",
    patterns: ["ceil(<number>)"],
    description: `Rounds a number up to the nearest integer.`,
    examples: [`set {_n} to ceil(3.1)  # 4`],
  },

  {
    id: "func-round",
    title: "round()",
    category: "functions",
    since: "2.2",
    returnType: "Long",
    patterns: ["round(<number>)"],
    description: `Rounds a number to the nearest integer using standard rounding rules.`,
    examples: [`set {_n} to round(3.5)  # 4
set {_n} to round(3.4)  # 3`],
  },

  {
    id: "func-sqrt",
    title: "sqrt()",
    category: "functions",
    since: "2.2",
    returnType: "Number",
    patterns: ["sqrt(<number>)"],
    description: `Returns the square root of a number.`,
    examples: [`set {_c} to sqrt({_a}^2 + {_b}^2)  # Pythagorean theorem`],
  },

  {
    id: "func-log",
    title: "log() / ln()",
    category: "functions",
    since: "2.2",
    returnType: "Number",
    patterns: ["log(<number> [, <base>])", "ln(<number>)"],
    description: `\`log(n)\` returns the base-10 logarithm of a number. \`log(n, base)\` uses a custom base. \`ln(n)\` returns the natural logarithm (base *e*).`,
    examples: [`set {_l} to log(1000)     # 3
set {_l} to log(8, 2)    # 3 (log base 2 of 8)
set {_l} to ln(2.718)`],
  },

  {
    id: "func-sin",
    title: "Trig Functions",
    category: "functions",
    since: "2.2",
    returnType: "Number",
    patterns: ["sin(<angle>)", "cos(<angle>)", "tan(<angle>)", "asin(<number>)", "acos(<number>)", "atan(<number>)", "atan2(<y>, <x>)"],
    description: `Standard trigonometric functions. Angles are in degrees for \`sin\`, \`cos\`, and \`tan\`. Inverse functions (\`asin\`, \`acos\`, \`atan\`) return degrees.`,
    examples: [`set {_y} to sin(90)   # 1.0
set {_x} to cos(0)   # 1.0
set {_angle} to atan2(1, 0)  # 90`],
  },

  {
    id: "func-product",
    title: "product()",
    category: "functions",
    since: "2.2",
    returnType: "Number",
    patterns: ["product(<numbers>)"],
    description: `Returns the product (multiplication result) of all given numbers.`,
    examples: [`set {_p} to product(2, 3, 4)  # 24`],
  },

  {
    id: "func-sum",
    title: "sum()",
    category: "functions",
    since: "2.2",
    returnType: "Number",
    patterns: ["sum(<numbers>)"],
    description: `Returns the sum of all given numbers.`,
    examples: [`set {_total} to sum(1, 2, 3, 4, 5)  # 15`],
  },

  {
    id: "func-isnan",
    title: "isNaN()",
    category: "functions",
    since: "2.2",
    returnType: "Boolean",
    patterns: ["isNaN(<number>)"],
    description: `Returns \`true\` if the given value is NaN (Not a Number). NaN can result from operations like \`0/0\`.`,
    examples: [`set {_r} to 0 / 0
if isNaN({_r}):
    send "Division by zero!"`],
  },

  {
    id: "func-vector",
    title: "vector()",
    category: "functions",
    since: "2.2",
    returnType: "Vector",
    patterns: ["vector(<x>, <y>, <z>)"],
    description: `Creates a 3D vector from x, y, z components.`,
    examples: [`set velocity of player to vector(0, 1, 0)
set {_v} to vector(sin(yaw of player), 0, cos(yaw of player))`],
  },

  {
    id: "func-location",
    title: "location()",
    category: "functions",
    since: "2.2",
    returnType: "Location",
    patterns: ["location(<x>, <y>, <z> [, <world> [, <yaw>, <pitch>]])"],
    description: `Creates a location from explicit coordinates, with optional world and facing direction.`,
    examples: [`set {_spawn} to location(0, 64, 0, world "survival")
teleport player to location(100, 70, -50, "nether", 90, 0)`],
  },

];
