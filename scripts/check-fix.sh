#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
grep -q 'data-build="rec-20261113-v8"' frontend/app/src/App.tsx
grep -q 'registerAacEncoder();' frontend/app/src/lib/recorder.ts
grep -q 'No video frames were encoded' frontend/app/src/lib/recorder.ts
grep -q 'encoderErrorRef' frontend/app/src/hooks/useScreenRecorder.ts
! grep -q 'HOW IT WORKS' frontend/app/src/App.tsx
grep -q 'v8' frontend/app/src/App.tsx
printf '%s\n' 'PASS: rec-20261113-v8 local UI and recording fix present'
