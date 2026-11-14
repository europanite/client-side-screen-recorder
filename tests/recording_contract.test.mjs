import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const app = readFileSync(new URL('../frontend/app/src/App.tsx', import.meta.url), 'utf8');
const recorder = readFileSync(new URL('../frontend/app/src/lib/recorder.ts', import.meta.url), 'utf8');
const hook = readFileSync(new URL('../frontend/app/src/hooks/useScreenRecorder.ts', import.meta.url), 'utf8');
test('large application title links directly to the GitHub repository without a separate link or version', () => {
  const compact = readFileSync(new URL('../frontend/app/src/compact.css', import.meta.url), 'utf8');
  assert.match(app, /const REPO_URL = 'https:\/\/github\.com\/europanite\/client-side-screen-recorder'/);
  assert.match(app, /<a className="brand" href=\{REPO_URL\}[^>]*>\s*<span className="brand-icon">●<\/span><span>Client Side Screen Recorder<\/span>\s*<\/a>/);
  assert.doesNotMatch(app, /className="repo-link"|GitHub repository\s*<\/a>/);
  assert.doesNotMatch(app, /build-mark|data-build=|>v8<\/small>/);
  assert.match(compact, /\.brand \{[^}]*font-size: 26px;[^}]*text-decoration: none;/);
  assert.match(compact, /\.brand:focus-visible \{/);
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
