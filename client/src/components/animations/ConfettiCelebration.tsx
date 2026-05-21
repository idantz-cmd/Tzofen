import { useEffect } from "react";
import confetti from "canvas-confetti";

export function ConfettiCelebration({ trigger }: { trigger: boolean }) {
  useEffect(() => {
    if (!trigger) return;

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#003DA5", "#FFFFFF", "#FFD700", "#0038b8"],
    });

    const t1 = setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#003DA5", "#FFD700", "#FFFFFF"],
      });
    }, 250);

    const t2 = setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#003DA5", "#FFD700", "#FFFFFF"],
      });
    }, 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [trigger]);

  return null;
}
