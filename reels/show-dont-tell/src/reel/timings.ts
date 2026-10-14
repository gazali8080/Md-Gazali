import { IconName } from "../lib/icons";

// Every cut and event of the reel, in frames at 30 fps on the 96 BPM grid
// (beat n = round(18.75 * n), eighths at 9.375). Retime here; the scenes read this table.
export const AUDIO_READY = true;

export const T = {
  end: 600,
  // 1 hook (paper): the editor's DM lands whole, the pain line types in azure
  hookLine1: 0,
  hookLine2: [9, 19, 28], // No booked calls.
  plays: [47, 56, 66],
  calendarStamp: 75,
  calendarShake: [84, 94],
  // 2 answer (black)
  cutBlack1: 113,
  answerWords: [113, 122, 131], // it was never
  slam: 141,
  slamShadow: 143,
  theEdit: 150,
  marker: 159, // the cut-marker slides into the icon and parks in the cut
  split: 163,
  strike: 169,
  riser1: 150,
  flash1: 188,
  // 3 strategy row (paper) with three cutaways to black
  row: 188,
  strategyFirst: [188, 197],
  words: [
    { cut: 225, back: 263, icon: "hook" as IconName, text: "Hook.", wordAt: 234, shadowAt: 234 },
    { cut: 281, back: 319, icon: "question" as IconName, text: "Who.", wordAt: 281, iconAt: 291, marqueeAt: 300 },
    { cut: 338, back: 375, icon: "calendar-open" as IconName, text: "Ask.", wordAt: 347 },
  ],
  lifts: { hook: 263, question: 319, calendar: 375 },
  deletePairs: [
    { at: 272, names: ["phone-clip", "dm"] as IconName[] },
    { at: 328, names: ["play", "stopwatch"] as IconName[] },
  ],
  tapEnter: 356,
  tapPress: 366,
  stack: 375,
  listWords: [384, 394, 403],
  checks: [394, 403, 413],
  riser2: 394,
  flash2: 431,
  // 4 payoff (black)
  payoff: 431,
  playheadFrames: 38,
  handEnter: 469,
  handHover: 478,
  period: 488,
  handLeave: 497,
  payoffRule: 506,
  // 5 reply (paper)
  cutPaper: 525,
  dots: [525, 534],
  ctaWords: [544, 553],
  dmIcon: 563,
  loopOut: 591,
  loopReset: 597,
} as const;

export type WorldKind = "paper" | "flash";
export const WORLDS: Array<{ from: number; until: number; kind: WorldKind }> = [
  { from: 0, until: T.cutBlack1, kind: "paper" },
  { from: T.cutBlack1, until: T.flash1, kind: "flash" },
  { from: T.flash1, until: T.words[0].cut, kind: "paper" },
  { from: T.words[0].cut, until: T.words[0].back, kind: "flash" },
  { from: T.words[0].back, until: T.words[1].cut, kind: "paper" },
  { from: T.words[1].cut, until: T.words[1].back, kind: "flash" },
  { from: T.words[1].back, until: T.words[2].cut, kind: "paper" },
  { from: T.words[2].cut, until: T.words[2].back, kind: "flash" },
  { from: T.words[2].back, until: T.flash2, kind: "paper" },
  { from: T.flash2, until: T.cutPaper, kind: "flash" },
  { from: T.cutPaper, until: T.end, kind: "paper" },
];

export const FLASHES: Array<{ at: number; hold: number; fall: number }> = [
  { at: T.flash1, hold: 2, fall: 3 },
  { at: T.flash2, hold: 1, fall: 2 },
];

export type Cue = { name: "tick" | "type" | "whoosh" | "impact" | "click" | "riser" | "chime" | "flash"; at: number; vol: number };
const cues: Cue[] = [];
const add = (name: Cue["name"], at: number, vol: number) => cues.push({ name, at, vol });
// hook
add("impact", T.hookLine1, 0.4);
T.hookLine2.forEach((f) => add("type", f, 0.35));
T.plays.forEach((f) => add("click", f, 0.3));
add("impact", T.calendarStamp, 0.45);
T.calendarShake.forEach((f) => add("click", f, 0.25));
// answer
add("impact", T.cutBlack1, 0.7);
T.answerWords.forEach((f) => add("type", f, 0.35));
add("impact", T.slam, 0.8);
add("impact", T.theEdit, 0.5);
add("whoosh", T.marker, 0.4);
add("whoosh", T.strike, 0.35);
add("riser", T.riser1, 0.5);
add("flash", T.flash1, 0.6);
// row and cutaways
add("whoosh", T.row, 0.45);
T.strategyFirst.forEach((f) => add("type", f, 0.35));
add("impact", T.words[0].cut, 0.7);
add("whoosh", T.words[0].cut, 0.35);
add("click", T.words[0].wordAt, 0.35);
add("type", T.words[0].wordAt, 0.4);
add("click", T.lifts.hook, 0.3);
T.deletePairs.forEach((d) => {
  add("click", d.at, 0.4);
  add("click", d.at + 1, 0.3);
});
add("impact", T.words[1].cut, 0.7);
add("type", T.words[1].wordAt, 0.4);
add("click", T.words[1].iconAt, 0.35);
add("click", T.words[1].marqueeAt, 0.35);
add("tick", T.words[1].marqueeAt, 0.25);
add("tick", T.words[1].marqueeAt + 9, 0.25);
add("click", T.lifts.question, 0.3);
add("impact", T.words[2].cut, 0.7);
add("click", T.words[2].cut, 0.35);
add("type", T.words[2].wordAt, 0.4);
add("whoosh", T.tapEnter, 0.3);
add("click", T.tapPress, 0.5);
add("whoosh", T.stack, 0.45);
T.listWords.forEach((f) => add("type", f, 0.35));
T.checks.forEach((f, i) => add("click", f, 0.35 + i * 0.05));
add("riser", T.riser2, 0.5);
add("flash", T.flash2, 0.6);
add("impact", T.flash2, 0.6);
// payoff
add("whoosh", T.payoff, 0.5);
add("whoosh", T.handEnter, 0.3);
add("whoosh", T.handLeave, 0.25);
add("whoosh", T.payoffRule, 0.3);
add("tick", T.handHover, 0.25);
add("chime", T.period, 0.5);
add("click", T.period, 0.4);
// reply
add("impact", T.cutPaper, 0.45);
T.dots.forEach((f) => add("click", f, 0.25));
T.ctaWords.forEach((f) => add("type", f, 0.45));
add("click", T.dmIcon, 0.35);
add("tick", 581, 0.3);
add("whoosh", T.loopOut, 0.3);
export const CUES = cues;

// Score level under each world: a little quieter under the black flash world.
export const SCORE_DIPS: Array<[number, number, number]> = WORLDS.filter((w) => w.kind === "flash").map((w) => [w.from, w.until, 0.72]);
