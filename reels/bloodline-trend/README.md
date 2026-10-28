# Bloodline trend template

A remake template for the "never done in my entire bloodline" trend: four phone clips, one caption on top, the same song underneath, cuts on the song's beats.

## What the reference does

- 15.6 s, vertical, four handheld shots with hard cuts: walk-up from behind, wide of the stage, the handover, close-up reaction.
- One caption for the whole video, white bold sans with a soft shadow, centred, starting about 22% down the frame, six short lines, two emoji under it.
- The song runs the full length at 95 BPM. The reference's cuts drift off the beat by up to a third of a beat; this template puts each cut on the nearest beat (frames 83, 215 and 329, from `public/audio/beats.json`).

## Use it

1. Put the song in place. It is taken untouched from the reference video and is not committed:
   `npm run audio -- path/to/reference.mp4`
2. Drop your four clips into `public/clips/` (`shot1.mp4` to `shot4.mp4`).
3. In `src/Root.tsx`, set each shot's `src` (for example `"clips/shot1.mp4"`) and `trimBeforeSeconds` (where in the clip the good part starts). Change `caption` and `emoji` if you want different text.
4. Preview with `npm run dev`, export with `npm run render` (writes `out/trend.mp4`).

With no clips set, each shot shows a storyboard card saying what to film and for how long.

## Music rights

The song is whatever the reference used. For an organic post, the safest route is to export without music (`musicVolume: 0`) and add the same sound inside Instagram from the original reel's audio page, so it is licensed and the audio is linked. Do not use it in a paid ad: songs from Instagram's library are not cleared for ads, and a baked-in commercial track can get the ad rejected or muted.

`node_modules` is a symlink to `../show-dont-tell/node_modules` (same Remotion version).
