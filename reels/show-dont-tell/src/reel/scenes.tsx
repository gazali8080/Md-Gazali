import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { measureText } from "@remotion/layout-utils";
import { C, EASE_OUT, EASE_SNAP, W } from "../lib/theme";
import { DISPLAY, UI } from "../lib/fonts";
import { IconName, PixelIcon } from "../lib/icons";
import { Drift, IconPop, Line, TypedLine } from "../lib/primitives";
import { Bubble, Halves } from "../lib/effects";
import { DrawLine, Marquee, PlayheadReveal } from "../lib/rail";
import { T } from "./timings";

// Type scale: 72 (bubble text), 80 (headline, list), 128 (display words), 250 (serif payoff).
const BUBBLE = 72;
const BODY = 80;
const DISPLAY_WORD = 128;
const SERIF = 250;
const PAD = 36;
const measure = (text: string, fontSize: number, fontWeight: string, fontFamily = UI) =>
  measureText({ text, fontFamily, fontSize, fontWeight }).width;

// A word or line that lands all at once with a scale kick.
const Stamp: React.FC<{ from: number; until?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ from, until, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < from) return null;
  if (until !== undefined && frame >= until) return null;
  const s = spring({ frame: frame - from, fps, config: { damping: 14, stiffness: 300, mass: 0.5 } });
  const kick = frame - from === 1 ? 4 : 0;
  return <div style={{ scale: `${interpolate(s, [0, 1], [1.15, 1])}`, translate: `0 ${kick}px`, ...style }}>{children}</div>;
};

// ---------- 1. Hook: the editor's DM, received ----------
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame >= T.cutBlack1) return null;
  const bx = 96;
  const by = 720;
  const caret = 0.62 * BUBBLE + 8;
  const line1 = measure("Coach, your clips", BUBBLE, "600");
  const bw = springWidth(frame, fps, [
    [0, Math.max(line1, measure("get views.", BUBBLE, "600") + caret)],
    [T.hookLine2[0] - 4, Math.max(line1, measure("No", BUBBLE, "600") + caret)],
    [T.hookLine2[1] - 4, Math.max(line1, measure("No booked", BUBBLE, "600") + caret)],
    [T.hookLine2[2] - 4, Math.max(line1, measure("No booked calls.", BUBBLE, "600") + caret)],
  ]);
  return (
    <AbsoluteFill>
      <Bubble from={0} tail="left" x={bx} y={by} width={bw} fontFamily={UI} fontSize={BUBBLE} pad={PAD} pop={false}>
        <Stamp from={T.hookLine1} style={{ whiteSpace: "nowrap" }}>
          Coach, your clips
          <br />
          get views.
          {frame < T.hookLine2[0] ? <span style={{ display: "inline-block", width: "0.62em", height: "0.95em", verticalAlign: "-0.12em", marginLeft: "0.12em", backgroundColor: C.accent, opacity: Math.floor(frame / 8) % 2 === 0 ? 1 : 0 }} /> : null}
        </Stamp>
        <TypedLine text="No booked calls." from={T.hookLine2[0]} at={[...T.hookLine2]} cursorHold={200} style={{ whiteSpace: "nowrap" }} />
        <div style={{ position: "relative", height: 0 }}>
          <DrawLine x={0} y={-6} width={measure("No booked calls.", BUBBLE, "600")} from={T.hookLine2[2]} frames={6} thickness={10} />
        </div>
      </Bubble>
      {T.plays.map((f, i) => (
        <IconPop key={f} name="play" size={96} x={900 - i * 80} y={656 - i * 88} from={f} fromScale={0.2} />
      ))}
      <IconPop name="calendar-open" size={120} x={920} y={1150} from={T.calendarStamp} fromScale={1.3} preset="slam" shakeAt={T.calendarShake} />
    </AbsoluteFill>
  );
};

