import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Montserrat ExtraBold: the closest free match to the rounded bold sans in the reference caption.
export const CAPTION_FONT = "Montserrat";
loadFont({ family: CAPTION_FONT, url: staticFile("fonts/Montserrat-800.woff2"), weight: "800" });
