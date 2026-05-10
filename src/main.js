// SkStudio - main entry
import { createEditor } from "./editor.js";
import { createFileTree } from "./file-tree.js";
import { initFindReplace, toggle as toggleFindReplace, show as showFindReplace } from "./find-replace.js";
import { initTerminal, toggle as toggleTerminal } from "./terminal.js";
import { showSettingsModal, getSettings, onSettingsChange, applyTheme } from "./settings.js";

// Tauri imports — only available inside the Tauri runtime
let invoke, openDialog, saveDialog, getCurrentWindow, openShellUrl;
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

// === Sidebar panel (file tree) ===
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
      // Reuse tab if file already open
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
          <svg width="120" height="120" viewBox="0 0 120 120" fill="#3ddc84">
            <!-- Main 4-point sparkle -->
            <path d="M60 4 L 64 50 L 116 60 L 64 70 L 60 116 L 56 70 L 4 60 L 56 50 Z"/>
            <!-- Small sparkle top-right -->
            <path d="M95 18 L 96.5 28 L 106 30 L 96.5 32 L 95 42 L 93.5 32 L 84 30 L 93.5 28 Z" opacity="0.75"/>
            <!-- Small sparkle bottom-left -->
            <path d="M22 90 L 23 96 L 29 97.5 L 23 99 L 22 105 L 21 99 L 15 97.5 L 21 96 Z" opacity="0.6"/>
            <!-- Tiny dot accents -->
            <circle cx="100" cy="92" r="2.5" opacity="0.5"/>
            <circle cx="20" cy="22" r="1.8" opacity="0.45"/>
            <circle cx="80" cy="105" r="1.4" opacity="0.4"/>
          </svg>
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
    onChange: (doc) => {
      if (tab.content !== doc) { tab.content = doc; tab.dirty = true; renderTabs(); }
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

function closeTab(id) {
  const idx = state.tabs.findIndex((t) => t.id === id);
  if (idx === -1) return;
  const tab = state.tabs[idx];
  if (tab.dirty && !confirm(`"${tab.title}" has unsaved changes. Close anyway?`)) return;
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

// === Actions ===
async function handleAction(action) {
  switch (action) {
    case "new-file": newTab(); break;
    case "open-file": await openFile(); break;
    case "open-folder":
      setActivePanel("explorer");
      if (fileTree) fileTree.openFolder();
      break;
    case "settings": showSettingsModal(); break;
    case "discord":
    case "github":
      console.log(`${action} link clicked — TODO: open in external browser`);
      break;
    case "save": await saveActive(); break;
    case "find": showFindReplace(); break;
    case "terminal": toggleTerminal(); break;
  }
}

async function openFile() {
  if (!openDialog || !invoke) { alert("File operations only work in the Tauri app"); return; }
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

// === Sidebar panel switching ===
// Click an active panel button to collapse it. Click another to switch.
function setActivePanel(name) {
  // Toggle off if clicking the already-active panel
  if (state.activePanel === name) {
    state.activePanel = null;
    document.querySelectorAll(".sidebar-btn").forEach((b) => b.classList.remove("active"));
    hideFilePanel();
    return;
  }

  state.activePanel = name;
  document.querySelectorAll(".sidebar-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.panel === name);
  });

  if (name === "explorer") {
    showFilePanel();
  } else if (name === "parser") {
    const panel = ensureSidePanel();
    panel.classList.remove("hidden");
    panel.innerHTML = `<div class="panel-header"><span class="panel-title">Parser</span></div><div class="panel-empty"><p>Skript analyzer — coming soon.</p></div>`;
  }
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
  }
});

// === Init ===
applyTheme(getSettings().theme);
newTabBtn.onclick = () => newTab();
document.getElementById("settings-btn").onclick = () => showSettingsModal();
document.querySelectorAll(".sidebar-btn").forEach((btn) => {
  btn.onclick = () => setActivePanel(btn.dataset.panel);
});

// Initialize panels
initFindReplace({ getView: () => {
  const tab = state.tabs.find((t) => t.id === state.activeId);
  return tab ? tab.view : null;
}});
initTerminal(document.querySelector(".editor-area"));

setupWindowControls();
showWelcome();
// Start with explorer panel open (matches the active sidebar button)
state.activePanel = null; // ensure setActivePanel will open it
setActivePanel("explorer");
