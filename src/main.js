// SkStudio - main entry
import { createEditor } from "./editor.js";
import { createFileTree } from "./file-tree.js";
import { initFindReplace, toggle as toggleFindReplace, show as showFindReplace } from "./find-replace.js";
import { initTerminal, toggle as toggleTerminal } from "./terminal.js";
import { showSettingsModal, getSettings, onSettingsChange, applyTheme } from "./settings.js";
import { initMenuBar } from "./menu-bar.js";
import { showAlert, showConfirm } from "./dialogs.js";
import { undo, redo, selectAll } from "@codemirror/commands";
import { forEachDiagnostic } from "@codemirror/lint";

// Feature panels
import { showDocsPanel } from "./docs.js";
import { showCoursesPanel } from "./courses.js";
import { showServerPanel } from "./local-server.js";
import { checkForUpdate, wasDismissed, dismissVersion } from "./updater.js";

// Whiteboard – lazy because it needs a container
let _createWhiteboard = null;
async function getWhiteboard() {
  if (!_createWhiteboard) {
    const m = await import("./whiteboard.js");
    _createWhiteboard = m.createWhiteboard;
  }
  return _createWhiteboard;
}

// Tauri imports — only available inside the Tauri runtime
let invoke, openDialog, saveDialog, getCurrentWindow;
try {
  ({ invoke } = await import("@tauri-apps/api/core"));
  ({ open: openDialog, save: saveDialog } = await import("@tauri-apps/plugin-dialog"));
  ({ getCurrentWindow } = await import("@tauri-apps/api/window"));
} catch {}

// === State ===
const state = {
  tabs: [],
  activeId: null,
  nextId: 1,
  activePanel: "explorer",
};

// === DOM refs ===
const tabsEl = document.getElementById("tabs");
const contentEl = document.getElementById("content");
const newTabBtn = document.getElementById("new-tab-btn");
const statusLine = document.getElementById("status-line");
const statusCol = document.getElementById("status-col");
const statusLen = document.getElementById("status-len");

// === Side panel ===
let sidePanelEl;
function ensureSidePanel() {
  if (sidePanelEl) return sidePanelEl;
  sidePanelEl = document.createElement("aside");
  sidePanelEl.className = "side-panel";
  document.querySelector(".app").insertBefore(sidePanelEl, document.querySelector(".editor-area"));
  return sidePanelEl;
}

let fileTree;
function showFilePanel() {
  const panel = ensureSidePanel();
  panel.classList.remove("hidden");
  fileTree = createFileTree(panel, {
    onOpenFile: ({ path, title, content }) => {
      const existing = state.tabs.find((t) => t.path === path);
      if (existing) { activateTab(existing.id); return; }
      newTab({ path, title, content });
    },
  });
}
function hideFilePanel() {
  if (sidePanelEl) sidePanelEl.classList.add("hidden");
}

// === Window controls ===
async function setupWindowControls() {
  if (!getCurrentWindow) return;
  const win = getCurrentWindow();
  document.getElementById("min-btn").onclick = () => win.minimize();
  document.getElementById("max-btn").onclick = () => win.toggleMaximize();
  document.getElementById("close-btn").onclick = () => win.close();
}

