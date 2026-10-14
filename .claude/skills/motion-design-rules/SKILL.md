---
name: "motion-design-rules"
description: "Use for ANY motion graphics, video or Remotion work: look rules, sound rules, and the mandatory contact-sheet score-and-fix loop before showing or rendering."
---

# Motion design rules (always apply)

These are the user's standing rules for every motion graphic or video. Follow them on every job, together with the Remotion skills. If a request or brief conflicts with a rule, the brief wins only where the rule itself allows it (for example the accent color); otherwise follow the rule and say so.

## Look

- Banned defaults: centered title on a gradient, everything fading in, corner labels and frame borders, glow on UI chrome, generic particle bursts.
- One display face, one UI face. One accent color unless the brief says otherwise.
- Every 2 to 4 seconds something new must happen on screen.

## Sound

- Score and SFX are synthesized in code unless a track is supplied.
- Place hits on the measured beat grid (`beats.json`). Measure the beats from the track (or from the synthesized score) and save them to `beats.json`; do not guess timings.
- Master loudness to -14 LUFS (for example with ffmpeg `loudnorm`, then verify).

## Loop before you show me anything

1. Render one frame per beat as a contact sheet and LOOK at it (render stills, assemble a grid, view the image).
2. Score it 1-10 on: hook in the first 2 s, readability at phone size, motion quality, variety, brand accuracy, sound sync.
3. Fix the 3 worst problems. Repeat until every score is 8+.
4. Only then do the full render.

Do not show work to the user, and do not do the full render, until step 3 passes. When presenting, include the final scores and what was fixed, briefly.