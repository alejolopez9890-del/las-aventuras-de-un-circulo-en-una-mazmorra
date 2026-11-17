import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight, FastForward } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface DeathCinematicProps {
  waveReached: number;
  onComplete: () => void;
}

const DEATH_BEATS = [
  {
    title: 'Caída en la Mazmorra',
    narration:
      'Las fuerzas cedieron entre la niebla corrosiva. Su armadura golpeó la piedra fría y el visor se apagó lentamente.',
    duration: 3.8,
  },
  {
    title: 'Misión Fallida',
    narration:
      'A lo lejos, tras los barrotes de las celdas profundas, su familiar aguardaba en vano. La mazmorra reclamó otro intento.',
    duration: 4.2,
  },
];

export function DeathCinematic({ waveReached, onComplete }: DeathCinematicProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [beatIdx, setBeatIdx] = useState(0);
  const [readingSeconds, setReadingSeconds] = useState<number | null>(null);
  const [fadeOut, setFadeOut] = useState(false);

  const stateRef = useRef({
    beat: 0,
    beatTime: 0,
    totalTime: 0,
    readingTimer: -1,
    completed: false,
  });

  const finish = useCallback(() => {
    if (stateRef.current.completed) return;
    stateRef.current.completed = true;
    setFadeOut(true);
    window.setTimeout(() => {
      onComplete();
    }, 450);
  }, [onComplete]);

  const advance = useCallback(() => {
    const st = stateRef.current;
    if (st.completed) return;
    if (st.readingTimer >= 0) {
      finish();
      return;
    }
    if (st.beat < DEATH_BEATS.length - 1) {
      st.beat += 1;
      st.beatTime = 0;
      setBeatIdx(st.beat);
    } else {
      finish();
    }
  }, [finish]);

  useEffect(() => {
    soundEngine.playDefeatTone();
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        finish();
      } else if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [advance, finish]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    let last = performance.now();
    let animId = 0;

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const st = stateRef.current;
      st.beatTime += dt;
      st.totalTime += dt;

      const cur = DEATH_BEATS[st.beat];
      if (!st.completed) {
        if (st.readingTimer >= 0) {
          st.readingTimer = Math.max(0, st.readingTimer - dt);
          const ceilSec = Math.ceil(st.readingTimer);
          setReadingSeconds((prev) => (prev === ceilSec ? prev : ceilSec));
          if (st.readingTimer <= 0) {
            finish();
          }
        } else if (st.beatTime >= cur.duration) {
          if (st.beat < DEATH_BEATS.length - 1) {
            st.beat += 1;
            st.beatTime = 0;
            setBeatIdx(st.beat);
          } else {
            st.readingTimer = 30;
            setReadingSeconds(30);
          }
        }
      }

      const w = window.innerWidth;
      const h = window.innerHeight;
      const p = st.readingTimer >= 0 ? 1 : Math.min(1, st.beatTime / cur.duration);

      // Somber dungeon background
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#05060C');
      bg.addColorStop(0.65, '#110C14');
      bg.addColorStop(1, '#09090F');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Stone floor
      ctx.fillStyle = '#0A0D16';
      ctx.fillRect(0, h * 0.7, w, h * 0.3);

      // Subtle red emergency glow fading out
      const pulseAlpha = st.beat === 0 ? Math.max(0.08, 0.35 - p * 0.25) : 0.12;
      const glow = ctx.createRadialGradient(w * 0.35, h * 0.68, 10, w * 0.35, h * 0.68, 220);
      glow.addColorStop(0, `rgba(220, 38, 38, ${pulseAlpha})`);
      glow.addColorStop(1, 'rgba(220, 38, 38, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Fallen Explorer on the left/center
      ctx.save();
      ctx.translate(w * 0.36, h * 0.69);
      // Dropped pistol on floor
      ctx.fillStyle = '#475569';
      ctx.fillRect(42, 6, 20, 6);
      ctx.fillStyle = '#78350F';
      ctx.fillRect(42, 10, 6, 8);

      // Fallen armored torso (slumped/kneeling then collapsed)
      const slump = st.beat === 0 ? Math.min(1, p * 1.4) : 1;
      ctx.rotate(slump * 0.95);
      ctx.fillStyle = '#94A3B8';
      ctx.beginPath();
      ctx.roundRect(-14, -22, 28, 32, 6);
      ctx.fill();
      ctx.fillStyle = '#CBD5E1';
      ctx.beginPath();
      ctx.arc(0, -32, 13, 0, Math.PI * 2);
      ctx.fill();
      // Visor flickering and dying out
      const visorOn = st.beat === 0 && (Math.sin(st.totalTime * 22) > 0.2 || p < 0.35);
      ctx.fillStyle = visorOn ? '#EF4444' : '#1E293B';
      ctx.fillRect(3, -35, 10, 4);
      ctx.restore();

      // Distant dungeon cell bars & captive family silhouette on the right
      const cellX = w * 0.68;
      const cellY = h * 0.56;
      const cellAlpha = st.beat === 1 ? Math.max(0.2, 0.95 - p * 0.55) : 0.45 + p * 0.45;
      ctx.save();
      ctx.globalAlpha = cellAlpha;

      // Dim cell lantern glow behind bars
      const cellGlow = ctx.createRadialGradient(cellX, cellY, 8, cellX, cellY, 130);
      cellGlow.addColorStop(0, 'rgba(245, 158, 11, 0.22)');
      cellGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = cellGlow;
      ctx.beginPath();
      ctx.arc(cellX, cellY, 130, 0, Math.PI * 2);
      ctx.fill();

      // Captive family silhouette reaching toward bars
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(cellX, cellY - 26, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(cellX - 15, cellY - 12, 30, 48, 8);
      ctx.fill();
      // Reaching arm
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cellX - 12, cellY - 2);
      ctx.lineTo(cellX - 38, cellY - 10);
      ctx.stroke();

      // Iron prison bars
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 7;
      for (let b = -3; b <= 3; b++) {
        const bx = cellX + b * 22;
        ctx.beginPath();
        ctx.moveTo(bx, cellY - 85);
        ctx.lineTo(bx, cellY + 58);
        ctx.stroke();
      }
      // Horizontal crossbars
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cellX - 78, cellY - 58);
      ctx.lineTo(cellX + 78, cellY - 58);
      ctx.moveTo(cellX - 78, cellY + 28);
      ctx.lineTo(cellX + 78, cellY + 28);
      ctx.stroke();

      ctx.restore();

      // Drifting ash particles
      ctx.fillStyle = 'rgba(248, 113, 113, 0.35)';
      for (let i = 0; i < 24; i++) {
        const ax = ((i * 137 + st.totalTime * 14) % w);
        const ay = h - ((i * 97 + st.totalTime * 26) % (h * 0.75));
        ctx.beginPath();
        ctx.arc(ax, ay, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [finish]);

  const beat = DEATH_BEATS[beatIdx];

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between bg-slate-950 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />

      <header className="relative z-10 flex items-center justify-between gap-4 bg-slate-950/90 px-6 py-4 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-rose-400">
            <span>Oleada {waveReached}</span>
            <span aria-hidden="true">·</span>
            <span>Registro de Derrota</span>
          </div>
          <p className="font-display text-sm font-bold text-slate-100">{beat.title}</p>
        </div>

        <button
          type="button"
          onClick={finish}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-slate-500 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
        >
          <FastForward className="h-3.5 w-3.5" />
          <span>Saltar</span>
        </button>
      </header>

      <footer className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5 bg-slate-950/92 px-6 py-6 sm:px-10 border-t border-white/10">
        <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-slate-100">
          {beat.narration}
        </p>

        <div className="flex items-center gap-3 self-end shrink-0">
          {readingSeconds !== null && (
            <span className="font-mono tabular-nums text-xs text-rose-300">
              Lectura · {readingSeconds}s
            </span>
          )}
          <button
            type="button"
            onClick={advance}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-400 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>{beatIdx < DEATH_BEATS.length - 1 ? 'Siguiente' : 'Ver Resumen'}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
