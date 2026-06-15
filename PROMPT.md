# צופן (Tzofen) — Project Prompt

## What is Tzofen?

Tzofen (צופן) is an Israeli football predictions web app (PWA) built for fans of Ligat HaAl and the National League.
Users predict match results, earn virtual points for accuracy, climb a leaderboard, and compete against friends in private tournaments.
The name "צופן" means "code/cipher" in Hebrew — the app "deciphers" every match with AI.
**No gambling, no real money — virtual points only.**

---

## Tech Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 19, Vite, TypeScript, Tailwind CSS v4, Framer Motion |
| Backend    | Express.js, tRPC (type-safe API) |
| Database   | SQLite via Drizzle ORM (LibSQL / Turso compatible) |
| Auth       | JWT (jose), bcrypt, cookie-based sessions |
| AI Agents  | Google Gemini API — multi-agent system for match analysis |
| Scraping   | Cheerio — real-time news + league data from Israeli sports sites |
| PWA        | Web manifest, service worker ready |

---

## Brand

- **Name:** צופן / Tzofen
- **Tagline:** תפסיק לנחש, תתחיל לנצח
- **Colors:** Blue `#1F6BFF`, Green `#13CE66`, Purple `#8B4DFF`, Yellow `#FFC91F`, Red `#FF3B5C`, Ink `#15151E`
- **Font:** Rubik (RTL Hebrew), always light mode
- **Logo:** Magnifying glass with clock face (SVG inline)

---

## Core Features

### Predictions
- Users predict outcomes (Home Win / Draw / Away Win) for upcoming Ligat HaAl and National League matches
- Optional confidence level per prediction
- Virtual points awarded when results are published; bonus for exact score predictions
- Prediction lock-in before match kickoff

### Leaderboard
- All-time and weekly leaderboards
- Accuracy rate, total predictions, correct predictions tracked per user
- Win streak tracking and streak bonuses

### Competitions
- Create private tournaments (up to 20 players) or head-to-head duels
- Join active competitions and see live internal leaderboard
- Live arena view showing online users, activity feed, and real-time score updates

### Standings
- Full Ligat HaAl and National League tables (14 + 12 teams)
- Zone coloring: Champion, Europa spots, relegation zone
- Top scorers table
- Team stat drill-down on click (W/D/L, goals, form)
- Falls back to static 2025/26 demo data when DB is empty

### AI Prediction Engine (multi-agent)
- **Orchestrator Agent** coordinates all sub-agents
- **Statistics Agent** — historical win rates, home/away form, head-to-head records
- **Research Agent** — scrapes live news from 365scores, Walla Sport, Sport5
- **Deep Prediction Agent** — Gemini-powered, produces probability breakdown + tactical reasoning
- Results surface in the "AI Prediction" page and the Chat Assistant

### Chat Assistant
- Conversational AI powered by Gemini
- Can answer questions about teams, players, upcoming matches, and historical stats
- Streaming responses via tRPC

### News Ticker
- Auto-scrolling banner across the top of the app
- Pulls headlines from Israeli sports sites in real time

---

## Database Schema (key tables)

```
users            — id, openId, name, email, passwordHash, role (user|admin)
matches          — homeTeam, awayTeam, matchDate, league, AI probabilities, actual result
predictions      — userId, matchId, prediction, confidence, points, isCorrect
leaderboardScores — userId, totalPoints, correctPredictions, accuracyRate, weeklyPoints
competitions     — name, type (tournament|head_to_head), maxParticipants, status, creatorId
competitionParticipants — competitionId, userId, points
notifications    — userId, title, content, read
teams            — externalId, name, logo, league
standings        — teamId, league, position, played, won, drawn, lost, goalsFor, goalsAgainst, points, form
players          — teamId, name, jerseyNumber, position
```

---

## Project Structure

```
Tzofen/
├── client/
│   └── src/
│       ├── pages/
│       │   ├── Home.tsx          — landing page with features + stats
│       │   ├── Matches.tsx       — upcoming matches + prediction UI
│       │   ├── Standings.tsx     — league tables + top scorers
│       │   ├── Competitions.tsx  — tournaments + live arena
│       │   ├── Leaderboard.tsx   — global + weekly rankings
│       │   ├── AIPrediction.tsx  — AI match analysis page
│       │   ├── ChatAssistant.tsx — AI chat (Gemini streaming)
│       │   ├── Dashboard.tsx     — user stats + recent predictions
│       │   ├── News.tsx          — scraped Israeli sports news
│       │   └── AdminPanel.tsx    — data scraping controls (admin only)
│       └── components/
│           ├── layout/
│           │   ├── BottomNav.tsx           — mobile navigation bar
│           │   └── NewsTicker.tsx          — scrolling headlines
│           └── ui/                         — shadcn/ui component library
├── server/
│   ├── _core/
│   │   ├── index.ts              — Express + tRPC server entry
│   │   └── env.ts                — environment variable loader
│   ├── agents/
│   │   ├── llmAgents.ts          — all Gemini AI agents definition
│   │   └── agents.test.ts        — agent unit tests
│   ├── routers/
│   │   ├── matches.ts            — match CRUD + prediction endpoints
│   │   ├── leagueData.ts         — standings + players endpoints
│   │   ├── competitions.ts       — tournament management
│   │   ├── news.ts               — news scraping router
│   │   └── agents.ts             — AI agent tRPC endpoints
│   └── services/
│       └── leagueDataScraper.ts  — scrapes real Israeli league data
└── drizzle/
    └── schema.ts                 — full database schema
```

---

## User Roles

| Role  | Capabilities |
|-------|-------------|
| Guest | View matches, standings, news, demo competitions |
| User  | Predict matches, join competitions, see leaderboard |
| Admin | Add/edit matches, publish results, trigger data scraping, manage users |

---

## App Navigation (Bottom Nav — Mobile)

Home → Matches → Standings → Competitions → Leaderboard → AI Prediction → Chat → News

---

## Design Language

- Always light mode (dark mode disabled)
- Young/bright palette: Blue `#1F6BFF`, Green `#13CE66`, Purple `#8B4DFF`
- RTL layout (Hebrew), `dir="rtl"` throughout, Rubik font
- Framer Motion for all transitions and micro-animations
- Category background system: each section has its own color tint
- Responsive — mobile-first, PWA installable

---

## Running the App

```bash
npm install
npm run dev        # starts Express + Vite dev server on localhost:3000
npm run build      # production build
npm run db:push    # run database migrations
```

Environment variables needed (`.env.local`):
- `DATABASE_PATH` — SQLite file path (e.g. `./data/tzofen.db`)
- `GEMINI_API_KEY` — Google Gemini API key (for AI features)
- `JWT_SECRET` — secret for signing auth tokens

---

## Future Roadmap

- Push notifications for match results
- Social sharing of predictions
- Multi-league support (Champions League, Premier League)
- Mobile native app (React Native)
- Domain: tzofen.il (planned)
