// Basic terminal panel — runs commands via Rust backend.
// Note: This is a simple shell pipe (not a full PTY). TTY-aware programs
// (interactive REPLs, progress bars, etc.) won't render correctly.
let invoke, listen;
try {
  ({ invoke } = await import("@tauri-apps/api/core"));
  ({ listen } = await import("@tauri-apps/api/event"));
} catch {}

let panelEl, outputEl, inputEl;
let visible = false;
let unlisten = null;
let cwd = null;

export function initTerminal(parent) {
  panelEl = document.createElement("div");
  panelEl.className = "terminal-panel hidden";
  panelEl.innerHTML = `
    <div class="terminal-header">
      <span class="terminal-title">Terminal</span>
      <span class="terminal-cwd" id="term-cwd"></span>
      <button class="icon-btn" id="term-clear" title="Clear">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg>
      </button>
      <button class="icon-btn" id="term-close" title="Close">
        <svg width="11" height="11" viewBox="0 0 10 10"><path d="M0 0L10 10M10 0L0 10" stroke="currentColor" stroke-width="1.5"/></svg>
      </button>
    </div>
    <div class="terminal-body" id="term-output"></div>
    <div class="terminal-input-row">
      <span class="terminal-prompt">$</span>
      <input type="text" id="term-input" autocomplete="off" spellcheck="false" />
    </div>
  `;
  parent.appendChild(panelEl);

  outputEl = panelEl.querySelector("#term-output");
  inputEl = panelEl.querySelector("#term-input");

  panelEl.querySelector("#term-close").onclick = hide;
  panelEl.querySelector("#term-clear").onclick = () => { outputEl.innerHTML = ""; };

  const history = [];
  let historyIdx = -1;

  inputEl.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      const cmd = inputEl.value.trim();
      if (!cmd) return;
      history.unshift(cmd);
      historyIdx = -1;
      inputEl.value = "";
      writeLine(`$ ${cmd}`, "cmd");
      await runCommand(cmd);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIdx + 1 < history.length) { historyIdx++; inputEl.value = history[historyIdx]; }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx > 0) { historyIdx--; inputEl.value = history[historyIdx]; }
      else { historyIdx = -1; inputEl.value = ""; }
    }
  });

  // Listen for streamed output from Rust
  if (listen) {
    listen("term-output", (e) => {
      writeLine(e.payload.text, e.payload.kind || "out");
    }).then((u) => { unlisten = u; });
  }
}

function writeLine(text, kind = "out") {
  const div = document.createElement("div");
  div.className = `term-line term-${kind}`;
  div.textContent = text;
  outputEl.appendChild(div);
  outputEl.scrollTop = outputEl.scrollHeight;
}

async function runCommand(cmd) {
  if (!invoke) {
    writeLine("Terminal only works in the Tauri app", "err");
    return;
  }
  // Built-in: cd
  if (cmd.startsWith("cd ") || cmd === "cd") {
    const target = cmd.slice(3).trim() || ".";
    try {
      cwd = await invoke("term_cd", { path: target, cwd });
      panelEl.querySelector("#term-cwd").textContent = cwd || "";
    } catch (e) {
      writeLine(String(e), "err");
    }
    return;
  }
  if (cmd === "clear" || cmd === "cls") { outputEl.innerHTML = ""; return; }

  try {
    const result = await invoke("term_run", { cmd, cwd });
    if (result.stdout) writeLine(result.stdout.trimEnd(), "out");
    if (result.stderr) writeLine(result.stderr.trimEnd(), "err");
    if (result.code !== 0 && result.code !== null) writeLine(`(exit ${result.code})`, "dim");
  } catch (e) {
    writeLine(String(e), "err");
  }
}

export function show() {
  panelEl.classList.remove("hidden");
  visible = true;
  inputEl.focus();
}
export function hide() {
  panelEl.classList.add("hidden");
  visible = false;
}
export function toggle() { if (visible) hide(); else show(); }
export function isVisible() { return visible; }
