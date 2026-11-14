/** Choose exactly one desktop-audio input path; never duplicate the same PC sound. */
export function resolveSystemAudioSelection(options: {
  systemAudio: boolean;
  systemAudioDeviceId?: string;
}): { useDisplayAudio: boolean; loopbackDeviceId: string | undefined } {
  const loopbackDeviceId = options.systemAudio ? options.systemAudioDeviceId || undefined : undefined;
  return {
    useDisplayAudio: options.systemAudio && !loopbackDeviceId,
    loopbackDeviceId,
  };
}

/** Browser-native screen, window, or tab audio is the default PC audio path. */
export function getDisplayCaptureOptions(frameRate: number, useDisplayAudio: boolean): DisplayMediaStreamOptions {
  return {
    video: { frameRate: { ideal: frameRate, max: frameRate } },
    audio: useDisplayAudio,
    systemAudio: useDisplayAudio ? 'include' : 'exclude',
    // On supported browsers, allow system sound when a window is shared too.
    windowAudio: useDisplayAudio ? 'system' : 'exclude',
    surfaceSwitching: 'include',
  } as DisplayMediaStreamOptions;
}
