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
}

// ליגת העל teams with accurate colors
export const LIGAT_HAEL_TEAMS: Record<string, TeamInfo> = {
  "מכבי חיפה": { name: "מכבי חיפה", shortName: "מ. חיפה", primaryColor: "#008C45", secondaryColor: "#FFFFFF", city: "חיפה", initials: "מח" },
  "מכבי תל אביב": { name: "מכבי תל אביב", shortName: "מ. ת\"א", primaryColor: "#F5D000", secondaryColor: "#1A3A7A", city: "תל אביב", initials: "מת" },
  "הפועל באר שבע": { name: "הפועל באר שבע", shortName: "הפ. ב\"ש", primaryColor: "#D4213D", secondaryColor: "#1A1A1A", city: "באר שבע", initials: "הב" },
  "הפועל תל אביב": { name: "הפועל תל אביב", shortName: "הפ. ת\"א", primaryColor: "#D4213D", secondaryColor: "#FFFFFF", city: "תל אביב", initials: "הת" },
  "בית\"ר ירושלים": { name: "בית\"ר ירושלים", shortName: "בית\"ר י-ם", primaryColor: "#F5D000", secondaryColor: "#1A1A1A", city: "ירושלים", initials: "בי" },
  "מכבי נתניה": { name: "מכבי נתניה", shortName: "מ. נתניה", primaryColor: "#F5D000", secondaryColor: "#1A1A1A", city: "נתניה", initials: "מנ" },
  "מכבי פתח תקווה": { name: "מכבי פתח תקווה", shortName: "מ. פ\"ת", primaryColor: "#1A3A7A", secondaryColor: "#FFFFFF", city: "פתח תקווה", initials: "מפ" },
  "הפועל חיפה": { name: "הפועל חיפה", shortName: "הפ. חיפה", primaryColor: "#D4213D", secondaryColor: "#FFFFFF", city: "חיפה", initials: "הח" },
  "מ.ס. אשדוד": { name: "מ.ס. אשדוד", shortName: "מ.ס. אשדוד", primaryColor: "#F5D000", secondaryColor: "#D4213D", city: "אשדוד", initials: "אש" },
  "בני סכנין": { name: "בני סכנין", shortName: "בני סכנין", primaryColor: "#008C45", secondaryColor: "#FFFFFF", city: "סכנין", initials: "בס" },
  "הפועל חדרה": { name: "הפועל חדרה", shortName: "הפ. חדרה", primaryColor: "#E65100", secondaryColor: "#1A1A1A", city: "חדרה", initials: "הד" },
  "עירוני קריית שמונה": { name: "עירוני קריית שמונה", shortName: "ק. שמונה", primaryColor: "#1A3A7A", secondaryColor: "#FFFFFF", city: "קריית שמונה", initials: "קש" },
  "הפועל ירושלים": { name: "הפועל ירושלים", shortName: "הפ. י-ם", primaryColor: "#800020", secondaryColor: "#FFFFFF", city: "ירושלים", initials: "הי" },
  "מכבי בני ריינה": { name: "מכבי בני ריינה", shortName: "בני ריינה", primaryColor: "#008C45", secondaryColor: "#FFFFFF", city: "בני ריינה", initials: "בר" },
  "בני יהודה": { name: "בני יהודה", shortName: "בני יהודה", primaryColor: "#E65100", secondaryColor: "#1A1A1A", city: "תל אביב", initials: "בי" },
  "הפועל פתח תקווה": { name: "הפועל פתח תקווה", shortName: "הפ. פ\"ת", primaryColor: "#D4213D", secondaryColor: "#1A3A7A", city: "פתח תקווה", initials: "הפ" },
};

// ליגה לאומית teams
export const LIGA_LEUMIT_TEAMS: Record<string, TeamInfo> = {
  "הפועל רמת גן": { name: "הפועל רמת גן", shortName: "הפ. ר\"ג", primaryColor: "#D4213D", secondaryColor: "#FFFFFF", city: "רמת גן", initials: "הר" },
  "הפועל כפר סבא": { name: "הפועל כפר סבא", shortName: "הפ. כ\"ס", primaryColor: "#008C45", secondaryColor: "#FFFFFF", city: "כפר סבא", initials: "הכ" },
  "הפועל עפולה": { name: "הפועל עפולה", shortName: "הפ. עפולה", primaryColor: "#D4213D", secondaryColor: "#1A1A1A", city: "עפולה", initials: "הע" },
  "הפועל ראשון לציון": { name: "הפועל ראשון לציון", shortName: "הפ. ראשל\"צ", primaryColor: "#E65100", secondaryColor: "#1A1A1A", city: "ראשון לציון", initials: "הר" },
  "מכבי הרצליה": { name: "מכבי הרצליה", shortName: "מ. הרצליה", primaryColor: "#1A3A7A", secondaryColor: "#FFFFFF", city: "הרצליה", initials: "מה" },
  "הפועל נוף הגליל": { name: "הפועל נוף הגליל", shortName: "הפ. נ. הגליל", primaryColor: "#D4213D", secondaryColor: "#FFFFFF", city: "נוף הגליל", initials: "הנ" },
  "הפועל אום אל פחם": { name: "הפועל אום אל פחם", shortName: "הפ. א. פחם", primaryColor: "#008C45", secondaryColor: "#FFFFFF", city: "אום אל פחם", initials: "הא" },
  "הפועל פתח תקווה": { name: "הפועל פתח תקווה", shortName: "הפ. פ\"ת", primaryColor: "#D4213D", secondaryColor: "#1A3A7A", city: "פתח תקווה", initials: "הפ" },
  "עירוני טבריה": { name: "עירוני טבריה", shortName: "ע. טבריה", primaryColor: "#1A3A7A", secondaryColor: "#FFFFFF", city: "טבריה", initials: "עט" },
  "הפועל עכו": { name: "הפועל עכו", shortName: "הפ. עכו", primaryColor: "#008C45", secondaryColor: "#FFFFFF", city: "עכו", initials: "הע" },
};

// Get all teams
export function getTeamInfo(teamName: string): TeamInfo | undefined {
  return LIGAT_HAEL_TEAMS[teamName] || LIGA_LEUMIT_TEAMS[teamName];
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

// Team Badge Component — Shield-style SVG crest with team colors
interface TeamBadgeProps {
  teamName: string;
  size?: "sm" | "md" | "lg" | "xl";
  showName?: boolean;
}

export function TeamBadge({ teamName, size = "md", showName = false }: TeamBadgeProps) {
  const team = getTeamInfo(teamName);
  const sizeMap = { sm: 36, md: 52, lg: 68, xl: 88 };
  const textSize = { sm: "text-[8px]", md: "text-[10px]", lg: "text-xs", xl: "text-sm" };
  const initialsSize = { sm: "text-[10px]", md: "text-sm", lg: "text-lg", xl: "text-xl" };
  const dim = sizeMap[size];

  if (!team) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div
          className="rounded-xl bg-muted/30 flex items-center justify-center border border-border/30"
          style={{ width: dim, height: dim }}
        >
          <span className={`font-bold text-muted-foreground ${textSize[size]}`}>
            {teamName.slice(0, 2)}
          </span>
        </div>
        {showName && <span className="text-xs text-muted-foreground text-center max-w-16 truncate">{teamName}</span>}
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
          {team.shortName}
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
