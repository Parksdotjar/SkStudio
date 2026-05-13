/**
 * SkStudio — Local Minecraft Server Panel
 * Manages a locally-hosted Paper server with install, console, player list, and IP tools.
 */

let invoke, listen;
try {
  ({ invoke } = await import("@tauri-apps/api/core"));
  ({ listen }  = await import("@tauri-apps/api/event"));
} catch {}

// ── state ─────────────────────────────────────────────────────────────────────

let _overlay     = null;
let _unlistenLog = null;
let _unlistenProg= null;
let _unlistenStop= null;
let _unlistenPlayers = null;
let _logLines    = [];       // accumulated log lines (capped at 2000)
let _players     = [];
let _installing  = false;
let _serverDir   = "";

const MAX_LOG = 2000;

// ── open / close ──────────────────────────────────────────────────────────────

export async function showServerPanel() {
  if (_overlay) { _overlay.remove(); _overlay = null; }
  _overlay = buildShell();
  document.body.appendChild(_overlay);

  _overlay.querySelector("#sv-close").onclick = closePanel;
  document.addEventListener("keydown", escHandler);

  // Wire Tauri events
  await wireEvents();

  // Initial status
  await refresh();
}

function closePanel() {
  if (_overlay) { _overlay.remove(); _overlay = null; }
  // Unlisten to avoid ghost listeners accumulating
  _unlistenLog?.();   _unlistenLog   = null;
  _unlistenProg?.();  _unlistenProg  = null;
  _unlistenStop?.();  _unlistenStop  = null;
  _unlistenPlayers?.(); _unlistenPlayers = null;
  document.removeEventListener("keydown", escHandler);
}

function escHandler(e) { if (e.key === "Escape") closePanel(); }

// ── Tauri event wiring ────────────────────────────────────────────────────────

async function wireEvents() {
  if (!listen) return;

  // Clean up old listeners
  _unlistenLog?.();
  _unlistenProg?.();
  _unlistenStop?.();
  _unlistenPlayers?.();

  _unlistenLog = await listen("mc-log", (event) => {
    appendLog(event.payload.text, event.payload.level);
  });

  _unlistenProg = await listen("mc-progress", (event) => {
    updateProgress(event.payload.step, event.payload.percent);
  });

  _unlistenStop = await listen("mc-stopped", () => {
    _players = [];
    appendLog("[SkStudio] Server stopped.", "system");
    refresh();
  });

  _unlistenPlayers = await listen("mc-players", (event) => {
    _players = event.payload || [];
    renderPlayers();
  });
}

// ── status refresh ────────────────────────────────────────────────────────────

async function refresh() {
  if (!invoke || !_overlay) return;
  try {
    const status = await invoke("mc_get_status");
    _serverDir  = status.dir;
    _players    = status.players || [];
    if (status.running) {
      showRunningView(status);
    } else if (status.installed) {
      showIdleView(status);
    } else {
      showInstallView();
    }
  } catch {
    showInstallView();
  }
}

// ── DOM helpers ───────────────────────────────────────────────────────────────

