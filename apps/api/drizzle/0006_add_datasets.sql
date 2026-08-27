CREATE TABLE `dataset_folders` (
  `id` varchar(36) NOT NULL,
  `project_id` varchar(36),
  `parent_id` varchar(36),
  `name` varchar(255) NOT NULL,
  `description` varchar(2000),
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `dataset_folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `datasets` (
  `id` varchar(36) NOT NULL,
  `project_id` varchar(36),
  `folder_id` varchar(36),
  `name` varchar(255) NOT NULL,
  `description` varchar(5000),
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `datasets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dataset_fields` (
  `id` varchar(36) NOT NULL,
  `dataset_id` varchar(36) NOT NULL,
  `name` varchar(200) NOT NULL,
  `field_type` varchar(20) NOT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `dataset_fields_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dataset_rows` (
  `id` varchar(36) NOT NULL,
  `dataset_id` varchar(36) NOT NULL,
  `values_json` json NOT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `dataset_rows_id` PRIMARY KEY(`id`)
);
