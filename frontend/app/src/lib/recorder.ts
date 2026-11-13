import {
  BufferTarget,
  MediaStreamAudioTrackSource,
  MediaStreamVideoTrackSource,
  Mp4OutputFormat,
  Output,
  Quality,
} from 'mediabunny';
import { registerAacEncoder } from '@mediabunny/aac-encoder';
import { getRecordingAudioConstraints } from './audioConstraints';
import { resolveSystemAudioSelection } from './systemAudioSelection';

// A registered custom encoder takes priority over the browser's native AAC encoder.
// Important for Linux Chrome, where AudioEncoder exists but rejects AAC at runtime.
let aacEncoderRegistered = false;

export type RecorderSettings = {
  microphone: boolean;
  microphoneDeviceId?: string;
  systemAudio: boolean;
  /** Optional OS loopback source selected independently of the microphone. */
  systemAudioDeviceId?: string;
  frameRate: 15 | 30 | 60;
  videoBitrateMbps: 3 | 6 | 10;
};

export type AudioLevels = { microphone: number | null; system: number | null };

export type CaptureDetails = {
  displayName: string;
  resolution: string;
  audioDescription: string;
  systemAudioAvailable: boolean;
};

/** Encodes H.264 + AAC into MP4 locally. No MediaRecorder / WebM conversion or server. */
export class ScreenRecorder {
  private output: Output | null = null;
  private target: BufferTarget | null = null;
  private screenStream: MediaStream | null = null;
  private microphoneStream: MediaStream | null = null;
  private desktopAudioStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private audioDestination: MediaStreamAudioDestinationNode | null = null;
  private audioMeters: { microphone?: AnalyserNode; system?: AnalyserNode } = {};
  private videoSource: MediaStreamVideoTrackSource | null = null;
  private audioSource: MediaStreamAudioTrackSource | null = null;
  private screenTrack: MediaStreamTrack | null = null;
  private screenEndedListener: (() => void) | null = null;
  private started = false;
  private encoderError: Error | null = null;
  private finished = false;
  private videoPackets = 0;
  private audioPackets = 0;

