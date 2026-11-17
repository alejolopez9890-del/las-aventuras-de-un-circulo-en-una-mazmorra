export type GameState =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'LEVEL_UP'
  | 'ARMORY'
  | 'GAME_OVER';

export type WeaponId = 'pistol' | 'shotgun' | 'plasma' | 'grenade' | 'laser';

export type ProjectileKind =
  | 'bullet'
  | 'pellet'
  | 'plasma'
  | 'grenade'
  | 'laser'
  | 'slime_acid'
  | 'scythe';

export interface WeaponDefinition {
  id: WeaponId;
  slot: number;
  name: string;
  projectileName: string;
  description: string;
  cost: number;
  upgradeBaseCost: number;
  damage: number;
  fireRateMs: number;
  projectileSpeed: number;
  projectileRadius: number;
  projectileKind: ProjectileKind;
  pellets: number;
  spreadRad: number;
  pierce: number;
  explosionRadius: number;
  magSize: number;
  reloadMs: number;
  color: string;
  glowColor: string;
  rangePx: number;
}

export type SlimeVariant =
  | 'green'
  | 'blue'
  | 'purple'
  | 'gold'
  | 'magma'
  | 'mini_magma'
  | 'volatile'
  | 'reaper'
  | 'king';

export interface ZoneHazard {
  id: number;
  x: number;
  y: number;
  radius: number;
  timer: number;
  duration: number;
  damage: number;
  color: string;
}

export interface BossZone {
  id: number;
  name: string;
  x: number;
  y: number;
  radius: number;
  active: boolean;
  pulsePhase: number;
  eruptionTimer: number;
  color: string;
  glowColor: string;
}

export interface Slime {
  id: number;
  variant: SlimeVariant;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  coinReward: number;
  xpReward: number;
  scoreReward: number;
  color: string;
  highlightColor: string;
  coreColor: string;
  squishPhase: number;
  hitFlashTimer: number;
  dying: boolean;
  dissolveTimer: number;
  dissolveDuration: number;
  attackCooldown: number;
  summonCooldown?: number;
  fuseTimer?: number;
  maxFuse?: number;
  isBoss?: boolean;
  bossTier?: number;
  bossName?: string;
  bossZoneId?: number;
}

export interface Projectile {
  id: number;
  kind: ProjectileKind;
  fromEnemy?: boolean;
  debuff?: 'bleed_slow';
  spinAngle?: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  trailColor: string;
  pierceLeft: number;
  hitIds: Set<number>;
  explosionRadius: number;
  distanceTraveled: number;
  maxRange: number;
  lifeTimer: number;
  prevX: number;
  prevY: number;
}

export interface Pickup {
  id: number;
  type: 'coin' | 'xp' | 'health';
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  radius: number;
  magnetized: boolean;
  bobPhase: number;
  lifeTimer: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  kind: 'goo' | 'spark' | 'ring' | 'smoke';
  ringMaxRadius?: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  xpToNext: number;
  coins: number;
  score: number;
  kills: number;
  wave: number;
  damageMultiplier: number;
  fireRateMultiplier: number;
  speedMultiplier: number;
  speedUpgradeLevel: number;
  magnetRadius: number;
  rewardMultiplier: number;
}

export interface WeaponProgress {
  unlocked: boolean;
  upgradeLevel: number;
  ammo: number;
  reloading: boolean;
  reloadProgress: number;
}

export interface LevelUpUpgrade {
  id: string;
  title: string;
  summary: string;
  statTag: string;
  accent: 'emerald' | 'amber' | 'sky' | 'rose';
}

export interface HudSnapshot {
  stats: PlayerStats;
  activeWeapon: WeaponId;
  weapons: Record<WeaponId, WeaponProgress>;
  dashCooldownRatio: number;
  bossInfo: {
    name: string;
    hp: number;
    maxHp: number;
  } | null;
  slimesRemaining: number;
  bleedRemaining: number;
}
