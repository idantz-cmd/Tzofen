import type { Request, Response } from "express";

// This handler relied on externalId, matchAdvancedStats, and resultPublished
// columns that were removed in the schema migration. It is stubbed until
// a replacement import strategy using the new schema is implemented.
export async function importMatchesHandler(_req: Request, res: Response) {
  res.status(501).json({ error: "Scheduled import not available in current schema version" });
}
