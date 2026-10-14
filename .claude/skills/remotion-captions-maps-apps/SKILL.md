---
name: "remotion-captions-maps-apps"
description: "Use for Remotion captions and subtitles, map animations, building apps or SaaS with Remotion, Mediabunny media metadata, or searching the Remotion docs."
---

# Remotion captions, maps, apps, multimedia and docs

Based on the official remotion-captions, remotion-maps, remotion-saas, remotion-multimedia and remotion-docs skills (github.com/remotion-dev/skills). After finishing, use remotion-best-practices and open the Studio preview unless told otherwise.

## Captions

Process all captions as JSON using the `Caption` type from `@remotion/captions`:

```ts
import type {Caption} from '@remotion/captions';
// {text: string; startMs: number; endMs: number; timestampMs: number | null; confidence: number | null; pageBreakAfter?: boolean}
```

- Generate captions by transcribing video or audio (Remotion's Whisper or other transcription packages; see the docs page for captions).
- Import captions from an `.srt` file with `@remotion/captions` helpers.
- Display and animate them page by page, highlighting the active word using `startMs` and `endMs`.
- Docs: https://www.remotion.dev/docs/captions/caption.md

## Maps

Pick exactly one technique for the shot:

- Static map: a satellite image mounted in an `<Img>`, animated on top.
- Mapbox: needs an API key, nicer default styles, a round globe when zoomed out, 3D buildings.
- MapLibre: free, no API key, no 3D buildings.
- MapTiler: annotations drawn over borders, rivers and labels.
- CesiumJS: terrain and mountain flythroughs, flight-simulator perspective.

Look up the chosen technique in the Remotion docs before implementing.

## Apps and SaaS built on Remotion

- Embed a live preview in a React app with the `<Player>` component.
- Rendering options: client-side rendering, or server-side via Lambda, Vercel, Node.js and Express, or Cloudflare. Choose by scale and hosting.
- Templates exist for SaaS apps; check the "choosing a framework" docs. Vue, Angular and Svelte are supported: https://www.remotion.dev/docs/vue.md, https://www.remotion.dev/docs/angular.md, https://www.remotion.dev/docs/svelte.md.

## Multimedia with Mediabunny

Mediabunny handles audio and video in the browser: trimming, cropping, and reading metadata such as audio duration, video duration and video dimensions. Overview: https://mediabunny.dev/llms.txt. Install matching versions with `npx remotion add mediabunny`.

## Looking up the Remotion docs

1. Search for the concept. Either use a web search restricted to remotion.dev, or the docs search index:
   `POST https://plsduol1ca-dsn.algolia.net/1/indexes/*/queries?x-algolia-api-key=3e42dbd4f895fe93ff5cf40d860c4a85&x-algolia-application-id=PLSDUOL1CA` with a JSON body like `{"requests":[{"query":"<terms>","indexName":"remotion","params":"attributesToRetrieve=[\"hierarchy.lvl0\",\"hierarchy.lvl1\",\"hierarchy.lvl2\",\"url\"]&hitsPerPage=10"}]}`.
2. Pick the best URLs from the hits.
3. Fetch each with a `.md` suffix, e.g. https://www.remotion.dev/docs/sequence.md.
4. Implement from the current documentation, not memorized API knowledge.