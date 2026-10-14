import React from "react";
import { AbsoluteFill } from "remotion";
import { C, W } from "./lib/theme";
import { DISPLAY, UI } from "./lib/fonts";
import { World } from "./lib/primitives";
import { DrawLine, IconRail, Marquee, PlayheadReveal } from "./lib/rail";

export const RailTest: React.FC = () => (
  <World kind="navy">
    <AbsoluteFill style={{ fontFamily: UI, color: C.white }}>
      <IconRail
        icons={["phone-clip", "play", "comment", "stopwatch", "tap", "hook", "timeline", "dm", "calendar"]}
        y={700}
        from={0}
        snapAt={[20, 40, 60]}
        lifts={[{ name: "hook", from: 45 }]}
        clearAt={80}
        keep={["hook", "timeline", "calendar"]}
      />
      <Marquee cx={540} cy={1000} w={200} h={200} from={30} />
      <DrawLine x={96} y={1150} width={600} from={30} />
      <PlayheadReveal from={50} frames={12} barY={1400}>
        <div style={{ position: "absolute", left: 0, top: 1300, width: W, textAlign: "center", fontFamily: DISPLAY, fontSize: 220, lineHeight: 1 }}>
          booked.
        </div>
      </PlayheadReveal>
    </AbsoluteFill>
  </World>
);
