ALTER TABLE `episodes` ADD `videoType` enum('youtube','m3u8','mp4') DEFAULT 'youtube';--> statement-breakpoint
ALTER TABLE `episodes` ADD `videoSize` int;--> statement-breakpoint
ALTER TABLE `episodes` ADD `videoDuration` int;