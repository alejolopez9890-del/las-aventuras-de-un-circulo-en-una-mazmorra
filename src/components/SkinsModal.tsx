import { useEffect, useRef, useState } from 'react';
import { Award, Check, Lock, X } from 'lucide-react';
import { getSkinProgressLabel, SKIN_LIST } from '../data/skins';
import { PersistentProgress, SkinDefinition, SkinId } from '../types/game';

interface SkinsModalProps {
  progress: PersistentProgress;
  onSelectSkin: (skinId: SkinId) => void;
  onClose: () => void;
}

type TierFilter = 'Todas' | SkinDefinition['tier'];
const TIER_FILTERS: TierFilter[] = ['Todas', 'Estándar', 'Élite', 'Maestro', 'Leyenda'];

function SkinAvatarPreview({ skin, unlocked }: { skin: SkinDefinition; unlocked: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 64;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(size / 2, size / 2);
    if (!unlocked) {
      ctx.globalAlpha = 0.45;
    }

    // Aura / Halo / Cosmic Rings
    if (
      skin.id === 'celestial_god' ||
      skin.id === 'eternal_monarch' ||
      skin.id === 'omnipotent_one' ||
      skin.id === 'galaxy_phantom' ||
      skin.id === 'chronos_sentinel'
    ) {
      ctx.strokeStyle = skin.accentColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.stroke();
      if (
        skin.id === 'eternal_monarch' ||
        skin.id === 'omnipotent_one' ||
        skin.id === 'galaxy_phantom'
      ) {
        ctx.strokeStyle = skin.secondaryColor;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, 28.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else if (
      skin.id === 'shadow_reaper' ||
      skin.id === 'abyssal_knight' ||
      skin.id === 'void_harbinger' ||
      skin.id === 'arcane_archon'
    ) {
      ctx.fillStyle =
        skin.id === 'arcane_archon'
          ? 'rgba(56, 189, 248, 0.25)'
          : skin.id === 'void_harbinger'
            ? 'rgba(99, 102, 241, 0.28)'
            : skin.id === 'abyssal_knight'
              ? 'rgba(192, 132, 252, 0.28)'
              : 'rgba(124, 58, 237, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.fill();
    } else if (
      skin.id === 'inferno_warden' ||
      skin.id === 'immortal_phoenix' ||
      skin.id === 'blood_sovereign' ||
      skin.id === 'crimson_overlord'
    ) {
      ctx.fillStyle =
        skin.id === 'blood_sovereign' || skin.id === 'crimson_overlord'
          ? 'rgba(225, 29, 72, 0.28)'
          : 'rgba(249, 115, 22, 0.28)';
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wings / Cape / Shoulder plates
    if (
      skin.id === 'angel_slayer' ||
      skin.id === 'seraph_bane' ||
      skin.id === 'eclipse_valkyrie' ||
      skin.id === 'immortal_phoenix' ||
      skin.id === 'omnipotent_one'
    ) {
      ctx.fillStyle = skin.id === 'omnipotent_one' ? '#FEF08A' : skin.secondaryColor;
      ctx.strokeStyle = skin.accentColor;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-6, -8);
      ctx.lineTo(-28, -21);
      ctx.lineTo(-18, -4);
      ctx.moveTo(-6, 8);
      ctx.lineTo(-28, 21);
      ctx.lineTo(-18, 4);
      ctx.fill();
      ctx.stroke();
    } else if (
      skin.id === 'crimson_hunter' ||
      skin.id === 'shadow_reaper' ||
      skin.id === 'eternal_monarch' ||
      skin.id === 'void_harbinger' ||
      skin.id === 'crimson_overlord' ||
      skin.id === 'blood_sovereign' ||
      skin.id === 'galaxy_phantom'
    ) {
      ctx.fillStyle = skin.secondaryColor;
      ctx.beginPath();
      ctx.moveTo(-8, -15);
      ctx.lineTo(-25, 0);
      ctx.lineTo(-8, 15);
      ctx.closePath();
      ctx.fill();
    } else if (
      skin.id === 'titan_emerald' ||
      skin.id === 'golden_champion' ||
      skin.id === 'inferno_warden' ||
      skin.id === 'arsenal_master' ||
      skin.id === 'bone_emperor' ||
      skin.id === 'warbanner_breaker' ||
      skin.id === 'colossus_vanquisher' ||
      skin.id === 'omega_forged' ||
      skin.id === 'chronos_sentinel' ||
      skin.id === 'arcane_archon' ||
      skin.id === 'apocalypse_knight'
    ) {
      ctx.fillStyle = skin.secondaryColor;
      ctx.beginPath();
      ctx.roundRect(-14, -20, 14, 9, 3);
      ctx.roundRect(-14, 11, 14, 9, 3);
      ctx.fill();
    }

    // Gun barrel
    ctx.fillStyle = skin.secondaryColor;
    ctx.fillRect(10, -3.5, 16, 7);
    ctx.fillStyle = skin.accentColor;
    ctx.fillRect(22, -2.5, 4, 5);

    // Armored helmet/body
    ctx.fillStyle = skin.primaryColor;
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle =
      skin.id === 'abyssal_knight'
        ? '#A855F7'
        : skin.tier === 'Leyenda'
          ? skin.accentColor
          : '#0F172A';
    ctx.lineWidth = skin.tier === 'Leyenda' ? 2.5 : 2.2;
    ctx.stroke();

    // Horns / Crown / Crest
    if (
      skin.id === 'abyssal_knight' ||
      skin.id === 'inferno_warden' ||
      skin.id === 'bone_emperor' ||
      skin.id === 'apocalypse_knight' ||
      skin.id === 'blood_sovereign' ||
      skin.id === 'colossus_vanquisher'
    ) {
      ctx.fillStyle = skin.accentColor;
      ctx.beginPath();
      ctx.moveTo(-8, -14);
      ctx.lineTo(-15, -25);
      ctx.lineTo(-2, -16);
      ctx.moveTo(8, -14);
      ctx.lineTo(15, -25);
      ctx.lineTo(2, -16);
      ctx.fill();
    } else if (
      skin.id === 'golden_champion' ||
      skin.id === 'celestial_god' ||
      skin.id === 'angel_slayer' ||
      skin.id === 'eternal_monarch' ||
      skin.id === 'seraph_bane' ||
      skin.id === 'eclipse_valkyrie' ||
      skin.id === 'crimson_overlord' ||
      skin.id === 'omnipotent_one' ||
      skin.id === 'immortal_phoenix'
    ) {
      ctx.fillStyle = skin.accentColor;
      ctx.beginPath();
      ctx.moveTo(-7, -15);
      ctx.lineTo(0, -25);
      ctx.lineTo(7, -15);
      ctx.closePath();
      ctx.fill();
    } else if (
      skin.id === 'warbanner_breaker' ||
      skin.id === 'omega_forged' ||
      skin.id === 'chronos_sentinel' ||
      skin.id === 'arcane_archon'
    ) {
      ctx.strokeStyle = skin.accentColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 12.5, Math.PI * 0.72, Math.PI * 1.28);
      ctx.stroke();
    }

    // Visor
    ctx.fillStyle = skin.visorColor;
    ctx.beginPath();
    ctx.arc(5, 0, 7, -Math.PI * 0.42, Math.PI * 0.42);
    ctx.lineTo(2, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }, [skin, unlocked]);

  return <canvas ref={canvasRef} className="h-16 w-16 shrink-0" />;
}

export function SkinsModal({ progress, onSelectSkin, onClose }: SkinsModalProps) {
  const [tierFilter, setTierFilter] = useState<TierFilter>('Todas');

  const filteredSkins =
    tierFilter === 'Todas'
      ? SKIN_LIST
      : SKIN_LIST.filter((skin) => skin.tier === tierFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/82 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-amber-400" />
              <div>
                <h2 className="font-display text-xl font-bold text-white">
                  Skins y Logros del Centinela
                </h2>
                <p className="text-xs text-slate-400">
                  Desbloquea aspectos de rango Estándar, Élite, Maestro y Leyenda ·{' '}
                  <span className="font-mono tabular-nums text-amber-300">
                    {progress.unlockedSkins.length}/{SKIN_LIST.length}
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tier Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {TIER_FILTERS.map((tier) => {
              const count =
                tier === 'Todas'
                  ? SKIN_LIST.length
                  : SKIN_LIST.filter((s) => s.tier === tier).length;
              const active = tierFilter === tier;
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setTierFilter(tier)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? tier === 'Leyenda'
                        ? 'border-rose-400 bg-rose-500/20 text-rose-200'
                        : 'border-amber-400 bg-amber-500/20 text-amber-200'
                      : 'border-slate-700 bg-slate-950/60 text-slate-400 hover:text-white'
                  }`}
                >
                  {tier} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Skins Grid */}
        <div className="grid grid-cols-1 gap-3.5 overflow-y-auto p-6 sm:grid-cols-2">
          {filteredSkins.map((skin) => {
            const unlocked = progress.unlockedSkins.includes(skin.id);
            const selected = progress.selectedSkin === skin.id;
            const prog = getSkinProgressLabel(skin.id, progress);
            const tierColor =
              skin.tier === 'Leyenda'
                ? 'text-rose-300'
                : skin.tier === 'Maestro'
                  ? 'text-fuchsia-300'
                  : skin.tier === 'Élite'
                    ? 'text-amber-300'
                    : 'text-slate-400';

            return (
              <div
                key={skin.id}
                className={`flex flex-col justify-between gap-3 rounded-xl border p-4 transition-colors ${
                  selected
                    ? 'border-emerald-400 bg-emerald-950/25'
                    : unlocked
                      ? 'border-slate-700 bg-slate-950/60'
                      : skin.tier === 'Leyenda'
                        ? 'border-rose-950/60 bg-slate-950/50'
                        : 'border-slate-800/80 bg-slate-950/40'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/90 shrink-0">
                    <SkinAvatarPreview skin={skin} unlocked={unlocked} />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-base font-bold text-white truncate">
                        {skin.name}
                      </h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[11px] font-semibold ${tierColor}`}>
                          {skin.tier}
                        </span>
                        {!unlocked && <Lock className="h-3.5 w-3.5 text-slate-500" />}
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-amber-300">{skin.achievementTitle}</p>
                    <p className="text-xs leading-relaxed text-slate-400">{skin.achievementDesc}</p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-800/80 pt-3">
                  <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-400">
                    <span>Progreso del logro</span>
                    <span className={unlocked ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
                      {unlocked ? 'Completado' : prog.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full transition-all ${
                        unlocked ? 'bg-emerald-500' : skin.tier === 'Leyenda' ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.round(prog.ratio * 100)}%` }}
                    />
                  </div>

                  <button
                    type="button"
                    disabled={!unlocked || selected}
                    onClick={() => onSelectSkin(skin.id)}
                    className={`mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                      selected
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 cursor-default'
                        : unlocked
                          ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 cursor-pointer'
                          : 'bg-slate-800/70 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {selected ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Equipada</span>
                      </>
                    ) : unlocked ? (
                      <span>Equipar Skin</span>
                    ) : (
                      <span>Bloqueada</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
