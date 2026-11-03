import test from 'node:test';
import assert from 'node:assert/strict';
import {formatKST,addDays,normalizeFeed,emptyFeed} from '../src/feed.mjs';
test('KST is calculated independently of server timezone',()=>assert.equal(formatKST(new Date('2026-11-02T16:00:00Z')),'2026-11-03'));
test('date rolling across months',()=>assert.equal(addDays('2026-11-28',4),'2026-12-02'));
test('unknown by default, zero remaining enforces full',()=>{
 const out=normalizeFeed({slots:[{date:'2026-11-03',start:'08:00',status:'available',remaining:0},{date:'2026-11-03',start:'11:00'}]},'deepstation');
 assert.deepEqual(out.map(x=>x.status),['full','unknown']);
});
test('invalid statuses, dates, times are never promoted to available',()=>{
 const out=normalizeFeed({slots:[{date:'bogus',start:'08:00',status:'available'},{date:'2026-11-03',start:'25:00',status:'available'},{date:'2026-11-03',start:'08:00',status:'YES'}]},'paradive');
 assert.equal(out.length,0);
});
test('old snapshot fails closed',()=>assert.throws(()=>normalizeFeed({updatedAt:'2020-01-01T00:00:00Z',slots:[]},'deepstation'),/fresh/));
test('empty feed never indicates either provider is connected',()=>{
 const e=emptyFeed();assert.equal(e.sources.deepstation.connected,false);assert.equal(e.slots.length,0);
});
