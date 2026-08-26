CREATE TABLE `datasource_connections` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` varchar(20) NOT NULL DEFAULT 'mysql',
	`connection_string` varchar(2048),
	`schema_cache` json NOT NULL DEFAULT ('{}'),
	`last_sync_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `datasource_connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `query_cache` (
	`id` varchar(36) NOT NULL,
	`datasource_id` varchar(36) NOT NULL,
	`query_hash` varchar(64) NOT NULL,
	`result_data` json NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `query_cache_id` PRIMARY KEY(`id`)
);