// === Welcome screen ===
function welcomeHTML() {
  return `
    <div class="welcome">
      <div class="welcome-hero">
        <div class="welcome-logo">
          <img src="/src/assets/logo.png" width="120" height="120" style="object-fit:contain;display:block;" draggable="false"/>
        </div>
        <div>
          <div class="welcome-title">SkStudio</div>
          <div class="welcome-version">v0.1.0</div>
        </div>
      </div>
      <div class="welcome-columns">
        <div class="welcome-col">
          <h3>Getting Started</h3>
          <div class="welcome-link" data-action="new-file">${ico("file-plus")} New File</div>
          <div class="welcome-link" data-action="open-file">${ico("file-search")} Open File</div>
          <div class="welcome-link" data-action="open-folder">${ico("folder")} Open Folder</div>
          <div class="welcome-link" data-action="settings">${ico("settings")} Settings</div>
        </div>
        <div class="welcome-col">
          <h3>Learn &amp; Build</h3>
          <div class="welcome-link" data-action="courses">${ico("courses")} Skript Courses</div>
          <div class="welcome-link" data-action="docs">${ico("docs")} Skript Reference</div>
          <div class="welcome-link" data-action="server">${ico("server")} Local Server</div>
          <div class="welcome-link" data-action="whiteboard">${ico("whiteboard")} Whiteboard</div>
        </div>
        <div class="welcome-col">
          <h3>Need help?</h3>
          <div class="welcome-link" data-action="discord">${ico("discord")} Discord Server</div>
          <div class="welcome-link" data-action="github">${ico("github")} GitHub</div>
        </div>
      </div>
    </div>
  `;
}

