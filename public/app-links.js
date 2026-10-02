// A hidden page/pagehide is evidence of leaving the browser; blur alone can
// just be an OS permission dialog. Never schedule multiple fallback redirects.
let cancelPending = () => {};
export function openAppWithFallback(appScheme, webUrl, env = {}) {
  const win = env.window || window;
  const doc = env.document || document;
  const nav = env.navigator || navigator;
  const schedule = env.setTimeout || setTimeout;
  const unschedule = env.clearTimeout || clearTimeout;
  cancelPending();
  const mobile = ('ontouchstart' in win) || nav.maxTouchPoints > 0 || /Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent);
  if (!mobile) {
    win.open(webUrl, '_blank', 'noopener,noreferrer');
    return () => {};
  }
  let launched = false, timer;
  const cleanup = () => {
    if (timer !== undefined) unschedule(timer);
    win.removeEventListener('pagehide', onLeave);
    doc.removeEventListener('visibilitychange', onVisibility);
    if (cancelPending === cleanup) cancelPending = () => {};
  };
  const onLeave = () => { launched = true; cleanup(); };
  const onVisibility = () => { if (doc.hidden) onLeave(); };
  win.addEventListener('pagehide', onLeave, {once: true});
  doc.addEventListener('visibilitychange', onVisibility);
  cancelPending = cleanup;
  timer = schedule(() => {
    const shouldFallback = !launched && !doc.hidden;
    cleanup();
    if (shouldFallback) win.location.href = webUrl;
  }, 2800);
  try { win.location.href = appScheme; }
  catch { cleanup(); if (!doc.hidden) win.location.href = webUrl; }
  return cleanup;
}
