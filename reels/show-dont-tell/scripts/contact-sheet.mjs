// Render one still per beat and tile them into a contact sheet.
// Usage: node scripts/contact-sheet.mjs [--comp=Reel] [--out=out/contact] [--scale=0.3] [--cols=8] [--frames=0,19,38]
// Beats come from public/audio/beats.json when present; otherwise a 96 BPM grid at 30 fps.
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"];
  }),
);
const comp = args.comp ?? "Reel";
const outDir = path.resolve(args.out ?? "out/contact");
const scale = Number(args.scale ?? 0.3);
const cols = Number(args.cols ?? 8);
const fps = 30;

let frames;
let labels;
if (args.frames) {
  frames = args.frames.split(",").map(Number);
  labels = frames.map((f) => `f${f} ${(f / fps).toFixed(2)}s`);
} else {
  const beatsPath = path.resolve("public/audio/beats.json");
  if (existsSync(beatsPath)) {
    const beats = JSON.parse(readFileSync(beatsPath, "utf8")).beats;
    frames = beats.map((b) => b.frame);
    labels = beats.map((b) => `b${b.n} f${b.frame} ${b.seconds.toFixed(2)}s`);
  } else {
    frames = Array.from({ length: 32 }, (_, n) => Math.round(n * 18.75));
    labels = frames.map((f, n) => `b${n} f${f} ${(f / fps).toFixed(2)}s`);
  }
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({
  entryPoint: require.resolve("../src/index.ts"),
  rspack: true,
  onProgress: (p) => {
    if (p % 25 === 0) process.stdout.write(`bundle ${p}%\n`);
  },
});
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || undefined;
const browser = await openBrowser("chrome", { browserExecutable });
const fontfile = path.resolve("public/fonts/Inter-600.ttf");
try {
  const composition = await selectComposition({ serveUrl, id: comp, puppeteerInstance: browser, browserExecutable });
  for (let i = 0; i < frames.length; i++) {
    const raw = path.join(outDir, `raw_${String(i).padStart(2, "0")}.png`);
    const out = path.join(outDir, `still_${String(i).padStart(2, "0")}.png`);
    await renderStill({
      composition,
      serveUrl,
      frame: frames[i],
      output: raw,
      imageFormat: "png",
      scale,
      puppeteerInstance: browser,
      browserExecutable,
    });
    const text = labels[i].replace(/:/g, "\\:").replace(/'/g, "");
    execFileSync("ffmpeg", [
      "-v", "error", "-y", "-i", raw,
      "-vf", `drawtext=fontfile=${fontfile}:text='${text}':x=8:y=8:fontsize=${Math.round(96 * scale)}:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=6`,
      out,
    ]);
    rmSync(raw);
    process.stdout.write(`still ${i + 1}/${frames.length} (frame ${frames[i]})\n`);
  }
  const rows = Math.ceil(frames.length / cols);
  const sheet = path.join(outDir, "sheet.png");
  execFileSync("ffmpeg", [
    "-v", "error", "-y", "-framerate", "1", "-i", path.join(outDir, "still_%02d.png"),
    "-vf", `tile=${cols}x${rows}:padding=6:margin=6:color=0x202020`,
    "-frames:v", "1", sheet,
  ]);
  process.stdout.write(`sheet: ${sheet}\n`);
} finally {
  await browser.close({ silent: false });
}
