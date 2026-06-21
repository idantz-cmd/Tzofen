#!/usr/bin/env node
// bundle-app.mjs
// מאחד את כל קוד המקור של האפליקציה לקובץ טקסט אחד לצורך סריקה ושיפור.
// מדלג על קבצי API (שכבת tRPC routers + אינטגרציות API חיצוניות), טסטים, build ו-node_modules.
//
// שימוש:  node bundle-app.mjs
// פלט:    app-bundle.txt בשורש הפרויקט
//
// לשינוי מה נחשב "API" — ערוך את EXCLUDE_PATTERNS למטה.

import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(ROOT, "app-bundle.txt");

// תיקיות מקור שייכללו
const SOURCE_DIRS = ["client", "server", "shared"];

// סיומות קוד שייכללו
const INCLUDE_EXT = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs",
  ".css", ".html", ".json",
]);

// תיקיות שתמיד מדלגים עליהן
const SKIP_DIRS = new Set(["node_modules", "dist", ".git", "build", "coverage"]);

// דפוסים שמסמנים "קובץ API" — מסוננים החוצה (regex על הנתיב היחסי, עם / כמפריד)
const EXCLUDE_PATTERNS = [
  /(^|\/)server\/routers\//i,   // כל ה-tRPC routers
  /(^|\/)server\/routers\.ts$/i, // קובץ הראוטר הראשי
  /api/i,                        // כל קובץ עם "api" בשם (dataApi, footballApi, ...)
  /\.test\.[tj]sx?$/i,           // קבצי טסט
  /\.d\.ts$/i,                   // הצהרות טיפוסים
  /package-lock\.json$/i,
];

const isExcluded = (relPath) => EXCLUDE_PATTERNS.some((re) => re.test(relPath));

async function walk(dir, files = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return files; // התיקייה לא קיימת — מדלגים
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      await walk(full, files);
    } else if (entry.isFile()) {
      if (!INCLUDE_EXT.has(extname(entry.name))) continue;
      const rel = relative(ROOT, full).split("\\").join("/");
      if (isExcluded(rel)) continue;
      files.push({ full, rel });
    }
  }
  return files;
}

const main = async () => {
  const all = [];
  for (const d of SOURCE_DIRS) await walk(join(ROOT, d), all);
  all.sort((a, b) => a.rel.localeCompare(b.rel));

  const parts = [];
  parts.push("# ===== Tzofen — App Source Bundle (ללא קבצי API) =====");
  parts.push(`# Generated: build-time aggregation`);
  parts.push(`# Files: ${all.length}`);
  parts.push("# Excluded: server/routers, *api*, *.test.*, *.d.ts, node_modules, dist");
  parts.push("");
  parts.push("## Table of contents");
  all.forEach((f, i) => parts.push(`#  ${String(i + 1).padStart(3, " ")}. ${f.rel}`));
  parts.push("");

  let totalBytes = 0;
  for (const f of all) {
    const content = await readFile(f.full, "utf8");
    totalBytes += Buffer.byteLength(content, "utf8");
    parts.push("\n" + "=".repeat(80));
    parts.push(`FILE: ${f.rel}`);
    parts.push("=".repeat(80) + "\n");
    parts.push(content.replace(/\s+$/g, ""));
  }

  await writeFile(OUTPUT, parts.join("\n"), "utf8");
  const kb = (totalBytes / 1024).toFixed(1);
  console.log(`✅ נכתב ${OUTPUT}`);
  console.log(`   ${all.length} קבצים, ~${kb} KB קוד.`);
};

main().catch((err) => {
  console.error("❌ שגיאה:", err);
  process.exit(1);
});
