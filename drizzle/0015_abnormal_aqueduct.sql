ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerificationCode` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerificationExpiry` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `rememberMe` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetToken` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetExpiry` timestamp;