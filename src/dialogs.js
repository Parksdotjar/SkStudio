// Themed replacements for window.alert / confirm / prompt.
// All return Promises; UI is centered, blurred backdrop, branded to the theme.

let currentDialog = null;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function makeDialog({ type, title, message, defaultValue, placeholder, okLabel, cancelLabel, danger }) {
  return new Promise((resolve) => {
    if (currentDialog) currentDialog.remove();

    const isPrompt = type === "prompt";
    const isAlert  = type === "alert";

    const overlay = document.createElement("div");
    overlay.className = "dialog-overlay";
    overlay.innerHTML = `
      <div class="dialog-backdrop"></div>
      <div class="dialog-window" role="dialog" aria-modal="true">
        ${title ? `<div class="dialog-header"><h3>${escapeHtml(title)}</h3></div>` : ""}
        <div class="dialog-body">
          ${message ? `<p class="dialog-message">${escapeHtml(message)}</p>` : ""}
          ${isPrompt ? `<input type="text" class="dialog-input" placeholder="${escapeHtml(placeholder || "")}" value="${escapeHtml(defaultValue || "")}" spellcheck="false" />` : ""}
        </div>
        <div class="dialog-footer">
          ${!isAlert ? `<button class="dialog-btn dialog-btn-secondary" data-action="cancel">${escapeHtml(cancelLabel || "Cancel")}</button>` : ""}
          <button class="dialog-btn dialog-btn-primary${danger ? " dialog-btn-danger" : ""}" data-action="ok">${escapeHtml(okLabel || "OK")}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    currentDialog = overlay;

    const input    = overlay.querySelector(".dialog-input");
    const okBtn    = overlay.querySelector('[data-action="ok"]');
    const cancelBtn = overlay.querySelector('[data-action="cancel"]');
    const backdrop = overlay.querySelector(".dialog-backdrop");

    const cleanup = (value) => {
      overlay.remove();
      if (currentDialog === overlay) currentDialog = null;
      document.removeEventListener("keydown", onKey);
      resolve(value);
    };

    const onOk = () => {
      if (isPrompt) cleanup(input.value);
      else if (isAlert) cleanup();
      else cleanup(true);
    };
    const onCancel = () => cleanup(isPrompt ? null : false);

    okBtn.addEventListener("click", onOk);
    cancelBtn?.addEventListener("click", onCancel);
    backdrop.addEventListener("click", isAlert ? onOk : onCancel);

    function onKey(e) {
      if (e.key === "Enter" && !e.shiftKey) {
        // Don't intercept Enter inside the input if it's just navigating
        if (e.target.tagName === "TEXTAREA") return;
        e.preventDefault();
        onOk();
      } else if (e.key === "Escape") {
        e.preventDefault();
        isAlert ? onOk() : onCancel();
      }
    }
    document.addEventListener("keydown", onKey);

    // Initial focus
    requestAnimationFrame(() => {
      if (input) { input.focus(); input.select(); }
      else okBtn.focus();
    });
  });
}

/** Themed replacement for window.alert. Resolves when dismissed. */
export function showAlert(message, options = {}) {
  return makeDialog({
    type: "alert",
    title: options.title || "SkStudio",
    message,
    okLabel: options.okLabel || "OK",
  });
}

/** Themed replacement for window.confirm. Resolves to true/false. */
export function showConfirm(message, options = {}) {
  return makeDialog({
    type: "confirm",
    title: options.title,
    message,
    okLabel: options.okLabel || "Confirm",
    cancelLabel: options.cancelLabel || "Cancel",
    danger: !!options.danger,
  });
}

/** Themed replacement for window.prompt. Resolves to a string, or null if cancelled. */
export function showPrompt(message, options = {}) {
  return makeDialog({
    type: "prompt",
    title: options.title,
    message,
    placeholder: options.placeholder || "",
    defaultValue: options.defaultValue || "",
    okLabel: options.okLabel || "OK",
    cancelLabel: options.cancelLabel || "Cancel",
  });
}