const ICONS = {
  "file-plus": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`,
  "file-search": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="11.5" cy="14.5" r="2.5"/><line x1="13.5" y1="16.5" x2="15.5" y2="18.5"/></svg>`,
  "folder": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  "settings": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  "discord": `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`,
  "github": `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`,
  "courses": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  "docs": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  "server": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>`,
  "whiteboard": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
};
function ico(name) { return ICONS[name] || ""; }

function showWelcome() {
  contentEl.innerHTML = welcomeHTML();
  contentEl.querySelectorAll(".welcome-link").forEach((el) => {
    el.onclick = () => handleAction(el.dataset.action);
  });
}

// === Tabs ===
function renderTabs() {
  tabsEl.innerHTML = "";
  for (const tab of state.tabs) {
    const el = document.createElement("div");
    el.className = "tab" + (tab.id === state.activeId ? " active" : "");
    el.dataset.id = tab.id;
    el.innerHTML = `
      <span class="tab-icon">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.2 L 13.1 9.4 L 22.8 12 L 13.1 14.6 L 12 22.8 L 10.9 14.6 L 1.2 12 L 10.9 9.4 Z"/></svg>
      </span>
      <span class="tab-title">${escapeHtml(tab.title)}${tab.dirty ? ' <span class="tab-dirty">•</span>' : ""}</span>
      <span class="tab-close" data-close="${tab.id}">
        <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 0L10 10M10 0L0 10" stroke="currentColor" stroke-width="1.5"/></svg>
      </span>
    `;
    el.onclick = (e) => {
      if (e.target.closest("[data-close]")) closeTab(tab.id);
      else activateTab(tab.id);
    };
    el.oncontextmenu = (e) => { e.preventDefault(); showTabContextMenu(tab.id, e.clientX, e.clientY); };
    tabsEl.appendChild(el);
  }
}

function activateTab(id) {
  state.activeId = id;
  contentEl.innerHTML = "";

  const tab = state.tabs.find((t) => t.id === id);
  if (!tab) { showWelcome(); renderTabs(); return; }

  const pane = document.createElement("div");
  pane.className = "editor-pane active";
  contentEl.appendChild(pane);

  const settings = getSettings();
  tab.view = createEditor(pane, {
    initialDoc: tab.content,
    fontSize: settings.fontSize,
    acceptKey: settings.acceptKey,
    ghostText: settings.ghostText,
    syntaxColors: settings.syntaxColors,
    onChange: (doc) => {
      if (tab.content !== doc) { tab.content = doc; tab.dirty = true; renderTabs(); }
      // Refresh parser panel if open
      if (state.activePanel === "parser") scheduleParserRefresh();
    },
    onCursor: ({ line, col, length }) => {
      statusLine.textContent = `Line ${line}`;
      statusCol.textContent = `Column ${col}`;
      statusLen.textContent = `Length ${length}`;
    },
  });

  renderTabs();
  setTimeout(() => tab.view.focus(), 0);
}

function newTab({ title = `New file ${state.nextId}`, path = null, content = "" } = {}) {
  const id = state.nextId++;
  state.tabs.push({ id, title, path, content, dirty: false, view: null });
  activateTab(id);
}

async function closeTab(id) {
  const idx = state.tabs.findIndex((t) => t.id === id);
  if (idx === -1) return;
  const tab = state.tabs[idx];
  if (tab.dirty) {
    const ok = await showConfirm(`"${tab.title}" has unsaved changes. Close it anyway?`, {
      title: "Unsaved changes",
      okLabel: "Close without saving",
      danger: true,
    });
    if (!ok) return;
  }
  if (tab.view) tab.view.destroy();
  state.tabs.splice(idx, 1);

  if (state.activeId === id) {
    if (state.tabs.length > 0) activateTab(state.tabs[Math.max(0, idx - 1)].id);
    else {
      state.activeId = null;
      showWelcome();
      statusLine.textContent = "Line 1";
      statusCol.textContent = "Column 1";
      statusLen.textContent = "Length 0";
    }
  }
  renderTabs();
}

// === Tab context menu ===
function showTabContextMenu(tabId, x, y) {
  document.querySelectorAll(".tab-ctx-menu").forEach(m => m.remove());
  const menu = document.createElement("div");
  menu.className = "tab-ctx-menu ctx-menu";
  menu.innerHTML = `
    <div class="ctx-item" data-action="close">Close Tab</div>
    <div class="ctx-item" data-action="close-others">Close Others</div>
    <div class="ctx-item" data-action="close-all">Close All</div>
    <div class="ctx-sep"></div>
    <div class="ctx-item" data-action="copy-path">Copy Path</div>
  `;
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  document.body.appendChild(menu);

  menu.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action) handleTabCtxAction(tabId, action);
    menu.remove();
  });
  setTimeout(() => {
    document.addEventListener("mousedown", function off(e) {
      if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener("mousedown", off); }
    });
  }, 0);
}

function handleTabCtxAction(tabId, action) {
  switch (action) {
    case "close": closeTab(tabId); break;
    case "close-others":
      [...state.tabs].filter(t => t.id !== tabId).forEach(t => closeTab(t.id));
      break;
    case "close-all":
      [...state.tabs].forEach(t => closeTab(t.id));
      break;
    case "copy-path": {
      const tab = state.tabs.find(t => t.id === tabId);
      if (tab?.path) navigator.clipboard.writeText(tab.path);
      break;
    }
  }
}

// === Actions ===
function getActiveView() {
  const tab = state.tabs.find((t) => t.id === state.activeId);
  return tab ? tab.view : null;
}

async function handleAction(action) {
  switch (action) {
    case "new-file": newTab(); break;
    case "open-file": await openFile(); break;
    case "open-folder":
      if (state.activePanel !== "explorer") setActivePanel("explorer");
      if (fileTree) fileTree.openFolder();
      break;
    case "save": await saveActive(); break;
    case "save-as": await saveActiveAs(); break;
    case "close-tab": if (state.activeId) closeTab(state.activeId); break;
    case "exit":
      if (getCurrentWindow) getCurrentWindow().close();
      break;

    case "undo":       { const v = getActiveView(); if (v) { undo(v); v.focus(); } break; }
    case "redo":       { const v = getActiveView(); if (v) { redo(v); v.focus(); } break; }
    case "select-all": { const v = getActiveView(); if (v) { selectAll(v); v.focus(); } break; }
    case "copy":       await editorCopy(); break;
    case "cut":        await editorCut(); break;
    case "paste":      await editorPaste(); break;
    case "find":       showFindReplace(); break;

    case "settings":   showSettingsModal(); break;
    case "terminal":   toggleTerminal(); break;
    case "format":     showAlert("The Skript formatter is coming soon.", { title: "Format Document" }); break;
    case "analyzer":   setActivePanel("parser"); break;
    case "reload":     window.location.reload(); break;

    case "docs":       setActivePanel("docs"); break;
    case "courses":    setActivePanel("courses"); break;
    case "server":     setActivePanel("server"); break;
    case "whiteboard": setActivePanel("whiteboard"); break;

    case "welcome":    showWelcomeView(); break;
    case "discord":    openExternal("https://discord.gg/skript"); break;
    case "github":     openExternal("https://github.com/Parksdotjar/SkStudio"); break;
    case "updates":    showUpdateModal(); break;
    case "about":      showAboutModal(); break;
  }
}

function openExternal(url) {
  window.open(url, "_blank");
}

function showWelcomeView() {
  state.activeId = null;
  contentEl.innerHTML = "";
  showWelcome();
  renderTabs();
  statusLine.textContent = "Line 1";
  statusCol.textContent = "Column 1";
  statusLen.textContent = "Length 0";
}

// === Clipboard ===
async function editorCopy() {
  const v = getActiveView();
  if (!v) return;
  const sel = v.state.selection.main;
  const text = v.state.sliceDoc(sel.from, sel.to);
  if (text) await navigator.clipboard.writeText(text);
}

async function editorCut() {
  const v = getActiveView();
  if (!v) return;
  const sel = v.state.selection.main;
  const text = v.state.sliceDoc(sel.from, sel.to);
  if (text) {
    await navigator.clipboard.writeText(text);
    v.dispatch({ changes: { from: sel.from, to: sel.to, insert: "" } });
  }
  v.focus();
}

async function editorPaste() {
  const v = getActiveView();
  if (!v) return;
  try {
    const text = await navigator.clipboard.readText();
    const sel = v.state.selection.main;
    v.dispatch({
      changes: { from: sel.from, to: sel.to, insert: text },
      selection: { anchor: sel.from + text.length },
    });
    v.focus();
  } catch (e) {
    console.warn("Paste failed:", e);
  }
}

// === Save ===
async function saveActiveAs() {
  const tab = state.tabs.find((t) => t.id === state.activeId);
  if (!tab || !saveDialog || !invoke) return;
  const path = await saveDialog({
    defaultPath: tab.title,
    filters: [{ name: "Skript", extensions: ["sk"] }, { name: "All", extensions: ["*"] }],
  });
  if (!path) return;
  tab.path = path;
  tab.title = path.split(/[\\/]/).pop();
  await invoke("write_file", { path, content: tab.content });
  tab.dirty = false;
  renderTabs();
}

async function saveActive() {
  const tab = state.tabs.find((t) => t.id === state.activeId);
  if (!tab || !invoke) return;
  let path = tab.path;
  if (!path) {
    if (!saveDialog) return;
    path = await saveDialog({
      defaultPath: tab.title,
      filters: [{ name: "Skript", extensions: ["sk"] }],
    });
    if (!path) return;
    tab.path = path;
    tab.title = path.split(/[\\/]/).pop();
  }
  await invoke("write_file", { path, content: tab.content });
  tab.dirty = false;
  renderTabs();
}

async function openFile() {
  if (!openDialog || !invoke) {
    showAlert("File operations are only available in the SkStudio app.", { title: "Unavailable" });
    return;
  }
  const selected = await openDialog({
    multiple: false,
    filters: [{ name: "Skript", extensions: ["sk"] }, { name: "All", extensions: ["*"] }],
  });
  if (!selected) return;
  const path = Array.isArray(selected) ? selected[0] : selected;
  const content = await invoke("read_file", { path });
  const title = path.split(/[\\/]/).pop();
  newTab({ title, path, content });
}

// === Parser panel ===
let _parserRefreshTimer = null;
function scheduleParserRefresh() {
  clearTimeout(_parserRefreshTimer);
  _parserRefreshTimer = setTimeout(() => refreshParserPanel(), 600);
}

function refreshParserPanel() {
  const panel = sidePanelEl;
  if (!panel) return;
  const listEl = panel.querySelector("#parser-list");
  if (!listEl) return;

  const tab = state.tabs.find(t => t.id === state.activeId);
  if (!tab?.view) {
    listEl.innerHTML = `<div class="parser-empty">Open a .sk file to analyze it.</div>`;
    return;
  }

  const diags = [];
  forEachDiagnostic(tab.view.state, (d, from, to) => {
    const line = tab.view.state.doc.lineAt(from);
    diags.push({ severity: d.severity, message: d.message, line: line.number, from, to });
  });

  const errCount  = diags.filter(d => d.severity === "error").length;
  const warnCount = diags.filter(d => d.severity === "warning").length;

  const counter = panel.querySelector("#parser-counter");
  if (counter) {
    counter.textContent = errCount || warnCount
      ? `${errCount} error${errCount !== 1 ? "s" : ""}, ${warnCount} warning${warnCount !== 1 ? "s" : ""}`
      : "No problems";
    counter.className = `parser-counter ${errCount ? "has-errors" : warnCount ? "has-warnings" : "clean"}`;
  }

  if (diags.length === 0) {
    listEl.innerHTML = `
      <div class="parser-ok">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        No problems found
      </div>`;
    return;
  }

  listEl.innerHTML = "";
  for (const d of diags) {
    const row = document.createElement("div");
    row.className = `parser-item parser-${d.severity}`;
    const sev = d.severity === "error" ? "✗" : d.severity === "warning" ? "⚠" : "ℹ";
    row.innerHTML = `
      <span class="parser-sev">${sev}</span>
      <span class="parser-msg">${escapeHtml(d.message)}</span>
      <span class="parser-loc">line ${d.line}</span>
    `;
    row.onclick = () => {
      if (!tab.view) return;
      tab.view.dispatch({ selection: { anchor: d.from }, scrollIntoView: true });
      tab.view.focus();
    };
    listEl.appendChild(row);
  }
}

function showParserPanel() {
  const panel = ensureSidePanel();
  panel.classList.remove("hidden");
  panel.innerHTML = `
    <div class="panel-header">
      <span class="panel-title">Problems</span>
      <span id="parser-counter" class="parser-counter">—</span>
    </div>
    <div id="parser-list" class="parser-list"></div>
  `;
  refreshParserPanel();
}

// === Docs panel ===
function showDocsSidePanel() {
  // Docs opens as a floating overlay (not sidebar)
  showDocsPanel();
  // Deactivate the sidebar button immediately so it doesn't stay highlighted
  state.activePanel = null;
  document.querySelectorAll(".sidebar-btn").forEach(b => b.classList.remove("active"));
  if (sidePanelEl) sidePanelEl.classList.add("hidden");
}

// === Courses panel ===
function showCoursesSidePanel() {
  showCoursesPanel();
  state.activePanel = null;
  document.querySelectorAll(".sidebar-btn").forEach(b => b.classList.remove("active"));
  if (sidePanelEl) sidePanelEl.classList.add("hidden");
}

// === Whiteboard panel ===
let _wbOverlay = null;
let _wbInstance = null;
// Persisted board data so the canvas survives open/close
const _wbData = { cards: [], panX: 0, panY: 0, zoom: 1, nextId: 1 };

async function showWhiteboardPanel() {
  // Toggle: if already open, close it
  if (_wbOverlay) {
    _wbInstance?.destroy();
    _wbInstance = null;
    _wbOverlay.remove();
    _wbOverlay = null;
    state.activePanel = null;
    document.querySelectorAll(".sidebar-btn").forEach(b => b.classList.remove("active"));
    if (sidePanelEl) sidePanelEl.classList.add("hidden");
    return;
  }

  // Deactivate the sidebar button immediately (it's an overlay, not a panel)
  state.activePanel = null;
  document.querySelectorAll(".sidebar-btn").forEach(b => b.classList.remove("active"));
  if (sidePanelEl) sidePanelEl.classList.add("hidden");

  // Build overlay
  _wbOverlay = document.createElement("div");
  _wbOverlay.className = "wb-overlay";
  _wbOverlay.innerHTML = `
    <div class="wb-overlay-side" id="wb-overlay-side"></div>
    <div class="wb-overlay-main" id="wb-overlay-main"></div>
  `;
  document.body.appendChild(_wbOverlay);

  const sideEl = _wbOverlay.querySelector("#wb-overlay-side");
  const mainEl = _wbOverlay.querySelector("#wb-overlay-main");

  // Close button lives outside the canvas container so whiteboard.js can't wipe it
  const closeBtn = document.createElement("button");
  closeBtn.className = "wb-overlay-close";
  closeBtn.title = "Close whiteboard";
  closeBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 10 10"><path d="M0 0L10 10M10 0L0 10" stroke="currentColor" stroke-width="1.5"/></svg>`;
  closeBtn.onclick = () => {
    _wbInstance?.destroy();
    _wbInstance = null;
    _wbOverlay.remove();
    _wbOverlay = null;
  };
  _wbOverlay.appendChild(closeBtn);

  try {
    const createWhiteboard = await getWhiteboard();
    _wbInstance = createWhiteboard(mainEl, sideEl, _wbData);
  } catch (e) {
    mainEl.innerHTML = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--danger);font-size:13px;padding:24px;text-align:center">Whiteboard failed to load:<br>${String(e)}</div>`;
  }
}

