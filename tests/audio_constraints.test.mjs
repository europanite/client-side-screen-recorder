import assert from 'node:assert/strict';
import test from 'node:test';
import { getRecordingAudioConstraints } from '../frontend/app/src/lib/audioConstraints.ts';

test('default microphone does not suppress screen recording audio', () => {
  assert.deepEqual(getRecordingAudioConstraints(), {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
  });
});

test('explicit microphone preserves device ID and disables speech filters', () => {
  assert.deepEqual(getRecordingAudioConstraints('mic-id'), {
    deviceId: { exact: 'mic-id' },
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
  });
});
