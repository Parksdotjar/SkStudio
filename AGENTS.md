# SkStudio Agent Guide

This file exists to conserve Codex usage in the SkStudio repo. Read this before broad scans.

Primary rule: use the shortest path to the answer. If the user asks for a UI/editor tweak, inspect only `src/` files relevant to that feature. Do not inspect Tauri, promo, build output, or `node_modules` unless the task explicitly needs them.

## Usage Conservation Rules

- Prefer targeted reads over repo-wide exploration.
- Use `rg` or `rg --files` first when a path is unknown.
- Do not scan `node_modules/`, `dist/`, `src-tauri/target/`, or `promo/out/`.
- For most app UI changes, start with `src/main.js` and `src/styles.css`.
- For editor behavior, inspect `src/editor.js`, `src/skript-mode.js`, `src/skript/`, and feature-specific modules.
- For block editor behavior, inspect `src/block-editor.js` and `src/block-definitions.js`.
- For file tree behavior, inspect `src/file-tree.js`.
- For terminal behavior, inspect `src/terminal.js`.
- For updater behavior, inspect `src/updater.js`.
- For Tauri/backend behavior, inspect only `src-tauri/src/lib.rs`, `src-tauri/src/main.rs`, `src-tauri/tauri.conf.json`, and `src-tauri/capabilities/default.json`.
- Do not run expensive Tauri builds unless explicitly requested.
- For frontend-only changes, verify with `npm run build`.
- For block definition changes, also run `npm run test:block-definitions`.
- Keep final responses short:
  - changed file(s)
  - verification result
  - commands if useful
- Never reset, restore, or clean unrelated files unless the user explicitly asks.
- Stage exact files only. Do not use `git add .` unless the user explicitly wants all changes.
- Avoid reading secrets. This repo currently has no obvious `.env`, but still do not print secrets if added later.
- If the user says low usage, minimize commentary, inspect only target files, and skip optional checks.

## Repo Identity

- Repo root: `C:\Users\Parks\Claude\Projects\Sk-Editor REVAMP`
- App name: SkStudio
- Package name: `skstudio`
- Version: `0.1.0`
- App type: Vite frontend + Tauri 2 desktop app.
- Tauri product name: `SkStudio`
- Tauri identifier: `com.skstudio.app`
- Default Tauri window:
  - title: `SkStudio`
  - width: `1280`
  - height: `800`
  - min width: `800`
  - min height: `500`
  - decorations: `false`
  - transparent: `false`

## High-Signal Paths

### Frontend

- Entry: `src/main.js`
- Global styles: `src/styles.css`
- Main editor logic: `src/editor.js`
- CodeMirror/Skript mode: `src/skript-mode.js`
- Skript completions/data/linting: `src/skript/`
- Block definitions: `src/block-definitions.js`
- Block editor: `src/block-editor.js`
- File tree: `src/file-tree.js`
- Dialog helpers: `src/dialogs.js`
- Menu bar: `src/menu-bar.js`
- Terminal: `src/terminal.js`
- Settings: `src/settings.js`
- Settings presets: `src/settings-presets.js`
- Courses: `src/courses.js`
- Docs: `src/docs.js`
- Skript docs UI: `src/skript-docs.js`
- Skript docs data: `src/skript-docs-data.js`
- GUI builder: `src/gui-builder.js`
- GUI icon asset data: `src/gui-icon-assets.js`
- Local server helpers: `src/local-server.js`
- Updater: `src/updater.js`
- Whiteboard: `src/whiteboard.js`
- Find/replace: `src/find-replace.js`
- Ghost text: `src/ghost-text.js`
- Snippet choices: `src/snippet-choices.js`
- Completions store: `src/completions-store.js`

### Assets

- `src/assets/logo.png`
- `src/assets/main-logo.png`
- `src/assets/green-mini-logo.png`
- `src/assets/white-mini-logo.png`
- Public audio:
  - `public/audio/skstudio-lofi-loop.wav`
  - `public/audio/soft-hit.wav`
  - `public/audio/soft-whoosh.wav`
- Public UI screenshots:
  - `public/ui/01-welcome.png`
  - `public/ui/02-editor-parser.png`
  - `public/ui/03-blocks.png`
  - `public/ui/04-docs.png`
  - `public/ui/05-courses.png`

