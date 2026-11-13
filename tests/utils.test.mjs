import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDuration, formatBytes, makeFileName, isCaptureSupported } from '../frontend/app/src/lib/utils.ts';

test('duration formatting: minutes and hours', () => {
  assert.equal(formatDuration(0), '00:00');
  assert.equal(formatDuration(65.8), '01:05');
  assert.equal(formatDuration(3661), '01:01:01');
  assert.equal(formatDuration(-8), '00:00');
});

test('file size formatting', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1.0 KB');
  assert.equal(formatBytes(5 * 1024 ** 2), '5.0 MB');
});

test('filename uses local date and mp4 extension', () => {
  assert.equal(makeFileName(new Date(2026, 10, 13, 8, 23, 1)), 'screen-recording-20261113-082301.mp4');
});

test('capability check is safe outside the browser', () => {
  assert.equal(isCaptureSupported(), false);
});
