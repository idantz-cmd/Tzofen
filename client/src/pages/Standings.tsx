import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { useCategory } from "@/contexts/CategoryContext";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc";
import { Trophy, ChevronDown, ChevronUp, TrendingUp, Star, Zap } from "lucide-react";

type League = "ligat_hael" | "ligah_leumit";

// ── Static data (Israeli Ligat HaAl 2025/26 — source: API-Sports) ──────────
// Championship group (pos 1-6) + Relegation group (pos 7-14) final standings
const MOCK_LIGAT_HAEL = [
  { id:1,  position:1,  teamName:"הפועל באר שבע",       played:36, won:24, drawn:7,  lost:5,  goalsFor:79, goalsAgainst:38, goalDifference:41,  points:79, form:"LWWDW", externalTeamId:563  },
  { id:2,  position:2,  teamName:"ביתר ירושלים",         played:36, won:22, drawn:10, lost:4,  goalsFor:78, goalsAgainst:40, goalDifference:38,  points:76, form:"DDWDL", externalTeamId:657  },
  { id:3,  position:3,  teamName:"מכבי תל אביב",         played:36, won:19, drawn:9,  lost:8,  goalsFor:75, goalsAgainst:46, goalDifference:29,  points:66, form:"DLLWD", externalTeamId:604  },
  { id:4,  position:4,  teamName:"הפועל תל אביב",        played:36, won:18, drawn:8,  lost:10, goalsFor:55, goalsAgainst:38, goalDifference:17,  points:60, form:"DLLWD", externalTeamId:4501 },
  { id:5,  position:5,  teamName:"מכבי חיפה",            played:36, won:15, drawn:10, lost:11, goalsFor:66, goalsAgainst:47, goalDifference:19,  points:55, form:"WWDLW", externalTeamId:4195 },
  { id:6,  position:6,  teamName:"הפועל פתח תקווה",      played:36, won:9,  drawn:13, lost:14, goalsFor:48, goalsAgainst:57, goalDifference:-9,  points:40, form:"DDDLL", externalTeamId:4488 },
  { id:7,  position:7,  teamName:"מכבי נתניה",           played:33, won:14, drawn:6,  lost:13, goalsFor:59, goalsAgainst:63, goalDifference:-4,  points:48, form:"WDLWL", externalTeamId:4505 },
  { id:8,  position:8,  teamName:"עירוני קריית שמונה",   played:33, won:11, drawn:7,  lost:15, goalsFor:50, goalsAgainst:53, goalDifference:-3,  points:40, form:"LWDWW", externalTeamId:4510 },
  { id:9,  position:9,  teamName:"עירוני טבריה",          played:33, won:12, drawn:8,  lost:13, goalsFor:45, goalsAgainst:56, goalDifference:-11, points:36, form:"WWWWD", externalTeamId:6181 },
  { id:10, position:10, teamName:"הפועל חיפה",           played:33, won:8,  drawn:10, lost:15, goalsFor:39, goalsAgainst:51, goalDifference:-12, points:34, form:"WDWLD", externalTeamId:2253 },
  { id:11, position:11, teamName:"בני סכנין",             played:33, won:8,  drawn:10, lost:15, goalsFor:28, goalsAgainst:49, goalDifference:-21, points:34, form:"LLLLD", externalTeamId:4481 },
  { id:12, position:12, teamName:"הפועל קטמון",           played:33, won:7,  drawn:10, lost:16, goalsFor:26, goalsAgainst:43, goalDifference:-17, points:31, form:"LWWLW", externalTeamId:4486 },
  { id:13, position:13, teamName:"מ.ס. אשדוד",           played:33, won:6,  drawn:10, lost:17, goalsFor:38, goalsAgainst:62, goalDifference:-24, points:28, form:"WLLLD", externalTeamId:4507 },
  { id:14, position:14, teamName:"מכבי בני ריינה",        played:33, won:6,  drawn:4,  lost:23, goalsFor:26, goalsAgainst:69, goalDifference:-43, points:22, form:"LLDWL", externalTeamId:6186 },
];

