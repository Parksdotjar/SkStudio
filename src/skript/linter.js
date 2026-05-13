/**
 * SkStudio — Skript Live Linter
 *
 * Simulates what Skript's parser checks on /sk reload:
 *   - Indentation consistency & structure
 *   - Unclosed strings, {variables}, %placeholders%
 *   - Effects/conditions outside a trigger
 *   - Empty sections (triggers, if-blocks, loops)
 *   - else/else-if without matching if
 *   - Unknown top-level constructs
 *   - Missing colons on block-opening lines
 *   - {@option} references with no options block
 *   - Duplicate event registrations
 *   - Invalid command structure
 *   - return outside a function
 *   - cancel event outside a cancellable event
 */

import { linter, lintGutter } from "@codemirror/lint";
import { EVENTS } from "./data.js";

// ─── helpers ────────────────────────────────────────────────────────────────

function err(from, to, message)  { return { from, to, message, severity: "error" }; }
function warn(from, to, message) { return { from, to, message, severity: "warning" }; }
function info(from, to, message) { return { from, to, message, severity: "info" }; }

/** Strip inline comment (#) respecting strings */
function stripComment(text) {
  let inStr = false;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '"' && text[i - 1] !== '\\') inStr = !inStr;
    if (!inStr && text[i] === '#') return text.slice(0, i);
  }
  return text;
}

/** Count leading whitespace characters, return { count, char } */
function indentInfo(text) {
  let i = 0;
  while (i < text.length && (text[i] === ' ' || text[i] === '\t')) i++;
  return { count: i, char: i > 0 ? text[0] : null };
}

/** Indent depth using a detected unit (tab = 1, spaces = N) */
function indentLevel(text, unit) {
  const { count, char } = indentInfo(text);
  if (count === 0) return 0;
  if (unit.char === '\t') return count; // each tab = 1 level
  return Math.round(count / unit.size); // spaces: divide by unit size
}

// Known cancellable events (cancel event is only valid here)
const CANCELLABLE = new Set([
  "on join", "on quit", "on disconnect", "on chat", "on command",
  "on damage", "on death", "on break", "on place", "on click",
  "on right click", "on left click", "on inventory click",
  "on item drop", "on item pickup", "on shoot", "on explode",
  "on burn", "on grow", "on block update", "on projectile hit",
]);

// Valid top-level starters (regex tested against trimmed line)
const TOP_LEVEL_RE = [
  /^on\s+/i,
  /^every\s+/i,
  /^command\s+\//i,
  /^function\s+\w/i,
  /^options\s*:/i,
  /^aliases\s*:/i,
  /^variables\s*:/i,
  /^import\s*:/i,
];

// Lines that open a new indented block
const BLOCK_OPEN_RE = [
  /^on\s+.+:/i,
  /^every\s+.+:/i,
  /^command\s+\/.+:/i,
  /^function\s+\w.+:/i,
  /^options\s*:/i,
  /^aliases\s*:/i,
  /^variables\s*:/i,
  /^import\s*:/i,
  /\bif\b.+:$/i,
  /^else(\s+if\b.+)?:$/i,
  /^loop\b.+:$/i,
  /^while\b.+:$/i,
  /^trigger\s*:$/i,
  /^(description|usage|permission|permission message|aliases|executable by|cooldown|cooldown message|cooldown bypass|cooldown storage)\s*:/i,
];

// Keywords that are ONLY valid with a trailing colon — flag bare versions immediately
const MUST_HAVE_COLON = [
  { re: /^trigger$/i,                word: "trigger" },
  { re: /^else$/i,                   word: "else" },
  { re: /^else\s+if\b.*[^:]$/i,     word: "else if" },
  { re: /^if\b.*[^:]$/i,            word: "if" },
  { re: /^loop\b.*[^:]$/i,          word: "loop" },
  { re: /^while\b.*[^:]$/i,         word: "while" },
  { re: /^function\s+\w.*[^:]$/i,   word: "function" },
  { re: /^command\s+\/.*[^:]$/i,    word: "command" },
  { re: /^on\s+\w.*[^:]$/i,         word: "on <event>" },
  { re: /^every\s+\w.*[^:]$/i,      word: "every <interval>" },
  { re: /^description$/i,           word: "description" },
  { re: /^usage$/i,                  word: "usage" },
  { re: /^permission$/i,             word: "permission" },
  { re: /^permission message$/i,     word: "permission message" },
  { re: /^executable by$/i,          word: "executable by" },
  { re: /^cooldown$/i,               word: "cooldown" },
  { re: /^cooldown message$/i,       word: "cooldown message" },
  { re: /^cooldown bypass$/i,        word: "cooldown bypass" },
  { re: /^cooldown storage$/i,       word: "cooldown storage" },
];

