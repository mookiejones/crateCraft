import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PlayerProvider } from "../../containers/PlayerContext";
import { WaveformClockProvider, WaveformProvider } from "../../containers/WaveformContext";
import { playerValue, storyClock } from "../../lib/storybook/fixtures";
import { seedStoryWaveform } from "../../lib/storybook/waveform";
import {
  ZOOM_DEFAULT_PPS,
  ZOOM_MAX_PPS,
  ZOOM_MIN_PPS,
  drawOverviewMarks,
  renderOverview,
  shadePlayed,
  zoomPixelsPerSecond,
} from "../../lib/player/waveform";
import { WaveformEngine, fixtureMarkers, fixtureWaveform } from "../../lib/player/waveform-view";
import { WaveformDetail, WaveformOverview, WaveformPanel, WaveformZoom } from "../../components/WaveformPanel";

const FIXTURE_DURATION = 20;

type WaveformStoryArgs = {
  compact: boolean;
  playing: boolean;
  playhead: number;
  unavailable: boolean;
};

function PanelHost({ compact, playing, playhead, unavailable }: WaveformStoryArgs) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const engine = useMemo(() => new WaveformEngine(compact), [compact]);
  const clock = useMemo(
    () =>
      storyClock({
        getTime: () => playhead,
        getDuration: () => FIXTURE_DURATION,
        getPlaying: () => playing,
      }),
    [playhead, playing],
  );

  useLayoutEffect(() => {
    return () => {
      engine.destroy();
    };
  }, [engine]);

  useLayoutEffect(() => {
    if (!host) return;
    seedStoryWaveform(engine, { duration: FIXTURE_DURATION, unavailable });
  }, [engine, host, unavailable]);

  useLayoutEffect(() => {
    engine.setClock(clock);
    engine.sync();
  }, [engine, clock]);

  return (
    <PlayerProvider value={playerValue({ currentTime: playhead, duration: FIXTURE_DURATION, playing })}>
      <WaveformProvider>
        <WaveformClockProvider clock={clock}>
          <div
            ref={setHost}
            className={compact ? "player-wave player-wave-compact" : "player-wave"}
            style={{ minHeight: compact ? 40 : 160, width: "100%" }}
          >
            {host ? <WaveformPanel engine={engine} host={host} compact={compact} /> : null}
          </div>
        </WaveformClockProvider>
      </WaveformProvider>
    </PlayerProvider>
  );
}

function PaintedOverview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parsed = fixtureWaveform(FIXTURE_DURATION);
    const width = Math.max(canvas.clientWidth, 480);
    const height = 36;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    const pixels = renderOverview(
      { kind: "computed", points: parsed.overview, count: parsed.overviewCount },
      width,
      height,
    );
    shadePlayed(pixels, width, height, (8 / FIXTURE_DURATION) * width);
    drawOverviewMarks(pixels, width, height, FIXTURE_DURATION, 8, fixtureMarkers());
    const image = context.createImageData(width, height);
    image.data.set(pixels);
    context.putImageData(image, 0, 0);
  }, []);
  return (
    <div style={{ width: "100%", minWidth: 480 }}>
      <WaveformOverview
        canvasRef={canvasRef}
        hitRef={hitRef}
        hidden={false}
        source="computed"
        pps={ZOOM_DEFAULT_PPS}
      />
    </div>
  );
}

function InteractiveZoom() {
  const [pps, setPps] = useState(ZOOM_DEFAULT_PPS);
  return (
    <WaveformZoom
      canZoomIn={pps < ZOOM_MAX_PPS}
      canZoomOut={pps > ZOOM_MIN_PPS}
      pps={pps}
      onZoomIn={() => setPps((current) => zoomPixelsPerSecond(current, 1))}
      onZoomOut={() => setPps((current) => zoomPixelsPerSecond(current, -1))}
    />
  );
}

const meta = {
  title: "Components/WaveformPanel",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: {
    compact: false,
    playing: false,
    playhead: 8,
    unavailable: false,
  },
  argTypes: {
    compact: { control: "boolean", description: "AppBar strip: overview only, no zoom." },
    playing: { control: "boolean", description: "Starts the paint loop at the playhead." },
    playhead: { control: { type: "range", min: 0, max: 20, step: 0.25 }, description: "Seconds on the 20s fixture." },
    unavailable: { control: "boolean", description: "Format note instead of canvases." },
  },
  render: (args) => <PanelHost {...args} />,
} satisfies Meta<WaveformStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const Compact: Story = {
  args: { compact: true },
};

export const Unavailable: Story = {
  args: { unavailable: true },
};

export const DetailReading: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    return <WaveformDetail canvasRef={canvasRef} phase="reading" />;
  },
};

export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => <PaintedOverview />,
};

export const Zoom: Story = {
  parameters: { controls: { disable: true } },
  render: () => <InteractiveZoom />,
};
