CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`email` varchar(320) NOT NULL,
	`display_name` varchar(120) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
