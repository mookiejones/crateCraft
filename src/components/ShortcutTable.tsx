/**
 * Serato shortcut catalog with remap controls.
 *
 * Live rows can Change and Reset. Unavailable rows stay muted.
 */

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useSettings } from "../containers/SettingsContext";
import { t } from "../lib/i18n";
import {
  CATALOG,
  GROUP_ORDER,
  chordLabel,
  defaultChords,
  eventChord,
  liveOwner,
  type CatalogEntry,
  type ShortcutChord,
} from "../lib/ui/shortcut-catalog";
import { GROUP_HEADING, catalogActionLabel } from "../lib/ui/shortcut-labels";
import { setTooltip } from "../lib/ui/tooltip";
import { tips, type TipSpec } from "../lib/ui/tooltip-strings";

const HOLD_KEYS = new Set(["Shift", "Control", "Alt", "Meta"]);

function tooltipRef(spec: TipSpec) {
  return (element: HTMLElement | null) => {
    if (element) setTooltip(element, spec);
  };
}

function chordsFor(row: CatalogEntry, overrides: Record<string, ShortcutChord[]>): ShortcutChord[] {
  if (!row.live) return row.seratoKeys;
  return overrides[row.id] ?? defaultChords(row);
}

function matchesFilter(row: CatalogEntry, query: string, chords: ShortcutChord[]): boolean {
  if (!query) return true;
  const hay = `${catalogActionLabel(row.id)} ${chords.map(chordLabel).join(" ")}`.toLowerCase();
  return hay.includes(query);
}

/**
 * Keyboard shortcuts catalog inside Settings.
 */
export function ShortcutTable() {
  const settings = useSettings();
  const overrides = settings.shortcuts;
  const [filter, setFilter] = useState("");
  const [capturingId, setCapturingId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const query = filter.trim().toLowerCase();
  const capturingIdRef = useRef(capturingId);
  const overridesRef = useRef(overrides);
  const saveRef = useRef(settings.saveShortcuts);
  capturingIdRef.current = capturingId;
  overridesRef.current = overrides;
  saveRef.current = settings.saveShortcuts;

  useLayoutEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      const id = capturingIdRef.current;
      if (!id) return;
      if (event.isComposing || HOLD_KEYS.has(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (event.key === "Escape") {
        capturingIdRef.current = null;
        setCapturingId(null);
        return;
      }
      if (event.repeat) return;
      const chord = eventChord(event);
      const owner = liveOwner(chord, overridesRef.current);
      capturingIdRef.current = null;
      setCapturingId(null);
      if (owner && owner !== id) {
        setStatus(t("shortcuts.conflict", { action: catalogActionLabel(owner) }));
        return;
      }
      const next = { ...overridesRef.current, [id]: [chord] };
      setStatus("");
      void saveRef.current(next);
    };
    window.addEventListener("keydown", onKey, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, []);

  const groups = useMemo(() => {
    return GROUP_ORDER.map((group) => {
      const rows = CATALOG.filter((row) => {
        if (row.group !== group) return false;
        return matchesFilter(row, query, chordsFor(row, overrides));
      });
      return { group, rows };
    }).filter((item) => item.rows.length > 0);
  }, [overrides, query]);

  return (
    <Box id="shortcuts-section" className="shortcuts-section" component="section" aria-labelledby="shortcuts-title">
      <Typography id="shortcuts-title" variant="h6" component="h3" tabIndex={-1} ref={tooltipRef(tips.shortcuts)}>
        {t("shortcuts.title")}
      </Typography>
      <Typography id="shortcuts-intro" component="p">{t("shortcuts.intro")}</Typography>
      <TextField
        id="shortcuts-filter"
        size="small"
        fullWidth
        margin="dense"
        label={t("shortcuts.filter")}
        value={filter}
        inputRef={tooltipRef(tips.shortcutsFilter)}
        onChange={(event) => setFilter(event.target.value)}
      />
      <Button
        id="shortcuts-reset-all"
        type="button"
        variant="outlined"
        size="small"
        sx={{ mt: 1 }}
        ref={tooltipRef(tips.shortcutsResetAll)}
        onClick={() => {
          setCapturingId(null);
          setStatus("");
          void settings.saveShortcuts({});
        }}
      >
        {t("shortcuts.resetAll")}
      </Button>
      <Box id="shortcuts-body">
        {groups.map(({ group, rows }) => (
          <Box key={group} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" component="h3">{t(GROUP_HEADING[group])}</Typography>
            {group === "playback" ? (
              <Typography className="dialog-note" component="p">{t("shortcuts.playNote")}</Typography>
            ) : null}
            <Table className="shortcut-table" size="small">
              <TableHead>
                <TableRow>
                  <TableCell component="th" scope="col">{t("shortcuts.action")}</TableCell>
                  <TableCell component="th" scope="col">{t("shortcuts.key")}</TableCell>
                  <TableCell component="th" scope="col" />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => {
                  const chords = chordsFor(row, overrides);
                  const overridden = row.live && Boolean(overrides[row.id]);
                  return (
                    <TableRow
                      key={row.id}
                      data-shortcut-id={row.id}
                      sx={row.live ? undefined : { opacity: 0.65 }}
                    >
                      <TableCell component="th" scope="row">{catalogActionLabel(row.id)}</TableCell>
                      <TableCell>
                        {capturingId === row.id ? t("shortcuts.capturing") : chords.map((chord, index) => (
                          <span key={`${row.id}-${index}`}>
                            {index > 0 ? " or " : null}
                            <kbd>{chordLabel(chord)}</kbd>
                          </span>
                        ))}
                        {row.live ? null : (
                          <Typography component="span" sx={{ ml: 1 }} color="text.secondary">
                            {t("shortcuts.unavailable")}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.live ? (
                          <>
                            <Button
                              data-shortcut-change=""
                              type="button"
                              size="small"
                              ref={tooltipRef(tips.shortcutsChange)}
                              onClick={() => {
                                setStatus("");
                                setCapturingId(row.id);
                              }}
                            >
                              {t("shortcuts.change")}
                            </Button>
                            {overridden ? (
                              <Button
                                data-shortcut-reset=""
                                type="button"
                                size="small"
                                ref={tooltipRef(tips.shortcutsReset)}
                                onClick={() => {
                                  const next = { ...overrides };
                                  delete next[row.id];
                                  void settings.saveShortcuts(next);
                                }}
                              >
                                {t("shortcuts.reset")}
                              </Button>
                            ) : null}
                          </>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        ))}
      </Box>
      <Typography id="shortcuts-status" className="dialog-status" component="p" role="status" aria-live="polite">
        {status}
      </Typography>
    </Box>
  );
}
