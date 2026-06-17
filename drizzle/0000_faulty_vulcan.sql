CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`passwordHash` text NOT NULL,
	`role` text DEFAULT 'user',
	`favTeam` text,
	`plan` text DEFAULT 'free',
	`createdAt` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_idx` ON `users` (`email`);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`homeTeam` text NOT NULL,
	`awayTeam` text NOT NULL,
	`matchDate` text NOT NULL,
	`league` text NOT NULL,
	`matchweek` integer,
	`season` text DEFAULT '2025-26',
	`status` text DEFAULT 'scheduled',
	`actualResult` text,
	`actualHomeScore` integer,
	`actualAwayScore` integer,
	`aiHomeProbability` real,
	`aiDrawProbability` real,
	`aiAwayProbability` real,
	`competition_type` text DEFAULT 'premier_league',
	`cup_round` text,
	`allows_draw` integer DEFAULT true
);
--> statement-breakpoint
CREATE INDEX `match_date_idx` ON `matches` (`matchDate`);
--> statement-breakpoint
CREATE INDEX `match_status_idx` ON `matches` (`status`);
--> statement-breakpoint
CREATE INDEX `match_week_idx` ON `matches` (`matchweek`, `season`);
--> statement-breakpoint
CREATE INDEX `match_league_idx` ON `matches` (`league`);
--> statement-breakpoint
CREATE INDEX `match_comp_round_idx` ON `matches` (`competition_type`, `cup_round`);
--> statement-breakpoint
CREATE TABLE `predictions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`matchId` integer NOT NULL,
	`prediction` text NOT NULL,
	`confidence` integer,
	`predictedHomeScore` integer,
	`predictedAwayScore` integer,
	`points` integer DEFAULT 0,
	`isCorrect` integer DEFAULT false,
	`createdAt` text
);
--> statement-breakpoint
CREATE INDEX `pred_user_idx` ON `predictions` (`userId`);
--> statement-breakpoint
CREATE INDEX `pred_match_idx` ON `predictions` (`matchId`);
--> statement-breakpoint
CREATE UNIQUE INDEX `pred_unique` ON `predictions` (`userId`, `matchId`);
--> statement-breakpoint
CREATE TABLE `leaderboardScores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`totalPoints` integer DEFAULT 0,
	`weeklyPoints` integer DEFAULT 0,
	`totalPredictions` integer DEFAULT 0,
	`correctPredictions` integer DEFAULT 0,
	`accuracyRate` real DEFAULT 0,
	`currentStreak` integer DEFAULT 0,
	`longestStreak` integer DEFAULT 0
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leaderboardScores_userId_unique` ON `leaderboardScores` (`userId`);
--> statement-breakpoint
CREATE INDEX `lb_points_idx` ON `leaderboardScores` (`totalPoints`);
--> statement-breakpoint
CREATE INDEX `lb_weekly_idx` ON `leaderboardScores` (`weeklyPoints`);
--> statement-breakpoint
CREATE INDEX `lb_user_idx` ON `leaderboardScores` (`userId`);
--> statement-breakpoint
CREATE TABLE `standings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`teamId` integer NOT NULL,
	`league` text NOT NULL,
	`season` text DEFAULT '2025-26',
	`position` integer NOT NULL,
	`played` integer DEFAULT 0,
	`won` integer DEFAULT 0,
	`drawn` integer DEFAULT 0,
	`lost` integer DEFAULT 0,
	`goalsFor` integer DEFAULT 0,
	`goalsAgainst` integer DEFAULT 0,
	`points` integer DEFAULT 0,
	`form` text
);
--> statement-breakpoint
CREATE INDEX `std_league_season_idx` ON `standings` (`league`, `season`);
--> statement-breakpoint
CREATE TABLE `cup_champion_predictions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`season` text NOT NULL DEFAULT '2024-25',
	`teamName` text NOT NULL,
	`predictedAt` text,
	`isCorrect` integer,
	`pointsAwarded` integer DEFAULT 0
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cup_champ_user_season` ON `cup_champion_predictions` (`userId`, `season`);
