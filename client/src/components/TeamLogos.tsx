/**
 * Israeli Football Teams Data & Logo Component
 * Contains team info, colors, and SVG-based shield logo badges for ליגת העל and ליגה לאומית
 * Dynamic team colors applied to match cards
 */

export interface TeamInfo {
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  city: string;
  initials: string;
  logoUrl?: string;
}

const CDN = "https://media.api-sports.io/football/teams";

// ליגת העל teams with accurate colors and real logos
export const LIGAT_HAEL_TEAMS: Record<string, TeamInfo> = {
  "מכבי חיפה":         { name: "מכבי חיפה",         shortName: "מ. חיפה",      primaryColor: "#008C45", secondaryColor: "#FFFFFF", city: "חיפה",          initials: "מח", logoUrl: `${CDN}/4195.png` },
  "מכבי תל אביב":      { name: "מכבי תל אביב",      shortName: 'מ. ת"א',       primaryColor: "#F5D000", secondaryColor: "#1A3A7A", city: "תל אביב",       initials: "מת", logoUrl: `${CDN}/604.png`  },
  "הפועל באר שבע":     { name: "הפועל באר שבע",     shortName: 'הפ. ב"ש',      primaryColor: "#D4213D", secondaryColor: "#1A1A1A", city: "באר שבע",       initials: "הב", logoUrl: `${CDN}/563.png`  },
  "הפועל תל אביב":     { name: "הפועל תל אביב",     shortName: 'הפ. ת"א',      primaryColor: "#D4213D", secondaryColor: "#FFFFFF", city: "תל אביב",       initials: "הת", logoUrl: `${CDN}/4501.png` },
  'בית"ר ירושלים':     { name: 'בית"ר ירושלים',     shortName: 'בית"ר י-ם',    primaryColor: "#F5D000", secondaryColor: "#1A1A1A", city: "ירושלים",       initials: "בי", logoUrl: `${CDN}/657.png`  },
  "מכבי נתניה":        { name: "מכבי נתניה",        shortName: "מ. נתניה",     primaryColor: "#F5D000", secondaryColor: "#1A1A1A", city: "נתניה",         initials: "מנ", logoUrl: `${CDN}/4505.png` },
  "מכבי פתח תקווה":   { name: "מכבי פתח תקווה",   shortName: 'מ. פ"ת',       primaryColor: "#1A3A7A", secondaryColor: "#FFFFFF", city: "פתח תקווה",     initials: "מפ", logoUrl: `${CDN}/4495.png` },
  "הפועל חיפה":        { name: "הפועל חיפה",        shortName: "הפ. חיפה",     primaryColor: "#D4213D", secondaryColor: "#FFFFFF", city: "חיפה",          initials: "הח", logoUrl: `${CDN}/2253.png` },
  "מ.ס. אשדוד":        { name: "מ.ס. אשדוד",        shortName: "מ.ס. אשדוד",   primaryColor: "#F5D000", secondaryColor: "#D4213D", city: "אשדוד",         initials: "אש", logoUrl: `${CDN}/4507.png` },
  "בני סכנין":         { name: "בני סכנין",         shortName: "בני סכנין",    primaryColor: "#008C45", secondaryColor: "#FFFFFF", city: "סכנין",         initials: "בס", logoUrl: `${CDN}/4481.png` },
  "הפועל חדרה":        { name: "הפועל חדרה",        shortName: "הפ. חדרה",     primaryColor: "#E65100", secondaryColor: "#1A1A1A", city: "חדרה",          initials: "הד", logoUrl: `${CDN}/4500.png` },
  "עירוני קריית שמונה":{ name: "עירוני קריית שמונה",shortName: "ק. שמונה",     primaryColor: "#1A3A7A", secondaryColor: "#FFFFFF", city: "קריית שמונה",   initials: "קש", logoUrl: `${CDN}/4510.png` },
  "הפועל ירושלים":     { name: "הפועל ירושלים",     shortName: "הפ. י-ם",      primaryColor: "#800020", secondaryColor: "#FFFFFF", city: "ירושלים",       initials: "הי", logoUrl: `${CDN}/4486.png` },
  "מכבי בני ריינה":    { name: "מכבי בני ריינה",    shortName: "בני ריינה",    primaryColor: "#008C45", secondaryColor: "#FFFFFF", city: "בני ריינה",     initials: "בר", logoUrl: `${CDN}/6186.png` },
  "בני יהודה":         { name: "בני יהודה",         shortName: "בני יהודה",    primaryColor: "#E65100", secondaryColor: "#1A1A1A", city: "תל אביב",       initials: "בי", logoUrl: `${CDN}/4508.png` },
  "הפועל פתח תקווה":  { name: "הפועל פתח תקווה",  shortName: 'הפ. פ"ת',      primaryColor: "#D4213D", secondaryColor: "#1A3A7A", city: "פתח תקווה",     initials: "הפ", logoUrl: `${CDN}/4488.png` },
};

