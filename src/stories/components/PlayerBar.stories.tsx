import { useLayoutEffect, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PlayerBar } from "../../components/PlayerBar";
import { PlayerProvider } from "../../containers/PlayerContext";
import {
  playerArgTypes,
  playerStoryArgs,
  playerValueFromArgs,
  type PlayerStoryArgs,
} from "../../lib/storybook/args";

function WidthLock({ width, children }: { width: number; children: ReactNode }) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  useLayoutEffect(() => {
    window.dispatchEvent(new Event("resize"));
  }, [width]);
  return children;
}

function Host({ width, ...args }: PlayerStoryArgs & { width?: number }) {
  return (
    <WidthLock width={width ?? 1200}>
      <PlayerProvider value={playerValueFromArgs(args)}>
        <div className="player-bar-host">
          <PlayerBar />
        </div>
      </PlayerProvider>
    </WidthLock>
  );
}

const meta = {
  title: "Components/PlayerBar",
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: playerStoryArgs,
  argTypes: playerArgTypes,
  render: (args) => <Host {...args} />,
} satisfies Meta<PlayerStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Paused: Story = {};

export const Playing: Story = {
  args: { playing: true, currentTime: 45 },
};

export const Empty: Story = {
  args: { empty: true },
};

/** Wide AppBar deck: wave, then pads beside Play · title · time. */
export const FullDeck: Story = {
  render: (args) => <Host {...args} width={1200} />,
};

/** ≤980px compact strip: Play · title · wave · time, no pads. */
export const Compact: Story = {
  render: (args) => <Host {...args} width={980} />,
};
