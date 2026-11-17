import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight, FastForward } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface IntroCinematicProps {
  onComplete: () => void;
}

interface Chapter {
  title: string;
  narration: string;
  duration: number;
}

const CHAPTERS: Chapter[] = [
  {
    title: 'Capítulo I · El Valle Asolado',
    narration:
      'Más allá de las Colinas de Ceniza, una grieta antigua se abrió bajo la tierra. Entre el caos, un ser querido fue arrastrado hacia las profundidades.',
    duration: 5.2,
  },
  {
    title: 'Capítulo II · El Rastro en la Tormenta',
    narration:
      'Siguiendo la estela tóxica bajo la lluvia nocturna, el último centinela marchó solo con su armadura y su pistola táctica para rescatar a su familiar.',
    duration: 5.2,
  },
  {
    title: 'Capítulo III · El Sello del Abismo',
    narration:
      'Al pie del acantilado halló el umbral olvidado de la mazmorra. Antorchas espectrales ardían junto a runas que despertaban ante su paso.',
    duration: 5.2,
  },
  {
    title: 'Capítulo IV · Descenso a la Mazmorra',
    narration:
      'Las compuertas de piedra cedieron con un estruendo. Sin mirar atrás, cruzó el arco hacia las profundidades infectadas.',
    duration: 5.4,
  },
];

