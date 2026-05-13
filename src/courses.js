/**
 * SkStudio — Skript Courses
 * Full interactive Skript curriculum from beginner to advanced.
 * Syntax targets Skript 2.6+ on Minecraft 1.20.x / 1.21.x
 */

// ─── helpers ─────────────────────────────────────────────────────────────────

function e(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function code(src) {
  return `<pre class="course-code"><code>${e(src.trim())}</code></pre>`;
}

function tip(text) {
  return `<div class="course-tip"><span class="course-tip-icon">💡</span><span>${text}</span></div>`;
}

function warn(text) {
  return `<div class="course-warn"><span class="course-tip-icon">⚠️</span><span>${text}</span></div>`;
}

function note(text) {
  return `<div class="course-note"><span class="course-tip-icon">📝</span><span>${text}</span></div>`;
}

function h2(text) { return `<h2 class="course-h2">${text}</h2>`; }
function h3(text) { return `<h3 class="course-h3">${text}</h3>`; }
function p(text)  { return `<p class="course-p">${text}</p>`; }
function ul(items) { return `<ul class="course-ul">${items.map(i => `<li>${i}</li>`).join("")}</ul>`; }

// ─── progress (localStorage) ──────────────────────────────────────────────────

const STORAGE_KEY = "skstudio_course_progress";
function loadProgress() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); }
  catch { return new Set(); }
}
function saveProgress(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}
let _progress = loadProgress();

export function isComplete(lessonId) { return _progress.has(lessonId); }
export function markComplete(lessonId) { _progress.add(lessonId); saveProgress(_progress); }
export function unmarkComplete(lessonId) { _progress.delete(lessonId); saveProgress(_progress); }

// ─── course data ──────────────────────────────────────────────────────────────

