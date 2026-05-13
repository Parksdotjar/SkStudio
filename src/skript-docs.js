import { DOCS_CATEGORIES, DOCS_ENTRIES } from "./skript-docs-data.js";

// Build a lookup and ordered index for prev/next navigation
const ENTRY_MAP = Object.fromEntries(DOCS_ENTRIES.map(e => [e.id, e]));
const FLAT_IDS  = DOCS_ENTRIES.map(e => e.id);

export function createSkriptDocs(sidePanel) {
  let activeId = DOCS_ENTRIES[0]?.id ?? null;
  let searchQuery = "";
  let contentEl = null;

  // ── Side panel ─────────────────────────────────────────────────────────────
  function buildSidePanel() {
    sidePanel.innerHTML = "";

    const wrap = document.createElement("div");
    wrap.className = "docs-sidebar";

    // Search
    const searchWrap = document.createElement("div");
    searchWrap.className = "docs-search-wrap";
    const searchInp = document.createElement("input");
    searchInp.type = "text";
    searchInp.className = "docs-search";
    searchInp.placeholder = "Search docs…";
    searchInp.value = searchQuery;
    searchInp.oninput = () => {
      searchQuery = searchInp.value.toLowerCase().trim();
      renderTree();
    };
    searchWrap.appendChild(searchInp);
    wrap.appendChild(searchWrap);

    const treeEl = document.createElement("div");
    treeEl.className = "docs-tree";
    treeEl.id = "docs-tree";
    wrap.appendChild(treeEl);

    sidePanel.appendChild(wrap);
    renderTree();
  }

  function renderTree() {
    const treeEl = document.getElementById("docs-tree");
    if (!treeEl) return;
    treeEl.innerHTML = "";

    const filtered = searchQuery
      ? DOCS_ENTRIES.filter(e =>
          e.title.toLowerCase().includes(searchQuery) ||
          e.category.includes(searchQuery) ||
          (e.description || "").toLowerCase().includes(searchQuery) ||
          (e.patterns || []).some(p => p.toLowerCase().includes(searchQuery))
        )
      : DOCS_ENTRIES;

    // Group by category
    const byCategory = {};
    for (const cat of DOCS_CATEGORIES) byCategory[cat.id] = [];
    for (const entry of filtered) {
      if (byCategory[entry.category]) byCategory[entry.category].push(entry);
    }

    for (const cat of DOCS_CATEGORIES) {
      const items = byCategory[cat.id];
      if (items.length === 0) continue;

      const group = document.createElement("div");
      group.className = "docs-tree-group";

      // Category header
      const header = document.createElement("div");
      header.className = `docs-tree-cat${searchQuery ? " open" : ""}`;
      header.dataset.catId = cat.id;
      header.innerHTML = `
        <span class="docs-cat-icon">${cat.icon}</span>
        <span class="docs-cat-label">${cat.label}</span>
        <span class="docs-cat-count">${items.length}</span>
        <svg class="docs-cat-chevron" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3.5l3 3 3-3"/></svg>
      `;

      const list = document.createElement("div");
      list.className = `docs-tree-list${searchQuery ? " open" : ""}`;

      for (const entry of items) {
        const item = document.createElement("div");
        item.className = `docs-tree-item${entry.id === activeId ? " active" : ""}`;
        item.textContent = entry.title;
        item.dataset.id = entry.id;
        item.onclick = () => {
          activeId = entry.id;
          renderActiveItem();
          updateTreeActive();
        };
        list.appendChild(item);
      }

      header.onclick = () => {
        list.classList.toggle("open");
        header.classList.toggle("open");
      };

      group.appendChild(header);
      group.appendChild(list);
      treeEl.appendChild(group);
    }
  }

  function updateTreeActive() {
    document.querySelectorAll(".docs-tree-item").forEach(el => {
      el.classList.toggle("active", el.dataset.id === activeId);
    });
    // Ensure parent category is open
    const item = document.querySelector(`.docs-tree-item[data-id="${activeId}"]`);
    if (item) {
      const list = item.closest(".docs-tree-list");
      const header = list?.previousElementSibling;
      list?.classList.add("open");
      header?.classList.add("open");
      item.scrollIntoView({ block: "nearest" });
    }
  }

  // ── Main content ───────────────────────────────────────────────────────────
  function renderActiveItem() {
    if (!contentEl) return;
    const entry = ENTRY_MAP[activeId];
    if (!entry) return;
    const cat = DOCS_CATEGORIES.find(c => c.id === entry.category);

    const idx = FLAT_IDS.indexOf(activeId);
    const prevId = idx > 0 ? FLAT_IDS[idx - 1] : null;
    const nextId = idx < FLAT_IDS.length - 1 ? FLAT_IDS[idx + 1] : null;
    const prevEntry = prevId ? ENTRY_MAP[prevId] : null;
    const nextEntry = nextId ? ENTRY_MAP[nextId] : null;

    contentEl.innerHTML = `
      <article class="docs-article">
        <header class="docs-article-header">
          <div class="docs-breadcrumb">${cat?.icon || ""} ${cat?.label || ""}</div>
          <h1 class="docs-article-title">${escHtml(entry.title)}</h1>
          <div class="docs-article-meta">
            ${entry.since ? `<span class="docs-badge docs-badge-since">Since ${escHtml(entry.since)}</span>` : ""}
            ${entry.returnType ? `<span class="docs-badge docs-badge-return">Returns ${escHtml(entry.returnType)}</span>` : ""}
            ${entry.cancellable === true ? `<span class="docs-badge docs-badge-cancellable">Cancellable</span>` : ""}
            ${entry.cancellable === false ? `<span class="docs-badge docs-badge-uncancellable">Not Cancellable</span>` : ""}
          </div>
        </header>

        ${renderPatterns(entry)}
        ${renderDescription(entry)}
        ${renderExamples(entry)}

        <nav class="docs-nav-buttons">
          <button class="docs-nav-btn docs-nav-prev${prevEntry ? "" : " disabled"}" data-target="${prevId || ""}">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 2L4 7l5 5"/></svg>
            <span class="docs-nav-label">
              ${prevEntry ? `<span class="docs-nav-hint">Previous</span><span class="docs-nav-name">${escHtml(prevEntry.title)}</span>` : "<span>No previous page</span>"}
            </span>
          </button>
          <button class="docs-nav-btn docs-nav-next${nextEntry ? "" : " disabled"}" data-target="${nextId || ""}">
            <span class="docs-nav-label">
              ${nextEntry ? `<span class="docs-nav-hint">Next</span><span class="docs-nav-name">${escHtml(nextEntry.title)}</span>` : "<span>No next page</span>"}
            </span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 2l5 5-5 5"/></svg>
          </button>
        </nav>
      </article>
    `;

    // Nav button clicks
    contentEl.querySelector(".docs-nav-prev")?.addEventListener("click", (e) => {
      const t = e.currentTarget.dataset.target;
      if (t) { activeId = t; renderActiveItem(); updateTreeActive(); }
    });
    contentEl.querySelector(".docs-nav-next")?.addEventListener("click", (e) => {
      const t = e.currentTarget.dataset.target;
      if (t) { activeId = t; renderActiveItem(); updateTreeActive(); }
    });

    contentEl.scrollTop = 0;
  }

  function renderPatterns(entry) {
    if (!entry.patterns?.length) return "";
    return `
      <section class="docs-section docs-section-patterns">
        <h2 class="docs-section-title">Syntax</h2>
        <div class="docs-patterns">
          ${entry.patterns.map(p => `<code class="docs-pattern">${escHtml(p)}</code>`).join("")}
        </div>
      </section>`;
  }

  function renderDescription(entry) {
    if (!entry.description) return "";
    return `
      <section class="docs-section">
        <h2 class="docs-section-title">Description</h2>
        <div class="docs-desc">${markdownToHtml(entry.description)}</div>
      </section>`;
  }

  function renderExamples(entry) {
    if (!entry.examples?.length) return "";
    return `
      <section class="docs-section">
        <h2 class="docs-section-title">Examples</h2>
        <div class="docs-examples">
          ${entry.examples.map(ex => `
            <div class="docs-example">
              <div class="docs-example-header">
                <span class="docs-example-lang">Skript</span>
                <button class="docs-copy-btn" data-code="${encodeURIComponent(ex)}" title="Copy">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
              </div>
              <pre class="docs-code"><code>${highlightSkript(escHtml(ex.trim()))}</code></pre>
            </div>
          `).join("")}
        </div>
      </section>`;
  }

  // ── Skript syntax highlighting ─────────────────────────────────────────────
  function highlightSkript(code) {
    // keywords, strings, comments, variables, numbers
    return code
      .replace(/(#.*)$/gm, '<span class="sk-comment">$1</span>')
      .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="sk-string">$1</span>')
      .replace(/(\{[^}]+\})/g, '<span class="sk-var">$1</span>')
      .replace(/(%[^%]+%)/g, '<span class="sk-placeholder">$1</span>')
      .replace(/\b(on|if|else|loop|while|set|add|remove|delete|reset|send|give|kill|spawn|teleport|broadcast|cancel|stop|wait|return|function|command|options|variables|every|using|local|trigger|permission|aliases|execute|make|damage|heal|apply|drop|break|place|equip|message)\b/g,
        '<span class="sk-keyword">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="sk-number">$1</span>');
  }

  // ── Minimal markdown → HTML ────────────────────────────────────────────────
  function markdownToHtml(md) {
    let html = escHtml(md);
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="docs-inline-code">$1</code>');
    // Table (simple)
    html = html.replace(/^\|(.+)\|$/gm, (match) => {
      const cols = match.split("|").filter((c, i, a) => i > 0 && i < a.length - 1);
      if (cols.every(c => /^[-:]+$/.test(c.trim()))) {
        return '<tr class="docs-table-sep" style="display:none"></tr>';
      }
      return "<tr>" + cols.map(c => `<td>${c.trim()}</td>`).join("") + "</tr>";
    });
    html = html.replace(/(<tr>[\s\S]*?<\/tr>)+/g, (m) => `<table class="docs-table"><tbody>${m}</tbody></table>`);
    // Paragraphs
    html = html.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("\n");
    return html;
  }

  function escHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    mount(container) {
      contentEl = container;
      contentEl.className = "docs-content-area";
      buildSidePanel();
      renderActiveItem();
      updateTreeActive();

      // Copy button delegation
      container.addEventListener("click", (e) => {
        const btn = e.target.closest(".docs-copy-btn");
        if (!btn) return;
        const code = decodeURIComponent(btn.dataset.code || "");
        navigator.clipboard?.writeText(code).then(() => {
          btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3ddc84" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`;
          setTimeout(() => {
            btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
          }, 1500);
        });
      });
    },
    destroy() {
      if (sidePanel) sidePanel.innerHTML = "";
      if (contentEl) contentEl.innerHTML = "";
    },
  };
}