// ─── new check constants ────────────────────────────────────────────────────

// Variables that strongly hint at numeric type (by naming convention)
// e.g. {coins.%player%}, {score::*}, {level.%player%}, {kills.%player%}
const NUMERIC_VAR_HINT_RE = /^\{(?:coins?|score|level|kills?|deaths?|points?|money|balance|xp|exp|health|damage|count|amount|number|num|rank|rating|wins?|losses?|streak|time|age|size|length|max|min)[._:%-\w]*\}/i;

// Valid Skript potion effects
const VALID_POTION_EFFECTS = new Set([
  "speed", "slowness", "haste", "mining fatigue", "strength", "instant health",
  "instant damage", "jump boost", "nausea", "regeneration", "resistance",
  "fire resistance", "water breathing", "invisibility", "blindness",
  "night vision", "hunger", "weakness", "poison", "wither", "health boost",
  "absorption", "saturation", "glowing", "levitation", "luck", "bad luck",
  "slow falling", "conduit power", "dolphins grace", "bad omen", "hero of the village",
  "darkness", "trial omen", "raid omen", "wind charged", "weaving", "oozing", "infested",
]);

// Lines that look like effects (placed at top level by accident)
const EFFECT_STARTS = [
  /^send\b/i, /^broadcast\b/i, /^give\b/i, /^take\b/i, /^kill\b/i,
  /^heal\b/i, /^damage\b/i, /^teleport\b/i, /^set\b/i, /^add\b/i,
  /^remove\b/i, /^delete\b/i, /^clear\b/i, /^push\b/i, /^wait\b/i,
  /^stop\b/i, /^exit\b/i, /^return\b/i, /^execute\b/i, /^make\b/i,
  /^spawn\b/i, /^drop\b/i, /^apply\b/i, /^equip\b/i, /^feed\b/i,
  /^cancel event\b/i, /^play sound\b/i, /^spawn particle\b/i,
  /^(if|loop|while)\b/i,
];

function isTopLevel(trimmed) {
  return TOP_LEVEL_RE.some(r => r.test(trimmed));
}
function isBlockOpener(trimmed) {
  return BLOCK_OPEN_RE.some(r => r.test(trimmed));
}
function looksLikeEffect(trimmed) {
  return EFFECT_STARTS.some(r => r.test(trimmed));
}

// ─── main lint function ──────────────────────────────────────────────────────

