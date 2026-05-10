// File tree sidebar panel
let invoke, openDialog;
try {
  ({ invoke } = await import("@tauri-apps/api/core"));
  ({ open: openDialog } = await import("@tauri-apps/plugin-dialog"));
} catch {}

export function createFileTree(rootEl, { onOpenFile }) {
  let rootPath = null;

  function render(emptyMsg) {
    rootEl.innerHTML = "";
    if (!rootPath) {
      rootEl.innerHTML = `
        <div class="panel-empty">
          <p>${emptyMsg || "No folder opened."}</p>
          <button class="panel-btn" id="ft-open-folder-btn">Open Folder</button>
        </div>
      `;
      const btn = rootEl.querySelector("#ft-open-folder-btn");
      if (btn) btn.onclick = openFolder;
      return;
    }

    const header = document.createElement("div");
    header.className = "panel-header";
    const folderName = rootPath.split(/[\\/]/).filter(Boolean).pop() || rootPath;
    header.innerHTML = `
      <span class="panel-title" title="${escapeHtml(rootPath)}">${escapeHtml(folderName)}</span>
      <button class="icon-btn" id="ft-refresh" title="Refresh">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
      </button>
      <button class="icon-btn" id="ft-close" title="Close folder">
        <svg width="11" height="11" viewBox="0 0 10 10"><path d="M0 0L10 10M10 0L0 10" stroke="currentColor" stroke-width="1.5"/></svg>
      </button>
    `;
    rootEl.appendChild(header);

    header.querySelector("#ft-refresh").onclick = () => loadDir(rootPath, treeEl, 0);
    header.querySelector("#ft-close").onclick = () => { rootPath = null; render(); };

    const treeEl = document.createElement("div");
    treeEl.className = "panel-tree";
    rootEl.appendChild(treeEl);
    loadDir(rootPath, treeEl, 0);
  }

  async function loadDir(path, container, depth) {
    container.innerHTML = `<div class="tree-loading">Loading…</div>`;
    try {
      const entries = await invoke("read_dir", { path });
      container.innerHTML = "";
      for (const entry of entries) {
        const row = document.createElement("div");
        row.className = "tree-row" + (entry.is_dir ? " is-dir" : "");
        row.style.paddingLeft = `${8 + depth * 12}px`;
        row.innerHTML = `
          <span class="tree-caret">${entry.is_dir ? "▸" : ""}</span>
          <span class="tree-icon">${entry.is_dir ? folderSvg() : fileSvg(entry.name)}</span>
          <span class="tree-name">${escapeHtml(entry.name)}</span>
        `;
        if (entry.is_dir) {
          let expanded = false;
          let childContainer = null;
          row.onclick = async () => {
            expanded = !expanded;
            row.querySelector(".tree-caret").textContent = expanded ? "▾" : "▸";
            if (expanded) {
              childContainer = document.createElement("div");
              row.after(childContainer);
              await loadDir(entry.path, childContainer, depth + 1);
            } else if (childContainer) {
              childContainer.remove();
              childContainer = null;
            }
          };
        } else {
          row.onclick = async () => {
            try {
              const content = await invoke("read_file", { path: entry.path });
              onOpenFile({ path: entry.path, title: entry.name, content });
            } catch (e) {
              console.error("Failed to open file:", e);
            }
          };
        }
        container.appendChild(row);
      }
      if (entries.length === 0) {
        container.innerHTML = `<div class="tree-empty">Empty</div>`;
      }
    } catch (e) {
      container.innerHTML = `<div class="tree-error">Failed: ${escapeHtml(String(e))}</div>`;
    }
  }

  async function openFolder() {
    if (!openDialog) {
      alert("Folder operations only work in the Tauri app");
      return;
    }
    const selected = await openDialog({ directory: true, multiple: false });
    if (!selected) return;
    rootPath = Array.isArray(selected) ? selected[0] : selected;
    localStorage.setItem("skstudio.lastFolder", rootPath);
    render();
  }

  // Restore previous folder if it exists
  const last = localStorage.getItem("skstudio.lastFolder");
  if (last) rootPath = last;
  render();

  return { openFolder, refresh: () => render() };
}

function folderSvg() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
}
function fileSvg(name) {
  const isSk = name.endsWith(".sk");
  const color = isSk ? "#3ddc84" : "currentColor";
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
