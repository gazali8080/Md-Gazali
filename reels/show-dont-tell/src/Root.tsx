import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { PrimitivesTest } from "./Primitives";
import { RailTest } from "./RailTest";
import { Reel } from "./reel/Reel";
import { DURATION, FPS, H, W } from "./lib/theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Reel" component={Reel} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
      <MyComposition />
      <Composition
        id="Primitives"
        component={PrimitivesTest}
        durationInFrames={120}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition id="Rail" component={RailTest} durationInFrames={120} fps={FPS} width={W} height={H} />
    </>
  );
};