// ליגה לאומית teams
export const LIGA_LEUMIT_TEAMS: Record<string, TeamInfo> = {
  "הפועל רמת גן":       { name: "הפועל רמת גן",       shortName: 'הפ. ר"ג',       primaryColor: "#D4213D", secondaryColor: "#FFFFFF", city: "רמת גן",        initials: "הר", logoUrl: `${CDN}/4489.png` },
  "הפועל כפר סבא":      { name: "הפועל כפר סבא",      shortName: 'הפ. כ"ס',       primaryColor: "#008C45", secondaryColor: "#FFFFFF", city: "כפר סבא",       initials: "הכ", logoUrl: `${CDN}/4497.png` },
  "הפועל עפולה":        { name: "הפועל עפולה",        shortName: "הפ. עפולה",      primaryColor: "#D4213D", secondaryColor: "#1A1A1A", city: "עפולה",         initials: "הע", logoUrl: `${CDN}/4483.png` },
  "הפועל ראשון לציון":  { name: "הפועל ראשון לציון",  shortName: 'הפ. ראשל"צ',    primaryColor: "#E65100", secondaryColor: "#1A1A1A", city: "ראשון לציון",   initials: "הר", logoUrl: `${CDN}/4491.png` },
  "מכבי הרצליה":        { name: "מכבי הרצליה",        shortName: "מ. הרצליה",      primaryColor: "#1A3A7A", secondaryColor: "#FFFFFF", city: "הרצליה",        initials: "מה", logoUrl: `${CDN}/4503.png` },
  "הפועל נוף הגליל":   { name: "הפועל נוף הגליל",   shortName: "הפ. נ. הגליל",  primaryColor: "#D4213D", secondaryColor: "#FFFFFF", city: "נוף הגליל",     initials: "הנ", logoUrl: `${CDN}/4487.png` },
  "הפועל אום אל פחם":  { name: "הפועל אום אל פחם",  shortName: "הפ. א. פחם",    primaryColor: "#008C45", secondaryColor: "#FFFFFF", city: "אום אל פחם",    initials: "הא", logoUrl: `${CDN}/4492.png` },
  "עירוני טבריה":       { name: "עירוני טבריה",       shortName: "ע. טבריה",       primaryColor: "#1A3A7A", secondaryColor: "#FFFFFF", city: "טבריה",         initials: "עט", logoUrl: `${CDN}/6181.png` },
  "הפועל עכו":          { name: "הפועל עכו",          shortName: "הפ. עכו",        primaryColor: "#008C45", secondaryColor: "#FFFFFF", city: "עכו",           initials: "הע", logoUrl: `${CDN}/4482.png` },
  "הפועל רעננה":        { name: "הפועל רעננה",        shortName: "הפ. רעננה",      primaryColor: "#D4213D", secondaryColor: "#FFFFFF", city: "רעננה",         initials: "הר", logoUrl: `${CDN}/4509.png` },
};