### Tauri / Rust

- Tauri config: `src-tauri/tauri.conf.json`
- Rust lib: `src-tauri/src/lib.rs`
- Rust main: `src-tauri/src/main.rs`
- Capabilities: `src-tauri/capabilities/default.json`
- Cargo manifest: `src-tauri/Cargo.toml`
- Cargo lock: `src-tauri/Cargo.lock`
- Build script: `src-tauri/build.rs`
- Icons: `src-tauri/icons/`
- Generated schemas: `src-tauri/gen/schemas/`
- Build output: `src-tauri/target/` (do not scan by default)

### Promo

- Promo source: `promo/src/`
- Promo entry: `promo/src/index.jsx`
- Promo root: `promo/src/Root.jsx`
- Promo composition: `promo/src/SkStudioPromo.jsx`
- Promo CSS: `promo/src/styles.css`
- Promo output: `promo/out/` (do not scan by default)
- Promo UI screenshots: `promo/public/ui/`

### Scripts

- Capture promo UI: `scripts/capture-promo-ui.mjs`
- Generate GUI icons: `scripts/generate-gui-icons.cjs`
- Generate promo audio: `scripts/generate-promo-audio.mjs`
- Test block definitions: `scripts/test-block-definitions.mjs`

## Current Top-Level File Tree

```text
C:\Users\Parks\Claude\Projects\Sk-Editor REVAMP
├─ .claude/
├─ .git/
├─ dist/
├─ node_modules/
├─ promo/
├─ public/
├─ scripts/
├─ src/
├─ src-tauri/
├─ .gitignore
├─ AGENTS.md
├─ index.html
├─ package-lock.json
├─ package.json
└─ vite.config.js
```

## Source File Tree

```text
src/
├─ block-definitions.js
├─ block-editor.js
├─ completions-store.js
├─ courses.js
├─ dialogs.js
├─ docs.js
├─ editor.js
├─ file-tree.js
├─ find-replace.js
├─ ghost-text.js
├─ gui-builder.js
├─ gui-icon-assets.js
├─ local-server.js
├─ main.js
├─ menu-bar.js
├─ settings-presets.js
├─ settings.js
├─ skript-docs-data.js
├─ skript-docs.js
├─ skript-mode.js
├─ snippet-choices.js
├─ styles.css
├─ terminal.js
├─ updater.js
├─ whiteboard.js
├─ assets/
│  ├─ green-mini-logo.png
│  ├─ logo.png
│  ├─ main-logo.png
│  └─ white-mini-logo.png
└─ skript/
   ├─ completions.js
   ├─ data.js
   └─ linter.js
```

## Tauri File Tree

Do not recursively scan `target/`; it is huge generated build output.

```text
src-tauri/
├─ app-icon.png
├─ build.rs
├─ Cargo.lock
├─ Cargo.toml
├─ tauri.conf.json
├─ capabilities/
│  └─ default.json
├─ gen/
│  └─ schemas/
├─ icons/
├─ src/
│  ├─ lib.rs
│  └─ main.rs
└─ target/   # generated; avoid scanning
```

## Promo File Tree

```text
promo/
├─ out/
│  ├─ skstudio-promo-3d.mp4
│  └─ skstudio-promo.mp4
├─ public/
│  └─ ui/
├─ src/
│  ├─ index.jsx
│  ├─ Root.jsx
│  ├─ SkStudioPromo.jsx
│  └─ styles.css
```

## Package Scripts

From `package.json`:

```json
{
  "dev": "vite",
  "build": "vite build",
  "test:block-definitions": "node scripts/test-block-definitions.mjs",
  "promo:capture": "node scripts/capture-promo-ui.mjs",
  "promo:audio": "node scripts/generate-promo-audio.mjs",
  "promo:preview": "remotion studio promo/src/index.jsx",
  "promo:render": "remotion render promo/src/index.jsx SkStudioPromo promo/out/skstudio-promo.mp4 --codec=h264",
  "preview": "vite preview",
  "tauri": "tauri"
}
```

## Common Commands

### Go To Repo

```powershell
cd "C:\Users\Parks\Claude\Projects\Sk-Editor REVAMP"
```

### Check Git Status

```powershell
git status -sb
```

### Frontend Dev Server

