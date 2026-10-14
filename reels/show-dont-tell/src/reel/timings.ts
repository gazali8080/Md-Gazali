import { IconName } from "../lib/icons";

// Every cut and event of the reel, in frames at 30 fps on the 96 BPM grid
// (beat n = round(18.75 * n)). Retime here; the scenes read from this table.
export const AUDIO_READY = true;

export const T = {
  end: 600,
  // 1 hook (navy)
  hookLine1: [0, 9, 19, 28], // Your clips get views.
  hookLine2: [38, 47, 56], // No booked calls.
  underline: 66,
  calendarStamp: 103,
  // 2 answer (black)
  cutBlack1: 113,
  answerWords: [113, 122, 131], // it was never
  slam: 141,
  slamShadow: 143,
  theEdit: 150,
  split: 161,
  strike: 169,
  flash1: 188,
  // 3 rail (navy) with three cutaways to black
  rail: 188,
  strategyFirst: [190, 200],
  words: [
    { cut: 225, back: 263, icon: "hook" as IconName, text: "Hook.", wordAt: 229 },
    { cut: 281, back: 319, icon: "phone-clip" as IconName, text: "Angle.", wordAt: 285 },
    { cut: 338, back: 375, icon: "calendar-open" as IconName, text: "Ask.", wordAt: 368 },
  ],
  tapEnter: 356,
  tapPress: 366,
  clear: 375,
  listWords: [384, 394, 403],
  checks: [394, 403, 413],
  flash2: 431,
  // 4 payoff (black)
  payoff: 431,
  period: 469,
  payoffIcons: [488, 497, 506],
  // 5 cta (navy)
  cutNavy: 534,
  ctaWords: [534, 544],
  dmIcon: 553,
  loopOut: 594,
} as const;

export type WorldKind = "navy" | "black";
export const WORLDS: Array<{ from: number; until: number; kind: WorldKind }> = [
  { from: 0, until: T.cutBlack1, kind: "navy" },
  { from: T.cutBlack1, until: T.flash1, kind: "black" },
  { from: T.flash1, until: T.words[0].cut, kind: "navy" },
  { from: T.words[0].cut, until: T.words[0].back, kind: "black" },
  { from: T.words[0].back, until: T.words[1].cut, kind: "navy" },
  { from: T.words[1].cut, until: T.words[1].back, kind: "black" },
  { from: T.words[1].back, until: T.words[2].cut, kind: "navy" },
  { from: T.words[2].cut, until: T.words[2].back, kind: "black" },
  { from: T.words[2].back, until: T.flash2, kind: "navy" },
  { from: T.flash2, until: T.cutNavy, kind: "black" },
  { from: T.cutNavy, until: T.end, kind: "navy" },
];

export const FLASHES: Array<{ at: number; hold: number }> = [
  { at: T.flash1, hold: 3 },
  { at: T.flash2, hold: 2 },
];

export type Cue = { name: "tick" | "type" | "whoosh" | "impact" | "click" | "riser" | "chime" | "flash"; at: number; vol: number };
const cues: Cue[] = [];
const add = (name: Cue["name"], at: number, vol: number) => cues.push({ name, at, vol });
[...T.hookLine1, ...T.hookLine2, ...T.answerWords, ...T.strategyFirst, ...T.listWords, ...T.ctaWords].forEach((f) => add("type", f, 0.35));
T.words.forEach((w) => add("type", w.wordAt, 0.4));
add("whoosh", T.underline, 0.4);
add("impact", T.calendarStamp, 0.45);
add("impact", T.cutBlack1, 0.7);
add("impact", T.slam, 0.8);
add("click", T.slamShadow, 0.3);
add("impact", T.theEdit, 0.5);
add("whoosh", T.split, 0.4);
add("whoosh", T.strike, 0.35);
add("riser", T.flash1 - 36, 0.5);
add("flash", T.flash1, 0.6);
add("whoosh", T.rail, 0.45);
T.words.forEach((w) => {
  add("impact", w.cut, 0.7);
  add("click", w.cut + 4, 0.35);
  add("click", w.back, 0.3);
});
add("whoosh", T.tapEnter, 0.3);
add("click", T.tapPress, 0.5);
add("whoosh", T.clear, 0.45);
T.checks.forEach((f, i) => add("click", f, 0.35 + i * 0.05));
add("riser", T.flash2 - 36, 0.5);
add("flash", T.flash2, 0.6);
add("impact", T.flash2, 0.6);
add("whoosh", T.payoff, 0.5);
add("chime", T.period, 0.5);
T.payoffIcons.forEach((f) => add("click", f, 0.35));
add("impact", T.cutNavy, 0.45);
for (let i = 0; i < 8; i++) add("type", T.ctaWords[0] + i * 2, 0.3);
add("click", T.dmIcon + 6, 0.5);
add("click", T.dmIcon + 10, 0.35);
add("tick", T.loopOut, 0.3);
export const CUES = cues;

// Score level under each world: a little quieter under the black flash world.
export const SCORE_DIPS: Array<[number, number, number]> = WORLDS.filter((w) => w.kind === "black").map((w) => [w.from, w.until, 0.72]);
