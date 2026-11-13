# Linux audio recording

The browser screen capture API can return **no audio track** for an Entire Screen or Window capture on Linux even when System/tab audio is enabled. This is a browser/platform limitation, not an AAC encoding error. The app must not claim it captured audio that the browser did not supply.

## Browser-tab audio (recommended)

1. Enable **System / tab audio** in the recorder.
2. Click Start recording; choose **Chrome Tab** (not Entire Screen).
3. Select the target tab and enable **Share tab audio** in the browser dialog.
4. Start playback in the shared tab. The **Tab/PC** level meter should move.
5. Stop, download the MP4, and listen to it.

## Microphone

1. Enable **Microphone**, select the intended **Audio input**, and use the ↻ button to refresh devices after granting permission.
2. Speak while recording. **Input** should move. A flat meter usually means the selected input has no audible signal; verify microphone permissions and the OS input volume.
3. The browser captures only the selected device; other microphones/monitor sources will not automatically be mixed.

## Desktop / application audio on Linux

Chrome cannot be forced to provide a system audio track for an Entire Screen share. The app now supports an **independent PC audio input** alongside the actual microphone. You can record both at the same time, mixed into the same AAC track.

1. On the **host machine** (not in Docker), create an OS loopback input once:

   ```bash
   bash scripts/enable-linux-desktop-audio.sh
   ```

   The script needs `pactl`, a PulseAudio-compatible server and a default output sink; it cannot make Chrome support native screen audio. It is optional and may not work with every audio service.
2. Restart Chrome if necessary, or use the ↻ button in settings to refresh the inputs.
3. Enable **System / tab audio**. Under **PC audio source**, explicitly choose `ScreenRec_Loopback`.
4. Leave **Microphone** enabled for your voice and choose the correct physical mic under **Audio input**. These are different selectors.
5. Choose **Entire Screen** and record while a desktop application produces sound. The **PC** and **Input** meters should move independently. You can disable Microphone to record only the desktop.

Select **Shared tab audio (browser)** in **PC audio source** when recording a Chrome tab with its own audio. Do not also capture the same tab through an OS loopback; that would duplicate the audio. If a loopback input does not appear, Chrome cannot access it: inspect `pactl list short sources` and OS/browser microphone permissions. The app will not silently replace the missing input with the microphone.

To remove the virtual source, use `pactl unload-module <id>` where `<id>` was printed by the enable script. This configuration is not needed for tab audio.

## Verify the downloaded MP4

```bash
ffprobe -v error -select_streams a -show_entries stream=codec_name,channels,sample_rate -of default=noprint_wrappers=1 ~/Downloads/recording.mp4
ffmpeg -hide_banner -i ~/Downloads/recording.mp4 -vn -af volumedetect -f null - 2>&1 | grep -E 'mean_volume|max_volume'
```

Replace `recording.mp4` with the actual filename. An AAC track can exist while containing only silence; the level meter and volumedetect can distinguish the cases. Both tools run locally and do not upload recordings.
