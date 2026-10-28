import React from "react";
import { Composition } from "remotion";
import { Trend, TrendProps } from "./Trend";

// 15.6 s, the length of the supplied song.
export const DURATION = 468;

export const defaultTrendProps: TrendProps = {
  caption: "Imagine hating on me, when I am literally doing something which was never done in my entire bloodline",
  emoji: "🎓🥹",
  // Cut points sit on measured beats (public/audio/beats.json): beat 4, 11 and 17.
  shots: [
    { from: 0, src: "", trimBeforeSeconds: 0, label: "Walk-up", note: "From behind: you in the gown, heading for the stage" },
    { from: 83, src: "", trimBeforeSeconds: 0, label: "The stage", note: "Wide: your name is called, you walk across" },
    { from: 215, src: "", trimBeforeSeconds: 0, label: "The handover", note: "Receiving the degree, handshake, photo" },
    { from: 329, src: "", trimBeforeSeconds: 0, label: "The reaction", note: "Close-up: open the degree, look into the lens" },
  ],
  musicVolume: 1,
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Trend"
    component={Trend}
    durationInFrames={DURATION}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={defaultTrendProps}
  />
);
