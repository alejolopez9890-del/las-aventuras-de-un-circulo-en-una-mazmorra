import { useCallback, useEffect, useRef, useState } from 'react';
import { Award, RotateCcw } from 'lucide-react';
import { soundEngine } from './audio/soundEngine';
import { ArmoryModal } from './components/ArmoryModal';
import { DeathCinematic } from './components/DeathCinematic';
import { DivineReviveCinematic } from './components/DivineReviveCinematic';
import { EnemyRevealCinematic } from './components/EnemyRevealCinematic';
import { HudBar } from './components/HudBar';
import { IntroCinematic } from './components/IntroCinematic';
import { LevelUpModal } from './components/LevelUpModal';
import { SkinsModal } from './components/SkinsModal';
import { TitleScreen } from './components/TitleScreen';
import { WeaponHotbar } from './components/WeaponHotbar';
import {
  evaluateSkinUnlocks,
  loadProgress,
  saveProgress,
  SKIN_LIST,
  SKINS,
} from './data/skins';
import { LEVEL_UP_POOL, WEAPONS } from './data/weapons';
import {
  GameEngineHandle,
  ProgressEventPayload,
  SlimeArenaCanvas,
} from './game/SlimeArenaCanvas';
import {
  EnemyRevealId,
  GameState,
  HudSnapshot,
  LevelUpUpgrade,
  PersistentProgress,
  PlayerStats,
  SkinId,
  WeaponId,
} from './types/game';

