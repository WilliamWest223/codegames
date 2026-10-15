import { useEffect, useRef, useState } from 'react';
import { playXpTick, playVictory } from '../../lib/soundFx';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  alpha: number;
  type: 'spark' | 'chip' | 'beam';
}

export function ParticleBurstCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = 480;
    const height = 300;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = '100%';
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const colors = ['#F59E0B', '#10B981', '#3B82F6', '#A78BFA', '#FFFFFF'];
    const particles: Particle[] = [];

    // Origin near top center
    const originX = width / 2;
    const originY = 80;

    for (let i = 0; i < 48; i++) {
      const angle = (Math.random() * Math.PI) + Math.PI; // upward spray
      const speed = 4 + Math.random() * 8;
      const typeRand = Math.random();
      const type: 'spark' | 'chip' | 'beam' = typeRand > 0.6 ? 'chip' : typeRand > 0.3 ? 'spark' : 'beam';

      particles.push({
        x: originX + (Math.random() * 20 - 10),
        y: originY + (Math.random() * 10 - 5),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: type === 'chip' ? 4 + Math.random() * 3 : 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)] ?? '#F59E0B',
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        alpha: 1,
        type,
      });
    }

    const gravity = 0.22;
    const drag = 0.98;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      let alive = 0;

      particles.forEach((p) => {
        p.vx *= drag;
        p.vy *= drag;
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;
        p.alpha -= 0.009;

        if (p.alpha <= 0) return;
        alive++;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.type === 'chip') {
          // Hexagonal/rectangular silicon chip
          ctx.fillRect(-p.size, -p.size / 2, p.size * 2, p.size);
        } else if (p.type === 'beam') {
          // High speed streak
          ctx.fillRect(-p.size * 2, -0.75, p.size * 4, 1.5);
        } else {
          // Spark diamond
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size, 0);
          ctx.lineTo(0, p.size);
          ctx.lineTo(-p.size, 0);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      });

      if (alive > 0) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-burst-canvas" aria-hidden="true" />;
}

/** Mechanical rolling odometer for XP celebration with click ticks */
export function RollingOdometer({ targetXp }: { targetXp: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (targetXp <= 0) return;
    let step = 0;
    const steps = 15;
    const interval = 40;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const val = Math.round(targetXp * progress);
      setCurrent(val);
      playXpTick();

      if (step >= steps) {
        clearInterval(timer);
        setCurrent(targetXp);
        playVictory();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [targetXp]);

  return <span className="modal-xp-odometer">+{current} XP</span>;
}
