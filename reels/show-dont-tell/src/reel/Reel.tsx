import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "../lib/theme";
import { UI } from "../lib/fonts";
import { Flash, World } from "../lib/primitives";
import { Score, Sfx } from "../lib/sound";
import { AnswerScene, CtaScene, HookScene, PayoffScene, RailScene, WordScenes } from "./scenes";
import { AUDIO_READY, CUES, FLASHES, SCORE_DIPS, WORLDS } from "./timings";

export const Reel: React.FC = () => {
  const frame = useCurrentFrame();
  const world = WORLDS.find((w) => frame >= w.from && frame < w.until)?.kind ?? "navy";
  return (
    <AbsoluteFill style={{ fontFamily: UI, color: C.white, backgroundColor: C.navy }}>
      <World kind={world}>
        <HookScene />
        <AnswerScene />
        <RailScene />
        <WordScenes />
        <PayoffScene />
        <CtaScene />
      </World>
      {FLASHES.map((f) => (
        <Flash key={f.at} from={f.at} hold={f.hold} />
      ))}
      {AUDIO_READY ? (
        <>
          <Score gain={0.9} dips={SCORE_DIPS} />
          {CUES.map((c, i) => (
            <Sfx key={`${c.name}-${c.at}-${i}`} name={c.name} from={c.at} volume={c.vol} />
          ))}
        </>
      ) : null}
    </AbsoluteFill>
  );
};
