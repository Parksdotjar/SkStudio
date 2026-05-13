// Snippet choice fields — underlined interchangeable values with Ctrl+click dropdown
import { StateField, StateEffect, RangeSetBuilder } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin } from "@codemirror/view";

export const setChoicesEffect = StateEffect.define();
export const clearChoicesEffect = StateEffect.define();

/**
 * Stores active choice ranges: [{ from, to, options: string[] }]
 * Ranges are mapped through document changes so they stay correct as user types.
 */
export const choicesField = StateField.define({
  create() { return []; },
  update(choices, tr) {
    // Check for explicit set/clear first
    let explicitSet = false;
    let next = choices;
    for (const e of tr.effects) {
      if (e.is(setChoicesEffect)) { next = e.value; explicitSet = true; }
      if (e.is(clearChoicesEffect)) { next = []; explicitSet = true; }
    }
    // Only remap positions for choices carried over from the previous state —
    // positions from setChoicesEffect are already in post-change coordinates.
    if (!explicitSet && tr.docChanged && next.length) {
      next = next
        .map(c => ({
          ...c,
          from: tr.changes.mapPos(c.from, -1),
          to:   tr.changes.mapPos(c.to,   1),
        }))
        .filter(c => c.from < c.to);
    }
    return next;
  },
});

// Build a DecorationSet from the current choice ranges
function buildDecorations(choices) {
  if (!choices || !choices.length) return Decoration.none;
  const sorted = [...choices].sort((a, b) => a.from - b.from);
  const builder = new RangeSetBuilder();
  for (const c of sorted) {
    if (c.from < c.to) builder.add(c.from, c.to, choiceMark);
  }
  return builder.finish();
}

const choiceMark = Decoration.mark({ class: "cm-choice-field" });

// ViewPlugin watches the choicesField and rebuilds decorations when it changes
const choicesDecoPlugin = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.decorations = buildDecorations(view.state.field(choicesField, false));
    }
    update(update) {
      const hadEffect = update.transactions.some(tr =>
        tr.effects.some(e => e.is(setChoicesEffect) || e.is(clearChoicesEffect))
      );
      if (hadEffect || update.docChanged) {
        this.decorations = buildDecorations(update.view.state.field(choicesField, false));
      }
    }
  },
  { decorations: v => v.decorations }
);

/** Ctrl+click on an underlined choice field opens the options dropdown. */
const choiceClickHandler = EditorView.domEventHandlers({
  click(event, view) {
    if (!event.ctrlKey) return false;
    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
    if (pos == null) return false;
    const choices = view.state.field(choicesField, false);
    if (!choices || !choices.length) return false;
    const match = choices.find(c => pos >= c.from && pos <= c.to);
    if (!match) return false;
    event.preventDefault();
    showChoiceDropdown(view, match);
    return true;
  },
});

function showChoiceDropdown(view, choice) {
  document.querySelector(".cm-choice-dropdown")?.remove();

  const coords = view.coordsAtPos(choice.from);
  if (!coords) return;

  const currentText = view.state.doc.sliceString(choice.from, choice.to);

  const drop = document.createElement("div");
  drop.className = "cm-choice-dropdown";
  drop.style.left = coords.left + "px";
  drop.style.top  = (coords.bottom + 4) + "px";

  for (const opt of choice.options) {
    const item = document.createElement("div");
    item.className = "cm-choice-item" + (opt === currentText ? " cm-choice-item-active" : "");
    item.textContent = opt;
    item.addEventListener("mousedown", (e) => {
      e.preventDefault();
      view.dispatch({
        changes: { from: choice.from, to: choice.to, insert: opt },
        selection: { anchor: choice.from + opt.length },
      });
      drop.remove();
      document.removeEventListener("mousedown", closeHandler, true);
    });
    drop.appendChild(item);
  }

  document.body.appendChild(drop);

  const closeHandler = (e) => {
    if (!drop.contains(e.target)) {
      drop.remove();
      document.removeEventListener("mousedown", closeHandler, true);
    }
  };
  setTimeout(() => document.addEventListener("mousedown", closeHandler, true), 0);
}

export const choicesExtension = [choicesField, choicesDecoPlugin, choiceClickHandler];
