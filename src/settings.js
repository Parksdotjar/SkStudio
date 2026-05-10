// Settings panel + persistence
const STORAGE_KEY = "skstudio.settings";

const DEFAULTS = {
  fontSize: 13.5,
  theme: "dark",
  tabSize: 2,
  showLineNumbers: true,
  wordWrap: false,
  autoSave: false,
};

let current = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function getSettings() {
  return { ...current };
}

export function updateSetting(key, value) {
  current[key] = value;
  save();
  for (const fn of listeners) fn(current);
}

export function onSettingsChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// === Modal UI ===
let modal;

export function showSettingsModal() {
  if (modal) { modal.remove(); modal = null; }
  modal = document.createElement("div");
  modal.className = "settings-modal";
  modal.innerHTML = `
    <div class="settings-backdrop"></div>
    <div class="settings-window">
      <div class="settings-header">
        <h2>Settings</h2>
        <button class="icon-btn" id="settings-close">
          <svg width="13" height="13" viewBox="0 0 10 10"><path d="M0 0L10 10M10 0L0 10" stroke="currentColor" stroke-width="1.5"/></svg>
        </button>
      </div>
      <div class="settings-body">
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
          <h3>Theme</h3>
          <div class="settings-row">
            <label>Color theme</label>
            <select id="s-theme">
              <option value="dark" ${current.theme === "dark" ? "selected" : ""}>Dark (default)</option>
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

  // Wire inputs
  const bind = (id, key, parser = (v) => v) => {
    const el = modal.querySelector(id);
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
}

// Apply theme class to body
export function applyTheme(theme) {
  document.body.dataset.theme = theme;
}