function skriptLint(view) {
  const doc = view.state.doc;
  const diagnostics = [];

  // ── collect parsed lines ──
  const lines = [];
  for (let n = 1; n <= doc.lines; n++) {
    const line = doc.line(n);
    const raw  = line.text;
    const stripped = stripComment(raw);
    const trimmed  = stripped.trim();
    const isBlank  = trimmed === "";
    const isComment = raw.trim().startsWith("#");
    const { count: indentCount, char: indentChar } = indentInfo(raw);
    lines.push({ line, raw, stripped, trimmed, isBlank, isComment, indentCount, indentChar, n });
  }

  const nonBlank = lines.filter(l => !l.isBlank && !l.isComment);
  if (nonBlank.length === 0) return [];

  // ── detect indent unit ──
  // Find the smallest non-zero indent (that's our unit)
  let unitChar = '\t';
  let unitSize = 1;
  const indentedLines = nonBlank.filter(l => l.indentCount > 0);
  if (indentedLines.length > 0) {
    // Check if tabs or spaces dominate
    const tabLines   = indentedLines.filter(l => l.indentChar === '\t').length;
    const spaceLines = indentedLines.filter(l => l.indentChar === ' ').length;
    unitChar = tabLines >= spaceLines ? '\t' : ' ';
    if (unitChar === ' ') {
      // Find the smallest space indent
      const sizes = indentedLines
        .filter(l => l.indentChar === ' ')
        .map(l => l.indentCount);
      unitSize = sizes.reduce((a, b) => gcd(a, b), sizes[0]) || 4;
    }
  }
  const unit = { char: unitChar, size: unitSize };

  function levelOf(l) {
    if (l.indentCount === 0) return 0;
    if (l.indentChar !== unitChar) return -1; // mixed
    return unitChar === '\t' ? l.indentCount : Math.round(l.indentCount / unitSize);
  }

  // ── pass 1: indentation consistency ──
  for (const l of indentedLines) {
    // Mixed tabs & spaces on same line
    if (l.indentCount > 0 && l.raw.match(/^\t+ | ^ +\t/)) {
      diagnostics.push(err(
        l.line.from, l.line.from + l.indentCount,
        "Mixed tabs and spaces — Skript will reject this file. Use only tabs OR only spaces throughout."
      ));
      continue;
    }
    // Wrong char vs detected unit
    if (l.indentChar !== unitChar) {
      diagnostics.push(err(
        l.line.from, l.line.from + l.indentCount,
        `Inconsistent indentation: this file uses ${unitChar === '\t' ? 'tabs' : 'spaces'} but this line uses ${l.indentChar === '\t' ? 'tabs' : 'spaces'}.`
      ));
    }
  }

  // ── pass 2: collect options block ──
  const definedOptions = new Set();
  {
    let inOpts = false;
    for (const l of nonBlank) {
      if (levelOf(l) === 0 && l.trimmed.toLowerCase() === "options:") { inOpts = true; continue; }
      if (inOpts) {
        if (levelOf(l) === 0) { inOpts = false; continue; }
        const m = l.trimmed.match(/^([\w-]+)\s*:/);
        if (m) definedOptions.add(m[1].toLowerCase());
      }
    }
  }

  // ── pass 3: line-by-line analysis ──

  // Track the event context stack: [{ kind, level, line }]
  const blockStack = []; // stack of { kind, level, lineIdx }
  const seenEvents = new Map(); // label → first line

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.isBlank || l.isComment) continue;

    const level = levelOf(l);

    // ── unclosed string check ──
    checkUnclosedStrings(l, diagnostics);

    // ── unclosed {variable} check ──
    checkUnclosedVariables(l, diagnostics, definedOptions);

    // ── unclosed %placeholder% check ──
    checkUnclosedPlaceholders(l, diagnostics);

    // ── top-level checks (level 0) ──
    if (level === 0) {
      // Pop stack items that ended
      blockStack.length = 0;

      // Must be a valid top-level construct
      if (!isTopLevel(l.trimmed)) {
        if (looksLikeEffect(l.trimmed)) {
          diagnostics.push(err(
            l.line.from, l.line.to,
            `"${l.trimmed.slice(0, 40)}" is an effect/condition outside of any event or trigger. It must be indented inside an event.`
          ));
        } else if (!l.trimmed.endsWith(":")) {
          diagnostics.push(warn(
            l.line.from, l.line.to,
            `Unrecognised top-level statement: "${l.trimmed.slice(0, 40)}". Top-level code must be an event (on join:), command, function, or options block.`
          ));
        }
        continue;
      }

      // Top-level block openers must end with ':'
      if (isBlockOpener(l.trimmed) && !l.trimmed.endsWith(":")) {
        diagnostics.push(err(
          l.line.from, l.line.to,
          `Missing ":" at end of "${l.trimmed.slice(0, 40)}". Skript requires a colon to open a block.`
        ));
      }

      // Detect event kind for context tracking
      const eventLabel = matchEventLabel(l.trimmed);

      // Duplicate event check
      if (eventLabel) {
        if (seenEvents.has(eventLabel)) {
          diagnostics.push(warn(
            l.line.from, l.line.to,
            `Duplicate event "${eventLabel}" — this event is already registered on line ${seenEvents.get(eventLabel)}. The second one may silently override the first.`
          ));
        } else {
          seenEvents.set(eventLabel, l.n);
        }
      }

      // Empty body check
      const nextContent = findNextNonBlank(lines, i + 1);
      if (nextContent === null) {
        diagnostics.push(err(
          l.line.from, l.line.to,
          `Empty section — "${l.trimmed.slice(0, 40)}" has no body. Skript will error on empty triggers.`
        ));
      } else {
        const nextLevel = levelOf(nextContent);
        if (nextLevel === 0) {
          diagnostics.push(err(
            l.line.from, l.line.to,
            `Empty section — "${l.trimmed.slice(0, 40)}" has no indented body. Skript requires at least one statement inside each trigger.`
          ));
        }
      }

      blockStack.push({ kind: eventLabel || "block", level: 0, lineIdx: i });
      continue;
    }

    // ── indented checks ──

    // Keywords that require a colon but don't have one
    for (const { re, word } of MUST_HAVE_COLON) {
      if (re.test(l.trimmed)) {
        diagnostics.push(err(
          l.line.from, l.line.to,
          `"${word}" is missing a colon. It should be "${word}:" — Skript will error without it.`
        ));
        break;
      }
    }

    // 'else' / 'else if' must follow an 'if' at the same level
    if (/^else(\s+if\b)?/i.test(l.trimmed)) {
      if (!hasMatchingIf(lines, i, level, unit)) {
        diagnostics.push(err(
          l.line.from, l.line.to,
          `"${l.trimmed.slice(0, 30)}" without a matching "if" at the same indentation level.`
        ));
      }
    }

    // Block openers at indented level must end with ':'
    if (isBlockOpener(l.trimmed) && !l.trimmed.endsWith(":")) {
      // Exclude lines that are clearly values (description: text, etc.)
      if (!/^(description|usage|permission|permission message|aliases|cooldown)\s*:/i.test(l.trimmed)) {
        diagnostics.push(err(
          l.line.from, l.line.to,
          `Missing ":" at end of "${l.trimmed.slice(0, 40)}".`
        ));
      }
    }

    // Empty if/loop/while blocks
    if (/^(if\b|loop\b|while\b)/i.test(l.trimmed) && l.trimmed.endsWith(":")) {
      const nextContent = findNextNonBlank(lines, i + 1);
      if (nextContent === null || levelOf(nextContent) <= level) {
        diagnostics.push(err(
          l.line.from, l.line.to,
          `Empty ${l.trimmed.split(/\s/)[0].toLowerCase()} block — Skript requires at least one statement inside.`
        ));
      }
    }

    // 'return' outside a function
    if (/^return\b/i.test(l.trimmed)) {
      const enclosing = findEnclosingFunction(lines, i, unit);
      if (!enclosing) {
        diagnostics.push(err(
          l.line.from, l.line.to,
          '"return" used outside a function. "return" is only valid inside a function definition.'
        ));
      }
    }

    // 'cancel event' inside non-cancellable event
    if (/^cancel event\b/i.test(l.trimmed)) {
      const ev = findEnclosingEvent(lines, i);
      if (ev && !CANCELLABLE.has(ev)) {
        diagnostics.push(warn(
          l.line.from, l.line.to,
          `"cancel event" inside "${ev}" — this event may not be cancellable. Skript might throw an error or ignore this.`
        ));
      }

      // ── Check 4: missing stop after cancel event ──
      // If code continues at the same indentation after cancel event, warn
      const ce_level = level;
      let foundEffect = false;
      for (let j = i + 1; j < lines.length; j++) {
        const nxt = lines[j];
        if (nxt.isBlank || nxt.isComment) continue;
        const nxtLevel = levelOf(nxt);
        if (nxtLevel < ce_level) break; // exited block
        if (nxtLevel === ce_level) {
          // code continues at same level after cancel event — check if it's stop/exit/return
          if (/^(stop|exit|return)\b/i.test(nxt.trimmed)) break; // fine
          foundEffect = true;
          break;
        }
      }
      if (foundEffect) {
        diagnostics.push(warn(
          l.line.from, l.line.to,
          '"cancel event" without a following "stop" — code below will still execute. Add "stop" after cancelling if you want to prevent the rest of the trigger from running.'
        ));
      }
    }

    // ── Check 1: type checking — set {numericVar} to "string literal" ──
    {
      const setMatch = l.trimmed.match(/^set\s+(\{[^}]+\})\s+to\s+"([^"]*)"/i);
      if (setMatch) {
        const varRef = setMatch[1];
        if (NUMERIC_VAR_HINT_RE.test(varRef)) {
          diagnostics.push(warn(
            l.line.from, l.line.to,
            `Type mismatch: "${varRef}" looks like a numeric variable but is being set to a string. Skript may error or behave unexpectedly.`
          ));
        }
      }
    }

    // ── Check 2: unknown potion effects ──
    {
      // "apply <effect> [amplifier <n>] to <target>" or "apply <effect> <n> to <target>"
      const applyMatch = l.trimmed.match(/^apply\s+([a-z][a-z\s]*?)(?:\s+\d+|\s+amplifier\s+\d+)?\s+to\b/i);
      if (applyMatch) {
        const effectName = applyMatch[1].trim().toLowerCase();
        if (!VALID_POTION_EFFECTS.has(effectName)) {
          diagnostics.push(err(
            l.line.from, l.line.to,
            `Unknown potion effect "${effectName}". Check the effect name — valid effects include: speed, strength, regeneration, poison, etc.`
          ));
        }
      }
    }

    // ── Check 3: loop variable used outside a loop ──
    {
      // loop-player, loop-value, loop-number, loop-item, loop-block, loop-entity, etc.
      const loopVarMatch = l.trimmed.match(/\bloop-(player|value|number|item|block|entity|block data|[\w-]+)\b/i);
      if (loopVarMatch) {
        // Walk up to see if we're inside a loop block
        if (!isInsideLoop(lines, i, levelOf(l), unit)) {
          diagnostics.push(warn(
            l.line.from, l.line.to,
            `"loop-${loopVarMatch[1]}" is used outside of a loop — this variable only exists while a loop is running. It will be empty (or undefined) here.`
          ));
        }
      }
    }
  }

  // ── Check 5: {_local} variable read before set in the same scope ──
  // Only warn when a local variable is READ in a scope where it is NEVER assigned.
  // Using the same name (e.g. {_p}) across multiple functions is perfectly valid —
  // each function has its own independent local scope.
  {
    // Build per-scope maps: scopeKey → { name → { reads: [...], written: bool } }
    const scopeData = new Map();

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (l.isBlank || l.isComment) continue;

      const localRefs = extractLocalVars(l.stripped);
      if (localRefs.length === 0) continue;

      const scopeKey = getEnclosingScope(lines, i);
      if (!scopeKey) continue;

      if (!scopeData.has(scopeKey)) scopeData.set(scopeKey, new Map());
      const varMap = scopeData.get(scopeKey);

      for (const { name, pos } of localRefs) {
        if (!varMap.has(name)) varMap.set(name, { reads: [], written: false });
        const entry = varMap.get(name);

        // Detect assignment: "set {_name}" or "add X to {_name}" or function param
        const isWrite =
          /^set\s+\{_/i.test(l.trimmed) && l.trimmed.toLowerCase().includes(`{_${name}}`) ||
          /^add\b/i.test(l.trimmed) && l.trimmed.toLowerCase().includes(`{_${name}}`) ||
          /^remove\b/i.test(l.trimmed) && l.trimmed.toLowerCase().includes(`to\s+\{_${name}\}`) ||
          // Function parameter: "function foo(name: type)" — param name is always "written"
          scopeKey.startsWith("function ") && scopeKey.includes(`(${name}:`) ||
          scopeKey.startsWith("function ") && scopeKey.includes(`, ${name}:`) ||
          // loop variable assignment via "set {_x} to ..."
          l.trimmed.toLowerCase().startsWith(`set {_${name}}`);

        if (isWrite) {
          entry.written = true;
        } else {
          entry.reads.push({ lineFrom: l.line.from, pos });
        }
      }
    }

    // Warn only on reads in a scope where the var is never written
    for (const [scopeKey, varMap] of scopeData) {
      for (const [varName, { reads, written }] of varMap) {
        if (written) continue;           // assigned somewhere in this scope — fine
        if (reads.length === 0) continue; // no reads to warn about
        // Only warn for non-trivial names (skip single chars like {_p}, {_t})
        if (varName.length <= 1) continue;
        for (const { lineFrom, pos } of reads) {
          diagnostics.push(warn(
            lineFrom + pos, lineFrom + pos + varName.length + 4,
            `Local variable "{_${varName}}" is read in "${scopeKey}" but never assigned in this scope — it will always be empty. Did you mean to "set {_${varName}} to ..." first?`
          ));
        }
      }
    }
  }

  return diagnostics;
}