```powershell
npm run dev
```

### Frontend Build

```powershell
npm run build
```

### Preview Built Frontend

```powershell
npm run preview
```

### Test Block Definitions

```powershell
npm run test:block-definitions
```

### Tauri Dev

```powershell
npm run tauri dev
```

### Tauri Build

Potentially expensive; avoid unless explicitly requested.

```powershell
npm run tauri build
```

### Promo Capture

```powershell
npm run promo:capture
```

### Promo Audio

```powershell
npm run promo:audio
```

### Promo Preview

```powershell
npm run promo:preview
```

### Promo Render

```powershell
npm run promo:render
```

## Git Commands

Stage exact files:

```powershell
git add src/main.js src/styles.css
```

Commit:

```powershell
git commit -m "Update SkStudio"
```

Push current branch:

```powershell
git push
```

Do not use `git add .` unless the user explicitly wants every current change.

## Verification Rules

Choose the smallest useful check.

Frontend-only UI/copy/style:

```powershell
npm run build
```

Block definition changes:

```powershell
npm run test:block-definitions
npm run build
```

Tauri command/backend/capability changes:

```powershell
npm run build
npm run tauri build
```

Promo changes:

```powershell
npm run promo:render
```

If user is conserving usage, skip optional checks and report what was not run.

## App Architecture Notes

- This is not a React component tree in the usual app-split sense; many features are plain JS modules under `src/`.
- Styling is centralized in `src/styles.css`.
- `src/main.js` is the likely app bootstrap/orchestration file.
- Code editor behavior uses CodeMirror dependencies.
- Skript-specific language support lives in `src/skript-mode.js` and `src/skript/`.
- Block visual programming/editor support lives in `src/block-editor.js` and `src/block-definitions.js`.
- Docs/courses are local app features, not external website pages.
- Tauri 2 provides desktop shell and native capabilities.
- CSP in `tauri.conf.json` is strict and explicitly allows:
  - GitHub API/downloads
  - Modrinth API/CDN
  - PaperMC Fill APIs
  - YouTube embeds
  - `ccvaults.com` images

## Tauri Config Facts

```json
{
  "productName": "SkStudio",
  "version": "0.1.0",
  "identifier": "com.skstudio.app",
  "frontendDist": "../dist",
  "devUrl": "http://localhost:1420",
  "beforeDevCommand": "npm run dev",
  "beforeBuildCommand": "npm run build"
}
```

Window:

```json
{
  "title": "SkStudio",
  "width": 1280,
  "height": 800,
  "minWidth": 800,
  "minHeight": 500,
  "decorations": false,
  "resizable": true,
  "transparent": false
}
```

Bundle:

```json
{
  "active": true,
  "targets": "all"
}
```

## Website / Bloom Productions Integration Notes

The Bloom Client / Bloom Productions website references SkStudio as a second app.

Related Bloom repo facts:

- Bloom repo path: `G:\Bloom-Client`
- Bloom website path: `G:\Bloom-Client\website`
- SkStudio website manifest fallback in Bloom repo: `G:\Bloom-Client\website\public\sks-latest.json`
- Expected SkStudio update manifest object in Supabase storage: `updates/sks-latest.json`
- Expected SkStudio installer naming currently used by website:
  - `SkStudio_0.1.0_x64-setup.exe`
  - `SkStudio_0.1.0_x64_en-US.msi`
  - `SkStudio_latest_x64-setup.exe`
- Supabase project ref used by Bloom website: `zdzsinylfqeqqvtoleug`

If asked to update SkStudio downloads on the Bloom website, work in `G:\Bloom-Client\website`, not this repo, unless generating release artifacts from this repo.

## Release / Manifest Notes

No `latest.json` was found in this repo during initial AGENTS creation.

The Bloom Productions website expects a Tauri-style manifest with this shape:

