// Find & Replace panel — uses CodeMirror's @codemirror/search under the hood
import { SearchQuery, setSearchQuery, findNext, findPrevious, replaceNext, replaceAll, openSearchPanel, closeSearchPanel } from "@codemirror/search";

let panelEl;
let getActiveView;
let visible = false;

export function initFindReplace({ getView }) {
  getActiveView = getView;
  panelEl = document.createElement("div");
  panelEl.id = "find-replace";
  panelEl.className = "find-replace hidden";
  panelEl.innerHTML = `
    <div class="fr-row">
      <input type="text" id="fr-find" placeholder="Find" spellcheck="false" />
      <button class="fr-toggle" id="fr-case" title="Match case">Aa</button>
      <button class="fr-toggle" id="fr-regex" title="Use regex">.*</button>
      <button class="fr-toggle" id="fr-word" title="Whole word">W</button>
      <span class="fr-count" id="fr-count"></span>
      <button class="fr-btn" id="fr-prev" title="Previous (Shift+Enter)">↑</button>
      <button class="fr-btn" id="fr-next" title="Next (Enter)">↓</button>
      <button class="fr-btn" id="fr-close" title="Close (Esc)">✕</button>
    </div>
    <div class="fr-row">
      <input type="text" id="fr-replace" placeholder="Replace" spellcheck="false" />
      <button class="fr-btn" id="fr-replace-one">Replace</button>
      <button class="fr-btn" id="fr-replace-all">Replace All</button>
    </div>
  `;
  document.body.appendChild(panelEl);

  const findInput = panelEl.querySelector("#fr-find");
  const replaceInput = panelEl.querySelector("#fr-replace");
  const caseBtn = panelEl.querySelector("#fr-case");
  const regexBtn = panelEl.querySelector("#fr-regex");
  const wordBtn = panelEl.querySelector("#fr-word");
  const countEl = panelEl.querySelector("#fr-count");

  function updateQuery() {
    const view = getActiveView();
    if (!view) return;
    const q = new SearchQuery({
      search: findInput.value,
      replace: replaceInput.value,
      caseSensitive: caseBtn.classList.contains("active"),
      regexp: regexBtn.classList.contains("active"),
      wholeWord: wordBtn.classList.contains("active"),
    });
    view.dispatch({ effects: setSearchQuery.of(q) });
    updateCount();
  }

  function updateCount() {
    const view = getActiveView();
    if (!view || !findInput.value) {
      countEl.textContent = "";
      return;
    }
    try {
      const text = view.state.doc.toString();
      const flags = "g" + (caseBtn.classList.contains("active") ? "" : "i");
      let pattern = findInput.value;
      if (!regexBtn.classList.contains("active")) {
        pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
      if (wordBtn.classList.contains("active")) pattern = `\\b${pattern}\\b`;
      const matches = text.match(new RegExp(pattern, flags));
      countEl.textContent = matches ? `${matches.length} matches` : "No matches";
    } catch {
      countEl.textContent = "Invalid regex";
    }
  }

  // Event listeners
  findInput.addEventListener("input", updateQuery);
  replaceInput.addEventListener("input", updateQuery);
  for (const btn of [caseBtn, regexBtn, wordBtn]) {
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
      updateQuery();
    });
  }
  panelEl.querySelector("#fr-next").onclick = () => { const v = getActiveView(); if (v) findNext(v); };
  panelEl.querySelector("#fr-prev").onclick = () => { const v = getActiveView(); if (v) findPrevious(v); };
  panelEl.querySelector("#fr-replace-one").onclick = () => { const v = getActiveView(); if (v) replaceNext(v); updateCount(); };
  panelEl.querySelector("#fr-replace-all").onclick = () => { const v = getActiveView(); if (v) replaceAll(v); updateCount(); };
  panelEl.querySelector("#fr-close").onclick = hide;

  findInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); const v = getActiveView(); if (v) (e.shiftKey ? findPrevious(v) : findNext(v)); }
    else if (e.key === "Escape") { e.preventDefault(); hide(); }
  });
  replaceInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); const v = getActiveView(); if (v) replaceNext(v); updateCount(); }
    else if (e.key === "Escape") { e.preventDefault(); hide(); }
  });
}

export function show() {
  if (!panelEl) return;
  panelEl.classList.remove("hidden");
  visible = true;
  const view = getActiveView();
  if (view) {
    const sel = view.state.sliceDoc(view.state.selection.main.from, view.state.selection.main.to);
    if (sel && !sel.includes("\n")) {
      panelEl.querySelector("#fr-find").value = sel;
    }
  }
  panelEl.querySelector("#fr-find").focus();
  panelEl.querySelector("#fr-find").select();
}

export function hide() {
  if (!panelEl) return;
  panelEl.classList.add("hidden");
  visible = false;
  const view = getActiveView();
  if (view) view.focus();
}

export function toggle() {
  if (visible) hide(); else show();
}
