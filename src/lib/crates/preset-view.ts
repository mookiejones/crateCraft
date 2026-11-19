/**
 * Pure helpers for crate presets (#26).
 *
 * views.ts paints the crate actions and footer with these, and presets.ts
 * runs the dialog and the requests. Keeping these here means views.ts
 * does not import presets.ts, which imports views.ts. Nothing here fetches.
 */

import type { Crate, PresetSpec, RuleLeaf } from "../api-types";
import { el } from "../dom";
import { applyStatic, formatDate, formatNumber, hasKey, t, type MessageKey } from "../i18n";
import { state } from "../state";
import { buttonEl, inputEl, selectEl } from "../ui/tooltip";
import { tips } from "../ui/tooltip-strings";

export type PresetKind = PresetSpec["kind"];

/** Cap Serato stores per rule list, including one extra group level. */
export const RULE_CAP = 20;

const STRING_ATTRS = ["album", "artist", "comments", "genre", "key", "name", "type"] as const;
const UINT32_ATTRS = ["bpm", "stems_analyze_state"] as const;
const TIME_ATTRS = ["time_added"] as const;
const ALL_ATTRS = [...STRING_ATTRS, ...UINT32_ATTRS, ...TIME_ATTRS] as const;
const STRING_OPS = ["IS", "CONTAINS", "IS_NOT", "DOES_NOT_CONTAIN"] as const;
const UINT32_OPS = ["GREATER_THAN_OR_EQUAL_TO", "LESS_THAN_OR_EQUAL_TO"] as const;
const TIME_OPS = ["AFTER", "BEFORE"] as const;

type DraftLeaf = { attribute: string; operation: string; value: string };
type DraftGroup = { conjunction: "AND" | "OR"; rules: DraftLeaf[] };
type DraftItem = DraftLeaf | DraftGroup;

let ruleItems: DraftItem[] = [defaultLeaf()];

function isGroup(item: DraftItem): item is DraftGroup {
  return "conjunction" in item && "rules" in item && !("attribute" in item);
}

function defaultLeaf(): DraftLeaf {
  return { attribute: "genre", operation: "CONTAINS", value: "" };
}

function defaultGroup(): DraftGroup {
  return { conjunction: "AND", rules: [defaultLeaf()] };
}

function attrKind(attribute: string): "STRING" | "UINT32" | "TIME" {
  if ((UINT32_ATTRS as readonly string[]).includes(attribute)) return "UINT32";
  if ((TIME_ATTRS as readonly string[]).includes(attribute)) return "TIME";
  return "STRING";
}

function defaultOp(attribute: string): string {
  const kind = attrKind(attribute);
  if (kind === "UINT32") return "GREATER_THAN_OR_EQUAL_TO";
  if (kind === "TIME") return "AFTER";
  return "CONTAINS";
}

function opsFor(attribute: string): readonly string[] {
  const kind = attrKind(attribute);
  if (kind === "UINT32") return UINT32_OPS;
  if (kind === "TIME") return TIME_OPS;
  return STRING_OPS;
}

function messageKey(prefix: string, name: string): MessageKey {
  const key = `${prefix}${name}`;
  if (!hasKey(key)) throw new Error(key);
  return key;
}

function fillSelect(select: HTMLSelectElement, values: readonly string[], prefix: string, current: string): void {
  select.replaceChildren();
  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    const key = messageKey(prefix, value);
    option.dataset.i18n = key;
    option.textContent = t(key);
    select.append(option);
  }
  select.value = values.includes(current) ? current : values[0] ?? "";
}

function fillConjunction(select: HTMLSelectElement, current: string): void {
  select.replaceChildren();
  for (const value of ["AND", "OR"] as const) {
    const option = document.createElement("option");
    option.value = value;
    const key: MessageKey = value === "AND" ? "presets.conjunction.and" : "presets.conjunction.or";
    option.dataset.i18n = key;
    option.textContent = t(key);
    select.append(option);
  }
  select.value = current === "OR" ? "OR" : "AND";
}

function ymdFromInput(text: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text.trim());
  if (!match) return null;
  const packed = Number(`${match[1]}${match[2]}${match[3]}`);
  if (!Number.isInteger(packed) || packed < 19000101 || packed > 21001231) return null;
  return packed;
}