export const COURSES = [
  {
    id: "c1",
    title: "Getting Started",
    icon: "🚀",
    lessons: [
      {
        id: "c1-l1",
        title: "What is Skript?",
        content: `
          ${h2("What is Skript?")}
          ${p("Skript is a plugin for Minecraft servers that lets you write game logic using plain English-like syntax. No Java, no compile steps, no classpath headaches — you write a <code>.sk</code> file, drop it in your plugins/Skript/scripts folder, and type <code>/sk reload all</code>.")}
          ${p("That's the whole workflow. It's fast to iterate, easy to read, and powerful enough to build complete minigames, economy systems, and anything else a server needs.")}

          ${h3("Why Skript instead of a custom plugin?")}
          ${ul([
            "No build tools or IDE setup — just a text editor",
            "Hot-reload in seconds with <code>/sk reload</code>",
            "Instantly readable by anyone on your team",
            "Access to all Minecraft events without reading Bukkit docs",
            "A huge library of addons (skript-db, skript-gui, SkBee, etc.) for extra power",
          ])}

          ${h3("How it runs")}
          ${p("Skript compiles your <code>.sk</code> files to an internal format when you reload. Errors are printed to the server console with line numbers. The code runs on the server thread, responding to events in real time.")}

          ${note("Skript is server-side only. Players don't install anything. It's entirely transparent to them.")}

          ${h3("A taste of what's possible")}
          ${code(`# Broadcast a message whenever a player joins
on join:
    broadcast "%player% joined the game!"`)}

          ${p("That's a complete, working Skript file. Three lines. No imports, no class declarations, no main method.")}

          ${tip("SkStudio's linter will catch syntax errors as you type, so you'll know about problems before you even touch the server.")}
        `,
        challenge: {
          prompt: "Write a Skript event that broadcasts a message to everyone when a player joins. The message should include the player's name.",
          starter: `on join:\n    `,
          answer: `on join:\n    broadcast "%player% joined the game!"`,
          hint: "Use the 'broadcast' effect and the %player% placeholder inside a string.",
          checks: [
            { pattern: /^on join\s*:/im, message: "Start with 'on join:' at zero indentation." },
            { pattern: /broadcast\b/i, message: "Use 'broadcast' to send a message to all players." },
            { pattern: /%player%/i, message: "Include %player% in the message to show the player's name." },
          ],
        },
      },
      {
        id: "c1-l2",
        title: "Setting Up Your Server",
        content: `
          ${h2("Setting Up a Skript Server")}
          ${p("You need a Paper or Spigot server running Minecraft 1.20.x or 1.21.x. Skript 2.6+ supports all of these. Vanilla or Fabric servers will not work — Skript needs the Bukkit/Spigot API.")}

          ${h3("Install steps")}
          ${ul([
            "Download Paper from <strong>papermc.io</strong> and start your server at least once",
            "Download the latest Skript from <strong>github.com/SkriptLang/Skript/releases</strong>",
            "Drop <code>Skript.jar</code> into your <code>plugins/</code> folder",
            "Start (or restart) the server — Skript creates <code>plugins/Skript/scripts/</code>",
            "Create a file like <code>plugins/Skript/scripts/test.sk</code> and start coding",
          ])}

          ${h3("Useful in-game commands")}
          ${code(`/sk reload all              # reload every script
/sk reload scripts/test.sk  # reload one specific file
/sk enable test.sk          # enable a disabled script
/sk disable test.sk         # disable without deleting`)}

          ${h3("The scripts folder")}
          ${p("You can organise your scripts into subfolders freely. Skript loads everything recursively. A file that starts with a hyphen (<code>-</code>) is ignored, which is a handy way to disable a script without deleting it.")}
          ${code(`plugins/Skript/scripts/
  economy/
    coins.sk
    shop.sk
  minigames/
    spleef.sk
  -draft-feature.sk     # ignored`)}

          ${tip("Keep your scripts organised by feature from the start. Skript projects grow fast and a flat folder quickly becomes a mess.")}

          ${h3("Checking for errors")}
          ${p("After a reload, any parse errors appear in the server console prefixed with <code>[Skript]</code>. They include the file name and line number, so fixing them is straightforward. SkStudio's parser panel shows the same errors before you even hit the server.")}
        `,
        challenge: {
          prompt: "Write an 'on quit' event that broadcasts a message when a player disconnects — something like '&cPlayerName left the server.'",
          starter: `on quit:\n    `,
          answer: `on quit:\n    broadcast "&c%player% left the server."`,
          hint: "Use 'on quit:' and the 'broadcast' effect. Include %player% and a colour code like &c for red.",
          checks: [
            { pattern: /^on quit\s*:/im, message: "Use 'on quit:' to listen for players leaving." },
            { pattern: /broadcast\b/i, message: "Use 'broadcast' to send the message to everyone." },
            { pattern: /%player%/i, message: "Include %player% to show who left." },
          ],
        },
      },
      {
        id: "c1-l3",
        title: "Your First Script",
        content: `
          ${h2("Your First Script")}
          ${p("Let's build something real. We'll write a welcome script that greets players when they join, shows them a title, and gives them a starter kit if it's their first time.")}

          ${h3("Step 1: The join event")}
          ${p("Every Skript file is made up of one or more <strong>events</strong>. An event block starts at the first indentation level and ends when the indentation returns to zero.")}
          ${code(`on join:
    send "Welcome to the server, %player%!" to player`)}

          ${p("<code>%player%</code> is a placeholder — Skript replaces it with the joining player's name. All placeholders use <code>%</code> signs.")}

          ${h3("Step 2: Adding a title")}
          ${code(`on join:
    send "Welcome to the server, %player%!" to player
    send title "Welcome!" with subtitle "Enjoy your stay" to player`)}

          ${h3("Step 3: A first-join kit")}
          ${p("We can use a variable to track if a player has joined before. Variables that use <code>%player%</code> in their name automatically save a separate value per player.")}
          ${code(`on join:
    send title "Welcome!" with subtitle "Enjoy your stay" to player

    if {firstjoin.%player%} is not set:
        set {firstjoin.%player%} to true
        give player a stone sword named "&aStarter Sword"
        give player 10 apples
        send "&aHere's your starter kit!" to player`)}

          ${tip("The <code>&a</code> is a Minecraft colour code — &a is green. You can use & codes in any text that Skript sends to players.")}

          ${h3("Full first script")}
          ${code(`# welcome.sk — greets players and handles first joins

on join:
    send title "Welcome!" with subtitle "&7Enjoy your stay." to player
    send "&7Welcome back, &a%player%&7!" to player

    if {firstjoin.%player%} is not set:
        set {firstjoin.%player%} to true
        give player a stone sword named "&aStarter Sword"
        give player 10 apples
        send "&aYou've received a starter kit. Good luck!" to player

on quit:
    broadcast "&c%player% left the server."

`)}

          ${warn("Indentation matters in Skript. Use consistent tabs or spaces — never mix them. SkStudio's linter flags mixed indentation automatically.")}

          ${note("Save this file as <code>plugins/Skript/scripts/welcome.sk</code>, then run <code>/sk reload all</code> to test it.")}
        `,
        challenge: {
          prompt: "Write an 'on join' event that checks if {firstjoin.%player%} is not set. If so, set it to true and send the player a green welcome message like '&aWelcome to the server for the first time!'",
          starter: `on join:\n    `,
          answer: `on join:\n    if {firstjoin.%player%} is not set:\n        set {firstjoin.%player%} to true\n        send "&aWelcome to the server for the first time!" to player`,
          hint: "Use 'if {firstjoin.%player%} is not set:', then set it to true and send a message with 'send ... to player'.",
          checks: [
            { pattern: /^on join\s*:/im, message: "Start with 'on join:'" },
            { pattern: /\{firstjoin\.%player%\}\s+is not set/i, message: "Check 'if {firstjoin.%player%} is not set:'" },
            { pattern: /set\s+\{firstjoin\.%player%\}\s+to\s+true/i, message: "Set {firstjoin.%player%} to true inside the if block." },
            { pattern: /send\s+".+"\s+to\s+player/i, message: "Send a welcome message to the player." },
          ],
        },
      },
      {
        id: "c1-l4",
        title: "Comments & File Structure",
        content: `
          ${h2("Comments & File Structure")}
          ${p("As your scripts grow you'll want them to stay readable. Good file structure and comments are the difference between a script you can revisit in six months and one that's a complete mystery.")}

          ${h3("Comments")}
          ${p("Anything after a <code>#</code> on a line is a comment. Skript ignores it completely.")}
          ${code(`# This is a top-level comment describing the whole file

on join:
    # Send a welcome message to the player
    send "Hello!" to player  # inline comment — fine too`)}

          ${h3("The options block")}
          ${p("The <code>options:</code> block defines reusable constants. Reference them with <code>{@name}</code>. This is great for things like prefixes and permission strings that appear in many places.")}
          ${code(`options:
    prefix: &8[&aMyServer&8]
    admin-perm: myserver.admin

on join:
    send "{@prefix} &7Welcome, &a%player%&7!"

command /reload-scripts:
    permission: {@admin-perm}
    trigger:
        send "{@prefix} &aReloading..." to player`)}

          ${tip("Using options for your prefix means you only change it in one place. No more find-and-replacing across 20 files.")}

          ${h3("Splitting code across files")}
          ${p("There's no import system in Skript — every file in the scripts folder loads automatically. Variables are shared across all files. So you can split your project however makes sense:")}
          ${code(`scripts/
  events.sk       # on join, on quit, on death…
  commands.sk     # /home, /spawn, /kit…
  economy.sk      # coins, shop logic
  gui/
    shop.sk       # shop GUI
    kit.sk        # kit selection GUI`)}

          ${warn("Since all variables are global, be careful about variable name collisions when splitting across files. A naming convention like <code>{plugin.feature.player}</code> prevents most conflicts.")}

          ${h3("Recommended file header")}
          ${code(`###############################################
# economy.sk
# Handles coins, daily rewards, and the shop.
# Requires: Vault (for permissions)
# Author: YourName
###############################################

options:
    prefix: &8[&6Economy&8]`)}

          ${note("These are just conventions. Skript doesn't enforce any structure beyond valid syntax. Find a style that works for your team and be consistent.")}
        `,
        challenge: {
          prompt: "Create an options block that defines a 'prefix' option set to '&8[&aMyServer&8]'. Then write an 'on join' event that sends '{@prefix} &7Welcome, &a%player%!' to the player.",
          starter: `options:\n    prefix: &8[&aMyServer&8]\n\non join:\n    `,
          answer: `options:\n    prefix: &8[&aMyServer&8]\n\non join:\n    send "{@prefix} &7Welcome, &a%player%!" to player`,
          hint: "Define 'prefix:' under 'options:', then reference it as {@prefix} inside the send effect.",
          checks: [
            { pattern: /^options\s*:/im, message: "Add an 'options:' block at the top of the file." },
            { pattern: /\{@prefix\}/i, message: "Reference the option using {@prefix} in your send message." },
            { pattern: /send\s+".+"\s+to\s+player/i, message: "Send the message to the player with 'send ... to player'." },
          ],
        },
      },
    ],
  },

  // ── COURSE 2 ─────────────────────────────────────────────────────────────────
  {
    id: "c2",
    title: "Core Concepts",
    icon: "🧠",
    lessons: [
      {
        id: "c2-l1",
        title: "Events",
        content: `
          ${h2("Events")}
          ${p("Events are the foundation of everything in Skript. Your code never runs on its own — it runs in response to something that happened on the server.")}

          ${h3("Event syntax")}
          ${p("An event block starts with <code>on &lt;event name&gt;:</code> at zero indentation. Everything indented under it runs when the event fires.")}
          ${code(`on join:
    # runs every time a player joins

on chat:
    # runs when a player sends a chat message

on death:
    # runs when any entity dies`)}

          ${h3("Event values")}
          ${p("Inside an event, Skript exposes relevant objects. In <code>on join</code>, <code>player</code> is the joining player. In <code>on damage</code>, you get both <code>victim</code> and <code>attacker</code>. These differ per event.")}
          ${code(`on damage:
    victim is a player
    attacker is a player
    send "&c%attacker% hit you for %damage% damage!" to victim`)}

          ${h3("Common events")}
          ${code(`on join:               # player connects
on quit:               # player disconnects
on chat:               # player sends chat (event-message is the text)
on command:            # any command is run
on death:              # entity dies
on respawn:            # player respawns
on damage:             # entity takes damage
on break:              # player breaks a block (event-block)
on place:              # player places a block
on right click:        # player right-clicks
on left click:         # player left-clicks
on inventory click:    # player clicks inside an inventory
on pickup:             # player picks up an item
on drop:               # player drops an item
on level change:       # player's XP level changes
on move:               # player moves (fires very often!)`)}

          ${warn("<code>on move</code> fires dozens of times per second. Never put heavy code in it. Check if the player actually changed blocks first: <code>if floor of old location is not floor of new location</code>.")}

          ${h3("Cancelling events")}
          ${p("Many events can be cancelled, which prevents the default action from occurring.")}
          ${code(`on chat:
    if player has permission "chat.banned":
        cancel event
        send "&cYou are muted." to player`)}

          ${tip("The linter will warn you if you use <code>cancel event</code> inside a non-cancellable event. Not all events can be cancelled — for example, <code>on death</code> can't be cancelled to prevent death, but <code>on damage</code> can.")}

          ${h3("Event-specific expressions")}
          ${code(`on chat:
    set event-message to "&7[Global] &f%event-message%"

on break:
    if event-block is diamond ore:
        cancel event
        send "&6Found diamonds!" to player

on damage:
    set damage to 0  # cancel all damage`)}
        `,
        challenge: {
          prompt: "Write an 'on chat' event that, if the player has permission 'chat.muted', sends them '&cYou are muted.' then cancels the event and stops the trigger.",
          starter: `on chat:\n    `,
          answer: `on chat:\n    if player has permission "chat.muted":\n        send "&cYou are muted." to player\n        cancel event\n        stop`,
          hint: "Check 'if player has permission \"chat.muted\":', send the message, then cancel event, then add 'stop' so nothing else runs.",
          checks: [
            { pattern: /^on chat\s*:/im, message: "Start with 'on chat:'" },
            { pattern: /has permission/i, message: "Check the player's permission with 'has permission'." },
            { pattern: /cancel event/i, message: "Use 'cancel event' to stop the message from appearing in chat." },
            { pattern: /send\s+".+"\s+to\s+player/i, message: "Send a muted message to the player." },
            { pattern: /\bstop\b/i, message: "Add 'stop' after cancel event so the rest of the trigger doesn't run." },
          ],
        },
      },
      {
        id: "c2-l2",
        title: "Conditions",
        content: `
          ${h2("Conditions")}
          ${p("Conditions let you run code only when certain things are true. They're the <code>if/else</code> system of Skript, but written to read like English.")}

          ${h3("Basic if / else")}
          ${code(`on chat:
    if player has permission "chat.color":
        set event-message to "&b%event-message%"
    else:
        set event-message to "&7%event-message%"  # grey for regular players`)}

          ${h3("else if chains")}
          ${code(`on join:
    if player has permission "rank.owner":
        send title "&cOwner" to player
    else if player has permission "rank.admin":
        send title "&4Admin" to player
    else if player has permission "rank.mod":
        send title "&9Mod" to player
    else:
        send title "&7Player" to player`)}

          ${h3("Common conditions")}
          ${code(`# Comparisons
if {coins.%player%} >= 100:
if {coins.%player%} is 0:
if {coins.%player%} is between 50 and 200:

# Type checks
if player is an op:
if victim is a zombie:
if event-block is stone:

# Possession / inventory
if player has a diamond:
if player has permission "myserver.vip":
if player's gamemode is creative:

# String / text
if player's name is "Notch":
if event-message contains "hello":

# Negation
if player is not in water:
if {ban.%player%} is not set:
if event-item is not a sword:`)}

          ${h3("Multiple conditions on one line")}
          ${p("You can combine conditions with <code>and</code> and <code>or</code>:")}
          ${code(`on damage:
    attacker is a player
    victim is a player  # same as 'and' — each line is an additional condition

on chat:
    if player's name is "Steve" or player's name is "Alex":
        cancel event
        send "&cYou can't chat." to player`)}

          ${tip("When you put multiple bare conditions at the top of an event block without an 'if', they act as implicit filters — the rest of the event only runs if all of them are true.")}

          ${h3("Conditional effects with 'unless'")}
          ${code(`on join:
    unless player has permission "join.silent":
        broadcast "&a%player% joined!"

    # 'unless' is just 'if not' — pick whichever reads better`)}
        `,
        challenge: {
          prompt: "Write an 'on damage' event that only runs when BOTH the attacker and victim are players. If they are, send a message to the victim saying '&cPlayerName hit you!'",
          starter: `on damage:\n    `,
          answer: `on damage:\n    attacker is a player\n    victim is a player\n    send "&c%attacker% hit you!" to victim`,
          hint: "Put 'attacker is a player' and 'victim is a player' as bare conditions at the top — they act as filters. Then send the message to victim.",
          checks: [
            { pattern: /^on damage\s*:/im, message: "Start with 'on damage:'" },
            { pattern: /attacker is a player/i, message: "Filter with 'attacker is a player' as a bare condition." },
            { pattern: /victim is a player/i, message: "Filter with 'victim is a player' as a bare condition." },
            { pattern: /send\s+".+"\s+to\s+victim/i, message: "Send the hit message 'to victim', not to player." },
          ],
        },
      },
      {
        id: "c2-l3",
        title: "Variables",
        content: `
          ${h2("Variables")}
          ${p("Variables store data. In Skript there are three kinds: global, local, and list variables. They all use curly braces, but their naming rules differ.")}

          ${h3("Global variables")}
          ${p("Global variables are available everywhere, are shared across all scripts, and persist across server restarts (Skript saves them to disk).")}
          ${code(`set {coins.%player%} to 100
add 50 to {coins.%player%}
remove 10 from {coins.%player%}
send "You have %{coins.%player%}% coins." to player
delete {coins.%player%}  # remove the variable entirely`)}

          ${note("The <code>%{...}%</code> syntax wraps a variable inside a placeholder so it can be included in a string. Yes, the braces are nested.")}

          ${h3("Local variables")}
          ${p("Local variables start with <code>_</code> and only exist inside the current event or function call. They're not saved to disk and can't be accessed from other events. Use these for temporary calculations.")}
          ${code(`on join:
    set {_greeting} to "Welcome, %player%!"
    if player has permission "vip":
        set {_greeting} to "&6VIP Welcome, %player%!"
    send {_greeting} to player
    # {_greeting} is gone after this event finishes`)}

          ${h3("List variables")}
          ${p("List variables use <code>::</code> to create indexed collections. They're Skript's version of arrays or dictionaries.")}
          ${code(`# Add to a list
add "Steve" to {team.red::*}
add "Alex" to {team.red::*}

# Access by index (1-based)
set {_first} to {team.red::1}

# Loop through all entries
loop {team.red::*}:
    send "&cRed team: %loop-value%" to all players

# Delete the whole list
delete {team.red::*}

# Specific named keys
set {home.%player%::world} to player's world
set {home.%player%::x} to player's x coordinate`)}

          ${h3("Variable naming conventions")}
          ${code(`# Per-player data — use %player% in the name
{coins.%player%}          # player's coin balance
{rank.%player%}           # player's rank string
{firstjoin.%player%}      # boolean flag

# Per-entity
{health.bonus.%entity%}

# Server-wide counters
{stats.total_joins}
{shop.stock.%item%}

# Lists
{team.red::*}             # list of red team members
{ban.list::*}             # list of banned names`)}

          ${warn("Don't use spaces in variable names. Use dots, underscores, or camelCase as separators: <code>{myServer.someValue}</code> not <code>{my server some value}</code>.")}

          ${tip("Use local variables (<code>{_name}</code>) for any temporary value inside an event. They're faster, don't write to disk, and can't accidentally collide with global variables in other scripts.")}
        `,
        challenge: {
          prompt: "Write an 'on join' event that adds the player's name to a global list variable called {joinlog::*}, then sends them a message showing their coins balance from {coins.%player%} (default 0 if not set).",
          starter: `on join:\n    `,
          answer: `on join:\n    add player's name to {joinlog::*}\n    send "Your coins: %{coins.%player%} ? 0%" to player`,
          hint: "Use 'add player's name to {joinlog::*}' for the list, and '? 0' as a default value fallback in the send.",
          checks: [
            { pattern: /^on join\s*:/im, message: "Start with 'on join:'" },
            { pattern: /add .+ to \{joinlog::\*\}/i, message: "Add the player's name to {joinlog::*} using 'add ... to {joinlog::*}'." },
            { pattern: /\{coins\.%player%\}/i, message: "Reference the coins variable as {coins.%player%}." },
          ],
        },
      },
      {
        id: "c2-l4",
        title: "Loops",
        content: `
          ${h2("Loops")}
          ${p("Loops repeat a block of code — either a set number of times, over a list of items, or over all players/entities on the server.")}

          ${h3("Loop times")}
          ${code(`loop 5 times:
    send "Hello!" to all players
    # runs 'send' 5 times
    # loop-number gives the current iteration (1, 2, 3, 4, 5)`)}

          ${code(`loop 10 times:
    set {_i} to loop-number
    wait 1 tick
    send "&7Countdown: &c%{_i}%" to all players`)}

          ${h3("Loop items in a list")}
          ${code(`add "Steve" to {staff::*}
add "Alex" to {staff::*}
add "Notch" to {staff::*}

on join:
    loop {staff::*}:
        if player's name is loop-value:
            send "&aStaff member joined: %player%" to all players`)}

          ${h3("Loop all players")}
          ${code(`command /broadcast <text>:
    permission: server.broadcast
    trigger:
        loop all players:
            send "&6[Broadcast] &f%arg-1%" to loop-player`)}

          ${h3("Loop entities")}
          ${code(`command /killmobs:
    permission: server.killmobs
    trigger:
        set {_count} to 0
        loop all hostile mobs in world "world":
            kill loop-entity
            add 1 to {_count}
        send "Killed %{_count}% mobs." to player`)}

          ${h3("While loops")}
          ${code(`set {_count} to 10
while {_count} > 0:
    send "Countdown: %{_count}%" to all players
    remove 1 from {_count}
    wait 1 second`)}

          ${warn("<code>while</code> loops can freeze the server if the condition never becomes false or if there's no <code>wait</code> statement. Always make sure the loop can terminate.")}

          ${h3("Exiting a loop")}
          ${code(`loop all players:
    if loop-player's name is "Notch":
        send "Found Notch!" to player
        stop loop  # stop this specific loop

    # 'exit loop' also works — same thing`)}

          ${tip("Use <code>loop-value</code> when looping over lists. Use <code>loop-player</code> when looping over players. Use <code>loop-entity</code> when looping over entities. Use <code>loop-number</code> when looping a fixed number of times.")}
        `,
        challenge: {
          prompt: "Write a command '/broadcast <text>' that loops all players and sends each one the message in arg-1 prefixed with '&6[Broadcast] &f'.",
          starter: `command /broadcast <text>:\n    trigger:\n        `,
          answer: `command /broadcast <text>:\n    trigger:\n        loop all players:\n            send "&6[Broadcast] &f%arg-1%" to loop-player`,
          hint: "Use 'loop all players:' and send to 'loop-player' (not 'player') inside the loop.",
          checks: [
            { pattern: /^command \/broadcast\s*<text>\s*:/im, message: "Define 'command /broadcast <text>:'" },
            { pattern: /loop all players\s*:/i, message: "Use 'loop all players:' to iterate over every online player." },
            { pattern: /loop-player/i, message: "Inside a player loop, use 'loop-player' to refer to the current player." },
            { pattern: /send\s+".+"\s+to\s+loop-player/i, message: "Send the message 'to loop-player'." },
          ],
        },
      },
      {
        id: "c2-l5",
        title: "Functions",
        content: `
          ${h2("Functions")}
          ${p("Functions let you write reusable blocks of logic. Define a function once, call it from anywhere in any script. This is the biggest tool for keeping your code clean and avoiding repetition.")}

          ${h3("Defining a function")}
          ${code(`function greet(p: player):
    send "&aHello, %{_p}%!" to {_p}
    send "&7Welcome to the server." to {_p}`)}

          ${p("The parameter <code>p: player</code> declares a parameter named <code>p</code> of type <code>player</code>. Inside the function, you reference it as <code>{_p}</code> — a local variable.")}

          ${h3("Calling a function")}
          ${code(`on join:
    greet(player)

on respawn:
    greet(player)`)}

          ${h3("Functions with return values")}
          ${code(`function formatCoins(amount: number) :: text:
    if {_amount} >= 1000:
        return "&6%floor({_amount} / 1000)%k coins"
    return "&e%{_amount}% coins"

on join:
    set {_display} to formatCoins({coins.%player%})
    send "Balance: %{_display}%" to player`)}

          ${p("The <code>:: text</code> after the parameter list declares the return type. Use <code>return</code> to send a value back to the caller.")}

          ${h3("Multiple parameters")}
          ${code(`function addCoins(p: player, amount: number):
    add {_amount} to {coins.%{_p}%}
    send "&aYou received %{_amount}% coins!" to {_p}

function removeCoins(p: player, amount: number) :: boolean:
    if {coins.%{_p}%} < {_amount}:
        send "&cNot enough coins." to {_p}
        return false
    remove {_amount} from {coins.%{_p}%}
    send "&cYou spent %{_amount}% coins." to {_p}
    return true

# Usage:
on right click on diamond block:
    set {_success} to removeCoins(player, 100)
    if {_success} is true:
        send "&aYou unlocked the diamond room!" to player`)}

          ${tip("Functions are great for anything you do in more than one place: giving rewards, sending formatted messages, checking player state. If you write the same ten lines twice, make it a function.")}

          ${h3("Functions across files")}
          ${p("Functions defined in any script are available to all other scripts. Define your utility functions in a dedicated <code>utils.sk</code> file and call them from everywhere.")}

          ${note("You can't pass lists directly as function parameters in Skript. Work around this by using a global list variable and reading it inside the function.")}
        `,
        challenge: {
          prompt: "Write a function called 'addCoins' that takes a player parameter 'p' and a number parameter 'amount'. It should add {_amount} to {coins.%{_p}%} and send a green '&aYou received X coins!' message to {_p}.",
          starter: `function addCoins(p: player, amount: number):\n    `,
          answer: `function addCoins(p: player, amount: number):\n    add {_amount} to {coins.%{_p}%}\n    send "&aYou received %{_amount}% coins!" to {_p}`,
          hint: "Parameters become local variables: 'p' is {_p}, 'amount' is {_amount}. Use 'add {_amount} to {coins.%{_p}%}'.",
          checks: [
            { pattern: /^function addCoins\s*\(\s*p\s*:\s*player\s*,\s*amount\s*:\s*number\s*\)\s*:/im, message: "Define 'function addCoins(p: player, amount: number):'" },
            { pattern: /add \{_amount\} to \{coins\.%\{_p\}%\}/i, message: "Add {_amount} to {coins.%{_p}%} using 'add ... to ...'." },
            { pattern: /send\s+".+"\s+to\s+\{_p\}/i, message: "Send the message 'to {_p}' (the function parameter)." },
          ],
        },
      },
    ],
  },

  // ── COURSE 3 ─────────────────────────────────────────────────────────────────
  {
    id: "c3",
    title: "Commands & Permissions",
    icon: "⚡",
    lessons: [
      {
        id: "c3-l1",
        title: "Creating Commands",
        content: `
          ${h2("Creating Commands")}
          ${p("Skript lets you create custom commands with a clean, declarative syntax. No plugin.yml, no Java, no reflection — just write the command block and reload.")}

          ${h3("Basic command")}
          ${code(`command /hello:
    trigger:
        send "Hello, %player%!" to player`)}

          ${h3("Command properties")}
          ${code(`command /spawn:
    description: Teleport to spawn
    usage: /spawn
    permission: server.spawn
    permission message: &cYou don't have permission to use this.
    aliases: /hub, /lobby
    executable by: players
    trigger:
        teleport player to spawn of world "world"`)}

          ${ul([
            "<strong>description</strong> — shows in /help",
            "<strong>usage</strong> — shown when used incorrectly",
            "<strong>permission</strong> — required permission node",
            "<strong>permission message</strong> — sent if player lacks the permission",
            "<strong>aliases</strong> — alternative command names",
            "<strong>executable by</strong> — players, console, or players and console",
          ])}

          ${h3("Console vs player commands")}
          ${code(`command /announce <text>:
    executable by: players and console
    permission: server.announce
    trigger:
        if player is set:
            broadcast "&6[%player%] &f%arg-1%"
        else:
            broadcast "&6[Console] &f%arg-1%"`)}

          ${note("When a command is run from console, 'player' is not set. Always check before using player-specific expressions in console-compatible commands.")}

          ${h3("Cooldowns")}
          ${code(`command /kit:
    cooldown: 1 hour
    cooldown message: &cYou can claim your kit again in %remaining time%.
    cooldown bypass: kit.nocooldown
    trigger:
        give player a diamond sword
        give player 32 steak
        send "&aKit claimed!" to player`)}

          ${tip("Skript handles cooldown persistence automatically. The cooldown survives reloads and restarts.")}
        `,
        challenge: {
          prompt: "Write a '/spawn' command that requires permission 'server.spawn', has a permission message '&cNo permission.', and teleports the player to the spawn of world 'world'.",
          starter: `command /spawn:\n    `,
          answer: `command /spawn:\n    permission: server.spawn\n    permission message: &cNo permission.\n    trigger:\n        teleport player to spawn of world "world"`,
          hint: "Add 'permission:', 'permission message:', and 'trigger:' properties. Then teleport inside the trigger block.",
          checks: [
            { pattern: /^command \/spawn\s*:/im, message: "Start with 'command /spawn:'" },
            { pattern: /permission\s*:\s*server\.spawn/i, message: "Add 'permission: server.spawn' property." },
            { pattern: /permission message\s*:/i, message: "Add a 'permission message:' to show when the player lacks permission." },
            { pattern: /teleport player/i, message: "Use 'teleport player to spawn of world ...' in the trigger." },
          ],
        },
      },
      {
        id: "c3-l2",
        title: "Arguments & Parsing",
        content: `
          ${h2("Command Arguments")}
          ${p("Commands without arguments aren't very useful. Skript has a powerful argument system that parses and type-checks user input for you.")}

          ${h3("Typed arguments")}
          ${code(`command /give-coins <player> <integer>:
    trigger:
        add arg-2 to {coins.%arg-1%}
        send "&aGave %arg-2% coins to %arg-1%." to player`)}

          ${p("Skript automatically parses <code>&lt;player&gt;</code> into an online player and <code>&lt;integer&gt;</code> into a number. If parsing fails (player offline, invalid number), Skript shows the usage message.")}

          ${h3("Common argument types")}
          ${code(`<player>           # online player
<offline player>   # online or offline player (by name)
<text>             # any text (including spaces)
<integer>          # whole number
<number>           # any number (including decimals)
<boolean>          # true or false
<world>            # a loaded world by name
<item>             # a Minecraft item type
<entity type>      # a mob type`)}

          ${h3("Optional arguments")}
          ${code(`command /fly [<player>]:
    trigger:
        set {_target} to arg-1
        if {_target} is not set:
            set {_target} to player
        if {_target}'s flight mode is true:
            disable flight for {_target}
            send "&cFlight disabled." to player
        else:
            enable flight for {_target}
            send "&aFlight enabled." to player`)}

          ${h3("Remaining text")}
          ${code(`command /broadcast <text>:
    trigger:
        # arg-1 captures everything after /broadcast, including spaces
        broadcast "&6[Broadcast] &f%arg-1%"`)}

          ${h3("Named arguments (Skript 2.7+)")}
          ${code(`command /setrank <target: offline player> <rank: text>:
    trigger:
        set {rank.%arg-target%} to arg-rank
        send "Set %arg-target%'s rank to %arg-rank%." to player`)}

          ${tip("Always validate arguments yourself when using <text> — Skript can't type-check arbitrary text. Check length, content, or whether it matches a list of valid values.")}
        `,
        challenge: {
          prompt: "Write a '/give-coins <player> <integer>' command that adds arg-2 coins to {coins.%arg-1%} and sends '&aGave X coins to PlayerName.' to the executor.",
          starter: `command /give-coins <player> <integer>:\n    trigger:\n        `,
          answer: `command /give-coins <player> <integer>:\n    trigger:\n        add arg-2 to {coins.%arg-1%}\n        send "&aGave %arg-2% coins to %arg-1%." to player`,
          hint: "Use arg-1 for the target player and arg-2 for the amount. Add arg-2 to {coins.%arg-1%}.",
          checks: [
            { pattern: /^command \/give-coins\s*<player>\s*<integer>\s*:/im, message: "Define 'command /give-coins <player> <integer>:'" },
            { pattern: /add arg-2 to \{coins\.%arg-1%\}/i, message: "Add arg-2 to {coins.%arg-1%}." },
            { pattern: /send\s+".+"\s+to\s+player/i, message: "Send a confirmation message to the command executor." },
          ],
        },
      },
    ],
  },

  // ── COURSE 4 ─────────────────────────────────────────────────────────────────
  {
    id: "c4",
    title: "Data & Logic",
    icon: "📊",
    lessons: [
      {
        id: "c4-l1",
        title: "Math & Numbers",
        content: `
          ${h2("Math & Numbers")}
          ${p("Skript handles arithmetic naturally inside expressions and effects. You don't need a separate 'calculate' step — use math inline.")}

          ${h3("Basic arithmetic")}
          ${code(`set {_total} to {price} * {_quantity}
set {_half} to {_total} / 2
add 100 to {coins.%player%}
remove {_cost} from {coins.%player%}

# Inline math in strings:
send "Total: %{price} * {_quantity}%" to player`)}

          ${h3("Math functions")}
          ${code(`set {_rounded} to round({_value})
set {_floored} to floor({_value})   # rounds down
set {_ceiled}  to ceil({_value})    # rounds up
set {_abs}     to abs({_value})     # absolute value
set {_max}     to max(10, {_score}) # larger of two values
set {_min}     to min(100, {_score})
set {_rand}    to random integer between 1 and 6  # dice roll`)}

          ${h3("Random numbers")}
          ${code(`# Random integer (inclusive on both ends)
set {_roll} to random integer between 1 and 100

# Random number (decimal)
set {_chance} to random number between 0 and 1

# Using randomness for drop chances
on death of zombie:
    set {_roll} to random integer between 1 and 100
    if {_roll} <= 15:  # 15% chance
        drop a diamond at event-entity's location`)}

          ${h3("Formatting numbers")}
          ${code(`# Skript doesn't have built-in number formatting, but you can use math:
function formatNum(n: number) :: text:
    if {_n} >= 1000000:
        return "%floor({_n} / 100000) / 10%M"
    if {_n} >= 1000:
        return "%floor({_n} / 100) / 10%k"
    return "%{_n}%"`)}

          ${tip("Skript stores numbers as Java doubles. Very large integers lose precision. For currency or counts that might exceed a few billion, this is something to be aware of.")}
        `,
        challenge: {
          prompt: "Write an 'on death of zombie' event that has a 20% drop chance: generate a random integer between 1 and 100. If it's <= 20, drop a diamond at the zombie's location.",
          starter: `on death of zombie:\n    `,
          answer: `on death of zombie:\n    set {_roll} to random integer between 1 and 100\n    if {_roll} <= 20:\n        drop a diamond at event-entity's location`,
          hint: "Use 'random integer between 1 and 100' and check 'if {_roll} <= 20:' then 'drop a diamond at event-entity's location'.",
          checks: [
            { pattern: /^on death of zombie\s*:/im, message: "Start with 'on death of zombie:'" },
            { pattern: /random integer between 1 and 100/i, message: "Use 'random integer between 1 and 100'." },
            { pattern: /if \{_roll\}\s*<=\s*20\s*:/i, message: "Check 'if {_roll} <= 20:' for the 20% chance." },
            { pattern: /drop a diamond/i, message: "Use 'drop a diamond at event-entity's location'." },
          ],
        },
      },
      {
        id: "c4-l2",
        title: "Strings & Text",
        content: `
          ${h2("Strings & Text")}
          ${p("Text manipulation is everywhere in Skript — formatting messages, building dynamic content, parsing input. Here's everything you need.")}

          ${h3("String operations")}
          ${code(`set {_name} to player's name
set {_upper} to {_name} in upper case
set {_lower} to {_name} in lower case
set {_len}   to length of {_name}

# Substrings
set {_first3} to first 3 characters of {_name}
set {_last3}  to last 3 characters of {_name}
set {_mid}    to characters 2 to 5 of {_name}

# Checking content
if {_name} contains "admin":
if {_name} starts with "Mr":
if {_name} ends with "Jr":
if {_name} matches "^[A-Za-z0-9_]{3,16}$":  # regex`)}

          ${h3("Joining and splitting")}
          ${code(`# Join list into a string
set {_joined} to join {mylist::*} with ", "
send "Members: %{_joined}%" to player

# Split a string into a list
set {_parts::*} to "Steve,Alex,Notch" split by ","
# {_parts::1} = "Steve", {_parts::2} = "Alex" ...`)}

          ${h3("String replacement")}
          ${code(`set {_msg} to event-message
set {_msg} to {_msg} with "[REDACTED]" instead of "badword"
# or:
replace all "%" in {_msg} with "%%"`)}

          ${h3("Colour codes")}
          ${code(`send "&cRed &aGreen &bCyan &6Gold &9Blue &dPink" to player

# Hex colours (Paper 1.16+)
send "##ff6600Custom orange" to player

# Gradient (using SkBee or MiniMessage format)
# Without addons: use alternating colour codes for a manual gradient`)}

          ${tip("Use <code>colored \"&aText here\"</code> to apply colour codes to a string stored in a variable before sending it.")}
        `,
        challenge: {
          prompt: "Write an 'on join' event that takes the player's name, converts it to upper case into {_upper}, then sends '&7Your name in caps: &b%{_upper}%' to the player.",
          starter: `on join:\n    `,
          answer: `on join:\n    set {_upper} to player's name in upper case\n    send "&7Your name in caps: &b%{_upper}%" to player`,
          hint: "Use 'player's name in upper case' to get the uppercase version, store it in {_upper}, then send a message using %{_upper}%.",
          checks: [
            { pattern: /^on join\s*:/im, message: "Start with 'on join:'" },
            { pattern: /in upper case/i, message: "Use 'player's name in upper case' to convert the name." },
            { pattern: /\{_upper\}/i, message: "Store the result in a local variable like {_upper}." },
            { pattern: /send\s+".+"\s+to\s+player/i, message: "Send the message to the player." },
          ],
        },
      },
      {
        id: "c4-l3",
        title: "Scheduling & Delays",
        content: `
          ${h2("Scheduling & Delays")}
          ${p("Skript lets you delay code, repeat things on a schedule, and build countdowns — all without writing a full scheduler plugin.")}

          ${h3("wait")}
          ${code(`on join:
    send "&aWelcome!" to player
    wait 3 seconds
    send "&7Don't forget to vote at &bvote.example.com&7!" to player`)}

          ${p("After <code>wait</code>, execution resumes where it left off. Other events on the server continue normally while waiting.")}

          ${h3("every (repeating tasks)")}
          ${code(`every 1 minute:
    broadcast "&6Vote at vote.example.com for rewards!"

every 30 seconds:
    loop all players:
        add 1 to {playtime.minutes.%loop-player%}

every 5 minutes in world "world":
    set the time to 6000  # force day every 5 min`)}

          ${h3("Countdown example")}
          ${code(`command /countdown:
    trigger:
        broadcast "&eCountdown starting!"
        loop 10 times:
            set {_n} to 11 - loop-number
            broadcast "&c%{_n}%..."
            wait 1 second
        broadcast "&aGO!"
        loop all players:
            set loop-player's gamemode to survival`)}

          ${h3("Delayed scheduled tasks")}
          ${code(`on join:
    wait 5 seconds
    if player is online:  # check they're still connected
        send "&7Reminder: type /help to see all commands." to player`)}

          ${warn("After a <code>wait</code>, always check that the player is still online before doing anything with them. They could have disconnected during the delay.")}

          ${h3("Stopping repeating tasks")}
          ${code(`# Every blocks can't be cancelled easily — use a flag variable
every 1 second:
    if {autosave.enabled} is true:
        # do autosave logic
        pass  # 'pass' does nothing — it's a no-op placeholder`)}
        `,
        challenge: {
          prompt: "Write an 'on join' event that sends '&aWelcome!' immediately, then waits 5 seconds, checks if the player is still online, and if so sends '&7Remember to vote at vote.example.com!'",
          starter: `on join:\n    `,
          answer: `on join:\n    send "&aWelcome!" to player\n    wait 5 seconds\n    if player is online:\n        send "&7Remember to vote at vote.example.com!" to player`,
          hint: "Send the first message, use 'wait 5 seconds', then check 'if player is online:' before sending the second.",
          checks: [
            { pattern: /^on join\s*:/im, message: "Start with 'on join:'" },
            { pattern: /wait \d+ seconds?/i, message: "Use 'wait X seconds' to add a delay." },
            { pattern: /if player is online\s*:/i, message: "Always check 'if player is online:' after a wait." },
            { pattern: /send\s+".+"\s+to\s+player/i, message: "Send a delayed follow-up message to the player." },
          ],
        },
      },
    ],
  },

  // ── COURSE 5 ─────────────────────────────────────────────────────────────────
  {
    id: "c5",
    title: "Player Interaction",
    icon: "🎮",
    lessons: [
      {
        id: "c5-l1",
        title: "Chat, Titles & Action Bar",
        content: `
          ${h2("Chat, Titles & Action Bar")}
          ${p("Sending information to players in the right format makes a huge difference in how polished your server feels. Here's every channel available.")}

          ${h3("Chat messages")}
          ${code(`send "Hello!" to player
send "Hello!" to all players
send "Hello!" to {team.red::*}  # send to everyone in a list
broadcast "Server-wide announcement!"`)}

          ${h3("Titles")}
          ${code(`# Basic title
send title "&bWelcome!" to player

# Title with subtitle
send title "&bWelcome!" with subtitle "&7Enjoy your stay." to player

# Control timing (in ticks — 20 ticks = 1 second)
send title "&aGO!" with subtitle "&7Round starting..." fade in 10 stay 40 fade out 10 to player

# Hide title
send title "" with subtitle "" to player`)}

          ${h3("Action bar")}
          ${code(`# One-time action bar
send action bar "&aYou picked up a diamond!" to player

# Persistent action bar HUD (must be resent regularly)
every 2 ticks:
    loop all players:
        send action bar "&7Coins: &6%{coins.%loop-player%}% &7| HP: &c%loop-player's health%" to loop-player`)}

          ${tip("The action bar disappears after ~3 seconds unless you keep resending it. For a persistent HUD, resend every 2 ticks (10 times per second) to ensure no flicker.")}

          ${h3("Tab list header/footer")}
          ${code(`on join:
    send "&6&lMySERVER" as the tab list header to player
    send "&7%{online players count}% players online" as the tab list footer to player`)}

          ${h3("Boss bar")}
          ${code(`# Create a boss bar
create a bossbar with title "&cBoss Fight!" and fill 1 with color red
# Requires SkBee addon for full boss bar control`)}

          ${h3("Formatting chat events")}
          ${code(`on chat:
    set {_rank} to {rank.%player%} ? "Player"
    set event-message to "&8[&7%{_rank}%&8] &f%player%&7: %event-message%"
    cancel event
    broadcast event-message`)}

          ${note("Formatting chat by modifying event-message and then cancelling the event + broadcasting manually gives you full control over how chat looks.")}
        `,
        challenge: {
          prompt: "Write an 'every 2 ticks' task that loops all players and sends each one an action bar showing their coins: '&7Coins: &6X' where X is {coins.%loop-player%} defaulting to 0.",
          starter: `every 2 ticks:\n    `,
          answer: `every 2 ticks:\n    loop all players:\n        send action bar "&7Coins: &6%{coins.%loop-player%} ? 0%" to loop-player`,
          hint: "Use 'every 2 ticks:', loop all players, and send action bar 'to loop-player'. Use '? 0' as a default value.",
          checks: [
            { pattern: /^every 2 ticks\s*:/im, message: "Start with 'every 2 ticks:' for the repeating task." },
            { pattern: /loop all players\s*:/i, message: "Use 'loop all players:' to iterate over everyone online." },
            { pattern: /send action bar/i, message: "Use 'send action bar \"...\" to loop-player'." },
            { pattern: /loop-player/i, message: "Send the action bar 'to loop-player', not 'to player'." },
          ],
        },
      },
      {
        id: "c5-l2",
        title: "Custom Inventories & GUIs",
        content: `
          ${h2("Custom Inventories & GUIs")}
          ${p("Custom chest GUIs are one of the most common Skript features — shop menus, kit selectors, settings panels. Here's the full pattern.")}

          ${h3("Opening a custom inventory")}
          ${code(`command /menu:
    trigger:
        open chest with 3 rows named "&8Main Menu" to player

        format slot 13 of player with a nether star named "&6Main Feature" with lore "&7Click to use" to run:
            send "You clicked the main feature!" to player

        format slot 0 of player with a red stained glass pane named " " to close then run:
            pass  # decorative border item — does nothing`)}

          ${h3("Building a shop GUI")}
          ${code(`function openShop(p: player):
    open chest with 4 rows named "&8&lItem Shop" to {_p}

    # Diamond sword — slot 10
    format slot 10 of {_p} with a diamond sword named "&bDiamond Sword" \
        with lore ["&7Cost: &650 coins", "", "&aClick to buy!"] to run:
        if {coins.%{_p}%} < 50:
            send "&cNot enough coins!" to {_p}
        else:
            remove 50 from {coins.%{_p}%}
            give {_p} a diamond sword
            send "&aYou bought a Diamond Sword!" to {_p}
            close inventory of {_p}

    # Close button — slot 31
    format slot 31 of {_p} with a barrier named "&cClose" to close`)}

          ${h3("Detecting clicks without format slot")}
          ${code(`on inventory click:
    inventory name of player's open inventory is "&8Main Menu"
    cancel event  # prevent taking items

    if clicked slot is 13:
        send "Slot 13 clicked!" to player
        close player's inventory`)}

          ${h3("Filling borders")}
          ${code(`function fillBorder(p: player, rows: number):
    # Top and bottom rows
    loop {_rows} * 9 - 1 times:
        set {_slot} to loop-number - 1
        if {_slot} < 9 or {_slot} >= ({_rows} - 1) * 9:
            format slot {_slot} of {_p} with a black stained glass pane named " " to do nothing`)}

          ${warn("Always cancel the <code>on inventory click</code> event when handling GUI clicks, or players can take items out of your GUI inventory.")}
        `,
        challenge: {
          prompt: "Write a '/menu' command that opens a 3-row chest named '&8Main Menu' to the player, then formats slot 13 with a nether star named '&6Click Me' that sends '&aYou clicked it!' to the player when clicked.",
          starter: `command /menu:\n    trigger:\n        `,
          answer: `command /menu:\n    trigger:\n        open chest with 3 rows named "&8Main Menu" to player\n        format slot 13 of player with a nether star named "&6Click Me" to run:\n            send "&aYou clicked it!" to player`,
          hint: "Use 'open chest with 3 rows named ... to player', then 'format slot 13 of player with ... to run:' and send inside.",
          checks: [
            { pattern: /^command \/menu\s*:/im, message: "Define 'command /menu:'" },
            { pattern: /open chest with 3 rows/i, message: "Use 'open chest with 3 rows named \"...\" to player'." },
            { pattern: /format slot 13/i, message: "Format slot 13 with the nether star item." },
            { pattern: /to run\s*:/i, message: "Use 'to run:' to define what happens on click." },
          ],
        },
      },
      {
        id: "c5-l3",
        title: "Scoreboard",
        content: `
          ${h2("Scoreboard")}
          ${p("The scoreboard sidebar is one of the most visible UI elements on a server. Skript can control it directly, though for complex setups an addon like SkBee gives more power.")}

          ${h3("Basic scoreboard")}
          ${code(`on join:
    wait 1 tick  # let player fully load first
    set line 1 of sidebar of player to "&6&lMySERVER"
    set line 2 of sidebar of player to "&7"
    set line 3 of sidebar of player to "&7Coins: &6%{coins.%player%}%"
    set line 4 of sidebar of player to "&7Rank: &b%{rank.%player%} ? "Player"%"
    set line 5 of sidebar of player to "&7"
    set line 6 of sidebar of player to "&7play.example.com"
    set title of sidebar of player to "&6&lMySERVER"`)}

          ${h3("Live updating scoreboard")}
          ${code(`every 4 ticks:
    loop all players:
        set line 3 of sidebar of loop-player to "&7Coins: &6%{coins.%loop-player%}%"
        set line 4 of sidebar of loop-player to "&7Online: &a%size of all players%"`)}

          ${h3("Clearing the scoreboard")}
          ${code(`command /scoreboard off:
    trigger:
        remove player's sidebar
        send "&7Scoreboard hidden." to player`)}

          ${tip("Don't update the scoreboard more often than needed — every 4 ticks (5 times per second) is smooth and performant. Updating every tick is overkill for most use cases.")}

          ${h3("Per-world scoreboards")}
          ${code(`on join:
    if player's world is world "minigame":
        showMinigameBoard(player)
    else:
        showLobbyBoard(player)

on world change:
    if player's world is world "minigame":
        showMinigameBoard(player)
    else:
        showLobbyBoard(player)`)}
        `,
        challenge: {
          prompt: "Write an 'on join' event that waits 1 tick, sets the sidebar title to '&6&lMySERVER', sets line 1 to '&7Coins: &6X' (using {coins.%player%}), and line 2 to the server IP '&7play.example.com'.",
          starter: `on join:\n    `,
          answer: `on join:\n    wait 1 tick\n    set title of sidebar of player to "&6&lMySERVER"\n    set line 1 of sidebar of player to "&7Coins: &6%{coins.%player%} ? 0%"\n    set line 2 of sidebar of player to "&7play.example.com"`,
          hint: "Wait 1 tick first so the player is fully loaded. Then use 'set title of sidebar of player to' and 'set line N of sidebar of player to'.",
          checks: [
            { pattern: /^on join\s*:/im, message: "Start with 'on join:'" },
            { pattern: /wait 1 tick/i, message: "Wait 1 tick before setting the scoreboard so the player is fully loaded." },
            { pattern: /set title of sidebar of player/i, message: "Use 'set title of sidebar of player to \"...\"' for the header." },
            { pattern: /set line \d+ of sidebar of player/i, message: "Use 'set line N of sidebar of player to \"...\"' for each row." },
          ],
        },
      },
    ],
  },

  // ── COURSE 6 ─────────────────────────────────────────────────────────────────
  {
    id: "c6",
    title: "Visual Effects",
    icon: "✨",
    lessons: [
      {
        id: "c6-l1",
        title: "Sound Effects",
        content: `
          ${h2("Sound Effects")}
          ${p("Sound feedback is one of the simplest things you can add that makes interactions feel real and polished. Skript gives you direct access to every sound in the game.")}

          ${h3("Playing a sound")}
          ${code(`# Play at player's location with volume and pitch
play sound "entity.experience_orb.pickup" at player with volume 1 and pitch 1

# Play to a specific player (they hear it regardless of location)
play sound "block.note_block.pling" to player with volume 1 and pitch 2

# Play to all players at a location
play sound "entity.lightning_bolt.thunder" at location of player`)}

          ${h3("Volume and pitch")}
          ${code(`# Volume: 0.0 to 1.0 (above 1.0 increases range, not loudness)
# Pitch: 0.5 (low) to 2.0 (high) — 1.0 is normal

play "block.note_block.pling" to player with volume 0.8 and pitch 1.5  # bright ping
play "entity.villager.no"     to player with volume 1 and pitch 0.8    # low, grumpy
play "ui.button.click"        to player                                 # UI click`)}

          ${h3("Sound IDs")}
          ${p("Use the Minecraft wiki or <code>/playsound</code> tab-completion in-game to find sound IDs. Common ones:")}
          ${code(`entity.player.levelup         # level up
entity.experience_orb.pickup  # XP pickup ding
block.note_block.pling        # bright ping
ui.button.click               # UI interaction
entity.villager.no            # error/deny
block.anvil.use               # crafting sound
item.armor.equip_diamond      # equip sound
entity.lightning_bolt.thunder # dramatic effect`)}

          ${h3("Random pitch for variety")}
          ${code(`on break:
    event-block is ore
    set {_pitch} to random number between 0.8 and 1.2
    play "entity.experience_orb.pickup" to player with volume 0.9 and pitch {_pitch}`)}

          ${tip("Small pitch randomization (±0.2) makes repeated sounds feel more natural instead of robotic.")}
        `,
        challenge: {
          prompt: "Write an 'on join' event that plays the sound 'entity.player.levelup' to the player at volume 1 and pitch 1.5 (higher than normal).",
          starter: `on join:\n    `,
          answer: `on join:\n    play sound "entity.player.levelup" to player with volume 1 and pitch 1.5`,
          hint: "Use 'play sound \"...\" to player with volume 1 and pitch 1.5'. Pitch above 1.0 = higher pitch.",
          checks: [
            { pattern: /^on join\s*:/im, message: "Start with 'on join:'" },
            { pattern: /play sound/i, message: "Use 'play sound \"...\"' to play a sound." },
            { pattern: /to player/i, message: "Target it 'to player' so only they hear it." },
            { pattern: /pitch\s+1\.5/i, message: "Set pitch to 1.5 for a higher-than-normal pitch." },
          ],
        },
      },
      {
        id: "c6-l2",
        title: "Particle Systems",
        content: `
          ${h2("Particle Systems")}
          ${p("Particles are one of the most visually impressive tools in Skript. From simple spell effects to elaborate celebration bursts, particles bring your server to life.")}

          ${h3("Basic particle spawn")}
          ${code(`# Spawn particles at a location
spawn 10 flame particles at player's location

# Offset: spread particles within a radius
spawn 30 cloud particles at player's location with offset 0.5, 1, 0.5

# Spread over the player's body
spawn 20 heart particles at player's location with offset 0.3, 0.8, 0.3`)}

          ${h3("Common particle types")}
          ${code(`flame           # fire/spell effect
cloud           # potion throw
heart           # love/heal effect
happy villager  # success indicator
angry villager  # error/deny indicator
crit            # critical hit
enchanted hit   # magic damage
explosion       # explosion puff
large explosion # bigger explosion
fireworks spark # celebration
note            # musical note (coloured)
dust            # configurable colour dust
end rod         # bright white sparkle
portal          # purple/dark portal swirl
witch           # purple drip
totem           # totem of undying colours`)}

          ${h3("Coloured dust particles")}
          ${code(`# Dust particles let you set an RGB colour
spawn 20 dust particles using dustOption(red, 1) at player's location
spawn 20 dust particles using dustOption(rgb(0, 255, 128), 1.5) at player's location with offset 0.5, 0.5, 0.5`)}

          ${h3("Effect rings and circles")}
          ${code(`# Spawn particles in a horizontal ring around the player
function particleRing(loc: location, radius: number, count: integer, particle: text):
    loop {_count} times:
        set {_angle} to loop-number * (360 / {_count})
        set {_x} to {_radius} * cos({_angle})
        set {_z} to {_radius} * sin({_angle})
        set {_loc} to {_loc} ~ vector({_x}, 0, {_z})
        spawn 1 {_particle} particles at {_loc}`)}

          ${h3("Helix / spiral effect")}
          ${code(`command /helix:
    trigger:
        set {_loc} to player's location
        loop 60 times:
            set {_t} to loop-number * 0.2
            set {_x} to cos({_t} * 60) * 1.5
            set {_z} to sin({_t} * 60) * 1.5
            set {_y} to {_t} * 0.2
            spawn 1 end rod particles at {_loc} ~ vector({_x}, {_y}, {_z})
            wait 1 tick`)}

          ${tip("Use <code>wait 1 tick</code> inside particle loops to spread them over time instead of spawning everything instantly, which can lag clients.")}

          ${h3("Explosion + sound combo")}
          ${code(`function celebrate(loc: location):
    spawn 60 fireworks spark particles at {_loc} with offset 1, 1, 1
    spawn 30 large explosion particles at {_loc}
    play "entity.firework_rocket.blast" at {_loc} with volume 1 and pitch 1
    play "entity.firework_rocket.twinkle" at {_loc} with volume 0.8 and pitch 1.2`)}
        `,
        challenge: {
          prompt: "Write an 'on join' event that spawns 20 heart particles at the player's location with offset 0.5, 1, 0.5.",
          starter: `on join:\n    `,
          answer: `on join:\n    spawn 20 heart particles at player's location with offset 0.5, 1, 0.5`,
          hint: "Use 'spawn 20 heart particles at player's location with offset 0.5, 1, 0.5'.",
          checks: [
            { pattern: /^on join\s*:/im, message: "Start with 'on join:'" },
            { pattern: /spawn \d+ heart particles/i, message: "Use 'spawn 20 heart particles'." },
            { pattern: /at player's location/i, message: "Spawn them at the player's location." },
            { pattern: /with offset/i, message: "Use 'with offset 0.5, 1, 0.5' to spread the particles." },
          ],
        },
      },
      {
        id: "c6-l3",
        title: "Advanced Particles",
        content: `
          ${h2("Advanced Particle Techniques")}
          ${p("Now that you know the basics, here are the patterns that make particle effects look professional. The key is math — using angles, vectors, and timing.")}

          ${h3("Sphere effect")}
          ${code(`function particleSphere(center: location, radius: number, density: integer):
    loop {_density} times:
        # Random point on sphere surface (uniform distribution)
        set {_theta} to random number between 0 and 360
        set {_phi}   to random number between 0 and 180
        set {_x} to {_radius} * sin({_phi}) * cos({_theta})
        set {_y} to {_radius} * cos({_phi})
        set {_z} to {_radius} * sin({_phi}) * sin({_theta})
        spawn 1 end rod particles at {_center} ~ vector({_x}, {_y}, {_z})`)}

          ${h3("Shockwave ring")}
          ${code(`function shockwave(loc: location):
    loop 20 times:
        set {_radius} to loop-number * 0.25
        set {_step} to max(1, floor({_radius} * 8))
        loop {_step} times:
            set {_angle} to loop-number * (360 / {_step})
            set {_x} to {_radius} * cos({_angle})
            set {_z} to {_radius} * sin({_angle})
            spawn 1 smoke particles at {_loc} ~ vector({_x}, 0, {_z})
        wait 1 tick`)}

          ${h3("Following particles on a player")}
          ${code(`every 1 tick:
    loop all players:
        if {particle.trail.%loop-player%} is true:
            set {_loc} to loop-player's location
            spawn 3 flame particles at {_loc} with offset 0.1, 0, 0.1

command /trail:
    trigger:
        if {particle.trail.%player%} is true:
            delete {particle.trail.%player%}
            send "&cParticle trail disabled." to player
        else:
            set {particle.trail.%player%} to true
            send "&aParticle trail enabled!" to player`)}

          ${h3("Paint with particles: heart shape")}
          ${code(`function drawHeart(loc: location, scale: number):
    loop 60 times:
        set {_t} to loop-number * (360 / 60)
        # Parametric heart curve
        set {_x} to 16 * (sin({_t})) ^ 3 * {_scale} / 10
        set {_y} to (13 * cos({_t}) - 5 * cos(2*{_t}) - 2 * cos(3*{_t}) - cos(4*{_t})) * {_scale} / 10
        spawn 1 dust particles using dustOption(red, 1.5) at {_loc} ~ vector({_x}, {_y}, 0)`)}

          ${tip("Particle math uses degrees by default in Skript's trig functions (sin, cos). If you're following a tutorial that uses radians, multiply the angle by 57.3 (180/π) to convert.")}

          ${note("Heavy particle effects can lag clients with low-end hardware. Consider checking graphics settings or providing a <code>/particles off</code> command to disable trail effects per-player.")}
        `,
        challenge: {
          prompt: "Write a '/trail' command that toggles a particle trail for the player. If {particle.trail.%player%} is true, delete it and tell them it's off; otherwise set it to true and tell them it's on. Then write an 'every 1 tick' that spawns 3 flame particles at players whose trail is active.",
          starter: `command /trail:\n    trigger:\n        \n\nevery 1 tick:\n    `,
          answer: `command /trail:\n    trigger:\n        if {particle.trail.%player%} is true:\n            delete {particle.trail.%player%}\n            send "&cParticle trail disabled." to player\n        else:\n            set {particle.trail.%player%} to true\n            send "&aParticle trail enabled!" to player\n\nevery 1 tick:\n    loop all players:\n        if {particle.trail.%loop-player%} is true:\n            spawn 3 flame particles at loop-player's location`,
          hint: "Toggle the variable with if/else. In the every 1 tick block, loop all players and check their trail variable before spawning.",
          checks: [
            { pattern: /^command \/trail\s*:/im, message: "Define 'command /trail:'" },
            { pattern: /\{particle\.trail\.%player%\}\s+is\s+true/i, message: "Check 'if {particle.trail.%player%} is true:' to see if trail is on." },
            { pattern: /delete \{particle\.trail/i, message: "Use 'delete {particle.trail.%player%}' to turn it off." },
            { pattern: /^every 1 tick\s*:/im, message: "Add an 'every 1 tick:' repeating task for the particle effect." },
            { pattern: /spawn \d+ flame particles/i, message: "Spawn flame particles at loop-player's location inside the task." },
          ],
        },
      },
    ],
  },

  // ── COURSE 7 ─────────────────────────────────────────────────────────────────
  {
    id: "c7",
    title: "Resource Pack Integration",
    icon: "🎨",
    lessons: [
      {
        id: "c7-l1",
        title: "Custom Model Data",
        content: `
          ${h2("Custom Model Data")}
          ${p("Custom Model Data (CMD) is the standard way to give vanilla items custom 3D models via a resource pack, without needing a mod. Skript can read and write this data to create items with your custom models.")}

          ${h3("How it works")}
          ${p("In your resource pack, you add entries to an item's model JSON file that redirect to a custom model when a specific <code>custom_model_data</code> NBT value is present. Then in Skript, you create items with that NBT value.")}

          ${h3("Resource pack setup (model JSON)")}
          ${code(`// assets/minecraft/models/item/diamond.json
{
  "parent": "item/handheld",
  "textures": {
    "layer0": "item/diamond"
  },
  "overrides": [
    {"predicate": {"custom_model_data": 1001}, "model": "custom/mysword"},
    {"predicate": {"custom_model_data": 1002}, "model": "custom/myshield"}
  ]
}`)}

          ${h3("Creating items with CMD in Skript")}
          ${code(`# Minecraft 1.20.4 and below (NBT string method)
set {_item} to a diamond named "&bMystic Sword"
set {_item}'s nbt to "{CustomModelData:1001}"
give player {_item}

# Minecraft 1.21+ (direct expression via SkBee or Paper API)
set {_item} to a diamond named "&bMystic Sword"
set custom model data of {_item} to 1001
give player {_item}`)}

          ${note("For 1.21+, Minecraft replaced the CustomModelData NBT integer with a more complex system using components. Use SkBee addon's item component support for the cleanest approach on newer versions.")}

          ${h3("Checking CMD on an item")}
          ${code(`on right click:
    if player is holding a diamond:
        if nbt of player's tool contains "CustomModelData:1001":
            send "&bYou're holding the Mystic Sword!" to player`)}

          ${h3("CMD-based item registry")}
          ${code(`options:
    CMD_MYSWORD:   1001
    CMD_MYSHIELD:  1002
    CMD_CROWN:     1003

function createMysword() :: item:
    set {_item} to a diamond named "&bMystic Sword"
    set {_item}'s nbt to "{CustomModelData:{@CMD_MYSWORD}}"
    return {_item}

command /givesword:
    permission: items.custom
    trigger:
        give player createMysword()`)}

          ${tip("Keep all your CMD numbers in one place (options block or a dedicated items.sk file). It's easy to forget which number maps to which model when your resource pack grows.")}
        `,
        challenge: {
          prompt: "Write a '/givesword' command that creates a diamond item named '&bMystic Sword', sets its NBT to '{CustomModelData:1001}', and gives it to the player.",
          starter: `command /givesword:\n    trigger:\n        `,
          answer: `command /givesword:\n    trigger:\n        set {_item} to a diamond named "&bMystic Sword"\n        set {_item}'s nbt to "{CustomModelData:1001}"\n        give player {_item}`,
          hint: "Set {_item} to the diamond, set its nbt with the CustomModelData tag, then give it to player.",
          checks: [
            { pattern: /^command \/givesword\s*:/im, message: "Define 'command /givesword:'" },
            { pattern: /set \{_item\} to a diamond/i, message: "Create the item with 'set {_item} to a diamond named \"...\"'." },
            { pattern: /nbt.*CustomModelData/i, message: "Set the item's NBT to include CustomModelData:1001." },
            { pattern: /give player \{_item\}/i, message: "Give the item to the player with 'give player {_item}'." },
          ],
        },
      },
      {
        id: "c7-l2",
        title: "Action Bar with Custom Icons",
        content: `
          ${h2("Action Bar with Custom Icons")}
          ${p("The action bar sits just above the hotbar and is perfect for a persistent HUD. By combining it with resource pack font files, you can display custom icons — health bars, currency symbols, equipment indicators, anything you can draw as a texture.")}

          ${h3("How custom font icons work")}
          ${p("You define a custom font in your resource pack with bitmap character mappings. Then use those characters (by their unicode codepoint) in any text Skript sends.")}

          ${h3("Resource pack: custom font setup")}
          ${code(`// assets/minecraft/font/default.json
{
  "providers": [
    {
      "type": "bitmap",
      "file": "minecraft:font/icons.png",
      "ascent": 8,
      "height": 16,
      "chars": [
        "\\uE001\\uE002\\uE003\\uE004"
      ]
    }
  ]
}`)}

          ${p("This maps 4 characters (\\uE001–\\uE004) to the first 4 16x16 slots in <code>icons.png</code>. Each character becomes a custom icon.")}

          ${h3("Using icons in Skript")}
          ${code(`# Define your icon characters as options
options:
    ICON_COIN:    \\uE001
    ICON_HEART:   \\uE002
    ICON_SHIELD:  \\uE003
    ICON_SWORD:   \\uE004

every 2 ticks:
    loop all players:
        set {_coins} to {coins.%loop-player%} ? 0
        set {_hp} to loop-player's health
        send action bar "{@ICON_COIN} &6%{_coins}%  {@ICON_HEART} &c%{_hp}%" to loop-player`)}

          ${h3("Negative space characters")}
          ${p("A common technique is to include negative-width space characters in your font to precisely position icons and text, achieving pixel-perfect HUD layouts.")}
          ${code(`options:
    SPACE_NEG_4:  \\uF801   # moves text 4px left (negative advance)
    SPACE_NEG_8:  \\uF802   # moves text 8px left

# Overlay two icons at the same position:
# Draw background icon, then step back and draw foreground icon
send action bar "{@ICON_BACKGROUND}{@SPACE_NEG_16}{@ICON_FOREGROUND}" to player`)}

          ${tip("Negative space characters are defined in the font JSON with a negative 'advance' value. They're the key to positioning overlapping elements in the action bar.")}

          ${h3("Full HUD example")}
          ${code(`options:
    PREFIX_HUD:  \\uE010  # a wide texture that's your entire HUD background

every 2 ticks:
    loop all players:
        set {_hud} to "{@PREFIX_HUD}"  # draw HUD background first
        # then overlay data at precise positions using negative spaces
        append "{@SPACE_NEG_200}&c%floor(loop-player's health)%" to {_hud}
        send action bar {_hud} to loop-player`)}
        `,
        challenge: {
          prompt: "Write an options block defining ICON_COIN as \\uE001 and ICON_HEART as \\uE002. Then write an 'every 2 ticks' loop that sends an action bar to each player showing '{@ICON_COIN} &6X coins  {@ICON_HEART} &cY hp'.",
          starter: `options:\n    ICON_COIN: \\uE001\n    ICON_HEART: \\uE002\n\nevery 2 ticks:\n    `,
          answer: `options:\n    ICON_COIN: \\uE001\n    ICON_HEART: \\uE002\n\nevery 2 ticks:\n    loop all players:\n        send action bar "{@ICON_COIN} &6%{coins.%loop-player%} ? 0%  {@ICON_HEART} &c%loop-player's health%" to loop-player`,
          hint: "Define options with unicode values. Reference them as {@ICON_COIN} in your action bar string.",
          checks: [
            { pattern: /^options\s*:/im, message: "Define an 'options:' block." },
            { pattern: /ICON_COIN/i, message: "Define ICON_COIN in the options block." },
            { pattern: /\{@ICON_COIN\}/i, message: "Use {@ICON_COIN} in the action bar message." },
            { pattern: /loop all players/i, message: "Loop all players to send to everyone." },
            { pattern: /send action bar/i, message: "Use 'send action bar \"...\" to loop-player'." },
          ],
        },
      },
      {
        id: "c7-l3",
        title: "Equipment State Icons",
        content: `
          ${h2("Equipment State Icons")}
          ${p("One of the slickest HUD techniques is showing equipment state icons in the action bar — a helmet slot showing a glowing icon when the player is wearing armor, dimmed when they're not. Here's the full implementation.")}

          ${h3("The concept")}
          ${p("You create two versions of each equipment slot icon in your resource pack — an 'equipped' version (bright) and an 'unequipped' version (dim/greyed out). Skript checks what the player is wearing and sends the matching icons.")}

          ${h3("Resource pack setup")}
          ${code(`// Your icons.png spritesheet row might look like:
// \\uE010 = helm_unequipped (dim grey helmet)
// \\uE011 = helm_equipped   (glowing gold helmet)
// \\uE012 = chest_unequipped
// \\uE013 = chest_equipped
// \\uE014 = legs_unequipped
// \\uE015 = legs_equipped
// \\uE016 = boots_unequipped
// \\uE017 = boots_equipped`)}

          ${h3("Helper function")}
          ${code(`options:
    IC_HELM_OFF:   \\uE010
    IC_HELM_ON:    \\uE011
    IC_CHEST_OFF:  \\uE012
    IC_CHEST_ON:   \\uE013
    IC_LEGS_OFF:   \\uE014
    IC_LEGS_ON:    \\uE015
    IC_BOOTS_OFF:  \\uE016
    IC_BOOTS_ON:   \\uE017

function getArmorHUD(p: player) :: text:
    # Build a string of 4 icons based on what the player is wearing
    if {_p}'s helmet is set:
        set {_h} to "{@IC_HELM_ON}"
    else:
        set {_h} to "{@IC_HELM_OFF}"

    if {_p}'s chestplate is set:
        set {_c} to "{@IC_CHEST_ON}"
    else:
        set {_c} to "{@IC_CHEST_OFF}"

    if {_p}'s leggings are set:
        set {_l} to "{@IC_LEGS_ON}"
    else:
        set {_l} to "{@IC_LEGS_OFF}"

    if {_p}'s boots are set:
        set {_b} to "{@IC_BOOTS_ON}"
    else:
        set {_b} to "{@IC_BOOTS_OFF}"

    return "%{_h}%%{_c}%%{_l}%%{_b}%"`)}

          ${h3("Sending the HUD")}
          ${code(`every 4 ticks:
    loop all players:
        set {_armor} to getArmorHUD(loop-player)
        set {_coins} to {coins.%loop-player%} ? 0
        send action bar "%{_armor}%  &7|  &6%{_coins}% coins" to loop-player`)}

          ${h3("Reacting to equip/unequip events")}
          ${code(`on armor equip:
    # Force an immediate HUD refresh instead of waiting for the next tick
    set {_armor} to getArmorHUD(player)
    send action bar "%{_armor}%  &7|  &6%{coins.%player%} ? 0% coins" to player

on armor unequip:
    set {_armor} to getArmorHUD(player)
    send action bar "%{_armor}%  &7|  &6%{coins.%player%} ? 0% coins" to player`)}

          ${tip("Sending an immediate HUD update on equip/unequip events means the icon changes the instant the player equips or removes armor, rather than waiting up to 4 ticks.")}

          ${h3("Specific armor type checks")}
          ${code(`function getHelmetIcon(p: player) :: text:
    if {_p}'s helmet is a diamond helmet:
        return "{@IC_HELM_DIAMOND}"
    if {_p}'s helmet is a netherite helmet:
        return "{@IC_HELM_NETHERITE}"
    if {_p}'s helmet is set:
        return "{@IC_HELM_ON}"
    return "{@IC_HELM_OFF}"`)}

          ${note("You can take this as far as you want — different icons per armor material, enchantment-specific icons, durability-based icons showing cracks. The principle is always the same: check state → pick unicode character → send in action bar.")}
        `,
        challenge: {
          prompt: "Write a function 'getArmorHUD(p: player) :: text' that returns '{@IC_HELM_ON}' if {_p}'s helmet is set, otherwise '{@IC_HELM_OFF}'. (Just check the helmet for this exercise.)",
          starter: `function getArmorHUD(p: player) :: text:\n    `,
          answer: `function getArmorHUD(p: player) :: text:\n    if {_p}'s helmet is set:\n        return "{@IC_HELM_ON}"\n    return "{@IC_HELM_OFF}"`,
          hint: "Use 'if {_p}'s helmet is set:' to check for the helmet. Return the appropriate option string with 'return'.",
          checks: [
            { pattern: /^function getArmorHUD\s*\(\s*p\s*:\s*player\s*\)\s*::\s*text\s*:/im, message: "Define 'function getArmorHUD(p: player) :: text:'" },
            { pattern: /\{_p\}'s helmet is set/i, message: "Check 'if {_p}'s helmet is set:' for the equipped state." },
            { pattern: /return\s+"\{@IC_HELM_ON\}"/i, message: "Return '{@IC_HELM_ON}' when the helmet is equipped." },
            { pattern: /return\s+"\{@IC_HELM_OFF\}"/i, message: "Return '{@IC_HELM_OFF}' when no helmet is worn." },
          ],
        },
      },
    ],
  },
];

