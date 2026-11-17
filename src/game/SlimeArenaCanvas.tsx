import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { soundEngine } from '../audio/soundEngine';
import {
  getSpeedUpgradeCost,
  getWeaponUpgradeCost,
  MEDKIT_COST,
  SPEED_UPGRADE_MAX_LEVEL,
  SPEED_UPGRADE_STEP,
  WEAPON_LIST,
  WEAPONS,
} from '../data/weapons';
import {
  BossZone,
  FloatingText,
  GameState,
  HudSnapshot,
  Particle,
  Pickup,
  PlayerStats,
  Projectile,
  Slime,
  SlimeVariant,
  WeaponId,
  WeaponProgress,
  ZoneHazard,
} from '../types/game';

export interface GameEngineHandle {
  resetGame: () => void;
  selectWeapon: (id: WeaponId) => void;
  buyWeapon: (id: WeaponId) => boolean;
  upgradeWeapon: (id: WeaponId) => boolean;
  buyMedkit: () => boolean;
  upgradeSpeed: () => boolean;
  applyLevelUpgrade: (upgradeId: string) => void;
}

interface SlimeArenaCanvasProps {
  gameState: GameState;
  autoFire: boolean;
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onLevelUp: (newLevel: number) => void;
  onGameOver: (finalStats: PlayerStats) => void;
  onOpenArmory: () => void;
  onTogglePause: () => void;
}

const WORLD_WIDTH = 1700;
const WORLD_HEIGHT = 1150;
const PLAYER_RADIUS = 18;
const BASE_PLAYER_SPEED = 245;
const DASH_COOLDOWN = 2.0;
const DASH_DURATION = 0.16;
const DASH_SPEED = 740;

function createInitialWeapons(): Record<WeaponId, WeaponProgress> {
  return {
    pistol: {
      unlocked: true,
      upgradeLevel: 1,
      ammo: WEAPONS.pistol.magSize,
      reloading: false,
      reloadProgress: 0,
    },
    shotgun: {
      unlocked: false,
      upgradeLevel: 1,
      ammo: WEAPONS.shotgun.magSize,
      reloading: false,
      reloadProgress: 0,
    },
    plasma: {
      unlocked: false,
      upgradeLevel: 1,
      ammo: WEAPONS.plasma.magSize,
      reloading: false,
      reloadProgress: 0,
    },
    grenade: {
      unlocked: false,
      upgradeLevel: 1,
      ammo: WEAPONS.grenade.magSize,
      reloading: false,
      reloadProgress: 0,
    },
    laser: {
      unlocked: false,
      upgradeLevel: 1,
      ammo: WEAPONS.laser.magSize,
      reloading: false,
      reloadProgress: 0,
    },
  };
}

function createInitialStats(): PlayerStats {
  return {
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
  };
}

function createBossZones(): BossZone[] {
  return [
    {
      id: 1,
      name: 'Fosa Carmesí',
      x: 420,
      y: 320,
      radius: 225,
      active: false,
      pulsePhase: 0,
      eruptionTimer: 1.6,
      color: '#991B1B',
      glowColor: '#EF4444',
    },
    {
      id: 2,
      name: 'Altar del Vacío',
      x: 1280,
      y: 330,
      radius: 225,
      active: false,
      pulsePhase: 1.4,
      eruptionTimer: 1.6,
      color: '#5B21B6',
      glowColor: '#A855F7',
    },
    {
      id: 3,
      name: 'Nido Pestilente',
      x: 850,
      y: 860,
      radius: 235,
      active: false,
      pulsePhase: 2.8,
      eruptionTimer: 1.6,
      color: '#166534',
      glowColor: '#22C55E',
    },
  ];
}