function completeLeaf(leaf: DraftLeaf): RuleLeaf | null {
  const attribute = leaf.attribute === "title" ? "name" : leaf.attribute;
  const operation = leaf.operation;
  const kind = attrKind(attribute);
  if (kind === "TIME") {
    const date = ymdFromInput(leaf.value);
    if (date == null || !(TIME_OPS as readonly string[]).includes(operation)) return null;
    return { attribute, operation, partial_date: date };
  }
  if (kind === "UINT32") {
    const number = Number(leaf.value.trim());
    if (!Number.isInteger(number) || number < 0 || !(UINT32_OPS as readonly string[]).includes(operation)) {
      return null;
    }
    return { attribute, operation, value: number };
  }
  const value = leaf.value.trim();
  if (!value || !(STRING_OPS as readonly string[]).includes(operation)) return null;
  if (!(STRING_ATTRS as readonly string[]).includes(attribute)) return null;
  return { attribute, operation, value };
}

function readLeafRow(row: Element, leaf: DraftLeaf): void {
  const attr = row.querySelector(".preset-rule-attr");
  const op = row.querySelector(".preset-rule-op");
  const value = row.querySelector(".preset-rule-value");
  if (attr instanceof HTMLSelectElement) leaf.attribute = attr.value;
  if (op instanceof HTMLSelectElement) leaf.operation = op.value;
  if (value instanceof HTMLInputElement) leaf.value = value.value;
}

function syncFromDom(): void {
  const children = [...el("preset-rule-list").children];
  children.forEach((child, index) => {
    const item = ruleItems[index];
    if (!item) return;
    if (child.classList.contains("preset-rule-group")) {
      if (!isGroup(item)) return;
      const conjunction = child.querySelector(".preset-rule-conjunction");
      if (conjunction instanceof HTMLSelectElement && (conjunction.value === "AND" || conjunction.value === "OR")) {
        item.conjunction = conjunction.value;
      }
      [...child.querySelectorAll(".preset-rule-row")].forEach((row, leafIndex) => {
        const leaf = item.rules[leafIndex];
        if (leaf) readLeafRow(row, leaf);
      });
      return;
    }
    if (isGroup(item)) return;
    readLeafRow(child, item);
  });
}

function paintLeafRow(leaf: DraftLeaf): HTMLDivElement {
  const row = document.createElement("div");
  row.className = "preset-rule-row";
  const attr = selectEl(tips.presetRuleAttr);
  attr.className = "preset-rule-attr";
  attr.setAttribute("aria-label", t("tooltip.presetRuleAttr"));
  fillSelect(attr, ALL_ATTRS, "presets.attr.", leaf.attribute);
  attr.addEventListener("change", () => {
    const next = attr.value;
    if (next === leaf.attribute) return;
    syncFromDom();
    leaf.attribute = next;
    leaf.operation = defaultOp(next);
    leaf.value = "";
    paintRuleList();
  });
  const op = selectEl(tips.presetRuleOp);
  op.className = "preset-rule-op";
  op.setAttribute("aria-label", t("tooltip.presetRuleOp"));
  fillSelect(op, opsFor(leaf.attribute), "presets.op.", leaf.operation);
  const value = inputEl(tips.presetRuleValue);
  value.className = "preset-rule-value";
  value.setAttribute("aria-label", t("tooltip.presetRuleValue"));
  value.autocomplete = "off";
  const kind = attrKind(leaf.attribute);
  if (kind === "TIME") {
    value.type = "date";
  } else if (kind === "UINT32") {
    value.type = "number";
    value.min = "0";
    value.step = "1";
    value.inputMode = "numeric";
  } else {
    value.type = "text";
    value.spellcheck = false;
  }
  value.value = leaf.value;
  const remove = buttonEl(tips.presetRemoveRule);
  remove.dataset.i18n = "presets.removeRule";
  remove.textContent = t("presets.removeRule");
  remove.addEventListener("click", () => {
    syncFromDom();
    removeItem(leaf);
  });
  row.append(attr, op, value, remove);
  return row;
}

