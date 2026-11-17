import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { EnemyRevealId } from '../types/game';

interface EnemyRevealCinematicProps {
  enemyId: EnemyRevealId;
  wave: number;
  onComplete: () => void;
}

const REVEAL_STORY: Record<
  EnemyRevealId,
  {
    kicker: string;
    title: string;
    narration: string;
    warning: string;
    accent: string;
  }
> = {
  reaper: {
    kicker: 'Nueva Amenaza · Sector Profundo',
    title: 'Esqueleto Segador',
    narration:
      'Las sombras de la segunda cámara cobran forma. Estos espectros custodian el paso hacia tu familiar con hoces malditas que desgarran la carne y frenan tu huida.',
    warning: 'Lanza hoces giratorias · Reduce velocidad 50% e impide curarte durante 5s',
    accent: '#EF4444',
  },
  zombie_leader: {
    kicker: 'Comandante de la Mazmorra · Alerta',
    title: 'Zombi Líder con Estandarte',
    narration:
      'Más allá de la sexta sala resuena una marcha pesada. El Zombi Líder alza su bandera de guerra entre los prisioneros, listo para aplastar a cualquier intruso contra los muros.',
    warning: 'Golpe brutal · Te empuja contra la pared y te deja aturdido 2 segundos',
    accent: '#BEF264',
  },
  fallen_angel: {
    kicker: 'Entidad del Abismo Celestial · Peligro Mortal',
    title: 'Ángel Caído',
    narration:
      'Tras superar la décima cámara, las alas negras de un antiguo ser celestial descienden entre llamas oscuras. Su sentencia es implacable: si no cae pronto, su juicio te consumirá.',
    warning: 'Cuenta regresiva de 30s · Si sigue vivo, te quita la vida de 2 golpes cada 5 segundos',
    accent: '#FBBF24',
  },
};

