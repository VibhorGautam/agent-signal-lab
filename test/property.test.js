import test from 'node:test';import assert from 'node:assert/strict';import {scoreSignals} from '../src/detect.js';
function sequence(n,dt=17){return Array.from({length:n},(_,i)=>({type:'pointermove',x:i*8,y:i*8,t:i*dt}));}
test('short regular trace remains review not automated',()=>assert.equal(scoreSignals({events:sequence(12)}).classification,'review'));
test('long repeated steps are flagged',()=>assert.equal(scoreSignals({events:sequence(120)}).classification,'review'));
test('no active block by default',()=>assert.equal(scoreSignals({navigator:{webdriver:false}}).classification,'unknown'));
