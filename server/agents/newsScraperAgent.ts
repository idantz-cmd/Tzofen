/**
 * Israeli Football News Scraper Agent
 * Primary source: Google News RSS (public, no API key needed)
 * Supplemental: Ynet Sport HTML scraping
 * Filters strictly to Israeli football only.
 */
import * as cheerio from "cheerio";
import axios from "axios";

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  source: string;
  ageLabel: string;
}

// In-memory cache – 5 min TTL
let _cache: { items: NewsItem[]; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

const HTTP = axios.create({
  timeout: 10000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function stableId(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (Math.imul(31, h) + url.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

function toISO(raw: string): string {
  try {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function ageLabel(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "עכשיו";
  if (m < 60) return `לפני ${m} דק'`;
  const h = Math.floor(m / 60);
  if (h < 24) return `לפני ${h} שע'`;
  return `לפני ${Math.floor(h / 24)} ימים`;
}

function strip(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// Non-Israeli football sources to reject
const REJECT_SOURCES = [
  "NBA", "NFL", "F1", "Formula", "טניס", "גולף", "אתלטיקה",
  "ריצה", "שחייה", "כדורסל NBA", "כדוריד", "הוקי", "בייסבול",
];

// International clubs/leagues – discard articles about these
const REJECT_TITLES = [
  "ברצלונה", "ריאל מדריד", "ליברפול", "מנצ'סטר", "צ'לסי",
  "ארסנל", "יובנטוס", "PSG", "בייר", "דורטמונד",
  "Champions League", "UEFA", "LaLiga", "Premier League",
  "Serie A", "Bundesliga", "Ligue 1",
  "F1", "מוטו GP", "Formula",
];

// Must contain at least one Israeli football signal
const REQUIRE = [
  "כדורגל",
  "ליגת העל",
  "ליגה לאומית",
  "ליגה הלאומית",
  "הפועל",
  "מכבי",
  "בית\"ר",
  "ביתר",
  "עירוני",
  "בני יהודה",
  "בני סחנין",
  "קריית שמונה",
  "אשדוד",
  "נבחרת ישראל",
  "גביע המדינה",
  "כדורגל ישראלי",
  "ליגה ישראלית",
  "מינהלת",
  "ספורט 5",
  "ספורט 1",
];

function isIsraeliFootball(title: string, summary = ""): boolean {
  const text = title + " " + summary;
  if (REJECT_TITLES.some((r) => text.includes(r))) return false;
  if (REJECT_SOURCES.some((r) => text.includes(r))) return false;
  return REQUIRE.some((r) => text.includes(r));
}

// Source display name from Google News <source> tag
function normalizeSource(raw: string): string {
  if (raw.includes("ספורט 5") || raw.includes("sport5")) return "Sport5";
  if (raw.includes("ספורט 1") || raw.includes("sport1")) return "Sport1";
  if (raw.includes("וואלה") || raw.includes("walla")) return "Walla";
  if (raw.includes("ynet") || raw.includes("ינט")) return "Ynet";
  if (raw.includes("הארץ")) return "הארץ";
  if (raw.includes("כאן")) return "כאן";
  if (raw.includes("ONE") || raw.includes("one.co.il")) return "ONE";
  if (raw.includes("מאקו") || raw.includes("mako")) return "Mako";
  if (raw.includes("ערוץ 7") || raw.includes("arutz")) return "ערוץ 7";
  if (raw.includes("היום")) return "היום";
  return raw.trim() || "חדשות";
}

// ── Google News RSS (main source) ─────────────────────────────────────────────

const GOOGLE_NEWS_QUERIES = [
  "ליגת+העל+כדורגל",
  "כדורגל+ישראל+הפועל+מכבי",
  "ליגה+לאומית+כדורגל+ישראלי",
  "נבחרת+ישראל+כדורגל",
  "גביע+המדינה+כדורגל",
];

async function fetchGoogleNewsRSS(): Promise<NewsItem[]> {
  const allItems: NewsItem[] = [];

  await Promise.allSettled(
    GOOGLE_NEWS_QUERIES.map(async (q) => {
      const url = `https://news.google.com/rss/search?q=${q}&hl=he&gl=IL&ceid=IL:he`;
      try {
        const { data } = await HTTP.get<string>(url);
        const $ = cheerio.load(data, { xmlMode: true });

        $("item").each((_, el) => {
          const title = $el(el, $, "title");
          const link =
            $el(el, $, "link") || $el(el, $, "guid");
          const desc = strip($el(el, $, "description"));
          const pubDate = $el(el, $, "pubDate");
          const source = $el(el, $, "source");
          // Google News wraps real URL inside a redirect — extract if possible
          const cleanLink = link.replace(/^https:\/\/news\.google\.com\/rss\/articles\//, "");

          if (!title || !link) return;
          if (!isIsraeliFootball(title, desc)) return;

          const iso = toISO(pubDate);
          allItems.push({
            id: stableId(link),
            title: title.replace(/ - [^-]+$/, ""), // remove " - Source Name" suffix
            summary: desc.slice(0, 220),
            url: link,
            publishedAt: iso,
            source: normalizeSource(source),
            ageLabel: ageLabel(iso),
          });
        });
      } catch {
        // silent – other queries may succeed
      }
    })
  );

  return allItems;
}

// Helper to extract text from XML element
function $el(
  el: Parameters<ReturnType<typeof import("cheerio").load>>[0],
  $: cheerio.CheerioAPI,
  tag: string
): string {
  return $(el).find(tag).first().text().trim();
}

// ── Ynet Sport HTML (supplemental) ────────────────────────────────────────────

async function fetchYnetSport(): Promise<NewsItem[]> {
  try {
    const { data } = await HTTP.get<string>("https://www.ynet.co.il/sport");
    const $ = cheerio.load(data);
    const items: NewsItem[] = [];

    // Ynet renders articles in slotView / galleryComponenta / slotView elements
    $(
      ".slotView, .galleryComponenta, [class*='slot'], [class*='article'], article"
    )
      .slice(0, 40)
      .each((_, el) => {
        const title = $(el)
          .find("h2, h3, .slotTitle, [class*='title']")
          .first()
          .text()
          .trim();
        const href = $(el).find("a").first().attr("href") || "";
        if (!title || title.length < 8 || !href) return;

        const link = href.startsWith("http")
          ? href
          : `https://www.ynet.co.il${href}`;
        const img =
          $(el).find("img").first().attr("src") ||
          $(el).find("img").first().attr("data-src");
        const desc = $(el)
          .find("p, [class*='subtitle'], [class*='desc']")
          .first()
          .text()
          .trim();

        if (!isIsraeliFootball(title, desc)) return;

        const iso = new Date().toISOString();
        items.push({
          id: stableId(link),
          title,
          summary: desc.slice(0, 220),
          url: link,
          imageUrl: img?.startsWith("http") ? img : undefined,
          publishedAt: iso,
          source: "Ynet",
          ageLabel: ageLabel(iso),
        });
      });

    return items;
  } catch {
    return [];
  }
}

// ── Sport5 Liga page HTML ─────────────────────────────────────────────────────

async function fetchSport5Liga(): Promise<NewsItem[]> {
  const pages = [
    "https://www.sport5.co.il/liga.aspx?FolderID=216", // ליגת העל
    "https://www.sport5.co.il/liga.aspx?FolderID=217", // ליגה לאומית
  ];
  const items: NewsItem[] = [];

  await Promise.allSettled(
    pages.map(async (pageUrl) => {
      try {
        const { data } = await HTTP.get<string>(pageUrl, { timeout: 8000 });
        const $ = cheerio.load(data);

        $("a[href*='docID'], a[href*='articles.aspx']").each((_, el) => {
          const title = $(el).text().trim();
          const href = $(el).attr("href") || "";
          if (!title || title.length < 8 || !href) return;

          const link = href.startsWith("http")
            ? href
            : `https://www.sport5.co.il${href}`;
          if (!isIsraeliFootball(title, "")) return;

          const iso = new Date().toISOString();
          items.push({
            id: stableId(link),
            title,
            summary: "",
            url: link,
            publishedAt: iso,
            source: "Sport5",
            ageLabel: ageLabel(iso),
          });
        });
      } catch {
        // silent
      }
    })
  );

  return items;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function fetchIsraeliFootballNews(
  forceRefresh = false
): Promise<NewsItem[]> {
  if (!forceRefresh && _cache && Date.now() - _cache.ts < CACHE_TTL) {
    return _cache.items;
  }

  const [googleItems, ynetItems, sport5Items] = await Promise.all([
    fetchGoogleNewsRSS(),
    fetchYnetSport(),
    fetchSport5Liga(),
  ]);

  const all = [...googleItems, ...ynetItems, ...sport5Items];

  // De-duplicate by id, sort newest first
  const seen = new Set<string>();
  const unique = all
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

  _cache = { items: unique, ts: Date.now() };
  return unique;
}

export function clearNewsCache(): void {
  _cache = null;
}