interface EmberParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export function IntroCinematic({ onComplete }: IntroCinematicProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [readingSeconds, setReadingSeconds] = useState<number | null>(null);
  const [fadeOut, setFadeOut] = useState(false);

  const stateRef = useRef({
    sceneIndex: 0,
    sceneTime: 0,
    totalTime: 0,
    readingTimer: -1,
    completed: false,
    gateSoundPlayed: false,
    embers: [] as EmberParticle[],
  });

  const finishCinematic = useCallback(() => {
    if (stateRef.current.completed) return;
    stateRef.current.completed = true;
    setFadeOut(true);
    window.setTimeout(() => {
      onComplete();
    }, 480);
  }, [onComplete]);

  const advanceScene = useCallback(() => {
    const st = stateRef.current;
    if (st.completed) return;
    if (st.readingTimer >= 0) {
      finishCinematic();
      return;
    }
    if (st.sceneIndex < CHAPTERS.length - 1) {
      st.sceneIndex += 1;
      st.sceneTime = 0;
      setSceneIdx(st.sceneIndex);
      soundEngine.playCinematicTone(st.sceneIndex);
    } else {
      finishCinematic();
    }
  }, [finishCinematic]);

  useEffect(() => {
    soundEngine.playCinematicTone(0);

    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        finishCinematic();
      } else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') {
        e.preventDefault();
        advanceScene();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [advanceScene, finishCinematic]);

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

    // Seed atmospheric particles
    const st = stateRef.current;
    st.embers = Array.from({ length: 55 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: -12 + Math.random() * 24,
      vy: -18 - Math.random() * 28,
      size: 1.5 + Math.random() * 2.5,
      alpha: 0.25 + Math.random() * 0.6,
      color: Math.random() < 0.5 ? '#10B981' : '#F59E0B',
    }));

    const drawExplorer = (
      x: number,
      y: number,
      scale: number,
      walkPhase: number,
      facingRight: boolean,
      gunRaised: boolean,
      alpha = 1
    ) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.scale(facingRight ? scale : -scale, scale);

      const bob = Math.abs(Math.sin(walkPhase)) * 3.5;
      const legSwing = Math.sin(walkPhase) * 7;

      // Ground shadow
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.ellipse(0, 26, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cloak flowing behind
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.moveTo(-4, -14 - bob);
      ctx.lineTo(-22 - Math.sin(walkPhase) * 3, 18 - bob * 0.3);
      ctx.lineTo(-4, 15 - bob * 0.4);
      ctx.closePath();
      ctx.fill();

      // Legs
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-4, 10 - bob);
      ctx.lineTo(-4 - legSwing, 24);
      ctx.moveTo(4, 10 - bob);
      ctx.lineTo(4 + legSwing, 24);
      ctx.stroke();

      // Armored torso
      ctx.fillStyle = '#CBD5E1';
      ctx.beginPath();
      ctx.roundRect(-10, -14 - bob, 20, 25, 5);
      ctx.fill();
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Helmet
      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.arc(0, -24 - bob, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glowing visor
      ctx.fillStyle = '#FBBF24';
      ctx.fillRect(2, -27 - bob, 9, 4);

      // Tactical pistol arm
      ctx.save();
      ctx.translate(4, -6 - bob);
      ctx.rotate(gunRaised ? -0.15 : 0.35);
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, -2.5, 16, 5);
      ctx.fillStyle = '#FBBF24';
      ctx.fillRect(13, -2, 4, 4);
      ctx.restore();

      ctx.restore();
    };

    const drawTorch = (tx: number, ty: number, time: number, scale = 1) => {
      ctx.save();
      ctx.translate(tx, ty);
      ctx.scale(scale, scale);

      // Warm radial light pool
      const glow = ctx.createRadialGradient(0, -14, 4, 0, -14, 85 + Math.sin(time * 9) * 8);
      glow.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
      glow.addColorStop(0.5, 'rgba(234, 88, 12, 0.14)');
      glow.addColorStop(1, 'rgba(234, 88, 12, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, -14, 95, 0, Math.PI * 2);
      ctx.fill();

      // Bracket
      ctx.fillStyle = '#334155';
      ctx.fillRect(-3, -6, 6, 22);

      // Flame
      const flicker = Math.sin(time * 16 + tx) * 3;
      ctx.fillStyle = '#F97316';
      ctx.beginPath();
      ctx.moveTo(-7, -6);
      ctx.quadraticCurveTo(0, -28 + flicker, 7, -6);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.moveTo(-3.5, -6);
      ctx.quadraticCurveTo(0, -20 + flicker * 0.6, 3.5, -6);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    let lastTime = performance.now();
    let animId = 0;

    const renderFrame = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      st.sceneTime += dt;
      st.totalTime += dt;

      const currentChapter = CHAPTERS[st.sceneIndex];
      if (!st.completed) {
        if (st.readingTimer >= 0) {
          st.readingTimer = Math.max(0, st.readingTimer - dt);
          const ceilSec = Math.ceil(st.readingTimer);
          setReadingSeconds((prev) => (prev === ceilSec ? prev : ceilSec));
          if (st.readingTimer <= 0) {
            finishCinematic();
          }
        } else if (st.sceneTime >= currentChapter.duration) {
          if (st.sceneIndex < CHAPTERS.length - 1) {
            st.sceneIndex += 1;
            st.sceneTime = 0;
            setSceneIdx(st.sceneIndex);
            soundEngine.playCinematicTone(st.sceneIndex);
          } else {
            st.readingTimer = 30;
            setReadingSeconds(30);
          }
        }
      }

      if (st.sceneIndex === 3 && st.sceneTime > 0.35 && !st.gateSoundPlayed) {
        st.gateSoundPlayed = true;
        soundEngine.playGateOpen();
      }

      const w = window.innerWidth;
      const h = window.innerHeight;
      const p =
        st.readingTimer >= 0 ? 1 : Math.min(1, st.sceneTime / currentChapter.duration);

      // Sky & deep dungeon backdrop
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#040711');
      sky.addColorStop(0.6, '#0B1324');
      sky.addColorStop(1, '#111827');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Distant stars/moonlight haze
      ctx.fillStyle = 'rgba(226, 232, 240, 0.18)';
      for (let i = 0; i < 28; i++) {
        const sx = ((i * 193) % 1000) * (w / 1000);
        const sy = ((i * 97) % 450) * (h / 1000);
        ctx.fillRect(sx, sy, 2, 2);
      }

      if (st.sceneIndex === 0) {
        // Scene 1: Valley outbreak & lone sentinel watching from cliff ridge
        const mistGrad = ctx.createRadialGradient(w * 0.62, h * 0.72, 20, w * 0.62, h * 0.72, w * 0.42);
        mistGrad.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
        mistGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = mistGrad;
        ctx.fillRect(0, 0, w, h);

        // Distant mountain ridge
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.72);
        ctx.lineTo(w * 0.2, h * 0.52);
        ctx.lineTo(w * 0.42, h * 0.64);
        ctx.lineTo(w * 0.68, h * 0.48);
        ctx.lineTo(w * 0.88, h * 0.6);
        ctx.lineTo(w, h * 0.55);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();

        // Distant glowing eyes in the rift
        for (let i = 0; i < 6; i++) {
          const ex = w * 0.54 + i * 28 + Math.sin(st.totalTime * 2 + i) * 6;
          const ey = h * 0.67 + (i % 2) * 14;
          ctx.fillStyle = '#EF4444';
          ctx.fillRect(ex, ey, 3, 2);
          ctx.fillRect(ex + 6, ey, 3, 2);
        }

        // Foreground cliff ledge
        ctx.fillStyle = '#070B14';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.66);
        ctx.lineTo(w * 0.36, h * 0.74);
        ctx.lineTo(w * 0.42, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();

        drawExplorer(w * 0.24 + p * 18, h * 0.67, 1.55, p * 4, true, false);
      } else if (st.sceneIndex === 1) {
        // Scene 2: Marching through storm-swept forest following toxic trail
        // Occasional lightning flash
        if (Math.sin(st.totalTime * 3.7) > 0.94) {
          ctx.fillStyle = 'rgba(226, 232, 240, 0.12)';
          ctx.fillRect(0, 0, w, h);
        }

        // Parallax pine trees
        ctx.fillStyle = '#080E1B';
        for (let t = 0; t < 12; t++) {
          const tx = ((t * 170 - st.totalTime * 65) % (w + 220)) - 110;
          const treeH = 180 + (t % 3) * 55;
          ctx.beginPath();
          ctx.moveTo(tx, h * 0.78);
          ctx.lineTo(tx + 38, h * 0.78 - treeH);
          ctx.lineTo(tx + 76, h * 0.78);
          ctx.closePath();
          ctx.fill();
        }

        // Ground & toxic emerald trail puddles
        ctx.fillStyle = '#090D16';
        ctx.fillRect(0, h * 0.76, w, h * 0.24);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.28)';
        for (let g = 0; g < 5; g++) {
          const gx = ((g * 260 - st.totalTime * 110) % (w + 260)) - 130;
          ctx.beginPath();
          ctx.ellipse(gx, h * 0.82, 48, 7, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Rain streaks
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let r = 0; r < 45; r++) {
          const rx = ((r * 89 + st.totalTime * 180) % w);
          const ry = ((r * 137 + st.totalTime * 540) % h);
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 8, ry + 18);
        }
        ctx.stroke();

        drawExplorer(w * 0.34 + p * (w * 0.24), h * 0.73, 1.75, st.totalTime * 10, true, true);
      } else {
        // Scenes 3 & 4: Ancient Stone Dungeon Archway + Gate Opening + Character Entering!
        const isEntering = st.sceneIndex === 3;
        const zoom = isEntering ? 1 + p * 0.26 : 1 + p * 0.06;
        const gateOpen = isEntering ? Math.min(1, p * 1.65) : 0;

        ctx.save();
        ctx.translate(w / 2, h * 0.56);
        ctx.scale(zoom, zoom);
        ctx.translate(-w / 2, -h * 0.56);

        // Cliffside stone wall
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(0, h * 0.18, w, h * 0.82);

        // Stone blocks texture
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
        ctx.lineWidth = 1.5;
        for (let row = 0; row < 8; row++) {
          const ry = h * 0.22 + row * 56;
          ctx.beginPath();
          ctx.moveTo(0, ry);
          ctx.lineTo(w, ry);
          ctx.stroke();
        }

        const gateCenterX = w * 0.5;
        const gateBaseY = h * 0.76;
        const archW = 190;
        const archH = 230;

        // Inner dungeon abyss glow behind gate
        const abyssGrad = ctx.createRadialGradient(
          gateCenterX,
          gateBaseY - archH * 0.4,
          10,
          gateCenterX,
          gateBaseY - archH * 0.4,
          180
        );
        abyssGrad.addColorStop(0, isEntering ? 'rgba(16, 185, 129, 0.52)' : 'rgba(16, 185, 129, 0.18)');
        abyssGrad.addColorStop(1, 'rgba(2, 6, 23, 0.98)');

        // Archway cutout
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.moveTo(gateCenterX - archW / 2, gateBaseY);
        ctx.lineTo(gateCenterX - archW / 2, gateBaseY - archH * 0.55);
        ctx.arc(gateCenterX, gateBaseY - archH * 0.55, archW / 2, Math.PI, 0);
        ctx.lineTo(gateCenterX + archW / 2, gateBaseY);
        ctx.closePath();
        ctx.fill();

        ctx.save();
        ctx.clip();
        ctx.fillStyle = abyssGrad;
        ctx.fillRect(gateCenterX - archW / 2, gateBaseY - archH, archW, archH);

        // Stone slabs sliding apart in Scene 4
        const slideOffset = gateOpen * (archW * 0.52);
        ctx.fillStyle = '#1E293B';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.fillRect(gateCenterX - archW / 2 - slideOffset, gateBaseY - archH, archW / 2, archH);
        ctx.strokeRect(gateCenterX - archW / 2 - slideOffset, gateBaseY - archH, archW / 2, archH);

        ctx.fillRect(gateCenterX + slideOffset, gateBaseY - archH, archW / 2, archH);
        ctx.strokeRect(gateCenterX + slideOffset, gateBaseY - archH, archW / 2, archH);
        ctx.restore();

        // Carved stone arch border
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(gateCenterX - archW / 2 - 4, gateBaseY);
        ctx.lineTo(gateCenterX - archW / 2 - 4, gateBaseY - archH * 0.55);
        ctx.arc(gateCenterX, gateBaseY - archH * 0.55, archW / 2 + 4, Math.PI, 0);
        ctx.lineTo(gateCenterX + archW / 2 + 4, gateBaseY);
        ctx.stroke();

        // Glowing runes along arch
        const runeCount = 7;
        for (let r = 0; r < runeCount; r++) {
          const ang = Math.PI + (Math.PI * (r + 0.5)) / runeCount;
          const rx = gateCenterX + Math.cos(ang) * (archW / 2 + 4);
          const ry = gateBaseY - archH * 0.55 + Math.sin(ang) * (archW / 2 + 4);
          const lit = isEntering || p * runeCount > r;
          ctx.fillStyle = lit ? '#10B981' : '#334155';
          ctx.beginPath();
          ctx.arc(rx, ry, lit ? 4 : 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Flanking Torches
        drawTorch(gateCenterX - archW / 2 - 48, gateBaseY - 95, st.totalTime, 1.15);
        drawTorch(gateCenterX + archW / 2 + 48, gateBaseY - 95, st.totalTime + 1.1, 1.15);

        // Ground path leading into archway
        ctx.fillStyle = '#070B14';
        ctx.fillRect(0, gateBaseY, w, h - gateBaseY);

        // Explorer animation: approaches gate in Scene 3, walks INTO the open dungeon in Scene 4!
        if (!isEntering) {
          const ex = w * 0.25 + p * (gateCenterX - w * 0.25 - 75);
          drawExplorer(ex, gateBaseY - 22, 1.65, st.totalTime * 7, true, true);
        } else {
          // Walks forward toward doorway center and shrinks into dungeon shadows
          const walkInto = Math.max(0, (p - 0.2) / 0.8);
          const startX = gateCenterX - 75;
          const ex = startX + walkInto * 75;
          const ey = gateBaseY - 22 - walkInto * 16;
          const escale = 1.65 - walkInto * 0.8;
          const eAlpha = Math.max(0, 1 - Math.max(0, (walkInto - 0.55) / 0.45));
          drawExplorer(ex, ey, escale, st.totalTime * 8.5, true, true, eAlpha);
        }

        ctx.restore();
      }

      // Floating embers / spores across all scenes
      for (const em of st.embers) {
        em.x += em.vx * dt;
        em.y += em.vy * dt;
        if (em.y < -10) {
          em.y = h + 10;
          em.x = Math.random() * w;
        }
        ctx.fillStyle = em.color;
        ctx.globalAlpha = em.alpha;
        ctx.beginPath();
        ctx.arc(em.x, em.y, em.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Scene fade-in vignette
      if (st.sceneTime < 0.45) {
        ctx.fillStyle = `rgba(2, 6, 23, ${1 - st.sceneTime / 0.45})`;
        ctx.fillRect(0, 0, w, h);
      }

      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [finishCinematic]);

  const chapter = CHAPTERS[sceneIdx];

  return (
    <div
      className={`fixed inset-0 z-40 flex flex-col justify-between bg-slate-950 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Fullscreen Animated Story Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />

      {/* Top Letterbox & Chapter Progress */}
      <header className="relative z-10 flex items-center justify-between gap-6 bg-slate-950/90 px-6 py-4 border-b border-white/10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {CHAPTERS.map((ch, idx) => (
              <span
                key={ch.title}
                className={`h-1.5 w-10 rounded-full transition-colors ${
                  idx < sceneIdx
                    ? 'bg-emerald-500'
                    : idx === sceneIdx
                      ? 'bg-amber-400'
                      : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
          <p className="font-display text-sm font-bold tracking-wide text-amber-300">
            {chapter.title}
          </p>
        </div>

        <button
          type="button"
          onClick={finishCinematic}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
        >
          <FastForward className="h-3.5 w-3.5" />
          <span>Saltar historia</span>
        </button>
      </header>

      {/* Bottom Letterbox Narration & Advance Control */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5 bg-slate-950/92 px-6 py-6 sm:px-10 border-t border-white/10">
        <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-slate-100">
          {chapter.narration}
        </p>

        <div className="flex items-center gap-3 self-end shrink-0">
          {readingSeconds !== null ? (
            <span className="font-mono tabular-nums text-xs text-amber-300">
              Lectura · {readingSeconds}s
            </span>
          ) : (
            <span className="hidden md:inline text-xs text-slate-400">
              Pulsa Espacio para avanzar
            </span>
          )}
          <button
            type="button"
            onClick={advanceScene}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>
              {sceneIdx < CHAPTERS.length - 1 ? 'Siguiente' : 'Entrar a la Mazmorra'}
            </span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
