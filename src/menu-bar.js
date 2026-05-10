// Titlebar menu dropdowns (File / Edit / Tools / Other)
// Hands user actions back to main.js via the onAction callback.

const MENUS = {
  file: [
    { label: "New File",      shortcut: "Ctrl+N",       action: "new-file" },
    { label: "Open File…",    shortcut: "Ctrl+O",       action: "open-file" },
    { label: "Open Folder…",  action: "open-folder" },
    { type: "separator" },
    { label: "Save",          shortcut: "Ctrl+S",       action: "save" },
    { label: "Save As…",      shortcut: "Ctrl+Shift+S", action: "save-as" },
    { type: "separator" },
    { label: "Close Tab",     shortcut: "Ctrl+W",       action: "close-tab" },
    { label: "Exit",                                    action: "exit" },
  ],
  edit: [
    { label: "Undo",          shortcut: "Ctrl+Z",       action: "undo" },
    { label: "Redo",          shortcut: "Ctrl+Y",       action: "redo" },
    { type: "separator" },
    { label: "Cut",           shortcut: "Ctrl+X",       action: "cut" },
    { label: "Copy",          shortcut: "Ctrl+C",       action: "copy" },
    { label: "Paste",         shortcut: "Ctrl+V",       action: "paste" },
    { label: "Select All",    shortcut: "Ctrl+A",       action: "select-all" },
    { type: "separator" },
    { label: "Find",          shortcut: "Ctrl+F",       action: "find" },
    { label: "Replace",       shortcut: "Ctrl+H",       action: "find" },
  ],
  tools: [
    { label: "Toggle Terminal",      shortcut: "Ctrl+`", action: "terminal" },
    { label: "Format Document",      action: "format" },
    { label: "Skript Analyzer",      action: "analyzer" },
    { type: "separator" },
    { label: "Settings",             shortcut: "Ctrl+,", action: "settings" },
    { label: "Reload Window",        shortcut: "Ctrl+R", action: "reload" },
  ],
  other: [
    { label: "Welcome Screen",       action: "welcome" },
    { type: "separator" },
    { label: "Discord Server",       action: "discord" },
    { label: "GitHub Repository",    action: "github" },
    { type: "separator" },
    { label: "Check for Updates",    action: "updates" },
    { label: "About SkStudio",       action: "about" },
  ],
};

let openMenu = null;
let onActionFn = null;
let dropdownEl = null;

export function initMenuBar({ onAction }) {
  onActionFn = onAction;

  // Wire menu button clicks
  document.querySelectorAll(".menu-item").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const name = btn.dataset.menu;
      if (openMenu === name) {
        closeMenu();
      } else {
        openMenuFor(name);
      }
    });

    // Hover-switch: if any menu is open, hovering a sibling switches to it
    btn.addEventListener("mouseenter", () => {
      if (openMenu && openMenu !== btn.dataset.menu) {
        openMenuFor(btn.dataset.menu);
      }
    });
  });

  // Click outside / Esc closes
  document.addEventListener("click", (e) => {
    if (!dropdownEl) return;
    if (!dropdownEl.contains(e.target)) closeMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && openMenu) {
      e.preventDefault();
      closeMenu();
    }
  });
}

function openMenuFor(name) {
  closeMenu();
  const items = MENUS[name];
  if (!items) return;
  const btn = document.querySelector(`.menu-item[data-menu="${name}"]`);
  if (!btn) return;

  openMenu = name;
  btn.classList.add("menu-item-open");

  dropdownEl = document.createElement("div");
  dropdownEl.className = "dropdown-menu";
  const rect = btn.getBoundingClientRect();
  dropdownEl.style.left = `${Math.round(rect.left)}px`;
  dropdownEl.style.top = `${Math.round(rect.bottom + 2)}px`;

  for (const item of items) {
    if (item.type === "separator") {
      const sep = document.createElement("div");
      sep.className = "dd-separator";
      dropdownEl.appendChild(sep);
      continue;
    }
    const row = document.createElement("button");
    row.className = "dd-item";
    row.innerHTML = `
      <span class="dd-label">${item.label}</span>
      ${item.shortcut ? `<span class="dd-shortcut">${item.shortcut}</span>` : ""}
    `;
    row.addEventListener("click", (e) => {
      e.stopPropagation();
      closeMenu();
      if (onActionFn) onActionFn(item.action);
    });
    dropdownEl.appendChild(row);
  }

  document.body.appendChild(dropdownEl);
}

function closeMenu() {
  if (dropdownEl) {
    dropdownEl.remove();
    dropdownEl = null;
  }
  if (openMenu) {
    document.querySelector(`.menu-item[data-menu="${openMenu}"]`)?.classList.remove("menu-item-open");
    openMenu = null;
  }
}
