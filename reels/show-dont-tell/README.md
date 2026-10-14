# Show, don't tell

A 20-second Instagram Reel (1080x1920, 30 fps, 600 frames) for @gazali.visuals, built in Remotion. It borrows only the grammar of a kinetic-typography collage (a white "paper" world cut against a black "flash" world, typed words, a row of icons, three principle words, a serif payoff) and fills it with the brand's own message for coaches and consultants: the edit was never the problem, strategy first.

## Structure

| Beats | World | What happens |
| --- | --- | --- |
| 0–6 | paper | The editor's DM lands on frame 0: "Coach, your clips get views." Then "No booked calls." types in azure, three views pop off the corner, and an empty calendar slot stamps in and shakes. |
| 6–10 | black | "it was never / the edit." The timeline icon slams in, its own cut-marker saws it in half, and the words are struck through. |
| 10–12 | paper | "Strategy first." over a row of seven icons. |
| 12–20 | black / paper | Three cutaways in three compositions: the hook swings down a line and pulls up "Hook."; "Who." lands first and the question icon is selected in a marquee; the pixel hand taps the calendar and books "Ask." On each return the named icon lifts and the outer pair of icons is deleted. |
| 20–23 | paper | The three survivors spring into a ticked checklist. |
| 23–28 | black | A playhead reveals the serif payoff, "strategy"; the hand returns to tap the period into place; the playhead scrubs back into the cut. |
| 28–32 | paper | The viewer's reply bubble: typing dots, then "DM STRATEGY", the envelope, a hold, a wipe, and frame 0's empty bubble for a seamless loop. |

Every cut sits on the 96 BPM grid (`beat n = round(18.75 * n)` frames). All timings live in `src/reel/timings.ts`; scenes read from that table, so retiming is a table edit.

## Look

The paper world is white `#F4F6FB` with navy `#050B1B` ink; the flash world is black with white ink; one azure accent `#4A8CFF` on both (`src/lib/theme.ts`). Inter for UI text and Instrument Serif Italic for the payoff word, both bundled in `public/fonts` (SIL Open Font License). Every icon is drawn in code on a 12x12 pixel grid (`src/lib/icons.tsx`) and takes its ink from the world it sits in.

## Sound

The score and effects are synthesized in code: `npm run audio` regenerates `public/audio/score.wav`, the eight effects in `public/audio/sfx`, and `public/audio/beats.json`, whose beat times are measured from the rendered score with an onset detector, not assumed. Cues are listed in `src/reel/timings.ts`.

## Commands

```bash
npm install
npm run dev      # Remotion Studio preview with the timeline
npm run sheet    # one still per beat, tiled into out/contact/sheet.png
npm run render   # full render to out/reel.mp4
npm run master   # two-pass loudness normalisation to -14 LUFS, writes out/reel-master.mp4
```

On a machine without a system Chrome, point Remotion at a headless shell with `REMOTION_BROWSER_EXECUTABLE=/path/to/headless_shell`.

## Review loop

Before any full render, the contact sheet is scored 1–10 on hook, phone readability, motion, variety, brand accuracy and sound sync; the three worst problems are fixed and the sheet re-rendered until every score is 8 or higher.
