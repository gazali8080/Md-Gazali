import React from "react";
import { AbsoluteFill } from "remotion";
import { C, W } from "./lib/theme";
import { DISPLAY, UI } from "./lib/fonts";
import { ICON_NAMES, PixelIcon } from "./lib/icons";
import { FocusRing, IconPop, IconRing, SerifWord, TypedLine, World } from "./lib/primitives";
import { Bubble, CommentCta, Glitch, Halves } from "./lib/effects";

// Visual test bed for the building blocks; not part of the reel.
export const PrimitivesTest: React.FC = () => (
  <World kind="navy">
    <AbsoluteFill style={{ fontFamily: UI, color: C.white }}>
      <Glitch from={28} frames={8}>
        <TypedLine
          text="how do coaches turn views into booked calls?"
          from={0}
          perWord={5}
          style={{ position: "absolute", left: 96, top: 260, width: W - 192, fontSize: 56, fontWeight: 500, lineHeight: 1.2 }}
        />
      </Glitch>
      <Bubble from={10} tail="left" x={96} y={440} width={700} fontFamily={UI}>
        Your clips get views. No booked calls.
      </Bubble>
      <Halves from={40} axis="x" gap={120}>
        <div style={{ position: "absolute", left: 540 - 90, top: 760 }}>
          <PixelIcon name="timeline" size={180} />
        </div>
      </Halves>
      <IconRing icons={ICON_NAMES.slice(0, 8)} cx={540} cy={1180} radius={330} size={130} from={0} />
      <FocusRing cx={540} cy={1180} r={120} from={10} />
      <IconPop name="hook" size={160} x={540} y={1180} from={10} jitterFrames={4} />
      <CommentCta keyword="STRATEGY" from={20} pressAt={60} top={1560} fontFamily={UI} />
      <SerifWord
        word="strategy."
        from={30}
        icons={["check", "calendar", "dm"]}
        style={{ position: "absolute", left: 0, top: 1360, width: W, fontFamily: DISPLAY, fontSize: 200, color: C.white, lineHeight: 1 }}
      />
    </AbsoluteFill>
  </World>
);
