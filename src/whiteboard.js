// Whiteboard — Milnote-style infinite canvas with draggable cards

const CARD_TYPES = [
  { type: "text",      label: "Text",      icon: "T",    title: "Text Box" },
  { type: "header",    label: "Header",    icon: "H",    title: "Header" },
  { type: "note",      label: "Note",      icon: "📌",   title: "Sticky Note" },
  { type: "image",     label: "Image",     icon: "🖼",   title: "Image" },
  { type: "video",     label: "Video",     icon: "▶",    title: "Video" },
  { type: "url",       label: "URL",       icon: "🔗",   title: "Link" },
  { type: "code",      label: "Code",      icon: "</>",  title: "Code Block" },
  { type: "checklist", label: "List",      icon: "☑",    title: "Checklist" },
  { type: "embed",     label: "Embed",     icon: "⊡",    title: "Embed" },
  { type: "shape",     label: "Shape",     icon: "■",    title: "Shape" },
  { type: "divider",   label: "Divider",   icon: "—",    title: "Divider" },
  { type: "timer",     label: "Timer",     icon: "⏱",    title: "Timer" },
];

const DEFAULT_SIZE = {
  text:      [240, 140],
  header:    [320, 80],
  note:      [200, 180],
  image:     [300, 220],
  video:     [360, 240],
  url:       [280, 100],
  code:      [320, 200],
  checklist: [240, 220],
  embed:     [400, 300],
  shape:     [160, 160],
  divider:   [300, 32],
  timer:     [180, 120],
};

function makeDefaultData(type) {
  switch (type) {
    case "text":      return { content: "Double-click to edit", font: "Segoe UI", fontSize: 14, bold: false, italic: false, underline: false, strike: false, highlight: "", textColor: "", align: "left", bgColor: "" };
    case "header":    return { content: "Heading", level: 1, textColor: "", align: "left" };
    case "note":      return { content: "Note text here...", bgColor: "#f4c430", textColor: "#1a1a1a", fontSize: 13 };
    case "image":     return { src: null, alt: "", borderRadius: 6, opacity: 100, link: "" };
    case "video":     return { src: "", autoplay: false, loop: false };
    case "url":       return { url: "", title: "" };
    case "code":      return { content: "// paste code here", language: "js", fontSize: 12 };
    case "checklist": return { title: "Checklist", items: [{ id: 1, text: "Item 1", done: false }] };
    case "embed":     return { url: "" };
    case "shape":     return { fill: "#3ddc84", border: "", borderWidth: 0, borderRadius: 8, opacity: 100 };
    case "divider":   return { color: "#2a2a30", thickness: 2, style: "solid", label: "" };
    case "timer":     return { minutes: 5, seconds: 0, running: false, remaining: 300 };
    default:          return {};
  }
}

