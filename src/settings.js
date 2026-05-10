// Settings panel + persistence
import { SYNTAX_PRESETS, TOKEN_LABELS, DEFAULT_COLORS } from "./settings-presets.js";
import {
  getAllCompletions,
  searchCompletions,
  updateCompletion,
  resetCompletion,
  deleteCompletion,
  addCustomCompletion,
  isModified,
  isCustom,
} from "./completions-store.js";
import { showAlert, showConfirm, showPrompt } from "./dialogs.js";

const STORAGE_KEY = "skstudio.settings";

const DEFAULTS = {
  fontSize: 13.5,
  theme: "dark",
  tabSize: 2,
  showLineNumbers: true,
  wordWrap: false,
  autoSave: false,
  acceptKey: "enter",
  ghostText: true,
  syntaxPreset: "skstudio",
  syntaxColors: { ...DEFAULT_COLORS },
};

let current = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULTS,
      ...parsed,
      syntaxColors: { ...DEFAULT_COLORS, ...(parsed.syntaxColors || {}) },
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function getSettings() {
  return JSON.parse(JSON.stringify(current));
}

export function updateSetting(key, value) {
  current[key] = value;
  save();
  for (const fn of listeners) fn(current, key);
}

export function updateSyntaxColor(token, color) {
  current.syntaxColors = { ...current.syntaxColors, [token]: color };
  current.syntaxPreset = "custom";
  save();
  for (const fn of listeners) fn(current, "syntaxColors");
}

export function applySyntaxPreset(presetKey) {
  const preset = SYNTAX_PRESETS[presetKey];
  if (!preset) return;
  current.syntaxPreset = presetKey;
  current.syntaxColors = { ...preset.colors };
  save();
  for (const fn of listeners) fn(current, "syntaxColors");
}

export function onSettingsChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function applyTheme(theme) {
  document.body.dataset.theme = theme;
}

// ============================================================
// Modal UI
// ============================================================
let modal;
let activeSection = "general";

const ICONS = {
  general: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  syntax: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="13.5" r="2.5"/><circle cx="8.5" cy="17.5" r="2.5"/><circle cx="6" cy="8" r="1.5"/></svg>`,
  completions: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
};

export function showSettingsModal() {
  if (modal) { modal.remove(); modal = null; }
  modal = document.createElement("div");
  modal.className = "settings-modal";
  modal.innerHTML = `
    <div class="settings-backdrop"></div>
    <div class="settings-window settings-window-wide">
      <div class="settings-header">
        <h2>Settings</h2>
        <button class="icon-btn" id="settings-close">
          <svg width="13" height="13" viewBox="0 0 10 10"><path d="M0 0L10 10M10 0L0 10" stroke="currentColor" stroke-width="1.5"/></svg>
        </button>
      </div>
      <div class="settings-layout">
        <nav class="settings-nav">
          <button class="settings-nav-item" data-section="general">${ICONS.general}<span>General</span></button>
          <button class="settings-nav-item" data-section="syntax">${ICONS.syntax}<span>Syntax</span></button>
          <button class="settings-nav-item" data-section="completions">${ICONS.completions}<span>Auto Completes</span></button>
        </nav>
        <div class="settings-content" id="settings-content"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const close = () => { modal.remove(); modal = null; };
  modal.querySelector("#settings-close").onclick = close;
  modal.querySelector(".settings-backdrop").onclick = close;
  document.addEventListener("keydown", function escClose(e) {
    if (e.key === "Escape" && modal) { close(); document.removeEventListener("keydown", escClose); }
  });

  modal.querySelectorAll(".settings-nav-item").forEach((btn) => {
    btn.onclick = () => setSection(btn.dataset.section);
  });

  setSection(activeSection);
}

function setSection(name) {
  activeSection = name;
  modal.querySelectorAll(".settings-nav-item").forEach((b) => {
    b.classList.toggle("active", b.dataset.section === name);
  });
  const content = modal.querySelector("#settings-content");
  if (name === "general") renderGeneral(content);
  else if (name === "syntax") renderSyntax(content);
  else if (name === "completions") renderCompletions(content);
}

