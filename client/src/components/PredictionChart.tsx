import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { motion } from "framer-motion";

interface PredictionChartProps {
  homeWin: number;
  draw: number;
  awayWin: number;
  homeTeam: string;
  awayTeam: string;
  confidence: number;
  variant?: "bar" | "pie" | "both";
}

const COLORS = {
  home: "#00d084",   // Green accent for home win
  draw: "#f59e0b",   // Orange/amber for draw
  away: "#ef4444",   // Red for away win
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-sm font-semibold text-foreground">{payload[0].payload.name}</p>
        <p className="text-sm text-accent font-bold">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

export default function PredictionChart({
  homeWin,
  draw,
  awayWin,
  homeTeam,
  awayTeam,
  confidence,
  variant = "both",
}: PredictionChartProps) {
  const barData = useMemo(
    () => [
      { name: `ניצחון ${homeTeam}`, value: homeWin, color: COLORS.home },
      { name: "תיקו", value: draw, color: COLORS.draw },
      { name: `ניצחון ${awayTeam}`, value: awayWin, color: COLORS.away },
    ],
    [homeWin, draw, awayWin, homeTeam, awayTeam]
  );

  const pieData = useMemo(
    () => [
      { name: "בית", value: homeWin, color: COLORS.home },
      { name: "תיקו", value: draw, color: COLORS.draw },
      { name: "חוץ", value: awayWin, color: COLORS.away },
    ],
    [homeWin, draw, awayWin]
  );

  // Determine the predicted outcome
  const predictedOutcome = useMemo(() => {
    if (homeWin >= draw && homeWin >= awayWin) return { label: `ניצחון ${homeTeam}`, color: COLORS.home, value: homeWin };
    if (draw >= homeWin && draw >= awayWin) return { label: "תיקו", color: COLORS.draw, value: draw };
    return { label: `ניצחון ${awayTeam}`, color: COLORS.away, value: awayWin };
  }, [homeWin, draw, awayWin, homeTeam, awayTeam]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="w-full"
    >
      {/* Confidence Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">רמת ביטחון:</span>
          <div className="flex items-center gap-1">
            <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: confidence > 70 ? COLORS.home : confidence > 50 ? COLORS.draw : COLORS.away }}
                initial={{ width: 0 }}
                animate={{ width: `${confidence}%` }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              />
            </div>
            <span className="text-xs font-bold text-accent">{confidence}%</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">תחזוקה:</span>
          <span className="text-xs font-bold" style={{ color: predictedOutcome.color }}>
            {predictedOutcome.label}
          </span>
        </div>
      </div>

      {/* Probability Bars - Always shown */}
      <div className="space-y-2 mb-4">
        {barData.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="flex items-center gap-3"
          >
            <span className="text-xs text-muted-foreground w-24 text-left truncate">{item.name}</span>
            <div className="flex-1 h-6 bg-muted/50 rounded-full overflow-hidden relative">
              <motion.div
                className="h-full rounded-full flex items-center justify-end px-2"
                style={{ backgroundColor: item.color }}
                initial={{ width: 0 }}
                animate={{ width: `${item.value}%` }}
                transition={{ duration: 0.8, delay: 0.2 + index * 0.15, ease: [0.23, 1, 0.32, 1] }}
              >
                <span className="text-xs font-bold text-background">{item.value}%</span>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className={`grid gap-4 ${variant === "both" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
        {/* Bar Chart */}
        {(variant === "bar" || variant === "both") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="bg-muted/20 rounded-lg p-3"
          >
            <p className="text-xs text-muted-foreground mb-2 text-center">גרף עמודות</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} animationDuration={1200} animationEasing="ease-out">
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Pie Chart */}
        {(variant === "pie" || variant === "both") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="bg-muted/20 rounded-lg p-3"
          >
            <p className="text-xs text-muted-foreground mb-2 text-center">חלוקת הסתברויות</p>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={55}
                  paddingAngle={3}
                  dataKey="value"
                  animationDuration={1200}
                  animationEasing="ease-out"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value: string) => (
                    <span className="text-xs text-muted-foreground">{value}</span>
                  )}
                  iconSize={8}
                  wrapperStyle={{ fontSize: "10px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
