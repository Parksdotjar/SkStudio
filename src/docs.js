/**
 * SkStudio — Skript Docs Panel
 * Searchable reference for all Skript syntax built from data.js
 */

import { EVENTS, EFFECTS } from "./skript/data.js";

function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])
  );
}

// ── Extra entries not in autocomplete data ─────────────────────────────────

const CONDITIONS = [
  { label: "if player has permission", detail: "condition", doc: "Checks if the player has a given permission node.", category: "player" },
  { label: "if player is op", detail: "condition", doc: "True if the player is an operator.", category: "player" },
  { label: "if player is sneaking", detail: "condition", doc: "True while the player holds shift.", category: "player" },
  { label: "if player is flying", detail: "condition", doc: "True while the player is in flight mode.", category: "player" },
  { label: "if player is online", detail: "condition", doc: "True if the player is currently connected.", category: "player" },
  { label: "if {var} is set", detail: "condition", doc: "True if a variable is not empty/null.", category: "variables" },
  { label: "if {var} is not set", detail: "condition", doc: "True if a variable is empty/null.", category: "variables" },
  { label: "if {list::*} contains X", detail: "condition", doc: "True if the list variable contains the given value.", category: "variables" },
  { label: "if X is Y", detail: "condition", doc: "Equality check. Works on most types.", category: "logic" },
  { label: "if X is not Y", detail: "condition", doc: "Inequality check.", category: "logic" },
  { label: "if X > Y / X < Y", detail: "condition", doc: "Numeric comparison operators.", category: "logic" },
  { label: "if X is between A and B", detail: "condition", doc: "True if X falls within the inclusive range [A, B].", category: "logic" },
  { label: "if entity is a player", detail: "condition", doc: "Type check — true if the entity is a player.", category: "entity" },
  { label: "if entity is a monster", detail: "condition", doc: "True if the entity is a hostile mob.", category: "entity" },
  { label: "if block is {type}", detail: "condition", doc: "True if the block matches the given material type.", category: "world" },
];

const EXPRESSIONS = [
  { label: "player", detail: "expression", doc: "The player involved in the current event.", category: "player" },
  { label: "player's name", detail: "expression", doc: "The display name of the player.", category: "player" },
  { label: "player's uuid", detail: "expression", doc: "The unique UUID string of the player. Use for per-player variable keys.", category: "player" },
  { label: "player's location", detail: "expression", doc: "The player's current Location object.", category: "player" },
  { label: "player's health", detail: "expression", doc: "Current health points (0–20 by default).", category: "player" },
  { label: "player's max health", detail: "expression", doc: "Max health points.", category: "player" },
  { label: "player's food level", detail: "expression", doc: "Current hunger level (0–20).", category: "player" },
  { label: "player's level", detail: "expression", doc: "The player's vanilla XP level.", category: "player" },
  { label: "player's game mode", detail: "expression", doc: "survival, creative, adventure, or spectator.", category: "player" },
  { label: "player's inventory", detail: "expression", doc: "The player's main inventory.", category: "player" },
  { label: "player's tool", detail: "expression", doc: "The item currently held in the main hand.", category: "player" },
  { label: "player's ip", detail: "expression", doc: "The player's IP address as a string.", category: "player" },
  { label: "all players", detail: "expression", doc: "A list of all currently online players.", category: "player" },
  { label: "attacker", detail: "expression", doc: "The entity that dealt damage (in damage/death events).", category: "entity" },
  { label: "victim", detail: "expression", doc: "The entity that received damage.", category: "entity" },
  { label: "event-block", detail: "expression", doc: "The block involved in the current event.", category: "world" },
  { label: "event-item", detail: "expression", doc: "The item involved in the current event.", category: "world" },
  { label: "location of player", detail: "expression", doc: "Same as player's location.", category: "world" },
  { label: "now", detail: "expression", doc: "The current date/time. Used with 'difference between X and now'.", category: "time" },
  { label: "loop-player", detail: "expression", doc: "The current player in a 'loop all players' loop.", category: "loops" },
  { label: "loop-value", detail: "expression", doc: "The current value in a generic loop.", category: "loops" },
  { label: "loop-index", detail: "expression", doc: "The current key/index in a list variable loop.", category: "loops" },
  { label: "loop-number", detail: "expression", doc: "The iteration counter in a 'loop N times' loop (1-based).", category: "loops" },
  { label: "arg-1, arg-2, ...", detail: "expression", doc: "Command arguments by index, starting at 1.", category: "commands" },
  { label: "damage cause", detail: "expression", doc: "How the damage was dealt: fall damage, fire, poison, etc.", category: "combat" },
];

