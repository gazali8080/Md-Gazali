import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// One UI face, one display face. Files live in public/fonts (SIL Open Font License).
export const UI = "Inter";
export const DISPLAY = "Instrument Serif";

const faces = [
  ...(["400", "500", "600", "700"] as const).map((weight) =>
    loadFont({
      family: UI,
      url: staticFile(`fonts/Inter-${weight}.ttf`),
      weight,
      style: "normal",
      format: "truetype",
    }),
  ),
  loadFont({
    family: DISPLAY,
    url: staticFile("fonts/InstrumentSerif-Italic.ttf"),
    weight: "400",
    style: "italic",
    format: "truetype",
  }),
];

export const fontsReady = Promise.all(faces);
