-- The authentication model now requires username-based accounts.
-- This project intentionally does not migrate legacy users or their owned data.
DELETE FROM `query_cache`;
DELETE FROM `datasource_connections`;
DELETE FROM `projects`;
DELETE FROM `users`;