export const SlimeArenaCanvas = React.forwardRef<GameEngineHandle, SlimeArenaCanvasProps>(
  function SlimeArenaCanvas(
    {
      gameState,
      autoFire,
      onHudUpdate,
      onLevelUp,
      onGameOver,
      onOpenArmory,
      onTogglePause,
    },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const gameStateRef = useRef<GameState>(gameState);
    const autoFireRef = useRef<boolean>(autoFire);

    useEffect(() => {
      gameStateRef.current = gameState;
    }, [gameState]);

    useEffect(() => {
      autoFireRef.current = autoFire;
    }, [autoFire]);

    const engineRef = useRef({
      nextEntityId: 1,
      player: {
        x: WORLD_WIDTH / 2,
        y: WORLD_HEIGHT / 2,
        vx: 0,
        vy: 0,
        aimAngle: 0,
        invulnTimer: 0,
        hurtFlash: 0,
        dashTimer: 0,
        dashCooldown: 0,
        dashDirX: 0,
        dashDirY: 0,
        recoilOffset: 0,
        walkPhase: 0,
      },
      stats: createInitialStats(),
      activeWeapon: 'pistol' as WeaponId,
      weapons: createInitialWeapons(),
      fireTimerMs: 0,
      slimes: [] as Slime[],
      projectiles: [] as Projectile[],
      pickups: [] as Pickup[],
      particles: [] as Particle[],
      floatingTexts: [] as FloatingText[],
      bossZones: createBossZones(),
      zoneHazards: [] as ZoneHazard[],
      ambientTimer: 0,
      waveState: {
        toSpawn: [] as SlimeVariant[],
        spawnTimer: 0,
        betweenWaveTimer: 0,
        bannerText: 'Oleada 1',
        bannerTimer: 2.0,
      },
      camera: {
        x: WORLD_WIDTH / 2,
        y: WORLD_HEIGHT / 2,
        shake: 0,
      },
      input: {
        keys: new Set<string>(),
        mouseX: 0,
        mouseY: 0,
        mouseDown: false,
      },
      hudSyncTimer: 0,
      titleDemoTimer: 0,
    });

    const BOSS_TITLES = [
      'Engendro Tóxico',
      'Acechador Carmesí',
      'Coloso del Abismo',
      'Devorador del Vacío',
      'Pesadilla Primordial',
    ];

    const getBossTitle = (wave: number): string => {
      const tier = Math.max(1, Math.floor(wave / 2));
      return BOSS_TITLES[Math.min(BOSS_TITLES.length - 1, tier - 1)];
    };

    const buildWaveQueue = (wave: number): SlimeVariant[] => {
      const queue: SlimeVariant[] = [];
      const count = 11 + wave * 5;

      if (wave % 2 === 0) {
        queue.push('king');
      }

      for (let i = 0; i < count; i++) {
        const roll = Math.random();
        if (wave >= 2 && roll < 0.14) {
          queue.push('volatile');
        } else if (wave >= 3 && roll < 0.28) {
          queue.push('magma');
        } else if (wave >= 2 && roll < 0.34) {
          queue.push('gold');
        } else if (wave >= 2 && roll < 0.54) {
          queue.push('purple');
        } else if (wave >= 2 && roll < 0.78) {
          queue.push('blue');
        } else if (wave === 1 && roll < 0.35) {
          queue.push('blue');
        } else {
          queue.push('green');
        }
      }
      return queue;
    };

    const spawnSlime = (variant: SlimeVariant, customX?: number, customY?: number) => {
      const eng = engineRef.current;
      const waveScale = 1 + (eng.stats.wave - 1) * 0.22;
      const bossTier = Math.max(1, Math.floor(eng.stats.wave / 2));

      const bossPalettes = [
        { color: '#166534', highlight: '#86EFAC', core: '#052E16' },
        { color: '#991B1B', highlight: '#FCA5A5', core: '#450A0A' },
        { color: '#5B21B6', highlight: '#DDD6FE', core: '#1E1B4B' },
        { color: '#1E293B', highlight: '#F43F5E', core: '#020617' },
      ];
      const bossPal = bossPalettes[Math.min(bossPalettes.length - 1, bossTier - 1)];

      let x = customX ?? 0;
      let y = customY ?? 0;
      let assignedZoneId: number | undefined;

      if (variant === 'king') {
        const zoneIdx = Math.max(0, Math.floor(eng.stats.wave / 2) - 1) % eng.bossZones.length;
        for (let z = 0; z < eng.bossZones.length; z++) {
          eng.bossZones[z].active = z === zoneIdx;
          if (z === zoneIdx) {
            eng.bossZones[z].eruptionTimer = 1.4;
          }
        }
        const activeZone = eng.bossZones[zoneIdx];
        x = customX ?? activeZone.x;
        y = customY ?? activeZone.y;
        assignedZoneId = activeZone.id;
      } else if (customX === undefined || customY === undefined) {
        const margin = 45;
        const side = Math.floor(Math.random() * 4);
        if (side === 0) {
          x = margin + Math.random() * (WORLD_WIDTH - margin * 2);
          y = margin;
        } else if (side === 1) {
          x = WORLD_WIDTH - margin;
          y = margin + Math.random() * (WORLD_HEIGHT - margin * 2);
        } else if (side === 2) {
          x = margin + Math.random() * (WORLD_WIDTH - margin * 2);
          y = WORLD_HEIGHT - margin;
        } else {
          x = margin;
          y = margin + Math.random() * (WORLD_HEIGHT - margin * 2);
        }

        // Keep safe distance from player
        const dx = x - eng.player.x;
        const dy = y - eng.player.y;
        if (Math.hypot(dx, dy) < 260) {
          x = eng.player.x > WORLD_WIDTH / 2 ? margin + 80 : WORLD_WIDTH - margin - 80;
          y = eng.player.y > WORLD_HEIGHT / 2 ? margin + 80 : WORLD_HEIGHT - margin - 80;
        }
      }

      const defs: Record<
        SlimeVariant,
        {
          radius: number;
          hp: number;
          speed: number;
          damage: number;
          coins: number;
          xp: number;
          score: number;
          color: string;
          highlight: string;
          core: string;
          isBoss?: boolean;
        }
      > = {
        green: {
          radius: 20,
          hp: 48,
          speed: 118,
          damage: 13,
          coins: 1,
          xp: 7,
          score: 25,
          color: '#15803D',
          highlight: '#4ADE80',
          core: '#052E16',
        },
        blue: {
          radius: 14,
          hp: 34,
          speed: 235,
          damage: 12,
          coins: 2,
          xp: 10,
          score: 38,
          color: '#0369A1',
          highlight: '#38BDF8',
          core: '#082F49',
        },
        purple: {
          radius: 30,
          hp: 150,
          speed: 82,
          damage: 22,
          coins: 4,
          xp: 20,
          score: 75,
          color: '#581C87',
          highlight: '#C084FC',
          core: '#2E1065',
        },
        gold: {
          radius: 16,
          hp: 62,
          speed: 215,
          damage: 9,
          coins: 12,
          xp: 24,
          score: 140,
          color: '#B45309',
          highlight: '#FDE047',
          core: '#451A03',
        },
        magma: {
          radius: 25,
          hp: 96,
          speed: 110,
          damage: 17,
          coins: 3,
          xp: 15,
          score: 60,
          color: '#9A3412',
          highlight: '#FB923C',
          core: '#431407',
        },
        mini_magma: {
          radius: 12,
          hp: 26,
          speed: 225,
          damage: 10,
          coins: 1,
          xp: 5,
          score: 22,
          color: '#C2410C',
          highlight: '#FDBA74',
          core: '#431407',
        },
        volatile: {
          radius: 21,
          hp: 58,
          speed: 158,
          damage: 15,
          coins: 2,
          xp: 12,
          score: 65,
          color: '#B91C1C',
          highlight: '#FDE047',
          core: '#450A0A',
        },
        king: {
          radius: 50 + Math.min(20, bossTier * 3),
          hp: 520 + bossTier * 390,
          speed: 88 + Math.min(80, bossTier * 12),
          damage: 24 + bossTier * 6,
          coins: 18 + bossTier * 10,
          xp: 45 + bossTier * 20,
          score: 450 + bossTier * 260,
          color: bossPal.color,
          highlight: bossPal.highlight,
          core: bossPal.core,
          isBoss: true,
        },
      };

      const d = defs[variant];
      const scaledHp = Math.round(d.hp * waveScale);

      eng.slimes.push({
        id: eng.nextEntityId++,
        variant,
        x,
        y,
        vx: 0,
        vy: 0,
        radius: d.radius,
        hp: scaledHp,
        maxHp: scaledHp,
        speed: d.speed + Math.min(65, eng.stats.wave * 4),
        damage: d.damage,
        coinReward: d.coins,
        xpReward: d.xp,
        scoreReward: d.score,
        color: d.color,
        highlightColor: d.highlight,
        coreColor: d.core,
        squishPhase: Math.random() * Math.PI * 2,
        hitFlashTimer: 0,
        dying: false,
        dissolveTimer: 0,
        dissolveDuration: d.isBoss ? 0.85 : 0.45,
        attackCooldown: d.isBoss ? 1.2 : 2.5 + Math.random() * 1.4,
        summonCooldown: d.isBoss ? 4.8 : undefined,
        isBoss: d.isBoss,
        bossTier: d.isBoss ? bossTier : undefined,
        bossName: d.isBoss ? getBossTitle(eng.stats.wave) : undefined,
        bossZoneId: assignedZoneId,
      });
    };

    const emitHudSnapshot = () => {
      const eng = engineRef.current;
      const boss = eng.slimes.find((s) => s.isBoss && !s.dying);
      const weaponsCopy: Record<WeaponId, WeaponProgress> = {
        pistol: { ...eng.weapons.pistol },
        shotgun: { ...eng.weapons.shotgun },
        plasma: { ...eng.weapons.plasma },
        grenade: { ...eng.weapons.grenade },
        laser: { ...eng.weapons.laser },
      };

      onHudUpdate({
        stats: { ...eng.stats },
        activeWeapon: eng.activeWeapon,
        weapons: weaponsCopy,
        dashCooldownRatio: Math.max(0, eng.player.dashCooldown / DASH_COOLDOWN),
        bossInfo: boss
          ? {
              name: `${boss.bossName ?? 'Rey Slime'} (Jefe Nv.${boss.bossTier ?? 1}) · Oleada ${eng.stats.wave}`,
              hp: Math.max(0, Math.ceil(boss.hp)),
              maxHp: boss.maxHp,
            }
          : null,
        slimesRemaining:
          eng.slimes.filter((s) => !s.dying).length + eng.waveState.toSpawn.length,
      });
    };

    const resetInternalGame = () => {
      const eng = engineRef.current;
      eng.player = {
        x: WORLD_WIDTH / 2,
        y: WORLD_HEIGHT / 2,
        vx: 0,
        vy: 0,
        aimAngle: 0,
        invulnTimer: 0,
        hurtFlash: 0,
        dashTimer: 0,
        dashCooldown: 0,
        dashDirX: 0,
        dashDirY: 0,
        recoilOffset: 0,
        walkPhase: 0,
      };
      eng.stats = createInitialStats();
      eng.activeWeapon = 'pistol';
      eng.weapons = createInitialWeapons();
      eng.fireTimerMs = 0;
      eng.slimes = [];
      eng.projectiles = [];
      eng.pickups = [];
      eng.particles = [];
      eng.floatingTexts = [];
      eng.bossZones = createBossZones();
      eng.zoneHazards = [];
      eng.camera = {
        x: WORLD_WIDTH / 2,
        y: WORLD_HEIGHT / 2,
        shake: 0,
      };
      eng.waveState = {
        toSpawn: buildWaveQueue(1),
        spawnTimer: 0.35,
        betweenWaveTimer: 0,
        bannerText: 'Oleada 1',
        bannerTimer: 2.2,
      };
      emitHudSnapshot();
    };

    useImperativeHandle(ref, () => ({
      resetGame: () => {
        resetInternalGame();
      },
      selectWeapon: (id: WeaponId) => {
        const eng = engineRef.current;
        if (eng.weapons[id].unlocked) {
          eng.activeWeapon = id;
          emitHudSnapshot();
        }
      },
      buyWeapon: (id: WeaponId) => {
        const eng = engineRef.current;
        const def = WEAPONS[id];
        const prog = eng.weapons[id];
        if (prog.unlocked || eng.stats.coins < def.cost) return false;
        eng.stats.coins -= def.cost;
        prog.unlocked = true;
        prog.ammo = def.magSize;
        eng.activeWeapon = id;
        soundEngine.playCoin();
        emitHudSnapshot();
        return true;
      },
      upgradeWeapon: (id: WeaponId) => {
        const eng = engineRef.current;
        const def = WEAPONS[id];
        const prog = eng.weapons[id];
        const cost = getWeaponUpgradeCost(def, prog.upgradeLevel);
        if (!prog.unlocked || prog.upgradeLevel >= 5 || eng.stats.coins < cost) return false;
        eng.stats.coins -= cost;
        prog.upgradeLevel += 1;
        soundEngine.playLevelUp();
        emitHudSnapshot();
        return true;
      },
      buyMedkit: () => {
        const eng = engineRef.current;
        const cost = MEDKIT_COST;
        if (eng.stats.coins < cost || eng.stats.hp >= eng.stats.maxHp) return false;
        eng.stats.coins -= cost;
        eng.stats.hp = Math.min(eng.stats.maxHp, eng.stats.hp + 45);
        soundEngine.playXp();
        emitHudSnapshot();
        return true;
      },
      upgradeSpeed: () => {
        const eng = engineRef.current;
        const s = eng.stats;
        if (s.speedUpgradeLevel >= SPEED_UPGRADE_MAX_LEVEL) return false;
        const cost = getSpeedUpgradeCost(s.speedUpgradeLevel);
        if (s.coins < cost) return false;
        s.coins -= cost;
        s.speedUpgradeLevel += 1;
        s.speedMultiplier += SPEED_UPGRADE_STEP;
        soundEngine.playXp();
        emitHudSnapshot();
        return true;
      },
      applyLevelUpgrade: (upgradeId: string) => {
        const eng = engineRef.current;
        const s = eng.stats;
        if (upgradeId === 'vitality') {
          s.maxHp += 25;
          s.hp = Math.min(s.maxHp, s.hp + 35);
        } else if (upgradeId === 'heavy_rounds') {
          s.damageMultiplier += 0.18;
        } else if (upgradeId === 'rapid_trigger') {
          s.fireRateMultiplier += 0.15;
        } else if (upgradeId === 'agile_boots') {
          s.speedMultiplier += 0.06;
        } else if (upgradeId === 'magnet_field') {
          s.magnetRadius = Math.round(s.magnetRadius * 1.5);
        } else if (upgradeId === 'bounty_hunter') {
          s.rewardMultiplier += 0.2;
        }
        emitHudSnapshot();
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Seed ambient slimes for title backdrop
      if (engineRef.current.slimes.length === 0) {
        for (let i = 0; i < 10; i++) {
          const variants: SlimeVariant[] = ['green', 'blue', 'purple', 'gold', 'magma'];
          spawnSlime(
            variants[i % variants.length],
            250 + Math.random() * (WORLD_WIDTH - 500),
            200 + Math.random() * (WORLD_HEIGHT - 400)
          );
        }
      }

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

      const handleKeyDown = (e: KeyboardEvent) => {
        const eng = engineRef.current;
        const code = e.code;
        eng.input.keys.add(code);

        if (code === 'Escape' || code === 'KeyP') {
          if (gameStateRef.current === 'PLAYING' || gameStateRef.current === 'PAUSED') {
            onTogglePause();
          }
          return;
        }

        if (code === 'KeyB') {
          if (gameStateRef.current === 'PLAYING' || gameStateRef.current === 'ARMORY') {
            onOpenArmory();
          }
          return;
        }

        if (gameStateRef.current !== 'PLAYING') return;

        // Weapon hotkeys 1-5
        if (code.startsWith('Digit')) {
          const slot = parseInt(code.replace('Digit', ''), 10);
          const found = WEAPON_LIST.find((w) => w.slot === slot);
          if (found && eng.weapons[found.id].unlocked) {
            eng.activeWeapon = found.id;
            emitHudSnapshot();
          }
        }

        // Manual reload
        if (code === 'KeyR') {
          const wDef = WEAPONS[eng.activeWeapon];
          const wProg = eng.weapons[eng.activeWeapon];
          if (!wProg.reloading && wProg.ammo < wDef.magSize) {
            wProg.reloading = true;
            wProg.reloadProgress = 0;
            emitHudSnapshot();
          }
        }

        // Dash
        if (code === 'Space' || code === 'ShiftLeft' || code === 'ShiftRight') {
          if (eng.player.dashCooldown <= 0 && eng.player.dashTimer <= 0) {
            let dx = 0;
            let dy = 0;
            if (eng.input.keys.has('KeyW') || eng.input.keys.has('ArrowUp')) dy -= 1;
            if (eng.input.keys.has('KeyS') || eng.input.keys.has('ArrowDown')) dy += 1;
            if (eng.input.keys.has('KeyA') || eng.input.keys.has('ArrowLeft')) dx -= 1;
            if (eng.input.keys.has('KeyD') || eng.input.keys.has('ArrowRight')) dx += 1;
            if (dx === 0 && dy === 0) {
              dx = Math.cos(eng.player.aimAngle);
              dy = Math.sin(eng.player.aimAngle);
            } else {
              const len = Math.hypot(dx, dy);
              dx /= len;
              dy /= len;
            }
            eng.player.dashDirX = dx;
            eng.player.dashDirY = dy;
            eng.player.dashTimer = DASH_DURATION;
            eng.player.dashCooldown = DASH_COOLDOWN;
            eng.player.invulnTimer = Math.max(eng.player.invulnTimer, DASH_DURATION + 0.08);
            soundEngine.playDash();
          }
        }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        engineRef.current.input.keys.delete(e.code);
      };

      const handleMouseMove = (e: MouseEvent) => {
        engineRef.current.input.mouseX = e.clientX;
        engineRef.current.input.mouseY = e.clientY;
      };

      const handleMouseDown = (e: MouseEvent) => {
        if (e.button === 0) {
          engineRef.current.input.mouseDown = true;
        }
      };

      const handleMouseUp = (e: MouseEvent) => {
        if (e.button === 0) {
          engineRef.current.input.mouseDown = false;
        }
      };

      const handleWheel = (e: WheelEvent) => {
        if (gameStateRef.current !== 'PLAYING') return;
        const eng = engineRef.current;
        const unlocked = WEAPON_LIST.filter((w) => eng.weapons[w.id].unlocked);
        if (unlocked.length <= 1) return;
        const idx = unlocked.findIndex((w) => w.id === eng.activeWeapon);
        const dir = e.deltaY > 0 ? 1 : -1;
        const next = unlocked[(idx + dir + unlocked.length) % unlocked.length];
        eng.activeWeapon = next.id;
        emitHudSnapshot();
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('wheel', handleWheel, { passive: true });

      const addFloatingText = (x: number, y: number, text: string, color: string, scale = 1) => {
        const eng = engineRef.current;
        eng.floatingTexts.push({
          id: eng.nextEntityId++,
          x,
          y,
          text,
          color,
          life: 0.78,
          maxLife: 0.78,
          scale,
        });
      };

      const triggerExplosion = (x: number, y: number, radius: number, damage: number) => {
        const eng = engineRef.current;
        soundEngine.playExplosion();
        eng.camera.shake = Math.min(14, eng.camera.shake + 8);

        eng.particles.push({
          x,
          y,
          vx: 0,
          vy: 0,
          radius: 8,
          color: '#34D399',
          alpha: 0.9,
          life: 0.34,
          maxLife: 0.34,
          kind: 'ring',
          ringMaxRadius: radius,
        });

        for (let i = 0; i < 20; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 90 + Math.random() * 230;
          eng.particles.push({
            x,
            y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            radius: 3 + Math.random() * 5,
            color: i % 2 === 0 ? '#34D399' : '#FDE047',
            alpha: 1,
            life: 0.3 + Math.random() * 0.25,
            maxLife: 0.55,
            kind: 'spark',
          });
        }

        for (const slime of eng.slimes) {
          if (slime.dying) continue;
          const dist = Math.hypot(slime.x - x, slime.y - y);
          if (dist <= radius + slime.radius) {
            const falloff = Math.max(0.45, 1 - dist / (radius + slime.radius + 20));
            damageSlime(slime, Math.round(damage * falloff), Math.atan2(slime.y - y, slime.x - x), 260);
          }
        }
      };

      const killSlime = (slime: Slime) => {
        const eng = engineRef.current;
        if (slime.dying) return;
        slime.dying = true;
        slime.dissolveTimer = 0;
        soundEngine.playSlimeDissolve();

        eng.stats.kills += 1;
        eng.stats.score += slime.scoreReward;

        if (slime.isBoss) {
          for (const z of eng.bossZones) {
            z.active = false;
          }
          eng.zoneHazards = [];
        }

        // Split magma slime into 2 fast mini magma slimes
        if (slime.variant === 'magma') {
          for (let i = 0; i < 2; i++) {
            const ang = Math.random() * Math.PI * 2;
            spawnSlime(
              'mini_magma',
              slime.x + Math.cos(ang) * 18,
              slime.y + Math.sin(ang) * 18
            );
          }
        }

        // Rich goo splatter + shockwave ring particles on dissolve
        eng.particles.push({
          x: slime.x,
          y: slime.y,
          vx: 0,
          vy: 0,
          radius: slime.radius * 0.6,
          color: slime.highlightColor,
          alpha: 0.65,
          life: 0.28,
          maxLife: 0.28,
          kind: 'ring',
          ringMaxRadius: slime.radius * 2.1,
        });

        const gooCount = slime.isBoss ? 42 : 16;
        for (let i = 0; i < gooCount; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 55 + Math.random() * (slime.isBoss ? 260 : 155);
          eng.particles.push({
            x: slime.x,
            y: slime.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            radius: 3 + Math.random() * (slime.radius * 0.3),
            color: i % 3 === 0 ? slime.highlightColor : slime.color,
            alpha: 0.95,
            life: 0.38 + Math.random() * 0.38,
            maxLife: 0.76,
            kind: 'goo',
          });
        }

        // Drop Coins (scarce & earned)
        const coinTotal = Math.max(1, Math.round(slime.coinReward * eng.stats.rewardMultiplier));
        const coinPieces = slime.isBoss ? 10 : slime.variant === 'gold' ? 6 : Math.min(3, coinTotal);
        const perCoin = Math.max(1, Math.floor(coinTotal / coinPieces));
        let remainder = coinTotal - perCoin * coinPieces;

        for (let i = 0; i < coinPieces; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 70 + Math.random() * 110;
          const val = perCoin + (remainder > 0 ? 1 : 0);
          if (remainder > 0) remainder--;
          eng.pickups.push({
            id: eng.nextEntityId++,
            type: 'coin',
            x: slime.x,
            y: slime.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            value: val,
            radius: 7,
            magnetized: false,
            bobPhase: Math.random() * Math.PI * 2,
            lifeTimer: 28,
          });
        }

        // Drop XP Orbs (modest progression)
        const xpTotal = Math.max(3, Math.round(slime.xpReward * eng.stats.rewardMultiplier));
        const xpOrbs = slime.isBoss ? 8 : Math.min(2, Math.max(1, Math.floor(xpTotal / 10)));
        const perOrb = Math.max(1, Math.round(xpTotal / xpOrbs));
        for (let i = 0; i < xpOrbs; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 65 + Math.random() * 105;
          eng.pickups.push({
            id: eng.nextEntityId++,
            type: 'xp',
            x: slime.x,
            y: slime.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            value: perOrb,
            radius: 6,
            magnetized: false,
            bobPhase: Math.random() * Math.PI * 2,
            lifeTimer: 32,
          });
        }

        // Occasional small health orb when player is injured
        if (
          eng.stats.hp < eng.stats.maxHp &&
          (slime.isBoss || Math.random() < 0.08)
        ) {
          const ang = Math.random() * Math.PI * 2;
          eng.pickups.push({
            id: eng.nextEntityId++,
            type: 'health',
            x: slime.x,
            y: slime.y,
            vx: Math.cos(ang) * 75,
            vy: Math.sin(ang) * 75,
            value: slime.isBoss ? 35 : 14,
            radius: 8,
            magnetized: false,
            bobPhase: Math.random() * Math.PI * 2,
            lifeTimer: 25,
          });
        }
      };

      const detonateVolatileSlime = (slime: Slime) => {
        const eng = engineRef.current;
        const p = eng.player;
        const blastRadius = 128;
        const blastDamage = 38 + eng.stats.wave * 4;

        soundEngine.playExplosion();
        eng.camera.shake = Math.min(18, eng.camera.shake + 12);

        eng.particles.push({
          x: slime.x,
          y: slime.y,
          vx: 0,
          vy: 0,
          radius: 12,
          color: '#EF4444',
          alpha: 0.95,
          life: 0.38,
          maxLife: 0.38,
          kind: 'ring',
          ringMaxRadius: blastRadius,
        });

        for (let i = 0; i < 32; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 110 + Math.random() * 280;
          eng.particles.push({
            x: slime.x,
            y: slime.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            radius: 3.5 + Math.random() * 5.5,
            color: i % 3 === 0 ? '#FEF08A' : i % 2 === 0 ? '#F97316' : '#EF4444',
            alpha: 1,
            life: 0.32 + Math.random() * 0.3,
            maxLife: 0.62,
            kind: 'spark',
          });
        }

        // Heavy damage to player if caught in blast
        const distPlayer = Math.hypot(p.x - slime.x, p.y - slime.y);
        if (p.invulnTimer <= 0 && distPlayer <= blastRadius + PLAYER_RADIUS) {
          eng.stats.hp = Math.max(0, eng.stats.hp - blastDamage);
          p.invulnTimer = 0.75;
          p.hurtFlash = 0.35;
          soundEngine.playHurt();
          addFloatingText(p.x, p.y - 28, `-${blastDamage} ¡EXPLOSIÓN!`, '#EF4444', 1.25);
          if (eng.stats.hp <= 0) {
            emitHudSnapshot();
            onGameOver({ ...eng.stats });
          }
        }

        // Blast also scatters nearby slimes slightly
        for (const other of eng.slimes) {
          if (other.id === slime.id || other.dying) continue;
          const dOther = Math.hypot(other.x - slime.x, other.y - slime.y);
          if (dOther <= blastRadius + other.radius) {
            const pushAng = Math.atan2(other.y - slime.y, other.x - slime.x);
            other.vx += Math.cos(pushAng) * 260;
            other.vy += Math.sin(pushAng) * 260;
          }
        }

        killSlime(slime);
      };

      const damageSlime = (slime: Slime, dmg: number, knockAngle: number, knockForce: number) => {
        if (slime.dying) return;
        const eng = engineRef.current;
        slime.hp -= dmg;
        slime.hitFlashTimer = 0.09;
        const kbResist = slime.isBoss ? 0.15 : slime.variant === 'purple' ? 0.4 : 1;
        slime.vx += Math.cos(knockAngle) * knockForce * kbResist;
        slime.vy += Math.sin(knockAngle) * knockForce * kbResist;

        // Impact hit particles on every shot
        for (let k = 0; k < 5; k++) {
          const pAng = knockAngle + (Math.random() - 0.5) * 1.4;
          const pSpd = 65 + Math.random() * 130;
          eng.particles.push({
            x: slime.x - Math.cos(knockAngle) * slime.radius * 0.6,
            y: slime.y - Math.sin(knockAngle) * slime.radius * 0.6,
            vx: Math.cos(pAng) * pSpd,
            vy: Math.sin(pAng) * pSpd,
            radius: 2 + Math.random() * 2.5,
            color: k % 2 === 0 ? slime.highlightColor : slime.color,
            alpha: 0.9,
            life: 0.22 + Math.random() * 0.15,
            maxLife: 0.37,
            kind: 'goo',
          });
        }

        addFloatingText(
          slime.x + (Math.random() - 0.5) * 14,
          slime.y - slime.radius - 4,
          `-${dmg}`,
          '#F8FAFC',
          dmg >= 55 ? 1.18 : 0.95
        );

        if (slime.hp <= 0) {
          if (slime.variant === 'volatile') {
            detonateVolatileSlime(slime);
          } else {
            killSlime(slime);
          }
        } else {
          soundEngine.playSlimeHit();
        }
      };

      const fireWeapon = () => {
        const eng = engineRef.current;
        const wDef = WEAPONS[eng.activeWeapon];
        const wProg = eng.weapons[eng.activeWeapon];

        if (wProg.reloading) return;
        if (wProg.ammo <= 0) {
          wProg.reloading = true;
          wProg.reloadProgress = 0;
          return;
        }

        wProg.ammo -= 1;
        if (wProg.ammo <= 0) {
          wProg.reloading = true;
          wProg.reloadProgress = 0;
        }

        const upgradeDamageBoost = 1 + (wProg.upgradeLevel - 1) * 0.22;
        const finalDamage = Math.round(
          wDef.damage * upgradeDamageBoost * eng.stats.damageMultiplier
        );
        const fireDelay = wDef.fireRateMs / eng.stats.fireRateMultiplier;
        eng.fireTimerMs = fireDelay;
        eng.player.recoilOffset = wDef.id === 'shotgun' || wDef.id === 'grenade' ? 7 : 4;
        if (wDef.id === 'shotgun' || wDef.id === 'grenade' || wDef.id === 'laser') {
          eng.camera.shake = Math.min(7, eng.camera.shake + 2.5);
        }

        soundEngine.playShoot(wDef.id);

        const muzzleDist = PLAYER_RADIUS + 14;
        const mx = eng.player.x + Math.cos(eng.player.aimAngle) * muzzleDist;
        const my = eng.player.y + Math.sin(eng.player.aimAngle) * muzzleDist;

        // Muzzle flash particles
        for (let i = 0; i < 4; i++) {
          const ang = eng.player.aimAngle + (Math.random() - 0.5) * 0.6;
          const spd = 90 + Math.random() * 140;
          eng.particles.push({
            x: mx,
            y: my,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            radius: 2 + Math.random() * 2.5,
            color: wDef.glowColor,
            alpha: 0.9,
            life: 0.11,
            maxLife: 0.11,
            kind: 'spark',
          });
        }

        for (let i = 0; i < wDef.pellets; i++) {
          const offsetAngle = (Math.random() - 0.5) * wDef.spreadRad;
          const angle = eng.player.aimAngle + offsetAngle;
          const speed =
            wDef.projectileSpeed * (wDef.id === 'shotgun' ? 0.9 + Math.random() * 0.2 : 1);

          eng.projectiles.push({
            id: eng.nextEntityId++,
            kind: wDef.projectileKind,
            x: mx,
            y: my,
            prevX: mx,
            prevY: my,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: wDef.projectileRadius,
            damage: finalDamage,
            color: wDef.color,
            trailColor: wDef.glowColor,
            pierceLeft: wDef.pierce,
            hitIds: new Set<number>(),
            explosionRadius: wDef.explosionRadius,
            distanceTraveled: 0,
            maxRange: wDef.rangePx,
            lifeTimer: wDef.rangePx / speed + 0.15,
          });
        }
      };

      const updatePlaying = (dt: number) => {
        const eng = engineRef.current;
        const p = eng.player;

        // Timers
        if (p.invulnTimer > 0) p.invulnTimer -= dt;
        if (p.hurtFlash > 0) p.hurtFlash -= dt;
        if (p.dashCooldown > 0) p.dashCooldown -= dt;
        if (p.recoilOffset > 0) p.recoilOffset = Math.max(0, p.recoilOffset - dt * 32);
        if (eng.fireTimerMs > 0) eng.fireTimerMs -= dt * 1000;
        if (eng.camera.shake > 0) eng.camera.shake = Math.max(0, eng.camera.shake - dt * 28);
        if (eng.waveState.bannerTimer > 0) eng.waveState.bannerTimer -= dt;

        // Reload progression for active weapon
        const activeDef = WEAPONS[eng.activeWeapon];
        const activeProg = eng.weapons[eng.activeWeapon];
        if (activeProg.reloading) {
          const reloadSpeed = eng.stats.fireRateMultiplier;
          activeProg.reloadProgress += (dt * 1000 * reloadSpeed) / activeDef.reloadMs;
          if (activeProg.reloadProgress >= 1) {
            activeProg.reloading = false;
            activeProg.reloadProgress = 0;
            activeProg.ammo = activeDef.magSize;
          }
        }

        // Player Movement
        if (p.dashTimer > 0) {
          p.dashTimer -= dt;
          p.x += p.dashDirX * DASH_SPEED * dt;
          p.y += p.dashDirY * DASH_SPEED * dt;
          eng.particles.push({
            x: p.x,
            y: p.y,
            vx: 0,
            vy: 0,
            radius: PLAYER_RADIUS * 0.75,
            color: '#38BDF8',
            alpha: 0.35,
            life: 0.16,
            maxLife: 0.16,
            kind: 'smoke',
          });
        } else {
          let moveX = 0;
          let moveY = 0;
          if (eng.input.keys.has('KeyW') || eng.input.keys.has('ArrowUp')) moveY -= 1;
          if (eng.input.keys.has('KeyS') || eng.input.keys.has('ArrowDown')) moveY += 1;
          if (eng.input.keys.has('KeyA') || eng.input.keys.has('ArrowLeft')) moveX -= 1;
          if (eng.input.keys.has('KeyD') || eng.input.keys.has('ArrowRight')) moveX += 1;

          if (moveX !== 0 || moveY !== 0) {
            const len = Math.hypot(moveX, moveY);
            moveX /= len;
            moveY /= len;
            p.walkPhase += dt * 11;
          }

          const speed = BASE_PLAYER_SPEED * eng.stats.speedMultiplier;
          p.x += moveX * speed * dt;
          p.y += moveY * speed * dt;
        }

        // Clamp player to arena walls
        const wallPad = PLAYER_RADIUS + 18;
        p.x = Math.max(wallPad, Math.min(WORLD_WIDTH - wallPad, p.x));
        p.y = Math.max(wallPad, Math.min(WORLD_HEIGHT - wallPad, p.y));

        // Camera follow smoothly
        const viewW = window.innerWidth;
        const viewH = window.innerHeight;
        const targetCamX = p.x;
        const targetCamY = p.y;
        eng.camera.x += (targetCamX - eng.camera.x) * Math.min(1, dt * 10);
        eng.camera.y += (targetCamY - eng.camera.y) * Math.min(1, dt * 10);

        // Aim angle relative to world mouse
        const worldMouseX = eng.camera.x - viewW / 2 + eng.input.mouseX;
        const worldMouseY = eng.camera.y - viewH / 2 + eng.input.mouseY;
        p.aimAngle = Math.atan2(worldMouseY - p.y, worldMouseX - p.x);

        // Firing
        if ((eng.input.mouseDown || autoFireRef.current) && eng.fireTimerMs <= 0) {
          fireWeapon();
        }

        // Ambient dark spores & active Boss Zone ritual particles
        eng.ambientTimer -= dt;
        if (eng.ambientTimer <= 0) {
          eng.ambientTimer = 0.14;
          eng.particles.push({
            x: eng.camera.x + (Math.random() - 0.5) * viewW * 1.1,
            y: eng.camera.y + (Math.random() - 0.5) * viewH * 1.1,
            vx: (Math.random() - 0.5) * 24,
            vy: -12 - Math.random() * 20,
            radius: 1.5 + Math.random() * 2,
            color: '#64748B',
            alpha: 0.38,
            life: 1.3,
            maxLife: 1.3,
            kind: 'smoke',
          });
        }

        // Update Boss Zones & Telegraphed Ground Eruptions
        const activeBoss = eng.slimes.find((s) => s.isBoss && !s.dying);
        for (const z of eng.bossZones) {
          z.pulsePhase += dt * (z.active ? 4.2 : 1.2);
          if (z.active) {
            if (!activeBoss && eng.waveState.toSpawn.indexOf('king') === -1) {
              z.active = false;
              continue;
            }
            // Swirling ritual particles around Boss Zone perimeter
            if (Math.random() < 0.45) {
              const ang = Math.random() * Math.PI * 2;
              const rad = z.radius * (0.7 + Math.random() * 0.32);
              eng.particles.push({
                x: z.x + Math.cos(ang) * rad,
                y: z.y + Math.sin(ang) * rad,
                vx: -Math.sin(ang) * 48,
                vy: Math.cos(ang) * 48,
                radius: 2.5 + Math.random() * 2.5,
                color: z.glowColor,
                alpha: 0.75,
                life: 0.55,
                maxLife: 0.55,
                kind: 'spark',
              });
            }

            const tier = activeBoss?.bossTier ?? 1;
            z.eruptionTimer -= dt;
            if (z.eruptionTimer <= 0) {
              z.eruptionTimer = Math.max(1.05, 2.25 - tier * 0.22);
              const count = tier >= 3 ? 2 : 1;
              for (let e = 0; e < count; e++) {
                // Target near player if close to zone, else inside zone
                const playerDist = Math.hypot(p.x - z.x, p.y - z.y);
                let hx: number;
                let hy: number;
                if (playerDist <= z.radius + 140 && e === 0) {
                  hx = p.x + (Math.random() - 0.5) * 70;
                  hy = p.y + (Math.random() - 0.5) * 70;
                } else {
                  const rAng = Math.random() * Math.PI * 2;
                  const rDist = Math.random() * (z.radius - 45);
                  hx = z.x + Math.cos(rAng) * rDist;
                  hy = z.y + Math.sin(rAng) * rDist;
                }
                eng.zoneHazards.push({
                  id: eng.nextEntityId++,
                  x: Math.max(50, Math.min(WORLD_WIDTH - 50, hx)),
                  y: Math.max(50, Math.min(WORLD_HEIGHT - 50, hy)),
                  radius: 56 + tier * 4,
                  timer: 0,
                  duration: Math.max(0.85, 1.15 - tier * 0.05),
                  damage: 20 + tier * 5,
                  color: z.glowColor,
                });
              }
            }
          }
        }

        // Update Telegraphed Zone Hazards
        for (let i = eng.zoneHazards.length - 1; i >= 0; i--) {
          const hz = eng.zoneHazards[i];
          hz.timer += dt;
          if (hz.timer >= hz.duration) {
            // Erupt!
            soundEngine.playExplosion();
            eng.camera.shake = Math.min(14, eng.camera.shake + 5);
            eng.particles.push({
              x: hz.x,
              y: hz.y,
              vx: 0,
              vy: 0,
              radius: 10,
              color: hz.color,
              alpha: 0.9,
              life: 0.34,
              maxLife: 0.34,
              kind: 'ring',
              ringMaxRadius: hz.radius * 1.15,
            });
            for (let k = 0; k < 18; k++) {
              const ang = Math.random() * Math.PI * 2;
              const spd = 70 + Math.random() * 190;
              eng.particles.push({
                x: hz.x,
                y: hz.y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                radius: 3 + Math.random() * 4,
                color: k % 2 === 0 ? hz.color : '#FDE047',
                alpha: 0.95,
                life: 0.35,
                maxLife: 0.35,
                kind: 'spark',
              });
            }

            if (p.invulnTimer <= 0 && Math.hypot(p.x - hz.x, p.y - hz.y) <= hz.radius + PLAYER_RADIUS * 0.5) {
              eng.stats.hp = Math.max(0, eng.stats.hp - hz.damage);
              p.invulnTimer = 0.65;
              p.hurtFlash = 0.3;
              soundEngine.playHurt();
              addFloatingText(p.x, p.y - 26, `-${hz.damage}`, '#EF4444', 1.2);
              if (eng.stats.hp <= 0) {
                emitHudSnapshot();
                onGameOver({ ...eng.stats });
                return;
              }
            }
            eng.zoneHazards.splice(i, 1);
          }
        }

        // Wave spawning
        if (eng.waveState.toSpawn.length > 0) {
          eng.waveState.spawnTimer -= dt;
          if (eng.waveState.spawnTimer <= 0) {
            const nextVariant = eng.waveState.toSpawn.shift()!;
            spawnSlime(nextVariant);
            eng.waveState.spawnTimer = Math.max(0.18, 0.78 - eng.stats.wave * 0.045);
          }
        } else if (eng.slimes.filter((s) => !s.dying).length === 0) {
          if (eng.waveState.betweenWaveTimer <= 0) {
            eng.waveState.betweenWaveTimer = 1.8;
          } else {
            eng.waveState.betweenWaveTimer -= dt;
            if (eng.waveState.betweenWaveTimer <= 0) {
              eng.stats.wave += 1;
              eng.waveState.toSpawn = buildWaveQueue(eng.stats.wave);
              eng.waveState.spawnTimer = 0.35;
              eng.waveState.bannerText =
                eng.stats.wave % 2 === 0
                  ? `Oleada ${eng.stats.wave} · Zona de Jefe: ${
                      eng.bossZones[
                        Math.max(0, Math.floor(eng.stats.wave / 2) - 1) % eng.bossZones.length
                      ].name
                    }`
                  : `Oleada ${eng.stats.wave}`;
              eng.waveState.bannerTimer = 3.0;
            }
          }
        }

        // Update Projectiles
        for (let i = eng.projectiles.length - 1; i >= 0; i--) {
          const proj = eng.projectiles[i];
          proj.prevX = proj.x;
          proj.prevY = proj.y;
          const stepX = proj.vx * dt;
          const stepY = proj.vy * dt;
          proj.x += stepX;
          proj.y += stepY;
          proj.distanceTraveled += Math.hypot(stepX, stepY);
          proj.lifeTimer -= dt;

          // Trail particles for plasma/grenade
          if (proj.kind === 'plasma' && Math.random() < 0.55) {
            eng.particles.push({
              x: proj.x,
              y: proj.y,
              vx: (Math.random() - 0.5) * 35,
              vy: (Math.random() - 0.5) * 35,
              radius: 2.5,
              color: proj.trailColor,
              alpha: 0.7,
              life: 0.18,
              maxLife: 0.18,
              kind: 'spark',
            });
          } else if (proj.kind === 'grenade' && Math.random() < 0.7) {
            eng.particles.push({
              x: proj.x,
              y: proj.y,
              vx: (Math.random() - 0.5) * 20,
              vy: (Math.random() - 0.5) * 20,
              radius: 3.5,
              color: '#94A3B8',
              alpha: 0.45,
              life: 0.25,
              maxLife: 0.25,
              kind: 'smoke',
            });
          }

          let remove =
            proj.lifeTimer <= 0 ||
            proj.distanceTraveled >= proj.maxRange ||
            proj.x < 16 ||
            proj.x > WORLD_WIDTH - 16 ||
            proj.y < 16 ||
            proj.y > WORLD_HEIGHT - 16;

          if (proj.fromEnemy) {
            if (p.invulnTimer <= 0) {
              const distP = Math.hypot(proj.x - p.x, proj.y - p.y);
              if (distP <= proj.radius + PLAYER_RADIUS) {
                eng.stats.hp = Math.max(0, eng.stats.hp - proj.damage);
                p.invulnTimer = 0.55;
                p.hurtFlash = 0.25;
                eng.camera.shake = Math.min(12, eng.camera.shake + 6);
                soundEngine.playHurt();
                addFloatingText(p.x, p.y - 24, `-${proj.damage}`, '#EF4444', 1.1);
                remove = true;
                if (eng.stats.hp <= 0) {
                  emitHudSnapshot();
                  onGameOver({ ...eng.stats });
                  return;
                }
              }
            }
          } else {
            for (const slime of eng.slimes) {
              if (slime.dying || proj.hitIds.has(slime.id)) continue;
              const dist = Math.hypot(proj.x - slime.x, proj.y - slime.y);
              if (dist <= proj.radius + slime.radius) {
                proj.hitIds.add(slime.id);

                if (proj.kind === 'grenade') {
                  triggerExplosion(proj.x, proj.y, proj.explosionRadius, proj.damage);
                  remove = true;
                  break;
                } else {
                  const angle = Math.atan2(proj.vy, proj.vx);
                  damageSlime(slime, proj.damage, angle, proj.kind === 'pellet' ? 140 : 95);
                  if (proj.pierceLeft > 0) {
                    proj.pierceLeft -= 1;
                  } else {
                    remove = true;
                    break;
                  }
                }
              }
            }

            if (remove && proj.kind === 'grenade' && proj.hitIds.size === 0) {
              triggerExplosion(proj.x, proj.y, proj.explosionRadius, proj.damage);
            }
          }

          if (remove) {
            eng.projectiles.splice(i, 1);
          }
        }

        // Update Slimes
        for (let i = eng.slimes.length - 1; i >= 0; i--) {
          const s = eng.slimes[i];
          const isFastSmall = s.variant === 'blue' || s.variant === 'mini_magma';
          s.squishPhase += dt * (isFastSmall ? 13 : 6);
          if (s.hitFlashTimer > 0) s.hitFlashTimer -= dt;

          if (s.dying) {
            s.dissolveTimer += dt;
            s.vx *= 0.88;
            s.vy *= 0.88;
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            if (s.dissolveTimer >= s.dissolveDuration) {
              eng.slimes.splice(i, 1);
            }
            continue;
          }

          const dx = p.x - s.x;
          const dy = p.y - s.y;
          const dist = Math.hypot(dx, dy) || 1;

          // Volatile explosive slime fuse countdown
          if (s.variant === 'volatile') {
            if (s.fuseTimer !== undefined) {
              s.fuseTimer -= dt;
              if (Math.random() < 0.7) {
                eng.particles.push({
                  x: s.x + (Math.random() - 0.5) * 18,
                  y: s.y + (Math.random() - 0.5) * 18,
                  vx: (Math.random() - 0.5) * 70,
                  vy: -40 - Math.random() * 50,
                  radius: 2.5,
                  color: '#FDE047',
                  alpha: 0.95,
                  life: 0.2,
                  maxLife: 0.2,
                  kind: 'spark',
                });
              }
              if (s.fuseTimer <= 0) {
                detonateVolatileSlime(s);
                continue;
              }
            } else if (dist <= 82) {
              s.fuseTimer = 0.42;
              s.maxFuse = 0.42;
            }
          }

          // Gold treasure slime weaves laterally when player gets close
          let dirX = dx / dist;
          let dirY = dy / dist;
          if (s.variant === 'gold' && dist < 240) {
            dirX = -dx / dist + Math.cos(s.squishPhase * 0.7) * 0.6;
            dirY = -dy / dist + Math.sin(s.squishPhase * 0.7) * 0.6;
            const dLen = Math.hypot(dirX, dirY) || 1;
            dirX /= dLen;
            dirY /= dLen;
          }

          let moveSpeed = s.speed;
          if (s.isBoss && s.bossZoneId) {
            const z = eng.bossZones.find((bz) => bz.id === s.bossZoneId);
            if (z && Math.hypot(s.x - z.x, s.y - z.y) <= z.radius) {
              moveSpeed *= 1.18;
            }
          }

          s.vx += (dirX * moveSpeed - s.vx) * Math.min(1, dt * 6);
          s.vy += (dirY * moveSpeed - s.vy) * Math.min(1, dt * 6);
          s.x += s.vx * dt;
          s.y += s.vy * dt;

          // Soft separation between slimes
          for (let j = i - 1; j >= 0; j--) {
            const o = eng.slimes[j];
            if (o.dying) continue;
            const sdx = s.x - o.x;
            const sdy = s.y - o.y;
            const sdist = Math.hypot(sdx, sdy);
            const minDist = s.radius + o.radius - 2;
            if (sdist > 0 && sdist < minDist) {
              const push = (minDist - sdist) * 0.5;
              const nx = sdx / sdist;
              const ny = sdy / sdist;
              s.x += nx * push;
              s.y += ny * push;
              o.x -= nx * push;
              o.y -= ny * push;
            }
          }

          s.x = Math.max(s.radius + 16, Math.min(WORLD_WIDTH - s.radius - 16, s.x));
          s.y = Math.max(s.radius + 16, Math.min(WORLD_HEIGHT - s.radius - 16, s.y));

          // Purple elite slimes lob occasional toxic orb from wave 3+
          if (!s.isBoss && s.variant === 'purple' && eng.stats.wave >= 3 && dist < 440) {
            s.attackCooldown -= dt;
            if (s.attackCooldown <= 0) {
              s.attackCooldown = 3.2;
              const ang = Math.atan2(p.y - s.y, p.x - s.x);
              eng.projectiles.push({
                id: eng.nextEntityId++,
                kind: 'slime_acid',
                fromEnemy: true,
                x: s.x + Math.cos(ang) * s.radius,
                y: s.y + Math.sin(ang) * s.radius,
                prevX: s.x,
                prevY: s.y,
                vx: Math.cos(ang) * 240,
                vy: Math.sin(ang) * 240,
                radius: 7,
                damage: 14,
                color: '#A855F7',
                trailColor: '#E9D5FF',
                pierceLeft: 0,
                hitIds: new Set<number>(),
                explosionRadius: 0,
                distanceTraveled: 0,
                maxRange: 520,
                lifeTimer: 2.3,
              });
            }
          }

          // Escalating Boss Combat Patterns every 2 waves
          if (s.isBoss) {
            const tier = s.bossTier ?? 1;
            s.attackCooldown -= dt;

            if (s.attackCooldown <= 0) {
              const cooldown = Math.max(1.25, 2.35 - tier * 0.22);
              s.attackCooldown = cooldown;
              const baseAng = Math.atan2(p.y - s.y, p.x - s.x);
              const projSpeed = 270 + Math.min(130, tier * 24);
              const projDamage = 13 + tier * 4;

              // Tier 3+ alternates radial bursts and aimed spreads
              const useRadial = tier >= 3 && Math.random() < 0.45;
              if (useRadial) {
                const count = 8 + Math.min(8, tier * 2);
                const spinOffset = eng.nextEntityId * 0.2;
                for (let k = 0; k < count; k++) {
                  const ang = spinOffset + (Math.PI * 2 * k) / count;
                  eng.projectiles.push({
                    id: eng.nextEntityId++,
                    kind: 'slime_acid',
                    fromEnemy: true,
                    x: s.x + Math.cos(ang) * s.radius,
                    y: s.y + Math.sin(ang) * s.radius,
                    prevX: s.x,
                    prevY: s.y,
                    vx: Math.cos(ang) * projSpeed,
                    vy: Math.sin(ang) * projSpeed,
                    radius: 8,
                    damage: projDamage,
                    color: s.highlightColor,
                    trailColor: s.color,
                    pierceLeft: 0,
                    hitIds: new Set<number>(),
                    explosionRadius: 0,
                    distanceTraveled: 0,
                    maxRange: 720,
                    lifeTimer: 2.8,
                  });
                }
              } else {
                const halfFan = tier >= 4 ? 3 : tier >= 2 ? 2 : 1;
                const spreadStep = tier >= 4 ? 0.18 : 0.22;
                for (let k = -halfFan; k <= halfFan; k++) {
                  const ang = baseAng + k * spreadStep;
                  eng.projectiles.push({
                    id: eng.nextEntityId++,
                    kind: 'slime_acid',
                    fromEnemy: true,
                    x: s.x + Math.cos(ang) * s.radius,
                    y: s.y + Math.sin(ang) * s.radius,
                    prevX: s.x,
                    prevY: s.y,
                    vx: Math.cos(ang) * projSpeed,
                    vy: Math.sin(ang) * projSpeed,
                    radius: 9,
                    damage: projDamage,
                    color: s.highlightColor,
                    trailColor: s.color,
                    pierceLeft: 0,
                    hitIds: new Set<number>(),
                    explosionRadius: 0,
                    distanceTraveled: 0,
                    maxRange: 700,
                    lifeTimer: 2.7,
                  });
                }
              }

              // Tier 4+ Boss lunges aggressively toward player on volley
              if (tier >= 4) {
                s.vx += Math.cos(baseAng) * 280;
                s.vy += Math.sin(baseAng) * 280;
              }
            }

            // Tier 2+ Bosses summon fast small slimes & explosive slimes periodically
            if (tier >= 2 && s.summonCooldown !== undefined) {
              s.summonCooldown -= dt;
              if (s.summonCooldown <= 0) {
                s.summonCooldown = Math.max(4.2, 7.6 - tier * 0.65);
                const spawnCount = tier >= 4 ? 4 : 3;
                for (let m = 0; m < spawnCount; m++) {
                  const ang = Math.random() * Math.PI * 2;
                  const minionType: SlimeVariant =
                    m === 0 && tier >= 2
                      ? 'volatile'
                      : tier >= 3 && m === 1
                        ? 'mini_magma'
                        : 'blue';
                  spawnSlime(
                    minionType,
                    s.x + Math.cos(ang) * (s.radius + 26),
                    s.y + Math.sin(ang) * (s.radius + 26)
                  );
                }
              }
            }
          }

          // Contact damage to player
          if (p.invulnTimer <= 0 && dist <= s.radius + PLAYER_RADIUS - 3) {
            eng.stats.hp = Math.max(0, eng.stats.hp - s.damage);
            p.invulnTimer = 0.65;
            p.hurtFlash = 0.28;
            eng.camera.shake = Math.min(14, eng.camera.shake + 7);
            soundEngine.playHurt();
            addFloatingText(p.x, p.y - 26, `-${s.damage}`, '#EF4444', 1.15);

            // Push slime back slightly
            s.vx -= dirX * 180;
            s.vy -= dirY * 180;

            if (eng.stats.hp <= 0) {
              emitHudSnapshot();
              onGameOver({ ...eng.stats });
              return;
            }
          }
        }

        // Update Pickups (Coins, XP Orbs, Health)
        let leveledUpNow = false;
        for (let i = eng.pickups.length - 1; i >= 0; i--) {
          const pk = eng.pickups[i];
          pk.bobPhase += dt * 5;
          pk.lifeTimer -= dt;

          const dx = p.x - pk.x;
          const dy = p.y - pk.y;
          const dist = Math.hypot(dx, dy) || 1;

          if (dist <= eng.stats.magnetRadius) {
            pk.magnetized = true;
          }

          if (pk.magnetized) {
            const pullSpeed = 480 + Math.max(0, eng.stats.magnetRadius - dist) * 2;
            pk.vx = (dx / dist) * pullSpeed;
            pk.vy = (dy / dist) * pullSpeed;
          } else {
            pk.vx *= Math.pow(0.05, dt);
            pk.vy *= Math.pow(0.05, dt);
          }

          pk.x += pk.vx * dt;
          pk.y += pk.vy * dt;

          if (dist <= PLAYER_RADIUS + pk.radius + 8) {
            // Pickup sparkle burst
            for (let k = 0; k < 4; k++) {
              const ang = Math.random() * Math.PI * 2;
              const spd = 40 + Math.random() * 75;
              eng.particles.push({
                x: pk.x,
                y: pk.y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                radius: 2.2,
                color:
                  pk.type === 'coin' ? '#FDE047' : pk.type === 'xp' ? '#34D399' : '#F87171',
                alpha: 0.9,
                life: 0.22,
                maxLife: 0.22,
                kind: 'spark',
              });
            }

            if (pk.type === 'coin') {
              eng.stats.coins += pk.value;
              soundEngine.playCoin();
              addFloatingText(p.x + 8, p.y - 20, `+${pk.value} Monedas`, '#FBBF24', 0.95);
            } else if (pk.type === 'xp') {
              eng.stats.xp += pk.value;
              soundEngine.playXp();
              if (eng.stats.xp >= eng.stats.xpToNext) {
                eng.stats.xp -= eng.stats.xpToNext;
                eng.stats.level += 1;
                eng.stats.xpToNext = Math.round(eng.stats.xpToNext * 1.42 + 40);
                leveledUpNow = true;
                soundEngine.playLevelUp();
                eng.particles.push({
                  x: p.x,
                  y: p.y,
                  vx: 0,
                  vy: 0,
                  radius: 15,
                  color: '#10B981',
                  alpha: 0.95,
                  life: 0.45,
                  maxLife: 0.45,
                  kind: 'ring',
                  ringMaxRadius: 150,
                });
                addFloatingText(
                  p.x,
                  p.y - 36,
                  `¡Nivel ${eng.stats.level}!`,
                  '#34D399',
                  1.3
                );
              }
            } else if (pk.type === 'health') {
              const healed = Math.min(eng.stats.maxHp - eng.stats.hp, pk.value);
              eng.stats.hp += healed;
              soundEngine.playXp();
              if (healed > 0) {
                addFloatingText(p.x, p.y - 22, `+${healed} HP`, '#10B981', 1);
              }
            }
            eng.pickups.splice(i, 1);
          } else if (pk.lifeTimer <= 0) {
            eng.pickups.splice(i, 1);
          }
        }

        // Update Particles
        for (let i = eng.particles.length - 1; i >= 0; i--) {
          const pt = eng.particles[i];
          pt.life -= dt;
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
          pt.vx *= 0.92;
          pt.vy *= 0.92;
          if (pt.life <= 0) {
            eng.particles.splice(i, 1);
          }
        }

        // Update Floating Texts
        for (let i = eng.floatingTexts.length - 1; i >= 0; i--) {
          const ft = eng.floatingTexts[i];
          ft.life -= dt;
          ft.y -= 34 * dt;
          if (ft.life <= 0) {
            eng.floatingTexts.splice(i, 1);
          }
        }

        eng.hudSyncTimer += dt;
        if (eng.hudSyncTimer >= 0.08 || leveledUpNow) {
          eng.hudSyncTimer = 0;
          emitHudSnapshot();
        }

        if (leveledUpNow) {
          onLevelUp(eng.stats.level);
        }
      };

      const updateTitleBackdrop = (dt: number) => {
        const eng = engineRef.current;
        eng.titleDemoTimer += dt;
        eng.camera.x = WORLD_WIDTH / 2 + Math.cos(eng.titleDemoTimer * 0.2) * 80;
        eng.camera.y = WORLD_HEIGHT / 2 + Math.sin(eng.titleDemoTimer * 0.16) * 50;
        for (const s of eng.slimes) {
          s.squishPhase += dt * 5;
          s.x += Math.cos(s.squishPhase * 0.15 + s.id) * 28 * dt;
          s.y += Math.sin(s.squishPhase * 0.12 + s.id) * 28 * dt;
        }
      };

      const renderScene = () => {
        const eng = engineRef.current;
        const viewW = window.innerWidth;
        const viewH = window.innerHeight;

        ctx.clearRect(0, 0, viewW, viewH);

        // Background void outside arena
        ctx.fillStyle = '#070B14';
        ctx.fillRect(0, 0, viewW, viewH);

        const shakeX = eng.camera.shake > 0 ? (Math.random() - 0.5) * eng.camera.shake : 0;
        const shakeY = eng.camera.shake > 0 ? (Math.random() - 0.5) * eng.camera.shake : 0;
        const offsetX = viewW / 2 - eng.camera.x + shakeX;
        const offsetY = viewH / 2 - eng.camera.y + shakeY;

        ctx.save();
        ctx.translate(offsetX, offsetY);

        // Arena Floor (darker ominous slate)
        ctx.fillStyle = '#0A0F1A';
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

        // Subtle tactical tile grid
        const gridSize = 64;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.045)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let gx = 0; gx <= WORLD_WIDTH; gx += gridSize) {
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, WORLD_HEIGHT);
        }
        for (let gy = 0; gy <= WORLD_HEIGHT; gy += gridSize) {
          ctx.moveTo(0, gy);
          ctx.lineTo(WORLD_WIDTH, gy);
        }
        ctx.stroke();

        // Arena Perimeter Border
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, WORLD_WIDTH - 10, WORLD_HEIGHT - 10);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.24)';
        ctx.lineWidth = 2;
        ctx.strokeRect(14, 14, WORLD_WIDTH - 28, WORLD_HEIGHT - 28);

        // Draw Boss Zones (Sanctuaries on arena floor)
        for (const z of eng.bossZones) {
          ctx.save();
          ctx.translate(z.x, z.y);
          const pulse = 0.5 + Math.sin(z.pulsePhase) * 0.5;

          // Base ritual floor tint
          ctx.fillStyle = z.active ? z.color : '#1E293B';
          ctx.globalAlpha = z.active ? 0.22 + pulse * 0.1 : 0.14;
          ctx.beginPath();
          ctx.arc(0, 0, z.radius, 0, Math.PI * 2);
          ctx.fill();

          // Outer ritual ring
          ctx.globalAlpha = z.active ? 0.72 + pulse * 0.25 : 0.25;
          ctx.strokeStyle = z.active ? z.glowColor : '#475569';
          ctx.lineWidth = z.active ? 3.5 : 1.5;
          ctx.setLineDash(z.active ? [18, 10] : [10, 14]);
          ctx.rotate(z.pulsePhase * 0.12);
          ctx.beginPath();
          ctx.arc(0, 0, z.radius, 0, Math.PI * 2);
          ctx.stroke();

          // Inner sigil ring
          ctx.setLineDash([]);
          ctx.rotate(-z.pulsePhase * 0.24);
          ctx.lineWidth = z.active ? 2 : 1;
          ctx.globalAlpha = z.active ? 0.55 : 0.18;
          ctx.beginPath();
          ctx.arc(0, 0, z.radius * 0.62, 0, Math.PI * 2);
          ctx.stroke();

          // 6 ritual rune pillars around perimeter
          for (let r = 0; r < 6; r++) {
            const ang = (Math.PI * 2 * r) / 6;
            const px = Math.cos(ang) * (z.radius - 10);
            const py = Math.sin(ang) * (z.radius - 10);
            ctx.fillStyle = z.active ? z.glowColor : '#475569';
            ctx.beginPath();
            ctx.arc(px, py, z.active ? 5 : 3, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();

          // Subtle zone title on floor
          ctx.save();
          ctx.font = '700 12px "Outfit", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = z.active ? z.glowColor : 'rgba(148, 163, 184, 0.35)';
          ctx.fillText(
            z.active ? `ZONA DE JEFE · ${z.name.toUpperCase()}` : z.name,
            z.x,
            z.y + z.radius - 18
          );
          ctx.restore();
        }

        // Draw Telegraphed Zone Hazards (ground eruptions)
        for (const hz of eng.zoneHazards) {
          const pRatio = Math.min(1, hz.timer / hz.duration);
          ctx.save();
          ctx.translate(hz.x, hz.y);
          ctx.fillStyle = hz.color;
          ctx.globalAlpha = 0.15 + pRatio * 0.25;
          ctx.beginPath();
          ctx.arc(0, 0, hz.radius, 0, Math.PI * 2);
          ctx.fill();

          // Expanding inner charge circle
          ctx.globalAlpha = 0.45 + pRatio * 0.45;
          ctx.beginPath();
          ctx.arc(0, 0, hz.radius * pRatio, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = hz.color;
          ctx.lineWidth = 2.5;
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.arc(0, 0, hz.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Draw Pickups
        for (const pk of eng.pickups) {
          const bob = Math.sin(pk.bobPhase) * 2.5;
          const fade = pk.lifeTimer < 4 ? Math.max(0.2, pk.lifeTimer / 4) : 1;
          ctx.save();
          ctx.globalAlpha = fade;
          ctx.translate(pk.x, pk.y + bob);

          if (pk.type === 'coin') {
            const spinWidth = 0.55 + Math.abs(Math.cos(pk.bobPhase * 0.8)) * 0.45;
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(0, 9 - bob, pk.radius * 0.8, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.scale(spinWidth, 1);
            ctx.fillStyle = '#F59E0B';
            ctx.beginPath();
            ctx.arc(0, 0, pk.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FEF08A';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fillStyle = '#B45309';
            ctx.fillRect(-1.5, -3.5, 3, 7);
          } else if (pk.type === 'xp') {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
            ctx.beginPath();
            ctx.arc(0, 0, pk.radius + 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#10B981';
            ctx.beginPath();
            ctx.arc(0, 0, pk.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#A7F3D0';
            ctx.beginPath();
            ctx.arc(-2, -2, pk.radius * 0.38, 0, Math.PI * 2);
            ctx.fill();
          } else if (pk.type === 'health') {
            ctx.fillStyle = '#EF4444';
            ctx.beginPath();
            ctx.arc(0, 0, pk.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(-1.5, -4.5, 3, 9);
            ctx.fillRect(-4.5, -1.5, 9, 3);
          }
          ctx.restore();
        }

        // Draw Particles (under entities)
        for (const pt of eng.particles) {
          const ratio = Math.max(0, pt.life / pt.maxLife);
          ctx.save();
          ctx.globalAlpha = pt.alpha * ratio;
          if (pt.kind === 'ring') {
            const rad = (pt.ringMaxRadius ?? 100) * (1 - ratio * 0.8);
            ctx.strokeStyle = pt.color;
            ctx.lineWidth = 3.5 * ratio;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, rad, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, Math.max(1, pt.radius * ratio), 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // Draw Slimes (including smooth dissolve animation!)
        for (const s of eng.slimes) {
          ctx.save();
          ctx.translate(s.x, s.y);

          if (s.dying) {
            const p = Math.min(1, s.dissolveTimer / s.dissolveDuration);
            // Dissolve: expands outward, flattens slightly, and fades to 0 alpha
            const dissolveScale = 1 + p * 0.5;
            ctx.globalAlpha = Math.max(0, 1 - p);
            ctx.scale(dissolveScale * 1.15, dissolveScale * (1 - p * 0.25));
          } else {
            const sx = 1 + Math.sin(s.squishPhase) * 0.09;
            const sy = 1 - Math.sin(s.squishPhase) * 0.09;
            ctx.scale(sx, sy);
          }

          // Volatile explosive slime blast radius telegraph
          if (!s.dying && s.variant === 'volatile') {
            ctx.save();
            const isFused = s.fuseTimer !== undefined;
            const fuseProgress = isFused && s.maxFuse ? 1 - s.fuseTimer! / s.maxFuse : 0;
            ctx.strokeStyle = isFused ? '#FDE047' : 'rgba(239, 68, 68, 0.35)';
            ctx.lineWidth = isFused ? 3 : 1.5;
            ctx.setLineDash(isFused ? [] : [6, 6]);
            ctx.beginPath();
            ctx.arc(0, 0, isFused ? 128 : s.radius * 1.6, 0, Math.PI * 2);
            ctx.stroke();

            if (isFused) {
              ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
              ctx.beginPath();
              ctx.arc(0, 0, 128 * fuseProgress, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }

          // Ground shadow + dark miasma aura
          ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
          ctx.beginPath();
          ctx.ellipse(0, s.radius * 0.72, s.radius * 1.04, s.radius * 0.42, 0, 0, Math.PI * 2);
          ctx.fill();

          if (
            !s.dying &&
            (s.isBoss || s.variant === 'purple' || s.variant === 'magma' || s.variant === 'volatile')
          ) {
            ctx.fillStyle = s.variant === 'volatile' ? '#EF4444' : s.coreColor;
            ctx.globalAlpha = 0.26 + Math.sin(s.squishPhase * 1.5) * 0.1;
            ctx.beginPath();
            ctx.arc(0, 0, s.radius * 1.28, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }

          // Sinister spiked / dripping organic slime silhouette
          ctx.fillStyle = s.hitFlashTimer > 0 ? '#FFFFFF' : s.color;
          ctx.beginPath();
          ctx.moveTo(-s.radius, s.radius * 0.48);
          ctx.bezierCurveTo(
            -s.radius * 1.12,
            -s.radius * 0.52,
            -s.radius * 0.68,
            -s.radius * 1.08,
            -s.radius * 0.25,
            -s.radius * 0.94
          );
          // Jagged crest horns on top
          ctx.lineTo(0, -s.radius * (s.isBoss ? 1.22 : 1.12));
          ctx.lineTo(s.radius * 0.25, -s.radius * 0.94);
          ctx.bezierCurveTo(
            s.radius * 0.68,
            -s.radius * 1.08,
            s.radius * 1.12,
            -s.radius * 0.52,
            s.radius,
            s.radius * 0.48
          );
          // Dripping base tentacles
          ctx.bezierCurveTo(
            s.radius * 0.65,
            s.radius * 0.86,
            s.radius * 0.22,
            s.radius * 0.68,
            0,
            s.radius * 0.85
          );
          ctx.bezierCurveTo(
            -s.radius * 0.22,
            s.radius * 0.68,
            -s.radius * 0.65,
            s.radius * 0.86,
            -s.radius,
            s.radius * 0.48
          );
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = 'rgba(2, 6, 23, 0.85)';
          ctx.lineWidth = s.isBoss ? 3 : 2;
          ctx.stroke();

          // Inner necrotic core & eerie veins
          if (s.hitFlashTimer <= 0) {
            ctx.fillStyle = s.coreColor;
            ctx.globalAlpha *= 0.65;
            ctx.beginPath();
            ctx.arc(0, s.radius * 0.08, s.radius * 0.56, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = s.dying
              ? Math.max(0, 1 - s.dissolveTimer / s.dissolveDuration) * 0.5
              : 0.45;
            ctx.fillStyle = s.highlightColor;
            ctx.beginPath();
            ctx.ellipse(
              -s.radius * 0.34,
              -s.radius * 0.42,
              s.radius * 0.2,
              s.radius * 0.1,
              -0.5,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }

          // Menacing predatory eyes & jagged fanged maw
          if (!s.dying) {
            const lookAng = Math.atan2(eng.player.y - s.y, eng.player.x - s.x);
            const lookX = Math.cos(lookAng) * (s.radius * 0.12);
            const lookY = Math.sin(lookAng) * (s.radius * 0.12);
            const eyeOffset = s.radius * 0.34;
            const eyeR = Math.max(2.8, s.radius * 0.16);
            const irisColor =
              s.variant === 'gold'
                ? '#FEF08A'
                : s.variant === 'blue'
                  ? '#E0F2FE'
                  : '#EF4444';

            ctx.globalAlpha = 1;
            // Angry angled eye sockets
            ctx.fillStyle = '#020617';
            ctx.beginPath();
            ctx.ellipse(-eyeOffset + lookX, -s.radius * 0.12 + lookY, eyeR * 1.2, eyeR * 0.85, 0.32, 0, Math.PI * 2);
            ctx.ellipse(eyeOffset + lookX, -s.radius * 0.12 + lookY, eyeR * 1.2, eyeR * 0.85, -0.32, 0, Math.PI * 2);
            ctx.fill();

            // Glowing predatory irises
            ctx.fillStyle = irisColor;
            ctx.beginPath();
            ctx.arc(-eyeOffset + lookX, -s.radius * 0.12 + lookY, eyeR * 0.62, 0, Math.PI * 2);
            ctx.arc(eyeOffset + lookX, -s.radius * 0.12 + lookY, eyeR * 0.62, 0, Math.PI * 2);
            ctx.fill();

            // Vertical slit pupils
            ctx.fillStyle = '#020617';
            ctx.fillRect(-eyeOffset + lookX - 0.8, -s.radius * 0.12 + lookY - eyeR * 0.5, 1.6, eyeR);
            ctx.fillRect(eyeOffset + lookX - 0.8, -s.radius * 0.12 + lookY - eyeR * 0.5, 1.6, eyeR);

            // Third eye on bosses
            if (s.isBoss) {
              ctx.fillStyle = '#020617';
              ctx.beginPath();
              ctx.arc(lookX, -s.radius * 0.44 + lookY, eyeR * 0.9, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#F43F5E';
              ctx.beginPath();
              ctx.arc(lookX, -s.radius * 0.44 + lookY, eyeR * 0.55, 0, Math.PI * 2);
              ctx.fill();
            }

            // Jagged fanged mouth
            const mouthY = s.radius * 0.25 + lookY * 0.4;
            const mouthW = s.radius * 0.45;
            ctx.fillStyle = '#020617';
            ctx.beginPath();
            ctx.moveTo(-mouthW, mouthY);
            ctx.quadraticCurveTo(0, mouthY + s.radius * 0.28, mouthW, mouthY);
            ctx.quadraticCurveTo(0, mouthY + s.radius * 0.08, -mouthW, mouthY);
            ctx.fill();

            // Sharp white fangs
            ctx.fillStyle = '#F8FAFC';
            ctx.beginPath();
            ctx.moveTo(-mouthW * 0.65, mouthY + 1);
            ctx.lineTo(-mouthW * 0.45, mouthY + s.radius * 0.14);
            ctx.lineTo(-mouthW * 0.25, mouthY + 1);
            ctx.moveTo(mouthW * 0.25, mouthY + 1);
            ctx.lineTo(mouthW * 0.45, mouthY + s.radius * 0.14);
            ctx.lineTo(mouthW * 0.65, mouthY + 1);
            ctx.fill();

            // Sinister spiked crown for Bosses
            if (s.isBoss) {
              ctx.fillStyle = '#0F172A';
              ctx.strokeStyle = s.highlightColor;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(-24, -s.radius * 0.96);
              ctx.lineTo(-30, -s.radius * 1.42);
              ctx.lineTo(-10, -s.radius * 1.12);
              ctx.lineTo(0, -s.radius * 1.54);
              ctx.lineTo(10, -s.radius * 1.12);
              ctx.lineTo(30, -s.radius * 1.42);
              ctx.lineTo(24, -s.radius * 0.96);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            }
          }

          ctx.restore();

          // Mini HP bar above damaged non-boss slimes
          if (!s.dying && !s.isBoss && s.hp < s.maxHp) {
            const barW = Math.max(28, s.radius * 1.6);
            const barH = 4;
            const bx = s.x - barW / 2;
            const by = s.y - s.radius - 12;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
            ctx.fillStyle = s.color;
            ctx.fillRect(bx, by, barW * Math.max(0, s.hp / s.maxHp), barH);
          }
        }

        // Draw Projectiles (each with distinct visual identity)
        for (const proj of eng.projectiles) {
          ctx.save();
          if (proj.kind === 'laser') {
            // Piercing laser beam segment
            const ang = Math.atan2(proj.vy, proj.vx);
            const tailX = proj.x - Math.cos(ang) * 44;
            const tailY = proj.y - Math.sin(ang) * 44;
            ctx.strokeStyle = proj.color;
            ctx.lineWidth = 7;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(proj.x, proj.y);
            ctx.stroke();

            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(proj.x, proj.y);
            ctx.stroke();
          } else if (proj.kind === 'bullet') {
            const ang = Math.atan2(proj.vy, proj.vx);
            ctx.translate(proj.x, proj.y);
            ctx.rotate(ang);
            ctx.fillStyle = proj.trailColor;
            ctx.fillRect(-12, -2, 12, 4);
            ctx.fillStyle = proj.color;
            ctx.beginPath();
            ctx.ellipse(2, 0, 6, 3.2, 0, 0, Math.PI * 2);
            ctx.fill();
          } else if (proj.kind === 'pellet') {
            ctx.fillStyle = proj.color;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = proj.trailColor;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.radius * 0.45, 0, Math.PI * 2);
            ctx.fill();
          } else if (proj.kind === 'plasma') {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.radius + 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = proj.color;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.radius * 0.45, 0, Math.PI * 2);
            ctx.fill();
          } else if (proj.kind === 'grenade') {
            ctx.fillStyle = '#064E3B';
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = proj.color;
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.fillStyle = '#FDE047';
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 3.2, 0, Math.PI * 2);
            ctx.fill();
          } else if (proj.kind === 'slime_acid') {
            ctx.fillStyle = proj.color;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = proj.trailColor;
            ctx.beginPath();
            ctx.arc(proj.x - 2, proj.y - 2, proj.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // Draw Player (hidden in Title Menu)
        if (gameStateRef.current !== 'TITLE_MENU') {
          const p = eng.player;
          const wDef = WEAPONS[eng.activeWeapon];
          const wProg = eng.weapons[eng.activeWeapon];

          ctx.save();
          ctx.translate(p.x, p.y);

          // Shadow
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.beginPath();
          ctx.ellipse(0, PLAYER_RADIUS * 0.8, PLAYER_RADIUS * 0.9, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          // Rotate toward aim
          ctx.rotate(p.aimAngle);

          // Weapon barrel drawn based on active weapon
          const rx = -p.recoilOffset;
          if (eng.activeWeapon === 'pistol') {
            ctx.fillStyle = '#94A3B8';
            ctx.fillRect(10 + rx, -3.5, 16, 7);
            ctx.fillStyle = wDef.color;
            ctx.fillRect(22 + rx, -2.5, 4, 5);
          } else if (eng.activeWeapon === 'shotgun') {
            ctx.fillStyle = '#475569';
            ctx.fillRect(8 + rx, -5, 22, 10);
            ctx.fillStyle = '#FB923C';
            ctx.fillRect(26 + rx, -4, 5, 8);
          } else if (eng.activeWeapon === 'plasma') {
            ctx.fillStyle = '#1E293B';
            ctx.fillRect(8 + rx, -5.5, 24, 11);
            ctx.fillStyle = '#38BDF8';
            ctx.fillRect(14 + rx, -2, 18, 4);
          } else if (eng.activeWeapon === 'grenade') {
            ctx.fillStyle = '#334155';
            ctx.fillRect(6 + rx, -7, 22, 14);
            ctx.fillStyle = '#34D399';
            ctx.fillRect(22 + rx, -5.5, 6, 11);
          } else if (eng.activeWeapon === 'laser') {
            ctx.fillStyle = '#1E293B';
            ctx.fillRect(8 + rx, -4.5, 28, 9);
            ctx.fillStyle = '#F43F5E';
            ctx.fillRect(16 + rx, -1.5, 22, 3);
          }

          // Player armored body
          ctx.fillStyle = p.hurtFlash > 0 ? '#EF4444' : '#E2E8F0';
          ctx.beginPath();
          ctx.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Tactical visor
          ctx.fillStyle = wDef.color;
          ctx.beginPath();
          ctx.arc(6, 0, 7, -Math.PI * 0.42, Math.PI * 0.42);
          ctx.lineTo(3, 0);
          ctx.closePath();
          ctx.fill();

          ctx.restore();

          // Reload ring around player
          if (wProg.reloading) {
            ctx.save();
            ctx.strokeStyle = wDef.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(
              p.x,
              p.y,
              PLAYER_RADIUS + 9,
              -Math.PI / 2,
              -Math.PI / 2 + Math.PI * 2 * Math.min(1, wProg.reloadProgress)
            );
            ctx.stroke();
            ctx.restore();
          }
        }

        // Floating damage/coin/xp text
        for (const ft of eng.floatingTexts) {
          const alpha = Math.max(0, ft.life / ft.maxLife);
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.font = `700 ${Math.round(13 * ft.scale)}px "JetBrains Mono", monospace`;
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(0,0,0,0.65)';
          ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
          ctx.fillStyle = ft.color;
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.restore();
        }

        ctx.restore();

        // Off-screen indicator pointing toward active Boss or active Boss Zone
        if (gameStateRef.current === 'PLAYING') {
          const bossTarget =
            eng.slimes.find((s) => s.isBoss && !s.dying) ||
            eng.bossZones.find((z) => z.active);
          if (bossTarget) {
            const screenX = bossTarget.x + offsetX;
            const screenY = bossTarget.y + offsetY;
            const margin = 52;
            if (
              screenX < margin ||
              screenX > viewW - margin ||
              screenY < margin ||
              screenY > viewH - margin
            ) {
              const ang = Math.atan2(bossTarget.y - eng.camera.y, bossTarget.x - eng.camera.x);
              const px = Math.max(margin, Math.min(viewW - margin, viewW / 2 + Math.cos(ang) * (viewW * 0.42)));
              const py = Math.max(96, Math.min(viewH - 110, viewH / 2 + Math.sin(ang) * (viewH * 0.36)));
              ctx.save();
              ctx.translate(px, py);
              ctx.rotate(ang);
              ctx.fillStyle = '#EF4444';
              ctx.strokeStyle = '#0F172A';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(14, 0);
              ctx.lineTo(-10, -9);
              ctx.lineTo(-5, 0);
              ctx.lineTo(-10, 9);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
              ctx.restore();
            }
          }
        }

        // Wave Announcement Banner (drawn in screen space, non-blocking)
        if (gameStateRef.current === 'PLAYING' && eng.waveState.bannerTimer > 0) {
          const alpha = Math.min(1, eng.waveState.bannerTimer * 1.4);
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.font = '800 28px "Outfit", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#F8FAFC';
          ctx.fillText(eng.waveState.bannerText, viewW / 2, 108);
          ctx.restore();
        }

        // Precision Crosshair when playing
        if (gameStateRef.current === 'PLAYING') {
          const mx = eng.input.mouseX;
          const my = eng.input.mouseY;
          const activeColor = WEAPONS[eng.activeWeapon].color;
          const spread = 6 + eng.player.recoilOffset * 1.5;

          ctx.save();
          ctx.translate(mx, my);
          ctx.strokeStyle = activeColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-spread - 6, 0);
          ctx.lineTo(-spread, 0);
          ctx.moveTo(spread, 0);
          ctx.lineTo(spread + 6, 0);
          ctx.moveTo(0, -spread - 6);
          ctx.lineTo(0, -spread);
          ctx.moveTo(0, spread);
          ctx.lineTo(0, spread + 6);
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(0, 0, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      };

      let animId = 0;
      let lastTime = performance.now();

      const loop = (now: number) => {
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;

        if (gameStateRef.current === 'PLAYING') {
          updatePlaying(dt);
        } else if (gameStateRef.current === 'TITLE_MENU') {
          updateTitleBackdrop(dt);
        }

        renderScene();
        animId = requestAnimationFrame(loop);
      };

      animId = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('wheel', handleWheel);
      };
    }, [onGameOver, onHudUpdate, onLevelUp, onOpenArmory, onTogglePause]);

    return (
      <canvas
        ref={canvasRef}
        className={`block w-full h-full ${
          gameState === 'PLAYING' ? 'cursor-none' : 'cursor-default'
        }`}
      />
    );
  }
);
