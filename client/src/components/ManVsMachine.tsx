/**
 * Man vs. Machine Challenge Component
 * Creates the competitive narrative between user predictions and AI predictions
 */
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Zap, Trophy, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ManVsMachineProps {
  homeTeam: string;
  awayTeam: string;
  aiPrediction?: {
    homeWinProb: number;
    drawProb: number;
    awayWinProb: number;
    recommendedPick: string;
    confidence?: number;
  };
  userPrediction?: string;
  matchResult?: string;
  onChallenge?: () => void;
  isAuthenticated: boolean;
}

export function ManVsMachineChallenge({
  homeTeam,
  awayTeam,
  aiPrediction,
  userPrediction,
  matchResult,
  onChallenge,
  isAuthenticated,
}: ManVsMachineProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getPickLabel = (pick: string) => {
    switch (pick) {
      case "home_win": return `ניצחון ${homeTeam}`;
      case "draw": return "תיקו";
      case "away_win": return `ניצחון ${awayTeam}`;
      default: return pick;
    }
  };

  const getPickEmoji = (pick: string) => {
    switch (pick) {
      case "home_win": return "🏠";
      case "draw": return "🤝";
      case "away_win": return "✈️";
      default: return "⚽";
    }
  };

  // If match has a result, show "Who was right?" comparison
  if (matchResult && aiPrediction && userPrediction) {
    const aiCorrect = aiPrediction.recommendedPick === matchResult;
    const userCorrect = userPrediction === matchResult;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-xl border border-border/30 bg-gradient-to-br from-slate-900/80 to-slate-800/80 p-4"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-purple-500/5" />
        
        <div className="relative">
          <div className="text-center mb-3">
            <span className="text-sm font-bold text-amber-400">🏆 מי צדק?</span>
          </div>

          <div className="grid grid-cols-3 gap-2 items-center">
            {/* User Side */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`text-center p-3 rounded-lg border ${
                userCorrect
                  ? "border-emerald-500/50 bg-emerald-500/10"
                  : "border-red-500/30 bg-red-500/5"
              }`}
            >
              <User className="w-6 h-6 mx-auto mb-1 text-blue-400" />
              <p className="text-xs text-muted-foreground mb-1">אתה</p>
              <p className="text-sm font-bold">{getPickEmoji(userPrediction)}</p>
              <p className="text-xs mt-1">{getPickLabel(userPrediction)}</p>
              {userCorrect && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="mt-1"
                >
                  <span className="text-xs text-emerald-400 font-bold">✓ צדקת!</span>
                </motion.div>
              )}
            </motion.div>

            {/* VS Center */}
            <div className="text-center">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Swords className="w-8 h-8 mx-auto text-amber-400" />
              </motion.div>
              <p className="text-xs text-muted-foreground mt-1">
                תוצאה: {getPickLabel(matchResult)}
              </p>
            </div>

            {/* AI Side */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`text-center p-3 rounded-lg border ${
                aiCorrect
                  ? "border-emerald-500/50 bg-emerald-500/10"
                  : "border-red-500/30 bg-red-500/5"
              }`}
            >
              <Bot className="w-6 h-6 mx-auto mb-1 text-purple-400" />
              <p className="text-xs text-muted-foreground mb-1">AI</p>
              <p className="text-sm font-bold">{getPickEmoji(aiPrediction.recommendedPick)}</p>
              <p className="text-xs mt-1">{getPickLabel(aiPrediction.recommendedPick)}</p>
              {aiCorrect && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                  className="mt-1"
                >
                  <span className="text-xs text-emerald-400 font-bold">✓ צדק!</span>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Score Summary */}
          {userCorrect && !aiCorrect && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-center text-sm font-bold text-emerald-400 mt-3"
            >
              🎉 ניצחת את ה-AI! אתה מומחה אמיתי!
            </motion.p>
          )}
          {!userCorrect && aiCorrect && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-center text-sm font-bold text-purple-400 mt-3"
            >
              🤖 ה-AI ניצח הפעם. נסה שוב במשחק הבא!
            </motion.p>
          )}
          {userCorrect && aiCorrect && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-center text-sm font-bold text-amber-400 mt-3"
            >
              🤝 שניכם צדקתם! מוחות גדולים חושבים אותו דבר
            </motion.p>
          )}
          {!userCorrect && !aiCorrect && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-center text-sm font-bold text-muted-foreground mt-3"
            >
              😅 אף אחד לא צדק. כדורגל זה כדורגל!
            </motion.p>
          )}
        </div>
      </motion.div>
    );
  }

  // If user already predicted, show locked-in state
  if (userPrediction && aiPrediction) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-br from-slate-900/80 to-emerald-900/20 p-4"
      >
        <div className="absolute top-2 left-2">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Zap className="w-4 h-4 text-amber-400" />
          </motion.div>
        </div>

        <div className="text-center mb-2">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            ⚔️ האתגר נקבע!
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 items-center">
          <div className="text-center">
            <User className="w-5 h-5 mx-auto mb-1 text-blue-400" />
            <p className="text-xs text-muted-foreground">הבחירה שלך</p>
            <p className="text-sm font-bold text-foreground mt-1">
              {getPickEmoji(userPrediction)} {getPickLabel(userPrediction)}
            </p>
          </div>

          <div className="text-center">
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-lg font-black text-amber-400"
            >
              VS
            </motion.span>
          </div>

          <div className="text-center">
            <Bot className="w-5 h-5 mx-auto mb-1 text-purple-400" />
            <p className="text-xs text-muted-foreground">חיזוי AI</p>
            <p className="text-sm font-bold text-foreground mt-1">
              {getPickEmoji(aiPrediction.recommendedPick)} {getPickLabel(aiPrediction.recommendedPick)}
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-3">
          🔒 הניחוש שלך ננעל. נתראה אחרי המשחק!
        </p>
      </motion.div>
    );
  }

  // Challenge CTA - user hasn't predicted yet
  if (aiPrediction && !userPrediction) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-slate-900/80 to-amber-900/10 p-4"
      >
        {/* Animated background glow */}
        <motion.div
          animate={{
            opacity: isHovered ? 0.3 : 0.1,
            scale: isHovered ? 1.05 : 1,
          }}
          className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-transparent to-purple-500/20 rounded-xl"
        />

        <div className="relative text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Bot className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-bold text-amber-400">האורקל אומר:</span>
          </div>

          <p className="text-base font-bold text-foreground">
            {getPickEmoji(aiPrediction.recommendedPick)} {getPickLabel(aiPrediction.recommendedPick)}
            <span className="text-muted-foreground text-sm font-normal mr-2">
              ({aiPrediction.confidence || 75}% ביטחון)
            </span>
          </p>

          <div className="pt-1">
            <p className="text-sm text-amber-300/90 font-semibold mb-2">
              חושב שאתה מבין יותר מה-AI? 🧠
            </p>

            {isAuthenticated ? (
              <Button
                onClick={onChallenge}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold shadow-lg shadow-amber-500/25 transition-all duration-200 active:scale-[0.97]"
                size="sm"
              >
                <Swords className="w-4 h-4 ml-2" />
                הכנס את הניחוש שלך!
              </Button>
            ) : (
              <Button
                onClick={onChallenge}
                variant="outline"
                className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                size="sm"
              >
                <Trophy className="w-4 h-4 ml-2" />
                התחבר כדי לאתגר את ה-AI
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
}

// Stats comparison for the dashboard
interface ManVsMachineStatsProps {
  userWins: number;
  aiWins: number;
  ties: number;
}

export function ManVsMachineStats({ userWins, aiWins, ties }: ManVsMachineStatsProps) {
  const total = userWins + aiWins + ties;
  const userPct = total > 0 ? Math.round((userWins / total) * 100) : 0;
  const aiPct = total > 0 ? Math.round((aiWins / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/30 bg-gradient-to-br from-slate-900/80 to-slate-800/80 p-4"
    >
      <h3 className="text-center text-sm font-bold text-foreground mb-4">
        ⚔️ אדם מול מכונה — הסטטיסטיקה שלך
      </h3>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="space-y-1">
          <User className="w-6 h-6 mx-auto text-blue-400" />
          <p className="text-2xl font-black text-blue-400">{userWins}</p>
          <p className="text-xs text-muted-foreground">ניצחונות שלך</p>
          <p className="text-xs text-blue-400/70">{userPct}%</p>
        </div>

        <div className="space-y-1">
          <Swords className="w-6 h-6 mx-auto text-amber-400" />
          <p className="text-2xl font-black text-amber-400">{ties}</p>
          <p className="text-xs text-muted-foreground">תיקו</p>
        </div>

        <div className="space-y-1">
          <Bot className="w-6 h-6 mx-auto text-purple-400" />
          <p className="text-2xl font-black text-purple-400">{aiWins}</p>
          <p className="text-xs text-muted-foreground">ניצחונות AI</p>
          <p className="text-xs text-purple-400/70">{aiPct}%</p>
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mt-4 h-2 rounded-full overflow-hidden bg-muted/30 flex">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${userPct}%` }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="h-full bg-blue-500"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.round((ties / total) * 100)}%` }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="h-full bg-amber-500"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${aiPct}%` }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="h-full bg-purple-500"
          />
        </div>
      )}
    </motion.div>
  );
}
