import React from "react";
import { Audio } from "@remotion/media";
import { interpolate, staticFile, useCurrentFrame } from "remotion";

export type SfxName =
  | "tick"
  | "type"
  | "whoosh"
  | "impact"
  | "click"
  | "riser"
  | "chime"
  | "flash";

// One sound effect placed on the timeline. Volume is relative to the voice-free mix:
// hits sit around 0.6 to 0.8, ticks and taps around 0.25 to 0.4.
export const Sfx: React.FC<{ name: SfxName; from: number; volume?: number }> = ({
  name,
  from,
  volume = 0.6,
}) => (
  <Audio
    name={`sfx:${name}@${from}`}
    src={staticFile(`audio/sfx/${name}.wav`)}
    from={from}
    volume={volume}
    premountFor={15}
    onError={() => "fallback"}
  />
);

// The synthesized score with a few volume moves: a dip under the typed hook,
// full under the carousel, a soft breakdown, and a fade on the last beat.
export const Score: React.FC<{ gain?: number; dips?: Array<[number, number, number]> }> = ({
  gain = 1,
  dips = [],
}) => {
  const frame = useCurrentFrame();
  let v = 1;
  for (const [start, end, level] of dips) {
    if (frame >= start && frame < end) {
      const edge = 6;
      const inRamp = interpolate(frame, [start, start + edge], [1, level], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const outRamp = interpolate(frame, [end - edge, end], [level, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      v = Math.min(v, Math.max(inRamp, outRamp) === 1 ? level : Math.min(inRamp, outRamp));
    }
  }
  return (
    <Audio
      name="score"
      src={staticFile("audio/score.wav")}
      from={0}
      volume={v * gain}
      premountFor={30}
      onError={() => "fallback"}
    />
  );
};