  async start(
    options: RecorderSettings,
    onScreenEnded: () => void,
    onEncoderError: (error: Error) => void,
  ): Promise<CaptureDetails> {
    if (this.output || this.screenStream) throw new Error('A recording is already in progress.');

    try {
      // Must be requested immediately from the user's click (transient activation).
      const systemSelection = resolveSystemAudioSelection(options);
      const displayOptions = {
        video: { frameRate: { ideal: options.frameRate, max: options.frameRate } },
        audio: systemSelection.useDisplayAudio,
        systemAudio: systemSelection.useDisplayAudio ? 'include' : 'exclude',
        surfaceSwitching: 'include',
      } as DisplayMediaStreamOptions;
      this.screenStream = await navigator.mediaDevices.getDisplayMedia(displayOptions);
      this.screenTrack = this.screenStream.getVideoTracks()[0] ?? null;
      if (!this.screenTrack || this.screenTrack.readyState !== 'live') {
        throw new Error('No active video track was shared.');
      }

      if (options.microphone) {
        this.microphoneStream = await navigator.mediaDevices.getUserMedia({
          audio: getRecordingAudioConstraints(options.microphoneDeviceId),
        });
      }

      // On Linux, display capture usually supplies no desktop audio. An explicitly
      // selected loopback input is acquired separately and recorded as PC audio.
      // Do not record both the loopback and display audio to avoid doubled sound.
      let systemAudioTrack = systemSelection.useDisplayAudio
        ? this.screenStream.getAudioTracks()[0]
        : undefined;
      if (systemSelection.loopbackDeviceId) {
        const loopbackDeviceId = systemSelection.loopbackDeviceId === '__screenrec_auto_loopback__'
          ? (await navigator.mediaDevices.enumerateDevices()).find(device =>
              device.kind === 'audioinput' && /screenrec[_ -]?loopback/i.test(device.label)
            )?.deviceId
          : systemSelection.loopbackDeviceId;
        if (!loopbackDeviceId) throw new Error('ScreenRec_Loopback was not found. Refresh audio inputs and check microphone permission.');
        const micDeviceId = this.microphoneStream?.getAudioTracks()[0]?.getSettings().deviceId;
        if (options.microphone && (options.microphoneDeviceId === loopbackDeviceId || micDeviceId === loopbackDeviceId)) {
          throw new Error('Microphone and PC audio cannot use the same selected input. Select a different microphone.');
        }
        try {
          this.desktopAudioStream = await navigator.mediaDevices.getUserMedia({
            audio: getRecordingAudioConstraints(loopbackDeviceId),
          });
        } catch (error) {
          throw new Error(`Cannot open the selected PC audio input: ${toError(error).message}`);
        }
        systemAudioTrack = this.desktopAudioStream.getAudioTracks()[0];
        if (!systemAudioTrack || systemAudioTrack.readyState !== 'live') {
          throw new Error('The selected PC audio input did not provide an active audio track.');
        }
      }
      const micTrack = this.microphoneStream?.getAudioTracks()[0];
      // Route all selected inputs through analysers, then into ONE encoded AAC
      // track. Each meter measures the actual audio fed into the recording mix.
      // Never connect to audioContext.destination: no speaker feedback/echo.
      let audioTrack: MediaStreamTrack | undefined;
      if (systemAudioTrack || micTrack) {
        this.audioContext = new AudioContext();
        await this.audioContext.resume();
        this.audioDestination = this.audioContext.createMediaStreamDestination();
        const connect = (track: MediaStreamTrack, name: 'system' | 'microphone') => {
          const source = this.audioContext!.createMediaStreamSource(new MediaStream([track]));
          const analyser = this.audioContext!.createAnalyser();
          analyser.fftSize = 1024;
          source.connect(analyser);
          analyser.connect(this.audioDestination!);
          this.audioMeters[name] = analyser;
        };
        if (systemAudioTrack) connect(systemAudioTrack, 'system');
        if (micTrack) connect(micTrack, 'microphone');
        audioTrack = this.audioDestination.stream.getAudioTracks()[0];
      }

      if (audioTrack && !aacEncoderRegistered) {
        // Use local WASM AAC rather than Chromium's unsupported AAC WebCodecs path.
        registerAacEncoder();
        aacEncoderRegistered = true;
      }

      this.target = new BufferTarget();
      this.output = new Output({ format: new Mp4OutputFormat(), target: this.target });
      this.videoSource = new MediaStreamVideoTrackSource(this.screenTrack as ConstructorParameters<typeof MediaStreamVideoTrackSource>[0], {
        codec: 'avc',
        quality: new Quality({ bitrate: options.videoBitrateMbps * 1_000_000 }),
        keyFrameInterval: 2,
        onEncodedPacket: () => { this.videoPackets += 1; },
      });
      this.output.addVideoTrack(this.videoSource, { frameRate: options.frameRate });
      this.videoSource.errorPromise.catch((error: unknown) => this.reportEncoderError(error, onEncoderError));

      if (audioTrack) {
        this.audioSource = new MediaStreamAudioTrackSource(audioTrack as ConstructorParameters<typeof MediaStreamAudioTrackSource>[0], {
          codec: 'aac',
          quality: new Quality({ bitrate: 128_000 }),
          onEncodedPacket: () => { this.audioPackets += 1; },
        });
        this.output.addAudioTrack(this.audioSource);
        this.audioSource.errorPromise.catch((error: unknown) => this.reportEncoderError(error, onEncoderError));
      }

      this.screenEndedListener = onScreenEnded;
      this.screenTrack.addEventListener('ended', onScreenEnded, { once: true });
      await this.output.start();
      if (this.encoderError) throw this.encoderError;
      this.started = true;
      if (this.screenTrack.readyState !== 'live') throw new Error('Screen sharing ended before recording started.');

      const settings = this.screenTrack.getSettings();
      const sources = [
        systemAudioTrack && (systemSelection.loopbackDeviceId ? `PC: ${systemAudioTrack.label || 'loopback'}` : 'tab audio'),
        micTrack && `mic: ${micTrack.label || 'microphone'}`,
      ].filter(Boolean);
      return {
        displayName: this.screenTrack.label || 'Shared screen',
        resolution: settings.width && settings.height ? `${settings.width} × ${settings.height}` : 'Source resolution',
        audioDescription: sources.length ? sources.join(' + ') : 'No audio',
        systemAudioAvailable: !!systemAudioTrack,
      };
    } catch (error) {
      await this.release();
      throw error;
    }
  }

