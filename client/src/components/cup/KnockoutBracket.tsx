import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TeamLogo } from "@/components/TeamLogos";
import { CupMatchCard } from "./CupMatchCard";

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

type Bracket = Record<string, Match[]>;

const ROUNDS = [
  { key: "round_of_32", label: "שלב 32", short: "32" },
  { key: "round_of_16", label: "שלב 16", short: "16" },
  { key: "quarter_final", label: "רבע גמר", short: "רבע" },
  { key: "semi_final", label: "חצי גמר", short: "חצי" },
  { key: "final", label: "גמר", short: "גמר" },
];

const CARD_H = 88; // px — match card height
const SLOT_H = CARD_H + 12; // card + gap between cards
const BASE = 16; // max matches in first round (round_of_32)
const TOTAL_H = BASE * SLOT_H;

function getMatchY(roundIndex: number, matchIndex: number): number {
  const slotsPerMatch = Math.pow(2, roundIndex);
  return (matchIndex * 2 + 1) * slotsPerMatch * SLOT_H * 0.5 - CARD_H * 0.5;
}

interface MatchSlotProps {
  match: Match | undefined;
  placeholder?: boolean;
  onClick: () => void;
  isSelected: boolean;
}

function MatchSlot({ match, placeholder, onClick, isSelected }: MatchSlotProps) {
  if (placeholder || !match) {
    return (
      <div
        className="rounded-xl border border-dashed flex items-center justify-center"
        style={{
          width: 180,
          height: CARD_H,
          borderColor: "oklch(0.75 0.190 70 / 0.15)",
          background: "oklch(0.14 0.040 252 / 0.4)",
        }}
      >
        <span className="text-muted-foreground/30 text-xs">—</span>
      </div>
    );
  }

  const isFinished = match.status === "finished";
  const winner = isFinished && match.actualResult
    ? (match.actualResult === "home" ? match.homeTeam : match.awayTeam)
    : null;

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="rounded-xl border text-right transition-all duration-150 overflow-hidden text-start"
      style={{
        width: 180,
        height: CARD_H,
        background: isSelected
          ? "linear-gradient(135deg, oklch(0.75 0.190 70 / 0.18), oklch(0.75 0.190 70 / 0.08))"
          : "linear-gradient(135deg, oklch(0.16 0.042 250), oklch(0.13 0.038 252))",
        borderColor: isSelected ? "oklch(0.75 0.190 70 / 0.50)" : "oklch(0.75 0.190 70 / 0.18)",
      }}
    >
      {/* Teams */}
      {[
        { team: match.homeTeam, score: match.actualHomeScore, side: "home" },
        { team: match.awayTeam, score: match.actualAwayScore, side: "away" },
      ].map(({ team, score, side }) => {
        const isWinner = winner === team;
        return (
          <div
            key={side}
            className="flex items-center justify-between px-2"
            style={{ height: CARD_H / 2 }}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <TeamLogo teamName={team} size="sm" />
              <span
                className={`text-[11px] leading-tight line-clamp-1 ${
                  isWinner ? "font-black text-foreground" : "font-medium text-muted-foreground"
                }`}
              >
                {team}
              </span>
            </div>
            {score !== null && (
              <span
                className={`text-sm font-black shrink-0 ml-1 ${
                  isWinner ? "text-amber-400" : "text-muted-foreground/60"
                }`}
              >
                {score}
              </span>
            )}
          </div>
        );
      })}
    </motion.button>
  );
}

interface Props {
  bracket: Bracket;
}

