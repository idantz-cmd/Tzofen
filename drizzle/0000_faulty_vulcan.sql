CREATE TABLE `advancedPredictions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`matchId` integer NOT NULL,
	`goalsOverUnder` text,
	`cornersOverUnder` text,
	`yellowCardsOverUnder` text,
	`redCardInMatch` integer,
	`points` integer DEFAULT 0,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `chatMessages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`senderId` integer NOT NULL,
	`receiverId` integer NOT NULL,
	`message` text NOT NULL,
	`isRead` integer DEFAULT false,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `competitionParticipants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`competitionId` integer NOT NULL,
	`userId` integer NOT NULL,
	`points` integer DEFAULT 0,
	`rank` integer,
	`joinedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `competitions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`creatorId` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`maxParticipants` integer DEFAULT 50,
	`startDate` integer,
	`endDate` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `leaderboardScores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`totalPoints` integer DEFAULT 0,
	`totalPredictions` integer DEFAULT 0,
	`correctPredictions` integer DEFAULT 0,
	`accuracyRate` real DEFAULT 0,
	`weeklyPoints` integer DEFAULT 0,
	`weeklyPredictions` integer DEFAULT 0,
	`lastUpdated` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leaderboardScores_userId_unique` ON `leaderboardScores` (`userId`);--> statement-breakpoint
CREATE TABLE `matchAdvancedStats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`matchId` integer NOT NULL,
	`totalGoals` integer,
	`totalCorners` integer,
	`totalYellowCards` integer,
	`totalRedCards` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `matchAdvancedStats_matchId_unique` ON `matchAdvancedStats` (`matchId`);--> statement-breakpoint
CREATE TABLE `matches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`league` text NOT NULL,
	`homeTeam` text NOT NULL,
	`awayTeam` text NOT NULL,
	`matchDate` integer NOT NULL,
	`homeTeamLogo` text,
	`awayTeamLogo` text,
	`aiHomeWinProb` real,
	`aiDrawProb` real,
	`aiAwayWinProb` real,
	`aiRecommendedPick` text,
	`aiReasoning` text,
	`aiConfidence` real,
	`actualResult` text,
	`homeTeamScore` integer,
	`awayTeamScore` integer,
	`resultPublished` integer DEFAULT false,
	`externalId` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`type` text NOT NULL,
	`relatedMatchId` integer,
	`emailSent` integer DEFAULT false,
	`read` integer DEFAULT false,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `predictions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`matchId` integer NOT NULL,
	`prediction` text NOT NULL,
	`confidence` real,
	`points` integer DEFAULT 0,
	`isCorrect` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `userStreaks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`currentStreak` integer DEFAULT 0,
	`bestStreak` integer DEFAULT 0,
	`lastCorrectAt` integer,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `userStreaks_userId_unique` ON `userStreaks` (`userId`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`passwordHash` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`lastSignedIn` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);