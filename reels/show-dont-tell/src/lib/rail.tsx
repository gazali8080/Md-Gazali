import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, spring, Easing } from "remotion";
import { C, EASE_OUT } from "./theme";
import { IconName, PixelIcon } from "./icons";

const EASE_BACK = Easing.bezier(0.34, 1.56, 0.64, 1);

export type Lift = { name: IconName; from: number };

// A horizontal strip of icons on one baseline. It slides in from the right at
// `from`, snaps one slot to the left at each frame in `snapAt`, lifts named icons
// (with an azure hard shadow) after their lift frame, and can push icons off the
// sides at `clearAt` keeping only `keep`. Wraps so a slot is never empty.
export const IconRail: React.FC<{
  icons: IconName[];
  y: number;
  size?: number;
  pitch?: number;
  from: number;
  until?: number;
  snapAt?: number[];
  lifts?: Lift[];
  clearAt?: number;
  keep?: IconName[];
  bob?: boolean;
}> = ({
  icons,
  y,
  size = 96,
  pitch = 132,
  from,
  until,
  snapAt = [],
  lifts = [],
  clearAt,
  keep = [],
  bob = true,
}) => {
  const frame = useCurrentFrame();
  if (frame < from) return null;
  if (until !== undefined && frame >= until) return null;
  const t = frame - from;
  const enter = interpolate(t, [0, 8], [1080, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  // slots advanced so far, with an eased step for the snap in progress
  let slots = 0;
  for (const s of snapAt) {
    if (frame >= s) {
      slots += interpolate(frame, [s, s + 6], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE_BACK,
      });
    }
  }
  const n = icons.length;
  const total = n * pitch;
  const centerX = 540;
  const clearing = clearAt !== undefined && frame >= clearAt;
  return (
    <>
      {icons.map((name, i) => {
        // base position: icon i sits at centre + (i - slots) * pitch, wrapped
        let rel = ((i - slots) * pitch + total / 2) % total;
        if (rel < 0) rel += total;
        rel -= total / 2;
        let x = centerX + rel + enter;
        const lift = lifts.find((l) => l.name === name);
        const lifted = lift && frame >= lift.from;
        const liftY = lifted
          ? interpolate(frame, [lift.from, lift.from + 3], [0, -24], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : 0;
        const bobY = bob && !lifted ? Math.sin((frame + i * 7) / 9) * 3 : 0;
        let opacity = 1;
        if (clearing && !keep.includes(name)) {
          const u = frame - clearAt;
          const dir = rel < 0 ? -1 : 1;
          x += dir * interpolate(u, [0, 8], [0, 900], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          });
          opacity = u > 8 ? 0 : 1;
        } else if (clearing && keep.includes(name)) {
          // kept icons gather into a column on the left
          const k = keep.indexOf(name);
          const u = interpolate(frame, [clearAt, clearAt + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE_OUT,
          });
          x = x + (140 - x) * u;
          const targetY = y - 160 + k * 160;
          return (
            <RailIcon key={name} name={name} x={x} y={y + (targetY - y) * u + liftY} size={size} shadow={!!lifted} opacity={opacity} />
          );
        }
        if (Math.abs(rel) > 700) return null;
        return (
          <RailIcon key={name} name={name} x={x} y={y + liftY + bobY} size={size} shadow={!!lifted} opacity={opacity} />
        );
      })}
    </>
  );
};

export const RailIcon: React.FC<{
  name: IconName;
  x: number;
  y: number;
  size: number;
  shadow?: boolean;
  opacity?: number;
}> = ({ name, x, y, size, shadow = false, opacity = 1 }) => (
  <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, opacity }}>
    {shadow ? (
      <div style={{ position: "absolute", left: 10, top: 10 }}>
        <PixelIcon name={name} size={size} ink={C.accent} accent={C.accent} />
      </div>
    ) : null}
    <div style={{ position: "absolute", left: 0, top: 0 }}>
      <PixelIcon name={name} size={size} />
    </div>
  </div>
);

// Selection marquee: a thin accent rectangle with four square corner handles
// that snaps on from 1.3x with overshoot.
export const Marquee: React.FC<{
  cx: number;
  cy: number;
  w: number;
  h: number;
  from: number;
  until?: number;
  flicker?: boolean;
}> = ({ cx, cy, w, h, from, until, flicker = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < from) return null;
  if (until !== undefined && frame >= until) return null;
  const t = frame - from;
  const s = spring({ frame: t, fps, config: { damping: 12, stiffness: 260, mass: 0.5 } });
  const scale = interpolate(s, [0, 1], [1.3, 1]);
  if (flicker && t % 4 >= 2) return null;
  const hs = 16;
  return (
    <svg
      width={w + hs * 2}
      height={h + hs * 2}
      viewBox={`${-hs} ${-hs} ${w + hs * 2} ${h + hs * 2}`}
      style={{ position: "absolute", left: cx - w / 2 - hs, top: cy - h / 2 - hs, scale: `${scale}`, overflow: "visible" }}
    >
      <rect x={0} y={0} width={w} height={h} fill="none" stroke={C.accent} strokeWidth={4} />
      {[[0, 0], [w, 0], [0, h], [w, h]].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x - hs / 2} y={y - hs / 2} width={hs} height={hs} fill={C.accent} />
      ))}
    </svg>
  );
};

// A vertical accent bar sweeps left to right and reveals the text behind its leading edge.
export const PlayheadReveal: React.FC<{
  from: number;
  frames?: number;
  x0?: number;
  x1?: number;
  barW?: number;
  barH?: number;
  barY?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ from, frames = 10, x0 = 80, x1 = 1000, barW = 20, barH = 300, barY = 860, style, children }) => {
  const frame = useCurrentFrame();
  if (frame < from) return null;
  const t = frame - from;
  const x = interpolate(t, [0, frames], [x0, x1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const done = t > frames + 2;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, clipPath: done ? undefined : `inset(0 ${1080 - x}px 0 0)`, ...style }}>
        {children}
      </div>
      {!done ? (
        <div style={{ position: "absolute", left: x - barW / 2, top: barY - barH / 2, width: barW, height: barH, backgroundColor: C.accent }} />
      ) : null}
    </>
  );
};

// An accent line that draws from left to right.
export const DrawLine: React.FC<{
  x: number;
  y: number;
  width: number;
  from: number;
  frames?: number;
  thickness?: number;
  until?: number;
}> = ({ x, y, width, from, frames = 9, thickness = 6, until }) => {
  const frame = useCurrentFrame();
  if (frame < from) return null;
  if (until !== undefined && frame >= until) return null;
  const w = interpolate(frame - from, [0, frames], [0, width], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  return <div style={{ position: "absolute", left: x, top: y, width: w, height: thickness, backgroundColor: C.accent }} />;
};
