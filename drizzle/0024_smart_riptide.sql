CREATE TABLE `telegramBot` (
	`id` int AUTO_INCREMENT NOT NULL,
	`botToken` varchar(255) NOT NULL,
	`botUsername` varchar(255),
	`authorizedChatIds` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `telegramBot_id` PRIMARY KEY(`id`),
	CONSTRAINT `telegramBot_botToken_unique` UNIQUE(`botToken`)
);
--> statement-breakpoint
CREATE TABLE `telegramOperations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chatId` varchar(50) NOT NULL,
	`userId` varchar(50) NOT NULL,
	`operationType` enum('add_series','add_episode','upload_video','add_image') NOT NULL,
	`status` enum('pending','in_progress','completed','failed') DEFAULT 'pending',
	`data` text,
	`messageId` varchar(50),
	`seriesId` int,
	`episodeId` int,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `telegramOperations_id` PRIMARY KEY(`id`)
);
