# Manual browser verification checklist

Test with a recent desktop Chromium-based browser on `localhost` or HTTPS:

1. Start with microphone off and system audio off; select a tab; capture 5 seconds; stop; confirm playable MP4 video and no audio.
2. Enable microphone alone; grant permission; speak; stop; confirm AAC audio track and sync.
3. Enable system audio alone; choose a tab with "Share tab audio" enabled; verify capture. Also choose a surface without audio, expecting a non-blocking warning.
4. Enable microphone and system audio; verify that both can be heard and the app does not echo playback locally.
5. Pause for 3 seconds and resume; check the final playback duration excludes pause time and remains playable.
6. Stop sharing from the browser's native share indicator; confirm output finalizes and Download MP4 appears.
7. Cancel the screen selection dialog and reject microphone permission; verify useful error display and successful retry.
8. Perform two separate recordings in one page session; verify the second file and preview are new.
9. Confirm downloaded file's signature/codec metadata with `ffprobe`:
   `ffprobe -v error -show_entries format=format_name,duration -show_entries stream=codec_name,codec_type -of json recording.mp4`
10. Verify local browser developer tools Network has no upload or API requests to a recording service.

Known risks: media capture permission UX is OS/browser-specific; WebCodecs AVC/AAC hardware and software support varies; in-memory recordings consume RAM; static screen capture may yield a variable frame rate.


## Independent microphone diagnostic

Open `http://localhost:5173/mic-test.html`, choose a physical microphone, click
**Start test**, speak for 5 seconds, then **Stop** and play the resulting WebM.
This does not use Mediabunny or AAC, so a silent result indicates a microphone
input/permission/device problem rather than an MP4 encoder problem.
The test requests unprocessed microphone audio (AEC/NS/AGC off).
If this test has sound but the main application's MP4 is silent, inspect the
Mediabunny audio path rather than changing system sound settings.
When sharing the entire Linux desktop, system audio may be unavailable; use a
Chrome tab with audio sharing enabled to record tab playback.
