CREATE TABLE `seriesImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`seriesId` int NOT NULL,
	`imageType` varchar(50) NOT NULL,
	`imageUrl` varchar(500) NOT NULL,
	`alt` varchar(255),
	`isDefault` boolean DEFAULT false,
	`displayOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `seriesImages_id` PRIMARY KEY(`id`)
);
