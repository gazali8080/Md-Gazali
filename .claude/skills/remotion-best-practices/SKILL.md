---
name: "remotion-best-practices"
description: "Use when building, editing, previewing or rendering videos or motion graphics with Remotion (React). Covers animation rules, timing, fonts, media, transitions, preview and render."
---

# Remotion best practices

Based on the official Remotion agent skills (github.com/remotion-dev/skills). For anything not covered here, look up the current docs instead of relying on memory (see "Looking up docs").

## Workflow

1. If no Remotion project exists, use the remotion-create skill to scaffold one.
2. As soon as the project runs, start the Studio preview and keep it open while building: `npx remotion studio` (add `--no-open` and open the printed URL in an in-app browser if one is available).
3. Build the composition, checking the preview as you go.
4. Do NOT render by default. Render only when the user explicitly asks to "render", "export" or wants the MP4: `npx remotion render`. To check a look, render single frames with `npx remotion still`.
5. Users may edit the code outside the conversation. If you notice a surprising change, assume it was intentional and do not overwrite it; ask if unsure.

## Animation rules

- Drive every animation from `useCurrentFrame()` and `interpolate()`. CSS `transition`, CSS `animation` and Tailwind animation classes do NOT render correctly in Remotion; refactor them.
- Shape timing with `Easing.bezier()` and `Easing.spring()`.
- Keep `interpolate()` calls inline in the `style` prop so keyframes stay editable in the Studio.
- Prefer the `scale`, `translate` and `rotate` CSS properties over a `transform` string. For scale animations use `output: 'perceptual-scale'`.
- Always clamp: `extrapolateLeft: 'clamp'`, `extrapolateRight: 'clamp'`.
- Put timing directly on components that support it (`from`, `durationInFrames`, trim props) and avoid redundant `<Sequence>` wrappers.
- Give every timed component that supports `premountFor` one second of premount: `premountFor={fps}` with `fps` from `useVideoConfig()`. This applies to media, `<Sequence>`, `<Series.Sequence>` and `<TransitionSeries.Sequence>`.
- Author each independently editable clip, scene, layer or sequence as its own JSX node with its props inline. Use programmatic loops only when the instances are meant to be controlled as one template.
- For custom visual components with editable props, use `Interactive.withSchema({wrapInSequence: true})`, and register substantial scenes as their own `<Composition>` (connected compositions) so they get their own timeline in the Studio.

```tsx
import {useCurrentFrame, useVideoConfig, Easing, interpolate} from 'remotion';

export const Title = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div
      style={{
        opacity: interpolate(frame, [0, 1 * fps], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        scale: interpolate(frame, [0, 1 * fps], [0.9, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          output: 'perceptual-scale',
        }),
      }}
    >
      Hello
    </div>
  );
};
```

## Assets and media

- Put assets in `public/` and reference them with `staticFile()`; remote URLs can be passed directly.
- Video and audio: `<Video>` and `<Audio>` from `@remotion/media`.
- Images: `<CanvasImage>`. Animated GIF/APNG/WebP/AVIF: `<AnimatedImage>` (use `@remotion/gif` if not on Chrome).
- Install packages with `npx remotion add <package>` so versions match (works for `@remotion/*`, `mediabunny`, `zod`).

## Fonts and text

- Load Google Fonts with `@remotion/google-fonts` (the recommended way); load local fonts with `staticFile()` and `FontFace`.
- Size text for video: large and high-contrast, since it is read on a phone at a glance. Measure and fit text with `@remotion/layout-utils` instead of guessing.

## Choosing the right technique

- Regular HTML and CSS first. Then effects applied to the element or via `<HtmlInCanvas>`; use shaders or `createEffect()` only when nothing simpler works.
- Scene transitions: `@remotion/transitions` (`TransitionSeries`).
- Motion blur or trails, light leaks, Lottie, 3D (Three.js and React Three Fiber), audio visualization, sound effects, voiceover and captions all have dedicated docs pages.
- Parameterized videos: add a Zod schema to the composition. Dynamic duration, size or data: `calculateMetadata`.
- Multi-scene videos: one scene per component, sequenced with `TransitionSeries` or `Series`, planned scene by scene before coding.
- Maps (Mapbox, MapLibre), captions, SaaS or app integration (`<Player>`, Lambda rendering) and FFmpeg or Mediabunny media tasks are separate topics; look them up in the docs.

## Looking up docs

Search the Remotion docs rather than relying on memory. Any docs page can be fetched as Markdown by appending `.md`, for example:

- https://www.remotion.dev/docs/use-video-config.md
- https://www.remotion.dev/docs/sequence.md
- https://www.remotion.dev/docs/transitions.md
- https://www.remotion.dev/docs/captions/caption.md

Pick the relevant page, fetch it with the `.md` suffix, and implement from the current documentation.

## Upgrading

To upgrade Remotion, upgrade all `remotion` and `@remotion/*` packages to the same exact version together, then refresh installed agent skills with `npx skills add remotion-dev/skills`.