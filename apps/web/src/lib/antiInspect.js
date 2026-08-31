// Multi-layered Anti-Inspect, Anti-Screenshot & DevTools Protection Module

export function isDevToolsOpen() {
  const threshold = 160;
  const widthDiff = window.outerWidth - window.innerWidth > threshold;
  const heightDiff = window.outerHeight - window.innerHeight > threshold;
  return widthDiff || heightDiff;
}

export function initAntiInspect() {
  const showBlackout = () => {
    const veil = document.getElementById("security-blackout-veil");
    if (veil) veil.classList.remove("hidden");
  };

  const hideBlackout = () => {
    const veil = document.getElementById("security-blackout-veil");
    if (veil) {
      setTimeout(() => {
        veil.classList.add("hidden");
      }, 100);
    }
  };

  const scrubClipboard = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(
          "⚠️ SECURITY VIOLATION: CLASSIFIED FILE UNDER MYSTERY EVIDENCE. SCREEN CAPTURE IS PROHIBITED."
        ).catch(() => {});
      }
    } catch (e) {}
  };

  const triggerFocusLockout = () => {
    try {
      const path = window.location.pathname;
      // Only lock out during active investigation levels (not on admin, landing, or presentation screens)
      if (path && path.startsWith("/investigate")) {
        sessionStorage.setItem(
          "mystery_last_active_route",
          window.location.pathname + window.location.search
        );
        sessionStorage.setItem("mystery_lockout_reason", "focus_loss");
        sessionStorage.setItem("mystery_lockout_until", String(Date.now() + 20000));
        window.location.replace("/security-lockout?reason=focus_loss");
      }
    } catch (e) {}
  };

  const isForbiddenModifierKey = (e) => {
    const key = e.key ? e.key.toUpperCase() : "";
    const keyCode = e.keyCode || e.which;

    // 1. Meta / Windows Key / Cmd
    if (key === "META" || key === "OS" || e.metaKey) return true;

    // 2. Control / Ctrl
    if (key === "CONTROL" || e.ctrlKey) return true;

    // 3. Alt / Option
    if (key === "ALT" || key === "ALTGRAPH" || e.altKey) return true;

    // 4. PrintScreen / Screenshot Keys
    if (key === "PRINTSCREEN" || keyCode === 44) return true;

    // 5. Allow F11 for Fullscreen Mode while blocking other function keys (F1-F10, F12)
    if (key === "F11" || keyCode === 122) return false;
    if (key.startsWith("F") && key.length > 1 && !isNaN(key.slice(1))) return true;

    // 6. Context Menu / Insert / ScrollLock
    if (key === "CONTEXTMENU" || key === "INSERT" || key === "SCROLLLOCK" || key === "PAUSE") return true;

    return false;
  };

  // 1. Intercept and completely block all DevTools & Screenshot keyboard shortcuts
  const blockShortcuts = (e) => {
    if (isForbiddenModifierKey(e)) {
      showBlackout();
      scrubClipboard();
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }
  };

  const handleKeyUp = (e) => {
    if (!e.metaKey && !e.ctrlKey && !e.altKey) {
      hideBlackout();
    }
  };

  // Attach keydown & keyup listeners at the root capture phase
  window.addEventListener("keydown", blockShortcuts, true);
  window.addEventListener("keyup", handleKeyUp, true);
  document.addEventListener("keydown", blockShortcuts, true);
  document.addEventListener("keyup", handleKeyUp, true);

  // 2. Anti-Snipping Tool Defense: Black out screen whenever window loses focus during investigation
  const handleWindowBlur = () => {
    showBlackout();
    scrubClipboard();
  };

  const handleWindowFocus = () => {
    hideBlackout();
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      showBlackout();
      scrubClipboard();
    } else {
      hideBlackout();
    }
  };

  window.addEventListener("blur", handleWindowBlur);
  window.addEventListener("focus", handleWindowFocus);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // 3. Disable context menu, text selection and drag
  const preventDefaultHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  window.addEventListener("contextmenu", preventDefaultHandler, true);
  document.addEventListener("contextmenu", preventDefaultHandler, true);
  document.addEventListener("selectstart", preventDefaultHandler, true);
  document.addEventListener("dragstart", preventDefaultHandler, true);

  // 4. Silence and protect console methods from leaking sensitive info
  try {
    const noop = () => {};
    window.console.log = noop;
    window.console.info = noop;
    window.console.warn = noop;
    window.console.debug = noop;
    window.console.table = noop;
    window.console.dir = noop;
  } catch (e) {}

  // 5. Real-time DevTools Monitor with smoothed consecutive frame verification
  let consecutiveOpenCount = 0;

  const checkDevTools = () => {
    if (isDevToolsOpen()) {
      consecutiveOpenCount++;
      if (consecutiveOpenCount >= 3) {
        if (window.location.pathname !== "/security-lockout") {
          sessionStorage.setItem(
            "mystery_last_active_route",
            window.location.pathname + window.location.search
          );
          window.location.replace("/security-lockout");
        }
      }
    } else {
      consecutiveOpenCount = 0;
    }
  };

  window.addEventListener("resize", checkDevTools, { passive: true });
  const checkInterval = setInterval(checkDevTools, 500);

  return () => {
    clearInterval(checkInterval);
    window.removeEventListener("resize", checkDevTools);
    window.removeEventListener("keydown", blockShortcuts, true);
    window.removeEventListener("keyup", blockShortcuts, true);
    document.removeEventListener("keydown", blockShortcuts, true);
    document.removeEventListener("keyup", blockShortcuts, true);
    window.removeEventListener("blur", handleWindowBlur);
    window.removeEventListener("focus", handleWindowFocus);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("contextmenu", preventDefaultHandler, true);
    document.removeEventListener("contextmenu", preventDefaultHandler, true);
    document.removeEventListener("selectstart", preventDefaultHandler, true);
    document.removeEventListener("dragstart", preventDefaultHandler, true);
  };
}