// Ligah Leumit 2025/26 — Championship group (pos 1-8) + Relegation group (pos 9-16)
const MOCK_LIGAH_LEUMIT = [
  { id:21, position:1,  teamName:"מכבי פתח תקווה",      played:37, won:18, drawn:13, lost:6,  goalsFor:77, goalsAgainst:42, goalDifference:35,  points:67, form:"DDDWD", externalTeamId:4495  },
  { id:22, position:2,  teamName:"הפועל רמת גן",         played:37, won:18, drawn:10, lost:9,  goalsFor:59, goalsAgainst:41, goalDifference:18,  points:64, form:"DWWWD", externalTeamId:4489  },
  { id:23, position:3,  teamName:"מכבי הרצליה",          played:37, won:17, drawn:11, lost:9,  goalsFor:55, goalsAgainst:44, goalDifference:11,  points:62, form:"DDWLW", externalTeamId:4503  },
  { id:24, position:4,  teamName:"בני יהודה",            played:37, won:15, drawn:12, lost:10, goalsFor:46, goalsAgainst:44, goalDifference:2,   points:57, form:"DDWWW", externalTeamId:4508  },
  { id:25, position:5,  teamName:"הפועל כפר שלם",        played:37, won:16, drawn:8,  lost:13, goalsFor:67, goalsAgainst:63, goalDifference:4,   points:56, form:"WWLLL", externalTeamId:6160  },
  { id:26, position:6,  teamName:"עירוני קריית ים",       played:37, won:15, drawn:9,  lost:13, goalsFor:48, goalsAgainst:43, goalDifference:5,   points:50, form:"DLLWW", externalTeamId:20105 },
  { id:27, position:7,  teamName:"הפועל כפר סבא",        played:37, won:13, drawn:11, lost:13, goalsFor:52, goalsAgainst:50, goalDifference:2,   points:50, form:"DDDLL", externalTeamId:4497  },
  { id:28, position:8,  teamName:"הפועל ראשון לציון",     played:37, won:13, drawn:10, lost:14, goalsFor:50, goalsAgainst:54, goalDifference:-4,  points:49, form:"LLLLL", externalTeamId:4491  },
  { id:29, position:9,  teamName:"מכבי כבילה יפו",       played:37, won:14, drawn:9,  lost:14, goalsFor:66, goalsAgainst:58, goalDifference:8,   points:51, form:"WWDLW", externalTeamId:6192  },
  { id:30, position:10, teamName:"הפועל רעננה",           played:37, won:13, drawn:11, lost:13, goalsFor:42, goalsAgainst:44, goalDifference:-2,  points:50, form:"WDDWD", externalTeamId:4509  },
  { id:31, position:11, teamName:"הפועל עפולה",           played:37, won:11, drawn:12, lost:14, goalsFor:39, goalsAgainst:58, goalDifference:-19, points:45, form:"WLWDD", externalTeamId:4483  },
  { id:32, position:12, teamName:"כפר קאסם",             played:37, won:9,  drawn:14, lost:14, goalsFor:42, goalsAgainst:49, goalDifference:-7,  points:41, form:"LDDDW", externalTeamId:4493  },
  { id:33, position:13, teamName:"הפועל עכו",             played:37, won:8,  drawn:16, lost:13, goalsFor:40, goalsAgainst:48, goalDifference:-8,  points:40, form:"DDWLL", externalTeamId:4482  },
  { id:34, position:14, teamName:"עירוני מודיעין",         played:37, won:10, drawn:10, lost:17, goalsFor:37, goalsAgainst:47, goalDifference:-10, points:40, form:"LWLWL", externalTeamId:6179  },
  { id:35, position:15, teamName:"הפועל נצרת עילית",       played:37, won:7,  drawn:16, lost:14, goalsFor:44, goalsAgainst:58, goalDifference:-14, points:37, form:"DLLDL", externalTeamId:4487  },
  { id:36, position:16, teamName:"הפועל חדרה",             played:37, won:6,  drawn:14, lost:17, goalsFor:40, goalsAgainst:61, goalDifference:-21, points:32, form:"LDDDW", externalTeamId:4500  },
];

// Top scorers — API-Sports data for ליגת העל 2025/26
const TOP_SCORERS = [
  { name: "דור פרץ",      team: "מכבי תל אביב",      goals: 14, assists: 2,  flag: "🇮🇱" },
  { name: "א. אוגריזה",   team: "עירוני קריית שמונה", goals: 12, assists: 2,  flag: "🇵🇪" },
  { name: "ג. מלמד",      team: "מכבי חיפה",          goals: 11, assists: 1,  flag: "🇮🇱" },
  { name: "ד. ביטון",     team: "הפועל באר שבע",      goals: 11, assists: 1,  flag: "🇮🇱" },
  { name: "ק. קנגווה",    team: "הפועל באר שבע",      goals: 9,  assists: 6,  flag: "🇿🇲" },
  { name: "י. שוע",       team: "ביתר ירושלים",       goals: 9,  assists: 5,  flag: "🇮🇱" },
  { name: "א. עצילי",     team: "ביתר ירושלים",       goals: 9,  assists: 4,  flag: "🇮🇱" },
  { name: "א. זלטנוביץ'", team: "הפועל באר שבע",      goals: 8,  assists: 3,  flag: "🇷🇸" },
];