const INITIAL_HUD: HudSnapshot = {
  stats: {
    hp: 150,
    maxHp: 150,
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
  stunRemaining: 0,
  fallenAngelAlert: null,
  weaponBuffs: {
    damageRemaining: 0,
    explosiveRemaining: 0,
    infiniteRemaining: 0,
  },
};

function pickThreeUpgrades(): LevelUpUpgrade[] {
  const pool = [...LEVEL_UP_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}

export default function App() {
  const engineRef = useRef<GameEngineHandle | null>(null);
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [muted, setMuted] = useState(false);
  const [autoFire, setAutoFire] = useState(false);
  const [levelUpChoices, setLevelUpChoices] = useState<LevelUpUpgrade[]>([]);
  const [pendingLevel, setPendingLevel] = useState(1);
  const [pendingEnemyReveal, setPendingEnemyReveal] = useState<{
    enemyId: EnemyRevealId;
    wave: number;
  } | null>(null);
  const [reviveWave, setReviveWave] = useState(1);
  const [reviveBonusCoins, setReviveBonusCoins] = useState(0);
  const [finalStats, setFinalStats] = useState<PlayerStats | null>(null);
  const [progress, setProgress] = useState<PersistentProgress>(() => loadProgress());
  const [showSkinsModal, setShowSkinsModal] = useState(false);
  const [unlockedToastQueue, setUnlockedToastQueue] = useState<SkinId[]>([]);

  useEffect(() => {
    if (unlockedToastQueue.length === 0) return;
    const timer = window.setTimeout(() => {
      setUnlockedToastQueue((prev) => prev.slice(1));
    }, 4400);
    return () => window.clearTimeout(timer);
  }, [unlockedToastQueue]);

  const applyProgressUpdate = useCallback(
    (updater: (prev: PersistentProgress) => PersistentProgress) => {
      setProgress((prev) => {
        const updated = updater(prev);
        const { nextProgress, newlyUnlocked } = evaluateSkinUnlocks(updated);
        saveProgress(nextProgress);
        if (newlyUnlocked.length > 0) {
          soundEngine.playAchievement();
          setUnlockedToastQueue((q) => [...q, ...newlyUnlocked]);
        }
        return nextProgress;
      });
    },
    []
  );

  const handleProgressEvent = useCallback(
    (ev: ProgressEventPayload) => {
      if (
        !ev.kills &&
        !ev.bosses &&
        !ev.fallenAngelsKilled &&
        !ev.reapersKilled &&
        !ev.zombieLeadersKilled &&
        !ev.wave &&
        !ev.level &&
        !ev.weaponsUnlocked &&
        !ev.weaponUpgradeLevel &&
        !ev.score
      ) {
        return;
      }
      applyProgressUpdate((prev) => ({
        ...prev,
        bestScore: Math.max(prev.bestScore, ev.score ?? 0),
        totalKills: prev.totalKills + (ev.kills ?? 0),
        bossesDefeated: prev.bossesDefeated + (ev.bosses ?? 0),
        fallenAngelsKilled: prev.fallenAngelsKilled + (ev.fallenAngelsKilled ?? 0),
        reapersKilled: prev.reapersKilled + (ev.reapersKilled ?? 0),
        zombieLeadersKilled: prev.zombieLeadersKilled + (ev.zombieLeadersKilled ?? 0),
        maxWeaponUpgradeLevel: Math.max(
          prev.maxWeaponUpgradeLevel,
          ev.weaponUpgradeLevel ?? 1
        ),
        maxWave: Math.max(prev.maxWave, ev.wave ?? 1),
        maxLevel: Math.max(prev.maxLevel, ev.level ?? 1),
        maxWeaponsUnlocked: Math.max(prev.maxWeaponsUnlocked, ev.weaponsUnlocked ?? 1),
      }));
    },
    [applyProgressUpdate]
  );

  const handleHudUpdate = useCallback((snapshot: HudSnapshot) => {
    setHud(snapshot);
  }, []);

  const handleLevelUp = useCallback((newLevel: number) => {
    setPendingLevel(newLevel);
    setLevelUpChoices(pickThreeUpgrades());
    setGameState('LEVEL_UP');
  }, []);

  const handleNewEnemyReveal = useCallback((enemyId: EnemyRevealId, wave: number) => {
    setPendingEnemyReveal({ enemyId, wave });
    setGameState('ENEMY_REVEAL');
  }, []);

  const handleDivineRevive = useCallback(
    (waveReached: number, bonusCoins: number) => {
      setReviveWave(waveReached);
      setReviveBonusCoins(bonusCoins);
      applyProgressUpdate((prev) => ({
        ...prev,
        divineRevives: prev.divineRevives + 1,
      }));
      setGameState('DIVINE_REVIVE');
    },
    [applyProgressUpdate]
  );

  const handleGameOver = useCallback(
    (stats: PlayerStats) => {
      setFinalStats(stats);
      applyProgressUpdate((prev) => ({
        ...prev,
        bestScore: Math.max(prev.bestScore, stats.score),
        maxWave: Math.max(prev.maxWave, stats.wave),
        maxLevel: Math.max(prev.maxLevel, stats.level),
      }));
      setGameState('DEATH_CINEMATIC');
    },
    [applyProgressUpdate]
  );

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

  const startNewGame = useCallback(() => {
    engineRef.current?.resetGame();
    setFinalStats(null);
    setShowSkinsModal(false);
    setGameState('PLAYING');
  }, []);

  const startStoryCinematic = useCallback(() => {
    engineRef.current?.resetGame();
    setFinalStats(null);
    setShowSkinsModal(false);
    setGameState('CINEMATIC');
  }, []);

  const handleSelectSkin = useCallback(
    (skinId: SkinId) => {
      applyProgressUpdate((prev) =>
        prev.unlockedSkins.includes(skinId) ? { ...prev, selectedSkin: skinId } : prev
      );
    },
    [applyProgressUpdate]
  );

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

  const activeToastSkin = unlockedToastQueue.length > 0 ? SKINS[unlockedToastQueue[0]] : null;
  const selectedSkinInfo = SKINS[progress.selectedSkin] ?? SKINS.sentinel;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* 60fps Game Canvas */}
      <SlimeArenaCanvas
        ref={engineRef}
        gameState={gameState}
        autoFire={autoFire}
        selectedSkin={progress.selectedSkin}
        onHudUpdate={handleHudUpdate}
        onLevelUp={handleLevelUp}
        onNewEnemyReveal={handleNewEnemyReveal}
        onDivineRevive={handleDivineRevive}
        onProgressEvent={handleProgressEvent}
        onGameOver={handleGameOver}
        onOpenArmory={handleOpenArmory}
        onTogglePause={handleTogglePause}
      />

      {/* Non-intrusive Skin & Achievement Unlock Notification */}
      {activeToastSkin && (
        <div className="pointer-events-none fixed right-4 top-20 z-50 flex max-w-xs items-center gap-3 rounded-xl border border-amber-400/60 bg-slate-900/95 px-4 py-3 shadow-2xl backdrop-blur-sm">
          <Award className="h-5 w-5 shrink-0 text-amber-400" />
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-amber-300">
              Logro: {activeToastSkin.achievementTitle}
            </div>
            <div className="truncate text-sm font-bold text-white">
              Skin desbloqueada · {activeToastSkin.name}
            </div>
          </div>
        </div>
      )}

      {/* Active HUD & Weapon Hotbar */}
      {gameState !== 'TITLE_MENU' &&
        gameState !== 'CINEMATIC' &&
        gameState !== 'ENEMY_REVEAL' &&
        gameState !== 'DIVINE_REVIVE' &&
        gameState !== 'DEATH_CINEMATIC' && (
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

      {/* Title Screen */}
      {gameState === 'TITLE_MENU' && (
        <TitleScreen
          bestScore={progress.bestScore}
          unlockedSkinsCount={progress.unlockedSkins.length}
          totalSkinsCount={SKIN_LIST.length}
          selectedSkinName={selectedSkinInfo.name}
          onStartStory={startStoryCinematic}
          onStartDirect={startNewGame}
          onOpenSkins={() => setShowSkinsModal(true)}
        />
      )}

      {/* Animated Intro Story Cinematic */}
      {gameState === 'CINEMATIC' && <IntroCinematic onComplete={startNewGame} />}

      {/* Mini Story Cinematic for New Enemy Introductions */}
      {gameState === 'ENEMY_REVEAL' && pendingEnemyReveal && (
        <EnemyRevealCinematic
          enemyId={pendingEnemyReveal.enemyId}
          wave={pendingEnemyReveal.wave}
          onComplete={() => {
            setPendingEnemyReveal(null);
            setGameState('PLAYING');
          }}
        />
      )}

      {/* Rare 5% / 1% (+1000 coins) Divine Revival Story Cinematic */}
      {gameState === 'DIVINE_REVIVE' && (
        <DivineReviveCinematic
          waveReached={reviveWave}
          bonusCoins={reviveBonusCoins}
          onComplete={() => {
            engineRef.current?.revivePlayer(reviveBonusCoins);
            setGameState('PLAYING');
          }}
        />
      )}

      {/* Defeat Story Cinematic before Game Over Summary */}
      {gameState === 'DEATH_CINEMATIC' && finalStats && (
        <DeathCinematic
          waveReached={finalStats.wave}
          onComplete={() => setGameState('GAME_OVER')}
        />
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
      {gameState === 'PAUSED' && !showSkinsModal && (
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
                onClick={() => setShowSkinsModal(true)}
                className="w-full rounded-lg border border-amber-500/40 bg-amber-950/40 px-4 py-2.5 text-sm font-semibold text-amber-200 hover:bg-amber-900/50 cursor-pointer"
              >
                Skins y Logros ({progress.unlockedSkins.length}/{SKIN_LIST.length})
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
      {gameState === 'GAME_OVER' && finalStats && !showSkinsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-7 shadow-2xl">
            <h2 className="font-display text-3xl font-extrabold text-white text-center">
              Fin de la Partida
            </h2>
            <p className="mt-1 text-center text-sm text-slate-400">
              Caíste en la oleada {finalStats.wave} antes de rescatar a tu familiar.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 border-y border-slate-800 py-5 font-mono tabular-nums">
              <div className="rounded-lg bg-slate-950/60 p-3">
                <div className="text-xs font-sans text-slate-400">Puntuación</div>
                <div className="mt-1 text-xl font-bold text-white">{finalStats.score}</div>
              </div>
              <div className="rounded-lg bg-slate-950/60 p-3">
                <div className="text-xs font-sans text-slate-400">Mejor Récord</div>
                <div className="mt-1 text-xl font-bold text-amber-400">{progress.bestScore}</div>
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

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={startNewGame}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Jugar de Nuevo</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSkinsModal(true)}
                className="rounded-xl border border-amber-500/40 bg-amber-950/40 px-4 py-3 text-sm font-semibold text-amber-200 hover:bg-amber-900/50 whitespace-nowrap cursor-pointer"
              >
                Skins ({progress.unlockedSkins.length}/{SKIN_LIST.length})
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

      {/* Skins & Achievements Modal */}
      {showSkinsModal && (
        <SkinsModal
          progress={progress}
          onSelectSkin={handleSelectSkin}
          onClose={() => setShowSkinsModal(false)}
        />
      )}
    </div>
  );
}
