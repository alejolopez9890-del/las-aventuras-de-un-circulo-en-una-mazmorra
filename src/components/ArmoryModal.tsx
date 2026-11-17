import { ArrowUpRight, Check, Coins, Gauge, Heart, ShoppingBag, X } from 'lucide-react';
import {
  computeWeaponDamage,
  getSpeedUpgradeCost,
  getWeaponUpgradeCost,
  MEDKIT_COST,
  SPEED_UPGRADE_MAX_LEVEL,
  SPEED_UPGRADE_STEP,
  WEAPON_LIST,
  WEAPON_MAX_LEVEL,
} from '../data/weapons';
import { HudSnapshot, WeaponId } from '../types/game';

interface ArmoryModalProps {
  hud: HudSnapshot;
  onClose: () => void;
  onBuyWeapon: (id: WeaponId) => void;
  onUpgradeWeapon: (id: WeaponId) => void;
  onSelectWeapon: (id: WeaponId) => void;
  onBuyMedkit: () => void;
  onUpgradeSpeed: () => void;
}

export function ArmoryModal({
  hud,
  onClose,
  onBuyWeapon,
  onUpgradeWeapon,
  onSelectWeapon,
  onBuyMedkit,
  onUpgradeSpeed,
}: ArmoryModalProps) {
  const { stats, weapons, activeWeapon, bleedRemaining } = hud;
  const medkitCost = MEDKIT_COST;
  const isBleeding = bleedRemaining > 0;
  const canHeal = !isBleeding && stats.hp < stats.maxHp && stats.coins >= medkitCost;
  const speedLvl = stats.speedUpgradeLevel;
  const isMaxSpeed = speedLvl >= SPEED_UPGRADE_MAX_LEVEL;
  const speedCost = getSpeedUpgradeCost(speedLvl);
  const canUpgradeSpeed = !isMaxSpeed && stats.coins >= speedCost;
  const totalSpeedBonusPct = Math.round((stats.speedMultiplier - 1) * 100);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-amber-400" />
            <h2 className="font-display text-xl font-bold text-white">Armería y Mejoras</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-mono tabular-nums text-base font-bold text-amber-400">
              <Coins className="h-4 w-4" />
              <span>{stats.coins} monedas</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
              aria-label="Cerrar armería"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-5">
          {/* Operator Utility Strip: Medkit + Minimal Speed Upgrade */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Emergency Medkit */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Botiquín de Campo</h3>
                  <p className="text-xs text-slate-400">
                    {isBleeding ? (
                      <span className="text-red-400 font-medium">
                        Bloqueado por desangrado ({bleedRemaining.toFixed(1)}s)
                      </span>
                    ) : (
                      <>
                        Restaura +45 HP · Actual:{' '}
                        <span className="font-mono tabular-nums text-slate-200">
                          {Math.ceil(stats.hp)}/{stats.maxHp}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={!canHeal}
                onClick={onBuyMedkit}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  canHeal
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>{isBleeding ? 'Sin curación' : 'Curar (+45 HP)'}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{medkitCost} monedas</span>
              </button>
            </div>

            {/* Dedicated Minimal Speed Upgrade */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
                  <Gauge className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Velocidad Mejorada</h3>
                  <p className="text-xs text-slate-400">
                    Nivel{' '}
                    <span className="font-mono tabular-nums text-slate-200">
                      {speedLvl}/{SPEED_UPGRADE_MAX_LEVEL}
                    </span>{' '}
                    · Bono total:{' '}
                    <span className="font-mono tabular-nums text-sky-300">
                      +{totalSpeedBonusPct}%
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={!canUpgradeSpeed}
                onClick={onUpgradeSpeed}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  isMaxSpeed
                    ? 'bg-slate-800/60 text-slate-400 cursor-default'
                    : canUpgradeSpeed
                      ? 'bg-sky-500 text-slate-950 hover:bg-sky-400 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>
                  {isMaxSpeed
                    ? 'Máximo'
                    : `+${Math.round(SPEED_UPGRADE_STEP * 100)}% Vel · ${speedCost} monedas`}
                </span>
              </button>
            </div>
          </div>

          {/* Weapons Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {WEAPON_LIST.map((weapon) => {
              const prog = weapons[weapon.id];
              const isEquipped = activeWeapon === weapon.id;
              const upgradeCost = getWeaponUpgradeCost(weapon, prog.upgradeLevel);
              const isMaxLevel = prog.upgradeLevel >= WEAPON_MAX_LEVEL;
              const canAffordBuy = !prog.unlocked && stats.coins >= weapon.cost;
              const canAffordUpgrade =
                prog.unlocked && !isMaxLevel && stats.coins >= upgradeCost;
              const currentDamage = computeWeaponDamage(
                weapon,
                prog.upgradeLevel,
                stats.damageMultiplier,
                stats.wave
              );

              return (
                <div
                  key={weapon.id}
                  className={`flex flex-col justify-between gap-4 rounded-xl border p-4 transition-colors ${
                    isEquipped
                      ? 'border-slate-500 bg-slate-800/70'
                      : 'border-slate-800 bg-slate-950/50'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-sm"
                            style={{ backgroundColor: weapon.color }}
                          />
                          <h3 className="font-display text-base font-bold text-white">
                            {weapon.name}
                          </h3>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400">
                          Proyectil: {weapon.projectileName}
                          {prog.unlocked && (
                            <>
                              {' '}
                              · Nivel {prog.upgradeLevel}/{WEAPON_MAX_LEVEL}
                            </>
                          )}
                        </p>
                      </div>

                      <span className="font-mono tabular-nums text-xs text-slate-400">
                        Tecla {weapon.slot}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed text-slate-300">
                      {weapon.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400 font-mono tabular-nums">
                      <span>Daño: {currentDamage}</span>
                      <span aria-hidden="true">·</span>
                      <span>Cargador: {weapon.magSize}</span>
                      {weapon.pellets > 1 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{weapon.pellets} perdigones</span>
                        </>
                      )}
                      {weapon.explosionRadius > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Explosión de área</span>
                        </>
                      )}
                      {weapon.pierce > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Perfora {weapon.pierce + 1}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    {!prog.unlocked ? (
                      <button
                        type="button"
                        disabled={!canAffordBuy}
                        onClick={() => onBuyWeapon(weapon.id)}
                        className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                          canAffordBuy
                            ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Coins className="h-3.5 w-3.5" />
                        <span>Desbloquear por {weapon.cost} monedas</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onSelectWeapon(weapon.id)}
                          disabled={isEquipped}
                          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                            isEquipped
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 cursor-default'
                              : 'bg-slate-800 text-slate-100 hover:bg-slate-700 cursor-pointer'
                          }`}
                        >
                          {isEquipped && <Check className="h-3.5 w-3.5" />}
                          <span>{isEquipped ? 'Equipada' : 'Equipar'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={!canAffordUpgrade || isMaxLevel}
                          onClick={() => onUpgradeWeapon(weapon.id)}
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                            isMaxLevel
                              ? 'bg-slate-800/60 text-slate-400 cursor-default'
                              : canAffordUpgrade
                                ? 'bg-sky-500 text-slate-950 hover:bg-sky-400 cursor-pointer'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          <span>
                            {isMaxLevel
                              ? 'Nivel Máximo'
                              : `Mejorar +30% Daño / +6% Vel (${upgradeCost} monedas)`}
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/60 px-6 py-3">
          <span className="text-xs text-slate-400">
            Atajo rápido: pulsa B para abrir o cerrar la armería.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-white cursor-pointer"
          >
            Volver al Combate
          </button>
        </div>
      </div>
    </div>
  );
}