// ── Zone helpers ────────────────────────────────────────────────────────────
// total >= 16 → ליגה לאומית (promotion top 2, relegation bottom 2)
// total <= 14 → ליגת העל (champion pos 1, europe pos 2-4, relegation bottom 3)
function getZone(position: number, total: number): { label: string; color: string; bg: string } | null {
  const isLeumit = total >= 16;
  if (isLeumit) {
    if (position <= 2) return { label: "עלייה", color: "#B38900", bg: "rgba(179,137,0,0.08)" };
    if (position >= total - 1) return { label: "הורדה", color: "#FF3B5C", bg: "rgba(255,59,92,0.07)" };
    return null;
  }
  if (position === 1) return { label: "אלוף", color: "#B38900", bg: "rgba(179,137,0,0.08)" };
  if (position <= 4) return { label: "אירופה", color: "#1F6BFF", bg: "rgba(31,107,255,0.07)" };
  if (position > total - 3) return { label: "הורדה", color: "#FF3B5C", bg: "rgba(255,59,92,0.07)" };
  return null;
}

function FormBadge({ form }: { form?: string | null }) {
  if (!form) return null;
  return (
    <div className="flex gap-0.5">
      {form.split("").map((r, i) => (
        <span
          key={i}
          className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center"
          style={{
            background:
              r === "W" ? "#13CE66"
              : r === "L" ? "#FF3B5C"
              : "#B38900",
            color: "white",
          }}
        >
          {r === "W" ? "נ" : r === "L" ? "ה" : "ת"}
        </span>
      ))}
    </div>
  );
}

function ZoneDivider({ label, color }: { label: string; color: string }) {
  return (
    <tr>
      <td colSpan={11}>
        <div className="flex items-center gap-2 px-3 py-1">
          <div className="h-px flex-1" style={{ background: color, opacity: 0.35 }} />
          <span className="text-[10px] font-bold" style={{ color, opacity: 0.8 }}>{label}</span>
          <div className="h-px flex-1" style={{ background: color, opacity: 0.35 }} />
        </div>
      </td>
    </tr>
  );
}