// English API name → Hebrew display name
const EN_TO_HE: Record<string, string> = {
  "Maccabi Tel Aviv": "מכבי תל אביב",
  "Maccabi Haifa": "מכבי חיפה",
  "Hapoel Beer Sheva": "הפועל באר שבע",
  "Beitar Jerusalem": "ביתר ירושלים",
  "Hapoel Tel Aviv": "הפועל תל אביב",
  "Hapoel Haifa": "הפועל חיפה",
  "Maccabi Netanya": "מכבי נתניה",
  "Ashdod": "מ.ס. אשדוד",
  "Ironi Kiryat Shmona": "עירוני קריית שמונה",
  "Bnei Sakhnin": "בני סכנין",
  "Hapoel Katamon": "הפועל קטמון",
  "Hapoel Petah Tikva": "הפועל פתח תקווה",
  "Maccabi Petah Tikva": "מכבי פתח תקווה",
  "Hapoel Hadera": "הפועל חדרה",
  "Maccabi Bnei Raina": "מכבי בני ריינה",
  "Ironi Tiberias": "עירוני טבריה",
  "Hapoel Acre": "הפועל עכו",
  "Hapoel Afula": "הפועל עפולה",
  "Hapoel Nazareth Illit": "הפועל נוף הגליל",
  "Hapoel Ramat Gan": "הפועל רמת גן",
  "Hapoel Ramat HaSharon": "הפועל רמת השרון",
  "Hapoel Rishon LeZion": "הפועל ראשון לציון",
  "Hapoel Umm al-Fahm": "הפועל אום אל פחם",
  "Kafr Qasim": "מ.ס. כפר קאסם",
  "Maccabi Herzliya": "מכבי הרצליה",
  "Bnei Yehuda": "בני יהודה",
  "Hapoel Kfar Saba": "הפועל כפר סבא",
  "Hapoel Ra'anana": "הפועל רעננה",
  "Hapoel Kfar Shalem": "הפועל כפר שלם",
  "Maccabi Kabilio Jaffa": "מכבי קבילייו יפו",
  "Nordia Jerusalem": "נורדיה ירושלים",
  "Tira": "הפועל טירה",
  "Ihud Bnei Shfaram": "איחוד בני שפרעם",
  "Ironi Modi'in": "עירוני מודיעין",
  "Kiryat Yam SC": "קריית ים",
  "Hapoel Jerusalem": "הפועל ירושלים",
  "Sektzia Nes Tziona": "סקציה נס ציונה",
  "Maccabi Ahi Nazareth": "מכבי אחי נצרת",
  "Hapoel Petah-Tikva": "הפועל פתח תקווה",
};

/** Translate English API name to Hebrew. Returns original if no mapping found. */
export function hebrewTeamName(name: string): string {
  return EN_TO_HE[name] ?? name;
}

// Get all teams
export function getTeamInfo(teamName: string): TeamInfo | undefined {
  const hebrew = hebrewTeamName(teamName);
  return LIGAT_HAEL_TEAMS[hebrew] || LIGA_LEUMIT_TEAMS[hebrew] ||
         LIGAT_HAEL_TEAMS[teamName] || LIGA_LEUMIT_TEAMS[teamName];
}

/**
 * Generate dynamic CSS styles for a match card based on team colors
 * Creates a gradient background using both teams' primary colors
 */
export function getMatchCardGradient(homeTeam: string, awayTeam: string): React.CSSProperties {
  const home = getTeamInfo(homeTeam);
  const away = getTeamInfo(awayTeam);
  
  const homeColor = home?.primaryColor || "#1a2332";
  const awayColor = away?.primaryColor || "#1a2332";
  
  return {
    background: `linear-gradient(135deg, ${homeColor}15 0%, transparent 40%, transparent 60%, ${awayColor}15 100%)`,
    borderImage: `linear-gradient(to left, ${homeColor}40, transparent 30%, transparent 70%, ${awayColor}40) 1`,
  };
}

/**
 * Get team color accent style for a specific side (home/away)
 */
