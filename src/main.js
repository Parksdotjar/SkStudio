// SkStudio - main entry
import { createEditor } from "./editor.js";

// Tauri imports — only available inside the Tauri runtime, fall back gracefully in browser dev
let invoke, openDialog, saveDialog, getCurrentWindow;
try {
  ({ invoke } = await import("@tauri-apps/api/core"));
  ({ open: openDialog, save: saveDialog } = await import("@tauri-apps/plugin-dialog"));
  ({ getCurrentWindow } = await import("@tauri-apps/api/window"));
} catch (e) {
  console.warn("Tauri API not available — running in browser dev mode");
}

// === State ===
const state = {
  tabs: [], // { id, title, path, content, dirty, view }
  activeId: null,
  nextId: 1,
};

// === DOM ===
const tabsEl = document.getElementById("tabs");
const contentEl = document.getElementById("content");
const newTabBtn = document.getElementById("new-tab-btn");
const statusLine = document.getElementById("status-line");
const statusCol = document.getElementById("status-col");
const statusLen = document.getElementById("status-len");

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
          <svg width="110" height="110" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L22 12L12 22L2 12L12 2Z" fill="#3a3a40" stroke="#2bb573" stroke-width="0.4"/>
            <path d="M12 6L18 12L12 18L6 12L12 6Z" fill="#3ddc84"/>
            <path d="M12 9L15 12L12 15L9 12L12 9Z" fill="#1ec3a4"/>
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
          <div class="welcome-link" data-action="new-file">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            New File
          </div>
          <div class="welcome-link" data-action="open-file">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="11.5" cy="14.5" r="2.5"/><line x1="13.5" y1="16.5" x2="15.5" y2="18.5"/></svg>
            Open File
          </div>
          <div class="welcome-link" data-action="open-folder">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            Open Folder
          </div>
          <div class="welcome-link" data-action="settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Settings
          </div>
        </div>
        <div class="welcome-col">
          <h3>Need help?</h3>
          <div class="welcome-link" data-action="discord">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
            Discord Server
          </div>
          <div class="welcome-link" data-action="github">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
            GitHub
          </div>
        </div>
      </div>
    </div>
  `;
}

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
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L22 12L12 22L2 12L12 2Z" opacity="0.9"/></svg>
      </span>
      <span class="tab-title">${escapeHtml(tab.title)}${tab.dirty ? ' <span class="tab-dirty">•</span>' : ""}</span>
      <span class="tab-close" data-close="${tab.id}">
        <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 0L10 10M10 0L0 10" stroke="currentColor" stroke-width="1.5"/></svg>
      </span>
    `;
    el.onclick = (e) => {
      if (e.target.closest("[data-close]")) {
        closeTab(tab.id);
      } else {
        activateTab(tab.id);
      }
    };
    tabsEl.appendChild(el);
  }
}

function activateTab(id) {
  state.activeId = id;
  contentEl.innerHTML = "";

  const tab = state.tabs.find((t) => t.id === id);
  if (!tab) {
    showWelcome();
    renderTabs();
    return;
  }

  const pane = document.createElement("div");
  pane.className = "editor-pane active";
  contentEl.appendChild(pane);

  tab.view = createEditor(pane, {
    initialDoc: tab.content,
    onChange: (doc) => {
      if (tab.content !== doc) {
        tab.content = doc;
        tab.dirty = true;
        renderTabs();
      }
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
    if (state.tabs.length > 0) {
      activateTab(state.tabs[Math.max(0, idx - 1)].id);
    } else {
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
    case "new-file":
      newTab();
      break;
    case "open-file":
      await openFile();
      break;
    case "open-folder":
      console.log("Open folder — TODO");
      break;
    case "settings":
      console.log("Settings — TODO");
      break;
    case "discord":
      console.log("Open Discord — TODO");
      break;
    case "github":
      console.log("Open GitHub — TODO");
      break;
    case "save":
      await saveActive();
      break;
  }
}

async function openFile() {
  if (!openDialog || !invoke) {
    alert("File operations only work in the Tauri app");
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

// === Keyboard shortcuts ===
document.addEventListener("keydown", (e) => {
  const ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && e.key === "s") { e.preventDefault(); saveActive(); }
  else if (ctrl && e.key === "n") { e.preventDefault(); newTab(); }
  else if (ctrl && e.key === "o") { e.preventDefault(); openFile(); }
  else if (ctrl && e.key === "w") { e.preventDefault(); if (state.activeId) closeTab(state.activeId); }
});

// === Helpers ===
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// === Init ===
newTabBtn.onclick = () => newTab();
setupWindowControls();
showWelcome();
