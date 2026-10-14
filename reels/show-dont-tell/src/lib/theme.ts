import { Easing } from "remotion";

// House look for @gazali.visuals: navy paper world, black flash world, white type, one accent.
export const C = {
  navy: "#050B1B",
  black: "#000000",
  white: "#F4F6FB",
  accent: "#4A8CFF",
  dim: "#7E88A6",
} as const;

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const BPM = 96;
export const FRAMES_PER_BEAT = (60 / BPM) * FPS; // 18.75
export const DURATION = 600; // 20 s
export const SAFE_TOP = 220; // Instagram UI zones
export const SAFE_BOTTOM = 380;

export const beatToFrame = (beat: number): number =>
  Math.round(beat * FRAMES_PER_BEAT);

export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_SNAP = Easing.bezier(0.2, 0.9, 0.1, 1);
