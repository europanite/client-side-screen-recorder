# [Client Side Screen Recorder](https://github.com/europanite/client-side-screen-recorder)

[![CI](https://github.com/europanite/client-side-screen-recorder/actions/workflows/ci.yml/badge.svg)](https://github.com/europanite/client-side-screen-recorder/actions/workflows/ci.yml)
[![GitHub Pages](https://github.com/europanite/client-side-screen-recorder/actions/workflows/pages.yml/badge.svg)](https://github.com/europanite/client-side-screen-recorder/actions/workflows/pages.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)


Capture your screen, tab, or window and optionally record microphone and supported system/tab audio, entirely in your browser. Export a real **MP4 (H.264 video + AAC audio)**. 

## Features

- Full display, browser tab, or application-window capture via `getDisplayMedia()`.
- Independent microphone and system/tab audio options; both sources are mixed through Web Audio when available.
- Live recording timer, pause/resume, manual stop, and stop when screen sharing ends.
- MP4 preview and local download; customizable target frame rate and H.264 bitrate.
- No recording data is transmitted to a server; static hosting on GitHub Pages.
- Responsive dark UI, GitHub Actions tests/build and Pages publishing.

## Local development

Requires Node.js **22+** and npm.

```bash
cd frontend/app
npm install
npm run dev
# visit http://localhost:5173
```

Build and test:

```bash
cd frontend/app
npm test
npm run typecheck
npm run build
npm run preview
```

Or use Docker:

```bash
docker compose up --build
# http://localhost:5173

docker compose -f docker-compose.test.yml up --build --exit-code-from frontend_test
```


## License

- Apache License 2.0 
