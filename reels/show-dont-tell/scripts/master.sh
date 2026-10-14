#!/usr/bin/env bash
# Two-pass loudness normalisation of a rendered MP4 to -14 LUFS (true peak -1 dBTP), then verification.
# Usage: scripts/master.sh out/reel.mp4 out/reel-master.mp4
set -euo pipefail
IN="$1"; OUT="$2"
TARGET_I=-14; TARGET_TP=-1; TARGET_LRA=11
echo "pass 1: measuring $IN"
JSON=$(ffmpeg -nostats -hide_banner -i "$IN" -af "loudnorm=I=$TARGET_I:TP=$TARGET_TP:LRA=$TARGET_LRA:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$JSON" | sed -n "s/.*\"$1\" *: *\"\([^\"]*\)\".*/\1/p"; }
II=$(get input_i); ITP=$(get input_tp); ILRA=$(get input_lra); ITH=$(get input_thresh); OFF=$(get target_offset)
echo "measured: I=$II LUFS, TP=$ITP dBTP, LRA=$ILRA LU"
echo "pass 2: writing $OUT"
ffmpeg -nostats -hide_banner -y -i "$IN" -c:v copy \
  -af "loudnorm=I=$TARGET_I:TP=$TARGET_TP:LRA=$TARGET_LRA:measured_I=$II:measured_TP=$ITP:measured_LRA=$ILRA:measured_thresh=$ITH:offset=$OFF:linear=true:print_format=summary" \
  -c:a aac -b:a 192k -ar 48000 "$OUT" 2>&1 | grep -E 'Output (Integrated|True Peak|LRA)' || true
echo "verify:"
ffmpeg -nostats -hide_banner -i "$OUT" -af "loudnorm=print_format=summary" -f null - 2>&1 | grep -E 'Input (Integrated|True Peak|LRA)'
