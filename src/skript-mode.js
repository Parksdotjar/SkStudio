// Minimal Skript syntax highlighting via StreamLanguage
import { StreamLanguage } from "@codemirror/language";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { DEFAULT_COLORS } from "./settings-presets.js";

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

    if (stream.match("#")) {
      stream.skipToEnd();
      return "comment";
    }

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

    if (stream.match(/^-?\d+(\.\d+)?/)) return "number";
    if (stream.match(/^\{[^}]*\}/)) return "variableName";
    if (stream.match(/^%[^%]*%/)) return "meta";
    if (stream.match(/^(==|!=|<=|>=|->|=>|[+\-*/=<>])/)) return "operator";

    const word = stream.match(/^[A-Za-z_][\w-]*/);
    if (word) {
      const w = word[0].toLowerCase();
      if (KEYWORDS.has(w)) return "keyword";
      if (EVENTS.has(w)) return "atom";
      if (TYPES.has(w)) return "typeName";
      if (stream.sol && stream.string.trimStart().startsWith("on ")) return "atom";
      return "variableName";
    }

    stream.next();
    return null;
  },
});

/** Build a HighlightStyle from a colors object (see settings-presets.js). */
export function buildSkriptHighlight(colors = DEFAULT_COLORS) {
  return HighlightStyle.define([
    { tag: t.keyword, color: colors.keyword, fontWeight: "600" },
    { tag: t.atom, color: colors.atom },
    { tag: t.string, color: colors.string },
    { tag: t.number, color: colors.number },
    { tag: t.comment, color: colors.comment, fontStyle: "italic" },
    { tag: t.variableName, color: colors.variable },
    { tag: t.typeName, color: colors.type },
    { tag: t.meta, color: colors.meta },
    { tag: t.operator, color: colors.operator },
  ]);
}

/** Returns the skript-mode extension bundle for a given color set. */
export function skript(colors = DEFAULT_COLORS) {
  return [skriptLanguage, syntaxHighlighting(buildSkriptHighlight(colors))];
}
