"use strict";
var SeratoWizard = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/wizard-view.ts
  var wizard_view_exports = {};
  __export(wizard_view_exports, {
    UPDATE_CHOICE_EVENT: () => UPDATE_CHOICE_EVENT,
    open: () => open
  });

  // locales/en.json
  var en_default = {
    "color.blue": "Blue",
    "color.custom": "Custom",
    "color.green": "Green",
    "color.none": "None",
    "color.orange": "Orange",
    "color.pink": "Pink",
    "color.purple": "Purple",
    "color.red": "Red",
    "color.yellow": "Yellow",
    "column.artist": "Artist",
    "column.bpm": "BPM",
    "column.deck": "Deck",
    "column.key": "Key",
    "column.played": "Played",
    "column.time": "Time",
    "column.title": "Title",
    "common.back": "Back",
    "common.cancel": "Cancel",
    "common.close": "Close",
    "common.confirm": "Confirm",
    "common.delete": "Delete",
    "common.no": "No",
    "common.off": "Off",
    "common.on": "On",
    "common.refresh": "Refresh",
    "common.reload": "Reload",
    "common.remove": "Remove",
    "common.save": "Save",
    "common.saved": "Saved.",
    "common.tryAgain": "Try again",
    "common.up": "Up",
    "common.yes": "Yes",
    "consent.accept": "Share",
    "consent.body": "Counts and actions only, plus the app name, the app version, and the operating system. Track titles, crate names, file paths, and library contents stay on this computer. Sharing stays off unless you turn it on.",
    "consent.decline": "Don't share",
    "copies.heading": "Other copies",
    "copies.useInCrates": "Use in crates",
    "count.plays": {
      one: "{count} play",
      other: "{count} plays"
    },
    "count.split": "{a} · {b}",
    "count.tracks": {
      one: "{count} track",
      other: "{count} tracks"
    },
    "crates.allTracks": "All tracks",
    "crates.collapse": "Collapse {name}",
    "crates.colorPrompt": "Crate color: {names}",
    "crates.colorSaved": "Crate color saved.",
    "crates.colorUnknown": "Use one of the palette names.",
    "crates.confirmDelete": "Delete “{name}” and the crates inside it? The tracks stay in the library.",
    "crates.created": "Crate created.",
    "crates.deleted": "Crate deleted.",
    "crates.expand": "Expand {name}",
    "crates.find": "Find a crate",
    "crates.heading": "Crates",
    "crates.new": "New",
    "crates.newPrompt": "New crate name",
    "crates.paneA": "Left crate",
    "crates.paneB": "Right crate",
    "crates.rename": "Rename",
    "crates.renamePrompt": "Rename crate",
    "crates.renamed": "Crate renamed.",
    "crates.saveView": "Save view",
    "crates.saveViewCreated": {
      one: "Saved {count} track as a crate.",
      other: "Saved {count} tracks as a crate."
    },
    "crates.saveViewEmpty": "This list has no tracks to save.",
    "crates.saveViewPrompt": "New crate name",
    "crates.selectedCrate": "Selected crate",
    "crates.smartBadge": "smart",
    "crates.smartList": "Smart crates: {names}",
    "crates.sort": "Sort crates",
    "crates.sort.added": "Added",
    "crates.sort.name": "Name",
    "crates.sort.order": "Order",
    "crates.split": "Split",
    "cratesReplace.addToCrates": "Add the replacement to {crates}.",
    "cratesReplace.alreadyInCrates": "The replacement is already in those crates. It stays where it is.",
    "cratesReplace.confirm": "Update crates",
    "cratesReplace.intro": "Put another track in every crate this one is in, at the same position. Both can stay. Smart crates are left alone.",
    "cratesReplace.keepBoth": "Leave both tracks in those crates",
    "cratesReplace.noCrates": "This track is not in any normal crate.",
    "cratesReplace.noReplacement": "Choose the track that should go in those crates.",
    "cratesReplace.nothingToDo": "Nothing to change in the crates.",
    "cratesReplace.placed": {
      one: "Added {name} to {count} crate.",
      other: "Added {name} to {count} crates."
    },
    "cratesReplace.previewFailed": "Could not read the preview.",
    "cratesReplace.quitSerato": "Quit Serato before updating crates. The preview shows the plan.",
    "cratesReplace.readingPreview": "Reading the preview…",
    "cratesReplace.removeFromCrates": "Remove the original from {crates}.",
    "cratesReplace.retire": "Then remove this track from those crates",
    "cratesReplace.retired": "Removed {name} from those crates.",
    "cratesReplace.search": "Replacement track",
    "cratesReplace.title": "Use in crates",
    "cratesReplace.updated": "Crates updated.",
    "cratesReplace.updating": "Updating…",
    "detail.bpmNumber": "BPM needs a number.",
    "detail.confirmRemove": "Remove this track from the library? The audio file stays on disk.",
    "detail.empty": "Select a track to read its attributes.",
    "detail.hideSearchCopies": "Hide search copies",
    "detail.readFailed": "Could not read track ({status})",
    "detail.reading": "Reading attributes",
    "detail.relocate": "Relocate",
    "detail.relocatePrompt": "Path to the audio file",
    "detail.relocated": "File location saved.",
    "detail.removeFromLibrary": "Remove from library",
    "detail.removePrepare": "Remove from Prepare",
    "detail.removed": "Removed from the library.",
    "detail.removedPrepare": "Removed from Prepare.",
    "detail.reveal": "Reveal in {manager}",
    "detail.saveTrack": "Save track",
    "detail.searchCopies": {
      one: "Search copies, {count} field",
      other: "Search copies, {count} fields"
    },
    "detail.sendPrepare": "Send to Prepare",
    "detail.sentPrepare": "Sent to Prepare.",
    "detail.useInCrates": "Use this copy in crates",
    "duplicates.readFailed": "Could not read duplicates.",
    "error.action_unavailable": "That action is not available.",
    "error.backup_no_space": "There is not enough disk space to back up the library.",
    "error.backup_serato_running": "Quit Serato DJ Pro before backing up drive crates. Serato DJ is still running, so nothing was copied.",
    "error.bitrate_needs_crate": "Choose a crate for a bitrate check.",
    "error.body_not_json": "The request body is not JSON.",
    "error.body_not_object": "The request body is not an object.",
    "error.choose_copy": "Choose the copy to keep.",
    "error.choose_replace_from": "Choose the track to replace.",
    "error.choose_replace_to": "Choose the track to put in those crates.",
    "error.choose_folder": "Choose a folder.",
    "error.choose_genre_or_artist": "Choose genre or artist.",
    "error.choose_spelling": "Choose a spelling.",
    "error.color_not_number": "Color needs a number.",
    "error.color_out_of_range": "Color is out of range.",
    "error.consent_not_saved": "The sharing choice could not be saved.",
    "error.crate_name_separator": "Use a crate name without the Serato name separator.",
    "error.crate_name_too_long": "That crate name is too long.",
    "error.crate_not_in_space": "That crate is not in this space.",
    "error.crate_not_root": "Tracks live in a crate, not the space root.",
    "error.field_readonly": "That field cannot be edited.",
    "error.file_already_this_track": "That file is already this track.",
    "error.file_already_used": "Another library track already uses that file.",
    "error.file_not_on_disk": "That file is not on disk.",
    "error.focus_failed": "The window could not be focused.",
    "error.folder_not_library": "That folder is not the Serato library on this computer.",
    "error.folder_outside_roots": "That folder is outside the music folders.",
    "error.folder_unreadable": "That folder could not be read.",
    "error.internal": "Something went wrong. The details are in the local log.",
    "error.invalid_request": "That request is not valid.",
    "error.language_not_saved": "The language could not be saved.",
    "error.layout_not_saved": "The layout could not be saved.",
    "error.legacy_read_only": "This library was made by an older Serato DJ. This app can show it but cannot change it yet.",
    "error.length_invalid": "Length needs a whole number of milliseconds.",
    "error.library_log_unconfirmed": "The session log does not confirm this library file ({database}). Writes and restores are off. Snapshots can still be taken and read.",
    "error.library_not_saved": "The library could not be saved.",
    "error.logs_not_opened": "The logs folder could not be opened.",
    "error.move_failed": "The file could not be moved. Nothing was changed.",
    "error.no_legacy_library": "No older Serato library was found.",
    "error.no_library": "No Serato library was found on this computer.",
    "error.not_duplicate": "That track is not in a duplicate group.",
    "error.note_too_long": "The note is too long.",
    "error.nothing_to_undo": "There is no outside change to undo.",
    "error.path_unreadable": "That path could not be read.",
    "error.playlist_empty": "The playlist is empty.",
    "error.preset_bad_band": "Choose a BPM band whose low end is below its high end, up to 400.",
    "error.preset_bad_bpm": "Choose a BPM above zero and a range of 0 to 50.",
    "error.preset_bad_genre": "Choose a genre.",
    "error.preset_bad_key": "Choose a musical key for the harmonic preset.",
    "error.preset_bad_months": "Choose between 1 and 240 months.",
    "error.preset_crate_gone": "That preset crate is no longer in the library.",
    "error.preset_not_a_preset_crate": "That crate was not made from a preset.",
    "error.preset_unknown": "That crate preset is not available.",
    "error.rating_invalid": "Rating needs a whole number from 1 to 5.",
    "error.recycle_failed": "The file could not be moved to the Recycle Bin.",
    "error.registration_no_space": "Crates were not registered. This library has no Serato Library space, so Serato may remove those crate files the next time it opens.",
    "error.related_direction": "Choose a one-way or two-way link.",
    "error.related_missing": "That link is not in the related tracks.",
    "error.related_not_saved": "The related-tracks file could not be saved.",
    "error.related_self": "A track cannot be related to itself.",
    "error.related_unreadable": "The related-tracks file could not be read.",
    "error.relink_duplicate_files": "Two of those files are the same.",
    "error.relink_duplicate_tracks": "Two of those tracks are the same.",
    "error.relink_needs_tracks": "Choose tracks to relink.",
    "error.relink_not_audio": "That file is not an audio file.",
    "error.relink_still_on_disk": "That track is still on disk.",
    "error.replace_needs_confirm": "Confirm the crate update before it runs.",
    "error.replace_same_track": "Those two tracks are the same.",
    "error.requestFailed": "Request failed",
    "error.requestStatus": "Request failed ({status})",
    "error.root_color": "The space root has no color.",
    "error.root_delete": "The space root cannot be deleted.",
    "error.root_rename": "The space root cannot be renamed.",
    "error.scan_depth": "Choose a quick or full check.",
    "error.scan_full_needs_crate": "Choose a crate for a full decode check.",
    "error.serato_version_unknown": "Serato version is unknown (build {build}). Writes and restores are off until the installed Serato version can be read. A value that is not a dotted number, including an unreadable plist, is unknown. Snapshots can still be taken and read.",
    "error.setup_needs_consent": "Choose whether to share stats before finishing setup.",
    "error.setup_not_saved": "Setup could not be saved.",
    "error.shortcut_skipped": "Shortcuts are left alone.",
    "error.smart_crate_tracks": "Smart crates choose their tracks from rules.",
    "error.smart_rules_json": "Smart crate rules need to be JSON.",
    "error.smart_rules_list": "Smart crate rules need a rules list.",
    "error.snapshot_id_invalid": "That snapshot id is not valid.",
    "error.snapshot_incomplete": "That snapshot is incomplete.",
    "error.snapshot_unreadable": "That snapshot could not be read.",
    "error.space_unavailable": "That space is not available here.",
    "error.spelling_not_in_group": "That spelling is not in a group.",
    "error.theme_not_saved": "The theme could not be saved.",
    "error.track_id_required": "Track id is required.",
    "error.track_not_in_library": "That track is not in the library.",
    "error.track_not_in_space": "Track is not in this space.",
    "error.track_not_in_space_alt": "That track is not in this space.",
    "error.too_many_files": "Choose fewer files at once.",
    "error.track_path_required": "A track path is required.",
    "error.trash_failed": "The file could not be moved to the Trash.",
    "error.tree_bad_bands": "Choose BPM bands between 1 and 400, 1 to 50 wide, starting no further apart than their width, and at most 60 bands.",
    "error.tree_bad_genres": "Choose at least 1 track per genre and up to 100 genres.",
    "error.tree_empty": "No tracks fit that crate tree.",
    "error.tree_unknown": "That crate tree is not available.",
    "error.undo_needs_confirm": "Confirm undo before it is saved.",
    "error.upload_too_large": "That upload is too large.",
    "error.write_preimage_mismatch": "The pre-write snapshot does not match its hash.",
    "error.write_rollback_failed": "The write did not match, and putting the library back failed.",
    "error.write_undo_failed": "The write failed, and putting the library back failed.",
    "export.m3u": "Export",
    "field.album": "Album",
    "field.beatgridLocked": "Beatgrid locked",
    "field.color": "Color",
    "field.comments": "Comments",
    "field.composer": "Composer",
    "field.emoji": "Emoji",
    "field.genre": "Genre",
    "field.grouping": "Grouping",
    "field.label": "Label",
    "field.rating": "Rating",
    "field.remixer": "Remixer",
    "field.year": "Year",
    "files.andMore": "And {count} more.",
    "files.browseElsewhere": "Browse elsewhere…",
    "files.changeCrates": "Crates: {crates}.",
    "files.checking": "Checking what will change.",
    "files.chooseDelete": "Choose files to delete.",
    "files.chooseDestination": "Choose the destination folder. Then confirm the move.",
    "files.chooseMove": "Choose files to move.",
    "files.chooseOneRename": "Choose one file to rename.",
    "files.chooseRenameFromTags": "Choose files to rename from tags.",
    "files.chooseOneReplace": "Choose one file to replace.",
    "files.contents": "Folder contents",
    "files.driveMissing": "Drive not connected",
    "files.driveMissingLabel": "{name}, Drive not connected",
    "files.empty": "This folder is empty.",
    "files.fileCount": {
      one: "{count} file",
      other: "{count} files"
    },
    "files.inLibrary": "In library",
    "files.moveFolder": "Move this folder",
    "files.moveHere": "Move here",
    "files.moveToFolder": "Move to folder",
    "files.moveToTrash": "Move to Trash",
    "files.newFile": "New file",
    "files.newName": "New name",
    "files.noMatches": "No files match “{query}”.",
    "files.noRoots": "No music folders yet",
    "files.noRootsBody": "Setup finds the folders Serato uses for your music.",
    "files.notSaved": "That change was not saved.",
    "files.nothingUntilConfirm": "Nothing is changed until you confirm.",
    "files.open": "Open {name}",
    "files.path": "Folder path",
    "files.readingFolder": "Reading this folder",
    "files.readingFolderNote": "Reading this folder.",
    "files.readingRoots": "Reading music folders",
    "files.readingRootsNote": "Reading music folders.",
    "files.renameFromTags": "Rename from tags",
    "files.replaceFile": "Upgrade file (keep cues)",
    "files.review": "Review",
    "files.reviewTitle": "Review this change",
    "files.rootCount": {
      one: "{count} music folder",
      other: "{count} music folders"
    },
    "files.roots": "Music folders",
    "files.rootsUnreadable": "Music folders could not be read.",
    "files.runSetup": "Run setup",
    "files.saving": "Saving.",
    "files.searchLabel": "Search files",
    "files.searchPlaceholder": "Search files",
    "files.searchResults": "Search results",
    "files.searchTruncated": "Some matching files are not listed. Type more of the name.",
    "files.searching": "Searching files…",
    "files.shortcut": "{name} (shortcut)",
    "files.trash": "Trash",
    "files.truncated": "Some files are not listed.",
    "files.updated": "The files were updated.",
    "folderSync.button": "Sync folder",
    "folderSync.counting": "Counting tracks…",
    "folderSync.done": "{name} updated: {added} added, {removed} removed.",
    "folderSync.folder": "Folder",
    "folderSync.full": "Remove tracks whose files are not in this folder",
    "folderSync.intro": "Add library tracks whose files sit in this folder. Files that are not in the library stay skipped. Nothing is imported.",
    "folderSync.subcrates": "Make a subcrate for each subfolder",
    "folderSync.summary": "{added} to add, {removed} to remove. {skipped} files not in the library.",
    "folderSync.summaryNone": "Already in sync. {skipped} files not in the library.",
    "folderSync.sync": "Sync crate",
    "folderSync.title": "Sync crate with a folder",
    "folderSync.unchanged": "{name} already matches that folder.",
    "format.bytes": {
      one: "{count} byte",
      other: "{count} bytes"
    },
    "format.hoursMinutes": "{hours}h {minutes}m",
    "format.minutes": "{minutes}m",
    "generation.checking": "Checking",
    "generation.label": "Library generation",
    "generation.legacy": "Older Serato",
    "generation.named": "Library generation, {kind}",
    "generation.reason.downgrade": "The newest session log says Serato {newest}, and an earlier log says Serato {version}.",
    "generation.reason.fallback": "No session log was found. The installed Serato version is {version}.",
    "generation.reason.installUnknown": "The installed Serato version could not be read, so writes stay off. A session log cannot turn them on.",
    "generation.reason.installed": "The installed Serato is {version}. The newest session log says Serato {newest}.",
    "generation.reason.log": "The newest session log {log} recorded Serato {version} opening {database}.",
    "generation.reason.mismatch": "The session log opened {database}, which is not this library file.",
    "generation.reason.pending": "The library generation has not been read yet.",
    "generation.reason.unknown": "A session log was found, but it did not name Serato 4 or Serato 5. Writes and restores stay off.",
    "generation.reason.unmounted": "The session log {log} named {database} on a drive that is not connected.",
    "generation.reason.version": "The newest session log {log} names Serato {version} and does not name a database file.",
    "generation.serato4": "Serato 4",
    "generation.serato5": "Serato 5",
    "generation.unknown": "Version unknown",
    "gig.checkAgain": "Check again",
    "gig.checking": "Checking the library…",
    "gig.cratesAdded": "Crates added",
    "gig.cratesEdited": "Crates edited",
    "gig.cratesRemoved": "Crates removed",
    "gig.cuesEdited": "Cues edited",
    "gig.done": "Done",
    "gig.doneNotReady": "Not ready for the gig: {score}/100, checked {crate} at {time}",
    "gig.doneReady": "Ready for the gig: {score}/100, checked {crate} at {time}",
    "gig.driveUnavailable": {
      one: "{name}: {count} track unavailable",
      other: "{name}: {count} tracks unavailable"
    },
    "gig.drives": "Drives",
    "gig.drivesAction": "Check drives",
    "gig.drivesEmpty": "No drives are unplugged.",
    "gig.emptyCrates": "Empty crates",
    "gig.emptyCratesAction": "Fill empty crates",
    "gig.emptyCratesEmpty": "No empty crates.",
    "gig.exit": "Exit gig check",
    "gig.gridsEdited": "Beatgrids edited",
    "gig.groupCount": "{label} ({count})",
    "gig.heading": "Gig check",
    "gig.holding": "Holding it back",
    "gig.missing": "Missing files",
    "gig.missingAction": "Locate missing files",
    "gig.missingEmpty": "No files are missing.",
    "gig.noSnapshot": "No snapshot to compare.",
    "gig.score": "{score}/100",
    "gig.scoreLabel": "Ready score {score} out of 100, {verdict}",
    "gig.showAll": "Show all {count}",
    "gig.since": "Since last gig",
    "gig.sinceAction": "Review changes",
    "gig.sinceEmpty": "Nothing changed since the last snapshot.",
    "gig.stepOf": "Step {index} of {total}",
    "gig.streaming": "Streaming",
    "gig.streamingAction": "Review streaming tracks",
    "gig.streamingEmpty": "No streaming tracks.",
    "gig.tagsEdited": "Tags edited",
    "gig.tracksAdded": "Tracks added",
    "gig.tracksRemoved": "Tracks removed",
    "gig.unreachable": "Couldn't reach the library server. Check it's running, then press Check again",
    "gig.unreadable": "The gig check could not be read.",
    "gig.verdictNotReady": "✕ Not ready",
    "gig.verdictReady": "✓ Ready",
    "gig.wholeSpace": "Whole space",
    "gig.wholeSpaceInline": "the whole space",
    "gig.wordNotReady": "not ready",
    "gig.wordReady": "ready",
    "help.bug": "Report a bug",
    "help.bugTitle": "Report a bug",
    "help.change": "What should change",
    "help.copied": "Copied. Paste it into the GitHub issue.",
    "help.copyFailed": "Couldn't copy the report.",
    "help.copyLog": "Copy log",
    "help.diagnostics": "What will be included",
    "help.expected": "What you expected",
    "help.feature": "Request a feature",
    "help.featureTitle": "Request a feature",
    "help.github": "View on GitHub",
    "help.happened": "What happened",
    "help.loadFailed": "Couldn't load the diagnostics.",
    "help.loading": "Loading diagnostics…",
    "help.logCopied": "Log copied.",
    "help.logEmpty": "The log is empty.",
    "help.names": "Include track and crate names from the log",
    "help.nothing": "Nothing is sent until you submit it on GitHub.",
    "help.openGitHub": "Open on GitHub",
    "help.opened": "Opened in your browser. Review it, then submit it on GitHub.",
    "help.opening": "Opening…",
    "help.releases": "Release notes",
    "help.reportText": "Report text",
    "help.review": "You will see this on GitHub before it is submitted. The app does not post it.",
    "help.title": "Help",
    "help.tooLong": "The report is too long for a link. It was copied. Paste it into the GitHub issue.",
    "history.chooseSession": "Choose a session.",
    "history.file": "File",
    "history.notes": "Notes",
    "history.openInLibrary": "Open in library",
    "history.readFailed": "Could not read history.",
    "history.session": "Session",
    "history.sessionFailed": "Could not read that session.",
    "history.sessions": "History sessions",
    "history.started": "Started",
    "import.added": {
      one: "{count} track added.",
      other: "{count} tracks added."
    },
    "import.button": "Import",
    "import.defaultName": "Imported playlist",
    "import.unmatched": {
      one: "{count} line did not match a library track.",
      other: "{count} lines did not match a library track."
    },
    "layout.resize": "Resize the track list",
    "layout.resizeHint": "Drag to resize. Double-click to reset.",
    "layout.widthNotSaved": "Couldn't save the pane width. It goes back to the last saved width next time.",
    "library.loading": "Loading the library",
    "library.readFailed": "Could not read the library ({status})",
    "library.unavailable": "Library unavailable",
    "list.label": "Tracks",
    "list.noMatches": "No tracks match.",
    "list.readingDuplicates": "Reading duplicates",
    "logs.copied": "Copied the logs.",
    "logs.copiedTruncated": "Copied the latest log entries. Older entries were left out.",
    "logs.copyFailed": "Couldn't copy the logs.",
    "logs.copyManual": "Couldn't copy automatically. Select the log text and copy it.",
    "logs.copying": "Copying…",
    "logs.empty": "No log entries yet.",
    "logs.openFailed": "Couldn't open the logs folder.",
    "logs.opened": "Opened the logs folder.",
    "markers.beats": {
      one: "{count} beat",
      other: "{count} beats"
    },
    "markers.bpm": "{bpm} BPM",
    "markers.cue": "Cue point {number}",
    "markers.cueEmpty": "Empty",
    "markers.flip": "Flip {number}",
    "markers.heading": "Cue points, saved loops, and beatgrid",
    "markers.loop": "Saved loop {number}",
    "markers.loopLocked": "Saved loop {number} locked",
    "markers.none": "No Serato cue points in this file.",
    "markers.readOnly": "Read from the audio file. These are not written back.",
    "markers.unavailable": "The file is not on disk, so cues cannot be read.",
    "menu.close": "Close",
    "menu.exportRekordbox": "Export to Rekordbox",
    "menu.file": "File",
    "menu.focusSearch": "Focus search",
    "menu.help": "Help",
    "menu.library": "Library",
    "menu.minimize": "Minimize",
    "menu.resetWidth": "Reset list width",
    "menu.tools": "Tools",
    "menu.window": "Window",
    "merge.addToCrates": "Add the kept copy to {crates}.",
    "merge.addToSpace": "Add the kept copy to the {space} space.",
    "merge.alreadyInCrates": "The kept copy is already in every crate the others use. It stays where it is.",
    "merge.confirmTrash": "Merge and move files to Trash",
    "merge.copiedCues": "{file} had the better {what}. They were copied onto the file you keep.",
    "merge.copyCues": "{file} has the better {what}. They will be copied onto the file you keep.",
    "merge.copyCuesWhatBoth": "cues and beatgrid",
    "merge.copyCuesWhatGrid": "beatgrid",
    "merge.copyCuesWhatMarkers": "cues",
    "merge.fieldChange": "{label} changes from {before} to {after}.",
    "merge.filesStay": "Audio files stay on disk.",
    "merge.intro": "Keep one copy. The others leave the library. Audio files stay on disk unless you move them to the Trash.",
    "merge.keep": "Copy to keep",
    "merge.keptCopy": "the kept copy",
    "merge.merged": {
      one: "Merged {count} copy into {name}.",
      other: "Merged {count} copies into {name}."
    },
    "merge.merging": "Merging…",
    "merge.noCrates": "None of the copies are in a crate.",
    "merge.noFields": "No empty fields or higher play count to copy.",
    "merge.noHistory": "No history entries point at the other copies.",
    "merge.noHistoryId": "This library has no history track id to repoint.",
    "merge.plays": {
      one: "{count} play",
      other: "{count} plays"
    },
    "merge.previewFailed": "The preview could not be read.",
    "merge.quitSerato": "Quit Serato before merging. The preview shows the plan.",
    "merge.readingPreview": "Reading the preview…",
    "merge.removeCopies": {
      one: "Remove {count} copy from the library.",
      other: "Remove {count} copies from the library."
    },
    "merge.repointHistory": {
      one: "Point {count} history entry at the kept copy.",
      other: "Point {count} history entries at the kept copy."
    },
    "merge.title": "Merge copies",
    "merge.trashFiles": "Move {files} to the Trash.",
    "merge.trashLabel": "Move the other audio files to the Trash",
    "merge.trashNote": "Off by default. Files go to the Trash, where you can restore them. They are not permanently deleted.",
    "mode.duplicates": "Same title, artist, and length. Select a copy, then merge the others into it.",
    "mode.files": "Files on disk. Cue points stay in the audio file. Crates follow the path.",
    "mode.gig": "Read-only. This check does not change the library.",
    "mode.missing": "Tracks whose files are missing on a connected drive.",
    "mode.missingOffline": {
      one: "Tracks whose files are missing on a connected drive. {count} track on an unplugged drive is marked offline in crates.",
      other: "Tracks whose files are missing on a connected drive. {count} tracks on unplugged drives are marked offline in crates."
    },
    "mode.scan": "Read-only. This check does not change the library.",
    "mode.snapshots": "Hash-checked copies of the library, crates, and Serato frames inside audio files. Audio itself is not copied.",
    "mode.stems": "Tracks with a stems analysis state.",
    "mode.tags": "Writes the library, not the audio files. Quit Serato first.",
    "operations.action.crateAdd": "Add to crate",
    "operations.action.crateColor": "Crate color",
    "operations.action.crateCreate": "Create crate",
    "operations.action.crateDelete": "Delete crate",
    "operations.action.crateExpanded": "Crate expanded",
    "operations.action.cratePrepare": "Prepare",
    "operations.action.crateRemove": "Remove from crate",
    "operations.action.crateRemoveLibrary": "Remove from library",
    "operations.action.crateRename": "Rename crate",
    "operations.action.crateRules": "Crate rules",
    "operations.action.delete": "Delete file",
    "operations.action.importM3u": "Import playlist",
    "operations.action.mergeDuplicates": "Merge copies",
    "operations.action.move": "Move file",
    "operations.action.moveFolder": "Move folder",
    "operations.action.rename": "Rename file",
    "operations.action.renameFromTags": "Rename from tags",
    "operations.action.relink": "Relink files",
    "operations.action.replace": "Upgrade file (keep cues)",
    "operations.action.replaceInCrates": "Replace in crates",
    "operations.action.restore": "Restore",
    "operations.action.restoreRecover": "Recover restore",
    "operations.action.saveTrack": "Save track",
    "operations.actionOther": "Library edit",
    "operations.beforeOnly": "Before {before}.",
    "operations.empty": "No checked edits yet. Each library edit and each restore is listed here after it is checked.",
    "operations.entry": "{time}. {action}. {target}. {outcome}.",
    "operations.heading": "Operation log",
    "operations.noTarget": "the library",
    "operations.outcome.refused": "Not saved",
    "operations.outcome.rollbackFailed": "Could not put back",
    "operations.outcome.rolledBack": "Put back",
    "operations.outcome.verified": "Checked",
    "operations.reading": "Reading the operation log",
    "operations.rollbackFailed": "A change could not be put back. The library may not match the last good copy. This was not saved as a success.",
    "operations.snapshots": "Before {before}. After {after}.",
    "operations.unreadable": "The operation log could not be read.",
    "plan.andMore": ", and {count} more",
    "plan.cratesAdded": "Crates added",
    "plan.cratesChanged": "Crates changed",
    "plan.cratesRegistered": "Crates registered so Serato keeps them",
    "plan.cratesRemoved": "Crates removed",
    "plan.cratesSkipped": "Crates skipped",
    "plan.cratesUnavailable": "Crates on an unavailable drive",
    "plan.cueChanges": "Cue changes",
    "plan.cueDiff": "{before} → {after}",
    "plan.deletedCrates": "Deleted crates",
    "plan.deletedCues": "Deleted cues",
    "plan.deletedGrids": "Deleted grids",
    "plan.deletedTracks": "Deleted tracks",
    "plan.files": {
      one: "{label}: {count} file",
      other: "{label}: {count} files"
    },
    "plan.gridChanges": "Grid changes",
    "plan.item": "item",
    "plan.listed": "{label}: {count}. {names}",
    "plan.none": "{label}: none",
    "plan.nothingChanged": "Nothing has been changed.",
    "plan.tracksAdded": "Tracks added",
    "plan.tracksRemoved": "Tracks removed",
    "plan.tracksUnavailable": "Tracks on an unavailable drive",
    "player.cannotPlay": "This file cannot be played in this window.",
    "player.cue": "Cue",
    "player.duration": "Duration",
    "player.elapsed": "Elapsed",
    "player.next": "Next",
    "player.notInLibrary": "Not in the library or file missing",
    "player.nothingPlaying": "Nothing playing",
    "player.overview": "Track overview",
    "player.overviewSeek": "Click or drag to seek",
    "player.pause": "Pause",
    "player.play": "Play",
    "player.previous": "Previous",
    "player.region": "Player",
    "player.seek": "Seek",
    "player.volume": "Volume",
    "player.waveformReading": "Reading the waveform…",
    "player.waveformUnavailable": "Waveform unavailable for this format",
    "player.zoomIn": "Zoom in",
    "player.zoomOut": "Zoom out",
    "portable.check": "Check drive",
    "portable.checkLabel": "Check {name}",
    "portable.checking": "Checking this drive.",
    "portable.kindFileSize": "File too large",
    "portable.kindMissing": "Missing",
    "portable.kindOffDrive": "Not on this drive",
    "portable.kindPathLength": "Path too long",
    "portable.kindSmartCrate": "Smart Crate",
    "portable.kindUnsafeName": "Unsafe name",
    "portable.missing": "This drive is not connected. Nothing was deleted.",
    "portable.notReady": "Not ready. Fix these on the laptop first.",
    "portable.readOnly": "This only reads the drive. Nothing is copied or deleted.",
    "portable.ready": "Ready to leave the laptop.",
    "portable.title": "Portable drive",
    "portable.unreachable": "This drive could not be checked.",
    "portable.unreadable": "This drive could not be read.",
    "presets.bpm": "BPM",
    "presets.button": "Preset",
    "presets.counting": "Counting tracks…",
    "presets.create": "Create crate",
    "presets.created": {
      one: "{name} saved with {count} track.",
      other: "{name} saved with {count} tracks."
    },
    "presets.intro": "The app picks the tracks and saves a normal crate whose name ends in ⟳. Serato plays it like any crate. It refreshes when this app opens while Serato is closed, or when you press Refresh.",
    "presets.key": "Key",
    "presets.keyHelp": "Camelot, like 8A, or a key name, like Am.",
    "presets.kind": "Preset",
    "presets.kind.bpm": "BPM range",
    "presets.kind.harmonic": "Mixes with a key",
    "presets.kind.unplayed": "Not played lately",
    "presets.matches": {
      one: "{count} track matches.",
      other: "{count} tracks match."
    },
    "presets.months": "Months",
    "presets.name": "Crate name",
    "presets.name.bpm": "BPM {bpm} ±{range}",
    "presets.name.harmonic": "Mixes with {key}",
    "presets.name.unplayed": {
      one: "Not played in {count} month",
      other: "Not played in {count} months"
    },
    "presets.range": "Plus or minus",
    "presets.refresh": "Refresh",
    "presets.refreshed": "{name} refreshed: {added} added, {removed} removed.",
    "presets.refreshedOnOpen": {
      one: "{count} preset crate refreshed.",
      other: "{count} preset crates refreshed."
    },
    "presets.scope": "Only tracks in {name} and its subcrates",
    "presets.title": "New crate from a preset",
    "presets.updated": "⟳ updated {date}",
    "quickOpen.empty": "Type a track or file name.",
    "quickOpen.file": "File",
    "quickOpen.fileError": "Files on disk could not be searched. Track matches are still listed.",
    "quickOpen.label": "Name",
    "quickOpen.matchCount": {
      one: "{count} match",
      other: "{count} matches"
    },
    "quickOpen.matches": "Matches",
    "quickOpen.none": "No tracks or files match “{query}”.",
    "quickOpen.placeholder": "Track or file name",
    "quickOpen.searching": "Searching files…",
    "quickOpen.title": "Find a track or file",
    "quickOpen.track": "Track",
    "quickOpen.truncated": "Some files were not searched. Type more of the name.",
    "rail.heading": "Library",
    "rating.none": "Not rated",
    "rating.stars": {
      one: "{count} star",
      other: "{count} stars"
    },
    "rekordbox.dialogTitle": "Download rekordbox.xml?",
    "rekordbox.download": "Download",
    "rekordbox.downloadTitle": "Download rekordbox.xml",
    "rekordbox.failed": "The Rekordbox export failed.",
    "rekordbox.hotLoops": "Hot loops",
    "rekordbox.hotLoopsHelp": "Uses a free hot-cue pad",
    "rekordbox.intro": "These items are not copied into Rekordbox. The file downloads after you confirm.",
    "rekordbox.keyAsis": "Key as stored",
    "rekordbox.keyCamelot": "Camelot key",
    "rekordbox.keyClassical": "Classical key",
    "rekordbox.keyNotation": "Rekordbox key notation",
    "rekordbox.memoryCues": "Memory cues",
    "rekordbox.notXml": "The export did not produce an XML file.",
    "rekordbox.reportLabel": "What is not copied",
    "related.confirmRemove": "Remove the link to “{name}”?",
    "related.crateNote": "Creates or refreshes the crate “{name}”. Serato must be quit.",
    "related.crateUpdated": "Crate “{name}” updated.",
    "related.find": "Find a track to link",
    "related.findPlaceholder": "Title or artist",
    "related.heading": "Mixes well with",
    "related.linkRating": "Link rating",
    "related.loadFailed": "Mixes well with could not be loaded.",
    "related.loading": "Loading mixes well with",
    "related.noPath": "This track has no file path, so it cannot be linked.",
    "related.noSuggestions": "No suggestions from key, tempo, or shared crates.",
    "related.noneSaved": "No saved links yet. Search for a track, or save a suggestion.",
    "related.notInLibrary": "Not in this library",
    "related.note": "Note",
    "related.notePlaceholder": "blend out of",
    "related.oneWay": "One-way",
    "related.quitSerato": "Quit Serato before writing the crate.",
    "related.ratingOutOf": "{rating}/5",
    "related.removeLink": "Remove link to {name}",
    "related.removed": "Link removed.",
    "related.saveLink": "Save link",
    "related.saveLinkTo": "Save link to {name}",
    "related.saved": "Link saved.",
    "related.savedCount": "{count} saved",
    "related.suggested": "Suggested from key, tempo within 6%, and shared crates. Save stores a two-way link.",
    "related.thisTrack": "this track",
    "related.twoWay": "Two-way",
    "related.twoWayLink": "Two-way link",
    "related.typeHint": "Type a title or artist.",
    "related.updateCrate": "Update Serato crate",
    "relink.acceptHigh": "Accept all high",
    "relink.choose": "Choose tracks to relink.",
    "relink.confidence": "Confidence",
    "relink.confidence.high": "High",
    "relink.confidence.low": "Low",
    "relink.confidence.medium": "Medium",
    "relink.confirm": "Relink",
    "relink.done": {
      one: "Pointed {count} missing track at its file.",
      other: "Pointed {count} missing tracks at their files."
    },
    "relink.empty": "No missing tracks in this space, or none of them matched.",
    "relink.find": "Find matches",
    "relink.finding": "Searching…",
    "relink.include": "Relink this track",
    "relink.intro": "Point missing tracks at files that moved. Audio stays where it is. Crates, history, and related links stay attached.",
    "relink.match": "Match",
    "relink.none": "No matches yet. Search the music folders, or add an extra folder after a drive swap.",
    "relink.pick": "Choose a file",
    "relink.previewing": "Checking what will change.",
    "relink.quitSerato": "Quit Serato before relinking.",
    "relink.reason.folder": "Folder moved",
    "relink.reason.name": "Same name",
    "relink.reason.nameAndSize": "Same name and size",
    "relink.reason.size": "Same size",
    "relink.reason.unknown": "{reason}",
    "relink.relinking": "Relinking…",
    "relink.remap": "Folder moved: {from} → {to} ({count} tracks)",
    "relink.root": "Extra folder to search",
    "relink.rootHelp": "Optional. Paste a folder after a drive swap, for example /Volumes/NEW/DJ.",
    "relink.scanned": "Searched {count} files.",
    "relink.selected": {
      one: "{count} selected",
      other: "{count} selected"
    },
    "relink.title": "Relink missing files",
    "relink.track": "Track",
    "relink.truncated": "The search stopped after 200,000 files. Add a closer extra folder.",
    "relink.unavailable": {
      one: "{count} track sits on a drive that is not plugged in. It is not matched.",
      other: "{count} tracks sit on a drive that is not plugged in. They are not matched."
    },
    "relink.why": "Why",
    "rules.and": "and",
    "rules.label": "Smart crate rules",
    "rules.matches": "Matches",
    "rules.none": "no rules yet",
    "rules.or": "or",
    "rules.save": "Save rules",
    "rules.saved": "Rules saved.",
    "scan.checkFull": "Full decode",
    "scan.checkQuick": "Quick check",
    "scan.checking": "Checking files…",
    "scan.decodeErrorDetail": "Decode stopped at {detail}s",
    "scan.empty": "No damaged files in this check.",
    "scan.heading": "Damaged files",
    "scan.intro": "Quick check reads the start of each file. Full decode needs a crate because it can take minutes.",
    "scan.notFound": {
      one: "{count} missing track was skipped. See Missing files.",
      other: "{count} missing tracks were skipped. See Missing files."
    },
    "scan.problem.decode_error": "Decode error",
    "scan.problem.empty": "Empty file",
    "scan.problem.serato_flagged": "Serato marked this file corrupt",
    "scan.problem.short": "Shorter than stored length",
    "scan.problem.undecodable": "Could not decode",
    "scan.problem.unknown": "Damaged file",
    "scan.problem.unreadable": "Could not read the file",
    "scan.problem.wrong_format": "Wrong format",
    "scan.row": "{title} ({file}) — {problem}",
    "scan.shortDetail": "Shorter than stored length ({detail}s)",
    "scan.summary": {
      one: "{checked} files checked. {count} damaged file.",
      other: "{checked} files checked. {count} damaged files."
    },
    "scan.summaryClear": "{checked} files checked. None damaged.",
    "scan.unchecked": {
      one: "{count} file has an extension this check does not know.",
      other: "{count} files have an extension this check does not know."
    },
    "scan.unreachable": "Couldn't reach the library server. Check it's running, then press Quick check",
    "scan.unreadable": "The file check could not be read.",
    "scan.wrongFormatDetail": "Looks like {detail}",
    "search.tracks": "Search tracks",
    "settings.about": "About",
    "settings.colorway": "Theme",
    "settings.colorway.classic": "Classic",
    "settings.colorway.darkClub": "Dark Club",
    "settings.colorway.light": "Light",
    "settings.colorway.seratoLike": "Serato-like",
    "settings.colorwayPreview": "Theme icon preview",
    "settings.copyLogs": "Copy logs",
    "settings.copyVersion": "Copy version",
    "settings.iconAppliedDock": "The Dock icon matches this theme.",
    "settings.iconAppliedWindow": "The window and taskbar icon match this theme.",
    "settings.iconDefault": "The app icon stays the usual one.",
    "settings.iconFollowsTheme": "App icon follows the theme",
    "settings.iconNotSaved": "Couldn't save the theme. It is used until you close the app.",
    "settings.iconSaved": "Theme saved.",
    "settings.iconUnsupported": "This computer can't change the running app icon. The choice is saved and applies on Mac and Windows.",
    "settings.language": "Language",
    "settings.languageNotSaved": "Couldn't save the language. It is used until you close the app.",
    "settings.languageSystem": "Same as the system",
    "settings.logText": "Log text",
    "settings.openLogs": "Open logs folder",
    "settings.rerunSetup": "Run setup again",
    "settings.share": "Share anonymous usage stats and crash reports",
    "settings.title": "Settings",
    "settings.updates": "Check GitHub for a newer version once a day",
    "settings.updatesFailed": "The update choice could not be saved.",
    "settings.updatesPrereleases": "Include test versions (beta and release candidates)",
    "sharing.canSend": "Anonymous counts and crash reports can be sent.",
    "sharing.loadFailed": "Couldn't load sharing settings.",
    "sharing.loadFailedOff": "Couldn't load sharing settings. Nothing is sent.",
    "sharing.noKeys": "This copy has no telemetry keys, so nothing is sent either way.",
    "sharing.nothingSent": "Nothing is sent.",
    "sharing.off": "Sharing is off. Nothing is sent.",
    "sharing.on": "Sharing is on. Anonymous counts and crash reports can be sent.",
    "shortcuts.action": "Action",
    "shortcuts.cheatSheet": "Show shortcuts",
    "shortcuts.dismiss": "Close or clear search",
    "shortcuts.focusSearch": "Focus search",
    "shortcuts.groupFind": "Find",
    "shortcuts.groupLists": "Lists",
    "shortcuts.groupPlay": "Play",
    "shortcuts.groupViews": "Views",
    "shortcuts.intro": "These keys work anywhere on this screen, except while you are typing in a field. Esc still closes a dialog or clears a search.",
    "shortcuts.key": "Key",
    "shortcuts.listNext": "Next row",
    "shortcuts.listOpen": "Open the row",
    "shortcuts.listPrevious": "Previous row",
    "shortcuts.open": "Shortcuts",
    "shortcuts.playNote": "Space plays or pauses. Left moves 5 seconds back. Right moves 5 seconds forward.",
    "shortcuts.playPause": "Play or pause",
    "shortcuts.quickOpen": "Find a track or file",
    "shortcuts.seekBack": "Back 5 seconds",
    "shortcuts.seekForward": "Forward 5 seconds",
    "shortcuts.title": "Keyboard shortcuts",
    "shortcuts.viewCrates": "Crates",
    "shortcuts.viewFiles": "Organize files",
    "shortcuts.viewHistory": "History",
    "shortcuts.viewLibrary": "Library",
    "shortcuts.viewSnapshots": "Backups",
    "snapshots.backupDrives": "Back up drive crates",
    "snapshots.backupDrivesBusy": "Backing up drive crates…",
    "snapshots.count": {
      one: "{count} backup",
      other: "{count} backups"
    },
    "snapshots.drivePermission": "{name} (no permission)",
    "snapshots.driveReadOnly": "{name} (read-only)",
    "snapshots.drivesAbsent": "Unplugged, not copied: {drives}.",
    "snapshots.drivesAlready": "Those drive crates are already in this session's backup.",
    "snapshots.drivesCopied": "Copied: {drives}.",
    "snapshots.drivesIntro": "Connected drive crates are copied into the backup on this computer.",
    "snapshots.drivesNone": "No drive folders were due for a copy.",
    "snapshots.drivesSaved": "Drive crates were copied into the backup on this computer.",
    "snapshots.drivesSkipped": "Skipped: {drives}.",
    "snapshots.empty": "No backups yet. Take a backup to keep a point you can restore. Backups are kept, and this page does not expire them.",
    "snapshots.noSearch": "Backups has no search. Press Ctrl+K to find a track or a file.",
    "snapshots.outsideChange": "Something outside this app changed the Serato folder. A snapshot was saved after that change. Undo puts back the previous snapshot.",
    "snapshots.outsideChangeLexicon": "Lexicon changed the Serato folder. A snapshot was saved after that change. Undo puts back the previous snapshot.",
    "snapshots.reading": "Reading backups",
    "snapshots.readingPlan": "Reading what would change",
    "snapshots.restore": "Restore",
    "snapshots.restoreIntro": "Nothing is changed until you confirm. A new snapshot is saved first, so this restore can be undone.",
    "snapshots.restoreTitle": "Restore this backup",
    "snapshots.restored": "Restore finished. The previous library was saved first, so this can be undone from the list.",
    "snapshots.restoring": "Restoring…",
    "snapshots.reviewRestore": "Review restore",
    "snapshots.reviewUndo": "Review undo",
    "snapshots.saved": "Backup saved.",
    "snapshots.saving": "Saving backup…",
    "snapshots.seratoUnknown": "Serato version unknown",
    "snapshots.seratoVersion": "Serato {version} (build {build})",
    "snapshots.skippedCrates": {
      one: "Restore finished. {count} crate file was skipped because its snapshot copy could not be read: {names}.",
      other: "Restore finished. {count} crate files were skipped because their snapshot copy could not be read: {names}."
    },
    "snapshots.take": "Take a backup",
    "snapshots.trigger": "snapshot",
    "snapshots.unavailableDrives": "Unavailable: {drives}.",
    "snapshots.unknownDrive": "Unknown drive",
    "snapshots.unknownTime": "Unknown time",
    "snapshots.unreadable": "The backups could not be read.",
    "space.appleMusic": "Apple Music",
    "space.label": "Space",
    "space.library": "Library",
    "space.prepare": "Prepare",
    "space.video": "Video",
    "status.checking": "Checking Serato",
    "status.library": "Library",
    "tags.apply": "Apply",
    "tags.artist": "Artist",
    "tags.checking": "Reading tag spellings…",
    "tags.checkingTitles": "Reading titles…",
    "tags.field": "Field",
    "tags.genre": "Genre",
    "tags.introTitles": "Strips track numbers, URLs, and (Original Mix). Moves feat. into remixer when remixer is empty. Title-cases ALL CAPS or all lowercase. Writes the library, not the audio files. Quit Serato first.",
    "tags.group": "{name} — {spellings}, {tracks}",
    "tags.heading": "Tag spellings",
    "tags.intro": "Pick one spelling per group. Writes the library, not the audio files. Quit Serato first.",
    "tags.noChanges": "Every track in this group already uses that spelling.",
    "tags.preview": "Review",
    "tags.previewLine": {
      one: "{from} → {to} ({count} track)",
      other: "{from} → {to} ({count} tracks)"
    },
    "tags.previewLineRemixer": {
      one: "{from} → {to}, remixer {remixer} ({count} track)",
      other: "{from} → {to}, remixer {remixer} ({count} tracks)"
    },
    "tags.previewSummary": {
      one: "{count} track would become {value}.",
      other: "{count} tracks would become {value}."
    },
    "tags.row": "{value} ({count})",
    "tags.spellingCount": {
      one: "{count} spelling",
      other: "{count} spellings"
    },
    "tags.suggested": "Suggested",
    "tags.summaryArtist": {
      one: "{values} artist spellings in this space. {count} group with more than one spelling.",
      other: "{values} artist spellings in this space. {count} groups with more than one spelling."
    },
    "tags.summaryArtistClear": "Every artist in this space uses one spelling.",
    "tags.summaryGenre": {
      one: "{values} genre spellings in this space. {count} group with more than one spelling.",
      other: "{values} genre spellings in this space. {count} groups with more than one spelling."
    },
    "tags.summaryGenreClear": "Every genre in this space uses one spelling.",
    "tags.summaryTitles": {
      one: "{count} title in this space would change.",
      other: "{count} titles in this space would change."
    },
    "tags.summaryTitlesClear": "Every title in this space already matches the cleanup rules.",
    "tags.titles": "Titles",
    "tags.titlesPreviewSummary": {
      one: "{count} title would change.",
      other: "{count} titles would change."
    },
    "tags.titlesWritten": {
      one: "Wrote the cleaned title on {count} track.",
      other: "Wrote the cleaned titles on {count} tracks."
    },
    "tags.trackCount": {
      one: "{count} track",
      other: "{count} tracks"
    },
    "tags.unreachable": "Couldn't reach the library server. Check it's running, then press Check again.",
    "tags.unreadable": "The tag groups could not be read.",
    "tags.written": {
      one: "Wrote {value} on {count} track.",
      other: "Wrote {value} on {count} tracks."
    },
    "tooltip.allTracks": "Show every track in this space. Ctrl/Cmd+1.",
    "tooltip.backupDrives": "Copy each connected drive's Serato folder into the backup on this computer. An unplugged drive is listed and left untouched.",
    "tooltip.beatgridLock": "Lock the beatgrid so Serato does not move it.",
    "tooltip.chooseRelated": "Choose {name} as the track to link.",
    "tooltip.collapseCrate": "Hide the crates nested under {name}.",
    "tooltip.colorway": "Choose the theme. The app icon can follow this choice.",
    "tooltip.consentAccept": "Share anonymous stats and crash reports.",
    "tooltip.consentDecline": "Don't share anonymous stats.",
    "tooltip.copyLogs": "Copy the log text.",
    "tooltip.copyVersion": "Copy the app version.",
    "tooltip.crateColor": "Set the color of the selected crate.",
    "tooltip.crateDelete": "Delete the selected crate. The tracks stay in the library.",
    "tooltip.crateNew": "Create a new crate.",
    "tooltip.crateFolderSync": "Add library tracks whose files sit in a folder to this crate. Files that are not in the library stay skipped.",
    "tooltip.crateRenameFromTags": "Rename this crate's files to Artist - Title and keep crate paths.",
    "tooltip.cratePreset": "Make a crate from a preset: tracks that mix with a key, a BPM range, or tracks not played lately.",
    "tooltip.folderSyncCancel": "Close without changing the crate.",
    "tooltip.folderSyncFull": "Also remove tracks whose files are not in this folder.",
    "tooltip.folderSyncPath": "Folder on this computer whose files should match this crate.",
    "tooltip.folderSyncRun": "Update this crate to match the folder. Serato DJ Pro must be quit.",
    "tooltip.folderSyncSubcrates": "Put files in this folder into the crate, and make a subcrate for each subfolder.",
    "tooltip.crateRefresh": "Pick the tracks for this preset crate again from its preset.",
    "tooltip.crateRename": "Rename the selected crate.",
    "tooltip.crateSaveView": "Save the tracks in this list as a new crate. Serato DJ Pro must be quit.",
    "tooltip.crateSearch": "Find a crate by name. Esc clears the search.",
    "tooltip.crateSplit": "Show two crates at once. Alt-click or Shift-click fills the other list.",
    "tooltip.cratesReplaceCancel": "Close without changing crates.",
    "tooltip.cratesReplaceConfirm": "Put the replacement in those crates.",
    "tooltip.cratesReplaceKeep": "Keep both tracks in those crates. The replacement sits at the same position.",
    "tooltip.cratesReplaceRetire": "Remove this track from those crates after the replacement is added.",
    "tooltip.cratesReplaceSearch": "Find the track that should go in those crates.",
    "tooltip.cue": "Move the playhead to {label}.",
    "tooltip.editField": "Edit {label}. Nothing is saved until you save the track.",
    "tooltip.expandCrate": "Show the crates nested under {name}.",
    "tooltip.exportM3u": "Download this list as a playlist file.",
    "tooltip.exportRekordbox": "Download a playlist file Rekordbox can open. You confirm before it downloads.",
    "tooltip.fileShortcut": "{name} is a shortcut. It cannot be opened from here.",
    "tooltip.filesCancel": "Cancel. Nothing is changed. Esc.",
    "tooltip.filesConfirm": "Save this file change.",
    "tooltip.filesDelete": "Move the selected files to the Trash.",
    "tooltip.filesElsewhere": "Browse a folder that is not one of the music folders.",
    "tooltip.filesList": "Folder list. Up arrow and Down arrow move between rows. Enter opens the row.",
    "tooltip.filesMove": "Move the selected files to another folder.",
    "tooltip.filesMoveFolder": "Move this folder.",
    "tooltip.filesMoveHere": "Move the files into this folder.",
    "tooltip.filesMoveTrash": "Move the selected files to the Trash. You can restore them from there.",
    "tooltip.filesMusicFolders": "Go back to the music folders.",
    "tooltip.filesName": "Type the new file name.",
    "tooltip.filesPickCancel": "Cancel choosing a folder.",
    "tooltip.filesRefresh": "Refresh this folder from disk.",
    "tooltip.filesRename": "Rename the selected file.",
    "tooltip.filesRenameFromTags": "Rename the selected files to Artist - Title and keep crate paths.",
    "tooltip.filesReplace": "Upgrade the selected file and keep its cue points.",
    "tooltip.filesReplacement": "Type the path of the replacement file.",
    "tooltip.filesReview": "Review this change before it is saved.",
    "tooltip.filesSearch": "Search file names. Ctrl/Cmd+F or /. Esc clears the search.",
    "tooltip.filesUp": "Go up to the parent folder.",
    "tooltip.findRelated": "Find a track to link by title or artist.",
    "tooltip.gigBack": "Go back one step.",
    "tooltip.gigExit": "Leave the gig check and show crates.",
    "tooltip.gigNext": "Go to the next step.",
    "tooltip.gigRefresh": "Run the gig check again.",
    "tooltip.gigShowAll": "Show every item in this list.",
    "tooltip.help": "Open Help. Report a bug or request a feature on GitHub. The app does not post it.",
    "tooltip.helpBug": "Describe a bug. GitHub opens so you can review it.",
    "tooltip.helpClose": "Close Help. Esc.",
    "tooltip.helpCopyLog": "Copy the log with your home folder replaced by ~.",
    "tooltip.helpExpected": "What you expected to happen.",
    "tooltip.helpFeature": "Describe a feature. GitHub opens so you can review it.",
    "tooltip.helpGithub": "Open the project on GitHub.",
    "tooltip.helpHappened": "What happened, or what should change.",
    "tooltip.helpNames": "Keep track and crate names in the copied log. Off leaves them out.",
    "tooltip.helpOpen": "Open the prefilled GitHub issue. You submit it there.",
    "tooltip.helpReleases": "Open the release notes on GitHub.",
    "tooltip.helpReport": "The report text, when it could not be copied.",
    "tooltip.hideSearchCopies": "Hide the fields that were compared.",
    "tooltip.hotLoops": "Copy loops onto a free hot-cue pad in the Rekordbox file.",
    "tooltip.iconFollowsTheme": "Match the Dock icon on Mac, or the window and taskbar icon on Windows, to the theme. On by default. The Finder icon and the Windows program icon stay the same.",
    "tooltip.importFile": "Choose a playlist file to import.",
    "tooltip.importM3u": "Add tracks from a playlist file into a new crate.",
    "tooltip.keepCopy": "Keep this copy: {name}. The others leave the library.",
    "tooltip.language": "Choose the language for this window. Same as the system follows this computer.",
    "tooltip.libraryGeneration": "Opens the note that says whether the session log or the installed Serato decided this is Serato 4, Serato 5, or an unknown version.",
    "tooltip.linkMutual": "Also link that track back to this one.",
    "tooltip.linkNote": "Add a note for this link.",
    "tooltip.linkRating": "Rate this link from 1 to 5.",
    "tooltip.logFallback": "Log text, when it could not be copied.",
    "tooltip.membership": "Add this track to {name}, or take it out.",
    "tooltip.memoryCues": "Include memory cues in the Rekordbox file.",
    "tooltip.mergeCancel": "Cancel. Nothing is merged. Esc.",
    "tooltip.mergeConfirm": "Merge the copies into the one you keep.",
    "tooltip.mergeConfirmTrash": "Merge the copies and move the other audio files to the Trash.",
    "tooltip.mergeDuplicates": "Merge the selected copies into the one you keep.",
    "tooltip.relink": "Find files that moved and point missing tracks at them.",
    "tooltip.relinkAcceptHigh": "Tick every match whose confidence is high.",
    "tooltip.relinkCancel": "Cancel. Nothing is written. Esc.",
    "tooltip.relinkConfirm": "Point the ticked tracks at the chosen files. Audio is not moved.",
    "tooltip.relinkFind": "Search the music folders, and the extra folder if you pasted one.",
    "tooltip.relinkInclude": "Include this track in the relink.",
    "tooltip.relinkPick": "Choose which file this missing track should use.",
    "tooltip.relinkRoot": "Extra folder to search after a drive swap. Leave blank to use the music folders.",
    "tooltip.mergeTrash": "Move the other audio files to the Trash. You can restore them from there.",
    "tooltip.merging": "Merging the copies.",
    "tooltip.missingDrive": "Connect the drive that holds {name} before opening it.",
    "tooltip.next": "Play the next track in this list.",
    "tooltip.openCopy": "Open this other copy, {name}.",
    "tooltip.openCrate": "Show the tracks in the crate {name}.",
    "tooltip.openCrumb": "Open the folder {name}.",
    "tooltip.openFile": "Open the folder {name}. Enter opens the highlighted row.",
    "tooltip.openInLibrary": "Open this history row in the library.",
    "tooltip.openLogs": "Open the folder that holds the log.",
    "tooltip.openRelated": "Open the linked track {name}.",
    "tooltip.openReplaceCopy": "Use {name} in the crates this track is in.",
    "tooltip.operationsList": "Operation log. Each row is one checked edit or restore.",
    "tooltip.operationsRefresh": "Refresh the operation log.",
    "tooltip.operationsRetry": "Try reading the operation log again.",
    "tooltip.overview": "Overview of the whole track. Click or drag to seek. Left arrow goes back 5 seconds. Right arrow goes forward 5 seconds.",
    "tooltip.playRow": "Start {name}. Space plays or pauses.",
    "tooltip.portableCheck": "Check {name}. Read its crates and list what to fix before the gig. Nothing is written.",
    "tooltip.portableClose": "Close the portable drive report.",
    "tooltip.prepareAdd": "Send this track to Prepare.",
    "tooltip.prepareRemove": "Take this track out of Prepare.",
    "tooltip.presetBpm": "The tempo in the middle of the range.",
    "tooltip.presetCancel": "Close without making a crate.",
    "tooltip.presetCreate": "Save the matching tracks as a new crate.",
    "tooltip.presetKey": "The key to mix from. Tracks one step either way on the Camelot wheel, and the relative key, are included.",
    "tooltip.presetKind": "Choose which tracks the crate collects.",
    "tooltip.presetMonths": "Tracks with no play in this many months, including tracks never played.",
    "tooltip.presetName": "The crate name. ⟳ is added at the end.",
    "tooltip.presetRange": "How far above or below that tempo a track can be.",
    "tooltip.presetScope": "Look only at tracks in the selected crate and the crates inside it.",
    "tooltip.previous": "Play the previous track in this list.",
    "tooltip.quickOpen": "Find a track or a file by name. Ctrl/Cmd+K. Esc closes this box.",
    "tooltip.quickOpenClose": "Close find. Esc.",
    "tooltip.quickOpenHit": "Open {kind} {title}. Enter.",
    "tooltip.quickOpenHitDetail": "Open {kind} {title}. {detail}. Enter.",
    "tooltip.quickOpenRetry": "Search files again.",
    "tooltip.rekordboxCancel": "Cancel. The file is not downloaded. Esc.",
    "tooltip.rekordboxDownload": "Download the Rekordbox file.",
    "tooltip.rekordboxKey": "Choose how keys are written in the Rekordbox file.",
    "tooltip.reload": "Reload the library from Serato.",
    "tooltip.relocate": "Point this track at a different audio file.",
    "tooltip.removeRelated": "Remove the saved link to {name}. The audio file stays on disk.",
    "tooltip.removeTrack": "Remove this track from the library. The audio file stays on disk.",
    "tooltip.rerunWizard": "Run setup again.",
    "tooltip.reveal": "Show this file in {name}. The library is not changed.",
    "tooltip.reviewRestore": "Review what restoring this snapshot would change.",
    "tooltip.runSetup": "Run setup to find music folders.",
    "tooltip.saveLink": "Save this link.",
    "tooltip.saveRules": "Save these smart crate rules.",
    "tooltip.saveSuggestion": "Save a two-way link to {name}. Serato is not changed until you update the crate.",
    "tooltip.saveTrack": "Save these track details.",
    "tooltip.scanFull": "Decode every file in the selected crate. Choose a crate first. This can take minutes. Nothing is written.",
    "tooltip.scanQuick": "Read the start of each audio file. Empty files and the wrong format show up here. Nothing is written.",
    "tooltip.search": "Search tracks by title or artist. Filter with bpm:120-128, bpm:124~3, key:8A, or mix:8A (keys that mix with 8A). Ctrl/Cmd+F or /. Esc clears the search.",
    "tooltip.seek": "Move through the track. Left arrow goes back 5 seconds. Right arrow goes forward 5 seconds. Shift with an arrow jumps 30 seconds.",
    "tooltip.selectFile": "Select {name} for rename, move, or delete.",
    "tooltip.selectFilePath": "Select {name} at {path} for rename, move, or delete.",
    "tooltip.selectRow": "Select {name}. Enter opens this row.",
    "tooltip.session": "Show the tracks played in the session {name}.",
    "tooltip.settings": "Open settings.",
    "tooltip.settingsClose": "Close settings. Esc.",
    "tooltip.shortcuts": "Keyboard shortcuts for this screen. ? opens this list.",
    "tooltip.shortcutsClose": "Close the shortcut list. Esc.",
    "tooltip.showSearchCopies": "Show the fields that were compared.",
    "tooltip.smartRules": "Edit the smart crate rules. Nothing is saved until you press Save rules.",
    "tooltip.snapshotCancel": "Cancel. Nothing is restored. Esc.",
    "tooltip.snapshotConfirm": "Restore this snapshot. A new snapshot is saved first.",
    "tooltip.snapshotsList": "Snapshot list. Up arrow and Down arrow move between rows. Enter reviews the snapshot.",
    "tooltip.snapshotsRefresh": "Refresh the snapshot list.",
    "tooltip.snapshotsRetry": "Try reading the snapshots again.",
    "tooltip.snapshotsTake": "Save a backup of the library.",
    "tooltip.snapshotsUndo": "Review undoing the last outside change.",
    "tooltip.sortAdded": "Sort crates by the date they were added.",
    "tooltip.sortArtist": "Sort tracks by artist.",
    "tooltip.sortBpm": "Sort tracks by tempo.",
    "tooltip.sortBy": "Sort by {label}.",
    "tooltip.sortCrateName": "Sort crates by name.",
    "tooltip.sortDeck": "Sort history by deck.",
    "tooltip.sortKey": "Sort tracks by key.",
    "tooltip.sortLength": "Sort tracks by length.",
    "tooltip.sortOrder": "Sort crates in the saved order.",
    "tooltip.sortPlayed": "Sort history by whether the track was played.",
    "tooltip.sortStart": "Sort history by the time it started.",
    "tooltip.sortTitle": "Sort tracks by title.",
    "tooltip.space": "Choose Library, Video, Apple Music, or Prepare.",
    "tooltip.splitter": "Drag to resize the track list. Double-click to put it back. Arrow keys resize it.",
    "tooltip.tagsApply": "Write this spelling on every track in the group. Quit Serato first. Audio files stay as they are.",
    "tooltip.tagsApplyTitles": "Write the cleaned titles. Quit Serato first. Audio files stay as they are.",
    "tooltip.tagsArtist": "Show artist names that are the same words written different ways.",
    "tooltip.tagsGenre": "Show genres that are the same words written different ways.",
    "tooltip.tagsTitles": "Show titles that would change after stripping numbers, URLs, Original Mix, and feat., and title-casing ALL CAPS or all lowercase.",
    "tooltip.tagsGroup": "Open or close this spelling group.",
    "tooltip.tagsPreview": "Show which tracks would change before writing the library.",
    "tooltip.tagsRefresh": "Load the spelling groups again.",
    "tooltip.tagsSpelling": "Choose this spelling for every track in the group.",
    "tooltip.telemetry": "Turn anonymous stats and crash reports on or off.",
    "tooltip.trackColor": "Choose a color for this track.",
    "tooltip.trackList": "Track list. Up arrow and Down arrow move between rows. Enter opens the row. Space plays or pauses.",
    "tooltip.trackRating": "Choose a rating for this track.",
    "tooltip.transport": "{action}. Space plays or pauses.",
    "tooltip.transportNamed": "{action} {name}. Space plays or pauses.",
    "tooltip.updateDismiss": "Hide this until the app opens again.",
    "tooltip.updateDownload": "Open this release's page on GitHub in your browser.",
    "tooltip.updatePrereleases": "Also tell you about beta versions and release candidates.",
    "tooltip.updateRelated": "Create or refresh the Related crate in Serato. Serato has to be quit.",
    "tooltip.updateSkip": "Don't tell you about this version again.",
    "tooltip.updateToggle": "Ask GitHub once a day whether a newer version is out.",
    "tooltip.useInCrates": "Put another track in every crate this one is in, at the same position.",
    "tooltip.viewCrates": "Show crates. Ctrl/Cmd+2.",
    "tooltip.viewDuplicates": "Show tracks that look like copies of each other.",
    "tooltip.viewFiles": "Show files on disk. Ctrl/Cmd+3.",
    "tooltip.viewGig": "Check the library before a gig. Read-only.",
    "tooltip.viewHistory": "Show history. Ctrl/Cmd+4.",
    "tooltip.viewMissing": "Show tracks whose files are missing on a connected drive. Tracks on an unplugged drive stay in crates as offline.",
    "tooltip.viewScan": "Find audio files that are empty, the wrong format, or will not decode. Read-only.",
    "tooltip.viewSnapshots": "Open backups. Hash-checked copies of the library, crates, and cue frames. Ctrl/Cmd+5.",
    "tooltip.viewStems": "Show tracks Serato has analyzed for stems. This does not separate the audio.",
    "tooltip.viewTags": "Group genre and artist spellings that mean the same thing. Writes the library, not the audio files.",
    "tooltip.volume": "Change how loud playback is.",
    "tooltip.wizard.checkAgain": "Look for the Serato library again.",
    "tooltip.wizard.continue": "Continue to the next step.",
    "tooltip.wizard.getStarted": "Start setup.",
    "tooltip.wizard.looking": "Looking for the Serato library.",
    "tooltip.wizard.none": "Continue setup.",
    "tooltip.wizard.openLibrary": "Finish setup and open the library.",
    "tooltip.wizard.saving": "Saving a safety copy of the library.",
    "tooltip.wizard.takeSnapshot": "Save a safety copy of the library.",
    "tooltip.wizard.tryAgain": "Try saving the safety copy again.",
    "tooltip.wizard.useLibrary": "Use the library that was found.",
    "tooltip.wizardBack": "Go back one setup step.",
    "tooltip.wizardCancel": "Cancel setup. The library is not changed. Esc.",
    "tooltip.wizardFolder": "Open the folder {name}.",
    "tooltip.wizardFolderClose": "Close the folder list. Esc.",
    "tooltip.wizardFolderUp": "Go up to the parent folder.",
    "tooltip.wizardFolderUse": "Use this folder as the library.",
    "tooltip.wizardNo": "Don't share anonymous stats.",
    "tooltip.wizardSecondary": "Choose a folder that already has a Serato library.",
    "tooltip.wizardUpdatesNo": "Don't check GitHub for new versions.",
    "tooltip.wizardUpdatesYes": "Check GitHub once a day for a new version.",
    "tooltip.wizardYes": "Share anonymous stats and crash reports.",
    "tooltip.zoomIn": "Show a shorter stretch of the waveform around the playhead.",
    "tooltip.zoomOut": "Show a longer stretch of the waveform around the playhead.",
    "track.missingBadge": "missing",
    "track.offlineBadge": "offline",
    "track.numbered": "Track {id}",
    "track.stemsBadge": "stems",
    "track.untitled": "Untitled",
    "update.available": "Version {version} is out. You have {current}.",
    "update.availableTest": "Test version {version} is out. You have {current}.",
    "update.dismiss": "Not now",
    "update.download": "Download",
    "update.label": "Update available",
    "update.openFailed": "The release page could not be opened. It is on GitHub under Releases.",
    "update.skip": "Skip this version",
    "version.app": "App version",
    "version.copied": "Copied",
    "version.copyFailed": "Couldn't copy the version.",
    "version.unavailable": "Version unavailable",
    "view.crates": "Crates",
    "view.duplicates": "Duplicates",
    "view.files": "Organize files",
    "view.gig": "Before a gig",
    "view.group.health": "Library health",
    "view.group.library": "Library",
    "view.history": "History",
    "view.label": "Views",
    "view.missing": "Missing files",
    "view.scan": "Damaged files",
    "view.snapshots": "Backups",
    "view.stems": "Stems",
    "view.tags": "Tag spellings",
    "wizard.action.checkAgain": "Check again",
    "wizard.action.continue": "Continue",
    "wizard.action.getStarted": "Get started",
    "wizard.action.looking": "Looking…",
    "wizard.action.openLibrary": "Open my library",
    "wizard.action.takeSnapshot": "Take a safety snapshot",
    "wizard.action.tryAgain": "Try again",
    "wizard.action.useLibrary": "Use this library",
    "wizard.announce": "Step {index} of {count}. {name}.",
    "wizard.blocked": "Close Serato DJ to continue.",
    "wizard.chooseCheckAgain": "Choose Check again.",
    "wizard.chooseFolder": "Choose a folder",
    "wizard.closeFolders": "Close folder list",
    "wizard.consentFailed": "Couldn't save that choice. Try again.",
    "wizard.copySaved": "Safety copy saved.",
    "wizard.done": "Library ready. Snapshot saved.",
    "wizard.finishFailed": "Couldn't save that you finished setup. Try again.",
    "wizard.folders": "Folders",
    "wizard.genericError": "Something went wrong. Try again.",
    "wizard.heading.consent": "Share anonymous usage stats and crash reports?",
    "wizard.heading.library": "Find your library",
    "wizard.heading.snapshot": "Safety snapshot",
    "wizard.heading.updates": "Check for new versions?",
    "wizard.heading.welcome": "See your Serato library",
    "wizard.lookFailed": "Couldn't look for your library.",
    "wizard.looking": "Looking for your Serato library.",
    "wizard.no": "No, don't share",
    "wizard.noSubfolders": "This folder has no folders inside it.",
    "wizard.opening": "Opening…",
    "wizard.progressLabel": "Saving a safety copy",
    "wizard.saving": "Saving…",
    "wizard.savingCopy": "Saving a safety copy…",
    "wizard.savingLibraryCopy": "Saving a safety copy of your library.",
    "wizard.snapshotBody": "A backup of your library data is saved before anything is changed.",
    "wizard.snapshotFailed": "The safety copy could not be saved. Your library was not changed. Try again.",
    "wizard.step.consent": "Sharing",
    "wizard.step.done": "Done",
    "wizard.step.library": "Find your library",
    "wizard.step.snapshot": "Safety snapshot",
    "wizard.step.updates": "Updates",
    "wizard.step.welcome": "Welcome",
    "wizard.stepOf": "Step {index} of {count}",
    "wizard.updatesBody": "Once a day, the app can ask GitHub whether a newer version is out. GitHub sees your IP address and this app's version. Nothing about your library is sent. Checking stays off unless you turn it on, and you can change it in Settings.",
    "wizard.updatesFailed": "The choice could not be saved. Try again.",
    "wizard.updatesNo": "No, don't check",
    "wizard.updatesYes": "Yes, check",
    "wizard.useFolder": "Use this folder",
    "wizard.welcomeBody": "This app shows the library Serato already keeps on this computer. It will not change anything without asking.",
    "wizard.yes": "Yes, share"
  };

  // locales/es.json
  var es_default = {
    "color.blue": "Azul",
    "color.custom": "Personalizado",
    "color.green": "Verde",
    "color.none": "Ninguno",
    "color.orange": "Naranja",
    "color.pink": "Rosa",
    "color.purple": "Morado",
    "color.red": "Rojo",
    "color.yellow": "Amarillo",
    "column.artist": "Artista",
    "column.bpm": "BPM",
    "column.deck": "Deck",
    "column.key": "Tono",
    "column.played": "Reproducida",
    "column.time": "Tiempo",
    "column.title": "Título",
    "common.back": "Atrás",
    "common.cancel": "Cancelar",
    "common.close": "Cerrar",
    "common.confirm": "Confirmar",
    "common.delete": "Eliminar",
    "common.no": "No",
    "common.off": "Desactivado",
    "common.on": "Activado",
    "common.refresh": "Actualizar",
    "common.reload": "Recargar",
    "common.remove": "Quitar",
    "common.save": "Guardar",
    "common.saved": "Guardado.",
    "common.tryAgain": "Reintentar",
    "common.up": "Subir",
    "common.yes": "Sí",
    "consent.accept": "Compartir",
    "consent.body": "Solo recuentos y acciones, más el nombre de la app, su versión y el sistema operativo. Los títulos de las pistas, los nombres de las cajas, las rutas de los archivos y el contenido de la biblioteca se quedan en este equipo. No se comparte nada a menos que lo actives.",
    "consent.decline": "No compartir",
    "copies.heading": "Otras copias",
    "copies.useInCrates": "Usar en las cajas",
    "count.plays": {
      one: "{count} reproducción",
      other: "{count} reproducciones"
    },
    "count.split": "{a} · {b}",
    "count.tracks": {
      one: "{count} pista",
      other: "{count} pistas"
    },
    "crates.allTracks": "Todas las pistas",
    "crates.collapse": "Contraer {name}",
    "crates.colorPrompt": "Color de la caja: {names}",
    "crates.colorSaved": "Color de la caja guardado.",
    "crates.colorUnknown": "Usa uno de los nombres de la paleta.",
    "crates.confirmDelete": "¿Eliminar «{name}» y las cajas que contiene? Las pistas se quedan en la biblioteca.",
    "crates.created": "Caja creada.",
    "crates.deleted": "Caja eliminada.",
    "crates.expand": "Expandir {name}",
    "crates.find": "Buscar una caja",
    "crates.heading": "Cajas",
    "crates.new": "Nueva",
    "crates.newPrompt": "Nombre de la nueva caja",
    "crates.paneA": "Caja izquierda",
    "crates.paneB": "Caja derecha",
    "crates.rename": "Renombrar",
    "crates.renamePrompt": "Renombrar caja",
    "crates.renamed": "Caja renombrada.",
    "crates.saveView": "Guardar vista",
    "crates.saveViewCreated": {
      one: "Se guardó {count} pista como caja.",
      other: "Se guardaron {count} pistas como caja."
    },
    "crates.saveViewEmpty": "Esta lista no tiene pistas para guardar.",
    "crates.saveViewPrompt": "Nombre de la caja",
    "crates.selectedCrate": "Caja seleccionada",
    "crates.smartBadge": "inteligente",
    "crates.smartList": "Cajas inteligentes: {names}",
    "crates.sort": "Ordenar cajas",
    "crates.sort.added": "Añadidas",
    "crates.sort.name": "Nombre",
    "crates.sort.order": "Orden",
    "crates.split": "Dividir",
    "cratesReplace.addToCrates": "Añadir la pista de reemplazo a {crates}.",
    "cratesReplace.alreadyInCrates": "La pista de reemplazo ya está en esas cajas. Se queda donde está.",
    "cratesReplace.confirm": "Actualizar cajas",
    "cratesReplace.intro": "Pon otra pista en cada caja donde está esta, en la misma posición. Las dos pueden quedarse. Las cajas inteligentes no se tocan.",
    "cratesReplace.keepBoth": "Dejar las dos pistas en esas cajas",
    "cratesReplace.noCrates": "Esta pista no está en ninguna caja normal.",
    "cratesReplace.noReplacement": "Elige la pista que debe entrar en esas cajas.",
    "cratesReplace.nothingToDo": "Nada que cambiar en las cajas.",
    "cratesReplace.placed": {
      one: "Se añadió {name} a {count} caja.",
      other: "Se añadió {name} a {count} cajas."
    },
    "cratesReplace.previewFailed": "No se pudo leer la vista previa.",
    "cratesReplace.quitSerato": "Cierra Serato antes de actualizar las cajas. La vista previa muestra el plan.",
    "cratesReplace.readingPreview": "Leyendo la vista previa…",
    "cratesReplace.removeFromCrates": "Quitar la pista original de {crates}.",
    "cratesReplace.retire": "Luego quitar esta pista de esas cajas",
    "cratesReplace.retired": "Se quitó {name} de esas cajas.",
    "cratesReplace.search": "Pista de reemplazo",
    "cratesReplace.title": "Usar en las cajas",
    "cratesReplace.updated": "Se actualizaron las cajas.",
    "cratesReplace.updating": "Actualizando…",
    "detail.bpmNumber": "El BPM debe ser un número.",
    "detail.confirmRemove": "¿Quitar esta pista de la biblioteca? El archivo de audio se queda en el disco.",
    "detail.empty": "Selecciona una pista para ver sus atributos.",
    "detail.hideSearchCopies": "Ocultar copias de búsqueda",
    "detail.readFailed": "No se pudo leer la pista ({status})",
    "detail.reading": "Leyendo atributos",
    "detail.relocate": "Reubicar",
    "detail.relocatePrompt": "Ruta del archivo de audio",
    "detail.relocated": "Ubicación del archivo guardada.",
    "detail.removeFromLibrary": "Quitar de la biblioteca",
    "detail.removePrepare": "Quitar de Prepare",
    "detail.removed": "Quitada de la biblioteca.",
    "detail.removedPrepare": "Quitada de Prepare.",
    "detail.reveal": "Mostrar en {manager}",
    "detail.saveTrack": "Guardar pista",
    "detail.searchCopies": {
      one: "Copias de búsqueda, {count} campo",
      other: "Copias de búsqueda, {count} campos"
    },
    "detail.sendPrepare": "Enviar a Prepare",
    "detail.sentPrepare": "Enviada a Prepare.",
    "detail.useInCrates": "Usar esta copia en las cajas",
    "duplicates.readFailed": "No se pudieron leer los duplicados.",
    "error.action_unavailable": "Esa acción no está disponible.",
    "error.backup_no_space": "No hay espacio suficiente en el disco para copiar la biblioteca.",
    "error.backup_serato_running": "Cierra Serato DJ Pro antes de copiar las cajas de las unidades. Serato DJ sigue abierto, así que no se copió nada.",
    "error.bitrate_needs_crate": "Elige una caja para comprobar la tasa de bits.",
    "error.body_not_json": "El cuerpo de la solicitud no es JSON.",
    "error.body_not_object": "El cuerpo de la solicitud no es un objeto.",
    "error.choose_copy": "Elige la copia que quieres conservar.",
    "error.choose_replace_from": "Elige la pista que quieres reemplazar.",
    "error.choose_replace_to": "Elige la pista que quieres poner en esas cajas.",
    "error.choose_folder": "Elige una carpeta.",
    "error.choose_genre_or_artist": "Elige género o artista.",
    "error.choose_spelling": "Elige una grafía.",
    "error.color_not_number": "El color debe ser un número.",
    "error.color_out_of_range": "El color está fuera de rango.",
    "error.consent_not_saved": "No se pudo guardar la elección sobre compartir datos.",
    "error.crate_name_separator": "Usa un nombre de caja sin el separador de nombres de Serato.",
    "error.crate_name_too_long": "Ese nombre de caja es demasiado largo.",
    "error.crate_not_in_space": "Esa caja no está en este espacio.",
    "error.crate_not_root": "Las pistas viven en una caja, no en la raíz del espacio.",
    "error.field_readonly": "Ese campo no se puede editar.",
    "error.file_already_this_track": "Ese archivo ya es esta pista.",
    "error.file_already_used": "Otra pista de la biblioteca ya usa ese archivo.",
    "error.file_not_on_disk": "Ese archivo no está en el disco.",
    "error.focus_failed": "No se pudo traer la ventana al frente.",
    "error.folder_not_library": "Esa carpeta no es la biblioteca de Serato de este equipo.",
    "error.folder_outside_roots": "Esa carpeta está fuera de las carpetas de música.",
    "error.folder_unreadable": "No se pudo leer esa carpeta.",
    "error.internal": "Algo salió mal. Los detalles están en el registro local.",
    "error.invalid_request": "Esa solicitud no es válida.",
    "error.language_not_saved": "No se pudo guardar el idioma.",
    "error.layout_not_saved": "No se pudo guardar la disposición.",
    "error.legacy_read_only": "Esta biblioteca la creó una versión anterior de Serato DJ. Esta app puede mostrarla, pero todavía no puede modificarla.",
    "error.length_invalid": "La duración debe ser un número entero de milisegundos.",
    "error.library_log_unconfirmed": "El registro de la sesión no confirma este archivo de biblioteca ({database}). Las escrituras y las restauraciones están desactivadas. Las instantáneas se pueden tomar y leer.",
    "error.library_not_saved": "No se pudo guardar la biblioteca.",
    "error.logs_not_opened": "No se pudo abrir la carpeta de registros.",
    "error.move_failed": "No se pudo mover el archivo. No se cambió nada.",
    "error.no_legacy_library": "No se encontró ninguna biblioteca antigua de Serato.",
    "error.no_library": "No se encontró ninguna biblioteca de Serato en este equipo.",
    "error.not_duplicate": "Esa pista no está en un grupo de duplicados.",
    "error.note_too_long": "La nota es demasiado larga.",
    "error.nothing_to_undo": "No hay ningún cambio externo que deshacer.",
    "error.path_unreadable": "No se pudo leer esa ruta.",
    "error.playlist_empty": "La lista de reproducción está vacía.",
    "error.preset_bad_band": "Elige una banda de BPM cuyo extremo inferior esté por debajo del superior, hasta 400.",
    "error.preset_bad_bpm": "Elige un BPM mayor que cero y un margen de 0 a 50.",
    "error.preset_bad_genre": "Elige un género.",
    "error.preset_bad_key": "Elige una tonalidad para el preajuste armónico.",
    "error.preset_bad_months": "Elige entre 1 y 240 meses.",
    "error.preset_crate_gone": "Esa caja de preajuste ya no está en la biblioteca.",
    "error.preset_not_a_preset_crate": "Esa caja no se creó a partir de un preajuste.",
    "error.preset_unknown": "Ese preajuste de caja no está disponible.",
    "error.rating_invalid": "La valoración debe ser un número entero del 1 al 5.",
    "error.recycle_failed": "No se pudo mover el archivo a la Papelera de reciclaje.",
    "error.registration_no_space": "Las cajas no se registraron. Esta biblioteca no tiene el espacio Serato Library, así que Serato puede quitar esos archivos de caja la próxima vez que se abra.",
    "error.related_direction": "Elige un enlace en un sentido o en ambos sentidos.",
    "error.related_missing": "Ese enlace no está en las pistas relacionadas.",
    "error.related_not_saved": "No se pudo guardar el archivo de pistas relacionadas.",
    "error.related_self": "Una pista no puede estar relacionada consigo misma.",
    "error.related_unreadable": "No se pudo leer el archivo de pistas relacionadas.",
    "error.relink_duplicate_files": "Dos de esos archivos son el mismo.",
    "error.relink_duplicate_tracks": "Dos de esas pistas son la misma.",
    "error.relink_needs_tracks": "Elige pistas para volver a enlazar.",
    "error.relink_not_audio": "Ese archivo no es un archivo de audio.",
    "error.relink_still_on_disk": "Esa pista sigue en el disco.",
    "error.replace_needs_confirm": "Confirma la actualización de las cajas antes de ejecutarla.",
    "error.replace_same_track": "Esas dos pistas son la misma.",
    "error.requestFailed": "La solicitud falló",
    "error.requestStatus": "La solicitud falló ({status})",
    "error.root_color": "La raíz del espacio no tiene color.",
    "error.root_delete": "La raíz del espacio no se puede eliminar.",
    "error.root_rename": "La raíz del espacio no se puede renombrar.",
    "error.scan_depth": "Elige una comprobación rápida o completa.",
    "error.scan_full_needs_crate": "Elige una caja para la comprobación completa.",
    "error.serato_version_unknown": "La versión de Serato es desconocida (compilación {build}). Las escrituras y las restauraciones están desactivadas hasta que se pueda leer la versión de Serato instalada. Un valor que no es un número con puntos, incluido un plist ilegible, es desconocido. Las instantáneas se pueden tomar y leer.",
    "error.setup_needs_consent": "Elige si quieres compartir estadísticas antes de terminar la configuración.",
    "error.setup_not_saved": "No se pudo guardar la configuración.",
    "error.shortcut_skipped": "Los accesos directos no se tocan.",
    "error.smart_crate_tracks": "Las cajas inteligentes eligen sus pistas a partir de reglas.",
    "error.smart_rules_json": "Las reglas de la caja inteligente deben estar en JSON.",
    "error.smart_rules_list": "Las reglas de la caja inteligente necesitan una lista de reglas.",
    "error.snapshot_id_invalid": "Ese identificador de instantánea no es válido.",
    "error.snapshot_incomplete": "Esa instantánea está incompleta.",
    "error.snapshot_unreadable": "No se pudo leer esa instantánea.",
    "error.space_unavailable": "Ese espacio no está disponible aquí.",
    "error.spelling_not_in_group": "Esa grafía no está en un grupo.",
    "error.theme_not_saved": "No se pudo guardar el tema.",
    "error.track_id_required": "Se necesita el identificador de la pista.",
    "error.track_not_in_library": "Esa pista no está en la biblioteca.",
    "error.track_not_in_space": "La pista no está en este espacio.",
    "error.track_not_in_space_alt": "Esa pista no está en este espacio.",
    "error.too_many_files": "Elige menos archivos a la vez.",
    "error.track_path_required": "Se necesita la ruta de la pista.",
    "error.trash_failed": "No se pudo mover el archivo a la Papelera.",
    "error.tree_bad_bands": "Elige bandas de BPM entre 1 y 400, de 1 a 50 de ancho, que empiecen como mucho a su ancho de distancia, y como máximo 60 bandas.",
    "error.tree_bad_genres": "Elige al menos 1 pista por género y hasta 100 géneros.",
    "error.tree_empty": "Ninguna pista encaja en ese árbol de cajas.",
    "error.tree_unknown": "Ese árbol de cajas no está disponible.",
    "error.undo_needs_confirm": "Confirma la acción de deshacer antes de guardarla.",
    "error.upload_too_large": "Ese archivo es demasiado grande.",
    "error.write_preimage_mismatch": "La copia previa al cambio no coincide con su hash.",
    "error.write_rollback_failed": "El cambio no coincidía, y no se pudo devolver la biblioteca.",
    "error.write_undo_failed": "El cambio falló, y no se pudo devolver la biblioteca.",
    "export.m3u": "Exportar",
    "field.album": "Álbum",
    "field.beatgridLocked": "Beatgrid bloqueado",
    "field.color": "Color",
    "field.comments": "Comentarios",
    "field.composer": "Compositor",
    "field.emoji": "Emoji",
    "field.genre": "Género",
    "field.grouping": "Agrupación",
    "field.label": "Sello",
    "field.rating": "Valoración",
    "field.remixer": "Remezclador",
    "field.year": "Año",
    "files.andMore": "Y {count} más.",
    "files.browseElsewhere": "Explorar otra ubicación…",
    "files.changeCrates": "Cajas: {crates}.",
    "files.checking": "Comprobando qué va a cambiar.",
    "files.chooseDelete": "Elige los archivos que quieres eliminar.",
    "files.chooseDestination": "Elige la carpeta de destino. Después confirma el traslado.",
    "files.chooseMove": "Elige los archivos que quieres mover.",
    "files.chooseOneRename": "Elige un solo archivo para renombrar.",
    "files.chooseRenameFromTags": "Elige los archivos que quieres renombrar desde las etiquetas.",
    "files.chooseOneReplace": "Elige un solo archivo para reemplazar.",
    "files.contents": "Contenido de la carpeta",
    "files.driveMissing": "Unidad no conectada",
    "files.driveMissingLabel": "{name}, unidad no conectada",
    "files.empty": "Esta carpeta está vacía.",
    "files.fileCount": {
      one: "{count} archivo",
      other: "{count} archivos"
    },
    "files.inLibrary": "En la biblioteca",
    "files.moveFolder": "Mover esta carpeta",
    "files.moveHere": "Mover aquí",
    "files.moveToFolder": "Mover a una carpeta",
    "files.moveToTrash": "Mover a la Papelera",
    "files.newFile": "Archivo nuevo",
    "files.newName": "Nombre nuevo",
    "files.noMatches": "Ningún archivo coincide con “{query}”.",
    "files.noRoots": "Todavía no hay carpetas de música",
    "files.noRootsBody": "La configuración encuentra las carpetas que Serato usa para tu música.",
    "files.notSaved": "Ese cambio no se guardó.",
    "files.nothingUntilConfirm": "No se cambia nada hasta que confirmes.",
    "files.open": "Abrir {name}",
    "files.path": "Ruta de la carpeta",
    "files.readingFolder": "Leyendo esta carpeta",
    "files.readingFolderNote": "Leyendo esta carpeta.",
    "files.readingRoots": "Leyendo las carpetas de música",
    "files.readingRootsNote": "Leyendo las carpetas de música.",
    "files.renameFromTags": "Renombrar desde etiquetas",
    "files.replaceFile": "Mejorar archivo (conservar cues)",
    "files.review": "Revisar",
    "files.reviewTitle": "Revisa este cambio",
    "files.rootCount": {
      one: "{count} carpeta de música",
      other: "{count} carpetas de música"
    },
    "files.roots": "Carpetas de música",
    "files.rootsUnreadable": "No se pudieron leer las carpetas de música.",
    "files.runSetup": "Iniciar configuración",
    "files.saving": "Guardando.",
    "files.searchLabel": "Buscar archivos",
    "files.searchPlaceholder": "Buscar archivos",
    "files.searchResults": "Resultados de la búsqueda",
    "files.searchTruncated": "Algunos archivos que coinciden no están en la lista. Escribe más del nombre.",
    "files.searching": "Buscando archivos…",
    "files.shortcut": "{name} (acceso directo)",
    "files.trash": "Papelera",
    "files.truncated": "Algunos archivos no aparecen en la lista.",
    "files.updated": "Se actualizaron los archivos.",
    "folderSync.button": "Sincronizar carpeta",
    "folderSync.counting": "Contando pistas…",
    "folderSync.done": "{name} actualizada: {added} añadidas, {removed} quitadas.",
    "folderSync.folder": "Carpeta",
    "folderSync.full": "Quitar pistas cuyos archivos no están en esta carpeta",
    "folderSync.intro": "Añade las pistas de la biblioteca cuyos archivos están en esta carpeta. Los archivos que no están en la biblioteca se omiten. No se importa nada.",
    "folderSync.subcrates": "Crear una subcaja por cada subcarpeta",
    "folderSync.summary": "{added} para añadir, {removed} para quitar. {skipped} archivos no están en la biblioteca.",
    "folderSync.summaryNone": "Ya está sincronizada. {skipped} archivos no están en la biblioteca.",
    "folderSync.sync": "Sincronizar caja",
    "folderSync.title": "Sincronizar la caja con una carpeta",
    "folderSync.unchanged": "{name} ya coincide con esa carpeta.",
    "format.bytes": {
      one: "{count} byte",
      other: "{count} bytes"
    },
    "format.hoursMinutes": "{hours} h {minutes} min",
    "format.minutes": "{minutes} min",
    "generation.checking": "Comprobando",
    "generation.label": "Generación de la biblioteca",
    "generation.legacy": "Serato anterior",
    "generation.named": "Generación de la biblioteca, {kind}",
    "generation.reason.downgrade": "El registro más reciente dice Serato {newest} y un registro anterior dice Serato {version}.",
    "generation.reason.fallback": "No se encontró un registro de sesión. Se usa la versión de Serato instalada, {version}.",
    "generation.reason.installUnknown": "No se pudo leer la versión de Serato instalada, así que las escrituras siguen desactivadas. Un registro de sesión no puede activarlas.",
    "generation.reason.installed": "El Serato instalado es {version}. El registro más reciente dice Serato {newest}.",
    "generation.reason.log": "El registro de sesión más reciente, {log}, anotó que Serato {version} abrió {database}.",
    "generation.reason.mismatch": "El registro de sesión abrió {database}, que no es este archivo de biblioteca.",
    "generation.reason.pending": "La generación de la biblioteca todavía no se ha leído.",
    "generation.reason.unknown": "Hay un registro de sesión, pero no nombra Serato 4 ni Serato 5. Las escrituras y las restauraciones siguen desactivadas.",
    "generation.reason.unmounted": "El registro de sesión {log} nombró {database} en una unidad que no está conectada.",
    "generation.reason.version": "El registro de sesión más reciente, {log}, nombra Serato {version} y no nombra un archivo de base de datos.",
    "generation.serato4": "Serato 4",
    "generation.serato5": "Serato 5",
    "generation.unknown": "Versión desconocida",
    "gig.checkAgain": "Comprobar de nuevo",
    "gig.checking": "Comprobando la biblioteca…",
    "gig.cratesAdded": "Cajas añadidas",
    "gig.cratesEdited": "Cajas editadas",
    "gig.cratesRemoved": "Cajas eliminadas",
    "gig.cuesEdited": "Cues editados",
    "gig.done": "Listo",
    "gig.doneNotReady": "No listo para el bolo: {score}/100, se comprobó {crate} a las {time}",
    "gig.doneReady": "Listo para el bolo: {score}/100, se comprobó {crate} a las {time}",
    "gig.driveUnavailable": {
      one: "{name}: {count} pista no disponible",
      other: "{name}: {count} pistas no disponibles"
    },
    "gig.drives": "Unidades",
    "gig.drivesAction": "Comprobar unidades",
    "gig.drivesEmpty": "No hay unidades desconectadas.",
    "gig.emptyCrates": "Cajas vacías",
    "gig.emptyCratesAction": "Llenar cajas vacías",
    "gig.emptyCratesEmpty": "No hay cajas vacías.",
    "gig.exit": "Salir de la comprobación",
    "gig.gridsEdited": "Beatgrids editados",
    "gig.groupCount": "{label} ({count})",
    "gig.heading": "Comprobación del bolo",
    "gig.holding": "Lo que lo frena",
    "gig.missing": "Archivos que faltan",
    "gig.missingAction": "Buscar archivos que faltan",
    "gig.missingEmpty": "No falta ningún archivo.",
    "gig.noSnapshot": "No hay instantánea con la que comparar.",
    "gig.score": "{score}/100",
    "gig.scoreLabel": "Puntuación {score} de 100, {verdict}",
    "gig.showAll": "Mostrar las {count}",
    "gig.since": "Desde el último bolo",
    "gig.sinceAction": "Revisar cambios",
    "gig.sinceEmpty": "Nada cambió desde la última instantánea.",
    "gig.stepOf": "Paso {index} de {total}",
    "gig.streaming": "Streaming",
    "gig.streamingAction": "Revisar pistas en streaming",
    "gig.streamingEmpty": "No hay pistas en streaming.",
    "gig.tagsEdited": "Etiquetas editadas",
    "gig.tracksAdded": "Pistas añadidas",
    "gig.tracksRemoved": "Pistas eliminadas",
    "gig.unreachable": "No se pudo conectar con el servidor de la biblioteca. Comprueba que está en marcha y pulsa Comprobar de nuevo",
    "gig.unreadable": "No se pudo leer la comprobación del bolo.",
    "gig.verdictNotReady": "✕ No listo",
    "gig.verdictReady": "✓ Listo",
    "gig.wholeSpace": "Todo el espacio",
    "gig.wholeSpaceInline": "todo el espacio",
    "gig.wordNotReady": "no listo",
    "gig.wordReady": "listo",
    "help.bug": "Informar de un error",
    "help.bugTitle": "Informar de un error",
    "help.change": "Qué debería cambiar",
    "help.copied": "Copiado. Pégalo en el informe de GitHub.",
    "help.copyFailed": "No se pudo copiar el informe.",
    "help.copyLog": "Copiar registro",
    "help.diagnostics": "Qué se incluirá",
    "help.expected": "Qué esperabas",
    "help.feature": "Pedir una función",
    "help.featureTitle": "Pedir una función",
    "help.github": "Ver en GitHub",
    "help.happened": "Qué ocurrió",
    "help.loadFailed": "No se pudieron cargar los datos de diagnóstico.",
    "help.loading": "Cargando diagnóstico…",
    "help.logCopied": "Registro copiado.",
    "help.logEmpty": "El registro está vacío.",
    "help.names": "Incluir nombres de pistas y cajas del registro",
    "help.nothing": "No se envía nada hasta que lo envíes en GitHub.",
    "help.openGitHub": "Abrir en GitHub",
    "help.opened": "Abierto en el navegador. Revísalo y envíalo en GitHub.",
    "help.opening": "Abriendo…",
    "help.releases": "Notas de la versión",
    "help.reportText": "Texto del informe",
    "help.review": "Lo verás en GitHub antes de enviarlo. La app no lo publica.",
    "help.title": "Ayuda",
    "help.tooLong": "El informe es demasiado largo para un enlace. Se copió. Pégalo en el informe de GitHub.",
    "history.chooseSession": "Elige una sesión.",
    "history.file": "Archivo",
    "history.notes": "Notas",
    "history.openInLibrary": "Abrir en la biblioteca",
    "history.readFailed": "No se pudo leer el historial.",
    "history.session": "Sesión",
    "history.sessionFailed": "No se pudo leer esa sesión.",
    "history.sessions": "Sesiones del historial",
    "history.started": "Inicio",
    "import.added": {
      one: "{count} pista añadida.",
      other: "{count} pistas añadidas."
    },
    "import.button": "Importar",
    "import.defaultName": "Lista importada",
    "import.unmatched": {
      one: "{count} línea no coincidió con ninguna pista de la biblioteca.",
      other: "{count} líneas no coincidieron con ninguna pista de la biblioteca."
    },
    "layout.resize": "Cambiar el tamaño de la lista de pistas",
    "layout.resizeHint": "Arrastra para cambiar el tamaño. Doble clic para restablecerlo.",
    "layout.widthNotSaved": "No se pudo guardar el ancho del panel. La próxima vez vuelve al último ancho guardado.",
    "library.loading": "Cargando la biblioteca",
    "library.readFailed": "No se pudo leer la biblioteca ({status})",
    "library.unavailable": "Biblioteca no disponible",
    "list.label": "Pistas",
    "list.noMatches": "Ninguna pista coincide.",
    "list.readingDuplicates": "Leyendo duplicados",
    "logs.copied": "Registros copiados.",
    "logs.copiedTruncated": "Se copiaron las entradas más recientes del registro. Las más antiguas se omitieron.",
    "logs.copyFailed": "No se pudieron copiar los registros.",
    "logs.copyManual": "No se pudo copiar automáticamente. Selecciona el texto del registro y cópialo.",
    "logs.copying": "Copiando…",
    "logs.empty": "Todavía no hay entradas en el registro.",
    "logs.openFailed": "No se pudo abrir la carpeta de registros.",
    "logs.opened": "Se abrió la carpeta de registros.",
    "markers.beats": {
      one: "{count} tiempo",
      other: "{count} tiempos"
    },
    "markers.bpm": "{bpm} BPM",
    "markers.cue": "Punto de cue {number}",
    "markers.cueEmpty": "Vacío",
    "markers.flip": "Flip {number}",
    "markers.heading": "Puntos de cue, bucles guardados y beatgrid",
    "markers.loop": "Bucle guardado {number}",
    "markers.loopLocked": "Bucle guardado {number} bloqueado",
    "markers.none": "Este archivo no tiene puntos de cue de Serato.",
    "markers.readOnly": "Leídos del archivo de audio. No se vuelven a escribir.",
    "markers.unavailable": "El archivo no está en el disco, así que no se pueden leer los cues.",
    "menu.close": "Cerrar",
    "menu.exportRekordbox": "Exportar a Rekordbox",
    "menu.file": "Archivo",
    "menu.focusSearch": "Ir a la búsqueda",
    "menu.help": "Ayuda",
    "menu.library": "Biblioteca",
    "menu.minimize": "Minimizar",
    "menu.resetWidth": "Restablecer el ancho de la lista",
    "menu.tools": "Herramientas",
    "menu.window": "Ventana",
    "merge.addToCrates": "Añadir la copia conservada a {crates}.",
    "merge.addToSpace": "Añadir la copia conservada al espacio {space}.",
    "merge.alreadyInCrates": "La copia conservada ya está en todas las cajas que usan las demás. Se queda donde está.",
    "merge.confirmTrash": "Combinar y mover archivos a la Papelera",
    "merge.copiedCues": "{file} tenía los mejores {what}. Se copiaron al archivo que conservas.",
    "merge.copyCues": "{file} tiene los mejores {what}. Se copiarán al archivo que conservas.",
    "merge.copyCuesWhatBoth": "cues y beatgrid",
    "merge.copyCuesWhatGrid": "beatgrid",
    "merge.copyCuesWhatMarkers": "cues",
    "merge.fieldChange": "{label} cambia de {before} a {after}.",
    "merge.filesStay": "Los archivos de audio se quedan en el disco.",
    "merge.intro": "Conserva una copia. Las demás salen de la biblioteca. Los archivos de audio se quedan en el disco a menos que los muevas a la Papelera.",
    "merge.keep": "Copia que se conserva",
    "merge.keptCopy": "la copia conservada",
    "merge.merged": {
      one: "Se combinó {count} copia en {name}.",
      other: "Se combinaron {count} copias en {name}."
    },
    "merge.merging": "Combinando…",
    "merge.noCrates": "Ninguna de las copias está en una caja.",
    "merge.noFields": "No hay campos vacíos ni un número de reproducciones mayor que copiar.",
    "merge.noHistory": "Ninguna entrada del historial apunta a las otras copias.",
    "merge.noHistoryId": "Esta biblioteca no tiene un identificador de pista en el historial que se pueda reasignar.",
    "merge.plays": {
      one: "{count} reproducción",
      other: "{count} reproducciones"
    },
    "merge.previewFailed": "No se pudo leer la vista previa.",
    "merge.quitSerato": "Cierra Serato antes de combinar. La vista previa muestra el plan.",
    "merge.readingPreview": "Leyendo la vista previa…",
    "merge.removeCopies": {
      one: "Quitar {count} copia de la biblioteca.",
      other: "Quitar {count} copias de la biblioteca."
    },
    "merge.repointHistory": {
      one: "Apuntar {count} entrada del historial a la copia conservada.",
      other: "Apuntar {count} entradas del historial a la copia conservada."
    },
    "merge.title": "Combinar copias",
    "merge.trashFiles": "Mover {files} a la Papelera.",
    "merge.trashLabel": "Mover los otros archivos de audio a la Papelera",
    "merge.trashNote": "Desactivado por defecto. Los archivos van a la Papelera, desde donde puedes restaurarlos. No se eliminan para siempre.",
    "mode.duplicates": "Mismo título, artista y duración. Selecciona una copia y combina las demás en ella.",
    "mode.files": "Archivos en el disco. Los cues se quedan en el archivo de audio. Las cajas siguen la ruta.",
    "mode.gig": "Solo lectura. Esta comprobación no cambia la biblioteca.",
    "mode.missing": "Pistas cuyo archivo falta en una unidad conectada.",
    "mode.missingOffline": {
      one: "Pistas cuyo archivo falta en una unidad conectada. {count} pista en una unidad desconectada se marca como desconectada en las cajas.",
      other: "Pistas cuyo archivo falta en una unidad conectada. {count} pistas en unidades desconectadas se marcan como desconectadas en las cajas."
    },
    "mode.scan": "Solo lectura. Esta comprobación no cambia la biblioteca.",
    "mode.snapshots": "Copias verificadas por hash de la biblioteca, las cajas y los datos de Serato dentro de los archivos de audio. El audio en sí no se copia.",
    "mode.stems": "Pistas con un estado de análisis de stems.",
    "mode.tags": "Escribe en la biblioteca, no en los archivos de audio. Cierra Serato primero.",
    "operations.action.crateAdd": "Añadir a la caja",
    "operations.action.crateColor": "Color de la caja",
    "operations.action.crateCreate": "Crear caja",
    "operations.action.crateDelete": "Eliminar caja",
    "operations.action.crateExpanded": "Caja expandida",
    "operations.action.cratePrepare": "Preparar",
    "operations.action.crateRemove": "Quitar de la caja",
    "operations.action.crateRemoveLibrary": "Quitar de la biblioteca",
    "operations.action.crateRename": "Renombrar caja",
    "operations.action.crateRules": "Reglas de la caja",
    "operations.action.delete": "Eliminar archivo",
    "operations.action.importM3u": "Importar lista",
    "operations.action.mergeDuplicates": "Unir copias",
    "operations.action.move": "Mover archivo",
    "operations.action.moveFolder": "Mover carpeta",
    "operations.action.rename": "Renombrar archivo",
    "operations.action.renameFromTags": "Renombrar desde etiquetas",
    "operations.action.relink": "Reenlazar archivos",
    "operations.action.replace": "Mejorar archivo (conservar cues)",
    "operations.action.replaceInCrates": "Reemplazar en las cajas",
    "operations.action.restore": "Restaurar",
    "operations.action.restoreRecover": "Recuperar restauración",
    "operations.action.saveTrack": "Guardar pista",
    "operations.actionOther": "Edición de la biblioteca",
    "operations.beforeOnly": "Antes {before}.",
    "operations.empty": "Todavía no hay cambios comprobados. Cada edición y cada restauración aparecen aquí después de la comprobación.",
    "operations.entry": "{time}. {action}. {target}. {outcome}.",
    "operations.heading": "Registro de operaciones",
    "operations.noTarget": "la biblioteca",
    "operations.outcome.refused": "No se guardó",
    "operations.outcome.rollbackFailed": "No se pudo revertir",
    "operations.outcome.rolledBack": "Revertido",
    "operations.outcome.verified": "Comprobado",
    "operations.reading": "Leyendo el registro de operaciones",
    "operations.rollbackFailed": "Un cambio no se pudo revertir. La biblioteca puede no coincidir con la última copia buena. Esto no se guardó como un éxito.",
    "operations.snapshots": "Antes {before}. Después {after}.",
    "operations.unreadable": "No se pudo leer el registro de operaciones.",
    "plan.andMore": " y {count} más",
    "plan.cratesAdded": "Cajas añadidas",
    "plan.cratesChanged": "Cajas modificadas",
    "plan.cratesRegistered": "Cajas registradas para que Serato las conserve",
    "plan.cratesRemoved": "Cajas quitadas",
    "plan.cratesSkipped": "Cajas omitidas",
    "plan.cratesUnavailable": "Cajas en una unidad no disponible",
    "plan.cueChanges": "Cambios de cues",
    "plan.cueDiff": "{before} → {after}",
    "plan.deletedCrates": "Cajas eliminadas",
    "plan.deletedCues": "Cues eliminados",
    "plan.deletedGrids": "Beatgrids eliminados",
    "plan.deletedTracks": "Pistas eliminadas",
    "plan.files": {
      one: "{label}: {count} archivo",
      other: "{label}: {count} archivos"
    },
    "plan.gridChanges": "Cambios de beatgrid",
    "plan.item": "elemento",
    "plan.listed": "{label}: {count}. {names}",
    "plan.none": "{label}: ninguno",
    "plan.nothingChanged": "No se ha cambiado nada.",
    "plan.tracksAdded": "Pistas añadidas",
    "plan.tracksRemoved": "Pistas quitadas",
    "plan.tracksUnavailable": "Pistas en una unidad no disponible",
    "player.cannotPlay": "Este archivo no se puede reproducir en esta ventana.",
    "player.cue": "Marca",
    "player.duration": "Duración",
    "player.elapsed": "Transcurrido",
    "player.next": "Siguiente",
    "player.notInLibrary": "No está en la biblioteca o falta el archivo",
    "player.nothingPlaying": "Nada en reproducción",
    "player.overview": "Vista general de la pista",
    "player.overviewSeek": "Haz clic o arrastra para buscar",
    "player.pause": "Pausa",
    "player.play": "Reproducir",
    "player.previous": "Anterior",
    "player.region": "Reproductor",
    "player.seek": "Posición",
    "player.volume": "Volumen",
    "player.waveformReading": "Leyendo la forma de onda…",
    "player.waveformUnavailable": "Forma de onda no disponible para este formato",
    "player.zoomIn": "Acercar",
    "player.zoomOut": "Alejar",
    "portable.check": "Comprobar unidad",
    "portable.checkLabel": "Comprobar {name}",
    "portable.checking": "Comprobando esta unidad.",
    "portable.kindFileSize": "Archivo demasiado grande",
    "portable.kindMissing": "No está",
    "portable.kindOffDrive": "Fuera de esta unidad",
    "portable.kindPathLength": "Ruta demasiado larga",
    "portable.kindSmartCrate": "Caja inteligente",
    "portable.kindUnsafeName": "Nombre no válido",
    "portable.missing": "Esta unidad no está conectada. No se ha borrado nada.",
    "portable.notReady": "No está lista. Corrígelo en el portátil primero.",
    "portable.readOnly": "Esto solo lee la unidad. No se copia ni se borra nada.",
    "portable.ready": "Lista para salir del portátil.",
    "portable.title": "Unidad portátil",
    "portable.unreachable": "No se ha podido comprobar esta unidad.",
    "portable.unreadable": "No se ha podido leer esta unidad.",
    "presets.bpm": "BPM",
    "presets.button": "Preajuste",
    "presets.counting": "Contando pistas…",
    "presets.create": "Crear caja",
    "presets.created": {
      one: "{name} guardada con {count} pista.",
      other: "{name} guardada con {count} pistas."
    },
    "presets.intro": "La app elige las pistas y guarda una caja normal cuyo nombre termina en ⟳. Serato la reproduce como cualquier caja. Se actualiza cuando esta app se abre con Serato cerrado, o cuando pulsas Actualizar.",
    "presets.key": "Tonalidad",
    "presets.keyHelp": "Camelot, como 8A, o un nombre de tonalidad, como Am.",
    "presets.kind": "Preajuste",
    "presets.kind.bpm": "Rango de BPM",
    "presets.kind.harmonic": "Mezcla con una tonalidad",
    "presets.kind.unplayed": "Sin tocar últimamente",
    "presets.matches": {
      one: "Coincide {count} pista.",
      other: "Coinciden {count} pistas."
    },
    "presets.months": "Meses",
    "presets.name": "Nombre de la caja",
    "presets.name.bpm": "BPM {bpm} ±{range}",
    "presets.name.harmonic": "Mezcla con {key}",
    "presets.name.unplayed": {
      one: "Sin tocar en {count} mes",
      other: "Sin tocar en {count} meses"
    },
    "presets.range": "Más o menos",
    "presets.refresh": "Actualizar",
    "presets.refreshed": "{name} actualizada: {added} añadidas, {removed} quitadas.",
    "presets.refreshedOnOpen": {
      one: "Se actualizó {count} caja de preajuste.",
      other: "Se actualizaron {count} cajas de preajuste."
    },
    "presets.scope": "Solo pistas de {name} y sus subcajas",
    "presets.title": "Nueva caja a partir de un preajuste",
    "presets.updated": "⟳ actualizada {date}",
    "quickOpen.empty": "Escribe el nombre de una pista o de un archivo.",
    "quickOpen.file": "Archivo",
    "quickOpen.fileError": "No se pudieron buscar los archivos del disco. Las pistas que coinciden siguen en la lista.",
    "quickOpen.label": "Nombre",
    "quickOpen.matchCount": {
      one: "{count} coincidencia",
      other: "{count} coincidencias"
    },
    "quickOpen.matches": "Coincidencias",
    "quickOpen.none": "Ninguna pista ni archivo coincide con “{query}”.",
    "quickOpen.placeholder": "Nombre de la pista o del archivo",
    "quickOpen.searching": "Buscando archivos…",
    "quickOpen.title": "Buscar una pista o un archivo",
    "quickOpen.track": "Pista",
    "quickOpen.truncated": "Algunos archivos no se buscaron. Escribe más del nombre.",
    "rail.heading": "Biblioteca",
    "rating.none": "Sin valorar",
    "rating.stars": {
      one: "{count} estrella",
      other: "{count} estrellas"
    },
    "rekordbox.dialogTitle": "¿Descargar rekordbox.xml?",
    "rekordbox.download": "Descargar",
    "rekordbox.downloadTitle": "Descargar rekordbox.xml",
    "rekordbox.failed": "La exportación a Rekordbox falló.",
    "rekordbox.hotLoops": "Bucles de hot cue",
    "rekordbox.hotLoopsHelp": "Usa un pad de hot cue libre",
    "rekordbox.intro": "Estos elementos no se copian a Rekordbox. El archivo se descarga cuando confirmes.",
    "rekordbox.keyAsis": "Tono tal como está guardado",
    "rekordbox.keyCamelot": "Tono Camelot",
    "rekordbox.keyClassical": "Tono clásico",
    "rekordbox.keyNotation": "Notación de tono para Rekordbox",
    "rekordbox.memoryCues": "Cues de memoria",
    "rekordbox.notXml": "La exportación no generó un archivo XML.",
    "rekordbox.reportLabel": "Lo que no se copia",
    "related.confirmRemove": "¿Quitar el enlace con «{name}»?",
    "related.crateNote": "Crea o actualiza la caja «{name}». Serato debe estar cerrado.",
    "related.crateUpdated": "Caja «{name}» actualizada.",
    "related.find": "Buscar una pista para enlazar",
    "related.findPlaceholder": "Título o artista",
    "related.heading": "Mezcla bien con",
    "related.linkRating": "Valoración del enlace",
    "related.loadFailed": "No se pudo cargar Mezcla bien con.",
    "related.loading": "Cargando Mezcla bien con",
    "related.noPath": "Esta pista no tiene ruta de archivo, así que no se puede enlazar.",
    "related.noSuggestions": "No hay sugerencias por tono, tempo o cajas en común.",
    "related.noneSaved": "Todavía no hay enlaces guardados. Busca una pista o guarda una sugerencia.",
    "related.notInLibrary": "No está en esta biblioteca",
    "related.note": "Nota",
    "related.notePlaceholder": "mezclar al salir de",
    "related.oneWay": "En un sentido",
    "related.quitSerato": "Cierra Serato antes de escribir la caja.",
    "related.ratingOutOf": "{rating}/5",
    "related.removeLink": "Quitar el enlace con {name}",
    "related.removed": "Enlace quitado.",
    "related.saveLink": "Guardar enlace",
    "related.saveLinkTo": "Guardar enlace con {name}",
    "related.saved": "Enlace guardado.",
    "related.savedCount": "{count} guardados",
    "related.suggested": "Sugeridas por tono, tempo con un margen del 6 % y cajas en común. Guardar crea un enlace en ambos sentidos.",
    "related.thisTrack": "esta pista",
    "related.twoWay": "En ambos sentidos",
    "related.twoWayLink": "Enlace en ambos sentidos",
    "related.typeHint": "Escribe un título o un artista.",
    "related.updateCrate": "Actualizar caja de Serato",
    "relink.acceptHigh": "Aceptar todas las altas",
    "relink.choose": "Elige pistas para volver a enlazar.",
    "relink.confidence": "Confianza",
    "relink.confidence.high": "Alta",
    "relink.confidence.low": "Baja",
    "relink.confidence.medium": "Media",
    "relink.confirm": "Reenlazar",
    "relink.done": {
      one: "Se apuntó {count} pista faltante a su archivo.",
      other: "Se apuntaron {count} pistas faltantes a sus archivos."
    },
    "relink.empty": "No hay pistas faltantes en este espacio, o ninguna coincidió.",
    "relink.find": "Buscar coincidencias",
    "relink.finding": "Buscando…",
    "relink.include": "Reenlazar esta pista",
    "relink.intro": "Apunta las pistas faltantes a archivos que se movieron. El audio se queda donde está. Las cajas, el historial y los enlaces relacionados se mantienen.",
    "relink.match": "Coincidencia",
    "relink.none": "Todavía no hay coincidencias. Busca en las carpetas de música, o añade una carpeta extra después de cambiar de disco.",
    "relink.pick": "Elige un archivo",
    "relink.previewing": "Comprobando qué va a cambiar.",
    "relink.quitSerato": "Cierra Serato antes de reenlazar.",
    "relink.reason.folder": "Carpeta movida",
    "relink.reason.name": "Mismo nombre",
    "relink.reason.nameAndSize": "Mismo nombre y tamaño",
    "relink.reason.size": "Mismo tamaño",
    "relink.reason.unknown": "{reason}",
    "relink.relinking": "Reenlazando…",
    "relink.remap": "Carpeta movida: {from} → {to} ({count} pistas)",
    "relink.root": "Carpeta extra para buscar",
    "relink.rootHelp": "Opcional. Pega una carpeta después de cambiar de disco, por ejemplo /Volumes/NEW/DJ.",
    "relink.scanned": "Se buscaron {count} archivos.",
    "relink.selected": {
      one: "{count} seleccionada",
      other: "{count} seleccionadas"
    },
    "relink.title": "Reenlazar archivos faltantes",
    "relink.track": "Pista",
    "relink.truncated": "La búsqueda se detuvo a los 200.000 archivos. Añade una carpeta extra más cercana.",
    "relink.unavailable": {
      one: "{count} pista está en un disco que no está conectado. No se busca coincidencia.",
      other: "{count} pistas están en un disco que no está conectado. No se buscan coincidencias."
    },
    "relink.why": "Por qué",
    "rules.and": "y",
    "rules.label": "Reglas de la caja inteligente",
    "rules.matches": "Coincide",
    "rules.none": "todavía no hay reglas",
    "rules.or": "o",
    "rules.save": "Guardar reglas",
    "rules.saved": "Reglas guardadas.",
    "scan.checkFull": "Decodificación completa",
    "scan.checkQuick": "Comprobación rápida",
    "scan.checking": "Comprobando archivos…",
    "scan.decodeErrorDetail": "La decodificación se detuvo a los {detail}s",
    "scan.empty": "Ningún archivo dañado en esta comprobación.",
    "scan.heading": "Archivos dañados",
    "scan.intro": "La comprobación rápida lee el inicio de cada archivo. La decodificación completa necesita una caja porque puede tardar minutos.",
    "scan.notFound": {
      one: "Se omitió {count} pista no encontrada. Mira Archivos no encontrados.",
      other: "Se omitieron {count} pistas no encontradas. Mira Archivos no encontrados."
    },
    "scan.problem.decode_error": "Error de decodificación",
    "scan.problem.empty": "Archivo vacío",
    "scan.problem.serato_flagged": "Serato marcó este archivo como dañado",
    "scan.problem.short": "Más corto que la duración guardada",
    "scan.problem.undecodable": "No se pudo decodificar",
    "scan.problem.unknown": "Archivo dañado",
    "scan.problem.unreadable": "No se pudo leer el archivo",
    "scan.problem.wrong_format": "Formato incorrecto",
    "scan.row": "{title} ({file}) — {problem}",
    "scan.shortDetail": "Más corto que la duración guardada ({detail}s)",
    "scan.summary": {
      one: "{checked} archivos comprobados. {count} archivo dañado.",
      other: "{checked} archivos comprobados. {count} archivos dañados."
    },
    "scan.summaryClear": "{checked} archivos comprobados. Ninguno dañado.",
    "scan.unchecked": {
      one: "{count} archivo tiene una extensión que esta comprobación no conoce.",
      other: "{count} archivos tienen una extensión que esta comprobación no conoce."
    },
    "scan.unreachable": "No se pudo alcanzar el servidor de la biblioteca. Comprueba que está en marcha y pulsa Comprobación rápida",
    "scan.unreadable": "No se pudo leer la comprobación de archivos.",
    "scan.wrongFormatDetail": "Parece {detail}",
    "search.tracks": "Buscar pistas",
    "settings.about": "Acerca de",
    "settings.colorway": "Tema",
    "settings.colorway.classic": "Clásico",
    "settings.colorway.darkClub": "Club oscuro",
    "settings.colorway.light": "Claro",
    "settings.colorway.seratoLike": "Estilo Serato",
    "settings.colorwayPreview": "Vista previa del icono del tema",
    "settings.copyLogs": "Copiar registros",
    "settings.copyVersion": "Copiar versión",
    "settings.iconAppliedDock": "El icono del Dock coincide con este tema.",
    "settings.iconAppliedWindow": "El icono de la ventana y de la barra de tareas coincide con este tema.",
    "settings.iconDefault": "El icono de la app se queda en el habitual.",
    "settings.iconFollowsTheme": "El icono de la app sigue el tema",
    "settings.iconNotSaved": "No se pudo guardar el tema. Se usa hasta que cierres la app.",
    "settings.iconSaved": "Tema guardado.",
    "settings.iconUnsupported": "Este ordenador no puede cambiar el icono de la app en ejecución. La elección se guarda y se aplica en Mac y Windows.",
    "settings.language": "Idioma",
    "settings.languageNotSaved": "No se pudo guardar el idioma. Se usa hasta que cierres la app.",
    "settings.languageSystem": "El mismo que el sistema",
    "settings.logText": "Texto del registro",
    "settings.openLogs": "Abrir carpeta de registros",
    "settings.rerunSetup": "Repetir la configuración",
    "settings.share": "Compartir estadísticas de uso anónimas e informes de errores",
    "settings.title": "Ajustes",
    "settings.updates": "Buscar en GitHub una versión más nueva una vez al día",
    "settings.updatesFailed": "No se pudo guardar la opción de actualizaciones.",
    "settings.updatesPrereleases": "Incluir versiones de prueba (beta y candidatas)",
    "sharing.canSend": "Se pueden enviar recuentos anónimos e informes de errores.",
    "sharing.loadFailed": "No se pudieron cargar los ajustes de privacidad.",
    "sharing.loadFailedOff": "No se pudieron cargar los ajustes de privacidad. No se envía nada.",
    "sharing.noKeys": "Esta copia no tiene claves de telemetría, así que no se envía nada en ningún caso.",
    "sharing.nothingSent": "No se envía nada.",
    "sharing.off": "Compartir está desactivado. No se envía nada.",
    "sharing.on": "Compartir está activado. Se pueden enviar recuentos anónimos e informes de errores.",
    "shortcuts.action": "Acción",
    "shortcuts.cheatSheet": "Mostrar atajos",
    "shortcuts.dismiss": "Cerrar o borrar la búsqueda",
    "shortcuts.focusSearch": "Enfocar la búsqueda",
    "shortcuts.groupFind": "Buscar",
    "shortcuts.groupLists": "Listas",
    "shortcuts.groupPlay": "Reproducción",
    "shortcuts.groupViews": "Vistas",
    "shortcuts.intro": "Estas teclas funcionan en cualquier parte de esta pantalla, excepto mientras escribes en un campo. Esc sigue cerrando un diálogo o borrando una búsqueda.",
    "shortcuts.key": "Tecla",
    "shortcuts.listNext": "Fila siguiente",
    "shortcuts.listOpen": "Abrir la fila",
    "shortcuts.listPrevious": "Fila anterior",
    "shortcuts.open": "Atajos",
    "shortcuts.playNote": "Espacio reproduce o pausa. Izquierda retrocede 5 segundos. Derecha avanza 5 segundos.",
    "shortcuts.playPause": "Reproducir o pausar",
    "shortcuts.quickOpen": "Buscar una pista o un archivo",
    "shortcuts.seekBack": "Retroceder 5 segundos",
    "shortcuts.seekForward": "Avanzar 5 segundos",
    "shortcuts.title": "Atajos de teclado",
    "shortcuts.viewCrates": "Cajas",
    "shortcuts.viewFiles": "Organizar archivos",
    "shortcuts.viewHistory": "Historial",
    "shortcuts.viewLibrary": "Biblioteca",
    "shortcuts.viewSnapshots": "Copias de seguridad",
    "snapshots.backupDrives": "Copiar cajas de las unidades",
    "snapshots.backupDrivesBusy": "Copiando cajas de las unidades…",
    "snapshots.count": {
      one: "{count} copia",
      other: "{count} copias"
    },
    "snapshots.drivePermission": "{name} (sin permiso)",
    "snapshots.driveReadOnly": "{name} (solo lectura)",
    "snapshots.drivesAbsent": "Desconectadas, sin copiar: {drives}.",
    "snapshots.drivesAlready": "Esas cajas ya están en la copia de esta sesión.",
    "snapshots.drivesCopied": "Copiadas: {drives}.",
    "snapshots.drivesIntro": "Las cajas de las unidades conectadas se copian en la copia de este equipo.",
    "snapshots.drivesNone": "No había carpetas de unidades pendientes de copiar.",
    "snapshots.drivesSaved": "Las cajas de las unidades se copiaron en la copia de este equipo.",
    "snapshots.drivesSkipped": "Omitidas: {drives}.",
    "snapshots.empty": "Todavía no hay copias. Haz una copia para guardar un punto al que puedas volver. Las copias se conservan y esta página no las caduca.",
    "snapshots.noSearch": "Copias de seguridad no tiene búsqueda. Pulsa Ctrl+K para buscar una pista o un archivo.",
    "snapshots.outsideChange": "Algo ajeno a esta app cambió la carpeta de Serato. Se guardó una instantánea después de ese cambio. Deshacer restaura la instantánea anterior.",
    "snapshots.outsideChangeLexicon": "Lexicon cambió la carpeta de Serato. Se guardó una instantánea después de ese cambio. Deshacer restaura la instantánea anterior.",
    "snapshots.reading": "Leyendo copias",
    "snapshots.readingPlan": "Leyendo qué cambiaría",
    "snapshots.restore": "Restaurar",
    "snapshots.restoreIntro": "No se cambia nada hasta que confirmes. Primero se guarda una instantánea nueva, así que esta restauración se puede deshacer.",
    "snapshots.restoreTitle": "Restaurar esta copia",
    "snapshots.restored": "Restauración terminada. La biblioteca anterior se guardó primero, así que puedes deshacerla desde la lista.",
    "snapshots.restoring": "Restaurando…",
    "snapshots.reviewRestore": "Revisar restauración",
    "snapshots.reviewUndo": "Revisar deshacer",
    "snapshots.saved": "Copia guardada.",
    "snapshots.saving": "Guardando copia…",
    "snapshots.seratoUnknown": "Versión de Serato desconocida",
    "snapshots.seratoVersion": "Serato {version} (compilación {build})",
    "snapshots.skippedCrates": {
      one: "Restauración terminada. Se omitió {count} archivo de caja porque no se pudo leer su copia de la instantánea: {names}.",
      other: "Restauración terminada. Se omitieron {count} archivos de caja porque no se pudo leer su copia de la instantánea: {names}."
    },
    "snapshots.take": "Hacer una copia de seguridad",
    "snapshots.trigger": "instantánea",
    "snapshots.unavailableDrives": "No disponibles: {drives}.",
    "snapshots.unknownDrive": "Unidad desconocida",
    "snapshots.unknownTime": "Hora desconocida",
    "snapshots.unreadable": "No se pudieron leer las copias.",
    "space.appleMusic": "Apple Music",
    "space.label": "Espacio",
    "space.library": "Biblioteca",
    "space.prepare": "Prepare",
    "space.video": "Vídeo",
    "status.checking": "Comprobando Serato",
    "status.library": "Biblioteca",
    "tags.apply": "Aplicar",
    "tags.artist": "Artista",
    "tags.checking": "Leyendo grafías de etiquetas…",
    "tags.checkingTitles": "Leyendo títulos…",
    "tags.field": "Campo",
    "tags.genre": "Género",
    "tags.introTitles": "Quita números de pista, URL y (Original Mix). Pasa feat. a remixer cuando remixer está vacío. Pasa a mayúsculas iniciales los títulos en MAYÚSCULAS o minúsculas. Escribe en la biblioteca, no en los archivos de audio. Cierra Serato primero.",
    "tags.group": "{name} — {spellings}, {tracks}",
    "tags.heading": "Grafías de etiquetas",
    "tags.intro": "Elige una grafía por grupo. Escribe en la biblioteca, no en los archivos de audio. Cierra Serato primero.",
    "tags.noChanges": "Todas las pistas de este grupo ya usan esa grafía.",
    "tags.preview": "Revisar",
    "tags.previewLine": {
      one: "{from} → {to} ({count} pista)",
      other: "{from} → {to} ({count} pistas)"
    },
    "tags.previewLineRemixer": {
      one: "{from} → {to}, remixer {remixer} ({count} pista)",
      other: "{from} → {to}, remixer {remixer} ({count} pistas)"
    },
    "tags.previewSummary": {
      one: "{count} pista pasaría a {value}.",
      other: "{count} pistas pasarían a {value}."
    },
    "tags.row": "{value} ({count})",
    "tags.spellingCount": {
      one: "{count} grafía",
      other: "{count} grafías"
    },
    "tags.suggested": "Sugerida",
    "tags.summaryArtist": {
      one: "{values} grafías de artista en este espacio. {count} grupo con más de una grafía.",
      other: "{values} grafías de artista en este espacio. {count} grupos con más de una grafía."
    },
    "tags.summaryArtistClear": "Cada artista de este espacio usa una sola grafía.",
    "tags.summaryGenre": {
      one: "{values} grafías de género en este espacio. {count} grupo con más de una grafía.",
      other: "{values} grafías de género en este espacio. {count} grupos con más de una grafía."
    },
    "tags.summaryGenreClear": "Cada género de este espacio usa una sola grafía.",
    "tags.summaryTitles": {
      one: "{count} título de este espacio cambiaría.",
      other: "{count} títulos de este espacio cambiarían."
    },
    "tags.summaryTitlesClear": "Cada título de este espacio ya cumple las reglas de limpieza.",
    "tags.titles": "Títulos",
    "tags.titlesPreviewSummary": {
      one: "{count} título cambiaría.",
      other: "{count} títulos cambiarían."
    },
    "tags.titlesWritten": {
      one: "Se escribió el título limpio en {count} pista.",
      other: "Se escribieron los títulos limpios en {count} pistas."
    },
    "tags.trackCount": {
      one: "{count} pista",
      other: "{count} pistas"
    },
    "tags.unreachable": "No se pudo contactar con el servidor de la biblioteca. Comprueba que está en marcha y pulsa Comprobar de nuevo.",
    "tags.unreadable": "No se pudieron leer los grupos de etiquetas.",
    "tags.written": {
      one: "Se escribió {value} en {count} pista.",
      other: "Se escribió {value} en {count} pistas."
    },
    "tooltip.allTracks": "Muestra todas las pistas de este espacio. Ctrl/Cmd+1.",
    "tooltip.backupDrives": "Copia la carpeta Serato de cada unidad conectada en la copia de este equipo. Una unidad desconectada se anota y no se toca.",
    "tooltip.beatgridLock": "Bloquea la rejilla de tiempo para que Serato no la mueva.",
    "tooltip.chooseRelated": "Elige {name} como pista para enlazar.",
    "tooltip.collapseCrate": "Oculta las cajas que están dentro de {name}.",
    "tooltip.colorway": "Elige el tema. El icono de la app puede seguir esta elección.",
    "tooltip.consentAccept": "Comparte estadísticas anónimas e informes de fallos.",
    "tooltip.consentDecline": "No compartas estadísticas anónimas.",
    "tooltip.copyLogs": "Copia el texto del registro.",
    "tooltip.copyVersion": "Copia la versión de la aplicación.",
    "tooltip.crateColor": "Elige el color de la caja seleccionada.",
    "tooltip.crateDelete": "Elimina la caja seleccionada. Las pistas siguen en la biblioteca.",
    "tooltip.crateNew": "Crea una caja nueva.",
    "tooltip.crateFolderSync": "Añade a esta caja las pistas de la biblioteca cuyos archivos están en una carpeta. Los archivos que no están en la biblioteca se omiten.",
    "tooltip.crateRenameFromTags": "Renombra los archivos de esta caja a Artista - Título y conserva las rutas de las cajas.",
    "tooltip.cratePreset": "Crea una caja a partir de un preajuste: pistas que mezclan con una tonalidad, un rango de BPM o pistas sin tocar últimamente.",
    "tooltip.folderSyncCancel": "Cierra sin cambiar la caja.",
    "tooltip.folderSyncFull": "También quita las pistas cuyos archivos no están en esta carpeta.",
    "tooltip.folderSyncPath": "Carpeta de este ordenador cuyos archivos deben coincidir con esta caja.",
    "tooltip.folderSyncRun": "Actualiza esta caja para que coincida con la carpeta. Hay que salir de Serato DJ Pro.",
    "tooltip.folderSyncSubcrates": "Pone en la caja los archivos de esta carpeta y crea una subcaja por cada subcarpeta.",
    "tooltip.crateRefresh": "Vuelve a elegir las pistas de esta caja según su preajuste.",
    "tooltip.crateRename": "Cambia el nombre de la caja seleccionada.",
    "tooltip.crateSaveView": "Guarda las pistas de esta lista como una caja nueva. Hay que salir de Serato DJ Pro.",
    "tooltip.crateSearch": "Busca una caja por nombre. Esc borra la búsqueda.",
    "tooltip.crateSplit": "Muestra dos cajas a la vez. Alt-clic o Mayús-clic llena la otra lista.",
    "tooltip.cratesReplaceCancel": "Cierra sin cambiar las cajas.",
    "tooltip.cratesReplaceConfirm": "Pon la pista de reemplazo en esas cajas.",
    "tooltip.cratesReplaceKeep": "Deja las dos pistas en esas cajas. La de reemplazo queda en la misma posición.",
    "tooltip.cratesReplaceRetire": "Quita esta pista de esas cajas después de añadir la de reemplazo.",
    "tooltip.cratesReplaceSearch": "Busca la pista que debe entrar en esas cajas.",
    "tooltip.cue": "Lleva el cursor de reproducción a {label}.",
    "tooltip.editField": "Edita {label}. No se guarda nada hasta que guardes la pista.",
    "tooltip.expandCrate": "Muestra las cajas que están dentro de {name}.",
    "tooltip.exportM3u": "Descarga esta lista como un archivo de lista de reproducción.",
    "tooltip.exportRekordbox": "Descarga un archivo de lista que Rekordbox puede abrir. Confirmas antes de la descarga.",
    "tooltip.fileShortcut": "{name} es un acceso directo. No se puede abrir desde aquí.",
    "tooltip.filesCancel": "Cancela. No se cambia nada. Esc.",
    "tooltip.filesConfirm": "Guarda este cambio de archivo.",
    "tooltip.filesDelete": "Mueve los archivos seleccionados a la papelera.",
    "tooltip.filesElsewhere": "Examina una carpeta que no es una de las carpetas de música.",
    "tooltip.filesList": "Lista de carpetas. Arriba y Abajo cambian de fila. Intro abre la fila.",
    "tooltip.filesMove": "Mueve los archivos seleccionados a otra carpeta.",
    "tooltip.filesMoveFolder": "Mueve esta carpeta.",
    "tooltip.filesMoveHere": "Mueve los archivos a esta carpeta.",
    "tooltip.filesMoveTrash": "Mueve los archivos seleccionados a la papelera. Puedes restaurarlos desde allí.",
    "tooltip.filesMusicFolders": "Vuelve a las carpetas de música.",
    "tooltip.filesName": "Escribe el nombre nuevo del archivo.",
    "tooltip.filesPickCancel": "Cancela la elección de carpeta.",
    "tooltip.filesRefresh": "Actualiza esta carpeta desde el disco.",
    "tooltip.filesRename": "Cambia el nombre del archivo seleccionado.",
    "tooltip.filesRenameFromTags": "Renombra los archivos seleccionados a Artista - Título y conserva las rutas de las cajas.",
    "tooltip.filesReplace": "Mejora el archivo seleccionado y conserva sus puntos de cue.",
    "tooltip.filesReplacement": "Escribe la ruta del archivo de sustitución.",
    "tooltip.filesReview": "Revisa este cambio antes de guardarlo.",
    "tooltip.filesSearch": "Busca nombres de archivo. Ctrl/Cmd+F o /. Esc borra la búsqueda.",
    "tooltip.filesUp": "Sube a la carpeta superior.",
    "tooltip.findRelated": "Busca una pista para enlazar por título o artista.",
    "tooltip.gigBack": "Vuelve un paso atrás.",
    "tooltip.gigExit": "Sale de la comprobación y muestra las cajas.",
    "tooltip.gigNext": "Pasa al siguiente paso.",
    "tooltip.gigRefresh": "Vuelve a hacer la comprobación del bolo.",
    "tooltip.gigShowAll": "Muestra todos los elementos de esta lista.",
    "tooltip.help": "Abre Ayuda. Informa de un error o pide una función en GitHub. La app no lo publica.",
    "tooltip.helpBug": "Describe un error. GitHub se abre para que lo revises.",
    "tooltip.helpClose": "Cierra Ayuda. Esc.",
    "tooltip.helpCopyLog": "Copia el registro con tu carpeta personal reemplazada por ~.",
    "tooltip.helpExpected": "Qué esperabas que ocurriera.",
    "tooltip.helpFeature": "Describe una función. GitHub se abre para que la revises.",
    "tooltip.helpGithub": "Abre el proyecto en GitHub.",
    "tooltip.helpHappened": "Qué ocurrió, o qué debería cambiar.",
    "tooltip.helpNames": "Conserva los nombres de pistas y cajas en el registro copiado. Desactivado los omite.",
    "tooltip.helpOpen": "Abre el informe de GitHub ya rellenado. Tú lo envías allí.",
    "tooltip.helpReleases": "Abre las notas de la versión en GitHub.",
    "tooltip.helpReport": "El texto del informe, cuando no se pudo copiar.",
    "tooltip.hideSearchCopies": "Oculta los campos que se compararon.",
    "tooltip.hotLoops": "Copia los bucles a un pad de cue libre en el archivo de Rekordbox.",
    "tooltip.iconFollowsTheme": "Haz que el icono del Dock en Mac, o el de la ventana y la barra de tareas en Windows, coincida con el tema. Activado de forma predeterminada. El icono del Finder y el icono del programa en Windows no cambian.",
    "tooltip.importFile": "Elige un archivo de lista de reproducción para importar.",
    "tooltip.importM3u": "Añade pistas de un archivo de lista a una caja nueva.",
    "tooltip.keepCopy": "Conserva esta copia: {name}. Las demás salen de la biblioteca.",
    "tooltip.language": "Elige el idioma de esta ventana. Igual que el sistema sigue el idioma de este ordenador.",
    "tooltip.libraryGeneration": "Abre la nota que dice si el registro de sesión o el Serato instalado decidió que esta biblioteca es Serato 4, Serato 5 o una versión desconocida.",
    "tooltip.linkMutual": "Enlaza también esa pista de vuelta a esta.",
    "tooltip.linkNote": "Añade una nota a este enlace.",
    "tooltip.linkRating": "Valora este enlace de 1 a 5.",
    "tooltip.logFallback": "Texto del registro, cuando no se pudo copiar.",
    "tooltip.membership": "Añade esta pista a {name}, o quítala.",
    "tooltip.memoryCues": "Incluye los cues de memoria en el archivo de Rekordbox.",
    "tooltip.mergeCancel": "Cancela. No se fusiona nada. Esc.",
    "tooltip.mergeConfirm": "Fusiona las copias en la que conservas.",
    "tooltip.mergeConfirmTrash": "Fusiona las copias y mueve los otros archivos de audio a la papelera.",
    "tooltip.mergeDuplicates": "Fusiona las copias seleccionadas en la que conservas.",
    "tooltip.relink": "Busca archivos que se movieron y apunta las pistas faltantes a ellos.",
    "tooltip.relinkAcceptHigh": "Marca cada coincidencia cuya confianza es alta.",
    "tooltip.relinkCancel": "Cancela. No se escribe nada. Esc.",
    "tooltip.relinkConfirm": "Apunta las pistas marcadas a los archivos elegidos. El audio no se mueve.",
    "tooltip.relinkFind": "Busca en las carpetas de música, y en la carpeta extra si pegaste una.",
    "tooltip.relinkInclude": "Incluye esta pista en el reenlace.",
    "tooltip.relinkPick": "Elige qué archivo debe usar esta pista faltante.",
    "tooltip.relinkRoot": "Carpeta extra para buscar después de cambiar de disco. Déjala en blanco para usar las carpetas de música.",
    "tooltip.mergeTrash": "Mueve los otros archivos de audio a la papelera. Puedes restaurarlos desde allí.",
    "tooltip.merging": "Fusionando las copias.",
    "tooltip.missingDrive": "Conecta el disco que contiene {name} antes de abrirlo.",
    "tooltip.next": "Reproduce la pista siguiente de esta lista.",
    "tooltip.openCopy": "Abre esta otra copia, {name}.",
    "tooltip.openCrate": "Muestra las pistas de la caja {name}.",
    "tooltip.openCrumb": "Abre la carpeta {name}.",
    "tooltip.openFile": "Abre la carpeta {name}. Intro abre la fila resaltada.",
    "tooltip.openInLibrary": "Abre esta fila del historial en la biblioteca.",
    "tooltip.openLogs": "Abre la carpeta que contiene el registro.",
    "tooltip.openRelated": "Abre la pista enlazada {name}.",
    "tooltip.openReplaceCopy": "Usa {name} en las cajas donde está esta pista.",
    "tooltip.operationsList": "Registro de operaciones. Cada fila es una edición o una restauración comprobada.",
    "tooltip.operationsRefresh": "Actualiza el registro de operaciones.",
    "tooltip.operationsRetry": "Intenta leer el registro de operaciones otra vez.",
    "tooltip.overview": "Vista de toda la pista. Haz clic o arrastra para buscar. Izquierda retrocede 5 segundos. Derecha avanza 5 segundos.",
    "tooltip.playRow": "Empieza {name}. Espacio reproduce o pausa.",
    "tooltip.portableCheck": "Comprueba {name}. Lee sus cajas y lista lo que hay que corregir antes del bolo. No se escribe nada.",
    "tooltip.portableClose": "Cierra el informe de la unidad portátil.",
    "tooltip.prepareAdd": "Envía esta pista a Preparar.",
    "tooltip.prepareRemove": "Quita esta pista de Preparar.",
    "tooltip.presetBpm": "El tempo en el centro del rango.",
    "tooltip.presetCancel": "Cierra sin crear una caja.",
    "tooltip.presetCreate": "Guarda las pistas que coinciden como una caja nueva.",
    "tooltip.presetKey": "La tonalidad de partida. Se incluyen las pistas un paso a cada lado en la rueda Camelot y la tonalidad relativa.",
    "tooltip.presetKind": "Elige qué pistas reúne la caja.",
    "tooltip.presetMonths": "Pistas sin tocar en estos meses, incluidas las que nunca se tocaron.",
    "tooltip.presetName": "El nombre de la caja. Se añade ⟳ al final.",
    "tooltip.presetRange": "Cuánto puede subir o bajar una pista respecto a ese tempo.",
    "tooltip.presetScope": "Mira solo las pistas de la caja elegida y de las cajas que contiene.",
    "tooltip.previous": "Reproduce la pista anterior de esta lista.",
    "tooltip.quickOpen": "Busca una pista o un archivo por nombre. Ctrl/Cmd+K. Esc cierra este cuadro.",
    "tooltip.quickOpenClose": "Cierra la búsqueda. Esc.",
    "tooltip.quickOpenHit": "Abre {kind} {title}. Intro.",
    "tooltip.quickOpenHitDetail": "Abre {kind} {title}. {detail}. Intro.",
    "tooltip.quickOpenRetry": "Vuelve a buscar archivos.",
    "tooltip.rekordboxCancel": "Cancela. El archivo no se descarga. Esc.",
    "tooltip.rekordboxDownload": "Descarga el archivo de Rekordbox.",
    "tooltip.rekordboxKey": "Elige cómo se escriben las tonalidades en el archivo de Rekordbox.",
    "tooltip.reload": "Vuelve a cargar la biblioteca desde Serato.",
    "tooltip.relocate": "Apunta esta pista a otro archivo de audio.",
    "tooltip.removeRelated": "Quita el enlace guardado a {name}. El archivo de audio sigue en el disco.",
    "tooltip.removeTrack": "Quita esta pista de la biblioteca. El archivo de audio sigue en el disco.",
    "tooltip.rerunWizard": "Ejecuta la configuración otra vez.",
    "tooltip.reveal": "Muestra este archivo en {name}. La biblioteca no cambia.",
    "tooltip.reviewRestore": "Revisa qué cambiaría al restaurar esta instantánea.",
    "tooltip.runSetup": "Ejecuta la configuración para encontrar las carpetas de música.",
    "tooltip.saveLink": "Guarda este enlace.",
    "tooltip.saveRules": "Guarda las reglas de esta caja inteligente.",
    "tooltip.saveSuggestion": "Guarda un enlace en ambos sentidos a {name}. Serato no cambia hasta que actualices la caja.",
    "tooltip.saveTrack": "Guarda estos datos de la pista.",
    "tooltip.scanFull": "Decodifica cada archivo de la caja seleccionada. Elige una caja primero. Puede tardar minutos. No se escribe nada.",
    "tooltip.scanQuick": "Lee el inicio de cada archivo de audio. Aquí aparecen los archivos vacíos y el formato incorrecto. No se escribe nada.",
    "tooltip.search": "Busca pistas por título o artista. Filtra con bpm:120-128, bpm:124~3, key:8A o mix:8A (tonalidades que mezclan con 8A). Ctrl/Cmd+F o /. Esc borra la búsqueda.",
    "tooltip.seek": "Avanza por la pista. Izquierda retrocede 5 segundos. Derecha avanza 5 segundos. Mayús con una flecha salta 30 segundos.",
    "tooltip.selectFile": "Selecciona {name} para renombrar, mover o eliminar.",
    "tooltip.selectFilePath": "Selecciona {name} en {path} para renombrar, mover o eliminar.",
    "tooltip.selectRow": "Selecciona {name}. Intro abre esta fila.",
    "tooltip.session": "Muestra las pistas reproducidas en la sesión {name}.",
    "tooltip.settings": "Abre los ajustes.",
    "tooltip.settingsClose": "Cierra los ajustes. Esc.",
    "tooltip.shortcuts": "Atajos de teclado de esta pantalla. ? abre esta lista.",
    "tooltip.shortcutsClose": "Cierra la lista de atajos. Esc.",
    "tooltip.showSearchCopies": "Muestra los campos que se compararon.",
    "tooltip.smartRules": "Edita las reglas de la caja inteligente. No se guarda nada hasta que pulses Guardar reglas.",
    "tooltip.snapshotCancel": "Cancela. No se restaura nada. Esc.",
    "tooltip.snapshotConfirm": "Restaura esta instantánea. Antes se guarda una instantánea nueva.",
    "tooltip.snapshotsList": "Lista de instantáneas. Arriba y Abajo cambian de fila. Intro revisa la instantánea.",
    "tooltip.snapshotsRefresh": "Actualiza la lista de instantáneas.",
    "tooltip.snapshotsRetry": "Intenta leer las instantáneas otra vez.",
    "tooltip.snapshotsTake": "Guarda una copia de la biblioteca.",
    "tooltip.snapshotsUndo": "Revisa cómo deshacer el último cambio externo.",
    "tooltip.sortAdded": "Ordena las cajas por la fecha en que se añadieron.",
    "tooltip.sortArtist": "Ordena las pistas por artista.",
    "tooltip.sortBpm": "Ordena las pistas por tempo.",
    "tooltip.sortBy": "Ordena por {label}.",
    "tooltip.sortCrateName": "Ordena las cajas por nombre.",
    "tooltip.sortDeck": "Ordena el historial por plato.",
    "tooltip.sortKey": "Ordena las pistas por tonalidad.",
    "tooltip.sortLength": "Ordena las pistas por duración.",
    "tooltip.sortOrder": "Ordena las cajas en el orden guardado.",
    "tooltip.sortPlayed": "Ordena el historial según si la pista se reprodujo.",
    "tooltip.sortStart": "Ordena el historial por la hora de inicio.",
    "tooltip.sortTitle": "Ordena las pistas por título.",
    "tooltip.space": "Elige Biblioteca, Vídeo, Apple Music o Preparar.",
    "tooltip.splitter": "Arrastra para cambiar el ancho de la lista. Doble clic lo devuelve. Las flechas lo redimensionan.",
    "tooltip.tagsApply": "Escribe esta grafía en cada pista del grupo. Cierra Serato primero. Los archivos de audio no cambian.",
    "tooltip.tagsApplyTitles": "Escribe los títulos limpios. Cierra Serato primero. Los archivos de audio no cambian.",
    "tooltip.tagsArtist": "Muestra nombres de artista que son las mismas palabras escritas de otra forma.",
    "tooltip.tagsGenre": "Muestra géneros que son las mismas palabras escritas de otra forma.",
    "tooltip.tagsTitles": "Muestra títulos que cambiarían al quitar números, URL, Original Mix y feat., y al pasar a mayúsculas iniciales los que están en MAYÚSCULAS o minúsculas.",
    "tooltip.tagsGroup": "Abre o cierra este grupo de grafías.",
    "tooltip.tagsPreview": "Muestra qué pistas cambiarían antes de escribir en la biblioteca.",
    "tooltip.tagsRefresh": "Vuelve a cargar los grupos de grafías.",
    "tooltip.tagsSpelling": "Elige esta grafía para todas las pistas del grupo.",
    "tooltip.telemetry": "Activa o desactiva las estadísticas anónimas y los informes de fallos.",
    "tooltip.trackColor": "Elige un color para esta pista.",
    "tooltip.trackList": "Lista de pistas. Arriba y Abajo cambian de fila. Intro abre la fila. Espacio reproduce o pausa.",
    "tooltip.trackRating": "Elige una valoración para esta pista.",
    "tooltip.transport": "{action}. Espacio reproduce o pausa.",
    "tooltip.transportNamed": "{action} {name}. Espacio reproduce o pausa.",
    "tooltip.updateDismiss": "Ocultar hasta que la app se abra de nuevo.",
    "tooltip.updateDownload": "Abrir en el navegador la página de esta versión en GitHub.",
    "tooltip.updatePrereleases": "Avisar también de versiones beta y candidatas.",
    "tooltip.updateRelated": "Crea o actualiza la caja Relacionadas en Serato. Serato tiene que estar cerrado.",
    "tooltip.updateSkip": "No volver a avisar de esta versión.",
    "tooltip.updateToggle": "Preguntar a GitHub una vez al día si hay una versión más nueva.",
    "tooltip.useInCrates": "Pon otra pista en cada caja donde está esta, en la misma posición.",
    "tooltip.viewCrates": "Muestra las cajas. Ctrl/Cmd+2.",
    "tooltip.viewDuplicates": "Muestra pistas que parecen copias unas de otras.",
    "tooltip.viewFiles": "Muestra los archivos del disco. Ctrl/Cmd+3.",
    "tooltip.viewGig": "Comprueba la biblioteca antes del bolo. Solo lectura. No cambia nada.",
    "tooltip.viewHistory": "Muestra el historial. Ctrl/Cmd+4.",
    "tooltip.viewMissing": "Muestra las pistas cuyo archivo falta en una unidad conectada. Las pistas en una unidad desconectada se quedan en las cajas como desconectadas.",
    "tooltip.viewScan": "Busca archivos de audio vacíos, con el formato incorrecto o que no se pueden decodificar. Solo lectura.",
    "tooltip.viewSnapshots": "Abre las copias de seguridad. Copias comprobadas de la biblioteca, las cajas y los cues. Ctrl/Cmd+5.",
    "tooltip.viewStems": "Muestra las pistas que Serato ya analizó para stems. No separa el audio.",
    "tooltip.viewTags": "Agrupa grafías de género y artista que significan lo mismo. Escribe en la biblioteca, no en los archivos de audio.",
    "tooltip.volume": "Cambia el volumen de la reproducción.",
    "tooltip.wizard.checkAgain": "Vuelve a buscar la biblioteca de Serato.",
    "tooltip.wizard.continue": "Sigue al paso siguiente.",
    "tooltip.wizard.getStarted": "Empieza la configuración.",
    "tooltip.wizard.looking": "Buscando la biblioteca de Serato.",
    "tooltip.wizard.none": "Continúa la configuración.",
    "tooltip.wizard.openLibrary": "Termina la configuración y abre la biblioteca.",
    "tooltip.wizard.saving": "Guardando una copia de seguridad de la biblioteca.",
    "tooltip.wizard.takeSnapshot": "Guarda una copia de seguridad de la biblioteca.",
    "tooltip.wizard.tryAgain": "Intenta guardar la copia de seguridad otra vez.",
    "tooltip.wizard.useLibrary": "Usa la biblioteca que se encontró.",
    "tooltip.wizardBack": "Vuelve un paso en la configuración.",
    "tooltip.wizardCancel": "Cancela la configuración. La biblioteca no cambia. Esc.",
    "tooltip.wizardFolder": "Abre la carpeta {name}.",
    "tooltip.wizardFolderClose": "Cierra la lista de carpetas. Esc.",
    "tooltip.wizardFolderUp": "Sube a la carpeta superior.",
    "tooltip.wizardFolderUse": "Usa esta carpeta como biblioteca.",
    "tooltip.wizardNo": "No compartas estadísticas anónimas.",
    "tooltip.wizardSecondary": "Elige una carpeta que ya tenga una biblioteca de Serato.",
    "tooltip.wizardUpdatesNo": "No buscar versiones nuevas en GitHub.",
    "tooltip.wizardUpdatesYes": "Buscar en GitHub una versión nueva una vez al día.",
    "tooltip.wizardYes": "Comparte estadísticas anónimas e informes de fallos.",
    "tooltip.zoomIn": "Muestra un tramo más corto de la forma de onda alrededor del cursor.",
    "tooltip.zoomOut": "Muestra un tramo más largo de la forma de onda alrededor del cursor.",
    "track.missingBadge": "no encontrada",
    "track.offlineBadge": "desconectada",
    "track.numbered": "Pista {id}",
    "track.stemsBadge": "stems",
    "track.untitled": "Sin título",
    "update.available": "Ya está la versión {version}. Tienes la {current}.",
    "update.availableTest": "Ya está la versión de prueba {version}. Tienes la {current}.",
    "update.dismiss": "Ahora no",
    "update.download": "Descargar",
    "update.label": "Actualización disponible",
    "update.openFailed": "No se pudo abrir la página de la versión. Está en GitHub, en Releases.",
    "update.skip": "Omitir esta versión",
    "version.app": "Versión de la app",
    "version.copied": "Copiada",
    "version.copyFailed": "No se pudo copiar la versión.",
    "version.unavailable": "Versión no disponible",
    "view.crates": "Cajas",
    "view.duplicates": "Duplicados",
    "view.files": "Organizar archivos",
    "view.gig": "Antes del bolo",
    "view.group.health": "Salud de la biblioteca",
    "view.group.library": "Biblioteca",
    "view.history": "Historial",
    "view.label": "Vistas",
    "view.missing": "Archivos no encontrados",
    "view.scan": "Archivos dañados",
    "view.snapshots": "Copias de seguridad",
    "view.stems": "Stems",
    "view.tags": "Grafías de etiquetas",
    "wizard.action.checkAgain": "Volver a buscar",
    "wizard.action.continue": "Continuar",
    "wizard.action.getStarted": "Empezar",
    "wizard.action.looking": "Buscando…",
    "wizard.action.openLibrary": "Abrir mi biblioteca",
    "wizard.action.takeSnapshot": "Tomar una instantánea de seguridad",
    "wizard.action.tryAgain": "Reintentar",
    "wizard.action.useLibrary": "Usar esta biblioteca",
    "wizard.announce": "Paso {index} de {count}. {name}.",
    "wizard.blocked": "Cierra Serato DJ para continuar.",
    "wizard.chooseCheckAgain": "Elige Volver a buscar.",
    "wizard.chooseFolder": "Elegir una carpeta",
    "wizard.closeFolders": "Cerrar la lista de carpetas",
    "wizard.consentFailed": "No se pudo guardar esa elección. Inténtalo de nuevo.",
    "wizard.copySaved": "Copia de seguridad guardada.",
    "wizard.done": "Biblioteca lista. Instantánea guardada.",
    "wizard.finishFailed": "No se pudo guardar que terminaste la configuración. Inténtalo de nuevo.",
    "wizard.folders": "Carpetas",
    "wizard.genericError": "Algo salió mal. Inténtalo de nuevo.",
    "wizard.heading.consent": "¿Compartir estadísticas de uso anónimas e informes de errores?",
    "wizard.heading.library": "Encuentra tu biblioteca",
    "wizard.heading.snapshot": "Instantánea de seguridad",
    "wizard.heading.updates": "¿Buscar versiones nuevas?",
    "wizard.heading.welcome": "Mira tu biblioteca de Serato",
    "wizard.lookFailed": "No se pudo buscar tu biblioteca.",
    "wizard.looking": "Buscando tu biblioteca de Serato.",
    "wizard.no": "No, no compartir",
    "wizard.noSubfolders": "Esta carpeta no contiene otras carpetas.",
    "wizard.opening": "Abriendo…",
    "wizard.progressLabel": "Guardando una copia de seguridad",
    "wizard.saving": "Guardando…",
    "wizard.savingCopy": "Guardando una copia de seguridad…",
    "wizard.savingLibraryCopy": "Guardando una copia de seguridad de tu biblioteca.",
    "wizard.snapshotBody": "Se guarda una copia de seguridad de los datos de tu biblioteca antes de cambiar nada.",
    "wizard.snapshotFailed": "No se pudo guardar la copia de seguridad. Tu biblioteca no cambió. Inténtalo de nuevo.",
    "wizard.step.consent": "Compartir",
    "wizard.step.done": "Listo",
    "wizard.step.library": "Encuentra tu biblioteca",
    "wizard.step.snapshot": "Instantánea de seguridad",
    "wizard.step.updates": "Actualizaciones",
    "wizard.step.welcome": "Bienvenida",
    "wizard.stepOf": "Paso {index} de {count}",
    "wizard.updatesBody": "Una vez al día, la app puede preguntar a GitHub si hay una versión más nueva. GitHub ve tu dirección IP y la versión de esta app. No se envía nada de tu biblioteca. La búsqueda queda desactivada salvo que la actives, y puedes cambiarlo en Ajustes.",
    "wizard.updatesFailed": "No se pudo guardar la opción. Inténtalo de nuevo.",
    "wizard.updatesNo": "No, no buscar",
    "wizard.updatesYes": "Sí, buscar",
    "wizard.useFolder": "Usar esta carpeta",
    "wizard.welcomeBody": "Esta app muestra la biblioteca que Serato ya guarda en este equipo. No cambiará nada sin preguntar.",
    "wizard.yes": "Sí, compartir"
  };

  // src/i18n.ts
  var LANGUAGES = ["en", "es"];
  var PSEUDO = "qps-ploc";
  var CATALOGS = {
    en: en_default,
    es: es_default
  };
  var LOCALE_EVENT = "serato-locale";
  function isLanguage(value) {
    return typeof value === "string" && LANGUAGES.includes(value);
  }
  function getLocale() {
    const lang = typeof document === "undefined" ? "" : document.documentElement.lang;
    if (lang === PSEUDO) return PSEUDO;
    return isLanguage(lang) ? lang : "en";
  }
  function onLocaleChange(listener) {
    const handler = () => listener(getLocale());
    document.addEventListener(LOCALE_EVENT, handler);
    return () => document.removeEventListener(LOCALE_EVENT, handler);
  }
  var ACCENTS = {
    a: "à",
    e: "é",
    i: "ï",
    o: "ö",
    u: "ü",
    c: "ç",
    n: "ñ",
    y: "ý",
    A: "Å",
    E: "É",
    I: "Î",
    O: "Ø",
    U: "Û",
    C: "Ç",
    N: "Ñ",
    Y: "Ý"
  };
  function pseudo(text2) {
    const parts = text2.split(/(\{[a-zA-Z0-9_]+\})/);
    const body = parts.map((part) => part.startsWith("{") ? part : part.replace(/[a-zA-Z]/g, (ch) => ACCENTS[ch] ?? ch)).join("");
    const letters = text2.replace(/\{[a-zA-Z0-9_]+\}/g, "").length;
    const pad = "~".repeat(Math.max(1, Math.ceil(letters * 0.3)));
    return `[${body} ${pad}]`;
  }
  function catalogFor(locale) {
    return locale === PSEUDO ? CATALOGS.en : CATALOGS[locale];
  }
  function pick(message, count, locale) {
    if (typeof message === "string") return message;
    if (count === void 0) return message.other;
    const rules = new Intl.PluralRules(locale === PSEUDO ? "en" : locale);
    const exact = count === 0 ? message.zero : void 0;
    return exact ?? message[rules.select(count)] ?? message.other;
  }
  function fill(text2, params, locale) {
    if (!params) return text2;
    const tag = locale === PSEUDO ? "en" : locale;
    return text2.replace(/\{([a-zA-Z0-9_]+)\}/g, (whole, name) => {
      const value = params[name];
      if (value === void 0) return whole;
      return typeof value === "number" ? new Intl.NumberFormat(tag).format(value) : value;
    });
  }
  function t(key, params) {
    const locale = getLocale();
    const message = catalogFor(locale)[key] ?? CATALOGS.en[key];
    const count = typeof params?.count === "number" ? params.count : void 0;
    const template = pick(message, count, locale);
    return fill(locale === PSEUDO ? pseudo(template) : template, params, locale);
  }
  function hasKey(key) {
    return Object.prototype.hasOwnProperty.call(CATALOGS.en, key);
  }
  function codedText(text2, code, params) {
    if (typeof code === "string") {
      const key = `error.${code}`;
      if (hasKey(key)) return t(key, params ?? void 0);
    }
    return text2;
  }
  function serverMessage(body, fallback) {
    if (typeof body?.code === "string") return codedText(body.error || fallback, body.code, body.params);
    return body?.error || fallback;
  }

  // src/wizard.ts
  var STEP_NAME = {
    welcome: "wizard.step.welcome",
    library: "wizard.step.library",
    snapshot: "wizard.step.snapshot",
    consent: "wizard.step.consent",
    updates: "wizard.step.updates",
    done: "wizard.step.done"
  };
  function visibleSteps(needsConsent, needsUpdates = false) {
    const steps = ["welcome", "library", "snapshot"];
    if (needsConsent) steps.push("consent");
    if (needsUpdates) steps.push("updates");
    steps.push("done");
    return steps;
  }
  function stepsOf(model2) {
    return visibleSteps(model2.context.needsConsent, model2.context.needsUpdates);
  }
  function createWizard(input) {
    return {
      step: "welcome",
      complete: false,
      dismissed: false,
      context: {
        needsConsent: input.needsConsent,
        library: input.library,
        seratoRunning: input.seratoRunning,
        snapshot: "idle",
        consent: null,
        needsUpdates: input.needsUpdates ?? false,
        updates: null
      }
    };
  }
  function reduceWizard(model2, action) {
    if (model2.dismissed || model2.complete) return model2;
    switch (action.type) {
      case "cancel":
        return { ...model2, dismissed: true, complete: false };
      case "back":
        return goBack(model2);
      case "next":
        return goNext(model2);
      case "library":
        return { ...model2, context: { ...model2.context, library: action.status } };
      case "serato":
        return { ...model2, context: { ...model2.context, seratoRunning: action.running } };
      case "snapshot":
        return { ...model2, context: { ...model2.context, snapshot: action.phase } };
      case "consent":
        return goNext({ ...model2, context: { ...model2.context, consent: action.value } });
      case "updates":
        if (model2.step !== "updates") return model2;
        return goNext({ ...model2, context: { ...model2.context, updates: action.value } });
      case "finish":
        if (model2.step !== "done") return model2;
        return { ...model2, complete: true };
      default:
        return model2;
    }
  }
  function stepPosition(model2) {
    const steps = stepsOf(model2);
    const found = steps.indexOf(model2.step);
    const index = found < 0 ? 1 : found + 1;
    return { index, count: steps.length, name: t(STEP_NAME[model2.step]) };
  }
  function canGoBack(model2) {
    if (model2.dismissed || model2.complete) return false;
    if (model2.step === "snapshot" && model2.context.snapshot === "saving") return false;
    return stepsOf(model2).indexOf(model2.step) > 0;
  }
  function canAdvance(model2) {
    if (model2.dismissed || model2.complete) return false;
    switch (model2.step) {
      case "welcome":
        return true;
      case "library":
        return model2.context.library === "found";
      case "snapshot":
        return model2.context.snapshot === "saved";
      case "consent":
        return model2.context.consent !== null;
      case "updates":
        return model2.context.updates !== null;
      case "done":
        return false;
      default:
        return false;
    }
  }
  function snapshotBlocked(model2) {
    return model2.step === "snapshot" && model2.context.seratoRunning && model2.context.snapshot !== "saved";
  }
  function primaryAction(model2) {
    switch (model2.step) {
      case "welcome":
        return "get-started";
      case "library":
        if (model2.context.library === "pending") return "looking";
        if (model2.context.library === "found") return "use-library";
        return "check-again";
      case "snapshot":
        if (model2.context.snapshot === "saved") return "continue";
        if (model2.context.snapshot === "error") return "try-again";
        return "take-snapshot";
      case "consent":
      case "updates":
        return "none";
      case "done":
        return "open-library";
      default:
        return "none";
    }
  }
  function primaryEnabled(model2) {
    if (model2.dismissed || model2.complete) return false;
    const action = primaryAction(model2);
    if (action === "none" || action === "looking") return false;
    if (model2.step === "snapshot" && model2.context.snapshot === "saving") return false;
    if (snapshotBlocked(model2)) return false;
    return true;
  }
  function stepAnnouncement(model2) {
    const position = stepPosition(model2);
    return t("wizard.announce", { index: position.index, count: position.count, name: position.name });
  }
  function goBack(model2) {
    if (!canGoBack(model2)) return model2;
    const steps = stepsOf(model2);
    const index = steps.indexOf(model2.step);
    const previous = steps[index - 1];
    if (previous === void 0) return model2;
    return { ...model2, step: previous };
  }
  function goNext(model2) {
    if (!canAdvance(model2)) return model2;
    const steps = stepsOf(model2);
    const index = steps.indexOf(model2.step);
    const next = steps[index + 1];
    if (next === void 0) return model2;
    return { ...model2, step: next };
  }

  // src/tooltip-strings.ts
  function spec(key, params) {
    return params ? { key, params } : { key };
  }
  var tips = {
    space: spec("tooltip.space"),
    crateSearch: spec("tooltip.crateSearch"),
    mergeDuplicates: spec("tooltip.mergeDuplicates"),
    useInCrates: spec("tooltip.useInCrates"),
    cratesReplaceSearch: spec("tooltip.cratesReplaceSearch"),
    cratesReplaceKeep: spec("tooltip.cratesReplaceKeep"),
    cratesReplaceRetire: spec("tooltip.cratesReplaceRetire"),
    cratesReplaceCancel: spec("tooltip.cratesReplaceCancel"),
    cratesReplaceConfirm: spec("tooltip.cratesReplaceConfirm"),
    relink: spec("tooltip.relink"),
    relinkRoot: spec("tooltip.relinkRoot"),
    relinkFind: spec("tooltip.relinkFind"),
    relinkAcceptHigh: spec("tooltip.relinkAcceptHigh"),
    relinkConfirm: spec("tooltip.relinkConfirm"),
    relinkCancel: spec("tooltip.relinkCancel"),
    relinkInclude: spec("tooltip.relinkInclude"),
    relinkPick: spec("tooltip.relinkPick"),
    crateNew: spec("tooltip.crateNew"),
    crateRename: spec("tooltip.crateRename"),
    crateSplit: spec("tooltip.crateSplit"),
    crateSaveView: spec("tooltip.crateSaveView"),
    crateColor: spec("tooltip.crateColor"),
    crateDelete: spec("tooltip.crateDelete"),
    cratePreset: spec("tooltip.cratePreset"),
    crateFolderSync: spec("tooltip.crateFolderSync"),
    crateRenameFromTags: spec("tooltip.crateRenameFromTags"),
    crateRefresh: spec("tooltip.crateRefresh"),
    folderSyncPath: spec("tooltip.folderSyncPath"),
    folderSyncSubcrates: spec("tooltip.folderSyncSubcrates"),
    folderSyncFull: spec("tooltip.folderSyncFull"),
    folderSyncCancel: spec("tooltip.folderSyncCancel"),
    folderSyncRun: spec("tooltip.folderSyncRun"),
    presetKind: spec("tooltip.presetKind"),
    presetKey: spec("tooltip.presetKey"),
    presetBpm: spec("tooltip.presetBpm"),
    presetRange: spec("tooltip.presetRange"),
    presetMonths: spec("tooltip.presetMonths"),
    presetScope: spec("tooltip.presetScope"),
    presetName: spec("tooltip.presetName"),
    presetCancel: spec("tooltip.presetCancel"),
    presetCreate: spec("tooltip.presetCreate"),
    shortcuts: spec("tooltip.shortcuts"),
    help: spec("tooltip.help"),
    helpBug: spec("tooltip.helpBug"),
    helpFeature: spec("tooltip.helpFeature"),
    helpGithub: spec("tooltip.helpGithub"),
    helpReleases: spec("tooltip.helpReleases"),
    helpClose: spec("tooltip.helpClose"),
    helpHappened: spec("tooltip.helpHappened"),
    helpExpected: spec("tooltip.helpExpected"),
    helpNames: spec("tooltip.helpNames"),
    helpCopyLog: spec("tooltip.helpCopyLog"),
    helpOpen: spec("tooltip.helpOpen"),
    helpReport: spec("tooltip.helpReport"),
    settings: spec("tooltip.settings"),
    search: spec("tooltip.search"),
    exportM3u: spec("tooltip.exportM3u"),
    exportRekordbox: spec("tooltip.exportRekordbox"),
    memoryCues: spec("tooltip.memoryCues"),
    hotLoops: spec("tooltip.hotLoops"),
    rekordboxKey: spec("tooltip.rekordboxKey"),
    importM3u: spec("tooltip.importM3u"),
    importFile: spec("tooltip.importFile"),
    reload: spec("tooltip.reload"),
    filesUp: spec("tooltip.filesUp"),
    filesSearch: spec("tooltip.filesSearch"),
    filesRefresh: spec("tooltip.filesRefresh"),
    filesElsewhere: spec("tooltip.filesElsewhere"),
    filesMusicFolders: spec("tooltip.filesMusicFolders"),
    filesRename: spec("tooltip.filesRename"),
    filesRenameFromTags: spec("tooltip.filesRenameFromTags"),
    filesMove: spec("tooltip.filesMove"),
    filesMoveFolder: spec("tooltip.filesMoveFolder"),
    filesReplace: spec("tooltip.filesReplace"),
    filesDelete: spec("tooltip.filesDelete"),
    filesMoveHere: spec("tooltip.filesMoveHere"),
    filesPickCancel: spec("tooltip.filesPickCancel"),
    operationsRefresh: spec("tooltip.operationsRefresh"),
    operationsList: spec("tooltip.operationsList"),
    operationsRetry: spec("tooltip.operationsRetry"),
    snapshotsRefresh: spec("tooltip.snapshotsRefresh"),
    snapshotsTake: spec("tooltip.snapshotsTake"),
    backupDrives: spec("tooltip.backupDrives"),
    snapshotsUndo: spec("tooltip.snapshotsUndo"),
    consentDecline: spec("tooltip.consentDecline"),
    consentAccept: spec("tooltip.consentAccept"),
    telemetry: spec("tooltip.telemetry"),
    copyVersion: spec("tooltip.copyVersion"),
    rerunWizard: spec("tooltip.rerunWizard"),
    openLogs: spec("tooltip.openLogs"),
    copyLogs: spec("tooltip.copyLogs"),
    settingsClose: spec("tooltip.settingsClose"),
    logFallback: spec("tooltip.logFallback"),
    mergeTrash: spec("tooltip.mergeTrash"),
    mergeCancel: spec("tooltip.mergeCancel"),
    mergeConfirm: spec("tooltip.mergeConfirm"),
    mergeConfirmTrash: spec("tooltip.mergeConfirmTrash"),
    merging: spec("tooltip.merging"),
    rekordboxCancel: spec("tooltip.rekordboxCancel"),
    rekordboxDownload: spec("tooltip.rekordboxDownload"),
    filesName: spec("tooltip.filesName"),
    filesReplacement: spec("tooltip.filesReplacement"),
    filesCancel: spec("tooltip.filesCancel"),
    filesReview: spec("tooltip.filesReview"),
    filesConfirm: spec("tooltip.filesConfirm"),
    filesMoveTrash: spec("tooltip.filesMoveTrash"),
    shortcutsClose: spec("tooltip.shortcutsClose"),
    quickOpen: spec("tooltip.quickOpen"),
    quickOpenRetry: spec("tooltip.quickOpenRetry"),
    quickOpenClose: spec("tooltip.quickOpenClose"),
    snapshotCancel: spec("tooltip.snapshotCancel"),
    snapshotConfirm: spec("tooltip.snapshotConfirm"),
    wizardFolderUp: spec("tooltip.wizardFolderUp"),
    wizardFolderUse: spec("tooltip.wizardFolderUse"),
    wizardFolderClose: spec("tooltip.wizardFolderClose"),
    wizardNo: spec("tooltip.wizardNo"),
    wizardYes: spec("tooltip.wizardYes"),
    wizardUpdatesNo: spec("tooltip.wizardUpdatesNo"),
    wizardUpdatesYes: spec("tooltip.wizardUpdatesYes"),
    updateToggle: spec("tooltip.updateToggle"),
    updatePrereleases: spec("tooltip.updatePrereleases"),
    updateDownload: spec("tooltip.updateDownload"),
    updateSkip: spec("tooltip.updateSkip"),
    updateDismiss: spec("tooltip.updateDismiss"),
    wizardBack: spec("tooltip.wizardBack"),
    wizardCancel: spec("tooltip.wizardCancel"),
    wizardSecondary: spec("tooltip.wizardSecondary"),
    trackList: spec("tooltip.trackList"),
    filesList: spec("tooltip.filesList"),
    portableClose: spec("tooltip.portableClose"),
    snapshotsList: spec("tooltip.snapshotsList"),
    splitter: spec("tooltip.splitter"),
    previous: spec("tooltip.previous"),
    next: spec("tooltip.next"),
    seek: spec("tooltip.seek"),
    volume: spec("tooltip.volume"),
    zoomIn: spec("tooltip.zoomIn"),
    zoomOut: spec("tooltip.zoomOut"),
    overview: spec("tooltip.overview"),
    smartRules: spec("tooltip.smartRules"),
    saveRules: spec("tooltip.saveRules"),
    saveTrack: spec("tooltip.saveTrack"),
    trackColor: spec("tooltip.trackColor"),
    trackRating: spec("tooltip.trackRating"),
    beatgridLock: spec("tooltip.beatgridLock"),
    relocate: spec("tooltip.relocate"),
    removeTrack: spec("tooltip.removeTrack"),
    prepareAdd: spec("tooltip.prepareAdd"),
    prepareRemove: spec("tooltip.prepareRemove"),
    updateRelated: spec("tooltip.updateRelated"),
    findRelated: spec("tooltip.findRelated"),
    linkNote: spec("tooltip.linkNote"),
    linkRating: spec("tooltip.linkRating"),
    language: spec("tooltip.language"),
    colorway: spec("tooltip.colorway"),
    iconFollowsTheme: spec("tooltip.iconFollowsTheme"),
    libraryGeneration: spec("tooltip.libraryGeneration"),
    linkMutual: spec("tooltip.linkMutual"),
    saveLink: spec("tooltip.saveLink"),
    showSearchCopies: spec("tooltip.showSearchCopies"),
    hideSearchCopies: spec("tooltip.hideSearchCopies"),
    openInLibrary: spec("tooltip.openInLibrary"),
    runSetup: spec("tooltip.runSetup"),
    snapshotsRetry: spec("tooltip.snapshotsRetry"),
    reviewRestore: spec("tooltip.reviewRestore"),
    allTracks: spec("tooltip.allTracks"),
    viewCrates: spec("tooltip.viewCrates"),
    viewHistory: spec("tooltip.viewHistory"),
    viewMissing: spec("tooltip.viewMissing"),
    viewDuplicates: spec("tooltip.viewDuplicates"),
    viewStems: spec("tooltip.viewStems"),
    viewFiles: spec("tooltip.viewFiles"),
    viewSnapshots: spec("tooltip.viewSnapshots"),
    viewGig: spec("tooltip.viewGig"),
    viewScan: spec("tooltip.viewScan"),
    viewTags: spec("tooltip.viewTags"),
    tagsGenre: spec("tooltip.tagsGenre"),
    tagsArtist: spec("tooltip.tagsArtist"),
    tagsTitles: spec("tooltip.tagsTitles"),
    tagsRefresh: spec("tooltip.tagsRefresh"),
    tagsPreview: spec("tooltip.tagsPreview"),
    tagsApply: spec("tooltip.tagsApply"),
    tagsApplyTitles: spec("tooltip.tagsApplyTitles"),
    tagsGroup: spec("tooltip.tagsGroup"),
    tagsSpelling: spec("tooltip.tagsSpelling"),
    gigRefresh: spec("tooltip.gigRefresh"),
    scanQuick: spec("tooltip.scanQuick"),
    scanFull: spec("tooltip.scanFull"),
    gigBack: spec("tooltip.gigBack"),
    gigNext: spec("tooltip.gigNext"),
    gigExit: spec("tooltip.gigExit"),
    gigShowAll: spec("tooltip.gigShowAll"),
    sortTitle: spec("tooltip.sortTitle"),
    sortArtist: spec("tooltip.sortArtist"),
    sortBpm: spec("tooltip.sortBpm"),
    sortKey: spec("tooltip.sortKey"),
    sortLength: spec("tooltip.sortLength"),
    sortDeck: spec("tooltip.sortDeck"),
    sortPlayed: spec("tooltip.sortPlayed"),
    sortStart: spec("tooltip.sortStart"),
    sortOrder: spec("tooltip.sortOrder"),
    sortCrateName: spec("tooltip.sortCrateName"),
    sortAdded: spec("tooltip.sortAdded")
  };
  var WIZARD = {
    "get-started": "tooltip.wizard.getStarted",
    looking: "tooltip.wizard.looking",
    "use-library": "tooltip.wizard.useLibrary",
    "check-again": "tooltip.wizard.checkAgain",
    "take-snapshot": "tooltip.wizard.takeSnapshot",
    "try-again": "tooltip.wizard.tryAgain",
    continue: "tooltip.wizard.continue",
    "open-library": "tooltip.wizard.openLibrary",
    none: "tooltip.wizard.none"
  };
  function wizardPrimaryTip(action, saving) {
    if (saving) return spec("tooltip.wizard.saving");
    return spec(WIZARD[action]);
  }
  function wizardFolder(name) {
    return spec("tooltip.wizardFolder", { name });
  }

  // src/tooltip.ts
  var TOOLTIP_ID = "app-tooltip";
  var INTERACTIVE_SELECTOR = [
    "button",
    "input:not([type='hidden'])",
    "select",
    "textarea",
    "a[href]",
    "summary",
    "[role='slider']",
    "[role='button']",
    "[role='tab']",
    "[role='menuitem']",
    "[role='menuitemcheckbox']",
    "[role='menuitemradio']",
    "[role='switch']",
    "[role='option']",
    "[role='separator']",
    "[role='checkbox']",
    "[role='radio']",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");
  var current = null;
  var tipParams = /* @__PURE__ */ new WeakMap();
  function writeTooltip(element2) {
    const key = element2.dataset.tooltipKey ?? "";
    if (!hasKey(key)) throw new Error(`Unknown tooltip key ${key}.`);
    const value = t(key, tipParams.get(element2)).trim();
    if (!value) throw new Error("A control tooltip cannot be empty.");
    element2.dataset.tooltip = value;
  }
  function syncOpenTooltip() {
    if (!current) return;
    const tip = document.getElementById(TOOLTIP_ID);
    if (!(tip instanceof HTMLElement)) return;
    tip.textContent = current.dataset.tooltip ?? "";
  }
  function setTooltip(element2, spec2) {
    element2.dataset.tooltipKey = spec2.key;
    if (spec2.params) tipParams.set(element2, spec2.params);
    else tipParams.delete(element2);
    writeTooltip(element2);
    element2.removeAttribute("title");
    if (current === element2) syncOpenTooltip();
  }
  function buttonEl(spec2) {
    const element2 = document.createElement("button");
    element2.type = "button";
    setTooltip(element2, spec2);
    return element2;
  }

  // src/wizard-view.ts
  var LABELS = {
    "get-started": "wizard.action.getStarted",
    looking: "wizard.action.looking",
    "use-library": "wizard.action.useLibrary",
    "check-again": "wizard.action.checkAgain",
    "take-snapshot": "wizard.action.takeSnapshot",
    "try-again": "wizard.action.tryAgain",
    continue: "wizard.action.continue",
    "open-library": "wizard.action.openLibrary"
  };
  var HEADINGS = {
    welcome: "wizard.heading.welcome",
    library: "wizard.heading.library",
    snapshot: "wizard.heading.snapshot",
    consent: "wizard.heading.consent",
    updates: "wizard.heading.updates",
    done: "wizard.done"
  };
  var noteKey = (key) => () => t(key);
  var noteText = (value) => () => value;
  var wired = false;
  var starting = false;
  var generation = 0;
  var busy = false;
  var model = createWizard({
    needsConsent: true,
    library: "pending",
    seratoRunning: false
  });
  var options = {};
  var summary = null;
  var nextText = null;
  var statusNote = null;
  var folderOpen = false;
  var folderPath = "";
  var folderParent = null;
  var pollTimer = 0;
  var polling = false;
  function open(next = {}) {
    wire();
    if (starting) return;
    const dialog = wizardDialog();
    if (dialog.open && !next.force) return;
    options = next;
    starting = true;
    void begin(next).finally(() => {
      starting = false;
    });
  }
  function wire() {
    if (wired) return;
    wired = true;
    onLocaleChange(() => {
      if (wizardDialog().open) paint(false);
    });
    button("wizard-primary").addEventListener("click", () => {
      void onPrimary();
    });
    button("wizard-back").addEventListener("click", () => {
      onBack();
    });
    button("wizard-cancel").addEventListener("click", () => {
      cancel();
    });
    button("wizard-secondary").addEventListener("click", () => {
      void showFolders();
    });
    button("wizard-no").addEventListener("click", () => {
      void chooseConsent(false);
    });
    button("wizard-yes").addEventListener("click", () => {
      void chooseConsent(true);
    });
    button("wizard-updates-no").addEventListener("click", () => {
      void chooseUpdates(false);
    });
    button("wizard-updates-yes").addEventListener("click", () => {
      void chooseUpdates(true);
    });
    button("wizard-folder-up").addEventListener("click", () => {
      if (folderParent) void browse(folderParent);
    });
    button("wizard-folder-use").addEventListener("click", () => {
      void useFolder();
    });
    button("wizard-folder-close").addEventListener("click", () => {
      closeFolders();
    });
    wizardDialog().addEventListener("cancel", (event) => {
      event.preventDefault();
      if (folderOpen) {
        closeFolders();
        return;
      }
      cancel();
    });
  }
  async function begin(next) {
    generation += 1;
    const token = generation;
    stopPoll();
    folderOpen = false;
    statusNote = null;
    busy = false;
    const settings = await loadSettings();
    if (token !== generation) return;
    if (settings.wizard_complete && !next.force) return;
    const needsUpdates = await updateChoiceMissing();
    if (token !== generation) return;
    const setup = await loadSetup();
    if (token !== generation) return;
    summary = setup ? noteText(setup.summary) : noteKey("wizard.lookFailed");
    nextText = setup ? noteText(setup.next) : noteKey("wizard.chooseCheckAgain");
    if (setup) publishStatus(setup);
    const library = setup === null ? "error" : setup.found ? "found" : "missing";
    model = createWizard({
      needsConsent: settings.needs_consent_prompt,
      library,
      seratoRunning: setup?.seratoRunning ?? false,
      needsUpdates
    });
    paint(false);
    const dialog = wizardDialog();
    if (!dialog.open) dialog.showModal();
    text("wizard-announce").textContent = stepAnnouncement(model);
    text("wizard-title").focus();
    ensurePoll();
  }
  function onBack() {
    if (!canGoBack(model) || busy) return;
    folderOpen = false;
    statusNote = null;
    model = reduceWizard(model, { type: "back" });
    paint(true);
    ensurePoll();
  }
  function cancel() {
    generation += 1;
    stopPoll();
    folderOpen = false;
    busy = false;
    model = reduceWizard(model, { type: "cancel" });
    closeDialog();
  }
  async function onPrimary() {
    if (busy || !primaryEnabled(model)) return;
    const action = primaryAction(model);
    if (action === "get-started" || action === "use-library" || action === "continue") {
      folderOpen = false;
      statusNote = null;
      model = reduceWizard(model, { type: "next" });
      paint(true);
      ensurePoll();
      if (model.step === "snapshot") void refreshSerato();
      return;
    }
    if (action === "check-again") {
      await recheck();
      return;
    }
    if (action === "take-snapshot" || action === "try-again") {
      await takeSnapshot();
      return;
    }
    if (action === "open-library") {
      await finish();
    }
  }
  async function recheck() {
    const token = generation;
    busy = true;
    statusNote = null;
    paint(false);
    const setup = await loadSetup();
    if (token !== generation) return;
    busy = false;
    if (setup === null) {
      summary = noteKey("wizard.lookFailed");
      nextText = noteKey("wizard.chooseCheckAgain");
      model = reduceWizard(model, { type: "library", status: "error" });
    } else {
      summary = noteText(setup.summary);
      nextText = noteText(setup.next);
      publishStatus(setup);
      model = reduceWizard(model, { type: "serato", running: setup.seratoRunning });
      model = reduceWizard(model, { type: "library", status: setup.found ? "found" : "missing" });
    }
    paint(false);
  }
  async function takeSnapshot() {
    if (snapshotBlocked(model)) return;
    const token = generation;
    busy = true;
    statusNote = null;
    model = reduceWizard(model, { type: "snapshot", phase: "saving" });
    paint(false);
    try {
      await postJSON("/api/snapshots", { action: "create" }, 10 * 60 * 1e3);
      if (token !== generation) return;
      model = reduceWizard(model, { type: "snapshot", phase: "saved" });
    } catch {
      if (token !== generation) return;
      model = reduceWizard(model, { type: "snapshot", phase: "error" });
      statusNote = noteKey("wizard.snapshotFailed");
    } finally {
      if (token === generation) {
        busy = false;
        paint(false);
      }
    }
  }
  async function chooseConsent(value) {
    if (busy || model.step !== "consent") return;
    const token = generation;
    busy = true;
    statusNote = noteKey("wizard.saving");
    paint(false);
    try {
      const payload = await postJSON("/api/settings", { telemetry_consent: value }, 15e3);
      if (token !== generation) return;
      const settings = readSettings(payload);
      if (settings) options.onSettings?.(settings);
      busy = false;
      statusNote = null;
      model = reduceWizard(model, { type: "consent", value });
      paint(true);
    } catch {
      if (token !== generation) return;
      busy = false;
      statusNote = noteKey("wizard.consentFailed");
      paint(false);
    }
  }
  var UPDATE_CHOICE_EVENT = "serato-update-choice";
  async function chooseUpdates(value) {
    if (busy || model.step !== "updates") return;
    const token = generation;
    busy = true;
    statusNote = noteKey("wizard.saving");
    paint(false);
    try {
      await postJSON("/api/update", { enabled: value }, 15e3);
      if (token !== generation) return;
      busy = false;
      statusNote = null;
      model = reduceWizard(model, { type: "updates", value });
      window.dispatchEvent(new CustomEvent(UPDATE_CHOICE_EVENT, { detail: { enabled: value } }));
      paint(true);
    } catch {
      if (token !== generation) return;
      busy = false;
      statusNote = noteKey("wizard.updatesFailed");
      paint(false);
    }
  }
  async function updateChoiceMissing() {
    try {
      const payload = await getJSON("/api/update", 15e3);
      return isRecord(payload) && payload.enabled === null;
    } catch {
      return false;
    }
  }
  async function finish() {
    const token = generation;
    busy = true;
    statusNote = noteKey("wizard.opening");
    paint(false);
    try {
      const payload = await postJSON("/api/settings", { wizard_complete: true }, 15e3);
      if (token !== generation) return;
      const settings = readSettings(payload);
      if (settings) options.onSettings?.(settings);
      model = reduceWizard(model, { type: "finish" });
      closeDialog();
    } catch (error) {
      if (token !== generation) return;
      statusNote = error instanceof Error ? noteText(error.message) : noteKey("wizard.finishFailed");
      busy = false;
      paint(false);
    }
  }
  async function showFolders() {
    folderOpen = true;
    paint(false);
    await browse(folderPath);
  }
  function closeFolders() {
    folderOpen = false;
    paint(false);
    button("wizard-secondary").focus();
  }
  async function browse(path) {
    const token = generation;
    try {
      const query = path ? `?browse=${encodeURIComponent(path)}` : "?browse=";
      const payload = await getJSON(`/api/setup${query}`, 15e3);
      if (token !== generation) return;
      const listing = readBrowse(payload);
      if (!listing) {
        statusNote = noteKey("error.folder_unreadable");
        paint(false);
        return;
      }
      folderPath = listing.path;
      folderParent = listing.parent;
      text("wizard-folder-name").textContent = listing.name;
      fillFolders(listing.folders);
      button("wizard-folder-up").disabled = listing.parent === null;
      paint(false);
    } catch {
      if (token !== generation) return;
      statusNote = noteKey("error.folder_unreadable");
      paint(false);
    }
  }
  async function useFolder() {
    if (!folderPath || busy) return;
    const token = generation;
    busy = true;
    paint(false);
    try {
      const payload = await postJSON("/api/setup", { folder: folderPath }, 15e3);
      if (token !== generation) return;
      const setup = readSetup(payload);
      if (!setup) {
        statusNote = noteKey("error.folder_unreadable");
        return;
      }
      summary = noteText(setup.summary);
      nextText = noteText(setup.next);
      publishStatus(setup);
      model = reduceWizard(model, { type: "serato", running: setup.seratoRunning });
      model = reduceWizard(model, { type: "library", status: setup.found ? "found" : "missing" });
      if (setup.found) folderOpen = false;
      statusNote = null;
    } catch (error) {
      if (token !== generation) return;
      statusNote = error instanceof Error ? noteText(error.message) : noteKey("error.folder_unreadable");
    } finally {
      if (token === generation) {
        busy = false;
        paint(false);
        if (model.context.library === "found") button("wizard-primary").focus();
      }
    }
  }
  function fillFolders(folders) {
    const list = element("wizard-folder-list");
    list.replaceChildren();
    if (folders.length === 0) {
      const empty = document.createElement("p");
      empty.className = "wizard-folder-empty";
      empty.textContent = t("wizard.noSubfolders");
      list.append(empty);
      return;
    }
    for (const folder of folders) {
      const control = buttonEl(wizardFolder(folder.name));
      control.className = "wizard-folder";
      control.textContent = folder.name;
      const nextPath = folder.path;
      control.addEventListener("click", () => {
        void browse(nextPath);
      });
      list.append(control);
    }
  }
  function paint(moveFocus) {
    const position = stepPosition(model);
    text("wizard-step-label").textContent = t("wizard.stepOf", { index: position.index, count: position.count });
    paintSegments(position.index, position.count);
    paintArt();
    text("wizard-title").textContent = t(HEADINGS[model.step]);
    const body = bodyText();
    const bodyNode = text("wizard-body");
    bodyNode.textContent = body;
    bodyNode.hidden = body.length === 0;
    const hint = text("wizard-next");
    const hintText = nextText ? nextText() : "";
    const showHint = model.step === "library" && model.context.library !== "found" && hintText.length > 0;
    hint.hidden = !showHint;
    hint.textContent = showHint ? hintText : "";
    const status = statusFor();
    const statusNode = text("wizard-status");
    statusNode.textContent = status.text;
    statusNode.hidden = status.text.length === 0;
    statusNode.className = status.kind ? `wizard-status is-${status.kind}` : "wizard-status";
    paintProgress();
    element("wizard-consent").hidden = model.step !== "consent";
    element("wizard-updates").hidden = model.step !== "updates";
    element("wizard-folders").hidden = !(folderOpen && model.step === "library");
    const back = button("wizard-back");
    back.hidden = !canGoBack(model);
    back.disabled = busy;
    const secondary = button("wizard-secondary");
    secondary.hidden = model.step !== "library";
    secondary.disabled = busy;
    const primary = button("wizard-primary");
    const action = primaryAction(model);
    primary.hidden = action === "none";
    primary.textContent = model.context.snapshot === "saving" ? t("wizard.savingCopy") : action === "none" ? "" : t(LABELS[action]);
    setTooltip(primary, wizardPrimaryTip(action, model.context.snapshot === "saving"));
    primary.disabled = busy || !primaryEnabled(model);
    button("wizard-no").disabled = busy;
    button("wizard-yes").disabled = busy;
    button("wizard-updates-no").disabled = busy;
    button("wizard-updates-yes").disabled = busy;
    button("wizard-cancel").disabled = false;
    if (moveFocus) {
      text("wizard-announce").textContent = stepAnnouncement(model);
      text("wizard-title").focus();
    }
  }
  function bodyText() {
    switch (model.step) {
      case "welcome":
        return t("wizard.welcomeBody");
      case "library":
        if (model.context.library === "pending") return t("wizard.looking");
        return (summary ? summary() : "") || t("wizard.looking");
      case "snapshot":
        return t("wizard.snapshotBody");
      case "consent":
        return t("consent.body");
      case "updates":
        return t("wizard.updatesBody");
      case "done":
        return "";
      default:
        return "";
    }
  }
  function statusFor() {
    if (snapshotBlocked(model)) return { text: t("wizard.blocked"), kind: "blocked" };
    if (model.step === "snapshot" && model.context.snapshot === "saved") {
      return { text: t("wizard.copySaved"), kind: "saved" };
    }
    if (model.step === "snapshot" && model.context.snapshot === "saving") {
      return { text: t("wizard.savingLibraryCopy"), kind: "" };
    }
    if (statusNote) return { text: statusNote(), kind: "" };
    return { text: "", kind: "" };
  }
  function paintSegments(current2, count) {
    const host = element("wizard-segments");
    host.replaceChildren();
    for (let index = 1; index <= count; index += 1) {
      const segment = document.createElement("span");
      segment.className = "wizard-segment";
      if (index < current2) segment.dataset.state = "done";
      else if (index === current2) segment.dataset.state = "current";
      else segment.dataset.state = "upcoming";
      host.append(segment);
    }
  }
  function paintArt() {
    const slots = document.querySelectorAll(".wizard-art");
    slots.forEach((slot) => {
      const current2 = slot.dataset.artSlot === model.step;
      const hasArt = slot.querySelector("svg, img") !== null;
      slot.hidden = !(current2 && hasArt);
    });
  }
  function publishStatus(setup) {
    if (setup.statusMessage.length === 0) return;
    options.onStatus?.({
      message: setup.statusMessage,
      writable: setup.statusWritable,
      open: setup.seratoRunning,
      serato_running: setup.seratoRunning,
      process: setup.seratoRunning ? "Serato DJ" : null
    });
  }
  function paintProgress() {
    const node = element("wizard-progress");
    if (!(node instanceof HTMLProgressElement)) return;
    const saving = model.step === "snapshot" && model.context.snapshot === "saving";
    const saved = model.step === "snapshot" && model.context.snapshot === "saved";
    node.hidden = !saving && !saved;
    if (saving) node.removeAttribute("value");
    if (saved) node.value = 1;
  }
  function ensurePoll() {
    stopPoll();
    if (!wizardDialog().open) return;
    pollTimer = window.setInterval(() => {
      void refreshSerato();
    }, 2e3);
  }
  async function refreshSerato() {
    if (polling) return;
    if (!wizardDialog().open) {
      stopPoll();
      return;
    }
    polling = true;
    const token = generation;
    try {
      const setup = await loadSetup();
      if (token !== generation || !setup) return;
      publishStatus(setup);
      if (model.step !== "snapshot" || model.context.snapshot === "saved") return;
      const wasBlocked = snapshotBlocked(model);
      model = reduceWizard(model, { type: "serato", running: setup.seratoRunning });
      if (snapshotBlocked(model) !== wasBlocked) paint(false);
    } finally {
      polling = false;
    }
  }
  function stopPoll() {
    if (pollTimer) window.clearInterval(pollTimer);
    pollTimer = 0;
  }
  function closeDialog() {
    stopPoll();
    const dialog = wizardDialog();
    if (dialog.open) dialog.close();
    const target = options.returnFocus;
    if (target instanceof HTMLElement && target.isConnected) target.focus();
  }
  async function loadSettings() {
    try {
      const payload = await getJSON("/api/settings", 15e3);
      return readSettings(payload) ?? fallbackSettings();
    } catch {
      return fallbackSettings();
    }
  }
  async function loadSetup() {
    try {
      const payload = await getJSON("/api/setup", 15e3);
      return readSetup(payload);
    } catch {
      return null;
    }
  }
  function fallbackSettings() {
    return {
      telemetry_consent: null,
      needs_consent_prompt: true,
      wizard_complete: false,
      telemetry_configured: false,
      app_version: ""
    };
  }
  function readSettings(value) {
    if (!isRecord(value) || typeof value.needs_consent_prompt !== "boolean") return null;
    const consent = value.telemetry_consent;
    return {
      telemetry_consent: typeof consent === "boolean" ? consent : null,
      needs_consent_prompt: value.needs_consent_prompt,
      wizard_complete: value.wizard_complete === true,
      telemetry_configured: value.telemetry_configured === true,
      app_version: typeof value.app_version === "string" ? value.app_version : ""
    };
  }
  function readSetup(value) {
    if (!isRecord(value) || typeof value.found !== "boolean" || typeof value.summary !== "string") return null;
    return {
      found: value.found,
      summary: value.summary,
      next: typeof value.next === "string" ? value.next : "",
      seratoRunning: value.serato_running === true,
      statusMessage: typeof value.status_message === "string" ? value.status_message : "",
      statusWritable: value.status_writable === true
    };
  }
  function readBrowse(value) {
    if (!isRecord(value) || typeof value.path !== "string" || typeof value.name !== "string") return null;
    if (!Array.isArray(value.folders)) return null;
    const folders = [];
    for (const entry of value.folders) {
      if (!isRecord(entry) || typeof entry.name !== "string" || typeof entry.path !== "string") continue;
      folders.push({ name: entry.name, path: entry.path });
    }
    const parent = typeof value.parent === "string" ? value.parent : null;
    return { path: value.path, parent, name: value.name, folders };
  }
  async function getJSON(url, timeoutMs) {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(plainError(payload));
    return payload;
  }
  async function postJSON(url, body, timeoutMs) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs)
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(plainError(payload));
    return payload;
  }
  function plainError(payload) {
    const raw = isRecord(payload) && typeof payload.error === "string" ? payload.error : "";
    if (!raw || raw.includes("/") || raw.includes("\\") || raw.toLowerCase().includes("sqlite")) {
      return t("wizard.genericError");
    }
    const code = isRecord(payload) && typeof payload.code === "string" ? payload.code : void 0;
    return serverMessage({ error: raw, code }, raw);
  }
  function isRecord(value) {
    return typeof value === "object" && value !== null;
  }
  function wizardDialog() {
    const node = element("wizard");
    if (!(node instanceof HTMLDialogElement)) throw new Error("Missing wizard");
    return node;
  }
  function element(id) {
    const node = document.getElementById(id);
    if (!node) throw new Error(`Missing ${id}`);
    return node;
  }
  function text(id) {
    return element(id);
  }
  function button(id) {
    const node = element(id);
    if (!(node instanceof HTMLButtonElement)) throw new Error(`Missing ${id}`);
    return node;
  }
  return __toCommonJS(wizard_view_exports);
})();
//# sourceMappingURL=wizard.js.map