export function EnemyRevealCinematic({
  enemyId,
  wave,
  onComplete,
}: EnemyRevealCinematicProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fadeOut, setFadeOut] = useState(false);
  const [readingSeconds, setReadingSeconds] = useState<number | null>(null);
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setFadeOut(true);
    window.setTimeout(() => {
      onComplete();
    }, 360);
  }, [onComplete]);

  useEffect(() => {
    soundEngine.playEnemyRevealTone();
    let intervalId: number | undefined;

    const startReadingTimer = window.setTimeout(() => {
      let left = 30;
      setReadingSeconds(left);
      intervalId = window.setInterval(() => {
        left -= 1;
        setReadingSeconds(left);
        if (left <= 0) {
          if (intervalId) window.clearInterval(intervalId);
          finish();
        }
      }, 1000);
    }, 2400);

    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.clearTimeout(startReadingTimer);
      if (intervalId) window.clearInterval(intervalId);
      window.removeEventListener('keydown', handleKey);
    };
  }, [finish]);

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

    let time = 0;
    let last = performance.now();
    let animId = 0;

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const revealP = Math.min(1, time / 1.4);

      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, w, h);

      // Spotlight behind enemy
      const glow = ctx.createRadialGradient(w * 0.5, h * 0.48, 12, w * 0.5, h * 0.48, 240);
      glow.addColorStop(
        0,
        enemyId === 'reaper'
          ? 'rgba(220, 38, 38, 0.34)'
          : enemyId === 'fallen_angel'
            ? 'rgba(245, 158, 11, 0.32)'
            : 'rgba(163, 230, 53, 0.28)'
      );
      glow.addColorStop(1, 'rgba(5, 8, 17, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Floor silhouette
      ctx.fillStyle = '#0B1120';
      ctx.fillRect(0, h * 0.64, w, h * 0.36);

      ctx.save();
      ctx.translate(w * 0.5, h * 0.52);
      const scale = (1.6 + revealP * 0.6) * (w < 640 ? 0.78 : 1);
      ctx.scale(scale, scale);

      if (enemyId === 'reaper') {
        const hover = Math.sin(time * 3) * 4;
        ctx.translate(0, hover);

        // Tattered Reaper cloak
        ctx.fillStyle = '#0F172A';
        ctx.strokeStyle = '#991B1B';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -44);
        ctx.quadraticCurveTo(32, -24, 34, 28);
        ctx.lineTo(14, 18);
        ctx.lineTo(0, 32);
        ctx.lineTo(-14, 18);
        ctx.lineTo(-34, 28);
        ctx.quadraticCurveTo(-32, -24, 0, -44);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Skull & glowing red eyes
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(0, -14, 17, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#E2E8F0';
        ctx.beginPath();
        ctx.arc(0, -16, 13, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(-4.5, -16, 2.4, 0, Math.PI * 2);
        ctx.arc(4.5, -16, 2.4, 0, Math.PI * 2);
        ctx.fill();

        // Scythe raised dramatically
        ctx.save();
        ctx.translate(24, 4);
        ctx.rotate(-0.2 + Math.sin(time * 2.5) * 0.12);
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 26);
        ctx.lineTo(0, -42);
        ctx.stroke();

        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(16, -38, 20, Math.PI, Math.PI * 1.85);
        ctx.stroke();

        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(16, -38, 22, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        ctx.restore();
      } else if (enemyId === 'zombie_leader') {
        // Zombie Leader with fluttering War Banner
        const stomp = Math.abs(Math.sin(time * 3.5)) * 2.5;
        ctx.translate(0, -stomp);

        // Tall War Banner Pole + fluttering crimson flag
        const waveFlag = Math.sin(time * 6) * 6;
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-22, 34);
        ctx.lineTo(-22, -62);
        ctx.stroke();

        ctx.fillStyle = '#B91C1C';
        ctx.beginPath();
        ctx.moveTo(-22, -60);
        ctx.quadraticCurveTo(-50, -54 + waveFlag, -72, -56 - waveFlag * 0.5);
        ctx.lineTo(-62, -40);
        ctx.lineTo(-74, -26 + waveFlag * 0.4);
        ctx.quadraticCurveTo(-48, -32, -22, -28);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#FDE047';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Bulky armored zombie body
        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.roundRect(-24, -10, 48, 42, 10);
        ctx.fill();
        ctx.strokeStyle = '#84CC16';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Zombie head
        ctx.fillStyle = '#4D7C0F';
        ctx.beginPath();
        ctx.arc(0, -24, 17, 0, Math.PI * 2);
        ctx.fill();

        // Glowing amber/red eyes
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(-6, -25, 2.8, 0, Math.PI * 2);
        ctx.arc(6, -25, 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Jagged jaw
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(-8, -17, 16, 6);
      } else if (enemyId === 'fallen_angel') {
        const hover = Math.sin(time * 3.2) * 5;
        const flap = Math.sin(time * 5.2) * 8;
        ctx.translate(0, hover);

        // Dark feathered wings
        for (const side of [-1, 1]) {
          ctx.fillStyle = '#0F172A';
          ctx.strokeStyle = '#991B1B';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(side * 12, -10);
          ctx.quadraticCurveTo(side * 65, -48 + flap, side * 78, -6 + flap * 0.5);
          ctx.lineTo(side * 52, 10 + flap * 0.3);
          ctx.lineTo(side * 62, 22);
          ctx.quadraticCurveTo(side * 34, 16, side * 12, 8);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // Cracked golden halo
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, -44, 18, 5, -0.15, 0.2, Math.PI * 1.8);
        ctx.stroke();

        // Dark celestial robes
        ctx.fillStyle = '#1E1B4B';
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, -24);
        ctx.lineTo(22, 30);
        ctx.lineTo(0, 22);
        ctx.lineTo(-22, 30);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pale fallen visage + crimson eyes
        ctx.fillStyle = '#CBD5E1';
        ctx.beginPath();
        ctx.arc(0, -22, 13, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(-4.5, -23, 2.3, 0, Math.PI * 2);
        ctx.arc(4.5, -23, 2.3, 0, Math.PI * 2);
        ctx.fill();

        // Crimson judgment blade
        ctx.strokeStyle = '#FDE047';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(26, 22);
        ctx.lineTo(26, -30);
        ctx.stroke();
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(19, 10);
        ctx.lineTo(33, 10);
        ctx.stroke();
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [enemyId]);

  const info = REVEAL_STORY[enemyId];

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between bg-slate-950/95 transition-opacity duration-300 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />

      <header className="relative z-10 flex items-center justify-between bg-slate-950/90 px-6 py-4 border-b border-white/10">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span style={{ color: info.accent }} className="font-semibold">
              {info.kicker}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">Oleada {wave}</span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white">
            {info.title}
          </h2>
        </div>

        <button
          type="button"
          onClick={finish}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 hover:bg-emerald-400 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>Continuar Combate</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </header>

      <footer className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-slate-950/92 px-6 py-5 sm:px-10 border-t border-white/10">
        <div className="flex flex-col gap-2">
          <p className="max-w-3xl text-sm sm:text-base leading-relaxed text-slate-100">
            {info.narration}
          </p>
          <p className="text-xs font-mono text-amber-300">{info.warning}</p>
        </div>
        {readingSeconds !== null && (
          <span className="font-mono tabular-nums text-xs text-slate-300 whitespace-nowrap shrink-0">
            Lectura · {readingSeconds}s
          </span>
        )}
      </footer>
    </div>
  );
}
