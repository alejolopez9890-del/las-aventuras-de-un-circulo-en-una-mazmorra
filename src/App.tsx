import { useCallback, useRef, useState } from 'react';
import { Play, RotateCcw, Trophy } from 'lucide-react';
import { soundEngine } from './audio/soundEngine';
import { ArmoryModal } from './components/ArmoryModal';
import { HudBar } from './components/HudBar';
import { LevelUpModal } from './components/LevelUpModal';
import { WeaponHotbar } from './components/WeaponHotbar';
import { LEVEL_UP_POOL, WEAPON_LIST, WEAPONS } from './data/weapons';
import { GameEngineHandle, SlimeArenaCanvas } from './game/SlimeArenaCanvas';
import { GameState, HudSnapshot, LevelUpUpgrade, PlayerStats, WeaponId } from './types/game';

const INITIAL_HUD: HudSnapshot = {
  stats: {
    hp: 100,
    maxHp: 100,
    level: 1,
    xp: 0,
    xpToNext: 105,
    coins: 0,
    score: 0,
    kills: 0,
    wave: 1,
    damageMultiplier: 1,
    fireRateMultiplier: 1,
    speedMultiplier: 1,
    speedUpgradeLevel: 0,
    magnetRadius: 115,
    rewardMultiplier: 1,
  },
  activeWeapon: 'pistol',
  weapons: {
    pistol: { unlocked: true, upgradeLevel: 1, ammo: WEAPONS.pistol.magSize, reloading: false, reloadProgress: 0 },
    shotgun: { unlocked: false, upgradeLevel: 1, ammo: WEAPONS.shotgun.magSize, reloading: false, reloadProgress: 0 },
    plasma: { unlocked: false, upgradeLevel: 1, ammo: WEAPONS.plasma.magSize, reloading: false, reloadProgress: 0 },
    grenade: { unlocked: false, upgradeLevel: 1, ammo: WEAPONS.grenade.magSize, reloading: false, reloadProgress: 0 },
    laser: { unlocked: false, upgradeLevel: 1, ammo: WEAPONS.laser.magSize, reloading: false, reloadProgress: 0 },
  },
  dashCooldownRatio: 0,
  bossInfo: null,
  slimesRemaining: 0,
  bleedRemaining: 0,
};

