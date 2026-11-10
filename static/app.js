"use strict";
(() => {
  // locales/en.json
  var en_default = {
    "bitrate.checking": "Checking bitrate…",
    "bitrate.confirmCrate": "Confirm crate",
    "bitrate.detail": " · {stated} kbps on the file, about {estimated} kbps from the spectrum",
    "bitrate.detailEstimate": " · about {estimated} kbps from the spectrum",
    "bitrate.empty": "No fake-320 or lossy-sourced files in this crate.",
    "bitrate.heading": "Suspect quality",
    "bitrate.intro": "Needs a crate because it decodes audio. Flags a file whose stated bitrate is much higher than the spectrum shows, or a lossless file made from a lossy one. This is a suspicion, not proof. Quit Serato before saving a crate.",
    "bitrate.notFound": {
      one: "{count} missing track was skipped. See Missing files.",
      other: "{count} missing tracks were skipped. See Missing files."
    },
    "bitrate.preview": {
      one: "{count} track would go into {name}. Confirm to write. Quit Serato first.",
      other: "{count} tracks would go into {name}. Confirm to write. Quit Serato first."
    },
    "bitrate.previewEmpty": "No flagged tracks to save.",
    "bitrate.reason.lossy_source": "Lossless file looks like it came from a lossy encode",
    "bitrate.reason.unknown": "Suspect quality",
    "bitrate.reason.upsampled": "Stated bitrate is much higher than the spectrum",
    "bitrate.row": "{title} ({file}) — {reason}{detail}",
    "bitrate.saveCrate": "Save crate",
    "bitrate.saving": "Saving crate…",
    "bitrate.summary": {
      one: "{checked} files checked. {count} suspect file.",
      other: "{checked} files checked. {count} suspect files."
    },
    "bitrate.summaryClear": "{checked} files checked. None look like fake 320s or lossy-sourced lossless.",
    "bitrate.tooQuiet": {
      one: "{count} file was too quiet or too short to measure.",
      other: "{count} files were too quiet or too short to measure."
    },
    "bitrate.unchecked": {
      one: "{count} file has an extension this check does not know.",
      other: "{count} files have an extension this check does not know."
    },
    "bitrate.unreadable": "The bitrate check could not be read.",
    "bitrate.unreadableFiles": {
      one: "{count} file could not be read.",
      other: "{count} files could not be read."
    },
    "bitrate.unreachable": "Couldn't reach the library server. Check it's running, then press Check again",
    "bitrate.written": {
      one: "Saved crate {name} with {count} track.",
      other: "Saved crate {name} with {count} tracks."
    },
    "color.blue": "Blue",
    "color.custom": "Custom",
    "color.green": "Green",
    "color.none": "None",
    "color.orange": "Orange",
    "color.pink": "Pink",
    "color.purple": "Purple",
    "color.red": "Red",
    "color.yellow": "Yellow",
    "column.added": "Added",
    "column.artist": "Artist",
    "column.bpm": "BPM",
    "column.deck": "Deck",
    "column.energy": "Energy",
    "column.genre": "Genre",
    "column.key": "Key",
    "column.lastPlayed": "Last",
    "column.played": "Played",
    "column.plays": "Plays",
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
    "drift.bpmRange": " ({min}–{max} BPM)",
    "drift.checking": "Checking tempo…",
    "drift.empty": "No drifting or live-looking tracks in this crate.",
    "drift.heading": "Tempo drift",
    "drift.intro": "Needs a crate because it decodes audio. Flags a wandering tempo, a live-looking name, or Serato's pending tempo-map mark. A grid that already changes tempo is skipped. This does not rewrite BPM.",
    "drift.mapped": {
      one: "{count} track already has a flexible beatgrid.",
      other: "{count} tracks already have a flexible beatgrid."
    },
    "drift.notFound": {
      one: "{count} missing track was skipped. See Missing files.",
      other: "{count} missing tracks were skipped. See Missing files."
    },
    "drift.reason.drifting": "Tempo wanders",
    "drift.reason.live": "Looks like a live recording",
    "drift.reason.pending_map": "Serato marked a pending tempo map",
    "drift.reason.unknown": "Needs a flexible beatgrid",
    "drift.row": "{title} ({file}) — {reasons}{bpm}",
    "drift.summary": {
      one: "{checked} files checked. {count} track may need a flexible beatgrid.",
      other: "{checked} files checked. {count} tracks may need a flexible beatgrid."
    },
    "drift.summaryClear": "{checked} files checked. None need a flexible beatgrid.",
    "drift.tooQuiet": {
      one: "{count} file was too quiet or too short to measure.",
      other: "{count} files were too quiet or too short to measure."
    },
    "drift.unchecked": {
      one: "{count} file has an extension this check does not know.",
      other: "{count} files have an extension this check does not know."
    },
    "drift.unreadableFiles": {
      one: "{count} file could not be read.",
      other: "{count} files could not be read."
    },
    "drift.unreachable": "Couldn't reach the library server. Check it's running, then press Check again",
    "drift.unreadable": "The tempo check could not be read.",
    "duplicates.readFailed": "Could not read duplicates.",
    "error.action_unavailable": "That action is not available.",
    "error.backup_no_space": "There is not enough disk space to back up the library.",
    "error.backup_serato_running": "Quit Serato DJ Pro before backing up drive crates. Serato DJ is still running, so nothing was copied.",
    "error.bitrate_needs_crate": "Choose a crate for a bitrate check.",
    "error.tempo_needs_crate": "Choose a crate for a tempo check.",
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
    "field.artist": "Artist",
    "field.beatgridLocked": "Beatgrid locked",
    "field.color": "Color",
    "field.comments": "Comments",
    "field.composer": "Composer",
    "field.emoji": "Emoji",
    "field.file": "File",
    "field.genre": "Genre",
    "field.grouping": "Grouping",
    "field.label": "Label",
    "field.rating": "Rating",
    "field.remixer": "Remixer",
    "field.title": "Title",
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
    "health.checking": "Checking the library…",
    "health.clear": "Nothing to fix in this check.",
    "health.duplicateRow": {
      one: "{title} ({count} copy)",
      other: "{title} ({count} copies)"
    },
    "health.bitrate": "Suspect quality",
    "health.bitrateNote": "Fake 320s and lossless files made from a lossy encode. Needs a crate because it decodes audio.",
    "health.duplicates": "Duplicate groups",
    "health.emptyGenre": "Empty genre",
    "health.fileRow": "{file}",
    "health.heading": "Library health",
    "health.intro": "Counts from the library and from audio files on disk. Each row opens the place that can fix it.",
    "health.missing": "Missing files",
    "health.more": {
      one: "{count} more.",
      other: "{count} more."
    },
    "health.noArtwork": "No artwork",
    "health.noBeatgrid": "No beatgrid",
    "health.noBpm": "No BPM",
    "health.noCrate": "Not in a crate",
    "health.noKey": "No key",
    "health.openBitrate": "Open Suspect quality",
    "health.openDuplicates": "Open Duplicates",
    "health.openFiles": "Open Files",
    "health.openMissing": "Open Missing files",
    "health.row": "{title}",
    "health.summary": {
      one: "{count} track checked.",
      other: "{count} tracks checked."
    },
    "health.unreadable": "Couldn't read the health report.",
    "health.unreachable": "Couldn't reach the library server. Check it's running, then press Check again.",
    "health.unused": "Unused files",
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
    "markers.gridEmpty": "The beatgrid has no markers.",
    "markers.gridHeading": "Beatgrid",
    "markers.gridNone": "No beatgrid in this file.",
    "markers.gridSuspect": "Suspect beatgrid. {reason}",
    "markers.gridTooMany": "The beatgrid has more than 4096 markers.",
    "markers.gridTooShort": "The beatgrid is too short to read.",
    "markers.gridTruncated": "The beatgrid is shorter than its marker count.",
    "markers.gridUnknown": "The beatgrid could not be read.",
    "markers.gridVersion": "That beatgrid version is not supported.",
    "markers.gridViewOnly": "View only. This app does not rewrite the beatgrid.",
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
    "mode.bitrate": "Needs a crate. Saving a crate writes the library. Quit Serato first.",
    "mode.drift": "Read-only. This check does not change the library.",
    "mode.duplicates": "Same title, artist, and length. Select a copy, then merge the others into it.",
    "mode.files": "Files on disk. Cue points stay in the audio file. Crates follow the path.",
    "mode.gig": "Read-only. This check does not change the library.",
    "mode.health": "Read-only. This report does not change the library.",
    "mode.missing": "Tracks whose files are missing on a connected drive.",
    "mode.missingOffline": {
      one: "Tracks whose files are missing on a connected drive. {count} track on an unplugged drive is marked offline in crates.",
      other: "Tracks whose files are missing on a connected drive. {count} tracks on unplugged drives are marked offline in crates."
    },
    "mode.portable": "Read-only. This check does not change the library.",
    "mode.scan": "Read-only. This check does not change the library.",
    "mode.snapshots": "Hash-checked copies of the library, crates, and Serato frames inside audio files. Audio itself is not copied.",
    "mode.stats": "Most played tracks and artists in a period. Making a crate from the idle list writes the library. Quit Serato first.",
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
    "portable.driveLabel": "Drive",
    "portable.kindFileSize": "File too large",
    "portable.kindMissing": "Missing",
    "portable.kindOffDrive": "Not on this drive",
    "portable.kindPathLength": "Path too long",
    "portable.kindSmartCrate": "Smart Crate",
    "portable.kindUnsafeName": "Unsafe name",
    "portable.missing": "This drive is not connected. Nothing was deleted.",
    "portable.noDrive": "No connected drive with a _Serato_ folder.",
    "portable.notReady": "Not ready. Fix these on the laptop first.",
    "portable.offlineNamed": "{name} is not connected. Nothing was deleted.",
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
    "search.fieldAll": "All fields",
    "search.fieldLabel": "Search field",
    "search.tracks": "Search tracks",
    "settings.about": "About crateCraft",
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
    "stats.artistTracks": "Tracks",
    "stats.artists": "Most played artists",
    "stats.checking": "Reading play stats…",
    "stats.confirmCrate": {
      one: "Create crate “{name}” with {count} track not played in {days} days? Serato must be quit.",
      other: "Create crate “{name}” with {count} tracks not played in {days} days? Serato must be quit."
    },
    "stats.csv": "Download CSV",
    "stats.empty": "No plays in this period.",
    "stats.emptyArtists": "No played artists in this period.",
    "stats.emptyIdle": "No idle tracks for this cutoff.",
    "stats.emptyTracks": "No played tracks in this period.",
    "stats.from": "From",
    "stats.heading": "Play stats",
    "stats.idle": "Not played",
    "stats.idleCrate": "Make crate",
    "stats.idleCrateName": "Not played in {days} days",
    "stats.idleDays": "Idle days",
    "stats.idleHint": "Tracks in this space not played in {days} days.",
    "stats.idleRow": "{title} — last played {last}",
    "stats.intro": "Most played tracks and artists in a period. The idle list can become a crate. Serato must be quit. This report does not change the library until you confirm the crate.",
    "stats.more": {
      one: "{count} more not shown.",
      other: "{count} more not shown."
    },
    "stats.never": "never",
    "stats.period": "Period",
    "stats.period.365": "Last 365 days",
    "stats.period.30": "Last 30 days",
    "stats.period.7": "Last 7 days",
    "stats.period.90": "Last 90 days",
    "stats.period.all": "All time",
    "stats.period.custom": "Custom dates",
    "stats.show": "Show",
    "stats.summary": "{plays} plays across {sessions} sessions.",
    "stats.to": "To",
    "stats.tracks": "Most played tracks",
    "stats.unreadable": "Could not read play stats.",
    "stats.unreachable": "Couldn't reach the library server to read play stats.",
    "stats.written": {
      one: "Created crate {name} with {count} track.",
      other: "Created crate {name} with {count} tracks."
    },
    "tags.apply": "Apply",
    "tags.applyMappings": "Apply saved mappings",
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
    "tags.mappingSummary": {
      one: "{count} track still uses a saved spelling.",
      other: "{count} tracks still use a saved spelling."
    },
    "tags.mappingWritten": {
      one: "Wrote saved spellings on {count} track.",
      other: "Wrote saved spellings on {count} tracks."
    },
    "tags.previewLine": {
      one: "{from} → {to} ({count} track)",
      other: "{from} → {to} ({count} tracks)"
    },
    "tags.previewLineField": {
      one: "{field}: {from} → {to} ({count} track)",
      other: "{field}: {from} → {to} ({count} tracks)"
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
    "tooltip.bitrateConfirm": "Create the Suspect quality crate. Serato has to be quit.",
    "tooltip.bitrateRefresh": "Run the bitrate check again on the selected crate.",
    "tooltip.bitrateSave": "Preview a Suspect quality crate of the flagged tracks. Nothing is written until you confirm. Quit Serato first.",
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
    "tooltip.healthOpenBitrate": "Open the bitrate check for this crate.",
    "tooltip.healthOpenDuplicates": "Open the Duplicates view.",
    "tooltip.healthOpenFiles": "Open the Files view.",
    "tooltip.healthOpenMissing": "Open the Missing files view.",
    "tooltip.healthRefresh": "Run the library health report again. Read-only.",
    "tooltip.healthTrack": "Open this track in Crates.",
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
    "tooltip.portableDrive": "Choose a connected drive that has a _Serato_ folder. An unplugged drive is named below and is not treated as a missing file.",
    "tooltip.portableRun": "Check the selected drive. Read its crates and list what to fix before the gig. Nothing is written.",
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
    "tooltip.search": "Search tracks by title or artist. Use the field menu to search comments, grouping, or composer. Filter with bpm:120-128, bpm:124~3, bpm:none, key:8A, key:none, mix:8A, missing:yes, nokeybpm:yes, cues:none, comments:, grouping:, or composer:. Ctrl/Cmd+F or /. Esc clears the search.",
    "tooltip.searchField": "Search one field. All fields is title, artist, album, genre, key, and file. Comments, grouping, and composer need this menu or comments:, grouping:, composer:.",
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
    "tooltip.sortDateAdded": "Sort tracks by the date they were added.",
    "tooltip.sortDeck": "Sort history by deck.",
    "tooltip.sortEnergy": "Sort tracks by energy (the star rating as 1 to 5).",
    "tooltip.sortGenre": "Sort tracks by genre.",
    "tooltip.sortKey": "Sort tracks by key.",
    "tooltip.sortLastPlayed": "Sort tracks by the last time they were played.",
    "tooltip.sortLength": "Sort tracks by length.",
    "tooltip.sortOrder": "Sort crates in the saved order.",
    "tooltip.sortPlayed": "Sort history by whether the track was played.",
    "tooltip.sortPlays": "Sort tracks by play count.",
    "tooltip.sortStart": "Sort history by the time it started.",
    "tooltip.sortTitle": "Sort tracks by title.",
    "tooltip.space": "Choose Library, Video, Apple Music, or Prepare.",
    "tooltip.splitter": "Drag to resize the track list. Double-click to put it back. Arrow keys resize it.",
    "tooltip.statsCsv": "Download this report as a spreadsheet. Read-only.",
    "tooltip.statsFrom": "First day of a custom period.",
    "tooltip.statsIdleCrate": "Preview a crate of tracks not played in this many days, then confirm. Serato must be quit.",
    "tooltip.statsIdleDays": "A track not played for this many days is listed. Default 365.",
    "tooltip.statsPeriod": "Limit most-played counts to this period. Idle tracks use Idle days, not this period.",
    "tooltip.statsRefresh": "Load play stats for this period.",
    "tooltip.statsTo": "Last day of a custom period.",
    "tooltip.tagsApply": "Write this spelling on every track in the group. Quit Serato first. Audio files stay as they are.",
    "tooltip.tagsApplyMappings": "Write saved genre and artist spellings on tracks that still use another form. Quit Serato first. Audio files stay as they are.",
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
    "tooltip.viewBitrate": "Flag files whose stated bitrate is much higher than the spectrum, or lossless files made from a lossy encode. Needs a crate. Saving a crate writes the library.",
    "tooltip.viewCrates": "Show crates. Ctrl/Cmd+2.",
    "tooltip.viewDrift": "Flag tracks whose tempo wanders, or that look like live recordings. Needs a crate. Read-only.",
    "tooltip.driftRefresh": "Run the tempo check again on the selected crate.",
    "tooltip.viewDuplicates": "Show tracks that look like copies of each other.",
    "tooltip.viewFiles": "Show files on disk. Ctrl/Cmd+3.",
    "tooltip.viewGig": "Check the library before a gig. Read-only.",
    "tooltip.viewHealth": "One-page counts of missing files, missing BPM or key, empty genre, tracks in no crate, and duplicates. Read-only.",
    "tooltip.viewHistory": "Show history. Ctrl/Cmd+4.",
    "tooltip.viewMissing": "Show tracks whose files are missing on a connected drive. Tracks on an unplugged drive stay in crates as offline.",
    "tooltip.viewPortable": "Check a portable Serato drive before a gig. Pick a connected drive. Read-only.",
    "tooltip.viewScan": "Find audio files that are empty, the wrong format, or will not decode. Read-only.",
    "tooltip.viewSnapshots": "Open backups. Hash-checked copies of the library, crates, and cue frames. Ctrl/Cmd+5.",
    "tooltip.viewStats": "Most played tracks and artists in a period, idle tracks, and a CSV of the report.",
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
    "view.bitrate": "Suspect quality",
    "view.crates": "Crates",
    "view.drift": "Tempo drift",
    "view.duplicates": "Duplicates",
    "view.files": "Organize files",
    "view.gig": "Before a gig",
    "view.group.gig": "Before a gig",
    "view.group.health": "Library health",
    "view.group.library": "Library",
    "view.health": "Library health",
    "view.history": "History",
    "view.label": "Views",
    "view.missing": "Missing files",
    "view.portable": "Check drive",
    "view.scan": "Damaged files",
    "view.snapshots": "Backups",
    "view.stats": "Play stats",
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
    "bitrate.checking": "Comprobando la tasa de bits…",
    "bitrate.confirmCrate": "Confirmar caja",
    "bitrate.detail": " · {stated} kbps en el archivo, unos {estimated} kbps según el espectro",
    "bitrate.detailEstimate": " · unos {estimated} kbps según el espectro",
    "bitrate.empty": "Ningún archivo de 320 falso ni procedente de un códec con pérdida en esta caja.",
    "bitrate.heading": "Calidad dudosa",
    "bitrate.intro": "Necesita una caja porque decodifica el audio. Marca un archivo cuya tasa de bits declarada es mucho más alta que la del espectro, o un archivo sin pérdida hecho a partir de uno con pérdida. Es una sospecha, no una prueba. Cierra Serato antes de guardar una caja.",
    "bitrate.notFound": {
      one: "Se omitió {count} pista no encontrada. Mira Archivos no encontrados.",
      other: "Se omitieron {count} pistas no encontradas. Mira Archivos no encontrados."
    },
    "bitrate.preview": {
      one: "{count} pista iría a {name}. Confirma para escribir. Cierra Serato primero.",
      other: "{count} pistas irían a {name}. Confirma para escribir. Cierra Serato primero."
    },
    "bitrate.previewEmpty": "No hay pistas marcadas para guardar.",
    "bitrate.reason.lossy_source": "El archivo sin pérdida parece venir de un códec con pérdida",
    "bitrate.reason.unknown": "Calidad dudosa",
    "bitrate.reason.upsampled": "La tasa de bits declarada es mucho más alta que la del espectro",
    "bitrate.row": "{title} ({file}) — {reason}{detail}",
    "bitrate.saveCrate": "Guardar caja",
    "bitrate.saving": "Guardando la caja…",
    "bitrate.summary": {
      one: "{checked} archivos comprobados. {count} archivo sospechoso.",
      other: "{checked} archivos comprobados. {count} archivos sospechosos."
    },
    "bitrate.summaryClear": "{checked} archivos comprobados. Ninguno parece un 320 falso ni un archivo sin pérdida de origen con pérdida.",
    "bitrate.tooQuiet": {
      one: "{count} archivo era demasiado silencioso o corto para medirlo.",
      other: "{count} archivos eran demasiado silenciosos o cortos para medirlos."
    },
    "bitrate.unchecked": {
      one: "{count} archivo tiene una extensión que esta comprobación no conoce.",
      other: "{count} archivos tienen una extensión que esta comprobación no conoce."
    },
    "bitrate.unreadable": "No se pudo leer la comprobación de tasa de bits.",
    "bitrate.unreadableFiles": {
      one: "No se pudo leer {count} archivo.",
      other: "No se pudieron leer {count} archivos."
    },
    "bitrate.unreachable": "No se pudo alcanzar el servidor de la biblioteca. Comprueba que está en marcha y pulsa Volver a comprobar",
    "bitrate.written": {
      one: "Se guardó la caja {name} con {count} pista.",
      other: "Se guardó la caja {name} con {count} pistas."
    },
    "color.blue": "Azul",
    "color.custom": "Personalizado",
    "color.green": "Verde",
    "color.none": "Ninguno",
    "color.orange": "Naranja",
    "color.pink": "Rosa",
    "color.purple": "Morado",
    "color.red": "Rojo",
    "color.yellow": "Amarillo",
    "column.added": "Añadida",
    "column.artist": "Artista",
    "column.bpm": "BPM",
    "column.deck": "Deck",
    "column.energy": "Energía",
    "column.genre": "Género",
    "column.key": "Tono",
    "column.lastPlayed": "Última",
    "column.played": "Reproducida",
    "column.plays": "Veces",
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
    "drift.bpmRange": " ({min}–{max} BPM)",
    "drift.checking": "Comprobando el tempo…",
    "drift.empty": "Ninguna pista con tempo inestable o aspecto en vivo en esta caja.",
    "drift.heading": "Tempo inestable",
    "drift.intro": "Necesita una caja porque decodifica el audio. Marca un tempo que se mueve, un nombre que parece en vivo o la marca de mapa de tempo pendiente de Serato. Se omite una parrilla que ya cambia de tempo. No reescribe el BPM.",
    "drift.mapped": {
      one: "{count} pista ya tiene una parrilla flexible.",
      other: "{count} pistas ya tienen una parrilla flexible."
    },
    "drift.notFound": {
      one: "Se omitió {count} pista no encontrada. Mira Archivos no encontrados.",
      other: "Se omitieron {count} pistas no encontradas. Mira Archivos no encontrados."
    },
    "drift.reason.drifting": "El tempo se mueve",
    "drift.reason.live": "Parece una grabación en vivo",
    "drift.reason.pending_map": "Serato marcó un mapa de tempo pendiente",
    "drift.reason.unknown": "Necesita una parrilla flexible",
    "drift.row": "{title} ({file}) — {reasons}{bpm}",
    "drift.summary": {
      one: "{checked} archivos comprobados. {count} pista puede necesitar una parrilla flexible.",
      other: "{checked} archivos comprobados. {count} pistas pueden necesitar una parrilla flexible."
    },
    "drift.summaryClear": "{checked} archivos comprobados. Ninguna necesita una parrilla flexible.",
    "drift.tooQuiet": {
      one: "{count} archivo era demasiado silencioso o corto para medirlo.",
      other: "{count} archivos eran demasiado silenciosos o cortos para medirlos."
    },
    "drift.unchecked": {
      one: "{count} archivo tiene una extensión que esta comprobación no conoce.",
      other: "{count} archivos tienen una extensión que esta comprobación no conoce."
    },
    "drift.unreadableFiles": {
      one: "No se pudo leer {count} archivo.",
      other: "No se pudieron leer {count} archivos."
    },
    "drift.unreachable": "No se pudo alcanzar el servidor de la biblioteca. Comprueba que está en marcha y pulsa Volver a comprobar",
    "drift.unreadable": "No se pudo leer la comprobación de tempo.",
    "duplicates.readFailed": "No se pudieron leer los duplicados.",
    "error.action_unavailable": "Esa acción no está disponible.",
    "error.backup_no_space": "No hay espacio suficiente en el disco para copiar la biblioteca.",
    "error.backup_serato_running": "Cierra Serato DJ Pro antes de copiar las cajas de las unidades. Serato DJ sigue abierto, así que no se copió nada.",
    "error.bitrate_needs_crate": "Elige una caja para comprobar la tasa de bits.",
    "error.tempo_needs_crate": "Elige una caja para comprobar el tempo.",
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
    "field.artist": "Artista",
    "field.beatgridLocked": "Beatgrid bloqueado",
    "field.color": "Color",
    "field.comments": "Comentarios",
    "field.composer": "Compositor",
    "field.emoji": "Emoji",
    "field.file": "Archivo",
    "field.genre": "Género",
    "field.grouping": "Agrupación",
    "field.label": "Sello",
    "field.rating": "Valoración",
    "field.remixer": "Remezclador",
    "field.title": "Título",
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
    "health.checking": "Comprobando la biblioteca…",
    "health.clear": "Nada que corregir en esta comprobación.",
    "health.duplicateRow": {
      one: "{title} ({count} copia)",
      other: "{title} ({count} copias)"
    },
    "health.bitrate": "Calidad dudosa",
    "health.bitrateNote": "Falsos 320 y archivos sin pérdida hechos a partir de un códec con pérdida. Necesita una caja porque decodifica el audio.",
    "health.duplicates": "Grupos duplicados",
    "health.emptyGenre": "Género vacío",
    "health.fileRow": "{file}",
    "health.heading": "Salud de la biblioteca",
    "health.intro": "Cifras de la biblioteca y de los archivos de audio en el disco. Cada fila abre el sitio que puede corregirlo.",
    "health.missing": "Archivos no encontrados",
    "health.more": {
      one: "{count} más.",
      other: "{count} más."
    },
    "health.noArtwork": "Sin carátula",
    "health.noBeatgrid": "Sin beatgrid",
    "health.noBpm": "Sin BPM",
    "health.noCrate": "En ninguna caja",
    "health.noKey": "Sin tonalidad",
    "health.openBitrate": "Abrir Calidad dudosa",
    "health.openDuplicates": "Abrir Duplicados",
    "health.openFiles": "Abrir Archivos",
    "health.openMissing": "Abrir Archivos no encontrados",
    "health.row": "{title}",
    "health.summary": {
      one: "{count} pista comprobada.",
      other: "{count} pistas comprobadas."
    },
    "health.unreadable": "No se pudo leer el informe de salud.",
    "health.unreachable": "No se pudo alcanzar el servidor de la biblioteca. Comprueba que está en marcha y pulsa Volver a comprobar.",
    "health.unused": "Archivos no usados",
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
    "markers.gridEmpty": "El beatgrid no tiene marcadores.",
    "markers.gridHeading": "Beatgrid",
    "markers.gridNone": "Este archivo no tiene beatgrid.",
    "markers.gridSuspect": "Beatgrid sospechoso. {reason}",
    "markers.gridTooMany": "El beatgrid tiene más de 4096 marcadores.",
    "markers.gridTooShort": "El beatgrid es demasiado corto para leerlo.",
    "markers.gridTruncated": "El beatgrid es más corto que el número de marcadores.",
    "markers.gridUnknown": "No se pudo leer el beatgrid.",
    "markers.gridVersion": "Esa versión de beatgrid no está admitida.",
    "markers.gridViewOnly": "Solo lectura. Esta app no reescribe el beatgrid.",
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
    "mode.bitrate": "Necesita una caja. Guardar una caja escribe en la biblioteca. Cierra Serato primero.",
    "mode.drift": "Solo lectura. Esta comprobación no cambia la biblioteca.",
    "mode.duplicates": "Mismo título, artista y duración. Selecciona una copia y combina las demás en ella.",
    "mode.files": "Archivos en el disco. Los cues se quedan en el archivo de audio. Las cajas siguen la ruta.",
    "mode.gig": "Solo lectura. Esta comprobación no cambia la biblioteca.",
    "mode.health": "Solo lectura. Este informe no cambia la biblioteca.",
    "mode.missing": "Pistas cuyo archivo falta en una unidad conectada.",
    "mode.missingOffline": {
      one: "Pistas cuyo archivo falta en una unidad conectada. {count} pista en una unidad desconectada se marca como desconectada en las cajas.",
      other: "Pistas cuyo archivo falta en una unidad conectada. {count} pistas en unidades desconectadas se marcan como desconectadas en las cajas."
    },
    "mode.portable": "Solo lectura. Esta comprobación no cambia la biblioteca.",
    "mode.scan": "Solo lectura. Esta comprobación no cambia la biblioteca.",
    "mode.snapshots": "Copias verificadas por hash de la biblioteca, las cajas y los datos de Serato dentro de los archivos de audio. El audio en sí no se copia.",
    "mode.stats": "Las pistas y artistas más reproducidos en un periodo. Crear una caja con las pistas inactivas escribe en la biblioteca. Cierra Serato primero.",
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
    "portable.driveLabel": "Unidad",
    "portable.kindFileSize": "Archivo demasiado grande",
    "portable.kindMissing": "No está",
    "portable.kindOffDrive": "Fuera de esta unidad",
    "portable.kindPathLength": "Ruta demasiado larga",
    "portable.kindSmartCrate": "Caja inteligente",
    "portable.kindUnsafeName": "Nombre no válido",
    "portable.missing": "Esta unidad no está conectada. No se ha borrado nada.",
    "portable.noDrive": "No hay ninguna unidad conectada con una carpeta _Serato_.",
    "portable.notReady": "No está lista. Corrígelo en el portátil primero.",
    "portable.offlineNamed": "{name} no está conectada. No se ha borrado nada.",
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
    "search.fieldAll": "Todos los campos",
    "search.fieldLabel": "Campo de búsqueda",
    "search.tracks": "Buscar pistas",
    "settings.about": "Acerca de crateCraft",
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
    "stats.artistTracks": "Pistas",
    "stats.artists": "Artistas más reproducidos",
    "stats.checking": "Leyendo estadísticas de reproducción…",
    "stats.confirmCrate": {
      one: "¿Crear la caja “{name}” con {count} pista no reproducida en {days} días? Hay que cerrar Serato.",
      other: "¿Crear la caja “{name}” con {count} pistas no reproducidas en {days} días? Hay que cerrar Serato."
    },
    "stats.csv": "Descargar CSV",
    "stats.empty": "No hay reproducciones en este periodo.",
    "stats.emptyArtists": "No hay artistas reproducidos en este periodo.",
    "stats.emptyIdle": "No hay pistas inactivas para este corte.",
    "stats.emptyTracks": "No hay pistas reproducidas en este periodo.",
    "stats.from": "Desde",
    "stats.heading": "Estadísticas",
    "stats.idle": "Sin reproducir",
    "stats.idleCrate": "Crear caja",
    "stats.idleCrateName": "Sin reproducir en {days} días",
    "stats.idleDays": "Días inactivos",
    "stats.idleHint": "Pistas de este espacio no reproducidas en {days} días.",
    "stats.idleRow": "{title} — última vez {last}",
    "stats.intro": "Las pistas y artistas más reproducidos en un periodo. La lista inactiva puede convertirse en una caja. Hay que cerrar Serato. Este informe no cambia la biblioteca hasta que confirmes la caja.",
    "stats.more": {
      one: "{count} más no se muestra.",
      other: "{count} más no se muestran."
    },
    "stats.never": "nunca",
    "stats.period": "Periodo",
    "stats.period.365": "Últimos 365 días",
    "stats.period.30": "Últimos 30 días",
    "stats.period.7": "Últimos 7 días",
    "stats.period.90": "Últimos 90 días",
    "stats.period.all": "Todo",
    "stats.period.custom": "Fechas",
    "stats.show": "Mostrar",
    "stats.summary": "{plays} reproducciones en {sessions} sesiones.",
    "stats.to": "Hasta",
    "stats.tracks": "Pistas más reproducidas",
    "stats.unreadable": "No se pudieron leer las estadísticas de reproducción.",
    "stats.unreachable": "No se pudo alcanzar el servidor de la biblioteca para leer las estadísticas de reproducción.",
    "stats.written": {
      one: "Se creó la caja {name} con {count} pista.",
      other: "Se creó la caja {name} con {count} pistas."
    },
    "tags.apply": "Aplicar",
    "tags.applyMappings": "Aplicar grafías guardadas",
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
    "tags.mappingSummary": {
      one: "{count} pista aún usa una grafía guardada.",
      other: "{count} pistas aún usan una grafía guardada."
    },
    "tags.mappingWritten": {
      one: "Se escribió la grafía guardada en {count} pista.",
      other: "Se escribieron las grafías guardadas en {count} pistas."
    },
    "tags.previewLine": {
      one: "{from} → {to} ({count} pista)",
      other: "{from} → {to} ({count} pistas)"
    },
    "tags.previewLineField": {
      one: "{field}: {from} → {to} ({count} pista)",
      other: "{field}: {from} → {to} ({count} pistas)"
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
    "tooltip.bitrateConfirm": "Crea la caja Calidad dudosa. Serato tiene que estar cerrado.",
    "tooltip.bitrateRefresh": "Vuelve a comprobar la tasa de bits de la caja seleccionada.",
    "tooltip.bitrateSave": "Previsualiza una caja Calidad dudosa con las pistas marcadas. No se escribe nada hasta que confirmes. Cierra Serato primero.",
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
    "tooltip.healthOpenBitrate": "Abre la comprobación de tasa de bits de esta caja.",
    "tooltip.healthOpenDuplicates": "Abre la vista Duplicados.",
    "tooltip.healthOpenFiles": "Abre la vista Archivos.",
    "tooltip.healthOpenMissing": "Abre la vista Archivos no encontrados.",
    "tooltip.healthRefresh": "Vuelve a generar el informe de salud de la biblioteca. Solo lectura.",
    "tooltip.healthTrack": "Abre esta pista en Cajas.",
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
    "tooltip.portableDrive": "Elige una unidad conectada que tenga una carpeta _Serato_. Una unidad desconectada se nombra debajo y no se trata como un archivo no encontrado.",
    "tooltip.portableRun": "Comprueba la unidad elegida. Lee sus cajas y lista lo que hay que corregir antes del bolo. No se escribe nada.",
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
    "tooltip.search": "Busca pistas por título o artista. Usa el menú de campo para comentarios, agrupación o compositor. Filtra con bpm:120-128, bpm:124~3, bpm:none, key:8A, key:none, mix:8A, missing:yes, nokeybpm:yes, cues:none, comments:, grouping: o composer:. Ctrl/Cmd+F o /. Esc borra la búsqueda.",
    "tooltip.searchField": "Busca en un solo campo. Todos los campos es título, artista, álbum, género, tono y archivo. Comentarios, agrupación y compositor usan este menú o comments:, grouping:, composer:.",
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
    "tooltip.sortDateAdded": "Ordena las pistas por la fecha en que se añadieron.",
    "tooltip.sortDeck": "Ordena el historial por plato.",
    "tooltip.sortEnergy": "Ordena las pistas por energía (la valoración en estrellas, de 1 a 5).",
    "tooltip.sortGenre": "Ordena las pistas por género.",
    "tooltip.sortKey": "Ordena las pistas por tonalidad.",
    "tooltip.sortLastPlayed": "Ordena las pistas por la última vez que se reprodujeron.",
    "tooltip.sortLength": "Ordena las pistas por duración.",
    "tooltip.sortOrder": "Ordena las cajas en el orden guardado.",
    "tooltip.sortPlayed": "Ordena el historial según si la pista se reprodujo.",
    "tooltip.sortPlays": "Ordena las pistas por número de reproducciones.",
    "tooltip.sortStart": "Ordena el historial por la hora de inicio.",
    "tooltip.sortTitle": "Ordena las pistas por título.",
    "tooltip.space": "Elige Biblioteca, Vídeo, Apple Music o Preparar.",
    "tooltip.splitter": "Arrastra para cambiar el ancho de la lista. Doble clic lo devuelve. Las flechas lo redimensionan.",
    "tooltip.statsCsv": "Descarga este informe como hoja de cálculo. Solo lectura.",
    "tooltip.statsFrom": "Primer día de un periodo personalizado.",
    "tooltip.statsIdleCrate": "Previsualiza una caja con las pistas no reproducidas en estos días y confirma. Hay que cerrar Serato.",
    "tooltip.statsIdleDays": "Una pista no reproducida en estos días aparece en la lista. 365 por defecto.",
    "tooltip.statsPeriod": "Limita los más reproducidos a este periodo. Las pistas inactivas usan Días inactivos, no este periodo.",
    "tooltip.statsRefresh": "Carga las estadísticas de este periodo.",
    "tooltip.statsTo": "Último día de un periodo personalizado.",
    "tooltip.tagsApply": "Escribe esta grafía en cada pista del grupo. Cierra Serato primero. Los archivos de audio no cambian.",
    "tooltip.tagsApplyMappings": "Escribe las grafías de género y artista guardadas en las pistas que aún usan otra forma. Cierra Serato primero. Los archivos de audio no cambian.",
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
    "tooltip.viewBitrate": "Marca archivos cuya tasa de bits declarada es mucho más alta que la del espectro, o archivos sin pérdida hechos a partir de un códec con pérdida. Necesita una caja. Guardar una caja escribe en la biblioteca.",
    "tooltip.viewCrates": "Muestra las cajas. Ctrl/Cmd+2.",
    "tooltip.viewDrift": "Marca pistas cuyo tempo se mueve, o que parecen grabaciones en vivo. Necesita una caja. Solo lectura.",
    "tooltip.driftRefresh": "Vuelve a comprobar el tempo de la caja seleccionada.",
    "tooltip.viewDuplicates": "Muestra pistas que parecen copias unas de otras.",
    "tooltip.viewFiles": "Muestra los archivos del disco. Ctrl/Cmd+3.",
    "tooltip.viewGig": "Comprueba la biblioteca antes del bolo. Solo lectura. No cambia nada.",
    "tooltip.viewHealth": "Cifras en una página de archivos no encontrados, BPM o tonalidad faltantes, género vacío, pistas en ninguna caja y duplicados. Solo lectura.",
    "tooltip.viewHistory": "Muestra el historial. Ctrl/Cmd+4.",
    "tooltip.viewMissing": "Muestra las pistas cuyo archivo falta en una unidad conectada. Las pistas en una unidad desconectada se quedan en las cajas como desconectadas.",
    "tooltip.viewPortable": "Comprueba una unidad Serato portátil antes del bolo. Elige una unidad conectada. Solo lectura.",
    "tooltip.viewScan": "Busca archivos de audio vacíos, con el formato incorrecto o que no se pueden decodificar. Solo lectura.",
    "tooltip.viewSnapshots": "Abre las copias de seguridad. Copias comprobadas de la biblioteca, las cajas y los cues. Ctrl/Cmd+5.",
    "tooltip.viewStats": "Las pistas y artistas más reproducidos en un periodo, pistas inactivas y un CSV del informe.",
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
    "view.bitrate": "Calidad dudosa",
    "view.crates": "Cajas",
    "view.drift": "Tempo inestable",
    "view.duplicates": "Duplicados",
    "view.files": "Organizar archivos",
    "view.gig": "Antes del bolo",
    "view.group.gig": "Antes del bolo",
    "view.group.health": "Salud de la biblioteca",
    "view.group.library": "Biblioteca",
    "view.health": "Salud de la biblioteca",
    "view.history": "Historial",
    "view.label": "Vistas",
    "view.missing": "Archivos no encontrados",
    "view.portable": "Comprobar unidad",
    "view.scan": "Archivos dañados",
    "view.snapshots": "Copias de seguridad",
    "view.stats": "Estadísticas",
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
  function matchLanguage(tags) {
    for (const tag of tags) {
      const base = tag.toLowerCase().split(/[-_]/)[0];
      if (isLanguage(base)) return base;
    }
    return "en";
  }
  function resolveLocale(saved, tags) {
    return isLanguage(saved) ? saved : matchLanguage(tags);
  }
  function browserTags() {
    if (typeof navigator === "undefined") return [];
    if (Array.isArray(navigator.languages) && navigator.languages.length) return [...navigator.languages];
    return navigator.language ? [navigator.language] : [];
  }
  function getLocale() {
    const lang = typeof document === "undefined" ? "" : document.documentElement.lang;
    if (lang === PSEUDO) return PSEUDO;
    return isLanguage(lang) ? lang : "en";
  }
  function setLocale(locale) {
    const root = document.documentElement;
    if (root.lang === locale) return false;
    root.lang = locale;
    document.dispatchEvent(new CustomEvent(LOCALE_EVENT, { detail: locale }));
    return true;
  }
  function initialLocale() {
    try {
      const wanted = new URLSearchParams(location.search).get("locale");
      if (wanted === PSEUDO) return PSEUDO;
      if (isLanguage(wanted)) return wanted;
    } catch {
    }
    return matchLanguage(browserTags());
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
  function messageParams(value) {
    if (!value || typeof value !== "object") return void 0;
    const params = {};
    for (const [name, item5] of Object.entries(value)) {
      if (typeof item5 === "string" || typeof item5 === "number" && Number.isFinite(item5)) params[name] = item5;
    }
    return Object.keys(params).length ? params : void 0;
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
  function applyStatic(root) {
    let count = 0;
    for (const node of root.querySelectorAll("[data-i18n]")) {
      const key = node.dataset.i18n ?? "";
      if (!hasKey(key)) continue;
      node.textContent = t(key);
      count += 1;
    }
    for (const node of root.querySelectorAll("[data-i18n-attr]")) {
      for (const pair of (node.dataset.i18nAttr ?? "").split(";")) {
        const [attr, key] = pair.split(":").map((part) => part.trim());
        if (!attr || !key || !hasKey(key)) continue;
        node.setAttribute(attr, t(key));
      }
      count += 1;
    }
    return count;
  }
  function formatNumber(value, options) {
    const locale = getLocale();
    return new Intl.NumberFormat(locale === PSEUDO ? "en" : locale, options).format(value);
  }
  function formatDate(date, options) {
    const locale = getLocale();
    return new Intl.DateTimeFormat(locale === PSEUDO ? "en" : locale, options).format(date);
  }
  function formatList(items) {
    const locale = getLocale();
    return new Intl.ListFormat(locale === PSEUDO ? "en" : locale, { style: "long", type: "conjunction" }).format(items);
  }

  // src/api.ts
  async function readJSON(response) {
    return await response.json();
  }
  async function readJSONOr(response, fallback) {
    return await response.json().catch(() => fallback);
  }
  function failureOf(error2) {
    if (error2 instanceof Error) return error2;
    return new Error(typeof error2 === "string" ? error2 : t("error.requestFailed"));
  }
  var ROOT_KINDS = ["music_library", "serato_drive", "user_folder"];
  function isLibraryRoot(value) {
    if (!value || typeof value !== "object") return false;
    const record = value;
    return typeof record.id === "string" && typeof record.path === "string" && typeof record.label === "string" && typeof record.detail === "string" && ROOT_KINDS.includes(record.kind) && typeof record.serato === "boolean" && typeof record.removable === "boolean" && typeof record.missing === "boolean";
  }
  async function fetchLibraryRoots(refresh = false) {
    const response = await fetch(refresh ? "/api/library-roots?refresh=1" : "/api/library-roots");
    const payload = await readJSONOr(response, {
      roots: [],
      computed_at: ""
    });
    if (!response.ok) {
      const error2 = new Error(serverMessage(payload, t("files.rootsUnreadable")));
      error2.status = response.status;
      error2.payload = payload;
      throw error2;
    }
    return {
      roots: Array.isArray(payload.roots) ? payload.roots.filter(isLibraryRoot) : [],
      computed_at: typeof payload.computed_at === "string" ? payload.computed_at : ""
    };
  }
  function isVersionSource(value) {
    return value === "release" || value === "git" || value === "dev";
  }
  function isVersionPayload(value) {
    if (!value || typeof value !== "object") return false;
    const record = value;
    return typeof record.version === "string" && record.version.trim() !== "" && (record.commit === null || typeof record.commit === "string") && isVersionSource(record.source);
  }
  async function getVersion() {
    const response = await fetch("/api/version");
    const payload = await readJSONOr(response, null);
    if (!response.ok || !isVersionPayload(payload)) {
      throw new Error(t("version.unavailable"));
    }
    return {
      version: payload.version.trim(),
      commit: payload.commit,
      source: payload.source
    };
  }
  async function getRelink(space, root = "") {
    const params = new URLSearchParams({ space });
    const extra = root.trim();
    if (extra) params.set("root", extra);
    const response = await fetch(`/api/relink?${params.toString()}`);
    const payload = await readJSONOr(response, {});
    if (!response.ok) {
      const error2 = new Error(serverMessage(payload, t("error.requestStatus", { status: String(response.status) })));
      error2.status = response.status;
      error2.payload = payload;
      throw error2;
    }
    return payload;
  }
  async function postJSON(url, body) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await readJSONOr(response, {});
    if (!response.ok) {
      const error2 = new Error(serverMessage(payload, t("error.requestStatus", { status: String(response.status) })));
      error2.status = response.status;
      error2.payload = payload;
      throw error2;
    }
    return payload;
  }

  // src/bridge.ts
  var bridge = {
    selectTrack(_id) {
    },
    selectEntry(_id) {
    },
    openMergeDialog() {
      return Promise.resolve();
    },
    openReplaceInCratesDialog(_fromId, _toId) {
      return Promise.resolve();
    },
    openSetup() {
    },
    reloadLibrary() {
      return Promise.resolve();
    },
    lockDown(_error) {
    }
  };

  // src/dom.ts
  function el(id) {
    const node = document.getElementById(id);
    if (node == null) throw new Error(`Missing #${id}`);
    return node;
  }

  // src/fuzzy.ts
  var BOUNDARY = /[ ._/\-\\]/;
  function fuzzyScore(needle, haystack) {
    const query = needle.toLocaleLowerCase();
    const text2 = haystack.toLocaleLowerCase();
    if (!query) return null;
    let score = 0;
    let previous2 = -2;
    let from = 0;
    for (const letter of query) {
      const found = text2.indexOf(letter, from);
      if (found < 0) return null;
      score += 8;
      if (found === previous2 + 1) score += 16;
      if (found === 0 || BOUNDARY.test(text2.charAt(found - 1))) score += 12;
      previous2 = found;
      from = found + 1;
    }
    if (text2.includes(query)) score += 40;
    if (text2.startsWith(query)) score += 30;
    score -= Math.floor(Math.max(0, text2.length - query.length) / 4);
    return score;
  }
  function scoreQuery(query, name, parentName = "") {
    const terms = query.trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return null;
    let total = 0;
    for (const term of terms) {
      const nameScore = fuzzyScore(term, name);
      if (nameScore != null) {
        total += nameScore + 20;
        continue;
      }
      if (!parentName) return null;
      const parentScore = fuzzyScore(term, parentName);
      if (parentScore == null) return null;
      total += parentScore;
    }
    return total;
  }

  // src/splitter.ts
  function clampWidth(width, available, minFirst, minSecond) {
    const max = Math.max(minFirst, available - minSecond);
    return Math.round(Math.min(Math.max(width, minFirst), max));
  }
  function mountSplitter(options) {
    const { handle, container, first, property, minFirst, minSecond, onCommit } = options;
    const step = options.step ?? 16;
    let current2 = null;
    const available = () => container.clientWidth - handle.offsetWidth;
    const fitted = (width) => clampWidth(width, available(), minFirst, minSecond);
    const shown = () => current2 == null ? first.getBoundingClientRect().width : fitted(current2);
    function paint3() {
      if (current2 == null) container.style.removeProperty(property);
      else container.style.setProperty(property, `${fitted(current2)}px`);
      const room = available();
      handle.setAttribute("aria-valuemin", String(minFirst));
      handle.setAttribute("aria-valuemax", String(Math.max(minFirst, Math.round(room - minSecond))));
      handle.setAttribute("aria-valuenow", String(Math.round(shown())));
    }
    function move(width) {
      current2 = fitted(width);
      paint3();
    }
    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = shown();
      let moved = false;
      handle.setPointerCapture?.(event.pointerId);
      handle.dataset.dragging = "true";
      document.body.classList.add("is-resizing");
      const onMove = (next2) => {
        moved = true;
        move(startWidth + next2.clientX - startX);
      };
      const onEnd = () => {
        handle.removeEventListener("pointermove", onMove);
        handle.removeEventListener("pointerup", onEnd);
        handle.removeEventListener("pointercancel", onEnd);
        delete handle.dataset.dragging;
        document.body.classList.remove("is-resizing");
        if (moved) onCommit(current2);
      };
      handle.addEventListener("pointermove", onMove);
      handle.addEventListener("pointerup", onEnd);
      handle.addEventListener("pointercancel", onEnd);
    });
    handle.addEventListener("keydown", (event) => {
      const jump = event.shiftKey ? step * 4 : step;
      let next2;
      if (event.key === "ArrowLeft") next2 = shown() - jump;
      else if (event.key === "ArrowRight") next2 = shown() + jump;
      else if (event.key === "Home") next2 = minFirst;
      else if (event.key === "End") next2 = available() - minSecond;
      else return;
      event.preventDefault();
      const before = current2;
      move(next2);
      if (current2 !== before) onCommit(current2);
    });
    handle.addEventListener("dblclick", () => {
      current2 = null;
      paint3();
      onCommit(null);
    });
    paint3();
    return {
      set(width) {
        current2 = width == null ? null : Math.round(width);
        paint3();
      },
      width: () => current2,
      refit: paint3
    };
  }

  // src/state.ts
  var ROW = 36;
  var FILE_ROW = 44;
  var ROOT_ROW = 64;
  var COLORS = [
    [16777215, "color.none"],
    [13369344, "color.red"],
    [16746496, "color.orange"],
    [16763904, "color.yellow"],
    [3385941, "color.green"],
    [2250188, "color.blue"],
    [8926156, "color.purple"],
    [14826378, "color.pink"]
  ];
  var COLOR_NAMES = {
    none: 16777215,
    red: 13369344,
    orange: 16746496,
    yellow: 16763904,
    green: 3385941,
    blue: 2250188,
    purple: 8926156,
    pink: 14826378
  };
  var state = {
    tracks: [],
    byId: /* @__PURE__ */ new Map(),
    crates: [],
    crateTracks: /* @__PURE__ */ new Map(),
    presets: {},
    rootId: null,
    activeCrate: "all",
    secondCrate: "all",
    splitCrates: false,
    focusedPane: "a",
    query: "",
    searchField: "",
    crateQuery: "",
    crateSort: "order",
    sort: "name",
    sortDir: 1,
    selectedId: null,
    request: 0,
    expanded: /* @__PURE__ */ new Set(),
    space: "Serato Library",
    mode: "crates",
    writable: false,
    serato: null,
    historySessions: [],
    historyId: null,
    entries: [],
    duplicateIds: null,
    duplicateGroups: [],
    duplicateSpace: "",
    telemetryConsent: null,
    telemetryConfigured: false,
    wizardComplete: false,
    filesPath: "",
    filesParent: null,
    filesEntries: [],
    filesSelected: /* @__PURE__ */ new Set(),
    filesPick: null,
    filesPickPaths: [],
    filesPickSource: "",
    filesLoading: false,
    filesError: "",
    filesMessage: "",
    filesTruncated: false,
    filesAtRoots: false,
    filesRoots: [],
    filesRoot: null,
    filesBreadcrumb: [],
    filesElsewhere: false,
    filesActive: 0,
    filesQuery: "",
    filesSearching: false,
    snapshots: [],
    driveBackup: null,
    operations: [],
    operationsLoading: false,
    operationsError: "",
    snapshotLoading: false,
    snapshotError: "",
    snapshotMessage: "",
    snapshotUndo: null,
    writeBlock: "",
    writeBlockCode: "",
    writeBlockParams: null,
    seratoRunning: false,
    snapshotPlanId: "",
    gigToken: 0,
    driftToken: 0,
    healthToken: 0,
    statsToken: 0,
    scanToken: 0,
    bitrateToken: 0,
    tagsToken: 0,
    view: [],
    viewB: []
  };

  // src/dual-crate-view.ts
  function clickPane(split, focused, altKey) {
    if (!split) return "a";
    if (altKey) return focused === "a" ? "b" : "a";
    return focused;
  }
  function paneCrates(active2, second, split) {
    return { a: active2, b: split ? second : null };
  }
  function railMark(id, a, b) {
    const inA = id === a;
    const inB = b != null && id === b;
    if (inA && inB) return "both";
    if (inA) return "a";
    if (inB) return "b";
    return null;
  }
  function saveViewIds(view) {
    const seen = /* @__PURE__ */ new Set();
    const ids = [];
    for (const track of view) {
      if (track.entry) continue;
      if (!Number.isInteger(track.id) || track.id < 0) continue;
      if (seen.has(track.id)) continue;
      seen.add(track.id);
      ids.push(track.id);
    }
    return ids;
  }
  function focusedView() {
    if (state.splitCrates && state.focusedPane === "b") return state.viewB;
    return state.view;
  }
  function paintDualChrome() {
    const cratesMode = state.mode === "crates";
    const split = state.splitCrates && cratesMode;
    el("crate-panes").classList.toggle("split", split);
    el("crate-pane-b").hidden = !split;
    el("crate-pane-a-label").hidden = !split;
    const toggle = el("crate-split");
    toggle.hidden = !cratesMode;
    toggle.setAttribute("aria-pressed", String(split));
    const save3 = el("crate-save-view");
    save3.hidden = !cratesMode;
    save3.disabled = !state.writable;
    el("crate-pane-a").dataset.focused = String(!split || state.focusedPane === "a");
    el("crate-pane-b").dataset.focused = String(split && state.focusedPane === "b");
    const panes = paneCrates(state.activeCrate, state.secondCrate, split);
    for (const button2 of el("crate-list").querySelectorAll(".crate")) {
      const raw = button2.dataset.id;
      const id = raw === "all" ? "all" : Number(raw);
      const mark = Number.isFinite(id) || id === "all" ? railMark(id, panes.a, panes.b) : null;
      if (mark) button2.dataset.pane = mark;
      else delete button2.dataset.pane;
    }
  }

  // src/format.ts
  function lengthLabel(ms) {
    if (ms == null || ms === "") return "";
    const total = Math.floor(Number(ms) / 1e3);
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }
  function clockLabel(stamp) {
    if (stamp == null || stamp === "") return "";
    const date = new Date(Number(stamp) * 1e3);
    if (Number.isNaN(date.getTime())) return "";
    return formatDate(date, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }
  function dateLabel(stamp) {
    if (stamp == null || stamp === "") return "";
    const date = new Date(Number(stamp) * 1e3);
    if (Number.isNaN(date.getTime())) return "";
    return formatDate(date, { month: "short", day: "numeric", year: "numeric" });
  }
  function energyValue(rating) {
    if (rating == null || rating === "") return null;
    const score = Number(rating);
    if (!Number.isFinite(score) || score <= 0) return null;
    const filled = Math.round(score * 5);
    if (filled < 1) return null;
    return Math.min(5, filled);
  }
  function energyLabel(rating) {
    const value = energyValue(rating);
    return value == null ? "" : formatNumber(value);
  }
  var NUMERIC_SORT = /* @__PURE__ */ new Set([
    "bpm",
    "length_ms",
    "start",
    "energy",
    "time_added",
    "last_played",
    "play_count"
  ]);
  function isNumericSort(key) {
    return NUMERIC_SORT.has(key);
  }
  function sortNumber(track, key) {
    if (key === "energy") return energyValue(track.rating);
    const raw = track[key];
    if (raw == null || raw === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }
  function durationLabel(ms) {
    const total = Math.round(Number(ms) / 1e3);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor(total % 3600 / 60);
    if (hours) return t("format.hoursMinutes", { hours, minutes });
    return t("format.minutes", { minutes });
  }
  function sizeLabel(bytes) {
    const size = Number(bytes) || 0;
    if (size < 1024) return t("format.bytes", { count: size });
    const units = ["KB", "MB", "GB"];
    let amount = size / 1024;
    let unit = 0;
    while (amount >= 1024 && unit < units.length - 1) {
      amount /= 1024;
      unit += 1;
    }
    return `${formatNumber(amount, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${units[unit]}`;
  }
  function colorHex(color) {
    if (color == null || Number(color) === 16777215) return "";
    return `#${Number(color).toString(16).padStart(6, "0")}`;
  }
  function compare(a, b) {
    const key = state.sort;
    const dir = state.sortDir;
    let av = a[key];
    let bv = b[key];
    if (NUMERIC_SORT.has(key)) {
      const an = sortNumber(a, key);
      const bn = sortNumber(b, key);
      if (an == null && bn == null) return a.id - b.id;
      if (an == null) return 1;
      if (bn == null) return -1;
      if (an !== bn) return (an - bn) * dir;
      return a.id - b.id;
    }
    av = String(av || "").toLocaleLowerCase();
    bv = String(bv || "").toLocaleLowerCase();
    if (!av && bv) return 1;
    if (av && !bv) return -1;
    const locale = getLocale();
    const order = av.localeCompare(bv, locale === PSEUDO ? "en" : locale, { numeric: true, sensitivity: "base" });
    if (order !== 0) return order * dir;
    return a.id - b.id;
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
    searchField: spec("tooltip.searchField"),
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
    viewStats: spec("tooltip.viewStats"),
    statsRefresh: spec("tooltip.statsRefresh"),
    statsCsv: spec("tooltip.statsCsv"),
    statsPeriod: spec("tooltip.statsPeriod"),
    statsFrom: spec("tooltip.statsFrom"),
    statsTo: spec("tooltip.statsTo"),
    statsIdleDays: spec("tooltip.statsIdleDays"),
    statsIdleCrate: spec("tooltip.statsIdleCrate"),
    viewMissing: spec("tooltip.viewMissing"),
    viewDuplicates: spec("tooltip.viewDuplicates"),
    viewStems: spec("tooltip.viewStems"),
    viewFiles: spec("tooltip.viewFiles"),
    viewSnapshots: spec("tooltip.viewSnapshots"),
    viewGig: spec("tooltip.viewGig"),
    viewPortable: spec("tooltip.viewPortable"),
    viewDrift: spec("tooltip.viewDrift"),
    portableDrive: spec("tooltip.portableDrive"),
    portableRun: spec("tooltip.portableRun"),
    driftRefresh: spec("tooltip.driftRefresh"),
    viewHealth: spec("tooltip.viewHealth"),
    viewScan: spec("tooltip.viewScan"),
    viewBitrate: spec("tooltip.viewBitrate"),
    viewTags: spec("tooltip.viewTags"),
    healthRefresh: spec("tooltip.healthRefresh"),
    healthOpenMissing: spec("tooltip.healthOpenMissing"),
    healthOpenDuplicates: spec("tooltip.healthOpenDuplicates"),
    healthOpenFiles: spec("tooltip.healthOpenFiles"),
    healthOpenBitrate: spec("tooltip.healthOpenBitrate"),
    healthTrack: spec("tooltip.healthTrack"),
    tagsGenre: spec("tooltip.tagsGenre"),
    tagsArtist: spec("tooltip.tagsArtist"),
    tagsTitles: spec("tooltip.tagsTitles"),
    tagsRefresh: spec("tooltip.tagsRefresh"),
    tagsPreview: spec("tooltip.tagsPreview"),
    tagsApply: spec("tooltip.tagsApply"),
    tagsApplyTitles: spec("tooltip.tagsApplyTitles"),
    tagsApplyMappings: spec("tooltip.tagsApplyMappings"),
    tagsGroup: spec("tooltip.tagsGroup"),
    tagsSpelling: spec("tooltip.tagsSpelling"),
    gigRefresh: spec("tooltip.gigRefresh"),
    scanQuick: spec("tooltip.scanQuick"),
    scanFull: spec("tooltip.scanFull"),
    bitrateRefresh: spec("tooltip.bitrateRefresh"),
    bitrateSave: spec("tooltip.bitrateSave"),
    bitrateConfirm: spec("tooltip.bitrateConfirm"),
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
  function playTip(action, name) {
    if (name) return spec("tooltip.transportNamed", { action, name });
    return spec("tooltip.transport", { action });
  }
  function sortTip(key, label) {
    const known = {
      name: "tooltip.sortTitle",
      artist: "tooltip.sortArtist",
      bpm: "tooltip.sortBpm",
      key: "tooltip.sortKey",
      energy: "tooltip.sortEnergy",
      genre: "tooltip.sortGenre",
      time_added: "tooltip.sortDateAdded",
      last_played: "tooltip.sortLastPlayed",
      play_count: "tooltip.sortPlays",
      length_ms: "tooltip.sortLength",
      deck: "tooltip.sortDeck",
      played: "tooltip.sortPlayed",
      start: "tooltip.sortStart"
    };
    const message = known[key];
    if (message) return spec(message);
    return spec("tooltip.sortBy", { label });
  }
  function viewTip(view) {
    const known = {
      crates: tips.viewCrates,
      history: tips.viewHistory,
      stats: tips.viewStats,
      missing: tips.viewMissing,
      duplicates: tips.viewDuplicates,
      stems: tips.viewStems,
      files: tips.viewFiles,
      snapshots: tips.viewSnapshots,
      gig: tips.viewGig,
      portable: tips.viewPortable,
      drift: tips.viewDrift,
      health: tips.viewHealth,
      scan: tips.viewScan,
      bitrate: tips.viewBitrate,
      tags: tips.viewTags
    };
    return known[view];
  }
  function crateSortTip(key) {
    if (key === "order") return tips.sortOrder;
    if (key === "name") return tips.sortCrateName;
    if (key === "added") return tips.sortAdded;
    return void 0;
  }
  function staticTip(id) {
    const known = {
      space: tips.space,
      "crate-search": tips.crateSearch,
      "merge-duplicates": tips.mergeDuplicates,
      "open-relink": tips.relink,
      "relink-root": tips.relinkRoot,
      "relink-find": tips.relinkFind,
      "relink-accept-high": tips.relinkAcceptHigh,
      "relink-confirm": tips.relinkConfirm,
      "relink-cancel": tips.relinkCancel,
      "crate-new": tips.crateNew,
      "crate-split": tips.crateSplit,
      "crate-save-view": tips.crateSaveView,
      "crate-rename": tips.crateRename,
      "crate-color": tips.crateColor,
      "crate-delete": tips.crateDelete,
      "crate-preset": tips.cratePreset,
      "crate-folder-sync": tips.crateFolderSync,
      "crate-rename-from-tags": tips.crateRenameFromTags,
      "crate-refresh": tips.crateRefresh,
      "folder-sync-path": tips.folderSyncPath,
      "folder-sync-subcrates": tips.folderSyncSubcrates,
      "folder-sync-full": tips.folderSyncFull,
      "folder-sync-cancel": tips.folderSyncCancel,
      "folder-sync-run": tips.folderSyncRun,
      "preset-kind": tips.presetKind,
      "preset-key": tips.presetKey,
      "preset-bpm": tips.presetBpm,
      "preset-range": tips.presetRange,
      "preset-months": tips.presetMonths,
      "preset-scope": tips.presetScope,
      "preset-name": tips.presetName,
      "preset-cancel": tips.presetCancel,
      "preset-create": tips.presetCreate,
      "open-help": tips.help,
      "shortcuts-title": tips.shortcuts,
      "open-settings": tips.settings,
      search: tips.search,
      "search-field": tips.searchField,
      "export-m3u": tips.exportM3u,
      "export-rekordbox": tips.exportRekordbox,
      "rekordbox-memory": tips.memoryCues,
      "rekordbox-hot-loops": tips.hotLoops,
      "rekordbox-key": tips.rekordboxKey,
      "import-m3u": tips.importM3u,
      "import-file": tips.importFile,
      reload: tips.reload,
      "files-up": tips.filesUp,
      "files-search": tips.filesSearch,
      "files-refresh": tips.filesRefresh,
      "files-elsewhere": tips.filesElsewhere,
      "files-rename": tips.filesRename,
      "files-rename-from-tags": tips.filesRenameFromTags,
      "files-move": tips.filesMove,
      "files-move-folder": tips.filesMoveFolder,
      "files-replace": tips.filesReplace,
      "files-delete": tips.filesDelete,
      "files-move-here": tips.filesMoveHere,
      "files-pick-cancel": tips.filesPickCancel,
      "operations-refresh": tips.operationsRefresh,
      "operations-list": tips.operationsList,
      "snapshots-refresh": tips.snapshotsRefresh,
      "gig-refresh": tips.gigRefresh,
      "drift-refresh": tips.driftRefresh,
      "health-refresh": tips.healthRefresh,
      "stats-refresh": tips.statsRefresh,
      "stats-csv": tips.statsCsv,
      "stats-period": tips.statsPeriod,
      "stats-from": tips.statsFrom,
      "stats-to": tips.statsTo,
      "stats-idle-days": tips.statsIdleDays,
      "scan-quick": tips.scanQuick,
      "scan-full": tips.scanFull,
      "bitrate-refresh": tips.bitrateRefresh,
      "bitrate-save": tips.bitrateSave,
      "tags-genre": tips.tagsGenre,
      "tags-artist": tips.tagsArtist,
      "tags-titles": tips.tagsTitles,
      "tags-refresh": tips.tagsRefresh,
      "snapshots-take": tips.snapshotsTake,
      "snapshots-drives": tips.backupDrives,
      "snapshots-undo-button": tips.snapshotsUndo,
      "consent-decline": tips.consentDecline,
      "consent-accept": tips.consentAccept,
      "telemetry-toggle": tips.telemetry,
      "copy-version": tips.copyVersion,
      "rerun-wizard": tips.rerunWizard,
      "open-logs": tips.openLogs,
      "copy-logs": tips.copyLogs,
      "about-github": tips.helpGithub,
      "help-bug": tips.helpBug,
      "help-feature": tips.helpFeature,
      "help-github": tips.helpGithub,
      "help-releases": tips.helpReleases,
      "help-close": tips.helpClose,
      "help-happened": tips.helpHappened,
      "help-expected": tips.helpExpected,
      "help-names": tips.helpNames,
      "help-copy-log": tips.helpCopyLog,
      "help-open-github": tips.helpOpen,
      "help-report-close": tips.helpClose,
      "help-log-fallback": tips.helpReport,
      "settings-close": tips.settingsClose,
      "log-fallback": tips.logFallback,
      "language-select": tips.language,
      "colorway-select": tips.colorway,
      "icon-follows-theme": tips.iconFollowsTheme,
      "library-generation": tips.libraryGeneration,
      "merge-trash": tips.mergeTrash,
      "merge-cancel": tips.mergeCancel,
      "merge-confirm": tips.mergeConfirm,
      "crates-replace-search": tips.cratesReplaceSearch,
      "crates-replace-keep": tips.cratesReplaceKeep,
      "crates-replace-retire": tips.cratesReplaceRetire,
      "crates-replace-cancel": tips.cratesReplaceCancel,
      "crates-replace-confirm": tips.cratesReplaceConfirm,
      "rekordbox-cancel": tips.rekordboxCancel,
      "rekordbox-download": tips.rekordboxDownload,
      "files-name": tips.filesName,
      "files-replacement": tips.filesReplacement,
      "files-cancel": tips.filesCancel,
      "files-review": tips.filesReview,
      "files-confirm": tips.filesConfirm,
      "portable-close": tips.portableClose,
      "portable-drive": tips.portableDrive,
      "portable-check": tips.portableRun,
      "quick-open-query": tips.quickOpen,
      "quick-open-retry": tips.quickOpenRetry,
      "quick-open-close": tips.quickOpenClose,
      "snapshot-cancel": tips.snapshotCancel,
      "snapshot-confirm": tips.snapshotConfirm,
      "wizard-folder-up": tips.wizardFolderUp,
      "wizard-folder-use": tips.wizardFolderUse,
      "wizard-folder-close": tips.wizardFolderClose,
      "wizard-no": tips.wizardNo,
      "wizard-yes": tips.wizardYes,
      "wizard-updates-no": tips.wizardUpdatesNo,
      "wizard-updates-yes": tips.wizardUpdatesYes,
      "update-toggle": tips.updateToggle,
      "update-prereleases": tips.updatePrereleases,
      "update-download": tips.updateDownload,
      "update-skip": tips.updateSkip,
      "update-dismiss": tips.updateDismiss,
      "wizard-back": tips.wizardBack,
      "wizard-cancel": tips.wizardCancel,
      "wizard-secondary": tips.wizardSecondary,
      "wizard-primary": spec("tooltip.wizard.getStarted"),
      list: tips.trackList,
      "list-b": tips.trackList,
      "files-list": tips.filesList,
      "snapshots-list": tips.snapshotsList,
      "track-splitter": tips.splitter
    };
    return known[id];
  }
  function expandCrate(name) {
    return spec("tooltip.expandCrate", { name });
  }
  function collapseCrate(name) {
    return spec("tooltip.collapseCrate", { name });
  }
  function openCrate(name) {
    return spec("tooltip.openCrate", { name });
  }
  function sessionTip(name) {
    return spec("tooltip.session", { name });
  }
  function playRow(name) {
    return spec("tooltip.playRow", { name });
  }
  function selectRow(name) {
    return spec("tooltip.selectRow", { name });
  }
  function cueTip(label) {
    return spec("tooltip.cue", { label });
  }
  function editField(label) {
    return spec("tooltip.editField", { label });
  }
  function revealTip(manager) {
    return spec("tooltip.reveal", { name: manager });
  }
  function openCopy(name) {
    return spec("tooltip.openCopy", { name });
  }
  function openReplaceCopy(name) {
    return spec("tooltip.openReplaceCopy", { name });
  }
  function openRelated(name) {
    return spec("tooltip.openRelated", { name });
  }
  function removeRelatedTip(name) {
    return spec("tooltip.removeRelated", { name });
  }
  function chooseRelated(name) {
    return spec("tooltip.chooseRelated", { name });
  }
  function saveSuggestion(name) {
    return spec("tooltip.saveSuggestion", { name });
  }
  function membershipTip(name) {
    return spec("tooltip.membership", { name });
  }
  function openCrumb(name) {
    return spec("tooltip.openCrumb", { name });
  }
  function openFile(name) {
    return spec("tooltip.openFile", { name });
  }
  function portableCheck(name) {
    return spec("tooltip.portableCheck", { name });
  }
  function missingDrive(name) {
    return spec("tooltip.missingDrive", { name });
  }
  function fileShortcut(name) {
    return spec("tooltip.fileShortcut", { name });
  }
  function selectFile(name, path = "") {
    if (path && path !== name) return spec("tooltip.selectFilePath", { name, path });
    return spec("tooltip.selectFile", { name });
  }
  function keepCopy(name) {
    return spec("tooltip.keepCopy", { name });
  }
  function quickOpenHit(kind2, title2, detail) {
    if (detail) return spec("tooltip.quickOpenHitDetail", { kind: kind2, title: title2, detail });
    return spec("tooltip.quickOpenHit", { kind: kind2, title: title2 });
  }

  // src/tooltip.ts
  var TOOLTIP_ID = "app-tooltip";
  var TOOLTIP_HOVER_MS = 400;
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
  var installed = false;
  var current = null;
  var timer = 0;
  var priorDescribedBy = "";
  var tipParams = /* @__PURE__ */ new WeakMap();
  function writeTooltip(element) {
    const key = element.dataset.tooltipKey ?? "";
    if (!hasKey(key)) throw new Error(`Unknown tooltip key ${key}.`);
    const value = t(key, tipParams.get(element)).trim();
    if (!value) throw new Error("A control tooltip cannot be empty.");
    element.dataset.tooltip = value;
  }
  function syncOpenTooltip() {
    if (!current) return;
    const tip = document.getElementById(TOOLTIP_ID);
    if (!(tip instanceof HTMLElement)) return;
    tip.textContent = current.dataset.tooltip ?? "";
  }
  function setTooltip(element, spec2) {
    element.dataset.tooltipKey = spec2.key;
    if (spec2.params) tipParams.set(element, spec2.params);
    else tipParams.delete(element);
    writeTooltip(element);
    element.removeAttribute("title");
    if (current === element) syncOpenTooltip();
  }
  function buttonEl(spec2) {
    const element = document.createElement("button");
    element.type = "button";
    setTooltip(element, spec2);
    return element;
  }
  function inputEl(spec2) {
    const element = document.createElement("input");
    setTooltip(element, spec2);
    return element;
  }
  function selectEl(spec2) {
    const element = document.createElement("select");
    setTooltip(element, spec2);
    return element;
  }
  function textareaEl(spec2) {
    const element = document.createElement("textarea");
    setTooltip(element, spec2);
    return element;
  }
  function applyStaticTooltips(root = document) {
    root.querySelectorAll("[id]").forEach((node) => {
      const text2 = staticTip(node.id);
      if (text2) setTooltip(node, text2);
    });
    root.querySelectorAll("[data-view]").forEach((node) => {
      const text2 = viewTip(node.dataset.view ?? "");
      if (text2) setTooltip(node, text2);
    });
    root.querySelectorAll("[data-sort]").forEach((node) => {
      const label = node.textContent?.trim() || node.dataset.sort || "";
      setTooltip(node, sortTip(node.dataset.sort ?? "", label));
    });
    root.querySelectorAll("[data-crate-sort]").forEach((node) => {
      const text2 = crateSortTip(node.dataset.crateSort ?? "");
      if (text2) setTooltip(node, text2);
    });
  }
  function refreshTooltips(root = document) {
    root.querySelectorAll("[data-tooltip-key]").forEach((node) => writeTooltip(node));
    if (current && !current.isConnected) {
      hide();
      return;
    }
    syncOpenTooltip();
  }
  function installTooltips() {
    if (installed) return;
    installed = true;
    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("pointerout", onPointerOut);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("scroll", onScroll, true);
  }
  function onPointerOver(event) {
    if (event.pointerType && event.pointerType !== "mouse") return;
    const target = tooltipTarget(event.target);
    if (!target) return;
    schedule(target, hoverDelay());
  }
  function onPointerOut(event) {
    if (event.pointerType && event.pointerType !== "mouse") return;
    const target = tooltipTarget(event.target);
    if (!target || tooltipTarget(event.relatedTarget) === target) return;
    if (current === target) hide();
  }
  function onFocusIn(event) {
    const target = tooltipTarget(event.target);
    if (!target) return;
    schedule(target, 0);
  }
  function onFocusOut(event) {
    if (tooltipTarget(event.relatedTarget)) return;
    const target = tooltipTarget(event.target);
    if (target && current === target) hide();
  }
  function onKeyDown(event) {
    if (event.key !== "Escape" || !current) return;
    hide();
  }
  function onScroll() {
    if (current) hide();
  }
  function schedule(target, delay) {
    window.clearTimeout(timer);
    timer = 0;
    if (delay <= 0) {
      show(target);
      return;
    }
    timer = window.setTimeout(() => show(target), delay);
  }
  function show(target) {
    const text2 = target.dataset.tooltip?.trim() ?? "";
    if (!text2) return;
    if (current && current !== target) restoreDescribedBy(current);
    current = target;
    const tip = ensureTip();
    tip.textContent = text2;
    openTip(tip);
    place(target, tip);
    addDescribedBy(target);
  }
  function hide() {
    window.clearTimeout(timer);
    timer = 0;
    if (current) restoreDescribedBy(current);
    current = null;
    const tip = document.getElementById(TOOLTIP_ID);
    if (tip instanceof HTMLElement) closeTip(tip);
  }
  function hoverDelay() {
    if (typeof matchMedia !== "function") return TOOLTIP_HOVER_MS;
    return matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : TOOLTIP_HOVER_MS;
  }
  function tooltipTarget(node) {
    if (!(node instanceof Element)) return null;
    const direct = node.closest("[data-tooltip]");
    if (direct?.dataset.tooltip?.trim()) return direct;
    const label = node instanceof HTMLLabelElement ? node : node.closest("label");
    if (!(label instanceof HTMLLabelElement)) return null;
    if (label.control instanceof HTMLElement && label.control.dataset.tooltip?.trim()) return label.control;
    const nested = label.querySelector("[data-tooltip]");
    if (nested?.dataset.tooltip?.trim()) return nested;
    return null;
  }
  function ensureTip() {
    const existing = document.getElementById(TOOLTIP_ID);
    if (existing instanceof HTMLElement) return existing;
    const tip = document.createElement("div");
    tip.id = TOOLTIP_ID;
    tip.className = "app-tooltip";
    tip.setAttribute("role", "tooltip");
    tip.hidden = true;
    tip.setAttribute("popover", "manual");
    document.body.append(tip);
    return tip;
  }
  function openTip(tip) {
    tip.hidden = false;
    if (typeof tip.showPopover !== "function") return;
    try {
      if (!tip.matches(":popover-open")) tip.showPopover();
    } catch {
    }
  }
  function closeTip(tip) {
    if (typeof tip.hidePopover === "function") {
      try {
        if (tip.matches(":popover-open")) tip.hidePopover();
      } catch {
      }
    }
    tip.hidden = true;
  }
  function place(target, tip) {
    const rect = target.getBoundingClientRect();
    const gap = 8;
    const margin = 8;
    tip.style.position = "fixed";
    tip.style.margin = "0";
    tip.style.left = "0px";
    tip.style.top = "0px";
    const tipRect = tip.getBoundingClientRect();
    let top = rect.bottom + gap;
    let left = rect.left;
    if (top + tipRect.height > window.innerHeight - margin) top = Math.max(margin, rect.top - gap - tipRect.height);
    if (left + tipRect.width > window.innerWidth - margin) left = window.innerWidth - margin - tipRect.width;
    tip.style.left = `${Math.round(Math.max(margin, left))}px`;
    tip.style.top = `${Math.round(Math.max(margin, top))}px`;
  }
  function addDescribedBy(target) {
    if (target.dataset.tooltipLive === "1") return;
    target.dataset.tooltipLive = "1";
    priorDescribedBy = target.getAttribute("aria-describedby") ?? "";
    const ids = priorDescribedBy.split(/\s+/).filter((id) => id.length > 0 && id !== TOOLTIP_ID);
    ids.push(TOOLTIP_ID);
    target.setAttribute("aria-describedby", ids.join(" "));
  }
  function restoreDescribedBy(target) {
    if (target.dataset.tooltipLive !== "1") return;
    delete target.dataset.tooltipLive;
    if (priorDescribedBy) target.setAttribute("aria-describedby", priorDescribedBy);
    else target.removeAttribute("aria-describedby");
    priorDescribedBy = "";
  }

  // src/gig.ts
  var STEP_COUNT = 5;
  var LIST_CAP = 100;
  var STEPS = [
    { title: "gig.drives", action: "gig.drivesAction", empty: "gig.drivesEmpty" },
    { title: "gig.missing", action: "gig.missingAction", empty: "gig.missingEmpty" },
    { title: "gig.streaming", action: "gig.streamingAction", empty: "gig.streamingEmpty" },
    { title: "gig.emptyCrates", action: "gig.emptyCratesAction", empty: "gig.emptyCratesEmpty" },
    { title: "gig.since", action: "gig.sinceAction", empty: "gig.sinceEmpty" }
  ];
  var stepIndex = 0;
  var latest = null;
  var checkedAt = null;
  var exitGig = () => {
  };
  function wireGigCheck(exit) {
    exitGig = exit;
    const panel = el("gig-panel");
    if (panel.dataset.gigWired === "true") return;
    panel.dataset.gigWired = "true";
    el("gig-refresh").addEventListener("click", () => {
      void loadGigCheck(true);
    });
    panel.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button2 = target.closest("button");
      if (!(button2 instanceof HTMLButtonElement) || !latest) return;
      const action = button2.dataset.gigAction;
      if (action === "next") stepIndex = Math.min(stepIndex + 1, STEP_COUNT);
      else if (action === "back") stepIndex = Math.max(0, stepIndex - 1);
      else if (action === "exit") {
        exitGig();
        return;
      } else return;
      renderGigReport(latest);
      focusHeading();
    });
  }
  async function loadGigCheck(keepStep = false) {
    const token3 = ++state.gigToken;
    if (!keepStep) stepIndex = 0;
    beginBusy();
    let settle = "none";
    const crate = state.activeCrate === "all" ? "all" : String(state.activeCrate);
    try {
      const response = await fetch(
        `/api/gig-check?space=${encodeURIComponent(state.space)}&crate=${encodeURIComponent(crate)}`
      );
      if (token3 !== state.gigToken) return;
      const payload = await readJSON(response).catch(() => null);
      if (token3 !== state.gigToken) return;
      if (!response.ok || payload === null) {
        failStatus(serverMessage(payload, t("gig.unreadable")));
        settle = "retry";
        return;
      }
      checkedAt = /* @__PURE__ */ new Date();
      latest = payload;
      el("gig-status").textContent = "";
      renderGigReport(payload);
      settle = "heading";
    } catch {
      if (token3 !== state.gigToken) return;
      failStatus(t("gig.unreachable"));
      settle = "retry";
    } finally {
      if (token3 !== state.gigToken) return;
      endBusy();
      if (settle === "retry") el("gig-refresh").focus();
      if (settle === "heading") focusHeading();
    }
  }
  function showGigFailure(error2) {
    const message = error2 instanceof Error && error2.message ? error2.message : t("gig.unreadable");
    failStatus(message);
    endBusy();
    el("gig-refresh").focus();
  }
  function renderGigReport(payload) {
    const report = el("gig-report");
    el("gig-scope").textContent = payload.scope?.crate_name || t("gig.wholeSpace");
    report.replaceChildren(scoreBlock(payload));
    if (stepIndex >= STEP_COUNT) {
      report.append(doneScreen(payload));
      return;
    }
    const step = STEPS[stepIndex];
    report.append(kicker(stepIndex), heading(t(step.title)));
    if (stepIndex === STEP_COUNT - 1) renderSince(report, payload);
    else renderStepList(report, step, linesFor(payload, stepIndex));
    report.append(actions(t(step.action)));
  }
  function repaintGig() {
    if (latest) renderGigReport(latest);
  }
  function beginBusy() {
    const button2 = el("gig-refresh");
    button2.disabled = true;
    button2.setAttribute("aria-busy", "true");
    el("gig-panel").setAttribute("aria-busy", "true");
    el("gig-status").textContent = t("gig.checking");
  }
  function endBusy() {
    const button2 = el("gig-refresh");
    button2.disabled = false;
    button2.setAttribute("aria-busy", "false");
    el("gig-panel").setAttribute("aria-busy", "false");
  }
  function failStatus(message) {
    el("gig-status").textContent = message;
  }
  function focusHeading() {
    const headingNode = document.getElementById("gig-step-heading");
    if (headingNode instanceof HTMLElement) headingNode.focus();
  }
  function formatCheckedAt(date) {
    return date ? formatDate(date, { hour: "numeric", minute: "2-digit" }) : "";
  }
  function scoreBlock(payload) {
    const score = document.createElement("p");
    score.className = "gig-score";
    const verdictWord = t(payload.ready ? "gig.wordReady" : "gig.wordNotReady");
    score.setAttribute("aria-label", t("gig.scoreLabel", { score: payload.score, verdict: verdictWord }));
    const value = document.createElement("span");
    value.className = "gig-score-value";
    value.textContent = t("gig.score", { score: payload.score });
    const verdict = document.createElement("span");
    verdict.className = payload.ready ? "gig-verdict" : "gig-verdict not-ready";
    verdict.textContent = t(payload.ready ? "gig.verdictReady" : "gig.verdictNotReady");
    score.append(value, verdict);
    return score;
  }
  function kicker(index) {
    const step = document.createElement("p");
    step.className = "gig-kicker";
    step.textContent = t("gig.stepOf", { index: index + 1, total: STEP_COUNT });
    return step;
  }
  function heading(text2) {
    const title2 = document.createElement("h3");
    title2.id = "gig-step-heading";
    title2.tabIndex = -1;
    title2.textContent = text2;
    return title2;
  }
  function linesFor(payload, index) {
    if (index === 0) {
      return (payload.unavailable_drives || []).map(
        (drive) => t("gig.driveUnavailable", { name: drive.name, count: drive.track_count })
      );
    }
    if (index === 1) return (payload.missing_files || []).map((item5) => item5.path);
    if (index === 2) return (payload.streaming_tracks || []).map((item5) => `${item5.service}: ${item5.title}`);
    if (index === 3) return (payload.empty_crates || []).map((item5) => `${item5.name} — ${item5.warning}`);
    return [];
  }
  function renderStepList(parent, step, lines) {
    if (!lines.length) {
      const empty = document.createElement("p");
      empty.className = "gig-note";
      empty.textContent = t(step.empty);
      parent.append(empty);
      return;
    }
    parent.append(detailsGroup(t(step.title), lines));
  }
  function renderSince(parent, payload) {
    const note = payload.snapshot_note?.trim() ?? "";
    if (note) {
      const line = document.createElement("p");
      line.className = "gig-note";
      line.textContent = note;
      parent.append(line);
    }
    const changes = payload.changes;
    if (!changes) {
      if (!note) parent.append(noteLine(t("gig.noSnapshot")));
      return;
    }
    const groups = [
      ["gig.cratesAdded", changes.crates_added || []],
      ["gig.cratesRemoved", changes.crates_removed || []],
      ["gig.cratesEdited", changes.crates_edited || []],
      ["gig.tracksAdded", changes.tracks_added || []],
      ["gig.tracksRemoved", changes.tracks_removed || []],
      ["gig.cuesEdited", changes.cues_edited || []],
      ["gig.gridsEdited", changes.grids_edited || []],
      ["gig.tagsEdited", changes.tags_edited || []]
    ];
    let any = false;
    for (const [label, lines] of groups) {
      if (!lines.length) continue;
      parent.append(detailsGroup(t(label), lines));
      any = true;
    }
    if (!any) parent.append(noteLine(t(STEPS[STEP_COUNT - 1].empty)));
  }
  function noteLine(text2) {
    const line = document.createElement("p");
    line.className = "gig-note";
    line.textContent = text2;
    return line;
  }
  function detailsGroup(label, lines) {
    const details = document.createElement("details");
    details.className = "gig-group";
    details.open = true;
    const summary = document.createElement("summary");
    summary.textContent = t("gig.groupCount", { label, count: lines.length });
    const list = document.createElement("ul");
    const shown = lines.slice(0, LIST_CAP);
    for (const line of shown) list.append(item(line));
    details.append(summary, list);
    if (lines.length > LIST_CAP) {
      const show2 = buttonEl(tips.gigShowAll);
      show2.className = "gig-show-all";
      show2.textContent = t("gig.showAll", { count: lines.length });
      show2.addEventListener("click", () => {
        list.replaceChildren();
        for (const line of lines) list.append(item(line));
        show2.remove();
      });
      details.append(show2);
    }
    return details;
  }
  function item(text2) {
    const row = document.createElement("li");
    row.textContent = text2;
    return row;
  }
  function actions(primary) {
    const bar = document.createElement("div");
    bar.className = "gig-actions";
    const back = buttonEl(tips.gigBack);
    back.dataset.gigAction = "back";
    back.textContent = t("common.back");
    back.disabled = stepIndex === 0;
    bar.append(back);
    if (primary) {
      const next2 = buttonEl(tips.gigNext);
      next2.className = "gig-primary";
      next2.dataset.gigAction = "next";
      next2.textContent = primary;
      bar.append(next2);
    }
    const exit = buttonEl(tips.gigExit);
    exit.dataset.gigAction = "exit";
    exit.textContent = t("gig.exit");
    bar.append(exit);
    return bar;
  }
  function doneScreen(payload) {
    const fragment = document.createDocumentFragment();
    fragment.append(heading(t("gig.done")));
    const art = document.createElement("div");
    art.id = "gig-ready-art";
    art.className = "gig-art-slot";
    art.dataset.slot = "gig-ready";
    art.setAttribute("aria-hidden", "true");
    const line = document.createElement("p");
    line.className = "gig-done";
    const crate = payload.scope?.crate_name || t("gig.wholeSpaceInline");
    line.textContent = t(payload.ready ? "gig.doneReady" : "gig.doneNotReady", {
      score: payload.score,
      crate,
      time: formatCheckedAt(checkedAt)
    });
    fragment.append(art, line);
    const holding = (payload.holding_it_back || []).map((item5) => item5.summary);
    if (holding.length) fragment.append(detailsGroup(t("gig.holding"), holding));
    fragment.append(actions(null));
    return fragment;
  }

  // src/drift.ts
  var LIST_CAP2 = 100;
  var REASON_ORDER = ["drifting", "live", "pending_map"];
  var REASON_KEYS = {
    drifting: "drift.reason.drifting",
    live: "drift.reason.live",
    pending_map: "drift.reason.pending_map"
  };
  var latest2 = null;
  function wireDrift() {
    const panel = el("drift-panel");
    if (panel.dataset.driftWired === "true") return;
    panel.dataset.driftWired = "true";
    el("drift-refresh").addEventListener("click", () => {
      void loadDrift();
    });
  }
  async function loadDrift() {
    const token3 = ++state.driftToken;
    beginBusy2();
    let settle = "none";
    if (state.activeCrate === "all") {
      failStatus2(t("error.tempo_needs_crate"));
      endBusy2();
      el("drift-refresh").focus();
      return;
    }
    const crate = String(state.activeCrate);
    try {
      const response = await fetch(
        `/api/tempo-drift?space=${encodeURIComponent(state.space)}&crate=${encodeURIComponent(crate)}`
      );
      if (token3 !== state.driftToken) return;
      const payload = await readJSON(response).catch(() => null);
      if (token3 !== state.driftToken) return;
      if (!response.ok || payload === null) {
        failStatus2(serverMessage(payload, t("drift.unreadable")));
        settle = "retry";
        return;
      }
      latest2 = payload;
      el("drift-status").textContent = "";
      renderDriftReport(payload);
      settle = "report";
    } catch {
      if (token3 !== state.driftToken) return;
      failStatus2(t("drift.unreachable"));
      settle = "retry";
    } finally {
      if (token3 !== state.driftToken) return;
      endBusy2();
      if (settle === "retry") el("drift-refresh").focus();
      if (settle === "report") el("drift-report").focus();
    }
  }
  function showDriftFailure(error2) {
    const message = error2 instanceof Error && error2.message ? error2.message : t("drift.unreadable");
    failStatus2(message);
    endBusy2();
    el("drift-refresh").focus();
  }
  function renderDriftReport(payload) {
    el("drift-scope").textContent = scopeLabel();
    const report = el("drift-report");
    const flags = payload.flags || [];
    const summary = document.createElement("p");
    summary.className = "gig-note";
    summary.textContent = flags.length ? t("drift.summary", { checked: payload.checked, count: flags.length }) : t("drift.summaryClear", { checked: payload.checked });
    report.replaceChildren(summary);
    if (payload.not_found) {
      report.append(noteLine2(t("drift.notFound", { count: payload.not_found })));
    }
    if (payload.unreadable) {
      report.append(noteLine2(t("drift.unreadableFiles", { count: payload.unreadable })));
    }
    if (payload.unchecked) {
      report.append(noteLine2(t("drift.unchecked", { count: payload.unchecked })));
    }
    if (payload.too_quiet) {
      report.append(noteLine2(t("drift.tooQuiet", { count: payload.too_quiet })));
    }
    if (payload.mapped) {
      report.append(noteLine2(t("drift.mapped", { count: payload.mapped })));
    }
    if (!flags.length) {
      report.append(noteLine2(t("drift.empty")));
      return;
    }
    for (const kind2 of reasonKinds(flags)) {
      const rows2 = flags.filter((item5) => item5.reasons.includes(kind2));
      report.append(detailsGroup2(reasonHeading(kind2), rows2.map(flagLine)));
    }
  }
  function repaintDrift() {
    el("drift-scope").textContent = scopeLabel();
    if (latest2) renderDriftReport(latest2);
  }
  function beginBusy2() {
    const button2 = el("drift-refresh");
    button2.disabled = true;
    button2.setAttribute("aria-busy", "true");
    el("drift-panel").setAttribute("aria-busy", "true");
    el("drift-status").textContent = t("drift.checking");
  }
  function endBusy2() {
    const button2 = el("drift-refresh");
    button2.disabled = state.activeCrate === "all";
    button2.setAttribute("aria-busy", "false");
    el("drift-panel").setAttribute("aria-busy", "false");
  }
  function failStatus2(message) {
    el("drift-status").textContent = message;
  }
  function scopeLabel() {
    if (state.activeCrate === "all") return t("gig.wholeSpace");
    const crate = state.crates.find((row) => row.id === state.activeCrate);
    return crate?.name || t("gig.wholeSpace");
  }
  function noteLine2(text2) {
    const line = document.createElement("p");
    line.className = "gig-note";
    line.textContent = text2;
    return line;
  }
  function reasonKinds(flags) {
    const seen = new Set(flags.flatMap((item5) => item5.reasons));
    const known = REASON_ORDER.filter((kind2) => seen.has(kind2));
    const extra = [...seen].filter((kind2) => !REASON_ORDER.includes(kind2)).sort();
    return [...known, ...extra];
  }
  function reasonHeading(kind2) {
    return t(REASON_KEYS[kind2] ?? "drift.reason.unknown");
  }
  function flagLine(item5) {
    const title2 = [item5.artist, item5.name].filter(Boolean).join(" — ") || item5.file;
    const reasons = item5.reasons.map(reasonHeading).join(", ");
    const bpm = item5.bpm_min != null && item5.bpm_max != null ? t("drift.bpmRange", { min: item5.bpm_min, max: item5.bpm_max }) : "";
    return t("drift.row", { title: title2, file: item5.file, reasons, bpm });
  }
  function detailsGroup2(label, lines) {
    const details = document.createElement("details");
    details.className = "gig-group";
    details.open = true;
    const summary = document.createElement("summary");
    summary.textContent = t("gig.groupCount", { label, count: lines.length });
    const list = document.createElement("ul");
    const shown = lines.slice(0, LIST_CAP2);
    for (const line of shown) list.append(item2(line));
    details.append(summary, list);
    if (lines.length > LIST_CAP2) {
      const show2 = buttonEl(tips.gigShowAll);
      show2.className = "gig-show-all";
      show2.textContent = t("gig.showAll", { count: lines.length });
      show2.addEventListener("click", () => {
        list.replaceChildren();
        for (const line of lines) list.append(item2(line));
        show2.remove();
      });
      details.append(show2);
    }
    return details;
  }
  function item2(text2) {
    const row = document.createElement("li");
    row.textContent = text2;
    return row;
  }

  // src/health.ts
  var SECTIONS = [
    { key: "missing", label: "health.missing", action: "missing" },
    { key: "no_bpm", label: "health.noBpm" },
    { key: "no_key", label: "health.noKey" },
    { key: "no_beatgrid", label: "health.noBeatgrid" },
    { key: "no_artwork", label: "health.noArtwork" },
    { key: "empty_genre", label: "health.emptyGenre" },
    { key: "no_crate", label: "health.noCrate" }
  ];
  var latest3 = null;
  var go = null;
  function wireHealth(navigate) {
    go = navigate;
    const panel = el("health-panel");
    if (panel.dataset.healthWired === "true") return;
    panel.dataset.healthWired = "true";
    el("health-refresh").addEventListener("click", () => {
      void loadHealth();
    });
    panel.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button2 = target.closest("button");
      if (!(button2 instanceof HTMLButtonElement)) return;
      const action = button2.dataset.healthAction;
      if (action === "missing" || action === "duplicates" || action === "files" || action === "bitrate") {
        go?.(action);
        return;
      }
      if (action === "track") {
        const id = Number(button2.dataset.healthId);
        if (Number.isInteger(id) && id > 0) go?.("track", id);
      }
    });
  }
  async function loadHealth() {
    const token3 = ++state.healthToken;
    beginBusy3();
    let settle = "none";
    const crate = state.activeCrate === "all" ? "all" : String(state.activeCrate);
    try {
      const response = await fetch(
        `/api/library-health?space=${encodeURIComponent(state.space)}&crate=${encodeURIComponent(crate)}`
      );
      if (token3 !== state.healthToken) return;
      const payload = await readJSON(response).catch(() => null);
      if (token3 !== state.healthToken) return;
      if (!response.ok || payload === null) {
        failStatus3(serverMessage(payload, t("health.unreadable")));
        settle = "retry";
        return;
      }
      latest3 = payload;
      el("health-status").textContent = "";
      renderHealthReport(payload);
      settle = "report";
    } catch {
      if (token3 !== state.healthToken) return;
      failStatus3(t("health.unreachable"));
      settle = "retry";
    } finally {
      if (token3 !== state.healthToken) return;
      endBusy3();
      if (settle === "retry") el("health-refresh").focus();
      if (settle === "report") el("health-report").focus();
    }
  }
  function showHealthFailure(error2) {
    const message = error2 instanceof Error && error2.message ? error2.message : t("health.unreadable");
    failStatus3(message);
    endBusy3();
    el("health-refresh").focus();
  }
  function renderHealthReport(payload) {
    el("health-scope").textContent = scopeLabel2();
    const report = el("health-report");
    const summary = document.createElement("p");
    summary.className = "gig-note";
    summary.textContent = t("health.summary", { count: payload.checked });
    report.replaceChildren(summary);
    let listed = 0;
    for (const spec2 of SECTIONS) {
      listed += paintSection(report, t(spec2.label), payload[spec2.key], spec2.action);
    }
    listed += paintUnused(report, payload.unused);
    listed += paintDuplicates(report, payload.duplicates);
    if (!listed) report.append(noteLine3(t("health.clear")));
    paintBitrateLink(report);
  }
  function repaintHealth() {
    el("health-scope").textContent = scopeLabel2();
    if (latest3) renderHealthReport(latest3);
  }
  function beginBusy3() {
    const button2 = el("health-refresh");
    button2.disabled = true;
    button2.setAttribute("aria-busy", "true");
    el("health-panel").setAttribute("aria-busy", "true");
    el("health-status").textContent = t("health.checking");
  }
  function endBusy3() {
    const button2 = el("health-refresh");
    button2.disabled = false;
    button2.setAttribute("aria-busy", "false");
    el("health-panel").setAttribute("aria-busy", "false");
  }
  function failStatus3(message) {
    el("health-status").textContent = message;
  }
  function scopeLabel2() {
    if (state.activeCrate === "all") return t("gig.wholeSpace");
    const crate = state.crates.find((row) => row.id === state.activeCrate);
    return crate?.name || t("gig.wholeSpace");
  }
  function noteLine3(text2) {
    const line = document.createElement("p");
    line.className = "gig-note";
    line.textContent = text2;
    return line;
  }
  function paintSection(report, label, section, action) {
    const count = section?.count ?? 0;
    const tracks = section?.tracks ?? [];
    const details = document.createElement("details");
    details.className = "gig-group";
    details.open = count > 0;
    const heading2 = document.createElement("summary");
    heading2.textContent = t("gig.groupCount", { label, count });
    details.append(heading2);
    if (action === "missing") details.append(openButton("missing", "health.openMissing", tips.healthOpenMissing));
    const list = document.createElement("ul");
    for (const track of tracks) list.append(trackItem(track));
    details.append(list);
    if (count > tracks.length) {
      details.append(noteLine3(t("health.more", { count: count - tracks.length })));
    }
    report.append(details);
    return count;
  }
  function paintUnused(report, section) {
    const count = section?.count ?? 0;
    const files = section?.files ?? [];
    const details = document.createElement("details");
    details.className = "gig-group";
    details.open = count > 0;
    const heading2 = document.createElement("summary");
    heading2.textContent = t("gig.groupCount", { label: t("health.unused"), count });
    details.append(heading2);
    details.append(openButton("files", "health.openFiles", tips.healthOpenFiles));
    const list = document.createElement("ul");
    for (const row of files) {
      const item5 = document.createElement("li");
      item5.textContent = t("health.fileRow", { file: row.file });
      list.append(item5);
    }
    details.append(list);
    if (count > files.length) {
      details.append(noteLine3(t("health.more", { count: count - files.length })));
    }
    report.append(details);
    return count;
  }
  function paintDuplicates(report, section) {
    const count = section?.count ?? 0;
    const groups = section?.groups ?? [];
    const details = document.createElement("details");
    details.className = "gig-group";
    details.open = count > 0;
    const heading2 = document.createElement("summary");
    heading2.textContent = t("gig.groupCount", { label: t("health.duplicates"), count });
    details.append(heading2);
    details.append(openButton("duplicates", "health.openDuplicates", tips.healthOpenDuplicates));
    const list = document.createElement("ul");
    for (const group of groups) list.append(groupItem(group));
    details.append(list);
    if (count > groups.length) {
      details.append(noteLine3(t("health.more", { count: count - groups.length })));
    }
    report.append(details);
    return count;
  }
  function paintBitrateLink(report) {
    const details = document.createElement("details");
    details.className = "gig-group";
    details.open = true;
    const heading2 = document.createElement("summary");
    heading2.textContent = t("health.bitrate");
    details.append(heading2);
    details.append(openButton("bitrate", "health.openBitrate", tips.healthOpenBitrate));
    details.append(noteLine3(t("health.bitrateNote")));
    report.append(details);
  }
  function openButton(action, label, tip) {
    const button2 = buttonEl(tip);
    button2.dataset.healthAction = action;
    button2.textContent = t(label);
    return button2;
  }
  function trackItem(track) {
    const row = document.createElement("li");
    const button2 = buttonEl(tips.healthTrack);
    button2.dataset.healthAction = "track";
    button2.dataset.healthId = String(track.id);
    button2.textContent = trackLine(track);
    row.append(button2);
    return row;
  }
  function groupItem(group) {
    const row = document.createElement("li");
    row.textContent = t("health.duplicateRow", {
      title: [group.artist, group.name].filter(Boolean).join(" — ") || group.name,
      count: group.ids.length
    });
    return row;
  }
  function trackLine(track) {
    return t("health.row", {
      title: [track.artist, track.name].filter(Boolean).join(" — ") || track.file
    });
  }

  // src/history-stats-view.ts
  var IDLE_DAYS_DEFAULT = 365;
  var IDLE_DAYS_MAX = 3650;
  var DAY = 86400;
  var PERIODS = /* @__PURE__ */ new Set(["all", "7", "30", "90", "365", "custom"]);
  function isStatsPeriod(value) {
    return PERIODS.has(value);
  }
  function dayStartUnix(iso) {
    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
    if (!parts) return null;
    const stamp = new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3])).getTime();
    if (Number.isNaN(stamp)) return null;
    return Math.floor(stamp / 1e3);
  }
  function dayAfterUnix(iso) {
    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
    if (!parts) return null;
    const stamp = new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]) + 1).getTime();
    if (Number.isNaN(stamp)) return null;
    return Math.floor(stamp / 1e3);
  }
  function periodRange(period, from, to, nowMs) {
    if (period === "all") return { start: null, end: null };
    if (period !== "custom") {
      const end = Math.floor(nowMs / 1e3);
      return { start: end - Number(period) * DAY, end };
    }
    return { start: dayStartUnix(from), end: dayAfterUnix(to) };
  }
  function idleDaysFromInput(raw) {
    if (!/^\d{1,4}$/.test(raw.trim())) return IDLE_DAYS_DEFAULT;
    const value = Number(raw.trim());
    if (value < 1 || value > IDLE_DAYS_MAX) return IDLE_DAYS_DEFAULT;
    return value;
  }
  function statsQuery(space, range, idleDays) {
    const query = new URLSearchParams({ space });
    if (range.start != null) query.set("from", String(range.start));
    if (range.end != null) query.set("to", String(range.end));
    if (idleDays !== IDLE_DAYS_DEFAULT) query.set("idle_days", String(idleDays));
    return query.toString();
  }
  function csvHref(query) {
    return query ? `/api/history-stats.csv?${query}` : "/api/history-stats.csv";
  }

  // src/history-stats.ts
  var LIST_CAP3 = 100;
  var latest4 = null;
  var crateBusy = false;
  function wireHistoryStats() {
    const panel = el("stats-panel");
    if (panel.dataset.statsWired === "true") return;
    panel.dataset.statsWired = "true";
    el("stats-refresh").addEventListener("click", () => {
      void loadHistoryStats();
    });
    el("stats-period").addEventListener("change", () => {
      syncPeriodFields();
      if (currentPeriod() !== "custom") void loadHistoryStats();
    });
    el("stats-csv").addEventListener("click", () => {
      const link = document.createElement("a");
      link.href = csvHref(currentQuery());
      link.download = "play-stats.csv";
      link.click();
    });
    panel.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button2 = target.closest("button");
      if (!(button2 instanceof HTMLButtonElement)) return;
      if (button2.dataset.statsAction === "crate") void makeIdleCrate();
    });
    syncPeriodFields();
  }
  async function loadHistoryStats() {
    const token3 = ++state.statsToken;
    beginBusy4();
    let settle = "none";
    try {
      const response = await fetch(`/api/history-stats?${currentQuery()}`);
      if (token3 !== state.statsToken) return;
      const payload = await readJSON(response).catch(() => null);
      if (token3 !== state.statsToken) return;
      if (!response.ok || payload === null) {
        failStatus4(serverMessage(payload, t("stats.unreadable")));
        settle = "retry";
        return;
      }
      latest4 = payload;
      el("stats-status").textContent = "";
      renderHistoryStats(payload);
      settle = "report";
    } catch {
      if (token3 !== state.statsToken) return;
      failStatus4(t("stats.unreachable"));
      settle = "retry";
    } finally {
      if (token3 !== state.statsToken) return;
      endBusy4();
      if (settle === "retry") el("stats-refresh").focus();
      if (settle === "report") el("stats-report").focus();
    }
  }
  function showHistoryStatsFailure(error2) {
    const message = error2 instanceof Error && error2.message ? error2.message : t("stats.unreadable");
    failStatus4(message);
    endBusy4();
    el("stats-refresh").focus();
  }
  function renderHistoryStats(payload) {
    el("stats-scope").textContent = t("gig.wholeSpace");
    const report = el("stats-report");
    const plays = payload.plays ?? 0;
    const sessions = payload.sessions ?? 0;
    const idleDays = payload.idle_days ?? 365;
    const idleCount = payload.not_played_count ?? 0;
    const summary = document.createElement("p");
    summary.className = "gig-note";
    summary.textContent = plays ? t("stats.summary", { plays, sessions }) : t("stats.empty");
    report.replaceChildren(summary);
    report.append(trackTable(payload.top_tracks ?? []));
    report.append(artistTable(payload.top_artists ?? []));
    report.append(idleGroup(payload.not_played ?? [], idleCount, idleDays));
  }
  function repaintHistoryStats() {
    el("stats-scope").textContent = t("gig.wholeSpace");
    syncPeriodFields();
    if (latest4) renderHistoryStats(latest4);
  }
  function currentPeriod() {
    const value = el("stats-period").value;
    return isStatsPeriod(value) ? value : "all";
  }
  function currentQuery() {
    const range = periodRange(
      currentPeriod(),
      el("stats-from").value,
      el("stats-to").value,
      Date.now()
    );
    return statsQuery(state.space, range, idleDaysFromInput(el("stats-idle-days").value));
  }
  function syncPeriodFields() {
    const custom = currentPeriod() === "custom";
    el("stats-from").disabled = !custom;
    el("stats-to").disabled = !custom;
  }
  function beginBusy4() {
    const button2 = el("stats-refresh");
    button2.disabled = true;
    button2.setAttribute("aria-busy", "true");
    el("stats-panel").setAttribute("aria-busy", "true");
    el("stats-status").textContent = t("stats.checking");
  }
  function endBusy4() {
    const button2 = el("stats-refresh");
    button2.disabled = false;
    button2.setAttribute("aria-busy", "false");
    el("stats-panel").setAttribute("aria-busy", "false");
  }
  function failStatus4(message) {
    el("stats-status").textContent = message;
  }
  function trackTable(rows2) {
    const details = document.createElement("details");
    details.className = "gig-group";
    details.open = rows2.length > 0;
    const heading2 = document.createElement("summary");
    heading2.textContent = t("gig.groupCount", { label: t("stats.tracks"), count: rows2.length });
    details.append(heading2);
    if (!rows2.length) {
      details.append(noteLine4(t("stats.emptyTracks")));
      return details;
    }
    const table = document.createElement("table");
    table.className = "stats-table";
    const head = document.createElement("thead");
    head.append(headerRow(["column.title", "column.artist", "column.plays", "column.lastPlayed"]));
    table.append(head);
    const body = document.createElement("tbody");
    for (const row of rows2.slice(0, LIST_CAP3)) {
      body.append(dataRow([
        row.name || "—",
        row.artist || "—",
        String(row.plays ?? 0),
        clockLabel(row.last_played) || "—"
      ]));
    }
    table.append(body);
    details.append(table);
    if (rows2.length > LIST_CAP3) details.append(noteLine4(t("stats.more", { count: rows2.length - LIST_CAP3 })));
    return details;
  }
  function artistTable(rows2) {
    const details = document.createElement("details");
    details.className = "gig-group";
    details.open = rows2.length > 0;
    const heading2 = document.createElement("summary");
    heading2.textContent = t("gig.groupCount", { label: t("stats.artists"), count: rows2.length });
    details.append(heading2);
    if (!rows2.length) {
      details.append(noteLine4(t("stats.emptyArtists")));
      return details;
    }
    const table = document.createElement("table");
    table.className = "stats-table";
    const head = document.createElement("thead");
    head.append(headerRow(["column.artist", "column.plays", "stats.artistTracks", "column.lastPlayed"]));
    table.append(head);
    const body = document.createElement("tbody");
    for (const row of rows2.slice(0, LIST_CAP3)) {
      body.append(dataRow([
        row.artist || "—",
        String(row.plays ?? 0),
        String(row.tracks ?? 0),
        clockLabel(row.last_played) || "—"
      ]));
    }
    table.append(body);
    details.append(table);
    if (rows2.length > LIST_CAP3) details.append(noteLine4(t("stats.more", { count: rows2.length - LIST_CAP3 })));
    return details;
  }
  function idleGroup(rows2, count, idleDays) {
    const details = document.createElement("details");
    details.className = "gig-group";
    details.open = count > 0;
    const heading2 = document.createElement("summary");
    heading2.textContent = t("gig.groupCount", { label: t("stats.idle"), count });
    details.append(heading2);
    details.append(noteLine4(t("stats.idleHint", { days: idleDays })));
    const crate = buttonEl(tips.statsIdleCrate);
    crate.dataset.statsAction = "crate";
    crate.textContent = t("stats.idleCrate");
    crate.disabled = crateBusy || !state.writable || count === 0;
    details.append(crate);
    if (!count) {
      details.append(noteLine4(t("stats.emptyIdle")));
      return details;
    }
    const list = document.createElement("ul");
    for (const row of rows2.slice(0, LIST_CAP3)) {
      const item5 = document.createElement("li");
      const last = row.last_played == null ? t("stats.never") : clockLabel(row.last_played) || "—";
      item5.textContent = t("stats.idleRow", {
        title: [row.artist, row.name].filter(Boolean).join(" — ") || row.name || "—",
        last
      });
      list.append(item5);
    }
    details.append(list);
    if (count > rows2.length) details.append(noteLine4(t("stats.more", { count: count - rows2.length })));
    else if (rows2.length > LIST_CAP3) details.append(noteLine4(t("stats.more", { count: rows2.length - LIST_CAP3 })));
    return details;
  }
  async function makeIdleCrate() {
    if (crateBusy) return;
    const idleDays = idleDaysFromInput(el("stats-idle-days").value);
    const name = t("stats.idleCrateName", { days: idleDays });
    crateBusy = true;
    try {
      const preview = await postJSON("/api/history-stats", {
        action: "preview",
        space: state.space,
        idle_days: idleDays,
        name
      });
      const count = preview.count ?? 0;
      if (!count) {
        el("stats-status").textContent = t("stats.emptyIdle");
        return;
      }
      const label = String(preview.name || name);
      if (!confirm(t("stats.confirmCrate", { name: label, count, days: idleDays }))) return;
      const created = await postJSON("/api/history-stats", {
        action: "create",
        space: state.space,
        idle_days: idleDays,
        name: label
      });
      if (!created.written) {
        el("stats-status").textContent = t("stats.emptyIdle");
        return;
      }
      await bridge.reloadLibrary();
      await loadHistoryStats();
      el("stats-status").textContent = created.warning || t("stats.written", {
        name: String(created.name || label),
        count: created.count ?? count
      });
    } catch (error2) {
      if (failureOf(error2).status === 409) {
        bridge.lockDown(error2);
        return;
      }
      el("stats-status").textContent = failureOf(error2).message;
    } finally {
      crateBusy = false;
      if (latest4) renderHistoryStats(latest4);
    }
  }
  function headerRow(keys) {
    const row = document.createElement("tr");
    for (const key of keys) {
      const cell = document.createElement("th");
      cell.scope = "col";
      cell.textContent = t(key);
      row.append(cell);
    }
    return row;
  }
  function dataRow(values) {
    const row = document.createElement("tr");
    for (const value of values) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }
    return row;
  }
  function noteLine4(text2) {
    const line = document.createElement("p");
    line.className = "gig-note";
    line.textContent = text2;
    return line;
  }

  // src/scan.ts
  var LIST_CAP4 = 100;
  var PROBLEM_ORDER = [
    "empty",
    "unreadable",
    "wrong_format",
    "serato_flagged",
    "undecodable",
    "decode_error",
    "short"
  ];
  var PROBLEM_KEYS = {
    empty: "scan.problem.empty",
    unreadable: "scan.problem.unreadable",
    wrong_format: "scan.problem.wrong_format",
    serato_flagged: "scan.problem.serato_flagged",
    undecodable: "scan.problem.undecodable",
    decode_error: "scan.problem.decode_error",
    short: "scan.problem.short"
  };
  var latest5 = null;
  var lastDepth = "quick";
  function wireScan() {
    const panel = el("scan-panel");
    if (panel.dataset.scanWired === "true") return;
    panel.dataset.scanWired = "true";
    el("scan-quick").addEventListener("click", () => {
      void loadScan("quick");
    });
    el("scan-full").addEventListener("click", () => {
      void loadScan("full");
    });
  }
  async function loadScan(depth) {
    const chosen = resolveDepth(depth);
    const token3 = ++state.scanToken;
    beginBusy5();
    let settle = "none";
    if (chosen === "full" && state.activeCrate === "all") {
      failStatus5(t("error.scan_full_needs_crate"));
      endBusy5();
      el("scan-full").focus();
      return;
    }
    lastDepth = chosen;
    const crate = state.activeCrate === "all" ? "all" : String(state.activeCrate);
    try {
      const response = await fetch(
        `/api/file-scan?space=${encodeURIComponent(state.space)}&crate=${encodeURIComponent(crate)}&depth=${encodeURIComponent(chosen)}`
      );
      if (token3 !== state.scanToken) return;
      const payload = await readJSON(response).catch(() => null);
      if (token3 !== state.scanToken) return;
      if (!response.ok || payload === null) {
        failStatus5(serverMessage(payload, t("scan.unreadable")));
        settle = "retry";
        return;
      }
      latest5 = payload;
      el("scan-status").textContent = "";
      renderScanReport(payload);
      settle = "report";
    } catch {
      if (token3 !== state.scanToken) return;
      failStatus5(t("scan.unreachable"));
      settle = "retry";
    } finally {
      if (token3 !== state.scanToken) return;
      endBusy5();
      if (settle === "retry") el("scan-quick").focus();
      if (settle === "report") el("scan-report").focus();
    }
  }
  function showScanFailure(error2) {
    const message = error2 instanceof Error && error2.message ? error2.message : t("scan.unreadable");
    failStatus5(message);
    endBusy5();
    el("scan-quick").focus();
  }
  function renderScanReport(payload) {
    el("scan-scope").textContent = scopeLabel3();
    const report = el("scan-report");
    const problems = payload.problems || [];
    const summary = document.createElement("p");
    summary.className = "gig-note";
    summary.textContent = problems.length ? t("scan.summary", { checked: payload.checked, count: problems.length }) : t("scan.summaryClear", { checked: payload.checked });
    report.replaceChildren(summary);
    if (payload.not_found) {
      report.append(noteLine5(t("scan.notFound", { count: payload.not_found })));
    }
    if (payload.unchecked) {
      report.append(noteLine5(t("scan.unchecked", { count: payload.unchecked })));
    }
    if (!problems.length) {
      report.append(noteLine5(t("scan.empty")));
      return;
    }
    for (const kind2 of problemKinds(problems)) {
      const rows2 = problems.filter((item5) => item5.problem === kind2);
      report.append(detailsGroup3(problemHeading(kind2), rows2.map(problemLine)));
    }
  }
  function repaintScan() {
    el("scan-scope").textContent = scopeLabel3();
    if (latest5) renderScanReport(latest5);
  }
  function resolveDepth(depth) {
    if (depth === "quick" || depth === "full") return depth;
    if (lastDepth === "full" && state.activeCrate === "all") return "quick";
    return lastDepth;
  }
  function beginBusy5() {
    for (const id of ["scan-quick", "scan-full"]) {
      const button2 = el(id);
      button2.disabled = true;
      button2.setAttribute("aria-busy", "true");
    }
    el("scan-panel").setAttribute("aria-busy", "true");
    el("scan-status").textContent = t("scan.checking");
  }
  function endBusy5() {
    el("scan-quick").disabled = false;
    el("scan-quick").setAttribute("aria-busy", "false");
    const full = el("scan-full");
    full.disabled = state.activeCrate === "all";
    full.setAttribute("aria-busy", "false");
    el("scan-panel").setAttribute("aria-busy", "false");
  }
  function failStatus5(message) {
    el("scan-status").textContent = message;
  }
  function scopeLabel3() {
    if (state.activeCrate === "all") return t("gig.wholeSpace");
    const crate = state.crates.find((row) => row.id === state.activeCrate);
    return crate?.name || t("gig.wholeSpace");
  }
  function noteLine5(text2) {
    const line = document.createElement("p");
    line.className = "gig-note";
    line.textContent = text2;
    return line;
  }
  function problemKinds(problems) {
    const seen = new Set(problems.map((item5) => item5.problem));
    const known = PROBLEM_ORDER.filter((kind2) => seen.has(kind2));
    const extra = [...seen].filter((kind2) => !PROBLEM_ORDER.includes(kind2)).sort();
    return [...known, ...extra];
  }
  function problemHeading(kind2) {
    return t(PROBLEM_KEYS[kind2] ?? "scan.problem.unknown");
  }
  function problemLine(item5) {
    const title2 = [item5.artist, item5.name].filter(Boolean).join(" — ") || item5.file;
    const label = problemDetail(item5);
    return t("scan.row", { title: title2, file: item5.file, problem: label });
  }
  function problemDetail(item5) {
    const heading2 = problemHeading(item5.problem);
    if (item5.problem === "wrong_format" && item5.detail) {
      return t("scan.wrongFormatDetail", { detail: item5.detail });
    }
    if ((item5.problem === "decode_error" || item5.problem === "short") && item5.detail) {
      return t(item5.problem === "short" ? "scan.shortDetail" : "scan.decodeErrorDetail", {
        detail: item5.detail
      });
    }
    if (item5.problem === "serato_flagged" && item5.detail) {
      return `${heading2}: ${item5.detail}`;
    }
    return heading2;
  }
  function detailsGroup3(label, lines) {
    const details = document.createElement("details");
    details.className = "gig-group";
    details.open = true;
    const summary = document.createElement("summary");
    summary.textContent = t("gig.groupCount", { label, count: lines.length });
    const list = document.createElement("ul");
    const shown = lines.slice(0, LIST_CAP4);
    for (const line of shown) list.append(item3(line));
    details.append(summary, list);
    if (lines.length > LIST_CAP4) {
      const show2 = buttonEl(tips.gigShowAll);
      show2.className = "gig-show-all";
      show2.textContent = t("gig.showAll", { count: lines.length });
      show2.addEventListener("click", () => {
        list.replaceChildren();
        for (const line of lines) list.append(item3(line));
        show2.remove();
      });
      details.append(show2);
    }
    return details;
  }
  function item3(text2) {
    const row = document.createElement("li");
    row.textContent = text2;
    return row;
  }

  // src/bitrate.ts
  var LIST_CAP5 = 100;
  var REASON_ORDER2 = ["upsampled", "lossy_source"];
  var REASON_KEYS2 = {
    upsampled: "bitrate.reason.upsampled",
    lossy_source: "bitrate.reason.lossy_source"
  };
  var latest6 = null;
  var cratePlan = null;
  function wireBitrate() {
    const panel = el("bitrate-panel");
    if (panel.dataset.bitrateWired === "true") return;
    panel.dataset.bitrateWired = "true";
    el("bitrate-refresh").addEventListener("click", () => {
      void loadBitrate();
    });
    el("bitrate-save").addEventListener("click", () => {
      void previewCrate();
    });
    el("bitrate-report").addEventListener("click", (event) => {
      const button2 = event.target.closest("[data-bitrate-action]");
      if (!button2 || button2.disabled) return;
      if (button2.dataset.bitrateAction === "confirm") void createCrate();
    });
  }
  async function loadBitrate() {
    const token3 = ++state.bitrateToken;
    cratePlan = null;
    beginBusy6();
    let settle = "none";
    if (state.activeCrate === "all") {
      failStatus6(t("error.bitrate_needs_crate"));
      endBusy6();
      el("bitrate-refresh").focus();
      return;
    }
    const crate = String(state.activeCrate);
    try {
      const response = await fetch(
        `/api/bitrate-check?space=${encodeURIComponent(state.space)}&crate=${encodeURIComponent(crate)}`
      );
      if (token3 !== state.bitrateToken) return;
      const payload = await readJSON(response).catch(() => null);
      if (token3 !== state.bitrateToken) return;
      if (!response.ok || payload === null) {
        failStatus6(serverMessage(payload, t("bitrate.unreadable")));
        settle = "retry";
        return;
      }
      latest6 = payload;
      el("bitrate-status").textContent = "";
      renderBitrateReport(payload);
      settle = "report";
    } catch {
      if (token3 !== state.bitrateToken) return;
      failStatus6(t("bitrate.unreachable"));
      settle = "retry";
    } finally {
      if (token3 !== state.bitrateToken) return;
      endBusy6();
      if (settle === "retry") el("bitrate-refresh").focus();
      if (settle === "report") el("bitrate-report").focus();
    }
  }
  function showBitrateFailure(error2) {
    const message = error2 instanceof Error && error2.message ? error2.message : t("bitrate.unreadable");
    failStatus6(message);
    endBusy6();
    el("bitrate-refresh").focus();
  }
  function renderBitrateReport(payload) {
    el("bitrate-scope").textContent = scopeLabel4();
    const report = el("bitrate-report");
    const suspects = payload.suspects || [];
    const summary = document.createElement("p");
    summary.className = "gig-note";
    summary.textContent = suspects.length ? t("bitrate.summary", { checked: payload.checked, count: suspects.length }) : t("bitrate.summaryClear", { checked: payload.checked });
    report.replaceChildren(summary);
    if (payload.not_found) {
      report.append(noteLine6(t("bitrate.notFound", { count: payload.not_found })));
    }
    if (payload.unreadable) {
      report.append(noteLine6(t("bitrate.unreadableFiles", { count: payload.unreadable })));
    }
    if (payload.unchecked) {
      report.append(noteLine6(t("bitrate.unchecked", { count: payload.unchecked })));
    }
    if (payload.too_quiet) {
      report.append(noteLine6(t("bitrate.tooQuiet", { count: payload.too_quiet })));
    }
    if (!suspects.length) {
      report.append(noteLine6(t("bitrate.empty")));
      paintPlan(report);
      return;
    }
    for (const kind2 of reasonKinds2(suspects)) {
      const rows2 = suspects.filter((item5) => item5.reason === kind2);
      report.append(detailsGroup4(reasonHeading2(kind2), rows2.map(suspectLine)));
    }
    paintPlan(report);
  }
  function repaintBitrate() {
    el("bitrate-scope").textContent = scopeLabel4();
    if (latest6) renderBitrateReport(latest6);
  }
  async function previewCrate() {
    if (state.activeCrate === "all") {
      failStatus6(t("error.bitrate_needs_crate"));
      el("bitrate-refresh").focus();
      return;
    }
    const token3 = ++state.bitrateToken;
    beginBusy6("preview");
    try {
      const payload = await postJSON("/api/bitrate-check", {
        action: "preview",
        space: state.space,
        crate: state.activeCrate
      });
      if (token3 !== state.bitrateToken) return;
      cratePlan = payload;
      latest6 = payload;
      el("bitrate-status").textContent = payload.added ? t("bitrate.preview", { count: payload.added, name: payload.name }) : t("bitrate.previewEmpty");
      renderBitrateReport(payload);
      const confirm2 = el("bitrate-report").querySelector("[data-bitrate-action='confirm']");
      (confirm2 ?? el("bitrate-save")).focus();
    } catch (error2) {
      if (token3 !== state.bitrateToken) return;
      failStatus6(failureOf(error2).message);
      el("bitrate-save").focus();
    } finally {
      if (token3 !== state.bitrateToken) return;
      endBusy6();
    }
  }
  async function createCrate() {
    if (!cratePlan || !cratePlan.added || state.activeCrate === "all") return;
    const token3 = ++state.bitrateToken;
    beginBusy6("create");
    try {
      const payload = await postJSON("/api/bitrate-check", {
        action: "create",
        space: state.space,
        crate: state.activeCrate
      });
      if (token3 !== state.bitrateToken) return;
      await bridge.reloadLibrary();
      if (token3 !== state.bitrateToken) return;
      cratePlan = payload;
      latest6 = payload;
      el("bitrate-status").textContent = payload.written ? t("bitrate.written", { count: payload.added, name: payload.name }) : t("bitrate.previewEmpty");
      renderBitrateReport(payload);
      el("bitrate-report").focus();
    } catch (error2) {
      if (token3 !== state.bitrateToken) return;
      const failed = failureOf(error2);
      failStatus6(failed.message);
      if (failed.status === 409) bridge.lockDown(error2);
      el("bitrate-save").focus();
    } finally {
      if (token3 !== state.bitrateToken) return;
      endBusy6();
    }
  }
  function beginBusy6(kind2 = "check") {
    for (const id of ["bitrate-refresh", "bitrate-save"]) {
      const button2 = el(id);
      button2.disabled = true;
      button2.setAttribute("aria-busy", "true");
    }
    el("bitrate-panel").setAttribute("aria-busy", "true");
    const status = kind2 === "create" ? t("bitrate.saving") : kind2 === "preview" ? t("bitrate.checking") : t("bitrate.checking");
    el("bitrate-status").textContent = status;
  }
  function endBusy6() {
    const noCrate = state.activeCrate === "all";
    const refresh = el("bitrate-refresh");
    refresh.disabled = noCrate;
    refresh.setAttribute("aria-busy", "false");
    const save3 = el("bitrate-save");
    const flagged = Boolean(latest6?.suspects.length);
    save3.disabled = noCrate || !flagged;
    save3.setAttribute("aria-busy", "false");
    el("bitrate-panel").setAttribute("aria-busy", "false");
  }
  function failStatus6(message) {
    el("bitrate-status").textContent = message;
  }
  function scopeLabel4() {
    if (state.activeCrate === "all") return t("gig.wholeSpace");
    const crate = state.crates.find((row) => row.id === state.activeCrate);
    return crate?.name || t("gig.wholeSpace");
  }
  function noteLine6(text2) {
    const line = document.createElement("p");
    line.className = "gig-note";
    line.textContent = text2;
    return line;
  }
  function reasonKinds2(suspects) {
    const seen = new Set(suspects.map((item5) => item5.reason));
    const known = REASON_ORDER2.filter((kind2) => seen.has(kind2));
    const extra = [...seen].filter((kind2) => !REASON_ORDER2.includes(kind2)).sort();
    return [...known, ...extra];
  }
  function reasonHeading2(kind2) {
    return t(REASON_KEYS2[kind2] ?? "bitrate.reason.unknown");
  }
  function suspectLine(item5) {
    const title2 = [item5.artist, item5.name].filter(Boolean).join(" — ") || item5.file;
    const reason = reasonHeading2(item5.reason);
    const detail = item5.stated_kbps != null && item5.estimated_kbps != null ? t("bitrate.detail", { stated: item5.stated_kbps, estimated: item5.estimated_kbps }) : item5.estimated_kbps != null ? t("bitrate.detailEstimate", { estimated: item5.estimated_kbps }) : "";
    return t("bitrate.row", { title: title2, file: item5.file, reason, detail });
  }
  function paintPlan(report) {
    if (!cratePlan) return;
    if (cratePlan.written && cratePlan.saved) {
      report.append(noteLine6(t("bitrate.written", { count: cratePlan.added, name: cratePlan.name })));
      return;
    }
    if (!cratePlan.added) {
      report.append(noteLine6(t("bitrate.previewEmpty")));
      return;
    }
    report.append(noteLine6(t("bitrate.preview", { count: cratePlan.added, name: cratePlan.name })));
    const confirm2 = buttonEl(tips.bitrateConfirm);
    confirm2.dataset.bitrateAction = "confirm";
    confirm2.textContent = t("bitrate.confirmCrate");
    confirm2.disabled = !state.writable;
    report.append(confirm2);
  }
  function detailsGroup4(label, lines) {
    const details = document.createElement("details");
    details.className = "gig-group";
    details.open = true;
    const summary = document.createElement("summary");
    summary.textContent = t("gig.groupCount", { label, count: lines.length });
    const list = document.createElement("ul");
    const shown = lines.slice(0, LIST_CAP5);
    for (const line of shown) list.append(item4(line));
    details.append(summary, list);
    if (lines.length > LIST_CAP5) {
      const show2 = buttonEl(tips.gigShowAll);
      show2.className = "gig-show-all";
      show2.textContent = t("gig.showAll", { count: lines.length });
      show2.addEventListener("click", () => {
        list.replaceChildren();
        for (const line of lines) list.append(item4(line));
        show2.remove();
      });
      details.append(show2);
    }
    return details;
  }
  function item4(text2) {
    const row = document.createElement("li");
    row.textContent = text2;
    return row;
  }

  // src/tags-view.ts
  function tagsSummary(field, values, groups) {
    if (field === "titles") return titlesSummary(groups);
    if (groups === 0) {
      return field === "genre" ? t("tags.summaryGenreClear", { count: values }) : t("tags.summaryArtistClear", { count: values });
    }
    return field === "genre" ? t("tags.summaryGenre", { values, count: groups }) : t("tags.summaryArtist", { values, count: groups });
  }
  function titlesSummary(changes) {
    if (!changes) return t("tags.summaryTitlesClear");
    return t("tags.summaryTitles", { count: changes });
  }
  function groupHeading(group) {
    return t("tags.group", {
      name: group.suggested,
      spellings: t("tags.spellingCount", { count: group.spellings.length }),
      tracks: t("tags.trackCount", { count: group.tracks })
    });
  }
  function spellingLabel(value, count, suggested) {
    const base = t("tags.row", { value, count });
    return suggested ? `${base} — ${t("tags.suggested")}` : base;
  }
  function previewSummary(plan) {
    if (!plan.changes.length) return t("tags.noChanges");
    return t("tags.previewSummary", { count: plan.changes.length, value: plan.value });
  }
  function titlesPreviewSummary(plan) {
    if (!plan.changes.length) return t("tags.summaryTitlesClear");
    return t("tags.titlesPreviewSummary", { count: plan.changes.length });
  }
  function writtenSummary(plan) {
    return t("tags.written", { count: plan.changes.length, value: plan.value });
  }
  function titlesWrittenSummary(plan) {
    return t("tags.titlesWritten", { count: plan.changes.length });
  }
  function mappingPreviewSummary(plan) {
    if (!plan.changes.length) return t("tags.noChanges");
    return t("tags.mappingSummary", { count: plan.changes.length });
  }
  function mappingWrittenSummary(plan) {
    return t("tags.mappingWritten", { count: plan.changes.length });
  }
  function mappingFieldLabel(field) {
    if (field === "genre") return t("tags.genre");
    if (field === "artist") return t("tags.artist");
    return field;
  }
  function groupChanges(changes) {
    const rows2 = /* @__PURE__ */ new Map();
    for (const change of changes) {
      const remixer = change.remixer ?? "";
      const field = change.field ?? "";
      const id = `${field}\0${change.from}\0${change.to}\0${remixer}`;
      const existing = rows2.get(id);
      if (existing) existing.count += 1;
      else {
        const row = { from: change.from, to: change.to, count: 1 };
        if (change.remixer) row.remixer = change.remixer;
        if (change.field) row.field = change.field;
        rows2.set(id, row);
      }
    }
    return [...rows2.values()];
  }
  function previewLines(changes) {
    return groupChanges(changes).map((row) => {
      if (row.field) {
        return t("tags.previewLineField", {
          field: mappingFieldLabel(row.field),
          from: row.from,
          to: row.to,
          count: row.count
        });
      }
      return row.remixer ? t("tags.previewLineRemixer", {
        from: row.from,
        to: row.to,
        remixer: row.remixer,
        count: row.count
      }) : t("tags.previewLine", { from: row.from, to: row.to, count: row.count });
    });
  }

  // src/tags.ts
  var LIST_CAP6 = 100;
  var FIELD_BUTTONS = ["tags-genre", "tags-artist", "tags-titles", "tags-refresh"];
  var TITLE_KEY = "clean";
  var MAPPING_KEY = "saved";
  var latest7 = null;
  var titlePlan = null;
  var mappingPlan = null;
  var plans = /* @__PURE__ */ new Map();
  var selectedByKey = /* @__PURE__ */ new Map();
  var panelBusy = false;
  var actionKey = "";
  function wireTags() {
    const panel = el("tags-panel");
    if (panel.dataset.tagsWired === "true") return;
    panel.dataset.tagsWired = "true";
    el("tags-genre").addEventListener("click", () => {
      if (currentField() === "genre") return;
      setField("genre");
      void loadTags();
    });
    el("tags-artist").addEventListener("click", () => {
      if (currentField() === "artist") return;
      setField("artist");
      void loadTags();
    });
    el("tags-titles").addEventListener("click", () => {
      if (currentField() === "titles") return;
      setField("titles");
      void loadTags();
    });
    el("tags-refresh").addEventListener("click", () => {
      void loadTags();
    });
    el("tags-report").addEventListener("change", (event) => {
      const input = event.target.closest("input[type='radio']");
      if (!(input instanceof HTMLInputElement) || !input.name.startsWith("tags-")) return;
      const key = input.name.slice("tags-".length);
      selectedByKey.set(key, input.value);
      plans.delete(key);
      if (latest7) renderTagsReport(latest7);
    });
    el("tags-report").addEventListener("click", (event) => {
      const button2 = event.target.closest("[data-tags-action]");
      if (!button2 || button2.disabled) return;
      if (button2.dataset.tagsAction === "clean-apply") {
        void applyTitles();
        return;
      }
      if (button2.dataset.tagsAction === "refresh-apply") {
        void applyMappings();
        return;
      }
      const key = button2.dataset.key ?? "";
      if (!key) return;
      if (button2.dataset.tagsAction === "preview") void previewGroup(key);
      if (button2.dataset.tagsAction === "apply") void applyGroup(key);
    });
  }
  async function loadTags() {
    const token3 = ++state.tagsToken;
    const field = currentField();
    plans.clear();
    selectedByKey.clear();
    beginBusy7();
    let settle = "none";
    try {
      if (field === "titles") {
        const payload = await postJSON("/api/tag-clusters", {
          action: "clean-preview",
          space: state.space
        });
        if (token3 !== state.tagsToken) return;
        titlePlan = payload;
        latest7 = null;
        mappingPlan = null;
        el("tags-status").textContent = titlesPreviewSummary(payload);
        settle = "report";
      } else {
        const response = await fetch(
          `/api/tag-clusters?space=${encodeURIComponent(state.space)}&field=${encodeURIComponent(field)}`
        );
        if (token3 !== state.tagsToken) return;
        const payload = await readJSON(response).catch(() => null);
        if (token3 !== state.tagsToken) return;
        if (!response.ok || payload === null) {
          failStatus7(serverMessage(payload, t("tags.unreadable")));
          settle = "retry";
          return;
        }
        latest7 = payload;
        titlePlan = null;
        mappingPlan = await readMappingPreview(token3);
        if (token3 !== state.tagsToken) return;
        el("tags-status").textContent = "";
        settle = "report";
      }
    } catch (error2) {
      if (token3 !== state.tagsToken) return;
      if (error2 instanceof TypeError) failStatus7(t("tags.unreachable"));
      else failStatus7(failureOf(error2).message);
      settle = "retry";
    } finally {
      if (token3 !== state.tagsToken) return;
      endBusy7();
      if (settle === "report") paintReport();
      if (settle === "retry") el("tags-refresh").focus();
      if (settle === "report") el("tags-report").focus();
    }
  }
  function showTagsFailure(error2) {
    const message = error2 instanceof Error && error2.message ? error2.message : t("tags.unreadable");
    failStatus7(message);
    endBusy7();
    el("tags-refresh").focus();
  }
  function renderTagsReport(payload) {
    el("tags-scope").textContent = t("gig.wholeSpace");
    const field = currentField();
    const report = el("tags-report");
    const groups = payload.groups ?? [];
    const open = openKeys();
    const summary = document.createElement("p");
    summary.className = "gig-note";
    summary.textContent = tagsSummary(field, payload.values ?? 0, groups.length);
    report.replaceChildren(summary);
    const mapping = mappingCard();
    if (mapping) report.append(mapping);
    if (!groups.length) return;
    groups.forEach((group, index) => {
      report.append(groupCard(group, index === 0 || open.has(group.key)));
    });
  }
  function paintReport() {
    if (currentField() === "titles") {
      if (titlePlan) renderTitleReport(titlePlan);
      return;
    }
    if (latest7) renderTagsReport(latest7);
  }
  function renderTitleReport(plan) {
    el("tags-scope").textContent = t("gig.wholeSpace");
    const report = el("tags-report");
    const summary = document.createElement("p");
    summary.className = "gig-note";
    summary.textContent = titlesSummary(plan.changes.length);
    report.replaceChildren(summary);
    const lines = previewLines(plan.changes);
    if (lines.length) {
      const diffs = document.createElement("ul");
      for (const line of lines.slice(0, LIST_CAP6)) {
        const row = document.createElement("li");
        row.textContent = line;
        diffs.append(row);
      }
      report.append(diffs);
    }
    const actions2 = document.createElement("div");
    actions2.className = "tags-actions";
    const apply = buttonEl(tips.tagsApplyTitles);
    apply.dataset.tagsAction = "clean-apply";
    apply.textContent = t("tags.apply");
    apply.disabled = !canApplyTitles(plan);
    actions2.append(apply);
    report.append(actions2);
  }
  function repaintTags() {
    setField(currentField());
    el("tags-scope").textContent = t("gig.wholeSpace");
    paintReport();
  }
  async function previewGroup(key) {
    const group = groupByKey(key);
    const value = selectedValue(key);
    if (!group || !value) return;
    actionKey = key;
    paintReport();
    try {
      const plan = await postJSON("/api/tag-clusters", {
        action: "preview",
        space: state.space,
        field: currentField(),
        value
      });
      plans.set(key, plan);
      el("tags-status").textContent = previewSummary(plan);
      paintReport();
      applyButton(key)?.focus();
    } catch (error2) {
      failStatus7(failureOf(error2).message);
    } finally {
      actionKey = "";
      paintReport();
    }
  }
  async function applyGroup(key) {
    const plan = plans.get(key);
    const value = selectedValue(key);
    if (!plan || !value || plan.value !== value || !plan.changes.length || !state.writable) return;
    actionKey = key;
    panelBusy = true;
    beginBusy7();
    paintReport();
    try {
      const written = await postJSON("/api/tag-clusters", {
        action: "apply",
        space: state.space,
        field: currentField(),
        value
      });
      await bridge.reloadLibrary();
      actionKey = "";
      panelBusy = false;
      endBusy7();
      await loadTags();
      el("tags-status").textContent = writtenSummary(written);
    } catch (error2) {
      const failed = failureOf(error2);
      failStatus7(failed.message);
      if (failed.status === 409) {
        bridge.lockDown(error2);
      }
    } finally {
      actionKey = "";
      panelBusy = false;
      endBusy7();
      paintReport();
    }
  }
  async function applyMappings() {
    const plan = mappingPlan;
    if (!plan || !canApplyMappings(plan)) return;
    actionKey = MAPPING_KEY;
    panelBusy = true;
    beginBusy7();
    paintReport();
    try {
      const written = await postJSON("/api/tag-clusters", {
        action: "refresh-apply",
        space: state.space
      });
      await bridge.reloadLibrary();
      actionKey = "";
      panelBusy = false;
      endBusy7();
      await loadTags();
      el("tags-status").textContent = mappingWrittenSummary(written);
    } catch (error2) {
      const failed = failureOf(error2);
      failStatus7(failed.message);
      if (failed.status === 409) {
        bridge.lockDown(error2);
      }
    } finally {
      actionKey = "";
      panelBusy = false;
      endBusy7();
      paintReport();
    }
  }
  async function applyTitles() {
    const plan = titlePlan;
    if (!plan || !canApplyTitles(plan)) return;
    actionKey = TITLE_KEY;
    panelBusy = true;
    beginBusy7();
    paintReport();
    try {
      const written = await postJSON("/api/tag-clusters", {
        action: "clean-apply",
        space: state.space
      });
      await bridge.reloadLibrary();
      actionKey = "";
      panelBusy = false;
      endBusy7();
      await loadTags();
      el("tags-status").textContent = titlesWrittenSummary(written);
    } catch (error2) {
      const failed = failureOf(error2);
      failStatus7(failed.message);
      if (failed.status === 409) {
        bridge.lockDown(error2);
      }
    } finally {
      actionKey = "";
      panelBusy = false;
      endBusy7();
      paintReport();
    }
  }
  function currentField() {
    if (el("tags-titles").getAttribute("aria-pressed") === "true") return "titles";
    if (el("tags-artist").getAttribute("aria-pressed") === "true") return "artist";
    return "genre";
  }
  function setField(next2) {
    el("tags-genre").setAttribute("aria-pressed", String(next2 === "genre"));
    el("tags-artist").setAttribute("aria-pressed", String(next2 === "artist"));
    el("tags-titles").setAttribute("aria-pressed", String(next2 === "titles"));
    el("tags-hint").textContent = next2 === "titles" ? t("tags.introTitles") : t("tags.intro");
  }
  function beginBusy7() {
    panelBusy = true;
    for (const id of FIELD_BUTTONS) {
      const button2 = el(id);
      button2.disabled = true;
      button2.setAttribute("aria-busy", "true");
    }
    el("tags-panel").setAttribute("aria-busy", "true");
    el("tags-status").textContent = currentField() === "titles" ? t("tags.checkingTitles") : t("tags.checking");
    paintReport();
  }
  function endBusy7() {
    panelBusy = false;
    for (const id of FIELD_BUTTONS) {
      const button2 = el(id);
      button2.disabled = false;
      button2.setAttribute("aria-busy", "false");
    }
    el("tags-panel").setAttribute("aria-busy", "false");
  }
  function canApplyTitles(plan) {
    return Boolean(plan.changes.length && state.writable && !panelBusy && actionKey !== TITLE_KEY);
  }
  function canApplyMappings(plan) {
    return Boolean(plan.changes.length && state.writable && !panelBusy && actionKey !== MAPPING_KEY);
  }
  function asMappingPlan(payload) {
    if (payload === null || typeof payload !== "object") return null;
    const plan = payload;
    if (!Array.isArray(plan.changes)) return null;
    return plan;
  }
  async function readMappingPreview(token3) {
    try {
      const payload = await postJSON("/api/tag-clusters", {
        action: "refresh-preview",
        space: state.space
      });
      if (token3 !== state.tagsToken) return null;
      return asMappingPlan(payload);
    } catch {
      if (token3 !== state.tagsToken) return null;
      return null;
    }
  }
  function mappingCard() {
    const plan = mappingPlan;
    if (!plan?.changes.length) return null;
    const wrap = document.createElement("div");
    wrap.className = "tags-mappings";
    const note = document.createElement("p");
    note.className = "gig-note";
    note.textContent = mappingPreviewSummary(plan);
    wrap.append(note);
    const lines = previewLines(plan.changes);
    if (lines.length) {
      const diffs = document.createElement("ul");
      for (const line of lines.slice(0, LIST_CAP6)) {
        const row = document.createElement("li");
        row.textContent = line;
        diffs.append(row);
      }
      wrap.append(diffs);
    }
    const actions2 = document.createElement("div");
    actions2.className = "tags-actions";
    const apply = buttonEl(tips.tagsApplyMappings);
    apply.dataset.tagsAction = "refresh-apply";
    apply.textContent = t("tags.applyMappings");
    apply.disabled = !canApplyMappings(plan);
    actions2.append(apply);
    wrap.append(actions2);
    return wrap;
  }
  function failStatus7(message) {
    el("tags-status").textContent = message;
  }
  function openKeys() {
    const keys = /* @__PURE__ */ new Set();
    for (const details of el("tags-report").querySelectorAll("details[data-key]")) {
      if (details instanceof HTMLDetailsElement && details.open && details.dataset.key) {
        keys.add(details.dataset.key);
      }
    }
    return keys;
  }
  function groupByKey(key) {
    return latest7?.groups?.find((group) => group.key === key);
  }
  function selectedValue(key) {
    const group = groupByKey(key);
    return selectedByKey.get(key) ?? group?.suggested ?? "";
  }
  function canApply(key) {
    const plan = plans.get(key);
    const value = selectedValue(key);
    return Boolean(
      plan && plan.value === value && plan.changes.length && state.writable && !panelBusy && actionKey !== key
    );
  }
  function applyButton(key) {
    return el("tags-report").querySelector(`[data-tags-action="apply"][data-key="${cssEscape(key)}"]`);
  }
  function cssEscape(value) {
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(value);
    return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }
  function groupCard(group, open) {
    const details = document.createElement("details");
    details.className = "gig-group";
    details.open = open;
    details.dataset.key = group.key;
    const summary = document.createElement("summary");
    setTooltip(summary, tips.tagsGroup);
    summary.textContent = groupHeading(group);
    const list = document.createElement("ul");
    list.className = "tags-spellings";
    const chosen = selectedValue(group.key);
    for (const spelling of group.spellings) {
      list.append(spellingRow(group.key, spelling.value, spelling.count, spelling.value === group.suggested, spelling.value === chosen));
    }
    details.append(summary, list);
    const plan = plans.get(group.key);
    if (plan && plan.value === chosen) {
      const lines = previewLines(plan.changes);
      if (lines.length) {
        const diffs = document.createElement("ul");
        const shown = lines.slice(0, LIST_CAP6);
        for (const line of shown) {
          const row = document.createElement("li");
          row.textContent = line;
          diffs.append(row);
        }
        details.append(diffs);
      }
    }
    details.append(groupActions(group.key, chosen, plan));
    return details;
  }
  function spellingRow(key, value, count, suggested, checked) {
    const row = document.createElement("li");
    const label = document.createElement("label");
    label.className = "tags-spelling";
    const radio = inputEl(tips.tagsSpelling);
    radio.type = "radio";
    radio.name = `tags-${key}`;
    radio.value = value;
    radio.checked = checked;
    radio.disabled = panelBusy;
    const text2 = document.createElement("span");
    text2.textContent = spellingLabel(value, count, suggested);
    label.append(radio, text2);
    row.append(label);
    return row;
  }
  function groupActions(key, value, plan) {
    const actions2 = document.createElement("div");
    actions2.className = "tags-actions";
    const preview = buttonEl(tips.tagsPreview);
    preview.dataset.tagsAction = "preview";
    preview.dataset.key = key;
    preview.textContent = t("tags.preview");
    preview.disabled = panelBusy || !value;
    const apply = buttonEl(tips.tagsApply);
    apply.dataset.tagsAction = "apply";
    apply.dataset.key = key;
    apply.textContent = t("tags.apply");
    apply.disabled = !canApply(key);
    if (plan && plan.value === value && !plan.changes.length) apply.disabled = true;
    actions2.append(preview, apply);
    return actions2;
  }

  // src/portable.ts
  var FINDING_CAP = 100;
  var KIND_KEY = {
    off_drive: "portable.kindOffDrive",
    missing: "portable.kindMissing",
    smart_crate: "portable.kindSmartCrate",
    unsafe_name: "portable.kindUnsafeName",
    path_length: "portable.kindPathLength",
    file_size: "portable.kindFileSize"
  };
  var token = 0;
  var latest8 = null;
  var lastRoots = [];
  var opener = null;
  var hasConnected = false;
  function portableDriveRoot(path) {
    const trimmed = path.trim();
    if (!trimmed) return "";
    const unified = trimmed.replace(/\\/g, "/");
    const marker = unified.search(/\/_Serato_(\/|$)/i);
    const base = marker >= 0 ? unified.slice(0, marker) : unified.replace(/\/+$/, "");
    const volumes = /^\/Volumes\/[^/]+/.exec(base);
    if (volumes) return volumes[0];
    const media2 = /^\/(?:run\/)?media\/[^/]+\/[^/]+/.exec(base);
    if (media2) return media2[0];
    const mnt = /^\/mnt\/[^/]+/.exec(base);
    if (mnt) return mnt[0];
    const unc = /^(?:\/\/)[^/]+\/[^/]+/.exec(base);
    if (unc) return trimmed.includes("\\") ? unc[0].replace(/\//g, "\\") : unc[0];
    const win = /^[A-Za-z]:/.exec(trimmed);
    if (win) return `${win[0]}${trimmed.includes("\\") ? "\\" : "/"}`;
    return marker >= 0 ? trimmed.includes("\\") ? base.replace(/\//g, "\\") : base : trimmed;
  }
  function portableSeratoRoots(roots) {
    const connected = [];
    const missing = [];
    const seen = /* @__PURE__ */ new Set();
    for (const root of roots) {
      if (!root.removable || !root.serato) continue;
      const key = portableDriveRoot(root.path).replace(/\\/g, "/").toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      if (root.missing) missing.push(root);
      else connected.push(root);
    }
    return { connected, missing };
  }
  function parseDriveReport(value) {
    if (!isRecord(value)) return null;
    if (typeof value.ready !== "boolean" || typeof value.missing_drive !== "boolean") return null;
    if (typeof value.summary !== "string") return null;
    if (!Array.isArray(value.findings) || !Array.isArray(value.errors)) return null;
    const findings = [];
    for (const item5 of value.findings) {
      if (!isRecord(item5) || typeof item5.kind !== "string" || typeof item5.fix !== "string") return null;
      findings.push({
        kind: item5.kind,
        crate: text(item5.crate),
        track: text(item5.track),
        path: text(item5.path),
        found: text(item5.found),
        fix: item5.fix
      });
    }
    const errors = [];
    for (const item5 of value.errors) {
      if (!isRecord(item5) || typeof item5.message !== "string") return null;
      errors.push({ crate: text(item5.crate), message: item5.message });
    }
    return {
      drive: text(value.drive),
      name: text(value.name),
      ready: value.ready,
      missing_drive: value.missing_drive,
      summary: value.summary,
      findings,
      errors
    };
  }
  function portableDriveButton(name, path) {
    const button2 = buttonEl(portableCheck(name));
    button2.className = "files-portable";
    button2.dataset.portableName = name;
    button2.textContent = t("portable.check");
    button2.setAttribute("aria-label", t("portable.checkLabel", { name }));
    button2.addEventListener("click", (event) => {
      event.stopPropagation();
      void openPortableCheck(path, button2);
    });
    return button2;
  }
  async function openPortableCheck(path, trigger) {
    wirePortable();
    opener = trigger ?? null;
    const dialog = el("portable-dialog");
    if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
    await runPortableCheck(path);
  }
  async function loadPortableView() {
    wirePortable();
    beginBusy8();
    paintStatus(t("portable.checking"));
    let settle = "none";
    try {
      const payload = await fetchLibraryRoots();
      lastRoots = payload.roots;
      paintDrivePicker(lastRoots);
      const path = el("portable-drive").value;
      if (!path) {
        clearReport();
        el("portable-view-status").textContent = hasConnected ? "" : t("portable.noDrive");
        el("portable-status").textContent = hasConnected ? "" : t("portable.noDrive");
        return;
      }
      await runPortableCheck(path);
      settle = "report";
    } catch (error2) {
      fail(error2 instanceof Error && error2.message ? error2.message : t("portable.unreadable"));
      settle = "retry";
    } finally {
      endBusy8();
      if (settle === "retry") el("portable-check").focus();
      if (settle === "report") el("portable-view-verdict").focus();
    }
  }
  function showPortableFailure(error2) {
    const message = error2 instanceof Error && error2.message ? error2.message : t("portable.unreadable");
    fail(message);
    endBusy8();
    el("portable-check").focus();
  }
  function repaintPortable() {
    for (const button2 of document.querySelectorAll(".files-portable")) {
      button2.textContent = t("portable.check");
      const name = button2.dataset.portableName ?? "";
      if (name) button2.setAttribute("aria-label", t("portable.checkLabel", { name }));
    }
    el("portable-check").textContent = t("portable.check");
    if (lastRoots.length) paintDrivePicker(lastRoots);
    if (latest8) renderPortableReport(latest8);
  }
  function wirePortable() {
    const dialog = el("portable-dialog");
    if (dialog.dataset.portableWired !== "true") {
      dialog.dataset.portableWired = "true";
      el("portable-close").addEventListener("click", () => {
        el("portable-dialog").close();
        if (opener?.isConnected) opener.focus();
      });
    }
    const panel = el("portable-panel");
    if (panel.dataset.portableWired === "true") return;
    panel.dataset.portableWired = "true";
    el("portable-check").addEventListener("click", () => {
      void runPortableCheck(el("portable-drive").value);
    });
    el("portable-drive").addEventListener("change", () => {
      void runPortableCheck(el("portable-drive").value);
    });
  }
  function renderPortableReport(report) {
    latest8 = report;
    const verdictText = report.missing_drive ? t("portable.missing") : report.ready ? t("portable.ready") : t("portable.notReady");
    const items = findingItems(report);
    for (const surface of surfaces()) {
      surface.verdict.textContent = verdictText;
      surface.summary.textContent = report.summary;
      surface.findings.replaceChildren(...items.map((item5) => item5.cloneNode(true)));
      surface.status.textContent = "";
    }
  }
  async function runPortableCheck(path) {
    wirePortable();
    const drive = portableDriveRoot(path);
    const mine = ++token;
    latest8 = null;
    clearReport();
    paintStatus(t("portable.checking"));
    if (!drive) {
      fail(t("portable.unreadable"));
      return;
    }
    beginBusy8();
    try {
      const response = await fetch(`/api/drive-check?drive=${encodeURIComponent(drive)}`);
      if (mine !== token) return;
      const body = await readJSON(response).catch(() => null);
      if (mine !== token) return;
      if (!response.ok) {
        fail(serverMessage(errorBody(body), t("portable.unreadable")));
        return;
      }
      const report = parseDriveReport(body);
      if (!report) {
        fail(t("portable.unreadable"));
        return;
      }
      latest8 = report;
      paintStatus("");
      renderPortableReport(report);
    } catch {
      if (mine !== token) return;
      fail(t("portable.unreachable"));
    } finally {
      if (mine === token) endBusy8();
    }
  }
  function paintDrivePicker(roots) {
    const { connected, missing } = portableSeratoRoots(roots);
    hasConnected = connected.length > 0;
    const select = el("portable-drive");
    const previous2 = select.value;
    const options = connected.map((root) => {
      const option = document.createElement("option");
      option.value = root.path;
      option.textContent = root.label;
      return option;
    });
    select.replaceChildren(...options);
    const keep = connected.some((root) => root.path === previous2) ? previous2 : connected[0]?.path ?? "";
    select.value = keep;
    select.disabled = !hasConnected;
    el("portable-check").disabled = !hasConnected;
    const note = el("portable-offline");
    if (!missing.length) {
      note.textContent = "";
      return;
    }
    note.textContent = missing.map((root) => t("portable.offlineNamed", { name: root.label })).join(" ");
  }
  function findingItems(report) {
    const items = [];
    const shown = report.findings.slice(0, FINDING_CAP);
    for (const finding of shown) {
      const row = document.createElement("li");
      const kind2 = document.createElement("span");
      kind2.className = "portable-kind";
      kind2.textContent = kindLabel(finding.kind);
      row.append(kind2);
      if (finding.fix) {
        row.append(document.createTextNode(" "));
        const fix = document.createElement("span");
        fix.className = "portable-fix";
        fix.textContent = finding.fix;
        row.append(fix);
      }
      items.push(row);
    }
    for (const error2 of report.errors) {
      const row = document.createElement("li");
      row.textContent = error2.crate ? `${error2.crate}: ${error2.message}` : error2.message;
      items.push(row);
    }
    const hidden = report.findings.length - shown.length;
    if (hidden > 0) {
      const row = document.createElement("li");
      row.textContent = t("files.andMore", { count: hidden });
      items.push(row);
    }
    return items;
  }
  function surfaces() {
    return [
      {
        verdict: el("portable-verdict"),
        summary: el("portable-summary"),
        findings: el("portable-findings"),
        status: el("portable-status")
      },
      {
        verdict: el("portable-view-verdict"),
        summary: el("portable-view-summary"),
        findings: el("portable-view-findings"),
        status: el("portable-view-status")
      }
    ];
  }
  function kindLabel(kind2) {
    const key = KIND_KEY[kind2];
    return key ? t(key) : kind2;
  }
  function fail(message) {
    latest8 = null;
    clearReport();
    paintStatus(message);
  }
  function clearReport() {
    for (const surface of surfaces()) {
      surface.verdict.textContent = "";
      surface.summary.textContent = "";
      surface.findings.replaceChildren();
    }
  }
  function paintStatus(message) {
    for (const surface of surfaces()) surface.status.textContent = message;
  }
  function beginBusy8() {
    const button2 = el("portable-check");
    button2.disabled = true;
    button2.setAttribute("aria-busy", "true");
    el("portable-panel").setAttribute("aria-busy", "true");
  }
  function endBusy8() {
    const button2 = el("portable-check");
    button2.disabled = !hasConnected;
    button2.setAttribute("aria-busy", "false");
    el("portable-panel").setAttribute("aria-busy", "false");
  }
  function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
  function text(value) {
    return typeof value === "string" ? value : "";
  }
  function errorBody(value) {
    if (!isRecord(value)) return null;
    const body = {};
    if (typeof value.error === "string") body.error = value.error;
    if (typeof value.code === "string") body.code = value.code;
    if (body.error === void 0 && body.code === void 0) return null;
    return body;
  }

  // src/beatgrid-view.ts
  var GRID_WARNING_KEYS = {
    beatgrid_too_short: "markers.gridTooShort",
    beatgrid_version: "markers.gridVersion",
    beatgrid_empty: "markers.gridEmpty",
    beatgrid_too_many: "markers.gridTooMany",
    beatgrid_truncated: "markers.gridTruncated"
  };
  function beatgridViewOnly(unavailable) {
    return unavailable !== true;
  }
  function beatgridIsSuspect(code) {
    return typeof code === "string" && code !== "";
  }
  function beatgridWarningKey(code) {
    if (!beatgridIsSuspect(code) || code == null) return null;
    if (Object.hasOwn(GRID_WARNING_KEYS, code)) {
      return GRID_WARNING_KEYS[code];
    }
    return "markers.gridUnknown";
  }
  function beatSeconds(value) {
    if (value === "" || value == null) return "";
    const number = Number(value);
    if (!Number.isFinite(number)) return "";
    return `${number.toFixed(3)}s`;
  }
  function appendBeatgrid(section, track) {
    if (!beatgridViewOnly(track.markers_unavailable)) return;
    const heading2 = document.createElement("h4");
    heading2.textContent = t("markers.gridHeading");
    section.append(heading2);
    const viewOnly = document.createElement("p");
    viewOnly.className = "detail-kicker";
    viewOnly.textContent = t("markers.gridViewOnly");
    section.append(viewOnly);
    if (beatgridIsSuspect(track.beatgrid_warning_code)) {
      const warn = document.createElement("p");
      warn.className = "detail-kicker warn";
      warn.setAttribute("role", "status");
      const key = beatgridWarningKey(track.beatgrid_warning_code);
      const reason = key === "markers.gridUnknown" ? typeof track.beatgrid_warning === "string" && track.beatgrid_warning ? track.beatgrid_warning : t("markers.gridUnknown") : t(key ?? "markers.gridUnknown");
      warn.textContent = t("markers.gridSuspect", { reason });
      section.append(warn);
    } else if (!(track.beatgrid && track.beatgrid.length > 0)) {
      const empty = document.createElement("p");
      empty.className = "detail-kicker";
      empty.textContent = t("markers.gridNone");
      section.append(empty);
    }
    for (const mark of track.beatgrid || []) {
      section.append(paintBeatMarker(mark));
    }
  }
  function paintBeatMarker(mark) {
    const row = document.createElement("div");
    row.className = "marker";
    const time = document.createElement("span");
    time.textContent = beatSeconds(mark.position);
    const name = document.createElement("span");
    const bpmNumber = Number(mark.bpm);
    if (mark.bpm != null && mark.bpm !== "" && Number.isFinite(bpmNumber)) {
      name.textContent = t("markers.bpm", { bpm: formatNumber(bpmNumber, { maximumFractionDigits: 20 }) });
    } else if (mark.beats != null) {
      name.textContent = t("markers.beats", { count: Number(mark.beats) });
    } else {
      name.textContent = "";
    }
    row.append(document.createElement("span"), document.createElement("span"), time, name);
    return row;
  }

  // src/cue-view.ts
  var CUE_SLOT_COUNT = 8;
  function cueSlotVar(index) {
    return `var(--cue-slot-${index + 1})`;
  }
  var CUE_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
  function isCueColor(value) {
    return CUE_COLOR.test(value);
  }
  function slotColor(index, stored) {
    if (typeof stored === "string" && isCueColor(stored)) return stored;
    if (Number.isInteger(index) && index >= 0 && index < CUE_SLOT_COUNT) {
      return cueSlotVar(index);
    }
    return "";
  }
  function cueSlots(cues2) {
    const slots = Array.from({ length: CUE_SLOT_COUNT }, () => null);
    if (!cues2) return slots;
    for (const cue of cues2) {
      const index = Number(cue.index);
      if (!Number.isInteger(index) || index < 0 || index >= CUE_SLOT_COUNT) continue;
      if (slots[index] == null) slots[index] = cue;
    }
    return slots;
  }
  function extraCues(cues2) {
    if (!cues2) return [];
    const seen = /* @__PURE__ */ new Set();
    const extra = [];
    for (const cue of cues2) {
      const index = Number(cue.index);
      if (!Number.isInteger(index) || index < 0 || index >= CUE_SLOT_COUNT) {
        extra.push(cue);
        continue;
      }
      if (seen.has(index)) extra.push(cue);
      else seen.add(index);
    }
    return extra;
  }
  function formatCueTime(value) {
    const total = Number(value) / 1e3;
    const minutes = Math.floor(total / 60);
    return `${minutes}:${(total - minutes * 60).toFixed(3).padStart(6, "0")}`;
  }
  function cuesFromFrame(value) {
    if (value == null || Array.isArray(value)) return [];
    return Array.isArray(value.cues) ? value.cues : [];
  }
  function cueSummary(cue, empty) {
    if (!cue) return empty;
    const named = typeof cue.name === "string" ? cue.name.trim() : "";
    const time = formatCueTime(cue.start_ms);
    return named ? `${time} ${named}` : time;
  }
  function cueDiffRows(before, after) {
    const beforeCues = cuesFromFrame(before);
    const afterCues = cuesFromFrame(after);
    const beforeSlots = cueSlots(beforeCues);
    const afterSlots = cueSlots(afterCues);
    const diffs = [];
    for (let slot = 0; slot < CUE_SLOT_COUNT; slot += 1) {
      const left = beforeSlots[slot] ?? null;
      const right = afterSlots[slot] ?? null;
      if (cueSignature(left) === cueSignature(right)) continue;
      diffs.push({ slot, before: left, after: right });
    }
    const beforeExtra = extraCues(beforeCues);
    const afterExtra = extraCues(afterCues);
    const indexes = /* @__PURE__ */ new Set();
    for (const cue of [...beforeExtra, ...afterExtra]) {
      const index = Number(cue.index);
      if (Number.isInteger(index)) indexes.add(index);
    }
    const sorted = [...indexes].sort((left, right) => left - right);
    for (const index of sorted) {
      const left = beforeExtra.find((cue) => Number(cue.index) === index) ?? null;
      const right = afterExtra.find((cue) => Number(cue.index) === index) ?? null;
      if (cueSignature(left) === cueSignature(right)) continue;
      diffs.push({ slot: index, before: left, after: right });
    }
    return diffs;
  }
  function appendCueSlots(section, cues2) {
    const slots = cueSlots(cues2);
    for (let slot = 0; slot < slots.length; slot += 1) {
      section.append(paintCueSlot(slot, slots[slot] ?? null));
    }
    for (const extra of extraCues(cues2)) {
      const index = Number(extra.index);
      const slot = Number.isInteger(index) ? index : -1;
      section.append(paintCueSlot(slot, extra));
    }
  }
  function paintCueSlot(slot, cue) {
    const row = document.createElement("div");
    row.className = cue ? "marker" : "marker marker-empty";
    const number = document.createElement("span");
    number.className = "marker-slot";
    number.textContent = slot >= 0 ? String(slot + 1) : "";
    const swatch = document.createElement("span");
    swatch.className = "swatch";
    const color = slotColor(slot, cue?.color);
    if (color) swatch.style.background = color;
    const time = document.createElement("span");
    time.textContent = cue ? formatCueTime(cue.start_ms) : "—";
    const name = document.createElement("span");
    const named = cue && typeof cue.name === "string" ? cue.name.trim() : "";
    if (cue) {
      name.textContent = named || t("markers.cue", { number: slot >= 0 ? slot + 1 : 0 });
    } else {
      name.textContent = t("markers.cueEmpty");
    }
    row.append(number, swatch, time, name);
    return row;
  }
  function paintCueDiffRow(diff) {
    const row = document.createElement("p");
    row.className = "cue-diff";
    const empty = t("markers.cueEmpty");
    const beforeText = cueSummary(diff.before, empty);
    const afterText = cueSummary(diff.after, empty);
    row.setAttribute(
      "aria-label",
      `${t("markers.cue", { number: diff.slot + 1 })}: ${t("plan.cueDiff", { before: beforeText, after: afterText })}`
    );
    const number = document.createElement("span");
    number.className = "marker-slot";
    number.textContent = String(diff.slot + 1);
    const arrow = document.createElement("span");
    arrow.className = "cue-diff-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";
    row.append(number, paintCueSide(diff.before, diff.slot), arrow, paintCueSide(diff.after, diff.slot));
    return row;
  }
  function cueSignature(cue) {
    if (!cue) return "";
    const start = Number(cue.start_ms);
    const color = typeof cue.color === "string" ? cue.color : "";
    const name = typeof cue.name === "string" ? cue.name : "";
    return `${start}\0${color}\0${name}`;
  }
  function paintCueSide(cue, slot) {
    const side = document.createElement("span");
    side.className = cue ? "cue-diff-side" : "cue-diff-side marker-empty";
    const swatch = document.createElement("span");
    swatch.className = "swatch";
    const color = slotColor(slot, cue?.color);
    if (color) swatch.style.background = color;
    const text2 = document.createElement("span");
    text2.textContent = cueSummary(cue, t("markers.cueEmpty"));
    side.append(swatch, text2);
    return side;
  }

  // src/folder-sync-view.ts
  function syncFolderSyncButton() {
    const id = state.activeCrate;
    const crate = typeof id === "number" ? state.crates.find((row) => row.id === id) : void 0;
    const blocked = !state.writable || id === "all" || Boolean(crate?.smart);
    el("crate-folder-sync").disabled = blocked;
    el("crate-rename-from-tags").disabled = blocked;
  }
  function readFolderSyncForm() {
    const folder = el("folder-sync-path").value.trim();
    if (!folder) return null;
    return {
      folder,
      subcrates: el("folder-sync-subcrates").checked,
      full: el("folder-sync-full").checked
    };
  }
  function folderSyncPreviewText(reply) {
    const added = Number(reply.added) || 0;
    const removed = Number(reply.removed) || 0;
    const created = Number(reply.created) || 0;
    const skipped = Number(reply.skipped_count) || 0;
    if (added === 0 && removed === 0 && created === 0) {
      return t("folderSync.summaryNone", { skipped });
    }
    return t("folderSync.summary", { added, removed, skipped });
  }
  function folderSyncDoneText(reply) {
    const name = reply.crate?.name?.trim() || "";
    const added = Number(reply.added) || 0;
    const removed = Number(reply.removed) || 0;
    if (!reply.written) return t("folderSync.unchanged", { name });
    return t("folderSync.done", { name, added, removed });
  }
  function folderSyncHasWork(reply) {
    return (Number(reply.added) || 0) + (Number(reply.removed) || 0) + (Number(reply.created) || 0) > 0;
  }

  // src/preset-view.ts
  function presetName(preset) {
    if (preset.kind === "harmonic") return t("presets.name.harmonic", { key: preset.key });
    if (preset.kind === "bpm") {
      return t("presets.name.bpm", {
        bpm: formatNumber(preset.bpm, { maximumFractionDigits: 1 }),
        range: formatNumber(preset.range, { maximumFractionDigits: 1 })
      });
    }
    return t("presets.name.unplayed", { count: preset.months });
  }
  function numberFrom(input) {
    const text2 = input.value.trim();
    if (!text2) return null;
    const value = Number(text2);
    return Number.isFinite(value) ? value : null;
  }
  function scopeCrate() {
    if (state.activeCrate === "all") return null;
    const crate = state.crates.find((item5) => item5.id === state.activeCrate);
    return crate && !crate.smart ? crate : null;
  }
  function readPresetForm() {
    const kind2 = el("preset-kind").value;
    const scope = scopeCrate();
    const crate = scope && el("preset-scope").checked ? { crate: scope.id } : {};
    if (kind2 === "harmonic") {
      const key = el("preset-key").value.trim();
      return key ? { kind: kind2, key, ...crate } : null;
    }
    if (kind2 === "bpm") {
      const bpm = numberFrom(el("preset-bpm"));
      const range = numberFrom(el("preset-range")) ?? 3;
      if (bpm == null || bpm <= 0 || range < 0 || range > 50) return null;
      return { kind: kind2, bpm, range, ...crate };
    }
    if (kind2 === "unplayed") {
      const months = numberFrom(el("preset-months")) ?? 12;
      if (!Number.isInteger(months) || months < 1 || months > 240) return null;
      return { kind: kind2, months, ...crate };
    }
    return null;
  }
  function syncPresetFields() {
    const kind2 = el("preset-kind").value;
    for (const field of document.querySelectorAll("#preset-dialog [data-preset-kind]")) {
      field.hidden = field.dataset.presetKind !== kind2;
    }
  }
  function isPresetCrate(id) {
    return id !== "all" && Object.hasOwn(state.presets, String(id));
  }
  function presetFoot(id) {
    if (!isPresetCrate(id)) return "";
    const updated = Number(state.presets[String(id)]?.updated);
    if (!Number.isFinite(updated) || updated <= 0) return "";
    const date = formatDate(new Date(updated * 1e3), { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    return ` · ${t("presets.updated", { date })}`;
  }
  function syncPresetButtons() {
    el("crate-preset").disabled = !state.writable;
    const preset = isPresetCrate(state.activeCrate);
    el("crate-refresh").hidden = !preset;
    el("crate-refresh").disabled = !state.writable || !preset;
  }

  // src/restore.ts
  var reloadLibrary = async () => {
  };
  function bindLibraryReload(reload) {
    reloadLibrary = reload;
  }
  async function loadSnapshots() {
    state.snapshotLoading = true;
    state.snapshotError = "";
    const operationsPromise = loadOperations();
    renderSnapshots();
    try {
      const response = await fetch("/api/snapshots");
      const payload = await readJSON(response);
      if (!response.ok) throw new Error(serverMessage(payload, t("snapshots.unreadable")));
      state.snapshots = payload.snapshots || [];
      state.snapshotUndo = payload.pending_undo || null;
      state.writeBlock = payload.write_block || "";
      state.writeBlockCode = payload.write_block_code || "";
      state.writeBlockParams = messageParams(payload.write_block_params) ?? null;
      state.seratoRunning = Boolean(payload.serato_running);
      state.driveBackup = driveBackupFrom(payload.drive_backup);
      state.snapshotLoading = false;
      renderSnapshots();
    } finally {
      await operationsPromise;
    }
  }
  async function loadOperations() {
    state.operationsLoading = true;
    state.operationsError = "";
    renderOperations();
    try {
      const response = await fetch("/api/operations");
      const payload = await readJSON(response);
      if (!response.ok) throw new Error(serverMessage(payload, t("operations.unreadable")));
      state.operations = Array.isArray(payload.operations) ? payload.operations : [];
      state.operationsLoading = false;
    } catch (error2) {
      state.operationsLoading = false;
      state.operationsError = failureOf(error2).message || t("operations.unreadable");
    }
    renderOperations();
  }
  function failSnapshots(error2) {
    state.snapshotLoading = false;
    state.snapshotError = failureOf(error2).message || t("snapshots.unreadable");
    renderSnapshots();
  }
  function renderSnapshots() {
    renderOperations();
    el("crate-foot").textContent = state.snapshotLoading ? t("snapshots.reading") : t("snapshots.count", { count: state.snapshots.length });
    const status = el("snapshots-status");
    const block = el("snapshots-block");
    const undo = el("snapshots-undo");
    const list = el("snapshots-list");
    list.setAttribute("aria-busy", String(state.snapshotLoading));
    paintDriveCopies();
    if (state.writeBlock) {
      block.hidden = false;
      block.textContent = codedText(state.writeBlock, state.writeBlockCode, state.writeBlockParams);
    } else {
      block.hidden = true;
      block.textContent = "";
    }
    if (state.snapshotUndo && state.snapshotUndo.restore_id) {
      undo.hidden = false;
      el("snapshots-undo-text").textContent = state.snapshotUndo.source === "Lexicon" ? t("snapshots.outsideChangeLexicon") : t("snapshots.outsideChange");
    } else {
      undo.hidden = true;
    }
    list.replaceChildren();
    if (state.snapshotLoading) {
      status.textContent = t("snapshots.reading");
      return;
    }
    if (state.snapshotError) {
      status.textContent = state.snapshotError;
      const retry = buttonEl(tips.snapshotsRetry);
      retry.textContent = t("common.tryAgain");
      retry.addEventListener("click", () => loadSnapshots().catch((error2) => failSnapshots(error2)));
      list.append(retry);
      return;
    }
    status.textContent = state.snapshotMessage ? t(state.snapshotMessage) : "";
    if (!state.snapshots.length) {
      const empty = document.createElement("p");
      empty.textContent = t("snapshots.empty");
      list.append(empty);
      return;
    }
    for (const item5 of state.snapshots) {
      const card = document.createElement("article");
      card.className = "snapshot-card";
      card.setAttribute("role", "listitem");
      const title2 = document.createElement("p");
      title2.textContent = `${item5.created || t("snapshots.unknownTime")} · ${item5.trigger || t("snapshots.trigger")}`;
      const detail = document.createElement("p");
      const version = item5.serato_version && item5.serato_version !== "unknown" ? t("snapshots.seratoVersion", { version: item5.serato_version, build: String(item5.serato_build ?? "") }) : t("snapshots.seratoUnknown");
      const drives = (item5.unavailable_drives || []).length ? ` ${t("snapshots.unavailableDrives", { drives: formatList(item5.unavailable_drives || []) })}` : "";
      detail.textContent = `${version}. ${item5.reason || ""}${drives}`;
      const restore = buttonEl(tips.reviewRestore);
      restore.textContent = t("snapshots.reviewRestore");
      restore.addEventListener("click", () => openSnapshotPlan(item5.id).catch((error2) => setSnapshotDialogStatus(failureOf(error2).message)));
      card.append(title2, detail, restore);
      list.append(card);
    }
  }
  var OPERATION_ACTIONS = {
    crate_create: "operations.action.crateCreate",
    crate_rename: "operations.action.crateRename",
    crate_delete: "operations.action.crateDelete",
    crate_color: "operations.action.crateColor",
    crate_expanded: "operations.action.crateExpanded",
    crate_rules: "operations.action.crateRules",
    crate_add: "operations.action.crateAdd",
    crate_remove: "operations.action.crateRemove",
    crate_prepare: "operations.action.cratePrepare",
    crate_remove_library: "operations.action.crateRemoveLibrary",
    save_track: "operations.action.saveTrack",
    import_m3u: "operations.action.importM3u",
    merge_duplicates: "operations.action.mergeDuplicates",
    rename: "operations.action.rename",
    rename_from_tags: "operations.action.renameFromTags",
    move: "operations.action.move",
    move_folder: "operations.action.moveFolder",
    replace: "operations.action.replace",
    replace_in_crates: "operations.action.replaceInCrates",
    relink: "operations.action.relink",
    delete: "operations.action.delete",
    restore: "operations.action.restore",
    restore_recover: "operations.action.restoreRecover"
  };
  var OPERATION_OUTCOMES = {
    verified: "operations.outcome.verified",
    rolled_back: "operations.outcome.rolledBack",
    refused: "operations.outcome.refused",
    rollback_failed: "operations.outcome.rollbackFailed"
  };
  function renderOperations() {
    const alert = el("operations-alert");
    const status = el("operations-status");
    const list = el("operations-list");
    list.setAttribute("aria-busy", String(state.operationsLoading));
    const latest10 = state.operations[state.operations.length - 1];
    const failed = latest10?.result === "rollback_failed";
    alert.hidden = !failed;
    alert.textContent = failed ? t("operations.rollbackFailed") : "";
    list.replaceChildren();
    if (state.operationsLoading && state.operations.length === 0) {
      status.textContent = t("operations.reading");
      return;
    }
    if (state.operationsError) {
      status.textContent = state.operationsError;
      const retry = buttonEl(tips.operationsRetry);
      retry.textContent = t("common.tryAgain");
      retry.addEventListener("click", () => {
        loadOperations().catch(() => void 0);
      });
      list.append(retry);
      return;
    }
    status.textContent = "";
    if (!state.operations.length) {
      const empty = document.createElement("p");
      empty.textContent = t("operations.empty");
      list.append(empty);
      return;
    }
    for (const item5 of [...state.operations].reverse()) {
      list.append(operationCard(item5));
    }
  }
  function operationCard(item5) {
    const card = document.createElement("article");
    card.className = "operation-card snapshot-card";
    card.setAttribute("role", "listitem");
    const actionName = item5.action || item5.operation || "";
    const actionKey2 = OPERATION_ACTIONS[actionName];
    const outcomeKey = OPERATION_OUTCOMES[item5.result || ""] ?? "operations.outcome.refused";
    const title2 = document.createElement("p");
    title2.textContent = t("operations.entry", {
      time: operationTime(item5.time || ""),
      action: actionKey2 ? t(actionKey2) : t("operations.actionOther"),
      target: item5.target || t("operations.noTarget"),
      outcome: t(outcomeKey)
    });
    card.append(title2);
    if (item5.snapshot_before && item5.snapshot_after) {
      const detail = document.createElement("p");
      detail.textContent = t("operations.snapshots", {
        before: item5.snapshot_before,
        after: item5.snapshot_after
      });
      card.append(detail);
    } else if (item5.snapshot_before) {
      const detail = document.createElement("p");
      detail.textContent = t("operations.beforeOnly", { before: item5.snapshot_before });
      card.append(detail);
    }
    return card;
  }
  function operationTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value || t("snapshots.unknownTime");
    return formatDate(date, { dateStyle: "medium", timeStyle: "short" });
  }
  async function openSnapshotPlan(snapshotId) {
    state.snapshotPlanId = snapshotId;
    const planBox = el("snapshot-plan");
    const block = el("snapshot-block");
    const confirm2 = el("snapshot-confirm");
    planBox.replaceChildren();
    block.textContent = t("snapshots.readingPlan");
    confirm2.disabled = true;
    setSnapshotDialogStatus("");
    el("snapshot-dialog").showModal();
    const plan = await postJSON("/api/snapshots", { action: "plan", id: snapshotId });
    paintSnapshotPlan(plan);
  }
  var lastPlan = null;
  function repaintSnapshotPlan() {
    if (lastPlan && el("snapshot-dialog").open) paintSnapshotPlan(lastPlan);
  }
  function isDriveCopy(value) {
    if (!value || typeof value !== "object") return false;
    const record = value;
    return typeof record.status === "string" && (record.label === void 0 || typeof record.label === "string");
  }
  function driveBackupFrom(value) {
    if (!value || typeof value !== "object") return null;
    const record = value;
    if (record.verified !== true) return null;
    const drives = Array.isArray(record.drives) ? record.drives.filter(isDriveCopy) : [];
    return {
      folder: typeof record.folder === "string" ? record.folder : "",
      verified: true,
      drives
    };
  }
  function driveName(drive, status) {
    const name = drive.label || drive.drive_id || t("snapshots.unknownDrive");
    if (status === "read-only") return t("snapshots.driveReadOnly", { name });
    if (status === "permission") return t("snapshots.drivePermission", { name });
    return name;
  }
  function driveCopyText() {
    const report = state.driveBackup;
    const drives = report?.drives ?? [];
    if (!report?.verified || !drives.length) {
      return report?.verified ? t("snapshots.drivesNone") : t("snapshots.drivesIntro");
    }
    const parts = [];
    const copied = drives.filter((drive) => drive.status === "copied").map((drive) => driveName(drive, "copied"));
    const absent = drives.filter((drive) => drive.status === "absent").map((drive) => driveName(drive, "absent"));
    const skipped = drives.filter((drive) => drive.status === "read-only" || drive.status === "permission").map((drive) => driveName(drive, drive.status ?? ""));
    if (copied.length) parts.push(t("snapshots.drivesCopied", { drives: formatList(copied) }));
    if (absent.length) parts.push(t("snapshots.drivesAbsent", { drives: formatList(absent) }));
    if (skipped.length) parts.push(t("snapshots.drivesSkipped", { drives: formatList(skipped) }));
    return parts.join(" ") || t("snapshots.drivesIntro");
  }
  function paintDriveCopies() {
    const note = el("snapshots-drives-note");
    note.hidden = false;
    note.textContent = driveCopyText();
  }
  async function backupDriveCrates() {
    const button2 = el("snapshots-drives");
    button2.disabled = true;
    const note = el("snapshots-drives-note");
    note.hidden = false;
    note.textContent = t("snapshots.backupDrivesBusy");
    try {
      const payload = await postJSON("/api/snapshots", { action: "backup-drives" });
      state.driveBackup = driveBackupFrom(payload.drive_backup);
      state.snapshotMessage = payload.created ? "snapshots.drivesSaved" : "snapshots.drivesAlready";
      renderSnapshots();
    } catch (error2) {
      state.snapshotMessage = "";
      renderSnapshots();
      const shown = el("snapshots-drives-note");
      shown.hidden = false;
      shown.textContent = failureOf(error2).message || t("snapshots.unreadable");
    } finally {
      button2.disabled = false;
    }
  }
  function paintSnapshotPlan(plan) {
    lastPlan = plan;
    const planBox = el("snapshot-plan");
    const block = el("snapshot-block");
    const confirm2 = el("snapshot-confirm");
    planBox.replaceChildren();
    const crates = plan.crates || {};
    const tracks = plan.tracks || {};
    appendPlanLine(planBox, t("plan.cratesAdded"), crates.added);
    appendPlanLine(planBox, t("plan.cratesRemoved"), crates.removed);
    appendPlanLine(planBox, t("plan.cratesChanged"), crates.changed);
    appendPlanLine(planBox, t("plan.cratesUnavailable"), crates.unavailable);
    appendPlanLine(planBox, t("plan.cratesRegistered"), plan.crates_registered);
    appendPlanLine(planBox, t("plan.cratesSkipped"), plan.crates_skipped);
    if (plan.registration_warning) {
      const warning = document.createElement("p");
      warning.textContent = codedText(plan.registration_warning, plan.registration_warning_code);
      planBox.append(warning);
    }
    appendPlanLine(planBox, t("plan.tracksAdded"), tracks.added);
    appendPlanLine(planBox, t("plan.tracksRemoved"), tracks.removed);
    appendPlanLine(planBox, t("plan.tracksUnavailable"), tracks.unavailable);
    appendCueDiffs(planBox, t("plan.cueChanges"), plan.cues);
    appendFrameDiffs(planBox, t("plan.gridChanges"), plan.grids);
    const deleted = plan.deleted || {};
    appendPlanLine(planBox, t("plan.deletedCrates"), deleted.crates);
    appendPlanLine(planBox, t("plan.deletedTracks"), deleted.tracks);
    appendPlanLine(planBox, t("plan.deletedCues"), deleted.cues);
    appendPlanLine(planBox, t("plan.deletedGrids"), deleted.grids);
    if (plan.restore_blocked) {
      block.textContent = codedText(
        plan.restore_blocked,
        plan.restore_blocked_code,
        messageParams(plan.restore_blocked_params)
      );
      confirm2.disabled = true;
    } else {
      block.textContent = plan.dry_run ? t("plan.nothingChanged") : "";
      confirm2.disabled = false;
    }
  }
  function appendPlanLine(parent, label, rows2) {
    const line = document.createElement("p");
    const items = rows2 || [];
    if (!items.length) {
      line.textContent = t("plan.none", { label });
    } else {
      const names = items.slice(0, 8).map((item5) => item5.name || item5.path || item5.drive_label || t("plan.item"));
      const extra = items.length > names.length ? t("plan.andMore", { count: items.length - names.length }) : "";
      const listed = `${names.join(", ")}${extra}`;
      line.textContent = t("plan.listed", { label, count: items.length, names: listed });
    }
    parent.append(line);
  }
  function appendCueDiffs(parent, label, rows2) {
    const items = rows2 || [];
    const line = document.createElement("p");
    if (!items.length) {
      line.textContent = t("plan.none", { label });
      parent.append(line);
      return;
    }
    line.textContent = t("plan.files", { label, count: items.length });
    parent.append(line);
    for (const item5 of items.slice(0, 12)) {
      const row = document.createElement("p");
      row.textContent = fileName(item5.path || "");
      parent.append(row);
      for (const diff of cueDiffRows(item5.before, item5.after)) {
        parent.append(paintCueDiffRow(diff));
      }
    }
  }
  function appendFrameDiffs(parent, label, rows2) {
    const items = rows2 || [];
    const line = document.createElement("p");
    if (!items.length) {
      line.textContent = t("plan.none", { label });
      parent.append(line);
      return;
    }
    line.textContent = t("plan.files", { label, count: items.length });
    parent.append(line);
    for (const item5 of items.slice(0, 12)) {
      const row = document.createElement("p");
      row.textContent = fileName(item5.path || "");
      parent.append(row);
    }
  }
  function fileName(path) {
    const parts = String(path).split(/[/\\]/);
    return parts[parts.length - 1] || path;
  }
  function setSnapshotDialogStatus(message) {
    el("snapshot-status").textContent = message;
  }
  async function takeSnapshot() {
    const button2 = el("snapshots-take");
    button2.disabled = true;
    button2.textContent = t("snapshots.saving");
    try {
      await postJSON("/api/snapshots", { action: "create" });
      state.snapshotMessage = "snapshots.saved";
      await loadSnapshots();
    } finally {
      button2.disabled = false;
      button2.textContent = t("snapshots.take");
    }
  }
  async function confirmSnapshotRestore() {
    const confirm2 = el("snapshot-confirm");
    confirm2.disabled = true;
    confirm2.textContent = t("snapshots.restoring");
    setSnapshotDialogStatus("");
    try {
      const undoing = state.snapshotUndo && state.snapshotUndo.restore_id === state.snapshotPlanId;
      const body = undoing ? { action: "undo", confirm: true } : { action: "restore", id: state.snapshotPlanId, confirm: true };
      const result = await postJSON("/api/snapshots", body);
      const skipped = result.crates_skipped || [];
      el("snapshot-dialog").close();
      state.snapshotMessage = skipped.length ? "" : "snapshots.restored";
      await loadSnapshots();
      await reloadLibrary();
      if (skipped.length) {
        const names = skipped.map((item5) => item5.name || item5.path || t("plan.item")).join(", ");
        el("snapshots-status").textContent = t("snapshots.skippedCrates", { count: skipped.length, names });
      }
    } catch (error2) {
      setSnapshotDialogStatus(failureOf(error2).message);
      confirm2.disabled = false;
      await loadOperations();
    } finally {
      confirm2.textContent = t("snapshots.restore");
    }
  }

  // src/search-filters.ts
  var TEXT_SEARCH_FIELDS = [
    "comments",
    "grouping",
    "composer",
    "title",
    "artist",
    "album",
    "genre",
    "file"
  ];
  var KEY_VALUES = {
    "g#m": 0,
    abm: 0,
    "1a": 0,
    ebm: 1,
    "d#m": 1,
    "2a": 1,
    bbm: 2,
    "a#m": 2,
    "3a": 2,
    fm: 3,
    "4a": 3,
    cm: 4,
    "5a": 4,
    gm: 5,
    "6a": 5,
    dm: 6,
    "7a": 6,
    am: 7,
    "8a": 7,
    em: 8,
    "9a": 8,
    bm: 9,
    "10a": 9,
    "f#m": 10,
    gbm: 10,
    "11a": 10,
    "c#m": 11,
    dbm: 11,
    "12a": 11,
    b: 12,
    "1b": 12,
    "f#": 13,
    gb: 13,
    "2b": 13,
    "c#": 14,
    db: 14,
    "3b": 14,
    "g#": 15,
    ab: 15,
    "4b": 15,
    "d#": 16,
    eb: 16,
    "5b": 16,
    "a#": 17,
    bb: 17,
    "6b": 17,
    f: 18,
    "7b": 18,
    c: 19,
    "8b": 19,
    g: 20,
    "9b": 20,
    d: 21,
    "10b": 21,
    a: 22,
    "11b": 22,
    e: 23,
    "12b": 23
  };
  var NUMBER = String.raw`(\d+(?:\.\d+)?)`;
  var EXACT = new RegExp(`^${NUMBER}$`);
  var RANGE = new RegExp(`^${NUMBER}-${NUMBER}$`);
  var AROUND = new RegExp(`^${NUMBER}~${NUMBER}$`);
  var ABOVE = new RegExp(`^>${NUMBER}$`);
  var BELOW = new RegExp(`^<${NUMBER}$`);
  var NONE = /* @__PURE__ */ new Set(["none", "no", "off"]);
  var YES = /* @__PURE__ */ new Set(["yes", "true", "1"]);
  function isNone(value) {
    return NONE.has(value);
  }
  function isYes(value) {
    return YES.has(value);
  }
  var TEXT_FIELD_SET = new Set(TEXT_SEARCH_FIELDS);
  function isTextSearchField(value) {
    return TEXT_FIELD_SET.has(value);
  }
  function textField(track, field) {
    if (field === "title") return String(track.name ?? "");
    return String(track[field] ?? "");
  }
  function trackHaystack(track, field) {
    if (field) return textField(track, field).toLocaleLowerCase();
    return `${track.name} ${track.artist} ${track.album} ${track.genre} ${track.key} ${track.file}`.toLocaleLowerCase();
  }
  function hasBpm(track) {
    const bpm = Number(track.bpm);
    return track.bpm != null && track.bpm !== "" && Number.isFinite(bpm) && bpm > 0;
  }
  function hasKey2(track) {
    return Boolean(String(track.key ?? "").trim());
  }
  function cueFlag(track) {
    if (track.has_cues === true) return true;
    if (track.has_cues === false) return false;
    if (track.markers_found === true) return true;
    if (track.markers_found === false) return false;
    if (Array.isArray(track.cues)) {
      const loops = Array.isArray(track.loops) ? track.loops.length : 0;
      return track.cues.length > 0 || loops > 0;
    }
    return null;
  }
  function keyNumber(value) {
    if (!value) return -1;
    return KEY_VALUES[value.trim().toLowerCase()] ?? -1;
  }
  function mixingKeys(key) {
    const base = key < 12 ? 0 : 12;
    const index = key - base;
    return /* @__PURE__ */ new Set([key, base + (index + 1) % 12, base + (index + 11) % 12, (key + 12) % 24]);
  }
  function bpmFilter(value) {
    let match = RANGE.exec(value);
    if (match) {
      const low = Number(match[1]);
      const high = Number(match[2]);
      return low <= high ? { kind: "bpm", min: low, max: high } : { kind: "bpm", min: high, max: low };
    }
    match = AROUND.exec(value);
    if (match) {
      const center = Number(match[1]);
      const spread = Number(match[2]);
      return { kind: "bpm", min: center - spread, max: center + spread };
    }
    match = ABOVE.exec(value);
    if (match) return { kind: "bpm", min: Number(match[1]), max: Number.POSITIVE_INFINITY };
    match = BELOW.exec(value);
    if (match) return { kind: "bpm", min: 0, max: Number(match[1]) };
    match = EXACT.exec(value);
    if (match) {
      const whole = Number(match[1]);
      return Number.isInteger(whole) ? { kind: "bpm", min: whole - 0.5, max: whole + 0.5 - 1e-6 } : { kind: "bpm", min: whole, max: whole };
    }
    return null;
  }
  function parseQuery(text2) {
    const terms = [];
    const filters = [];
    for (const word of text2.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)) {
      const colon = word.indexOf(":");
      const name = colon > 0 ? word.slice(0, colon) : "";
      const value = colon > 0 ? word.slice(colon + 1) : "";
      let filter = null;
      if (name === "missing" && isYes(value)) filter = { kind: "missing" };
      else if (name === "cues" && isNone(value)) filter = { kind: "nocues" };
      else if (name === "nokeybpm" && isYes(value)) filter = { kind: "nokeybpm" };
      else if (name === "bpm" && isNone(value)) filter = { kind: "nobpm" };
      else if (name === "key" && isNone(value)) filter = { kind: "nokey" };
      else if (name === "bpm") filter = bpmFilter(value);
      else if (name === "key" || name === "mix") {
        const key = keyNumber(value);
        if (key >= 0) filter = { kind: "key", keys: name === "mix" ? mixingKeys(key) : /* @__PURE__ */ new Set([key]) };
      } else if (isTextSearchField(name) && value) {
        filter = { kind: "field", field: name, value };
      }
      if (filter) filters.push(filter);
      else terms.push(word);
    }
    return { terms, filters };
  }
  function matchesFilters(track, filters) {
    for (const filter of filters) {
      if (filter.kind === "bpm") {
        if (!hasBpm(track)) return false;
        const bpm = Number(track.bpm);
        if (bpm < filter.min - 1e-9 || bpm > filter.max + 1e-9) return false;
      } else if (filter.kind === "missing") {
        if (!track.missing) return false;
      } else if (filter.kind === "nokey") {
        if (hasKey2(track)) return false;
      } else if (filter.kind === "nobpm") {
        if (hasBpm(track)) return false;
      } else if (filter.kind === "nokeybpm") {
        if (hasKey2(track) && hasBpm(track)) return false;
      } else if (filter.kind === "nocues") {
        if (cueFlag(track) !== false) return false;
      } else if (filter.kind === "field") {
        if (!textField(track, filter.field).toLocaleLowerCase().includes(filter.value)) return false;
      } else if (!filter.keys.has(keyNumber(track.key))) {
        return false;
      }
    }
    return true;
  }
  function matchesQuery(track, query, field) {
    if (!matchesFilters(track, query.filters)) return false;
    if (!query.terms.length) return true;
    const hay = trackHaystack(track, field);
    return query.terms.every((term) => hay.includes(term));
  }

  // src/player-strings.ts
  var playerStrings = {
    get region() {
      return t("player.region");
    },
    get play() {
      return t("player.play");
    },
    get pause() {
      return t("player.pause");
    },
    get seek() {
      return t("player.seek");
    },
    get volume() {
      return t("player.volume");
    },
    get elapsed() {
      return t("player.elapsed");
    },
    get duration() {
      return t("player.duration");
    },
    get nothingPlaying() {
      return t("player.nothingPlaying");
    },
    get untitled() {
      return t("track.untitled");
    },
    get previous() {
      return t("player.previous");
    },
    get next() {
      return t("player.next");
    },
    get cue() {
      return t("player.cue");
    },
    get cannotPlay() {
      return t("player.cannotPlay");
    },
    get notInLibrary() {
      return t("player.notInLibrary");
    },
    get zoomIn() {
      return t("player.zoomIn");
    },
    get zoomOut() {
      return t("player.zoomOut");
    },
    get overview() {
      return t("player.overview");
    },
    get overviewSeek() {
      return t("player.overviewSeek");
    },
    get waveformReading() {
      return t("player.waveformReading");
    },
    get waveformUnavailable() {
      return t("player.waveformUnavailable");
    }
  };

  // src/waveform.ts
  var TILE_CSS_WIDTH = 256;
  var ZOOM_DEFAULT_PPS = 80;
  var ZOOM_MIN_PPS = 10;
  var ZOOM_MAX_PPS = 320;
  var ZOOM_FACTOR = 1.25;
  var WAVE_BG = { r: 35, g: 25, b: 16 };
  var OUTER_ALPHA = 0.6;
  var PLAYED_SHADE = 0.45;
  var BEAT_HEIGHT_RATIO = 0.12;
  var DOWNBEAT_HEIGHT_RATIO = 0.18;
  var BEAT_ALPHA = 0.28;
  var DOWNBEAT_ALPHA = 0.35;
  var DEFAULT_MARKER_COLOR = { r: 226, g: 59, b: 22 };
  var PLAYHEAD_COLOR = { r: 226, g: 59, b: 22 };
  var BEAT_MARK = { r: 255, g: 255, b: 255 };
  var HEADER_BYTES = 64;
  var HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
  var MAX_POINTS = 2e7;
  var MAX_TICKS = 8192;
  function parseSwf1(input) {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    if (bytes.byteLength < HEADER_BYTES) return null;
    if (bytes[0] !== 83 || bytes[1] !== 87 || bytes[2] !== 70 || bytes[3] !== 49) return null;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (view.getUint16(4, true) !== HEADER_BYTES) return null;
    const version = view.getUint16(6, true);
    const flags = view.getUint16(8, true);
    const analyzerVersion = view.getUint16(10, true);
    const sampleRate = view.getUint32(12, true);
    const detailHzMilli = view.getUint32(16, true);
    const durationMs = view.getUint32(20, true);
    const detailCount = view.getUint32(24, true);
    const overviewCount = view.getUint32(28, true);
    const seratoColumns = view.getUint32(32, true);
    const seratoBands = view.getUint16(36, true);
    const lowHzMilli = view.getUint32(40, true);
    const highHzMilli = view.getUint32(44, true);
    if (detailCount > MAX_POINTS || overviewCount > MAX_POINTS || seratoColumns > MAX_POINTS) return null;
    const detailBytes = detailCount * 6;
    const overviewBytes = overviewCount * 6;
    const seratoBytes = seratoColumns * seratoBands;
    if (!Number.isSafeInteger(detailBytes + overviewBytes + seratoBytes)) return null;
    const end = HEADER_BYTES + detailBytes + overviewBytes + seratoBytes;
    if (end !== bytes.byteLength) return null;
    let offset = HEADER_BYTES;
    const detail = bytes.slice(offset, offset + detailBytes);
    offset += detailBytes;
    const overview = bytes.slice(offset, offset + overviewBytes);
    offset += overviewBytes;
    const serato = bytes.slice(offset, offset + seratoBytes);
    return {
      version,
      flags,
      analyzerVersion,
      sampleRate,
      pointsPerSecond: detailHzMilli / 1e3,
      durationMs,
      detail,
      overview,
      serato,
      detailCount,
      overviewCount,
      seratoColumns,
      seratoBands,
      lowHz: lowHzMilli / 1e3,
      highHz: highHzMilli / 1e3
    };
  }
  function bandColor(low, mid, high) {
    const l = clamp255(low);
    const m = clamp255(mid);
    const h = clamp255(high);
    const max = Math.max(l, m, h);
    if (max === 0) return { r: 0, g: 0, b: 0 };
    return {
      r: Math.round(l / max * 255),
      g: Math.round(m / max * 255),
      b: Math.round(h / max * 255)
    };
  }
  function bandLevel(low, mid, high) {
    return Math.max(clamp255(low), clamp255(mid), clamp255(high)) / 255;
  }
  function seratoColumnLevels(column) {
    let low = 0;
    let mid = 0;
    let high = 0;
    const count = Math.min(column.length, 16);
    for (let index = 0; index < count; index += 1) {
      const value = clamp255(column[index] ?? 0);
      if (index <= 4) low = Math.max(low, value);
      else if (index <= 10) mid = Math.max(mid, value);
      else high = Math.max(high, value);
    }
    return { low, mid, high };
  }
  function beatgridTicks(markers, startSeconds, endSeconds) {
    if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds) || endSeconds <= startSeconds) return [];
    const ordered = markers.filter((marker) => Number.isFinite(marker.positionSeconds)).slice();
    ordered.sort((left, right) => left.positionSeconds - right.positionSeconds);
    if (ordered.length === 0) return [];
    const ticks = [];
    let beatIndex = 0;
    for (let index = 0; index < ordered.length; index += 1) {
      const marker = ordered[index];
      if (!marker) continue;
      const next2 = ordered[index + 1];
      if (next2) {
        const beats = marker.beats;
        if (beats === void 0 || !Number.isFinite(beats) || beats < 1) continue;
        const count = Math.round(beats);
        const spacing2 = (next2.positionSeconds - marker.positionSeconds) / beats;
        if (!(spacing2 > 0) || count < 1) continue;
        pushRange(ticks, marker.positionSeconds, spacing2, beatIndex, count, startSeconds, endSeconds);
        beatIndex += count;
        continue;
      }
      const bpm = marker.bpm;
      if (bpm === void 0 || !Number.isFinite(bpm) || bpm <= 0) continue;
      const spacing = 60 / bpm;
      if (!(spacing > 0)) continue;
      const first = Math.max(0, Math.ceil((startSeconds - marker.positionSeconds) / spacing - 1e-9));
      const lastExclusive = Math.ceil((endSeconds - marker.positionSeconds) / spacing - 1e-9);
      if (lastExclusive <= first) continue;
      const emit2 = Math.min(lastExclusive, first + MAX_TICKS);
      pushRange(ticks, marker.positionSeconds, spacing, beatIndex, emit2, startSeconds, endSeconds, first);
    }
    return ticks;
  }
  function timeToX(timeSeconds, playheadSeconds, pixelsPerSecond, width) {
    if (!(pixelsPerSecond > 0) || !Number.isFinite(timeSeconds) || !Number.isFinite(playheadSeconds) || !Number.isFinite(width)) {
      return width / 2;
    }
    return width / 2 + (timeSeconds - playheadSeconds) * pixelsPerSecond;
  }
  function overviewXToTime(x, width, durationSeconds) {
    if (!(width > 0) || !(durationSeconds > 0) || !Number.isFinite(x)) return 0;
    const ratio = Math.min(1, Math.max(0, x / width));
    return ratio * durationSeconds;
  }
  function zoomPixelsPerSecond(current2, direction) {
    const base = Number.isFinite(current2) && current2 > 0 ? current2 : ZOOM_DEFAULT_PPS;
    const next2 = base * (direction > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR);
    if (next2 >= ZOOM_MAX_PPS) return ZOOM_MAX_PPS;
    if (next2 <= ZOOM_MIN_PPS) return ZOOM_MIN_PPS;
    return next2;
  }
  function tileDeviceWidth(dpr) {
    const scale = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
    return Math.max(1, Math.round(TILE_CSS_WIDTH * scale));
  }
  function colorFromHex(value) {
    if (!HEX_COLOR.test(value)) return null;
    let hex = value.slice(1);
    if (hex.length === 3) {
      const r = hex[0] ?? "";
      const g = hex[1] ?? "";
      const b = hex[2] ?? "";
      hex = `${r}${r}${g}${g}${b}${b}`;
    }
    if (hex.length === 8) hex = hex.slice(0, 6);
    const parsed = Number.parseInt(hex, 16);
    if (!Number.isFinite(parsed)) return null;
    return { r: parsed >> 16 & 255, g: parsed >> 8 & 255, b: parsed & 255 };
  }
  function beatgridFromMarkers(rows2) {
    if (!rows2 || rows2.length === 0) return [];
    const found = [];
    for (const row of rows2) {
      const position = finiteNumber(row.position_seconds) ?? finiteNumber(row.position);
      if (position === null) continue;
      const marker = { positionSeconds: position };
      const beats = finiteNumber(row.beats);
      const bpm = finiteNumber(row.bpm);
      if (beats !== null) marker.beats = beats;
      if (bpm !== null) marker.bpm = bpm;
      found.push(marker);
    }
    return found;
  }
  function loopsFromMarkers(rows2) {
    if (!rows2 || rows2.length === 0) return [];
    const found = [];
    for (const row of rows2) {
      const start = finiteNumber(row.start_ms);
      const end = finiteNumber(row.end_ms);
      if (start === null || end === null || end <= start || start < 0) continue;
      found.push({
        startSeconds: start / 1e3,
        endSeconds: end / 1e3,
        color: typeof row.color === "string" ? row.color : ""
      });
    }
    return found;
  }
  var DetailTiles = class {
    /**
     * Remember one detail buffer.
     *
     * @param detail `N * 6` uint8 bytes.
     * @param pointCount N.
     * @param pointsPerSecond Detail rate from the header. 150 in SWF1.
     */
    constructor(detail, pointCount, pointsPerSecond) {
      this.detail = detail;
      this.pointCount = pointCount;
      this.pointsPerSecond = pointsPerSecond;
    }
    detail;
    pointCount;
    pointsPerSecond;
    tiles = /* @__PURE__ */ new Map();
    blank = null;
    /**
     * Drop cached tiles.
     *
     * Called when the zoom changes so the next frame rebuilds at the new scale.
     */
    clear() {
      this.tiles.clear();
    }
    /**
     * Paint one zoomed frame into `frame`.
     *
     * The playhead is the center column. Tiles outside the view, plus one
     * tile of margin, are not generated. Markers are cues, shaded loops, and
     * beat ticks. Downbeats are taller.
     *
     * @param frame RGBA buffer of `width * height`.
     * @param width Device pixels.
     * @param height Device pixels.
     * @param dpr Device pixel ratio.
     * @param playheadSeconds Audio position.
     * @param pixelsPerSecond CSS pixels per second.
     * @param markers Cues, loops, and the beatgrid. Beat ticks are not drawn
     *   when the grid is empty.
     * @returns How many detail points this call sampled. Zero when every
     *   visible tile was already cached.
     */
    paint(frame, width, height, dpr, playheadSeconds, pixelsPerSecond, markers) {
      const scale = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
      const pps = pixelsPerSecond > 0 ? pixelsPerSecond : ZOOM_DEFAULT_PPS;
      this.ensureBlank(width, height);
      const blank = this.blank;
      if (!blank || frame.length !== blank.length) return { pointsRead: 0 };
      frame.set(blank);
      const cssWidth = width / scale;
      const tileSeconds = TILE_CSS_WIDTH / pps;
      const tileWidth = tileDeviceWidth(scale);
      const viewStart = playheadSeconds - cssWidth / 2 / pps;
      const viewEnd = playheadSeconds + cssWidth / 2 / pps;
      const first = Math.floor(viewStart / tileSeconds) - 1;
      const last = Math.floor(viewEnd / tileSeconds) + 1;
      let pointsRead = 0;
      const needed = /* @__PURE__ */ new Set();
      for (let index = first; index <= last; index += 1) {
        const key = `${Math.round(pps * 1e3)}|${scale}|${height}|${index}`;
        needed.add(key);
        let tile = this.tiles.get(key);
        if (!tile) {
          const rendered = renderTile(
            this.detail,
            this.pointCount,
            this.pointsPerSecond,
            index * tileSeconds,
            tileSeconds,
            tileWidth,
            height,
            scale
          );
          tile = rendered.pixels;
          pointsRead += rendered.pointsRead;
          this.tiles.set(key, tile);
        }
        const left = timeToX(index * tileSeconds, playheadSeconds, pps, cssWidth) * scale;
        blit(frame, width, height, tile, tileWidth, Math.round(left));
      }
      if (this.tiles.size > 24) {
        for (const key of this.tiles.keys()) {
          if (!needed.has(key)) this.tiles.delete(key);
        }
      }
      drawLoops(frame, width, height, scale, playheadSeconds, pps, cssWidth, markers.loops);
      drawBeats(frame, width, height, scale, playheadSeconds, pps, cssWidth, markers.beatgrid, viewStart, viewEnd);
      drawCues(frame, width, height, scale, playheadSeconds, pps, cssWidth, markers.cues);
      drawPlayhead(frame, width, height);
      return { pointsRead };
    }
    ensureBlank(width, height) {
      const count = width * height * 4;
      if (this.blank && this.blank.length === count) return;
      const blank = new Uint8ClampedArray(count);
      fillBackground(blank);
      this.blank = blank;
    }
  };
  function renderOverview(source, width, height) {
    const pixels = new Uint8ClampedArray(width * height * 4);
    fillBackground(pixels);
    const columns = source.kind === "computed" ? source.count : source.columns.length;
    if (columns < 1 || width < 1 || height < 1) return pixels;
    for (let x = 0; x < width; x += 1) {
      const start = Math.floor(x / width * columns);
      const end = Math.max(start + 1, Math.floor((x + 1) / width * columns));
      let lowPeak = 0;
      let lowRms = 0;
      let midPeak = 0;
      let midRms = 0;
      let highPeak = 0;
      let highRms = 0;
      for (let index = start; index < end && index < columns; index += 1) {
        if (source.kind === "computed") {
          const offset = index * 6;
          lowPeak = Math.max(lowPeak, source.points[offset] ?? 0);
          lowRms = Math.max(lowRms, source.points[offset + 1] ?? 0);
          midPeak = Math.max(midPeak, source.points[offset + 2] ?? 0);
          midRms = Math.max(midRms, source.points[offset + 3] ?? 0);
          highPeak = Math.max(highPeak, source.points[offset + 4] ?? 0);
          highRms = Math.max(highRms, source.points[offset + 5] ?? 0);
        } else {
          const levels = seratoColumnLevels(source.columns[index] ?? []);
          lowPeak = Math.max(lowPeak, levels.low);
          midPeak = Math.max(midPeak, levels.mid);
          highPeak = Math.max(highPeak, levels.high);
          lowRms = lowPeak;
          midRms = midPeak;
          highRms = highPeak;
        }
      }
      paintColumn(pixels, x, width, height, 0, lowPeak, lowRms, midPeak, midRms, highPeak, highRms);
    }
    return pixels;
  }
  function shadePlayed(pixels, width, height, playedX) {
    const end = Math.max(0, Math.min(width, Math.round(playedX)));
    for (let y = 0; y < height; y += 1) {
      const row = y * width;
      for (let x = 0; x < end; x += 1) {
        const offset = (row + x) * 4;
        pixels[offset] = Math.round((pixels[offset] ?? 0) * PLAYED_SHADE);
        pixels[offset + 1] = Math.round((pixels[offset + 1] ?? 0) * PLAYED_SHADE);
        pixels[offset + 2] = Math.round((pixels[offset + 2] ?? 0) * PLAYED_SHADE);
      }
    }
  }
  function drawOverviewMarks(pixels, width, height, durationSeconds, playheadSeconds, markers) {
    if (!(durationSeconds > 0) || width < 1) return;
    const xOf = (seconds) => seconds / durationSeconds * width;
    drawLoops(pixels, width, height, 1, 0, 1, width, markers.loops, xOf);
    drawCues(pixels, width, height, 1, 0, 1, width, markers.cues, xOf);
    const playX = Math.round(Math.min(width - 1, Math.max(0, xOf(playheadSeconds))));
    fillSpan(pixels, width, height, playX, playX + 1, 0, height, PLAYHEAD_COLOR, 1);
  }
  function renderTile(detail, pointCount, pointsPerSecond, startSeconds, tileSeconds, width, height, dpr) {
    const pixels = new Uint8ClampedArray(width * height * 4);
    fillBackground(pixels);
    let pointsRead = 0;
    const rate = pointsPerSecond > 0 ? pointsPerSecond : 150;
    for (let x = 0; x < width; x += 1) {
      const t0 = startSeconds + x / width * tileSeconds;
      const t1 = startSeconds + (x + 1) / width * tileSeconds;
      let i0 = Math.floor(t0 * rate);
      let i1 = Math.ceil(t1 * rate);
      if (i1 <= i0) i1 = i0 + 1;
      if (i0 < 0) i0 = 0;
      if (i1 > pointCount) i1 = pointCount;
      if (i0 >= i1) continue;
      let lowPeak = 0;
      let lowRms = 0;
      let midPeak = 0;
      let midRms = 0;
      let highPeak = 0;
      let highRms = 0;
      for (let index = i0; index < i1; index += 1) {
        pointsRead += 1;
        const offset = index * 6;
        lowPeak = Math.max(lowPeak, detail[offset] ?? 0);
        lowRms = Math.max(lowRms, detail[offset + 1] ?? 0);
        midPeak = Math.max(midPeak, detail[offset + 2] ?? 0);
        midRms = Math.max(midRms, detail[offset + 3] ?? 0);
        highPeak = Math.max(highPeak, detail[offset + 4] ?? 0);
        highRms = Math.max(highRms, detail[offset + 5] ?? 0);
      }
      paintColumn(pixels, x, width, height, 0, lowPeak, lowRms, midPeak, midRms, highPeak, highRms);
    }
    return { pixels, pointsRead };
  }
  function paintColumn(pixels, x, width, height, gutter, lowPeak, lowRms, midPeak, midRms, highPeak, highRms) {
    const peakLevel = bandLevel(lowPeak, midPeak, highPeak);
    const rmsLevel = bandLevel(lowRms, midRms, highRms);
    if (peakLevel <= 0 && rmsLevel <= 0) return;
    const top = Math.min(gutter, height - 1);
    const bandHeight = height - top;
    const mid = top + (bandHeight - 1) / 2;
    const peakHalf = Math.max(peakLevel > 0 ? 0.5 : 0, peakLevel * (bandHeight / 2) * 0.92);
    const rmsHalf = rmsLevel * (bandHeight / 2) * 0.92;
    const y0 = Math.max(top, Math.floor(mid - Math.max(peakHalf, rmsHalf)));
    const y1 = Math.min(height - 1, Math.ceil(mid + Math.max(peakHalf, rmsHalf)));
    const peakColor = bandColor(lowPeak, midPeak, highPeak);
    const rmsColor = bandColor(lowRms, midRms, highRms);
    for (let y = y0; y <= y1; y += 1) {
      const fromMid = Math.abs(y - mid);
      const inner = rmsLevel > 0 && fromMid <= rmsHalf;
      const outer = peakLevel > 0 && fromMid <= peakHalf;
      if (!inner && !outer) continue;
      const color = inner ? rmsColor : peakColor;
      const alpha = inner ? 1 : OUTER_ALPHA;
      blendPixel(pixels, width, x, y, color, alpha);
    }
  }
  function drawLoops(pixels, width, height, dpr, playheadSeconds, pixelsPerSecond, cssWidth, loops, xOf) {
    for (const loop of loops) {
      const color = colorFromHex(loop.color) ?? DEFAULT_MARKER_COLOR;
      const start = xOf ? xOf(loop.startSeconds) : timeToX(loop.startSeconds, playheadSeconds, pixelsPerSecond, cssWidth) * dpr;
      const end = xOf ? xOf(loop.endSeconds) : timeToX(loop.endSeconds, playheadSeconds, pixelsPerSecond, cssWidth) * dpr;
      const left = Math.min(start, end);
      const right = Math.max(start, end);
      fillSpan(pixels, width, height, Math.floor(left), Math.ceil(right), 0, height, color, 0.35);
      const edge = Math.max(1, Math.round(dpr));
      fillSpan(pixels, width, height, Math.round(left), Math.round(left) + edge, 0, height, color, 1);
      fillSpan(pixels, width, height, Math.round(right) - edge, Math.round(right), 0, height, color, 1);
    }
  }
  function drawCues(pixels, width, height, dpr, playheadSeconds, pixelsPerSecond, cssWidth, cues2, xOf) {
    const edge = Math.max(1, Math.round(2 * dpr));
    for (const cue of cues2) {
      const color = colorFromHex(cue.color) ?? DEFAULT_MARKER_COLOR;
      const x = xOf ? xOf(cue.seconds) : timeToX(cue.seconds, playheadSeconds, pixelsPerSecond, cssWidth) * dpr;
      fillSpan(pixels, width, height, Math.round(x) - Math.floor(edge / 2), Math.round(x) - Math.floor(edge / 2) + edge, 0, height, color, 1);
    }
  }
  function drawBeats(pixels, width, height, dpr, playheadSeconds, pixelsPerSecond, cssWidth, markers, viewStart, viewEnd) {
    const ticks = beatgridTicks(markers, viewStart, viewEnd);
    const tickWidth = Math.max(1, Math.round(dpr));
    const regularHeight = Math.max(1, Math.round(height * BEAT_HEIGHT_RATIO));
    const downbeatHeight = Math.max(regularHeight + 1, Math.round(height * DOWNBEAT_HEIGHT_RATIO));
    for (const tick of ticks) {
      const x = Math.round(timeToX(tick.seconds, playheadSeconds, pixelsPerSecond, cssWidth) * dpr);
      const tickHeight = Math.min(tick.downbeat ? downbeatHeight : regularHeight, Math.floor(height / 2) - 1);
      if (tickHeight < 1) continue;
      const alpha = tick.downbeat ? DOWNBEAT_ALPHA : BEAT_ALPHA;
      fillSpan(pixels, width, height, x, x + tickWidth, 0, tickHeight, BEAT_MARK, alpha);
      fillSpan(pixels, width, height, x, x + tickWidth, height - tickHeight, height, BEAT_MARK, alpha);
    }
  }
  function drawPlayhead(pixels, width, height) {
    const x = Math.floor(width / 2);
    fillSpan(pixels, width, height, x, x + 2, 0, height, PLAYHEAD_COLOR, 1);
  }
  function fillSpan(pixels, width, height, x0, x1, y0, y1, color, alpha) {
    const left = Math.max(0, x0);
    const right = Math.min(width, x1);
    const top = Math.max(0, y0);
    const bottom = Math.min(height, y1);
    for (let x = left; x < right; x += 1) {
      for (let y = top; y < bottom; y += 1) blendPixel(pixels, width, x, y, color, alpha);
    }
  }
  function blendPixel(pixels, width, x, y, color, alpha) {
    const offset = (y * width + x) * 4;
    const keep = 1 - alpha;
    pixels[offset] = Math.round(color.r * alpha + (pixels[offset] ?? 0) * keep);
    pixels[offset + 1] = Math.round(color.g * alpha + (pixels[offset + 1] ?? 0) * keep);
    pixels[offset + 2] = Math.round(color.b * alpha + (pixels[offset + 2] ?? 0) * keep);
    pixels[offset + 3] = 255;
  }
  function fillBackground(pixels) {
    for (let index = 0; index < pixels.length; index += 4) {
      pixels[index] = WAVE_BG.r;
      pixels[index + 1] = WAVE_BG.g;
      pixels[index + 2] = WAVE_BG.b;
      pixels[index + 3] = 255;
    }
  }
  function blit(dest, destWidth, destHeight, src, srcWidth, destX) {
    let srcX = 0;
    let copyWidth = srcWidth;
    let dx = destX;
    if (dx < 0) {
      srcX = -dx;
      copyWidth -= srcX;
      dx = 0;
    }
    if (dx + copyWidth > destWidth) copyWidth = destWidth - dx;
    if (copyWidth <= 0) return;
    for (let y = 0; y < destHeight; y += 1) {
      const srcStart = (y * srcWidth + srcX) * 4;
      const destStart = (y * destWidth + dx) * 4;
      dest.set(src.subarray(srcStart, srcStart + copyWidth * 4), destStart);
    }
  }
  function pushRange(ticks, origin, spacing, beatIndex, count, startSeconds, endSeconds, first = 0) {
    const begin = Math.max(first, Math.ceil((startSeconds - origin) / spacing - 1e-9));
    for (let index = begin; index < count; index += 1) {
      const seconds = origin + index * spacing;
      if (seconds < startSeconds - 1e-6) continue;
      if (seconds >= endSeconds - 1e-9) break;
      if (ticks.length >= MAX_TICKS) return;
      ticks.push({ seconds, downbeat: (beatIndex + index) % 4 === 0 });
    }
  }
  function finiteNumber(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value !== "string" || value.trim() === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }
  function clamp255(value) {
    if (!Number.isFinite(value)) return 0;
    if (value <= 0) return 0;
    if (value >= 255) return 255;
    return value;
  }

  // src/waveform-view.ts
  var emptyMarkers = () => ({ cues: [], loops: [], beatgrid: [] });
  function mountWaveform(host, hooks) {
    return new WaveformView(host, hooks);
  }
  var WaveformView = class {
    host;
    hooks;
    detail;
    overviewCanvas;
    overviewHit;
    reading;
    note;
    detailWrap;
    zoomIn;
    zoomOut;
    trackId = null;
    token = 0;
    pps = ZOOM_DEFAULT_PPS;
    markers = emptyMarkers();
    tiles = null;
    parsed = null;
    overviewSource = "";
    seratoColumns = [];
    overviewCache = null;
    overviewKey = "";
    raf = 0;
    dragging = false;
    disposed = false;
    detailImage = null;
    overviewImage = null;
    lastAriaKey = "";
    ariaImmediate = false;
    onWheel;
    onResize;
    resizeObserver = null;
    constructor(host, hooks) {
      this.host = host;
      this.hooks = hooks;
      host.classList.add("player-wave");
      host.hidden = true;
      const main = document.createElement("div");
      main.className = "player-wave-main";
      this.detailWrap = document.createElement("div");
      this.detailWrap.className = "waveform-detail-wrap";
      this.detail = document.createElement("canvas");
      this.detail.className = "waveform-detail";
      this.detail.setAttribute("aria-hidden", "true");
      this.reading = document.createElement("p");
      this.reading.className = "waveform-reading";
      this.reading.textContent = playerStrings.waveformReading;
      this.detailWrap.append(this.detail, this.reading);
      this.note = document.createElement("p");
      this.note.className = "waveform-note";
      this.note.hidden = true;
      this.note.textContent = playerStrings.waveformUnavailable;
      this.overviewHit = document.createElement("div");
      this.overviewHit.className = "waveform-overview";
      this.overviewHit.tabIndex = 0;
      this.overviewHit.setAttribute("role", "slider");
      this.overviewHit.setAttribute("aria-label", playerStrings.overview);
      this.overviewHit.setAttribute("aria-orientation", "horizontal");
      setTooltip(this.overviewHit, tips.overview);
      this.overviewCanvas = document.createElement("canvas");
      this.overviewCanvas.setAttribute("aria-hidden", "true");
      this.overviewHit.append(this.overviewCanvas);
      main.append(this.detailWrap, this.note, this.overviewHit);
      const zoom = document.createElement("div");
      zoom.className = "waveform-zoom";
      this.zoomIn = button(playerStrings.zoomIn, "+", tips.zoomIn);
      this.zoomOut = button(playerStrings.zoomOut, "−", tips.zoomOut);
      this.zoomIn.addEventListener("click", () => this.setZoom(zoomPixelsPerSecond(this.pps, 1)));
      this.zoomOut.addEventListener("click", () => this.setZoom(zoomPixelsPerSecond(this.pps, -1)));
      zoom.append(this.zoomIn, this.zoomOut);
      host.append(main, zoom);
      this.onWheel = (event) => this.wheel(event);
      host.addEventListener("wheel", this.onWheel, { passive: false });
      this.overviewHit.addEventListener("pointerdown", (event) => this.pointerDown(event));
      this.overviewHit.addEventListener("pointermove", (event) => this.pointerMove(event));
      this.overviewHit.addEventListener("pointerup", (event) => this.pointerUp(event));
      this.overviewHit.addEventListener("pointercancel", (event) => this.pointerUp(event));
      this.overviewHit.addEventListener("keydown", (event) => this.overviewKeyDown(event));
      this.onResize = () => this.paint();
      if (typeof ResizeObserver === "function") {
        this.resizeObserver = new ResizeObserver(this.onResize);
        this.resizeObserver.observe(host);
      }
      this.syncZoomButtons();
    }
    /**
     * Load one track, or hide the waveform when playback is cleared.
     *
     * The same id does not fetch again. Overview and the SWF1 body are
     * requested together. Playback is not paused from here.
     *
     * @param id Library track id, or null when nothing is loaded.
     */
    setTrack(id) {
      if (this.disposed) return;
      if (id !== null && id === this.trackId) return;
      this.token += 1;
      this.trackId = id;
      this.parsed = null;
      this.tiles = null;
      this.markers = emptyMarkers();
      this.overviewCache = null;
      this.overviewKey = "";
      this.overviewSource = "";
      this.seratoColumns = [];
      delete this.overviewHit.dataset.waveformOverview;
      if (id === null || !Number.isInteger(id) || id < 0) {
        this.host.hidden = true;
        this.stopLoop();
        return;
      }
      this.host.hidden = false;
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
    setMarkers(id, markers) {
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
    showComputed(parsed) {
      this.trackId = this.trackId ?? 1;
      this.host.hidden = false;
      this.applyComputed(parsed);
    }
    /** Refresh titles and notes in the active language. Playback is not touched. */
    relabel() {
      this.reading.textContent = playerStrings.waveformReading;
      if (!this.note.hidden) this.note.textContent = playerStrings.waveformUnavailable;
      this.overviewHit.setAttribute("aria-label", playerStrings.overview);
      setTooltip(this.overviewHit, tips.overview);
      this.zoomIn.setAttribute("aria-label", playerStrings.zoomIn);
      setTooltip(this.zoomIn, tips.zoomIn);
      this.zoomOut.setAttribute("aria-label", playerStrings.zoomOut);
      setTooltip(this.zoomOut, tips.zoomOut);
    }
    /**
     * Show the format note and hide the canvases.
     *
     * The screenshot harness uses this for a file that cannot be decoded.
     * Playback is not touched.
     */
    showUnavailable() {
      this.token += 1;
      this.parsed = null;
      this.tiles = null;
      this.overviewSource = "";
      this.seratoColumns = [];
      this.overviewCache = null;
      this.overviewKey = "";
      delete this.overviewHit.dataset.waveformOverview;
      this.host.hidden = false;
      this.setPhase("unavailable");
    }
    /**
     * Follow play, pause, and seek.
     *
     * While audio is playing, frames are scheduled from the audio clock.
     * A paused seek paints once.
     */
    sync() {
      if (this.disposed || this.host.hidden) return;
      if (this.hooks.getPlaying()) this.startLoop();
      else this.stopLoop();
      this.paint();
    }
    /**
     * Current zoom in CSS pixels per second.
     *
     * @returns The zoom the buttons and the wheel last set.
     */
    pixelsPerSecond() {
      return this.pps;
    }
    /**
     * Remove listeners and stop the animation frame.
     */
    destroy() {
      this.disposed = true;
      this.token += 1;
      this.stopLoop();
      this.host.removeEventListener("wheel", this.onWheel);
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
    }
    async load(id, mine) {
      const overview = this.fetchOverview(id);
      const body = this.fetchWaveform(id);
      void overview.then((serato) => {
        if (mine !== this.token || !serato || serato.length === 0) return;
        if (this.overviewSource === "computed") return;
        this.seratoColumns = serato;
        this.overviewSource = "serato";
        this.overviewHit.dataset.waveformOverview = "serato";
        this.overviewCache = null;
        this.overviewKey = "";
        this.overviewHit.hidden = false;
        this.paint();
      });
      const waveform2 = await body;
      if (mine !== this.token) return;
      if (waveform2 === "unavailable") {
        this.parsed = null;
        this.tiles = null;
        this.setPhase("unavailable");
        this.paint();
        return;
      }
      if (waveform2) this.applyComputed(waveform2);
    }
    applyComputed(parsed) {
      this.parsed = parsed;
      const rate = parsed.pointsPerSecond > 0 ? parsed.pointsPerSecond : 150;
      this.tiles = new DetailTiles(parsed.detail, parsed.detailCount, rate);
      this.overviewSource = "computed";
      this.overviewHit.dataset.waveformOverview = "computed";
      this.overviewCache = null;
      this.overviewKey = "";
      this.setPhase("ready");
      this.paint();
    }
    async fetchOverview(id) {
      try {
        if (typeof fetch !== "function") return null;
        const response = await fetch(waveformUrl(id, true));
        if (!response.ok) return null;
        const payload = await response.json();
        if (!payload || typeof payload !== "object") return null;
        const record = payload;
        if (record.available !== true || !Array.isArray(record.data)) return null;
        const columns = [];
        for (const column of record.data) {
          if (!Array.isArray(column)) continue;
          columns.push(column.map((value) => typeof value === "number" && Number.isFinite(value) ? value : 0));
        }
        return columns;
      } catch {
        return null;
      }
    }
    async fetchWaveform(id) {
      try {
        if (typeof fetch !== "function") return null;
        const response = await fetch(waveformUrl(id, false));
        if (!response.ok) return null;
        const buffer = await response.arrayBuffer();
        const parsed = parseSwf1(buffer);
        if (parsed) return parsed;
        const text2 = new TextDecoder().decode(buffer);
        try {
          const payload = JSON.parse(text2);
          if (payload && typeof payload === "object" && payload.available === false) {
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
    setPhase(phase2) {
      this.host.dataset.waveformState = phase2;
      const unavailable = phase2 === "unavailable";
      this.note.hidden = !unavailable;
      this.reading.hidden = phase2 !== "reading";
      this.detailWrap.hidden = unavailable;
      this.overviewHit.hidden = this.overviewSource === "";
      this.syncZoomButtons();
    }
    setZoom(next2) {
      if (next2 === this.pps) {
        this.syncZoomButtons();
        return;
      }
      this.pps = next2;
      this.tiles?.clear();
      this.syncZoomButtons();
      this.paint();
    }
    syncZoomButtons() {
      const phase2 = this.host.dataset.waveformState;
      const blocked = phase2 === "reading" || phase2 === "unavailable";
      this.zoomIn.disabled = blocked || this.pps >= ZOOM_MAX_PPS - 1e-9;
      this.zoomOut.disabled = blocked || this.pps <= ZOOM_MIN_PPS + 1e-9;
    }
    wheel(event) {
      if (!event.ctrlKey && !event.metaKey) return;
      if (this.host.dataset.waveformState !== "ready") return;
      event.preventDefault();
      if (event.deltaY < 0) this.setZoom(zoomPixelsPerSecond(this.pps, 1));
      else if (event.deltaY > 0) this.setZoom(zoomPixelsPerSecond(this.pps, -1));
    }
    pointerDown(event) {
      if (event.button !== 0) return;
      this.dragging = true;
      if (typeof this.overviewHit.setPointerCapture === "function") {
        this.overviewHit.setPointerCapture(event.pointerId);
      }
      this.seekOverview(event);
    }
    pointerMove(event) {
      if (!this.dragging) return;
      this.seekOverview(event);
    }
    pointerUp(event) {
      if (!this.dragging) return;
      this.dragging = false;
      if (typeof this.overviewHit.hasPointerCapture === "function" && this.overviewHit.hasPointerCapture(event.pointerId)) {
        this.overviewHit.releasePointerCapture(event.pointerId);
      }
    }
    seekOverview(event) {
      const rect = this.overviewHit.getBoundingClientRect();
      const duration2 = this.duration();
      const x = event.clientX - rect.left;
      this.ariaImmediate = true;
      this.hooks.seek(overviewXToTime(x, rect.width, duration2));
    }
    overviewKeyDown(event) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
      const forward = event.key === "ArrowRight" || event.key === "ArrowUp";
      const back = event.key === "ArrowLeft" || event.key === "ArrowDown";
      if (!forward && !back) return;
      event.preventDefault();
      event.stopPropagation();
      const step = event.shiftKey ? this.hooks.seekStepLarge : this.hooks.seekStep;
      this.ariaImmediate = true;
      this.hooks.seekBy((forward ? 1 : -1) * step);
    }
    startLoop() {
      if (this.raf !== 0) return;
      const loop = () => {
        this.paint();
        if (this.hooks.getPlaying() && !this.disposed) this.raf = requestAnimationFrame(loop);
        else this.raf = 0;
      };
      this.raf = requestAnimationFrame(loop);
    }
    stopLoop() {
      if (this.raf === 0) return;
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    paint() {
      if (this.disposed || this.host.hidden) return;
      const time = this.hooks.getTime();
      const duration2 = this.duration();
      this.paintDetail(time);
      this.paintOverview(time, duration2);
      const immediate = this.ariaImmediate;
      this.ariaImmediate = false;
      this.updateSlider(time, duration2, immediate);
    }
    paintDetail(time) {
      if (!this.tiles || !this.parsed) return;
      const size = sizeCanvas(this.detail, 96);
      if (!size) return;
      const context = this.detail.getContext("2d");
      if (!context) return;
      const image = this.canvasImage(context, "detail", size.width, size.height);
      this.tiles.paint(image.data, size.width, size.height, size.dpr, time, this.pps, this.markers);
      context.putImageData(image, 0, 0);
    }
    paintOverview(time, duration2) {
      const size = sizeCanvas(this.overviewCanvas, 36);
      if (!size) return;
      const source = this.overviewPixels(size.width, size.height);
      if (!source) return;
      const context = this.overviewCanvas.getContext("2d");
      if (!context) return;
      const image = this.canvasImage(context, "overview", size.width, size.height);
      image.data.set(source);
      const played = duration2 > 0 ? Math.min(duration2, Math.max(0, time)) / duration2 * size.width : 0;
      shadePlayed(image.data, size.width, size.height, played);
      drawOverviewMarks(image.data, size.width, size.height, duration2 > 0 ? duration2 : this.headerDuration(), time, this.markers);
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
    canvasImage(context, which, width, height) {
      const current2 = which === "detail" ? this.detailImage : this.overviewImage;
      if (current2 && current2.width === width && current2.height === height) return current2;
      const image = context.createImageData(width, height);
      if (which === "detail") this.detailImage = image;
      else this.overviewImage = image;
      return image;
    }
    overviewPixels(width, height) {
      const key = `${this.overviewSource}|${width}|${height}|${this.token}`;
      if (this.overviewCache && this.overviewKey === key) return this.overviewCache;
      if (this.overviewSource === "computed" && this.parsed && this.parsed.overviewCount > 0) {
        this.overviewCache = renderOverview(
          { kind: "computed", points: this.parsed.overview, count: this.parsed.overviewCount },
          width,
          height
        );
        this.overviewKey = key;
        this.overviewHit.dataset.waveformOverview = "computed";
        return this.overviewCache;
      }
      if (this.overviewSource === "serato" && this.seratoColumns.length > 0) {
        this.overviewCache = renderOverview({ kind: "serato", columns: this.seratoColumns }, width, height);
        this.overviewKey = key;
        this.overviewHit.dataset.waveformOverview = "serato";
        return this.overviewCache;
      }
      return null;
    }
    updateSlider(time, duration2, immediate) {
      const max = duration2 > 0 ? duration2 : 0;
      const now = Math.min(max, Math.max(0, Number.isFinite(time) ? time : 0));
      const key = `${Math.floor(now)}|${max}`;
      if (!immediate && key === this.lastAriaKey) return;
      this.lastAriaKey = key;
      this.overviewHit.setAttribute("aria-valuemin", "0");
      this.overviewHit.setAttribute("aria-valuemax", String(max));
      this.overviewHit.setAttribute("aria-valuenow", String(now));
      this.overviewHit.setAttribute("aria-valuetext", this.hooks.formatTime(now));
    }
    duration() {
      const fromAudio = this.hooks.getDuration();
      if (Number.isFinite(fromAudio) && fromAudio > 0) return fromAudio;
      return this.headerDuration();
    }
    headerDuration() {
      if (!this.parsed || !(this.parsed.durationMs > 0)) return 0;
      return this.parsed.durationMs / 1e3;
    }
  };
  function button(label, text2, tooltip) {
    const element = buttonEl(tooltip);
    element.className = "waveform-zoom-button";
    element.textContent = text2;
    element.setAttribute("aria-label", label);
    return element;
  }
  function waveformUrl(id, overview) {
    const params = new URLSearchParams({ id: String(id), space: state.space });
    const path = overview ? "/api/waveform/overview" : "/api/waveform";
    return `${path}?${params.toString()}`;
  }
  function sizeCanvas(canvas, cssHeight) {
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

  // src/player.ts
  var SEEK_STEP_SECONDS = 5;
  var SEEK_STEP_LARGE_SECONDS = 30;
  var listeners = /* @__PURE__ */ new Set();
  var wired = /* @__PURE__ */ new WeakSet();
  var media = null;
  var trackId = null;
  var title = "";
  var artist = "";
  var playing = false;
  var currentTime = 0;
  var duration = 0;
  var volume = 1;
  var error = "";
  var seeking = false;
  var ignoreMediaPause = false;
  var cueToken = 0;
  var cues = [];
  var paintedCueKey = "";
  var barUnsubscribe = null;
  var waveform = null;
  var titleNode = null;
  var artistNode = null;
  var statusNode = null;
  var toggleNode = null;
  var previousNode = null;
  var nextNode = null;
  var seekNode = null;
  var cueLayer = null;
  var elapsedNode = null;
  var totalNode = null;
  var elapsedLabelNode = null;
  var totalLabelNode = null;
  var volumeTextNode = null;
  function formatPlayerTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const total = Math.floor(seconds);
    const secs = total % 60;
    const minutes = Math.floor(total / 60);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${minutes}:${String(secs).padStart(2, "0")}`;
  }
  function markersFromCues(rows2) {
    if (!rows2 || rows2.length === 0) return [];
    const found = [];
    for (const cue of rows2) {
      const start = Number(cue.start_ms);
      if (!Number.isFinite(start) || start < 0) continue;
      const index = Number(cue.index);
      const named = typeof cue.name === "string" ? cue.name.trim() : "";
      const fallback = Number.isInteger(index) ? index + 1 : found.length + 1;
      const stored = typeof cue.color === "string" ? cue.color : "";
      const color = slotColor(Number.isInteger(index) ? index : -1, stored);
      found.push({
        seconds: start / 1e3,
        color,
        label: named || `${playerStrings.cue} ${fallback}`
      });
    }
    return found;
  }
  function playbackErrorText(status) {
    if (status === 403 || status === 404) return playerStrings.notInLibrary;
    return playerStrings.cannotPlay;
  }
  function play(nextId) {
    if (!Number.isInteger(nextId) || nextId < 0) return;
    const element = ensureMedia();
    ignoreMediaPause = true;
    try {
      if (trackId !== nextId || element.src === "") {
        const row = state.byId.get(nextId);
        title = row?.name || row?.title || playerStrings.untitled;
        artist = row?.artist ?? "";
        trackId = nextId;
        currentTime = 0;
        duration = 0;
        element.src = trackUrl(nextId);
        element.currentTime = 0;
        waveform?.setTrack(nextId);
        loadCues(nextId);
      }
      error = "";
      playing = true;
      emit();
      const pending = element.play();
      if (pending && typeof pending.then === "function") {
        pending.catch(() => {
          if (trackId !== nextId) return;
          noteFailure(nextId);
        });
      }
    } finally {
      ignoreMediaPause = false;
    }
  }
  function playOrToggle(nextId) {
    if (trackId === nextId && playing) pause();
    else play(nextId);
  }
  function pause() {
    if (trackId === null) return;
    playing = false;
    ensureMedia().pause();
    emit();
  }
  function togglePlayPause() {
    if (trackId === null) {
      const selected = selectedPlayableId();
      if (selected !== null) play(selected);
      return;
    }
    if (playing) pause();
    else play(trackId);
  }
  function next() {
    moveBy(1);
  }
  function previous() {
    moveBy(-1);
  }
  function seek(seconds) {
    if (!Number.isFinite(seconds) || trackId === null) return;
    const element = ensureMedia();
    let next2 = seconds < 0 ? 0 : seconds;
    const limit = element.duration;
    if (Number.isFinite(limit) && limit > 0 && next2 > limit) next2 = limit;
    element.currentTime = next2;
    currentTime = next2;
    emit();
  }
  function seekBy(deltaSeconds) {
    if (!Number.isFinite(deltaSeconds)) return;
    seek(currentTime + deltaSeconds);
  }
  var playerControls = {
    togglePlayPause,
    seekBy
  };
  function getPlayerState() {
    return { trackId, title, artist, playing, currentTime, duration, volume, error };
  }
  function subscribe(listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
  function mountPlayer(host) {
    barUnsubscribe?.();
    barUnsubscribe = null;
    waveform?.destroy();
    waveform = null;
    resetPlayback();
    const root = host === void 0 ? document.getElementById("player-bar") : host;
    if (!root) return;
    root.classList.add("player-bar");
    root.setAttribute("role", "region");
    root.setAttribute("aria-label", playerStrings.region);
    const element = ensureMedia();
    root.replaceChildren();
    if (element instanceof Node) root.append(element);
    root.append(buildBar());
    barUnsubscribe = subscribe(() => paintBar());
    paintBar();
  }
  function repaintPlayer() {
    const root = document.getElementById("player-bar");
    if (root) root.setAttribute("aria-label", playerStrings.region);
    waveform?.relabel();
    paintBar();
  }
  function resetPlayback() {
    cueToken += 1;
    trackId = null;
    title = "";
    artist = "";
    playing = false;
    currentTime = 0;
    duration = 0;
    error = "";
    seeking = false;
    cues = [];
    paintedCueKey = "";
  }
  function ensureMedia() {
    if (media) return media;
    const audio = document.createElement("audio");
    audio.id = "player-audio";
    audio.preload = "none";
    audio.className = "player-audio";
    audio.volume = volume;
    media = audio;
    wire(audio);
    return audio;
  }
  function wire(element) {
    if (wired.has(element)) return;
    wired.add(element);
    element.addEventListener("play", () => {
      playing = true;
      emit();
    });
    element.addEventListener("pause", () => {
      if (ignoreMediaPause) return;
      playing = false;
      emit();
    });
    element.addEventListener("ended", () => {
      currentTime = Number.isFinite(element.currentTime) ? element.currentTime : currentTime;
      if (!moveBy(1)) {
        playing = false;
        emit();
      }
    });
    element.addEventListener("timeupdate", () => {
      currentTime = element.currentTime;
      if (Number.isFinite(element.duration)) duration = element.duration;
      emit();
    });
    element.addEventListener("durationchange", () => {
      duration = Number.isFinite(element.duration) ? element.duration : 0;
      emit();
    });
    element.addEventListener("error", () => {
      if (trackId === null) return;
      noteFailure(trackId);
    });
  }
  function trackUrl(nextId) {
    const params = new URLSearchParams({ id: String(nextId), space: state.space });
    return `/api/audio?${params.toString()}`;
  }
  function selectedPlayableId() {
    if (state.mode === "history") return null;
    const selected = state.selectedId;
    if (selected === null) return null;
    const row = state.byId.get(selected);
    if (!row || row.entry) return null;
    return row.id;
  }
  function playableRows() {
    let source = state.view;
    if (trackId !== null && state.splitCrates && state.viewB.some((row) => row.id === trackId && !row.entry)) {
      source = state.viewB;
    } else if (state.splitCrates && state.focusedPane === "b") {
      source = state.viewB;
    }
    return source.filter((row) => !row.entry && Number.isInteger(row.id) && row.id >= 0);
  }
  function anchorIndex(rows2) {
    if (trackId !== null) {
      const playingIndex = rows2.findIndex((row) => row.id === trackId);
      if (playingIndex >= 0) return playingIndex;
    }
    if (state.selectedId === null) return -1;
    return rows2.findIndex((row) => row.id === state.selectedId);
  }
  function moveBy(delta) {
    const rows2 = playableRows();
    if (rows2.length === 0) return false;
    const index = anchorIndex(rows2);
    const target = index < 0 ? rows2[delta > 0 ? 0 : rows2.length - 1] : rows2[index + delta];
    if (!target) return false;
    play(target.id);
    return true;
  }
  function loadCues(id) {
    const token3 = ++cueToken;
    cues = [];
    waveform?.setMarkers(id, { cues: [], loops: [], beatgrid: [] });
    void readCues(id).then(
      (found) => {
        if (token3 !== cueToken || trackId !== id) return;
        cues = found.cues;
        waveform?.setMarkers(id, found);
        emit();
      },
      () => {
        if (token3 !== cueToken || trackId !== id) return;
        cues = [];
        waveform?.setMarkers(id, { cues: [], loops: [], beatgrid: [] });
        emit();
      }
    );
  }
  async function readCues(id) {
    const empty = { cues: [], loops: [], beatgrid: [] };
    if (typeof fetch !== "function") return empty;
    const params = new URLSearchParams({ id: String(id), space: state.space });
    const response = await fetch(`/api/track?${params.toString()}`);
    if (!response.ok) return empty;
    const payload = await response.json();
    if (!payload || typeof payload !== "object") return empty;
    const record = payload;
    return {
      cues: markersFromCues(record.cues),
      loops: loopsFromMarkers(record.loops),
      beatgrid: beatgridFromMarkers(record.beatgrid)
    };
  }
  function noteFailure(forId) {
    playing = false;
    void classifyStatus(forId).then((message) => {
      if (trackId !== forId) return;
      playing = false;
      error = message;
      emit();
    });
  }
  async function classifyStatus(forId) {
    try {
      if (typeof fetch !== "function") return playerStrings.cannotPlay;
      const response = await fetch(trackUrl(forId), { method: "HEAD" });
      return playbackErrorText(response.status);
    } catch {
      return playerStrings.cannotPlay;
    }
  }
  function emit() {
    const snapshot = getPlayerState();
    for (const listener of [...listeners]) listener(snapshot);
    waveform?.sync();
  }
  function buildBar() {
    const meta = document.createElement("div");
    meta.className = "player-meta";
    titleNode = document.createElement("p");
    titleNode.className = "player-title";
    artistNode = document.createElement("p");
    artistNode.className = "player-artist";
    statusNode = document.createElement("p");
    statusNode.className = "player-status";
    statusNode.setAttribute("role", "status");
    meta.append(titleNode, artistNode, statusNode);
    previousNode = buttonEl(tips.previous);
    previousNode.className = "player-toggle";
    previousNode.textContent = playerStrings.previous;
    previousNode.addEventListener("click", () => previous());
    toggleNode = buttonEl(playTip(playerStrings.play, ""));
    toggleNode.className = "player-toggle player-play";
    toggleNode.addEventListener("click", () => togglePlayPause());
    nextNode = buttonEl(tips.next);
    nextNode.className = "player-toggle";
    nextNode.textContent = playerStrings.next;
    nextNode.addEventListener("click", () => next());
    const transport = document.createElement("div");
    transport.className = "player-transport";
    transport.append(previousNode, toggleNode, nextNode);
    const seekWrap = document.createElement("div");
    seekWrap.className = "player-seek";
    const elapsedWrap = document.createElement("span");
    elapsedWrap.className = "player-time";
    elapsedLabelNode = document.createElement("span");
    elapsedLabelNode.className = "visually-hidden";
    elapsedLabelNode.textContent = playerStrings.elapsed;
    const elapsedLabel = elapsedLabelNode;
    elapsedNode = document.createElement("span");
    elapsedWrap.append(elapsedLabel, elapsedNode);
    const track = document.createElement("div");
    track.className = "player-seek-track";
    seekNode = inputEl(tips.seek);
    seekNode.type = "range";
    seekNode.className = "player-range";
    seekNode.min = "0";
    seekNode.max = "0";
    seekNode.step = "0.1";
    seekNode.value = "0";
    seekNode.setAttribute("aria-label", playerStrings.seek);
    seekNode.addEventListener("pointerdown", () => {
      seeking = true;
    });
    const release = () => {
      seeking = false;
    };
    seekNode.addEventListener("pointerup", release);
    seekNode.addEventListener("pointercancel", release);
    seekNode.addEventListener("input", () => {
      if (!seekNode) return;
      seek(Number(seekNode.value));
    });
    seekNode.addEventListener("keydown", onSeekKey);
    cueLayer = document.createElement("div");
    cueLayer.className = "player-cues";
    track.append(seekNode, cueLayer);
    const totalWrap = document.createElement("span");
    totalWrap.className = "player-time";
    totalLabelNode = document.createElement("span");
    totalLabelNode.className = "visually-hidden";
    totalLabelNode.textContent = playerStrings.duration;
    const totalLabel = totalLabelNode;
    totalNode = document.createElement("span");
    totalWrap.append(totalLabel, totalNode);
    seekWrap.append(elapsedWrap, track, totalWrap);
    const volumeLabel = document.createElement("label");
    volumeLabel.className = "player-volume";
    volumeTextNode = document.createElement("span");
    volumeTextNode.textContent = playerStrings.volume;
    const volumeText = volumeTextNode;
    const volumeInput = inputEl(tips.volume);
    volumeInput.type = "range";
    volumeInput.min = "0";
    volumeInput.max = "1";
    volumeInput.step = "0.01";
    volumeInput.value = String(volume);
    volumeInput.addEventListener("input", () => {
      const next2 = Number(volumeInput.value);
      if (!Number.isFinite(next2)) return;
      volume = Math.min(1, Math.max(0, next2));
      ensureMedia().volume = volume;
      emit();
    });
    volumeLabel.append(volumeText, volumeInput);
    const bar = document.createElement("div");
    bar.className = "player-controls";
    bar.append(meta, transport, seekWrap, volumeLabel);
    const waveHost = document.createElement("div");
    waveform = mountWaveform(waveHost, {
      seek,
      seekBy,
      getTime: () => {
        const value = ensureMedia().currentTime;
        return Number.isFinite(value) ? value : currentTime;
      },
      getDuration: () => {
        const value = ensureMedia().duration;
        if (Number.isFinite(value) && value > 0) return value;
        return duration;
      },
      getPlaying: () => playing,
      formatTime: formatPlayerTime,
      seekStep: SEEK_STEP_SECONDS,
      seekStepLarge: SEEK_STEP_LARGE_SECONDS
    });
    const stack = document.createElement("div");
    stack.className = "player-stack";
    stack.append(waveHost, bar);
    return stack;
  }
  function onSeekKey(event) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    const forward = event.key === "ArrowRight" || event.key === "ArrowUp";
    const back = event.key === "ArrowLeft" || event.key === "ArrowDown";
    if (!forward && !back) return;
    event.preventDefault();
    event.stopPropagation();
    const step = event.shiftKey ? SEEK_STEP_LARGE_SECONDS : SEEK_STEP_SECONDS;
    seekBy((forward ? 1 : -1) * step);
  }
  function paintBar() {
    if (!titleNode || !artistNode || !statusNode || !toggleNode || !previousNode || !nextNode) return;
    if (!seekNode || !elapsedNode || !totalNode) return;
    const loaded = trackId !== null;
    const shownTitle = loaded ? title || playerStrings.untitled : playerStrings.nothingPlaying;
    titleNode.textContent = shownTitle;
    titleNode.title = shownTitle;
    artistNode.textContent = artist;
    artistNode.hidden = artist === "";
    artistNode.title = artist;
    statusNode.textContent = error;
    statusNode.hidden = error === "";
    statusNode.title = error;
    if (elapsedLabelNode) elapsedLabelNode.textContent = playerStrings.elapsed;
    if (totalLabelNode) totalLabelNode.textContent = playerStrings.duration;
    if (volumeTextNode) volumeTextNode.textContent = playerStrings.volume;
    if (previousNode) previousNode.textContent = playerStrings.previous;
    if (nextNode) nextNode.textContent = playerStrings.next;
    seekNode.setAttribute("aria-label", playerStrings.seek);
    const action = playing ? playerStrings.pause : playerStrings.play;
    const named = loaded ? title || playerStrings.untitled : "";
    toggleNode.textContent = action;
    setTooltip(toggleNode, playTip(action, named));
    toggleNode.disabled = !loaded && selectedPlayableId() === null;
    toggleNode.setAttribute("aria-pressed", String(playing));
    toggleNode.setAttribute("aria-label", named ? `${action} ${named}` : action);
    previousNode.disabled = !canMove(-1);
    nextNode.disabled = !canMove(1);
    previousNode.setAttribute("aria-label", playerStrings.previous);
    nextNode.setAttribute("aria-label", playerStrings.next);
    const limit = Number.isFinite(duration) && duration > 0 ? duration : 0;
    seekNode.max = String(limit);
    seekNode.disabled = !loaded || limit === 0;
    if (!seeking) seekNode.value = String(Math.min(currentTime, limit || currentTime));
    elapsedNode.textContent = formatPlayerTime(currentTime);
    totalNode.textContent = formatPlayerTime(duration);
    paintCues(limit);
  }
  function canMove(delta) {
    const rows2 = playableRows();
    if (rows2.length === 0) return false;
    const index = anchorIndex(rows2);
    if (index < 0) return true;
    return Boolean(rows2[index + delta]);
  }
  function paintCues(limit) {
    if (!cueLayer) return;
    const key = `${limit}|${cues.map((cue) => `${cue.seconds}:${cue.label}:${cue.color}`).join(";")}`;
    if (key === paintedCueKey) return;
    paintedCueKey = key;
    cueLayer.replaceChildren();
    if (!(limit > 0) || cues.length === 0) return;
    for (const cue of cues) {
      const label = `${cue.label}, ${formatPlayerTime(cue.seconds)}`;
      const button2 = buttonEl(cueTip(label));
      button2.className = "player-cue";
      const ratio = Math.min(1, Math.max(0, cue.seconds / limit));
      const percent = Math.round(ratio * 1e3) / 10;
      button2.style.left = `${percent}%`;
      if (cue.color) button2.style.setProperty("--cue", cue.color);
      button2.setAttribute("aria-label", label);
      button2.addEventListener("click", () => {
        seek(cue.seconds);
      });
      cueLayer.append(button2);
    }
  }

  // src/virtual-scroll.ts
  var spacer = document.createElement("div");
  var rows = document.createElement("div");
  spacer.className = "spacer";
  rows.className = "rows";
  spacer.append(rows);
  var spacerB = document.createElement("div");
  var rowsB = document.createElement("div");
  spacerB.className = "spacer";
  rowsB.className = "rows";
  spacerB.append(rowsB);
  function mountTrackList() {
    el("list").append(spacer);
  }
  function mountTrackListB() {
    el("list-b").append(spacerB);
  }
  function paintRows() {
    paintPane(el("list"), spacer, rows, state.view || []);
    if (state.splitCrates && state.mode === "crates") {
      paintPane(el("list-b"), spacerB, rowsB, state.viewB || []);
    }
  }
  function paintPane(list, paneSpacer, paneRows, view) {
    const height = list.clientHeight || 600;
    const start = Math.max(0, Math.floor(list.scrollTop / ROW) - 6);
    const end = Math.min(view.length, Math.ceil((list.scrollTop + height) / ROW) + 6);
    paneSpacer.style.height = `${view.length * ROW}px`;
    paneRows.style.transform = `translateY(${start * ROW}px)`;
    paneRows.replaceChildren();
    if (!view.length) {
      const empty = document.createElement("p");
      empty.className = "empty-list";
      empty.textContent = state.mode === "duplicates" && !state.duplicateIds ? t("list.readingDuplicates") : t("list.noMatches");
      paneRows.append(empty);
      return;
    }
    for (let index = start; index < end; index += 1) {
      const track = view[index];
      const button2 = document.createElement("div");
      button2.className = "row";
      button2.setAttribute("role", "option");
      button2.setAttribute("aria-selected", String(track.id === state.selectedId));
      button2.dataset.id = String(track.id);
      setTooltip(button2, selectRow(track.name || "Untitled"));
      const titleCell = document.createElement("span");
      titleCell.className = "cell";
      const line = document.createElement("span");
      line.className = "title-line";
      if (!track.entry) {
        const playingNow = getPlayerState();
        const playingThis = playingNow.trackId === track.id && playingNow.playing;
        const playButton = buttonEl(playRow(track.name || playerStrings.untitled));
        playButton.className = "row-play";
        const labelName = track.name || playerStrings.untitled;
        const action = playingThis ? playerStrings.pause : playerStrings.play;
        playButton.setAttribute("aria-label", `${action} ${labelName}`);
        playButton.setAttribute("aria-pressed", String(playingThis));
        const icon = document.createElement("span");
        icon.className = "row-play-icon";
        icon.setAttribute("aria-hidden", "true");
        playButton.append(icon);
        playButton.addEventListener("click", (event) => {
          event.stopPropagation();
          bridge.selectTrack(track.id);
          playOrToggle(track.id);
          list.focus({ preventScroll: true });
        });
        playButton.addEventListener("dblclick", (event) => event.stopPropagation());
        line.append(playButton);
      }
      const hex = colorHex(track.color);
      if (hex) {
        const swatch = document.createElement("span");
        swatch.className = "swatch";
        swatch.style.background = hex;
        line.append(swatch);
      }
      if (track.emoji) {
        const emoji = document.createElement("span");
        emoji.textContent = track.emoji;
        line.append(emoji);
      }
      const title2 = document.createElement("span");
      title2.className = "title";
      title2.textContent = track.name || t("track.untitled");
      line.append(title2);
      if (track.offline) {
        const offline = document.createElement("span");
        offline.className = "offline-word";
        offline.textContent = t("track.offlineBadge");
        line.append(offline);
      } else if (track.missing) {
        const missing = document.createElement("span");
        missing.className = "missing-word";
        missing.textContent = t("track.missingBadge");
        line.append(missing);
      }
      if (track.stems) {
        const stems = document.createElement("span");
        stems.className = "missing-word";
        stems.textContent = t("track.stemsBadge");
        line.append(stems);
      }
      titleCell.append(line);
      const artist2 = document.createElement("span");
      artist2.className = "cell";
      artist2.textContent = track.artist ?? "";
      const cells = [];
      const add = (text2, numeric = false) => {
        const cell = document.createElement("span");
        cell.className = numeric ? "cell num" : "cell";
        cell.textContent = text2;
        cells.push(cell);
      };
      if (track.entry) {
        add(track.deck || "");
        add(track.played || "");
        add(clockLabel(track.start), true);
      } else {
        add(
          track.bpm == null ? "" : formatNumber(Math.round(Number(track.bpm) * 100) / 100, { maximumFractionDigits: 2 }),
          true
        );
        add(track.key ?? "");
        add(energyLabel(track.rating), true);
        add(track.genre ?? "");
        add(dateLabel(track.time_added), true);
        add(dateLabel(track.last_played), true);
        add(track.play_count == null ? "" : formatNumber(Number(track.play_count)), true);
        add(lengthLabel(track.length_ms), true);
      }
      button2.append(titleCell, artist2, ...cells);
      button2.addEventListener("click", () => {
        if (track.entry) bridge.selectEntry(track.id);
        else bridge.selectTrack(track.id);
        list.focus({ preventScroll: true });
      });
      button2.addEventListener("dblclick", () => {
        if (!track.entry) play(track.id);
      });
      paneRows.append(button2);
    }
  }
  function moveTrackList(delta) {
    const list = focusedList();
    moveSelection(delta, viewForList(list), list);
  }
  function openTrackList() {
    const view = viewForList(focusedList());
    const current2 = view.find((track) => track.id === state.selectedId) ?? view[0];
    if (!current2) return;
    if (current2.entry) bridge.selectEntry(current2.id);
    else void bridge.selectTrack(current2.id);
  }
  function focusedList() {
    if (state.splitCrates && state.focusedPane === "b") return el("list-b");
    return el("list");
  }
  function viewForList(list) {
    if (list.id === "list-b") return state.viewB || [];
    return state.view || [];
  }
  function moveSelection(delta, view, list) {
    const index = view.findIndex((track) => track.id === state.selectedId);
    const next2 = view[Math.max(0, Math.min(view.length - 1, index + delta))];
    if (!next2) return;
    if (next2.entry) bridge.selectEntry(next2.id);
    else bridge.selectTrack(next2.id);
    const rowTop = view.indexOf(next2) * ROW;
    if (rowTop < list.scrollTop) list.scrollTop = rowTop;
    if (rowTop + ROW > list.scrollTop + list.clientHeight) {
      list.scrollTop = rowTop + ROW - list.clientHeight;
    }
  }
  function focusedTrack(target, view) {
    if (!(target instanceof Element)) return void 0;
    const row = target.closest(".row");
    if (!row) return void 0;
    const id = Number(row.getAttribute("data-id"));
    if (!Number.isInteger(id)) return void 0;
    return view.find((item5) => item5.id === id);
  }
  function wireListKeys(list) {
    list.addEventListener("scroll", () => paintRows());
    list.addEventListener("keydown", (event) => {
      const view = viewForList(list);
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveSelection(1, view, list);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        moveSelection(-1, view, list);
      } else if (event.key === "Enter") {
        const chosen = focusedTrack(event.target, view) ?? view.find((item5) => item5.id === state.selectedId);
        if (!chosen || chosen.entry) return;
        event.preventDefault();
        void bridge.selectTrack(chosen.id);
        play(chosen.id);
      }
    });
  }
  function wireVirtualScroll() {
    wireListKeys(el("list"));
    wireListKeys(el("list-b"));
    let paintedId = null;
    let paintedPlaying = false;
    subscribe((next2) => {
      if (next2.trackId === paintedId && next2.playing === paintedPlaying) return;
      paintedId = next2.trackId;
      paintedPlaying = next2.playing;
      paintRows();
    });
  }

  // src/views.ts
  var relatedRequest = 0;
  var lastDetail = null;
  var detailPlayWired = false;
  function listMatches(track, query) {
    const field = isTextSearchField(state.searchField) ? state.searchField : void 0;
    return matchesQuery(track, query, field);
  }
  function queryTerms() {
    return parseQuery(state.query);
  }
  function childLists() {
    const children = /* @__PURE__ */ new Map();
    for (const crate of state.crates) {
      const key = crate.parent ?? 0;
      if (!children.has(key)) children.set(key, []);
      const bucket = children.get(key);
      bucket.push(crate);
    }
    for (const list of children.values()) {
      list.sort((a, b) => {
        if (state.crateSort === "name") {
          return a.name.localeCompare(b.name, void 0, { sensitivity: "base" }) || a.id - b.id;
        }
        if (state.crateSort === "added") return (b.added || 0) - (a.added || 0) || a.id - b.id;
        return a.order - b.order || a.id - b.id;
      });
    }
    return children;
  }
  function crateKeep() {
    const terms = state.crateQuery.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return null;
    const byId = new Map(state.crates.map((crate) => [crate.id, crate]));
    const keep = /* @__PURE__ */ new Set();
    for (const crate of state.crates) {
      if (!terms.every((term) => crate.name.toLocaleLowerCase().includes(term))) continue;
      let current2 = crate;
      const guard = /* @__PURE__ */ new Set();
      while (current2 && !guard.has(current2.id)) {
        guard.add(current2.id);
        keep.add(current2.id);
        current2 = byId.get(current2.parent);
      }
    }
    return keep;
  }
  function visibleCrates() {
    const children = childLists();
    const keep = crateKeep();
    const ordered = [];
    const seen = /* @__PURE__ */ new Set();
    function walk(parent, depth) {
      for (const crate of children.get(parent) || []) {
        if (seen.has(crate.id)) continue;
        if (keep && !keep.has(crate.id)) continue;
        seen.add(crate.id);
        crate.depth = depth;
        crate.childCount = (children.get(crate.id) || []).filter((child) => !keep || keep.has(child.id)).length;
        ordered.push(crate);
        if (keep || state.expanded.has(crate.id)) walk(crate.id, depth + 1);
      }
    }
    walk(state.rootId ?? null, 0);
    for (const crate of state.crates) {
      if (seen.has(crate.id)) continue;
      if (keep && !keep.has(crate.id)) continue;
      const parentListed = state.crates.some((item5) => item5.id === crate.parent);
      if (parentListed) continue;
      seen.add(crate.id);
      crate.depth = 0;
      crate.childCount = (children.get(crate.id) || []).filter((child) => !keep || keep.has(child.id)).length;
      ordered.push(crate);
      if (keep || state.expanded.has(crate.id)) walk(crate.id, 1);
    }
    return ordered;
  }
  function expandAncestors(id) {
    const byId = new Map(state.crates.map((crate2) => [crate2.id, crate2]));
    let crate = id === "all" ? void 0 : byId.get(id);
    const guard = /* @__PURE__ */ new Set();
    while (crate && !guard.has(crate.id)) {
      guard.add(crate.id);
      const parent = byId.get(crate.parent);
      if (!parent) break;
      state.expanded.add(parent.id);
      crate = parent;
    }
  }
  function hiddenSelectionHolder(visible) {
    if (state.activeCrate === "all") return null;
    if (visible.some((crate2) => crate2.id === state.activeCrate)) return null;
    const byId = new Map(state.crates.map((crate2) => [crate2.id, crate2]));
    const visibleIds = new Set(visible.map((crate2) => crate2.id));
    let crate = byId.get(state.activeCrate);
    const guard = /* @__PURE__ */ new Set();
    while (crate && !guard.has(crate.id)) {
      guard.add(crate.id);
      crate = byId.get(crate.parent);
      if (crate && visibleIds.has(crate.id)) return crate.id;
    }
    return null;
  }
  function tracksForCrate(crate) {
    if (crate === "all") return state.tracks;
    const ids = state.crateTracks.get(crate);
    return ids ? state.tracks.filter((track) => ids.has(track.id)) : [];
  }
  function modeTracks() {
    let tracks = state.tracks;
    if (state.mode === "missing") tracks = tracks.filter((track) => track.missing);
    else if (state.mode === "stems") tracks = tracks.filter((track) => track.stems);
    else if (state.mode === "duplicates") {
      const ids = state.duplicateIds;
      tracks = ids ? tracks.filter((track) => ids.has(track.id)) : [];
    } else if (state.mode === "crates" && state.activeCrate !== "all") {
      tracks = tracksForCrate(state.activeCrate);
    }
    return tracks;
  }
  function buildView() {
    if (state.mode === "history") {
      const terms2 = queryTerms();
      const result2 = state.entries.filter((entry) => listMatches(entry, terms2)).map((entry) => ({
        id: entry.id,
        name: entry.name,
        artist: entry.artist,
        album: entry.album,
        file: entry.file,
        genre: "",
        key: entry.key,
        bpm: entry.bpm,
        length_ms: entry.length_ms,
        deck: entry.deck,
        played: entry.played ? t("common.yes") : "",
        start: entry.start_time,
        missing: entry.missing,
        entry: true,
        asset_id: entry.asset_id,
        notes: entry.notes
      }));
      result2.sort(compare);
      state.view = result2;
      return result2;
    }
    const terms = queryTerms();
    const result = modeTracks().filter((track) => listMatches(track, terms));
    result.sort(compare);
    state.view = result;
    if (state.mode === "crates" && state.splitCrates) {
      const viewB = tracksForCrate(state.secondCrate).filter((track) => listMatches(track, terms));
      viewB.sort(compare);
      state.viewB = viewB;
    } else {
      state.viewB = [];
    }
    return result;
  }
  function crateRow(crate) {
    const row = document.createElement("div");
    row.className = "crate-row";
    if (crate.holds) row.classList.add("holds-selection");
    row.style.paddingLeft = `${crate.depth * 14}px`;
    if (crate.childCount) {
      const open = state.crateQuery ? true : state.expanded.has(crate.id);
      const twist = buttonEl(open ? collapseCrate(crate.name) : expandCrate(crate.name));
      twist.className = "twist";
      twist.tabIndex = -1;
      twist.setAttribute("aria-expanded", String(open));
      twist.setAttribute("aria-label", t(open ? "crates.collapse" : "crates.expand", { name: crate.name }));
      twist.addEventListener("click", () => toggleCrate(crate.id));
      row.append(twist);
    } else {
      const gap = document.createElement("span");
      gap.className = "twist-gap";
      gap.setAttribute("aria-hidden", "true");
      row.append(gap);
    }
    const button2 = buttonEl(crate.id === "all" ? tips.allTracks : openCrate(crate.name));
    button2.className = "crate";
    button2.dataset.id = String(crate.id);
    if (crate.parent != null) button2.dataset.parent = String(crate.parent);
    button2.setAttribute("role", "treeitem");
    button2.setAttribute("aria-level", String(crate.depth + 1));
    const split = state.splitCrates && state.mode === "crates";
    const panes = paneCrates(state.activeCrate, state.secondCrate, split);
    button2.setAttribute("aria-selected", String(crate.id === panes.a || crate.id === panes.b));
    if (crate.childCount) {
      button2.setAttribute("aria-expanded", String(state.crateQuery ? true : state.expanded.has(crate.id)));
    }
    const name = document.createElement("span");
    name.className = "name";
    const hex = colorHex(crate.color);
    if (hex) {
      const swatch = document.createElement("span");
      swatch.className = "swatch";
      swatch.style.background = hex;
      name.append(swatch);
    }
    name.append(document.createTextNode(crate.name));
    button2.append(name);
    if (crate.smart) {
      const smart = document.createElement("span");
      smart.className = "smart";
      smart.textContent = t("crates.smartBadge");
      button2.append(smart);
    }
    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = formatNumber(crate.count);
    button2.append(meta);
    button2.addEventListener("click", (event) => selectCrate(crate.id, event));
    row.append(button2);
    return row;
  }
  function placeCrateFocus(previousId) {
    const items = [...el("crate-list").querySelectorAll(".crate")];
    if (!items.length) return null;
    const current2 = items.find((item5) => item5.dataset.id === previousId) || items[0];
    for (const item5 of items) item5.tabIndex = item5 === current2 ? 0 : -1;
    return current2;
  }
  function renderCrates() {
    const scroll = el("crate-list").scrollTop;
    const active2 = document.activeElement;
    const restore = el("crate-list").contains(active2) ? active2.closest(".crate-row")?.querySelector(".crate")?.dataset.id ?? null : null;
    const query = queryTerms();
    const matched = query.terms.length || query.filters.length ? new Set(state.tracks.filter((track) => listMatches(track, query)).map((track) => track.id)) : null;
    const crates = visibleCrates();
    const holder = hiddenSelectionHolder(crates);
    el("crate-list").replaceChildren();
    el("crate-list").append(crateRow({
      id: "all",
      name: t("crates.allTracks"),
      depth: 0,
      childCount: 0,
      smart: false,
      count: matched ? matched.size : state.tracks.length
    }));
    for (const crate of crates) {
      const members = state.crateTracks.get(crate.id) || /* @__PURE__ */ new Set();
      let shown = members.size;
      if (matched) {
        shown = 0;
        for (const id of members) if (matched.has(id)) shown += 1;
      }
      el("crate-list").append(crateRow({
        id: crate.id,
        name: crate.name,
        depth: crate.depth || 0,
        childCount: crate.childCount || 0,
        smart: Boolean(crate.smart),
        parent: crate.parent ?? null,
        color: crate.color ?? null,
        count: shown,
        holds: holder === crate.id
      }));
    }
    const focused = placeCrateFocus(restore);
    if (restore && focused) focused.focus({ preventScroll: true });
    el("crate-list").scrollTop = scroll;
    renderRules();
  }
  function renderRules() {
    document.querySelector(".rules")?.remove();
    document.querySelector(".rule-edit")?.remove();
    const crate = state.crates.find((item5) => item5.id === state.activeCrate);
    if (!crate || !crate.rules || state.mode !== "crates") return;
    const line = document.createElement("p");
    line.className = "rules";
    if (Array.isArray(crate.rules.rules)) {
      const lead = document.createElement("strong");
      lead.textContent = t("rules.matches");
      const parts = crate.rules.rules.map((rule) => {
        const attribute = rule.attribute || "field";
        const operation = String(rule.operation || "").toLowerCase().replaceAll("_", " ");
        return `${attribute} ${operation} “${rule.value ?? ""}”`;
      });
      const join = crate.rules.conjunction === "OR" ? t("rules.or") : t("rules.and");
      line.append(lead, document.createTextNode(` ${parts.join(` ${join} `) || t("rules.none")}`));
    }
    const editor = document.createElement("div");
    editor.className = "rule-edit";
    const area = textareaEl(tips.smartRules);
    area.value = JSON.stringify(crate.rules, null, 2);
    area.disabled = !state.writable;
    area.setAttribute("aria-label", t("rules.label"));
    const save3 = buttonEl(tips.saveRules);
    save3.className = "text-button";
    save3.textContent = t("rules.save");
    save3.disabled = !state.writable;
    save3.addEventListener("click", () => saveRules(crate.id, area.value));
    editor.append(area, save3);
    const bar = document.querySelector(".browser-bar");
    bar.after(editor);
    bar.after(line);
  }
  function markHistoryColumns() {
    const history = state.mode === "history";
    document.querySelector(".columns")?.classList.toggle("for-history", history);
    document.querySelector(".browser")?.classList.toggle("for-history", history);
    el("list").classList.toggle("for-history", history);
  }
  var HISTORY_COLUMNS = [
    ["name", "column.title"],
    ["artist", "column.artist"],
    ["deck", "column.deck"],
    ["played", "column.played"],
    ["start", "column.time"]
  ];
  var TRACK_COLUMNS = [
    ["name", "column.title"],
    ["artist", "column.artist"],
    ["bpm", "column.bpm"],
    ["key", "column.key"],
    ["energy", "column.energy"],
    ["genre", "column.genre"],
    ["time_added", "column.added"],
    ["last_played", "column.lastPlayed"],
    ["play_count", "column.plays"],
    ["length_ms", "column.time"]
  ];
  function renderColumns() {
    markHistoryColumns();
    const columns = state.mode === "history" ? HISTORY_COLUMNS : TRACK_COLUMNS;
    const header = document.querySelector(".columns");
    if (!(header instanceof HTMLElement)) return;
    header.replaceChildren();
    for (const [key, label] of columns) {
      const button2 = buttonEl(sortTip(key, t(label)));
      button2.dataset.sort = key;
      button2.textContent = t(label);
      button2.dataset.active = String(key === state.sort);
      header.append(button2);
    }
  }
  function playlistCrate() {
    if (state.mode !== "crates") return null;
    return state.activeCrate;
  }
  function renderShell() {
    markHistoryColumns();
    const cratesMode = state.mode === "crates";
    const gigMode = state.mode === "gig";
    const portableMode = state.mode === "portable";
    const driftMode = state.mode === "drift";
    const healthMode = state.mode === "health";
    const statsMode = state.mode === "stats";
    const scanMode = state.mode === "scan";
    const bitrateMode = state.mode === "bitrate";
    const tagsMode = state.mode === "tags";
    const historyMode = state.mode === "history";
    const showCrates2 = cratesMode || gigMode || driftMode || healthMode || scanMode || bitrateMode;
    el("crate-tools").hidden = !showCrates2;
    el("crate-actions").hidden = !cratesMode;
    el("crate-list").hidden = !showCrates2;
    el("export-m3u").hidden = !cratesMode;
    el("export-rekordbox").hidden = !cratesMode;
    el("import-m3u").hidden = !cratesMode;
    el("session-list").hidden = !historyMode;
    el("mode-note").hidden = cratesMode || historyMode;
    const filesMode = state.mode === "files";
    const snapshotsMode = state.mode === "snapshots";
    const panelMode = filesMode || snapshotsMode || gigMode || portableMode || driftMode || healthMode || statsMode || scanMode || bitrateMode || tagsMode;
    el("browser").hidden = panelMode;
    el("track-splitter").hidden = panelMode;
    el("detail").hidden = panelMode;
    el("files-panel").hidden = !filesMode;
    el("snapshots-panel").hidden = !snapshotsMode;
    el("gig-panel").hidden = !gigMode;
    el("portable-panel").hidden = !portableMode;
    el("drift-panel").hidden = !driftMode;
    el("health-panel").hidden = !healthMode;
    el("stats-panel").hidden = !statsMode;
    el("scan-panel").hidden = !scanMode;
    el("bitrate-panel").hidden = !bitrateMode;
    el("tags-panel").hidden = !tagsMode;
    if (state.mode === "missing") {
      const offlineCount = state.tracks.filter((track) => track.offline).length;
      el("mode-note").textContent = offlineCount ? t("mode.missingOffline", { count: offlineCount }) : t("mode.missing");
    }
    if (state.mode === "duplicates") {
      el("mode-note").textContent = t("mode.duplicates");
    }
    if (state.mode === "stems") el("mode-note").textContent = t("mode.stems");
    if (filesMode) el("mode-note").textContent = t("mode.files");
    if (gigMode) {
      el("mode-note").textContent = t("mode.gig");
      document.querySelector(".rules")?.remove();
    }
    if (portableMode) {
      el("mode-note").textContent = t("mode.portable");
      document.querySelector(".rules")?.remove();
    }
    if (driftMode) {
      el("mode-note").textContent = t("mode.drift");
      document.querySelector(".rules")?.remove();
    }
    if (healthMode) {
      el("mode-note").textContent = t("mode.health");
      document.querySelector(".rules")?.remove();
    }
    if (statsMode) {
      el("mode-note").textContent = t("mode.stats");
      document.querySelector(".rules")?.remove();
    }
    if (scanMode) {
      el("mode-note").textContent = t("mode.scan");
      document.querySelector(".rules")?.remove();
    }
    if (bitrateMode) {
      el("mode-note").textContent = t("mode.bitrate");
      document.querySelector(".rules")?.remove();
    }
    if (tagsMode) {
      el("mode-note").textContent = t("mode.tags");
      document.querySelector(".rules")?.remove();
    }
    if (snapshotsMode) {
      el("mode-note").textContent = t("mode.snapshots");
    }
    for (const button2 of document.querySelectorAll("#views button")) {
      button2.setAttribute("aria-selected", String(button2.dataset.view === state.mode));
    }
    for (const button2 of document.querySelectorAll("[data-crate-sort]")) {
      button2.setAttribute("aria-pressed", String(button2.dataset.crateSort === state.crateSort));
    }
    const crateChosen = state.activeCrate !== "all";
    el("crate-new").disabled = !state.writable;
    el("crate-rename").disabled = !state.writable || !crateChosen;
    el("crate-color").disabled = !state.writable || !crateChosen;
    el("crate-delete").disabled = !state.writable || !crateChosen;
    syncPresetButtons();
    syncFolderSyncButton();
    syncMergeButton();
    syncRelinkButton();
    if (portableMode) {
      el("crate-foot").textContent = "";
      return;
    }
    if (filesMode) {
      if (state.filesAtRoots) {
        el("crate-foot").textContent = state.filesLoading ? t("files.readingRoots") : t("files.rootCount", { count: state.filesRoots.length });
        return;
      }
      const listed = state.filesEntries.filter((entry) => entry.kind === "file").length;
      el("crate-foot").textContent = state.filesLoading ? t("files.readingFolder") : t("files.fileCount", { count: listed });
      return;
    }
    if (gigMode || healthMode || scanMode || bitrateMode) {
      const crate = state.crates.find((item5) => item5.id === state.activeCrate);
      el("crate-foot").textContent = state.activeCrate === "all" ? t("crates.allTracks") : crate?.name ?? t("crates.selectedCrate");
      return;
    }
    if (tagsMode || statsMode) {
      el("crate-foot").textContent = t("gig.wholeSpace");
      return;
    }
    if (snapshotsMode) {
      el("crate-foot").textContent = state.snapshotLoading ? t("snapshots.reading") : t("snapshots.count", { count: state.snapshots.length });
      return;
    }
    const pool = state.mode === "history" ? state.entries : footerTracks();
    const bytes = pool.reduce((sum, track) => sum + (Number(track.file_size) || 0), 0);
    const ms = pool.reduce((sum, track) => sum + (Number(track.length_ms) || 0), 0);
    const preset = state.mode === "crates" ? presetFoot(state.activeCrate) : "";
    el("crate-foot").textContent = `${formatNumber(pool.length)} · ${durationLabel(ms)} · ${sizeLabel(bytes)}${preset}`;
  }
  function footerTracks() {
    if (state.mode === "crates" && state.activeCrate !== "all") {
      const ids = state.crateTracks.get(state.activeCrate);
      return ids ? state.tracks.filter((track) => ids.has(track.id)) : [];
    }
    if (state.mode === "missing") return state.tracks.filter((track) => track.missing);
    if (state.mode === "stems") return state.tracks.filter((track) => track.stems);
    if (state.mode === "duplicates") {
      const duplicateIds = state.duplicateIds;
      return duplicateIds ? state.tracks.filter((track) => duplicateIds.has(track.id)) : [];
    }
    return state.tracks;
  }
  function renderList() {
    renderShell();
    if (state.mode === "files") {
      renderFiles();
      paintDualChrome();
      return;
    }
    if (state.mode === "gig") {
      renderCrates();
      paintDualChrome();
      return;
    }
    if (state.mode === "portable") {
      paintDualChrome();
      return;
    }
    if (state.mode === "health") {
      renderCrates();
      paintDualChrome();
      return;
    }
    if (state.mode === "scan") {
      renderCrates();
      paintDualChrome();
      return;
    }
    if (state.mode === "bitrate") {
      renderCrates();
      paintDualChrome();
      return;
    }
    if (state.mode === "tags") {
      paintDualChrome();
      return;
    }
    renderColumns();
    const view = buildView();
    if (state.mode === "crates" && state.splitCrates) {
      el("count").textContent = t("count.split", {
        a: t("count.tracks", { count: view.length }),
        b: t("count.tracks", { count: state.viewB.length })
      });
    } else {
      el("count").textContent = t(state.mode === "history" ? "count.plays" : "count.tracks", { count: view.length });
    }
    if (state.mode === "crates") renderCrates();
    else document.querySelector(".rules")?.remove();
    paintDualChrome();
    paintRows();
    if (!view.some((track) => track.id === state.selectedId)) {
      if (!view.length) {
        state.selectedId = null;
        const empty = document.createElement("p");
        empty.className = "detail-empty";
        empty.textContent = state.mode === "history" && !state.historyId ? t("history.chooseSession") : t("list.noMatches");
        el("detail").replaceChildren(empty);
      } else if (state.mode === "history") selectEntry(view[0].id);
      else selectTrack(view[0].id);
    }
  }
  function toggleCrate(id) {
    if (state.crateQuery) return;
    if (state.expanded.has(id)) state.expanded.delete(id);
    else state.expanded.add(id);
    renderCrates();
    if (!state.writable) return;
    postJSON("/api/crate", {
      action: "expanded",
      id,
      expanded: state.expanded.has(id),
      space: state.space
    }).then((result) => {
      if (result.warning) setNotice(result.warning);
    }).catch((error2) => {
      if (failureOf(error2).status === 409) lockDown(error2);
      else setNotice(failureOf(error2).message);
    });
  }
  function selectCrate(id, event) {
    const alt = Boolean(event?.altKey || event?.shiftKey);
    const pane = clickPane(state.splitCrates && state.mode === "crates", state.focusedPane, alt);
    if (pane === "b") state.secondCrate = id;
    else state.activeCrate = id;
    if (!alt && state.splitCrates && state.mode === "crates") state.focusedPane = pane;
    if (id !== "all") expandAncestors(id);
    const list = pane === "b" ? el("list-b") : el("list");
    list.scrollTop = 0;
    renderList();
    if (state.mode === "gig") loadGigCheck().catch(showGigFailure);
    if (state.mode === "drift") loadDrift().catch(showDriftFailure);
    if (state.mode === "health") loadHealth().catch(showHealthFailure);
    if (state.mode === "scan") loadScan().catch(showScanFailure);
    if (state.mode === "bitrate") loadBitrate().catch(showBitrateFailure);
  }
  function focusCrateItem(item5) {
    if (!item5) return;
    for (const button2 of el("crate-list").querySelectorAll(".crate")) button2.tabIndex = -1;
    item5.tabIndex = 0;
    item5.focus();
  }
  async function selectTrack(id) {
    state.selectedId = id;
    syncMergeButton();
    syncRelinkButton();
    paintRows();
    const token3 = ++state.request;
    const pending = document.createElement("p");
    pending.className = "detail-empty";
    pending.textContent = t("detail.reading");
    el("detail").replaceChildren(pending);
    try {
      const response = await fetch(`/api/track?id=${id}&space=${encodeURIComponent(state.space)}`);
      const payload = await readJSONOr(response, {});
      if (!response.ok) throw new Error(serverMessage(payload, t("detail.readFailed", { status: String(response.status) })));
      if (token3 !== state.request) return;
      if (payload.serato) applyStatus(payload.serato);
      renderDetail(payload);
    } catch (error2) {
      if (token3 !== state.request) return;
      const failure = document.createElement("p");
      failure.className = "detail-error";
      failure.textContent = failureOf(error2).message;
      el("detail").replaceChildren(failure);
    }
  }
  function selectEntry(id) {
    state.selectedId = id;
    paintRows();
    const entry = state.entries.find((item5) => item5.id === id);
    if (!entry) return;
    const body = document.createElement("div");
    body.className = "detail-body";
    const title2 = document.createElement("h2");
    title2.textContent = entry.name || t("track.untitled");
    body.append(title2);
    if (entry.artist) {
      const artist2 = document.createElement("p");
      artist2.className = "artist";
      artist2.textContent = entry.artist;
      body.append(artist2);
    }
    const lines = [
      [t("column.played"), entry.played ? t("common.yes") : t("common.no")],
      [t("column.deck"), entry.deck || "—"],
      [t("history.started"), clockLabel(entry.start_time) || "—"],
      [t("history.file"), entry.file || "—"]
    ];
    if (entry.notes) lines.push([t("history.notes"), entry.notes]);
    for (const [label, value] of lines) {
      const row = document.createElement("div");
      row.className = "field";
      const name = document.createElement("div");
      name.className = "label";
      name.textContent = label;
      const text2 = document.createElement("div");
      text2.className = "value";
      text2.textContent = value;
      row.append(name, text2);
      body.append(row);
    }
    if (entry.asset_id) {
      const open = buttonEl(tips.openInLibrary);
      open.className = "text-button";
      open.textContent = t("history.openInLibrary");
      open.addEventListener("click", () => openInLibrary(entry.asset_id));
      body.append(open);
    }
    el("detail").replaceChildren(body);
  }
  function fieldInput(name, label, value, wide = false) {
    const wrap = document.createElement("label");
    if (wide) wrap.className = "wide";
    wrap.append(document.createTextNode(label));
    const input = name === "comments" ? textareaEl(editField(label)) : inputEl(editField(label));
    input.name = name;
    input.value = String(value ?? "");
    if (name === "bpm") input.inputMode = "decimal";
    wrap.append(input);
    return wrap;
  }
  function paintDetailPlay(button2, track) {
    const snapshot = getPlayerState();
    const playingThis = snapshot.trackId === track.id && snapshot.playing;
    const name = track.title || track.name || playerStrings.untitled;
    const action = playingThis ? playerStrings.pause : playerStrings.play;
    button2.textContent = action;
    button2.setAttribute("aria-label", `${action} ${name}`);
    button2.setAttribute("aria-pressed", String(playingThis));
  }
  function wireDetailPlay() {
    if (detailPlayWired) return;
    detailPlayWired = true;
    subscribe(() => {
      const button2 = document.querySelector(".detail-play");
      if (!button2 || !lastDetail) return;
      paintDetailPlay(button2, lastDetail);
    });
  }
  function renderDetail(track) {
    lastDetail = track;
    const writable = Boolean(track.serato?.writable && state.writable);
    const body = document.createElement("div");
    body.className = "detail-body";
    if (track.album) {
      const kicker2 = document.createElement("p");
      kicker2.className = "detail-kicker";
      kicker2.textContent = track.album;
      body.append(kicker2);
    }
    const title2 = document.createElement("h2");
    title2.textContent = track.title ?? "";
    body.append(title2);
    if (track.artist) {
      const artist2 = document.createElement("p");
      artist2.className = "artist";
      artist2.textContent = track.artist ?? "";
      body.append(artist2);
    }
    const playTitle = track.title || track.name || playerStrings.untitled;
    const playButton = buttonEl(playRow(playTitle));
    playButton.className = "detail-play";
    paintDetailPlay(playButton, track);
    playButton.addEventListener("click", () => {
      playOrToggle(track.id);
    });
    body.append(playButton);
    wireDetailPlay();
    const deck = document.createElement("div");
    deck.className = "deck";
    const facts = [["column.bpm", track.bpm], ["column.key", track.key || "—"], ["column.time", track.length]];
    for (const [key, value] of facts) {
      const label = t(key);
      const cell = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = String(value || "—");
      if (key === "column.bpm") strong.className = "bpm";
      const span = document.createElement("span");
      span.textContent = label;
      cell.append(strong, span);
      deck.append(cell);
    }
    if (track.color) {
      const cell = document.createElement("div");
      const swatch = document.createElement("span");
      swatch.className = "swatch swatch-lg";
      swatch.style.background = String(track.color ?? "");
      const span = document.createElement("span");
      span.textContent = t("field.color");
      cell.append(swatch, span);
      deck.append(cell);
    }
    body.append(deck);
    const note = document.createElement("p");
    note.className = "lock-note";
    note.textContent = track.serato?.message || el("status").textContent;
    body.append(note);
    const form = document.createElement("form");
    form.className = "editor";
    const edit = track.edit || {};
    const editorFields = [
      ["name", "column.title", true],
      ["artist", "column.artist", false],
      ["album", "field.album", false],
      ["genre", "field.genre", false],
      ["year", "field.year", false],
      ["composer", "field.composer", false],
      ["remixer", "field.remixer", false],
      ["label", "field.label", false],
      ["grouping", "field.grouping", false],
      ["key", "column.key", false],
      ["bpm", "column.bpm", false],
      ["emoji", "field.emoji", false],
      ["comments", "field.comments", true]
    ];
    for (const [name, label, wide] of editorFields) {
      form.append(fieldInput(name, t(label), String(edit[name] ?? ""), wide));
    }
    const colorLabel = document.createElement("label");
    colorLabel.append(document.createTextNode(t("field.color")));
    const colorSelect = selectEl(tips.trackColor);
    colorSelect.name = "color";
    const currentColor = Number(edit.color ?? 16777215);
    const palette = COLORS.map(([value, key]) => [value, t(key)]);
    if (!COLORS.some(([value]) => value === currentColor)) palette.push([currentColor, colorHex(currentColor) || t("color.custom")]);
    for (const [value, label] of palette) {
      const option = document.createElement("option");
      option.value = String(value);
      option.textContent = label;
      option.selected = value === currentColor;
      colorSelect.append(option);
    }
    colorLabel.append(colorSelect);
    form.append(colorLabel);
    const ratingLabel = document.createElement("label");
    ratingLabel.append(document.createTextNode(t("field.rating")));
    const ratingSelect = selectEl(tips.trackRating);
    ratingSelect.name = "rating";
    const ratings = [
      ["", t("rating.none")],
      ...[["0.2", 1], ["0.4", 2], ["0.6", 3], ["0.8", 4], ["1", 5]].map(([value, stars]) => [value, t("rating.stars", { count: stars })])
    ];
    if (edit.rating != null && !ratings.some(([value]) => Number(value) === Number(edit.rating))) {
      ratings.push([String(edit.rating), `${edit.rating}`]);
    }
    for (const [value, label] of ratings) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label ?? "";
      option.selected = value === (edit.rating == null ? "" : String(edit.rating));
      ratingSelect.append(option);
    }
    ratingLabel.append(ratingSelect);
    form.append(ratingLabel);
    const lock = document.createElement("label");
    lock.className = "check";
    const lockInput = inputEl(tips.beatgridLock);
    lockInput.type = "checkbox";
    lockInput.name = "is_beatgrid_locked";
    lockInput.checked = Boolean(edit.is_beatgrid_locked);
    lock.append(lockInput, document.createTextNode(t("field.beatgridLocked")));
    form.append(lock);
    const save3 = buttonEl(tips.saveTrack);
    save3.type = "submit";
    save3.className = "text-button wide";
    save3.textContent = t("detail.saveTrack");
    form.append(save3);
    for (const control of form.querySelectorAll("input, select, textarea, button")) control.disabled = !writable;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      saveTrack(track.id, form);
    });
    body.append(form);
    const actions2 = document.createElement("div");
    actions2.className = "actions";
    const reveal = buttonEl(revealTip(track.serato?.file_manager || state.serato?.file_manager || "Finder"));
    const manager = track.serato?.file_manager || state.serato?.file_manager || "Finder";
    reveal.textContent = t("detail.reveal", { manager });
    reveal.disabled = !track.file_on_disk;
    reveal.addEventListener("click", () => revealTrack(track.id));
    const prepare = buttonEl(track.in_prepare ? tips.prepareRemove : tips.prepareAdd);
    prepare.textContent = track.in_prepare ? t("detail.removePrepare") : t("detail.sendPrepare");
    prepare.disabled = !writable;
    prepare.addEventListener("click", () => prepareTrack(track.id, !track.in_prepare));
    const relocate = buttonEl(tips.relocate);
    relocate.textContent = t("detail.relocate");
    relocate.disabled = !writable;
    relocate.addEventListener("click", () => relocateTrack(track));
    const remove = buttonEl(tips.removeTrack);
    remove.textContent = t("detail.removeFromLibrary");
    remove.disabled = !writable;
    remove.addEventListener("click", () => removeTrack(track.id));
    const useInCrates = buttonEl(tips.useInCrates);
    useInCrates.textContent = t("detail.useInCrates");
    useInCrates.disabled = !writable;
    useInCrates.addEventListener("click", () => {
      bridge.openReplaceInCratesDialog(track.id).catch((error2) => setNotice(failureOf(error2).message));
    });
    actions2.append(reveal, prepare, relocate, remove, useInCrates);
    if (state.mode === "duplicates" && selectedDuplicateGroup()) {
      const merge = buttonEl(tips.mergeDuplicates);
      merge.textContent = t("merge.title");
      merge.disabled = !writable;
      merge.addEventListener("click", () => {
        bridge.openMergeDialog().catch((error2) => setNotice(failureOf(error2).message));
      });
      actions2.append(merge);
    }
    body.append(actions2);
    body.append(relatedSection(track, writable));
    body.append(markerSection(track));
    if (track.copies?.length) body.append(copySection(track.id, track.copies, writable));
    body.append(membershipSection(track, writable));
    for (const group of track.groups || []) {
      const section = document.createElement("section");
      section.className = "group";
      const heading2 = document.createElement("h3");
      heading2.textContent = group.name ?? "";
      section.append(heading2);
      const open = group.name !== "Search copies";
      if (!open) {
        const toggle = buttonEl(tips.showSearchCopies);
        toggle.className = "text-button";
        toggle.textContent = t("detail.searchCopies", { count: group.fields.length });
        let shown = false;
        section.hidden = true;
        toggle.addEventListener("click", () => {
          shown = !shown;
          section.hidden = !shown;
          toggle.textContent = shown ? t("detail.hideSearchCopies") : t("detail.searchCopies", { count: group.fields.length });
          setTooltip(toggle, shown ? tips.hideSearchCopies : tips.showSearchCopies);
        });
        body.append(toggle);
      }
      for (const field of group.fields) {
        const row = document.createElement("div");
        row.className = "field";
        const label = document.createElement("div");
        label.className = "label";
        label.textContent = field.label ?? "";
        const column = document.createElement("span");
        column.className = "column";
        column.textContent = field.column ?? "";
        label.append(column);
        const value = document.createElement("div");
        value.className = "value";
        if (field.column === "color" && field.display.startsWith("#")) {
          const wrap = document.createElement("span");
          wrap.className = "color-value";
          const swatch = document.createElement("span");
          swatch.className = "swatch";
          swatch.style.background = field.display;
          wrap.append(swatch, document.createTextNode(field.display));
          value.append(wrap);
        } else {
          value.textContent = field.display;
        }
        row.append(label, value);
        section.append(row);
      }
      body.append(section);
    }
    el("detail").replaceChildren(body);
  }
  function markerSection(track) {
    const section = document.createElement("section");
    section.className = "group";
    const heading2 = document.createElement("h3");
    heading2.textContent = t("markers.heading");
    section.append(heading2);
    const note = document.createElement("p");
    note.className = "detail-kicker";
    if (track.markers_unavailable) note.textContent = t("markers.unavailable");
    else if (!track.markers_found) note.textContent = t("markers.none");
    else note.textContent = t("markers.readOnly");
    section.append(note);
    const ms = (value) => formatCueTime(value);
    if (!track.markers_unavailable) appendCueSlots(section, track.cues || []);
    for (const loop of track.loops || []) {
      const row = document.createElement("div");
      row.className = "marker";
      const swatch = document.createElement("span");
      swatch.className = "swatch";
      if (loop.color) swatch.style.background = loop.color;
      const time = document.createElement("span");
      time.textContent = `${ms(loop.start_ms)}–${ms(loop.end_ms)}`;
      const name = document.createElement("span");
      name.textContent = loop.name || t(loop.locked ? "markers.loopLocked" : "markers.loop", { number: loop.index + 1 });
      row.append(document.createElement("span"), swatch, time, name);
      section.append(row);
    }
    for (const flip of track.flips || []) {
      const row = document.createElement("div");
      row.className = "marker";
      const time = document.createElement("span");
      time.textContent = flip.enabled ? t("common.on") : t("common.off");
      const name = document.createElement("span");
      name.textContent = flip.name || t("markers.flip", { number: flip.index + 1 });
      row.append(document.createElement("span"), document.createElement("span"), time, name);
      section.append(row);
    }
    appendBeatgrid(section, track);
    return section;
  }
  function copySection(fromId, copies, writable) {
    const section = document.createElement("section");
    section.className = "group";
    const heading2 = document.createElement("h3");
    heading2.textContent = t("copies.heading");
    section.append(heading2);
    for (const copy of copies) {
      const row = document.createElement("div");
      row.className = "copy-row";
      const button2 = buttonEl(openCopy(copy.file || `Track ${copy.id}`));
      button2.className = "text-button";
      button2.textContent = copy.file || t("track.numbered", { id: String(copy.id) });
      button2.addEventListener("click", () => selectTrack(copy.id));
      const rate = document.createElement("span");
      rate.textContent = copy.bitrate == null ? "" : String(copy.bitrate);
      const plays = document.createElement("span");
      plays.textContent = copy.play_count == null ? "" : String(copy.play_count);
      const crates = document.createElement("span");
      crates.textContent = copy.missing ? "missing" : copy.crates || "";
      const replace = buttonEl(openReplaceCopy(copy.file || `Track ${copy.id}`));
      replace.className = "text-button";
      replace.textContent = t("copies.useInCrates");
      replace.disabled = !writable;
      replace.addEventListener("click", () => {
        bridge.openReplaceInCratesDialog(fromId, copy.id).catch((error2) => setNotice(failureOf(error2).message));
      });
      row.append(button2, rate, plays, crates, replace);
      section.append(row);
    }
    return section;
  }
  function relatedSection(track, writable) {
    const section = document.createElement("section");
    section.className = "group";
    section.dataset.trackId = String(track.id);
    const heading2 = document.createElement("h3");
    heading2.id = `related-heading-${track.id}`;
    heading2.textContent = t("related.heading");
    section.setAttribute("aria-labelledby", heading2.id);
    section.setAttribute("aria-busy", "true");
    const status = document.createElement("p");
    status.className = "detail-kicker";
    status.setAttribute("role", "status");
    const path = track.resolved_path || track.edit?.portable_id || "";
    status.textContent = path ? t("related.loading") : t("related.noPath");
    section.append(heading2, status);
    if (path) loadRelated(track, section, writable, "");
    return section;
  }
  async function loadRelated(track, section, writable, query) {
    const token3 = ++relatedRequest;
    const path = track.resolved_path || track.edit?.portable_id || "";
    const params = new URLSearchParams({ path, space: state.space });
    try {
      const response = await fetch(`/api/related?${params}`);
      const payload = await readJSONOr(response, {});
      if (token3 !== relatedRequest || !section.isConnected) return;
      if (!response.ok) throw new Error(serverMessage(payload, t("related.loadFailed")));
      renderRelated(track, section, writable, payload, query);
    } catch (error2) {
      if (token3 !== relatedRequest || !section.isConnected) return;
      section.setAttribute("aria-busy", "false");
      const status = section.querySelector("[role=status]");
      if (status) status.textContent = failureOf(error2).message;
    }
  }
  function renderRelated(track, section, writable, payload, query) {
    const heading2 = section.querySelector("h3");
    section.replaceChildren(heading2);
    section.setAttribute("aria-busy", "false");
    const saved = Array.isArray(payload.saved) ? payload.saved : [];
    const suggested = Array.isArray(payload.suggested) ? payload.suggested : [];
    const status = document.createElement("p");
    status.className = "detail-kicker";
    status.setAttribute("role", "status");
    status.textContent = saved.length ? t("related.savedCount", { count: saved.length }) : t("related.noneSaved");
    section.append(status);
    if (saved.length) section.append(relatedSavedList(track, section, saved));
    section.append(relatedSearch(track, section, query));
    const suggestHeading = document.createElement("p");
    suggestHeading.className = "detail-kicker";
    suggestHeading.textContent = suggested.length ? t("related.suggested") : t("related.noSuggestions");
    section.append(suggestHeading);
    if (suggested.length) section.append(relatedSuggestList(track, section, suggested));
    const crate = buttonEl(tips.updateRelated);
    crate.className = "text-button";
    crate.dataset.relatedCrate = "true";
    const crateName = payload.crate_name || "Related";
    crate.textContent = t("related.updateCrate");
    crate.disabled = !writable;
    crate.addEventListener("click", () => refreshRelatedCrate(track, section));
    const crateNote = document.createElement("p");
    crateNote.className = "detail-kicker";
    crateNote.textContent = writable ? t("related.crateNote", { name: crateName }) : t("related.quitSerato");
    section.append(crate, crateNote);
  }
  function relatedSavedList(track, section, saved) {
    const list = document.createElement("ul");
    list.className = "related-list";
    for (const link of saved) {
      const item5 = document.createElement("li");
      item5.className = "related-row";
      const main = document.createElement("div");
      const other = link.track || {};
      const label = other.title || t("track.untitled");
      if (other.asset_id != null && other.in_library) {
        const open = buttonEl(openRelated(label));
        open.className = "text-button";
        open.textContent = label;
        open.addEventListener("click", () => selectTrack(other.asset_id));
        main.append(open);
      } else {
        const name = document.createElement("span");
        name.textContent = label;
        main.append(name);
      }
      const meta = document.createElement("p");
      meta.className = "related-meta";
      const bits = [];
      if (other.artist) bits.push(other.artist);
      if (other.key) bits.push(other.key);
      if (other.bpm != null && other.bpm !== "") bits.push(t("markers.bpm", { bpm: String(other.bpm) }));
      bits.push(link.mutual ? t("related.twoWay") : t("related.oneWay"));
      if (link.rating != null) bits.push(t("related.ratingOutOf", { rating: String(link.rating) }));
      if (!other.in_library) bits.push(t("related.notInLibrary"));
      meta.textContent = bits.join(" · ");
      main.append(meta);
      if (link.note) {
        const note = document.createElement("p");
        note.className = "related-note";
        note.textContent = link.note;
        main.append(note);
      }
      const remove = buttonEl(removeRelatedTip(label));
      remove.className = "text-button";
      remove.textContent = t("common.remove");
      remove.setAttribute("aria-label", t("related.removeLink", { name: label }));
      remove.addEventListener("click", () => removeRelated(track, section, link));
      item5.append(main, remove);
      list.append(item5);
    }
    return list;
  }
  function relatedSearch(track, section, query) {
    const block = document.createElement("div");
    block.className = "related-search";
    const label = document.createElement("label");
    label.append(document.createTextNode(t("related.find")));
    const input = inputEl(tips.findRelated);
    input.type = "search";
    input.autocomplete = "off";
    input.placeholder = t("related.findPlaceholder");
    input.value = query || "";
    label.append(input);
    const results = document.createElement("ul");
    results.className = "related-results";
    const form = document.createElement("div");
    form.className = "related-form";
    form.hidden = true;
    block.append(label, results, form);
    const paint3 = () => {
      results.replaceChildren();
      form.hidden = true;
      form.replaceChildren();
      const query2 = parseQuery(input.value);
      if (!query2.terms.length && !query2.filters.length) {
        const hint = document.createElement("li");
        hint.className = "related-meta";
        hint.textContent = t("related.typeHint");
        results.append(hint);
        return;
      }
      const hits2 = state.tracks.filter((item5) => item5.id !== track.id && matchesQuery(item5, query2)).slice(0, 8);
      if (!hits2.length) {
        const empty = document.createElement("li");
        empty.className = "related-meta";
        empty.textContent = t("list.noMatches");
        results.append(empty);
        return;
      }
      for (const hit of hits2) {
        const item5 = document.createElement("li");
        const name = hit.artist ? `${hit.name || t("track.untitled")} · ${hit.artist}` : hit.name || t("track.untitled");
        const choose = buttonEl(chooseRelated(name));
        choose.className = "text-button";
        choose.textContent = hit.artist ? `${hit.name || t("track.untitled")} · ${hit.artist}` : hit.name || t("track.untitled");
        choose.addEventListener("click", () => relatedLinkForm(track, section, form, hit, input.value));
        item5.append(choose);
        results.append(item5);
      }
    };
    input.addEventListener("input", paint3);
    paint3();
    return block;
  }
  function relatedLinkForm(track, section, form, hit, query) {
    form.hidden = false;
    form.replaceChildren();
    const chosen = document.createElement("p");
    chosen.className = "related-meta";
    chosen.textContent = hit.artist ? `${hit.name || t("track.untitled")} · ${hit.artist}` : hit.name || t("track.untitled");
    const noteLabel = document.createElement("label");
    noteLabel.append(document.createTextNode(t("related.note")));
    const note = inputEl(tips.linkNote);
    note.type = "text";
    note.maxLength = 500;
    note.placeholder = t("related.notePlaceholder");
    noteLabel.append(note);
    const ratingLabel = document.createElement("label");
    ratingLabel.append(document.createTextNode(t("related.linkRating")));
    const rating = selectEl(tips.linkRating);
    for (const [value, text2] of [["", t("rating.none")], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"]]) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text2;
      rating.append(option);
    }
    ratingLabel.append(rating);
    const mutualLabel = document.createElement("label");
    mutualLabel.className = "check";
    const mutual = inputEl(tips.linkMutual);
    mutual.type = "checkbox";
    mutual.checked = true;
    mutualLabel.append(mutual, document.createTextNode(t("related.twoWayLink")));
    const save3 = buttonEl(tips.saveLink);
    save3.className = "text-button";
    save3.textContent = t("related.saveLink");
    save3.addEventListener("click", () => {
      save3.disabled = true;
      saveRelated(track, section, {
        action: "add",
        asset: track.id,
        target: hit.id,
        mutual: mutual.checked,
        note: note.value,
        rating: rating.value === "" ? null : Number(rating.value),
        space: state.space
      }, query);
    });
    form.append(chosen, noteLabel, ratingLabel, mutualLabel, save3);
  }
  function relatedSuggestList(track, section, suggested) {
    const list = document.createElement("ul");
    list.className = "related-list";
    for (const item5 of suggested) {
      const row = document.createElement("li");
      row.className = "related-row";
      const main = document.createElement("div");
      const name = document.createElement("span");
      name.textContent = item5.artist ? `${item5.title || t("track.untitled")} · ${item5.artist}` : item5.title || t("track.untitled");
      const reasons = document.createElement("p");
      reasons.className = "related-meta";
      reasons.textContent = Array.isArray(item5.reasons) ? item5.reasons.join(" · ") : "";
      main.append(name, reasons);
      const save3 = buttonEl(saveSuggestion(item5.title || "Untitled"));
      save3.className = "text-button";
      save3.textContent = t("common.save");
      save3.setAttribute("aria-label", t("related.saveLinkTo", { name: item5.title || t("track.untitled") }));
      save3.addEventListener("click", () => {
        save3.disabled = true;
        saveRelated(track, section, {
          action: "add",
          asset: track.id,
          target: item5.asset_id,
          mutual: true,
          note: "",
          rating: null,
          space: state.space
        }, "");
      });
      row.append(main, save3);
      list.append(row);
    }
    return list;
  }
  async function saveRelated(track, section, body, query) {
    try {
      await postJSON("/api/related", body);
      setNotice(t("related.saved"));
      const kept = section.querySelector(".related-search input");
      await loadRelated(track, section, Boolean(track.serato?.writable && state.writable), kept ? kept.value : query);
    } catch (error2) {
      if (failureOf(error2).status === 409) lockDown(error2);
      else setNotice(failureOf(error2).message);
      const status = section.querySelector("[role=status]");
      if (status) status.textContent = failureOf(error2).message;
    }
  }
  async function removeRelated(track, section, link) {
    const label = link.track?.title || t("related.thisTrack");
    if (!confirm(t("related.confirmRemove", { name: label }))) return;
    try {
      await postJSON("/api/related", { action: "remove", id: link.id });
      setNotice(t("related.removed"));
      const kept = section.querySelector(".related-search input");
      await loadRelated(track, section, Boolean(track.serato?.writable && state.writable), kept ? kept.value : "");
    } catch (error2) {
      setNotice(failureOf(error2).message);
    }
  }
  async function refreshRelatedCrate(track, section) {
    const button2 = section.querySelector("[data-related-crate]");
    if (button2) button2.disabled = true;
    try {
      const result = await postJSON("/api/related", { action: "crate", asset: track.id, space: state.space });
      setNotice(result.warning || t("related.crateUpdated", { name: String(result.name ?? "") }));
      await loadLibrary();
      selectTrack(track.id);
    } catch (error2) {
      if (failureOf(error2).status === 409) {
        lockDown(error2);
        if (button2) button2.disabled = true;
      } else {
        setNotice(failureOf(error2).message);
        if (button2) button2.disabled = !state.writable;
      }
    }
  }
  function membershipSection(track, writable) {
    const section = document.createElement("section");
    section.className = "group";
    const heading2 = document.createElement("h3");
    heading2.textContent = t("crates.heading");
    section.append(heading2);
    const holder = document.createElement("div");
    holder.className = "member-list";
    const chosen = new Set(track.crate_ids || []);
    const crates = [...state.crates].filter((crate) => !crate.smart).sort((a, b) => a.name.localeCompare(b.name));
    for (const crate of crates) {
      const label = document.createElement("label");
      label.className = "member";
      const input = inputEl(membershipTip(crate.name));
      input.type = "checkbox";
      input.checked = chosen.has(crate.id);
      input.disabled = !writable;
      input.addEventListener("change", () => setMembership(track.id, crate.id, input.checked, input));
      const name = document.createElement("span");
      name.textContent = crate.name;
      label.append(input, name);
      holder.append(label);
    }
    const smart = state.crates.filter((crate) => crate.smart && chosen.has(crate.id));
    if (smart.length) {
      const line = document.createElement("p");
      line.className = "detail-kicker";
      line.textContent = t("crates.smartList", { names: smart.map((crate) => crate.name).join(", ") });
      section.append(line);
    }
    section.append(holder);
    return section;
  }
  function repaintViews() {
    if (state.serato) el("status").textContent = statusLine(state.serato);
    paintGeneration(state.serato);
    renderList();
    if (state.mode === "history") {
      renderSessions();
      if (state.selectedId != null) selectEntry(state.selectedId);
      return;
    }
    const detail = lastDetail;
    if (detail && detail.id === state.selectedId && el("detail").querySelector(".detail-body")) renderDetail(detail);
  }
  function setNotice(text2) {
    el("notice").textContent = text2 || "";
    el("notice").hidden = !text2;
  }
  function statusLine(info) {
    if (info?.code) return codedText(info.message || t("status.library"), info.code, messageParams(info.params));
    return info?.message || t("status.library");
  }
  var GENERATION_LABELS = {
    serato4: "generation.serato4",
    serato5: "generation.serato5",
    legacy: "generation.legacy",
    unknown: "generation.unknown"
  };
  var GENERATION_REASONS = {
    log: "generation.reason.log",
    version: "generation.reason.version",
    fallback: "generation.reason.fallback",
    unknown: "generation.reason.unknown",
    unmounted: "generation.reason.unmounted",
    downgrade: "generation.reason.downgrade",
    mismatch: "generation.reason.mismatch",
    installed: "generation.reason.installed",
    installUnknown: "generation.reason.installUnknown"
  };
  function generationKind(info) {
    const kind2 = info?.generation?.kind ?? "";
    return GENERATION_LABELS[kind2] ?? "generation.checking";
  }
  function generationReason(info) {
    const generation = info?.generation;
    const key = GENERATION_REASONS[generation?.reason ?? ""] ?? "generation.reason.pending";
    return t(key, {
      log: generation?.log_name || "",
      version: generation?.version || "",
      newest: generation?.newest_version || "",
      database: generation?.database || ""
    });
  }
  function paintGeneration(info) {
    const button2 = document.getElementById("library-generation");
    if (!(button2 instanceof HTMLButtonElement)) return;
    const kind2 = t(generationKind(info));
    button2.textContent = kind2;
    button2.setAttribute("aria-label", t("generation.named", { kind: kind2 }));
    setTooltip(button2, tips.libraryGeneration);
    const note = document.getElementById("library-generation-note");
    if (note) {
      note.textContent = generationReason(info);
      note.hidden = button2.getAttribute("aria-expanded") !== "true";
    }
    if (button2.dataset.bound === "1") return;
    button2.dataset.bound = "1";
    button2.addEventListener("click", () => {
      const next2 = button2.getAttribute("aria-expanded") !== "true";
      button2.setAttribute("aria-expanded", next2 ? "true" : "false");
      const panel = document.getElementById("library-generation-note");
      if (panel) panel.hidden = !next2;
    });
  }
  function applyStatus(info) {
    state.serato = info;
    state.writable = Boolean(info?.writable);
    el("status").textContent = statusLine(info);
    paintGeneration(info);
    renderShell();
  }
  function lockDown(error2) {
    const failed = failureOf(error2);
    applyStatus(failed.payload?.serato || { writable: false, message: failed.message });
    setNotice(failed.message);
  }
  async function saveTrack(id, form) {
    const data = new FormData(form);
    const bpm = data.get("bpm");
    const fields = {
      name: data.get("name") ?? "",
      artist: data.get("artist") ?? "",
      album: data.get("album") ?? "",
      genre: data.get("genre") ?? "",
      year: data.get("year") ?? "",
      composer: data.get("composer") ?? "",
      remixer: data.get("remixer") ?? "",
      label: data.get("label") ?? "",
      grouping: data.get("grouping") ?? "",
      comments: data.get("comments") ?? "",
      key: data.get("key") ?? "",
      emoji: data.get("emoji") ?? "",
      bpm: bpm === "" ? null : Number(bpm),
      color: Number(data.get("color")),
      rating: data.get("rating") === "" ? null : Number(data.get("rating")),
      is_beatgrid_locked: form.querySelector("[name=is_beatgrid_locked]").checked
    };
    if (bpm !== "" && Number.isNaN(fields.bpm)) {
      setNotice(t("detail.bpmNumber"));
      return;
    }
    try {
      const result = await postJSON("/api/track", { id, space: state.space, fields });
      setNotice(result.warning || t("common.saved"));
      await loadLibrary();
      selectTrack(id);
    } catch (error2) {
      if (failureOf(error2).status === 409) lockDown(error2);
      else setNotice(failureOf(error2).message);
    }
  }
  async function revealTrack(id) {
    try {
      await postJSON("/api/reveal", { id });
    } catch (error2) {
      setNotice(failureOf(error2).message);
    }
  }
  async function prepareTrack(id, add) {
    try {
      const result = await postJSON("/api/crate", { action: "prepare", asset: id, add, space: state.space });
      setNotice(result.warning || (add ? t("detail.sentPrepare") : t("detail.removedPrepare")));
      await loadLibrary();
      selectTrack(id);
    } catch (error2) {
      if (failureOf(error2).status === 409) lockDown(error2);
      else setNotice(failureOf(error2).message);
    }
  }
  async function relocateTrack(track) {
    const path = prompt(t("detail.relocatePrompt"), track.resolved_path || track.edit?.portable_id || "");
    if (!path) return;
    try {
      const result = await postJSON("/api/track", {
        id: track.id,
        space: state.space,
        fields: { portable_id: path }
      });
      setNotice(result.warning || t("detail.relocated"));
      await loadLibrary();
      selectTrack(track.id);
    } catch (error2) {
      if (failureOf(error2).status === 409) lockDown(error2);
      else setNotice(failureOf(error2).message);
    }
  }
  async function removeTrack(id) {
    if (!confirm(t("detail.confirmRemove"))) return;
    try {
      const result = await postJSON("/api/crate", { action: "remove_library", asset: id, space: state.space });
      setNotice(result.warning || t("detail.removed"));
      state.selectedId = null;
      await loadLibrary();
    } catch (error2) {
      if (failureOf(error2).status === 409) lockDown(error2);
      else setNotice(failureOf(error2).message);
    }
  }
  async function setMembership(assetId, crateId, add, input) {
    try {
      const result = await postJSON("/api/crate", {
        action: add ? "add" : "remove",
        id: crateId,
        asset: assetId,
        space: state.space
      });
      if (result.warning) setNotice(result.warning);
      await loadLibrary();
      selectTrack(assetId);
    } catch (error2) {
      input.checked = !add;
      if (failureOf(error2).status === 409) lockDown(error2);
      else setNotice(failureOf(error2).message);
    }
  }
  async function saveRules(id, text2) {
    let rules;
    try {
      rules = JSON.parse(text2);
    } catch {
      setNotice(t("error.smart_rules_json"));
      return;
    }
    try {
      const result = await postJSON("/api/crate", { action: "rules", id, rules, space: state.space });
      setNotice(result.warning || t("rules.saved"));
      await loadLibrary();
      selectCrate(id);
    } catch (error2) {
      if (failureOf(error2).status === 409) lockDown(error2);
      else setNotice(failureOf(error2).message);
    }
  }
  async function createCrate2() {
    const name = prompt(t("crates.newPrompt"));
    if (!name || !name.trim()) return;
    const parent = state.activeCrate === "all" ? state.rootId : state.activeCrate;
    try {
      const result = await postJSON("/api/crate", { action: "create", name: name.trim(), parent, space: state.space });
      setNotice(result.warning || t("crates.created"));
      await loadLibrary();
      selectCrate(result.id);
    } catch (error2) {
      if (failureOf(error2).status === 409) lockDown(error2);
      else setNotice(failureOf(error2).message);
    }
  }
  async function renameCrate() {
    const crate = state.crates.find((item5) => item5.id === state.activeCrate);
    if (!crate) return;
    const name = prompt(t("crates.renamePrompt"), crate.name);
    if (!name || !name.trim() || name.trim() === crate.name) return;
    try {
      const result = await postJSON("/api/crate", { action: "rename", id: crate.id, name: name.trim(), space: state.space });
      setNotice(result.warning || t("crates.renamed"));
      await loadLibrary();
      selectCrate(crate.id);
    } catch (error2) {
      if (failureOf(error2).status === 409) lockDown(error2);
      else setNotice(failureOf(error2).message);
    }
  }
  function colorFromName(choice) {
    const wanted = choice.trim().toLocaleLowerCase();
    const english = COLOR_NAMES[wanted];
    if (english != null) return english;
    return COLORS.find(([, key]) => t(key).toLocaleLowerCase() === wanted)?.[0];
  }
  async function colorCrate() {
    const crate = state.crates.find((item5) => item5.id === state.activeCrate);
    if (!crate) return;
    const names = COLORS.map(([, key]) => t(key).toLocaleLowerCase());
    const choice = prompt(t("crates.colorPrompt", { names: names.join(", ") }));
    if (choice == null) return;
    const color = colorFromName(choice);
    if (color == null) {
      setNotice(t("crates.colorUnknown"));
      return;
    }
    try {
      const result = await postJSON("/api/crate", {
        action: "color",
        id: crate.id,
        color: color === 16777215 ? null : color,
        space: state.space
      });
      setNotice(result.warning || t("crates.colorSaved"));
      await loadLibrary();
    } catch (error2) {
      if (failureOf(error2).status === 409) lockDown(error2);
      else setNotice(failureOf(error2).message);
    }
  }
  async function deleteCrate() {
    const crate = state.crates.find((item5) => item5.id === state.activeCrate);
    if (!crate) return;
    if (!confirm(t("crates.confirmDelete", { name: crate.name }))) return;
    try {
      const result = await postJSON("/api/crate", { action: "delete", id: crate.id, space: state.space });
      state.activeCrate = "all";
      setNotice(result.warning || t("crates.deleted"));
      await loadLibrary();
    } catch (error2) {
      if (failureOf(error2).status === 409) lockDown(error2);
      else setNotice(failureOf(error2).message);
    }
  }
  async function importPlaylist(file) {
    const text2 = await file.text();
    const name = file.name.replace(/\.m3u8?$/i, "") || t("import.defaultName");
    const parent = state.activeCrate === "all" ? state.rootId : state.activeCrate;
    try {
      const result = await postJSON("/api/import.m3u", { space: state.space, parent, name, text: text2 });
      const missed = result.unmatched_count ? ` ${t("import.unmatched", { count: Number(result.unmatched_count) })}` : "";
      setNotice(`${t("import.added", { count: Number(result.added) || 0 })}${missed}${result.warning ? ` ${result.warning}` : ""}`);
      await loadLibrary();
      selectCrate(result.id);
    } catch (error2) {
      if (failureOf(error2).status === 409) lockDown(error2);
      else setNotice(failureOf(error2).message);
    }
  }
  function renderSessions() {
    el("session-list").replaceChildren();
    for (const session of state.historySessions) {
      const button2 = buttonEl(sessionTip(session.name || "Session"));
      button2.className = "crate";
      button2.setAttribute("role", "option");
      button2.setAttribute("aria-selected", String(session.id === state.historyId));
      const name = document.createElement("span");
      name.className = "name";
      name.textContent = session.name || t("history.session");
      const meta = document.createElement("span");
      meta.className = "meta";
      meta.textContent = String(session.played || 0);
      button2.append(name, meta);
      button2.addEventListener("click", () => openSession(session.id));
      el("session-list").append(button2);
    }
  }
  async function loadHistory() {
    const response = await fetch("/api/history");
    const payload = await readJSONOr(response, {});
    if (!response.ok) throw new Error(serverMessage(payload, t("history.readFailed")));
    state.historySessions = payload.sessions || [];
    renderSessions();
  }
  async function openSession(id) {
    state.historyId = id;
    state.selectedId = null;
    renderSessions();
    const response = await fetch(`/api/history?session=${id}`);
    const payload = await readJSONOr(response, {});
    if (!response.ok) {
      setNotice(serverMessage(payload, t("history.sessionFailed")));
      return;
    }
    state.entries = payload.entries || [];
    el("list").scrollTop = 0;
    renderList();
  }
  async function loadDuplicates() {
    state.duplicateIds = null;
    state.duplicateGroups = [];
    const response = await fetch(`/api/duplicates?space=${encodeURIComponent(state.space)}`);
    const payload = await readJSONOr(response, {});
    if (!response.ok) throw new Error(serverMessage(payload, t("duplicates.readFailed")));
    const ids = /* @__PURE__ */ new Set();
    state.duplicateGroups = payload.groups || [];
    for (const group of state.duplicateGroups) for (const id of group.ids || []) ids.add(id);
    state.duplicateIds = ids;
    state.duplicateSpace = state.space;
    if (state.mode === "duplicates") renderList();
  }
  async function openInLibrary(assetId) {
    state.space = "Serato Library";
    el("space").value = state.space;
    state.mode = "crates";
    state.activeCrate = "all";
    state.selectedId = assetId;
    await loadLibrary();
    selectTrack(assetId);
  }
  async function loadLibrary() {
    el("count").textContent = t("library.loading");
    const response = await fetch(`/api/library?space=${encodeURIComponent(state.space)}`);
    const library = await readJSONOr(response, {});
    if (!response.ok) throw new Error(serverMessage(library, t("library.readFailed", { status: String(response.status) })));
    const selected = state.selectedId;
    const active2 = state.activeCrate;
    state.tracks = library.tracks;
    state.byId = new Map(library.tracks.map((track) => [track.id, track]));
    state.crates = library.crates;
    state.rootId = library.root_id;
    state.crateTracks = new Map(library.crates.map((crate) => [crate.id, new Set(crate.tracks)]));
    state.presets = library.presets ?? {};
    state.expanded = new Set(library.crates.filter((crate) => crate.expanded).map((crate) => crate.id));
    state.activeCrate = active2 === "all" || library.crates.some((crate) => crate.id === active2) ? active2 : "all";
    state.selectedId = selected;
    if (state.duplicateSpace !== state.space) {
      state.duplicateIds = null;
      state.duplicateGroups = [];
    }
    applyStatus(library.serato);
    renderList();
  }
  function setMode(mode) {
    state.mode = mode;
    el("list").scrollTop = 0;
    if (mode === "history") {
      state.sort = "start";
      state.sortDir = -1;
      if (!state.historySessions.length) loadHistory().catch((error2) => setNotice(failureOf(error2).message));
    } else if (state.sort === "start" || state.sort === "deck" || state.sort === "played") {
      state.sort = "name";
      state.sortDir = 1;
    }
    if (mode === "duplicates" && state.duplicateSpace !== state.space) {
      loadDuplicates().catch((error2) => setNotice(failureOf(error2).message));
    }
    if (mode === "files") {
      state.filesLoading = true;
      const path = state.filesAtRoots ? "" : state.filesPath || "";
      loadFolder(path, { elsewhere: state.filesElsewhere && !state.filesAtRoots }).catch((error2) => failFiles(error2));
    }
    if (mode === "snapshots") {
      loadSnapshots().catch((error2) => failSnapshots(error2));
    }
    if (mode === "gig") loadGigCheck().catch(showGigFailure);
    if (mode === "portable") loadPortableView().catch(showPortableFailure);
    if (mode === "drift") loadDrift().catch(showDriftFailure);
    if (mode === "health") loadHealth().catch(showHealthFailure);
    if (mode === "stats") loadHistoryStats().catch(showHistoryStatsFailure);
    if (mode === "scan") loadScan("quick").catch(showScanFailure);
    if (mode === "bitrate") loadBitrate().catch(showBitrateFailure);
    if (mode === "tags") loadTags().catch(showTagsFailure);
    renderList();
  }
  function showFailure(error2) {
    el("count").textContent = t("library.unavailable");
    const failure = document.createElement("p");
    failure.className = "detail-error";
    failure.textContent = failureOf(error2).message;
    el("detail").replaceChildren(failure);
  }
  function selectedDuplicateGroup() {
    if (state.mode !== "duplicates" || state.selectedId == null) return null;
    return (state.duplicateGroups || []).find((group) => (group.ids || []).includes(state.selectedId)) || null;
  }
  function syncMergeButton() {
    const wrap = el("duplicate-actions");
    const button2 = el("merge-duplicates");
    if (!wrap || !button2) return;
    const show2 = state.mode === "duplicates";
    wrap.hidden = !show2;
    button2.disabled = !show2 || !state.writable || !selectedDuplicateGroup();
  }
  function syncRelinkButton() {
    const wrap = el("relink-actions");
    const button2 = el("open-relink");
    if (!wrap || !button2) return;
    const show2 = state.mode === "missing";
    wrap.hidden = !show2;
    button2.disabled = !show2 || !state.writable;
  }
  function crateNamesFor(assetId) {
    return state.crates.filter((crate) => !crate.smart && (crate.tracks || []).includes(assetId)).map((crate) => crate.name);
  }
  function failFiles(error2) {
    state.filesLoading = false;
    state.filesError = failureOf(error2).message || t("error.folder_unreadable");
    renderFiles();
  }
  var filesRequest = 0;
  var FILES_SEARCH_MS = 200;
  var filesSearchTimer = 0;
  var FILE_OVERSCAN = 8;
  async function loadFolder(path, options = {}) {
    window.clearTimeout(filesSearchTimer);
    state.filesQuery = "";
    state.filesSearching = false;
    const searchField = document.getElementById("files-search");
    if (searchField instanceof HTMLInputElement) searchField.value = "";
    const elsewhere = options.elsewhere === true;
    const refresh = options.refresh === true;
    const atRoots = path === "" && !elsewhere;
    const token3 = ++filesRequest;
    state.filesLoading = true;
    state.filesError = "";
    if (!options.keepMessage) state.filesMessage = "";
    state.filesSelected = /* @__PURE__ */ new Set();
    state.filesActive = 0;
    state.filesAtRoots = atRoots;
    state.filesElsewhere = elsewhere;
    if (atRoots) {
      state.filesPath = "";
      state.filesParent = null;
      state.filesEntries = [];
      state.filesBreadcrumb = [];
      state.filesRoot = null;
    }
    renderFiles();
    if (refresh || atRoots) {
      const rootsPayload = await fetchLibraryRoots(refresh);
      if (token3 !== filesRequest) return;
      state.filesRoots = rootsPayload.roots.filter(isLibraryRoot);
    }
    if (atRoots) {
      state.filesPath = "";
      state.filesParent = null;
      state.filesEntries = [];
      state.filesBreadcrumb = [];
      state.filesRoot = null;
      state.filesElsewhere = false;
      state.filesAtRoots = true;
      state.filesTruncated = false;
      state.filesLoading = false;
      el("files-list").scrollTop = 0;
      renderFiles();
      return;
    }
    const params = new URLSearchParams();
    if (path) params.set("path", path);
    if (elsewhere) params.set("elsewhere", "1");
    const query = params.size ? `?${params.toString()}` : "";
    const response = await fetch(`/api/files${query}`);
    const payload = await readJSONOr(response, {});
    if (token3 !== filesRequest) return;
    if (!response.ok) throw new Error(serverMessage(payload, t("error.folder_unreadable")));
    state.filesPath = payload.path || "";
    state.filesParent = typeof payload.parent === "string" && payload.parent ? payload.parent : null;
    state.filesEntries = Array.isArray(payload.entries) ? payload.entries : [];
    state.filesRoot = isFileRoot(payload.root) ? payload.root : null;
    state.filesBreadcrumb = Array.isArray(payload.breadcrumb) ? payload.breadcrumb.filter(isFileCrumb) : [];
    state.filesElsewhere = Boolean(payload.elsewhere);
    state.filesAtRoots = !state.filesPath && !state.filesElsewhere;
    state.filesTruncated = Boolean(payload.truncated);
    state.filesLoading = false;
    el("files-list").scrollTop = 0;
    if (payload.serato) applyStatus(payload.serato);
    renderFiles();
  }
  async function searchFiles(query) {
    const token3 = ++filesRequest;
    const scope = state.filesAtRoots ? "" : state.filesPath;
    const elsewhere = state.filesElsewhere && !state.filesAtRoots;
    state.filesLoading = true;
    state.filesError = "";
    state.filesSearching = true;
    state.filesQuery = query;
    renderFiles();
    const params = new URLSearchParams();
    params.set("q", query);
    if (scope) params.set("path", scope);
    if (elsewhere) params.set("elsewhere", "1");
    const response = await fetch(`/api/files?${params.toString()}`);
    const payload = await readJSONOr(response, {});
    if (token3 !== filesRequest) return;
    if (!response.ok) throw new Error(payload.error || "Files could not be searched.");
    const entries = Array.isArray(payload.entries) ? payload.entries.filter(isListedFile) : [];
    state.filesEntries = entries;
    state.filesTruncated = Boolean(payload.truncated);
    state.filesLoading = false;
    state.filesSearching = true;
    state.filesActive = 0;
    state.filesSelected = /* @__PURE__ */ new Set();
    el("files-list").scrollTop = 0;
    renderFiles();
  }
  function isListedFile(value) {
    if (!value || typeof value !== "object") return false;
    const row = value;
    return typeof row.name === "string" && typeof row.path === "string" && typeof row.kind === "string";
  }
  function renderFiles() {
    if (state.mode !== "files") return;
    const pick2 = el("files-pick");
    const moveHere = el("files-move-here");
    const pickCancel = el("files-pick-cancel");
    pick2.hidden = !state.filesPick;
    moveHere.hidden = !state.filesPick;
    pickCancel.hidden = !state.filesPick;
    renderBreadcrumb();
    const elsewhere = el("files-elsewhere");
    elsewhere.textContent = state.filesElsewhere ? t("files.roots") : t("files.browseElsewhere");
    setTooltip(elsewhere, state.filesElsewhere ? tips.filesMusicFolders : tips.filesElsewhere);
    el("files-up").disabled = !state.filesParent || state.filesLoading;
    const notes = [];
    if (state.filesLoading) notes.push(state.filesAtRoots ? t("files.readingRootsNote") : t("files.readingFolderNote"));
    if (state.filesError) notes.push(state.filesError);
    if (state.filesMessage) notes.push(state.filesMessage);
    if (state.filesTruncated) notes.push(state.filesSearching ? t("files.searchTruncated") : t("files.truncated"));
    el("files-status").textContent = notes.join(" ");
    const scroll = el("files-list").scrollTop;
    paintFileWindow();
    if (el("files-list").scrollTop !== scroll) el("files-list").scrollTop = scroll;
    const selected = selectedFiles();
    const locked = !state.writable || state.filesLoading || state.filesAtRoots;
    el("files-rename").disabled = locked || selected.length !== 1;
    el("files-rename-from-tags").disabled = locked || !selected.length;
    el("files-move").disabled = locked || !selected.length || Boolean(state.filesPick);
    el("files-move-folder").disabled = locked || !state.filesPath || Boolean(state.filesPick);
    el("files-replace").disabled = locked || selected.length !== 1;
    el("files-delete").disabled = locked || !selected.length;
    moveHere.disabled = locked;
    renderShell();
  }
  function renderBreadcrumb() {
    const nav = el("files-path");
    nav.replaceChildren();
    const list = document.createElement("ol");
    list.className = "files-crumbs";
    const crumbs = visibleCrumbs();
    crumbs.forEach((crumb, index) => {
      const item5 = document.createElement("li");
      const last = index === crumbs.length - 1;
      if (!last && crumb.path) {
        const button2 = buttonEl(openCrumb(crumb.name));
        button2.className = "files-crumb";
        button2.textContent = crumb.name;
        button2.addEventListener("click", () => {
          loadFolder(crumb.path, { elsewhere: state.filesElsewhere }).catch((error2) => failFiles(error2));
        });
        item5.append(button2);
      } else {
        const current2 = document.createElement("span");
        current2.className = "files-crumb";
        current2.setAttribute("aria-current", "page");
        current2.textContent = crumb.name;
        item5.append(current2);
      }
      if (!last) {
        const sep = document.createElement("span");
        sep.className = "files-sep";
        sep.setAttribute("aria-hidden", "true");
        sep.textContent = "/";
        item5.append(sep);
      }
      list.append(item5);
    });
    nav.append(list);
  }
  function visibleCrumbs() {
    if (state.filesBreadcrumb.length) return state.filesBreadcrumb;
    if (state.filesAtRoots) return [{ name: t("files.roots"), path: "" }];
    if (state.filesPath) return [{ name: state.filesPath, path: state.filesPath }];
    return [{ name: t("files.roots"), path: "" }];
  }
  function filesRowHeight() {
    if (state.filesSearching) return FILE_ROW;
    return state.filesAtRoots ? ROOT_ROW : FILE_ROW;
  }
  function browserRows() {
    if (state.filesSearching) return state.filesEntries;
    if (state.filesAtRoots) {
      return state.filesRoots.map((root) => {
        const entry = {
          name: root.label,
          path: root.path,
          detail: root.detail,
          kind: root.kind === "serato_drive" ? "drive" : "folder",
          missing: root.missing,
          removable: root.removable,
          serato: root.serato
        };
        return entry;
      });
    }
    const rank = { dir: 0, file: 1, link: 2 };
    return [...state.filesEntries].sort((left, right) => {
      return (rank[left.kind] ?? 3) - (rank[right.kind] ?? 3) || left.name.localeCompare(right.name, void 0, { numeric: true, sensitivity: "base" });
    });
  }
  function paintFileWindow() {
    const list = el("files-list");
    const rows2 = browserRows();
    list.setAttribute("aria-busy", String(state.filesLoading));
    list.setAttribute(
      "aria-label",
      state.filesSearching ? t("files.searchResults") : state.filesAtRoots ? t("files.roots") : t("files.contents")
    );
    if (state.filesLoading && !rows2.length) {
      const reading = state.filesSearching ? t("files.searching") : state.filesAtRoots ? t("files.readingRootsNote") : t("files.readingFolderNote");
      list.replaceChildren(fileNote(reading));
      list.tabIndex = 0;
      return;
    }
    if (state.filesError && !rows2.length) {
      list.replaceChildren(fileNote(state.filesError));
      list.tabIndex = 0;
      return;
    }
    if (state.filesAtRoots && !state.filesRoots.length) {
      list.replaceChildren(rootsEmpty());
      list.tabIndex = -1;
      return;
    }
    if (!rows2.length) {
      const empty = state.filesSearching ? t("files.noMatches", { query: state.filesQuery }) : t("files.empty");
      list.replaceChildren(fileNote(empty));
      list.tabIndex = 0;
      return;
    }
    list.tabIndex = -1;
    if (state.filesActive >= rows2.length) state.filesActive = rows2.length - 1;
    if (state.filesActive < 0) state.filesActive = 0;
    const rowHeight = filesRowHeight();
    const view = list.clientHeight || 600;
    const maxScroll = Math.max(0, rows2.length * rowHeight - view);
    const scrollTop = Math.min(Math.max(0, list.scrollTop), maxScroll);
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - FILE_OVERSCAN);
    const end = Math.min(rows2.length, Math.ceil((scrollTop + view) / rowHeight) + FILE_OVERSCAN);
    const spacer2 = fileSpacer(list);
    const windowEl = spacer2.querySelector(".files-window");
    if (!windowEl) return;
    spacer2.style.height = `${rows2.length * rowHeight}px`;
    windowEl.style.transform = `translateY(${start * rowHeight}px)`;
    windowEl.replaceChildren();
    for (let index = start; index < end; index += 1) {
      const entry = rows2[index];
      if (entry) windowEl.append(fileRow(entry, index));
    }
    if (state.filesActive >= start && state.filesActive < end) {
      list.setAttribute("aria-activedescendant", `files-item-${state.filesActive}`);
    } else list.removeAttribute("aria-activedescendant");
  }
  function fileSpacer(list) {
    const first = list.firstElementChild;
    if (first instanceof HTMLDivElement && first.classList.contains("files-spacer") && list.childElementCount === 1) {
      return first;
    }
    list.replaceChildren();
    const spacer2 = document.createElement("div");
    spacer2.className = "files-spacer";
    const windowEl = document.createElement("div");
    windowEl.className = "files-window";
    spacer2.append(windowEl);
    list.append(spacer2);
    return spacer2;
  }
  function fileNote(text2) {
    const note = document.createElement("p");
    note.className = "files-empty";
    note.textContent = text2;
    return note;
  }
  function rootsEmpty() {
    const box = document.createElement("div");
    box.className = "files-empty-state";
    const heading2 = document.createElement("h2");
    heading2.textContent = t("files.noRoots");
    const copy = document.createElement("p");
    copy.textContent = t("files.noRootsBody");
    const button2 = buttonEl(tips.runSetup);
    button2.id = "files-run-setup";
    button2.className = "files-primary";
    button2.textContent = t("files.runSetup");
    button2.addEventListener("click", () => bridge.openSetup());
    box.append(heading2, copy, button2);
    return box;
  }
  function focusFilesIndex(index) {
    const rows2 = browserRows();
    if (!rows2.length) return;
    state.filesActive = Math.max(0, Math.min(rows2.length - 1, index));
    const list = el("files-list");
    const rowHeight = filesRowHeight();
    const view = list.clientHeight || 600;
    const top = state.filesActive * rowHeight;
    const maxScroll = Math.max(0, rows2.length * rowHeight - view);
    if (top < list.scrollTop) list.scrollTop = top;
    if (top + rowHeight > list.scrollTop + view) list.scrollTop = Math.min(maxScroll, top + rowHeight - view);
    paintFileWindow();
    const control = list.querySelector(`[data-files-index="${state.filesActive}"]`);
    control?.focus();
  }
  function activateFilesIndex(index) {
    const entry = browserRows()[index];
    if (!entry) return;
    if (entry.kind === "file") {
      if (state.filesSelected.has(entry.path)) state.filesSelected.delete(entry.path);
      else state.filesSelected.add(entry.path);
      renderFiles();
      focusFilesIndex(index);
      return;
    }
    if (entry.kind === "link") return;
    openBrowserRow(entry);
  }
  function openBrowserRow(entry) {
    if (entry.missing) return;
    const elsewhere = state.filesElsewhere && entry.kind === "dir";
    loadFolder(entry.path, { elsewhere }).catch((error2) => failFiles(error2));
  }
  function onFilesKey(event) {
    if (state.mode !== "files") return;
    const list = el("files-list");
    if (!(event.target instanceof Node) || !list.contains(event.target)) return;
    const rows2 = browserRows();
    if (!rows2.length) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End") {
      event.preventDefault();
      if (event.key === "ArrowDown") focusFilesIndex(state.filesActive + 1);
      else if (event.key === "ArrowUp") focusFilesIndex(state.filesActive - 1);
      else if (event.key === "Home") focusFilesIndex(0);
      else focusFilesIndex(rows2.length - 1);
      return;
    }
    if (event.key !== "Enter" && event.key !== " ") return;
    const control = event.target instanceof HTMLElement ? event.target.closest("button, input") : null;
    if (control && list.contains(control)) return;
    event.preventDefault();
    activateFilesIndex(state.filesActive);
  }
  function fileRow(entry, index) {
    const row = document.createElement("div");
    row.className = "files-row";
    if (entry.detail && (entry.kind === "folder" || entry.kind === "drive")) row.classList.add("is-root");
    if (entry.missing) row.classList.add("is-missing");
    if (index === state.filesActive) row.classList.add("is-active");
    row.setAttribute("role", "listitem");
    const openKind = entry.kind === "dir" || entry.kind === "folder" || entry.kind === "drive";
    if (openKind) {
      const button2 = buttonEl(entry.missing ? missingDrive(entry.name) : openFile(entry.name));
      button2.className = "files-open";
      button2.dataset.filesIndex = String(index);
      button2.id = `files-item-${index}`;
      button2.tabIndex = index === state.filesActive ? 0 : -1;
      if (entry.kind === "drive" || entry.kind === "folder") button2.append(fileIcon(entry.kind === "drive" ? "drive" : "folder"));
      if (entry.detail && (entry.kind === "folder" || entry.kind === "drive")) {
        const copy = document.createElement("span");
        copy.className = "files-root-copy";
        const label2 = document.createElement("span");
        label2.className = "files-root-label";
        label2.textContent = entry.name;
        const detail = document.createElement("span");
        detail.className = "files-root-detail";
        detail.textContent = entry.detail;
        copy.append(label2, detail);
        button2.append(copy);
      } else {
        const name2 = document.createElement("span");
        name2.textContent = entry.name;
        button2.append(name2);
        if (entry.detail) {
          const detail = document.createElement("span");
          detail.className = "files-match-detail";
          detail.textContent = entry.detail;
          button2.append(detail);
        }
      }
      if (entry.missing) {
        button2.setAttribute("aria-disabled", "true");
        button2.setAttribute("aria-label", t("files.driveMissingLabel", { name: entry.name }));
        const badge = document.createElement("span");
        badge.className = "files-badge";
        badge.textContent = t("files.driveMissing");
        button2.append(badge);
        button2.addEventListener("click", () => {
          state.filesActive = index;
        });
      } else {
        button2.setAttribute("aria-label", t("files.open", { name: entry.name }));
        button2.addEventListener("click", () => {
          state.filesActive = index;
          openBrowserRow(entry);
        });
      }
      row.append(button2);
      if (entry.removable && entry.serato) row.append(portableDriveButton(entry.name, entry.path));
      return row;
    }
    if (entry.kind !== "file") {
      const label2 = buttonEl(fileShortcut(entry.name));
      label2.className = "files-kind";
      label2.dataset.filesIndex = String(index);
      label2.id = `files-item-${index}`;
      label2.tabIndex = index === state.filesActive ? 0 : -1;
      label2.textContent = t("files.shortcut", { name: entry.name });
      label2.setAttribute("aria-label", t("files.shortcut", { name: entry.name }));
      row.append(label2);
      return row;
    }
    const label = document.createElement("label");
    label.className = "files-file";
    const box = inputEl(selectFile(entry.name, entry.path));
    box.type = "checkbox";
    box.dataset.filesIndex = String(index);
    box.id = `files-item-${index}`;
    box.tabIndex = index === state.filesActive ? 0 : -1;
    box.checked = state.filesSelected.has(entry.path);
    box.setAttribute("aria-label", entry.name);
    box.addEventListener("change", () => {
      state.filesActive = index;
      if (box.checked) state.filesSelected.add(entry.path);
      else state.filesSelected.delete(entry.path);
      renderFiles();
    });
    const name = document.createElement("span");
    name.className = "files-name";
    name.textContent = entry.name;
    label.append(box, name);
    if (entry.detail) {
      const detail = document.createElement("span");
      detail.className = "files-match-detail";
      detail.textContent = entry.detail;
      label.append(detail);
    }
    if (entry.in_library) {
      const badge = document.createElement("span");
      badge.className = "files-badge";
      badge.textContent = t("files.inLibrary");
      label.append(badge);
    }
    row.append(label);
    return row;
  }
  function fileIcon(kind2) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("files-icon", kind2 === "drive" ? "files-icon-drive" : "files-icon-folder");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.5");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute(
      "d",
      kind2 === "drive" ? "M5 8.5h14v8H5z M8 14.5h.01 M12 14.5h4" : "M4 8.5h6l2 2h8v7.5H4z"
    );
    svg.append(path);
    return svg;
  }
  function isFileRoot(value) {
    if (!value || typeof value !== "object") return false;
    const record = value;
    return typeof record.name === "string" && typeof record.path === "string" && typeof record.kind === "string";
  }
  function isFileCrumb(value) {
    if (!value || typeof value !== "object") return false;
    const record = value;
    return typeof record.name === "string" && typeof record.path === "string";
  }
  function moveFileList(delta) {
    if (!browserRows().length) return;
    focusFilesIndex(state.filesActive + delta);
  }
  function openFileList() {
    if (!browserRows().length) return;
    activateFilesIndex(state.filesActive);
  }
  function focusFileByPath(path) {
    const index = browserRows().findIndex((entry) => entry.path === path);
    if (index < 0) return;
    focusFilesIndex(index);
  }
  function selectedFiles() {
    return state.filesEntries.filter((entry) => entry.kind === "file" && state.filesSelected.has(entry.path));
  }
  function wireLibrary() {
    el("files-list").addEventListener("scroll", () => {
      if (state.mode === "files") paintFileWindow();
    });
    el("files-list").addEventListener("keydown", onFilesKey);
    el("files-search").addEventListener("input", () => {
      window.clearTimeout(filesSearchTimer);
      const value = el("files-search").value;
      state.filesQuery = value;
      if (!value.trim()) {
        if (state.filesAtRoots && !state.filesPath) {
          state.filesSearching = false;
          state.filesEntries = [];
          state.filesError = "";
          state.filesTruncated = false;
          state.filesLoading = false;
          renderFiles();
          return;
        }
        loadFolder(state.filesPath, { elsewhere: state.filesElsewhere && Boolean(state.filesPath) }).catch((error2) => failFiles(error2));
        return;
      }
      filesSearchTimer = window.setTimeout(() => {
        searchFiles(value.trim()).catch((error2) => failFiles(error2));
      }, FILES_SEARCH_MS);
    });
    el("search").addEventListener("input", () => {
      state.query = el("search").value;
      el("list").scrollTop = 0;
      renderList();
    });
    el("search-field").addEventListener("change", () => {
      state.searchField = el("search-field").value;
      el("list").scrollTop = 0;
      renderList();
    });
    el("crate-search").addEventListener("input", (event) => {
      state.crateQuery = event.target.value;
      renderCrates();
    });
    el("reload").addEventListener("click", () => {
      const jobs = [loadLibrary()];
      if (state.mode === "history") jobs.push(loadHistory());
      if (state.mode === "duplicates") jobs.push(loadDuplicates());
      if (state.mode === "gig") jobs.push(loadGigCheck().catch(showGigFailure));
      if (state.mode === "portable") jobs.push(loadPortableView().catch(showPortableFailure));
      if (state.mode === "drift") jobs.push(loadDrift().catch(showDriftFailure));
      if (state.mode === "health") jobs.push(loadHealth().catch(showHealthFailure));
      if (state.mode === "stats") jobs.push(loadHistoryStats().catch(showHistoryStatsFailure));
      if (state.mode === "scan") jobs.push(loadScan().catch(showScanFailure));
      if (state.mode === "bitrate") jobs.push(loadBitrate().catch(showBitrateFailure));
      if (state.mode === "tags") jobs.push(loadTags().catch(showTagsFailure));
      Promise.all(jobs).catch(showFailure);
    });
    el("export-m3u").addEventListener("click", () => {
      const crate = playlistCrate();
      if (crate == null) return;
      const link = document.createElement("a");
      link.href = `/api/export.m3u?space=${encodeURIComponent(state.space)}&crate=${encodeURIComponent(crate)}`;
      link.download = "crate.m3u";
      link.click();
    });
    el("import-m3u").addEventListener("click", () => {
      if (playlistCrate() == null) return;
      if (!state.writable) {
        setNotice(el("status").textContent);
        return;
      }
      el("import-file").click();
    });
    el("import-file").addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (file) importPlaylist(file).catch((error2) => setNotice(failureOf(error2).message));
    });
    el("space").addEventListener("change", () => {
      state.space = el("space").value;
      state.activeCrate = "all";
      state.selectedId = null;
      state.duplicateIds = null;
      state.duplicateGroups = [];
      loadLibrary().then(() => {
        if (state.mode === "duplicates") return loadDuplicates();
        if (state.mode === "gig") return loadGigCheck().catch(showGigFailure);
        if (state.mode === "portable") return loadPortableView().catch(showPortableFailure);
        if (state.mode === "drift") return loadDrift().catch(showDriftFailure);
        if (state.mode === "health") return loadHealth().catch(showHealthFailure);
        if (state.mode === "stats") return loadHistoryStats().catch(showHistoryStatsFailure);
        if (state.mode === "scan") return loadScan().catch(showScanFailure);
        if (state.mode === "bitrate") return loadBitrate().catch(showBitrateFailure);
        if (state.mode === "tags") return loadTags().catch(showTagsFailure);
        return null;
      }).catch(showFailure);
    });
    el("views").addEventListener("click", (event) => {
      const button2 = event.target.closest("button");
      if (button2?.dataset.view) setMode(button2.dataset.view);
    });
    document.querySelector(".sort-crates").addEventListener("click", (event) => {
      const button2 = event.target.closest("button");
      if (!button2?.dataset.crateSort) return;
      state.crateSort = button2.dataset.crateSort;
      renderCrates();
      renderShell();
    });
    el("crate-new").addEventListener("click", () => createCrate2().catch((error2) => setNotice(failureOf(error2).message)));
    el("crate-rename").addEventListener("click", () => renameCrate().catch((error2) => setNotice(failureOf(error2).message)));
    el("crate-color").addEventListener("click", () => colorCrate().catch((error2) => setNotice(failureOf(error2).message)));
    el("crate-delete").addEventListener("click", () => deleteCrate().catch((error2) => setNotice(failureOf(error2).message)));
    document.querySelector(".columns").addEventListener("click", (event) => {
      const button2 = event.target.closest("button");
      if (!button2?.dataset.sort) return;
      const key = button2.dataset.sort;
      if (state.sort === key) state.sortDir *= -1;
      else {
        state.sort = key;
        state.sortDir = isNumericSort(key) ? -1 : 1;
      }
      renderColumns();
      renderList();
    });
    el("crate-list").addEventListener("keydown", (event) => {
      const item5 = event.target.closest(".crate");
      if (!item5 || !el("crate-list").contains(item5)) return;
      const items = [...el("crate-list").querySelectorAll(".crate")];
      const index = items.indexOf(item5);
      const id = item5.dataset.id === "all" ? "all" : Number(item5.dataset.id);
      if (event.key === "ArrowDown") {
        event.preventDefault();
        focusCrateItem(items[Math.min(items.length - 1, index + 1)]);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        focusCrateItem(items[Math.max(0, index - 1)]);
      } else if (event.key === "Home") {
        event.preventDefault();
        focusCrateItem(items[0]);
      } else if (event.key === "End") {
        event.preventDefault();
        focusCrateItem(items[items.length - 1]);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        if (!state.crateQuery && item5.getAttribute("aria-expanded") === "false") toggleCrate(id);
        else if (item5.getAttribute("aria-expanded") === "true") focusCrateItem(items[index + 1]);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (!state.crateQuery && item5.getAttribute("aria-expanded") === "true") toggleCrate(id);
        else if (item5.dataset.parent) {
          focusCrateItem(items.find((button2) => button2.dataset.id === item5.dataset.parent));
        }
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectCrate(id);
      }
    });
  }
  bridge.selectTrack = selectTrack;
  bridge.selectEntry = selectEntry;
  bridge.reloadLibrary = loadLibrary;
  bridge.lockDown = lockDown;

  // src/layout.ts
  var TRACK_LIST_MIN_WIDTH = 360;
  var DETAIL_MIN_WIDTH = 300;
  var SAVE_DELAY_MS = 400;
  var splitter = null;
  var changedHere = false;
  var saveTimer;
  function save(width) {
    changedHere = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      postJSON("/api/settings", { layout: { track_list_width: width } }).catch(() => {
        setNotice(t("layout.widthNotSaved"));
      });
    }, SAVE_DELAY_MS);
  }
  function wireLayout() {
    splitter = mountSplitter({
      handle: el("track-splitter"),
      container: el("browser").parentElement,
      first: el("browser"),
      property: "--track-list-width",
      minFirst: TRACK_LIST_MIN_WIDTH,
      minSecond: DETAIL_MIN_WIDTH,
      onCommit: save
    });
    window.addEventListener("resize", () => splitter?.refit());
  }
  function applyLayout(payload) {
    if (!splitter || changedHere) return;
    const width = payload.layout?.track_list_width;
    splitter.set(typeof width === "number" ? width : null);
  }

  // src/dialogs.ts
  var rekordboxXml = "";
  var mergePreview = null;
  var mergeToken = 0;
  var mergeLoading = false;
  var replaceFromId = null;
  var replaceToId = null;
  var replacePreview = null;
  var replaceToken = 0;
  var replaceLoading = false;
  var consentSettled = false;
  var privacySync = false;
  var appearanceSync = false;
  var COLORWAYS = ["serato-like", "dark-club", "light", "classic"];
  var LEGACY_COLORWAYS = {
    motown: "classic",
    "deep-house": "classic",
    "daisy-age": "classic"
  };
  function isColorway(value) {
    return typeof value === "string" && COLORWAYS.includes(value);
  }
  function resolveColorway(value) {
    if (isColorway(value)) return value;
    if (typeof value === "string") {
      const mapped = LEGACY_COLORWAYS[value];
      if (mapped !== void 0) return mapped;
    }
    return "serato-like";
  }
  var filesPreview = null;
  var filesAction = "";
  var filesTagScope = "paths";
  var filesTrigger = null;
  var relinkPlan = null;
  var relinkLoading = false;
  var relinkChosen = /* @__PURE__ */ new Map();
  var relinkChecked = /* @__PURE__ */ new Set();
  function rekordboxExportUrl(report) {
    const crate = playlistCrate() ?? "all";
    const memory = el("rekordbox-memory").checked ? "1" : "0";
    const hotLoops = el("rekordbox-hot-loops").checked ? "1" : "0";
    const key = el("rekordbox-key").value;
    const base = `/api/export.rekordbox.xml?space=${encodeURIComponent(state.space)}&crate=${encodeURIComponent(crate)}&memory=${memory}&hot_loops=${hotLoops}&key=${encodeURIComponent(key)}`;
    return report ? `${base}&report=1` : base;
  }
  var rekordboxToken = 0;
  var rekordboxReportToken = 0;
  function applyRekordboxExport(payload) {
    const section = payload.rekordbox;
    if (section == null) return;
    if (typeof section.hot_loops === "boolean") {
      el("rekordbox-hot-loops").checked = section.hot_loops;
    }
    if (typeof section.memory_cues === "boolean") {
      el("rekordbox-memory").checked = section.memory_cues;
    }
    if (section.key_notation === "asis" || section.key_notation === "camelot" || section.key_notation === "classical") {
      el("rekordbox-key").value = section.key_notation;
    }
  }
  async function saveRekordboxExport() {
    const key = el("rekordbox-key").value;
    const notation = key === "camelot" || key === "classical" ? key : "asis";
    const token3 = ++rekordboxToken;
    try {
      const payload = await postJSON("/api/settings", {
        rekordbox: {
          hot_loops: el("rekordbox-hot-loops").checked,
          memory_cues: el("rekordbox-memory").checked,
          key_notation: notation
        }
      });
      if (token3 === rekordboxToken) applyRekordboxExport(payload);
    } catch {
    }
  }
  function fillRekordboxReport(lines) {
    const list = el("rekordbox-report");
    list.replaceChildren();
    for (const line of lines) {
      const item5 = document.createElement("li");
      item5.textContent = line;
      list.append(item5);
    }
  }
  function requestRekordboxReport() {
    const token3 = ++rekordboxReportToken;
    rekordboxXml = "";
    fetch(rekordboxExportUrl(true)).then((response) => response.json().then((body) => ({ ok: response.ok, body }))).then(({ ok, body }) => {
      if (token3 !== rekordboxReportToken) return;
      if (!ok || typeof body.xml !== "string" || !body.xml.startsWith("<?xml")) {
        const message = serverMessage(body, t("rekordbox.failed"));
        if (el("rekordbox-dialog").open) el("rekordbox-status").textContent = message;
        else setNotice(message);
        return;
      }
      rekordboxXml = body.xml;
      fillRekordboxReport(body.report || []);
      el("rekordbox-status").textContent = "";
      if (!el("rekordbox-dialog").open) el("rekordbox-dialog").showModal();
    }).catch((error2) => {
      if (token3 !== rekordboxReportToken) return;
      const message = failureOf(error2).message;
      if (el("rekordbox-dialog").open) el("rekordbox-status").textContent = message;
      else setNotice(message);
    });
  }
  function selectedMergeKeepId() {
    const checked = el("merge-choices").querySelector("input:checked");
    if (checked) return Number(checked.value);
    return state.selectedId;
  }
  function previewFieldValue(field, value) {
    if (value == null || value === "") return "empty";
    if (field === "time_added") {
      const date = new Date(Number(value) * 1e3);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleString(void 0, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit"
        });
      }
    }
    return String(value);
  }
  function mergeCopyWhat(copy) {
    if (copy.markers && copy.beatgrid) return t("merge.copyCuesWhatBoth");
    if (copy.markers) return t("merge.copyCuesWhatMarkers");
    return t("merge.copyCuesWhatGrid");
  }
  function mergeCopyLine(copy, done) {
    return t(done ? "merge.copiedCues" : "merge.copyCues", {
      file: copy.file ?? "",
      what: mergeCopyWhat(copy)
    });
  }
  function renderMergePreview(preview) {
    el("merge-preview").replaceChildren();
    if (!preview) {
      const pending = document.createElement("p");
      pending.textContent = t("merge.readingPreview");
      el("merge-preview").append(pending);
      return;
    }
    const list = document.createElement("ul");
    list.className = "merge-preview";
    const added = preview.crates_added || [];
    const item5 = (text2) => {
      const line = document.createElement("li");
      line.textContent = text2;
      list.append(line);
    };
    if (added.length) {
      const names = added.map((crate) => crate.space && crate.space !== state.space ? `${crate.name} (${crate.space})` : crate.name);
      item5(t("merge.addToCrates", { crates: names.join(", ") }));
    } else if ((preview.crates_kept || []).length) {
      item5(t("merge.alreadyInCrates"));
    } else {
      item5(t("merge.noCrates"));
    }
    for (const space of preview.spaces_added || []) item5(t("merge.addToSpace", { space }));
    if ((preview.fields || []).length) {
      for (const field of preview.fields || []) {
        const before = previewFieldValue(field.field || "", field.before);
        const after = previewFieldValue(field.field || "", field.after);
        item5(t("merge.fieldChange", { label: field.label ?? "", before, after }));
      }
    } else {
      item5(t("merge.noFields"));
    }
    if (preview.history_repointed) {
      const count = Number(preview.history_entries) || 0;
      item5(count ? t("merge.repointHistory", { count }) : t("merge.noHistory"));
    } else {
      item5(t("merge.noHistoryId"));
    }
    const removed = (preview.removed || []).length;
    item5(t("merge.removeCopies", { count: removed }));
    for (const file of preview.files || []) {
      if (file.reason) item5(`${file.file}: ${file.reason}`);
    }
    const copy = preview.cue_copy;
    if (copy && (copy.markers || copy.beatgrid) && copy.status !== "failed") {
      item5(mergeCopyLine(copy, copy.status === "copied"));
    }
    el("merge-preview").append(list);
    if (preview.cue_warning) {
      const warning = document.createElement("p");
      warning.className = "merge-warning";
      warning.textContent = preview.cue_warning;
      el("merge-preview").append(warning);
    }
    const files = document.createElement("p");
    files.id = "merge-file-note";
    files.className = "dialog-note";
    el("merge-preview").append(files);
  }
  function syncTrashChoice() {
    const files = mergePreview?.files || [];
    const trashable = files.filter((file) => file.on_disk && !file.blocks_trash);
    const blocked = files.some((file) => file.blocks_trash);
    el("merge-trash").disabled = !mergePreview || mergeLoading || blocked || trashable.length === 0;
    if (el("merge-trash").disabled) el("merge-trash").checked = false;
    const danger = el("merge-trash").checked;
    el("merge-confirm").classList.toggle("danger", danger);
    el("merge-confirm").textContent = mergeLoading ? t("merge.merging") : danger ? t("merge.confirmTrash") : t("merge.title");
    setTooltip(
      el("merge-confirm"),
      mergeLoading ? tips.merging : danger ? tips.mergeConfirmTrash : tips.mergeConfirm
    );
    el("merge-confirm").disabled = mergeLoading || !mergePreview || mergePreview.writable === false;
    const note = el("merge-file-note");
    if (!note) return;
    if (danger) note.textContent = t("merge.trashFiles", { files: trashable.map((file) => file.file).join(", ") });
    else note.textContent = t("merge.filesStay");
  }
  async function refreshMergePreview() {
    const keepId = selectedMergeKeepId();
    const token3 = ++mergeToken;
    mergeLoading = false;
    mergePreview = null;
    el("merge-status").textContent = "";
    renderMergePreview(null);
    syncTrashChoice();
    el("merge-confirm").disabled = true;
    try {
      const preview = await postJSON("/api/duplicates/merge", {
        space: state.space,
        keep_id: keepId,
        preview: true
      });
      if (token3 !== mergeToken) return;
      mergePreview = preview;
      renderMergePreview(preview);
      if (preview.writable === false) {
        el("merge-status").textContent = t("merge.quitSerato");
      }
      syncTrashChoice();
    } catch (error2) {
      if (token3 !== mergeToken) return;
      mergePreview = null;
      el("merge-preview").replaceChildren();
      const failed = document.createElement("p");
      failed.textContent = t("merge.previewFailed");
      el("merge-preview").append(failed);
      el("merge-status").textContent = failureOf(error2).message;
      syncTrashChoice();
    }
  }
  function renderMergeChoices() {
    const group = selectedDuplicateGroup();
    el("merge-choices").replaceChildren();
    if (!group) return;
    for (const id of group.ids || []) {
      const track = state.byId.get(id) || { id, file: "", play_count: null, missing: false };
      const label = document.createElement("label");
      label.className = "merge-choice";
      label.htmlFor = `merge-keep-${id}`;
      const input = inputEl(keepCopy(track.file || `Track ${id}`));
      input.type = "radio";
      input.name = "merge-keep";
      input.id = `merge-keep-${id}`;
      input.value = String(id);
      input.checked = id === state.selectedId;
      input.addEventListener("change", () => {
        if (input.checked) refreshMergePreview().catch((error2) => setNotice(failureOf(error2).message));
      });
      const text2 = document.createElement("span");
      const name = document.createElement("span");
      name.textContent = track.file || t("track.numbered", { id: String(id) });
      const meta = document.createElement("span");
      meta.className = "merge-meta";
      const parts = [];
      if (track.play_count != null) parts.push(t("merge.plays", { count: Number(track.play_count) }));
      const crates = crateNamesFor(id);
      if (crates.length) parts.push(crates.join(", "));
      if (track.offline) parts.push(t("track.offlineBadge"));
      else if (track.missing) parts.push(t("track.missingBadge"));
      meta.textContent = parts.join(" · ");
      text2.append(name, meta);
      label.append(input, text2);
      el("merge-choices").append(label);
    }
  }
  async function openMergeDialog() {
    if (!selectedDuplicateGroup() || !state.writable) return;
    if (typeof el("merge-dialog").showModal !== "function") return;
    el("merge-trash").checked = false;
    el("merge-status").textContent = "";
    renderMergeChoices();
    if (!el("merge-dialog").open) el("merge-dialog").showModal();
    el("merge-cancel").focus();
    await refreshMergePreview();
  }
  async function confirmMerge() {
    const keepId = selectedMergeKeepId();
    if (keepId == null || mergeLoading) return;
    const trash = el("merge-trash").checked;
    mergeLoading = true;
    syncTrashChoice();
    el("merge-status").textContent = "";
    try {
      const result = await postJSON("/api/duplicates/merge", {
        space: state.space,
        keep_id: keepId,
        confirm: true,
        delete_files: trash,
        confirm_delete_files: trash
      });
      el("merge-dialog").close();
      const count = (result.removed || []).length;
      const name = result.kept?.file || t("merge.keptCopy");
      let message = t("merge.merged", { count, name });
      if (result.warning) message = `${message} ${result.warning}`;
      const copy = result.cue_copy;
      if (copy && (copy.markers || copy.beatgrid) && copy.status === "copied") {
        message = `${message} ${mergeCopyLine(copy, true)}`;
      }
      if (result.cue_warning) message = `${message} ${result.cue_warning}`;
      setNotice(message);
      state.selectedId = keepId;
      await loadLibrary();
      if (state.mode === "duplicates") await loadDuplicates();
      if (state.byId.has(keepId)) selectTrack(keepId);
    } catch (error2) {
      el("merge-status").textContent = failureOf(error2).message;
      if (failureOf(error2).status === 409) {
        lockDown(error2);
        el("merge-dialog").close();
      }
    } finally {
      mergeLoading = false;
      syncTrashChoice();
    }
  }
  var REPLACE_CHOICE_LIMIT = 12;
  function rankReplaceCandidates(fromId, query, toId) {
    const others = state.tracks.filter((track) => track.id !== fromId);
    const trimmed = query.trim();
    let ranked;
    if (!trimmed) {
      ranked = others.slice();
    } else {
      const scored = [];
      for (const track of others) {
        const haystack = [track.file, track.name, track.artist].filter(Boolean).join(" ");
        const score = scoreQuery(trimmed, haystack);
        if (score != null) scored.push({ track, score });
      }
      scored.sort((a, b) => b.score - a.score);
      ranked = scored.map((item5) => item5.track);
    }
    if (toId != null) {
      const pinned = others.find((track) => track.id === toId);
      if (pinned) ranked = [pinned, ...ranked.filter((track) => track.id !== toId)];
    }
    return ranked.slice(0, REPLACE_CHOICE_LIMIT);
  }
  function replaceCrateLabel(crate) {
    const name = crate.name || "";
    return crate.space && crate.space !== state.space ? `${name} (${crate.space})` : name;
  }
  function renderCratesReplacePreview(preview) {
    el("crates-replace-preview").replaceChildren();
    if (!preview) {
      const pending = document.createElement("p");
      pending.textContent = t("cratesReplace.readingPreview");
      el("crates-replace-preview").append(pending);
      return;
    }
    const list = document.createElement("ul");
    list.className = "merge-preview";
    const item5 = (text2) => {
      const line = document.createElement("li");
      line.textContent = text2;
      list.append(line);
    };
    const added = preview.crates_added || [];
    const kept = preview.crates_kept || [];
    const removed = preview.crates_removed || [];
    if (added.length) {
      item5(t("cratesReplace.addToCrates", { crates: added.map(replaceCrateLabel).join(", ") }));
    } else if (kept.length) {
      item5(t("cratesReplace.alreadyInCrates"));
    } else {
      item5(t("cratesReplace.noCrates"));
    }
    if (preview.retire && removed.length) {
      item5(t("cratesReplace.removeFromCrates", { crates: removed.map(replaceCrateLabel).join(", ") }));
    }
    el("crates-replace-preview").append(list);
  }
  function syncReplaceConfirm() {
    const writable = replacePreview?.writable !== false;
    el("crates-replace-confirm").disabled = replaceLoading || replaceToId == null || !replacePreview || !writable;
    el("crates-replace-confirm").textContent = replaceLoading ? t("cratesReplace.updating") : t("cratesReplace.confirm");
    setTooltip(el("crates-replace-confirm"), tips.cratesReplaceConfirm);
  }
  function renderReplaceChoices() {
    const fromId = replaceFromId;
    el("crates-replace-choices").replaceChildren();
    if (fromId == null) return;
    const ranked = rankReplaceCandidates(fromId, el("crates-replace-search").value, replaceToId ?? void 0);
    for (const track of ranked) {
      const label = document.createElement("label");
      label.className = "merge-choice";
      label.htmlFor = `crates-replace-to-${track.id}`;
      const input = inputEl(openReplaceCopy(track.file || `Track ${track.id}`));
      input.type = "radio";
      input.name = "crates-replace-to";
      input.id = `crates-replace-to-${track.id}`;
      input.value = String(track.id);
      input.checked = track.id === replaceToId;
      input.addEventListener("change", () => {
        if (!input.checked) return;
        replaceToId = track.id;
        refreshReplacePreview().catch((error2) => setNotice(failureOf(error2).message));
      });
      const text2 = document.createElement("span");
      const name = document.createElement("span");
      name.textContent = track.file || t("track.numbered", { id: String(track.id) });
      const meta = document.createElement("span");
      meta.className = "merge-meta";
      const parts = [];
      if (track.artist) parts.push(track.artist);
      if (track.name && track.name !== track.file) parts.push(track.name);
      meta.textContent = parts.join(" · ");
      text2.append(name, meta);
      label.append(input, text2);
      el("crates-replace-choices").append(label);
    }
  }
  async function refreshReplacePreview() {
    const fromId = replaceFromId;
    const toId = replaceToId;
    const token3 = ++replaceToken;
    replaceLoading = false;
    replacePreview = null;
    el("crates-replace-status").textContent = "";
    if (fromId == null || toId == null) {
      el("crates-replace-preview").replaceChildren();
      const missing = document.createElement("p");
      missing.textContent = t("cratesReplace.noReplacement");
      el("crates-replace-preview").append(missing);
      syncReplaceConfirm();
      return;
    }
    renderCratesReplacePreview(null);
    syncReplaceConfirm();
    el("crates-replace-confirm").disabled = true;
    try {
      const preview = await postJSON("/api/replace-in-crates", {
        space: state.space,
        from_id: fromId,
        to_id: toId,
        preview: true,
        retire: el("crates-replace-retire").checked
      });
      if (token3 !== replaceToken) return;
      replacePreview = preview;
      renderCratesReplacePreview(preview);
      if (preview.writable === false) {
        el("crates-replace-status").textContent = t("cratesReplace.quitSerato");
      }
      syncReplaceConfirm();
    } catch (error2) {
      if (token3 !== replaceToken) return;
      replacePreview = null;
      el("crates-replace-preview").replaceChildren();
      const failed = document.createElement("p");
      failed.textContent = t("cratesReplace.previewFailed");
      el("crates-replace-preview").append(failed);
      el("crates-replace-status").textContent = failureOf(error2).message;
      syncReplaceConfirm();
    }
  }
  async function openCratesReplaceDialog(fromId, toId) {
    if (!state.writable) return;
    if (typeof el("crates-replace-dialog").showModal !== "function") return;
    replaceFromId = fromId;
    replaceToId = toId ?? null;
    replacePreview = null;
    replaceLoading = false;
    el("crates-replace-keep").checked = true;
    el("crates-replace-retire").checked = false;
    el("crates-replace-search").value = "";
    el("crates-replace-status").textContent = "";
    renderReplaceChoices();
    if (!el("crates-replace-dialog").open) el("crates-replace-dialog").showModal();
    el("crates-replace-cancel").focus();
    await refreshReplacePreview();
  }
  async function confirmReplaceInCrates() {
    const fromId = replaceFromId;
    const toId = replaceToId;
    if (fromId == null || toId == null || replaceLoading) return;
    replaceLoading = true;
    syncReplaceConfirm();
    el("crates-replace-status").textContent = "";
    try {
      const result = await postJSON("/api/replace-in-crates", {
        space: state.space,
        from_id: fromId,
        to_id: toId,
        confirm: true,
        retire: el("crates-replace-retire").checked
      });
      el("crates-replace-dialog").close();
      const added = (result.crates_added || []).length;
      const removed = (result.crates_removed || []).length;
      const name = result.to?.file || result.to?.name || t("cratesReplace.title");
      let message = added ? t("cratesReplace.placed", { count: added, name }) : t("cratesReplace.nothingToDo");
      if (result.retire && removed) {
        message = `${message} ${t("cratesReplace.retired", { name: result.from?.file || result.from?.name || "" })}`;
      }
      if (!added && removed && result.retire) message = t("cratesReplace.updated");
      if (result.warning) message = `${message} ${result.warning}`;
      setNotice(message);
      await loadLibrary();
      if (state.byId.has(fromId)) selectTrack(fromId);
    } catch (error2) {
      el("crates-replace-status").textContent = failureOf(error2).message;
      if (failureOf(error2).status === 409) {
        lockDown(error2);
        el("crates-replace-dialog").close();
      }
    } finally {
      replaceLoading = false;
      syncReplaceConfirm();
    }
  }
  function telemetryNoteText() {
    if (!state.telemetryConfigured) {
      return t("sharing.noKeys");
    }
    if (state.telemetryConsent === true) {
      return t("sharing.canSend");
    }
    return t("sharing.nothingSent");
  }
  function applyLanguage(payload) {
    if (!("language" in payload)) return;
    const saved = isLanguage(payload.language) ? payload.language : null;
    el("language-select").value = saved ?? "";
    if (getLocale() !== PSEUDO) setLocale(resolveLocale(saved, systemLanguages()));
  }
  function systemLanguages() {
    return Array.isArray(navigator.languages) && navigator.languages.length ? [...navigator.languages] : [navigator.language || "en"];
  }
  function applyAppearance(payload) {
    const hasColorway = "colorway" in payload;
    const hasFollow = "icon_follows_theme" in payload;
    const hasHref = "icon_href" in payload;
    if (!hasColorway && !hasFollow && !hasHref) return;
    const colorway = hasColorway ? resolveColorway(payload.colorway) : resolveColorway(el("colorway-select").value);
    const follow = hasFollow ? payload.icon_follows_theme !== false : el("icon-follows-theme").checked;
    appearanceSync = true;
    if (hasColorway) el("colorway-select").value = colorway;
    if (hasFollow) el("icon-follows-theme").checked = follow;
    appearanceSync = false;
    const shown = resolveColorway(el("colorway-select").value);
    document.documentElement.dataset.colorway = shown;
    const preview = el("colorway-preview");
    preview.src = `/img/icons/placeholder-${shown}.svg`;
    preview.alt = t("settings.colorwayPreview");
    const href = hasHref && typeof payload.icon_href === "string" ? payload.icon_href : follow ? `/img/icons/placeholder-${shown}.svg` : "/img/icons/default.svg";
    const icon = document.getElementById("app-icon");
    if (icon instanceof HTMLLinkElement) icon.href = href;
  }
  function iconStatusText(icon) {
    if (!icon) return t("settings.iconSaved");
    if (!icon.follows_theme) return t("settings.iconDefault");
    if (icon.applied && icon.target === "dock") return t("settings.iconAppliedDock");
    if (icon.applied && icon.target === "window") return t("settings.iconAppliedWindow");
    if (!icon.applied && (icon.reason === "unsupported" || icon.reason === "no-window")) {
      return t("settings.iconUnsupported");
    }
    return t("settings.iconSaved");
  }
  async function saveColorway() {
    if (appearanceSync) return;
    const value = el("colorway-select").value;
    if (!isColorway(value)) return;
    document.documentElement.dataset.colorway = value;
    el("colorway-preview").src = `/img/icons/placeholder-${value}.svg`;
    el("icon-status").textContent = "";
    try {
      const payload = await postJSON("/api/settings", { colorway: value });
      applyAppearance(payload);
      el("icon-status").textContent = iconStatusText(payload.icon);
    } catch {
      el("icon-status").textContent = t("settings.iconNotSaved");
    }
  }
  async function saveIconFollow() {
    if (appearanceSync) return;
    const follow = el("icon-follows-theme").checked;
    el("icon-status").textContent = "";
    try {
      const payload = await postJSON("/api/settings", { icon_follows_theme: follow });
      applyAppearance(payload);
      el("icon-status").textContent = iconStatusText(payload.icon);
    } catch {
      el("icon-status").textContent = t("settings.iconNotSaved");
    }
  }
  async function saveLanguage() {
    const value = el("language-select").value;
    const saved = isLanguage(value) ? value : null;
    el("language-status").textContent = "";
    setLocale(resolveLocale(saved, systemLanguages()));
    try {
      await postJSON("/api/settings", { language: saved });
    } catch {
      el("language-status").textContent = t("settings.languageNotSaved");
    }
  }
  function repaintDialogs() {
    el("telemetry-note").textContent = telemetryNoteText();
    el("colorway-preview").alt = t("settings.colorwayPreview");
    if (el("merge-dialog").open) {
      renderMergePreview(mergeLoading ? null : mergePreview);
      syncTrashChoice();
    }
    if (el("crates-replace-dialog").open) {
      renderReplaceChoices();
      if (replaceToId == null) {
        el("crates-replace-preview").replaceChildren();
        const missing = document.createElement("p");
        missing.textContent = t("cratesReplace.noReplacement");
        el("crates-replace-preview").append(missing);
      } else {
        renderCratesReplacePreview(replaceLoading ? null : replacePreview);
      }
      syncReplaceConfirm();
    }
    if (el("relink-dialog").open) {
      fillRelinkBanner();
      renderRelinkRows();
    }
    if (el("files-dialog").open) {
      el("files-confirm").textContent = filesAction === "delete" ? t("files.moveToTrash") : t("common.confirm");
    }
  }
  function applyPrivacy(payload) {
    state.telemetryConsent = payload.telemetry_consent ?? null;
    state.telemetryConfigured = Boolean(payload.telemetry_configured);
    state.wizardComplete = payload.wizard_complete === true;
    privacySync = true;
    el("telemetry-toggle").checked = state.telemetryConsent === true;
    privacySync = false;
    el("telemetry-note").textContent = telemetryNoteText();
  }
  async function saveConsent(value, status) {
    status.textContent = t("wizard.saving");
    try {
      const payload = await postJSON("/api/settings", { telemetry_consent: value });
      applyPrivacy(payload);
      status.textContent = value ? t("sharing.on") : t("sharing.off");
      return true;
    } catch (error2) {
      status.textContent = t("wizard.consentFailed");
      return false;
    }
  }
  function showConsent() {
    if (typeof el("consent-dialog").showModal !== "function") return;
    if (el("consent-dialog").open) return;
    consentSettled = false;
    el("consent-status").textContent = "";
    el("consent-dialog").showModal();
    el("consent-decline").focus();
  }
  function openWizard(force, returnFocus3) {
    const wizard = globalThis.SeratoWizard;
    if (!wizard || typeof wizard.open !== "function") return false;
    const options = {
      force,
      returnFocus: returnFocus3,
      onSettings(payload) {
        applyPrivacy(payload);
      },
      onStatus(info) {
        applyStatus({
          message: info.message,
          writable: info.writable,
          open: info.open
        });
      }
    };
    wizard.open(options);
    return true;
  }
  async function loadPrivacy() {
    const token3 = rekordboxToken;
    const response = await fetch("/api/settings");
    const payload = await readJSONOr(response, {});
    if (!response.ok) throw new Error(serverMessage(payload, t("sharing.loadFailed")));
    applyPrivacy(payload);
    applyLanguage(payload);
    applyLayout(payload);
    applyAppearance(payload);
    if (token3 === rekordboxToken) applyRekordboxExport(payload);
    if (!state.wizardComplete && openWizard(false, el("search"))) return;
    if (payload.needs_consent_prompt) showConsent();
  }
  function openFilesDialog(action, trigger, scope = "paths") {
    filesAction = action;
    filesTagScope = scope;
    filesPreview = null;
    filesTrigger = trigger instanceof HTMLElement ? trigger : null;
    el("files-name-label").hidden = action !== "rename";
    el("files-replace-label").hidden = action !== "replace";
    el("files-summary").textContent = "";
    el("files-warning").textContent = "";
    el("files-dialog-status").textContent = "";
    el("files-changes").replaceChildren();
    const selected = selectedFiles();
    if (action === "rename" && selected.length === 1) el("files-name").value = selected[0].name;
    if (action === "replace") el("files-replacement").value = "";
    const confirm2 = el("files-confirm");
    confirm2.classList.toggle("danger", action === "delete");
    confirm2.textContent = action === "delete" ? t("files.moveToTrash") : t("common.confirm");
    setTooltip(confirm2, action === "delete" ? tips.filesMoveTrash : tips.filesConfirm);
    syncFilesDialog();
    el("files-dialog").showModal();
    if (action === "delete" || action === "move" || action === "move_folder" || action === "rename_from_tags") {
      el("files-cancel").focus();
      reviewFiles().catch((error2) => {
        el("files-dialog-status").textContent = failureOf(error2).message;
      });
    } else if (action === "rename") el("files-name").focus();
    else el("files-replacement").focus();
  }
  function syncFilesDialog() {
    const confirm2 = el("files-confirm");
    const review = el("files-review");
    const ready = Boolean(filesPreview?.ok && state.writable && filesPreview.needs_confirm);
    confirm2.disabled = !ready;
    review.hidden = filesAction === "delete" || filesAction === "move" || filesAction === "move_folder" || filesAction === "rename_from_tags";
    if (!state.writable) {
      el("files-dialog-status").textContent = el("status").textContent;
    }
  }
  async function reviewFiles() {
    const body = filesBody(false);
    el("files-dialog-status").textContent = t("files.checking");
    const payload = await postJSON("/api/files", body);
    filesPreview = payload;
    el("files-summary").textContent = payload.summary || "";
    el("files-warning").textContent = payload.warning || "";
    el("files-dialog-status").textContent = payload.ok ? "" : serverMessage(payload, t("files.notSaved"));
    const list = el("files-changes");
    list.replaceChildren();
    for (const change of payload.changes || []) {
      const item5 = document.createElement("li");
      const crates = Array.isArray(change.crates) && change.crates.length ? ` ${t("files.changeCrates", { crates: change.crates.join(", ") })}` : "";
      const effect = change.effect === "trash" ? t("files.trash") : change.to;
      item5.textContent = `${change.from} → ${effect}${crates}`;
      list.append(item5);
    }
    for (const skip2 of payload.skipped || []) {
      const item5 = document.createElement("li");
      item5.textContent = skip2;
      list.append(item5);
    }
    if (payload.more) {
      const more = document.createElement("li");
      more.textContent = t("files.andMore", { count: Number(payload.more) });
      list.append(more);
    }
    if (payload.serato) applyStatus(payload.serato);
    syncFilesDialog();
  }
  function filesBody(confirm2) {
    const body = { action: filesAction };
    if (confirm2) body.confirm = true;
    if (filesAction === "rename") {
      const selected = selectedFiles();
      body.path = selected[0]?.path || state.filesPickPaths[0];
      body.name = el("files-name").value;
    } else if (filesAction === "move") {
      body.paths = state.filesPickPaths.length ? [...state.filesPickPaths] : selectedFiles().map((entry) => entry.path);
      body.destination = state.filesPath;
    } else if (filesAction === "move_folder") {
      body.path = state.filesPickSource || state.filesPath;
      body.destination = state.filesPath;
    } else if (filesAction === "replace") {
      const selected = selectedFiles();
      body.path = selected[0]?.path || "";
      body.replacement = el("files-replacement").value.trim();
    } else if (filesAction === "delete") {
      body.paths = selectedFiles().map((entry) => entry.path);
    } else if (filesAction === "rename_from_tags") {
      if (filesTagScope === "crate") {
        const crate = state.activeCrate;
        if (typeof crate === "number") {
          body.crate = crate;
          body.space = state.space;
        }
      } else {
        body.paths = selectedFiles().map((entry) => entry.path);
      }
    }
    return body;
  }
  function closeFilesDialog() {
    const trigger = filesTrigger;
    filesTrigger = null;
    filesTagScope = "paths";
    if (el("files-dialog").open) el("files-dialog").close();
    if (trigger instanceof HTMLElement) trigger.focus();
  }
  async function confirmFiles() {
    if (!filesPreview?.ok || !state.writable) return;
    const confirm2 = el("files-confirm");
    confirm2.disabled = true;
    el("files-dialog-status").textContent = t("files.saving");
    const crateScope = filesAction === "rename_from_tags" && filesTagScope === "crate";
    try {
      const payload = await postJSON("/api/files", filesBody(true));
      if (payload.serato) applyStatus(payload.serato);
      closeFilesDialog();
      state.filesPick = null;
      state.filesPickPaths = [];
      state.filesPickSource = "";
      let message = payload.summary || t("files.updated");
      if (payload.warning) message = `${message} ${payload.warning}`;
      if (crateScope && state.mode !== "files") {
        setNotice(message);
        await loadLibrary();
        return;
      }
      state.filesMessage = message;
      await loadFolder(payload.browse || state.filesPath || "", { keepMessage: true });
      await loadLibrary();
      state.filesMessage = state.filesMessage;
      renderFiles();
    } catch (error2) {
      if (failureOf(error2).status === 409) lockDown(error2);
      el("files-dialog-status").textContent = failureOf(error2).message;
      confirm2.disabled = false;
    }
  }
  function relinkReason(reason) {
    if (reason === "same name and size") return t("relink.reason.nameAndSize");
    if (reason === "same name") return t("relink.reason.name");
    if (reason === "same size") return t("relink.reason.size");
    if (reason === "folder moved") return t("relink.reason.folder");
    return t("relink.reason.unknown", { reason });
  }
  function relinkConfidence(value) {
    if (value === "high") return t("relink.confidence.high");
    if (value === "medium") return t("relink.confidence.medium");
    if (value === "low") return t("relink.confidence.low");
    return value;
  }
  function chosenCandidate(match) {
    const candidates = match.candidates || [];
    const path = relinkChosen.get(match.asset_id);
    return candidates.find((item5) => item5.path === path) || candidates[0];
  }
  function selectedRelinkMatches() {
    const matches = [];
    for (const match of relinkPlan?.matches || []) {
      if (!relinkChecked.has(match.asset_id)) continue;
      const chosen = chosenCandidate(match);
      if (!chosen?.path) continue;
      matches.push({ id: match.asset_id, path: chosen.path });
    }
    return matches;
  }
  function fillRelinkBanner() {
    const banner = el("relink-banner");
    const parts = [];
    if (relinkPlan?.truncated) parts.push(t("relink.truncated"));
    const unavailable = relinkPlan?.unavailable_drives || [];
    if (unavailable.length) parts.push(t("relink.unavailable", { count: unavailable.length }));
    for (const remap of relinkPlan?.remaps || []) {
      parts.push(t("relink.remap", {
        from: remap.from || "",
        to: remap.to || "",
        count: remap.count || 0
      }));
    }
    if (typeof relinkPlan?.scanned === "number") {
      parts.push(t("relink.scanned", { count: relinkPlan.scanned }));
    }
    banner.textContent = parts.join(" ");
    banner.hidden = parts.length === 0;
  }
  function syncRelinkConfirm(refreshStatus = true) {
    const confirm2 = el("relink-confirm");
    const accept = el("relink-accept-high");
    const find = el("relink-find");
    const selected = selectedRelinkMatches();
    confirm2.disabled = relinkLoading || !state.writable || selected.length === 0;
    accept.disabled = relinkLoading || !relinkPlan;
    find.disabled = relinkLoading || !state.writable;
    if (refreshStatus && !relinkLoading && selected.length) {
      el("relink-status").textContent = t("relink.selected", { count: selected.length });
    }
  }
  function renderRelinkRows() {
    const body = el("relink-rows");
    body.replaceChildren();
    const matches = (relinkPlan?.matches || []).filter((item5) => (item5.candidates || []).length > 0);
    el("relink-empty").hidden = matches.length > 0;
    el("relink-empty").textContent = relinkPlan ? t("relink.empty") : t("relink.none");
    for (const match of matches) {
      const candidates = match.candidates || [];
      const chosen = chosenCandidate(match);
      const row = document.createElement("tr");
      const includeCell = document.createElement("td");
      const box = inputEl(tips.relinkInclude);
      box.type = "checkbox";
      box.checked = relinkChecked.has(match.asset_id);
      box.setAttribute("aria-label", t("relink.include"));
      box.addEventListener("change", () => {
        if (box.checked) relinkChecked.add(match.asset_id);
        else relinkChecked.delete(match.asset_id);
        syncRelinkConfirm();
      });
      includeCell.append(box);
      const trackCell = document.createElement("td");
      const title2 = document.createElement("div");
      title2.textContent = match.title || "";
      const artist2 = document.createElement("div");
      artist2.textContent = match.artist || "";
      trackCell.append(title2, artist2);
      const matchCell = document.createElement("td");
      if (candidates.length > 1) {
        const select = selectEl(tips.relinkPick);
        select.setAttribute("aria-label", t("relink.pick"));
        for (const candidate of candidates) {
          const option = document.createElement("option");
          option.value = candidate.path;
          option.textContent = candidate.path;
          if (candidate.path === chosen?.path) option.selected = true;
          select.append(option);
        }
        select.addEventListener("change", () => {
          relinkChosen.set(match.asset_id, select.value);
          renderRelinkRows();
        });
        matchCell.append(select);
      } else {
        const path = document.createElement("span");
        path.textContent = chosen?.path || "";
        matchCell.append(path);
      }
      const confidenceCell = document.createElement("td");
      confidenceCell.textContent = relinkConfidence(chosen?.confidence || "");
      const whyCell = document.createElement("td");
      whyCell.textContent = relinkReason(chosen?.reason || "");
      row.append(includeCell, trackCell, matchCell, confidenceCell, whyCell);
      body.append(row);
    }
    syncRelinkConfirm();
  }
  function seedRelinkChoices(plan) {
    relinkChosen.clear();
    relinkChecked.clear();
    for (const match of plan.matches || []) {
      const first = (match.candidates || [])[0];
      if (!first) continue;
      relinkChosen.set(match.asset_id, first.path);
      if (first.confidence === "high") relinkChecked.add(match.asset_id);
    }
  }
  function acceptRelinkHigh() {
    for (const match of relinkPlan?.matches || []) {
      const chosen = chosenCandidate(match);
      if (chosen?.confidence === "high" && chosen.path) {
        relinkChecked.add(match.asset_id);
      }
    }
    renderRelinkRows();
  }
  async function scanRelink() {
    if (relinkLoading || !state.writable) return;
    relinkLoading = true;
    el("relink-status").textContent = t("relink.finding");
    syncRelinkConfirm();
    try {
      const plan = await getRelink(state.space, el("relink-root").value);
      relinkPlan = plan;
      seedRelinkChoices(plan);
      fillRelinkBanner();
      renderRelinkRows();
      el("relink-status").textContent = "";
      syncRelinkConfirm();
    } catch (error2) {
      el("relink-status").textContent = failureOf(error2).message;
    } finally {
      relinkLoading = false;
      syncRelinkConfirm();
    }
  }
  async function openRelinkDialog() {
    if (!state.writable) return;
    if (typeof el("relink-dialog").showModal !== "function") return;
    el("relink-status").textContent = "";
    if (!el("relink-dialog").open) el("relink-dialog").showModal();
    el("relink-cancel").focus();
    await scanRelink();
  }
  async function confirmRelink() {
    const matches = selectedRelinkMatches();
    if (!matches.length || relinkLoading) return;
    relinkLoading = true;
    el("relink-confirm").disabled = true;
    el("relink-status").textContent = t("relink.previewing");
    try {
      const preview = await postJSON("/api/files", { action: "relink", matches });
      if (preview.serato) applyStatus(preview.serato);
      if (!preview.ok) {
        el("relink-status").textContent = preview.error || t("files.notSaved");
        return;
      }
      el("relink-status").textContent = preview.summary || t("relink.relinking");
      const result = await postJSON("/api/files", { action: "relink", matches, confirm: true });
      if (result.serato) applyStatus(result.serato);
      el("relink-dialog").close();
      let message = t("relink.done", { count: matches.length });
      if (result.summary) message = result.summary;
      if (result.warning) message = `${message} ${result.warning}`;
      setNotice(message);
      await loadLibrary();
    } catch (error2) {
      el("relink-status").textContent = failureOf(error2).message;
      if (failureOf(error2).status === 409) {
        lockDown(error2);
        el("relink-dialog").close();
      }
    } finally {
      relinkLoading = false;
      syncRelinkConfirm(false);
    }
  }
  function wireDialogs() {
    const saveExportBar = () => {
      saveRekordboxExport().catch(() => {
      });
      if (el("rekordbox-dialog").open) requestRekordboxReport();
    };
    el("rekordbox-hot-loops").addEventListener("change", saveExportBar);
    el("rekordbox-memory").addEventListener("change", saveExportBar);
    el("rekordbox-key").addEventListener("change", saveExportBar);
    loadPrivacy().catch((error2) => {
      setNotice(failureOf(error2).message || t("sharing.loadFailedOff"));
    });
    el("export-rekordbox").addEventListener("click", () => {
      if (playlistCrate() == null) return;
      requestRekordboxReport();
    });
    el("rekordbox-cancel").addEventListener("click", () => {
      rekordboxXml = "";
      el("rekordbox-dialog").close();
    });
    el("rekordbox-download").addEventListener("click", () => {
      if (!rekordboxXml.startsWith("<?xml")) {
        el("rekordbox-status").textContent = t("rekordbox.notXml");
        return;
      }
      const blob = new Blob([rekordboxXml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "rekordbox.xml";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      rekordboxXml = "";
      el("rekordbox-dialog").close();
    });
    el("merge-duplicates").addEventListener("click", () => {
      openMergeDialog().catch((error2) => setNotice(failureOf(error2).message));
    });
    el("open-relink").addEventListener("click", () => {
      openRelinkDialog().catch((error2) => setNotice(failureOf(error2).message));
    });
    el("relink-cancel").addEventListener("click", () => el("relink-dialog").close());
    el("relink-find").addEventListener("click", () => {
      scanRelink().catch((error2) => {
        el("relink-status").textContent = failureOf(error2).message;
      });
    });
    el("relink-accept-high").addEventListener("click", () => acceptRelinkHigh());
    el("relink-confirm").addEventListener("click", () => {
      confirmRelink().catch((error2) => setNotice(failureOf(error2).message));
    });
    el("merge-cancel").addEventListener("click", () => el("merge-dialog").close());
    el("merge-confirm").addEventListener("click", () => {
      confirmMerge().catch((error2) => setNotice(failureOf(error2).message));
    });
    el("merge-trash").addEventListener("change", () => syncTrashChoice());
    el("crates-replace-cancel").addEventListener("click", () => el("crates-replace-dialog").close());
    el("crates-replace-confirm").addEventListener("click", () => {
      confirmReplaceInCrates().catch((error2) => setNotice(failureOf(error2).message));
    });
    el("crates-replace-search").addEventListener("input", () => {
      renderReplaceChoices();
    });
    el("crates-replace-keep").addEventListener("change", () => {
      if (el("crates-replace-keep").checked) {
        refreshReplacePreview().catch((error2) => setNotice(failureOf(error2).message));
      }
    });
    el("crates-replace-retire").addEventListener("change", () => {
      if (el("crates-replace-retire").checked) {
        refreshReplacePreview().catch((error2) => setNotice(failureOf(error2).message));
      }
    });
    el("consent-decline").addEventListener("click", () => {
      saveConsent(false, el("consent-status")).then((ok) => {
        if (!ok) return;
        consentSettled = true;
        el("consent-dialog").close();
      });
    });
    el("consent-accept").addEventListener("click", () => {
      saveConsent(true, el("consent-status")).then((ok) => {
        if (!ok) return;
        consentSettled = true;
        el("consent-dialog").close();
      });
    });
    el("consent-dialog").addEventListener("close", () => {
      if (consentSettled || state.telemetryConsent !== null) return;
      saveConsent(false, el("consent-status")).then((ok) => {
        if (ok) {
          consentSettled = true;
          return;
        }
        el("consent-dialog").showModal();
      });
    });
    el("open-settings").addEventListener("click", () => {
      el("settings-status").textContent = "";
      el("log-fallback").hidden = true;
      el("telemetry-note").textContent = telemetryNoteText();
      el("settings-dialog").showModal();
    });
    el("language-select").addEventListener("change", () => {
      void saveLanguage();
    });
    el("colorway-select").addEventListener("change", () => {
      void saveColorway();
    });
    el("icon-follows-theme").addEventListener("change", () => {
      void saveIconFollow();
    });
    el("settings-close").addEventListener("click", () => {
      el("settings-dialog").close();
    });
    el("rerun-wizard").addEventListener("click", () => {
      el("settings-dialog").close();
      openWizard(true, el("open-settings"));
    });
    el("telemetry-toggle").addEventListener("change", () => {
      if (privacySync) return;
      const want = el("telemetry-toggle").checked;
      el("telemetry-toggle").disabled = true;
      saveConsent(want, el("settings-status")).then((ok) => {
        el("telemetry-toggle").disabled = false;
        if (ok) {
          consentSettled = true;
          return;
        }
        privacySync = true;
        el("telemetry-toggle").checked = state.telemetryConsent === true;
        privacySync = false;
      });
    });
    el("open-logs").addEventListener("click", () => {
      const button2 = el("open-logs");
      button2.disabled = true;
      el("settings-status").textContent = t("wizard.opening");
      postJSON("/api/logs/open", {}).then(() => {
        el("settings-status").textContent = t("logs.opened");
      }).catch(() => {
        el("settings-status").textContent = t("logs.openFailed");
      }).finally(() => {
        button2.disabled = false;
      });
    });
    el("copy-logs").addEventListener("click", async () => {
      const button2 = el("copy-logs");
      button2.disabled = true;
      el("settings-status").textContent = t("logs.copying");
      try {
        const response = await fetch("/api/logs");
        const payload = await readJSONOr(response, {});
        if (!response.ok) throw new Error(serverMessage(payload, t("logs.copyFailed")));
        const text2 = payload.text || "";
        if (!text2) {
          el("settings-status").textContent = t("logs.empty");
          return;
        }
        let copied = false;
        if (navigator.clipboard && window.isSecureContext) {
          try {
            await navigator.clipboard.writeText(text2);
            copied = true;
          } catch (error2) {
            copied = false;
          }
        }
        if (copied) {
          el("log-fallback").hidden = true;
          el("settings-status").textContent = payload.truncated ? t("logs.copiedTruncated") : t("logs.copied");
          return;
        }
        el("log-fallback").hidden = false;
        el("log-fallback").value = text2;
        el("log-fallback").focus();
        el("log-fallback").select();
        el("settings-status").textContent = t("logs.copyManual");
      } catch (error2) {
        el("settings-status").textContent = t("logs.copyFailed");
      } finally {
        button2.disabled = false;
      }
    });
    el("files-up").addEventListener("click", () => {
      if (state.filesParent) {
        loadFolder(state.filesParent, { elsewhere: state.filesElsewhere }).catch((error2) => failFiles(error2));
      }
    });
    el("files-refresh").addEventListener("click", () => {
      const path = state.filesAtRoots ? "" : state.filesPath;
      loadFolder(path, { elsewhere: state.filesElsewhere && !state.filesAtRoots, refresh: true }).catch((error2) => failFiles(error2));
    });
    el("files-elsewhere").addEventListener("click", () => {
      if (state.filesElsewhere) loadFolder("").catch((error2) => failFiles(error2));
      else loadFolder("", { elsewhere: true }).catch((error2) => failFiles(error2));
    });
    el("files-rename").addEventListener("click", (event) => {
      if (selectedFiles().length !== 1) {
        state.filesError = t("files.chooseOneRename");
        renderFiles();
        return;
      }
      openFilesDialog("rename", event.currentTarget);
    });
    el("files-rename-from-tags").addEventListener("click", (event) => {
      if (!selectedFiles().length) {
        state.filesError = t("files.chooseRenameFromTags");
        renderFiles();
        return;
      }
      openFilesDialog("rename_from_tags", event.currentTarget, "paths");
    });
    el("crate-rename-from-tags").addEventListener("click", (event) => {
      const crate = state.activeCrate;
      if (typeof crate !== "number") return;
      openFilesDialog("rename_from_tags", event.currentTarget, "crate");
    });
    el("files-move").addEventListener("click", () => {
      const selected = selectedFiles();
      if (!selected.length) {
        state.filesError = t("files.chooseMove");
        renderFiles();
        return;
      }
      state.filesPick = "move";
      state.filesPickPaths = selected.map((entry) => entry.path);
      state.filesError = "";
      state.filesMessage = t("files.chooseDestination");
      renderFiles();
    });
    el("files-move-folder").addEventListener("click", () => {
      state.filesPick = "move_folder";
      state.filesPickSource = state.filesPath;
      state.filesError = "";
      state.filesMessage = t("files.chooseDestination");
      renderFiles();
    });
    el("files-move-here").addEventListener("click", (event) => {
      openFilesDialog(state.filesPick === "move_folder" ? "move_folder" : "move", event.currentTarget);
    });
    el("files-pick-cancel").addEventListener("click", () => {
      state.filesPick = null;
      state.filesPickPaths = [];
      state.filesPickSource = "";
      state.filesMessage = "";
      renderFiles();
    });
    el("files-replace").addEventListener("click", (event) => {
      if (selectedFiles().length !== 1) {
        state.filesError = t("files.chooseOneReplace");
        renderFiles();
        return;
      }
      openFilesDialog("replace", event.currentTarget);
    });
    el("files-delete").addEventListener("click", (event) => {
      if (!selectedFiles().length) {
        state.filesError = t("files.chooseDelete");
        renderFiles();
        return;
      }
      openFilesDialog("delete", event.currentTarget);
    });
    el("files-review").addEventListener("click", () => {
      reviewFiles().catch((error2) => {
        el("files-dialog-status").textContent = failureOf(error2).message;
      });
    });
    el("files-confirm").addEventListener("click", () => {
      confirmFiles().catch((error2) => {
        el("files-dialog-status").textContent = failureOf(error2).message;
      });
    });
    el("files-cancel").addEventListener("click", () => closeFilesDialog());
    el("files-name").addEventListener("input", () => {
      filesPreview = null;
      syncFilesDialog();
    });
    el("files-replacement").addEventListener("input", () => {
      filesPreview = null;
      syncFilesDialog();
    });
    el("files-dialog").addEventListener("cancel", (event) => {
      event.preventDefault();
      closeFilesDialog();
    });
  }
  bridge.openMergeDialog = openMergeDialog;
  bridge.openReplaceInCratesDialog = openCratesReplaceDialog;
  function openSetup() {
    const trigger = document.getElementById("files-run-setup");
    openWizard(true, trigger instanceof HTMLElement ? trigger : el("search"));
  }
  bridge.openSetup = openSetup;

  // src/help.ts
  var kind = "bug";
  function wireHelp() {
    el("open-help").addEventListener("click", () => {
      el("help-dialog").showModal();
    });
    el("help-close").addEventListener("click", () => {
      el("help-dialog").close();
    });
    el("help-bug").addEventListener("click", () => {
      void openReport("bug");
    });
    el("help-feature").addEventListener("click", () => {
      void openReport("feature");
    });
    el("help-report-close").addEventListener("click", () => {
      el("help-report-dialog").close();
    });
    el("help-open-github").addEventListener("click", () => {
      void submitReport();
    });
    for (const [id, page] of [
      ["help-github", "repo"],
      ["help-releases", "releases"],
      ["about-github", "repo"]
    ]) {
      el(id).addEventListener("click", (event) => {
        event.preventDefault();
        void openPage(page);
      });
    }
    el("help-copy-log").addEventListener("click", () => {
      void copyLog();
    });
    document.addEventListener("serato-locale", () => {
      if (el("help-report-dialog").open) paintReport2();
    });
  }
  async function openReport(next2) {
    kind = next2;
    el("help-happened").value = "";
    el("help-expected").value = "";
    el("help-names").checked = false;
    el("help-log-fallback").hidden = true;
    el("help-report-status").textContent = "";
    el("help-diagnostics").textContent = t("help.loading");
    paintReport2();
    el("help-dialog").close();
    el("help-report-dialog").showModal();
    try {
      const response = await fetch("/api/help");
      const payload = await readJSONOr(response, {});
      if (!response.ok) throw new Error(serverMessage(payload, t("help.loadFailed")));
      el("help-diagnostics").textContent = payload.diagnostics || t("help.loadFailed");
    } catch {
      el("help-diagnostics").textContent = t("help.loadFailed");
    }
  }
  function paintReport2() {
    const feature = kind === "feature";
    el("help-report-title").textContent = t(feature ? "help.featureTitle" : "help.bugTitle");
    el("help-happened-name").textContent = t(feature ? "help.change" : "help.happened");
    el("help-expected-label").hidden = feature;
  }
  async function submitReport() {
    const button2 = el("help-open-github");
    button2.disabled = true;
    el("help-report-status").textContent = t("help.opening");
    try {
      const response = await fetch("/api/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          happened: el("help-happened").value,
          expected: el("help-expected").value,
          change: kind === "feature" ? el("help-happened").value : "",
          include_names: el("help-names").checked,
          open: true
        })
      });
      const payload = await readJSONOr(response, {});
      if (!response.ok) throw new Error(serverMessage(payload, t("help.loadFailed")));
      if (payload.opened === true) {
        el("help-report-status").textContent = t("help.opened");
        return;
      }
      const copied = await copyText(payload.text || "");
      if (!copied) {
        el("help-log-fallback").hidden = false;
        el("help-log-fallback").value = payload.text || "";
        el("help-report-status").textContent = t("help.copyFailed");
        return;
      }
      const linked = (payload.url || "").includes("diagnostics=");
      el("help-report-status").textContent = linked ? t("help.copied") : t("help.tooLong");
    } catch {
      el("help-report-status").textContent = t("help.loadFailed");
    } finally {
      button2.disabled = false;
    }
  }
  async function copyLog() {
    const names = el("help-names").checked ? "1" : "0";
    el("help-report-status").textContent = t("logs.copying");
    try {
      const response = await fetch(`/api/help?include_names=${names}`);
      const payload = await readJSONOr(response, {});
      if (!response.ok) throw new Error(serverMessage(payload, t("help.copyFailed")));
      const text2 = payload.log || "";
      if (!text2) {
        el("help-report-status").textContent = t("help.logEmpty");
        return;
      }
      const copied = await copyText(text2);
      if (copied) {
        el("help-log-fallback").hidden = true;
        el("help-report-status").textContent = payload.log_truncated ? t("logs.copiedTruncated") : t("help.logCopied");
        return;
      }
      el("help-log-fallback").hidden = false;
      el("help-log-fallback").value = text2;
      el("help-log-fallback").focus();
      el("help-log-fallback").select();
      el("help-report-status").textContent = t("logs.copyManual");
    } catch {
      el("help-report-status").textContent = t("help.copyFailed");
    }
  }
  async function copyText(text2) {
    if (!text2 || !navigator.clipboard || !window.isSecureContext) return false;
    try {
      await navigator.clipboard.writeText(text2);
      return true;
    } catch {
      return false;
    }
  }
  async function openPage(page) {
    try {
      await fetch("/api/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page })
      });
    } catch {
    }
  }

  // src/quick-open.ts
  var QUICK_OPEN_MS = 200;
  var LIMIT = 8;
  var returnFocus = null;
  var timer2 = 0;
  var requestToken = 0;
  var hits = [];
  var active = 0;
  var phase = "idle";
  var truncated = false;
  var pendingQuery = "";
  function parentDirectory(path) {
    const slash = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
    if (slash < 0) return path;
    const parent = path.slice(0, slash);
    if (/^[A-Za-z]:$/.test(parent)) return `${parent}\\`;
    if (parent === "") return path.slice(0, slash + 1);
    return parent;
  }
  function quickOpenIsOpen() {
    return el("quick-open").open;
  }
  function labelQuickOpen() {
    el("quick-open-title").textContent = t("quickOpen.title");
    el("quick-open-label").textContent = t("quickOpen.label");
    el("quick-open-query").placeholder = t("quickOpen.placeholder");
    el("quick-open-close").textContent = t("common.close");
    el("quick-open-retry").textContent = t("common.tryAgain");
    el("quick-open-list").setAttribute("aria-label", t("quickOpen.matches"));
  }
  function repaintQuickOpen() {
    const dialog = document.getElementById("quick-open");
    if (!(dialog instanceof HTMLDialogElement) || !dialog.open) return;
    labelQuickOpen();
    paint();
  }
  function openQuickOpen() {
    const dialog = el("quick-open");
    if (dialog.open) return;
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    pendingQuery = "";
    hits = [];
    active = 0;
    phase = "idle";
    truncated = false;
    window.clearTimeout(timer2);
    el("quick-open-query").value = "";
    labelQuickOpen();
    paint();
    dialog.showModal();
    el("quick-open-query").focus();
  }
  function closeQuickOpen() {
    const dialog = el("quick-open");
    if (dialog.open) dialog.close();
  }
  function wireQuickOpen() {
    const dialog = el("quick-open");
    dialog.addEventListener("keydown", onDialogKey);
    dialog.addEventListener("close", () => {
      window.clearTimeout(timer2);
      const node = returnFocus;
      returnFocus = null;
      if (node && node.isConnected) node.focus();
    });
    el("quick-open-query").addEventListener("input", () => schedule2());
    el("quick-open-close").addEventListener("click", () => closeQuickOpen());
    el("quick-open-retry").addEventListener("click", () => {
      const query = el("quick-open-query").value.trim();
      if (query) void loadFiles(query, trackHits(query));
    });
  }
  function onDialogKey(event) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Enter") return;
    if (!hits.length && event.key !== "Enter") return;
    event.preventDefault();
    if (event.key === "ArrowDown") active = Math.min(hits.length - 1, active + 1);
    else if (event.key === "ArrowUp") active = Math.max(0, active - 1);
    else {
      const chosen = hits[active];
      if (chosen) void activate(chosen);
    }
    if (event.key !== "Enter") paint();
  }
  function schedule2() {
    window.clearTimeout(timer2);
    const query = el("quick-open-query").value;
    pendingQuery = query;
    const tracks = trackHits(query);
    hits = tracks;
    active = 0;
    truncated = false;
    if (!query.trim()) {
      phase = "idle";
      requestToken += 1;
      paint();
      return;
    }
    phase = "loading";
    paint();
    timer2 = window.setTimeout(() => {
      void loadFiles(query.trim(), tracks);
    }, QUICK_OPEN_MS);
  }
  async function loadFiles(query, tracks) {
    const token3 = ++requestToken;
    phase = "loading";
    try {
      const response = await fetch(`/api/files?q=${encodeURIComponent(query)}`);
      const payload = await readJSONOr(response, {});
      if (token3 !== requestToken) return;
      if (!response.ok) throw new Error(payload.error || t("quickOpen.fileError"));
      const files = fileHits(payload);
      hits = mergeHits(tracks, files);
      truncated = Boolean(payload.truncated);
      phase = "ready";
      if (active >= hits.length) active = Math.max(0, hits.length - 1);
      paint();
    } catch {
      if (token3 !== requestToken) return;
      hits = tracks;
      phase = "error";
      paint();
    }
  }
  function trackHits(query) {
    const text2 = query.trim();
    if (!text2) return [];
    const found = [];
    for (const track of state.tracks) {
      const hit = scoreTrack(track, text2);
      if (hit) found.push(hit);
    }
    found.sort(byScore);
    return found.slice(0, LIMIT);
  }
  function scoreTrack(track, query) {
    const title2 = track.name || "Untitled";
    const artist2 = track.artist ?? "";
    const album = track.album ?? "";
    const file = track.file ?? "";
    const score = scoreQuery(query, `${title2} ${artist2} ${album} ${file}`);
    if (score == null) return null;
    const detail = [artist2, album].filter((part) => part !== "").join(" · ");
    return { kind: "track", key: `track:${track.id}`, title: title2, detail, score, trackId: track.id };
  }
  function fileHits(payload) {
    const rows2 = Array.isArray(payload.entries) ? payload.entries : [];
    const found = [];
    for (const entry of rows2) {
      if (!isFileEntry(entry)) continue;
      const score = typeof entry.score === "number" ? entry.score : 0;
      found.push({
        kind: "file",
        key: `file:${entry.path}`,
        title: entry.name,
        detail: entry.detail || entry.path,
        score,
        path: entry.path
      });
    }
    found.sort(byScore);
    return found.slice(0, LIMIT);
  }
  function isFileEntry(value) {
    if (!value || typeof value !== "object") return false;
    const row = value;
    return typeof row.name === "string" && typeof row.path === "string" && typeof row.kind === "string";
  }
  function mergeHits(tracks, files) {
    return [...tracks, ...files].sort(byScore).slice(0, LIMIT * 2);
  }
  function byScore(left, right) {
    return right.score - left.score || left.title.localeCompare(right.title);
  }
  async function activate(hit) {
    closeQuickOpen();
    if (hit.kind === "track") {
      if (state.mode === "files" || state.mode === "snapshots" || state.mode === "history") setMode("crates");
      selectCrate("all");
      await selectTrack(hit.trackId);
      const index = state.view.findIndex((row) => row.id === hit.trackId);
      if (index >= 0) el("list").scrollTop = index * ROW;
      return;
    }
    setMode("files");
    await loadFolder(parentDirectory(hit.path));
    focusFileByPath(hit.path);
  }
  function paint() {
    const status = el("quick-open-status");
    const list = el("quick-open-list");
    const retry = el("quick-open-retry");
    const query = pendingQuery.trim();
    retry.hidden = phase !== "error";
    list.replaceChildren();
    if (!query) status.textContent = t("quickOpen.empty");
    else if (phase === "loading") status.textContent = t("quickOpen.searching");
    else if (phase === "error") status.textContent = t("quickOpen.fileError");
    else if (!hits.length) status.textContent = t("quickOpen.none", { query });
    else status.textContent = truncated ? t("quickOpen.truncated") : t("quickOpen.matchCount", { count: hits.length });
    hits.forEach((hit, index) => {
      const item5 = document.createElement("li");
      const button2 = buttonEl(quickOpenHit(
        hit.kind === "track" ? t("quickOpen.track") : t("quickOpen.file"),
        hit.title,
        hit.detail
      ));
      button2.className = "quick-open-option";
      button2.id = `quick-open-option-${index}`;
      button2.setAttribute("role", "option");
      button2.setAttribute("aria-selected", String(index === active));
      button2.tabIndex = -1;
      if (index === active) button2.classList.add("is-active");
      const kind2 = document.createElement("span");
      kind2.className = "quick-open-kind";
      kind2.textContent = hit.kind === "track" ? t("quickOpen.track") : t("quickOpen.file");
      const title2 = document.createElement("span");
      title2.className = "quick-open-name";
      title2.textContent = hit.title;
      const detail = document.createElement("span");
      detail.className = "quick-open-detail";
      detail.textContent = hit.detail;
      button2.append(kind2, title2, detail);
      button2.addEventListener("click", () => {
        active = index;
        void activate(hit);
      });
      item5.append(button2);
      list.append(item5);
    });
    const field = el("quick-open-query");
    const current2 = hits[active];
    if (current2) field.setAttribute("aria-activedescendant", `quick-open-option-${active}`);
    else field.removeAttribute("aria-activedescendant");
    const chosen = list.querySelector(".is-active");
    if (chosen && typeof chosen.scrollIntoView === "function") chosen.scrollIntoView({ block: "nearest" });
  }

  // src/shortcuts.ts
  var SEEK_SECONDS = 5;
  var SHORTCUT_DEFS = [
    {
      id: "focus-search",
      label: "Focus search",
      group: "Find",
      keys: [{ key: "f", mod: true }, { key: "/" }],
      whileTyping: false
    },
    {
      id: "quick-open",
      label: "Find a track or file",
      group: "Find",
      keys: [{ key: "k", mod: true }],
      whileTyping: false
    },
    {
      id: "dismiss",
      label: "Close or clear search",
      group: "Find",
      keys: [{ key: "Escape" }],
      whileTyping: true
    },
    {
      id: "cheat-sheet",
      label: "Show shortcuts",
      group: "Find",
      keys: [{ key: "?" }],
      whileTyping: false
    },
    {
      id: "list-previous",
      label: "Previous row",
      group: "Lists",
      keys: [{ key: "ArrowUp" }],
      whileTyping: false
    },
    {
      id: "list-next",
      label: "Next row",
      group: "Lists",
      keys: [{ key: "ArrowDown" }],
      whileTyping: false
    },
    {
      id: "list-open",
      label: "Open the row",
      group: "Lists",
      keys: [{ key: "Enter" }],
      whileTyping: false
    },
    {
      id: "play-pause",
      label: "Play or pause",
      group: "Play",
      keys: [{ key: " " }],
      whileTyping: false
    },
    {
      id: "seek-back",
      label: "Back 5 seconds",
      group: "Play",
      keys: [{ key: "ArrowLeft" }],
      whileTyping: false
    },
    {
      id: "seek-forward",
      label: "Forward 5 seconds",
      group: "Play",
      keys: [{ key: "ArrowRight" }],
      whileTyping: false
    },
    {
      id: "view-library",
      label: "Library",
      group: "Views",
      keys: [{ key: "1", mod: true }],
      whileTyping: false
    },
    {
      id: "view-crates",
      label: "Crates",
      group: "Views",
      keys: [{ key: "2", mod: true }],
      whileTyping: false
    },
    {
      id: "view-files",
      label: "Organize files",
      group: "Views",
      keys: [{ key: "3", mod: true }],
      whileTyping: false
    },
    {
      id: "view-history",
      label: "History",
      group: "Views",
      keys: [{ key: "4", mod: true }],
      whileTyping: false
    },
    {
      id: "view-snapshots",
      label: "Backups",
      group: "Views",
      keys: [{ key: "5", mod: true }],
      whileTyping: false
    }
  ];
  var SHORTCUTS = SHORTCUT_DEFS;
  var LABEL_KEY = {
    "focus-search": "shortcuts.focusSearch",
    "quick-open": "shortcuts.quickOpen",
    dismiss: "shortcuts.dismiss",
    "cheat-sheet": "shortcuts.cheatSheet",
    "list-previous": "shortcuts.listPrevious",
    "list-next": "shortcuts.listNext",
    "list-open": "shortcuts.listOpen",
    "play-pause": "shortcuts.playPause",
    "seek-back": "shortcuts.seekBack",
    "seek-forward": "shortcuts.seekForward",
    "view-library": "shortcuts.viewLibrary",
    "view-crates": "shortcuts.viewCrates",
    "view-files": "shortcuts.viewFiles",
    "view-history": "shortcuts.viewHistory",
    "view-snapshots": "shortcuts.viewSnapshots"
  };
  var GROUP_KEY = {
    Find: "shortcuts.groupFind",
    Lists: "shortcuts.groupLists",
    Play: "shortcuts.groupPlay",
    Views: "shortcuts.groupViews"
  };
  var player = null;
  var returnFocus2 = null;
  var snapshotCursor = 0;
  function registerPlayerControls(controls) {
    player = controls;
  }
  function chordMatches(chord, event) {
    if (event.altKey) return false;
    const mod = event.ctrlKey || event.metaKey;
    if (mod !== Boolean(chord.mod)) return false;
    if (chord.key === "?") return event.key === "?" && !mod;
    if (event.shiftKey !== Boolean(chord.shift)) return false;
    if (chord.key === " ") return event.key === " ";
    return event.key === chord.key || event.key.toLowerCase() === chord.key.toLowerCase();
  }
  function matchShortcut(event) {
    for (const shortcut of SHORTCUTS) {
      if (shortcut.keys.some((chord) => chordMatches(chord, event))) return shortcut;
    }
    return null;
  }
  function chordLabel(chord) {
    const names = {
      Escape: "Esc",
      " ": "Space",
      ArrowLeft: "Left arrow",
      ArrowRight: "Right arrow",
      ArrowUp: "Up arrow",
      ArrowDown: "Down arrow",
      Enter: "Enter"
    };
    const named = names[chord.key];
    if (named) return named;
    const key = chord.key.length === 1 ? chord.key.toUpperCase() : chord.key;
    return chord.mod ? `Ctrl/Cmd+${key}` : key;
  }
  function isTypingTarget(target) {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    const field = target.closest("input, textarea, select");
    if (!(field instanceof HTMLElement)) return false;
    if (field instanceof HTMLInputElement) {
      const inert = /* @__PURE__ */ new Set(["button", "checkbox", "radio", "file", "range", "color", "submit", "reset"]);
      if (inert.has(field.type)) return false;
    }
    return true;
  }
  function openCheatSheet() {
    const dialog = el("settings-dialog");
    renderCheatSheet();
    if (!dialog.open) {
      rememberFocus();
      dialog.showModal();
    }
    const title2 = el("shortcuts-title");
    title2.tabIndex = -1;
    title2.focus();
    if (typeof title2.scrollIntoView === "function") title2.scrollIntoView({ block: "nearest" });
  }
  function wireShortcuts() {
    document.removeEventListener("keydown", onKey);
    document.addEventListener("keydown", onKey);
    const dialog = el("settings-dialog");
    dialog.removeEventListener("close", onSettingsClose);
    dialog.addEventListener("close", onSettingsClose);
    renderCheatSheet();
    wireQuickOpen();
  }
  function onSettingsClose() {
    restoreFocus();
  }
  function onKey(event) {
    if (event.isComposing || event.defaultPrevented) return;
    const shortcut = matchShortcut(event);
    if (!shortcut) return;
    if (isTypingTarget(event.target) && !shortcut.whileTyping) return;
    if (shortcut.id !== "dismiss" && topDialog()) return;
    if (skipsListKey(shortcut.id, event.target)) return;
    if (event.repeat && !repeats(shortcut.id)) return;
    runShortcut(shortcut.id, event);
  }
  function repeats(id) {
    return id === "list-previous" || id === "list-next" || id === "seek-back" || id === "seek-forward";
  }
  function skipsListKey(id, target) {
    if (!(target instanceof HTMLElement)) return false;
    if (id === "play-pause" && target.closest("button, a, summary, input, select, textarea, [role='button']")) return true;
    if (id === "list-open" && target.closest("button, a, summary, textarea, select")) return true;
    return false;
  }
  function topDialog() {
    const open = [...document.querySelectorAll("dialog")].filter(
      (node) => node instanceof HTMLDialogElement && node.open
    );
    return open.at(-1) ?? null;
  }
  var HANDLERS = {
    "focus-search": (event) => {
      event.preventDefault();
      focusCurrentSearch();
    },
    "quick-open": (event) => {
      event.preventDefault();
      openQuickOpen();
    },
    dismiss: (event) => {
      dismiss(event);
    },
    "cheat-sheet": (event) => {
      event.preventDefault();
      openCheatSheet();
    },
    "list-previous": (event) => {
      event.preventDefault();
      moveActiveList(-1);
    },
    "list-next": (event) => {
      event.preventDefault();
      moveActiveList(1);
    },
    "list-open": (event) => {
      event.preventDefault();
      openActiveList();
    },
    "play-pause": (event) => {
      if (!player) return;
      event.preventDefault();
      player.togglePlayPause();
    },
    "seek-back": (event) => {
      if (!player) return;
      event.preventDefault();
      player.seekBy(-SEEK_SECONDS);
    },
    "seek-forward": (event) => {
      if (!player) return;
      event.preventDefault();
      player.seekBy(SEEK_SECONDS);
    },
    "view-library": (event) => {
      event.preventDefault();
      showLibrary();
    },
    "view-crates": (event) => {
      event.preventDefault();
      showCrates();
    },
    "view-files": (event) => {
      event.preventDefault();
      setMode("files");
      el("files-list").focus();
    },
    "view-history": (event) => {
      event.preventDefault();
      setMode("history");
      el("list").focus();
    },
    "view-snapshots": (event) => {
      event.preventDefault();
      setMode("snapshots");
      snapshotCursor = 0;
      el("snapshots-list").focus();
    }
  };
  function runShortcut(id, event) {
    const handler = HANDLERS[id];
    handler(event);
  }
  function focusCurrentSearch() {
    if (state.mode === "files") {
      const field2 = el("files-search");
      field2.focus();
      field2.select();
      return;
    }
    if (state.mode === "snapshots") {
      el("snapshots-status").textContent = t("snapshots.noSearch");
      return;
    }
    const field = el("search");
    field.focus();
    field.select();
  }
  function showLibrary() {
    setMode("crates");
    selectCrate("all");
    el("list").focus();
  }
  function showCrates() {
    setMode("crates");
    const first = el("crate-list").querySelector(".crate");
    if (first) focusCrateItem(first);
    else el("crate-list").focus();
  }
  function moveActiveList(delta) {
    if (quickOpenIsOpen()) return;
    if (state.mode === "files") {
      moveFileList(delta);
      return;
    }
    if (state.mode === "snapshots") {
      moveSnapshots(delta);
      return;
    }
    moveTrackList(delta);
  }
  function openActiveList() {
    if (quickOpenIsOpen()) return;
    if (state.mode === "files") {
      openFileList();
      return;
    }
    if (state.mode === "snapshots") {
      openSnapshot();
      return;
    }
    openTrackList();
  }
  function moveSnapshots(delta) {
    const cards = snapshotCards();
    if (!cards.length) return;
    snapshotCursor = Math.max(0, Math.min(cards.length - 1, snapshotCursor + delta));
    const card = cards[snapshotCursor];
    card?.querySelector("button")?.focus();
  }
  function openSnapshot() {
    const cards = snapshotCards();
    const card = cards[snapshotCursor] ?? cards[0];
    card?.querySelector("button")?.click();
  }
  function snapshotCards() {
    return [...el("snapshots-list").querySelectorAll(".snapshot-card")];
  }
  function dismiss(event) {
    const dialog = topDialog();
    if (dialog) {
      if (dialog.id === "quick-open") {
        event.preventDefault();
        closeQuickOpen();
        return;
      }
      if (dialog.id === "settings-dialog") {
        event.preventDefault();
        dialog.close();
        return;
      }
      return;
    }
    const active2 = document.activeElement;
    if (active2 instanceof HTMLInputElement && isSearchField(active2)) {
      event.preventDefault();
      if (active2.value) replaceInput(active2, "");
      else active2.blur();
      return;
    }
    if (isTypingTarget(active2)) {
      if (active2 instanceof HTMLElement) active2.blur();
      return;
    }
    if (clearViewSearch()) event.preventDefault();
  }
  function isSearchField(field) {
    return field.id === "search" || field.id === "crate-search" || field.id === "files-search" || field.id === "quick-open-query";
  }
  function clearViewSearch() {
    if (state.mode === "files" && el("files-search").value) {
      replaceInput(el("files-search"), "");
      return true;
    }
    if (state.mode === "crates" && el("crate-search").value && !el("search").value) {
      replaceInput(el("crate-search"), "");
      return true;
    }
    if (el("search").value) {
      replaceInput(el("search"), "");
      return true;
    }
    if (el("crate-search").value) {
      replaceInput(el("crate-search"), "");
      return true;
    }
    return false;
  }
  function replaceInput(field, value) {
    field.value = value;
    field.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function repaintCheatSheet() {
    if (!document.getElementById("shortcuts-body")) return;
    renderCheatSheet();
  }
  function renderCheatSheet() {
    const title2 = el("shortcuts-title");
    title2.textContent = t("shortcuts.title");
    setTooltip(title2, tips.shortcuts);
    el("shortcuts-intro").textContent = t("shortcuts.intro");
    const body = el("shortcuts-body");
    body.replaceChildren();
    const groups = [];
    for (const shortcut of SHORTCUTS) {
      if (!groups.includes(shortcut.group)) groups.push(shortcut.group);
    }
    for (const group of groups) {
      const heading2 = document.createElement("h3");
      heading2.textContent = t(GROUP_KEY[group]);
      body.append(heading2);
      if (group === "Play") {
        const note = document.createElement("p");
        note.className = "dialog-note";
        note.textContent = t("shortcuts.playNote");
        body.append(note);
      }
      const table = document.createElement("table");
      table.className = "shortcut-table";
      const head = document.createElement("thead");
      const headRow = document.createElement("tr");
      const actionHead = document.createElement("th");
      actionHead.scope = "col";
      actionHead.textContent = t("shortcuts.action");
      const keyHead = document.createElement("th");
      keyHead.scope = "col";
      keyHead.textContent = t("shortcuts.key");
      headRow.append(actionHead, keyHead);
      head.append(headRow);
      const rows2 = document.createElement("tbody");
      for (const shortcut of SHORTCUTS) {
        if (shortcut.group !== group) continue;
        const row = document.createElement("tr");
        const action = document.createElement("th");
        action.scope = "row";
        action.textContent = t(LABEL_KEY[shortcut.id]);
        const keys = document.createElement("td");
        shortcut.keys.forEach((chord, index) => {
          if (index > 0) keys.append(document.createTextNode(" or "));
          const kbd = document.createElement("kbd");
          kbd.textContent = chordLabel(chord);
          keys.append(kbd);
        });
        row.append(action, keys);
        rows2.append(row);
      }
      table.append(head, rows2);
      body.append(table);
    }
  }
  function rememberFocus() {
    returnFocus2 = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }
  function restoreFocus() {
    const node = returnFocus2;
    returnFocus2 = null;
    if (node && node.isConnected) node.focus();
  }

  // src/update.ts
  var UPDATE_CHOICE_EVENT = "serato-update-choice";
  var latest9 = null;
  var dismissed = false;
  var token2 = 0;
  var wired2 = false;
  function parseUpdateStatus(value) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
    const body = value;
    const enabled = body.enabled;
    if (enabled !== null && typeof enabled !== "boolean") return null;
    if (typeof body.update !== "boolean" || typeof body.current !== "string") return null;
    let release = null;
    const raw = body.latest;
    if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
      const item5 = raw;
      if (typeof item5.version === "string" && typeof item5.url === "string") {
        release = { version: item5.version, url: item5.url, prerelease: item5.prerelease === true };
      }
    }
    return {
      enabled,
      include_prereleases: body.include_prereleases === true,
      current: body.current,
      update: body.update && release !== null,
      latest: release
    };
  }
  async function loadUpdate() {
    const mine = ++token2;
    try {
      const response = await fetch("/api/update");
      const body = response.ok ? await response.json() : null;
      if (mine !== token2) return;
      latest9 = parseUpdateStatus(body);
    } catch {
      if (mine !== token2) return;
      latest9 = null;
    }
    paintUpdate();
  }
  function paintUpdate() {
    const status = latest9;
    const toggle = el("update-toggle");
    const pre = el("update-prereleases");
    toggle.checked = status?.enabled === true;
    pre.checked = status?.include_prereleases === true;
    pre.disabled = status?.enabled !== true;
    const banner = el("update-banner");
    const release = status?.latest ?? null;
    if (!status || status.enabled !== true || !status.update || !release || dismissed) {
      banner.hidden = true;
      return;
    }
    const key = release.prerelease ? "update.availableTest" : "update.available";
    el("update-text").textContent = t(key, { version: release.version, current: status.current });
    banner.hidden = false;
  }
  function repaintUpdate() {
    paintUpdate();
  }
  function wireUpdate() {
    if (wired2) return;
    wired2 = true;
    el("update-download").addEventListener("click", () => {
      void download();
    });
    el("update-skip").addEventListener("click", () => {
      void skip();
    });
    el("update-dismiss").addEventListener("click", () => {
      dismissed = true;
      paintUpdate();
    });
    el("update-toggle").addEventListener("change", () => {
      void save2({ enabled: el("update-toggle").checked });
    });
    el("update-prereleases").addEventListener("change", () => {
      void save2({ include_prereleases: el("update-prereleases").checked });
    });
    window.addEventListener(UPDATE_CHOICE_EVENT, () => {
      void loadUpdate();
    });
  }
  async function save2(choice) {
    const toggle = el("update-toggle");
    const pre = el("update-prereleases");
    toggle.disabled = true;
    pre.disabled = true;
    el("update-status").textContent = "";
    try {
      await postJSON("/api/update", choice);
      toggle.disabled = false;
      await loadUpdate();
    } catch {
      toggle.disabled = false;
      el("update-status").textContent = t("settings.updatesFailed");
      paintUpdate();
    }
  }
  async function download() {
    try {
      const reply = await postJSON("/api/update", { open: true });
      if (reply.opened !== true) el("update-text").textContent = t("update.openFailed");
    } catch {
      el("update-text").textContent = t("update.openFailed");
    }
  }
  async function skip() {
    const release = latest9?.latest;
    if (!release) return;
    try {
      await postJSON("/api/update", { skip: release.version });
      await loadUpdate();
    } catch {
      dismissed = true;
      paintUpdate();
    }
  }

  // src/version.ts
  var copyText2 = "";
  var painted;
  function versionLabel(info) {
    const version = formatVersion(info.version);
    if (info.source === "release") return version;
    const commit = shortCommit(info.commit);
    if (!commit || version.toLowerCase().includes(commit)) return version;
    return `${version} · ${commit}`;
  }
  function formatVersion(version) {
    const trimmed = version.trim();
    if (/^\d+\.\d+\.\d+/.test(trimmed)) return `v${trimmed}`;
    return trimmed;
  }
  function shortCommit(commit) {
    if (commit === null) return null;
    const trimmed = commit.trim().toLowerCase();
    if (!/^[0-9a-f]{7,40}$/.test(trimmed)) return null;
    return trimmed.slice(0, 7);
  }
  function paint2(label) {
    painted = label;
    const footer = el("app-version");
    const about = el("about-version");
    el("version-copy-status").textContent = "";
    if (!label) {
      copyText2 = "";
      footer.hidden = true;
      footer.replaceChildren();
      about.textContent = t("version.unavailable");
      el("help-version").textContent = t("version.unavailable");
      return;
    }
    copyText2 = label;
    footer.hidden = false;
    footer.replaceChildren();
    const name = document.createElement("span");
    name.className = "visually-hidden";
    name.textContent = `${t("version.app")} `;
    const value = document.createElement("span");
    value.textContent = label;
    footer.append(name, value);
    about.textContent = label;
    el("help-version").textContent = label;
  }
  function repaintVersion() {
    if (painted === void 0) return;
    paint2(painted);
  }
  async function loadVersion() {
    try {
      paint2(versionLabel(await getVersion()));
    } catch {
      paint2(null);
    }
  }
  async function copyVersion() {
    const status = el("version-copy-status");
    if (!copyText2) {
      status.textContent = t("version.unavailable");
      return;
    }
    const writeText = navigator.clipboard?.writeText;
    if (!writeText || !window.isSecureContext) {
      status.textContent = t("version.copyFailed");
      return;
    }
    try {
      await writeText.call(navigator.clipboard, copyText2);
      status.textContent = t("version.copied");
    } catch {
      status.textContent = t("version.copyFailed");
    }
  }
  function wireVersion() {
    el("copy-version").addEventListener("click", () => {
      void copyVersion();
    });
  }

  // src/locale-wiring.ts
  function repaintAll() {
    applyStatic(document);
    repaintViews();
    if (state.mode === "snapshots") renderSnapshots();
    if (state.mode === "gig") repaintGig();
    if (state.mode === "drift") repaintDrift();
    if (state.mode === "health") repaintHealth();
    if (state.mode === "stats") repaintHistoryStats();
    if (state.mode === "scan") repaintScan();
    if (state.mode === "bitrate") repaintBitrate();
    if (state.mode === "tags") repaintTags();
    repaintPortable();
    repaintSnapshotPlan();
    repaintDialogs();
    repaintCheatSheet();
    repaintQuickOpen();
    repaintPlayer();
    repaintVersion();
    repaintUpdate();
    refreshTooltips();
  }
  var stop = null;
  function wireLocale() {
    stop?.();
    setLocale(initialLocale());
    applyStatic(document);
    stop = onLocaleChange(repaintAll);
  }

  // src/folder-sync.ts
  var PREVIEW_DELAY_MS = 250;
  var previewTimer = 0;
  var previewToken = 0;
  var syncing = false;
  async function previewFolderSync() {
    const token3 = ++previewToken;
    const form = readFolderSyncForm();
    const crate = state.activeCrate;
    if (!form || typeof crate !== "number") {
      el("folder-sync-preview").textContent = "";
      el("folder-sync-run").disabled = true;
      return;
    }
    el("folder-sync-preview").textContent = t("folderSync.counting");
    el("folder-sync-run").disabled = true;
    try {
      const reply = await postJSON("/api/folder-sync", {
        action: "preview",
        space: state.space,
        crate,
        folder: form.folder,
        subcrates: form.subcrates,
        full: form.full
      });
      if (token3 !== previewToken) return;
      el("folder-sync-preview").textContent = folderSyncPreviewText(reply);
      el("folder-sync-run").disabled = syncing || !folderSyncHasWork(reply);
    } catch (error2) {
      if (token3 !== previewToken) return;
      el("folder-sync-preview").textContent = failureOf(error2).message;
      el("folder-sync-run").disabled = true;
    }
  }
  function schedulePreview() {
    window.clearTimeout(previewTimer);
    previewTimer = window.setTimeout(() => {
      void previewFolderSync();
    }, PREVIEW_DELAY_MS);
  }
  async function openFolderSyncDialog() {
    if (!state.writable || typeof state.activeCrate !== "number") {
      setNotice(el("status").textContent || "");
      return;
    }
    el("folder-sync-status").textContent = "";
    if (!el("folder-sync-dialog").open) el("folder-sync-dialog").showModal();
    el("folder-sync-path").focus();
    await previewFolderSync();
  }
  async function runFolderSync() {
    const form = readFolderSyncForm();
    const crate = state.activeCrate;
    if (!form || typeof crate !== "number" || syncing) return;
    syncing = true;
    el("folder-sync-run").disabled = true;
    el("folder-sync-status").textContent = "";
    try {
      const reply = await postJSON("/api/folder-sync", {
        action: "sync",
        space: state.space,
        crate,
        folder: form.folder,
        subcrates: form.subcrates,
        full: form.full
      });
      el("folder-sync-dialog").close();
      setNotice(folderSyncDoneText(reply));
      await loadLibrary();
    } catch (error2) {
      el("folder-sync-status").textContent = failureOf(error2).message;
      if (failureOf(error2).status === 409) {
        lockDown(error2);
        el("folder-sync-dialog").close();
      }
    } finally {
      syncing = false;
    }
  }
  function wireFolderSync() {
    el("crate-folder-sync").addEventListener("click", () => {
      openFolderSyncDialog().catch((error2) => setNotice(failureOf(error2).message));
    });
    el("folder-sync-path").addEventListener("input", schedulePreview);
    el("folder-sync-subcrates").addEventListener("change", () => {
      void previewFolderSync();
    });
    el("folder-sync-full").addEventListener("change", () => {
      void previewFolderSync();
    });
    el("folder-sync-cancel").addEventListener("click", () => el("folder-sync-dialog").close());
    el("folder-sync-run").addEventListener("click", () => {
      runFolderSync().catch((error2) => setNotice(failureOf(error2).message));
    });
  }

  // src/presets.ts
  var PREVIEW_DELAY_MS2 = 250;
  var previewTimer2 = 0;
  var previewToken2 = 0;
  var creating = false;
  function syncNamePlaceholder(preset) {
    el("preset-name").placeholder = preset ? presetName(preset) : "";
  }
  async function previewPreset() {
    const token3 = ++previewToken2;
    const preset = readPresetForm();
    syncNamePlaceholder(preset);
    el("preset-create").disabled = !preset || creating;
    if (!preset) {
      el("preset-preview").textContent = "";
      return;
    }
    el("preset-preview").textContent = t("presets.counting");
    try {
      const reply = await postJSON("/api/smart-preset", { action: "preview", space: state.space, preset });
      if (token3 !== previewToken2) return;
      el("preset-preview").textContent = t("presets.matches", { count: Number(reply.count) || 0 });
    } catch (error2) {
      if (token3 !== previewToken2) return;
      el("preset-preview").textContent = failureOf(error2).message;
      el("preset-create").disabled = true;
    }
  }
  function schedulePreview2() {
    window.clearTimeout(previewTimer2);
    previewTimer2 = window.setTimeout(() => {
      void previewPreset();
    }, PREVIEW_DELAY_MS2);
  }
  async function openPresetDialog() {
    if (!state.writable) {
      setNotice(el("status").textContent || "");
      return;
    }
    const track = state.selectedId == null ? void 0 : state.byId.get(state.selectedId);
    el("preset-key").value = track?.key?.trim() || el("preset-key").value;
    const bpm = Number(track?.bpm);
    if (Number.isFinite(bpm) && bpm > 0) el("preset-bpm").value = String(Math.round(bpm * 10) / 10);
    const scope = scopeCrate();
    el("preset-scope-label").hidden = !scope;
    el("preset-scope").checked = Boolean(scope);
    el("preset-scope-text").textContent = scope ? t("presets.scope", { name: scope.name }) : "";
    el("preset-name").value = "";
    el("preset-status").textContent = "";
    syncPresetFields();
    if (!el("preset-dialog").open) el("preset-dialog").showModal();
    el("preset-kind").focus();
    await previewPreset();
  }
  async function createPreset() {
    const preset = readPresetForm();
    if (!preset || creating) return;
    creating = true;
    el("preset-create").disabled = true;
    el("preset-status").textContent = "";
    const name = el("preset-name").value.trim() || presetName(preset);
    try {
      const reply = await postJSON("/api/smart-preset", { action: "create", space: state.space, preset, name });
      el("preset-dialog").close();
      const message = t("presets.created", { name: reply.name || name, count: Number(reply.added) || 0 });
      setNotice(reply.warning ? `${message} ${reply.warning}` : message);
      await loadLibrary();
      if (typeof reply.id === "number") selectCrate(reply.id);
    } catch (error2) {
      el("preset-status").textContent = failureOf(error2).message;
      if (failureOf(error2).status === 409) {
        lockDown(error2);
        el("preset-dialog").close();
      }
    } finally {
      creating = false;
      el("preset-create").disabled = !readPresetForm();
    }
  }
  async function refreshActivePreset() {
    const id = state.activeCrate;
    if (id === "all" || !state.writable) return;
    const crate = state.crates.find((item5) => item5.id === id);
    try {
      const reply = await postJSON("/api/smart-preset", { action: "refresh", id });
      const message = t("presets.refreshed", {
        name: crate?.name ?? "",
        added: Number(reply.added) || 0,
        removed: Number(reply.removed) || 0
      });
      setNotice(reply.warning ? `${message} ${reply.warning}` : message);
      await loadLibrary();
    } catch (error2) {
      if (failureOf(error2).status === 409) lockDown(error2);
      else setNotice(failureOf(error2).message);
      if (failureOf(error2).status === 404) await loadLibrary();
    }
  }
  async function refreshPresetsOnOpen() {
    if (!state.writable || Object.keys(state.presets).length === 0) return;
    try {
      const reply = await postJSON("/api/smart-preset", { action: "refresh_all" });
      const changed = reply.changed?.length ?? 0;
      if (!changed) return;
      const message = t("presets.refreshedOnOpen", { count: changed });
      setNotice(reply.warning ? `${message} ${reply.warning}` : message);
      await loadLibrary();
    } catch (error2) {
      if (failureOf(error2).status !== 409) setNotice(failureOf(error2).message);
    }
  }
  function wirePresets() {
    el("crate-preset").addEventListener("click", () => {
      openPresetDialog().catch((error2) => setNotice(failureOf(error2).message));
    });
    el("crate-refresh").addEventListener("click", () => {
      refreshActivePreset().catch((error2) => setNotice(failureOf(error2).message));
    });
    el("preset-kind").addEventListener("change", () => {
      syncPresetFields();
      void previewPreset();
    });
    for (const id of ["preset-key", "preset-bpm", "preset-range", "preset-months"]) {
      el(id).addEventListener("input", schedulePreview2);
    }
    el("preset-scope").addEventListener("change", () => {
      void previewPreset();
    });
    el("preset-cancel").addEventListener("click", () => el("preset-dialog").close());
    el("preset-create").addEventListener("click", () => {
      createPreset().catch((error2) => setNotice(failureOf(error2).message));
    });
  }

  // src/desktop-actions.ts
  var CLICKS = {
    "new-crate": "crate-new",
    "rename-crate": "crate-rename",
    "delete-crate": "crate-delete",
    "import-playlist": "import-m3u",
    "export-playlist": "export-m3u",
    "export-rekordbox": "export-rekordbox",
    reload: "reload",
    settings: "open-settings",
    "rerun-setup": "rerun-wizard",
    merge: "merge-duplicates",
    "take-snapshot": "snapshots-take",
    "review-undo": "snapshots-undo-button",
    "open-logs": "open-logs",
    "copy-version": "copy-version",
    help: "open-help",
    "help-bug": "help-bug",
    "help-feature": "help-feature",
    "help-github": "help-github",
    "help-releases": "help-releases"
  };
  var VIEWS = {
    "view-crates": "crates",
    "view-history": "history",
    "view-stats": "stats",
    "view-files": "files",
    "view-missing": "missing",
    "view-duplicates": "duplicates",
    "view-stems": "stems",
    "view-health": "health",
    "view-scan": "scan",
    "view-bitrate": "bitrate",
    "view-tags": "tags",
    "view-snapshots": "snapshots",
    "view-gig": "gig",
    "view-portable": "portable",
    "view-drift": "drift"
  };
  function runDesktopAction(action) {
    if (action === "find") {
      openQuickOpen();
      return;
    }
    if (action === "focus-search") {
      const field = state.mode === "files" ? el("files-search") : el("search");
      field.focus();
      if (typeof field.select === "function") field.select();
      return;
    }
    if (action === "shortcuts") {
      openCheatSheet();
      return;
    }
    if (action === "about") {
      const dialog = el("settings-dialog");
      if (!dialog.open) dialog.showModal();
      const title2 = el("about-title");
      title2.tabIndex = -1;
      title2.focus();
      if (typeof title2.scrollIntoView === "function") title2.scrollIntoView({ block: "nearest" });
      return;
    }
    if (action === "view-all") {
      setMode("crates");
      selectCrate("all");
      return;
    }
    if (action === "related") {
      document.querySelector(".related-search input")?.focus();
      return;
    }
    if (action === "reset-width") {
      el("track-splitter").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
      return;
    }
    if (action.startsWith("space:")) {
      const select = el("space");
      select.value = action.slice("space:".length);
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    const view = VIEWS[action];
    if (view) {
      setMode(view);
      return;
    }
    const id = CLICKS[action];
    if (!id) return;
    const node = document.getElementById(id);
    if (node instanceof HTMLElement) node.click();
  }
  function installDesktopActions() {
    const host = window;
    host.seratoDesktop = { run: runDesktopAction };
  }

  // src/dual-crate.ts
  var saving = false;
  function toggleSplit() {
    state.splitCrates = !state.splitCrates;
    if (state.splitCrates) {
      state.secondCrate = "all";
      state.focusedPane = "a";
    }
    renderList();
  }
  async function saveFocusedView() {
    if (saving || !state.writable) return;
    const assets = saveViewIds(focusedView());
    if (!assets.length) {
      setNotice(t("crates.saveViewEmpty"));
      return;
    }
    const name = prompt(t("crates.saveViewPrompt"));
    if (!name || !name.trim()) return;
    const source = state.splitCrates && state.focusedPane === "b" ? state.secondCrate : state.activeCrate;
    const parent = source === "all" ? state.rootId : source;
    saving = true;
    try {
      const result = await postJSON("/api/crate", {
        action: "create",
        name: name.trim(),
        parent,
        assets,
        space: state.space
      });
      setNotice(result.warning || t("crates.saveViewCreated", { count: Number(result.added) || assets.length }));
      await loadLibrary();
      if (typeof result.id === "number") selectCrate(result.id);
    } catch (error2) {
      if (failureOf(error2).status === 409) lockDown(error2);
      else setNotice(failureOf(error2).message);
    } finally {
      saving = false;
    }
  }
  function wireDualCrates() {
    el("crate-split").addEventListener("click", () => toggleSplit());
    el("crate-save-view").addEventListener("click", () => {
      saveFocusedView().catch((error2) => setNotice(failureOf(error2).message));
    });
    el("crate-pane-a").addEventListener("focusin", () => {
      if (!state.splitCrates || state.focusedPane === "a") return;
      state.focusedPane = "a";
      paintDualChrome();
    });
    el("crate-pane-b").addEventListener("focusin", () => {
      if (!state.splitCrates || state.focusedPane === "b") return;
      state.focusedPane = "b";
      paintDualChrome();
    });
  }

  // src/app.ts
  function wireSnapshots() {
    el("snapshots-refresh").addEventListener("click", () => {
      loadSnapshots().catch((error2) => failSnapshots(error2));
    });
    el("operations-refresh").addEventListener("click", () => {
      loadOperations().catch(() => void 0);
    });
    el("snapshots-take").addEventListener("click", () => {
      takeSnapshot().catch((error2) => failSnapshots(error2));
    });
    el("snapshots-drives").addEventListener("click", () => {
      backupDriveCrates().catch((error2) => failSnapshots(error2));
    });
    el("snapshots-undo-button").addEventListener("click", () => {
      const pending = state.snapshotUndo;
      if (!pending || !pending.restore_id) return;
      openSnapshotPlan(pending.restore_id).catch((error2) => failSnapshots(error2));
    });
    el("snapshot-cancel").addEventListener("click", () => {
      el("snapshot-dialog").close();
    });
    el("snapshot-confirm").addEventListener("click", () => {
      confirmSnapshotRestore().catch((error2) => setSnapshotDialogStatus(failureOf(error2).message));
    });
  }
  wireLocale();
  installTooltips();
  applyStaticTooltips();
  mountTrackList();
  mountTrackListB();
  wireDualCrates();
  mountPlayer();
  registerPlayerControls(playerControls);
  wireLibrary();
  wireVirtualScroll();
  wireShortcuts();
  installDesktopActions();
  wireDialogs();
  wirePresets();
  wireFolderSync();
  wireHelp();
  wireSnapshots();
  wireGigCheck(() => {
    setMode("crates");
  });
  wireHealth((action, id) => {
    if (action === "track" && id != null) state.selectedId = id;
    if (action === "missing") setMode("missing");
    else if (action === "duplicates") setMode("duplicates");
    else if (action === "files") setMode("files");
    else if (action === "bitrate") setMode("bitrate");
    else setMode("crates");
  });
  wireDrift();
  wireHistoryStats();
  wireScan();
  wireBitrate();
  wireTags();
  wirePortable();
  wireLayout();
  wireVersion();
  void loadVersion();
  wireUpdate();
  void loadUpdate();
  bindLibraryReload(loadLibrary);
  loadLibrary().then(() => refreshPresetsOnOpen()).catch(showFailure);
})();
//# sourceMappingURL=app.js.map
