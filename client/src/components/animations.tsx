/**
 * animations.tsx
 *
 * Reusable Framer Motion animation components for the Israeli football
 * predictions app. All animations are RTL-aware and use OKLCH palette tokens.
 *
 * Import what you need:
 *   import { FlipMatchCard, ScoreCounter, PredictionLock, ... } from '@/components/animations'
 */

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
  useAnimate,
  stagger,
} from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

// ─────────────────────────────────────────────────────────────
// 1. FLIP MATCH CARD
//    A match card that flips on click to reveal the result.
//    Front: team logos + prediction UI. Back: final score + points earned.
//    Applies to: /matches, /home match cards
// ─────────────────────────────────────────────────────────────

interface FlipMatchCardProps {
  front: React.ReactNode
  back: React.ReactNode
  className?: string
}

export function FlipMatchCard({ front, back, className = '' }: FlipMatchCardProps) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      className={`relative cursor-pointer ${className}`}
      style={{ perspective: '1000px' }}
      onClick={() => setFlipped(f => !f)}
    >
      <motion.div
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        className="relative w-full h-full"
      >
        {/* Front face */}
        <div
          className="card-glass absolute inset-0 p-4"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {front}
        </div>
        {/* Back face */}
        <div
          className="card-glass absolute inset-0 p-4"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 2. SCORE COUNTER
//    Animated rolling number — each digit ticks up like an
//    old scoreboard. Used for live scores and leaderboard points.
//    Applies to: score displays, leaderboard points column
// ─────────────────────────────────────────────────────────────

interface ScoreCounterProps {
  value: number
  duration?: number
  className?: string
}

