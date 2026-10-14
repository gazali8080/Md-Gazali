import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { measureText } from "@remotion/layout-utils";
import { C, W } from "../lib/theme";
import { DISPLAY, UI } from "../lib/fonts";
import { IconName, PixelIcon } from "../lib/icons";
import { Drift, Flash, IconPop, Line, SerifWord, TypedLine, World } from "../lib/primitives";
import { Bubble, Halves } from "../lib/effects";
import { DrawLine, IconRail, Marquee, PlayheadReveal } from "../lib/rail";
import { T } from "./timings";

const HOOK_FONT = 76;
const HOOK_PAD = 36;
const measure = (text: string, fontSize: number, fontWeight: string, fontFamily = UI) =>
  measureText({ text, fontFamily, fontSize, fontWeight }).width;

// ---------- 1. Hook: the coach's own complaint, typed into a DM bubble ----------
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= T.cutBlack1) return null;
  const bx = 96;
  const by = 640;
  const bw = 888;
  const lineH = HOOK_FONT * 1.22;
  const noW = measure("No ", HOOK_FONT, "500");
  const bookedW = measure("booked calls.", HOOK_FONT, "500");
  return (
    <AbsoluteFill>
      <Bubble from={0} tail="left" x={bx} y={by} width={bw} fontFamily={UI} fontSize={HOOK_FONT} pad={HOOK_PAD}>
        <div style={{ minHeight: lineH * (frame >= T.hookLine2[0] ? 2 : 1) }}>
          <TypedLine text="Your clips get views." from={T.hookLine1[0]} at={[...T.hookLine1]} cursorHold={T.hookLine2[0] - T.hookLine1[3] - 1} />
          <TypedLine text="No booked calls." from={T.hookLine2[0]} at={[...T.hookLine2]} cursorHold={40} />
          <div style={{ position: "relative", height: 0 }}>
            <DrawLine x={noW} y={-10} width={bookedW} from={T.underline} />
          </div>
        </div>
      </Bubble>
      {T.plays.map((f, i) => (
        <IconPop key={f} name="play" size={96} x={860 + i * 60} y={590 - i * 70} from={f} fromScale={0.2} />
      ))}
      <IconPop name="calendar-open" size={120} x={920} y={by + 5 + HOOK_PAD + lineH * 2 + 80} from={T.calendarStamp} fromScale={1.3} preset="slam" shakeAt={T.calendarStamp + 3} />
    </AbsoluteFill>
  );
};

// A word that lands all at once with a scale kick.
const Stamp: React.FC<{ from: number; until?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ from, until, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < from) return null;
  if (until !== undefined && frame >= until) return null;
  const s = spring({ frame: frame - from, fps, config: { damping: 14, stiffness: 300, mass: 0.5 } });
  return <div style={{ scale: `${interpolate(s, [0, 1], [1.15, 1])}`, ...style }}>{children}</div>;
};

// ---------- 2. Answer: black world, "it was never the edit." ----------
export const AnswerScene: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.cutBlack1 || frame >= T.flash1) return null;
  const size = 96;
  const editW = measure("the edit.", size, "600");
  return (
    <AbsoluteFill style={{ fontSize: size, fontWeight: 600, lineHeight: 1.15 }}>
      <TypedLine text="it was never" from={T.answerWords[0]} at={[...T.answerWords]} cursorHold={T.theEdit - T.answerWords[2] - 1} style={{ position: "absolute", left: 96, top: 640, width: W - 192 }} />
      <Halves from={T.split} axis="x" gap={48} frames={5}>
        <IconPop name="timeline" size={240} x={540} y={960} from={T.slam} fromScale={1.6} preset="slam" shadowAt={T.slamShadow} />
      </Halves>
      <Stamp from={T.theEdit} style={{ position: "absolute", left: 96, top: 1160, width: W - 192 }}>
        the edit.
      </Stamp>
      <DrawLine x={96} y={1160 + size * 0.62} width={editW} from={T.strike} frames={10} thickness={7} />
    </AbsoluteFill>
  );
};

// ---------- 3. Rail: "Strategy first." over seven icons; three lift as they are named ----------
const RAIL_ICONS: IconName[] = ["phone-clip", "play", "hook", "question", "calendar-open", "stopwatch", "dm"];
const RAIL_BOOKED: IconName[] = ["phone-clip", "play", "hook", "question", "calendar", "stopwatch", "dm"];
const RAIL_Y = 1000;

export const RailScene: React.FC = () => {
  const frame = useCurrentFrame();
  const inNavy =
    (frame >= T.flash1 && frame < T.words[0].cut) ||
    (frame >= T.words[0].back && frame < T.words[1].cut) ||
    (frame >= T.words[1].back && frame < T.words[2].cut) ||
    (frame >= T.words[2].back && frame < T.flash2);
  if (!inNavy) return null;
  const booked = frame >= T.words[2].back;
  const icons = booked ? RAIL_BOOKED : RAIL_ICONS;
  const cal: IconName = booked ? "calendar" : "calendar-open";
  const rows = [RAIL_Y - 160, RAIL_Y, RAIL_Y + 160];
  return (
    <AbsoluteFill>
      <TypedLine text="Strategy first." from={T.strategyFirst[0]} at={[...T.strategyFirst]} until={T.words[0].cut} cursorHold={30} style={{ position: "absolute", left: 96, top: 700, width: W - 192, fontSize: 84, fontWeight: 600 }} />
      <IconRail
        icons={icons}
        y={RAIL_Y}
        size={96}
        pitch={132}
        from={T.rail}
        lifts={[
          { name: "hook", from: T.words[0].back },
          { name: "question", from: T.words[1].back },
          { name: cal, from: T.words[2].back },
        ]}
        clearAt={T.clear}
        keep={["hook", "question", cal]}
      />
      {T.words.map((w, i) => (
        <Line key={w.text} from={T.listWords[i]} enter="cut" style={{ position: "absolute", left: 240, top: rows[i] - 48, fontSize: 80, fontWeight: 600, lineHeight: 1.2 }}>
          {w.text}
        </Line>
      ))}
      {T.checks.map((f, i) => (
        <IconPop key={f} name="check" size={72} x={880} y={rows[i]} from={f} fromScale={1.2} preset="slam" />
      ))}
    </AbsoluteFill>
  );
};