```json
{
  "version": "0.1.0",
  "installerUrl": "https://.../SkStudio_0.1.0_x64-setup.exe",
  "assetName": "SkStudio_0.1.0_x64-setup.exe",
  "msiUrl": "https://.../SkStudio_0.1.0_x64_en-US.msi",
  "msiAssetName": "SkStudio_0.1.0_x64_en-US.msi",
  "fallbackInstallerUrls": ["https://.../SkStudio_latest_x64-setup.exe"],
  "windows": {
    "installerUrl": "https://.../SkStudio_0.1.0_x64-setup.exe",
    "assetName": "SkStudio_0.1.0_x64-setup.exe",
    "nsisUrl": "https://.../SkStudio_0.1.0_x64-setup.exe",
    "nsisAssetName": "SkStudio_0.1.0_x64-setup.exe",
    "msiUrl": "https://.../SkStudio_0.1.0_x64_en-US.msi",
    "msiAssetName": "SkStudio_0.1.0_x64_en-US.msi",
    "fallbackInstallerUrls": ["https://.../SkStudio_latest_x64-setup.exe"]
  }
}
```

## Design Notes

- Keep SkStudio visually focused and editor-like.
- Prefer dense but clean tool UI over marketing-style sections inside the app.
- Do not add decorative bloat for editor workflows.
- Keep controls obvious and ergonomic.
- Avoid changing global layout when a small local fix is enough.
- Test text overflow in compact toolbars/panels.
- Do not introduce a new UI framework unless explicitly asked.

## Common Task Routing

### Change App Styling

Likely files:

- `src/styles.css`
- maybe `src/main.js` if structure/classes need adjustment

Verify:

```powershell
npm run build
```

### Change Editor Behavior

Likely files:

- `src/editor.js`
- `src/skript-mode.js`
- `src/skript/completions.js`
- `src/skript/linter.js`
- `src/completions-store.js`

Verify:

```powershell
npm run build
```

### Change Block Editor

Likely files:

- `src/block-editor.js`
- `src/block-definitions.js`

Verify:

```powershell
npm run test:block-definitions
npm run build
```

### Change GUI Builder

Likely files:

- `src/gui-builder.js`
- `src/gui-icon-assets.js`
- `scripts/generate-gui-icons.cjs`

Verify:

```powershell
npm run build
```

### Change File Tree

Likely file:

- `src/file-tree.js`

Verify:

```powershell
npm run build
```

### Change Terminal

Likely file:

- `src/terminal.js`

Verify:

```powershell
npm run build
```

### Change Settings

Likely files:

- `src/settings.js`
- `src/settings-presets.js`

Verify:

```powershell
npm run build
```

### Change Tauri Permissions / Native Commands

Likely files:

- `src-tauri/src/lib.rs`
- `src-tauri/src/main.rs`
- `src-tauri/capabilities/default.json`
- `src-tauri/tauri.conf.json`

Verify:

```powershell
npm run build
npm run tauri build
```

## What Not To Do

- Do not scan `node_modules/`.
- Do not scan `dist/`.
- Do not scan `src-tauri/target/`.
- Do not scan `promo/out/`.
- Do not rewrite large modules unless necessary.
- Do not add dependencies for small UI changes.
- Do not change Tauri CSP casually; it can break security or app loading.
- Do not modify generated schemas under `src-tauri/gen/` unless tool-generated.
- Do not commit generated videos in `promo/out/` unless user explicitly asks.
- Do not commit debug build artifacts from `src-tauri/target/`.
- Do not run Tauri builds for frontend-only edits.

## Quick Error Dictionary

`vite build` failure:

- Inspect the first actual error, usually syntax/import/path related.

`tauri build` failure:

- Check `src-tauri/tauri.conf.json`, Rust compile errors, and capabilities.

`command not found: tauri` or PowerShell equivalent:

- Use `npm run tauri ...` because Tauri CLI is a dependency.

`cannot find module`:

- Check package dependency and import path.

`CSP blocked resource`:

- Inspect `src-tauri/tauri.conf.json` CSP.
- Add only the narrow required domain/source.

`Git says no changes added to commit`:

- Run `git status --short`.
- Stage exact changed files.

## Response Style To Save Usage

For small edits:

```text
Done. Changed <files>.
Verified: npm run build.
```

For command help:

```text
Run:
<commands>
```

For failures:

```text
This failed because <short reason>.
Next command:
<command>
```

Avoid long summaries unless user asks.

## Future Updates To This File

When new stable facts are discovered, add them here instead of rediscovering every session.

Good things to add:

- release process
- artifact paths
- exact installer output paths
- known branch names/remotes
- external API endpoints
- common bugs/fixes
- architecture decisions

