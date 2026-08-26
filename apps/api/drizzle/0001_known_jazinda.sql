CREATE TABLE `projects` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`user_id` varchar(36),
	`config` json NOT NULL DEFAULT ('{"version":1,"widgets":[],"canvas":{"zoom":1}}'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