// ─── string / bracket checks ────────────────────────────────────────────────

function checkUnclosedStrings(l, diagnostics) {
  const text = l.stripped;
  let open = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '"' && text[i - 1] !== '\\') {
      if (open === -1) open = i;
      else open = -1;
    }
  }
  if (open !== -1) {
    diagnostics.push(err(
      l.line.from + open, l.line.to,
      'Unclosed string — add a closing " before the end of the line. Skript does not support multi-line strings.'
    ));
  }
}

function checkUnclosedVariables(l, diagnostics, definedOptions) {
  const text = l.stripped;
  let inStr = false;
  let depth = 0;
  let openPos = -1;
  let isOption = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' && text[i - 1] !== '\\') { inStr = !inStr; continue; }
    if (inStr) continue;

    if (ch === '{') {
      if (depth === 0) { openPos = i; isOption = text[i + 1] === '@'; }
      depth++;
    } else if (ch === '}') {
      if (depth > 0) {
        depth--;
        if (depth === 0) {
          // Check {@option} references
          if (isOption) {
            const varContent = text.slice(openPos + 2, i).toLowerCase();
            if (definedOptions.size > 0 && !definedOptions.has(varContent)) {
              diagnostics.push(warn(
                l.line.from + openPos, l.line.from + i + 1,
                `"{@${varContent}}" is not defined in the options block. Defined options: ${[...definedOptions].join(", ") || "none"}.`
              ));
            }
          }
          openPos = -1;
        }
      }
    }
  }

  if (depth > 0 && openPos !== -1) {
    diagnostics.push(err(
      l.line.from + openPos, l.line.to,
      'Unclosed variable "{" — add a closing "}" to complete the variable name.'
    ));
  }
}

