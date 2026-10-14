# Show, don't tell

A 20-second Instagram Reel (1080x1920, 30 fps, 600 frames) for @gazali.visuals, built in Remotion. It borrows only the grammar of a kinetic-typography collage (a light "paper" world cut against a black "flash" world, typed words, an icon carousel, three principle words, a serif payoff) and fills it with the brand's own message for coaches and consultants: the edit was never the problem, strategy first.

## Structure

| Beats | World | What happens |
| --- | --- | --- |
| 0–6 | navy | The hook types into the editor's DM bubble: "Your clips get views. No booked calls." An empty calendar slot stamps in. |
| 6–10 | black | "it was never / the edit." The timeline icon slams in, is cut in half, and the words are struck through. |
| 10–12 | navy | "Strategy first." over a rail of seven icons. |
| 12–20 | black / navy | Three cutaways: the hook pulls up "Hook.", the phone clip turns to find its "Angle.", a tap books the calendar for "Ask." Each lifts its icon in the rail. |
| 20–23 | navy | The rail clears; the three icons gather into a ticked checklist. |
| 23–28 | black | A playhead reveals the serif payoff, "strategy." |
| 28–32 | navy | The viewer's DM composer types STRATEGY and sends it. |

Every cut sits on the 96 BPM grid (`beat n = round(18.75 * n)` frames). All timings live in `src/reel/timings.ts`; scenes read from that table, so retiming is a table edit.

## Look

Navy `#050B1B`, black, white `#F4F6FB`, one azure accent `#4A8CFF` (`src/lib/theme.ts`). Inter for UI text and Instrument Serif Italic for the payoff word, both bundled in `public/fonts` (SIL Open Font License). Every icon is drawn in code on a 12x12 pixel grid (`src/lib/icons.tsx`).

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
