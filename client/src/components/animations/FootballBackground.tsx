/**
 * Realistic aerial stadium view
 * - Proper green pitch with alternating stripes
 * - Full pitch markings (center circle, penalty areas, corner arcs, goals)
 * - 22 players (Israel blue vs red away) moving in 4-4-2 formations
 * - Ball passing simulation between teammates
 * - Stadium atmosphere with floodlight glow
 */
import { useEffect, useRef } from "react";

export function FootballBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;

    let raf: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    function getPitch() {
      const mh = canvas.height * 0.09;
      const mw = canvas.width * 0.06;
      return {
        px: mw,
        py: mh,
        pw: canvas.width - mw * 2,
        ph: canvas.height - mh * 2,
      };
    }

    function drawGrass() {
      const { px, py, pw, ph } = getPitch();
      const stripes = 12;
      const sw = pw / stripes;
      for (let i = 0; i < stripes; i++) {
        ctx.fillStyle = i % 2 === 0 ? "#1a6b1a" : "#1d7a1d";
        ctx.fillRect(px + i * sw, py, sw, ph);
      }
    }

    function drawMarkings() {
      const { px, py, pw, ph } = getPitch();
      const lw = Math.max(1.5, pw * 0.003);
      ctx.strokeStyle = "rgba(255,255,255,0.80)";
      ctx.fillStyle = "rgba(255,255,255,0.80)";
      ctx.lineWidth = lw;
      ctx.lineCap = "round";

      // Pitch border
      ctx.strokeRect(px, py, pw, ph);

      // Halfway line
      ctx.beginPath();
      ctx.moveTo(px + pw / 2, py);
      ctx.lineTo(px + pw / 2, py + ph);
      ctx.stroke();

      // Center circle
      const cr = ph * 0.145;
      ctx.beginPath();
      ctx.arc(px + pw / 2, py + ph / 2, cr, 0, Math.PI * 2);
      ctx.stroke();

      // Center spot
      ctx.beginPath();
      ctx.arc(px + pw / 2, py + ph / 2, lw * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Penalty & goal areas — both ends
      const paW = pw * 0.155;
      const paH = ph * 0.385;
      const gaW = pw * 0.055;
      const gaH = ph * 0.175;
      const spotX = pw * 0.115; // from each end line
      const goalH = ph * 0.115;
      const goalD = pw * 0.010;

      for (const side of [0, 1]) {
        const x0 = side === 0 ? px : px + pw - paW;
        const flip = side === 1;

        // Penalty area
        ctx.strokeRect(x0, py + (ph - paH) / 2, paW, paH);
        // Goal area
        const gx0 = side === 0 ? px : px + pw - gaW;
        ctx.strokeRect(gx0, py + (ph - gaH) / 2, gaW, gaH);

        // Penalty spot
        const spx = side === 0 ? px + spotX : px + pw - spotX;
        ctx.beginPath();
        ctx.arc(spx, py + ph / 2, lw * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Penalty arc (outside penalty box)
        ctx.beginPath();
        const arcStart = flip ? Math.PI * 0.60 : -Math.PI * 0.40;
        const arcEnd = flip ? Math.PI * 1.40 : Math.PI * 0.40;
        ctx.arc(spx, py + ph / 2, cr, arcStart, arcEnd);
        ctx.stroke();

        // Goal posts
        const gpx = side === 0 ? px - goalD : px + pw;
        ctx.strokeRect(gpx, py + (ph - goalH) / 2, goalD, goalH);
      }

      // Corner arcs
      const cornerR = ph * 0.028;
      const corners: [number, number, number, number][] = [
        [px, py, 0, Math.PI / 2],
        [px + pw, py, Math.PI / 2, Math.PI],
        [px, py + ph, -Math.PI / 2, 0],
        [px + pw, py + ph, Math.PI, 3 * Math.PI / 2],
      ];
      for (const [cx, cy, sa, ea] of corners) {
        ctx.beginPath();
        ctx.arc(cx, cy, cornerR, sa, ea);
        ctx.stroke();
      }
    }

    // Formation positions (normalized 0–1 across full pitch width and height)
    // Home team (Israel, blue): plays left→right
    const homeBase = [
      { x: 0.05, y: 0.50 }, // GK
      { x: 0.20, y: 0.18 }, { x: 0.20, y: 0.38 }, { x: 0.20, y: 0.62 }, { x: 0.20, y: 0.82 }, // DEF
      { x: 0.38, y: 0.22 }, { x: 0.38, y: 0.42 }, { x: 0.38, y: 0.58 }, { x: 0.38, y: 0.78 }, // MID
      { x: 0.52, y: 0.36 }, { x: 0.52, y: 0.64 }, // FWD
    ];
    // Away team (red): mirrored
    const awayBase = homeBase.map(p => ({ x: 1 - p.x, y: p.y }));

    interface Player {
      bx: number; by: number;
      x: number; y: number;
      vx: number; vy: number;
      team: 0 | 1;
      hasBall: boolean;
    }

    const players: Player[] = [
      ...homeBase.map((p, i) => ({
        bx: p.x, by: p.y, x: p.x, y: p.y, vx: 0, vy: 0,
        team: 0 as const, hasBall: i === 10,
      })),
      ...awayBase.map(p => ({
        bx: p.x, by: p.y, x: p.x, y: p.y, vx: 0, vy: 0,
        team: 1 as const, hasBall: false,
      })),
    ];

    const ball = {
      x: homeBase[10].x,
      y: homeBase[10].y,
      vx: 0, vy: 0,
      target: -1,
      cooldown: 0,
      inFlight: false,
      spin: 0,
    };

    let simTime = 0;
    const DT = 1 / 60;

    function simulate() {
      simTime += DT;
      ball.cooldown -= DT;
      ball.spin += 0.18;

      const holderIdx = players.findIndex(p => p.hasBall);

      // Move players around their base positions
      for (let i = 0; i < players.length; i++) {
        const p = players[i];
        const tx = p.bx + Math.sin(simTime * 0.38 + i * 1.9) * 0.042;
        const ty = p.by + Math.cos(simTime * 0.32 + i * 2.3) * 0.036;
        const spd = p.hasBall ? 0.10 : 0.05;
        p.vx += (tx - p.x) * spd;
        p.vy += (ty - p.y) * spd;
        p.vx *= 0.82; p.vy *= 0.82;
        p.x = Math.max(0.01, Math.min(0.99, p.x + p.vx));
        p.y = Math.max(0.01, Math.min(0.99, p.y + p.vy));
      }

      if (holderIdx >= 0) {
        const holder = players[holderIdx];
        ball.x = holder.x;
        ball.y = holder.y;
        ball.vx = 0; ball.vy = 0;

        if (ball.cooldown <= 0) {
          const teammates = players
            .map((p, i) => ({ p, i }))
            .filter(({ p, i }) => i !== holderIdx && p.team === holder.team);
          if (teammates.length > 0) {
            const { p: tgt, i: tgtIdx } =
              teammates[Math.floor(Math.random() * teammates.length)];
            const dx = tgt.x - holder.x;
            const dy = tgt.y - holder.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const spd = 0.012 + dist * 0.09;
            ball.vx = (dx / dist) * spd;
            ball.vy = (dy / dist) * spd;
            ball.target = tgtIdx;
            ball.inFlight = true;
            holder.hasBall = false;
            ball.cooldown = 2.2 + Math.random() * 2.2;
          }
        }
      } else if (ball.inFlight) {
        ball.vx *= 0.975;
        ball.vy *= 0.975;
        ball.x = Math.max(0.01, Math.min(0.99, ball.x + ball.vx));
        ball.y = Math.max(0.01, Math.min(0.99, ball.y + ball.vy));

        if (ball.x <= 0.01 || ball.x >= 0.99) ball.vx *= -0.6;
        if (ball.y <= 0.01 || ball.y >= 0.99) ball.vy *= -0.6;

        if (ball.target >= 0) {
          const tgt = players[ball.target];
          const dx = ball.x - tgt.x, dy = ball.y - tgt.y;
          if (Math.sqrt(dx * dx + dy * dy) < 0.028) {
            tgt.hasBall = true;
            ball.inFlight = false;
            ball.vx = 0; ball.vy = 0;
            ball.target = -1;
            ball.cooldown = 1.8 + Math.random() * 2.0;
          }
        }

        // Lose possession if nobody catches it (ball slows to stop)
        if (Math.abs(ball.vx) < 0.0003 && Math.abs(ball.vy) < 0.0003 && ball.target < 0) {
          ball.inFlight = false;
        }
      }
    }

    function drawPlayers() {
      const { px, py, pw, ph } = getPitch();
      const r = Math.max(5, pw * 0.017);

      for (const p of players) {
        const sx = px + p.x * pw;
        const sy = py + p.y * ph;

        // Shadow
        ctx.save();
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.ellipse(sx + r * 0.2, sy + r * 0.65, r * 0.68, r * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Kit gradient
        ctx.save();
        const g = ctx.createRadialGradient(sx - r * 0.3, sy - r * 0.3, 0, sx, sy, r);
        if (p.team === 0) {
          g.addColorStop(0, "#5ba3e8");
          g.addColorStop(1, "#1a3f8a");
        } else {
          g.addColorStop(0, "#f06060");
          g.addColorStop(1, "#8a1a1a");
        }
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();

        // White rim
        ctx.strokeStyle = "rgba(255,255,255,0.72)";
        ctx.lineWidth = r * 0.14;
        ctx.stroke();

        // Dot for hasBall
        if (p.hasBall) {
          ctx.fillStyle = "rgba(255,230,0,0.9)";
          ctx.beginPath();
          ctx.arc(sx, sy - r - r * 0.35, r * 0.28, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    function drawBall() {
      const { px, py, pw } = getPitch();
      const sx = px + ball.x * pw;
      const sy = getPitch().py + ball.y * getPitch().ph;
      const r = Math.max(3.5, pw * 0.013);
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);

      // Shadow (offset in direction of motion when fast)
      ctx.save();
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(sx + r * 0.28, sy + r * 0.52, r * 0.65, r * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Motion blur trail
      if (speed > 0.003) {
        const nx = ball.vx / speed, ny = ball.vy / speed;
        for (let i = 4; i >= 1; i--) {
          const { px: ppx, py: ppy, pw: ppw, ph: pph } = getPitch();
          const tx = sx - nx * i * r * 2.2;
          const ty = sy - ny * i * r * 2.2;
          ctx.save();
          ctx.globalAlpha = 0.08 * (1 - i / 5);
          ctx.fillStyle = "#e0e0e0";
          ctx.beginPath();
          ctx.arc(tx, ty, r * (1 - i * 0.12), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Ball body
      ctx.save();
      const bg = ctx.createRadialGradient(sx - r * 0.32, sy - r * 0.32, 0, sx, sy, r);
      bg.addColorStop(0, "#ffffff");
      bg.addColorStop(0.55, "#e4e4e4");
      bg.addColorStop(1, "#989898");
      ctx.fillStyle = bg;
      ctx.shadowBlur = r * 1.8;
      ctx.shadowColor = "rgba(255,255,255,0.55)";
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();

      // Pentagon patches (rotated with spin)
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(25,25,25,0.82)";
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(ball.spin);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.21, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r * 0.52, Math.sin(a) * r * 0.52, r * 0.19, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Specular highlight
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath();
      ctx.arc(sx - r * 0.32, sy - r * 0.32, r * 0.22, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    function drawAtmosphere() {
      const { px, py, pw, ph } = getPitch();

      // Vignette around pitch edges (simulate stands darkness)
      const vg = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, Math.min(pw, ph) * 0.48,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.72,
      );
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(0.55, "rgba(2,5,2,0.45)");
      vg.addColorStop(1, "rgba(0,0,0,0.97)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Floodlight cones from 4 corners
      for (const [lx, ly] of [
        [0.04, 0.04], [0.96, 0.04], [0.04, 0.96], [0.96, 0.96],
      ] as [number, number][]) {
        const cx = canvas.width * lx, cy = canvas.height * ly;
        const lg = ctx.createRadialGradient(cx, cy, 0, cx, cy, canvas.width * 0.42);
        lg.addColorStop(0, "rgba(255,248,210,0.045)");
        lg.addColorStop(0.5, "rgba(255,248,210,0.012)");
        lg.addColorStop(1, "rgba(255,248,210,0)");
        ctx.fillStyle = lg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Pitch glow (green ambient bounce light)
      const pg = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.min(pw, ph) * 0.56,
      );
      pg.addColorStop(0, "rgba(20,80,20,0.06)");
      pg.addColorStop(1, "rgba(20,80,20,0)");
      ctx.fillStyle = pg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dark stadium base
      ctx.fillStyle = "#04090a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      simulate();

      drawGrass();
      drawMarkings();
      drawPlayers();
      drawBall();
      drawAtmosphere();

      raf = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: 0.72 }}
      aria-hidden="true"
    />
  );
}
