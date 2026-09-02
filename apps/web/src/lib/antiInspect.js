// Multi-layered Anti-Inspect, Anti-Screenshot & DevTools Protection Module

export function isDevToolsOpen() {
  try {
    const threshold = 160;
    const widthDiff = window.outerWidth - window.innerWidth > threshold;
    const heightDiff = window.outerHeight - window.innerHeight > threshold;
    return widthDiff || heightDiff;
  } catch (e) {
    return false;
  }
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
    const isAlt = e.altKey;

    // F12 key
    if (keyCode === 123 || key === "F12" || code === "F12") return true;

    // Developer Tools Shortcuts: Ctrl+Shift+I / J / C / K / E / S
    if (isCtrlOrMeta && isShift && (key === "I" || key === "J" || key === "C" || key === "K" || key === "E" || key === "S")) {
      return true;
    }

    // Mac DevTools: Cmd+Option+I / J / C / U / K
    if (e.metaKey && isAlt && (key === "I" || key === "J" || key === "C" || key === "U" || key === "K")) {
      return true;
    }

    // View Source (Ctrl+U) / Save Page (Ctrl+S) / Print (Ctrl+P)
    if (isCtrlOrMeta && (key === "U" || key === "S" || key === "P" || keyCode === 85 || keyCode === 83 || keyCode === 80)) {
      return true;
    }

    // Print Screen / Snipping Tool (Keycode 44)
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
      scrubClipboard();
      return false;
    }
  };

  const preventDefaultHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  // Periodic DevTools Check (Redirects non-admin teams if inspector is opened)
  const checkInterval = setInterval(() => {
    if (isDevToolsOpen()) {
      try {
        const session = localStorage.getItem("mystery_team_session");
        const parsed = session ? JSON.parse(session) : null;
        if (!parsed?.isAdmin && parsed?.role !== "admin") {
          sessionStorage.setItem("mystery_lockout_reason", "devtools");
          if (!window.location.hash.includes("security-lockout")) {
            window.location.hash = "#/security-lockout";
          }
        }
      } catch (e) {}
    }
  }, 1000);

  // Attach root listeners
  window.addEventListener("keydown", blockShortcuts, true);
  window.addEventListener("keyup", (e) => {
    const key = e.key ? e.key.toUpperCase() : "";
    if (key === "PRINTSCREEN" || key === "SNAPSHOT" || e.keyCode === 44) {
      scrubClipboard();
    }
  }, true);

  document.addEventListener("keydown", blockShortcuts, true);
  document.addEventListener("keyup", blockShortcuts, true);
  window.addEventListener("contextmenu", preventDefaultHandler, true);
  document.addEventListener("contextmenu", preventDefaultHandler, true);
  document.addEventListener("dragstart", preventDefaultHandler, true);

  return () => {
    clearInterval(checkInterval);
    window.removeEventListener("keydown", blockShortcuts, true);
    document.removeEventListener("keydown", blockShortcuts, true);
    document.removeEventListener("keyup", blockShortcuts, true);
    window.removeEventListener("contextmenu", preventDefaultHandler, true);
    document.removeEventListener("contextmenu", preventDefaultHandler, true);
    document.removeEventListener("dragstart", preventDefaultHandler, true);
  };
}
