import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TeamLogo, LIGAT_HAEL_TEAMS } from "@/components/TeamLogos";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Trophy, Check, Star, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const CUP_TEAMS = Object.keys(LIGAT_HAEL_TEAMS).slice(0, 16);

interface Props {
  season?: string;
}

export function ChampionPicker({ season = "2024-25" }: Props) {
  const { isAuthenticated } = useAuth();
  const [selecting, setSelecting] = useState(false);

  const { data: myPrediction, refetch } = trpc.cup.getChampionPrediction.useQuery(
    { season },
    { enabled: isAuthenticated },
  );

  const { data: stats = {} } = trpc.cup.getChampionStats.useQuery({ season });

  const predictMutation = trpc.cup.predictChampion.useMutation({
    onSuccess: () => {
      toast.success("ניחוש אלוף הגביע נשמר! 🏆 בונוס 15 נקודות אם תצדק");
      refetch();
      setSelecting(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const totalVotes = Object.values(stats).reduce((s, v) => s + v, 0);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center gap-3 p-4 rounded-2xl border border-amber-400/20 bg-amber-400/5">
        <Lock className="w-4 h-4 text-amber-400" />
        <p className="text-sm text-muted-foreground">
          <span className="font-bold text-foreground">התחבר</span> כדי לנחש את אלוף הגביע ולהרוויח{" "}
          <span className="text-amber-400 font-black">15 נקודות</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Banner */}
      <div
        className="flex items-center justify-between p-4 rounded-2xl border"
        style={{
          background: "linear-gradient(135deg, oklch(0.75 0.190 70 / 0.12), oklch(0.75 0.190 70 / 0.06))",
          borderColor: "oklch(0.75 0.190 70 / 0.30)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "oklch(0.75 0.190 70 / 0.20)" }}
          >
            <Trophy className="w-5 h-5" style={{ color: "oklch(0.80 0.170 70)" }} />
          </div>
          <div>
            <p className="font-black text-foreground text-sm">ניחוש אלוף הגביע</p>
            <p className="text-xs text-muted-foreground">
              <Star className="w-3 h-3 inline ml-1" style={{ color: "oklch(0.80 0.170 70)" }} />
              <span className="font-bold" style={{ color: "oklch(0.80 0.170 70)" }}>15 נקודות בונוס</span> אם תצדק!
            </p>
          </div>
        </div>

        {myPrediction ? (
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <TeamLogo teamName={myPrediction.teamName} size="sm" />
              <span className="text-[10px] text-muted-foreground">{myPrediction.teamName}</span>
            </div>
            <button
              onClick={() => setSelecting(true)}
              className="text-xs text-primary hover:underline"
            >
              שנה
            </button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="accent"
            className="font-bold text-xs"
            onClick={() => setSelecting(true)}
          >
            בחר אלוף
          </Button>
        )}
      </div>

      {/* Team picker grid */}
      <AnimatePresence>
        {selecting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="p-4 rounded-2xl border"
              style={{ background: "oklch(0.14 0.040 252 / 0.8)", borderColor: "oklch(0.75 0.190 70 / 0.20)" }}
            >
              <p className="text-sm font-bold text-foreground mb-3">בחר את האלוף שלך:</p>
              <div className="grid grid-cols-4 gap-2">
                {CUP_TEAMS.map((team) => {
                  const votes = stats[team] ?? 0;
                  const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                  const isChosen = myPrediction?.teamName === team;
                  return (
                    <button
                      key={team}
                      onClick={() => predictMutation.mutate({ teamName: team, season })}
                      disabled={predictMutation.isPending}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all duration-150 ${
                        isChosen
                          ? "border-amber-400/60 bg-amber-400/10"
                          : "border-border/20 hover:border-amber-400/30 bg-white/5"
                      }`}
                    >
                      <TeamLogo teamName={team} size="sm" />
                      <span className="text-[9px] text-muted-foreground leading-tight text-center line-clamp-2">{team}</span>
                      {pct > 0 && (
                        <span className="text-[8px] font-bold" style={{ color: "oklch(0.80 0.170 70)" }}>
                          {pct}%
                        </span>
                      )}
                      {isChosen && <Check className="w-3 h-3 text-amber-400" />}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setSelecting(false)}
                className="mt-3 text-xs text-muted-foreground hover:text-foreground w-full text-center"
              >
                ביטול
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
