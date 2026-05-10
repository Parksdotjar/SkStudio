// Inline ghost-text suggestion (Copilot-style) for SkStudio
// Shows a dim italic preview of the most likely completion past the cursor.
// Tab accepts, any other change/move dismisses.
import { ViewPlugin, Decoration, EditorView, WidgetType } from "@codemirror/view";
import { StateField, StateEffect } from "@codemirror/state";
import { completionStatus } from "@codemirror/autocomplete";
import { ALL_LABELS } from "./skript/completions.js";
import { expandTemplate } from "./skript/completions.js";
import { EVENTS, EFFECTS, CONDITIONS, EXPRESSIONS, SNIPPETS } from "./skript/data.js";

// Map label -> entry, for resolving snippet templates when accepting
const LABEL_TO_ENTRY = new Map();
for (const e of [...EVENTS, ...EFFECTS, ...CONDITIONS, ...EXPRESSIONS, ...SNIPPETS]) {
  if (!LABEL_TO_ENTRY.has(e.label)) LABEL_TO_ENTRY.set(e.label, e);
}

// Sort labels longest first so prefix matches prefer longer suggestions
const SORTED_LABELS = [...ALL_LABELS].sort((a, b) => b.length - a.length);

class GhostWidget extends WidgetType {
  constructor(text) { super(); this.text = text; }
  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-ghost-text";
    span.textContent = this.text;
    return span;
  }
  ignoreEvent() { return true; }
  eq(other) { return other.text === this.text; }
}

const setGhost = StateEffect.define();

const ghostField = StateField.define({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(setGhost)) {
        if (e.value && e.value.ghost) {
          const widget = Decoration.widget({
            widget: new GhostWidget(e.value.ghost),
            side: 1,
          }).range(e.value.pos);
          deco = Decoration.set([widget]);
        } else {
          deco = Decoration.none;
        }
      }
    }
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

function findBestMatch(word, lineBefore) {
  if (!word || word.length < 2) return null;
  const lower = word.toLowerCase();
  const indent = lineBefore.match(/^\s*/)[0].length;

  // At column 0, prefer events. Indented, prefer everything.
  for (const label of SORTED_LABELS) {
    if (!label.toLowerCase().startsWith(lower)) continue;
    if (label.length <= word.length) continue;
    // At top-level only suggest events / scaffolds (start with "on " or are snippets)
    if (indent === 0 && !label.startsWith("on ") && !label.startsWith("every") &&
        !["command", "function", "options"].includes(label)) {
      continue;
    }
    return label;
  }
  return null;
}

const ghostPlugin = ViewPlugin.fromClass(class {
  update(update) {
    if (!update.docChanged && !update.selectionSet) return;
    const view = update.view;

    // Don't show ghost if autocomplete dropdown is showing — too noisy
    if (completionStatus(view.state) === "active") {
      view.dispatch({ effects: setGhost.of(null) });
      return;
    }

    if (view.state.selection.ranges.length > 1) return;
    const cursor = view.state.selection.main.head;
    if (view.state.selection.main.from !== view.state.selection.main.to) {
      view.dispatch({ effects: setGhost.of(null) });
      return;
    }
    const line = view.state.doc.lineAt(cursor);
    const before = line.text.slice(0, cursor - line.from);
    const after = line.text.slice(cursor - line.from);

    // Don't suggest if we're not at end of typing (more text after cursor on same line)
    if (after.length > 0 && /\S/.test(after)) {
      view.dispatch({ effects: setGhost.of(null) });
      return;
    }

    const wordMatch = before.match(/[\w-]+$/);
    if (!wordMatch || wordMatch[0].length < 2) {
      view.dispatch({ effects: setGhost.of(null) });
      return;
    }

    const word = wordMatch[0];
    const match = findBestMatch(word, before);
    if (match) {
      const ghost = match.slice(word.length);
      view.dispatch({ effects: setGhost.of({ ghost, pos: cursor, fullLabel: match, word }) });
    } else {
      view.dispatch({ effects: setGhost.of(null) });
    }
  }
});

/** Get current ghost text info from the view. Returns null if none. */
export function currentGhost(view) {
  const decos = view.state.field(ghostField, false);
  if (!decos || decos.size === 0) return null;
  let ghost = null;
  decos.between(0, view.state.doc.length, (_from, _to, deco) => {
    if (deco.spec.widget instanceof GhostWidget) {
      ghost = { text: deco.spec.widget.text };
    }
  });
  return ghost;
}

/** Accept the current ghost text. Returns true if something was accepted. */
export function acceptGhost(view) {
  const decos = view.state.field(ghostField, false);
  if (!decos || decos.size === 0) return false;
  let ghostText = null;
  let pos = null;
  decos.between(0, view.state.doc.length, (from, _to, deco) => {
    if (deco.spec.widget instanceof GhostWidget) {
      ghostText = deco.spec.widget.text;
      pos = from;
    }
  });
  if (!ghostText) return false;

  // Reconstruct the full label being completed: word_before + ghost
  const line = view.state.doc.lineAt(pos);
  const before = line.text.slice(0, pos - line.from);
  const wordMatch = before.match(/[\w-]+$/);
  const word = wordMatch ? wordMatch[0] : "";
  const fullLabel = word + ghostText;
  const wordStart = pos - word.length;

  // If the matched label is a snippet, expand its template (with proper indent
  // and cursor position). Otherwise just insert the rest of the label.
  const entry = LABEL_TO_ENTRY.get(fullLabel);
  if (entry && entry.snippet) {
    const { text, cursor } = expandTemplate(entry.snippet);
    view.dispatch({
      changes: { from: wordStart, to: pos, insert: text },
      selection: { anchor: wordStart + cursor },
      effects: setGhost.of(null),
    });
  } else {
    view.dispatch({
      changes: { from: pos, insert: ghostText },
      selection: { anchor: pos + ghostText.length },
      effects: setGhost.of(null),
    });
  }
  return true;
}

/** All extensions for ghost-text. Pass to editor as a single value. */
export const ghostTextExtension = [ghostField, ghostPlugin];
