DROP INDEX IF EXISTS `daily_logs_date_unique`;--> statement-breakpoint
ALTER TABLE `daily_logs` ADD `user_id` integer REFERENCES auth_users(id);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `daily_logs_user_date_unique` ON `daily_logs` (`user_id`,`date`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `daily_logs_user_idx` ON `daily_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `daily_logs_date_idx` ON `daily_logs` (`date`);
