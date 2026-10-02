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
test('missing app falls back once; blur alone does not falsely mark a successful launch', () => {
  const env = environment();openAppWithFallback('app://search', 'https://web.example/', env);
  assert.equal(env.window.location.href, 'app://search');
  env.window.dispatchEvent(new Event('blur'));env.flush();
  assert.equal(env.window.location.href, 'https://web.example/');assert.equal(env.timers.size, 0);
});
test('successful pagehide or backgrounding cancels the web redirect', () => {
  for (const event of ['pagehide', 'visibilitychange']) {
    const env = environment();openAppWithFallback('app://search', 'https://web.example/', env);
    if (event === 'pagehide') env.window.dispatchEvent(new Event(event));
    else {env.document.hidden = true;env.document.dispatchEvent(new Event(event));}
    env.document.hidden = false;env.flush();assert.equal(env.window.location.href, 'app://search');
  }
});
test('rapid second click cancels the previous timer; desktop opens only the web page', () => {
  const env = environment();openAppWithFallback('app://one', 'https://one.example/', env);openAppWithFallback('app://two', 'https://two.example/', env);
  assert.equal(env.timers.size, 1);env.flush();assert.equal(env.window.location.href, 'https://two.example/');
  const desktop = environment(false);openAppWithFallback('app://one', 'https://one.example/', desktop);
  assert.deepEqual(desktop.opened, [['https://one.example/', '_blank', 'noopener,noreferrer']]);assert.equal(desktop.timers.size, 0);
});
