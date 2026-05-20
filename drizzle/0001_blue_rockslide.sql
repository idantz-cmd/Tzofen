CREATE TABLE `leaderboardScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalPoints` int DEFAULT 0,
	`totalPredictions` int DEFAULT 0,
	`correctPredictions` int DEFAULT 0,
	`accuracyRate` decimal(5,2) DEFAULT 0,
	`weeklyPoints` int DEFAULT 0,
	`weeklyPredictions` int DEFAULT 0,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leaderboardScores_id` PRIMARY KEY(`id`),
	CONSTRAINT `leaderboardScores_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`league` enum('ligat_hael','ligah_leumit') NOT NULL,
	`homeTeam` varchar(100) NOT NULL,
	`awayTeam` varchar(100) NOT NULL,
	`matchDate` timestamp NOT NULL,
	`homeTeamLogo` varchar(500),
	`awayTeamLogo` varchar(500),
	`aiHomeWinProb` decimal(5,2),
	`aiDrawProb` decimal(5,2),
	`aiAwayWinProb` decimal(5,2),
	`aiRecommendedPick` enum('home_win','draw','away_win'),
	`aiReasoning` text,
	`actualResult` enum('home_win','draw','away_win'),
	`homeTeamScore` int,
	`awayTeamScore` int,
	`resultPublished` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text,
	`type` enum('result_published','score_updated','match_reminder','achievement') NOT NULL,
	`relatedMatchId` int,
	`emailSent` boolean DEFAULT false,
	`read` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `predictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`matchId` int NOT NULL,
	`prediction` enum('home_win','draw','away_win') NOT NULL,
	`confidence` decimal(5,2),
	`points` int DEFAULT 0,
	`isCorrect` boolean,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `predictions_id` PRIMARY KEY(`id`)
);
