/**
 * jsdom is missing ResizeObserver, matchMedia, and layout boxes.
 * Data Grid needs those to paint rows and headers.
 */

function box(width: number, height: number): DOMRectReadOnly {
  return {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    width,
    height,
    toJSON() {
      return this;
    },
  };
}

/**
 * Install layout stubs the Community Data Grid needs in jsdom.
 *
 * Safe to call more than once. Does nothing in a real browser that
 * already has ResizeObserver and matchMedia.
 *
 * @returns {void}
 */
export function ensureGridDom(): void {
  if (typeof ResizeObserver === "undefined") {
    globalThis.ResizeObserver = class {
      private readonly callback: ResizeObserverCallback;
      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
      }
      observe(target: Element): void {
        const node = target as HTMLElement;
        const styledWidth = Number.parseFloat(node.style?.width || "");
        const styledHeight = Number.parseFloat(node.style?.height || "");
        let width = node.clientWidth || node.offsetWidth || (Number.isFinite(styledWidth) ? styledWidth : 0);
        let height = node.clientHeight || node.offsetHeight || (Number.isFinite(styledHeight) ? styledHeight : 0);
        const gridHost = node.classList?.contains("track-grid")
          || node.classList?.contains("report-grid")
          || node.classList?.contains("snapshot-grid")
          || node.classList?.contains("MuiDataGrid-root")
          || node.classList?.contains("MuiDataGrid-main")
          || node.classList?.contains("MuiDataGrid-virtualScroller")
          || node.id === "list"
          || node.id === "list-b"
          || node.id === "portable-view-findings"
          || node.id === "drift-report"
          || node.id === "snapshots-list";
        if (width < 1 && height < 1) {
          if (!gridHost) return;
          width = 800;
          height = 600;
        }
        this.callback(
          [
            {
              target,
              contentRect: box(width, height),
              borderBoxSize: [{ inlineSize: width, blockSize: height }],
              contentBoxSize: [{ inlineSize: width, blockSize: height }],
              devicePixelContentBoxSize: [{ inlineSize: width, blockSize: height }],
            } as ResizeObserverEntry,
          ],
          this,
        );
      }
      unobserve(): void {}
      disconnect(): void {}
    } as typeof ResizeObserver;
  }
  if (typeof globalThis.matchMedia !== "function") {
    globalThis.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener(): void {},
        removeListener(): void {},
        addEventListener(): void {},
        removeEventListener(): void {},
        dispatchEvent(): boolean {
          return false;
        },
      }) as MediaQueryList;
  }
}