function checkUnclosedPlaceholders(l, diagnostics) {
  const text = l.stripped;
  let inStr = false;
  let open = -1;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' && text[i - 1] !== '\\') { inStr = !inStr; continue; }
    // %placeholders% only outside strings in Skript
    if (!inStr && ch === '%') {
      if (open === -1) open = i;
      else open = -1;
    }
  }

  if (open !== -1) {
    diagnostics.push(err(
      l.line.from + open, l.line.to,
      'Unclosed % — add a closing "%" to complete the expression placeholder.'
    ));
  }
}

// ─── structural helpers ──────────────────────────────────────────────────────

function findNextNonBlank(lines, from) {
  for (let i = from; i < lines.length; i++) {
    if (!lines[i].isBlank && !lines[i].isComment) return lines[i];
  }
  return null;
}

/** Look backwards from lineIdx for an `if` at the same indentation level */
function hasMatchingIf(lines, lineIdx, level, unit) {
  for (let i = lineIdx - 1; i >= 0; i--) {
    const l = lines[i];
    if (l.isBlank || l.isComment) continue;
    const lv = indentLevel(l.raw, unit);
    if (lv < level) return false; // went out of scope
    if (lv === level) {
      // Must be an if or else-if
      if (/^\s*(if\b|else\s+if\b)/i.test(l.raw)) return true;
      // Another else at same level is ok (else if chain)
      if (/^\s*else\b/i.test(l.raw)) continue;
      return false;
    }
  }
  return false;
}

