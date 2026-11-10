/**
 * Canvas waveform engine for the React player island.
 *
 * The zoomed view keeps the playhead at the center and scrolls the track
 * past it from the audio element's current time, on requestAnimationFrame
 * while playback is running. The overview is the whole track. Serato
 * Overview columns are drawn as soon as they arrive. The computed overview
 * replaces them when `GET /api/waveform` finishes. Zoom is the plus and
 * minus buttons, and Ctrl or Command with the wheel. No shortcut is added.
 *
 * React paints the canvases and zoom controls. This module fetches, tiles,
 * and blits. Strings come from `player-strings.ts` and `t()`.
 */

import { createElement } from "react";
import { mountIsland, type IslandRoot } from "../../app/mount";
import { WaveformPanel } from "../../components/WaveformPanel";
import {
  WaveformClockProvider,
  type OverviewSource,
  type WaveformClock,
  type WaveformPhase,
  type WaveformUi,
} from "../../containers/WaveformContext";
import { state } from "../state";
import {
  DetailTiles,
  ZOOM_DEFAULT_PPS,
  drawOverviewMarks,
  overviewXToTime,
  parseSwf1,
  renderOverview,
  shadePlayed,
  timeToX,
  zoomPixelsPerSecond,
  type ParsedWaveform,
  type WaveMarkers,
} from "./waveform";

/** What the player supplies. This module does not import the player. */
export type WaveformHooks = WaveformClock;

export interface WaveformController {
  setTrack(id: number | null): void;
  setMarkers(id: number, markers: WaveMarkers): void;
  sync(): void;
  destroy(): void;
  showComputed(parsed: ParsedWaveform): void;
  showUnavailable(): void;
  /** Refresh titles and notes after the language changes. */
  relabel(): void;
  pixelsPerSecond(): number;
}

export type WaveformAttach = {
  host: HTMLElement;
  detail: HTMLCanvasElement;
  overviewCanvas: HTMLCanvasElement;
  overviewHit: HTMLElement;
};

const emptyMarkers = (): WaveMarkers => ({ cues: [], loops: [], beatgrid: [] });

const idleClock: WaveformClock = {
  seek() {},
  seekBy() {},
  getTime: () => 0,
  getDuration: () => 0,
  getPlaying: () => false,
  formatTime: (seconds) => String(seconds),
  seekStep: 5,
  seekStepLarge: 30,
};

/**
 * Build the waveform island and return the hooks the player calls.
 *
 * The host is hidden until a track is loaded. A missing host does nothing
 * useful; the caller still gets a controller whose methods are safe.
 *
 * @param host Element that will hold the canvases and zoom buttons.
 * @param hooks Seek, time, and the existing seek steps. No new keys.
 * @returns The controller.
 */
export function mountWaveform(host: HTMLElement, hooks?: WaveformHooks): WaveformController {
  const engine = new WaveformEngine();
  host.classList.add("player-wave");
  host.hidden = true;
  if (hooks) engine.setClock(hooks);
  const panel = createElement(WaveformPanel, { engine, host });
  const tree = hooks ? createElement(WaveformClockProvider, { clock: hooks, children: panel }) : panel;
  const root = mountIsland(host, tree);
  engine.bindRoot(root);
  return engine;
}

/**
 * Paint a fixed waveform for the screenshot harness.
 *
 * The playhead is at 8 seconds of a 20 second track. A red cue, a blue
 * loop, and a beatgrid with a downbeat away from the playhead are drawn
 * by the same renderer the player uses. Coordinates are written on the
 * canvases so a test can sample those pixels.
 *
 * @param host Element to fill.
 * @returns The controller, so a test can zoom or show the unavailable note.
 */
