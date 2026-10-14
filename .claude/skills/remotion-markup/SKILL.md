---
name: "remotion-markup"
description: "Use when writing Remotion React markup: compositions, Studio-editable structure, sequencing, transitions, text highlights, effects, fonts, media, 3D, audio and parameterized videos."
---

# Remotion markup and interactivity

Based on the official remotion-markup and remotion-interactivity skills (github.com/remotion-dev/skills). Pairs with remotion-best-practices (core rules, workflow) and remotion-create (scaffolding). Fetch any docs page as Markdown by appending `.md` to its https://www.remotion.dev/docs/... URL.

## Preserve user changes

Users may edit the code outside the conversation. If you find a surprising change, assume it was intentional and do not overwrite it; ask if unsure.

## Structure for Studio interactivity

The Remotion Studio edits the JSX node that created an item and writes changes back to code. So:

- Author each composition registration, clip, scene, layer and sequence that should be editable on its own as its own JSX node, with its editable props inline.
- Keep `interpolate()` keyframes inline in `style`, not in separate variables.
- Use programmatic loops only when the generated instances are meant to be one source template.
- Wrap reusable visual components with `Interactive.withSchema({Component, componentName, schema, wrapInSequence: true})`. The schema declares editable props such as `{type: 'text-content'}` and `{type: 'color', default: '#0b84f3'}` (`satisfies InteractivitySchema`).
- Use `Interactive.Div` (and the other `Interactive.*` elements) for elements whose style should be editable.
- Register substantial scenes as their own `<Composition>` (a "connected composition") with matching `defaultProps`, width, height, fps and duration, so each scene gets its own timeline. Pre-composing a selection means extracting it to a named component, making it interactive, and registering it.

## Timing

- Put timing on the component: `from`, `durationInFrames`, trim and playback props. Avoid redundant `<Sequence>` wrappers.
- Give timed components `premountFor={fps}`.
- Layered or sequential scenes: `<Series>` for back-to-back, `<Sequence>` for overlap, `<TransitionSeries>` from `@remotion/transitions` for transitions between scenes (`fade`, `slide`, `wipe`, custom timing).
- Compose multi-scene videos as one component per scene, planned beat by beat.

## Text and annotation

- Text highlights, circles, underlines, strike-throughs, crossed-off text and boxes are covered by the Remotion docs (search "text highlights").
- Measure text with `@remotion/layout-utils` (`measureText`, `fitText`) to fit it to containers instead of guessing.
- Fonts: `@remotion/google-fonts` (recommended) or local files via `staticFile()`.

## Media

- `<Video>` and `<Audio>` from `@remotion/media`; `<CanvasImage>` for images; `<AnimatedImage>` for GIF, APNG, WebP, AVIF. Trim, volume, speed, loop and pitch are props.
- Crop with the cropping helpers; for clip timelines give every clip its own JSX node.
- Install packages with `npx remotion add <pkg>`.

## Effects

Prefer, in order: plain HTML and CSS; an effect on the element or via `<HtmlInCanvas>` (listed effects, or `createEffect()` for custom ones); shaders only as a last resort. Motion blur and trails: use the HTML-in-canvas approach and verify in the preview. Also available: light leaks, Lottie (`@remotion/lottie`), 3D with Three.js and React Three Fiber (`@remotion/three`), audio visualization, sound effects, and ElevenLabs voiceover.

## Parameterized and dynamic videos

Add a Zod schema to make a composition parameterized (editable in the Studio side panel). Use `calculateMetadata` to set duration, dimensions or props dynamically from data.

## Visual checks

Open the Studio for an interactive preview, or render one or several frames as images: `npx remotion render <id> out/frames --frames=0,30,90 --image-format=png`.