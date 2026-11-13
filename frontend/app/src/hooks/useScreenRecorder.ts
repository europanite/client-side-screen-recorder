import { useCallback, useEffect, useRef, useState } from 'react';
import { ScreenRecorder, toError, type CaptureDetails, type RecorderSettings, type AudioLevels } from '../lib/recorder';
import { makeFileName } from '../lib/utils';

export type RecordingStatus = 'idle' | 'starting' | 'recording' | 'paused' | 'finalizing' | 'ready' | 'error';
export type RecordingResult = { url: string; fileName: string; size: number };

export function useScreenRecorder() {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const statusRef = useRef<RecordingStatus>('idle');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [details, setDetails] = useState<CaptureDetails | null>(null);
  const [result, setResult] = useState<RecordingResult | null>(null);
  const urlRef = useRef<string | null>(null);
  const recorderRef = useRef<ScreenRecorder | null>(null);
  const encoderErrorRef = useRef<Error | null>(null);
  const startedAt = useRef(0);
  const pausedAt = useRef(0);
  const pausedTotal = useRef(0);
  const [duration, setDuration] = useState(0);
  const [audioLevels, setAudioLevels] = useState<AudioLevels>({ microphone: null, system: null });
  const peakLevelsRef = useRef({ microphone: 0, system: 0 });
  const hasAudioInputRef = useRef(false);
  const hasSystemAudioRef = useRef(false);

  const updateStatus = useCallback((next: RecordingStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const secondsElapsed = useCallback(() => {
    if (!startedAt.current) return 0;
    const now = pausedAt.current || performance.now();
    return Math.max(0, (now - startedAt.current - pausedTotal.current) / 1000);
  }, []);

  useEffect(() => {
    if (status !== 'recording') return;
    const interval = window.setInterval(() => {
      setDuration(secondsElapsed());
      const levels = recorderRef.current?.getAudioLevels();
      if (levels) {
        setAudioLevels(levels);
        peakLevelsRef.current.microphone = Math.max(peakLevelsRef.current.microphone, levels.microphone ?? 0);
        peakLevelsRef.current.system = Math.max(peakLevelsRef.current.system, levels.system ?? 0);
      }
    }, 150);
    return () => window.clearInterval(interval);
  }, [secondsElapsed, status]);

  const stop = useCallback(async () => {
    if (statusRef.current !== 'recording' && statusRef.current !== 'paused') return;
    setDuration(secondsElapsed());
    updateStatus('finalizing');
    try {
      const blob = await recorderRef.current!.stop();
      if (encoderErrorRef.current) throw encoderErrorRef.current;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setResult({ url, fileName: makeFileName(new Date()), size: blob.size });
      if (hasAudioInputRef.current && peakLevelsRef.current.microphone === 0) {
        setWarning((prev) => [prev, 'No microphone signal detected.'].filter(Boolean).join(' '));
      }
      if (hasSystemAudioRef.current && peakLevelsRef.current.system === 0) {
        setWarning((prev) => [prev, 'No PC/tab audio signal detected. Check the selected PC audio source.'].filter(Boolean).join(' '));
      }
      updateStatus('ready');
    } catch (err) {
      setResult(null);
      setError(`Recording failed: ${toError(err).message}`);
      updateStatus('error');
    } finally {
      recorderRef.current = null;
    }
  }, [secondsElapsed, updateStatus]);

  const start = useCallback(async (settings: RecorderSettings) => {
    if (['recording', 'paused', 'starting', 'finalizing'].includes(statusRef.current)) return;
    updateStatus('starting');
    setError('');
    encoderErrorRef.current = null;
    setWarning('');
    setDetails(null);
    setResult(null);
    setDuration(0);
    setAudioLevels({ microphone: null, system: null });
    peakLevelsRef.current = { microphone: 0, system: 0 };
    hasAudioInputRef.current = false;
    hasSystemAudioRef.current = false;
    pausedAt.current = 0;
    pausedTotal.current = 0;
    startedAt.current = 0;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;

    const recorder = new ScreenRecorder();
    recorderRef.current = recorder;
    try {
      const captureDetails = await recorder.start(settings, () => {
        // The browser's Stop sharing control behaves like the app's Stop button.
        void stop();
      }, (err) => {
        if (recorderRef.current !== recorder) return;
        encoderErrorRef.current = err;
        setError(`Encoder error: ${err.message}`);
        if (statusRef.current === 'recording' || statusRef.current === 'paused') void stop();
      });
      if (encoderErrorRef.current) throw encoderErrorRef.current;
      setDetails(captureDetails);
      hasAudioInputRef.current = settings.microphone;
      hasSystemAudioRef.current = captureDetails.systemAudioAvailable;
      if (settings.systemAudio && !captureDetails.systemAudioAvailable) {
        setWarning('No PC audio track: share a Chrome tab with audio enabled, or choose a loopback in PC audio source.');
      }
      startedAt.current = performance.now();
      updateStatus('recording');
    } catch (err) {
      await recorder.release();
      recorderRef.current = null;
      setError(toError(err).message || 'Screen capture failed.');
      updateStatus('error');
    }
  }, [stop, updateStatus]);

  const pause = useCallback(() => {
    if (statusRef.current !== 'recording') return;
    recorderRef.current?.pause();
    pausedAt.current = performance.now();
    setDuration(secondsElapsed());
    updateStatus('paused');
  }, [secondsElapsed, updateStatus]);

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') return;
    recorderRef.current?.resume();
    pausedTotal.current += performance.now() - pausedAt.current;
    pausedAt.current = 0;
    updateStatus('recording');
  }, [updateStatus]);

  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    void recorderRef.current?.release();
  }, []);

  return { status, error, warning, details, result, duration, audioLevels, start, stop, pause, resume };
}
