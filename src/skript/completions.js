// Smart completion source for CodeMirror 6 — reads live from completions store
import { TYPES, SMART_HINTS } from "./data.js";
import { getAllCompletions } from "../completions-store.js";

/**
 * Expand a template with $0 (cursor) and ${n:default} placeholders.
 * Returns { text, cursor } with all snippet markup stripped.
 */
export function expandTemplate(template) {
  let out = "";
  let cursor = -1;
  let i = 0;
  while (i < template.length) {
    if (template[i] === "$") {
      const m = template.slice(i).match(/^\$\{(\d+):([^}]*)\}/);
      if (m) {
        if (cursor === -1 && m[1] !== "0") cursor = out.length;
        out += m[2];
        i += m[0].length;
        continue;
      }
      if (template[i + 1] === "0") {
        cursor = out.length;
        i += 2;
        continue;
      }
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

const TYPE_TO_CM = {
  event: "keyword",
  effect: "function",
  condition: "method",
  expression: "variable",
  snippet: "interface",
  custom: "interface",
};

function toCompletion(entry) {
  const cmType = TYPE_TO_CM[entry._type] || "text";
  const completion = {
    label: entry.label,
    detail: entry.detail || entry._type,
    info: () => {
      const wrap = document.createElement("div");
      wrap.className = "cm-tooltip-doc";
      wrap.style.cssText = "font-family: var(--font); font-size: 12.5px; max-width: 380px; white-space: pre-wrap; line-height: 1.5;";
      wrap.textContent = entry.doc || "";
      return wrap;
    },
    type: cmType,
    boost: entry.smart ? 5 : (entry._custom ? 3 : 0),
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

export function skriptCompletions(context) {
  const word = context.matchBefore(/[\w-]+/);
  if (!word && !context.explicit) return null;
  if (word && word.from === word.to && !context.explicit) return null;

  const line = context.state.doc.lineAt(context.pos);
  const lineText = line.text;
  const lineBefore = lineText.slice(0, context.pos - line.from);
  const indent = lineText.match(/^\s*/)[0].length;

  const all = getAllCompletions();

  let entries;
  if (indent === 0 && !lineBefore.includes(":")) {
    // Top-level: events + scaffold snippets
    entries = all.filter((e) => e._type === "event" || e._type === "snippet");
  } else {
    entries = all;
  }

  const options = [
    ...entries.map(toCompletion),
    ...TYPES.map((tName) => ({ label: tName, detail: "type", type: "type" })),
  ];

  return {
    from: word ? word.from : context.pos,
    options,
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

/** All current Skript labels (used by ghost-text matcher). */
export function allLabels() {
  return getAllCompletions().map((e) => e.label);
}
