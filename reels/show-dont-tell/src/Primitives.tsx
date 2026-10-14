import React from "react";
import { AbsoluteFill } from "remotion";
import { C, W } from "./lib/theme";
import { DISPLAY, UI } from "./lib/fonts";
import { ICON_NAMES, PixelIcon } from "./lib/icons";
import { FocusRing, IconPop, IconRing, SerifWord, TypedLine, World } from "./lib/primitives";

// Visual test bed for the building blocks; not part of the reel.
export const PrimitivesTest: React.FC = () => (
  <World kind="navy">
    <AbsoluteFill style={{ fontFamily: UI, color: C.white }}>
      <TypedLine
        text="how do coaches turn views into booked calls?"
        from={0}
        perWord={5}
        style={{ position: "absolute", left: 96, top: 300, width: W - 192, fontSize: 56, fontWeight: 500, lineHeight: 1.2 }}
      />
      <div style={{ position: "absolute", left: 96, top: 520, display: "flex", gap: 18, flexWrap: "wrap", width: W - 192 }}>
        {ICON_NAMES.map((n) => (
          <PixelIcon key={n} name={n} size={120} />
        ))}
      </div>
      <IconRing icons={ICON_NAMES.slice(0, 8)} cx={540} cy={1100} radius={330} size={130} from={0} />
      <FocusRing cx={540} cy={1100} r={120} from={10} />
      <IconPop name="hook" size={160} x={540} y={1100} from={10} jitterFrames={4} />
      <SerifWord
        word="proof."
        from={20}
        icons={["check", "calendar", "dm"]}
        style={{ position: "absolute", left: 0, top: 1420, width: W, fontFamily: DISPLAY, fontSize: 260, color: C.white, lineHeight: 1 }}
      />
    </AbsoluteFill>
  </World>
);
