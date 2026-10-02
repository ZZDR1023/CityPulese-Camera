import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildPassport, readStamps, addStamp, writeStamps, memoryStorageKey} from '../public/memory-passport.js';
const places = JSON.parse(await readFile(new URL('../data/places.json', import.meta.url)));
test('memory and wish passports distinguish self-records from fictional travel and only recommend enumerated points', () => {
  for (const place of places) {
    const memory = buildPassport(place, places, {mood: '和朋友的快乐', kind: 'memory'});
    const wish = buildPassport(place, places, {kind: 'wish'});
    assert.equal(memory.discovery, place.fact);assert.equal(memory.stamp, '记忆印章');assert.equal(memory.boundary, '用户记录');
    assert.equal(wish.stamp, '向往印章');assert.match(wish.boundary, /不代表真实到访/);
    assert.ok(places.some(p => p.id === memory.next.id && p.id !== place.id));
    assert.notEqual(memory.next.id, 'yingcheng-panda-park');
  }
  assert.match(buildPassport({id: 'custom', verified: false}, places).discovery, /暂无已核验/);
});
test('stamp collection stores only bounded point/type/date metadata, deduplicates, and tolerates disabled/corrupt storage', () => {
  const entries = addStamp([], {placeId: 'jingzhou-wall', kind: 'memory', date: '2026.10.02', photo: 'secret-photo', mood: 'secret-mood'});
  assert.deepEqual(entries, [{placeId: 'jingzhou-wall', kind: 'memory', date: '2026.10.02'}]);
  assert.equal(addStamp(entries, {...entries[0]}).length, 1);
  assert.equal(addStamp(entries, {...entries[0], kind: 'wish'}).length, 2);
  let stored; const storage = {setItem: (k, v) => {assert.equal(k, memoryStorageKey);stored = v;}, getItem: () => stored};
  assert.equal(writeStamps(storage, entries), true);assert.deepEqual(readStamps(storage), entries);
  assert.ok(!stored.includes('secret'));stored = '{';assert.deepEqual(readStamps(storage), []);
  const denied = {getItem() {throw Error('disabled');}, setItem() {throw Error('disabled');}};
  assert.deepEqual(readStamps(denied), []);assert.equal(writeStamps(denied, entries), false);
});
