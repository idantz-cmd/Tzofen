#!/usr/bin/env node
// repair-migrations.mjs
// מתקן מצב שבו מסד הנתונים המקומי כבר מכיל את כל הטבלאות, אבל טבלת
// המעקב __drizzle_migrations ריקה — מה שגורם ל-drizzle לנסות להריץ מחדש
// את מיגרציית 0000 ולקרוס ב"table users already exists".
//
// הסקריפט קורא את drizzle/meta/_journal.json, ולכל מיגרציה שכבר "מיושמת"
// בפועל (הטבלאות שלה קיימות) — מוסיף רשומת מעקב עם אותו hash ו-created_at
// ש-drizzle עצמו היה כותב, כך שהמיגרציה תדולג בעלייה הבאה.
//
// בטוח להרצה חוזרת (idempotent): לא יוסיף רשומה שכבר קיימת.
// שימוש:  node repair-migrations.mjs

import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createClient } from "@libsql/client";

const DB_PATH = process.env.DATABASE_PATH ?? "./data/tzofen.db";
const JOURNAL = "./drizzle/meta/_journal.json";
const MIGRATIONS_DIR = "./drizzle";

const main = async () => {
  const journal = JSON.parse(await readFile(JOURNAL, "utf8"));
  const db = createClient({ url: `file:${DB_PATH.replace(/^\.\//, "")}` });

  // ודא שטבלת המעקב קיימת (drizzle יוצר אותה כך)
  await db.execute(
    `CREATE TABLE IF NOT EXISTS __drizzle_migrations (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       hash TEXT NOT NULL,
       created_at NUMERIC
     )`
  );

  const applied = await db.execute(
    "SELECT hash, created_at FROM __drizzle_migrations"
  );
  const appliedHashes = new Set(applied.rows.map((r) => String(r.hash)));

  // אילו טבלאות קיימות בפועל
  const tablesRes = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table'"
  );
  const existingTables = new Set(tablesRes.rows.map((r) => String(r.name)));

  let inserted = 0;
  for (const entry of journal.entries) {
    const sqlPath = `${MIGRATIONS_DIR}/${entry.tag}.sql`;
    const raw = await readFile(sqlPath, "utf8");
    // drizzle מחשב hash כ-sha256 על תוכן הקובץ הגולמי
    const hash = createHash("sha256").update(raw).digest("hex");

    if (appliedHashes.has(hash)) {
      console.log(`⏭️  ${entry.tag} כבר מסומן כמיושם — מדלג`);
      continue;
    }

    // ודא שהמיגרציה באמת כבר הוחלה: כל ה-CREATE TABLE שלה קיימים
    const tablesInMigration = [...raw.matchAll(/CREATE TABLE [`"]?(\w+)[`"]?/gi)].map(
      (m) => m[1]
    );
    const allExist =
      tablesInMigration.length > 0 &&
      tablesInMigration.every((t) => existingTables.has(t));

    if (!allExist) {
      console.log(
        `⚠️  ${entry.tag}: לא כל הטבלאות קיימות (${tablesInMigration.join(
          ", "
        )}) — לא מסמן כמיושם. הרץ את המיגרציה רגיל.`
      );
      continue;
    }

    await db.execute({
      sql: "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
      args: [hash, entry.when],
    });
    inserted++;
    console.log(`✅ ${entry.tag} סומן כמיושם (created_at=${entry.when})`);
  }

  console.log(
    inserted === 0
      ? "אין מה לתקן — המעקב כבר מסונכרן."
      : `תוקן: נוספו ${inserted} רשומות מעקב.`
  );
};

main().catch((err) => {
  console.error("❌ שגיאה:", err);
  process.exit(1);
});
