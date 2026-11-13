import type { Meta, StoryObj } from "@storybook/react-vite";
import { WaveformClockProvider, WaveformProvider, useWaveform } from "../../containers/WaveformContext";
import { storyClock } from "../../lib/storybook/fixtures";
import { WaveformZoom } from "../../components/WaveformPanel";

function ZoomFromContext() {
  const wave = useWaveform();
  return (
    <WaveformZoom
      canZoomIn={wave.canZoomIn}
      canZoomOut={wave.canZoomOut}
      pps={wave.pps}
      onZoomIn={() => wave.publish({ ...wave, pps: wave.pps * 2 })}
      onZoomOut={() => wave.publish({ ...wave, pps: wave.pps / 2 })}
    />
  );
}

const meta = {
  title: "Containers/Waveform",
  component: WaveformZoom,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: {
    canZoomIn: true,
    canZoomOut: true,
    pps: 80,
    onZoomIn: () => {},
    onZoomOut: () => {},
  },
} satisfies Meta<typeof WaveformZoom>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultZoom: Story = {
  render: () => (
    <WaveformProvider>
      <WaveformClockProvider clock={storyClock()}>
        <ZoomFromContext />
      </WaveformClockProvider>
    </WaveformProvider>
  ),
};
