// CodeMirror editor wrapper
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { bracketMatching, indentOnInput } from "@codemirror/language";
import {
  autocompletion,
  acceptCompletion,
  moveCompletionSelection,
  closeCompletion,
} from "@codemirror/autocomplete";
import { skript } from "./skript-mode.js";
import { skriptCompletions } from "./skript/completions.js";
import { ghostTextExtension, acceptGhost } from "./ghost-text.js";

// Compartments for live reconfig
const fontCompartment = new Compartment();
const completionKeyCompartment = new Compartment();
const ghostCompartment = new Compartment();

function buildFontTheme(fontSize) {
  return EditorView.theme({
    "&": { height: "100%", fontSize: `${fontSize}px` },
    ".cm-scroller": { overflow: "auto" },
  });
}

// Build the autocomplete navigation keymap (without accept binding)
const completionNavKeymap = [
  { key: "ArrowDown", run: moveCompletionSelection(true) },
  { key: "ArrowUp", run: moveCompletionSelection(false) },
  { key: "PageDown", run: moveCompletionSelection(true, "page") },
  { key: "PageUp", run: moveCompletionSelection(false, "page") },
  { key: "Escape", run: closeCompletion },
];

/**
 * Build the keymap for accepting completions / ghost text.
 *
 * acceptKey "enter":
 *   - Enter accepts dropdown completion
 *   - Tab accepts ghost text (or falls through to indent)
 *
 * acceptKey "tab":
 *   - Tab accepts dropdown completion OR ghost text (or falls through to indent)
 *   - Enter inserts a newline (default)
 */
function buildCompletionKeymap(acceptKey) {
  if (acceptKey === "tab") {
    return keymap.of([
      ...completionNavKeymap,
      {
        key: "Tab",
        run: (view) => acceptCompletion(view) || acceptGhost(view),
      },
    ]);
  }
  // Default: Enter accepts dropdown, Tab accepts ghost text
  return keymap.of([
    ...completionNavKeymap,
    { key: "Enter", run: acceptCompletion },
    { key: "Tab", run: (view) => acceptGhost(view) },
  ]);
}

export function createEditor(parent, {
  initialDoc = "",
  onChange,
  onCursor,
  fontSize = 13.5,
  acceptKey = "enter",
  ghostText = true,
}) {
  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged && onChange) onChange(update.state.doc.toString());
    if (update.selectionSet || update.docChanged) {
      if (onCursor) {
        const head = update.state.selection.main.head;
        const line = update.state.doc.lineAt(head);
        onCursor({
          line: line.number,
          col: head - line.from + 1,
          length: update.state.doc.length,
        });
      }
    }
  });

  const state = EditorState.create({
    doc: initialDoc,
    extensions: [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      history(),
      bracketMatching(),
      indentOnInput(),
      highlightSelectionMatches(),
      autocompletion({
        override: [skriptCompletions],
        activateOnTyping: true,
        closeOnBlur: true,
        icons: true,
        defaultKeymap: false, // we manage keymap ourselves
      }),
      completionKeyCompartment.of(buildCompletionKeymap(acceptKey)),
      ghostCompartment.of(ghostText ? ghostTextExtension : []),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
        indentWithTab,
      ]),
      skript(),
      updateListener,
      fontCompartment.of(buildFontTheme(fontSize)),
    ],
  });

  const view = new EditorView({ state, parent });

  // Public API for live reconfig from settings panel
  view.setFontSize = (px) => {
    view.dispatch({ effects: fontCompartment.reconfigure(buildFontTheme(px)) });
  };
  view.setAcceptKey = (key) => {
    view.dispatch({ effects: completionKeyCompartment.reconfigure(buildCompletionKeymap(key)) });
  };
  view.setGhostText = (enabled) => {
    view.dispatch({ effects: ghostCompartment.reconfigure(enabled ? ghostTextExtension : []) });
  };

  return view;
}
