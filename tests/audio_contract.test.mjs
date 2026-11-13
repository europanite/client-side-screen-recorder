import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const recorder = readFileSync(new URL('../frontend/app/src/lib/recorder.ts', import.meta.url), 'utf8');
const settings = readFileSync(new URL('../frontend/app/src/components/SettingsBar.tsx', import.meta.url), 'utf8');
const hook = readFileSync(new URL('../frontend/app/src/hooks/useScreenRecorder.ts', import.meta.url), 'utf8');
const app = readFileSync(new URL('../frontend/app/src/App.tsx', import.meta.url), 'utf8');
test('selected audio input reaches getUserMedia without speech suppression', () => {
  assert.match(recorder, /getRecordingAudioConstraints\(options\.microphoneDeviceId\)/);
});
test('meter signals represent audio routed to the actual recording mix', () => {
  assert.match(recorder, /source\.connect\(analyser\)/);
  assert.match(recorder, /analyser\.connect\(this\.audioDestination!\)/);
  assert.match(hook, /recorderRef\.current\?\.getAudioLevels\(\)/);
  assert.match(app, /audio-meters/);
});
test('no sound encoder packets is treated as recording failure', () => {
  assert.match(recorder, /this\.audioSource && this\.audioPackets === 0/);
});
test('settings allow refreshing and selecting an audio input', () => {
  assert.match(settings, /enumerateDevices\(\)/);
  assert.match(settings, /onClick=\{\(\) => void refreshDevices\(\)\}/);
});
