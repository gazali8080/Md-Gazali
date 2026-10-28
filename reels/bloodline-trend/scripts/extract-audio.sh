#!/usr/bin/env bash
# Copy the music out of a reference video, untouched, into public/audio/track.m4a.
# Usage: scripts/extract-audio.sh path/to/reference.mp4
set -euo pipefail
ffmpeg -nostats -hide_banner -loglevel error -y -i "$1" -vn -c:a copy public/audio/track.m4a
ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 public/audio/track.m4a
