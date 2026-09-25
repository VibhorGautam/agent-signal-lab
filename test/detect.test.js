import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreSignals} from '../src/detect.js';
test('explicit automation', () => { const r=scoreSignals({navigator:{webdriver:true}}); assert.equal(r.classification,'likely-automated'); assert.deepEqual(r.signals.map(s=>s.id),['webdriver']); });
test('no signals is unknown, not human', () => assert.equal(scoreSignals().classification,'unknown'));
test('regular event timing alone triggers review only', () => {
 const events=Array.from({length:12},(_,i)=>({type:'pointermove',t:i*10,x:i*5,y:i*5}));
 const r=scoreSignals({events}); assert.equal(r.classification,'review'); assert.equal(r.score,4);
});
test('irregular mouse movements avoid the regularity rules', () => {
 const events=Array.from({length:12},(_,i)=>({type:'pointermove',t:i*i*10,x:i*i,y:i*3}));
 assert.equal(scoreSignals({events}).classification,'unknown');
});
test('malformed events ignored',()=> assert.equal(scoreSignals({events:[null,{type:'pointermove',x:1}]}).classification,'unknown'));

test('long repeated human-like movement is review, not likely automated',()=> {
 const events=Array.from({length:150},(_,i)=>({type:'pointermove',t:i*16.67,x:i*8,y:50+i}));
 const r=scoreSignals({events});assert.equal(r.classification,'review');assert.ok(r.signals.some(s=>s.id==='repeated-step-trajectory'));
});

test('malformed snapshots fail open to unknown instead of crashing',()=> {
 for(const value of [null,{}, {events:null,navigator:null,request:null,window:null}, {events:'bad',navigator:12}]){
   const r=scoreSignals(value);assert.equal(r.classification,'unknown');assert.deepEqual(r.signals,[]);
 }
});
test('declared automation user agent is evidence',()=>{
 const r=scoreSignals({navigator:{userAgent:'ExampleBot (Playwright)'}});
 assert.equal(r.classification,'likely-automated');
 assert.equal(r.signals[0].id,'declared-automation');
});

test('shadowing the native webdriver getter is explicit tamper evidence',()=>{
 const r=scoreSignals({navigator:{webdriver:undefined,webdriverOwnProperty:true}});
 assert.equal(r.classification,'likely-automated');
 assert.ok(r.signals.some(s=>s.id==='webdriver-own-property'));
});

test('ChromeDriver constructor alias is explicit automation evidence',()=>{
 const r=scoreSignals({window:{globalNames:['cdc_adoQpoasnfa76pfcZLmcfl_Array']}});
 assert.equal(r.classification,'likely-automated');
 assert.ok(r.signals.some(s=>s.id==='chromedriver-global'));
});
test('a similar but non-matching global does not trigger',()=>{
 const r=scoreSignals({window:{globalNames:['cdc_example_Array']}});
 assert.equal(r.classification,'unknown');
});

test('non-string globalNames do not crash or become evidence',()=>{
 const r=scoreSignals({window:{globalNames:[null,42,{},'ordinary']}});
 assert.equal(r.classification,'unknown');
});
