import { useState } from 'react';
import { Award, Film, Play, Trophy } from 'lucide-react';
import { WEAPON_LIST } from '../data/weapons';

interface TitleScreenProps {
  bestScore: number;
  unlockedSkinsCount: number;
  totalSkinsCount: number;
  selectedSkinName: string;
  onStartStory: () => void;
  onStartDirect: () => void;
  onOpenSkins: () => void;
}

const BACKDROP_IMAGE = '/src/assets/images/dungeon_title_backdrop_1794921429564.jpg';

export function TitleScreen({
  bestScore,
  unlockedSkinsCount,
  totalSkinsCount,
  selectedSkinName,
  onStartStory,
  onStartDirect,
  onOpenSkins,
}: TitleScreenProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="fixed inset-0 z-30 flex items-center overflow-y-auto bg-slate-950">
      {/* Full-bleed atmospheric artwork with resilient CSS fallback */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/60">
        {!imgError && (
          <img
            src={BACKDROP_IMAGE}
            alt="Entrada antigua de la mazmorra iluminada por antorchas y niebla esmeralda"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover object-center opacity-85"
          />
        )}
        {/* Multi-layer directional contrast scrim */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/55" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-10 sm:px-10">
        <div className="max-w-2xl space-y-6">
          {/* Unboxed Metadata Line */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium tracking-wide text-slate-300">
            <span className="text-emerald-400 font-semibold">Mazmorra Arcade 2D</span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span>Aspecto: {selectedSkinName}</span>
            {bestScore > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono tabular-nums text-amber-400 font-semibold">
                  <Trophy className="h-3.5 w-3.5" />
                  <span>Mejor puntuación: {bestScore}</span>
                </span>
              </>
            )}
          </div>

          {/* Hero Headline & Narrative Hook */}
          <div className="space-y-3">
            <h1 className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              Slime Arena
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-slate-200 max-w-xl">
              Una grieta bajo el acantilado despertó slimes corrosivos, engendros explosivos y
              esqueletos segadores. Desciende a las profundidades, sobrevive cada oleada y forja
              el arsenal definitivo.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onStartStory}
              className="inline-flex items-center gap-2.5 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Film className="h-4 w-4" />
              <span>Iniciar Historia</span>
            </button>

            <button
              type="button"
              onClick={onStartDirect}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-600/80 bg-slate-900/75 px-5 py-3.5 text-sm font-semibold text-slate-100 backdrop-blur-sm transition-colors hover:border-slate-400 hover:bg-slate-800/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Entrar Directo</span>
            </button>

            <button
              type="button"
              onClick={onOpenSkins}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-500/45 bg-amber-950/50 px-5 py-3.5 text-sm font-semibold text-amber-200 backdrop-blur-sm transition-colors hover:border-amber-400 hover:bg-amber-900/60 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Award className="h-4 w-4 text-amber-400" />
              <span>
                Skins ({unlockedSkinsCount}/{totalSkinsCount})
              </span>
            </button>
          </div>

          {/* Clean Hairline Divider + Tactical Briefing */}
          <div className="grid grid-cols-1 gap-6 border-t border-white/15 pt-6 sm:grid-cols-2">
            <div className="space-y-2.5">
              <h2 className="text-xs font-semibold text-slate-400">Controles de Combate</h2>
              <ul className="space-y-1.5 text-xs text-slate-200">
                <li>
                  <span className="font-mono font-semibold text-white">W A S D</span> o Flechas ·
                  Moverse
                </li>
                <li>
                  <span className="font-mono font-semibold text-white">Mouse + Clic</span> · Apuntar
                  y disparar
                </li>
                <li>
                  <span className="font-mono font-semibold text-white">Espacio / Shift</span> ·
                  Impulso evasivo
                </li>
                <li>
                  <span className="font-mono font-semibold text-white">1 – 5</span> o Rueda ·
                  Cambiar de arma
                </li>
                <li>
                  <span className="font-mono font-semibold text-white">B</span> · Armería ·{' '}
                  <span className="font-mono font-semibold text-white">R</span> · Recargar
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h2 className="text-xs font-semibold text-slate-400">Armas y Proyectiles</h2>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {WEAPON_LIST.map((w) => (
                  <li key={w.id} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: w.color }}
                    />
                    <span className="font-medium text-white">{w.name}</span>
                    <span aria-hidden="true" className="text-slate-500">
                      ·
                    </span>
                    <span className="text-slate-300 truncate">{w.projectileName}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
