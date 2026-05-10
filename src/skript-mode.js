// Minimal Skript syntax highlighting via StreamLanguage
import { StreamLanguage } from "@codemirror/language";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

const KEYWORDS = new Set([
  "if", "else", "else if", "loop", "while", "stop", "exit", "return",
  "function", "command", "trigger", "on", "every",
  "set", "add", "remove", "delete", "clear", "give", "take",
  "true", "false", "and", "or", "not", "is", "isn't", "contains",
  "broadcast", "send", "message", "execute", "run", "wait",
  "make", "spawn", "kill", "teleport", "heal", "damage",
  "options", "variables", "import", "using",
  "permission", "aliases", "description", "usage", "executable by",
]);

const EVENTS = new Set([
  "join", "quit", "leave", "death", "respawn", "click", "right click", "left click",
  "break", "place", "drop", "pickup", "chat", "command", "damage", "interact",
  "load", "unload", "enable", "disable", "tick",
]);

const TYPES = new Set([
  "player", "entity", "block", "item", "world", "location", "vector",
  "number", "integer", "string", "text", "boolean", "list",
  "inventory", "slot", "chunk", "biome",
]);

export const skriptLanguage = StreamLanguage.define({
  name: "skript",

  startState: () => ({ inString: false, stringChar: null }),

  token(stream, state) {
    // String continuation
    if (state.inString) {
      while (!stream.eol()) {
        const ch = stream.next();
        if (ch === state.stringChar) {
          state.inString = false;
          state.stringChar = null;
          return "string";
        }
      }
      return "string";
    }

    // Comments
    if (stream.match("#")) {
      stream.skipToEnd();
      return "comment";
    }

    // Strings
    if (stream.match('"') || stream.match("'")) {
      state.inString = true;
      state.stringChar = stream.string[stream.pos - 1];
      while (!stream.eol()) {
        const ch = stream.next();
        if (ch === state.stringChar) {
          state.inString = false;
          state.stringChar = null;
          return "string";
        }
      }
      return "string";
    }

    // Numbers
    if (stream.match(/^-?\d+(\.\d+)?/)) return "number";

    // Variables: {var}, {_local}, {@const}
    if (stream.match(/^\{[^}]*\}/)) return "variableName";

    // Placeholders %expr%
    if (stream.match(/^%[^%]*%/)) return "meta";

    // Operators
    if (stream.match(/^(==|!=|<=|>=|->|=>|[+\-*/=<>])/)) return "operator";

    // Words
    const word = stream.match(/^[A-Za-z_][\w-]*/);
    if (word) {
      const w = word[0].toLowerCase();
      if (KEYWORDS.has(w)) return "keyword";
      if (EVENTS.has(w)) return "atom";
      if (TYPES.has(w)) return "typeName";
      // "on <event>" pattern → make event-ish words a heading at line start
      if (stream.sol && stream.string.trimStart().startsWith("on ")) return "atom";
      return "variableName";
    }

    stream.next();
    return null;
  },
});

export const skriptHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: "#c586c0", fontWeight: "600" },
  { tag: t.atom, color: "#4ec9b0" },
  { tag: t.string, color: "#ce9178" },
  { tag: t.number, color: "#b5cea8" },
  { tag: t.comment, color: "#6a9955", fontStyle: "italic" },
  { tag: t.variableName, color: "#9cdcfe" },
  { tag: t.typeName, color: "#4ec9b0" },
  { tag: t.meta, color: "#dcdcaa" },
  { tag: t.operator, color: "#d4d4d4" },
]);

export function skript() {
  return [skriptLanguage, syntaxHighlighting(skriptHighlightStyle)];
}
