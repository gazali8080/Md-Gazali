import React from "react";
import { Audio, Video } from "@remotion/media";
import { fitText } from "@remotion/layout-utils";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CAPTION_FONT } from "./fonts";

export type Shot = {
  from: number; // first frame of the shot
  src: string; // file in public/clips, e.g. "clips/shot1.mp4"; empty shows the storyboard card
  trimBeforeSeconds: number; // where in the clip to start
  label: string;
  note: string;
};

export type TrendProps = {
  caption: string;
  emoji: string;
  shots: Shot[];
  musicVolume: number;
};

const W = 1080;
// The reference caption block spans about 40% of the frame width and starts 22% down.
const CAPTION_TOP = 420;
const CAPTION_WIDTH = 470;

// Placeholder shown until a clip is supplied: what to film, and for how long.
const StoryboardCard: React.FC<{ index: number; shot: Shot; seconds: number }> = ({ index, shot, seconds }) => {
  const frame = useCurrentFrame();
  // A slow push so the preview has the drift of a handheld phone shot.
  const scale = 1 + frame * 0.0006;
  return (
    <AbsoluteFill style={{ backgroundColor: "#15171C" }}>
      <AbsoluteFill
        style={{
          scale: String(scale),
          background: `radial-gradient(120% 70% at 50% ${30 + index * 12}%, #2A2E38 0%, #15171C 70%)`,
        }}
      />
      <div style={{ position: "absolute", left: 96, right: 96, top: 1080, fontFamily: CAPTION_FONT, color: "#F4F4F2" }}>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "0.12em", opacity: 0.55 }}>
          SHOT {index + 1} · {seconds.toFixed(1)}s
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, marginTop: 18 }}>{shot.label}</div>
        <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.3, marginTop: 22, opacity: 0.7, maxWidth: 820 }}>
          {shot.note}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Caption: React.FC<{ caption: string; emoji: string }> = ({ caption, emoji }) => {
  // Size so the longest line wraps like the reference: about 15 characters per line.
  const { fontSize } = fitText({ text: "something which", withinWidth: CAPTION_WIDTH, fontFamily: CAPTION_FONT, fontWeight: "800" });
  return (
    <div
      style={{
        position: "absolute",
        top: CAPTION_TOP,
        left: (W - CAPTION_WIDTH - 60) / 2,
        width: CAPTION_WIDTH + 60,
        textAlign: "center",
        fontFamily: CAPTION_FONT,
        fontWeight: 800,
        fontSize,
        lineHeight: 1.2,
        color: "#FFFFFF",
        // Instagram-style legibility: a tight dark edge plus a soft drop, no box.
        textShadow: "0 0 3px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.45)",
      }}
    >
      {caption}
      {emoji ? <div style={{ fontSize: fontSize * 0.8, marginTop: 6, textShadow: "none" }}>{emoji}</div> : null}
    </div>
  );
};

export const Trend: React.FC<TrendProps> = ({ caption, emoji, shots, musicVolume }) => {
  const { durationInFrames, fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {shots.map((shot, i) => {
        const until = i + 1 < shots.length ? shots[i + 1].from : durationInFrames;
        const len = until - shot.from;
        return (
          <Sequence key={shot.label} name={`Shot ${i + 1}: ${shot.label}`} from={shot.from} durationInFrames={len} premountFor={fps}>
            {shot.src ? (
              <Video
                src={staticFile(shot.src)}
                trimBefore={Math.round(shot.trimBeforeSeconds * fps)}
                volume={0}
                objectFit="cover"
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <StoryboardCard index={i} shot={shot} seconds={len / fps} />
            )}
          </Sequence>
        );
      })}
      <Caption caption={caption} emoji={emoji} />
      <Audio name="music" src={staticFile("audio/track.m4a")} volume={musicVolume} />
    </AbsoluteFill>
  );
};
