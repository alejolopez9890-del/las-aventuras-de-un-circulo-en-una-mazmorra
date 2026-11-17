import { Lock } from 'lucide-react';
import { WEAPON_LIST, WEAPONS } from '../data/weapons';
import { HudSnapshot, WeaponId } from '../types/game';

interface WeaponHotbarProps {
  hud: HudSnapshot;
  onSelectWeapon: (id: WeaponId) => void;
  onOpenArmory: () => void;
}

export function WeaponHotbar({ hud, onSelectWeapon, onOpenArmory }: WeaponHotbarProps) {
  const activeDef = WEAPONS[hud.activeWeapon];
  const activeProg = hud.weapons[hud.activeWeapon];
  const dashReady = hud.dashCooldownRatio <= 0.01;
  const speedBonusPct = Math.round((hud.stats.speedMultiplier - 1) * 100);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 p-3 sm:p-4">
      {/* Active weapon & Dash status line */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs text-slate-300 bg-slate-900/85 border border-slate-700/70 rounded-lg px-3.5 py-1.5 backdrop-blur-sm">
        <span className="font-semibold text-slate-100">{activeDef.name}</span>
        <span aria-hidden="true" className="text-slate-600">
          ·
        </span>
        <span className="text-slate-400">{activeDef.projectileName}</span>
        <span aria-hidden="true" className="text-slate-600">
          ·
        </span>
        <span className="font-mono tabular-nums text-slate-200">
          {hud.weaponBuffs.infiniteRemaining > 0
            ? 'Munición ∞'
            : activeProg.reloading
              ? `Recargando ${Math.round(activeProg.reloadProgress * 100)}%`
              : `Munición ${activeProg.ammo}/${activeDef.magSize}`}
        </span>
        <span aria-hidden="true" className="text-slate-600">
          ·
        </span>
        <span
          className={`font-mono tabular-nums ${
            dashReady ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          {dashReady ? 'Impulso (Espacio): Listo' : 'Impulso: Cargando'}
        </span>
        <span aria-hidden="true" className="text-slate-600">
          ·
        </span>
        <span className="font-mono tabular-nums text-sky-300">
          Vel +{speedBonusPct}%
        </span>
      </div>

      {/* 5 Weapon Slots */}
      <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 p-1.5 shadow-lg backdrop-blur-sm">
        {WEAPON_LIST.map((weapon) => {
          const prog = hud.weapons[weapon.id];
          const isActive = hud.activeWeapon === weapon.id;

          return (
            <button
              key={weapon.id}
              type="button"
              onClick={() => {
                if (prog.unlocked) {
                  onSelectWeapon(weapon.id);
                } else {
                  onOpenArmory();
                }
              }}
              className={`relative flex min-w-[104px] sm:min-w-[126px] flex-col items-start gap-1 rounded-lg border px-3 py-2 text-left transition-colors cursor-pointer ${
                isActive
                  ? 'border-slate-400 bg-slate-800 text-white'
                  : prog.unlocked
                    ? 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                    : 'border-slate-800/70 bg-slate-950/60 text-slate-500 hover:border-slate-700'
              }`}
            >
              <div className="flex w-full items-center justify-between gap-2 text-xs">
                <span className="font-mono tabular-nums text-slate-400">[{weapon.slot}]</span>
                {prog.unlocked ? (
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: weapon.color }}
                  />
                ) : (
                  <span className="flex items-center gap-1 font-mono tabular-nums text-amber-500/90">
                    <Lock className="h-3 w-3" />
                    {weapon.cost}
                  </span>
                )}
              </div>

              <span className="w-full truncate text-xs font-semibold">{weapon.name}</span>

              <div className="flex w-full items-center justify-between text-[11px] text-slate-400">
                <span className="truncate">{weapon.projectileName}</span>
                {prog.unlocked && (
                  <span className="font-mono tabular-nums text-slate-300 ml-1">
                    N{prog.upgradeLevel}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
