---
name: "remotion-create"
description: "Use when starting a new Remotion video project or composition: scaffold, open the Studio preview, then design and build the video."
---

# Create a new Remotion video

Based on the official Remotion agent skills (github.com/remotion-dev/skills). For animation, timing and rendering rules, also use the remotion-best-practices skill.

## 1. Scaffold a project

Skip this if a Remotion project already exists. Make sure Node.js and Git are installed and inspect the current folder, including hidden files, before choosing where to scaffold.

**Empty folder** (or only disposable OS metadata like `.DS_Store`): remove the metadata files, then scaffold in place. Do not treat `.env` or `.git` as disposable.

```bash
npx create-video@latest --yes --blank --no-tailwind .
npm i
```

**Non-empty folder**: scaffold into a new subfolder with a suitable project name.

```bash
npx create-video@latest --yes --blank --no-tailwind my-video
cd my-video
npm i
```

If Tailwind is requested, drop `--no-tailwind` and follow the Remotion Tailwind docs. Remember that Tailwind animation classes do not render correctly; animate with `useCurrentFrame()` and `interpolate()`.

## 2. Open the preview first

As soon as the project can run, start `npx remotion studio` and open the preview before writing or changing the composition. Keep it running so the user can watch progress and steer. With an in-app browser, run `npx remotion studio --no-open` and open the printed URL, then verify the composition preview loads.

## 3. Design the video

- Keep the scaffold and add React markup on top of it.
- Design video-first: large, high-contrast text sized for a phone screen, generous safe margins, one idea per beat.
- Register compositions in the root file with `<Composition>` (or `<Still>`): give each a unique `id`, `fps`, `width`, `height`, `durationInFrames` and `defaultProps`. Vertical social video is typically 1080x1920 at 30 fps.
- A timeline of video or audio clips: give each independently editable clip its own JSX node.
- A multi-scene video: build one component per scene and sequence them with `TransitionSeries` or `Series`; register substantial scenes as their own compositions so each has its own timeline in the Studio.
- Structure the markup so the Studio can edit it interactively: inline keyframes, editable props, `Interactive.withSchema` for reusable components.

## 4. Finish

Do not render unless the user explicitly asks for an export. When they do: `npx remotion render`. After creation, use remotion-best-practices for follow-up edits.