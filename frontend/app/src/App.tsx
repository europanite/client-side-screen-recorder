import { useMemo, useState } from 'react';
import { SettingsBar } from './components/SettingsBar';
import { useScreenRecorder } from './hooks/useScreenRecorder';
import type { RecorderSettings } from './lib/recorder';
import { formatBytes, formatDuration, isCaptureSupported } from './lib/utils';

const REPO_URL = 'https://github.com/europanite/client-side-screen-recorder';
const DEFAULT_SETTINGS: RecorderSettings = {
  microphone: true, systemAudio: true, systemAudioDeviceId: '__screenrec_auto_loopback__', frameRate: 30, videoBitrateMbps: 6,
};

export default function App() {
  const [settings, setSettings] = useState<RecorderSettings>(DEFAULT_SETTINGS);
  const { status, error, warning, details, result, duration, audioLevels, start, stop, pause, resume } = useScreenRecorder();
  const supported = useMemo(isCaptureSupported, []);
  const recording = status === 'recording' || status === 'paused';
  const busy = status === 'starting' || status === 'finalizing';

  return (
    <div className="shell" data-build="rec-20261113-v8">
      <header className="top-bar">
        <div className="brand"><span className="brand-icon">●</span><span>REC</span><small className="build-mark">v8</small></div>
        <a className="repo-link" href={REPO_URL} target="_blank" rel="noreferrer" aria-label="GitHub repository">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5a11.5 11.5 0 0 0-3.638 22.41c.575.107.785-.25.785-.556 0-.274-.01-1.002-.016-1.968-3.197.695-3.871-1.54-3.871-1.54-.523-1.33-1.277-1.685-1.277-1.685-1.045-.715.079-.7.079-.7 1.156.081 1.764 1.187 1.764 1.187 1.027 1.76 2.692 1.251 3.347.957.104-.744.402-1.252.732-1.54-2.552-.29-5.236-1.277-5.236-5.686 0-1.256.448-2.282 1.184-3.086-.12-.29-.514-1.46.112-3.042 0 0 .965-.309 3.162 1.178A11.025 11.025 0 0 1 12 6.99c.977.005 1.96.133 2.878.387 2.196-1.487 3.16-1.178 3.16-1.178.627 1.582.234 2.752.115 3.042.738.804 1.183 1.83 1.183 3.086 0 4.42-2.688 5.393-5.248 5.677.414.357.783 1.061.783 2.138 0 1.544-.014 2.79-.014 3.169 0 .308.208.668.79.555A11.5 11.5 0 0 0 12 .5Z"/></svg>
          GitHub
        </a>
      </header>

      <main className="main-content">
        <section className="studio-grid">
          <div className="card monitor-card">
            <div className="card-header"><span>REC</span><div className={`live-pill ${recording ? 'is-live' : ''}`}><span />{status === 'recording' ? 'REC' : status === 'paused' ? 'PAUSED' : 'STANDBY'}</div></div>
            <div className={`screen ${result ? 'has-video' : ''}`}>
              {result ? <video className="preview" src={result.url} controls playsInline aria-label="Recorded MP4 preview" /> : <div className="empty-state">
                <h2>{recording ? 'REC' : busy ? 'Preparing…' : 'Ready'}</h2>
              </div>}
              {recording && <div className="recording-badge"><span /> {formatDuration(duration)}</div>}
            </div>
            <div className="control-area">
              <div className="time-info"><span className="timer-label">DURATION</span><strong className="timer-value">{formatDuration(duration)}</strong></div>
              <div className="buttons">
                {!recording ? <button className="primary-button" disabled={!supported || busy} onClick={() => void start(settings)}><span className="button-record-dot" />{status === 'starting' ? 'Starting…' : status === 'finalizing' ? 'Encoding MP4…' : 'Start recording'}</button> : <>
                  <button className="secondary-button" onClick={status === 'paused' ? resume : pause}>{status === 'paused' ? '▶ Resume' : 'Ⅱ Pause'}</button>
                  <button className="stop-button" onClick={() => void stop()}>■ Stop</button>
                </>}
              </div>
            </div>
            {details && <div className="capture-details"><span>▣ {details.resolution}</span><span>♫ {details.audioDescription}</span></div>}
            {recording && (audioLevels.microphone !== null || audioLevels.system !== null) && (
              <div className="audio-meters" aria-label="Recording audio levels">
                {audioLevels.microphone !== null && <label><span>Input</span><progress max={100} value={audioLevels.microphone} /></label>}
                {audioLevels.system !== null && <label><span>PC</span><progress max={100} value={audioLevels.system} /></label>}
              </div>
            )}
            {warning && <p className="notice warning" role="status">{warning}</p>}
            {error && <p className="notice error" role="alert">{error}</p>}
            {!supported && <p className="notice error" role="alert">This browser cannot perform local MP4 capture. Use current desktop Chrome or Edge on HTTPS or localhost with WebCodecs / MediaStreamTrackProcessor available.</p>}
            {result && <div className="result-row"><div><strong>Recording ready</strong><small>{result.fileName} · {formatBytes(result.size)}</small></div><a href={result.url} download={result.fileName} className="download-button">↓ Download MP4</a></div>}
          </div>

          <aside className="card settings-card">
            <div className="card-header"><span>SETTINGS</span><span className="settings-icon">⚙</span></div>
            <SettingsBar settings={settings} onChange={setSettings} disabled={recording || busy} />
          </aside>
        </section>
      </main>
    </div>
  );
}