export function mountWaveformFixture(host: HTMLElement): WaveformController {
  const playhead = 8;
  const duration = 20;
  const view = mountWaveform(host, {
    seek() {},
    seekBy() {},
    getTime: () => playhead,
    getDuration: () => duration,
    getPlaying: () => false,
    formatTime: (seconds) => String(seconds),
    seekStep: 5,
    seekStepLarge: 30,
  });
  view.showComputed(fixtureWaveform(duration));
  view.setMarkers(1, fixtureMarkers());
  const paint = (): void => {
    view.sync();
    stampFixture(host, playhead, duration, view.pixelsPerSecond());
    if ((host.querySelector(".waveform-detail")?.clientWidth ?? 0) > 0) host.dataset.waveformFixture = "ready";
  };
  paint();
  requestAnimationFrame(() => {
    paint();
    requestAnimationFrame(paint);
  });
  return view;
}

/**
 * Fetch, tile, and blit the waveform. React owns the DOM nodes.
 */
export class WaveformEngine implements WaveformController {
  private host: HTMLElement | null = null;
  private detail: HTMLCanvasElement | null = null;
  private overviewCanvas: HTMLCanvasElement | null = null;
  private overviewHit: HTMLElement | null = null;
  private clock: WaveformClock = idleClock;
  private publishUi: ((next: WaveformUi) => void) | null = null;
  private root: IslandRoot | null = null;
  private trackId: number | null = null;
  private token = 0;
  private pps = ZOOM_DEFAULT_PPS;
  private phase: WaveformPhase = "idle";
  private markers: WaveMarkers = emptyMarkers();
  private tiles: DetailTiles | null = null;
  private parsed: ParsedWaveform | null = null;
  private overviewSource: OverviewSource = "";
  private seratoColumns: number[][] = [];
  private overviewCache: Uint8ClampedArray | null = null;
  private overviewKey = "";
  private raf = 0;
  private dragging = false;
  private disposed = false;
  private attached = false;
  private detailImage: ImageData | null = null;
  private overviewImage: ImageData | null = null;
  private lastAriaKey = "";
  private ariaImmediate = false;
  private readonly onWheel: (event: WheelEvent) => void;
  private readonly onResize: () => void;
  private readonly onPointerDown: (event: PointerEvent) => void;
  private readonly onPointerMove: (event: PointerEvent) => void;
  private readonly onPointerUp: (event: PointerEvent) => void;
  private readonly onOverviewKey: (event: KeyboardEvent) => void;
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    this.onWheel = (event) => this.wheel(event);
    this.onResize = () => this.paint();
    this.onPointerDown = (event) => this.pointerDown(event);
    this.onPointerMove = (event) => this.pointerMove(event);
    this.onPointerUp = (event) => this.pointerUp(event);
    this.onOverviewKey = (event) => this.overviewKeyDown(event);
  }

  /**
   * Keep the React root so destroy can unmount it.
   *
   * @param root Island created by `mountIsland`.
   */
  bindRoot(root: IslandRoot): void {
    this.root = root;
  }

  /**
   * Replace the seek/time clock. Tests pass hooks; the page uses the player.
   *
   * @param clock Seek and time callbacks.
   */
  setClock(clock: WaveformClock): void {
    this.clock = clock;
  }

  /**
   * Push zoom and phase into WaveformContext.
   *
   * @param publish Context setter. Flushed by the provider.
   */
  setPublish(publish: (next: WaveformUi) => void): void {
    this.publishUi = publish;
  }

  /**
   * Bind canvases after React commits them.
   *
   * @param nodes Host, detail canvas, overview canvas, and overview hit target.
   */
  attach(nodes: WaveformAttach): void {
    if (this.disposed) return;
    this.detach();
    this.host = nodes.host;
    this.detail = nodes.detail;
    this.overviewCanvas = nodes.overviewCanvas;
    this.overviewHit = nodes.overviewHit;
    this.attached = true;
    this.host.addEventListener("wheel", this.onWheel, { passive: false });
    this.overviewHit.addEventListener("pointerdown", this.onPointerDown);
    this.overviewHit.addEventListener("pointermove", this.onPointerMove);
    this.overviewHit.addEventListener("pointerup", this.onPointerUp);
    this.overviewHit.addEventListener("pointercancel", this.onPointerUp);
    this.overviewHit.addEventListener("keydown", this.onOverviewKey);
    if (typeof ResizeObserver === "function") {
      this.resizeObserver = new ResizeObserver(this.onResize);
      this.resizeObserver.observe(this.host);
    }
    this.paint();
  }

  /**
   * Drop canvas listeners. Does not unmount React.
   */
  detach(): void {
    if (!this.attached) return;
    this.stopLoop();
    this.host?.removeEventListener("wheel", this.onWheel);
    this.overviewHit?.removeEventListener("pointerdown", this.onPointerDown);
    this.overviewHit?.removeEventListener("pointermove", this.onPointerMove);
    this.overviewHit?.removeEventListener("pointerup", this.onPointerUp);
    this.overviewHit?.removeEventListener("pointercancel", this.onPointerUp);
    this.overviewHit?.removeEventListener("keydown", this.onOverviewKey);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.attached = false;
  }

  /**
   * Load one track, or hide the waveform when playback is cleared.
   *
   * The same id does not fetch again. Overview and the SWF1 body are
   * requested together. Playback is not paused from here.
   *
   * @param id Library track id, or null when nothing is loaded.
   */
  setTrack(id: number | null): void {
    if (this.disposed) return;
    if (id === this.trackId) return;
    this.token += 1;
    this.trackId = id;
    this.parsed = null;
    this.tiles = null;
    this.markers = emptyMarkers();
    this.overviewCache = null;
    this.overviewKey = "";
    this.overviewSource = "";
    if (this.overviewHit) delete this.overviewHit.dataset.waveformOverview;
    if (id === null || !Number.isInteger(id) || id < 0) {
      if (this.host) this.host.hidden = true;
      this.stopLoop();
      this.setPhase("idle");
      return;
    }
    if (this.host) this.host.hidden = false;
    this.setPhase("reading");
    const mine = this.token;
    void this.load(id, mine);
  }

  /**
   * Store cues, loops, and the beatgrid for the loaded track.
   *
   * A response for a track that is no longer loaded is ignored.
   *
   * @param id Track the rows belong to.
   * @param markers Marks to draw. Colors stay as stored.
   */
  setMarkers(id: number, markers: WaveMarkers): void {
    if (id !== this.trackId) return;
    this.markers = markers;
    this.paint();
  }

  /**
   * Show a parsed waveform without fetching.
   *
   * The screenshot harness and tests use this. The host is shown.
   *
   * @param parsed SWF1 sections.
   */
  showComputed(parsed: ParsedWaveform): void {
    this.trackId = this.trackId ?? 1;
    if (this.host) this.host.hidden = false;
    this.applyComputed(parsed);
  }

  /** Refresh titles and notes in the active language. Playback is not touched. */
  relabel(): void {
    this.pushUi();
  }

  /**
   * Show the format note and hide the canvases.
   *
   * The screenshot harness uses this for a file that cannot be decoded.
   * Playback is not touched.
   */
  showUnavailable(): void {
    this.token += 1;
    this.parsed = null;
    this.tiles = null;
    this.overviewSource = "";
    this.seratoColumns = [];
    this.overviewCache = null;
    this.overviewKey = "";
    if (this.overviewHit) delete this.overviewHit.dataset.waveformOverview;
    if (this.host) this.host.hidden = false;
    this.setPhase("unavailable");
  }

  /**
   * Follow play, pause, and seek.
   *
   * While audio is playing, frames are scheduled from the audio clock.
   * A paused seek paints once.
   */
  sync(): void {
    if (this.disposed || this.host?.hidden) return;
    if (this.clock.getPlaying()) this.startLoop();
    else this.stopLoop();
    this.paint();
  }

  /**
   * Current zoom in CSS pixels per second.
   *
   * @returns The zoom the buttons and the wheel last set.
   */
  pixelsPerSecond(): number {
    return this.pps;
  }

  /**
   * Step zoom in or out around the playhead.
   *
   * @param direction Positive zooms in.
   */
  zoom(direction: 1 | -1): void {
    this.setZoom(zoomPixelsPerSecond(this.pps, direction));
  }

  /**
   * Remove listeners, stop the animation frame, and unmount the island.
   */
  destroy(): void {
    this.disposed = true;
    this.token += 1;
    this.detach();
    this.root?.unmount();
    this.root = null;
  }

  private async load(id: number, mine: number): Promise<void> {
    const overview = this.fetchOverview(id);
    const body = this.fetchWaveform(id);
    void overview.then((serato) => {
      if (mine !== this.token || !serato || serato.length === 0) return;
      if (this.overviewSource === "computed") return;
      this.seratoColumns = serato;
      this.overviewSource = "serato";
      if (this.overviewHit) this.overviewHit.dataset.waveformOverview = "serato";
      this.overviewCache = null;
      this.overviewKey = "";
      this.pushUi();
      this.paint();
    });
    const waveform = await body;
    if (mine !== this.token) return;
    if (waveform === "unavailable") {
      this.parsed = null;
      this.tiles = null;
      this.setPhase("unavailable");
      this.paint();
      return;
    }
    if (waveform) this.applyComputed(waveform);
  }

  private applyComputed(parsed: ParsedWaveform): void {
    this.parsed = parsed;
    const rate = parsed.pointsPerSecond > 0 ? parsed.pointsPerSecond : 150;
    this.tiles = new DetailTiles(parsed.detail, parsed.detailCount, rate);
    this.overviewSource = "computed";
    if (this.overviewHit) this.overviewHit.dataset.waveformOverview = "computed";
    this.overviewCache = null;
    this.overviewKey = "";
    this.setPhase("ready");
    this.paint();
  }

  private async fetchOverview(id: number): Promise<number[][] | null> {
    try {
      if (typeof fetch !== "function") return null;
      const response = await fetch(waveformUrl(id, true));
      if (!response.ok) return null;
      const payload: unknown = await response.json();
      if (!payload || typeof payload !== "object") return null;
      const record = payload as { available?: unknown; data?: unknown };
      if (record.available !== true || !Array.isArray(record.data)) return null;
      const columns: number[][] = [];
      for (const column of record.data) {
        if (!Array.isArray(column)) continue;
        columns.push(column.map((value) => (typeof value === "number" && Number.isFinite(value) ? value : 0)));
      }
      return columns;
    } catch {
      return null;
    }
  }

  private async fetchWaveform(id: number): Promise<ParsedWaveform | "unavailable" | null> {
    try {
      if (typeof fetch !== "function") return null;
      const response = await fetch(waveformUrl(id, false));
      if (!response.ok) return null;
      const buffer = await response.arrayBuffer();
      const parsed = parseSwf1(buffer);
      if (parsed) return parsed;
      const text = new TextDecoder().decode(buffer);
      try {
        const payload: unknown = JSON.parse(text);
        if (payload && typeof payload === "object" && (payload as { available?: unknown }).available === false) {
          return "unavailable";
        }
      } catch {
        return null;
      }
      return null;
    } catch {
      return null;
    }
  }

  private setPhase(phase: WaveformPhase): void {
    this.phase = phase;
    if (this.host) this.host.dataset.waveformState = phase === "idle" ? "" : phase;
    this.pushUi();
  }

  private setZoom(next: number): void {
    if (next === this.pps) {
      this.pushUi();
      return;
    }
    this.pps = next;
    this.tiles?.clear();
    this.pushUi();
    this.paint();
  }

  private pushUi(): void {
    this.publishUi?.({
      pps: this.pps,
      phase: this.phase,
      overviewSource: this.overviewSource,
    });
  }

  private wheel(event: WheelEvent): void {
    if (!event.ctrlKey && !event.metaKey) return;
    if (this.phase !== "ready") return;
    event.preventDefault();
    if (event.deltaY < 0) this.setZoom(zoomPixelsPerSecond(this.pps, 1));
    else if (event.deltaY > 0) this.setZoom(zoomPixelsPerSecond(this.pps, -1));
  }

  private pointerDown(event: PointerEvent): void {
    if (event.button !== 0 || !this.overviewHit) return;
    this.dragging = true;
    if (typeof this.overviewHit.setPointerCapture === "function") {
      this.overviewHit.setPointerCapture(event.pointerId);
    }
    this.seekOverview(event);
  }

  private pointerMove(event: PointerEvent): void {
    if (!this.dragging) return;
    this.seekOverview(event);
  }

  private pointerUp(event: PointerEvent): void {
    if (!this.dragging || !this.overviewHit) return;
    this.dragging = false;
    if (typeof this.overviewHit.hasPointerCapture === "function" && this.overviewHit.hasPointerCapture(event.pointerId)) {
      this.overviewHit.releasePointerCapture(event.pointerId);
    }
  }

  private seekOverview(event: PointerEvent): void {
    if (!this.overviewHit) return;
    const rect = this.overviewHit.getBoundingClientRect();
    const duration = this.duration();
    const x = event.clientX - rect.left;
    this.ariaImmediate = true;
    this.clock.seek(overviewXToTime(x, rect.width, duration));
  }

  private overviewKeyDown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    const forward = event.key === "ArrowRight" || event.key === "ArrowUp";
    const back = event.key === "ArrowLeft" || event.key === "ArrowDown";
    if (!forward && !back) return;
    event.preventDefault();
    event.stopPropagation();
    const step = event.shiftKey ? this.clock.seekStepLarge : this.clock.seekStep;
    this.ariaImmediate = true;
    this.clock.seekBy((forward ? 1 : -1) * step);
  }

  private startLoop(): void {
    if (this.raf !== 0) return;
    const loop = (): void => {
      this.paint();
      if (this.clock.getPlaying() && !this.disposed) this.raf = requestAnimationFrame(loop);
      else this.raf = 0;
    };
    this.raf = requestAnimationFrame(loop);
  }

  private stopLoop(): void {
    if (this.raf === 0) return;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private paint(): void {
    if (this.disposed || !this.host || this.host.hidden) return;
    const time = this.clock.getTime();
    const duration = this.duration();
    this.paintDetail(time);
    this.paintOverview(time, duration);
    const immediate = this.ariaImmediate;
    this.ariaImmediate = false;
    this.updateSlider(time, duration, immediate);
  }

  private paintDetail(time: number): void {
    if (!this.tiles || !this.parsed || !this.detail) return;
    const size = sizeCanvas(this.detail, 96);
    if (!size) return;
    const context = this.detail.getContext("2d");
    if (!context) return;
    const image = this.canvasImage(context, "detail", size.width, size.height);
    this.tiles.paint(image.data, size.width, size.height, size.dpr, time, this.pps, this.markers);
    context.putImageData(image, 0, 0);
  }

  private paintOverview(time: number, duration: number): void {
    if (!this.overviewCanvas) return;
    const size = sizeCanvas(this.overviewCanvas, 36);
    if (!size) return;
    const source = this.overviewPixels(size.width, size.height);
    if (!source) return;
    const context = this.overviewCanvas.getContext("2d");
    if (!context) return;
    const image = this.canvasImage(context, "overview", size.width, size.height);
    image.data.set(source);
    const played = duration > 0 ? (Math.min(duration, Math.max(0, time)) / duration) * size.width : 0;
    shadePlayed(image.data, size.width, size.height, played);
    drawOverviewMarks(image.data, size.width, size.height, duration > 0 ? duration : this.headerDuration(), time, this.markers);
    context.putImageData(image, 0, 0);
  }

  /**
   * One ImageData for a canvas, replaced only when the bitmap size changes.
   *
   * Width and height already include the device pixel ratio, so a DPR
   * change allocates again. Playback reuses the same buffer.
   *
   * @param context Canvas context that owns the buffer.
   * @param which Detail or overview cache.
   * @param width Device pixels.
   * @param height Device pixels.
   * @returns The buffer to draw into.
   */
  private canvasImage(
    context: CanvasRenderingContext2D,
    which: "detail" | "overview",
    width: number,
    height: number,
  ): ImageData {
    const current = which === "detail" ? this.detailImage : this.overviewImage;
    if (current && current.width === width && current.height === height) return current;
    const image = context.createImageData(width, height);
    if (which === "detail") this.detailImage = image;
    else this.overviewImage = image;
    return image;
  }

  private overviewPixels(width: number, height: number): Uint8ClampedArray | null {
    const key = `${this.overviewSource}|${width}|${height}|${this.token}`;
    if (this.overviewCache && this.overviewKey === key) return this.overviewCache;
    if (this.overviewSource === "computed" && this.parsed && this.parsed.overviewCount > 0) {
      this.overviewCache = renderOverview(
        { kind: "computed", points: this.parsed.overview, count: this.parsed.overviewCount },
        width,
        height,
      );
      this.overviewKey = key;
      if (this.overviewHit) this.overviewHit.dataset.waveformOverview = "computed";
      return this.overviewCache;
    }
    if (this.overviewSource === "serato" && this.seratoColumns.length > 0) {
      this.overviewCache = renderOverview({ kind: "serato", columns: this.seratoColumns }, width, height);
      this.overviewKey = key;
      if (this.overviewHit) this.overviewHit.dataset.waveformOverview = "serato";
      return this.overviewCache;
    }
    return null;
  }

  private updateSlider(time: number, duration: number, immediate: boolean): void {
    if (!this.overviewHit) return;
    const max = duration > 0 ? duration : 0;
    const now = Math.min(max, Math.max(0, Number.isFinite(time) ? time : 0));
    const key = `${Math.floor(now)}|${max}`;
    if (!immediate && key === this.lastAriaKey) return;
    this.lastAriaKey = key;
    this.overviewHit.setAttribute("aria-valuemin", "0");
    this.overviewHit.setAttribute("aria-valuemax", String(max));
    this.overviewHit.setAttribute("aria-valuenow", String(now));
    this.overviewHit.setAttribute("aria-valuetext", this.clock.formatTime(now));
  }

  private duration(): number {
    const fromAudio = this.clock.getDuration();
    if (Number.isFinite(fromAudio) && fromAudio > 0) return fromAudio;
    return this.headerDuration();
  }

  private headerDuration(): number {
    if (!this.parsed || !(this.parsed.durationMs > 0)) return 0;
    return this.parsed.durationMs / 1000;
  }
}

