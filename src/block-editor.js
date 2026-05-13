// SkStudio Block Editor
import { CATEGORIES, BLOCKS } from './block-definitions.js';

// ─── Constants ────────────────────────────────────────────────
const BLOCK_H    = 44;   // px: regular block height (no inputs)
const INPUT_H    = 22;   // px: extra height per input row
const C_PAD      = 8;    // px: inner area top/bottom padding
const INNER_MIN  = 44;   // px: minimum inner drop zone height
const C_FOOT_H   = 18;   // px: C-block closing footer height
const ELSE_HEAD_H = 26;  // px: "else" label height
const INDENT_W   = 28;   // px: inner block left indent
const SNAP_DIST  = 40;   // px: snap distance

// ─── State ────────────────────────────────────────────────────
let blocks = {};     // id → BlockData
let nextId  = 1;
let canvasEl, viewportEl, paletteEl, trashOverlay;
let viewX = 40, viewY = 40, viewZoom = 1;
let dragState = null;    // { type: 'palette'|'canvas', defId?, blockId?, ghostEl, offsetX, offsetY, snapTarget }
let isPanning  = false;
let panStart   = null;
let onChangeCb = null;
let _ghost     = null;
let _snapIndicator = null;

// ─── Public API ───────────────────────────────────────────────
export function initBlockEditor(container, palette, initialCode, onChange) {
  onChangeCb = onChange;

  // Viewport + canvas
  container.innerHTML = '';
  container.className = 'be-wrap';

  viewportEl = document.createElement('div');
  viewportEl.className = 'be-viewport';
  container.appendChild(viewportEl);

  canvasEl = document.createElement('div');
  canvasEl.className = 'be-canvas';
  viewportEl.appendChild(canvasEl);

  // Snap indicator (shared)
  _snapIndicator = document.createElement('div');
  _snapIndicator.className = 'be-snap-indicator';
  canvasEl.appendChild(_snapIndicator);

  // Pan / zoom
  viewportEl.addEventListener('wheel', onWheel, { passive: false });
  viewportEl.addEventListener('mousedown', onViewportMousedown);

  // Build palette
  buildPalette(palette);

  // Init empty
  blocks = {};
  nextId  = 1;
  updateTransform();
  renderAll();

  return { destroy };
}

function destroy() {
  blocks = {};
  if (canvasEl) canvasEl.innerHTML = '';
  if (dragState?.ghostEl) dragState.ghostEl.remove();
  dragState = null;
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup',   onMouseUp);
}

// ─── Palette ──────────────────────────────────────────────────
function buildPalette(el) {
  paletteEl = el;
  el.innerHTML = '';
  el.className = 'be-palette';

  // Search bar
  const searchWrap = document.createElement('div');
  searchWrap.className = 'be-pal-search';
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search blocks…';
  searchInput.className = 'be-pal-search-input';
  searchWrap.appendChild(searchInput);
  el.appendChild(searchWrap);

  // Category tabs
  const catRow = document.createElement('div');
  catRow.className = 'be-pal-cats';
  el.appendChild(catRow);

  // Block list
  const blockList = document.createElement('div');
  blockList.className = 'be-pal-list';
  el.appendChild(blockList);

  // Trash zone (shown when dragging canvas block back to palette)
  trashOverlay = document.createElement('div');
  trashOverlay.className = 'be-trash-overlay';
  trashOverlay.innerHTML = `
    <div class="be-trash-icon">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
      </svg>
      <span>Drop to delete</span>
    </div>`;
  el.appendChild(trashOverlay);

  let activeCat = 'events';

  function render() {
    const q = searchInput.value.toLowerCase().trim();
    blockList.innerHTML = '';
    const filtered = BLOCKS.filter(b =>
      (b.category === activeCat || q) &&
      (!q || b.label.toLowerCase().includes(q))
    );
    if (!filtered.length) {
      blockList.innerHTML = '<div class="be-pal-empty">No blocks found</div>';
      return;
    }
    filtered.forEach(def => {
      const item = document.createElement('div');
      item.className = `be-pal-block be-cat-${def.category}`;
      item.dataset.defId = def.id;
      // Build label parts
      const labelParts = buildLabelParts(def, null);
      item.innerHTML = `<span class="be-block-label-text">${labelParts}</span>`;
      item.addEventListener('mousedown', e => startPaletteDrag(e, def));
      blockList.appendChild(item);
    });
  }

  CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = `be-pal-cat-btn${cat.id === activeCat ? ' active' : ''}`;
    btn.dataset.cat = cat.id;
    btn.title = cat.label;
    btn.style.setProperty('--cc', cat.color);
    btn.innerHTML = `<span>${cat.icon}</span>`;
    btn.addEventListener('click', () => {
      catRow.querySelectorAll('.be-pal-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCat = cat.id;
      searchInput.value = '';
      render();
    });
    catRow.appendChild(btn);
  });

  searchInput.addEventListener('input', render);
  render();
}

