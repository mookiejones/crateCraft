import { useMemo, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PlayerProvider } from "../containers/PlayerContext";
import { WaveformClockProvider, WaveformProvider } from "../containers/WaveformContext";
import { dummyWaveformEngine, playerValue, storyClock } from "../lib/storybook/fixtures";
import { ZOOM_DEFAULT_PPS } from "../lib/player/waveform";
import { WaveformDetail, WaveformOverview, WaveformPanel, WaveformZoom } from "./WaveformPanel";

const meta = {
  title: "Components/WaveformPanel",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function PanelHost() {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const engine = useMemo(() => dummyWaveformEngine(), []);
  return (
    <PlayerProvider value={playerValue()}>
      <WaveformProvider>
        <WaveformClockProvider clock={storyClock()}>
          <div ref={setHost} className="player-wave" style={{ minHeight: 160 }}>
            {host ? <WaveformPanel engine={engine} host={host} /> : null}
          </div>
        </WaveformClockProvider>
      </WaveformProvider>
    </PlayerProvider>
  );
}

export const Panel: Story = {
  render: () => <PanelHost />,
};

export const DetailReading: Story = {
  render: () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    return <WaveformDetail canvasRef={canvasRef} phase="reading" />;
  },
};

export const Overview: Story = {
  render: () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const hitRef = useRef<HTMLDivElement>(null);
    return (
      <WaveformOverview
        canvasRef={canvasRef}
        hitRef={hitRef}
        hidden={false}
        source="computed"
        pps={ZOOM_DEFAULT_PPS}
      />
    );
  },
};

export const Zoom: Story = {
  render: () => (
    <WaveformZoom
      canZoomIn
      canZoomOut
      pps={ZOOM_DEFAULT_PPS}
      onZoomIn={() => {}}
      onZoomOut={() => {}}
    />
  ),
};