function waveformUrl(id: number, overview: boolean): string {
  const params = new URLSearchParams({ id: String(id), space: state.space });
  const path = overview ? "/api/waveform/overview" : "/api/waveform";
  return `${path}?${params.toString()}`;
}

function sizeCanvas(canvas: HTMLCanvasElement, cssHeight: number): { width: number; height: number; dpr: number } | null {
  const cssWidth = canvas.clientWidth;
  if (!(cssWidth > 0)) return null;
  const dpr = typeof window !== "undefined" && window.devicePixelRatio > 0 ? window.devicePixelRatio : 1;
  const width = Math.max(1, Math.round(cssWidth * dpr));
  const height = Math.max(1, Math.round(cssHeight * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  return { width, height, dpr };
}

function fixtureWaveform(durationSeconds: number): ParsedWaveform {
  const rate = 150;
  const count = rate * durationSeconds;
  const detail = new Uint8Array(count * 6);
  for (let index = 0; index < count; index += 1) {
    const t = index / rate;
    // One slow envelope. High stays under low so a fast high-band
    // sine does not paint a saturated blue bar every half second.
    const env = 0.42 + 0.58 * (0.5 + 0.5 * Math.sin(t * 0.85));
    const low = Math.round(210 * env);
    const mid = Math.round(120 * env * (0.75 + 0.25 * Math.sin(t * 1.6)));
    const high = Math.round(55 * env * (0.7 + 0.3 * Math.sin(t * 2.2 + 0.8)));
    const offset = index * 6;
    detail[offset] = low;
    detail[offset + 1] = Math.round(low * 0.5);
    detail[offset + 2] = mid;
    detail[offset + 3] = Math.round(mid * 0.45);
    detail[offset + 4] = high;
    detail[offset + 5] = Math.round(high * 0.4);
  }
  const overviewCount = 200;
  const overview = new Uint8Array(overviewCount * 6);
  for (let index = 0; index < overviewCount; index += 1) {
    const t = index / overviewCount;
    const low = Math.round(70 + 110 * Math.abs(Math.sin(t * Math.PI * 6)));
    const mid = Math.round(30 + 80 * Math.abs(Math.sin(t * Math.PI * 14 + 0.4)));
    const high = Math.round(15 + 50 * Math.abs(Math.sin(t * Math.PI * 22)));
    const offset = index * 6;
    overview[offset] = low;
    overview[offset + 1] = Math.round(low * 0.55);
    overview[offset + 2] = mid;
    overview[offset + 3] = Math.round(mid * 0.45);
    overview[offset + 4] = high;
    overview[offset + 5] = Math.round(high * 0.4);
  }
  return {
    version: 1,
    flags: 3,
    analyzerVersion: 1,
    sampleRate: 44100,
    pointsPerSecond: rate,
    durationMs: durationSeconds * 1000,
    detail,
    overview,
    serato: new Uint8Array(),
    detailCount: count,
    overviewCount,
    seratoColumns: 0,
    seratoBands: 0,
    lowHz: 250,
    highHz: 4000,
  };
}

function fixtureMarkers(): WaveMarkers {
  return {
    cues: [{ seconds: 9.25, color: "#CC0000" }],
    loops: [{ startSeconds: 6.15, endSeconds: 7.4, color: "#27AAE1" }],
    beatgrid: [
      { positionSeconds: 0, beats: 40 },
      { positionSeconds: 20, bpm: 120 },
    ],
  };
}

function stampFixture(host: HTMLElement, playhead: number, duration: number, pps: number): void {
  const detail = host.querySelector<HTMLCanvasElement>(".waveform-detail");
  const overview = host.querySelector<HTMLCanvasElement>(".waveform-overview canvas");
  if (!detail || !overview) return;
  const detailScale = detail.clientWidth > 0 ? detail.width / detail.clientWidth : 1;
  const cssWidth = detail.clientWidth || detail.width;
  detail.dataset.cueX = String(Math.round(timeToX(9.25, playhead, pps, cssWidth) * detailScale));
  detail.dataset.downbeatX = String(Math.round(timeToX(6, playhead, pps, cssWidth) * detailScale));
  detail.dataset.beatX = String(Math.round(timeToX(5.5, playhead, pps, cssWidth) * detailScale));
  detail.dataset.loopEdgeX = String(Math.round(timeToX(6.15, playhead, pps, cssWidth) * detailScale));
  detail.dataset.playheadX = String(Math.floor(detail.width / 2));
  const played = Math.round((playhead / duration) * overview.width);
  overview.dataset.playedX = String(played);
  overview.dataset.cueX = String(Math.round((9.25 / duration) * overview.width));
  overview.dataset.loopEdgeX = String(Math.round((6.15 / duration) * overview.width));
}
