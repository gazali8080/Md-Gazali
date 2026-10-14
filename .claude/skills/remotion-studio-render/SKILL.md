---
name: "remotion-studio-render"
description: "Use when previewing a Remotion video in Studio, rendering or exporting video or stills (including transparent video), or upgrading Remotion and its skills."
---

# Remotion Studio, rendering and upgrading

Based on the official remotion-studio, remotion-render and remotion-upgrade skills (github.com/remotion-dev/skills).

## Preview in Studio

When creating or editing a video, start the Studio and open the preview as soon as the project can run, before building the composition. Keep it open so the user can watch changes and steer.

```bash
npx remotion studio            # opens the browser automatically
npx remotion studio --no-open  # long-running server; prints the URL
```

With `--no-open`, open the exact printed URL in the in-app browser and verify that Studio loads and, once a composition exists, that the video preview loads. If you cannot open it there, run without `--no-open`. Visit a specific composition at `/<composition-id>`, e.g. `http://localhost:3000/MapAnimation`. If a Studio is already running, the command prints its URL and exits.

Useful flags: `--log=<error|warn|info|verbose>`, `--port=<number>`, `--force-new` (start another instance for the same project and port).

## Rendering

Only render when the user explicitly asks ("render", "export", "give me the MP4"). By default they want the interactive preview. The Studio also has a render UI that is often easier than the CLI.

```bash
npx remotion render                       # video
npx remotion still                        # a single still
npx remotion render <id> out/frames --frames=0,30,90 --image-format=png   # several frames as images
```

All options: https://www.remotion.dev/docs/cli/render.md and https://www.remotion.dev/docs/cli/still.md. For transparent video, see the Remotion docs on transparent videos (ProRes 4444 or VP8/VP9 with alpha, PNG image format).

## Upgrading

1. Inspect manifests and the lockfile to identify the package manager and workspaces; preserve unrelated changes.
2. If `@remotion/cli` is available locally, run `npx remotion upgrade` (it also updates project-local Remotion skills) and skip the manual steps.
3. Otherwise: get the latest version with `npm view remotion version`; upgrade every `remotion` and `@remotion/*` dependency to that exact same version; read the target `@remotion/studio` dependencies with `npm view @remotion/studio@<version> dependencies --json` and align auxiliary packages (`zod`, `mediabunny`, `@huggingface/transformers`; `@mediabunny/*` use the mediabunny version); update the lockfile; then refresh skills with `npx skills update remotion-best-practices remotion-captions remotion-create remotion-docs remotion-interactivity remotion-maps remotion-markup remotion-multimedia remotion-render remotion-saas remotion-studio remotion-upgrade --yes`.
4. Review the manifest and lockfile diff and make sure all Remotion packages share one version. If the CLI exists, run `npx remotion versions` as a check. Release notes: https://github.com/remotion-dev/remotion/releases