import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { measureText } from "@remotion/layout-utils";
import { C, EASE_OUT, EASE_SNAP, W } from "../lib/theme";
import { DISPLAY, UI } from "../lib/fonts";
import { IconName, PixelIcon } from "../lib/icons";
import { Drift, IconPop, Line, TypedLine, useWorld } from "../lib/primitives";
import { Bubble, Halves } from "../lib/effects";
import { DrawLine, Marquee, PlayheadReveal } from "../lib/rail";
import { T } from "./timings";

// Type scale: 72 (bubble text), 80 (headline, list), 128 (display words), 250 (serif payoff).
const BUBBLE = 80;
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
  const line1 = measure("Coach, your clips", BUBBLE, "700");
  const bw = springWidth(frame, fps, [
    [0, Math.max(line1, measure("get views.", BUBBLE, "700") + caret)],
    [T.hookLine2[0] - 4, Math.max(line1, measure("No", BUBBLE, "700") + caret)],
    [T.hookLine2[1] - 4, Math.max(line1, measure("No booked", BUBBLE, "700") + caret)],
    [T.hookLine2[2] - 4, Math.max(line1, measure("No booked calls.", BUBBLE, "700") + caret)],
  ]);
  return (
    <AbsoluteFill>
      <Bubble from={0} tail="left" x={bx} y={by} width={bw} fontFamily={UI} fontSize={BUBBLE} pad={PAD} pop={false}>
        <div style={{ whiteSpace: "nowrap" }}>
          Coach, your clips
          <br />
          get views.
          {frame < T.hookLine2[0] ? <span style={{ display: "inline-block", width: "0.62em", height: "0.95em", verticalAlign: "-0.12em", marginLeft: "0.12em", backgroundColor: C.white, opacity: Math.floor(frame / 9.375) % 2 === 0 ? 1 : 0 }} /> : null}
        </div>
        <TypedLine text="No booked calls." from={T.hookLine2[0]} at={[...T.hookLine2]} cursorHold={200} blink={9} cursorColor={C.white} style={{ whiteSpace: "nowrap" }} />
        <div style={{ position: "relative", height: 0 }}>
          <DrawLine x={0} y={-6} width={measure("No booked calls.", BUBBLE, "700")} from={T.hookLine2[2]} frames={6} thickness={10} />
        </div>
      </Bubble>
      {T.plays.map((f, i) => (
        <IconPop key={f} name="play" size={96} x={900 - i * 80} y={636 - i * 88} from={f} fromScale={0.2} />
      ))}
      <IconPop name="calendar-open" size={120} x={880} y={1190} from={T.calendarStamp} fromScale={1.3} preset="slam" shakeAt={[...T.calendarShake]} />
    </AbsoluteFill>
  );
};

