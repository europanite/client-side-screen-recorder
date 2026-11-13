export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  if (hours > 0) return [hours, minutes, rest].map((part) => String(part).padStart(2, '0')).join(':');
  return [minutes, rest].map((part) => String(part).padStart(2, '0')).join(':');
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** unitIndex).toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function makeFileName(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `screen-recording-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.mp4`;
}

export function isCaptureSupported(): boolean {
  return typeof window !== 'undefined'
    && window.isSecureContext
    && typeof navigator.mediaDevices?.getDisplayMedia === 'function'
    && 'VideoEncoder' in window
    && 'MediaStreamTrackProcessor' in window;
}