// ============================================================
// General section
// ============================================================
function renderGeneral(root) {
  root.innerHTML = `
    <div class="settings-section">
      <h3>Editor</h3>
      <div class="settings-row">
        <label>Font size</label>
        <input type="number" id="s-font-size" min="9" max="32" step="0.5" value="${current.fontSize}" />
      </div>
      <div class="settings-row">
        <label>Tab size</label>
        <input type="number" id="s-tab-size" min="1" max="8" value="${current.tabSize}" />
      </div>
      <div class="settings-row">
        <label>Show line numbers</label>
        <input type="checkbox" id="s-line-numbers" ${current.showLineNumbers ? "checked" : ""} />
      </div>
      <div class="settings-row">
        <label>Word wrap</label>
        <input type="checkbox" id="s-word-wrap" ${current.wordWrap ? "checked" : ""} />
      </div>
    </div>

    <div class="settings-section">
      <h3>Autocomplete</h3>
      <div class="settings-row">
        <label>Accept suggestion with</label>
        <select id="s-accept-key">
          <option value="enter" ${current.acceptKey === "enter" ? "selected" : ""}>Enter (Tab accepts inline)</option>
          <option value="tab" ${current.acceptKey === "tab" ? "selected" : ""}>Tab (Enter is newline)</option>
        </select>
      </div>
      <div class="settings-row">
        <label>Inline suggestions (ghost text)</label>
        <input type="checkbox" id="s-ghost-text" ${current.ghostText ? "checked" : ""} />
      </div>
      <p class="settings-hint">Ghost text shows a dim preview of the most likely completion past your cursor. Press Tab (or your accept key) to insert it.</p>
    </div>

    <div class="settings-section">
      <h3>Theme</h3>
      <div class="settings-row">
        <label>Color theme</label>
        <select id="s-theme">
          <option value="dark" ${current.theme === "dark" ? "selected" : ""}>Dark</option>
          <option value="true-dark" ${current.theme === "true-dark" ? "selected" : ""}>True Dark (pure black)</option>
          <option value="midnight" ${current.theme === "midnight" ? "selected" : ""}>Midnight</option>
          <option value="forest" ${current.theme === "forest" ? "selected" : ""}>Forest</option>
        </select>
      </div>
    </div>

    <div class="settings-section">
      <h3>Files</h3>
      <div class="settings-row">
        <label>Auto-save on focus loss</label>
        <input type="checkbox" id="s-auto-save" ${current.autoSave ? "checked" : ""} />
      </div>
    </div>

    <div class="settings-section">
      <h3>About</h3>
      <p class="settings-about">SkStudio v0.1.0 — A modern IDE for Skript<br/>Built with Rust + Tauri</p>
    </div>
  `;

  const bind = (id, key, parser = (v) => v) => {
    const el = root.querySelector(id);
    el.addEventListener(el.type === "checkbox" ? "change" : "input", () => {
      const v = el.type === "checkbox" ? el.checked : parser(el.value);
      updateSetting(key, v);
    });
  };
  bind("#s-font-size", "fontSize", parseFloat);
  bind("#s-tab-size", "tabSize", parseInt);
  bind("#s-line-numbers", "showLineNumbers");
  bind("#s-word-wrap", "wordWrap");
  bind("#s-theme", "theme");
  bind("#s-auto-save", "autoSave");
  bind("#s-accept-key", "acceptKey");
  bind("#s-ghost-text", "ghostText");
}

