import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight, FastForward, Sparkles } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface DivineReviveCinematicProps {
  waveReached: number;
  bonusCoins: number;
  onComplete: () => void;
}

function getDivineActs(bonusCoins: number) {
  return [
    {
      title: 'Acto I · El Último Aliento',
      narration:
        'El frío de la mazmorra envolvió tu armadura. Con el visor apagado y la salud en cero, todo parecía haber terminado.',
      duration: 5.0,
    },
    {
      title: 'Acto II · Despertar entre Sombras',
      narration:
        'De pronto, un haz celestial rasga la oscuridad. Aturdido y confundido, observas tus propias manos y miras hacia lo alto: "¿Por qué sigo aquí... qué es esta luz?"',
      duration: 6.2,
    },
    {
      title: bonusCoins >= 1000 ? 'Acto III · Gracia Suprema del Dios' : 'Acto III · La Bendición de un Dios',
      narration:
        bonusCoins >= 1000
          ? '¡Milagro del 1%! Un antiguo Dios desciende entre rayos dorados. Conmovido por tu valor, te entrega una Chispa Inmortal y una lluvia sagrada de 1,000 monedas de oro celestial.'
          : 'Un antiguo Dios del panteón olvidado desciende ante ti. Viendo tu sacrificio por salvar a tu familiar, te entrega una Chispa Inmortal que repara tu cuerpo y renueva tu vida.',
      duration: 6.8,
    },
    {
      title: 'Acto IV · Renacido para Luchar',
      narration:
        bonusCoins >= 1000
          ? 'Tu armadura brilla con salud completa y tu bolsa rebosa con +1,000 monedas divinas. Aún incrédulo por el prodigio, empuñas tu arma y regresas al combate.'
          : 'La energía sagrada inunda tu armadura con vida completa y protección divina. Todavía asombrado por el milagro, empuñas tu arma y regresas al combate.',
      duration: 5.5,
    },
  ];
}

interface LightMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
}

