// Smart completion source for CodeMirror 6
import { EVENTS, EFFECTS, CONDITIONS, EXPRESSIONS, TYPES, SNIPPETS, SMART_HINTS } from "./data.js";

/**
 * Expand a template with $0 (cursor) and ${n:default} placeholders into
 * plain text + cursor offset. Strips all snippet markup so nothing leaks
 * into the editor.
 */
export function expandTemplate(template) {
  let out = "";
  let cursor = -1;
  let i = 0;
  while (i < template.length) {
    if (template[i] === "$") {
      // ${n:default}
      const m = template.slice(i).match(/^\$\{(\d+):([^}]*)\}/);
      if (m) {
        if (cursor === -1 && m[1] !== "0") cursor = out.length; // cursor at first placeholder
        out += m[2];
        i += m[0].length;
        continue;
      }
      // $0 — final cursor position
      if (template[i + 1] === "0") {
        cursor = out.length;
        i += 2;
        continue;
      }
      // bare $n — strip it
      const n = template.slice(i).match(/^\$(\d+)/);
      if (n) {
        if (cursor === -1) cursor = out.length;
        i += n[0].length;
        continue;
      }
    }
    out += template[i];
    i++;
  }
  if (cursor === -1) cursor = out.length;
  return { text: out, cursor };
}

/** Build a CodeMirror Completion from a Skript data entry. */
function toCompletion(entry, type) {
  const completion = {
    label: entry.label,
    detail: entry.detail || type,
    info: () => {
      const wrap = document.createElement("div");
      wrap.className = "cm-tooltip-doc";
      wrap.style.cssText = "font-family: var(--font); font-size: 12.5px; max-width: 380px; white-space: pre-wrap; line-height: 1.5;";
      wrap.textContent = entry.doc || "";
      return wrap;
    },
    type,
    boost: entry.smart ? 5 : 0,
  };

  if (entry.snippet) {
    completion.apply = (view, _comp, from, to) => {
      const { text, cursor } = expandTemplate(entry.snippet);
      view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + cursor },
      });
    };
  }

  return completion;
}

const ALL_COMPLETIONS = [
  ...EVENTS.map((e) => toCompletion(e, "keyword")),
  ...EFFECTS.map((e) => toCompletion(e, "function")),
  ...CONDITIONS.map((e) => toCompletion(e, "method")),
  ...EXPRESSIONS.map((e) => toCompletion(e, "variable")),
  ...TYPES.map((t) => ({ label: t, detail: "type", type: "type" })),
  ...SNIPPETS.map((s) => toCompletion(s, "interface")),
];

const EVENTS_ONLY = EVENTS.map((e) => toCompletion(e, "keyword"));
const SCAFFOLD_SNIPPETS = SNIPPETS.map((s) => toCompletion(s, "interface"));

export function skriptCompletions(context) {
  const word = context.matchBefore(/[\w-]+/);
  if (!word && !context.explicit) return null;
  if (word && word.from === word.to && !context.explicit) return null;

  const line = context.state.doc.lineAt(context.pos);
  const lineText = line.text;
  const lineBefore = lineText.slice(0, context.pos - line.from);
  const indent = lineText.match(/^\s*/)[0].length;

  if (indent === 0 && !lineBefore.includes(":")) {
    return {
      from: word ? word.from : context.pos,
      options: [...EVENTS_ONLY, ...SCAFFOLD_SNIPPETS],
      validFor: /^[\w-]*$/,
    };
  }

  return {
    from: word ? word.from : context.pos,
    options: ALL_COMPLETIONS,
    validFor: /^[\w-]*$/,
  };
}

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

/** All Skript labels (for ghost-text matching). */
export const ALL_LABELS = [
  ...EVENTS.map((e) => e.label),
  ...EFFECTS.map((e) => e.label),
  ...CONDITIONS.map((e) => e.label),
  ...EXPRESSIONS.map((e) => e.label),
  ...SNIPPETS.map((e) => e.label),
];