function paintGroup(group: DraftGroup): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.className = "preset-rule-group";
  const head = document.createElement("div");
  head.className = "preset-rule-group-head";
  const conjunction = selectEl(tips.presetConjunction);
  conjunction.className = "preset-rule-conjunction";
  conjunction.setAttribute("aria-label", t("tooltip.presetConjunction"));
  fillConjunction(conjunction, group.conjunction);
  const remove = buttonEl(tips.presetRemoveGroup);
  remove.dataset.i18n = "presets.removeGroup";
  remove.textContent = t("presets.removeGroup");
  remove.addEventListener("click", () => {
    syncFromDom();
    removeItem(group);
  });
  head.append(conjunction, remove);
  wrap.append(head);
  for (const leaf of group.rules) wrap.append(paintLeafRow(leaf));
  const add = buttonEl(tips.presetAddRule);
  add.className = "preset-add-group-rule";
  add.dataset.i18n = "presets.addRule";
  add.textContent = t("presets.addRule");
  add.disabled = group.rules.length >= RULE_CAP;
  add.addEventListener("click", () => {
    syncFromDom();
    if (group.rules.length >= RULE_CAP) return;
    group.rules.push(defaultLeaf());
    paintRuleList();
  });
  wrap.append(add);
  return wrap;
}

function removeItem(target: DraftItem | DraftLeaf): void {
  const rootIndex = ruleItems.indexOf(target as DraftItem);
  if (rootIndex >= 0) {
    ruleItems.splice(rootIndex, 1);
    paintRuleList();
    return;
  }
  for (const item of ruleItems) {
    if (!isGroup(item)) continue;
    const leafIndex = item.rules.indexOf(target as DraftLeaf);
    if (leafIndex >= 0) {
      item.rules.splice(leafIndex, 1);
      paintRuleList();
      return;
    }
  }
}

function paintRuleList(): void {
  const list = el("preset-rule-list");
  list.replaceChildren();
  for (const item of ruleItems) {
    list.append(isGroup(item) ? paintGroup(item) : paintLeafRow(item));
  }
  const atCap = ruleItems.length >= RULE_CAP;
  el("preset-add-rule").disabled = atCap;
  el("preset-add-group").disabled = atCap;
  applyStatic(list);
}

/**
 * Reset the custom-rule builder to one empty genre CONTAINS leaf.
 *
 * @returns {void}
 */
export function resetRuleForm(): void {
  ruleItems = [defaultLeaf()];
  el("preset-conjunction").value = "AND";
  paintRuleList();
  syncPresetIntro(false);
}

/**
 * Append a root leaf while under the cap.
 *
 * @returns {void}
 */
export function addRule(): void {
  syncFromDom();
  if (ruleItems.length >= RULE_CAP) return;
  ruleItems.push(defaultLeaf());
  paintRuleList();
}

/**
 * Append a root group of one leaf while under the cap.
 *
 * @returns {void}
 */
export function addGroup(): void {
  syncFromDom();
  if (ruleItems.length >= RULE_CAP) return;
  ruleItems.push(defaultGroup());
  paintRuleList();
}

/**
 * Swap the dialog intro between a copy crate and a live smart crate.
 *
 * @param {boolean} native True when preview says the rules fit Serato.
 * @returns {void}
 */
export function syncPresetIntro(native: boolean): void {
  const key: MessageKey = native ? "presets.introNative" : "presets.intro";
  const intro = el("preset-intro");
  intro.dataset.i18n = key;
  intro.textContent = t(key);
}

/**
 * Name a preset crate in the page language.
 *
 * The server adds ⟳ at the end of a copy crate, so it is not part of this
 * name. A live smart crate keeps this name as typed.
 *
 * @param {PresetSpec} preset The preset.
 * @returns {string} For example "Mixes with 8A" or "BPM 124 ±3".
 */
export function presetName(preset: PresetSpec): string {
  if (preset.kind === "harmonic") return t("presets.name.harmonic", { key: preset.key });
  if (preset.kind === "bpm") {
    return t("presets.name.bpm", {
      bpm: formatNumber(preset.bpm, { maximumFractionDigits: 1 }),
      range: formatNumber(preset.range, { maximumFractionDigits: 1 }),
    });
  }
  if (preset.kind === "rules") return t("presets.name.rules");
  return t("presets.name.unplayed", { count: preset.months });
}

/**
 * Read a whole or decimal number from an input.
 *
 * @param {HTMLInputElement} input The field.
 * @returns {number | null} The number, or null when blank or not finite.
 */
