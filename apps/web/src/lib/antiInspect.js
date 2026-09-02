// Multi-layered Anti-Inspect, Anti-Screenshot & DevTools Protection Module

export function isDevToolsOpen() {
  return false;
}

export function initAntiInspect() {
  const scrubClipboard = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(
          "⚠️ CLASSIFIED: FILE UNDER MYSTERY EVIDENCE. SCREEN CAPTURE IS RESTRICTED."
        ).catch(() => {});
      }
    } catch (e) {}
  };

  const isForbiddenKey = (e) => {
    const key = e.key ? e.key.toUpperCase() : "";
    const code = e.code ? e.code.toUpperCase() : "";
    const keyCode = e.keyCode || e.which;
    const isCtrlOrMeta = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;

    // F12 or Developer Tools Shortcuts (Ctrl+Shift+I / J / C)
    if (keyCode === 123 || key === "F12" || code === "F12") return true;
    if (isCtrlOrMeta && isShift && (key === "I" || key === "J" || key === "C" || key === "K" || key === "S")) return true;

    // View Source / Save Page (Ctrl+U, Ctrl+S)
    if (isCtrlOrMeta && (key === "U" || key === "S" || keyCode === 85 || keyCode === 83)) return true;

    // Print Screen / Snipping Tool
    if (key === "PRINTSCREEN" || key === "SNAPSHOT" || code === "PRINTSCREEN" || keyCode === 44) {
      scrubClipboard();
      return true;
    }

    return false;
  };

  const blockShortcuts = (e) => {
    if (isForbiddenKey(e)) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }
  };

  const preventDefaultHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  // Attach root listeners
  window.addEventListener("keydown", blockShortcuts, true);
  document.addEventListener("keydown", blockShortcuts, true);
  window.addEventListener("contextmenu", preventDefaultHandler, true);
  document.addEventListener("contextmenu", preventDefaultHandler, true);

  return () => {
    window.removeEventListener("keydown", blockShortcuts, true);
    document.removeEventListener("keydown", blockShortcuts, true);
    window.removeEventListener("contextmenu", preventDefaultHandler, true);
    document.removeEventListener("contextmenu", preventDefaultHandler, true);
  };
}