// ============================================================
// Syntax section
// ============================================================
function renderSyntax(root) {
  const presetOptions = Object.entries(SYNTAX_PRESETS)
    .map(([key, p]) => `<option value="${key}" ${current.syntaxPreset === key ? "selected" : ""}>${p.name}</option>`)
    .join("");

  const colorRows = Object.entries(TOKEN_LABELS).map(([token, label]) => `
    <div class="settings-row syntax-row">
      <label>${label}</label>
      <div class="color-input-group">
        <input type="color" data-token="${token}" value="${current.syntaxColors[token]}" />
        <input type="text" class="hex-input" data-token-hex="${token}" value="${current.syntaxColors[token]}" maxlength="7" />
      </div>
    </div>
  `).join("");

  root.innerHTML = `
    <div class="settings-section">
      <h3>Preset</h3>
      <div class="settings-row">
        <label>Color scheme preset</label>
        <select id="syntax-preset">
          ${presetOptions}
          <option value="custom" ${current.syntaxPreset === "custom" ? "selected" : ""}>Custom</option>
        </select>
      </div>
      <p class="settings-hint">Choose a preset to instantly recolor syntax highlighting. Changes are applied live to all open editors. Editing any color below switches the preset to "Custom".</p>
    </div>

    <div class="settings-section">
      <h3>Colors</h3>
      ${colorRows}
    </div>

    <div class="settings-section">
      <h3>Preview</h3>
      <pre class="syntax-preview" id="syntax-preview"></pre>
    </div>
  `;

  // Preset select
  root.querySelector("#syntax-preset").addEventListener("change", (e) => {
    const v = e.target.value;
    if (v === "custom") return;
    applySyntaxPreset(v);
    renderSyntax(root); // re-render to update color inputs
  });

  // Color pickers and hex inputs
  root.querySelectorAll('input[type="color"][data-token]').forEach((picker) => {
    picker.addEventListener("input", () => {
      const token = picker.dataset.token;
      updateSyntaxColor(token, picker.value);
      root.querySelector(`[data-token-hex="${token}"]`).value = picker.value;
      root.querySelector("#syntax-preset").value = "custom";
      updatePreview(root);
    });
  });
  root.querySelectorAll(".hex-input").forEach((input) => {
    input.addEventListener("change", () => {
      const v = input.value.trim();
      if (!/^#[0-9a-fA-F]{6}$/.test(v)) { input.value = current.syntaxColors[input.dataset.tokenHex]; return; }
      const token = input.dataset.tokenHex;
      updateSyntaxColor(token, v);
      root.querySelector(`[data-token="${token}"]`).value = v;
      root.querySelector("#syntax-preset").value = "custom";
      updatePreview(root);
    });
  });

  updatePreview(root);
}

function updatePreview(root) {
  const c = current.syntaxColors;
  const preview = root.querySelector("#syntax-preview");
  if (!preview) return;
  // Hand-rolled mini highlighter for the preview only
  preview.innerHTML = `<span style="color:${c.comment};font-style:italic"># Welcome event</span>
<span style="color:${c.atom}">on join</span><span style="color:${c.operator}">:</span>
    <span style="color:${c.keyword};font-weight:600">set</span> <span style="color:${c.variable}">{joined::%player%}</span> <span style="color:${c.keyword};font-weight:600">to</span> <span style="color:${c.keyword};font-weight:600">now</span>
    <span style="color:${c.keyword};font-weight:600">broadcast</span> <span style="color:${c.string}">"&amp;a%player% joined!"</span>
    <span style="color:${c.keyword};font-weight:600">if</span> <span style="color:${c.variable}">player</span> <span style="color:${c.keyword};font-weight:600">has permission</span> <span style="color:${c.string}">"vip"</span><span style="color:${c.operator}">:</span>
        <span style="color:${c.keyword};font-weight:600">push</span> <span style="color:${c.variable}">player</span> upwards <span style="color:${c.keyword};font-weight:600">at speed</span> <span style="color:${c.number}">1</span>`;
}

// ============================================================
// Completions section
// ============================================================
let completionsState = { query: "", filter: "all", expanded: null };

function renderCompletions(root) {
  root.innerHTML = `
    <div class="completions-toolbar">
      <input type="text" id="comp-search" placeholder="Search completions..." value="${escapeAttr(completionsState.query)}" />
      <select id="comp-filter">
        <option value="all">All types</option>
        <option value="event">Events</option>
        <option value="effect">Effects</option>
        <option value="condition">Conditions</option>
        <option value="expression">Expressions</option>
        <option value="snippet">Snippets</option>
        <option value="custom">Custom</option>
      </select>
      <button class="panel-btn" id="comp-add">+ Add custom</button>
    </div>
    <div class="completions-list" id="comp-list"></div>
  `;

  root.querySelector("#comp-filter").value = completionsState.filter;
  root.querySelector("#comp-search").addEventListener("input", (e) => {
    completionsState.query = e.target.value;
    renderCompList(root);
  });
  root.querySelector("#comp-filter").addEventListener("change", (e) => {
    completionsState.filter = e.target.value;
    renderCompList(root);
  });
  root.querySelector("#comp-add").onclick = () => promptAddCustom(root);

  renderCompList(root);
}

function renderCompList(root) {
  const list = root.querySelector("#comp-list");
  const results = searchCompletions(completionsState.query, completionsState.filter);
  if (results.length === 0) {
    list.innerHTML = `<div class="comp-empty">No completions match.</div>`;
    return;
  }
  list.innerHTML = results.map((entry) => renderCompRow(entry)).join("");

  list.querySelectorAll(".comp-row-header").forEach((header) => {
    header.onclick = () => {
      const label = header.dataset.label;
      completionsState.expanded = completionsState.expanded === label ? null : label;
      renderCompList(root);
    };
  });

  // Wire up expanded panels
  list.querySelectorAll(".comp-edit-form").forEach((form) => {
    const label = form.dataset.label;
    const snippetEl = form.querySelector(".comp-snippet");
    const docEl = form.querySelector(".comp-doc");
    form.querySelector(".comp-save").onclick = () => {
      updateCompletion(label, {
        snippet: snippetEl.value,
        doc: docEl.value,
      });
      renderCompList(root);
    };
    form.querySelector(".comp-reset")?.addEventListener("click", () => {
      resetCompletion(label);
      renderCompList(root);
    });
    form.querySelector(".comp-delete").onclick = async () => {
      const ok = await showConfirm(`Remove "${label}"? This can't be undone for custom completions.`, {
        title: "Remove completion",
        okLabel: "Remove",
        danger: true,
      });
      if (ok) {
        deleteCompletion(label);
        completionsState.expanded = null;
        renderCompList(root);
      }
    };
  });
}

function renderCompRow(entry) {
  const isExpanded = completionsState.expanded === entry.label;
  const typeBadge = `<span class="comp-badge comp-badge-${entry._type}">${entry._type}</span>`;
  const modifiedBadge = entry._modified ? `<span class="comp-badge comp-badge-modified">modified</span>` : "";
  const customBadge = entry._custom ? `<span class="comp-badge comp-badge-custom">custom</span>` : "";

  let body = "";
  if (isExpanded) {
    body = `
      <div class="comp-edit-form" data-label="${escapeAttr(entry.label)}">
        <div class="comp-field">
          <label>Description</label>
          <textarea class="comp-doc" rows="2" placeholder="Short description shown in the autocomplete tooltip">${escapeHtml(entry.doc || "")}</textarea>
        </div>
        <div class="comp-field">
          <label>Template (use \${1:placeholder} for cursor stops, $0 for final cursor)</label>
          <textarea class="comp-snippet" rows="4" spellcheck="false" placeholder="The text inserted when this completion is accepted">${escapeHtml(entry.snippet || "")}</textarea>
        </div>
        <div class="comp-actions">
          <button class="panel-btn comp-save">Save</button>
          ${entry._modified ? `<button class="panel-btn comp-reset">Reset to default</button>` : ""}
          <button class="panel-btn comp-danger comp-delete">${entry._custom ? "Delete" : "Remove"}</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="comp-row${isExpanded ? " expanded" : ""}">
      <div class="comp-row-header" data-label="${escapeAttr(entry.label)}">
        <span class="comp-caret">${isExpanded ? "▾" : "▸"}</span>
        <span class="comp-label">${escapeHtml(entry.label)}</span>
        ${typeBadge}${modifiedBadge}${customBadge}
      </div>
      ${body}
    </div>
  `;
}

async function promptAddCustom(root) {
  const label = await showPrompt("Label for the new autocomplete (the text you'll type to trigger it):", {
    title: "New autocomplete",
    placeholder: "e.g. my-shortcut",
    okLabel: "Create",
  });
  if (!label || !label.trim()) return;
  const trimmed = label.trim();
  const ok = addCustomCompletion({
    label: trimmed,
    _type: "custom",
    doc: "",
    snippet: trimmed + " $0",
  });
  if (!ok) {
    await showAlert("A completion with that label already exists.", { title: "Already exists" });
    return;
  }
  completionsState.expanded = trimmed;
  renderCompList(root);
}

// ============================================================
// Helpers
// ============================================================
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function escapeAttr(s) { return escapeHtml(s).replace(/"/g, "&quot;"); }
