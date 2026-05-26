import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ChampionPicker } from "@/components/cup/ChampionPicker";
import { KnockoutBracket } from "@/components/cup/KnockoutBracket";
import { CupMatchCard } from "@/components/cup/CupMatchCard";
import Navigation from "@/components/Navigation";

const SEASON = "2024-25";

const ROUNDS = [
  { key: "round_of_32", label: "שלב 32" },
  { key: "round_of_16", label: "שלב 16" },
  { key: "quarter_final", label: "רבע גמר" },
  { key: "semi_final", label: "חצי גמר" },
  { key: "final", label: "גמר" },
] as const;

function RoundSection({ roundKey, label, matches }: {
  roundKey: string;
  label: string;
  matches: Parameters<typeof CupMatchCard>[0]["match"][];
}) {
  const [open, setOpen] = useState(roundKey === "quarter_final" || roundKey === "semi_final" || roundKey === "final");

  if (matches.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border/20 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-muted/10 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-black px-2.5 py-1 rounded-full"
            style={{ background: "oklch(0.75 0.190 70 / 0.15)", color: "oklch(0.80 0.170 70)" }}
          >
            🏆 {label}
          </span>
          <span className="text-sm text-muted-foreground">{matches.length} משחקים</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {matches.map((m) => (
            <CupMatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Cup() {
  const { data, isLoading } = trpc.cup.getBracket.useQuery({ season: SEASON });

  const bracket = data?.bracket ?? {
    round_of_32: [],
    round_of_16: [],
    quarter_final: [],
    semi_final: [],
    final: [],
  };

  const totalMatches = Object.values(bracket).flat().length;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navigation />

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.75 0.190 70 / 0.12), transparent)" }}
        />
        <div className="max-w-4xl mx-auto px-4 pt-10 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex items-center gap-4 mb-2"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, oklch(0.75 0.190 70 / 0.30), oklch(0.75 0.190 70 / 0.15))", border: "1.5px solid oklch(0.75 0.190 70 / 0.40)" }}
            >
              <Trophy className="w-6 h-6" style={{ color: "oklch(0.80 0.170 70)" }} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground">גביע המדינה {SEASON}</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                ניחושי פלייאוף · בונוס 15 נקודות לאלוף · {totalMatches} משחקים
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-8 pb-20">

        {/* Champion Picker */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-base font-black text-foreground mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4" style={{ color: "oklch(0.80 0.170 70)" }} />
            ניחוש אלוף
          </h2>
          <ChampionPicker season={SEASON} />
        </motion.section>

        {/* Bracket */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-base font-black text-foreground mb-4 flex items-center gap-2">
            <span style={{ color: "oklch(0.80 0.170 70)" }}>🗺️</span>
            עץ הגביע
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>טוען נתוני גביע...</span>
            </div>
          ) : totalMatches === 0 ? (
            <div
              className="text-center py-16 rounded-2xl border border-dashed"
              style={{ borderColor: "oklch(0.75 0.190 70 / 0.20)" }}
            >
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: "oklch(0.80 0.170 70)" }} />
              <p className="text-muted-foreground font-bold">משחקי גביע יתווספו בקרוב</p>
              <p className="text-muted-foreground/60 text-sm mt-1">מנהל האפליקציה יעדכן את הלוח</p>
            </div>
          ) : (
            <div
              className="p-4 rounded-2xl border"
              style={{
                background: "oklch(0.12 0.038 252 / 0.6)",
                borderColor: "oklch(0.75 0.190 70 / 0.15)",
              }}
            >
              <KnockoutBracket bracket={bracket} />
            </div>
          )}
        </motion.section>

        {/* Round-by-round match list */}
        {totalMatches > 0 && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="text-base font-black text-foreground mb-4 flex items-center gap-2">
              <span style={{ color: "oklch(0.80 0.170 70)" }}>📋</span>
              כל משחקי הגביע
            </h2>
            <div className="space-y-3">
              {ROUNDS.map((r) => (
                <RoundSection
                  key={r.key}
                  roundKey={r.key}
                  label={r.label}
                  matches={bracket[r.key] ?? []}
                />
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