function pickThreeUpgrades(): LevelUpUpgrade[] {
  const pool = [...LEVEL_UP_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}

const BEST_SCORE_KEY = 'slime_arena_best_score';

export default function App() {
  const engineRef = useRef<GameEngineHandle | null>(null);
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [muted, setMuted] = useState(false);
  const [autoFire, setAutoFire] = useState(false);
  const [levelUpChoices, setLevelUpChoices] = useState<LevelUpUpgrade[]>([]);
  const [pendingLevel, setPendingLevel] = useState(1);
  const [finalStats, setFinalStats] = useState<PlayerStats | null>(null);
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(BEST_SCORE_KEY);
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const handleHudUpdate = useCallback((snapshot: HudSnapshot) => {
    setHud(snapshot);
  }, []);

  const handleLevelUp = useCallback((newLevel: number) => {
    setPendingLevel(newLevel);
    setLevelUpChoices(pickThreeUpgrades());
    setGameState('LEVEL_UP');
  }, []);

  const handleGameOver = useCallback((stats: PlayerStats) => {
    setFinalStats(stats);
    setBestScore((prev) => {
      const next = Math.max(prev, stats.score);
      try {
        localStorage.setItem(BEST_SCORE_KEY, String(next));
      } catch {
        // Ignore storage restrictions
      }
      return next;
    });
    setGameState('GAME_OVER');
  }, []);

  const handleOpenArmory = useCallback(() => {
    setGameState((prev) => {
      if (prev === 'PLAYING') return 'ARMORY';
      if (prev === 'ARMORY') return 'PLAYING';
      return prev;
    });
  }, []);

  const handleTogglePause = useCallback(() => {
    setGameState((prev) => {
      if (prev === 'PLAYING') return 'PAUSED';
      if (prev === 'PAUSED' || prev === 'ARMORY') return 'PLAYING';
      return prev;
    });
  }, []);

  const startNewGame = () => {
    engineRef.current?.resetGame();
    setFinalStats(null);
    setGameState('PLAYING');
  };

  const handleToggleMute = () => {
    const next = !muted;
    soundEngine.muted = next;
    setMuted(next);
  };

  const handleSelectWeapon = (id: WeaponId) => {
    engineRef.current?.selectWeapon(id);
  };

  const handleBuyWeapon = (id: WeaponId) => {
    engineRef.current?.buyWeapon(id);
  };

  const handleUpgradeWeapon = (id: WeaponId) => {
    engineRef.current?.upgradeWeapon(id);
  };

  const handleBuyMedkit = () => {
    engineRef.current?.buyMedkit();
  };

  const handleUpgradeSpeed = () => {
    engineRef.current?.upgradeSpeed();
  };

  const handleSelectLevelUpgrade = (upgradeId: string) => {
    engineRef.current?.applyLevelUpgrade(upgradeId);
    setGameState('PLAYING');
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* 60fps Game Canvas */}
      <SlimeArenaCanvas
        ref={engineRef}
        gameState={gameState}
        autoFire={autoFire}
        onHudUpdate={handleHudUpdate}
        onLevelUp={handleLevelUp}
        onGameOver={handleGameOver}
        onOpenArmory={handleOpenArmory}
        onTogglePause={handleTogglePause}
      />

      {/* Active HUD & Weapon Hotbar */}
      {gameState !== 'TITLE_MENU' && (
        <>
          <HudBar
            hud={hud}
            muted={muted}
            autoFire={autoFire}
            isPaused={gameState === 'PAUSED'}
            onToggleMute={handleToggleMute}
            onToggleAutoFire={() => setAutoFire((v) => !v)}
            onTogglePause={handleTogglePause}
            onOpenArmory={handleOpenArmory}
          />

          <WeaponHotbar
            hud={hud}
            onSelectWeapon={handleSelectWeapon}
            onOpenArmory={handleOpenArmory}
          />
        </>
      )}

      {/* Title Menu */}
      {gameState === 'TITLE_MENU' && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700/80 bg-slate-900/95 p-7 sm:p-9 shadow-2xl">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                Slime Arena
              </h1>
              {bestScore > 0 && (
                <div className="flex items-center gap-2 text-sm font-mono tabular-nums text-amber-400">
                  <Trophy className="h-4 w-4" />
                  <span>Mejor puntuación: {bestScore}</span>
                </div>
              )}
            </div>

            <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-300 max-w-xl">
              Enfréntate a hordas de slimes tenebrosos, esqueletos segadores con hoces letales y un
              jefe cada 2 oleadas. Al caer sueltan pocas monedas y experiencia: administra tu botín
              para subir de nivel y costear las armas más poderosas.
            </p>

            {/* Controls & Arsenal Summary */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 border-y border-slate-800 py-5">
              <div className="space-y-2">
                <h2 className="text-xs font-semibold text-slate-400">Controles de Combate</h2>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li>
                    <span className="font-mono text-slate-100">W A S D</span> o Flechas · Moverse
                  </li>
                  <li>
                    <span className="font-mono text-slate-100">Mouse + Clic</span> · Apuntar y disparar
                  </li>
                  <li>
                    <span className="font-mono text-slate-100">Espacio / Shift</span> · Impulso evasivo
                  </li>
                  <li>
                    <span className="font-mono text-slate-100">1 – 5</span> o Rueda · Cambiar de arma
                  </li>
                  <li>
                    <span className="font-mono text-slate-100">B</span> · Abrir Armería ·{' '}
                    <span className="font-mono text-slate-100">R</span> · Recargar
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h2 className="text-xs font-semibold text-slate-400">Armas y Proyectiles</h2>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {WEAPON_LIST.map((w) => (
                    <li key={w.id} className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: w.color }}
                      />
                      <span className="font-medium text-slate-100">{w.name}</span>
                      <span aria-hidden="true" className="text-slate-600">
                        ·
                      </span>
                      <span className="text-slate-400 truncate">{w.projectileName}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-slate-400">
                Tip: Acércate a los restos de slimes para atraer monedas y XP.
              </span>
              <button
                type="button"
                onClick={startNewGame}
                className="inline-flex items-center gap-2.5 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Iniciar Partida</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Armory Modal */}
      {gameState === 'ARMORY' && (
        <ArmoryModal
          hud={hud}
          onClose={() => setGameState('PLAYING')}
          onBuyWeapon={handleBuyWeapon}
          onUpgradeWeapon={handleUpgradeWeapon}
          onSelectWeapon={handleSelectWeapon}
          onBuyMedkit={handleBuyMedkit}
          onUpgradeSpeed={handleUpgradeSpeed}
        />
      )}

      {/* Level Up Modal */}
      {gameState === 'LEVEL_UP' && (
        <LevelUpModal
          newLevel={pendingLevel}
          choices={levelUpChoices}
          onSelectUpgrade={handleSelectLevelUpgrade}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'PAUSED' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center shadow-2xl">
            <h2 className="font-display text-2xl font-bold text-white">Juego en Pausa</h2>
            <p className="mt-1.5 text-sm text-slate-400">
              Oleada {hud.stats.wave} · Nivel {hud.stats.level} · {hud.stats.coins} monedas
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setGameState('PLAYING')}
                className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 cursor-pointer"
              >
                Continuar
              </button>
              <button
                type="button"
                onClick={() => setGameState('ARMORY')}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-700 cursor-pointer"
              >
                Abrir Armería
              </button>
              <button
                type="button"
                onClick={startNewGame}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Reiniciar Partida
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameState === 'GAME_OVER' && finalStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-7 shadow-2xl">
            <h2 className="font-display text-3xl font-extrabold text-white text-center">
              Fin de la Partida
            </h2>
            <p className="mt-1 text-center text-sm text-slate-400">
              Los slimes superaron tus defensas en la oleada {finalStats.wave}.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 border-y border-slate-800 py-5 font-mono tabular-nums">
              <div className="rounded-lg bg-slate-950/60 p-3">
                <div className="text-xs font-sans text-slate-400">Puntuación</div>
                <div className="mt-1 text-xl font-bold text-white">{finalStats.score}</div>
              </div>
              <div className="rounded-lg bg-slate-950/60 p-3">
                <div className="text-xs font-sans text-slate-400">Mejor Récord</div>
                <div className="mt-1 text-xl font-bold text-amber-400">{bestScore}</div>
              </div>
              <div className="rounded-lg bg-slate-950/60 p-3">
                <div className="text-xs font-sans text-slate-400">Slimes Eliminados</div>
                <div className="mt-1 text-xl font-bold text-emerald-400">{finalStats.kills}</div>
              </div>
              <div className="rounded-lg bg-slate-950/60 p-3">
                <div className="text-xs font-sans text-slate-400">Nivel Alcanzado</div>
                <div className="mt-1 text-xl font-bold text-sky-400">Nivel {finalStats.level}</div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={startNewGame}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Jugar de Nuevo</span>
              </button>
              <button
                type="button"
                onClick={() => setGameState('TITLE_MENU')}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-700 cursor-pointer"
              >
                Menú
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
