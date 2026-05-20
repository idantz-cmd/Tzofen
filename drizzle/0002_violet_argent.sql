CREATE TABLE `advancedPredictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`matchId` int NOT NULL,
	`goalsOverUnder` enum('over','under'),
	`cornersOverUnder` enum('over','under'),
	`yellowCardsOverUnder` enum('over','under'),
	`redCardInMatch` boolean,
	`points` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `advancedPredictions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`receiverId` int NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competitionParticipants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competitionId` int NOT NULL,
	`userId` int NOT NULL,
	`points` int DEFAULT 0,
	`rank` int,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `competitionParticipants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('tournament','head_to_head') NOT NULL,
	`creatorId` int NOT NULL,
	`status` enum('active','completed','cancelled') NOT NULL DEFAULT 'active',
	`maxParticipants` int DEFAULT 50,
	`startDate` timestamp,
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `competitions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matchAdvancedStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`totalGoals` int,
	`totalCorners` int,
	`totalYellowCards` int,
	`totalRedCards` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `matchAdvancedStats_id` PRIMARY KEY(`id`),
	CONSTRAINT `matchAdvancedStats_matchId_unique` UNIQUE(`matchId`)
);
--> statement-breakpoint
CREATE TABLE `userStreaks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentStreak` int DEFAULT 0,
	`bestStreak` int DEFAULT 0,
	`lastCorrectAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userStreaks_id` PRIMARY KEY(`id`),
	CONSTRAINT `userStreaks_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `leaderboardScores` MODIFY COLUMN `accuracyRate` decimal(5,2) DEFAULT '0';