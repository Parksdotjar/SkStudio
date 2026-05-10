// Smart completion source for CodeMirror 6
import { snippetCompletion } from "@codemirror/autocomplete";
import { EVENTS, EFFECTS, CONDITIONS, EXPRESSIONS, TYPES, SNIPPETS, SMART_HINTS } from "./data.js";

// Build a completion item from a syntax-database entry
function toCompletion(entry, type) {
  const opts = {
    label: entry.label,
    detail: entry.detail || type,
    info: () => {
      const wrap = document.createElement("div");
      wrap.className = "cm-tooltip-doc";
      wrap.style.cssText = "font-family: var(--font); font-size: 12.5px; max-width: 380px; white-space: pre-wrap; line-height: 1.5;";
      wrap.textContent = entry.doc || "";
      return wrap;
    },
    type: type,
    boost: entry.smart ? 5 : 0,
  };
  if (entry.snippet) {
    return snippetCompletion(entry.snippet, opts);
  }
  return opts;
}

// All completions, pre-built once
const ALL_COMPLETIONS = [
  ...EVENTS.map((e) => toCompletion(e, "keyword")),
  ...EFFECTS.map((e) => toCompletion(e, "function")),
  ...CONDITIONS.map((e) => toCompletion(e, "method")),
  ...EXPRESSIONS.map((e) => toCompletion(e, "variable")),
  ...TYPES.map((t) => ({ label: t, detail: "type", type: "type" })),
  ...SNIPPETS.map((s) => toCompletion(s, "interface")),
];

// Build context-aware lists
const EVENTS_ONLY = EVENTS.map((e) => toCompletion(e, "keyword"));
const SCAFFOLD_SNIPPETS = SNIPPETS.map((s) => toCompletion(s, "interface"));

// Skript completion source
export function skriptCompletions(context) {
  const word = context.matchBefore(/[\w-]+/);
  if (!word && !context.explicit) return null;
  if (word && word.from === word.to && !context.explicit) return null;

  const line = context.state.doc.lineAt(context.pos);
  const lineText = line.text;
  const lineBefore = lineText.slice(0, context.pos - line.from);
  const indent = lineText.match(/^\s*/)[0].length;

  // Context: at start of file (no indent), suggest events + scaffold
  if (indent === 0 && !lineBefore.includes(":")) {
    return {
      from: word ? word.from : context.pos,
      options: [...EVENTS_ONLY, ...SCAFFOLD_SNIPPETS],
      validFor: /^[\w-]*$/,
    };
  }

  // Context: indented (inside a trigger) — suggest effects, conditions, expressions
  return {
    from: word ? word.from : context.pos,
    options: ALL_COMPLETIONS,
    validFor: /^[\w-]*$/,
  };
}

// Linter-like smart hint: scan doc for anti-patterns and surface as diagnostics
// (Returned as a function the editor can call on demand.)
export function findSmartHints(doc) {
  const hints = [];
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    for (const hint of SMART_HINTS) {
      if (hint.pattern.test(line.text)) {
        hints.push({
          from: line.from,
          to: line.to,
          severity: "info",
          message: hint.title + " — " + hint.message,
        });
      }
    }
  }
  return hints;
}
