// Multi-layered Anti-Inspect & DevTools Protection Module

export function isDevToolsOpen() {
  const threshold = 160;
  const widthDiff = window.outerWidth - window.innerWidth > threshold;
  const heightDiff = window.outerHeight - window.innerHeight > threshold;
  return widthDiff || heightDiff;
}

export function initAntiInspect() {
  // 1. Intercept and completely block all DevTools keyboard shortcuts
  const blockShortcuts = (e) => {
    const key = e.key ? e.key.toUpperCase() : "";
    const keyCode = e.keyCode || e.which;
    const isCtrl = e.ctrlKey || e.metaKey; // Ctrl (Windows/Linux) or Cmd (Mac)
    const isShift = e.shiftKey;
    const isAlt = e.altKey;

    // F12 key (123)
    if (key === "F12" || keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }

    // Ctrl + Shift + I / J / C / K / E / S
    if (isCtrl && isShift && ["I", "J", "C", "K", "E", "S"].includes(key)) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }

    // Mac specific: Cmd + Option + I / J / C / U / K
    if (e.metaKey && isAlt && ["I", "J", "C", "U", "K"].includes(key)) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }

    // Ctrl + U (View Page Source)
    if (isCtrl && (key === "U" || keyCode === 85)) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }

    // Ctrl + S (Save Page)
    if (isCtrl && (key === "S" || keyCode === 83)) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }
  };

  // Attach keydown & keyup listeners at the root capture phase
  window.addEventListener("keydown", blockShortcuts, true);
  window.addEventListener("keyup", blockShortcuts, true);
  document.addEventListener("keydown", blockShortcuts, true);
  document.addEventListener("keyup", blockShortcuts, true);

  // 2. Disable context menu, text selection and drag
  const preventDefaultHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  window.addEventListener("contextmenu", preventDefaultHandler, true);
  document.addEventListener("contextmenu", preventDefaultHandler, true);
  document.addEventListener("selectstart", preventDefaultHandler, true);
  document.addEventListener("dragstart", preventDefaultHandler, true);

  // 3. Silence and protect console methods from leaking sensitive info
  try {
    const noop = () => {};
    window.console.log = noop;
    window.console.info = noop;
    window.console.warn = noop;
    window.console.debug = noop;
    window.console.table = noop;
    window.console.dir = noop;
  } catch (e) {}

  // 4. Real-time DevTools Monitor with smoothed consecutive frame verification
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
    window.removeEventListener("contextmenu", preventDefaultHandler, true);
    document.removeEventListener("contextmenu", preventDefaultHandler, true);
    document.removeEventListener("selectstart", preventDefaultHandler, true);
    document.removeEventListener("dragstart", preventDefaultHandler, true);
  };
}
