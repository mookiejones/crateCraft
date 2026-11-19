/**
 * AppBar tray of the running write and recent completed jobs.
 *
 * Sits in the actions slot before Help. Tooltip copy is not the
 * accessible name.
 */

import Badge from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListSubheader from "@mui/material/ListSubheader";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import { useState } from "react";
import { t } from "../lib/i18n";
import { isActive, isTerminal, toastText } from "../lib/jobs/job-view";
import { useJobs } from "../containers/JobContext";
import { tips } from "../lib/ui/tooltip-strings";
import { tooltipRef } from "./tooltip-ref";

/**
 * Header button that opens running and recent writes.
 *
 * @returns The tray IconButton and menu.
 */
export function ActivityTray() {
  const jobs = useJobs();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const running = jobs.running;
  const recent = jobs.jobs.filter((job) => isTerminal(job.state)).slice(0, 8);
  const open = Boolean(anchor);

  return (
    <>
      <IconButton
        id="jobs-tray"
        type="button"
        color="inherit"
        aria-label={t("jobs.tray")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? "jobs-tray-menu" : undefined}
        ref={tooltipRef(tips.jobsTray)}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        <Badge
          color="primary"
          variant="dot"
          invisible={!isActive(running)}
          overlap="circular"
        >
          <PendingActionsIcon />
        </Badge>
      </IconButton>
      <Menu
        id="jobs-tray-menu"
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        slotProps={{ list: { "aria-label": t("jobs.tray") } }}
      >
        <ListSubheader disableSticky>{t("jobs.running")}</ListSubheader>
        {running ? (
          <MenuItem
            onClick={() => {
              jobs.openDetails(running);
              setAnchor(null);
            }}
          >
            {running.label}
          </MenuItem>
        ) : (
          <MenuItem disabled>{t("jobs.idle")}</MenuItem>
        )}
        <ListSubheader disableSticky>{t("jobs.recent")}</ListSubheader>
        {recent.length === 0 ? (
          <MenuItem disabled>{t("jobs.idle")}</MenuItem>
        ) : (
          recent.map((job) => (
            <MenuItem
              key={job.id}
              onClick={() => {
                jobs.openDetails(job);
                setAnchor(null);
              }}
            >
              {toastText(job)}
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
}