function e(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function q(sel) { return _overlay?.querySelector(sel); }

function buildShell() {
  const el = document.createElement("div");
  el.className = "sv-overlay";
  el.innerHTML = `
    <div class="sv-backdrop"></div>
    <div class="sv-window">
      <div class="sv-titlebar">
        <div class="sv-titlebar-left">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
          </svg>
          <span class="sv-title">Local Server</span>
          <span class="sv-status-dot" id="sv-dot"></span>
          <span class="sv-status-text" id="sv-status-text">Checking...</span>
        </div>
        <div class="sv-titlebar-right">
          <button class="sv-icon-btn" id="sv-folder-btn" title="Open server folder">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </button>
          <button class="sv-close-btn" id="sv-close">
            <svg width="12" height="12" viewBox="0 0 10 10"><path d="M0 0L10 10M10 0L0 10" stroke="currentColor" stroke-width="1.5"/></svg>
          </button>
        </div>
      </div>
      <div class="sv-body" id="sv-body">
        <!-- content injected by view functions -->
      </div>
    </div>
  `;

  el.querySelector("#sv-folder-btn").onclick = () => {
    if (invoke && _serverDir) invoke("mc_open_folder", { path: _serverDir });
  };

  return el;
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW: Install
// ─────────────────────────────────────────────────────────────────────────────

function showInstallView() {
  setStatus("not installed", false);
  const body = q("#sv-body");
  if (!body) return;
  body.innerHTML = `
    <div class="sv-install-screen">
      <div class="sv-install-hero">
        <div class="sv-install-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            <path d="M9 10l3 3 3-3"/>
          </svg>
        </div>
        <h2>Local Server</h2>
        <p>Run a real Minecraft server on this machine — no hosting required. SkStudio will download and configure Paper automatically.</p>
      </div>

      <div class="sv-install-checks">
        <div class="sv-check-row" id="sv-java-check">
          <span class="sv-check-spinner"></span>
          <span class="sv-check-label">Checking Java...</span>
        </div>
      </div>

      <div class="sv-install-features">
        <div class="sv-feature"><span>⚡</span><span><strong>Paper 26.1.2</strong> — latest stable, plugin-compatible</span></div>
        <div class="sv-feature"><span>📜</span><span><strong>Skript 2.15.2</strong> — latest release, auto-installed</span></div>
        <div class="sv-feature"><span>🐝</span><span><strong>SkBee 3.23.0</strong> — blocks, NBT, displays &amp; more</span></div>
        <div class="sv-feature"><span>🔍</span><span><strong>skript-reflect 2.6.3</strong> — full Java API access</span></div>
        <div class="sv-feature"><span>🔒</span><span>Offline mode — any username works for testing</span></div>
        <div class="sv-feature"><span>📁</span><span>Scripts folder pre-created with a starter file</span></div>
        <div class="sv-feature"><span>🖥️</span><span>Fully silent — no CMD or PowerShell windows</span></div>
        <div class="sv-feature"><span>✅</span><span>EULA pre-accepted, ready to start immediately</span></div>
      </div>

      <div class="sv-install-progress" id="sv-install-progress" style="display:none">
        <div class="sv-prog-label" id="sv-prog-label">Preparing...</div>
        <div class="sv-prog-track">
          <div class="sv-prog-fill" id="sv-prog-fill" style="width:0%"></div>
        </div>
        <div class="sv-prog-pct" id="sv-prog-pct">0%</div>
      </div>

      <button class="sv-install-btn" id="sv-install-btn" disabled>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Install Paper Server
      </button>
    </div>
  `;

  // Check Java
  checkJava();

  body.querySelector("#sv-install-btn").onclick = startInstall;
}

async function checkJava() {
  const row   = q("#sv-java-check");
  const label = row?.querySelector(".sv-check-label");
  const btn   = q("#sv-install-btn");
  try {
    if (!invoke) throw new Error("Not in Tauri");
    const ver = await invoke("mc_check_java");
    if (row) row.innerHTML = `<span class="sv-check-ok">✓</span><span class="sv-check-label">${e(ver)}</span>`;
    if (btn) btn.disabled = false;
  } catch (err) {
    if (row) row.innerHTML = `
      <span class="sv-check-err">✗</span>
      <span class="sv-check-label">Java not found — <a class="sv-link" href="#" id="sv-java-link">Download Java 21</a></span>
    `;
    if (btn) { btn.disabled = true; btn.textContent = "Java required to install"; }
    q("#sv-java-link")?.addEventListener("click", (ev) => {
      ev.preventDefault();
      window.open("https://adoptium.net/temurin/releases/?version=21", "_blank");
    });
  }
}

async function startInstall() {
  if (!invoke || _installing) return;
  _installing = true;
  const btn  = q("#sv-install-btn");
  const prog = q("#sv-install-progress");
  if (btn)  { btn.disabled = true; btn.style.display = "none"; }
  if (prog) prog.style.display = "flex";

  try {
    await invoke("mc_install");
    await refresh();
  } catch (err) {
    updateProgress(`Error: ${err}`, 0);
    if (btn) { btn.disabled = false; btn.style.display = "flex"; }
  } finally {
    _installing = false;
  }
}

function updateProgress(step, percent) {
  const label = q("#sv-prog-label");
  const fill  = q("#sv-prog-fill");
  const pct   = q("#sv-prog-pct");
  if (label) label.textContent = step;
  if (fill)  fill.style.width  = `${percent}%`;
  if (pct)   pct.textContent   = `${percent}%`;
}

function latestMcHint() { return "26.1.2"; }

// ─────────────────────────────────────────────────────────────────────────────
// VIEW: Idle (installed, not running)
// ─────────────────────────────────────────────────────────────────────────────

async function showIdleView(status) {
  setStatus("offline", false);

  const sep = navigator.platform?.startsWith("Win") ? "\\" : "/";
  let ip = "127.0.0.1";
  let version = "Paper 26.1.2";
  try {
    if (invoke) {
      ip = await invoke("mc_get_local_ip");
    }
  } catch {}

  const body = q("#sv-body");
  if (!body) return;

  body.innerHTML = `
    <div class="sv-idle-screen">
      <div class="sv-idle-info">
        <div class="sv-server-card">
          <div class="sv-server-card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
          <div class="sv-server-card-info">
            <div class="sv-server-card-name">${e(version)}</div>
            <div class="sv-server-card-meta">Ready to start</div>
          </div>
          <button class="sv-start-btn" id="sv-start-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Start Server
          </button>
        </div>

        <div class="sv-ip-row">
          <span class="sv-ip-label">Server IP</span>
          <code class="sv-ip-value" id="sv-ip-val">${e(ip)}:25565</code>
          <button class="sv-copy-btn" id="sv-copy-ip" title="Copy IP">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy
          </button>
        </div>

        <div class="sv-dir-row">
          <span class="sv-ip-label">Location</span>
          <code class="sv-ip-value sv-dir-path">${e(_serverDir)}</code>
          <button class="sv-copy-btn" id="sv-open-dir">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            Open
          </button>
        </div>

        <button class="sv-delete-btn" id="sv-delete-btn">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          Delete Server
        </button>

        <div class="sv-idle-tips">
          <div class="sv-idle-tip">
            <span>📁</span>
            <span>Scripts folder: <code>${e(_serverDir)}${sep}plugins${sep}Skript${sep}scripts</code>
              <button class="sv-link-btn" id="sv-open-scripts">Open</button>
            </span>
          </div>
          <div class="sv-idle-tip">
            <span>🎮</span>
            <span>Connect via <strong>Multiplayer → Direct Connect</strong> → <code>${e(ip)}:25565</code></span>
          </div>
          <div class="sv-idle-tip">
            <span>📜</span>
            <span>Installed: <strong>Skript</strong>, <strong>SkBee</strong>, <strong>skript-reflect</strong></span>
          </div>
          <div class="sv-idle-tip">
            <span>🔑</span>
            <span>Online mode is <strong>off</strong> — any Minecraft username works for local testing</span>
          </div>
        </div>
      </div>
    </div>
  `;

  body.querySelector("#sv-start-btn").onclick = startServer;
  body.querySelector("#sv-copy-ip").onclick = () => {
    navigator.clipboard.writeText(`${ip}:25565`);
    copyFeedback(body.querySelector("#sv-copy-ip"), "Copied!");
  };
  body.querySelector("#sv-open-dir").onclick = () => {
    if (invoke && _serverDir) invoke("mc_open_folder", { path: _serverDir });
  };
  body.querySelector("#sv-open-scripts")?.addEventListener("click", () => {
    if (invoke && _serverDir) {
      const scriptsPath = _serverDir + sep + "plugins" + sep + "Skript" + sep + "scripts";
      invoke("mc_open_folder", { path: scriptsPath });
    }
  });

  body.querySelector("#sv-delete-btn").onclick = () => deleteServer();
}

async function deleteServer() {
  // Inline confirmation — small overlay inside the panel so it matches the theme
  const body = q("#sv-body");
  if (!body) return;

  const confirm = document.createElement("div");
  confirm.className = "sv-confirm-overlay";
  confirm.innerHTML = `
    <div class="sv-confirm-box">
      <div class="sv-confirm-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
      </div>
      <div class="sv-confirm-text">
        <strong>Delete local server?</strong>
        <p>This permanently deletes the server folder and all world data. Your <code>.sk</code> files in the scripts folder will also be removed.</p>
        <p>This cannot be undone.</p>
      </div>
      <div class="sv-confirm-actions">
        <button class="sv-confirm-cancel" id="sv-del-cancel">Cancel</button>
        <button class="sv-confirm-ok"     id="sv-del-ok">Delete Everything</button>
      </div>
    </div>
  `;

  // Mount inside the window (not body) so it clips properly
  const win = _overlay?.querySelector(".sv-window");
  if (win) win.appendChild(confirm);

  return new Promise((resolve) => {
    confirm.querySelector("#sv-del-cancel").onclick = () => { confirm.remove(); resolve(false); };
    confirm.querySelector("#sv-del-ok").onclick = async () => {
      const okBtn = confirm.querySelector("#sv-del-ok");
      okBtn.disabled = true;
      okBtn.textContent = "Deleting...";
      try {
        if (invoke) await invoke("mc_delete");
        confirm.remove();
        _logLines = [];
        _players  = [];
        await refresh();
        resolve(true);
      } catch (err) {
        okBtn.disabled = false;
        okBtn.textContent = "Delete Everything";
        confirm.querySelector(".sv-confirm-text p").textContent = `Error: ${err}`;
        resolve(false);
      }
    };
  });
}

async function startServer() {
  if (!invoke) return;
  const btn = q("#sv-start-btn");
  if (btn) { btn.disabled = true; btn.textContent = "Starting..."; }
  try {
    await invoke("mc_start");
    await refresh();
  } catch (err) {
    if (btn) { btn.disabled = false; btn.textContent = "Start Server"; }
    appendLog(`[SkStudio] Failed to start: ${err}`, "error");
    await refresh(); // might still show running view if it actually started
  }
}

function readVersionFile() {
  // We can't sync-read files from JS easily without invoke. Return empty.
  return "";
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW: Running
// ─────────────────────────────────────────────────────────────────────────────

async function showRunningView(status) {
  setStatus("running", true);

  let ip = "127.0.0.1";
  try { if (invoke) ip = await invoke("mc_get_local_ip"); } catch {}

  const body = q("#sv-body");
  if (!body) return;

  body.innerHTML = `
    <div class="sv-running-layout">
      <!-- Console -->
      <div class="sv-console-panel">
        <div class="sv-panel-header">
          <span>Console</span>
          <div class="sv-console-header-actions">
            <button class="sv-hdr-btn" id="sv-clear-log" title="Clear console">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
            </button>
            <button class="sv-stop-btn" id="sv-stop-btn">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
              Stop
            </button>
          </div>
        </div>
        <div class="sv-console" id="sv-console"></div>
        <div class="sv-console-input-row">
          <span class="sv-console-prompt">&gt;</span>
          <input class="sv-console-input" id="sv-cmd-input" placeholder="Enter server command..." autocomplete="off" spellcheck="false"/>
          <button class="sv-send-btn" id="sv-send-btn">Send</button>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="sv-sidebar-panel">
        <div class="sv-panel-header">
          <span>Players</span>
          <span class="sv-player-count" id="sv-player-count">0</span>
        </div>
        <div class="sv-player-list" id="sv-player-list">
          <div class="sv-player-empty">No players online</div>
        </div>

        <div class="sv-panel-header" style="margin-top:8px">
          <span>Server Info</span>
        </div>
        <div class="sv-server-info">
          <div class="sv-info-row">
            <span class="sv-info-label">Local IP</span>
            <code class="sv-info-val">${e(ip)}</code>
          </div>
          <div class="sv-info-row">
            <span class="sv-info-label">Port</span>
            <code class="sv-info-val">25565</code>
          </div>
          <div class="sv-info-row sv-copy-row">
            <button class="sv-copy-full-btn" id="sv-copy-ip-running">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy IP
            </button>
            <button class="sv-copy-full-btn" id="sv-open-folder-running">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              Open Folder
            </button>
          </div>
          <div class="sv-info-row">
            <span class="sv-info-label">Mode</span>
            <span class="sv-info-val sv-badge-offline">Offline</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Render existing log lines
  const consoleEl = body.querySelector("#sv-console");
  renderAllLogs(consoleEl);

  // Render players
  _players = status?.players || [];
  renderPlayers();

  // Wiring
  body.querySelector("#sv-stop-btn").onclick = stopServer;
  body.querySelector("#sv-clear-log").onclick = () => {
    _logLines = [];
    if (consoleEl) consoleEl.innerHTML = "";
  };
  body.querySelector("#sv-copy-ip-running").onclick = () => {
    navigator.clipboard.writeText(`${ip}:25565`);
    copyFeedback(body.querySelector("#sv-copy-ip-running"), "Copied!");
  };
  body.querySelector("#sv-open-folder-running").onclick = () => {
    if (invoke && _serverDir) invoke("mc_open_folder", { path: _serverDir });
  };

  const input = body.querySelector("#sv-cmd-input");
  const sendBtn = body.querySelector("#sv-send-btn");

  const sendCmd = () => {
    const val = input?.value?.trim();
    if (!val || !invoke) return;
    invoke("mc_send_command", { cmd: val });
    appendLog(`> ${val}`, "cmd");
    if (input) input.value = "";
  };

  sendBtn?.addEventListener("click", sendCmd);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendCmd();
  });
}

async function stopServer() {
  if (!invoke) return;
  const btn = q("#sv-stop-btn");
  if (btn) { btn.disabled = true; btn.textContent = "Stopping..."; }
  try { await invoke("mc_stop"); } catch {}
}

// ── log rendering ─────────────────────────────────────────────────────────────

function appendLog(text, level = "info") {
  _logLines.push({ text, level });
  if (_logLines.length > MAX_LOG) _logLines.shift();

  const consoleEl = q("#sv-console");
  if (!consoleEl) return;

  const div = logLineEl(text, level);
  consoleEl.appendChild(div);

  // Auto-scroll if near bottom
  const atBottom = consoleEl.scrollHeight - consoleEl.scrollTop - consoleEl.clientHeight < 60;
  if (atBottom) consoleEl.scrollTop = consoleEl.scrollHeight;
}

function renderAllLogs(consoleEl) {
  if (!consoleEl) return;
  consoleEl.innerHTML = "";
  for (const { text, level } of _logLines) {
    consoleEl.appendChild(logLineEl(text, level));
  }
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

function logLineEl(text, level) {
  const div = document.createElement("div");
  div.className = `sv-log-line sv-log-${level}`;
  div.textContent = text;
  return div;
}

function renderPlayers() {
  const listEl  = q("#sv-player-list");
  const countEl = q("#sv-player-count");
  if (countEl) countEl.textContent = _players.length;
  if (!listEl) return;

  if (_players.length === 0) {
    listEl.innerHTML = `<div class="sv-player-empty">No players online</div>`;
    return;
  }
  listEl.innerHTML = _players.map(p => `
    <div class="sv-player-row">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <span>${e(p)}</span>
      <button class="sv-player-kick" data-name="${e(p)}" title="Kick ${e(p)}">kick</button>
    </div>
  `).join("");

  listEl.querySelectorAll(".sv-player-kick").forEach(btn => {
    btn.onclick = () => {
      if (invoke) invoke("mc_send_command", { cmd: `kick ${btn.dataset.name} Kicked by SkStudio` });
    };
  });
}

// ── helpers ───────────────────────────────────────────────────────────────────

function setStatus(text, running) {
  const dot  = q("#sv-dot");
  const span = q("#sv-status-text");
  if (dot) dot.className = `sv-status-dot ${running ? "sv-dot-online" : "sv-dot-offline"}`;
  if (span) span.textContent = text;
}

function copyFeedback(btn, msg) {
  if (!btn) return;
  const orig = btn.innerHTML;
  btn.textContent = msg;
  setTimeout(() => { btn.innerHTML = orig; }, 1500);
}

// ── exported for browser-only mode (no invoke) ────────────────────────────────

export function isOpen() { return !!_overlay; }
