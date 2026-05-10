// Persistent store for Skript completions. Wraps the static built-in data
// with user-editable overrides, custom additions, and soft deletions.
import { EVENTS, EFFECTS, CONDITIONS, EXPRESSIONS, SNIPPETS } from "./skript/data.js";

const STORAGE_KEY = "skstudio.completions";

// Type tags for built-ins
const BUILTIN = []; // ordered list, preserves data.js order
function pushAll(arr, type) {
  for (const e of arr) BUILTIN.push({ ...e, _type: type, _builtin: true });
}
pushAll(EVENTS, "event");
pushAll(EFFECTS, "effect");
pushAll(CONDITIONS, "condition");
pushAll(EXPRESSIONS, "expression");
pushAll(SNIPPETS, "snippet");

const BUILTIN_BY_LABEL = new Map(BUILTIN.map((e) => [e.label, e]));

let userData = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { overrides: {}, custom: [], deleted: [] };
    return { overrides: {}, custom: [], deleted: [], ...JSON.parse(raw) };
  } catch {
    return { overrides: {}, custom: [], deleted: [] };
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  for (const fn of listeners) fn();
}

export function onCompletionsChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Returns all active completions (builtins minus deleted, with overrides + customs). */
export function getAllCompletions() {
  const result = [];
  for (const entry of BUILTIN) {
    if (userData.deleted.includes(entry.label)) continue;
    const override = userData.overrides[entry.label];
    if (override) {
      result.push({ ...entry, ...override, _modified: true });
    } else {
      result.push(entry);
    }
  }
  for (const c of userData.custom) {
    result.push({ ...c, _type: c._type || "custom", _custom: true });
  }
  return result;
}

export function getCompletion(label) {
  return getAllCompletions().find((c) => c.label === label) || null;
}

export function searchCompletions(query, type) {
  const q = (query || "").toLowerCase();
  return getAllCompletions().filter((c) => {
    if (type && type !== "all" && c._type !== type) return false;
    if (!q) return true;
    return (
      c.label.toLowerCase().includes(q) ||
      (c.doc || "").toLowerCase().includes(q) ||
      (c.snippet || "").toLowerCase().includes(q)
    );
  });
}

/** Update fields on a completion. Built-ins go into overrides; customs are mutated. */
export function updateCompletion(label, changes) {
  if (BUILTIN_BY_LABEL.has(label)) {
    userData.overrides[label] = { ...(userData.overrides[label] || {}), ...changes };
  } else {
    const idx = userData.custom.findIndex((c) => c.label === label);
    if (idx !== -1) userData.custom[idx] = { ...userData.custom[idx], ...changes };
  }
  save();
}

/** Reset a modified built-in back to its original definition. */
export function resetCompletion(label) {
  delete userData.overrides[label];
  userData.deleted = userData.deleted.filter((l) => l !== label);
  save();
}

/** Remove a completion. Built-ins are soft-deleted; customs are permanently removed. */
export function deleteCompletion(label) {
  if (BUILTIN_BY_LABEL.has(label)) {
    if (!userData.deleted.includes(label)) userData.deleted.push(label);
    delete userData.overrides[label];
  } else {
    userData.custom = userData.custom.filter((c) => c.label !== label);
  }
  save();
}

/** Add a brand-new custom completion. */
export function addCustomCompletion(entry) {
  if (!entry.label) return false;
  // Don't allow collision with existing labels
  if (getCompletion(entry.label)) return false;
  userData.custom.push({
    label: entry.label,
    _type: entry._type || "custom",
    doc: entry.doc || "",
    snippet: entry.snippet || entry.label,
  });
  save();
  return true;
}

export function isModified(label) {
  return !!userData.overrides[label];
}

export function isCustom(label) {
  return userData.custom.some((c) => c.label === label);
}

/** Restore everything to defaults. */
export function resetAll() {
  userData = { overrides: {}, custom: [], deleted: [] };
  save();
}
