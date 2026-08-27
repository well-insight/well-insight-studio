-- Add a unique account name for username-or-email authentication.
-- Existing users receive a deterministic, collision-free legacy username.
ALTER TABLE `users` ADD COLUMN `username` varchar(64) NULL AFTER `id`;

UPDATE `users`
SET `username` = CONCAT('user_', REPLACE(`id`, '-', ''))
WHERE `username` IS NULL;

ALTER TABLE `users` MODIFY COLUMN `username` varchar(64) NOT NULL;
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE (`username`);
