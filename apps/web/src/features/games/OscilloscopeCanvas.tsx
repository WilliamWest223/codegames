import { useEffect, useRef } from 'react';

export type OscilloscopeState = 'idle' | 'running' | 'pass' | 'fail';

interface Props {
  state?: OscilloscopeState;
  label?: string;
  className?: string;
}

export function OscilloscopeCanvas({ state = 'idle', label = 'EXECUTION BUS', className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = 340;
    const height = 64;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = '100%';
    canvas.style.maxWidth = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    let offset = 0;

    const render = () => {
      offset += state === 'running' ? 0.35 : 0.08;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw oscilloscope chassis & graticule grid
      ctx.fillStyle = '#07090E';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(34, 42, 60, 0.4)';
      ctx.lineWidth = 1;

      // Vertical grid lines
      for (let x = 0; x < width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
        ctx.stroke();
      }

      // Center horizontal axis
      ctx.strokeStyle = 'rgba(50, 60, 85, 0.6)';
      ctx.beginPath();
      ctx.moveTo(0, height / 2 + 0.5);
      ctx.lineTo(width, height / 2 + 0.5);
      ctx.stroke();

      // 2. Select beam color and parameters based on state
      let beamColor = '#10B981'; // Green
      let glowColor = 'rgba(16, 185, 129, 0.7)';
      if (state === 'running') {
        beamColor = '#3B82F6'; // Blue
        glowColor = 'rgba(59, 130, 246, 0.8)';
      } else if (state === 'fail') {
        beamColor = '#EF4444'; // Red
        glowColor = 'rgba(239, 68, 68, 0.8)';
      }

      ctx.strokeStyle = beamColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 4;
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      const centerY = height / 2;

      for (let x = 0; x < width; x++) {
        let y = centerY;
        if (state === 'running') {
          // Complex sweeping wave
          const freq1 = Math.sin((x * 0.08) - offset * 4) * 16;
          const freq2 = Math.cos((x * 0.18) + offset * 6) * 6;
          const noise = (Math.random() - 0.5) * 4;
          y = centerY + freq1 + freq2 + noise;
        } else if (state === 'pass') {
          // Harmonious resonant sine wave
          const wave = Math.sin((x * 0.06) - offset * 2) * 12;
          y = centerY + wave;
        } else if (state === 'fail') {
          // Glitch sawtooth with sporadic drops
          const saw = ((x * 0.1 - offset * 3) % 20 < 10 ? 12 : -12);
          const jitter = (Math.random() - 0.5) * 6;
          y = centerY + saw + jitter;
        } else {
          // Idle: gentle heartbeat pulse
          const pulse = Math.sin((x * 0.03) - offset) * 3;
          y = centerY + pulse;
        }

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 3. Telemetry header text inside screen
      ctx.fillStyle = 'rgba(136, 146, 170, 0.7)';
      ctx.font = '600 9px monospace';
      ctx.fillText(label, 6, 12);
      ctx.fillText(state.toUpperCase(), width - 52, 12);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, label]);

  return (
    <div className={`oscilloscope-container ${className}`}>
      <canvas ref={canvasRef} className="oscilloscope-canvas" aria-hidden="true" />
    </div>
  );
}