export function ScoreCounter({ value, duration = 1.2, className = '' }: ScoreCounterProps) {
  const [display, setDisplay] = useState(0)
  const spring = useSpring(0, { stiffness: 80, damping: 20 })

  useEffect(() => {
    spring.set(value)
  }, [value, spring])

  useEffect(() => {
    return spring.on('change', v => setDisplay(Math.round(v)))
  }, [spring])

  return (
    <motion.span
      key={value}
      className={`tabular-nums text-glow-amber ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {display}
    </motion.span>
  )
}

// ─────────────────────────────────────────────────────────────
// 3. PREDICTION LOCK
//    When a user submits a prediction, the button swells, turns
//    amber-gold, emits a radial pulse, and shows a lock icon.
//    A shimmer sweeps across. Conveys "locked in."
//    Applies to: prediction-btn on /matches
// ─────────────────────────────────────────────────────────────

interface PredictionLockProps {
  children: React.ReactNode
  locked?: boolean
  onLock?: () => void
  className?: string
}

export function PredictionLock({
  children,
  locked = false,
  onLock,
  className = '',
}: PredictionLockProps) {
  return (
    <motion.button
      className={`prediction-btn relative overflow-hidden ${className} ${
        locked ? 'prediction-locked' : ''
      }`}
      onClick={onLock}
      whileTap={{ scale: 0.95 }}
      animate={
        locked
          ? { scale: [1, 1.08, 1], transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] } }
          : { scale: 1 }
      }
    >
      {/* Radial pulse on lock */}
      <AnimatePresence>
        {locked && (
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-lg"
            initial={{ opacity: 0.6, scale: 0.8 }}
            animate={{ opacity: 0, scale: 1.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              background:
                'radial-gradient(circle, rgba(255,201,31,0.40) 0%, transparent 70%)',
            }}
          />
        )}
      </AnimatePresence>
      {children}
    </motion.button>
  )
}

// ─────────────────────────────────────────────────────────────
// 4. STAGGERED LIST REVEAL
//    Children slide up and fade in with a stagger delay.
//    Creates the feeling of a leaderboard being "dealt" to you.
//    Applies to: /leaderboard rows, match list, dashboard cards
// ─────────────────────────────────────────────────────────────

interface StaggerListProps {
  children: React.ReactNode[]
  staggerDelay?: number
  className?: string
}

export function StaggerList({ children, staggerDelay = 0.07, className = '' }: StaggerListProps) {
  return (
    <motion.ul
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: staggerDelay } },
        hidden: {},
      }}
    >
      {children.map((child, i) => (
        <motion.li
          key={i}
          variants={{
            hidden:  { opacity: 0, y: 18 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
          }}
        >
          {child}
        </motion.li>
      ))}
    </motion.ul>
  )
}

// ─────────────────────────────────────────────────────────────
// 5. MORPHING RESULT BADGE
//    After match result is known the badge morphs: background
//    color transitions, border-radius liquifies, scale pulses.
//    "Win" → amber glow, "Draw" → silver, "Loss" → red fade.
//    Applies to: result badges on /dashboard, /leaderboard
// ─────────────────────────────────────────────────────────────

type ResultType = 'win' | 'draw' | 'loss' | 'pending'

const resultStyles: Record<ResultType, { bg: string; border: string; text: string; glow: string }> = {
  win:     { bg: 'rgba(255,201,31,0.20)',  border: 'rgba(255,201,31,0.55)', text: '#B38900',  glow: '0 0 14px rgba(255,201,31,0.45)' },
  draw:    { bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.35)', text: '#94A3B8', glow: 'none' },
  loss:    { bg: 'rgba(255,59,92,0.18)',   border: 'rgba(255,59,92,0.45)',  text: '#CC1F45',  glow: '0 0 10px rgba(255,59,92,0.35)' },
  pending: { bg: 'rgba(31,107,255,0.15)',  border: 'rgba(31,107,255,0.30)', text: '#6B8FCC',  glow: 'none' },
}

interface MorphingResultBadgeProps {
  result: ResultType
  label: string
}

export function MorphingResultBadge({ result, label }: MorphingResultBadgeProps) {
  const s = resultStyles[result]

  return (
    <motion.span
      layout
      animate={{
        backgroundColor: s.bg,
        borderColor: s.border,
        color: s.text,
        boxShadow: s.glow,
        borderRadius: result === 'win' ? '999px' : '8px',
      }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.75rem',
        fontSize: '0.75rem',
        fontWeight: 700,
        border: '1px solid',
      }}
    >
      {label}
    </motion.span>
  )
}

// ─────────────────────────────────────────────────────────────
// 6. TILT CARD (3D magnetic hover)
//    Card tilts in 3D following the cursor, with a specular
//    highlight that moves across the glass surface. Feels like
//    holding a physical card under light.
//    Applies to: featured match cards, top-3 leaderboard cards
// ─────────────────────────────────────────────────────────────

interface TiltCardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  maxTilt?: number
}

export function TiltCard({ children, className = '', style, maxTilt = 12 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]), { stiffness: 300, damping: 30 })

  // Specular highlight position
  const highlightX = useTransform(x, [-0.5, 0.5], ['0%', '100%'])
  const highlightY = useTransform(y, [-0.5, 0.5], ['0%', '100%'])

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top)  / rect.height - 0.5)
  }

  function handleMouseLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={`card-glass relative overflow-hidden ${className}`}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }}
      transition={{ scale: { duration: 0.2 } }}
    >
      {/* Moving specular highlight */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background: useTransform(
            [highlightX, highlightY],
            ([hx, hy]) =>
              `radial-gradient(circle 120px at ${hx} ${hy}, rgba(255,255,255,0.12), transparent 70%)`,
          ),
        }}
      />
      <div style={{ transform: 'translateZ(20px)' }}>{children}</div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// 7. PAGE TRANSITION WRAPPER
//    Smooth fade + upward slide for route changes.
//    Applies to: wrap every page component's root element
// ─────────────────────────────────────────────────────────────

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// 8. PARTICLE BURST (celebration)
//    On a correct prediction reveal, small particles burst
//    outward radially from the element center — amber & blue
//    dots that arc, shrink, and fade. Pure CSS-free delight.
//    Applies to: correct prediction result reveal on /dashboard
// ─────────────────────────────────────────────────────────────

const PARTICLE_COUNT = 12

export function ParticleBurst({ trigger }: { trigger: boolean }) {
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => i)
  const angle = (i: number) => (360 / PARTICLE_COUNT) * i

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      <AnimatePresence>
        {trigger &&
          particles.map(i => {
            const deg = angle(i)
            const rad = (deg * Math.PI) / 180
            const dist = 55 + Math.random() * 30
            const isAmber = i % 3 === 0

            return (
              <motion.span
                key={`${i}-${trigger}`}
                className="absolute"
                style={{
                  top: '50%',
                  left: '50%',
                  width: isAmber ? 6 : 4,
                  height: isAmber ? 6 : 4,
                  borderRadius: '50%',
                  background: isAmber
                    ? '#FFC91F'
                    : '#4D8FFF',
                  boxShadow: isAmber
                    ? '0 0 6px rgba(255,201,31,0.80)'
                    : '0 0 5px rgba(31,107,255,0.70)',
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos(rad) * dist,
                  y: Math.sin(rad) * dist,
                  opacity: 0,
                  scale: 0.3,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: [0.2, 0.8, 0.4, 1], delay: i * 0.02 }}
              />
            )
          })}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 9. LIQUID COUNTDOWN RING
//    SVG circle stroke that depletes as match kickoff nears.
//    Stroke is a gradient from amber to blue. Pulses last 60s.
//    Applies to: match cards showing time-to-kickoff
// ─────────────────────────────────────────────────────────────

interface CountdownRingProps {
  totalSeconds: number
  remainingSeconds: number
  size?: number
  strokeWidth?: number
}

export function CountdownRing({
  totalSeconds,
  remainingSeconds,
  size = 52,
  strokeWidth = 4,
}: CountdownRingProps) {
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const progress = remainingSeconds / totalSeconds
  const dashOffset = circumference * (1 - progress)
  const isUrgent = remainingSeconds < 60

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#1F6BFF" />
            <stop offset="100%" stopColor="#FFC91F" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="#1A2A4A" strokeWidth={strokeWidth} />
        {/* Progress */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="url(#ring-gradient)" strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </svg>
      {/* Center time label */}
      <div
        className={`absolute inset-0 flex items-center justify-center tabular-nums font-bold text-xs ${
          isUrgent ? 'text-glow-amber animate-pulse-glow' : 'text-glow-blue'
        }`}
        dir="ltr"
      >
        {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 10. HERO TITLE REVEAL
//     The page title for /home slides in character by character
//     (word-level for Hebrew to avoid bidi issues). Each word
//     drops in from above with a slight bounce and metallic glow.
//     Applies to: Home page hero, Login welcome message
// ─────────────────────────────────────────────────────────────

interface HeroTitleRevealProps {
  words: string[]
  className?: string
}

export function HeroTitleReveal({ words, className = '' }: HeroTitleRevealProps) {
  return (
    <motion.h1
      className={`flex flex-wrap gap-x-3 gap-y-1 justify-center ${className}`}
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="text-gradient-blue inline-block"
          variants={{
            hidden:  { opacity: 0, y: -28, filter: 'blur(6px)' },
            visible: {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              transition: { duration: 0.55, ease: [0.34, 1.56, 0.64, 1] },
            },
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.h1>
  )
}
