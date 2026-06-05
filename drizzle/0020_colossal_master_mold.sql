CREATE TABLE `slider` (
	`id` int AUTO_INCREMENT NOT NULL,
	`seriesId` int NOT NULL,
	`order` int NOT NULL DEFAULT 1,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `slider_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `slider` ADD CONSTRAINT `slider_seriesId_series_id_fk` FOREIGN KEY (`seriesId`) REFERENCES `series`(`id`) ON DELETE cascade ON UPDATE no action;