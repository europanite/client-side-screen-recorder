import { useMemo, useState } from 'react';
import { SettingsBar } from './components/SettingsBar';
import { useScreenRecorder } from './hooks/useScreenRecorder';
import type { RecorderSettings } from './lib/recorder';
import { formatBytes, formatDuration, isCaptureSupported } from './lib/utils';

const REPO_URL = 'https://github.com/europanite/client-side-screen-recorder';
const DEFAULT_SETTINGS: RecorderSettings = {
  microphone: true, systemAudio: true, frameRate: 30, videoBitrateMbps: 6,
};

export default function App() {
  const [settings, setSettings] = useState<RecorderSettings>(DEFAULT_SETTINGS);
  const { status, error, warning, details, result, duration, audioLevels, start, stop, pause, resume } = useScreenRecorder();
  const supported = useMemo(isCaptureSupported, []);
  const recording = status === 'recording' || status === 'paused';
  const busy = status === 'starting' || status === 'finalizing';

  return (
    <div className="shell">
      <header className="top-bar">
        <a className="brand" href={REPO_URL} target="_blank" rel="noopener noreferrer" title="View repository on GitHub">
          <span className="brand-icon">●</span><span>Client Side Screen Recorder</span>
        </a>
      </header>

      <main className="main-content">
        <section className="studio-grid">
          <div className="card monitor-card">
            <div className="card-header"><span>Client Side Screen Recorder</span><div className={`live-pill ${recording ? 'is-live' : ''}`}><span />{status === 'recording' ? 'Client Side Screen Recorder' : status === 'paused' ? 'PAUSED' : 'STANDBY'}</div></div>
            <div className={`screen ${result ? 'has-video' : ''}`}>
              {result ? <video className="preview" src={result.url} controls playsInline aria-label="Recorded MP4 preview" /> : <div className="empty-state">
                <h2>{recording ? 'Client Side Screen Recorder' : busy ? 'Preparing…' : 'Ready'}</h2>
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