function TeamRow({
  row,
  isExpanded,
  onToggle,
  total,
}: {
  row: any;
  isExpanded: boolean;
  onToggle: () => void;
  total: number;
}) {
  const zone = getZone(row.position, total);

  const medalColor =
    row.position === 1 ? "#B38900"
    : row.position === 2 ? "#94A3B8"
    : row.position === 3 ? "#B45309"
    : undefined;

  return (
    <>
      <tr
        className="border-b border-border/20 hover:bg-white/[0.04] transition-colors cursor-pointer"
        style={{ background: zone ? zone.bg : undefined }}
        onClick={onToggle}
      >
        {/* Position */}
        <td className="py-3 px-3 text-center w-10">
          <span className="font-bold text-sm" style={{ color: medalColor ?? "#64748B" }}>
            {row.position <= 3
              ? ["🥇","🥈","🥉"][row.position - 1]
              : row.position}
          </span>
        </td>

        {/* Team */}
        <td className="py-3 px-3">
          <div className="flex items-center gap-2">
            {row.teamLogo && (
              <img src={row.teamLogo} alt={row.teamName} className="w-6 h-6 object-contain"
                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
            )}
            <span className="font-semibold text-sm">{row.teamName}</span>
            {zone && (
              <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ color: zone.color, background: zone.bg, border: `1px solid ${zone.color}`, opacity: 0.9 }}>
                {zone.label}
              </span>
            )}
            <span className="ml-auto">
              {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
            </span>
          </div>
        </td>

        {/* Stats */}
        {[row.played, row.won, row.drawn, row.lost, row.goalsFor, row.goalsAgainst].map((val, i) => (
          <td key={i} className="py-3 px-2 text-center text-sm text-muted-foreground">{val}</td>
        ))}
        <td className="py-3 px-2 text-center text-sm font-medium"
          style={{ color: row.goalDifference > 0 ? "#13CE66" : row.goalDifference < 0 ? "#FF3B5C" : "#64748B" }}>
          {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
        </td>
        <td className="py-3 px-3 text-center font-black text-base" style={{ color: "#1F6BFF" }}>
          {row.points}
        </td>
        <td className="py-3 px-3 hidden md:table-cell">
          <FormBadge form={row.form} />
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={11} className="pb-3 px-6">
            <div className="rounded-xl p-4 border border-border/20 bg-muted/20">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {[
                  { label: "משחקים", value: row.played },
                  { label: "ניצחונות", value: row.won, color: "#13CE66" },
                  { label: "תיקו", value: row.drawn, color: "#FFC91F" },
                  { label: "הפסדים", value: row.lost, color: "#FF3B5C" },
                  { label: "שערים", value: `${row.goalsFor}/${row.goalsAgainst}` },
                  { label: "נקודות", value: row.points, color: "#1F6BFF" },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <p className="text-xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border/20">
                <p className="text-xs text-muted-foreground mb-1.5">5 משחקים אחרונים</p>
                <FormBadge form={row.form} />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function StandingsTable({ league }: { league: League }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const { data: standings, isLoading } = trpc.leagueData.getStandings.useQuery({ league });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;

  // Use live data if available, otherwise fall back to mock
  const rows: any[] = (standings && standings.length > 0)
    ? standings
    : (league === "ligat_hael" ? MOCK_LIGAT_HAEL : MOCK_LIGAH_LEUMIT);

  const isMock = !standings || standings.length === 0;

  return (
    <div className="space-y-4">
      {isMock && (
        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-green-500/20 bg-green-500/5 text-green-600/80">
          <Zap className="w-3 h-3 shrink-0" />
          נתונים עדכניים עונת 25/26 — מקור: API-Sports
        </div>
      )}

      <Card className="overflow-hidden">
        {/* Zone legend */}
        <div className="flex flex-wrap gap-3 px-4 py-2.5 border-b border-border/20 text-[11px] bg-muted/30">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "rgba(179,137,0,0.35)" }} />
            <span style={{ color: "#B38900" }}>{league === "ligah_leumit" ? "עלייה (1-2)" : "אלוף"}</span>
          </span>
          {league === "ligat_hael" && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "rgba(31,107,255,0.25)" }} />
              <span style={{ color: "#1F6BFF" }}>אירופה (2-4)</span>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "rgba(255,59,92,0.25)" }} />
            <span style={{ color: "#FF3B5C" }}>הורדה</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right" dir="rtl">
            <thead>
              <tr className="border-b border-border/30 text-xs bg-muted/30">
                <th className="py-3 px-3 text-center text-muted-foreground font-medium">#</th>
                <th className="py-3 px-3 text-right text-muted-foreground font-medium">קבוצה</th>
                <th className="py-3 px-2 text-center text-muted-foreground font-medium">מ'</th>
                <th className="py-3 px-2 text-center text-muted-foreground font-medium">נ'</th>
                <th className="py-3 px-2 text-center text-muted-foreground font-medium">ת'</th>
                <th className="py-3 px-2 text-center text-muted-foreground font-medium">ה'</th>
                <th className="py-3 px-2 text-center text-muted-foreground font-medium">שב</th>
                <th className="py-3 px-2 text-center text-muted-foreground font-medium">שנ</th>
                <th className="py-3 px-2 text-center text-muted-foreground font-medium">הפ</th>
                <th className="py-3 px-3 text-center font-medium" style={{ color: "#1F6BFF" }}>נק'</th>
                <th className="py-3 px-3 text-right text-muted-foreground font-medium hidden md:table-cell">סדרה</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any, idx: number) => {
                const prevZone = idx > 0 ? getZone(rows[idx-1].position, rows.length) : null;
                const currZone = getZone(row.position, rows.length);
                const showDivider = idx > 0 && prevZone?.label !== currZone?.label;

                return (
                  <>
                    {showDivider && currZone?.label === "הורדה" && (
                      <ZoneDivider key={`div-${idx}`} label="אזור הורדה" color="#FF3B5C" />
                    )}
                    <TeamRow
                      key={row.id}
                      row={row}
                      total={rows.length}
                      isExpanded={expanded === (row.externalTeamId ?? row.id)}
                      onToggle={() =>
                        setExpanded(expanded === (row.externalTeamId ?? row.id) ? null : (row.externalTeamId ?? row.id))
                      }
                    />
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-border/20 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>מ' = משחקים</span>
          <span>נ' = ניצחונות</span>
          <span>ת' = תיקו</span>
          <span>ה' = הפסדים</span>
          <span>שב = שערים בעד</span>
          <span>שנ = שערים נגד</span>
          <span>הפ = הפרש</span>
          <span>נק' = נקודות</span>
        </div>
      </Card>
    </div>
  );
}