// ─── flat lesson list ──────────────────────────────────────────────────────────

export function flatLessons() {
  const out = [];
  for (const course of COURSES) {
    for (const lesson of course.lessons) {
      out.push({ ...lesson, courseId: course.id, courseTitle: course.title });
    }
  }
  return out;
}

// ─── panel renderer ───────────────────────────────────────────────────────────

let _overlay = null;
let _currentLessonId = null;

export function showCoursesPanel() {
  if (_overlay) { _overlay.remove(); _overlay = null; }

  _overlay = document.createElement("div");
  _overlay.className = "courses-overlay";
  _overlay.innerHTML = `
    <div class="courses-backdrop"></div>
    <div class="courses-window">
      <div class="courses-sidebar">
        <div class="courses-sidebar-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          <span>Skript Courses</span>
        </div>
        <div class="courses-tree" id="courses-tree"></div>
      </div>
      <div class="courses-main">
        <div class="courses-topbar">
          <button class="courses-close-btn" id="courses-close-btn">
            <svg width="11" height="11" viewBox="0 0 10 10"><path d="M0 0L10 10M10 0L0 10" stroke="currentColor" stroke-width="1.5"/></svg>
          </button>
        </div>
        <div class="courses-content" id="courses-content">
          ${renderHome()}
        </div>
        <div class="courses-nav" id="courses-nav" style="display:none">
          <button class="courses-nav-btn" id="courses-prev">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Previous
          </button>
          <span class="courses-nav-label" id="courses-nav-label"></span>
          <button class="courses-nav-btn courses-nav-next" id="courses-next">
            Next
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(_overlay);

  // Tree
  renderTree();

  // Events
  document.getElementById("courses-close-btn").onclick = closeCoursesPanel;
  _overlay.querySelector(".courses-backdrop").onclick = closeCoursesPanel;

  document.addEventListener("keydown", _escHandler);

  // Prev/Next
  document.getElementById("courses-prev").onclick = () => navigateLesson(-1);
  document.getElementById("courses-next").onclick = () => navigateLesson(1);

  // Re-open to last lesson if any
  if (_currentLessonId) {
    const all = flatLessons();
    const l = all.find(x => x.id === _currentLessonId);
    if (l) selectLesson(l);
  }
}

function _escHandler(e) {
  if (e.key === "Escape") closeCoursesPanel();
}

function closeCoursesPanel() {
  if (_overlay) {
    _overlay.remove();
    _overlay = null;
  }
  document.removeEventListener("keydown", _escHandler);
}

function renderHome() {
  const all = flatLessons();
  const done = all.filter(l => isComplete(l.id)).length;
  const pct = all.length ? Math.round((done / all.length) * 100) : 0;

  return `
    <div class="courses-home">
      <div class="courses-home-hero">
        <div class="courses-home-icon">📚</div>
        <h1>Skript Courses</h1>
        <p>Go from absolute beginner to building custom particle systems and resource-pack-powered HUDs. Every lesson has working code examples.</p>
      </div>

      <div class="courses-progress-bar-wrap">
        <div class="courses-progress-bar-track">
          <div class="courses-progress-bar-fill" style="width:${pct}%"></div>
        </div>
        <span class="courses-progress-label">${done} / ${all.length} lessons complete</span>
      </div>

      <div class="courses-home-grid">
        ${COURSES.map(c => {
          const cls = c.lessons;
          const cdone = cls.filter(l => isComplete(l.id)).length;
          const allDone = cdone === cls.length;
          return `
            <div class="courses-home-card" data-course="${c.id}">
              <span class="courses-home-card-icon">${c.icon}</span>
              <div style="flex:1">
                <div class="courses-home-card-title">${e(c.title)}</div>
                <div class="courses-home-card-meta">${cls.length} lessons · ${cdone}/${cls.length} done</div>
              </div>
              ${allDone ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>` : ""}
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function renderTree() {
  const tree = document.getElementById("courses-tree");
  if (!tree) return;

  tree.innerHTML = COURSES.map(course => {
    const done = course.lessons.filter(l => isComplete(l.id)).length;
    const total = course.lessons.length;
    const allDone = done === total;

    return `
      <div class="courses-course" data-cid="${course.id}">
        <div class="courses-course-header" data-toggle="${course.id}">
          <svg class="courses-chevron" width="10" height="10" viewBox="0 0 10 10">
            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/>
          </svg>
          <span class="courses-course-icon">${course.icon}</span>
          <span class="courses-course-name">${e(course.title)}</span>
          <span class="courses-course-count ${allDone ? 'done' : ''}">${done}/${total}</span>
        </div>
        <div class="courses-lessons" id="cl-${course.id}">
          ${course.lessons.map(lesson => {
            const done = isComplete(lesson.id);
            return `
              <div class="courses-lesson ${done ? 'completed' : ''} ${lesson.id === _currentLessonId ? 'active' : ''}"
                   data-lid="${lesson.id}" data-cid="${course.id}">
                <span class="courses-lesson-check" data-check="${lesson.id}">
                  ${done
                    ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`
                    : `<svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2" fill="none" opacity="0.3"/></svg>`
                  }
                </span>
                <span class="courses-lesson-title">${e(lesson.title)}</span>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }).join("");

  // Toggle course expand
  tree.querySelectorAll("[data-toggle]").forEach(btn => {
    btn.onclick = () => {
      const cid = btn.dataset.toggle;
      const lessonsEl = document.getElementById(`cl-${cid}`);
      const course = btn.closest(".courses-course");
      const collapsed = course.classList.toggle("collapsed");
      lessonsEl.style.display = collapsed ? "none" : "";
    };
  });

  // Lesson click
  tree.querySelectorAll(".courses-lesson").forEach(el => {
    el.onclick = (ev) => {
      // Checkbox toggle on hover icon click
      if (ev.target.closest("[data-check]")) {
        const lid = ev.target.closest("[data-check]").dataset.check;
        if (isComplete(lid)) unmarkComplete(lid);
        else markComplete(lid);
        renderTree();
        return;
      }
      const lid = el.dataset.lid;
      const cid = el.dataset.cid;
      const course = COURSES.find(c => c.id === cid);
      const lesson = course?.lessons.find(l => l.id === lid);
      if (lesson) selectLesson({ ...lesson, courseId: cid, courseTitle: course.title });
    };
  });

  // Home card clicks
  document.querySelectorAll(".courses-home-card").forEach(card => {
    card.onclick = () => {
      const cid = card.dataset.course;
      const course = COURSES.find(c => c.id === cid);
      if (!course || !course.lessons.length) return;
      const l = course.lessons[0];
      selectLesson({ ...l, courseId: cid, courseTitle: course.title });
    };
  });
}

function selectLesson(lesson) {
  _currentLessonId = lesson.id;

  const contentEl = document.getElementById("courses-content");
  const navEl     = document.getElementById("courses-nav");
  const prevBtn   = document.getElementById("courses-prev");
  const nextBtn   = document.getElementById("courses-next");
  const labelEl   = document.getElementById("courses-nav-label");

  if (!contentEl) return;

  // Lesson content
  contentEl.innerHTML = `
    <div class="courses-lesson-view">
      <div class="courses-breadcrumb">
        <span class="courses-breadcrumb-course" id="crumb-home">${e(lesson.courseTitle)}</span>
        <span class="courses-breadcrumb-sep">›</span>
        <span>${e(lesson.title)}</span>
      </div>
      <div class="courses-lesson-body">
        ${lesson.content}
      </div>
      ${lesson.challenge ? renderChallenge(lesson) : ""}
      <div class="courses-complete-row">
        <button class="courses-mark-btn ${isComplete(lesson.id) ? 'done' : ''}" data-lid="${lesson.id}">
          ${isComplete(lesson.id)
            ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg> Completed`
            : `Mark as Complete`}
        </button>
      </div>
    </div>
  `;
  contentEl.scrollTop = 0;

  // Breadcrumb home link
  contentEl.querySelector("#crumb-home")?.addEventListener("click", () => {
    _currentLessonId = null;
    contentEl.innerHTML = renderHome();
    if (navEl) navEl.style.display = "none";
    // Rewire home cards
    contentEl.querySelectorAll(".courses-home-card").forEach(card => {
      card.onclick = () => {
        const cid = card.dataset.course;
        const course = COURSES.find(c => c.id === cid);
        if (!course?.lessons.length) return;
        selectLesson({ ...course.lessons[0], courseId: cid, courseTitle: course.title });
      };
    });
    renderTree();
  });

  // Mark complete button
  contentEl.querySelector(".courses-mark-btn").onclick = function() {
    const lid = this.dataset.lid;
    if (isComplete(lid)) unmarkComplete(lid);
    else markComplete(lid);
    renderTree();
    selectLesson(lesson); // re-render
  };

  // Challenge handlers
  const runBtn = contentEl.querySelector("#challenge-run");
  const ansBtn = contentEl.querySelector("#challenge-see-answer");
  const editorTA = contentEl.querySelector("#challenge-editor");
  if (runBtn && lesson.challenge) {
    runBtn.onclick = () => runChallenge(lesson.challenge);
    ansBtn.onclick = () => revealAnswer(lesson.challenge);
  }
  // Tab key in the textarea inserts 4 spaces instead of moving focus
  if (editorTA) {
    editorTA.addEventListener("keydown", (ev) => {
      if (ev.key === "Tab") {
        ev.preventDefault();
        const s = editorTA.selectionStart;
        const e2 = editorTA.selectionEnd;
        editorTA.value = editorTA.value.slice(0, s) + "    " + editorTA.value.slice(e2);
        editorTA.selectionStart = editorTA.selectionEnd = s + 4;
      }
    });
  }

  // Nav
  const all = flatLessons();
  const idx = all.findIndex(l => l.id === lesson.id);
  navEl.style.display = "flex";
  prevBtn.disabled = idx <= 0;
  nextBtn.disabled = idx >= all.length - 1;
  if (labelEl) labelEl.textContent = `${idx + 1} / ${all.length}`;

  // Highlight active in tree
  document.querySelectorAll(".courses-lesson").forEach(el => {
    el.classList.toggle("active", el.dataset.lid === lesson.id);
  });
}

function renderChallenge(lesson) {
  const ch = lesson.challenge;
  return `
    <div class="courses-challenge">
      <div class="courses-challenge-header">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        <span>Interactive Challenge</span>
      </div>
      <div class="courses-challenge-prompt">${e(ch.prompt)}</div>
      <textarea class="courses-challenge-editor" id="challenge-editor" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off">${e(ch.starter || "")}</textarea>
      <div class="courses-challenge-toolbar">
        <button class="courses-challenge-btn courses-challenge-run" id="challenge-run">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
          Run
        </button>
        <button class="courses-challenge-btn courses-challenge-answer" id="challenge-see-answer">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          See Answer
        </button>
      </div>
      <div class="courses-challenge-result" id="challenge-result" style="display:none"></div>
    </div>
  `;
}

async function runChallenge(ch) {
  const textarea = document.getElementById("challenge-editor");
  const resultEl = document.getElementById("challenge-result");
  if (!textarea || !resultEl) return;

  const code = textarea.value;
  resultEl.style.display = "block";
  resultEl.innerHTML = `<span class="challenge-checking">Parsing…</span>`;

  // Dynamically import lintCode so courses.js doesn't need a hard dep at load time
  let diagnostics = [];
  try {
    const { lintCode } = await import("./skript/linter.js");
    diagnostics = lintCode(code);
  } catch (err) {
    resultEl.innerHTML = `<div class="challenge-error"><b>Linter error:</b> ${e(String(err))}</div>`;
    return;
  }

  // If linter found errors, show them and stop
  if (diagnostics.length > 0) {
    const errList = diagnostics.map(d =>
      `<li class="challenge-lint-item challenge-lint-${d.severity}">${e(d.message)}</li>`
    ).join("");
    resultEl.innerHTML = `
      <div class="challenge-fail">
        <div class="challenge-fail-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Skript found errors — fix these before it will load on the server:
        </div>
        <ul class="challenge-lint-list">${errList}</ul>
      </div>`;
    return;
  }

  // Check challenge-specific patterns
  const failed = [];
  for (const chk of (ch.checks || [])) {
    const pattern = chk.pattern instanceof RegExp ? chk.pattern : new RegExp(chk.pattern);
    if (!pattern.test(code)) {
      failed.push(chk.message);
    }
  }

  if (failed.length > 0) {
    const items = failed.map(m => `<li>${e(m)}</li>`).join("");
    resultEl.innerHTML = `
      <div class="challenge-fail">
        <div class="challenge-fail-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Not quite right — a few things to fix:
        </div>
        <ul class="challenge-lint-list">${items}</ul>
        <div class="challenge-hint">💡 Hint: ${e(ch.hint || "")}</div>
      </div>`;
    return;
  }

  // All good!
  resultEl.innerHTML = `
    <div class="challenge-pass">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      <div>
        <div class="challenge-pass-title">Looks good! No parser errors and all requirements met.</div>
        <div class="challenge-pass-sub">This code would load cleanly with <code>/sk reload all</code>.</div>
      </div>
    </div>`;
}

function revealAnswer(ch) {
  const textarea = document.getElementById("challenge-editor");
  const resultEl = document.getElementById("challenge-result");
  if (!textarea) return;

  textarea.value = ch.answer || "";
  if (resultEl) {
    resultEl.style.display = "block";
    resultEl.innerHTML = `
      <div class="challenge-answer-reveal">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        Answer revealed — study it, then try writing it from scratch!
      </div>`;
  }
}

function navigateLesson(dir) {
  const all = flatLessons();
  const idx = all.findIndex(l => l.id === _currentLessonId);
  const next = all[idx + dir];
  if (next) selectLesson(next);
}
