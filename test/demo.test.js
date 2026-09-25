import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../examples/demo.html',import.meta.url),'utf8');
test('demo has a title, viewport and accessible assessment area',()=>{
 assert.match(html,/<title>Agent Signal Lab/);
 assert.match(html,/name="viewport"/);
 assert.match(html,/id="assess" type="button"/);
 assert.match(html,/aria-live="polite"/);
});
test('demo does not embed network upload code or remote scripts',()=>{
 assert.doesNotMatch(html,/<script[^>]+src=/i);
 assert.doesNotMatch(html,/\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket)\s*\(/i);
 assert.match(html,/from '\.\.\/src\/detect\.js'/);
});
