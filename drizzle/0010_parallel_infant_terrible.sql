CREATE TABLE `watchHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`episodeId` int NOT NULL,
	`seriesId` int NOT NULL,
	`currentTime` int DEFAULT 0,
	`duration` int DEFAULT 0,
	`isCompleted` boolean DEFAULT false,
	`lastWatchedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `watchHistory_id` PRIMARY KEY(`id`)
);
