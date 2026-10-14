import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { C } from "./theme";
import { EASE_OUT } from "./theme";
import { useWorld } from "./primitives";

// VHS-style glitch: for `frames` after `from`, the child is cut into horizontal
// strips that slip sideways, with a faint accent/white split. Then it is clean.
export const Glitch: React.FC<{
  from: number;
  frames?: number;
  strips?: number;
  amount?: number;
  children: React.ReactNode;
}> = ({ from, frames = 6, strips = 7, amount = 40, children }) => {
  const frame = useCurrentFrame();
  const t = frame - from;
  if (t < 0 || t >= frames) return <AbsoluteFill>{children}</AbsoluteFill>;
  const decay = 1 - t / frames;
  return (
    <AbsoluteFill>
      {Array.from({ length: strips }).map((_, i) => {
        const top = (i / strips) * 100;
        const bottom = 100 - ((i + 1) / strips) * 100;
        const dx = (random(`gl-${i}-${t}`) - 0.5) * 2 * amount * decay;
        return (
          <AbsoluteFill
            key={i}
            style={{
              clipPath: `inset(${top}% 0 ${bottom}% 0)`,
              translate: `${dx}px 0`,
            }}
          >
            {children}
          </AbsoluteFill>
        );
      })}
      <AbsoluteFill
        style={{
          translate: `${6 * decay}px 0`,
          opacity: 0.35 * decay,
          mixBlendMode: "screen",
          filter: `drop-shadow(0 0 0 ${C.accent})`,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Comment-box call to action: the keyword types in letter by letter, then the
// send pill is pressed (dips to 94% and fills). No cursor arrow, no glow.
export const CommentCta: React.FC<{
  keyword: string;
  from: number;
  perLetter?: number;
  pressAt: number;
  label?: string;
  top: number;
  fontFamily: string;
}> = ({ keyword, from, perLetter = 3, pressAt, label = "DM", top, fontFamily }) => {
  const frame = useCurrentFrame();
  if (frame < from) return null;
  const t = frame - from;
  const shown = Math.min(keyword.length, Math.floor(t / perLetter) + 1);
  const typing = t < keyword.length * perLetter;
  const cursorOn = typing && Math.floor(t / 4) % 2 === 0;
  const press = interpolate(frame, [pressAt, pressAt + 3, pressAt + 9], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const filled = frame >= pressAt + 3;
  const rise = interpolate(t, [0, 8], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 96,
        right: 96,
        top,
        display: "flex",
        alignItems: "center",
        gap: 20,
        opacity: 1 - rise,
        translate: `0 ${rise * 40}px`,
        fontFamily,
      }}
    >
      <div
        style={{
          flex: 1,
          height: 170,
          border: `5px solid ${C.white}`,
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          paddingLeft: 48,
          fontSize: 72,
          fontWeight: 600,
          color: C.white,
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ color: C.accent, fontWeight: 500, marginRight: "0.4em" }}>{label}</span>
        <span>{keyword.slice(0, shown)}</span>
        <span
          style={{
            display: "inline-block",
            width: "0.5em",
            height: "0.95em",
            marginLeft: "0.1em",
            backgroundColor: C.accent,
            opacity: cursorOn ? 1 : 0,
          }}
        />
      </div>
      <div
        style={{
          width: 170,
          height: 170,
          borderRadius: 999,
          border: `5px solid ${C.accent}`,
          backgroundColor: filled ? C.accent : "transparent",
          scale: `${1 - press * 0.06}`,
          display: "grid",
          placeItems: "center",
        }}
      >
        <svg width={64} height={64} viewBox="0 0 12 12" shapeRendering="crispEdges">
          {[
            [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5],
            [6, 3], [7, 4], [7, 6], [6, 7],
          ].map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={filled ? C.navy : C.accent} />
          ))}
        </svg>
      </div>
    </div>
  );
};

// Chat bubble drawn in code: outlined rounded box with a tail, typed words inside.
export const Bubble: React.FC<{
  from: number;
  until?: number;
  tail: "left" | "right";
  x: number;
  y: number;
  width: number;
  fontFamily: string;
  fontSize?: number;
  stroke?: string;
  pad?: number;
  pop?: boolean;
  children: React.ReactNode;
}> = ({ from, until, tail, x, y, width, fontFamily, fontSize = 56, stroke = C.accent, pad = 34, pop = true, children }) => {
  const frame = useCurrentFrame();
  const world = useWorld();
  if (frame < from) return null;
  if (until !== undefined && frame >= until) return null;
  const t = frame - from;
  const popScale = pop
    ? interpolate(t, [0, 7], [0.92, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE_OUT,
      })
    : 1;
  const leave =
    until !== undefined
      ? interpolate(frame, [until - 5, until], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;
  const r = 44;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        scale: `${popScale}`,
        opacity: leave,
        transformOrigin: tail === "left" ? "left bottom" : "right bottom",
        fontFamily,
      }}
    >
      <div
        style={{
          border: `5px solid ${stroke}`,
          borderRadius: r,
          padding: `${pad}px ${pad + 10}px`,
          fontSize,
          fontWeight: 600,
          lineHeight: 1.18,
          backgroundColor: world.bg,
        }}
      >
        {children}
      </div>
      <svg
        width={60}
        height={40}
        viewBox="0 0 60 40"
        style={{
          position: "absolute",
          bottom: -34,
          left: tail === "left" ? 36 : undefined,
          right: tail === "right" ? 36 : undefined,
          scale: tail === "right" ? "-1 1" : "1 1",
        }}
      >
        <path d="M4 0 L54 0 L10 38 Z" fill={world.bg} stroke={stroke} strokeWidth={5} strokeLinejoin="miter" />
        <rect x={6} y={-6} width={46} height={10} fill={world.bg} />
      </svg>
    </div>
  );
};

// Splits its child into two halves that slide apart after `from`.
export const Halves: React.FC<{
  from: number;
  axis?: "x" | "y";
  gap?: number;
  frames?: number;
  children: React.ReactNode;
}> = ({ from, axis = "x", gap = 140, frames = 10, children }) => {
  const frame = useCurrentFrame();
  const t = frame - from;
  if (t < 0) return <AbsoluteFill>{children}</AbsoluteFill>;
  const d = interpolate(t, [0, frames], [0, gap], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  const a = axis === "x" ? `inset(0 50% 0 0)` : `inset(0 0 50% 0)`;
  const b = axis === "x" ? `inset(0 0 0 50%)` : `inset(50% 0 0 0)`;
  const ta = axis === "x" ? `${-d}px 0` : `0 ${-d}px`;
  const tb = axis === "x" ? `${d}px 0` : `0 ${d}px`;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: a, translate: ta }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ clipPath: b, translate: tb }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};
