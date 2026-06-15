import { useCategory, type CategoryKey } from "@/contexts/CategoryContext";

const CATEGORY_CONFIG: Record<CategoryKey, { color: string; tint: string }> = {
  home:        { color: "#1F6BFF", tint: "#EEF3FF" },
  matches:     { color: "#13CE66", tint: "#EAFBF1" },
  ai:          { color: "#8B4DFF", tint: "#F3EDFF" },
  cup:         { color: "#FFC91F", tint: "#FFF8E6" },
  leaderboard: { color: "#FF3B5C", tint: "#FFEEF1" },
  profile:     { color: "#1F6BFF", tint: "#EEF3FF" },
  news:        { color: "#3A4A66", tint: "#EEF1F6" },
};

export function CategoryBackground() {
  const { category } = useCategory();
  const { color, tint } = CATEGORY_CONFIG[category];

  const baseStyle: React.CSSProperties = {
    position: "fixed",
    inset: "-40%",
    pointerEvents: "none",
    zIndex: -1,
    borderRadius: "50%",
    transition: "background 0.8s ease, opacity 0.8s ease",
    willChange: "transform",
  };

  return (
    <>
      {/* Root background tint */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -2,
          background: tint,
          transition: "background 0.8s ease",
          pointerEvents: "none",
        }}
      />

      {/* Orb 1 — top-left */}
      <div
        aria-hidden="true"
        className="category-orb-1"
        style={{
          ...baseStyle,
          background: `radial-gradient(ellipse 58% 52% at 22% 18%, ${color}28 0%, ${color}14 42%, ${color}08 65%, transparent 80%)`,
          animation: "mesh-drift-1 20s ease-in-out infinite",
        }}
      />

      {/* Orb 2 — bottom-right */}
      <div
        aria-hidden="true"
        className="category-orb-2"
        style={{
          ...baseStyle,
          background: `radial-gradient(ellipse 52% 48% at 82% 76%, ${color}22 0%, ${color}10 42%, ${color}06 65%, transparent 80%)`,
          animation: "mesh-drift-2 24s ease-in-out infinite",
        }}
      />

      {/* Orb 3 — center */}
      <div
        aria-hidden="true"
        className="category-orb-3"
        style={{
          ...baseStyle,
          background: `radial-gradient(ellipse 40% 36% at 58% 42%, ${color}18 0%, ${color}0A 42%, transparent 68%)`,
          animation: "mesh-drift-3 28s ease-in-out infinite",
        }}
      />
    </>
  );
}