// ─── Block helpers ────────────────────────────────────────────
function makeId() { return `b${nextId++}`; }

function getDef(defId) { return BLOCKS.find(b => b.id === defId); }

function getCategory(catId) { return CATEGORIES.find(c => c.id === catId); }

function createBlock(defId, x = 100, y = 100) {
  const def = getDef(defId);
  if (!def) return null;
  const id = makeId();
  const inputs = {};
  def.inputs.forEach(inp => { inputs[inp.id] = inp.default ?? ''; });
  blocks[id] = { id, defId, x, y, inputs, next: null, inner: null, innerElse: null, parent: null, parentSlot: null };
  return id;
}

function detachBlock(id) {
  const b = blocks[id];
  if (!b.parent) return;
  const parent = blocks[b.parent];
  if (parent.next === id)      parent.next      = null;
  if (parent.inner === id)     parent.inner     = null;
  if (parent.innerElse === id) parent.innerElse = null;
  b.parent     = null;
  b.parentSlot = null;
}

function attachBlock(id, parentId, slot) {
  const b      = blocks[id];
  const parent = blocks[parentId];
  if (!b || !parent) return;
  // Detach any existing block in that slot
  const existing = parent[slot];
  if (existing && blocks[existing]) {
    // Append existing to end of chain of the new block
    appendToEnd(id, existing);
  }
  parent[slot] = id;
  b.parent     = parentId;
  b.parentSlot = slot;
}

function appendToEnd(rootId, appendId) {
  let id = rootId;
  while (blocks[id]?.next) id = blocks[id].next;
  blocks[id].next      = appendId;
  blocks[appendId].parent     = id;
  blocks[appendId].parentSlot = 'next';
}

function getRootId(id) {
  let b = blocks[id];
  while (b?.parent) b = blocks[b.parent];
  return b?.id;
}

function deleteTree(id) {
  if (!id || !blocks[id]) return;
  const b = blocks[id];
  deleteTree(b.next);
  deleteTree(b.inner);
  deleteTree(b.innerElse);
  delete blocks[id];
}

function deleteBlockAndChildren(id) {
  detachBlock(id);
  deleteTree(id);
}

// ─── Rendering ────────────────────────────────────────────────
function renderAll() {
  // Remove old trees (keep snap indicator)
  Array.from(canvasEl.querySelectorAll('.be-tree')).forEach(el => el.remove());

  // Find roots
  Object.values(blocks).filter(b => !b.parent).forEach(b => {
    const tree = renderTree(b.id);
    canvasEl.appendChild(tree);
  });
}

function renderTree(rootId) {
  const b = blocks[rootId];
  const tree = document.createElement('div');
  tree.className = 'be-tree';
  tree.style.left = `${b.x}px`;
  tree.style.top  = `${b.y}px`;
  tree.dataset.root = rootId;
  renderSeq(rootId, tree);
  return tree;
}

