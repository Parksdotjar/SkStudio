// CodeMirror editor wrapper
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { bracketMatching, indentOnInput } from "@codemirror/language";
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { skript } from "./skript-mode.js";
import { skriptCompletions } from "./skript/completions.js";

// Compartments let us reconfigure (font size, theme) without rebuilding the editor
const fontCompartment = new Compartment();
const themeCompartment = new Compartment();

function buildFontTheme(fontSize) {
  return EditorView.theme({
    "&": { height: "100%", fontSize: `${fontSize}px` },
    ".cm-scroller": { overflow: "auto" },
  });
}

export function createEditor(parent, { initialDoc = "", onChange, onCursor, fontSize = 13.5 }) {
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
      }),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
        ...completionKeymap,
        indentWithTab,
      ]),
      skript(),
      updateListener,
      fontCompartment.of(buildFontTheme(fontSize)),
      themeCompartment.of([]),
    ],
  });

  const view = new EditorView({ state, parent });

  // Public API for live reconfig
  view.setFontSize = (px) => {
    view.dispatch({ effects: fontCompartment.reconfigure(buildFontTheme(px)) });
  };

  return view;
}
