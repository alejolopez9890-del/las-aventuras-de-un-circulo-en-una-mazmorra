import { Coins, Crosshair, Pause, Play, ShoppingBag, Volume2, VolumeX } from 'lucide-react';
import { HudSnapshot } from '../types/game';

interface HudBarProps {
  hud: HudSnapshot;
  muted: boolean;
  autoFire: boolean;
  isPaused: boolean;
  onToggleMute: () => void;
  onToggleAutoFire: () => void;
  onTogglePause: () => void;
  onOpenArmory: () => void;
}

export function HudBar({
  hud,
  muted,
  autoFire,
  isPaused,
  onToggleMute,
  onToggleAutoFire,
  onTogglePause,
  onOpenArmory,
}: HudBarProps) {
  const {
    stats,
    bossInfo,
    slimesRemaining,
    bleedRemaining,
    stunRemaining,
    fallenAngelAlert,
    weaponBuffs,
  } = hud;
  const hpPct = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));
  const xpPct = Math.max(0, Math.min(100, (stats.xp / stats.xpToNext) * 100));
  const isBleeding = bleedRemaining > 0;
  const isStunned = stunRemaining > 0;
  const hasWeaponBuffs =
    weaponBuffs.damageRemaining > 0 ||
    weaponBuffs.explosiveRemaining > 0 ||
    weaponBuffs.infiniteRemaining > 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-20 flex flex-col items-center gap-2 p-3 sm:p-4">
      <header className="pointer-events-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-700/80 bg-slate-900/90 px-4 py-2.5 shadow-lg backdrop-blur-sm">
        {/* Left: HP & Level XP */}
        <div className="flex flex-wrap items-center gap-5">
          {/* Health */}
          <div className="flex flex-col gap-1 min-w-[148px]">
            <div className="flex items-center justify-between text-xs font-medium text-slate-300">
              <span className={isBleeding ? 'text-red-400 font-semibold' : ''}>
                {isBleeding ? 'Desangrado' : 'Salud'}
              </span>
              <span className="font-mono tabular-nums text-slate-100">
                {Math.ceil(stats.hp)}/{stats.maxHp}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded bg-slate-800">
              <div
                className={`h-full transition-all duration-150 ${
                  isBleeding
                    ? 'bg-red-600 animate-pulse'
                    : hpPct > 35
                      ? 'bg-rose-500'
                      : 'bg-red-600'
                }`}
                style={{ width: `${hpPct}%` }}
              />
            </div>
          </div>

          {/* Level & XP */}
          <div className="flex flex-col gap-1 min-w-[175px]">
            <div className="flex items-center justify-between text-xs font-medium text-slate-300">
              <span className="text-emerald-400 font-semibold">Nivel {stats.level}</span>
              <span className="font-mono tabular-nums text-slate-300">
                {stats.xp}/{stats.xpToNext} XP
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded bg-slate-800">
              <div
                className="h-full bg-emerald-500 transition-all duration-150"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Unboxed Tabular Stats */}
        <div className="flex items-center gap-4 text-sm text-slate-300">
          <div className="flex items-center gap-1.5 font-mono tabular-nums font-semibold text-amber-400">
            <Coins className="h-4 w-4 shrink-0" />
            <span>{stats.coins}</span>
          </div>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <div className="font-mono tabular-nums whitespace-nowrap">
            Oleada <span className="font-bold text-slate-100">{stats.wave}</span>
          </div>
          <span aria-hidden="true" className="text-slate-600 hidden sm:inline">
            ·
          </span>
          <div className="hidden sm:block font-mono tabular-nums whitespace-nowrap text-slate-400">
            Enemigos <span className="text-slate-200">{slimesRemaining}</span>
          </div>
          <span aria-hidden="true" className="text-slate-600 hidden md:inline">
            ·
          </span>
          <div className="hidden md:block font-mono tabular-nums whitespace-nowrap text-slate-400">
            Puntos <span className="text-slate-200">{stats.score}</span>
          </div>
        </div>

        {/* Right: Functional Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenArmory}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Armería (B)</span>
          </button>

          <button
            type="button"
            onClick={onToggleAutoFire}
            title="Activar o desactivar disparo automático"
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              autoFire
                ? 'border-sky-500/70 bg-sky-500/20 text-sky-200'
                : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Crosshair className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Auto-disparo</span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white cursor-pointer"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={onTogglePause}
            aria-label={isPaused ? 'Reanudar' : 'Pausar'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white cursor-pointer"
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Active 10s Weapon Powerups */}
      {hasWeaponBuffs && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {weaponBuffs.damageRemaining > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-400/70 bg-rose-950/90 px-3.5 py-1.5 text-xs font-semibold text-rose-200 shadow-md backdrop-blur-sm">
              <span>Daño x2</span>
              <span aria-hidden="true" className="opacity-60">
                ·
              </span>
              <span className="font-mono tabular-nums text-white">
                {weaponBuffs.damageRemaining.toFixed(1)}s
              </span>
            </div>
          )}
          {weaponBuffs.explosiveRemaining > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-orange-400/70 bg-orange-950/90 px-3.5 py-1.5 text-xs font-semibold text-orange-200 shadow-md backdrop-blur-sm">
              <span>Disparo Explosivo</span>
              <span aria-hidden="true" className="opacity-60">
                ·
              </span>
              <span className="font-mono tabular-nums text-white">
                {weaponBuffs.explosiveRemaining.toFixed(1)}s
              </span>
            </div>
          )}
          {weaponBuffs.infiniteRemaining > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-sky-400/70 bg-sky-950/90 px-3.5 py-1.5 text-xs font-semibold text-sky-200 shadow-md backdrop-blur-sm">
              <span>Balas Infinitas</span>
              <span aria-hidden="true" className="opacity-60">
                ·
              </span>
              <span className="font-mono tabular-nums text-white">
                {weaponBuffs.infiniteRemaining.toFixed(1)}s
              </span>
            </div>
          )}
        </div>
      )}

      {/* Active Fallen Angel 30s Judgment Alert */}
      {fallenAngelAlert && (
        <div
          className={`flex items-center gap-3 rounded-lg border px-4 py-1.5 text-xs font-semibold shadow-md backdrop-blur-sm ${
            fallenAngelAlert.curseActive
              ? 'border-rose-500/80 bg-rose-950/90 text-rose-200 animate-pulse'
              : 'border-amber-400/70 bg-amber-950/90 text-amber-200'
          }`}
        >
          <span>
            {fallenAngelAlert.activeCount > 1
              ? `Ángeles Caídos (${fallenAngelAlert.activeCount})`
              : 'Ángel Caído'}
          </span>
          <span aria-hidden="true" className="opacity-60">
            ·
          </span>
          {fallenAngelAlert.curseActive ? (
            <>
              <span>Juicio Activo (2 golpes = Vida)</span>
              <span aria-hidden="true" className="opacity-60">
                ·
              </span>
              <span className="font-mono tabular-nums text-white">
                Próximo golpe en {fallenAngelAlert.nextStrikeIn.toFixed(1)}s
              </span>
            </>
          ) : (
            <>
              <span>Elimínalo antes de</span>
              <span className="font-mono tabular-nums text-white">
                {fallenAngelAlert.minDoomRemaining.toFixed(1)}s
              </span>
            </>
          )}
        </div>
      )}

      {/* Active Stun Alert from Zombie Leader */}
      {isStunned && (
        <div className="flex items-center gap-3 rounded-lg border border-lime-400/70 bg-lime-950/90 px-4 py-1.5 text-xs font-semibold text-lime-200 shadow-md backdrop-blur-sm">
          <span>Aturdido contra el muro</span>
          <span aria-hidden="true" className="text-lime-400/70">
            ·
          </span>
          <span>Inmovilizado</span>
          <span aria-hidden="true" className="text-lime-400/70">
            ·
          </span>
          <span className="font-mono tabular-nums text-lime-100">
            {stunRemaining.toFixed(1)}s
          </span>
        </div>
      )}

      {/* Active Scythe Bleed & Slow Debuff Alert */}
      {isBleeding && (
        <div className="flex items-center gap-3 rounded-lg border border-red-500/60 bg-red-950/85 px-4 py-1.5 text-xs font-semibold text-red-200 shadow-md backdrop-blur-sm">
          <span>Hemorragia por Hoz</span>
          <span aria-hidden="true" className="text-red-400/70">
            ·
          </span>
          <span>Velocidad -50%</span>
          <span aria-hidden="true" className="text-red-400/70">
            ·
          </span>
          <span>Sin curación</span>
          <span aria-hidden="true" className="text-red-400/70">
            ·
          </span>
          <span className="font-mono tabular-nums text-red-100">
            {bleedRemaining.toFixed(1)}s
          </span>
        </div>
      )}

      {/* Boss Health Bar */}
      {bossInfo && (
        <div className="w-full max-w-lg rounded-lg border border-pink-500/40 bg-slate-900/90 px-4 py-2 shadow-md">
          <div className="mb-1 flex items-center justify-between text-xs font-semibold text-pink-200">
            <span>{bossInfo.name}</span>
            <span className="font-mono tabular-nums">
              {bossInfo.hp}/{bossInfo.maxHp} HP
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded bg-slate-800">
            <div
              className="h-full bg-pink-500 transition-all duration-100"
              style={{
                width: `${Math.max(0, Math.min(100, (bossInfo.hp / bossInfo.maxHp) * 100))}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