function renderSeq(headId, container) {
  let id = headId;
  while (id && blocks[id]) {
    const wrap = renderBlockWrap(id);
    container.appendChild(wrap);
    id = blocks[id].next;
  }
}

function renderBlockWrap(id) {
  const b   = blocks[id];
  const def = getDef(b.defId);
  if (!def) return document.createElement('div');

  const wrap = document.createElement('div');
  wrap.className = 'be-block-wrap';
  wrap.dataset.id = id;

  // The visual block
  const blockEl = document.createElement('div');
  const isCBlock = def.type === 'c-block' || def.type === 'c-block-else';
  blockEl.className = [
    'be-block',
    `be-block-${def.type}`,
    `be-cat-${def.category}`,
    isCBlock ? 'be-block-c' : '',
  ].filter(Boolean).join(' ');
  blockEl.dataset.id = id;

  // Top notch slot (all except hat)
  if (def.type !== 'hat') {
    const notch = document.createElement('div');
    notch.className = 'be-notch';
    blockEl.appendChild(notch);
  }

  // Block body
  const body = document.createElement('div');
  body.className = 'be-block-body';

  const cat = getCategory(def.category);
  body.innerHTML = `<span class="be-block-cat-icon">${cat?.icon || ''}</span>`;

  // Label + inputs inline
  const labelEl = document.createElement('span');
  labelEl.className = 'be-block-label-text';
  labelEl.innerHTML = buildLabelParts(def, b);
  body.appendChild(labelEl);

  blockEl.appendChild(body);

  // Bottom nub (all except statement-end)
  if (def.type !== 'statement-end') {
    const nub = document.createElement('div');
    nub.className = 'be-nub';
    blockEl.appendChild(nub);
  }

  wrap.appendChild(blockEl);

  // C-block inner section
  if (isCBlock) {
    const cInner = document.createElement('div');
    cInner.className = 'be-c-inner';

    const indent = document.createElement('div');
    indent.className = 'be-c-indent';
    indent.dataset.parentId = id;
    indent.dataset.slot = 'inner';

    if (b.inner) {
      renderSeq(b.inner, indent);
    } else {
      indent.appendChild(makeDropHint());
    }
    cInner.appendChild(indent);

    // Else section
    if (def.type === 'c-block-else') {
      const elseHead = document.createElement('div');
      elseHead.className = `be-else-head be-cat-${def.category}`;
      elseHead.textContent = 'else';
      cInner.appendChild(elseHead);

      const elseIndent = document.createElement('div');
      elseIndent.className = 'be-c-indent';
      elseIndent.dataset.parentId = id;
      elseIndent.dataset.slot = 'innerElse';

      if (b.innerElse) {
        renderSeq(b.innerElse, elseIndent);
      } else {
        elseIndent.appendChild(makeDropHint());
      }
      cInner.appendChild(elseIndent);
    }

    // Footer
    const foot = document.createElement('div');
    foot.className = `be-c-foot be-cat-${def.category}`;
    const footNub = document.createElement('div');
    footNub.className = 'be-nub';
    foot.appendChild(footNub);
    cInner.appendChild(foot);

    wrap.appendChild(cInner);
  }

  // Drag on the block body
  blockEl.addEventListener('mousedown', e => {
    if (e.target.closest('input, select')) return;
    e.stopPropagation();
    startCanvasDrag(e, id);
  });

  // Input change handlers
  blockEl.querySelectorAll('input[data-input], select[data-input]').forEach(inp => {
    inp.addEventListener('change', () => {
      b.inputs[inp.dataset.input] = inp.value;
      emitCode();
    });
    inp.addEventListener('input', () => {
      b.inputs[inp.dataset.input] = inp.value;
      emitCode();
    });
  });

  return wrap;
}

