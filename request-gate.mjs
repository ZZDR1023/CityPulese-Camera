import {isIP} from 'node:net';

export function clientAddress(req, trustProxy = false) {
  const remote = req.socket.remoteAddress || 'unknown';
  // Only trust a local reverse proxy and a single address, not arbitrary chains.
  const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote);
  const forwarded = req.headers['x-real-ip'];
  return trustProxy && local && typeof forwarded === 'string' && isIP(forwarded) ? forwarded : remote;
}

export class RequestGate {
  constructor({concurrency, maxQueue = 6, cooldownMs = 5000, maxCalls = 120, windowMs = 3600000, now = Date.now}) {
    Object.assign(this, {concurrency, maxQueue, cooldownMs, maxCalls, windowMs, now});
    this.active = 0;
    this.queue = [];
    this.pending = new Set();
    this.last = new Map();
    this.calls = [];
  }
  acquire(key, signal) {
    const fail = message => Object.assign(new Error(message), {status: 429});
    const now = this.now();
    for (const [id, time] of this.last) if (now - time >= this.cooldownMs) this.last.delete(id);
    if (signal?.aborted) return Promise.reject(signal.reason || new Error('Canceled'));
    if (this.pending.has(key) || this.last.has(key)) return Promise.reject(fail('你已有生成任务或刚刚生成过，请稍等几秒再试。'));
    if (this.active >= this.concurrency && this.queue.length >= this.maxQueue) return Promise.reject(fail('体验人数较多，等待队列已满。照片已保留，请稍后再试。'));
    return new Promise((resolve, reject) => {
      const entry = {key, signal, resolve, reject, abort: null};
      entry.abort = () => {
        const index = this.queue.indexOf(entry);
        if (index >= 0) {
          this.queue.splice(index, 1);
          this.pending.delete(key);
          reject(signal.reason || new Error('Canceled'));
        }
      };
      this.pending.add(key);
      if (this.active < this.concurrency) this.start(entry);
      else {
        this.queue.push(entry);
        signal?.addEventListener('abort', entry.abort, {once: true});
      }
    });
  }
  start(entry) {
    entry.signal?.removeEventListener('abort', entry.abort);
    const now = this.now();
    this.calls = this.calls.filter(time => now - time < this.windowMs);
    if (entry.signal?.aborted || this.calls.length >= this.maxCalls) {
      this.pending.delete(entry.key);
      entry.reject(entry.signal?.reason || Object.assign(new Error('本时段生成额度已用完，请稍后再试。'), {status: 429}));
      this.drain();
      return;
    }
    this.calls.push(now);
    this.active++;
    let released = false;
    entry.resolve(() => {
      if (released) return;
      released = true;
      this.active--;
      this.pending.delete(entry.key);
      this.last.set(entry.key, this.now());
      this.drain();
    });
  }
  drain() {
    while (this.active < this.concurrency && this.queue.length) this.start(this.queue.shift());
  }
  snapshot() { return {active: this.active, waiting: this.queue.length, concurrency: this.concurrency, maxQueue: this.maxQueue}; }
}