// === Server panel ===
function showServerSidePanel() {
  // Server opens as a floating overlay
  showServerPanel();
  state.activePanel = null;
  document.querySelectorAll(".sidebar-btn").forEach(b => b.classList.remove("active"));
  if (sidePanelEl) sidePanelEl.classList.add("hidden");
}

// === Sidebar panel switching ===
function setActivePanel(name) {
  if (state.activePanel === name) {
    state.activePanel = null;
    document.querySelectorAll(".sidebar-btn").forEach(b => b.classList.remove("active"));
    hideFilePanel();
    return;
  }

  state.activePanel = name;
  document.querySelectorAll(".sidebar-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.panel === name);
  });

  switch (name) {
    case "explorer":
      showFilePanel();
      break;
    case "parser":
      showParserPanel();
      break;
    case "docs":
      showDocsSidePanel();
      break;
    case "courses":
      showCoursesSidePanel();
      break;
    case "whiteboard":
      showWhiteboardPanel();
      break;
    case "server":
      showServerSidePanel();
      break;
    default:
      hideFilePanel();
  }
}

// === About modal ===
function showAboutModal() {
  const m = document.createElement("div");
  m.className = "settings-modal";
  m.innerHTML = `
    <div class="settings-backdrop"></div>
    <div class="about-window">
      <div class="about-logo">
        <img src="/src/assets/logo.png" width="80" height="80" style="object-fit:contain;display:block;" draggable="false"/>
      </div>
      <h2>SkStudio</h2>
      <p class="about-version">Version 0.1.0</p>
      <p class="about-tagline">A modern IDE for Skript</p>
      <p class="about-credits">Built with Rust + Tauri • CodeMirror 6</p>
      <div class="about-actions">
        <button class="panel-btn" id="about-github">GitHub</button>
        <button class="panel-btn" id="about-close">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(m);
  const close = () => m.remove();
  m.querySelector("#about-close").onclick = close;
  m.querySelector("#about-github").onclick = () => openExternal("https://github.com/Parksdotjar/SkStudio");
  m.querySelector(".settings-backdrop").onclick = close;
  document.addEventListener("keydown", function esc(e) {
    if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); }
  });
}

// === Update modal / toast ===
async function showUpdateModal() {
  const result = await checkForUpdate();
  if (result.error) {
    showAlert(`Could not check for updates: ${result.error}`, { title: "Update check failed" });
    return;
  }
  if (!result.hasUpdate) {
    showAlert(`You're on the latest version (${result.current}).`, { title: "Up to date" });
    return;
  }
  showUpdateToast(result);
}