/** Find the enclosing function definition walking up from lineIdx */
function findEnclosingFunction(lines, lineIdx, unit) {
  for (let i = lineIdx - 1; i >= 0; i--) {
    const l = lines[i];
    if (l.isBlank || l.isComment) continue;
    if (indentLevel(l.raw, unit) === 0) {
      return /^function\s+\w/i.test(l.trimmed) ? l.trimmed : null;
    }
  }
  return null;
}

/** Find the enclosing event label walking up from lineIdx */
function findEnclosingEvent(lines, lineIdx) {
  for (let i = lineIdx - 1; i >= 0; i--) {
    const l = lines[i];
    if (l.isBlank || l.isComment) continue;
    if (l.indentCount === 0 && l.trimmed.length > 0) {
      return matchEventLabel(l.trimmed);
    }
  }
  return null;
}

/** Extract the base event label from an event line, e.g. "on join:" → "on join" */
function matchEventLabel(trimmed) {
  const clean = trimmed.replace(/:$/, "").trim().toLowerCase();
  // Match known events (longest match first)
  const sorted = EVENTS.map(e => e.label).sort((a, b) => b.length - a.length);
  for (const ev of sorted) {
    if (clean === ev || clean.startsWith(ev + " ") || clean.startsWith(ev + ":")) {
      return ev;
    }
  }
  if (/^on\s+/i.test(clean)) return clean;
  if (/^every\s+/i.test(clean)) return "every";
  return null;
}

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