// sidePanel: the .side-panel <aside> element managed by main.js
export function createWhiteboard(canvasContainer, sidePanel, tabData) {
  if (!tabData.cards)         tabData.cards  = [];
  if (tabData.panX   == null) tabData.panX   = 0;
  if (tabData.panY   == null) tabData.panY   = 0;
  if (tabData.zoom   == null) tabData.zoom   = 1;
  if (tabData.nextId == null) tabData.nextId = 1;

  let selectedId = null;
  let editingId  = null;
  const cleanups = [];
  const timers   = new Map();

  // ── Canvas DOM ────────────────────────────────────────────────────────────
  canvasContainer.innerHTML = "";

  const root = document.createElement("div");
  root.className = "wb-root";
  root.innerHTML = `
    <div class="wb-viewport" id="wb-viewport">
      <div class="wb-canvas" id="wb-canvas"></div>
    </div>
    <div class="wb-zoom-controls">
      <button class="wb-zoom-btn" id="wb-zoom-out" title="Zoom out">−</button>
      <button class="wb-zoom-btn" id="wb-zoom-reset" title="Reset view">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M8 11h6M11 8v6"/></svg>
      </button>
      <button class="wb-zoom-btn" id="wb-zoom-in" title="Zoom in">+</button>
    </div>
  `;
  canvasContainer.appendChild(root);

  const viewport = root.querySelector("#wb-viewport");
  const canvas   = root.querySelector("#wb-canvas");

  root.querySelector("#wb-zoom-out").onclick   = () => zoom(0.85);
  root.querySelector("#wb-zoom-in").onclick    = () => zoom(1.18);
  root.querySelector("#wb-zoom-reset").onclick = () => { tabData.zoom = 1; tabData.panX = 0; tabData.panY = 0; applyTransform(); };

  function zoom(factor) {
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    const cx = vw / 2, cy = vh / 2;
    const newZoom = Math.max(0.2, Math.min(4, tabData.zoom * factor));
    tabData.panX = cx - (cx - tabData.panX) * (newZoom / tabData.zoom);
    tabData.panY = cy - (cy - tabData.panY) * (newZoom / tabData.zoom);
    tabData.zoom = newZoom;
    applyTransform();
  }

  // ── Side panel: palette & props ───────────────────────────────────────────
  function buildPalette() {
    sidePanel.innerHTML = `
      <div class="wb-palette">
        <div class="wb-palette-header">Cards</div>
        <div class="wb-palette-grid" id="wb-palette-grid"></div>
      </div>
    `;
    const grid = sidePanel.querySelector("#wb-palette-grid");
    for (const ct of CARD_TYPES) {
      const item = document.createElement("div");
      item.className = "wb-palette-item";
      item.innerHTML = `<span class="wb-palette-icon">${ct.icon}</span><span class="wb-palette-label">${ct.label}</span>`;
      item.title = ct.title;
      setupPaletteDrag(item, ct);
      grid.appendChild(item);
    }
  }

  function setupPaletteDrag(item, ct) {
    item.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();

      const ghost = document.createElement("div");
      ghost.className = "wb-drop-ghost";
      ghost.innerHTML = `<span class="wb-drop-ghost-icon">${ct.icon}</span><span class="wb-drop-ghost-label">${ct.label}</span>`;
      ghost.style.left = e.clientX + 12 + "px";
      ghost.style.top  = e.clientY + 12 + "px";
      document.body.appendChild(ghost);

      function onMove(ev) {
        ghost.style.left = ev.clientX + 12 + "px";
        ghost.style.top  = ev.clientY + 12 + "px";
        const rect = viewport.getBoundingClientRect();
        const over = ev.clientX >= rect.left && ev.clientX <= rect.right &&
                     ev.clientY >= rect.top  && ev.clientY <= rect.bottom;
        ghost.classList.toggle("over-canvas", over);
      }

      function onUp(ev) {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        ghost.remove();

        const rect = viewport.getBoundingClientRect();
        const over = ev.clientX >= rect.left && ev.clientX <= rect.right &&
                     ev.clientY >= rect.top  && ev.clientY <= rect.bottom;
        if (over) {
          const vpX = ev.clientX - rect.left;
          const vpY = ev.clientY - rect.top;
          dropCard(ct.type, vpX, vpY);
        }
      }

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
  }

  function dropCard(type, vpX, vpY) {
    const [w, h] = DEFAULT_SIZE[type] || [200, 150];
    const x = (vpX - tabData.panX) / tabData.zoom - w / 2;
    const y = (vpY - tabData.panY) / tabData.zoom - h / 2;
    const card = { id: tabData.nextId++, type, x, y, w, h, data: makeDefaultData(type) };
    tabData.cards.push(card);
    const el = mountCard(card);
    // drop animation: scale up → scale down + fade in
    el.style.transform = "scale(1.06)";
    el.style.opacity   = "0";
    el.style.transition = "transform 0.22s cubic-bezier(0.2,0.9,0.3,1.05), opacity 0.18s ease";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transform = "scale(1)";
      el.style.opacity   = "1";
    }));
    selectCard(card.id);
  }

  function buildProps(card) {
    sidePanel.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "wb-props";

    const header = document.createElement("div");
    header.className = "wb-props-header";
    const titleEl = document.createElement("span");
    titleEl.className = "wb-props-title";
    titleEl.textContent = CARD_TYPES.find(t => t.type === card.type)?.title || card.type;
    const closeBtn = document.createElement("button");
    closeBtn.className = "icon-btn wb-props-close";
    closeBtn.title = "Close (Esc)";
    closeBtn.innerHTML = `<svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 0L10 10M10 0L0 10" stroke="currentColor" stroke-width="1.5"/></svg>`;
    closeBtn.onclick = () => deselect();
    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    const body = document.createElement("div");
    body.className = "wb-props-body";

    wrap.appendChild(header);
    wrap.appendChild(body);
    sidePanel.appendChild(wrap);

    renderProps(card, body);
  }

  // ── Canvas transform ──────────────────────────────────────────────────────
  function applyTransform() {
    canvas.style.transform = `translate(${tabData.panX}px,${tabData.panY}px) scale(${tabData.zoom})`;
  }
  applyTransform();

  // ── Initial render ────────────────────────────────────────────────────────
  for (const card of tabData.cards) mountCard(card);
  buildPalette();

  // ── Card helpers ──────────────────────────────────────────────────────────
  function getCard(id) { return tabData.cards.find(c => c.id === id); }

  function mountCard(card) {
    const el = document.createElement("div");
    el.className = `wb-card wb-card-${card.type}`;
    el.dataset.id = card.id;
    applyCardGeometry(el, card);
    el.innerHTML = buildCardHTML(card);
    if (selectedId === card.id) el.classList.add("selected");
    setupCardInteraction(el, card);
    canvas.appendChild(el);
    return el;
  }

  function applyCardGeometry(el, card) {
    el.style.left  = card.x + "px";
    el.style.top   = card.y + "px";
    el.style.width = card.w + "px";
    if (card.type !== "divider") el.style.height = card.h + "px";
  }

  function refreshCardById(id) {
    if (editingId === id) commitEditing(id);
    const card = getCard(id);
    if (!card) return;
    const existing = canvas.querySelector(`[data-id="${id}"]`);
    if (!existing) return;
    const el = document.createElement("div");
    el.className = `wb-card wb-card-${card.type}${selectedId === id ? " selected" : ""}`;
    el.dataset.id = id;
    applyCardGeometry(el, card);
    el.innerHTML = buildCardHTML(card);
    setupCardInteraction(el, card);
    existing.replaceWith(el);
  }

  // ── Card HTML builders ────────────────────────────────────────────────────
  function buildCardHTML(card) {
    const d = card.data;
    switch (card.type) {
      case "text": {
        const style = css({
          "font-family":      d.font || "Segoe UI",
          "font-size":        d.fontSize ? d.fontSize + "px" : null,
          "font-weight":      d.bold ? "bold" : null,
          "font-style":       d.italic ? "italic" : null,
          "text-decoration":  d.underline ? "underline" : d.strike ? "line-through" : null,
          "color":            d.textColor || null,
          "background-color": d.highlight || null,
          "text-align":       d.align || null,
        });
        const wrapStyle = css({ "background-color": d.bgColor || null });
        return `
          <div class="wb-drag-handle"></div>
          <div class="wb-card-body" style="${wrapStyle}">
            <div class="wb-text-content" contenteditable="false" style="${style}">${escHtml(d.content)}</div>
          </div>
          <div class="wb-resize-handle"></div>`;
      }
      case "header": {
        const tag = `h${d.level || 1}`;
        const style = css({ "color": d.textColor || null, "text-align": d.align || null });
        return `
          <${tag} class="wb-header-content" contenteditable="false" style="${style}">${escHtml(d.content)}</${tag}>
          <div class="wb-resize-handle"></div>`;
      }
      case "note": {
        const style = css({ "background": d.bgColor || "#f4c430", "color": d.textColor || "#1a1a1a", "font-size": d.fontSize ? d.fontSize + "px" : null });
        return `
          <div class="wb-note-inner" style="${style}">
            <div class="wb-drag-handle wb-note-handle"></div>
            <div class="wb-note-content" contenteditable="false">${escHtml(d.content)}</div>
          </div>
          <div class="wb-resize-handle"></div>`;
      }
      case "image": {
        if (d.src) {
          const style = css({ "border-radius": d.borderRadius + "px", "opacity": d.opacity / 100 });
          return `
            <div class="wb-drag-handle"></div>
            <div class="wb-card-body wb-image-body">
              <img src="${d.src}" alt="${escAttr(d.alt)}" style="${style}" draggable="false"/>
            </div>
            <div class="wb-resize-handle"></div>`;
        }
        return `
          <div class="wb-drag-handle"></div>
          <div class="wb-card-body wb-image-empty">
            <label class="wb-image-placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <p>Click to upload or paste an image</p>
              <input type="file" class="wb-image-input" accept="image/*" style="display:none"/>
            </label>
          </div>
          <div class="wb-resize-handle"></div>`;
      }
      case "video": {
        if (d.src) {
          const ytId = youtubeId(d.src);
          if (ytId) {
            return `
              <div class="wb-drag-handle"></div>
              <div class="wb-card-body" style="padding:0">
                <iframe src="https://www.youtube.com/embed/${ytId}${d.autoplay ? "?autoplay=1" : ""}" frameborder="0" allowfullscreen style="width:100%;height:100%;border-radius:6px;display:block"></iframe>
              </div>
              <div class="wb-resize-handle"></div>`;
          }
          return `
            <div class="wb-drag-handle"></div>
            <div class="wb-card-body" style="padding:0">
              <video src="${escAttr(d.src)}"${d.autoplay ? " autoplay" : ""}${d.loop ? " loop" : ""} controls style="width:100%;height:100%;object-fit:contain;display:block"></video>
            </div>
            <div class="wb-resize-handle"></div>`;
        }
        return emptyState("video", `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`, "Set a video URL in properties");
      }
      case "url": {
        if (d.url) {
          return `
            <div class="wb-drag-handle"></div>
            <div class="wb-card-body" style="padding:0">
              <a href="${escAttr(d.url)}" target="_blank" rel="noopener" class="wb-url-link">
                <div class="wb-url-icon">🔗</div>
                <div class="wb-url-info">
                  <div class="wb-url-title">${escHtml(d.title || d.url)}</div>
                  <div class="wb-url-href">${escHtml(d.url)}</div>
                </div>
              </a>
            </div>
            <div class="wb-resize-handle"></div>`;
        }
        return emptyState("url", "🔗", "Add a URL in properties");
      }
      case "code": {
        return `
          <div class="wb-drag-handle">
            <span class="wb-code-lang">${escHtml(d.language || "")}</span>
          </div>
          <div class="wb-card-body" style="padding:0;overflow:auto">
            <pre class="wb-code-content" contenteditable="false" style="font-size:${d.fontSize || 12}px">${escHtml(d.content)}</pre>
          </div>
          <div class="wb-resize-handle"></div>`;
      }
      case "checklist": {
        const items = (d.items || []).map(item => `
          <div class="wb-checklist-item">
            <input type="checkbox" class="wb-check" data-item-id="${item.id}"${item.done ? " checked" : ""}>
            <span class="wb-check-label${item.done ? " done" : ""}">${escHtml(item.text)}</span>
          </div>`).join("");
        return `
          <div class="wb-drag-handle">
            <span class="wb-checklist-title">${escHtml(d.title || "Checklist")}</span>
          </div>
          <div class="wb-card-body wb-checklist-body">${items}</div>
          <div class="wb-resize-handle"></div>`;
      }
      case "embed": {
        if (d.url) {
          return `
            <div class="wb-drag-handle"></div>
            <div class="wb-card-body" style="padding:0">
              <iframe src="${escAttr(d.url)}" frameborder="0" sandbox="allow-scripts allow-same-origin allow-forms" style="width:100%;height:100%;display:block;border-radius:0 0 6px 6px"></iframe>
            </div>
            <div class="wb-resize-handle"></div>`;
        }
        return emptyState("embed", "⊡", "Add a URL to embed");
      }
      case "shape": {
        const style = css({
          "background":    d.fill || "#3ddc84",
          "border":        d.border ? `${d.borderWidth || 2}px solid ${d.border}` : null,
          "border-radius": d.borderRadius + "px",
          "opacity":       d.opacity / 100,
          "width":         "100%",
          "height":        "100%",
        });
        return `<div class="wb-shape-inner" style="${style}"></div><div class="wb-resize-handle"></div>`;
      }
      case "divider": {
        const hrStyle = `border:none;border-top:${d.thickness || 2}px ${d.style || "solid"} ${d.color || "#2a2a30"};flex:1;margin:0`;
        if (d.label) {
          return `
            <div class="wb-divider-inner wb-drag-handle">
              <hr style="${hrStyle}"/>
              <span class="wb-divider-label">${escHtml(d.label)}</span>
              <hr style="${hrStyle}"/>
            </div>`;
        }
        return `<div class="wb-divider-inner wb-drag-handle"><hr style="${hrStyle}"/></div>`;
      }
      case "timer": {
        const rem = d.remaining ?? (d.minutes || 5) * 60 + (d.seconds || 0);
        const m = String(Math.floor(rem / 60)).padStart(2, "0");
        const s = String(rem % 60).padStart(2, "0");
        return `
          <div class="wb-drag-handle"></div>
          <div class="wb-timer-body">
            <div class="wb-timer-display">${m}:${s}</div>
            <div class="wb-timer-controls">
              <button class="wb-timer-btn" data-timer-action="toggle">${d.running ? "⏸" : "▶"}</button>
              <button class="wb-timer-btn" data-timer-action="reset">↺</button>
            </div>
          </div>
          <div class="wb-resize-handle"></div>`;
      }
      default:
        return `<div class="wb-drag-handle"></div><div class="wb-card-body">${card.type}</div>`;
    }
  }

  function emptyState(type, iconHtml, text) {
    const isEmoji = typeof iconHtml === "string" && iconHtml.length <= 3;
    const iconEl = isEmoji ? `<span style="font-size:28px">${iconHtml}</span>` : iconHtml;
    return `
      <div class="wb-drag-handle"></div>
      <div class="wb-card-body wb-empty-state">
        ${iconEl}
        <p>${text}</p>
      </div>
      <div class="wb-resize-handle"></div>`;
  }

  // ── Card interaction setup ────────────────────────────────────────────────
  function setupCardInteraction(el, card) {
    const handle = el.querySelector(".wb-drag-handle") || el;

    handle.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      if (e.target.isContentEditable) return;
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "BUTTON" || tag === "A" || tag === "IFRAME" || tag === "VIDEO") return;
      e.preventDefault();
      e.stopPropagation();
      selectCard(card.id);

      const ox = e.clientX - card.x * tabData.zoom;
      const oy = e.clientY - card.y * tabData.zoom;

      function onMove(ev) {
        card.x = (ev.clientX - ox) / tabData.zoom;
        card.y = (ev.clientY - oy) / tabData.zoom;
        el.style.left = card.x + "px";
        el.style.top  = card.y + "px";
      }
      function onUp() {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      }
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });

    const rh = el.querySelector(".wb-resize-handle");
    if (rh) {
      rh.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        const sx = e.clientX, sy = e.clientY;
        const sw = card.w, sh = card.h;
        function onMove(ev) {
          card.w = Math.max(80,  sw + (ev.clientX - sx) / tabData.zoom);
          card.h = Math.max(40,  sh + (ev.clientY - sy) / tabData.zoom);
          el.style.width  = card.w + "px";
          if (card.type !== "divider") el.style.height = card.h + "px";
        }
        function onUp() {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        }
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      });
    }

    el.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      if (e.target.isContentEditable) return;
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "BUTTON") return;
      e.stopPropagation();
      selectCard(card.id);
    });

    if (["text", "header", "note", "code"].includes(card.type)) {
      el.addEventListener("dblclick", (e) => {
        const editable = el.querySelector("[contenteditable]");
        if (!editable) return;
        editingId = card.id;
        editable.contentEditable = "true";
        editable.focus();
        const range = document.caretRangeFromPoint?.(e.clientX, e.clientY);
        if (range) {
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      });
    }
  }

  // ── Selection ─────────────────────────────────────────────────────────────
  function selectCard(id) {
    if (selectedId === id) return;
    if (selectedId != null) {
      canvas.querySelector(`[data-id="${selectedId}"]`)?.classList.remove("selected");
      commitEditing(selectedId);
    }
    selectedId = id;
    canvas.querySelector(`[data-id="${id}"]`)?.classList.add("selected");
    const card = getCard(id);
    if (card) buildProps(card);
  }

  function deselect() {
    if (selectedId != null) {
      canvas.querySelector(`[data-id="${selectedId}"]`)?.classList.remove("selected");
      commitEditing(selectedId);
    }
    selectedId = null;
    editingId  = null;
    buildPalette();
  }

  function commitEditing(id) {
    if (editingId !== id) return;
    const el = canvas.querySelector(`[data-id="${id}"] [contenteditable="true"]`);
    if (el) {
      const card = getCard(id);
      if (card) card.data.content = el.innerText;
      el.contentEditable = "false";
    }
    editingId = null;
  }

  // ── Properties panel ──────────────────────────────────────────────────────
  function renderProps(card, propsBody) {
    const d = card.data;

    const delBtn = document.createElement("button");
    delBtn.className = "wb-prop-delete-btn";
    delBtn.textContent = "Delete Card";
    delBtn.onclick = () => {
      const id = card.id;
      deselect();
      tabData.cards = tabData.cards.filter(c => c.id !== id);
      canvas.querySelector(`[data-id="${id}"]`)?.remove();
    };
    propsBody.appendChild(delBtn);

    function sec(label) {
      const el = document.createElement("div");
      el.className = "wb-prop-section";
      el.textContent = label;
      propsBody.appendChild(el);
    }

    function row(label, ctrl) {
      const wrap = document.createElement("div");
      wrap.className = "wb-prop-row";
      if (label) {
        const lbl = document.createElement("label");
        lbl.className = "wb-prop-label";
        lbl.textContent = label;
        wrap.appendChild(lbl);
      }
      const ctrlWrap = document.createElement("div");
      ctrlWrap.className = "wb-prop-ctrl";
      if (typeof ctrl === "string") ctrlWrap.innerHTML = ctrl;
      else ctrlWrap.appendChild(ctrl);
      wrap.appendChild(ctrlWrap);
      propsBody.appendChild(wrap);
      return ctrlWrap;
    }

    function input(val, onChange, placeholder) {
      const el = document.createElement("input");
      el.type = "text";
      el.className = "wb-prop-input";
      el.value = val ?? "";
      el.placeholder = placeholder || "";
      el.oninput = () => onChange(el.value);
      return el;
    }

    function numInput(val, onChange, min, max) {
      const el = document.createElement("input");
      el.type = "number";
      el.className = "wb-prop-input";
      el.style.width = "64px";
      el.value = val ?? "";
      if (min != null) el.min = min;
      if (max != null) el.max = max;
      el.oninput = () => onChange(Number(el.value));
      return el;
    }

    function colorPicker(val, onChange) {
      const wrap = document.createElement("div");
      wrap.className = "wb-color-row";
      const inp = document.createElement("input");
      inp.type = "color";
      inp.className = "wb-prop-color";
      inp.value = val || "#ffffff";
      inp.oninput = () => onChange(inp.value);
      const clear = document.createElement("button");
      clear.className = "wb-color-clear";
      clear.title = "Clear";
      clear.textContent = "✕";
      clear.onclick = () => { inp.value = "#ffffff"; onChange(""); };
      wrap.appendChild(inp);
      wrap.appendChild(clear);
      return wrap;
    }

    function toggle(checked, label, onChange) {
      const lbl = document.createElement("label");
      lbl.className = "wb-prop-toggle";
      const inp = document.createElement("input");
      inp.type = "checkbox";
      inp.checked = !!checked;
      inp.onchange = () => onChange(inp.checked);
      lbl.appendChild(inp);
      lbl.append(` ${label}`);
      return lbl;
    }

    function selectEl(options, val, onChange) {
      const el = document.createElement("select");
      el.className = "wb-prop-select";
      for (const [v, lbl] of options) {
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = lbl;
        if (v === val) opt.selected = true;
        el.appendChild(opt);
      }
      el.onchange = () => onChange(el.value);
      return el;
    }

    function fmtBtns(specs) {
      const wrap = document.createElement("div");
      wrap.className = "wb-fmt-row";
      for (const [prop, html, title] of specs) {
        const btn = document.createElement("button");
        btn.className = `wb-fmt-btn${d[prop] ? " active" : ""}`;
        btn.title = title;
        btn.innerHTML = html;
        btn.onclick = () => {
          d[prop] = !d[prop];
          btn.classList.toggle("active", d[prop]);
          refreshCardById(card.id);
        };
        wrap.appendChild(btn);
      }
      return wrap;
    }

    function alignBtns() {
      const wrap = document.createElement("div");
      wrap.className = "wb-fmt-row";
      for (const [a, svg] of [
        ["left",   `<svg width="13" height="11" viewBox="0 0 13 11" fill="none" stroke="currentColor"><line x1="0" y1="1.5" x2="13" y2="1.5"/><line x1="0" y1="5.5" x2="9" y2="5.5"/><line x1="0" y1="9.5" x2="11" y2="9.5"/></svg>`],
        ["center", `<svg width="13" height="11" viewBox="0 0 13 11" fill="none" stroke="currentColor"><line x1="0" y1="1.5" x2="13" y2="1.5"/><line x1="2" y1="5.5" x2="11" y2="5.5"/><line x1="1" y1="9.5" x2="12" y2="9.5"/></svg>`],
        ["right",  `<svg width="13" height="11" viewBox="0 0 13 11" fill="none" stroke="currentColor"><line x1="0" y1="1.5" x2="13" y2="1.5"/><line x1="4" y1="5.5" x2="13" y2="5.5"/><line x1="2" y1="9.5" x2="13" y2="9.5"/></svg>`],
      ]) {
        const btn = document.createElement("button");
        btn.className = `wb-fmt-btn${(d.align || "left") === a ? " active" : ""}`;
        btn.title = a.charAt(0).toUpperCase() + a.slice(1);
        btn.innerHTML = svg;
        btn.onclick = () => {
          d.align = a;
          wrap.querySelectorAll(".wb-fmt-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          refreshCardById(card.id);
        };
        wrap.appendChild(btn);
      }
      return wrap;
    }

    function noteSwatch() {
      const SWATCHES = ["#f4c430","#ff6b6b","#4ecdc4","#95e1d3","#a8e6cf","#ffd3b6","#c3a6ff","#b8e0ff"];
      const wrap = document.createElement("div");
      wrap.className = "wb-swatch-row";
      for (const color of SWATCHES) {
        const sw = document.createElement("button");
        sw.className = `wb-swatch${d.bgColor === color ? " active" : ""}`;
        sw.style.background = color;
        sw.title = color;
        sw.onclick = () => {
          d.bgColor = color;
          wrap.querySelectorAll(".wb-swatch").forEach(s => s.classList.remove("active"));
          sw.classList.add("active");
          refreshCardById(card.id);
        };
        wrap.appendChild(sw);
      }
      return wrap;
    }

    switch (card.type) {
      case "text": {
        sec("Text");
        row("Font", selectEl(
          [["Segoe UI","Segoe UI"],["Arial","Arial"],["Georgia","Georgia"],["JetBrains Mono","Monospace"],["Impact","Impact"],["Comic Sans MS","Comic Sans"]],
          d.font || "Segoe UI",
          v => { d.font = v; refreshCardById(card.id); }
        ));
        row("Size", numInput(d.fontSize || 14, v => { d.fontSize = v; refreshCardById(card.id); }, 8, 96));
        row("Style", fmtBtns([
          ["bold",      "<b>B</b>",  "Bold"],
          ["italic",    "<i>I</i>",  "Italic"],
          ["underline", "<u>U</u>",  "Underline"],
          ["strike",    "<s>S</s>",  "Strikethrough"],
        ]));
        row("Align", alignBtns());
        sec("Colors");
        row("Text",       colorPicker(d.textColor, v => { d.textColor = v; refreshCardById(card.id); }));
        row("Highlight",  colorPicker(d.highlight, v => { d.highlight = v; refreshCardById(card.id); }));
        row("Background", colorPicker(d.bgColor,   v => { d.bgColor   = v; refreshCardById(card.id); }));
        break;
      }
      case "header": {
        sec("Header");
        const lvlWrap = document.createElement("div");
        lvlWrap.className = "wb-fmt-row";
        for (const n of [1, 2, 3, 4]) {
          const btn = document.createElement("button");
          btn.className = `wb-fmt-btn${(d.level || 1) === n ? " active" : ""}`;
          btn.textContent = `H${n}`;
          btn.onclick = () => {
            d.level = n;
            lvlWrap.querySelectorAll(".wb-fmt-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            refreshCardById(card.id);
          };
          lvlWrap.appendChild(btn);
        }
        row("Level", lvlWrap);
        row("Align", alignBtns());
        sec("Colors");
        row("Text", colorPicker(d.textColor, v => { d.textColor = v; refreshCardById(card.id); }));
        break;
      }
      case "note": {
        sec("Note");
        row("Color",     noteSwatch());
        row("Text color",colorPicker(d.textColor, v => { d.textColor = v; refreshCardById(card.id); }));
        row("Font size", numInput(d.fontSize || 13, v => { d.fontSize = v; refreshCardById(card.id); }, 8, 48));
        break;
      }
      case "image": {
        sec("Image");
        const fileLbl = document.createElement("label");
        fileLbl.className = "wb-prop-file-btn";
        fileLbl.textContent = d.src ? "Replace image" : "Choose image";
        const fileInp = document.createElement("input");
        fileInp.type = "file";
        fileInp.accept = "image/*";
        fileInp.style.display = "none";
        fileInp.onchange = () => {
          const file = fileInp.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = e2 => { d.src = e2.target.result; refreshCardById(card.id); buildProps(getCard(card.id)); };
          reader.readAsDataURL(file);
        };
        fileLbl.appendChild(fileInp);
        row("File", fileLbl);
        row("Alt text", input(d.alt, v => d.alt = v, "Alt text"));
        row("Link URL",  input(d.link, v => d.link = v, "https://..."));
        row("Rounded",   numInput(d.borderRadius ?? 6, v => { d.borderRadius = v; refreshCardById(card.id); }, 0, 100));
        row("Opacity",   numInput(d.opacity ?? 100,    v => { d.opacity = v; refreshCardById(card.id); }, 0, 100));
        break;
      }
      case "video": {
        sec("Video");
        const urlInp = input(d.src, v => d.src = v, "YouTube or video URL");
        urlInp.onblur = () => refreshCardById(card.id);
        row("URL", urlInp);
        row(null, toggle(d.autoplay, "Autoplay", v => { d.autoplay = v; refreshCardById(card.id); }));
        row(null, toggle(d.loop,     "Loop",     v => { d.loop = v;     refreshCardById(card.id); }));
        break;
      }
      case "url": {
        sec("Link");
        const urlInp = input(d.url, v => d.url = v, "https://...");
        urlInp.onblur = () => refreshCardById(card.id);
        row("URL",   urlInp);
        row("Label", input(d.title, v => { d.title = v; refreshCardById(card.id); }, "Optional label"));
        break;
      }
      case "code": {
        sec("Code");
        row("Language", selectEl(
          [["js","JavaScript"],["ts","TypeScript"],["py","Python"],["html","HTML"],["css","CSS"],["sk","Skript"],["bash","Bash"],["json","JSON"],["other","Other"]],
          d.language || "js",
          v => { d.language = v; refreshCardById(card.id); }
        ));
        row("Font size", numInput(d.fontSize || 12, v => { d.fontSize = v; refreshCardById(card.id); }, 8, 32));
        sec("Content");
        const ta = document.createElement("textarea");
        ta.className = "wb-prop-textarea";
        ta.value = d.content || "";
        ta.rows = 8;
        ta.placeholder = "// code here";
        ta.oninput = () => { d.content = ta.value; refreshCardById(card.id); };
        propsBody.appendChild(ta);
        break;
      }
      case "checklist": {
        sec("Checklist");
        row("Title", input(d.title, v => { d.title = v; refreshCardById(card.id); }));
        sec("Items");

        function renderItemList() {
          let listEl = propsBody.querySelector(".wb-prop-item-list");
          if (!listEl) {
            listEl = document.createElement("div");
            listEl.className = "wb-prop-item-list";
            propsBody.appendChild(listEl);
          }
          listEl.innerHTML = "";
          for (const item of (d.items || [])) {
            const r = document.createElement("div");
            r.className = "wb-prop-checklist-item";
            const inp = document.createElement("input");
            inp.type = "text";
            inp.className = "wb-prop-input";
            inp.value = item.text;
            inp.style.flex = "1";
            inp.oninput = () => { item.text = inp.value; refreshCardById(card.id); };
            const del = document.createElement("button");
            del.className = "wb-prop-mini-btn";
            del.textContent = "✕";
            del.onclick = () => { d.items = d.items.filter(i => i.id !== item.id); renderItemList(); refreshCardById(card.id); };
            r.appendChild(inp);
            r.appendChild(del);
            listEl.appendChild(r);
          }
        }
        renderItemList();

        const addBtn = document.createElement("button");
        addBtn.className = "wb-prop-add-item-btn";
        addBtn.textContent = "+ Add item";
        addBtn.onclick = () => {
          if (!d.items) d.items = [];
          d.items.push({ id: Date.now(), text: "New item", done: false });
          renderItemList();
          refreshCardById(card.id);
        };
        propsBody.appendChild(addBtn);
        break;
      }
      case "embed": {
        sec("Embed");
        const urlInp = input(d.url, v => d.url = v, "https://...");
        urlInp.onblur = () => refreshCardById(card.id);
        row("URL", urlInp);
        break;
      }
      case "shape": {
        sec("Shape");
        row("Fill",          colorPicker(d.fill,   v => { d.fill   = v; refreshCardById(card.id); }));
        row("Border color",  colorPicker(d.border, v => { d.border = v; refreshCardById(card.id); }));
        row("Border width",  numInput(d.borderWidth ?? 0,  v => { d.borderWidth  = v; refreshCardById(card.id); }, 0, 20));
        row("Corner radius", numInput(d.borderRadius ?? 8, v => { d.borderRadius = v; refreshCardById(card.id); }, 0, 200));
        row("Opacity",       numInput(d.opacity ?? 100,    v => { d.opacity      = v; refreshCardById(card.id); }, 0, 100));
        break;
      }
      case "divider": {
        sec("Divider");
        row("Color",     colorPicker(d.color, v => { d.color = v; refreshCardById(card.id); }));
        row("Thickness", numInput(d.thickness ?? 2, v => { d.thickness = v; refreshCardById(card.id); }, 1, 20));
        row("Style",     selectEl([["solid","Solid"],["dashed","Dashed"],["dotted","Dotted"],["double","Double"]], d.style || "solid", v => { d.style = v; refreshCardById(card.id); }));
        row("Label",     input(d.label, v => { d.label = v; refreshCardById(card.id); }, "Optional label"));
        break;
      }
      case "timer": {
        sec("Timer");
        row("Minutes", numInput(d.minutes ?? 5, v => { d.minutes = v; d.remaining = v * 60 + (d.seconds || 0); refreshCardById(card.id); }, 0, 99));
        row("Seconds", numInput(d.seconds ?? 0, v => { d.seconds = v; d.remaining = (d.minutes || 0) * 60 + v; refreshCardById(card.id); }, 0, 59));
        break;
      }
    }
  }

  // ── Pan ───────────────────────────────────────────────────────────────────
  let panning = false, panOrigin = null;

  function onViewportDown(e) {
    if (e.button !== 0) return;
    if (e.target !== viewport && e.target !== canvas) return;
    deselect();
    panning = true;
    panOrigin = { x: e.clientX - tabData.panX, y: e.clientY - tabData.panY };
    viewport.style.cursor = "grabbing";
  }
  function onDocMove(e) {
    if (!panning) return;
    tabData.panX = e.clientX - panOrigin.x;
    tabData.panY = e.clientY - panOrigin.y;
    applyTransform();
  }
  function onDocUp() {
    if (panning) { panning = false; viewport.style.cursor = ""; }
  }
  function onWheel(e) {
    e.preventDefault();
    zoom(e.deltaY > 0 ? 0.9 : 1.1);
  }

  viewport.addEventListener("mousedown", onViewportDown);
  document.addEventListener("mousemove", onDocMove);
  document.addEventListener("mouseup", onDocUp);
  viewport.addEventListener("wheel", onWheel, { passive: false });
  cleanups.push(
    () => viewport.removeEventListener("mousedown", onViewportDown),
    () => document.removeEventListener("mousemove", onDocMove),
    () => document.removeEventListener("mouseup", onDocUp),
    () => viewport.removeEventListener("wheel", onWheel),
  );

  // ── Keyboard ──────────────────────────────────────────────────────────────
  function onKeydown(e) {
    if (e.key === "Escape") {
      if (editingId != null) commitEditing(editingId);
      else deselect();
      return;
    }
    if ((e.key === "Delete" || e.key === "Backspace") && selectedId != null && editingId == null) {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const id = selectedId;
      deselect();
      tabData.cards = tabData.cards.filter(c => c.id !== id);
      canvas.querySelector(`[data-id="${id}"]`)?.remove();
    }
  }
  document.addEventListener("keydown", onKeydown);
  cleanups.push(() => document.removeEventListener("keydown", onKeydown));

  // ── Paste images ──────────────────────────────────────────────────────────
  function onPaste(e) {
    if (editingId != null) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        const reader = new FileReader();
        reader.onload = ev => {
          const w = 300, h = 220;
          const vw = viewport.clientWidth, vh = viewport.clientHeight;
          const x = (vw / 2 - tabData.panX) / tabData.zoom - w / 2;
          const y = (vh / 2 - tabData.panY) / tabData.zoom - h / 2;
          const card = { id: tabData.nextId++, type: "image", x, y, w, h, data: { src: ev.target.result, alt: "", borderRadius: 6, opacity: 100, link: "" } };
          tabData.cards.push(card);
          mountCard(card);
          selectCard(card.id);
        };
        reader.readAsDataURL(file);
        e.preventDefault();
        break;
      }
    }
  }
  document.addEventListener("paste", onPaste);
  cleanups.push(() => document.removeEventListener("paste", onPaste));

  // ── Canvas delegated events ───────────────────────────────────────────────
  canvas.addEventListener("change", (e) => {
    const cb = e.target.closest(".wb-check");
    if (cb) {
      const cardEl = cb.closest(".wb-card");
      const card = getCard(Number(cardEl?.dataset.id));
      if (!card) return;
      const item = card.data.items?.find(i => i.id === Number(cb.dataset.itemId));
      if (item) { item.done = cb.checked; refreshCardById(card.id); }
    }
    const imgInp = e.target.closest(".wb-image-input");
    if (imgInp) {
      const file = imgInp.files[0];
      if (!file) return;
      const cardEl = imgInp.closest(".wb-card");
      const card = getCard(Number(cardEl?.dataset.id));
      if (!card) return;
      const reader = new FileReader();
      reader.onload = ev => { card.data.src = ev.target.result; refreshCardById(card.id); if (selectedId === card.id) buildProps(card); };
      reader.readAsDataURL(file);
    }
  });

  canvas.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-timer-action]");
    if (!btn) return;
    const cardEl = btn.closest(".wb-card");
    const card = getCard(Number(cardEl?.dataset.id));
    if (!card || card.type !== "timer") return;
    const action = btn.dataset.timerAction;

    if (action === "toggle") {
      if (card.data.running) {
        clearInterval(timers.get(card.id));
        timers.delete(card.id);
        card.data.running = false;
      } else {
        card.data.running = true;
        const iv = setInterval(() => {
          if (card.data.remaining <= 0) {
            clearInterval(iv); timers.delete(card.id); card.data.running = false;
            refreshCardById(card.id);
            return;
          }
          card.data.remaining--;
          const disp = canvas.querySelector(`[data-id="${card.id}"] .wb-timer-display`);
          if (disp) {
            const m = String(Math.floor(card.data.remaining / 60)).padStart(2, "0");
            const s = String(card.data.remaining % 60).padStart(2, "0");
            disp.textContent = `${m}:${s}`;
          }
        }, 1000);
        timers.set(card.id, iv);
      }
      refreshCardById(card.id);
    } else if (action === "reset") {
      clearInterval(timers.get(card.id));
      timers.delete(card.id);
      card.data.running = false;
      card.data.remaining = (card.data.minutes || 5) * 60 + (card.data.seconds || 0);
      refreshCardById(card.id);
    }
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  function css(obj) {
    return Object.entries(obj).filter(([, v]) => v != null && v !== "" && v !== false).map(([k, v]) => `${k}:${v}`).join(";");
  }
  function escHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
  }
  function escAttr(s) { return escHtml(s); }
  function youtubeId(url) {
    const m = String(url).match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return m ? m[1] : null;
  }

  // ── Destroy ───────────────────────────────────────────────────────────────
  return {
    destroy() {
      for (const iv of timers.values()) clearInterval(iv);
      timers.clear();
      for (const fn of cleanups) fn();
      canvasContainer.innerHTML = "";
      sidePanel.innerHTML = "";
    },
  };
}
