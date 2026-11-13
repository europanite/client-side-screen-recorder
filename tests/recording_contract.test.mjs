import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const app = readFileSync(new URL('../frontend/app/src/App.tsx', import.meta.url), 'utf8');
const recorder = readFileSync(new URL('../frontend/app/src/lib/recorder.ts', import.meta.url), 'utf8');
const hook = readFileSync(new URL('../frontend/app/src/hooks/useScreenRecorder.ts', import.meta.url), 'utf8');
test('compact UI and build marker', () => {
  assert.match(app, /data-build="rec-20261113-v8"/);
  assert.doesNotMatch(app, /HOW IT WORKS|<h1>/);
});
test('registers WASM AAC encoder before output starts', () => {
  assert.match(recorder, /registerAacEncoder\(\)/);
  assert.ok(recorder.indexOf('registerAacEncoder();') < recorder.indexOf('await this.output.start()'));
});
test('encoder errors and empty video block download', () => {
  assert.match(recorder, /videoPackets === 0/);
  assert.match(recorder, /if \(this\.encoderError\) throw this\.encoderError/);
  assert.match(hook, /encoderErrorRef\.current/);
  assert.match(hook, /setResult\(null\)/);
});
