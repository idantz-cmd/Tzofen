import type { CSSProperties } from "react";

interface Props {
  size?: number;
  className?: string;
  style?: CSSProperties;
  rich?: boolean;
}

// ── Classic heraldic shield — 3 upward points at the top ─────────────────────
//
//  Top profile (left→right):
//    corner-peak(20,11) ← dip ← center-peak(50,5) → dip → corner-peak(80,11)
//
//  • Q (quadratic bezier) for the gentle dips between the peaks
//  • L (straight line) for the sides — prevents the heart-curve
//  • C (cubic bezier) only for the bottom half taper to the point
//
//  3 peak topology:
//    (50,5)  center peak  ↑ points UP
//    (20,11) left corner  ↑ subtle upward point where Q meets L
//    (80,11) right corner ↑ symmetric
//
const SHIELD =
  "M50,5 Q36,16 20,11 L5,42 C5,62 22,82 50,97 C78,82 95,62 95,42 L80,11 Q64,16 50,5 Z";

// Inner white body (≈8 unit inset, same 3-peak structure)
const BODY =
  "M50,13 Q38,23 24,18 L14,44 C14,62 28,77 50,90 C72,77 86,62 86,44 L76,18 Q62,23 50,13 Z";

// Banner = top dome of inner body, closed by horizontal at y=44
const BANNER =
  "M14,44 L24,18 Q38,23 50,13 Q62,23 76,18 L86,44 Z";

export function TzofenLogo({ size = 36, className, style, rich }: Props) {
  const detailed = rich ?? size >= 64;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <defs>
        <clipPath id="tz-sc">
          <path d={SHIELD} />
        </clipPath>
        <filter id="tz-sh" x="-12%" y="-8%" width="124%" height="126%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#0A1F50" floodOpacity="0.5" />
        </filter>
        <pattern id="tz-net" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="#0A2F7A" />
          <line x1="0" y1="0" x2="4" y2="0" stroke="rgba(255,255,255,0.50)" strokeWidth="0.5" />
          <line x1="0" y1="0" x2="0" y2="4" stroke="rgba(255,255,255,0.50)" strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* Shadow */}
      <path d={SHIELD} fill="#0A2060" filter="url(#tz-sh)" />

      <g clipPath="url(#tz-sc)">

        {/* Navy base */}
        <path d={SHIELD} fill="#0D2860" />

        {/* White inner body */}
        <path d={BODY} fill="white" />

        {/* Navy banner dome */}
        <path d={BANNER} fill="#0D2860" />

        {/* Blue accent border */}
        <path d={BODY} fill="none" stroke="#3CB0F0" strokeWidth="2.5" />

        {/* Banner separator */}
        <line x1="14" y1="44" x2="86" y2="44" stroke="#3CB0F0" strokeWidth="0.8" />

        {/* "צופן" */}
        <text
          x="50" y="34"
          textAnchor="middle" dominantBaseline="central"
          fontSize="12" fontWeight="900"
          fontFamily="'Rubik', Arial, sans-serif"
          fill="white" letterSpacing="2"
        >צופן</text>

        {/* ── Clock on goal-net ── */}
        <circle cx="50" cy="58" r="12" fill="#0A2F7A" />
        {detailed && <circle cx="50" cy="58" r="12" fill="url(#tz-net)" />}
        <circle cx="50" cy="58" r="10.5"
                fill="rgba(255,255,255,0.07)" stroke="white" strokeWidth="1.3" />

        {/* Hour markers */}
        <line x1="50"  y1="47.5" x2="50"  y2="49"  stroke="white" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="59.5" y1="58"  x2="58"  y2="58"  stroke="white" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="50"  y1="68.5" x2="50"  y2="67"  stroke="white" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="40.5" y1="58"  x2="42"  y2="58"  stroke="white" strokeWidth="1.3" strokeLinecap="round" />

        {/* Hands 10:10 */}
        <line x1="50" y1="58" x2="44.2" y2="54.6"
              stroke="white" strokeWidth="2.3" strokeLinecap="round" />
        <line x1="50" y1="58" x2="57.4" y2="53.6"
              stroke="white" strokeWidth="1.8" strokeLinecap="round" />

        {/* Pivot */}
        <circle cx="50" cy="58" r="1.7" fill="#0D2860" stroke="white" strokeWidth="0.7" />

        {/* Emblem ring */}
        <circle cx="50" cy="58" r="12" fill="none" stroke="#0D2860" strokeWidth="0.9" />

        {/* ── Tagline ── */}
        {detailed && (
          <>
            <line x1="22" y1="73" x2="78" y2="73" stroke="#CBD5E8" strokeWidth="0.6" />
            <text
              x="50" y="77.5"
              textAnchor="middle" dominantBaseline="central"
              fontSize="6" fontWeight="700"
              fontFamily="'Rubik', Arial, sans-serif"
              fill="#0D2860" letterSpacing="0.1"
            >תפסיק לנחש</text>
            <text
              x="50" y="83.5"
              textAnchor="middle" dominantBaseline="central"
              fontSize="5" fontWeight="700"
              fontFamily="'Rubik', Arial, sans-serif"
              fill="#0D2860" letterSpacing="0.1"
            >תתחיל לנצח</text>
          </>
        )}

      </g>

      {/* Outer border */}
      <path d={SHIELD} fill="none" stroke="#0A1F50" strokeWidth="2.5" />
    </svg>
  );
}