// ---------- 3b. Word cutaways: black world, one icon, one word; each word enters
// the way its icon does: pulled up by the hook, turned into its angle, booked by a tap ----------
const WordStyle: React.CSSProperties = { position: "absolute", left: 0, top: 1110, width: W, textAlign: "center", fontSize: 128, fontWeight: 600, lineHeight: 1.1 };

const HangWord: React.FC<{ from: number; children: React.ReactNode }> = ({ from, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < from) return null;
  const s = spring({ frame: frame - from, fps, config: { damping: 7, stiffness: 120, mass: 0.9 } });
  return (
    <div style={{ ...WordStyle, translate: `0 ${Math.max(-36, (1 - s) * 420)}px`, opacity: interpolate(s, [0, 0.15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
      {children}
    </div>
  );
};

const TurnWord: React.FC<{ from: number; children: React.ReactNode }> = ({ from, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < from) return null;
  const s = spring({ frame: frame - from, fps, config: { damping: 16, stiffness: 400, mass: 0.5 } });
  return (
    <div style={{ ...WordStyle, rotate: `${(1 - s) * -18}deg`, scale: `${interpolate(s, [0, 1], [1.3, 1])}` }}>
      {children}
    </div>
  );
};

export const WordScenes: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {T.words.map((w, i) => {
        if (frame < w.cut || frame >= w.back) return null;
        const cx = 540;
        const cy = 860;
        const pressed = i === 2 && frame >= T.tapPress;
        const icon: IconName = i === 2 && pressed ? "calendar" : w.icon;
        const enter =
          i === 0
            ? { preset: "swing" as const, fromDy: -520, fromScale: 1 }
            : i === 1
              ? { preset: "slam" as const, fromScale: 1.3, fromRotate: -18 }
              : { preset: "slam" as const, fromScale: 1.3 };
        return (
          <AbsoluteFill key={w.text}>
            <Marquee cx={cx} cy={cy} w={300} h={300} from={w.cut + 4} />
            <IconPop name={icon} size={256} x={cx} y={cy} from={w.cut} shadowAt={w.cut + 4} {...enter} />
            {i === 2 ? (
              <IconPop name="tap" size={160} x={cx + 90} y={cy + 40} from={T.tapEnter} fromDx={360} fromDy={-260} fromScale={1} />
            ) : null}
            {i === 0 ? (
              <HangWord from={w.wordAt}>{w.text}</HangWord>
            ) : i === 1 ? (
              <TurnWord from={w.wordAt}>{w.text}</TurnWord>
            ) : (
              <TypedLine text={w.text} from={w.wordAt} cursorHold={60} style={WordStyle} />
            )}
          </AbsoluteFill>
        );
      })}
    </>
  );
};

// ---------- 4. Payoff: a playhead reveals the serif word ----------
export const PayoffScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < T.payoff || frame >= T.cutNavy) return null;
  const s = spring({ frame: frame - T.period, fps, config: { damping: 12, stiffness: 300, mass: 0.5 } });
  const periodScale = frame >= T.period ? interpolate(s, [0, 1], [1.4, 1]) : 0;
  const icons: IconName[] = ["hook", "question", "calendar"];
  return (
    <AbsoluteFill>
      <PlayheadReveal from={T.payoff} frames={36} barY={880} barH={360}>
        <div style={{ position: "absolute", left: 0, top: 720, width: W, textAlign: "center", fontFamily: DISPLAY, fontSize: 250, lineHeight: 1.1, color: C.white }}>
          strategy
          <span style={{ display: "inline-block", scale: `${periodScale}` }}>.</span>
        </div>
      </PlayheadReveal>
      {T.payoffIcons.map((f, i) => (
        <IconPop key={f} name={icons[i]} size={96} x={400 + i * 140} y={1150} from={f} fromScale={0.2} shadowAt={f + 2} />
      ))}
    </AbsoluteFill>
  );
};

// ---------- 5. CTA: the reply bubble ----------
export const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.cutNavy) return null;
  return (
    <Drift from={T.dmIcon} pxPerFrame={0.12} scalePerFrame={0.0002}>
      <Bubble from={T.cutNavy} until={T.loopOut} tail="right" x={96} y={760} width={888} fontFamily={UI} fontSize={88} pad={36}>
        <div style={{ fontWeight: 700, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
          <TypedLine text="DM STRATEGY" from={T.ctaWords[0]} at={[...T.ctaWords]} cursorHold={200} blink={9} />
        </div>
      </Bubble>
      <IconPop name="dm" size={120} x={150} y={700} from={T.dmIcon} until={T.loopOut} fromScale={0.2} shadowAt={T.dmIcon + 3} />
    </Drift>
  );
};

export { World, Flash, SerifWord, PixelIcon };
