// Auto-update checker — uses GitHub Releases API to compare tags
// Tags must be formatted exactly: v1, v2, v3, etc.

export const CURRENT_VERSION = "v5";

const REPO        = "Parksdotjar/SkStudio";
const API_URL     = `https://api.github.com/repos/${REPO}/releases/latest`;
const DISMISS_KEY = "skstudio.update.dismissed";

// Tauri invoke — only available in the packaged app
let invoke = null;
try { ({ invoke } = await import("@tauri-apps/api/core")); } catch {}

function parseVer(tag) {
  return parseInt((tag || "").replace(/^v/i, ""), 10) || 0;
}

/**
 * Fetch the latest GitHub release and compare with CURRENT_VERSION.
 * Returns { hasUpdate, latest, current, downloadUrl, releaseUrl, hasExe, error }
 */
export async function checkForUpdate() {
  try {
    const res = await fetch(API_URL, {
      headers: { Accept: "application/vnd.github.v3+json" },
    });
    if (!res.ok) throw new Error(`GitHub returned ${res.status}`);
    const data = await res.json();

    const latest     = data.tag_name || "";
    const releaseUrl = data.html_url || `https://github.com/${REPO}/releases/latest`;

    // Prefer a .exe asset; fall back to the release page
    const exeAsset   = (data.assets || []).find(a => a.name.toLowerCase().endsWith(".exe"));
    const downloadUrl = exeAsset?.browser_download_url || releaseUrl;
    const hasExe      = !!exeAsset;

    const hasUpdate = parseVer(latest) > parseVer(CURRENT_VERSION);
    return { hasUpdate, latest, current: CURRENT_VERSION, downloadUrl, releaseUrl, hasExe, error: null };
  } catch (e) {
    return { hasUpdate: false, latest: null, current: CURRENT_VERSION, downloadUrl: null, releaseUrl: null, hasExe: false, error: e.message };
  }
}

/**
 * Download the exe via Rust, then silently run the installer and relaunch.
 * onProgress(state) — called with "downloading" | "installing" | "error"
 */
export async function downloadAndInstall(downloadUrl, onProgress) {
  if (!invoke) {
    // Dev/browser fallback — just open the URL
    window.open(downloadUrl, "_blank");
    return;
  }

  try {
    onProgress("downloading");
    const installerPath = await invoke("download_update", { url: downloadUrl });

    onProgress("installing");
    // apply_update exits the process — nothing after this runs
    await invoke("apply_update", { installerPath });
  } catch (e) {
    onProgress("error", e);
  }
}

/** Returns true if the user already dismissed this specific version's toast. */
export function wasDismissed(version) {
  return localStorage.getItem(DISMISS_KEY) === String(version);
}

/** Remember that the user dismissed the toast for this version. */
export function dismissVersion(version) {
  localStorage.setItem(DISMISS_KEY, String(version));
}
