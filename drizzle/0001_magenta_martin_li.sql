CREATE TABLE `leaguePlayers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`externalTeamId` integer NOT NULL,
	`teamName` text NOT NULL,
	`name` text NOT NULL,
	`position` text,
	`jerseyNumber` integer,
	`season` text NOT NULL,
	`scrapedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `leagueStandings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`externalTeamId` integer NOT NULL,
	`teamName` text NOT NULL,
	`teamLogo` text,
	`league` text NOT NULL,
	`season` text NOT NULL,
	`position` integer NOT NULL,
	`played` integer DEFAULT 0 NOT NULL,
	`won` integer DEFAULT 0 NOT NULL,
	`drawn` integer DEFAULT 0 NOT NULL,
	`lost` integer DEFAULT 0 NOT NULL,
	`goalsFor` integer DEFAULT 0 NOT NULL,
	`goalsAgainst` integer DEFAULT 0 NOT NULL,
	`goalDifference` integer DEFAULT 0 NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`form` text,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`externalId` integer NOT NULL,
	`name` text NOT NULL,
	`hebrewName` text,
	`logoUrl` text,
	`city` text,
	`league` text NOT NULL,
	`season` text NOT NULL,
	`scrapedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teams_externalId_unique` ON `teams` (`externalId`);--> statement-breakpoint
ALTER TABLE `matches` ADD `matchweek` integer;--> statement-breakpoint
ALTER TABLE `matches` ADD `season` text DEFAULT '2025-26';