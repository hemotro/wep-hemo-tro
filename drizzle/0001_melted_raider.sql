CREATE TABLE `episodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`seriesId` int NOT NULL,
	`season` int NOT NULL,
	`episodeNumber` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`titleAr` varchar(255) NOT NULL,
	`description` text,
	`descriptionAr` text,
	`videoUrl` varchar(500) NOT NULL,
	`duration` int,
	`releaseDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `episodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `series` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`titleAr` varchar(255) NOT NULL,
	`description` text,
	`descriptionAr` text,
	`genre` varchar(255),
	`posterUrl` varchar(500),
	`totalSeasons` int DEFAULT 1,
	`currentSeason` int DEFAULT 1,
	`totalEpisodes` int DEFAULT 0,
	`rating` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `series_id` PRIMARY KEY(`id`)
);