  getAudioLevels(): AudioLevels {
    const read = (analyser?: AnalyserNode): number | null => {
      if (!analyser || this.audioContext?.state !== 'running') return null;
      const samples = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(samples);
      let power = 0;
      for (const sample of samples) power += sample * sample;
      return Math.min(100, Math.round(Math.sqrt(power / samples.length) * 450));
    };
    return {
      microphone: read(this.audioMeters.microphone),
      system: read(this.audioMeters.system),
    };
  }

  pause(): void {
    if (!this.started) return;
    this.videoSource?.pause();
    this.audioSource?.pause();
  }

  resume(): void {
    if (!this.started) return;
    this.videoSource?.resume();
    this.audioSource?.resume();
  }

  async stop(): Promise<Blob> {
    if (!this.output || !this.target || !this.started) throw new Error('There is no active recording.');
    const output = this.output;
    const target = this.target;
    this.detachScreenEndedListener();
    try {
      if (this.encoderError) throw this.encoderError;
      await output.finalize();
      // An encoder can fail asynchronously, yet the muxer may still finalize a
      // header-only MP4. Never claim that such an output was recorded successfully.
      if (this.encoderError) throw this.encoderError;
      if (this.videoPackets === 0) throw new Error('No video frames were encoded.');
      if (this.audioSource && this.audioPackets === 0) throw new Error('No audio packets were encoded.');
      const data = target.buffer;
      if (!data || data.byteLength < 2048) throw new Error('MP4 is empty or incomplete.');
      return new Blob([data], { type: 'video/mp4' });
    } finally {
      await this.release();
    }
  }

  async release(): Promise<void> {
    this.detachScreenEndedListener();
    this.started = false;
    this.finished = true;
    if (this.output && (this.output.state === 'pending' || this.output.state === 'started')) {
      await this.output.cancel().catch(() => {});
    }
    this.screenStream?.getTracks().forEach((track) => track.stop());
    this.microphoneStream?.getTracks().forEach((track) => track.stop());
    this.desktopAudioStream?.getTracks().forEach((track) => track.stop());
    this.audioDestination?.stream.getTracks().forEach((track) => track.stop());
    if (this.audioContext) await this.audioContext.close().catch(() => {});
    this.screenStream = null;
    this.microphoneStream = null;
    this.desktopAudioStream = null;
    this.audioDestination = null;
    this.audioContext = null;
    this.audioMeters = {};
    this.screenTrack = null;
    this.videoSource = null;
    this.audioSource = null;
    this.output = null;
    this.target = null;
  }

  private reportEncoderError(error: unknown, onEncoderError: (error: Error) => void): void {
    if (this.finished || this.encoderError) return;
    this.encoderError = toError(error);
    onEncoderError(this.encoderError);
  }

  private detachScreenEndedListener(): void {
    if (this.screenTrack && this.screenEndedListener) {
      this.screenTrack.removeEventListener('ended', this.screenEndedListener);
    }
    this.screenEndedListener = null;
  }
}

export function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
