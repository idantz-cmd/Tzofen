import { motion } from "framer-motion";
import { TeamLogo } from "@/components/TeamLogos";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Trophy, Clock, Check } from "lucide-react";

type Match = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  status: string | null;
  actualResult: string | null;
  actualHomeScore: number | null;
  actualAwayScore: number | null;
  cupRound: string | null;
  allowsDraw: boolean | null;
};

const ROUND_LABELS: Record<string, string> = {
  round_of_32: "שלב 32",
  round_of_16: "שלב 16",
  quarter_final: "רבע גמר",
  semi_final: "חצי גמר",
  final: "גמר",
};

interface Props {
  match: Match;
  userPrediction?: string | null;
  onPredict?: () => void;
}

export function CupMatchCard({ match, userPrediction, onPredict }: Props) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const submitPrediction = trpc.matches.submitPrediction.useMutation({
    onSuccess: () => {
      toast.success("ניחוש נשמר! 🏆");
      utils.cup.getMatches.invalidate();
      onPredict?.();
    },
    onError: (e) => toast.error(e.message),
  });

  const matchDate = new Date(match.matchDate);
  const isPast = new Date() >= matchDate;
  const isFinished = match.status === "finished";
  const roundLabel = match.cupRound ? ROUND_LABELS[match.cupRound] ?? match.cupRound : "";

  const handlePredict = (side: "home" | "away") => {
    if (!isAuthenticated) { toast.error("יש להתחבר כדי לנחש"); return; }
    if (isPast) { toast.error("הניחוש נסגר"); return; }
    submitPrediction.mutate({ matchId: match.id, prediction: side });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border overflow-hidden"
      style={{
        background: "linear-gradient(135deg, oklch(0.16 0.042 250), oklch(0.13 0.038 252))",
        borderColor: "oklch(0.75 0.190 70 / 0.20)",
      }}
    >
      {/* Round badge */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span
          className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
          style={{ background: "oklch(0.75 0.190 70 / 0.18)", color: "oklch(0.80 0.170 70)" }}
        >
          🏆 {roundLabel}
        </span>
        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {matchDate.toLocaleDateString("he-IL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* Teams row */}
      <div className="flex items-center justify-between px-4 pb-3 gap-3">
        {/* Home */}
        <button
          disabled={isPast || !!userPrediction}
          onClick={() => handlePredict("home")}
          className={`flex flex-col items-center gap-1.5 flex-1 p-2 rounded-xl transition-all duration-150 group ${
            userPrediction === "home"
              ? "ring-2 ring-amber-400/70 bg-amber-400/10"
              : isPast
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-white/5 cursor-pointer"
          }`}
        >
          <TeamLogo teamName={match.homeTeam} size="md" />
          <span className="text-xs font-bold text-foreground text-center leading-tight line-clamp-2">
            {match.homeTeam}
          </span>
          {userPrediction === "home" && <Check className="w-3 h-3 text-amber-400" />}
        </button>

        {/* Score / VS */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          {isFinished && match.actualHomeScore !== null ? (
            <div className="flex items-center gap-1">
              <span className="text-xl font-black text-foreground">{match.actualHomeScore}</span>
              <span className="text-muted-foreground text-sm">–</span>
              <span className="text-xl font-black text-foreground">{match.actualAwayScore}</span>
            </div>
          ) : (
            <span className="text-lg font-black text-muted-foreground/40">vs</span>
          )}
          {isFinished && match.actualResult && (
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "oklch(0.75 0.190 70 / 0.15)", color: "oklch(0.80 0.170 70)" }}
            >
              {match.actualResult === "home" ? match.homeTeam : match.awayTeam} ניצחה
            </span>
          )}
          {!isFinished && !isPast && !userPrediction && (
            <span className="text-[10px] text-muted-foreground/50">לחץ לנחש</span>
          )}
        </div>

        {/* Away */}
        <button
          disabled={isPast || !!userPrediction}
          onClick={() => handlePredict("away")}
          className={`flex flex-col items-center gap-1.5 flex-1 p-2 rounded-xl transition-all duration-150 ${
            userPrediction === "away"
              ? "ring-2 ring-amber-400/70 bg-amber-400/10"
              : isPast
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-white/5 cursor-pointer"
          }`}
        >
          <TeamLogo teamName={match.awayTeam} size="md" />
          <span className="text-xs font-bold text-foreground text-center leading-tight line-clamp-2">
            {match.awayTeam}
          </span>
          {userPrediction === "away" && <Check className="w-3 h-3 text-amber-400" />}
        </button>
      </div>

      {/* Penalties note */}
      {match.allowsDraw === false && !isFinished && (
        <div className="px-4 pb-3">
          <p className="text-[10px] text-center text-muted-foreground/60">
            ⚡ משחק גביע — חייב מנצח (פנדלים / הארכה)
          </p>
        </div>
      )}
    </motion.div>
  );
}