function showUpdateToast(info) {
  document.querySelectorAll(".update-toast").forEach(t => t.remove());
  const toast = document.createElement("div");
  toast.className = "update-toast";
  toast.innerHTML = `
    <div class="update-toast-body">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 2 20 2 20 6"/><line x1="20" y1="2" x2="9" y2="13"/><path d="M15 9v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6 6 6 0 0 1 6-6h2"/></svg>
      <div>
        <div class="update-toast-title">Update available — ${escapeHtml(info.latest)}</div>
        <div class="update-toast-sub">You're on ${escapeHtml(info.current)}</div>
      </div>
    </div>
    <div class="update-toast-actions">
      <button class="update-download-btn" id="ut-download">Download</button>
      <button class="update-dismiss-btn" id="ut-dismiss">Dismiss</button>
    </div>
  `;
  document.body.appendChild(toast);

  toast.querySelector("#ut-dismiss").onclick = () => {
    dismissVersion(info.latest);
    toast.remove();
  };

  toast.querySelector("#ut-download").onclick = async () => {
    const btn = toast.querySelector("#ut-download");
    btn.textContent = "Downloading…";
    btn.disabled = true;
    if (!invoke) {
      openExternal(info.downloadUrl);
      toast.remove();
      return;
    }
    try {
      const path = await invoke("download_update", { url: info.downloadUrl });
      btn.textContent = "Installing…";
      await invoke("apply_update", { installerPath: path });
    } catch (e) {
      btn.textContent = "Download";
      btn.disabled = false;
      showAlert(`Update failed: ${e}`, { title: "Update error" });
    }
  };
}