// ---------- 2. Answer: black, "it was never / the edit." ----------
const Marker: React.FC<{ from: number; frames: number; x0: number; x1: number; y: number; h: number; until?: number }> = ({ from, frames, x0, x1, y, h, until }) => {
  const frame = useCurrentFrame();
  const t = frame - from;
  if (t < 0) return null;
  if (until !== undefined ? frame >= until : t > frames) return null;
  const x = interpolate(t, [0, frames], [x0, x1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  return <div style={{ position: "absolute", left: x - 4, top: y - h / 2, width: 8, height: h, backgroundColor: C.accent }} />;
};

export const AnswerScene: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.cutBlack1 || frame >= T.flash1) return null;
  const editW = measure("the edit.", DISPLAY_WORD, "700");
  return (
    <AbsoluteFill style={{ textAlign: "center" }}>
      <TypedLine text="it was never" from={T.answerWords[0]} at={[...T.answerWords]} land="snap" style={{ position: "absolute", left: 0, top: 620, width: W, fontSize: BODY, fontWeight: 500, letterSpacing: "0.01em", lineHeight: 1.1 }} />
      <Halves from={T.split} axis="x" gap={48} frames={4}>
        <IconPop name="timeline" size={288} x={540} y={900} from={T.slam} fromScale={1.6} preset="slam" shadowAt={T.slamShadow} />
      </Halves>
      <Marker from={T.marker} frames={T.split - T.marker} x0={300} x1={540} y={900} h={330} until={T.flash1} />
      <Stamp from={T.theEdit} style={{ position: "absolute", left: 0, top: 1100, width: W, fontSize: DISPLAY_WORD, fontWeight: 700, lineHeight: 1.1 }}>
        the edit.
      </Stamp>
      <DrawLine x={540 - editW / 2} y={1100 + DISPLAY_WORD * 0.6} width={editW} from={T.strike} frames={10} thickness={12} />
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
const ROW_SIZE = 96;
const STACK: Record<string, { x: number; y: number }> = {
  hook: { x: 144, y: 720 },
  question: { x: 144, y: 920 },
  "calendar-open": { x: 144, y: 1120 },
};
const LIFT_AT: Record<string, number> = { hook: T.lifts.hook, question: T.lifts.question, "calendar-open": T.lifts.calendar };

const RowIcon: React.FC<{ name: IconName; x: number; index: number }> = ({ name, x, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const del = T.deletePairs.find((d) => d.names.includes(name));
  if (del && frame >= del.at + 6) return null;
  // entrance from the right, staggered
  const tIn = frame - T.row - index;
  const enter = interpolate(tIn, [0, 8], [1080, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const liftAt = LIFT_AT[name];
  const lifted = liftAt !== undefined && frame >= liftAt;
  const liftY = lifted ? interpolate(frame, [liftAt, liftAt + 4], [0, -64], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_SNAP }) : 0;
  const bob = !lifted && frame >= T.row + 20 ? (Math.floor(frame / 9.375) % 2 === index % 2 ? 4 : -4) : 0;
  // CRT-style deletion: azure flash for a frame, then collapse to a line
  let scaleY = 1;
  let scaleX = 1;
  let flash = false;
  if (del && frame >= del.at) {
    const u = frame - del.at;
    flash = u === 0;
    scaleY = interpolate(u, [1, 4], [1, 0.02], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    scaleX = interpolate(u, [4, 6], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
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
    <div style={{ position: "absolute", left: px - size / 2, top: py - size / 2, width: size, height: size, scale: `${scaleX} ${scaleY}` }}>
      {lifted ? (
        <div style={{ position: "absolute", left: size / 12, top: size / 12 }}>
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
      <TypedLine text="Strategy first." from={T.strategyFirst[0]} at={[...T.strategyFirst]} until={T.stack} land="snap" style={{ position: "absolute", left: 0, top: 640, width: W, textAlign: "center", fontSize: BODY, fontWeight: 700, lineHeight: 1.1 }} />
      {ROW.map((r, i) => (
        <RowIcon key={r.name} name={r.name} x={r.x} index={i} />
      ))}
      {listText.map((text, i) => (
        <Line key={text} from={T.listWords[i]} enter="cut" style={{ position: "absolute", left: 284, top: rows[i] - BODY * 0.6, fontSize: BODY, fontWeight: 700, lineHeight: 1.2 }}>
          {text}
        </Line>
      ))}
      {T.checks.map((f, i) => (
        <IconPop key={f} name="check" size={96} x={936} y={rows[i]} from={f} fromScale={1.2} preset="slam" />
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
    <div style={{ ...WordCenter, top, translate: `0 ${Math.max(-16, (1 - s) * 120)}px`, color: frame - from < 2 ? C.accent : undefined }}>
      {children}
    </div>
  );
};

// A tap: the hand dips and an azure ring expands from the fingertip.
const TapRing: React.FC<{ at: number; x: number; y: number; r0?: number; r1?: number; stroke?: number; life?: number }> = ({ at, x, y, r0 = 6, r1 = 52, stroke = 6, life = 8 }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > life) return null;
  const r = interpolate(t, [0, life * 0.6], [r0, r1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT });
  const o = interpolate(t, [life * 0.4, life], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const box = r1 * 2 + stroke * 2;
  return (
    <svg width={box} height={box} viewBox={`${-box / 2} ${-box / 2} ${box} ${box}`} style={{ position: "absolute", left: x - box / 2, top: y - box / 2, opacity: o }}>
      <circle r={r} fill="none" stroke={C.accent} strokeWidth={stroke} />
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
          <IconPop name="question" size={252} x={264} y={1120} from={B.iconAt} fromScale={1.3} preset="slam" />
          <Marquee cx={264} cy={1120} w={324} h={324} from={B.marqueeAt} tickAt={B.marqueeAt + 9} />
        </AbsoluteFill>
      ) : null}
      {frame >= Cw.cut && frame < Cw.back ? (
        <AbsoluteFill>
          <IconPop name={pressed ? "calendar" : "calendar-open"} size={252} x={540} y={1060} from={Cw.cut} fromScale={1.3} preset="slam" accent={frame >= T.tapPress && frame < T.tapPress + 2 ? C.navy : undefined} />
          <TypedLine text={Cw.text} from={Cw.wordAt} land="snap" style={{ ...WordCenter, top: 660 }} />
          <Hand from={T.tapEnter} tipX={682} tipY={1102} fromDx={640} pressAt={T.tapPress} />
          <TapRing at={T.tapPress} x={540} y={1102} r0={10} r1={110} stroke={10} life={10} />
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
  const world = useWorld();
  let dx = interpolate(t, [0, 8], [fromDx, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  let dy = 0;
  let scale = 1;
  if (pressAt !== undefined && frame >= pressAt) {
    const u = frame - pressAt;
    scale = interpolate(u, [0, 2, 4], [1, 0.92, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    dx += u < 3 ? -8 : 0;
  }
  if (hoverFrom !== undefined && frame >= hoverFrom) dy += Math.floor((frame - hoverFrom) / 2) % 2 === 0 ? 0 : 2;
  if (leaveAt !== undefined && frame >= leaveAt) {
    dx += interpolate(frame - leaveAt, [0, 6], [0, 700], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  }
  return (
    <div style={{ position: "absolute", left: tipX - HAND / 2 + dx, top: tipY - 7 + dy, width: HAND, height: HAND, scale: `${scale}`, rotate: "-90deg", transformOrigin: "50% 4%" }}>
      {[[-14, 0], [14, 0], [0, -14], [0, 14]].map(([ox, oy]) => (
        <div key={`${ox}-${oy}`} style={{ position: "absolute", left: ox, top: oy }}>
          <PixelIcon name="tap" size={HAND} ink={world.bg} accent={world.bg} />
        </div>
      ))}
      <div style={{ position: "absolute", left: 0, top: 0 }}>
        <PixelIcon name="tap" size={HAND} />
      </div>
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
  const periodX = 96 + wordW + 12;
  return (
    <Drift from={T.handLeave} pxPerFrame={0.35} scalePerFrame={0.0003}>
      <PlayheadReveal from={T.payoff} frames={T.playheadFrames} x0={60} x1={periodX + 100} barY={960} barH={1080} barW={16} parkX={60} easing={Easing.out(Easing.cubic)}>
        <div style={{ position: "absolute", left: 96, top: 760, width: W - 96, textAlign: "left", fontFamily: DISPLAY, fontStyle: "italic", fontSize: SERIF, lineHeight: 1.1 }}>
          strategy
          <span style={{ color: C.accent, display: "inline-block", scale: `${periodScale}` }}>.</span>
        </div>
      </PlayheadReveal>
      <DrawLine x={96} y={760 + SERIF * 1.17} width={wordW + 12 + measure(".", SERIF, "400", DISPLAY)} from={T.payoffRule} frames={8} thickness={12} />
      <Hand from={T.handEnter} tipX={periodX + 34} tipY={972} fromDx={420} pressAt={T.period} hoverFrom={T.handHover} leaveAt={T.handLeave} />
      <TapRing at={T.period} x={periodX + 10} y={966} />
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
        <span key={i} style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: C.accent, opacity: i === active ? 1 : 0.35 }} />
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
    [T.cutPaper, 3 * 24 + 2 * 14 + 20],
    [T.ctaWords[0] - 5, measure("DM", BODY, "700") + 0.03 * BODY * 2 + 0.62 * BODY + 8],
    [T.ctaWords[1] - 5, measure("DM STRATEGY", BODY, "700") + 0.03 * BODY * 11 + 0.62 * BODY + 8],
  ]);

export const ReplyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < T.cutPaper) return null;
  if (frame >= T.loopReset) {
    // frame 0's state: an empty received bubble, so the loop lands on the hook
    return (
      <Bubble from={T.loopReset} tail="left" x={96} y={720} width={measure("Coach, your clips", BUBBLE, "700") + INNER} fontFamily={UI} fontSize={BUBBLE} pad={PAD} pop={false}>
        <div style={{ minHeight: "2.36em" }}>
          <span style={{ display: "inline-block", width: "0.62em", height: "0.95em", verticalAlign: "-0.12em", backgroundColor: C.white }} />
        </div>
      </Bubble>
    );
  }
  const wipe = frame >= T.loopOut ? interpolate(frame, [T.loopOut, T.loopOut + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_SNAP }) : 0;
  const bw0 = replyWidth(frame, fps);
  const travel = frame >= T.loopOut ? interpolate(frame, [T.loopOut, T.loopReset], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_SNAP }) : 0;
  const hookW = measure("Coach, your clips", BUBBLE, "700") + INNER;
  const leave = frame >= T.loopOut ? interpolate(frame, [T.loopOut, T.loopOut + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) }) : 0;
  const bw = bw0 + (hookW - bw0) * travel;
  const bx = 984 - bw0 + (96 - (984 - bw0)) * travel;
  const byy = 760 + (720 - 760) * travel;
  const dmOffset = measure("DM", BODY, "700") + 0.28 * BODY;
  return (
    <Drift from={T.dmIcon + 5} pxPerFrame={0.35} scalePerFrame={0.0002}>
      <Bubble from={T.cutPaper} tail={travel > 0.5 ? "left" : "right"} x={bx} y={byy} width={bw} fontFamily={UI} fontSize={BODY} pad={PAD}>
        <div style={{ position: "relative", overflow: "hidden", minHeight: `${1.18 + 1.18 * travel}em`, whiteSpace: "nowrap", paddingBottom: 8, marginBottom: -8 }}>
          {travel > 0.5 ? (
            <span style={{ position: "absolute", left: 0, top: 0, display: "inline-block", width: "0.62em", height: "0.95em", backgroundColor: C.white }} />
          ) : null}
          <div style={{ translate: `${-wipe * 900}px 0`, fontWeight: 700 }}>
            <Dots from={T.dots[0]} until={T.ctaWords[0]} />
            <TypedLine text="DM STRATEGY" from={T.ctaWords[0]} at={[...T.ctaWords]} cursorHold={200} blink={9} cursorColor={C.white} wordColors={[undefined, C.accent]} style={{ letterSpacing: "0.03em" }} />
            <div style={{ position: "relative", height: 0 }}>
              <DrawLine x={dmOffset + 0.03 * BODY * 2} y={-6} width={measure("STRATEGY", BODY, "700") + 0.03 * BODY * 8} from={T.ctaWords[1]} frames={6} thickness={10} />
            </div>
          </div>
          {wipe > 0 ? <div style={{ position: "absolute", top: 0, bottom: 0, left: `${(1 - wipe) * 100}%`, width: 6, backgroundColor: C.accent }} /> : null}
        </div>
      </Bubble>
      <div style={{ position: "absolute", inset: 0, translate: `${leave * 320}px ${-leave * 320}px` }}>
        <IconPop name="dm" size={108} x={930} y={676} from={T.dmIcon} until={T.loopReset} fromScale={0.2} shadowAt={T.dmIcon + 3} />
      </div>
    </Drift>
  );
};
