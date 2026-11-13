/** Preserve the input signal for a screen recording rather than speech-chat processing. */
export function getRecordingAudioConstraints(deviceId?: string): MediaTrackConstraints {
  return {
    ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
    // Echo cancellation can cancel speaker audio acoustically picked up by a mic.
    // Noise suppression/AGC also change the recorded signal, so disable all three.
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
  };
}
