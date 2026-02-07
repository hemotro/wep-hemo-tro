CREATE TABLE `channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameAr` varchar(255) NOT NULL,
	`logoUrl` varchar(500),
	`streamUrl` varchar(500) NOT NULL,
	`streamType` enum('m3u8','youtube') NOT NULL,
	`description` text,
	`descriptionAr` text,
	`isActive` boolean DEFAULT true,
	`displayOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `channels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `series` ADD `promoUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `series` ADD `promoTitle` varchar(255);