// ---------- 2. Answer: black, "it was never / the edit." ----------
const Marker: React.FC<{ from: number; frames: number; x0: number; x1: number; y: number; h: number }> = ({ from, frames, x0, x1, y, h }) => {
  const frame = useCurrentFrame();
  const t = frame - from;
  if (t < 0 || t > frames) return null;
  const x = interpolate(t, [0, frames], [x0, x1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  return <div style={{ position: "absolute", left: x - 4, top: y - h / 2, width: 8, height: h, backgroundColor: C.accent }} />;
};

export const AnswerScene: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.cutBlack1 || frame >= T.flash1) return null;
  const editW = measure("the edit.", DISPLAY_WORD, "700");
  return (
    <AbsoluteFill style={{ textAlign: "center" }}>
      <TypedLine text="it was never" from={T.answerWords[0]} at={[...T.answerWords]} land="snap" style={{ position: "absolute", left: 0, top: 560, width: W, fontSize: DISPLAY_WORD, fontWeight: 600, lineHeight: 1.1 }} />
      <Halves from={T.split} axis="x" gap={48} frames={4}>
        <IconPop name="timeline" size={240} x={540} y={900} from={T.slam} fromScale={1.6} preset="slam" shadowAt={T.slamShadow} />
      </Halves>
      <Marker from={T.marker} frames={9} x0={420} x1={660} y={900} h={300} />
      <Stamp from={T.theEdit} style={{ position: "absolute", left: 0, top: 1100, width: W, fontSize: DISPLAY_WORD, fontWeight: 700, lineHeight: 1.1 }}>
        the edit.
      </Stamp>
      <DrawLine x={540 - editW / 2} y={1100 + DISPLAY_WORD * 0.6} width={editW} from={T.strike} frames={10} thickness={8} />
    </AbsoluteFill>
  );
};

// ---------- 3. Strategy row (paper): seven icons; three are named and lifted, the rest deleted ----------
const ROW: Array<{ name: IconName; x: number }> = [
  { name: "phone-clip", x: 156 },
  { name: "play", x: 284 },
  { name: "hook", x: 412 },
  { name: "question", x: 540 },
  { name: "calendar-open", x: 668 },
  { name: "stopwatch", x: 796 },
  { name: "dm", x: 924 },
];
const ROW_Y = 920;
const ROW_SIZE = 120;
const STACK: Record<string, { x: number; y: number }> = {
  hook: { x: 300, y: 720 },
  question: { x: 300, y: 920 },
  "calendar-open": { x: 300, y: 1120 },
};
const LIFT_AT: Record<string, number> = { hook: T.lifts.hook, question: T.lifts.question, "calendar-open": T.lifts.calendar };