function numberFrom(input: HTMLInputElement): number | null {
  const text = input.value.trim();
  if (!text) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

/**
 * The crate a preset may be limited to: the selected crate when it is a normal crate.
 *
 * Smart crates are left out because their tracks come from Serato's rules.
 *
 * @returns {Crate | null} The crate, or null for All tracks or a smart crate.
 */
export function scopeCrate(): Crate | null {
  if (state.activeCrate === "all") return null;
  const crate = state.crates.find((item) => item.id === state.activeCrate);
  return crate && !crate.smart ? crate : null;
}

function readRulesForm(crate: { crate?: number }): PresetSpec | null {
  syncFromDom();
  const conjunction = el("preset-conjunction").value;
  if (conjunction !== "AND" && conjunction !== "OR") return null;
  if (!ruleItems.length || ruleItems.length > RULE_CAP) return null;
  const rules: Array<RuleLeaf | { conjunction: "AND" | "OR"; rules: RuleLeaf[] }> = [];
  for (const item of ruleItems) {
    if (isGroup(item)) {
      if (!item.rules.length || item.rules.length > RULE_CAP) return null;
      const leaves: RuleLeaf[] = [];
      for (const leaf of item.rules) {
        const complete = completeLeaf(leaf);
        if (!complete) return null;
        leaves.push(complete);
      }
      rules.push({ conjunction: item.conjunction, rules: leaves });
      continue;
    }
    const complete = completeLeaf(item);
    if (!complete) return null;
    rules.push(complete);
  }
  return { kind: "rules", conjunction, rules, ...crate };
}

/**
 * Build the preset the dialog describes.
 *
 * Only checks what the page can check. The server checks every field again.
 *
 * @returns {PresetSpec | null} The preset, or null while a field is blank or out of range.
 */
export function readPresetForm(): PresetSpec | null {
  const kind = el("preset-kind").value as PresetKind;
  const scope = scopeCrate();
  const crate = scope && el("preset-scope").checked ? { crate: scope.id } : {};
  if (kind === "harmonic") {
    const key = el("preset-key").value.trim();
    return key ? { kind, key, ...crate } : null;
  }
  if (kind === "bpm") {
    const bpm = numberFrom(el("preset-bpm"));
    const range = numberFrom(el("preset-range")) ?? 3;
    if (bpm == null || bpm <= 0 || range < 0 || range > 50) return null;
    return { kind, bpm, range, ...crate };
  }
  if (kind === "unplayed") {
    const months = numberFrom(el("preset-months")) ?? 12;
    if (!Number.isInteger(months) || months < 1 || months > 240) return null;
    return { kind, months, ...crate };
  }
  if (kind === "rules") return readRulesForm(crate);
  return null;
}

/**
 * Show only the fields of the chosen preset kind.
 *
 * @returns {void}
 */
export function syncPresetFields(): void {
  const kind = el("preset-kind").value;
  for (const field of document.querySelectorAll<HTMLElement>("#preset-dialog [data-preset-kind]")) {
    field.hidden = field.dataset.presetKind !== kind;
  }
  if (kind === "rules") paintRuleList();
}

/**
 * Tell whether a crate was made from a preset.
 *
 * @param {number | "all"} id Crate id.
 * @returns {boolean} True when GET /api/library listed it as a preset crate.
 */
export function isPresetCrate(id: number | "all"): boolean {
  return id !== "all" && Object.hasOwn(state.presets, String(id));
}

/**
 * The footer note for a preset crate: when it was last refreshed.
 *
 * @param {number | "all"} id Crate id.
 * @returns {string} " · ⟳ updated Nov 3, 9:15 PM", or "" for other crates.
 */
export function presetFoot(id: number | "all"): string {
  if (!isPresetCrate(id)) return "";
  const updated = Number(state.presets[String(id)]?.updated);
  if (!Number.isFinite(updated) || updated <= 0) return "";
  const date = formatDate(new Date(updated * 1000), { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  return ` · ${t("presets.updated", { date })}`;
}

/**
 * Enable Preset while edits are allowed, and show Refresh on a preset crate.
 *
 * @returns {void}
 */
export function syncPresetButtons(): void {
  el("crate-preset").disabled = !state.writable;
  const preset = isPresetCrate(state.activeCrate);
  el("crate-refresh").hidden = !preset;
  el("crate-refresh").disabled = !state.writable || !preset;
}
