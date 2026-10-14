import React from "react";
import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, EASE_OUT, EASE_SNAP } from "./theme";
import { IconName, PixelIcon } from "./icons";

// ---------- worlds ----------

export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.07 }) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 97;
  return (
    <AbsoluteFill style={{ opacity, mixBlendMode: "soft-light" }}>
      <svg width="100%" height="100%">
        <filter id={`grain-${seed}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            seed={seed}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

// Navy "paper" world or black "flash" world.
export const World: React.FC<{
  kind: "navy" | "black";
  children?: React.ReactNode;
}> = ({ kind, children }) => (
  <AbsoluteFill style={{ backgroundColor: kind === "navy" ? C.navy : C.black }}>
    {kind === "navy" ? <Grain /> : null}
    {children}
  </AbsoluteFill>
);

// White flash: full for `hold` frames, then falls off.
export const Flash: React.FC<{ from: number; hold?: number; fall?: number }> = ({
  from,
  hold = 2,
  fall = 5,
}) => {
  const frame = useCurrentFrame();
  const t = frame - from;
  if (t < 0 || t > hold + fall) return null;
  const opacity =
    t <= hold
      ? 1
      : interpolate(t, [hold, hold + fall], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  return (
    <AbsoluteFill style={{ backgroundColor: C.white, opacity, pointerEvents: "none" }} />
  );
};

// ---------- type ----------

export const Cursor: React.FC<{ visible: boolean; em?: number; color?: string }> = ({
  visible,
  em = 1,
  color = C.accent,
}) => (
  <span
    style={{
      display: "inline-block",
      width: `${0.5 * em}em`,
      height: `${0.95 * em}em`,
      backgroundColor: color,
      marginLeft: "0.12em",
      verticalAlign: "-0.12em",
      opacity: visible ? 1 : 0,
    }}
  />
);

// Words land one by one, typewriter style, with a blinking block cursor.
export const TypedLine: React.FC<{
  text: string;
  from: number;
  perWord?: number;
  until?: number; // frame after which the line is gone
  leaveFrames?: number;
  cursorHold?: number; // frames the cursor stays after the last word
  blink?: number;
  style?: React.CSSProperties;
  cursorColor?: string;
}> = ({
  text,
  from,
  perWord = 9,
  until,
  leaveFrames = 0,
  cursorHold = 20,
  blink = 8,
  style,
  cursorColor,
}) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  const t = frame - from;
  if (t < 0) return null;
  if (until !== undefined && frame >= until) return null;
  const shown = Math.min(words.length, Math.floor(t / perWord) + 1);
  const doneAt = (words.length - 1) * perWord;
  const cursorOn =
    t <= doneAt + cursorHold && Math.floor(t / blink) % 2 === 0;
  let leave = 1;
  if (until !== undefined && leaveFrames > 0) {
    leave = interpolate(frame, [until - leaveFrames, until], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }
  return (
    <div style={{ opacity: leave, ...style }}>
      {words.slice(0, shown).map((w, i) => {
        const age = t - i * perWord;
        const settle = interpolate(age, [0, 3], [4, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              translate: `0 ${settle}px`,
              marginRight: "0.28em",
            }}
          >
            {w}
          </span>
        );
      })}
      <Cursor visible={cursorOn} color={cursorColor} />
    </div>
  );
};

// A whole line that arrives on a cut or a rise, and leaves upward.
export const Line: React.FC<{
  from: number;
  until?: number;
  enter?: "cut" | "rise";
  riseFrames?: number;
  leaveFrames?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({
  from,
  until,
  enter = "rise",
  riseFrames = 8,
  leaveFrames = 5,
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  if (frame < from) return null;
  if (until !== undefined && frame >= until) return null;
  const t = frame - from;
  const rise =
    enter === "rise"
      ? interpolate(t, [0, riseFrames], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE_OUT,
        })
      : 0;
  let leave = 0;
  if (until !== undefined) {
    leave = interpolate(frame, [until - leaveFrames, until], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE_SNAP,
    });
  }
  return (
    <div
      style={{
        opacity: (1 - rise) * (1 - leave),
        translate: `0 ${rise * 40 - leave * 60}px`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ---------- impact ----------

// Focus ring: a dashed ring that snaps in with overshoot, a thin ring that rotates,
// and eight ticks that extend outward. All in the accent.
export const FocusRing: React.FC<{
  cx: number;
  cy: number;
  r: number;
  from: number;
  color?: string;
}> = ({ cx, cy, r, from, color = C.accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - from;
  if (t < 0) return null;
  const s = spring({ frame: t, fps, config: { damping: 9, stiffness: 180, mass: 0.6 } });
  const scale = interpolate(s, [0, 1], [0.55, 1]);
  const rot = t * 1.6;
  const tick = interpolate(t, [2, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  return (
    <svg
      width={r * 3}
      height={r * 3}
      viewBox={`${-r * 1.5} ${-r * 1.5} ${r * 3} ${r * 3}`}
      style={{
        position: "absolute",
        left: cx - r * 1.5,
        top: cy - r * 1.5,
        overflow: "visible",
      }}
    >
      <g style={{ scale: `${scale}` }}>
        <circle
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray="22 14"
          style={{ rotate: `${rot}deg` }}
        />
        <circle
          r={r * 0.82}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeDasharray="4 18"
          style={{ rotate: `${-rot * 1.7}deg` }}
          opacity={0.8}
        />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const r0 = r * 1.12;
          const r1 = r0 + 26 * tick;
          return (
            <line
              key={i}
              x1={Math.cos(a) * r0}
              y1={Math.sin(a) * r0}
              x2={Math.cos(a) * r1}
              y2={Math.sin(a) * r1}
              stroke={color}
              strokeWidth={6}
              strokeLinecap="square"
            />
          );
        })}
      </g>
    </svg>
  );
};

// One icon that pops in with overshoot; optional jitter for a few frames.
export const IconPop: React.FC<{
  name: IconName;
  size: number;
  x: number;
  y: number;
  from: number;
  jitterFrames?: number;
  ink?: string;
  accent?: string;
}> = ({ name, size, x, y, from, jitterFrames = 0, ink, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - from;
  if (t < 0) return null;
  const s = spring({ frame: t, fps, config: { damping: 10, stiffness: 220, mass: 0.7 } });
  const scale = interpolate(s, [0, 1], [0.3, 1]);
  const jx = t < jitterFrames ? (random(`jx-${name}-${t}`) - 0.5) * 18 : 0;
  const jy = t < jitterFrames ? (random(`jy-${name}-${t}`) - 0.5) * 18 : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2 + jx,
        top: y - size / 2 + jy,
        width: size,
        height: size,
        scale: `${scale}`,
      }}
    >
      <PixelIcon name={name} size={size} ink={ink} accent={accent} />
    </div>
  );
};

// ---------- carousel ----------

// Icons orbit on a ring. They pop in one after another; after `scatterAt` they fly off.
export const IconRing: React.FC<{
  icons: IconName[];
  cx: number;
  cy: number;
  radius: number;
  size: number;
  from: number;
  degPerFrame?: number;
  stagger?: number;
  scatterAt?: number;
  highlight?: { index: number; from: number; until: number } | null;
}> = ({
  icons,
  cx,
  cy,
  radius,
  size,
  from,
  degPerFrame = 0.9,
  stagger = 2,
  scatterAt,
  highlight = null,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - from;
  if (t < 0) return null;
  const base = t * degPerFrame;
  return (
    <>
      {icons.map((name, i) => {
        const tIn = t - i * stagger;
        if (tIn < 0) return null;
        const s = spring({ frame: tIn, fps, config: { damping: 11, stiffness: 200, mass: 0.6 } });
        const a = ((base + (i / icons.length) * 360) * Math.PI) / 180;
        let x = cx + Math.cos(a) * radius;
        let y = cy + Math.sin(a) * radius * 0.62; // squashed ring, like a tilted carousel
        const depth = (Math.sin(a) + 1) / 2; // 0 back, 1 front
        let scale = interpolate(s, [0, 1], [0.2, 1]) * (0.72 + depth * 0.4);
        let rot = 0;
        let opacity = 0.75 + depth * 0.25;
        if (scatterAt !== undefined && frame >= scatterAt) {
          const u = frame - scatterAt;
          const vx = (random(`vx-${name}`) - 0.5) * 70;
          const vy = -30 - random(`vy-${name}`) * 40;
          x += vx * u;
          y += vy * u + 0.5 * 9.5 * u * u;
          rot = (random(`r-${name}`) - 0.5) * 12 * u;
          opacity = 1;
        }
        const dim =
          highlight && frame >= highlight.from && frame < highlight.until && highlight.index !== i
            ? 0.25
            : 1;
        return (
          <div
            key={name}
            style={{
              position: "absolute",
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              height: size,
              scale: `${scale}`,
              rotate: `${rot}deg`,
              opacity: opacity * dim,
              zIndex: Math.round(depth * 10),
            }}
          >
            <PixelIcon name={name} size={size} />
          </div>
        );
      })}
    </>
  );
};

// ---------- payoff word ----------

// Letters fly in from scattered offsets and settle into one word; each arriving
// letter brings a small icon that vanishes as it lands.
export const SerifWord: React.FC<{
  word: string;
  from: number;
  perLetter?: number;
  icons?: IconName[];
  style?: React.CSSProperties;
  iconSize?: number;
}> = ({ word, from, perLetter = 6, icons = [], style, iconSize = 60 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - from;
  if (t < 0) return null;
  const letters = word.split("");
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", ...style }}>
      {letters.map((ch, i) => {
        const tl = t - i * perLetter;
        if (tl < 0) {
          return (
            <span key={i} style={{ display: "inline-block", opacity: 0 }}>
              {ch}
            </span>
          );
        }
        const s = spring({ frame: tl, fps, config: { damping: 13, stiffness: 120, mass: 0.8 } });
        const ox = (random(`sx-${word}-${i}`) - 0.5) * 900;
        const oy = (random(`sy-${word}-${i}`) - 0.5) * 700;
        const x = ox * (1 - s);
        const y = oy * (1 - s);
        const rot = (random(`sr-${word}-${i}`) - 0.5) * 80 * (1 - s);
        const iconOpacity = interpolate(tl, [0, 5, 9], [1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const icon = icons.length ? icons[i % icons.length] : null;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              position: "relative",
              translate: `${x}px ${y}px`,
              rotate: `${rot}deg`,
              opacity: interpolate(tl, [0, 2], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            {ch}
            {icon && iconOpacity > 0 ? (
              <span
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "-0.55em",
                  translate: "-50% 0",
                  opacity: iconOpacity,
                }}
              >
                <PixelIcon name={icon} size={iconSize} />
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
};

// Slow drift so held frames never freeze.
export const Drift: React.FC<{
  from: number;
  pxPerFrame?: number;
  scalePerFrame?: number;
  children: React.ReactNode;
}> = ({ from, pxPerFrame = 0.15, scalePerFrame = 0.00025, children }) => {
  const frame = useCurrentFrame();
  const t = Math.max(0, frame - from);
  return (
    <AbsoluteFill
      style={{
        translate: `0 ${-t * pxPerFrame}px`,
        scale: `${1 + t * scalePerFrame}`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
