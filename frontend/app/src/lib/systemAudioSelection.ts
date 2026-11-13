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