function makeDropHint() {
  const hint = document.createElement('div');
  hint.className = 'be-drop-hint';
  hint.textContent = 'Drop blocks here';
  return hint;
}

function buildLabelParts(def, blockInstance) {
  // Split label on input tokens to inject inline inputs
  // Label can reference inputs by [inputId] notation,
  // but since we don't have that, just show label + inputs below
  let html = `<span class="be-label-word">${escHtml(def.label)}</span>`;
  if (blockInstance && def.inputs.length) {
    html += def.inputs.map(inp => {
      const val = blockInstance.inputs[inp.id] ?? inp.default ?? '';
      if (inp.type === 'select') {
        const opts = inp.options.map(o =>
          `<option value="${escHtml(o)}"${o === val ? ' selected' : ''}>${escHtml(o)}</option>`
        ).join('');
        return `<select class="be-input be-input-select" data-input="${inp.id}" title="${inp.label}">${opts}</select>`;
      }
      const inputType = inp.type === 'number' ? 'number' : 'text';
      const w = inp.type === 'number' ? 52 : inp.type === 'variable' ? 90 : 110;
      return `<input class="be-input be-input-${inp.type}" type="${inputType}" data-input="${inp.id}" value="${escHtml(String(val))}" placeholder="${escHtml(inp.label)}" style="width:${w}px" title="${inp.label}"/>`;
    }).join('');
  }
  return html;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Code Generation ──────────────────────────────────────────
export function generateCode() {
  const roots = Object.values(blocks).filter(b => !b.parent);
  if (!roots.length) return '';

  // Sort roots: top to bottom, left to right
  roots.sort((a, b) => a.y !== b.y ? a.y - b.y : a.x - b.x);

  const lines = [];
  roots.forEach((root, i) => {
    if (i > 0) lines.push('');
    const def = getDef(root.defId);
    lines.push(`# ── Block tree: ${def?.label || root.defId} ──`);
    genSeq(root.id, 0, lines);
  });

  return lines.join('\n');
}

function genSeq(headId, indent, lines) {
  let id = headId;
  while (id && blocks[id]) {
    genBlock(id, indent, lines);
    id = blocks[id].next;
  }
}

function genBlock(id, indent, lines) {
  const b   = blocks[id];
  const def = getDef(b.defId);
  if (!def) return;

  const pad  = '    '.repeat(indent);
  const code = def.generate(b.inputs);
  const isCBlock = def.type === 'c-block' || def.type === 'c-block-else';

  lines.push(pad + code);

  if (isCBlock) {
    if (b.inner) {
      genSeq(b.inner, indent + 1, lines);
    } else {
      lines.push(pad + '    pass');
    }

    if (def.type === 'c-block-else') {
      lines.push(pad + 'else:');
      if (b.innerElse) {
        genSeq(b.innerElse, indent + 1, lines);
      } else {
        lines.push(pad + '    pass');
      }
    }
  }
}

function emitCode() {
  if (onChangeCb) onChangeCb(generateCode());
}

// ─── Drag from Palette ────────────────────────────────────────
function startPaletteDrag(e, def) {
  e.preventDefault();

  const ghost = createGhost(def.label, def.category);
  document.body.appendChild(ghost);
  ghost.style.left = `${e.clientX - 60}px`;
  ghost.style.top  = `${e.clientY - 14}px`;

  dragState = {
    type:    'palette',
    defId:   def.id,
    ghostEl: ghost,
    offsetX: 60,
    offsetY: 14,
    snapTarget: null,
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup',   onMouseUp);
}

// ─── Drag existing canvas block ───────────────────────────────
function startCanvasDrag(e, blockId) {
  e.preventDefault();

  const b   = blocks[blockId];
  const def = getDef(b.defId);

  // Get block element position for offset
  const blockEl = canvasEl.querySelector(`.be-block[data-id="${blockId}"]`);
  const rect     = blockEl?.getBoundingClientRect();
  const offsetX  = rect ? e.clientX - rect.left : 0;
  const offsetY  = rect ? e.clientY - rect.top  : 0;

  // Detach
  const hadParent = !!b.parent;
  detachBlock(blockId);
  if (hadParent) renderAll();

  // Compute canvas position for the block
  const vpRect = viewportEl.getBoundingClientRect();
  const cx = (e.clientX - vpRect.left - viewX - offsetX) / viewZoom;
  const cy = (e.clientY - vpRect.top  - viewY - offsetY) / viewZoom;
  b.x = cx;
  b.y = cy;
  renderAll();

  // Create ghost
  const ghost = createGhost(def.label, def.category);
  document.body.appendChild(ghost);
  ghost.style.left = `${e.clientX - offsetX}px`;
  ghost.style.top  = `${e.clientY - offsetY}px`;

  dragState = {
    type:     'canvas',
    blockId,
    ghostEl:  ghost,
    offsetX,
    offsetY,
    snapTarget: null,
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup',   onMouseUp);
}

function createGhost(label, category) {
  const g = document.createElement('div');
  g.className = `be-drag-ghost be-cat-${category}`;
  g.textContent = label;
  return g;
}

// ─── Mouse Events ─────────────────────────────────────────────
function onMouseMove(e) {
  if (!dragState) return;

  const { ghostEl, offsetX, offsetY } = dragState;
  ghostEl.style.left = `${e.clientX - offsetX}px`;
  ghostEl.style.top  = `${e.clientY - offsetY}px`;

  // Check if over palette (trash zone)
  const palRect = paletteEl?.getBoundingClientRect();
  const overPalette = palRect &&
    e.clientX >= palRect.left && e.clientX <= palRect.right &&
    e.clientY >= palRect.top  && e.clientY <= palRect.bottom;

  if (overPalette) {
    trashOverlay.classList.add('active');
    paletteEl.classList.add('be-trash-active');
    hideSnapIndicator();
    dragState.snapTarget = null;
    return;
  } else {
    trashOverlay.classList.remove('active');
    paletteEl.classList.remove('be-trash-active');
  }

  // Find snap target
  const snap = findSnapTarget(e.clientX - offsetX, e.clientY - offsetY);
  dragState.snapTarget = snap;

  if (snap) {
    showSnapIndicator(snap);
  } else {
    hideSnapIndicator();
  }
}

function onMouseUp(e) {
  if (!dragState) return;
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup',   onMouseUp);

  const { ghostEl, offsetX, offsetY, snapTarget, type } = dragState;

  // Check if over palette / trash
  const palRect = paletteEl?.getBoundingClientRect();
  const overPalette = palRect &&
    e.clientX >= palRect.left && e.clientX <= palRect.right &&
    e.clientY >= palRect.top  && e.clientY <= palRect.bottom;

  trashOverlay.classList.remove('active');
  paletteEl.classList.remove('be-trash-active');
  ghostEl.remove();

  if (overPalette && type === 'canvas') {
    // Delete the block
    deleteBlockAndChildren(dragState.blockId);
    hideSnapIndicator();
    dragState = null;
    renderAll();
    emitCode();
    return;
  }

  if (overPalette && type === 'palette') {
    // Dragged from palette to palette — do nothing
    hideSnapIndicator();
    dragState = null;
    return;
  }

  // Compute drop position on canvas
  const vpRect  = viewportEl.getBoundingClientRect();
  const dropX   = (e.clientX - offsetX - vpRect.left - viewX) / viewZoom;
  const dropY   = (e.clientY - offsetY - vpRect.top  - viewY) / viewZoom;

  let droppedId;
  if (type === 'palette') {
    droppedId = createBlock(dragState.defId, dropX, dropY);
  } else {
    droppedId = dragState.blockId;
    blocks[droppedId].x = dropX;
    blocks[droppedId].y = dropY;
  }

  if (droppedId && snapTarget) {
    attachBlock(droppedId, snapTarget.parentId, snapTarget.slot);
    // Clean up: adjust root position
    const root = blocks[getRootId(droppedId)];
    // nothing needed, position comes from root
  }

  hideSnapIndicator();
  dragState = null;
  renderAll();
  emitCode();
}

// ─── Snap Detection ───────────────────────────────────────────
function findSnapTarget(ghostScreenX, ghostScreenY) {
  const ghostMidX = ghostScreenX + 60;
  const ghostTopY = ghostScreenY;

  let best = null;
  let bestDist = SNAP_DIST;

  // Check all block elements
  canvasEl.querySelectorAll('.be-block[data-id]').forEach(el => {
    const id  = el.dataset.id;
    const b   = blocks[id];
    const def = getDef(b?.defId);
    if (!def || def.type === 'statement-end') return;

    // Check "next" slot (bottom of block)
    const rect = el.getBoundingClientRect();
    const nubX = rect.left + 20;
    const nubY = rect.bottom;

    const dx   = ghostMidX - (nubX + 12);
    const dy   = ghostTopY - nubY;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist < bestDist && !blocks[id]?.next) {
      bestDist = dist;
      best = { parentId: id, slot: 'next', x: nubX, y: nubY };
    }
  });

  // Check c-block inner/innerElse drop zones
  canvasEl.querySelectorAll('.be-c-indent[data-parent-id]').forEach(el => {
    const parentId = el.dataset.parentId;
    const slot     = el.dataset.slot;
    const b        = blocks[parentId];
    if (!b || b[slot]) return; // already has children

    const rect = el.getBoundingClientRect();
    const cx   = rect.left + rect.width / 2;
    const cy   = rect.top  + 10;

    const dx   = ghostMidX - cx;
    const dy   = ghostTopY - cy;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist < bestDist) {
      bestDist = dist;
      best = { parentId, slot, x: rect.left + 4, y: rect.top + 4 };
    }
  });

  return best;
}

function showSnapIndicator(snap) {
  _snapIndicator.style.display = 'block';
  // Convert screen coords to canvas coords
  const vpRect = viewportEl.getBoundingClientRect();
  const cx = (snap.x - vpRect.left - viewX) / viewZoom;
  const cy = (snap.y - vpRect.top  - viewY) / viewZoom;
  _snapIndicator.style.left = `${cx}px`;
  _snapIndicator.style.top  = `${cy}px`;
}

function hideSnapIndicator() {
  if (_snapIndicator) _snapIndicator.style.display = 'none';
}

// ─── Pan ──────────────────────────────────────────────────────
function onViewportMousedown(e) {
  if (e.target !== viewportEl && e.target !== canvasEl) return;
  if (e.button !== 0 && e.button !== 1) return;
  e.preventDefault();
  isPanning = true;
  panStart  = { x: e.clientX - viewX, y: e.clientY - viewY };
  const onMove = ev => {
    if (!isPanning) return;
    viewX = ev.clientX - panStart.x;
    viewY = ev.clientY - panStart.y;
    updateTransform();
  };
  const onUp = () => {
    isPanning = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup',   onUp);
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup',   onUp);
}

function onWheel(e) {
  e.preventDefault();
  const delta   = e.deltaY > 0 ? 0.9 : 1.1;
  const newZoom = Math.min(2, Math.max(0.3, viewZoom * delta));
  const vpRect  = viewportEl.getBoundingClientRect();
  const mx      = e.clientX - vpRect.left;
  const my      = e.clientY - vpRect.top;
  viewX = mx - (mx - viewX) * (newZoom / viewZoom);
  viewY = my - (my - viewY) * (newZoom / viewZoom);
  viewZoom = newZoom;
  updateTransform();
}

function updateTransform() {
  canvasEl.style.transform = `translate(${viewX}px, ${viewY}px) scale(${viewZoom})`;
}
