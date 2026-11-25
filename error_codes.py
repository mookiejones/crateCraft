"""Stable codes for the error sentences the server sends to the page.

The server keeps sending the English sentence in ``error`` so older pages
and logs still read. When that sentence is one of the known ones below,
``send_json`` also adds ``code``. The page looks up ``error.<code>`` in
its locale file and falls back to the English text when the code is
missing or unknown. A sentence with a path or other changing part never
gets a code, so it is never mistaken for a fixed one.

``PARAM_CODES`` is the exception: a sentence with a placeholder, such as
the unknown Serato version notice. The page receives ``code`` and
``params`` and fills ``error.<code>``. The English ``error`` or
``message`` is still the filled sentence.

``tests/test_language.py`` checks that every code has an
``error.<code>`` entry in ``locales/en.json`` whose text is the same
sentence, or the same template for a parameterized code, so the two
cannot drift.
"""

from __future__ import annotations

from collections.abc import Mapping

import app_trash
import batch_run
import crate_trees
import folder_sync
import version_family
import legacy_library
import music_mirror
import other_dj
import smart_presets
import cue_edit
import path_forms
import stick_cues
import suspicious_cues
import tag_cleanup
import write_queue

REGISTRATION_NO_SPACE = (
    "Crates were not registered. This library has no Serato Library space, "
    "so Serato may remove those crate files the next time it opens."
)
"""Plan warning when crate files cannot be stored in the Serato Library space."""

