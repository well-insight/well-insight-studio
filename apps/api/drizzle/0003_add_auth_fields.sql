-- 增加用户密码字段
ALTER TABLE `users` ADD COLUMN `password_hash` varchar(255) NOT NULL AFTER `display_name`;
ALTER TABLE `users` ADD COLUMN `updated_at` timestamp DEFAULT now() NOT NULL ON UPDATE now() AFTER `created_at`;

-- 项目与用户绑定（保留旧项目 user_id 为空，避免破坏已有数据）
ALTER TABLE `projects` ADD INDEX `idx_projects_user_id` (`user_id`);