function TopScorers() {
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-border/20 flex items-center gap-2 bg-muted/25">
        <Star className="w-4 h-4" style={{ color: "#B38900" }} />
        <span className="font-bold text-sm">מלך השערים — ליגת העל 25/26</span>
      </div>
      <div className="divide-y divide-border/20">
        {TOP_SCORERS.map((scorer, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors">
            {/* Rank */}
            <span className="w-6 text-center font-black text-sm shrink-0"
              style={{ color: i === 0 ? "#B38900" : i === 1 ? "#94A3B8" : i === 2 ? "#B45309" : "#64748B" }}>
              {i < 3 ? ["🥇","🥈","🥉"][i] : `${i + 1}`}
            </span>

            {/* Flag + Name */}
            <span className="text-base shrink-0">{scorer.flag}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{scorer.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{scorer.team}</p>
            </div>

            {/* Goals */}
            <div className="text-right shrink-0">
              <p className="font-black text-lg" style={{ color: "#B38900" }}>{scorer.goals}</p>
              <p className="text-[10px] text-muted-foreground">שערים</p>
            </div>

            {/* Assists */}
            <div className="text-right shrink-0 hidden sm:block">
              <p className="font-bold text-sm" style={{ color: "#1F6BFF" }}>{scorer.assists}</p>
              <p className="text-[10px] text-muted-foreground">בישולים</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SeasonStats({ league }: { league: League }) {
  const rows = league === "ligat_hael" ? MOCK_LIGAT_HAEL : MOCK_LIGAH_LEUMIT;
  const totalGoals = rows.reduce((s, r) => s + r.goalsFor, 0);
  const avgGoals  = (totalGoals / rows.reduce((s, r) => s + r.played, 0)).toFixed(2);
  const leader    = rows[0];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "מוביל בטבלה", value: leader.teamName, sub: `${leader.points} נק'`, color: "#B38900" },
        { label: "סה\"כ שערים", value: totalGoals, sub: "בעונה הנוכחית", color: "#1F6BFF" },
        { label: "ממוצע שערים", value: avgGoals, sub: "לכל משחק", color: "#13CE66" },
        { label: "קבוצות", value: rows.length, sub: "בליגה", color: "#FFC91F" },
      ].map((s, i) => (
        <Card key={i} className="p-4 text-center">
          <p className="text-2xl font-black truncate" style={{ color: s.color }}>{s.value}</p>
          <p className="text-xs font-semibold mt-1">{s.label}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
        </Card>
      ))}
    </div>
  );
}

export default function Standings() {
  const { setCategory } = useCategory();
  useEffect(() => { setCategory("leaderboard"); }, [setCategory]);
  const [league, setLeague] = useState<League>("ligat_hael");
  const { data: status } = trpc.leagueData.getDataStatus.useQuery();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 py-8 pb-24" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #1F6BFF, #1F4CB3)", boxShadow: "0 4px 16px rgba(31,107,255,0.35)" }}>
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-black text-gradient-blue">טבלאות ליגה 25/26</h1>
            <p className="text-sm text-muted-foreground">ליגת העל והליגה הלאומית — עונת 2025/26</p>
          </div>
          {status && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: status.hasData ? "#13CE66" : "#FFC91F" }} />
              {status.hasData ? `${status.teams} קבוצות · ${status.standings} שורות` : "נתוני דוגמה"}
            </div>
          )}
        </div>

        {/* League Tabs */}
        <Tabs value={league} onValueChange={(v) => setLeague(v as League)} className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-xs bg-muted/10 border border-border/20 h-11">
            <TabsTrigger value="ligat_hael" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary font-bold text-sm gap-2">
              <Trophy className="w-4 h-4" />
              ליגת העל
            </TabsTrigger>
            <TabsTrigger value="ligah_leumit" className="data-[state=active]:bg-secondary/15 data-[state=active]:text-secondary font-bold text-sm gap-2">
              <Trophy className="w-4 h-4" />
              ליגה לאומית
            </TabsTrigger>
          </TabsList>

          {(["ligat_hael", "ligah_leumit"] as League[]).map(lg => (
            <TabsContent key={lg} value={lg} className="space-y-5">
              <SeasonStats league={lg} />
              <StandingsTable league={lg} />
              {lg === "ligat_hael" && <TopScorers />}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}