export function KnockoutBracket({ bracket }: Props) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [activeRound, setActiveRound] = useState<string>("quarter_final");

  // Mobile: tab-based view
  const [mobileView, setMobileView] = useState(false);

  return (
    <div dir="rtl">
      {/* Mobile round selector */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1 md:hidden">
        {ROUNDS.map((r) => {
          const count = bracket[r.key]?.length ?? 0;
          return (
            <button
              key={r.key}
              onClick={() => { setActiveRound(r.key); setMobileView(true); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeRound === r.key
                  ? "text-white"
                  : "text-muted-foreground"
              }`}
              style={
                activeRound === r.key
                  ? { background: "oklch(0.75 0.190 70 / 0.80)" }
                  : { background: "oklch(0.16 0.042 250 / 0.6)" }
              }
            >
              {r.short} {count > 0 && <span className="opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Mobile: list of matches for selected round */}
      <div className="md:hidden space-y-3">
        {(bracket[activeRound] ?? []).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground/50 text-sm">
            <p>אין משחקים בשלב זה עדיין</p>
          </div>
        ) : (
          (bracket[activeRound] ?? []).map((m) => (
            <CupMatchCard key={m.id} match={m} />
          ))
        )}
      </div>

      {/* Desktop: full bracket */}
      <div className="hidden md:block">
        <div className="overflow-x-auto pb-4">
          <div
            className="relative flex gap-0"
            style={{ width: ROUNDS.length * (180 + 48), height: TOTAL_H }}
          >
            {ROUNDS.map((round, rIdx) => {
              const roundMatches = bracket[round.key] ?? [];
              const slotsInRound = BASE / Math.pow(2, rIdx);

              return (
                <div
                  key={round.key}
                  className="relative shrink-0"
                  style={{ width: 180 + 48 }}
                >
                  {/* Round header */}
                  <div
                    className="absolute top-0 right-0 left-0 flex items-center justify-center pb-2"
                    style={{ top: -32 }}
                  >
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{ background: "oklch(0.75 0.190 70 / 0.15)", color: "oklch(0.80 0.170 70)" }}
                    >
                      {round.label}
                    </span>
                  </div>

                  {/* Match slots */}
                  {Array.from({ length: slotsInRound }).map((_, slotIdx) => {
                    const match = roundMatches[slotIdx];
                    const y = getMatchY(rIdx, slotIdx);

                    // Connecting line to next round
                    const showLine = rIdx < ROUNDS.length - 1;
                    const nextY = getMatchY(rIdx + 1, Math.floor(slotIdx / 2));
                    const lineStart = y + CARD_H / 2;
                    const lineEnd = nextY + CARD_H / 2;
                    const isTopOfPair = slotIdx % 2 === 0;

                    return (
                      <div key={slotIdx} className="absolute" style={{ top: y, right: 24 }}>
                        <MatchSlot
                          match={match}
                          onClick={() => setSelectedMatch(match ?? null)}
                          isSelected={selectedMatch?.id === match?.id}
                        />

                        {/* Horizontal connector → right side */}
                        {showLine && (
                          <svg
                            className="absolute top-0 left-0 pointer-events-none overflow-visible"
                            style={{ left: -24, top: CARD_H / 2 - 1 }}
                            width={24}
                            height={1}
                          >
                            <line
                              x1={0} y1={0} x2={24} y2={0}
                              stroke="oklch(0.75 0.190 70 / 0.25)"
                              strokeWidth={1.5}
                            />
                          </svg>
                        )}

                        {/* Vertical bracket line connecting pair */}
                        {showLine && (
                          <svg
                            className="absolute pointer-events-none overflow-visible"
                            style={{
                              left: -24,
                              top: isTopOfPair ? CARD_H / 2 : -(lineStart - lineEnd) - CARD_H / 2,
                            }}
                            width={1}
                            height={Math.abs(lineEnd - lineStart)}
                          >
                            <line
                              x1={0} y1={0}
                              x2={0} y2={Math.abs(lineEnd - lineStart)}
                              stroke="oklch(0.75 0.190 70 / 0.20)"
                              strokeWidth={1.5}
                            />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected match detail sheet */}
      <AnimatePresence>
        {selectedMatch && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMatch(null)}
            />
            <motion.div
              className="fixed bottom-0 inset-x-0 z-50 p-4 rounded-t-2xl border-t border-border/40 max-w-lg mx-auto"
              style={{ background: "oklch(0.13 0.038 252)" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              dir="rtl"
            >
              <div className="w-10 h-1 rounded-full bg-border/40 mx-auto mb-4" />
              <CupMatchCard match={selectedMatch} />
              <button
                className="mt-3 w-full text-center text-sm text-muted-foreground"
                onClick={() => setSelectedMatch(null)}
              >
                סגור
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