const RowIcon: React.FC<{ name: IconName; x: number; index: number }> = ({ name, x, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const del = T.deletePairs.find((d) => d.names.includes(name));
  if (del && frame >= del.at + 3) return null;
  // entrance from the right, staggered
  const tIn = frame - T.row - index * 2;
  const enter = interpolate(tIn, [0, 10], [1080, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const liftAt = LIFT_AT[name];
  const lifted = liftAt !== undefined && frame >= liftAt;
  const liftY = lifted ? interpolate(frame, [liftAt, liftAt + 4], [0, -64], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_SNAP }) : 0;
  const bob = !lifted && frame >= T.row + 20 ? (Math.floor(frame / 9.375) % 2 === index % 2 ? 4 : -4) : 0;
  // CRT-style deletion: azure flash for a frame, then collapse to a line
  let scaleY = 1;
  let flash = false;
  if (del && frame >= del.at) {
    const u = frame - del.at;
    flash = u === 0;
    scaleY = interpolate(u, [1, 3], [1, 0.02], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  }
  // the survivors spring into a stack
  let px = x + enter;
  let py = ROW_Y + liftY + bob;
  const target = STACK[name];
  if (target && frame >= T.stack) {
    const s = spring({ frame: frame - T.stack, fps, config: { damping: 12, stiffness: 150, mass: 0.8 } });
    px = x + (target.x - x) * s;
    py = ROW_Y + liftY + (target.y - ROW_Y - liftY) * s;
  }
  const shown: IconName = name === "calendar-open" && frame >= T.stack ? "calendar" : name;
  const size = ROW_SIZE;
  return (
    <div style={{ position: "absolute", left: px - size / 2, top: py - size / 2, width: size, height: size, scale: `1 ${scaleY}` }}>
      {lifted ? (
        <div style={{ position: "absolute", left: 12, top: 12 }}>
          <PixelIcon name={shown} size={size} ink={C.accent} accent={C.accent} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 0, top: 0 }}>
        <PixelIcon name={shown} size={size} ink={flash ? C.accent : undefined} />
      </div>
    </div>
  );
};

export const RowScene: React.FC = () => {
  const frame = useCurrentFrame();
  const onPaper =
    (frame >= T.flash1 && frame < T.words[0].cut) ||
    (frame >= T.words[0].back && frame < T.words[1].cut) ||
    (frame >= T.words[1].back && frame < T.words[2].cut) ||
    (frame >= T.words[2].back && frame < T.flash2);
  if (!onPaper) return null;
  const rows = [STACK.hook.y, STACK.question.y, STACK["calendar-open"].y];
  const listText = ["Hook.", "Who.", "Ask."];
  return (
    <AbsoluteFill>
      <TypedLine text="Strategy first." from={T.strategyFirst[0]} at={[...T.strategyFirst]} until={T.stack} land="snap" style={{ position: "absolute", left: 0, top: 700, width: W, textAlign: "center", fontSize: BODY, fontWeight: 700, lineHeight: 1.1 }} />
      {ROW.map((r, i) => (
        <RowIcon key={r.name} name={r.name} x={r.x} index={i} />
      ))}
      {listText.map((text, i) => (
        <Line key={text} from={T.listWords[i]} enter="cut" style={{ position: "absolute", left: 440, top: rows[i] - BODY * 0.6, fontSize: BODY, fontWeight: 700, lineHeight: 1.2 }}>
          {text}
        </Line>
      ))}
      {T.checks.map((f, i) => (
        <IconPop key={f} name="check" size={84} x={860} y={rows[i]} from={f} fromScale={1.2} preset="slam" />
      ))}
    </AbsoluteFill>
  );
};

// ---------- 3b. Cutaways: black, three different compositions ----------
const WordCenter: React.CSSProperties = { position: "absolute", left: 0, width: W, textAlign: "center", fontSize: DISPLAY_WORD, fontWeight: 700, lineHeight: 1.1 };

// Pulled up by the hook that just swung in.
const HangWord: React.FC<{ from: number; top: number; children: React.ReactNode }> = ({ from, top, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < from) return null;
  const s = spring({ frame: frame - from, fps, config: { damping: 9, stiffness: 120, mass: 0.9 } });
  return (
    <div style={{ ...WordCenter, top, translate: `0 ${Math.max(-30, (1 - s) * 360)}px`, opacity: interpolate(s, [0, 0.15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
      {children}
    </div>
  );
};

// A tap: the hand dips and an azure ring expands from the fingertip.
const TapRing: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > 8) return null;
  const r = interpolate(t, [0, 5], [6, 52], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT });
  const o = interpolate(t, [3, 8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={140} height={140} viewBox="-70 -70 140 140" style={{ position: "absolute", left: x - 70, top: y - 70, opacity: o }}>
      <circle r={r} fill="none" stroke={C.accent} strokeWidth={6} />
    </svg>
  );
};

export const WordScenes: React.FC = () => {
  const frame = useCurrentFrame();
  const [A, B, Cw] = T.words;
  const pressed = frame >= T.tapPress;
  return (
    <>
      {frame >= A.cut && frame < A.back ? (
        <AbsoluteFill>
          <DropLine from={A.cut} x={540} toY={820 - 128} />
          <IconPop name="hook" size={252} x={540} y={820} from={A.cut} preset="swing" fromDy={-520} fromScale={1} shadowAt={A.shadowAt} />
          <HangWord from={A.wordAt} top={1060}>
            {A.text}
          </HangWord>
        </AbsoluteFill>
      ) : null}
      {frame >= B.cut && frame < B.back ? (
        <AbsoluteFill>
          <Stamp from={B.cut} style={{ position: "absolute", left: 96, top: 700, fontSize: DISPLAY_WORD, fontWeight: 700, lineHeight: 1.1 }}>
            {B.text}
          </Stamp>
          <IconPop name="question" size={252} x={264} y={1040} from={B.iconAt} fromScale={1.3} preset="slam" />
          <Marquee cx={264} cy={1040} w={324} h={324} from={B.marqueeAt} />
        </AbsoluteFill>
      ) : null}
      {frame >= Cw.cut && frame < Cw.back ? (
        <AbsoluteFill>
          <IconPop name={pressed ? "calendar" : "calendar-open"} size={252} x={540} y={1060} from={Cw.cut} fromScale={1.3} preset="slam" accent={frame >= T.tapPress && frame < T.tapPress + 2 ? C.white : undefined} />
          <TypedLine text={Cw.text} from={Cw.wordAt} land="snap" style={{ ...WordCenter, top: 660 }} />
          <Hand from={T.tapEnter} tipX={548} tipY={1092} fromDx={640} pressAt={T.tapPress} />
          <TapRing at={T.tapPress} x={548} y={1100} />
        </AbsoluteFill>
      ) : null}
    </>
  );
};

// A thin accent line that drops from the top edge (the hook's line).
const DropLine: React.FC<{ from: number; x: number; toY: number }> = ({ from, x, toY }) => {
  const frame = useCurrentFrame();
  const t = frame - from;
  if (t < 0) return null;
  const h = interpolate(t, [0, 8], [0, toY], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT });
  return <div style={{ position: "absolute", left: x - 2, top: 0, width: 4, height: h, backgroundColor: C.accent }} />;
};

// The pixel hand (168 px, 14 px cells), placed by its fingertip: enters from the right on a
// straight line, presses at pressAt, can hover and leave.
const HAND = 168;
const Hand: React.FC<{ from: number; tipX: number; tipY: number; fromDx: number; pressAt?: number; hoverFrom?: number; leaveAt?: number }> = ({ from, tipX, tipY, fromDx, pressAt, hoverFrom, leaveAt }) => {
  const frame = useCurrentFrame();
  if (frame < from) return null;
  const t = frame - from;
  let dx = interpolate(t, [0, 8], [fromDx, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  let dy = 0;
  let scale = 1;
  if (pressAt !== undefined && frame >= pressAt) {
    const u = frame - pressAt;
    scale = interpolate(u, [0, 2, 4], [1, 0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    dy = u < 3 ? 8 : 0;
  }
  if (hoverFrom !== undefined && frame >= hoverFrom) dy += Math.floor((frame - hoverFrom) / 2) % 2 === 0 ? 0 : 2;
  if (leaveAt !== undefined && frame >= leaveAt) {
    dx += interpolate(frame - leaveAt, [0, 6], [0, 700], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  }
  return (
    <div style={{ position: "absolute", left: tipX - HAND / 2 + dx, top: tipY - 7 + dy, width: HAND, height: HAND, scale: `${scale}`, transformOrigin: "50% 4%" }}>
      <PixelIcon name="tap" size={HAND} />
    </div>
  );
};

// ---------- 4. Payoff: a playhead reveals the serif word; the hand taps the period into place ----------
export const PayoffScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < T.payoff || frame >= T.cutPaper) return null;
  const s = spring({ frame: frame - T.period, fps, config: { damping: 12, stiffness: 300, mass: 0.5 } });
  const periodScale = frame >= T.period ? interpolate(s, [0, 1], [1.4, 1]) : 0;
  const wordW = measure("strategy", SERIF, "400", DISPLAY);
  const periodX = 540 + wordW / 2 + 12;
  return (
    <Drift from={T.handLeave} pxPerFrame={0.1} scalePerFrame={0.0003}>
      <PlayheadReveal from={T.payoff} frames={T.playheadFrames} x0={200} x1={880} barY={960} barH={1080} barW={16}>
        <div style={{ position: "absolute", left: 0, top: 760, width: W, textAlign: "center", fontFamily: DISPLAY, fontStyle: "italic", fontSize: SERIF, lineHeight: 1.1 }}>
          strategy
          <span style={{ display: "inline-block", scale: `${periodScale}` }}>.</span>
        </div>
      </PlayheadReveal>
      <Hand from={T.handEnter} tipX={periodX + 6} tipY={978} fromDx={420} pressAt={T.period} hoverFrom={T.handHover} leaveAt={T.handLeave} />
      <TapRing at={T.period} x={periodX + 8} y={966} />
      <Marker from={T.scrub} frames={18} x0={880} x1={200} y={960} h={1080} />
    </Drift>
  );
};

// ---------- 5. Reply: the viewer's DM, typing dots, then the keyword ----------
const Dots: React.FC<{ from: number; until: number }> = ({ from, until }) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= until) return null;
  const active = Math.floor((frame - from) / 9.375) % 3;
  return (
    <span style={{ display: "inline-flex", gap: 14, alignItems: "center", height: "1.18em" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: C.accent, opacity: i === active ? 1 : 0.35 }} />
      ))}
    </span>
  );
};

const INNER = PAD * 2 + 20 + 10; // padding, side padding extra, border
// A bubble width that springs from state to state: [frame, content width] pairs.
const springWidth = (frame: number, fps: number, states: Array<[number, number]>) => {
  let w = states[0][1];
  let prev = w;
  for (const [at, target] of states) {
    if (frame >= at) {
      const sp = spring({ frame: frame - at, fps, config: { damping: 12, stiffness: 220, mass: 0.6 } });
      w = prev + (target - prev) * sp;
      prev = target;
    }
  }
  return Math.min(888, w + INNER);
};
// Each width change starts five frames before its word lands, so nothing is clipped.
const replyWidth = (frame: number, fps: number) =>
  springWidth(frame, fps, [
    [T.cutPaper, 3 * 18 + 2 * 14 + 20],
    [T.ctaWords[0] - 5, measure("DM", BODY, "700") + 0.62 * BODY + 8],
    [T.ctaWords[1] - 5, measure("DM STRATEGY", BODY, "700") + 0.62 * BODY + 8],
  ]);

export const ReplyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < T.cutPaper) return null;
  if (frame >= T.loopReset) {
    // frame 0's state: an empty received bubble, so the loop lands on the hook
    return (
      <Bubble from={T.loopReset} tail="left" x={96} y={720} width={measure("Coach, your clips", BUBBLE, "600") + INNER} fontFamily={UI} fontSize={BUBBLE} pad={PAD} pop={false}>
        <div style={{ minHeight: "2.36em" }}>
          <span style={{ display: "inline-block", width: "0.62em", height: "0.95em", verticalAlign: "-0.12em", backgroundColor: C.accent }} />
        </div>
      </Bubble>
    );
  }
  const wipe = frame >= T.loopOut ? interpolate(frame, [T.loopOut, T.loopOut + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_SNAP }) : 0;
  const bw = replyWidth(frame, fps);
  const dmOffset = measure("DM", BODY, "700") + 0.28 * BODY;
  return (
    <Drift from={T.dmIcon + 5} pxPerFrame={0.35} scalePerFrame={0.0002}>
      <Bubble from={T.cutPaper} tail="right" x={984 - bw} y={760} width={bw} fontFamily={UI} fontSize={BODY} pad={PAD}>
        <div style={{ position: "relative", overflow: "hidden", minHeight: "1.18em", whiteSpace: "nowrap" }}>
          <div style={{ translate: `${-wipe * 900}px 0`, fontWeight: 700 }}>
            <Dots from={T.dots[0]} until={T.ctaWords[0]} />
            <TypedLine text="DM STRATEGY" from={T.ctaWords[0]} at={[...T.ctaWords]} cursorHold={200} blink={9} />
            <div style={{ position: "relative", height: 0 }}>
              <DrawLine x={dmOffset} y={-6} width={measure("STRATEGY", BODY, "700")} from={T.ctaWords[1]} frames={6} thickness={10} />
            </div>
          </div>
          {wipe > 0 ? <div style={{ position: "absolute", top: 0, bottom: 0, left: `${(1 - wipe) * 100}%`, width: 6, backgroundColor: C.accent }} /> : null}
        </div>
      </Bubble>
      <IconPop name="dm" size={108} x={930} y={742} from={T.dmIcon} until={T.loopOut + 3} fromScale={0.2} shadowAt={T.dmIcon + 3} />
    </Drift>
  );
};
