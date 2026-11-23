-- Serato DJ Pro 5.1.0 master.sqlite .schema dump (issue #471).
-- PRAGMA user_version = 203. The observed PRAGMA schema_version was 44325.
-- That cookie counts session tables, so it is not the write gate.
-- The serato_db view uuid in the live file was redacted to zeros.
-- No rows. This file is not a database and is not opened as one.

CREATE VIEW serato_db AS SELECT X'00000000000000000000000000000000' AS uuid, 0 AS role
/* serato_db(uuid,role) */;
CREATE TABLE serato
(
	database_name			TEXT DEFAULT '',
	time_created			INTEGER NOT NULL,
	time_last_connected		INTEGER DEFAULT NULL,
	last_host_id			TEXT DEFAULT NULL
);
CREATE TABLE lock
(
	time_locked				INTEGER NOT NULL DEFAULT (strftime('%s', 'now') ),  -- This column is currently only used for logging and diagnostics
	duration_locked			INTEGER,  -- This column is reserved for future use
	lock_policy				INTEGER NOT NULL,
	owner_process_id		INTEGER NOT NULL,
	owner_process_name		TEXT NOT NULL,
	owner_machine_id		TEXT,     -- This column is currently only used for logging and diagnostics
	owner_application_id	TEXT      -- This column is reserved for future use
);
CREATE TRIGGER serato__singlerow
	BEFORE INSERT ON serato
	WHEN (SELECT COUNT(*) FROM serato) >= 1
	BEGIN
		SELECT RAISE(FAIL, 'no way');
	END;
CREATE TABLE space
(
	id						INTEGER PRIMARY KEY,
	name					TEXT NOT NULL,
	
	UNIQUE(name COLLATE NOCASE)
);
CREATE TABLE location
(
	id						INTEGER PRIMARY KEY,
	path					TEXT,
	uuid					BLOB,
	revision				INT NOT NULL DEFAULT 0,
	show_when_disconnected  INT NOT NULL DEFAULT 0,
	last_sync_time			INTEGER NOT NULL DEFAULT 0,
	last_sync_secret		INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE sqlite_sequence(name,seq);
CREATE TABLE location_container
(
	id						INTEGER PRIMARY KEY,
	container_id			INTEGER NOT NULL,
	location_id				INTEGER NOT NULL,
	external_container_id	INTEGER,

	UNIQUE( container_id, location_id ),
	FOREIGN KEY( container_id ) REFERENCES container( id ) ON DELETE CASCADE,
	FOREIGN KEY( location_id ) REFERENCES location( id ) ON DELETE CASCADE
);
CREATE TABLE space_asset
(
	id							INTEGER PRIMARY KEY,
	asset_id					INTEGER NOT NULL,
	space_id					INTEGER NOT NULL,
	
	UNIQUE(asset_id, space_id),
	FOREIGN KEY(asset_id) REFERENCES asset(id) ON DELETE CASCADE,
	FOREIGN KEY(space_id) REFERENCES space(id) ON DELETE CASCADE
);
CREATE TABLE container_asset
(
	id                          INTEGER PRIMARY KEY AUTOINCREMENT,
	asset_id					INTEGER NOT NULL,
	location_container_id       INTEGER NOT NULL,
	space_asset_id              INTEGER NOT NULL,
	external_container_asset_id INTEGER,
	list_order                  INTEGER NOT NULL,
	time_added                  INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

	FOREIGN KEY( location_container_id ) REFERENCES location_container( id ) ON DELETE CASCADE,
	FOREIGN KEY( space_asset_id ) REFERENCES space_asset( id ) ON DELETE CASCADE
);
CREATE TABLE migration_script
(
	from_schema_version			INTEGER,
	script_revision				INTEGER NOT NULL DEFAULT 1,
	pre_script					TEXT,
	migration					TEXT NOT NULL,
	post_script					TEXT,
	hash						TEXT NOT NULL,
	
	PRIMARY KEY(from_schema_version, script_revision)
);
CREATE TABLE smart_crate_rules
(
	container_id				INTEGER NOT NULL PRIMARY KEY,
	version						INTEGER NOT NULL,
	rules						TEXT NOT NULL,

	FOREIGN KEY( container_id ) REFERENCES container( id ) ON DELETE CASCADE
);
CREATE TABLE asset_list_columns
(
	key TEXT PRIMARY KEY,
	column_names TEXT NOT NULL,
	column_widths TEXT NOT NULL,
	primary_sort_column TEXT,
	primary_sort_direction INTEGER NOT NULL
);
CREATE TABLE container_asset_list_columns
(
	container_id 			INTEGER,
	usage 					INTEGER,
	column_names 			TEXT NOT NULL,
	column_widths 			TEXT NOT NULL,
	primary_sort_column 	TEXT,
	primary_sort_direction 	INTEGER NOT NULL,
	migrated_by 			INTEGER,

	PRIMARY KEY( container_id, usage ),
	FOREIGN KEY( container_id ) REFERENCES container( id ) ON DELETE CASCADE
);
CREATE TABLE secondary_sort_pairs
(
	key							TEXT NOT NULL,
	primary_sort_column			TEXT NOT NULL,
	secondary_sort_column		TEXT NOT NULL,
	secondary_sort_direction	INTEGER NOT NULL DEFAULT 0, -- boolean

	PRIMARY KEY( key, primary_sort_column )
);
CREATE INDEX space_asset__asset_id ON space_asset( asset_id );
CREATE UNIQUE INDEX container_asset__location_container_id_external_asset_id ON
	container_asset( location_container_id, external_container_asset_id )
	WHERE external_container_asset_id IS NOT NULL;
CREATE INDEX container_asset__space_asset_id ON container_asset ( space_asset_id, location_container_id );
CREATE INDEX container_asset__location_container_id ON container_asset ( location_container_id, space_asset_id );
CREATE UNIQUE INDEX location_container__external_container_id_location_id ON
	location_container( external_container_id, location_id ) WHERE external_container_id IS NOT NULL;
CREATE TABLE "container"
	(
		id						INTEGER PRIMARY KEY AUTOINCREMENT,
		parent_id				INTEGER DEFAULT NULL,
		name					TEXT NOT NULL,
		type					INTEGER CHECK( type IS NOT NULL AND type >= 0 ) DEFAULT 1,
		list_order				INTEGER NOT NULL,
		space_id				INTEGER DEFAULT NULL,
		time_added				INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
		expanded				INTEGER NOT NULL DEFAULT 0, -- boolean
		portable_id				TEXT NOT NULL DEFAULT '', color INTEGER,
	
		UNIQUE(parent_id, name COLLATE NOCASE, type),
		FOREIGN KEY(parent_id) REFERENCES container(id) ON DELETE CASCADE,
		FOREIGN KEY(space_id) REFERENCES space(id) ON DELETE CASCADE
	);
CREATE INDEX container__parent_id_list_order ON container ( parent_id, list_order );
CREATE TABLE "asset"
	(
			id							INTEGER PRIMARY KEY AUTOINCREMENT,
			external_id					INTEGER NOT NULL,
			location_id					INTEGER NOT NULL,
			portable_id					TEXT NOT NULL DEFAULT '',
			file_name					TEXT DEFAULT NULL,
			file_size					INTEGER,
			file_bit_rate				REAL,
			file_sample_rate			REAL,
			type						TEXT NOT NULL DEFAULT '',
			format						TEXT NOT NULL DEFAULT '',
			artist						TEXT NOT NULL DEFAULT '',
			color						INTEGER,
			comments					TEXT NOT NULL DEFAULT '',
			comment_language			TEXT NOT NULL DEFAULT '',
			comment_descriptor			TEXT NOT NULL DEFAULT '',
			grouping					TEXT NOT NULL DEFAULT '',
			remixer						TEXT NOT NULL DEFAULT '',
			name						TEXT NOT NULL DEFAULT '',
			album						TEXT NOT NULL DEFAULT '',
			composer					TEXT NOT NULL DEFAULT '',
			year						TEXT NOT NULL DEFAULT '',
			genre						TEXT NOT NULL DEFAULT '',
			key							TEXT NOT NULL DEFAULT '',
			label						TEXT NOT NULL DEFAULT '',
			bpm							REAL,
			length_sec					INTEGER,
			length_ms					INTEGER,
			time_added					INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
			time_modified				INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
			part_of_set					TEXT NOT NULL DEFAULT '',
			track_number				TEXT NOT NULL DEFAULT '',
			video_portable_id			TEXT,
			is_corrupt					INTEGER NOT NULL DEFAULT 0, -- boolean
			corrupt_description			TEXT,
			is_missing					INTEGER NOT NULL DEFAULT 0, -- boolean
			is_readonly					INTEGER NOT NULL DEFAULT 0, -- boolean
			is_beatgrid_locked			INTEGER NOT NULL DEFAULT 0, -- boolean
			third_party_type			INTEGER CHECK( third_party_type IS NOT NULL AND third_party_type >= 0 ) DEFAULT 0,
			is_stale					INTEGER NOT NULL DEFAULT 0, -- boolean
			is_whitelabel				INTEGER NOT NULL DEFAULT 0, -- boolean
			is_karaoke					INTEGER NOT NULL DEFAULT 0, -- boolean
			dj_play_count				INTEGER,
			dj_recently_played			INTEGER NOT NULL DEFAULT 0, -- boolean
			analysis_flags				INTEGER NOT NULL DEFAULT 0, -- bitmap
			architectures				INTEGER NOT NULL DEFAULT 0, -- bitmap
			stems_analyze_state			INTEGER NOT NULL DEFAULT 0, -- bitmap
			type_specific_data			TEXT,

			-- Normalized searchable columns
			file_name_norm				TEXT,
			name_norm					TEXT,
			artist_norm					TEXT,
			album_norm					TEXT,
			genre_norm					TEXT,
			comments_norm				TEXT,
			label_norm					TEXT,
			remixer_norm				TEXT,
			grouping_norm				TEXT,
			composer_norm				TEXT,
			year_norm					TEXT,
			key_norm					TEXT,

			-- Pre-calculated columns
			key_value					INTEGER NOT NULL DEFAULT -1, rating REAL CHECK (rating IS NULL OR (rating BETWEEN 0 AND 1)), emoji TEXT NOT NULL DEFAULT '', import_id BLOB, explicit INTEGER NOT NULL DEFAULT 0, pending_tempo_map_analysis INTEGER,

			FOREIGN KEY(location_id) REFERENCES location(id) ON DELETE CASCADE

	);
CREATE INDEX asset__stale ON asset ( location_id, is_stale ) WHERE is_stale <> 0;
CREATE UNIQUE INDEX asset__unique_database ON asset ( location_id, portable_id COLLATE NOCASE );
CREATE UNIQUE INDEX asset__unique_external_id ON asset ( location_id, external_id );
CREATE TABLE "history_entry"
	(
			id							INTEGER PRIMARY KEY AUTOINCREMENT,
			location_id					INTEGER,
			portable_id					TEXT NOT NULL DEFAULT '',
			file_name					TEXT DEFAULT NULL,
			file_size					INTEGER,
			file_bit_rate				REAL,
			file_sample_rate			REAL,
			type						TEXT NOT NULL DEFAULT '',
			format						TEXT NOT NULL DEFAULT '',
			artist						TEXT NOT NULL DEFAULT '',
			color						INTEGER,
			comments					TEXT NOT NULL DEFAULT '',
			comment_language			TEXT NOT NULL DEFAULT '',
			comment_descriptor			TEXT NOT NULL DEFAULT '',
			grouping					TEXT NOT NULL DEFAULT '',
			remixer						TEXT NOT NULL DEFAULT '',
			name						TEXT NOT NULL DEFAULT '',
			album						TEXT NOT NULL DEFAULT '',
			composer					TEXT NOT NULL DEFAULT '',
			year						TEXT NOT NULL DEFAULT '',
			genre						TEXT NOT NULL DEFAULT '',
			key							TEXT NOT NULL DEFAULT '',
			label						TEXT NOT NULL DEFAULT '',
			bpm							REAL,
			length_sec					INTEGER,
			length_ms					INTEGER,
			time_added					INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
			time_modified				INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
			part_of_set					TEXT NOT NULL DEFAULT '',
			track_number				TEXT NOT NULL DEFAULT '',
			video_portable_id			TEXT,
			is_corrupt					INTEGER NOT NULL DEFAULT 0, -- boolean
			corrupt_description			TEXT,
			is_missing					INTEGER NOT NULL DEFAULT 0, -- boolean
			is_readonly					INTEGER NOT NULL DEFAULT 0, -- boolean
			is_beatgrid_locked			INTEGER NOT NULL DEFAULT 0, -- boolean
			third_party_type			INTEGER CHECK( third_party_type IS NOT NULL AND third_party_type >= 0 ) DEFAULT 0,
			is_stale					INTEGER NOT NULL DEFAULT 0, -- boolean
			is_whitelabel				INTEGER NOT NULL DEFAULT 0, -- boolean
			is_karaoke					INTEGER NOT NULL DEFAULT 0, -- boolean
			dj_play_count				INTEGER,
			dj_recently_played			INTEGER NOT NULL DEFAULT 0, -- boolean
			analysis_flags				INTEGER NOT NULL DEFAULT 0, -- bitmap
			architectures				INTEGER NOT NULL DEFAULT 0, -- bitmap
			stems_analyze_state			INTEGER NOT NULL DEFAULT 0, -- bitmap
			type_specific_data			TEXT,

			-- Normalized searchable columns
			file_name_norm				TEXT,
			name_norm					TEXT,
			artist_norm					TEXT,
			album_norm					TEXT,
			genre_norm					TEXT,
			comments_norm				TEXT,
			label_norm					TEXT,
			remixer_norm				TEXT,
			grouping_norm				TEXT,
			composer_norm				TEXT,
			year_norm					TEXT,
			key_norm					TEXT,

			-- Pre-calculated columns
			key_value					INTEGER NOT NULL DEFAULT -1,

			-- History Entry columns
			session_id					INTEGER NOT NULL DEFAULT -1,
			asset_id					INTEGER DEFAULT -1,
			start_time					INTEGER NOT NULL DEFAULT (strftime('%s', 'now') ),
			end_time					INTEGER DEFAULT -1,
			played						INTEGER NOT NULL DEFAULT 0, rating REAL CHECK (rating IS NULL OR (rating BETWEEN 0 AND 1)), emoji TEXT NOT NULL DEFAULT '', deck TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', needs_processing INTEGER DEFAULT 0, device TEXT NOT NULL DEFAULT '', app_name TEXT NOT NULL DEFAULT '', app_version TEXT NOT NULL DEFAULT '', explicit INTEGER NOT NULL DEFAULT 0, -- boolean

			FOREIGN KEY(session_id) REFERENCES history_session(id) ON DELETE CASCADE,
			FOREIGN KEY(location_id) REFERENCES location(id) ON DELETE SET NULL,
			FOREIGN KEY(asset_id) REFERENCES asset(id) ON DELETE SET NULL
	);
CREATE TABLE "history_session"
	(
		id							INTEGER PRIMARY KEY AUTOINCREMENT,
		start_time					INTEGER NOT NULL DEFAULT (strftime('%s', 'now') ),
		end_time					INTEGER,
		notes						TEXT,
		composer					TEXT,
		label						TEXT,
		comment						TEXT,
		grouping					TEXT,
		key							TEXT,
		year						TEXT
	, name TEXT);
CREATE TABLE alias_container
	(
		id							INTEGER PRIMARY KEY AUTOINCREMENT,
		container_id				INTEGER DEFAULT NULL,
		list_order					INTEGER NOT NULL,

		UNIQUE( container_id, list_order ),
		FOREIGN KEY( container_id ) REFERENCES container( id ) ON DELETE CASCADE
	);
CREATE TABLE dj_asset_metadata
	(
		asset_id					INTEGER PRIMARY KEY,
		video_effects				BLOB,
		batch_analysis_version		INTEGER,
		should_loop					INTEGER NOT NULL DEFAULT 0, -- boolean
		is_itunes					INTEGER NOT NULL DEFAULT 0, -- boolean
		itunes_id					TEXT,
		has_read_tags				INTEGER NOT NULL DEFAULT 0, -- boolean
		is_whitelabel_acl			INTEGER NOT NULL DEFAULT 0, -- boolean
		is_unsupported				INTEGER NOT NULL DEFAULT 0, -- boolean
		external_id					INTEGER,
		
		FOREIGN KEY (asset_id) REFERENCES asset(id) ON DELETE CASCADE
	);
CREATE TABLE dj_container_metadata
	(
		container_id				INTEGER PRIMARY KEY,
		export_state				INTEGER NOT NULL DEFAULT 0, -- DjContainerExportState
		filename					TEXT,
		
		FOREIGN KEY (container_id) REFERENCES container(id) ON DELETE CASCADE
	);
CREATE INDEX history_entry__asset_id ON history_entry ( asset_id );
CREATE INDEX history_entry__history_session_id ON history_entry ( session_id );
CREATE INDEX history_entry__location_id ON history_entry ( location_id );
CREATE INDEX asset__import_id ON asset ( import_id );
CREATE TABLE connection
(
	location_id     INTEGER PRIMARY KEY NOT NULL,
	database_uri    TEXT NOT NULL
);
CREATE VIEW location_connections(location_id, uuid, database_uri, show_when_disconnected) AS
	SELECT id, uuid, database_uri, show_when_disconnected
	FROM main.location LEFT OUTER JOIN connection ON main.location.id=connection.location_id
/* location_connections(location_id,uuid,database_uri,show_when_disconnected) */;
CREATE TABLE assetlist_context
(
	id							INTEGER PRIMARY KEY NOT NULL,
	source_type					INTEGER NOT NULL,
	source_view					TEXT,
	filter_conditions			TEXT,
	filter_terms				TEXT,
	filter_raw_text				TEXT,
	filter_columns				TEXT,
	filter_key_notation			INTEGER,
	source_table				TEXT,
	sort_index					TEXT,
	filter_sort_index			TEXT,
	primary_sort_column			TEXT,
	is_primary_sort_ascending	INTEGER,
	secondary_sort_column		TEXT,
	is_secondary_sort_ascending INTEGER,
	fallback_1_sort_column		TEXT,
	fallback_2_sort_column		TEXT,
	fallback_3_sort_column		TEXT,
	fallback_4_sort_column		TEXT,
	fallback_5_sort_column		TEXT,
	fallback_6_sort_column		TEXT,
	is_active					INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE assetlist_membership_triggers
(
	query_id INTEGER NOT NULL,
	name TEXT NOT NULL,

	FOREIGN KEY(query_id) REFERENCES assetlist_context(id) ON DELETE CASCADE
);
CREATE TABLE assetlist_sort_triggers
(
	query_id INTEGER NOT NULL,
	name TEXT NOT NULL,

	FOREIGN KEY(query_id) REFERENCES assetlist_context(id) ON DELETE CASCADE
);
CREATE TABLE assetlist_dependencies
(
	query_id INTEGER NOT NULL,
	query_depended_on INTEGER NOT NULL,
	source_query_order INTEGER NOT NULL,

	PRIMARY KEY(query_id, query_depended_on),

	FOREIGN KEY(query_id) REFERENCES assetlist_context(id) ON DELETE CASCADE
);
CREATE TABLE selection_asset
(
	selection_asset_id				INTEGER PRIMARY KEY NOT NULL,
	assetlist_id					INTEGER NOT NULL,
	asset_id						INTEGER NOT NULL,
	container_asset_id				INTEGER DEFAULT NULL,
	
	FOREIGN KEY(assetlist_id) REFERENCES assetlist_context(id) ON DELETE CASCADE,
	FOREIGN KEY(asset_id) REFERENCES asset(id) ON DELETE CASCADE,
	UNIQUE(assetlist_id, asset_id, container_asset_id)
);
CREATE INDEX selection_asset__asset_id ON selection_asset ( asset_id, container_asset_id );
CREATE TABLE static_selection
(
	static_selection_id				INTEGER PRIMARY KEY NOT NULL
);
CREATE TABLE static_selection_asset
(
	static_selection_id				INTEGER NOT NULL,
	asset_id						INTEGER NOT NULL,
	container_asset_id				INTEGER DEFAULT NULL,
	list_order						INTEGER NOT NULL,

	PRIMARY KEY( static_selection_id, list_order ),
	FOREIGN KEY( static_selection_id ) REFERENCES static_selection( static_selection_id ) ON DELETE CASCADE
);
CREATE TABLE selection_history_entry
(
	selection_id					INTEGER PRIMARY KEY NOT NULL,
	query_id						INTEGER NOT NULL,
	history_entry_id				INTEGER NOT NULL,
	
	FOREIGN KEY(query_id) REFERENCES assetlist_context(id) ON DELETE CASCADE,
	FOREIGN KEY(history_entry_id) REFERENCES history_entry(id) ON DELETE CASCADE,
	UNIQUE(query_id, history_entry_id)
);
CREATE TABLE spaces_for_this_session
(
	space_id						INTEGER PRIMARY KEY,
	
	FOREIGN KEY(space_id) REFERENCES space(id) ON DELETE CASCADE
);
CREATE TABLE updated_container
(
	container_id				INTEGER PRIMARY KEY NOT NULL
);
CREATE TABLE moved_container
(
	container_id				INTEGER PRIMARY KEY NOT NULL,
	old_parent_id				INTEGER NOT NULL,
	new_parent_id				INTEGER NOT NULL,
	index_under_new_parent		INTEGER DEFAULT NULL,
	
	FOREIGN KEY(container_id) REFERENCES container(id) ON DELETE CASCADE
);
CREATE TABLE updated_container_tree
(
	container_id				INTEGER PRIMARY KEY NOT NULL,
	
	FOREIGN KEY(container_id) REFERENCES container(id) ON DELETE CASCADE
);
CREATE TABLE spaces_with_new_assets
(
	space_id					INTEGER PRIMARY KEY NOT NULL
);
CREATE TABLE expanded_container_backup
(
	id							INTEGER PRIMARY KEY AUTOINCREMENT,
	container_id				INTEGER NOT NULL,
	space_id    				INTEGER,
	portable_id					TEXT NOT NULL
);
CREATE TABLE updated_smart_crate
(
	-- Use a separate id column here because we cannot use INSERT OR IGNORE in the relevant triggers as the smart crate rules get set using UPSERTs,
	-- and we cannot override the conflict handling in the trigger.
	id							INTEGER PRIMARY KEY AUTOINCREMENT,
	container_id				INTEGER NOT NULL
);
CREATE TABLE updated_container_asset_list_columns
(
	-- Use a separate id column here because we cannot use INSERT OR IGNORE in the relevant triggers as the columns get set using UPSERTs,
	-- and we cannot override the conflict handling in the trigger.
	id							INTEGER PRIMARY KEY AUTOINCREMENT,
	container_id				INTEGER NOT NULL
);
CREATE TABLE assetlist_needs_culling
(
	assetlist_id				INTEGER PRIMARY KEY NOT NULL
);
CREATE TABLE assetlist_needs_populating
(
	assetlist_id				INTEGER PRIMARY KEY NOT NULL
);
CREATE TABLE assetlist_needs_invalidation
(
	assetlist_id				INTEGER PRIMARY KEY NOT NULL
);
CREATE TABLE assetlist_needs_list_order_update
(
	assetlist_id				INTEGER PRIMARY KEY NOT NULL
);
CREATE TABLE assetlist_needs_selection_update
(
	assetlist_id				INTEGER PRIMARY KEY NOT NULL
);
CREATE TABLE assetlist_needs_sort_update
(
	assetlist_id				INTEGER NOT NULL,
	source_assetlist_id			INTEGER NOT NULL,
	source_assetlist_order		INTEGER NOT NULL,

	PRIMARY KEY(assetlist_id, source_assetlist_id)
);
CREATE TABLE updated_location
(
	location_id					INTEGER PRIMARY KEY NOT NULL
);
CREATE TABLE removed_asset
(
	location_id					INTEGER NOT NULL,
	portable_id					TEXT NOT NULL
);
CREATE TABLE reordered_container_asset
(
	container_asset_id			INTEGER PRIMARY KEY NOT NULL,
	list_order					INTEGER NOT NULL
);
CREATE TABLE container_keep_alive_list_tbl
(
	container_id    INTEGER NOT NULL,
	location_id     INTEGER NOT NULL,

	PRIMARY KEY (container_id, location_id),
	FOREIGN KEY (container_id) REFERENCES container (id) ON DELETE CASCADE
);
CREATE TRIGGER after_space_root_insert__add_keep_alive_entry
AFTER INSERT ON container
WHEN new.parent_id == 0
	BEGIN
		INSERT OR IGNORE INTO container_keep_alive_list_tbl ( container_id, location_id ) 
		VALUES ( new.id, 0 );
	END;
CREATE TRIGGER after_container_keep_alive_list_tbl_insert__generate_notifications
AFTER INSERT ON container_keep_alive_list_tbl
	BEGIN
		INSERT OR IGNORE INTO updated_container_tree (container_id) -- Notify the parent of the container being added
		SELECT main.container.parent_id
		FROM main.container
		WHERE main.container.id == new.container_id
		AND new.container_id NOT IN (                               -- Where the container being added was not previously visible
			SELECT already_visible.container_id 
			FROM container_keep_alive_list_tbl AS already_visible
			WHERE already_visible.location_id <> new.location_id
		)
		AND main.container.parent_id IN (                           -- And the container's parent is currently visible
			SELECT container_id FROM container_keep_alive_list_tbl
		);
	END;
CREATE TRIGGER after_container_keep_alive_list_tbl_delete__generate_notifications
AFTER DELETE ON container_keep_alive_list_tbl
	BEGIN
		INSERT OR IGNORE INTO updated_container_tree (container_id) -- Notify the parent of the container being deleted
		SELECT main.container.parent_id
		FROM main.container
		WHERE main.container.id == old.container_id                 -- Where the container being deleted is becoming hidden
		AND old.container_id NOT IN ( 
			SELECT container_id FROM container_keep_alive_list_tbl
		)
		AND main.container.parent_id IN (                           -- And the container's parent is currently visible
			SELECT container_id FROM container_keep_alive_list_tbl
		);
	END;
CREATE VIEW container_keep_alive_list AS SELECT * FROM container_keep_alive_list_tbl
/* container_keep_alive_list(container_id,location_id) */;
CREATE TRIGGER instead_of_container_keep_alive_list_insert__ensure_ancestor_consistency
INSTEAD OF INSERT ON container_keep_alive_list
	BEGIN
		-- Recursively ensure that the location being added also gets added to each of the ancestor's keep-alive lists in the underlying table
		INSERT OR IGNORE INTO container_keep_alive_list_tbl ( container_id, location_id )
		-- Define our recursion which will trace up the ancestor list
		WITH RECURSIVE ancestor( container_id, depth ) AS(

			-- With an initial result set containing only the new container
			SELECT new.container_id, 0

			UNION ALL

			-- Recursively select the ancestors already in the result set and add their parents to the result
			SELECT main.container.parent_id, ancestor.depth + 1
			FROM ancestor
			JOIN main.container ON main.container.id == ancestor.container_id
			AND main.container.parent_id IS NOT NULL                               -- Don't add the parent if it is NULL (as is the case with the root container)
			AND main.container.parent_id <> main.container.id                      -- Don't add the parent if it has an identical id to the child (this can occur temporarily during e.g. reparenting containers)
			AND main.container.parent_id NOT IN (                                  -- Don't add the parent if it is already being kept alive by the location
				SELECT container_id FROM container_keep_alive_list_tbl
				WHERE location_id == new.location_id
			)
		)
		-- Now select all of the ( ancestor, location_id ) values for inserton
		SELECT ancestor.container_id, new.location_id
		FROM ancestor
		ORDER BY ancestor.depth ASC; -- Insert from the bottom up so that we only generate a notification for the ancestor which is currently visible
	END;
CREATE TRIGGER instead_of_container_keep_alive_list_delete__ensure_descendant_consistency
INSTEAD OF DELETE ON container_keep_alive_list
	BEGIN
		-- Recursively ensure that the location being deleted does not appear in any of the descendant's keep-alive lists in the underlying table
		DELETE FROM container_keep_alive_list_tbl
		WHERE ( container_keep_alive_list_tbl.container_id, container_keep_alive_list_tbl.location_id ) IN (
			-- Define our recursion which will enumerate the descendants underneath the container
			WITH RECURSIVE descendant( container_id ) AS(

				-- With an initial result set containing only the deleted entry
				SELECT old.container_id

				UNION ALL

				-- Recursively select the descendants already in the result set and add their children to the result
				SELECT main.container.id
				FROM descendant
				JOIN main.container ON main.container.parent_id == descendant.container_id
				AND main.container.parent_id <> main.container.id                           -- Don't add the child if it has an identical id to the parent (this can occur temporarily during e.g. reparenting containers)
				AND descendant.container_id IN (                                            -- Only add the child if it is actually being kept alive by the location
					SELECT container_id FROM container_keep_alive_list_tbl
					WHERE location_id == old.location_id
				)
			)
			-- Now select all of the ( descendant, location_id ) values for deletion
			SELECT descendant.container_id, old.location_id
			FROM descendant
		);
	END;
CREATE TRIGGER after_connection_insert
AFTER INSERT ON connection
	BEGIN
		--- Mark that location as updated
		INSERT OR IGNORE INTO updated_location (location_id)
		SELECT new.location_id;

		--- Mark containers from that location as having updated contents (if they are visible)
		INSERT OR IGNORE INTO updated_container (container_id)
		SELECT container_id
		FROM location_container
		WHERE location_id = new.location_id
		AND container_id IN ( SELECT container_id FROM container_keep_alive_list );

		-- Add the location to all of the keep-alive lists for containers from that location
		INSERT OR IGNORE INTO container_keep_alive_list (container_id, location_id)
		SELECT leaf_lc.container_id, new.location_id
		FROM main.location_container AS leaf_lc
		WHERE leaf_lc.location_id == new.location_id
		-- Only explicitly add leaf containers. Our triggers will ensure that their ancestors are inserted.
		AND NOT EXISTS (
			SELECT 1
			FROM main.container AS child
			JOIN main.location_container AS child_lc ON child_lc.container_id == child.id 
			AND child_lc.location_id == new.location_id
			WHERE child.parent_id == leaf_lc.container_id
			AND child_lc.external_container_id IS NOT NULL
			LIMIT 1
		)
		--- We do not consider location containers with null external_container_id 
		--- e.g. Entries for locations which only contribute assets to smart crate containers.
		AND leaf_lc.external_container_id IS NOT NULL;
	END;
CREATE TRIGGER before_connection_delete
BEFORE DELETE ON connection
	BEGIN
		-- Remove the location from all container keep-alive lists
		DELETE FROM container_keep_alive_list
		WHERE location_id == old.location_id
		-- Only explicitly delete the keep-alive entries for the top-level containers. Our triggers will deal with updating their descendants
		AND container_id NOT IN (
			SELECT child.id
			FROM main.container AS child
			JOIN main.location_container AS parent_lc ON parent_lc.container_id == child.parent_id
			AND parent_lc.location_id == old.location_id
		);

		-- Remove any selected assets from the removed location from the selected_asset table
		DELETE FROM selection_asset
		WHERE asset_id IN (
			SELECT asset.id
			FROM main.asset AS asset
			WHERE asset.location_id == old.location_id
		);

		--- Mark containers on that location as having updated contents
		INSERT OR IGNORE INTO updated_container (container_id)
		SELECT container_id
		FROM location_container
		WHERE location_id = old.location_id;

		--- Mark that location as updated
		INSERT OR IGNORE INTO updated_location (location_id)
		SELECT old.location_id;
	END;
CREATE TRIGGER after_container_asset_insert
AFTER INSERT ON main.container_asset
	BEGIN
		--- Mark that assets container as having updated contents
		INSERT OR IGNORE INTO updated_container (container_id)
		SELECT container_id
		FROM location_container
		WHERE id = new.location_container_id;
	END;
CREATE TRIGGER before_container_asset_delete
BEFORE DELETE ON main.container_asset
	BEGIN
		--- Mark that assets container as having updated contents
		INSERT OR IGNORE INTO updated_container (container_id)
		SELECT container_id
		FROM location_container
		WHERE id = old.location_container_id;

		--- Delete the asset from any current selections
		DELETE FROM selection_asset
		WHERE selection_asset.asset_id = (
			SELECT asset_id FROM main.space_asset WHERE id = old.space_asset_id
		)
		AND selection_asset.container_asset_id = old.id;
	END;
CREATE TRIGGER before_location_container_insert
BEFORE INSERT ON main.location_container
	BEGIN
		-- If the location is connected then add it to the keep-alive list for container
		INSERT OR IGNORE INTO container_keep_alive_list ( container_id, location_id )
		SELECT new.container_id, new.location_id
			WHERE new.location_id IN ( SELECT location_id FROM connection )
		--- We do not consider location containers with null external_container_id 
		--- e.g. Entries for locations which only contribute assets to smart crate containers.
			AND new.external_container_id IS NOT NULL;
	END;
CREATE TRIGGER before_location_container_delete
BEFORE DELETE ON main.location_container
	BEGIN
		--- Mark that container as having updated contents
		INSERT OR IGNORE INTO updated_container (container_id)
		SELECT old.container_id
		WHERE EXISTS (
			SELECT 1
			FROM main.container_asset
			WHERE location_container_id = old.id
			LIMIT 1
		);
	END;
CREATE TRIGGER before_location_container_update
BEFORE UPDATE OF container_id ON main.location_container
	BEGIN
		--- If container_id is changing then mark updated contents on both containers
		INSERT OR IGNORE INTO updated_container (container_id)
		SELECT old.container_id
		WHERE old.location_id IN
		(
			SELECT location_id FROM connection
		);

		INSERT OR IGNORE INTO updated_container (container_id)
		SELECT new.container_id
		WHERE new.location_id IN
		(
			SELECT location_id FROM connection
		);
	END;
CREATE TRIGGER before_container_parent_update
BEFORE UPDATE OF parent_id ON main.container
	BEGIN
		-- Merge the reparented container's keep-alive list into the new parent's keep-alive list 
		-- to ensure that the parent always outlives its children.
		INSERT OR IGNORE INTO container_keep_alive_list ( container_id, location_id )
		SELECT new.parent_id, container_keep_alive_list.location_id
		FROM container_keep_alive_list
		WHERE container_keep_alive_list.container_id == old.id;

		--- If parent_id is changing (i.e. due to move), then generate a moved_container notification
		INSERT OR IGNORE INTO moved_container (container_id, new_parent_id, old_parent_id)
		SELECT new.id, new.parent_id, old.parent_id
		WHERE old.parent_id IS NOT NULL
		AND new.parent_id IS NOT NULL
		AND new.id IN (
			SELECT container_id FROM container_keep_alive_list
		);
	END;
CREATE TRIGGER before_container_name_update
BEFORE UPDATE OF name ON main.container
WHEN old.name <> new.name
	BEGIN
		--- Mark the container as having an updated tree if it is visible
		INSERT OR IGNORE INTO updated_container_tree (container_id)
		SELECT new.id
		WHERE new.id IN (
			SELECT container_id FROM container_keep_alive_list
		);
	END;
CREATE TRIGGER before_container_color_update
BEFORE UPDATE OF color ON main.container
WHEN old.color IS NOT new.color
	BEGIN
		--- Mark the container as having an updated tree if it is visible
		INSERT OR IGNORE INTO updated_container_tree (container_id)
		SELECT new.id
		WHERE new.id IN (
			SELECT container_id FROM container_keep_alive_list
		);
	END;
CREATE TRIGGER on_selection_asset_delete
BEFORE DELETE ON selection_asset
	BEGIN
		--- Mark the selection containing the deleted asset as updated
		INSERT OR IGNORE INTO assetlist_needs_selection_update (assetlist_id)
		SELECT old.assetlist_id;
	END;
CREATE TRIGGER after_asset_insert
AFTER INSERT ON main.asset
	BEGIN
		--- Update normalized columns
		UPDATE asset SET
			file_name_norm = serato_str_norm( file_name ),
			name_norm = serato_str_norm( name ),
			artist_norm = serato_str_norm( artist ),
			album_norm = serato_str_norm( album ),
			genre_norm = serato_str_norm( genre ),
			comments_norm = serato_str_norm( comments ),
			label_norm = serato_str_norm( label ),
			remixer_norm = serato_str_norm( remixer ),
			grouping_norm = serato_str_norm( grouping ),
			composer_norm = serato_str_norm( composer ),
			year_norm = serato_str_norm( year ),
			key_norm = serato_str_norm( key ),
			key_value = serato_raw_key_string_to_key_type( key )
		WHERE asset.id = new.id;
	END;
CREATE TRIGGER after_asset_update
AFTER UPDATE
-- Explicitly specify which columns we are listening for in order to avoid an endless recursion
OF file_name, name, artist, album, genre, comments, label, remixer, grouping, composer, year, key
ON main.asset 
	BEGIN
		--- Update normalized columns
		UPDATE asset SET
			file_name_norm = serato_str_norm( file_name ),
			name_norm = serato_str_norm( name ),
			artist_norm = serato_str_norm( artist ),
			album_norm = serato_str_norm( album ),
			genre_norm = serato_str_norm( genre ),
			comments_norm = serato_str_norm( comments ),
			label_norm = serato_str_norm( label ),
			remixer_norm = serato_str_norm( remixer ),
			grouping_norm = serato_str_norm( grouping ),
			composer_norm = serato_str_norm( composer ),
			year_norm = serato_str_norm( year ),
			key_norm = serato_str_norm( key ),
			key_value = serato_raw_key_string_to_key_type( key )
		WHERE asset.id = old.id;
	END;
CREATE TRIGGER after_history_entry_insert
AFTER INSERT ON main.history_entry
	BEGIN
		--- Update normalized columns
		UPDATE history_entry SET
			file_name_norm = serato_str_norm( IFNULL( file_name, '' ) ),
			name_norm = serato_str_norm( name ),
			artist_norm = serato_str_norm( artist ),
			album_norm = serato_str_norm( album ),
			genre_norm = serato_str_norm( genre ),
			comments_norm = serato_str_norm( comments ),
			label_norm = serato_str_norm( label ),
			remixer_norm = serato_str_norm( remixer ),
			grouping_norm = serato_str_norm( grouping ),
			composer_norm = serato_str_norm( composer ),
			year_norm = serato_str_norm( year ),
			key_norm = serato_str_norm( key ),
			key_value = serato_raw_key_string_to_key_type( key )
		WHERE history_entry.id = new.id;
	END;
CREATE TRIGGER after_history_entry_update
AFTER UPDATE
-- Explicitly specify which columns we are listening for in order to avoid an endless recursion
OF file_name, name, artist, album, genre, comments, label, remixer, grouping, composer, year, key
ON main.history_entry 
	BEGIN
		--- Update normalized columns
		UPDATE history_entry SET
			file_name_norm = serato_str_norm( IFNULL( file_name, '' ) ),
			name_norm = serato_str_norm( name ),
			artist_norm = serato_str_norm( artist ),
			album_norm = serato_str_norm( album ),
			genre_norm = serato_str_norm( genre ),
			comments_norm = serato_str_norm( comments ),
			label_norm = serato_str_norm( label ),
			remixer_norm = serato_str_norm( remixer ),
			grouping_norm = serato_str_norm( grouping ),
			composer_norm = serato_str_norm( composer ),
			year_norm = serato_str_norm( year ),
			key_norm = serato_str_norm( key ),
			key_value = serato_raw_key_string_to_key_type( key )
		WHERE history_entry.id = old.id;
	END;
CREATE TRIGGER on_asset_delete
BEFORE DELETE ON main.asset
	BEGIN
		--- Mark the location containing that asset as updated
		INSERT OR IGNORE INTO updated_location (location_id)
		SELECT old.location_id;
		INSERT INTO removed_asset VALUES (old.location_id, old.portable_id);
	END;
CREATE TRIGGER after_space_asset_delete
AFTER DELETE ON main.space_asset
	BEGIN
		--- Delete the asset from the library if it is no longer in a space
		DELETE FROM asset
		WHERE asset.id = old.asset_id
			AND NOT EXISTS( SELECT * FROM space_asset AS sa WHERE sa.asset_id = old.asset_id LIMIT 1 );
	END;
CREATE TRIGGER before_space_asset_insert
BEFORE INSERT ON main.space_asset
	BEGIN
		INSERT OR IGNORE INTO spaces_with_new_assets (space_id)
		SELECT new.space_id;
	END;
CREATE TRIGGER after_smart_crate_rules_insert
AFTER INSERT ON main.smart_crate_rules
	BEGIN
		INSERT INTO updated_smart_crate ( container_id )
		SELECT new.container_id;
	END;
CREATE TRIGGER after_smart_crate_rules_update
AFTER UPDATE ON main.smart_crate_rules
	BEGIN
		INSERT INTO updated_smart_crate ( container_id )
		SELECT new.container_id;
	END;
CREATE TRIGGER after_smart_crate_rules_delete
AFTER DELETE ON main.smart_crate_rules
	BEGIN
		INSERT INTO updated_smart_crate ( container_id )
		SELECT old.container_id;
	END;
CREATE TRIGGER after_container_asset_list_columns_insert
AFTER INSERT ON main.container_asset_list_columns
	BEGIN
		INSERT INTO updated_container_asset_list_columns ( container_id )
		SELECT new.container_id
		WHERE new.usage = 1; -- Library usage only
	END;
CREATE TRIGGER after_container_asset_list_columns_update
AFTER UPDATE ON main.container_asset_list_columns
	BEGIN
		INSERT INTO updated_container_asset_list_columns ( container_id )
		SELECT new.container_id
		WHERE new.usage = 1; -- Library usage only
	END;
CREATE TRIGGER after_container_asset_list_columns_delete
AFTER DELETE ON main.container_asset_list_columns
	BEGIN
		INSERT INTO updated_container_asset_list_columns ( container_id )
		SELECT old.container_id
		WHERE old.usage = 1; -- Library usage only
	END;
CREATE TABLE anonymous_table_0 (
		container_asset_id INTEGER NOT NULL,
asset_id INTEGER NOT NULL,
primary_sort BLOB,
secondary_sort BLOB,
fallback_1_sort BLOB,
fallback_2_sort BLOB,
fallback_3_sort BLOB,
fallback_4_sort BLOB,
fallback_5_sort BLOB,
fallback_6_sort BLOB,
is_visible INTEGER,
list_order INTEGER,
CONSTRAINT anonymous_table_0_primary_key PRIMARY KEY ( asset_id )
	);
CREATE TABLE anonymous_table_1 (
		container_asset_id INTEGER NOT NULL,
asset_id INTEGER NOT NULL,
primary_sort BLOB,
secondary_sort BLOB,
fallback_1_sort BLOB,
fallback_2_sort BLOB,
fallback_3_sort BLOB,
fallback_4_sort BLOB,
fallback_5_sort BLOB,
fallback_6_sort BLOB,
is_visible INTEGER,
list_order INTEGER,
CONSTRAINT anonymous_table_1_primary_key PRIMARY KEY ( asset_id )
	);
CREATE INDEX anonymous_index_1 ON anonymous_table_1 ( primary_sort COLLATE serato_asset_string_comparator ASC, fallback_1_sort COLLATE serato_asset_string_comparator ASC, fallback_2_sort COLLATE serato_asset_string_comparator ASC, fallback_3_sort COLLATE serato_asset_string_comparator ASC, fallback_4_sort COLLATE serato_asset_string_comparator ASC, fallback_5_sort COLLATE serato_asset_string_comparator ASC, fallback_6_sort COLLATE serato_asset_string_comparator ASC, list_order ASC ) 
	;
CREATE TABLE anonymous_table_2 (
		container_asset_id INTEGER NOT NULL,
asset_id INTEGER NOT NULL,
primary_sort BLOB,
secondary_sort BLOB,
fallback_1_sort BLOB,
fallback_2_sort BLOB,
fallback_3_sort BLOB,
fallback_4_sort BLOB,
fallback_5_sort BLOB,
fallback_6_sort BLOB,
is_visible INTEGER,
list_order INTEGER,
source_assetlist_order INTEGER NOT NULL,
CONSTRAINT anonymous_table_2_primary_key PRIMARY KEY ( asset_id )
	);
CREATE TABLE anonymous_table_4 (
		container_asset_id INTEGER NOT NULL,
asset_id INTEGER NOT NULL,
primary_sort BLOB,
secondary_sort BLOB,
fallback_1_sort BLOB,
fallback_2_sort BLOB,
fallback_3_sort BLOB,
fallback_4_sort BLOB,
fallback_5_sort BLOB,
fallback_6_sort BLOB,
is_visible INTEGER,
list_order INTEGER,
CONSTRAINT anonymous_table_4_primary_key PRIMARY KEY ( container_asset_id )
	);
CREATE INDEX anonymous_asset_id_index_0 ON anonymous_table_4 ( asset_id ASC ) 
	;
CREATE TABLE anonymous_table_5 (
		container_asset_id INTEGER NOT NULL,
asset_id INTEGER NOT NULL,
primary_sort BLOB,
secondary_sort BLOB,
fallback_1_sort BLOB,
fallback_2_sort BLOB,
fallback_3_sort BLOB,
fallback_4_sort BLOB,
fallback_5_sort BLOB,
fallback_6_sort BLOB,
is_visible INTEGER,
list_order INTEGER,
CONSTRAINT anonymous_table_5_primary_key PRIMARY KEY ( asset_id )
	);
CREATE TABLE anonymous_table_7 (
		container_asset_id INTEGER NOT NULL,
asset_id INTEGER NOT NULL,
primary_sort BLOB,
secondary_sort BLOB,
fallback_1_sort BLOB,
fallback_2_sort BLOB,
fallback_3_sort BLOB,
fallback_4_sort BLOB,
fallback_5_sort BLOB,
fallback_6_sort BLOB,
is_visible INTEGER,
list_order INTEGER,
CONSTRAINT anonymous_table_7_primary_key PRIMARY KEY ( asset_id )
	);
CREATE INDEX anonymous_index_6 ON anonymous_table_7 ( primary_sort COLLATE serato_asset_string_comparator ASC, fallback_1_sort COLLATE serato_asset_string_comparator ASC, fallback_2_sort COLLATE serato_asset_string_comparator ASC, fallback_3_sort COLLATE serato_asset_string_comparator ASC, fallback_4_sort COLLATE serato_asset_string_comparator ASC, fallback_5_sort COLLATE serato_asset_string_comparator ASC, fallback_6_sort COLLATE serato_asset_string_comparator ASC, list_order ASC ) 
	;
CREATE INDEX anonymous_index_8 ON anonymous_table_0 ( primary_sort COLLATE serato_asset_string_comparator ASC, fallback_1_sort COLLATE serato_asset_string_comparator ASC, fallback_2_sort COLLATE serato_asset_string_comparator ASC, fallback_3_sort COLLATE serato_asset_string_comparator ASC, fallback_4_sort COLLATE serato_asset_string_comparator ASC, fallback_5_sort COLLATE serato_asset_string_comparator ASC, fallback_6_sort COLLATE serato_asset_string_comparator ASC, list_order ASC ) 
	;
CREATE INDEX anonymous_index_10 ON anonymous_table_2 ( primary_sort COLLATE serato_asset_string_comparator ASC, fallback_1_sort COLLATE serato_asset_string_comparator ASC, fallback_2_sort COLLATE serato_asset_string_comparator ASC, fallback_3_sort COLLATE serato_asset_string_comparator ASC, fallback_4_sort COLLATE serato_asset_string_comparator ASC, fallback_5_sort COLLATE serato_asset_string_comparator ASC, fallback_6_sort COLLATE serato_asset_string_comparator ASC, list_order ASC ) 
	;
CREATE TABLE anonymous_table_9 (
		history_entry_id INTEGER NOT NULL,
primary_sort BLOB,
secondary_sort BLOB,
fallback_1_sort BLOB,
fallback_2_sort BLOB,
fallback_3_sort BLOB,
fallback_4_sort BLOB,
fallback_5_sort BLOB,
fallback_6_sort BLOB,
is_visible INTEGER,
list_order INTEGER,
CONSTRAINT anonymous_table_9_primary_key PRIMARY KEY ( history_entry_id )
	);
CREATE INDEX anonymous_index_12 ON anonymous_table_9 ( primary_sort COLLATE serato_asset_string_comparator ASC, fallback_1_sort COLLATE serato_asset_string_comparator ASC, fallback_2_sort COLLATE serato_asset_string_comparator ASC, fallback_3_sort COLLATE serato_asset_string_comparator ASC, fallback_4_sort COLLATE serato_asset_string_comparator ASC, fallback_5_sort COLLATE serato_asset_string_comparator ASC, fallback_6_sort COLLATE serato_asset_string_comparator ASC, list_order ASC ) 
	;
CREATE TABLE anonymous_table_10 (
		container_asset_id INTEGER NOT NULL,
asset_id INTEGER NOT NULL,
primary_sort BLOB,
secondary_sort BLOB,
fallback_1_sort BLOB,
fallback_2_sort BLOB,
fallback_3_sort BLOB,
fallback_4_sort BLOB,
fallback_5_sort BLOB,
fallback_6_sort BLOB,
is_visible INTEGER,
list_order INTEGER,
CONSTRAINT anonymous_table_10_primary_key PRIMARY KEY ( container_asset_id )
	);
CREATE INDEX anonymous_asset_id_index_2 ON anonymous_table_10 ( asset_id ASC ) 
	;
CREATE INDEX anonymous_index_13 ON anonymous_table_10 ( primary_sort COLLATE serato_asset_string_comparator ASC, fallback_1_sort COLLATE serato_asset_string_comparator ASC, fallback_2_sort COLLATE serato_asset_string_comparator ASC, fallback_3_sort COLLATE serato_asset_string_comparator ASC, fallback_4_sort COLLATE serato_asset_string_comparator ASC, fallback_5_sort COLLATE serato_asset_string_comparator ASC, fallback_6_sort COLLATE serato_asset_string_comparator ASC, list_order ASC ) 
	;
CREATE TABLE anonymous_table_11 (
		container_asset_id INTEGER NOT NULL,
asset_id INTEGER NOT NULL,
primary_sort BLOB,
secondary_sort BLOB,
fallback_1_sort BLOB,
fallback_2_sort BLOB,
fallback_3_sort BLOB,
fallback_4_sort BLOB,
fallback_5_sort BLOB,
fallback_6_sort BLOB,
is_visible INTEGER,
list_order INTEGER,
CONSTRAINT anonymous_table_11_primary_key PRIMARY KEY ( container_asset_id )
	);
CREATE INDEX anonymous_asset_id_index_3 ON anonymous_table_11 ( asset_id ASC ) 
	;
CREATE INDEX anonymous_index_14 ON anonymous_table_11 ( primary_sort COLLATE serato_asset_string_comparator DESC, secondary_sort COLLATE serato_asset_string_comparator ASC, fallback_1_sort COLLATE serato_asset_string_comparator DESC, fallback_2_sort COLLATE serato_asset_string_comparator DESC, fallback_3_sort COLLATE serato_asset_string_comparator DESC, fallback_4_sort COLLATE serato_asset_string_comparator DESC, fallback_5_sort COLLATE serato_asset_string_comparator DESC, fallback_6_sort COLLATE serato_asset_string_comparator DESC, list_order DESC ) 
	;
CREATE TABLE anonymous_table_12 (
		container_asset_id INTEGER NOT NULL,
asset_id INTEGER NOT NULL,
primary_sort BLOB,
secondary_sort BLOB,
fallback_1_sort BLOB,
fallback_2_sort BLOB,
fallback_3_sort BLOB,
fallback_4_sort BLOB,
fallback_5_sort BLOB,
fallback_6_sort BLOB,
is_visible INTEGER,
list_order INTEGER,
CONSTRAINT anonymous_table_12_primary_key PRIMARY KEY ( asset_id )
	);
CREATE INDEX anonymous_index_15 ON anonymous_table_12 ( primary_sort COLLATE serato_asset_string_comparator ASC, fallback_1_sort COLLATE serato_asset_string_comparator ASC, fallback_2_sort COLLATE serato_asset_string_comparator ASC, fallback_3_sort COLLATE serato_asset_string_comparator ASC, fallback_4_sort COLLATE serato_asset_string_comparator ASC, fallback_5_sort COLLATE serato_asset_string_comparator ASC, fallback_6_sort COLLATE serato_asset_string_comparator ASC, list_order ASC ) 
	;
CREATE TABLE anonymous_table_13 (
		container_asset_id INTEGER NOT NULL,
asset_id INTEGER NOT NULL,
primary_sort BLOB,
secondary_sort BLOB,
fallback_1_sort BLOB,
fallback_2_sort BLOB,
fallback_3_sort BLOB,
fallback_4_sort BLOB,
fallback_5_sort BLOB,
fallback_6_sort BLOB,
is_visible INTEGER,
list_order INTEGER,
CONSTRAINT anonymous_table_13_primary_key PRIMARY KEY ( asset_id )
	);
CREATE INDEX anonymous_index_16 ON anonymous_table_13 ( primary_sort COLLATE serato_asset_string_comparator DESC, secondary_sort COLLATE serato_asset_string_comparator ASC, fallback_1_sort COLLATE serato_asset_string_comparator DESC, fallback_2_sort COLLATE serato_asset_string_comparator DESC, fallback_3_sort COLLATE serato_asset_string_comparator DESC, fallback_4_sort COLLATE serato_asset_string_comparator DESC, fallback_5_sort COLLATE serato_asset_string_comparator DESC, fallback_6_sort COLLATE serato_asset_string_comparator DESC, list_order DESC ) 
	;
CREATE INDEX anonymous_index_17 ON anonymous_table_4 ( primary_sort COLLATE serato_asset_string_comparator ASC, fallback_1_sort COLLATE serato_asset_string_comparator ASC, fallback_2_sort COLLATE serato_asset_string_comparator ASC, fallback_3_sort COLLATE serato_asset_string_comparator ASC, fallback_4_sort COLLATE serato_asset_string_comparator ASC, fallback_5_sort COLLATE serato_asset_string_comparator ASC, fallback_6_sort COLLATE serato_asset_string_comparator ASC, list_order ASC ) 
	;
CREATE TABLE anonymous_table_14 (
		container_asset_id INTEGER NOT NULL,
asset_id INTEGER NOT NULL,
primary_sort BLOB,
secondary_sort BLOB,
fallback_1_sort BLOB,
fallback_2_sort BLOB,
fallback_3_sort BLOB,
fallback_4_sort BLOB,
fallback_5_sort BLOB,
fallback_6_sort BLOB,
is_visible INTEGER,
list_order INTEGER,
CONSTRAINT anonymous_table_14_primary_key PRIMARY KEY ( asset_id )
	);
CREATE INDEX anonymous_index_18 ON anonymous_table_14 ( primary_sort COLLATE serato_asset_string_comparator ASC, fallback_1_sort COLLATE serato_asset_string_comparator ASC, fallback_2_sort COLLATE serato_asset_string_comparator ASC, fallback_3_sort COLLATE serato_asset_string_comparator ASC, fallback_4_sort COLLATE serato_asset_string_comparator ASC, fallback_5_sort COLLATE serato_asset_string_comparator ASC, fallback_6_sort COLLATE serato_asset_string_comparator ASC, list_order ASC ) 
	;
CREATE TABLE anonymous_table_15 (
		container_asset_id INTEGER NOT NULL,
asset_id INTEGER NOT NULL,
primary_sort BLOB,
secondary_sort BLOB,
fallback_1_sort BLOB,
fallback_2_sort BLOB,
fallback_3_sort BLOB,
fallback_4_sort BLOB,
fallback_5_sort BLOB,
fallback_6_sort BLOB,
is_visible INTEGER,
list_order INTEGER,
CONSTRAINT anonymous_table_15_primary_key PRIMARY KEY ( asset_id )
	);
CREATE INDEX anonymous_index_19 ON anonymous_table_15 ( primary_sort COLLATE serato_asset_string_comparator ASC, fallback_1_sort COLLATE serato_asset_string_comparator ASC, fallback_2_sort COLLATE serato_asset_string_comparator ASC, fallback_3_sort COLLATE serato_asset_string_comparator ASC, fallback_4_sort COLLATE serato_asset_string_comparator ASC, fallback_5_sort COLLATE serato_asset_string_comparator ASC, fallback_6_sort COLLATE serato_asset_string_comparator ASC, list_order ASC ) 
	;
CREATE TABLE anonymous_table_16 (
		container_asset_id INTEGER NOT NULL,
asset_id INTEGER NOT NULL,
primary_sort BLOB,
secondary_sort BLOB,
fallback_1_sort BLOB,
fallback_2_sort BLOB,
fallback_3_sort BLOB,
fallback_4_sort BLOB,
fallback_5_sort BLOB,
fallback_6_sort BLOB,
is_visible INTEGER,
list_order INTEGER,
CONSTRAINT anonymous_table_16_primary_key PRIMARY KEY ( asset_id )
	);
CREATE INDEX anonymous_index_20 ON anonymous_table_16 ( primary_sort COLLATE serato_asset_string_comparator DESC, secondary_sort COLLATE serato_asset_string_comparator ASC, fallback_1_sort COLLATE serato_asset_string_comparator DESC, fallback_2_sort COLLATE serato_asset_string_comparator DESC, fallback_3_sort COLLATE serato_asset_string_comparator DESC, fallback_4_sort COLLATE serato_asset_string_comparator DESC, fallback_5_sort COLLATE serato_asset_string_comparator DESC, fallback_6_sort COLLATE serato_asset_string_comparator DESC, list_order DESC ) 
	;
CREATE INDEX anonymous_index_21 ON anonymous_table_0 ( primary_sort COLLATE serato_asset_string_comparator ASC ) WHERE is_visible == 1
	;
CREATE INDEX anonymous_index_22 ON anonymous_table_5 ( primary_sort COLLATE serato_asset_string_comparator ASC, fallback_1_sort COLLATE serato_asset_string_comparator ASC, fallback_2_sort COLLATE serato_asset_string_comparator ASC, fallback_3_sort COLLATE serato_asset_string_comparator ASC, fallback_4_sort COLLATE serato_asset_string_comparator ASC, fallback_5_sort COLLATE serato_asset_string_comparator ASC, fallback_6_sort COLLATE serato_asset_string_comparator ASC, list_order ASC ) 
	;
