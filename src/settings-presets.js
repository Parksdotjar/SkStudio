// Syntax color presets for the editor
// Each preset defines colors for the token types Skript-mode emits:
// keyword, atom (events), string, number, comment, variable, type, meta, operator

export const SYNTAX_PRESETS = {
  skstudio: {
    name: "SkStudio (default)",
    colors: {
      keyword: "#c586c0",
      atom: "#4ec9b0",
      string: "#ce9178",
      number: "#b5cea8",
      comment: "#6a9955",
      variable: "#9cdcfe",
      type: "#4ec9b0",
      meta: "#dcdcaa",
      operator: "#d4d4d4",
    },
  },
  vscode: {
    name: "VS Code Dark+",
    colors: {
      keyword: "#569cd6",
      atom: "#4ec9b0",
      string: "#ce9178",
      number: "#b5cea8",
      comment: "#6a9955",
      variable: "#9cdcfe",
      type: "#4ec9b0",
      meta: "#dcdcaa",
      operator: "#d4d4d4",
    },
  },
  skeditor: {
    name: "SkEditor Classic",
    colors: {
      keyword: "#c586c0",
      atom: "#3ddc84",
      string: "#dcaa6e",
      number: "#b5cea8",
      comment: "#6a9955",
      variable: "#9cdcfe",
      type: "#4ec9b0",
      meta: "#dcdcaa",
      operator: "#e6e6e8",
    },
  },
  monokai: {
    name: "Monokai",
    colors: {
      keyword: "#f92672",
      atom: "#a6e22e",
      string: "#e6db74",
      number: "#ae81ff",
      comment: "#75715e",
      variable: "#66d9ef",
      type: "#a6e22e",
      meta: "#fd971f",
      operator: "#f8f8f2",
    },
  },
  dracula: {
    name: "Dracula",
    colors: {
      keyword: "#ff79c6",
      atom: "#50fa7b",
      string: "#f1fa8c",
      number: "#bd93f9",
      comment: "#6272a4",
      variable: "#8be9fd",
      type: "#50fa7b",
      meta: "#ffb86c",
      operator: "#f8f8f2",
    },
  },
  github: {
    name: "GitHub Dark",
    colors: {
      keyword: "#ff7b72",
      atom: "#7ee787",
      string: "#a5d6ff",
      number: "#79c0ff",
      comment: "#8b949e",
      variable: "#ffa657",
      type: "#7ee787",
      meta: "#d2a8ff",
      operator: "#c9d1d9",
    },
  },
  nord: {
    name: "Nord",
    colors: {
      keyword: "#81a1c1",
      atom: "#8fbcbb",
      string: "#a3be8c",
      number: "#b48ead",
      comment: "#616e88",
      variable: "#88c0d0",
      type: "#8fbcbb",
      meta: "#ebcb8b",
      operator: "#d8dee9",
    },
  },
  oneDark: {
    name: "One Dark",
    colors: {
      keyword: "#c678dd",
      atom: "#56b6c2",
      string: "#98c379",
      number: "#d19a66",
      comment: "#5c6370",
      variable: "#e06c75",
      type: "#56b6c2",
      meta: "#e5c07b",
      operator: "#abb2bf",
    },
  },
};

export const TOKEN_LABELS = {
  keyword: "Keywords (if, loop, set, …)",
  atom: "Events (on join, on click, …)",
  string: "Strings (\"text\")",
  number: "Numbers (1, 2.5)",
  comment: "Comments (# ...)",
  variable: "Variables / identifiers",
  type: "Types (player, entity, …)",
  meta: "Placeholders (%expr%)",
  operator: "Operators (=, +, →)",
};

export const DEFAULT_COLORS = SYNTAX_PRESETS.skstudio.colors;