# English sentence -> code. Codes are lowercase words joined by
# underscores and never change once shipped.
ERROR_CODES: dict[str, str] = {
    "Something went wrong. The details are in the local log.": "internal",
    "There is not enough disk space to back up the library.": "backup_no_space",
    "Quit Serato DJ Pro before backing up drive crates. "
    "Serato DJ is still running, so nothing was copied.": "backup_serato_running",
    "That request is not valid.": "invalid_request",
    "The request body is not JSON.": "body_not_json",
    "The request body is not an object.": "body_not_object",
    "That upload is too large.": "upload_too_large",
    version_family.CONFIRM: "version_needs_confirm",
    "That action is not available.": "action_unavailable",
    "No Serato library was found on this computer.": "no_library",
    "No older Serato library was found.": "no_legacy_library",
    "Choose a crate for a bitrate check.": "bitrate_needs_crate",
    "Choose a crate for an energy check.": "energy_needs_crate",
    "Confirm before tracks are marked for re-analyze.": "reanalyze_needs_confirm",
    "Choose a crate for re-analyze.": "reanalyze_needs_crate",
    "The unanalyzed mark did not stick. The library was put back.": "reanalyze_did_not_stick",
    "Those beatgrids are locked. Turn on Include locked beatgrids to unlock them.": "reanalyze_locked",
    suspicious_cues.NEEDS_CONFIRM: "cues_needs_confirm",
    cue_edit.NEEDS_CONFIRM: "cue_edit_needs_confirm",
    cue_edit.NEEDS_UNDO: "cue_edit_needs_undo",
    cue_edit.MISSING_UNDO: "cue_edit_missing_undo",
    cue_edit.PROTECTED: "cue_edit_protected",
    cue_edit.UNSUPPORTED: "cue_edit_unsupported",
    cue_edit.MISSING_FILE: "cue_edit_missing",
    cue_edit.CORRUPT: "cue_edit_corrupt",
    cue_edit.OUTSIDE_CHANGE: "cue_edit_outside_change",
    cue_edit.BAD_PADS: "cue_edit_bad_pads",
    "Confirm before stored gain is reset to 0 dB.": "gain_needs_confirm",
    "The gain did not read back as 0 dB, so the files were put back.": "gain_did_not_stick",
    "Other Serato tags would have changed, so the files were put back.": "gain_frames_moved",
    "Stored gain could not be rewritten, so nothing was kept.": "gain_cannot_rewrite",
    path_forms.NEEDS_CONFIRM: "path_forms_needs_confirm",
    stick_cues.NEEDS_CONFIRM: "stick_cues_needs_confirm",
    stick_cues.NEEDS_DRIVE: "stick_needs_drive",
    "Choose a crate for a tempo check.": "tempo_needs_crate",
    "Choose a crate for a BPM check.": "bpm_needs_crate",
    "That track is not half or double the crate.": "bpm_not_flagged",
    "That fix does not match this track.": "bpm_fix_mismatch",
    "Confirm the BPM change before it is saved.": "bpm_needs_confirm",
    "The BPM did not stick. The library was put back.": "bpm_did_not_stick",
    "Choose a quick or full check.": "scan_depth",
    "Choose a crate for a full decode check.": "scan_full_needs_crate",
    legacy_library.WRITE_BLOCKED: "legacy_read_only",
    "The library could not be saved.": "library_not_saved",
    "Track id is required.": "track_id_required",
    "This file already has artwork.": "artwork_already",
    "This file format cannot take artwork yet.": "artwork_format",
    "Cover lookup failed.": "artwork_lookup",
    "No cover was found for this track.": "artwork_no_cover",
    "This track has no title or artist to search.": "artwork_no_search",
    "That image is not a JPEG or PNG cover.": "artwork_not_image",
    "Confirm the cover before it is saved.": "artwork_needs_confirm",
    "Choose a cover before it is saved.": "artwork_needs_release",
    "The artwork could not be written.": "artwork_write_failed",
    "The drive file could not be written.": "drive_file_not_written",
    "The drive file could not be put back.": "drive_file_not_restored",
    "Track is not in this space.": "track_not_in_space",
    "That track is not in this space.": "track_not_in_space_alt",
    "That track is not in the library.": "track_not_in_library",
    "That space is not available here.": "space_unavailable",
    "That crate is not in this space.": "crate_not_in_space",
    "The window could not be focused.": "focus_failed",
    "Choose whether to share stats before finishing setup.": "setup_needs_consent",
    "Setup could not be saved.": "setup_not_saved",
    "The layout could not be saved.": "layout_not_saved",
    "The sharing choice could not be saved.": "consent_not_saved",
    "The language could not be saved.": "language_not_saved",
    "The copies setting could not be saved.": "copies_not_saved",
    "Can't verify, not deleting. A snapshot's hash check failed.": "copies_hash_failed",
    "The shortcuts could not be saved.": "shortcuts_not_saved",
    "The theme could not be saved.": "theme_not_saved",
    "The logs folder could not be opened.": "logs_not_opened",
    "The Windows Security page could not be opened.": "folder_access_not_opened",
    "Confirm undo before it is saved.": "undo_needs_confirm",
    "There is no outside change to undo.": "nothing_to_undo",
    "That folder could not be read.": "folder_unreadable",
    "That folder is outside the music folders.": "folder_outside_roots",
    "That folder is not the Serato library on this computer.": "folder_not_library",
    "Shortcuts are left alone.": "shortcut_skipped",
    "That path could not be read.": "path_unreadable",
    "That file is not on disk.": "file_not_on_disk",
    "The file could not be moved to the Trash.": "trash_failed",
    "The file could not be moved to the Recycle Bin.": "recycle_failed",
    app_trash.TRASH_CANCELLED: "trash_cancelled",
    app_trash.TRASH_IN_PLACE: "trash_in_place",
    app_trash.TRASH_INSIDE: "trash_inside",
    app_trash.TRASH_MISSING: "trash_missing",
    app_trash.TRASH_NOT_DUE: "trash_not_due",
    app_trash.TRASH_OTHER_DJ: "trash_other_dj",
    app_trash.TRASH_PROTECTED: "trash_protected",
    app_trash.TRASH_SHORTCUT: "trash_shortcut",
    REGISTRATION_NO_SPACE: "registration_no_space",
    "The file could not be moved. Nothing was changed.": "move_failed",
    "That track is not in a duplicate group.": "not_duplicate",
    other_dj.OTHER_DJ_OPEN: "other_dj_open",
    "Choose the copy to keep.": "choose_copy",
    "Choose the track to replace.": "choose_replace_from",
    "Choose the track to put in those crates.": "choose_replace_to",
    "Those two tracks are the same.": "replace_same_track",
    "Confirm the crate update before it runs.": "replace_needs_confirm",
    "Choose a folder.": "choose_folder",
    tag_cleanup.CHOOSE_FIELD: "choose_genre_or_artist",
    tag_cleanup.CHOOSE_SPELLING: "choose_spelling",
    tag_cleanup.CHOOSE_TRACKS: "choose_tracks",
    tag_cleanup.NOT_IN_GROUP: "spelling_not_in_group",
    "That genre is not in this library.": "genre_not_in_library",
    "A genre cannot sit under itself.": "genre_cycle",
    "Choose Grouping or Comment.": "genre_family_field",
    "That genre map is not valid.": "genre_map_invalid",
    "Confirm the genre family write before it is saved.": "genre_family_needs_confirm",
    "Choose fewer files at once.": "too_many_files",
    "Choose tracks to relink.": "relink_needs_tracks",
    "Two of those tracks are the same.": "relink_duplicate_tracks",
    "Two of those files are the same.": "relink_duplicate_files",
    "That track is still on disk.": "relink_still_on_disk",
    "That file is not an audio file.": "relink_not_audio",
    "Another library track already uses that file.": "file_already_used",
    "That file is already this track.": "file_already_this_track",
    "A track path is required.": "track_path_required",
    "A track cannot be related to itself.": "related_self",
    "Choose a one-way or two-way link.": "related_direction",
    "That link is not in the related tracks.": "related_missing",
    "The related-tracks file could not be saved.": "related_not_saved",
    "The related-tracks file could not be read.": "related_unreadable",
    "That snapshot could not be read.": "snapshot_unreadable",
    "That snapshot is incomplete.": "snapshot_incomplete",
    "That snapshot id is not valid.": "snapshot_id_invalid",
    "That field cannot be edited.": "field_readonly",
    "Rating needs a whole number from 1 to 5.": "rating_invalid",
    "Length needs a whole number of milliseconds.": "length_invalid",
    "Color needs a number.": "color_not_number",
    "Color is out of range.": "color_out_of_range",
    "Smart crate rules need a rules list.": "smart_rules_list",
    smart_presets.BAD_BAND: "preset_bad_band",
    smart_presets.BAD_GENRE: "preset_bad_genre",
    crate_trees.UNKNOWN_TREE: "tree_unknown",
    crate_trees.BAD_BANDS: "tree_bad_bands",
    crate_trees.BAD_GENRES: "tree_bad_genres",
    crate_trees.EMPTY_TREE: "tree_empty",
    "No tracks fit tonight crates.": "tonight_empty",
    folder_sync.SMART: "smart_crate_tracks",
    folder_sync.ROOT_CRATE: "crate_not_root",
    music_mirror.DEST_SERATO: "mirror_dest_serato",
    music_mirror.DEST_LIBRARY: "mirror_dest_library",
    music_mirror.DEST_MUSIC: "mirror_dest_music",
    # Stick backup and history rescue sentences are literals here so
    # error_codes does not import those modules (they pull snapshots).
    "Choose a Serato stick.": "stick_backup_source",
    "That folder has no _Serato_ library.": "stick_backup_no_serato",
    "A stick backup cannot go into the Serato folder.": "stick_backup_dest_serato",
    "A stick backup cannot go into the Serato library.": "stick_backup_dest_library",
    "A stick backup cannot go onto the source stick.": "stick_backup_dest_source",
    "A stick backup cannot go onto the same disk as the source stick.": (
        "stick_backup_same_disk"
    ),
    "History write-back was not checked for this Serato version. "
    "Rebuild as crates instead.": "history_write_unprobed",
    "That history source is not available.": "history_rescue_source",
    "Choose at least one history session.": "history_rescue_sessions",
    "Nothing to change.": "history_rescue_nothing",
    "Choose a backup or snapshot to compare.": "history_rescue_compare_live",
    "Serato 3.x History/Sessions is not checked yet. "
    "Use a backup or snapshot database, or rebuild as crates from live history.": (
        "history_rescue_folder"
    ),
    smart_presets.UNKNOWN_PRESET: "preset_unknown",
    write_queue.CONFIRM_NEEDED: "queue_confirm",
    write_queue.QUEUE_LOCKED: "queue_locked",
    write_queue.UNKNOWN_ITEM: "queue_unknown",
    write_queue.GIG_LOCK_NOT_SAVED: "gig_lock_not_saved",
    batch_run.BATCH_EMPTY: "batch_empty",
    batch_run.BATCH_NEEDS_DEST: "batch_needs_dest",
    batch_run.BATCH_STALE: "batch_stale",
    batch_run.BATCH_NO_PREVIEW: "batch_no_preview",
    batch_run.BATCH_NEEDS_CONFIRM: "batch_needs_confirm",
    batch_run.BATCH_NOTHING: "batch_nothing",
    batch_run.BATCH_NO_UNDO: "batch_no_undo",
    batch_run.BATCH_UNDO_STALE: "batch_undo_stale",
    batch_run.BATCH_SAME: "batch_same",
    batch_run.BATCH_MISSING: "batch_missing",
    "That job is not in the list.": "job_unknown",
    "That write cannot be undone.": "job_cannot_undo",
    "Confirm the restore before it is saved.": "job_restore_confirm",
    smart_presets.BAD_KEY: "preset_bad_key",
    smart_presets.BAD_BPM: "preset_bad_bpm",
    smart_presets.BAD_MONTHS: "preset_bad_months",
    smart_presets.BAD_RULES: "preset_bad_rules",
    smart_presets.NOT_A_PRESET_CRATE: "preset_not_a_preset_crate",
    smart_presets.PRESET_CRATE_GONE: "preset_crate_gone",
    "Smart crate rules need to be JSON.": "smart_rules_json",
    "That crate name is too long.": "crate_name_too_long",
    "Use a crate name without the Serato name separator.": "crate_name_separator",
    "The space root cannot be renamed.": "root_rename",
    "The space root cannot be deleted.": "root_delete",
    "The space root has no color.": "root_color",
    "The playlist is empty.": "playlist_empty",
    "The note is too long.": "note_too_long",
    "The write did not match, and putting the library back failed.": "write_rollback_failed",
    "The write failed, and putting the library back failed.": "write_undo_failed",
    "The pre-write snapshot does not match its hash.": "write_preimage_mismatch",
    "The library files changed on disk since they were loaded. "
    "Confirm to write anyway.": "library_changed",
}

