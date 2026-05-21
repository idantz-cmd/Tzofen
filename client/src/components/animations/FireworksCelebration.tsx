import { useEffect } from "react";
import confetti from "canvas-confetti";

export function FireworksCelebration({ trigger }: { trigger: boolean }) {
  useEffect(() => {
    if (!trigger) return;

    const end = Date.now() + 3000;
    let rafId: number;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#FFD700", "#FF6B35", "#ffffff"],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#003DA5", "#00A651", "#ffffff"],
      });
      if (Date.now() < end) {
        rafId = requestAnimationFrame(frame);
      }
    };
    rafId = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(rafId);
  }, [trigger]);

  return null;
}
