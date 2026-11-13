#!/usr/bin/env sh
# Runs on the Linux HOST, never inside the web application's Docker container.
set -eu
if ! command -v pactl >/dev/null 2>&1; then
  echo 'ERROR: pactl is required (PulseAudio / PipeWire PulseAudio compatibility)' >&2
  exit 1
fi
if pactl list short sources | grep -q '[[:space:]]screenrec_loopback[[:space:]]'; then
  echo 'ScreenRec_Loopback already exists; no duplicate module loaded.'
  exit 0
fi
sink=$(pactl get-default-sink)
if [ -z "$sink" ]; then
  echo 'ERROR: No default audio sink was found.' >&2
  exit 1
fi
monitor="${sink}.monitor"
if ! pactl list short sources | grep -Fq "$monitor"; then
  echo "ERROR: $monitor is not an available PulseAudio monitor source." >&2
  exit 1
fi
module_id=$(pactl load-module module-remap-source \
  master="$monitor" \
  source_name=screenrec_loopback \
  source_properties=device.description=ScreenRec_Loopback)
echo "Created ScreenRec_Loopback (module $module_id)."
echo 'Refresh PC audio source in Chrome, select ScreenRec_Loopback, and play sound.'
echo "Remove later with: pactl unload-module $module_id"
