CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`seriesId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`seriesId` int,
	`episodeId` int,
	`rating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ratings_id` PRIMARY KEY(`id`)
);
