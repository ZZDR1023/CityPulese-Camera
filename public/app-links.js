// Safe non-intrusive mobile app launcher:
// Attempts to open the native app scheme without forcibly redirecting the page on timeout.
// Shows a lightweight, dismissible toast with a manual web fallback link so users who
// cancel the OS dialog or hesitate are never hijacked away from their paper studio.
let cancelPending = () => {};

export function openAppWithFallback(appScheme, webUrl, env = {}) {
  const win = env.window || (typeof window !== 'undefined' ? window : null);
  const doc = env.document || (typeof document !== 'undefined' ? document : null);
  const nav = env.navigator || (typeof navigator !== 'undefined' ? navigator : null);
  const schedule = env.setTimeout || setTimeout;
  const unschedule = env.clearTimeout || clearTimeout;
  cancelPending();

  const mobile = win && (('ontouchstart' in win) || (nav && nav.maxTouchPoints > 0) || (nav && /Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent)));
  if (!mobile) {
    if (win && win.open) win.open(webUrl, '_blank', 'noopener,noreferrer');
    return () => {};
  }

  let toastTimer;
  const cleanup = () => {
    if (toastTimer !== undefined) unschedule(toastTimer);
    if (doc && doc.getElementById) {
      const toast = doc.getElementById('app-link-toast');
      if (toast) toast.hidden = true;
    }
    if (win && win.removeEventListener) {
      win.removeEventListener('pagehide', onLeave);
    }
    if (doc && doc.removeEventListener) {
      doc.removeEventListener('visibilitychange', onVisibility);
    }
    if (cancelPending === cleanup) cancelPending = () => {};
  };

  const onLeave = () => { cleanup(); };
  const onVisibility = () => { if (doc && doc.hidden) cleanup(); };

  if (win && win.addEventListener) win.addEventListener('pagehide', onLeave, {once: true});
  if (doc && doc.addEventListener) doc.addEventListener('visibilitychange', onVisibility);
  cancelPending = cleanup;

  // Attempt launching native App scheme
  try { win.location.href = appScheme; } catch {}

  // Show non-intrusive toast allowing optional manual web navigation
  if (doc && doc.getElementById) {
    const toast = doc.getElementById('app-link-toast');
    if (toast) {
      const link = toast.querySelector('#app-link-toast-action');
      if (link) {
        link.href = webUrl;
        link.onclick = () => { cleanup(); };
      }
      const closeBtn = toast.querySelector('#app-link-toast-close');
      if (closeBtn) {
        closeBtn.onclick = (e) => {
          e.preventDefault();
          cleanup();
        };
      }
      toast.hidden = false;
    }
  }

  // Auto dismiss toast after 5 seconds without changing window.location
  toastTimer = schedule(() => {
    cleanup();
  }, 5000);

  return cleanup;
}
