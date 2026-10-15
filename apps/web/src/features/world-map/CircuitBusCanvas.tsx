import { useEffect, useRef } from 'react';
import type { PlayableLanguage } from '@codegames/shared';

interface Props {
  language: PlayableLanguage;
}

interface Packet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  progress: number;
  speed: number;
  pathIndex: number;
  alpha: number;
}

interface TracePath {
  points: { x: number; y: number }[];
}

export function CircuitBusCanvas({ language }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Accent color based on language
    const traceColor = language === 'python' ? '#3B82F6' : language === 'cybersecurity' ? '#EF4444' : '#F59E0B';
    const packetGlow = language === 'python' ? 'rgba(59, 130, 246, 0.8)' : language === 'cybersecurity' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(245, 158, 11, 0.8)';

    let paths: TracePath[] = [];
    let packets: Packet[] = [];

    const generateTraces = () => {
      paths = [];
      const numLines = Math.floor(width / 180) + 4;
      const stepX = width / numLines;

      for (let i = 0; i < numLines; i++) {
        const startX = i * stepX + (Math.random() * 40 - 20);
        let currX = startX;
        let currY = 0;
        const points = [{ x: currX, y: currY }];

        while (currY < height) {
          const segY = Math.random() * 120 + 80;
          currY += segY;
          // Step 45 degree or 90 degree circuit bend
          if (Math.random() > 0.4) {
            const bendX = currX + (Math.random() > 0.5 ? 40 : -40);
            points.push({ x: bendX, y: currY - 30 });
            currX = bendX;
          }
          points.push({ x: currX, y: Math.min(currY, height) });
        }
        paths.push({ points });
      }

      // Populate packets
      packets = [];
      for (let i = 0; i < 24; i++) {
        const pathIndex = Math.floor(Math.random() * paths.length);
        packets.push({
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          progress: Math.random(),
          speed: 0.0015 + Math.random() * 0.0025,
          pathIndex,
          alpha: 0.4 + Math.random() * 0.6,
        });
      }
    };

    const resize = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      width = rect.width;
      height = Math.max(rect.height, 600);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
      generateTraces();
    };

    resize();
    window.addEventListener('resize', resize);

    // Mouse interactive trigger
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Spawn surge packets near mouse
      if (Math.random() > 0.6 && packets.length < 40) {
        const pathIndex = Math.floor(Math.random() * paths.length);
        packets.push({
          x: mx,
          y: my,
          vx: 0,
          vy: 0,
          progress: 0.1,
          speed: 0.004,
          pathIndex,
          alpha: 1,
        });
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw static copper circuit traces
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(40, 48, 70, 0.35)';

      paths.forEach((path) => {
        if (path.points.length < 2) return;
        const pStart = path.points[0];
        if (!pStart) return;
        ctx.beginPath();
        ctx.moveTo(pStart.x, pStart.y);
        for (let i = 1; i < path.points.length; i++) {
          const pt = path.points[i];
          if (pt) ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();

        // Junction node solder points
        path.points.forEach((pt, idx) => {
          if (idx > 0 && idx < path.points.length - 1) {
            ctx.fillStyle = 'rgba(52, 60, 88, 0.5)';
            ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
          }
        });
      });

      // 2. Draw high-speed electron packets along paths
      packets.forEach((p) => {
        p.progress += p.speed;
        if (p.progress >= 1) {
          p.progress = 0;
          p.pathIndex = Math.floor(Math.random() * paths.length);
        }

        const path = paths[p.pathIndex];
        if (!path || path.points.length < 2) return;

        // Calculate position along multi-segment line
        const totalSegments = path.points.length - 1;
        const scaled = p.progress * totalSegments;
        const segIdx = Math.min(Math.floor(scaled), totalSegments - 1);
        const segProgress = scaled - segIdx;

        const p0 = path.points[segIdx];
        const p1 = path.points[segIdx + 1];
        if (!p0 || !p1) return;

        const x = p0.x + (p1.x - p0.x) * segProgress;
        const y = p0.y + (p1.y - p0.y) * segProgress;

        // Draw laser electron packet
        ctx.fillStyle = traceColor;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = packetGlow;
        ctx.shadowBlur = 6;
        ctx.fillRect(x - 2, y - 2, 4, 4);

        // Leading streak
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x - 1, y - 1, 2, 2);

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [language]);

  return <canvas ref={canvasRef} className="circuit-bus-canvas" aria-hidden="true" />;
}
