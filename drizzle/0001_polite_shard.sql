CREATE TABLE `diet_meals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`diet_plan_id` integer NOT NULL,
	`meal_order` integer NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`protein` text NOT NULL,
	`calories` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`diet_plan_id`) REFERENCES `diet_plans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `diet_meals_plan_order_unique` ON `diet_meals` (`diet_plan_id`,`meal_order`);--> statement-breakpoint
CREATE INDEX `diet_meals_plan_idx` ON `diet_meals` (`diet_plan_id`);--> statement-breakpoint
CREATE TABLE `diet_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`target_calories` text NOT NULL,
	`target_protein` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `diet_plans_name_unique` ON `diet_plans` (`name`);--> statement-breakpoint
CREATE TABLE `workout_days` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workout_plan_id` integer NOT NULL,
	`day_of_week` integer NOT NULL,
	`title` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`workout_plan_id`) REFERENCES `workout_plans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workout_days_plan_day_unique` ON `workout_days` (`workout_plan_id`,`day_of_week`);--> statement-breakpoint
CREATE INDEX `workout_days_plan_idx` ON `workout_days` (`workout_plan_id`);--> statement-breakpoint
CREATE TABLE `workout_exercises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workout_day_id` integer NOT NULL,
	`exercise_order` integer NOT NULL,
	`name` text NOT NULL,
	`sets` text,
	`reps` text,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`workout_day_id`) REFERENCES `workout_days`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workout_exercises_day_order_unique` ON `workout_exercises` (`workout_day_id`,`exercise_order`);--> statement-breakpoint
CREATE INDEX `workout_exercises_day_idx` ON `workout_exercises` (`workout_day_id`);--> statement-breakpoint
CREATE TABLE `workout_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workout_plans_name_unique` ON `workout_plans` (`name`);--> statement-breakpoint
ALTER TABLE `daily_logs` ADD `workout_plan_id` integer REFERENCES workout_plans(id);--> statement-breakpoint
ALTER TABLE `daily_logs` ADD `diet_plan_id` integer REFERENCES diet_plans(id);