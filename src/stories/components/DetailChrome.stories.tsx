import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  DetailHead,
  DetailSection,
  DetailSectionNav,
  detailSwatch,
  detailTitle,
} from "../../components/DetailChrome";
import { PlayerProvider } from "../../containers/PlayerContext";
import { TrackListProvider } from "../../containers/TrackListContext";
import { nightTrack, playerValue, trackListValue } from "../../lib/storybook/fixtures";

function DetailChromeStory() {
  return (
    <div className="detail" style={{ height: 420, overflow: "auto" }}>
      <div className="detail-body">
        <div className="detail-sticky">
          <DetailHead
            title={detailTitle(nightTrack)}
            artist={nightTrack.artist || ""}
            album={nightTrack.album || ""}
            bpm="128"
            musicalKey="8A"
            length="3:10"
            color={detailSwatch(0xcc0000)}
            trackId={nightTrack.id}
            playName={detailTitle(nightTrack)}
          />
          <DetailSectionNav
            active="markers"
            onJump={() => {}}
            chips={[
              { id: "related", label: "Mixes well", count: 2 },
              { id: "markers", label: "Cues", count: 1 },
              { id: "crates", label: "Crates", count: 0 },
              { id: "copies", label: "Copies", count: 0 },
              { id: "fields", label: "Tags", count: 1 },
            ]}
          />
        </div>
        <DetailSection id="markers" title="Cue points" count={1}>
          <p>Drop</p>
        </DetailSection>
        <DetailSection id="copies" title="Other copies" count={0} empty="No other copies">
          <p>unused</p>
        </DetailSection>
      </div>
    </div>
  );
}

const meta = {
  title: "Components/DetailChrome",
  component: DetailChromeStory,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <PlayerProvider value={playerValue()}>
        <TrackListProvider value={trackListValue()}>
          <Story />
        </TrackListProvider>
      </PlayerProvider>
    ),
  ],
} satisfies Meta<typeof DetailChromeStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StickyHeader: Story = {};