const FUNCTIONS_REF = [
  { label: "function name(param: type) :: returnType", detail: "function", doc: "Defines a reusable function. returnType is optional. Call with name(args).", category: "functions" },
  { label: "return {value}", detail: "function", doc: "Returns a value from a function.", category: "functions" },
  { label: "random integer between X and Y", detail: "function", doc: "Returns a random integer in range [X, Y].", category: "math" },
  { label: "random number between X and Y", detail: "function", doc: "Returns a random decimal in range [X, Y].", category: "math" },
  { label: "floor(X)", detail: "function", doc: "Rounds X down to the nearest integer.", category: "math" },
  { label: "ceil(X)", detail: "function", doc: "Rounds X up to the nearest integer.", category: "math" },
  { label: "round(X)", detail: "function", doc: "Rounds X to the nearest integer.", category: "math" },
  { label: "abs(X)", detail: "function", doc: "Returns the absolute value of X.", category: "math" },
  { label: "sqrt(X)", detail: "function", doc: "Returns the square root of X.", category: "math" },
  { label: "max(A, B)", detail: "function", doc: "Returns the larger of A and B.", category: "math" },
  { label: "min(A, B)", detail: "function", doc: "Returns the smaller of A and B.", category: "math" },
  { label: "size of {list::*}", detail: "function", doc: "Returns the number of entries in a list variable.", category: "lists" },
  { label: "join {list::*} with \", \"", detail: "function", doc: "Joins a list into a single string with a separator.", category: "lists" },
  { label: "index of X in {list::*}", detail: "function", doc: "Returns the numeric index of X in the list, or -1.", category: "lists" },
  { label: "difference between X and Y", detail: "function", doc: "Returns the timespan or numeric difference between two values.", category: "time" },
];

const TYPES_REF = [
  { label: "player", detail: "type", doc: "An online player on the server.", category: "entities" },
  { label: "entity", detail: "type", doc: "Any entity (player, mob, item, etc.)", category: "entities" },
  { label: "mob", detail: "type", doc: "Any non-player living entity.", category: "entities" },
  { label: "block", detail: "type", doc: "A block in the world.", category: "world" },
  { label: "item", detail: "type", doc: "An item stack.", category: "world" },
  { label: "location", detail: "type", doc: "A position (world + X/Y/Z + yaw/pitch).", category: "world" },
  { label: "text / string", detail: "type", doc: "A string of characters.", category: "data" },
  { label: "number", detail: "type", doc: "Any numeric value (int or decimal).", category: "data" },
  { label: "integer", detail: "type", doc: "Whole number only.", category: "data" },
  { label: "boolean", detail: "type", doc: "true or false.", category: "data" },
  { label: "timespan", detail: "type", doc: "A duration like '5 seconds' or '2 hours'.", category: "data" },
  { label: "world", detail: "type", doc: "A loaded Minecraft world.", category: "world" },
  { label: "vector", detail: "type", doc: "A 3D direction/velocity vector.", category: "world" },
  { label: "color", detail: "type", doc: "A color value (red, blue, etc.)", category: "data" },
  { label: "potion effect type", detail: "type", doc: "A potion effect like speed or strength.", category: "data" },
  { label: "game mode", detail: "type", doc: "survival, creative, adventure, or spectator.", category: "data" },
];

const TABS = [
  { id: "events",      label: "Events",      entries: EVENTS },
  { id: "effects",     label: "Effects",     entries: EFFECTS },
  { id: "conditions",  label: "Conditions",  entries: CONDITIONS },
  { id: "expressions", label: "Expressions", entries: EXPRESSIONS },
  { id: "functions",   label: "Functions",   entries: FUNCTIONS_REF },
  { id: "types",       label: "Types",       entries: TYPES_REF },
];

// ── Panel state ────────────────────────────────────────────────────────────
let _overlay = null;
let _activeTab = "events";
let _search = "";