async function checkUpdatesOnLaunch() {
  try {
    const result = await checkForUpdate();
    if (result.hasUpdate && !wasDismissed(result.latest)) {
      setTimeout(() => showUpdateToast(result), 2000);
    }
  } catch {}
}

// === Keyboard shortcuts ===
document.addEventListener("keydown", (e) => {
  const ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && e.key === "s") { e.preventDefault(); saveActive(); }
  else if (ctrl && e.key === "n") { e.preventDefault(); newTab(); }
  else if (ctrl && e.key === "o") { e.preventDefault(); openFile(); }
  else if (ctrl && e.key === "w") { e.preventDefault(); if (state.activeId) closeTab(state.activeId); }
  else if (ctrl && e.key === "f") { e.preventDefault(); showFindReplace(); }
  else if (ctrl && e.key === "h") { e.preventDefault(); showFindReplace(); }
  else if (ctrl && e.key === ",") { e.preventDefault(); showSettingsModal(); }
  else if (ctrl && e.key === "`") { e.preventDefault(); toggleTerminal(); }
});

// === Helpers ===
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// === Settings → editor live updates ===
onSettingsChange((s, key) => {
  applyTheme(s.theme);
  for (const tab of state.tabs) {
    if (!tab.view) continue;
    if (key === "fontSize" && tab.view.setFontSize) tab.view.setFontSize(s.fontSize);
    if (key === "acceptKey" && tab.view.setAcceptKey) tab.view.setAcceptKey(s.acceptKey);
    if (key === "ghostText" && tab.view.setGhostText) tab.view.setGhostText(s.ghostText);
    if (key === "syntaxColors" && tab.view.setSyntaxColors) tab.view.setSyntaxColors(s.syntaxColors);
  }
});

// === Init ===
applyTheme(getSettings().theme);
newTabBtn.onclick = () => newTab();
document.getElementById("settings-btn").onclick = () => showSettingsModal();
document.querySelectorAll(".sidebar-btn").forEach((btn) => {
  btn.onclick = () => setActivePanel(btn.dataset.panel);
});

initFindReplace({ getView: () => {
  const tab = state.tabs.find((t) => t.id === state.activeId);
  return tab ? tab.view : null;
}});
initTerminal(document.querySelector(".editor-area"));
setupWindowControls();
initMenuBar({ onAction: handleAction });
showWelcome();
state.activePanel = null;
setActivePanel("explorer");

// Check for updates after a short delay (non-blocking)
checkUpdatesOnLaunch();
