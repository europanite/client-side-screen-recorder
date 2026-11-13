import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveSystemAudioSelection } from '../frontend/app/src/lib/systemAudioSelection.ts';

const recorder = readFileSync(new URL('../frontend/app/src/lib/recorder.ts', import.meta.url), 'utf8');
const settings = readFileSync(new URL('../frontend/app/src/components/SettingsBar.tsx', import.meta.url), 'utf8');
const hook = readFileSync(new URL('../frontend/app/src/hooks/useScreenRecorder.ts', import.meta.url), 'utf8');

test('tab audio is selected by default when PC sound is enabled', () => {
  assert.deepEqual(resolveSystemAudioSelection({ systemAudio: true }), {
    useDisplayAudio: true, loopbackDeviceId: undefined,
  });
});
test('explicit OS loopback disables tab audio and keeps the requested device', () => {
  assert.deepEqual(resolveSystemAudioSelection({ systemAudio: true, systemAudioDeviceId: 'loopback123' }), {
    useDisplayAudio: false, loopbackDeviceId: 'loopback123',
  });
});
test('disabling system audio disables both possible PC audio paths', () => {
  assert.deepEqual(resolveSystemAudioSelection({ systemAudio: false, systemAudioDeviceId: 'loopback123' }), {
    useDisplayAudio: false, loopbackDeviceId: undefined,
  });
});
test('OS loopback and microphone are captured separately and mixed once', () => {
  assert.match(recorder, /getRecordingAudioConstraints\(options\.microphoneDeviceId\)/);
  assert.match(recorder, /getRecordingAudioConstraints\(loopbackDeviceId\)/);
  assert.match(recorder, /this\.desktopAudioStream\?\.getTracks\(\)/);
  assert.match(recorder, /connect\(systemAudioTrack, 'system'\)/);
  assert.match(recorder, /connect\(micTrack, 'microphone'\)/);
});
test('PC audio has an independent selector and a signal meter', () => {
  assert.match(settings, /PC audio source/);
  assert.match(settings, /settings\.systemAudioDeviceId/);
  assert.match(hook, /peakLevelsRef\.current\.system/);
  assert.match(hook, /No PC\/tab audio signal detected/);
});
