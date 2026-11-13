import { useCallback, useEffect, useState } from 'react';
import type { RecorderSettings } from '../lib/recorder';

type Props = {
  settings: RecorderSettings;
  onChange: (settings: RecorderSettings) => void;
  disabled: boolean;
};

export function SettingsBar({ settings, onChange, disabled }: Props) {
  const patch = (change: Partial<RecorderSettings>) => onChange({ ...settings, ...change });
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceError, setDeviceError] = useState('');
  const refreshDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices(all.filter((device) => device.kind === 'audioinput' && device.deviceId));
      setDeviceError('');
    } catch {
      setDeviceError('Cannot list audio inputs.');
    }
  }, []);
  useEffect(() => {
    void refreshDevices();
    navigator.mediaDevices?.addEventListener?.('devicechange', refreshDevices);
    return () => navigator.mediaDevices?.removeEventListener?.('devicechange', refreshDevices);
  }, [refreshDevices]);
  return (
    <div className="settings-grid">
      <label className="toggle-row">
        <span><strong>Microphone</strong></span>
        <input type="checkbox" checked={settings.microphone} disabled={disabled}
          onChange={(event) => patch({ microphone: event.target.checked })} />
      </label>
      <div className="input-source-row">
        <label htmlFor="audio-device"><strong>Audio input</strong></label>
        <div className="input-source-select">
          <select id="audio-device" aria-label="Audio input" disabled={disabled || !settings.microphone}
            value={settings.microphoneDeviceId ?? ''}
            onChange={(event) => patch({ microphoneDeviceId: event.target.value || undefined })}>
            <option value="">Default microphone</option>
            {devices.filter((device) => device.deviceId !== 'default' && device.deviceId !== 'communications')
              .map((device, index) => <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Input ${index + 1}`}
              </option>)}
          </select>
          <button type="button" disabled={disabled} onClick={() => void refreshDevices()} aria-label="Refresh audio inputs">↻</button>
        </div>
        {deviceError && <small role="alert">{deviceError}</small>}
      </div>
      <label className="toggle-row">
        <span><strong>System / tab audio</strong></span>
        <input type="checkbox" checked={settings.systemAudio} disabled={disabled}
          onChange={(event) => patch({ systemAudio: event.target.checked })} />
      </label>
      {settings.systemAudio && <div className="input-source-row">
        <label htmlFor="pc-audio-device"><strong>PC audio source</strong></label>
        <div className="input-source-select">
          <select id="pc-audio-device" aria-label="PC audio source" disabled={disabled}
            value={settings.systemAudioDeviceId ?? ''}
            onChange={(event) => patch({ systemAudioDeviceId: event.target.value || undefined })}>
            <option value="__screenrec_auto_loopback__">ScreenRec_Loopback (auto)</option>
            <option value="">Shared tab audio (browser)</option>
            {devices.filter((device) => device.deviceId !== 'default' && device.deviceId !== 'communications')
              .map((device, index) => <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Audio input ${index + 1}`}
              </option>)}
          </select>
          <button type="button" disabled={disabled} onClick={() => void refreshDevices()} aria-label="Refresh PC audio inputs">↻</button>
        </div>
      </div>}
      <label className="select-row">
        <span><strong>Frame rate</strong></span>
        <select disabled={disabled} value={settings.frameRate}
          onChange={(event) => patch({ frameRate: Number(event.target.value) as RecorderSettings['frameRate'] })}>
          <option value={15}>15 FPS</option><option value={30}>30 FPS</option><option value={60}>60 FPS</option>
        </select>
      </label>
      <label className="select-row">
        <span><strong>Video bitrate</strong></span>
        <select disabled={disabled} value={settings.videoBitrateMbps}
          onChange={(event) => patch({ videoBitrateMbps: Number(event.target.value) as RecorderSettings['videoBitrateMbps'] })}>
          <option value={3}>3 Mbps</option><option value={6}>6 Mbps</option><option value={10}>10 Mbps</option>
        </select>
      </label>
    </div>
  );
}