# Code -> English template. ``{name}`` is filled from the params the page
# receives. These are not in ERROR_CODES, because the filled sentence changes.
PARAM_CODES: dict[str, str] = {
    "serato_version_unknown": (
        "Serato version is unknown (build {build}). "
        "Writes and restores are off until the installed Serato version can be read. "
        "A value that is not a dotted number, including an unreadable plist, is unknown. "
        "Snapshots can still be taken and read."
    ),
    "serato_version_unprobed": (
        "Serato {version} (build {build}) is listed but its library schema has not been probed. "
        "Writes and restores are off until a schema probe is recorded. "
        "Snapshots can still be taken and read."
    ),
    "serato_schema_mismatch": (
        "Serato {version} (build {build}) was probed at library schema {expected}. "
        "This library is schema {found}. "
        "Writes and restores are off. Snapshots can still be taken and read."
    ),
    "serato_schema_unreadable": (
        "Serato {version} (build {build}) was probed at library schema {expected}, "
        "and this library's schema could not be read. "
        "Writes and restores are off. Snapshots can still be taken and read."
    ),
    "library_log_unconfirmed": (
        "The session log does not confirm this library file ({database}). "
        "Writes and restores are off. Snapshots can still be taken and read."
    ),
    "restore_outside": (
        "Could not put {name} back. Open the local log from Settings, or "
        "read the operation log on Backups."
    ),
    "copies_unplugged": (
        "Can't verify, not deleting. The copy on {drive} is unplugged."
    ),
    "copies_untrusted": (
        "Can't verify, not deleting. The copy on {drive} is marked untrusted."
    ),
    "copies_need_more": (
        "Need {n} verified copies before deleting."
    ),
}


def render(code: str, params: Mapping[str, str]) -> str:
    """Fill one parameterized English template.

    Args:
        code: A key of :data:`PARAM_CODES`.
        params: Placeholder values. A missing name raises ``KeyError``.

    Returns:
        The English sentence with the placeholders filled.

    Raises:
        KeyError: If ``code`` is not a parameterized notice, or a
            placeholder has no value.
    """
    return PARAM_CODES[code].format_map(dict(params))


def code_for(message: object) -> str | None:
    """Return the code for one error sentence.

    Args:
        message: The ``error`` value about to be sent.

    Returns:
        The stable code, or None when the sentence is not a known one.
    """
    if not isinstance(message, str):
        return None
    return ERROR_CODES.get(message)


def with_code(payload: object) -> object:
    """Add ``code`` beside a known ``error`` sentence.

    Args:
        payload: The JSON object about to be sent.

    Returns:
        A copy with ``code`` added when ``payload`` is a dict whose
        ``error`` is a known sentence and that has no ``code`` yet.
        Otherwise ``payload`` itself, unchanged.
    """
    if not isinstance(payload, dict) or "code" in payload:
        return payload
    code = code_for(payload.get("error"))
    if code is None:
        return payload
    return {**payload, "code": code}
