/**
 * Scrolling waveform, overview strip, and zoom controls.
 *
 * Playhead and the loaded track come from `usePlayer`. Zoom and the
 * overview source come from `useWaveform`. Canvas paint stays in the
 * engine in `waveform-view.ts`.
 */

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { usePlayer } from "../containers/PlayerContext";
import {
  useWaveform,
  useWaveformClockOverride,
  type WaveformClock,
  type WaveformPhase,
} from "../containers/WaveformContext";
import { t } from "../lib/i18n";
import { playerStrings } from "../lib/player/player-strings";
import { setTooltip } from "../lib/ui/tooltip";
import { tips, type TipSpec } from "../lib/ui/tooltip-strings";
import type { WaveformEngine } from "../lib/player/waveform-view";

function tooltipRef(spec: TipSpec) {
  return (element: HTMLElement | null) => {
    if (element) setTooltip(element, spec);
  };
}

function clockFromPlayer(
  player: ReturnType<typeof usePlayer>,
): WaveformClock {
  return {
    seek: player.seek,
    seekBy: player.seekBy,
    getTime: player.mediaTime,
    getDuration: player.mediaDuration,
    getPlaying: () => player.playing,
    formatTime: player.formatTime,
    seekStep: player.seekStep,
    seekStepLarge: player.seekStepLarge,
  };
}

/**
 * Waveform island: detail canvas, overview, and zoom.
 *
 * Compact skips the zoom buttons and keeps the overview in the DOM
 * hidden so `engine.attach` still receives both canvases.
 *
 * @param props Engine that paints canvases, the host element, and compact.
 */
export function WaveformPanel({
  engine,
  host,
  compact = false,
}: {
  engine: WaveformEngine;
  host: HTMLElement;
  compact?: boolean;
}) {
  const player = usePlayer();
  const wave = useWaveform();
  const override = useWaveformClockOverride();
  const clock = override ?? clockFromPlayer(player);
  const detailRef = useRef<HTMLCanvasElement>(null);
  const overviewCanvasRef = useRef<HTMLCanvasElement>(null);
  const overviewHitRef = useRef<HTMLDivElement>(null);
  engine.setClock(clock);
  engine.setPublish(wave.publish);

  useLayoutEffect(() => {
    const detail = detailRef.current;
    const overviewCanvas = overviewCanvasRef.current;
    const overviewHit = overviewHitRef.current;
    if (!detail || !overviewCanvas || !overviewHit) return;
    engine.attach({
      host,
      detail,
      overviewCanvas,
      overviewHit,
    });
    return () => {
      engine.detach();
    };
  }, [engine, host]);

  useEffect(() => {
    if (override) return;
    engine.setTrack(player.trackId);
  }, [engine, override, player.trackId]);

  return (
    <>
      <div className="player-wave-main">
        <WaveformDetail canvasRef={detailRef} phase={wave.phase} />
        <p className="waveform-note" hidden={wave.phase !== "unavailable"}>
          {t("player.waveformUnavailable")}
        </p>
        <WaveformOverview
          canvasRef={overviewCanvasRef}
          hitRef={overviewHitRef}
          hidden={compact || wave.overviewSource === ""}
          source={wave.overviewSource}
          pps={wave.pps}
        />
      </div>
      {compact ? null : (
        <WaveformZoom
          canZoomIn={wave.canZoomIn}
          canZoomOut={wave.canZoomOut}
          pps={wave.pps}
          onZoomIn={() => engine.zoom(1)}
          onZoomOut={() => engine.zoom(-1)}
        />
      )}
    </>
  );
}

/**
 * Zoomed scrolling canvas with the playhead at the center.
 *
 * @param props Canvas refs and the load phase.
 */
export function WaveformDetail({
  canvasRef,
  phase,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  phase: WaveformPhase;
}) {
  return (
    <div className="waveform-detail-wrap" hidden={phase === "unavailable"}>
      <canvas className="waveform-detail" ref={canvasRef} aria-hidden="true" />
      <p className="waveform-reading" hidden={phase !== "reading"}>
        {playerStrings.waveformReading}
      </p>
    </div>
  );
}

/**
 * Full-track overview strip. Click and drag seek.
 *
 * @param props Canvas, hit target, and overview source from context.
 */
export function WaveformOverview({
  canvasRef,
  hitRef,
  hidden,
  source,
  pps,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  hitRef: RefObject<HTMLDivElement | null>;
  hidden: boolean;
  source: string;
  pps: number;
}) {
  return (
    <div
      ref={(element) => {
        hitRef.current = element;
        if (element) setTooltip(element, tips.overview);
      }}
      className="waveform-overview"
      tabIndex={0}
      role="slider"
      hidden={hidden}
      aria-label={playerStrings.overview}
      aria-orientation="horizontal"
      data-pps={String(pps)}
      data-waveform-overview={source || undefined}
    >
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  );
}

/**
 * Plus and minus zoom around the playhead.
 *
 * @param props Limits from context and the engine zoom callbacks.
 */
export function WaveformZoom({
  canZoomIn,
  canZoomOut,
  pps,
  onZoomIn,
  onZoomOut,
}: {
  canZoomIn: boolean;
  canZoomOut: boolean;
  pps: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  return (
    <div className="waveform-zoom" data-pps={String(pps)}>
      <IconButton
        type="button"
        ref={tooltipRef(tips.zoomIn)}
        className="waveform-zoom-button"
        size="large"
        color="inherit"
        disabled={!canZoomIn}
        aria-label={playerStrings.zoomIn}
        onClick={onZoomIn}
      >
        <AddIcon />
      </IconButton>
      <IconButton
        type="button"
        ref={tooltipRef(tips.zoomOut)}
        className="waveform-zoom-button"
        size="large"
        color="inherit"
        disabled={!canZoomOut}
        aria-label={playerStrings.zoomOut}
        onClick={onZoomOut}
      >
        <RemoveIcon />
      </IconButton>
    </div>
  );
}
