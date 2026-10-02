import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openAppWithFallback} from '../public/app-links.js';
function environment(mobile = true) {
  const win = new EventTarget(), doc = new EventTarget();
  const timers = new Map(); let n = 0;
  win.location = {href: ''}; if (mobile) win.ontouchstart = true;
  const opened = []; win.open = (...args) => opened.push(args);
  doc.hidden = false;
  return {window: win, document: doc, navigator: {maxTouchPoints: mobile ? 1 : 0, userAgent: 'test'},
    setTimeout: cb => {timers.set(++n, cb); return n;}, clearTimeout: id => timers.delete(id),
    flush: () => {for (const [id, cb] of [...timers]) {timers.delete(id); cb();}}, timers, opened};
}
test('missing app attempts launch and does not forcibly redirect window; blur/cancel keeps user on page', () => {
  const env = environment();openAppWithFallback('app://search', 'https://web.example/', env);
  assert.equal(env.window.location.href, 'app://search');
  env.window.dispatchEvent(new Event('blur'));env.flush();
  // Safe design: does not hijack the page URL away from the user
  assert.equal(env.window.location.href, 'app://search');assert.equal(env.timers.size, 0);
});
test('successful pagehide or backgrounding cancels the pending toast/timer', () => {
  for (const event of ['pagehide', 'visibilitychange']) {
    const env = environment();openAppWithFallback('app://search', 'https://web.example/', env);
    if (event === 'pagehide') env.window.dispatchEvent(new Event(event));
    else {env.document.hidden = true;env.document.dispatchEvent(new Event(event));}
    env.document.hidden = false;env.flush();assert.equal(env.window.location.href, 'app://search');
  }
});
test('rapid second click cancels the previous timer; desktop opens only the web page', () => {
  const env = environment();openAppWithFallback('app://one', 'https://one.example/', env);openAppWithFallback('app://two', 'https://two.example/', env);
  assert.equal(env.timers.size, 1);assert.equal(env.window.location.href, 'app://two');
  env.flush();
  assert.equal(env.window.location.href, 'app://two');
  const desktop = environment(false);openAppWithFallback('app://one', 'https://one.example/', desktop);
  assert.deepEqual(desktop.opened, [['https://one.example/', '_blank', 'noopener,noreferrer']]);assert.equal(desktop.timers.size, 0);
});
test('toast element is populated with web link and dismissible', () => {
  const env = environment();
  const toastLink = {}, toastClose = {};
  const toastEl = {hidden: true, querySelector: (sel) => sel === '#app-link-toast-action' ? toastLink : sel === '#app-link-toast-close' ? toastClose : null};
  env.document.getElementById = (id) => id === 'app-link-toast' ? toastEl : null;
  openAppWithFallback('app://target', 'https://web.target/', env);
  assert.equal(toastEl.hidden, false);
  assert.equal(toastLink.href, 'https://web.target/');
  toastClose.onclick({preventDefault() {}});
  assert.equal(toastEl.hidden, true);
});