export function getTeamAccentStyle(teamName: string, opacity: number = 0.15): React.CSSProperties {
  const team = getTeamInfo(teamName);
  if (!team) return {};
  return {
    backgroundColor: `${team.primaryColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
    borderColor: `${team.primaryColor}60`,
  };
}

/**
 * Get CSS class-compatible color values for team
 */
export function getTeamColorVars(teamName: string) {
  const team = getTeamInfo(teamName);
  if (!team) return { primary: "#6b7280", secondary: "#9ca3af" };
  return { primary: team.primaryColor, secondary: team.secondaryColor };
}

// Team Badge Component — real logo image when available, SVG shield as fallback
interface TeamBadgeProps {
  teamName: string;
  size?: "sm" | "md" | "lg" | "xl";
  showName?: boolean;
  logoUrl?: string | null;
}

export function TeamBadge({ teamName, size = "md", showName = false, logoUrl }: TeamBadgeProps) {
  const displayName = hebrewTeamName(teamName);
  const team = getTeamInfo(teamName);
  const sizeMap = { sm: 36, md: 48, lg: 64, xl: 88 };
  const textSize = { sm: "text-[8px]", md: "text-[10px]", lg: "text-xs", xl: "text-sm" };
  const initialsSize = { sm: "text-[10px]", md: "text-sm", lg: "text-lg", xl: "text-xl" };
  const dim = sizeMap[size];

  const resolvedLogo = logoUrl ?? team?.logoUrl;

  // Use real logo from API or team data
  if (resolvedLogo) {
    return (
      <div className="flex flex-col items-center gap-1">
        <img
          src={resolvedLogo}
          alt={displayName}
          style={{ width: dim, height: dim }}
          className="object-contain drop-shadow-md"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        {showName && <span className={`${textSize[size]} text-muted-foreground text-center max-w-20 leading-tight font-semibold`}>{displayName}</span>}
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div
          className="rounded-xl bg-muted/30 flex items-center justify-center border border-border/30"
          style={{ width: dim, height: dim }}
        >
          <span className={`font-bold text-muted-foreground ${textSize[size]}`}>
            {displayName.slice(0, 2)}
          </span>
        </div>
        {showName && <span className="text-xs text-muted-foreground text-center max-w-16 truncate">{displayName}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Shield-style badge with team colors */}
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg
          viewBox="0 0 100 120"
          width={dim}
          height={dim}
          className="drop-shadow-lg"
        >
          {/* Shield shape */}
          <path
            d="M50 5 L90 20 L90 60 C90 85 70 105 50 115 C30 105 10 85 10 60 L10 20 Z"
            fill={team.primaryColor}
            stroke={team.secondaryColor}
            strokeWidth="4"
          />
          {/* Inner accent stripe */}
          <path
            d="M50 15 L80 27 L80 38 L20 38 L20 27 Z"
            fill={team.secondaryColor}
            opacity="0.4"
          />
          {/* Bottom accent */}
          <path
            d="M50 95 C35 87 25 75 25 60 L25 55 L75 55 L75 60 C75 75 65 87 50 95 Z"
            fill={team.secondaryColor}
            opacity="0.15"
          />
        </svg>
        {/* Team initials overlay */}
        <div
          className={`absolute inset-0 flex items-center justify-center ${initialsSize[size]} font-black`}
          style={{ color: team.secondaryColor, paddingTop: dim * 0.1, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
        >
          {team.initials}
        </div>
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-full opacity-20 blur-md -z-10"
          style={{ backgroundColor: team.primaryColor }}
        />
      </div>
      {showName && (
        <span className={`${textSize[size]} text-muted-foreground text-center max-w-20 leading-tight font-semibold`}>
          {team.shortName ?? displayName}
        </span>
      )}
    </div>
  );
}

// VS Badge for match display with team color accents
interface MatchVsBadgeProps {
  homeTeam: string;
  awayTeam: string;
  size?: "sm" | "md" | "lg";
}

export function MatchVsBadge({ homeTeam, awayTeam, size = "md" }: MatchVsBadgeProps) {
  const homeInfo = getTeamInfo(homeTeam);
  const awayInfo = getTeamInfo(awayTeam);
  
  return (
    <div className="flex items-center gap-4">
      <TeamBadge teamName={homeTeam} size={size} showName />
      <div className="flex flex-col items-center">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm"
          style={{
            background: `linear-gradient(135deg, ${homeInfo?.primaryColor || '#333'}80, ${awayInfo?.primaryColor || '#333'}80)`,
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          VS
        </div>
      </div>
      <TeamBadge teamName={awayTeam} size={size} showName />
    </div>
  );
}

// Aliases for cleaner imports
export const TeamLogo = TeamBadge;
export const getTeamColors = getTeamColorVars;

/**
 * Match Card Color Bar - thin gradient bar at top of match cards
 */
interface MatchColorBarProps {
  homeTeam: string;
  awayTeam: string;
}

export function MatchColorBar({ homeTeam, awayTeam }: MatchColorBarProps) {
  const homeInfo = getTeamInfo(homeTeam);
  const awayInfo = getTeamInfo(awayTeam);
  const homeColor = homeInfo?.primaryColor || "#333";
  const awayColor = awayInfo?.primaryColor || "#333";
  
  return (
    <div 
      className="h-1 w-full rounded-t-lg"
      style={{
        background: `linear-gradient(to left, ${homeColor}, ${homeColor} 45%, transparent 45%, transparent 55%, ${awayColor} 55%, ${awayColor})`,
      }}
    />
  );
}