export function showDocsPanel() {
  if (_overlay) { _overlay.remove(); _overlay = null; }

  _overlay = document.createElement("div");
  _overlay.className = "docs-overlay";
  _overlay.innerHTML = `
    <div class="docs-window">
      <div class="docs-titlebar">
        <div class="docs-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          Skript Reference
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <a class="docs-ext-link" href="https://docs.skriptlang.org" target="_blank" title="Open official docs">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            docs.skriptlang.org
          </a>
          <button class="docs-close" id="docs-close">
            <svg width="12" height="12" viewBox="0 0 10 10"><path d="M0 0L10 10M10 0L0 10" stroke="currentColor" stroke-width="1.5"/></svg>
          </button>
        </div>
      </div>

      <div class="docs-toolbar">
        <input class="docs-search" id="docs-search" placeholder="Search syntax…" autocomplete="off" spellcheck="false" value="${esc(_search)}">
        <div class="docs-tabs" id="docs-tabs">
          ${TABS.map(t => `<button class="docs-tab${t.id === _activeTab ? " active" : ""}" data-tab="${t.id}">${t.label}</button>`).join("")}
        </div>
      </div>

      <div class="docs-body">
        <div class="docs-list" id="docs-list"></div>
        <div class="docs-detail" id="docs-detail">
          <div class="docs-detail-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.3"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            <p>Select an entry to see details</p>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(_overlay);

  const close = () => {
    _overlay?.remove(); _overlay = null;
    document.removeEventListener("keydown", escH);
  };
  const escH = e => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", escH);
  _overlay.querySelector("#docs-close").onclick = close;
  _overlay.addEventListener("mousedown", e => { if (e.target === _overlay) close(); });

  _overlay.querySelector("#docs-search").addEventListener("input", e => {
    _search = e.target.value;
    renderList();
  });

  _overlay.querySelector("#docs-tabs").addEventListener("click", e => {
    const btn = e.target.closest(".docs-tab");
    if (!btn) return;
    _activeTab = btn.dataset.tab;
    _overlay.querySelectorAll(".docs-tab").forEach(b => b.classList.toggle("active", b.dataset.tab === _activeTab));
    renderList();
  });

  renderList();
  setTimeout(() => _overlay.querySelector("#docs-search").focus(), 50);
}

function renderList() {
  const list = _overlay.querySelector("#docs-list");
  const tabData = TABS.find(t => t.id === _activeTab);
  if (!tabData) return;

  const q = _search.toLowerCase();
  const filtered = tabData.entries.filter(e =>
    !q || e.label.toLowerCase().includes(q) || (e.doc || "").toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    list.innerHTML = `<div class="docs-empty">No results for "<strong>${esc(_search)}</strong>"</div>`;
    return;
  }

  // Group by category
  const groups = new Map();
  for (const entry of filtered) {
    const cat = entry.category || "general";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(entry);
  }

  list.innerHTML = "";
  for (const [cat, entries] of groups) {
    const header = document.createElement("div");
    header.className = "docs-group-header";
    header.textContent = cat;
    list.appendChild(header);

    for (const entry of entries) {
      const row = document.createElement("div");
      row.className = "docs-entry";
      row.innerHTML = `
        <span class="docs-entry-label">${esc(entry.label)}</span>
        <span class="docs-entry-detail ${entry.detail}">${esc(entry.detail)}</span>
      `;
      row.onclick = () => {
        list.querySelectorAll(".docs-entry").forEach(r => r.classList.remove("active"));
        row.classList.add("active");
        renderDetail(entry);
      };
      list.appendChild(row);
    }
  }
}

function renderDetail(entry) {
  const detail = _overlay.querySelector("#docs-detail");
  const snippet = entry.snippet
    ? entry.snippet.replace(/\$\{\d+:([^}]+)\}/g, "$1").replace(/\$\d+/g, "").replace(/\$0/g, "")
    : null;

  detail.innerHTML = `
    <div class="docs-detail-content">
      <div class="docs-detail-header">
        <div class="docs-detail-name">${esc(entry.label)}</div>
        <span class="docs-entry-detail ${entry.detail}">${esc(entry.detail)}</span>
      </div>
      ${entry.doc ? `<p class="docs-detail-doc">${esc(entry.doc)}</p>` : ""}
      ${snippet ? `
        <div class="docs-detail-section">Example</div>
        <pre class="docs-detail-code">${esc(snippet.trim())}</pre>
      ` : ""}
      ${entry.since ? `<div class="docs-detail-since">Since Skript ${esc(entry.since)}</div>` : ""}
    </div>
  `;
}
