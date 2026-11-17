import { ArrowUpCircle } from 'lucide-react';
import { LevelUpUpgrade } from '../types/game';

interface LevelUpModalProps {
  newLevel: number;
  choices: LevelUpUpgrade[];
  onSelectUpgrade: (upgradeId: string) => void;
}

const ACCENT_CLASSES: Record<LevelUpUpgrade['accent'], string> = {
  emerald: 'border-emerald-500/40 hover:border-emerald-400 bg-slate-900',
  amber: 'border-amber-500/40 hover:border-amber-400 bg-slate-900',
  sky: 'border-sky-500/40 hover:border-sky-400 bg-slate-900',
  rose: 'border-rose-500/40 hover:border-rose-400 bg-slate-900',
};

const STAT_TEXT_CLASSES: Record<LevelUpUpgrade['accent'], string> = {
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  sky: 'text-sky-400',
  rose: 'text-rose-400',
};

export function LevelUpModal({ newLevel, choices, onSelectUpgrade }: LevelUpModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 p-6 sm:p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <ArrowUpCircle className="h-7 w-7" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
            Subiste al Nivel {newLevel}
          </h2>
          <p className="mt-1.5 text-sm text-slate-400">
            Elige una mejora permanente para fortalecer a tu personaje.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {choices.map((upgrade) => (
            <button
              key={upgrade.id}
              type="button"
              onClick={() => onSelectUpgrade(upgrade.id)}
              className={`group flex flex-col justify-between gap-4 rounded-xl border p-5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:bg-slate-800/90 focus-visible:outline-2 focus-visible:outline-emerald-400 cursor-pointer ${
                ACCENT_CLASSES[upgrade.accent]
              }`}
            >
              <div className="space-y-2">
                <span
                  className={`block text-xs font-mono font-semibold ${
                    STAT_TEXT_CLASSES[upgrade.accent]
                  }`}
                >
                  {upgrade.statTag}
                </span>
                <h3 className="font-display text-lg font-bold text-white">
                  {upgrade.title}
                </h3>
                <p className="text-xs leading-relaxed text-slate-300">
                  {upgrade.summary}
                </p>
              </div>

              <span className="inline-flex items-center text-xs font-semibold text-slate-200 group-hover:text-white">
                Elegir mejora →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
