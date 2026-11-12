/**
 * Put the real page markup into the jsdom document.
 *
 * The tests call the same element ids the screen uses. The script tag is
 * left out so jsdom does not fetch /app.js.
 */

import html from "../../static/index.html?raw";

/**
 * Let React's `setImmediate` scheduler run while jsdom still has `window`.
 *
 * Data Grid work queued after unmount hits `window is not defined` if the
 * environment tears down first.
 *
 * @returns {Promise<void>}
 */
export function drainReactScheduler(): Promise<void> {
  const queue = globalThis as typeof globalThis & {
    setImmediate?: (callback: () => void) => void;
  };
  return new Promise((resolve) => {
    if (typeof queue.setImmediate === "function") {
      queue.setImmediate(resolve);
      return;
    }
    setTimeout(resolve, 0);
  });
}

export function installPage(): void {
  const start = html.indexOf("<body");
  const end = html.lastIndexOf("</body>");
  const body = html.slice(start, end).replace(/<script[\s\S]*?<\/script>/g, "");
  document.body.outerHTML = `${body}</body>`;
  const dialog = HTMLDialogElement.prototype;
  if (typeof dialog.showModal !== "function") {
    dialog.showModal = function showModal(this: HTMLDialogElement) {
      this.open = true;
    };
  }
  if (typeof dialog.close !== "function") {
    dialog.close = function close(this: HTMLDialogElement) {
      if (!this.open) return;
      this.open = false;
      this.dispatchEvent(new Event("close"));
    };
  }
}