/** Check if a line at lineIdx is inside a loop block (at a deeper level than any enclosing loop:) */
function isInsideLoop(lines, lineIdx, currentLevel, unit) {
  for (let i = lineIdx - 1; i >= 0; i--) {
    const l = lines[i];
    if (l.isBlank || l.isComment) continue;
    const lv = indentLevel(l.raw, unit);
    if (lv >= currentLevel) continue; // same or deeper — not a parent
    // This is a parent line (less indented)
    if (/^loop\b/i.test(l.trimmed)) return true;
    if (lv === 0) return false; // hit top level with no loop
  }
  return false;
}

/** Extract all {_varname} local variable references from a line (respects strings) */
function extractLocalVars(text) {
  const results = [];
  let inStr = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' && text[i - 1] !== '\\') { inStr = !inStr; i++; continue; }
    if (!inStr && ch === '{' && text[i + 1] === '_') {
      // Find closing }
      const start = i;
      let j = i + 2;
      while (j < text.length && text[j] !== '}') j++;
      if (j < text.length) {
        const name = text.slice(i + 2, j).toLowerCase();
        if (name.length > 0 && /^[\w._%-]+$/.test(name)) {
          results.push({ name, pos: start });
        }
        i = j + 1;
        continue;
      }
    }
    i++;
  }
  return results;
}

/** Get a key representing the top-level scope (event/function) enclosing lineIdx */
function getEnclosingScope(lines, lineIdx) {
  for (let i = lineIdx; i >= 0; i--) {
    const l = lines[i];
    if (l.isBlank || l.isComment) continue;
    if (l.indentCount === 0 && l.trimmed.length > 0) {
      // Return the top-level line text as the scope key
      return l.trimmed.replace(/:$/, "").trim().toLowerCase().slice(0, 80);
    }
  }
  return null;
}

// ─── standalone lint (no CodeMirror view needed) ─────────────────────────────

/**
 * Build a minimal doc-like object from a plain string so skriptLint can run
 * without a real CodeMirror EditorView.  The returned object matches the subset
 * of the CodeMirror Doc API that skriptLint actually uses:
 *   doc.lines, doc.line(n), doc.lineAt(pos), doc.length, doc.sliceString(f,t)
 */
function makeDocFromText(code) {
  const rawLines = code.split("\n");
  // Build offset table: offsets[i] = char offset of line i (0-based)
  const offsets = [];
  let off = 0;
  for (const l of rawLines) {
    offsets.push(off);
    off += l.length + 1; // +1 for the \n
  }
  const totalLength = code.length;

  return {
    lines: rawLines.length,
    length: totalLength,
    line(n) {
      // CodeMirror lines are 1-based
      const idx = n - 1;
      const text = rawLines[idx] ?? "";
      const from = offsets[idx] ?? 0;
      return { number: n, text, from, to: from + text.length };
    },
    lineAt(pos) {
      // Binary search for the line that contains pos
      let lo = 0, hi = offsets.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (offsets[mid] <= pos) lo = mid; else hi = mid - 1;
      }
      const text = rawLines[lo] ?? "";
      return { number: lo + 1, text, from: offsets[lo], to: offsets[lo] + text.length };
    },
    sliceString(from, to) { return code.slice(from, to); },
    toString() { return code; },
  };
}

/**
 * Run the full Skript linter on a plain string of code.
 * Returns an array of { from, to, message, severity } diagnostics —
 * the same format the CodeMirror linter extension uses.
 *
 * @param {string} code
 * @returns {{ from: number, to: number, message: string, severity: string }[]}
 */
export function lintCode(code) {
  const doc = makeDocFromText(code);
  // skriptLint expects { state: { doc } }
  return skriptLint({ state: { doc } });
}

// ─── export ──────────────────────────────────────────────────────────────────

export function skriptLintExtension() {
  return [
    linter(skriptLint, { delay: 350 }),
    lintGutter(),
  ];
}