export function DivineReviveCinematic({
  waveReached,
  bonusCoins,
  onComplete,
}: DivineReviveCinematicProps) {
  const acts = getDivineActs(bonusCoins);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [actIdx, setActIdx] = useState(0);
  const [readingSeconds, setReadingSeconds] = useState<number | null>(null);
  const [fadeOut, setFadeOut] = useState(false);

  const stateRef = useRef({
    act: 0,
    actTime: 0,
    totalTime: 0,
    readingTimer: -1,
    completed: false,
    blessingSoundPlayed: false,
    motes: [] as LightMote[],
  });

  const finish = useCallback(() => {
    if (stateRef.current.completed) return;
    stateRef.current.completed = true;
    setFadeOut(true);
    window.setTimeout(() => {
      onComplete();
    }, 480);
  }, [onComplete]);

  const advance = useCallback(() => {
    const st = stateRef.current;
    if (st.completed) return;
    if (st.readingTimer >= 0) {
      finish();
      return;
    }
    if (st.act < acts.length - 1) {
      st.act += 1;
      st.actTime = 0;
      setActIdx(st.act);
      if (st.act === 2) {
        soundEngine.playDivineBlessing();
      } else {
        soundEngine.playCinematicTone(st.act);
      }
    } else {
      finish();
    }
  }, [acts.length, finish]);

  useEffect(() => {
    soundEngine.playCinematicTone(0);

    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        finish();
      } else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') {
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

    const st = stateRef.current;
    st.motes = Array.from({ length: 65 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 20,
      vy: -18 - Math.random() * 34,
      r: 1.4 + Math.random() * 2.6,
      color: Math.random() < 0.6 ? '#FDE047' : '#C084FC',
    }));

    let last = performance.now();
    let animId = 0;

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      st.actTime += dt;
      st.totalTime += dt;

      const cur = acts[st.act];
      if (!st.completed) {
        if (st.readingTimer >= 0) {
          st.readingTimer = Math.max(0, st.readingTimer - dt);
          const ceilSec = Math.ceil(st.readingTimer);
          setReadingSeconds((prev) => (prev === ceilSec ? prev : ceilSec));
          if (st.readingTimer <= 0) {
            finish();
          }
        } else if (st.actTime >= cur.duration) {
          if (st.act < acts.length - 1) {
            st.act += 1;
            st.actTime = 0;
            setActIdx(st.act);
            if (st.act === 2 && !st.blessingSoundPlayed) {
              st.blessingSoundPlayed = true;
              soundEngine.playDivineBlessing();
            } else {
              soundEngine.playCinematicTone(st.act);
            }
          } else {
            st.readingTimer = 30;
            setReadingSeconds(30);
          }
        }
      }

      if (st.act === 2 && !st.blessingSoundPlayed) {
        st.blessingSoundPlayed = true;
        soundEngine.playDivineBlessing();
      }

      const w = window.innerWidth;
      const h = window.innerHeight;
      const p = st.readingTimer >= 0 ? 1 : Math.min(1, st.actTime / cur.duration);

      // Sky gradient shifting from abyssal black to celestial violet-gold
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, st.act === 0 ? '#03050B' : '#130A2A');
      bg.addColorStop(0.55, st.act >= 2 ? '#1E1B4B' : '#0B1020');
      bg.addColorStop(1, '#070A12');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Dungeon floor
      ctx.fillStyle = '#090D18';
      ctx.fillRect(0, h * 0.72, w, h * 0.28);

      // Descending heavenly beam from Act II onward
      if (st.act >= 1) {
        const beamIntensity = st.act === 1 ? Math.min(1, p * 1.4) : 1;
        const beamW = (st.act >= 2 ? 260 : 150) + Math.sin(st.totalTime * 2.5) * 14;
        const beamGrad = ctx.createLinearGradient(w * 0.5, 0, w * 0.5, h * 0.76);
        beamGrad.addColorStop(0, `rgba(254, 240, 138, ${0.42 * beamIntensity})`);
        beamGrad.addColorStop(0.6, `rgba(192, 132, 252, ${0.18 * beamIntensity})`);
        beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(w * 0.5 - beamW * 0.35, 0);
        ctx.lineTo(w * 0.5 + beamW * 0.35, 0);
        ctx.lineTo(w * 0.5 + beamW * 0.95, h * 0.75);
        ctx.lineTo(w * 0.5 - beamW * 0.95, h * 0.75);
        ctx.closePath();
        ctx.fill();
      }

      // Ethereal God manifestation in Act III & fading blessing in Act IV
      if (st.act === 2 || (st.act === 3 && p < 0.65 && st.readingTimer < 0)) {
        const godAlpha =
          st.act === 2
            ? Math.min(1, p * 1.8)
            : Math.max(0, 1 - p / 0.65);
        const godX = w * 0.5;
        const godY = h * 0.28 + Math.sin(st.totalTime * 2) * 8;

        ctx.save();
        ctx.globalAlpha = godAlpha;
        ctx.translate(godX, godY);

        // Rotating celestial halo & sacred geometry
        ctx.save();
        ctx.rotate(st.totalTime * 0.45);
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.75)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 74, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([12, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, 92, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Radiant wings of light
        ctx.fillStyle = 'rgba(254, 249, 195, 0.24)';
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(side * 18, -10);
          ctx.quadraticCurveTo(side * 125, -75, side * 155, -18);
          ctx.quadraticCurveTo(side * 105, 18, side * 22, 16);
          ctx.closePath();
          ctx.fill();
        }

        // Luminous Deity silhouette
        const deityGrad = ctx.createRadialGradient(0, -10, 8, 0, 0, 75);
        deityGrad.addColorStop(0, '#FFFFFF');
        deityGrad.addColorStop(0.45, '#FDE047');
        deityGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = deityGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 75, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FEF9C3';
        ctx.beginPath();
        ctx.arc(0, -28, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-26, 46);
        ctx.quadraticCurveTo(-18, -8, 0, -12);
        ctx.quadraticCurveTo(18, -8, 26, 46);
        ctx.closePath();
        ctx.fill();

        // Outstretched blessing hands
        ctx.strokeStyle = '#FEF08A';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-14, 2);
        ctx.lineTo(-32, 34);
        ctx.moveTo(14, 2);
        ctx.lineTo(32, 34);
        ctx.stroke();

        ctx.restore();

        // Descending Gift: Sacred Immortal Spark / Divine Heart Relic traveling down to player
        if (st.act === 2) {
          const giftTravel = Math.min(1, Math.max(0, (p - 0.2) / 0.65));
          const giftX = w * 0.5;
          const giftY = h * 0.36 + giftTravel * (h * 0.65 - h * 0.36);
          const giftPulse = 1 + Math.sin(st.totalTime * 12) * 0.18;

          const orbGlow = ctx.createRadialGradient(giftX, giftY, 2, giftX, giftY, 44 * giftPulse);
          orbGlow.addColorStop(0, '#FFFFFF');
          orbGlow.addColorStop(0.35, 'rgba(253, 224, 71, 0.95)');
          orbGlow.addColorStop(0.75, 'rgba(192, 132, 252, 0.45)');
          orbGlow.addColorStop(1, 'rgba(253, 224, 71, 0)');
          ctx.fillStyle = orbGlow;
          ctx.beginPath();
          ctx.arc(giftX, giftY, 44 * giftPulse, 0, Math.PI * 2);
          ctx.fill();

          // Sacred diamond core
          ctx.save();
          ctx.translate(giftX, giftY);
          ctx.rotate(st.totalTime * 3);
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.moveTo(0, -11);
          ctx.lineTo(9, 0);
          ctx.lineTo(0, 11);
          ctx.lineTo(-9, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      // Explorer pose across the 4 acts
      const ex = w * 0.5;
      const ey = h * 0.68;
      ctx.save();
      ctx.translate(ex, ey);

      if (st.act === 0) {
        // Act I: Collapsed on floor, visor dead
        ctx.rotate(1.15);
        ctx.fillStyle = '#64748B';
        ctx.beginPath();
        ctx.roundRect(-14, -22, 28, 32, 6);
        ctx.fill();
        ctx.fillStyle = '#94A3B8';
        ctx.beginPath();
        ctx.arc(0, -32, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = p < 0.4 && Math.sin(st.totalTime * 18) > 0 ? '#EF4444' : '#0F172A';
        ctx.fillRect(3, -35, 10, 4);
      } else if (st.act === 1) {
        // Act II: Sitting up & looking around CONFUSED with tilted head & floating '?'
        const sitUp = Math.min(1, p * 1.6);
        ctx.rotate((1 - sitUp) * 0.9);
        const headLook = Math.sin(st.totalTime * 3.1) * 0.25;

        // Torso
        ctx.fillStyle = '#CBD5E1';
        ctx.beginPath();
        ctx.roundRect(-14, -26, 28, 34, 6);
        ctx.fill();
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Confused raised hands looking at self & light
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-12, -16);
        ctx.lineTo(-26, -24 + Math.sin(st.totalTime * 4) * 4);
        ctx.moveTo(12, -16);
        ctx.lineTo(25, -28 + Math.cos(st.totalTime * 4) * 4);
        ctx.stroke();

        // Tilting helmet
        ctx.save();
        ctx.translate(0, -38);
        ctx.rotate(headLook);
        ctx.fillStyle = '#E2E8F0';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#FBBF24';
        ctx.fillRect(-6, -3, 12, 4.5);
        ctx.restore();

        // Floating "?" confusion marks above explorer
        ctx.font = '800 22px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FDE047';
        const qBob1 = Math.sin(st.totalTime * 4.5) * 4;
        const qBob2 = Math.cos(st.totalTime * 4.2) * 4;
        ctx.fillText('?', -24, -64 + qBob1);
        ctx.fillText('?', 24, -68 + qBob2);
      } else if (st.act === 2) {
        // Act III: Kneeling / looking upward in confusion and awe receiving the God's spark
        ctx.fillStyle = '#CBD5E1';
        ctx.beginPath();
        ctx.roundRect(-14, -26, 28, 34, 6);
        ctx.fill();
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Helmet tilted upward watching the Deity
        ctx.fillStyle = '#E2E8F0';
        ctx.beginPath();
        ctx.arc(0, -39, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#FDE047';
        ctx.fillRect(-5, -45, 11, 4);

        // Floating "?" fading into awe glow
        if (p < 0.65) {
          ctx.globalAlpha = Math.max(0, 1 - p / 0.65);
          ctx.font = '800 20px "Outfit", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#E9D5FF';
          ctx.fillText('?!', 24, -60);
          ctx.globalAlpha = 1;
        }
      } else {
        // Act IV: Reborn! Standing tall with radiant golden-violet shockwave & glowing aura
        const shockRadius = st.readingTimer >= 0 ? 150 : Math.min(180, p * 220);
        ctx.strokeStyle = `rgba(253, 224, 71, ${Math.max(0.2, 0.85 - p * 0.5)})`;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, -18, shockRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Celestial halo behind reborn explorer
        ctx.fillStyle = 'rgba(253, 224, 71, 0.22)';
        ctx.beginPath();
        ctx.arc(0, -22, 44 + Math.sin(st.totalTime * 5) * 4, 0, Math.PI * 2);
        ctx.fill();

        // Legs standing strong
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-7, 2);
        ctx.lineTo(-9, 22);
        ctx.moveTo(7, 2);
        ctx.lineTo(9, 22);
        ctx.stroke();

        // Mended golden-trimmed armor
        ctx.fillStyle = '#FEF9C3';
        ctx.beginPath();
        ctx.roundRect(-15, -30, 30, 34, 6);
        ctx.fill();
        ctx.strokeStyle = '#7C3AED';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Helmet & bright divine visor
        ctx.fillStyle = '#FEF9C3';
        ctx.beginPath();
        ctx.arc(0, -43, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FDE047';
        ctx.fillRect(-7, -46, 14, 5);
      }

      ctx.restore();

      // Shower of golden divine coins in Acts III & IV when 1% +1000 coins triggers
      if (bonusCoins >= 1000 && st.act >= 2) {
        for (let c = 0; c < 18; c++) {
          const cx = w * 0.25 + ((c * 173 + st.totalTime * 45) % (w * 0.5));
          const cy = ((c * 97 + st.totalTime * 190) % (h * 0.72));
          ctx.fillStyle = '#F59E0B';
          ctx.strokeStyle = '#FEF08A';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }

      // Ascending celestial light motes
      for (const m of st.motes) {
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        if (m.y < -12) {
          m.y = h + 12;
          m.x = Math.random() * w;
        }
        ctx.fillStyle = m.color;
        ctx.globalAlpha = st.act === 0 ? 0.15 : 0.72;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [acts, bonusCoins, finish]);

  const act = acts[actIdx];

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between bg-slate-950 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />

      <header className="relative z-10 flex items-center justify-between gap-4 bg-slate-950/90 px-6 py-4 border-b border-amber-400/20">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            {acts.map((item, idx) => (
              <span
                key={item.title}
                className={`h-1.5 w-10 rounded-full transition-colors ${
                  idx < actIdx
                    ? 'bg-amber-400'
                    : idx === actIdx
                      ? 'bg-violet-400'
                      : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-amber-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>
              {bonusCoins >= 1000
                ? 'Milagro Supremo (1% · +1,000 Monedas)'
                : 'Milagro Divino (5%)'}{' '}
              · Oleada {waveReached}
            </span>
          </div>
          <p className="font-display text-sm sm:text-base font-bold text-white">{act.title}</p>
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

      <footer className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5 bg-slate-950/92 px-6 py-6 sm:px-10 border-t border-amber-400/20">
        <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-slate-100">
          {act.narration}
        </p>

        <div className="flex items-center gap-3 self-end shrink-0">
          {readingSeconds !== null && (
            <span className="font-mono tabular-nums text-xs text-amber-300">
              Lectura · {readingSeconds}s
            </span>
          )}
          <button
            type="button"
            onClick={advance}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-300 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>{actIdx < acts.length - 1 ? 'Siguiente' : 'Despertar en la Arena'}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
