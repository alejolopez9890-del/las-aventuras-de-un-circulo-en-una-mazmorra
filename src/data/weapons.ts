import { LevelUpUpgrade, WeaponDefinition, WeaponId } from '../types/game';

export const WEAPONS: Record<WeaponId, WeaponDefinition> = {
  pistol: {
    id: 'pistol',
    slot: 1,
    name: 'Pistola Táctica',
    projectileName: 'Bala Cinética',
    description: 'Precisa y equilibrada. Dispara balas rápidas de calibre estándar.',
    cost: 0,
    upgradeBaseCost: 30,
    damage: 15,
    fireRateMs: 220,
    projectileSpeed: 760,
    projectileRadius: 5,
    projectileKind: 'bullet',
    pellets: 1,
    spreadRad: 0.03,
    pierce: 0,
    explosionRadius: 0,
    magSize: 14,
    reloadMs: 900,
    color: '#FBBF24',
    glowColor: '#FDE68A',
    rangePx: 750,
  },
  shotgun: {
    id: 'shotgun',
    slot: 2,
    name: 'Escopeta Táctica',
    projectileName: 'Perdigones Dispersos',
    description: 'Descarga 6 perdigones en abanico. Devastadora a corta distancia.',
    cost: 90,
    upgradeBaseCost: 55,
    damage: 10,
    fireRateMs: 620,
    projectileSpeed: 640,
    projectileRadius: 4,
    projectileKind: 'pellet',
    pellets: 6,
    spreadRad: 0.36,
    pierce: 0,
    explosionRadius: 0,
    magSize: 6,
    reloadMs: 1250,
    color: '#FB923C',
    glowColor: '#FED7AA',
    rangePx: 390,
  },
  plasma: {
    id: 'plasma',
    slot: 3,
    name: 'Rifle de Plasma',
    projectileName: 'Orbe de Plasma',
    description: 'Alta cadencia de fuego con orbes energéticos que perforan un slime.',
    cost: 220,
    upgradeBaseCost: 110,
    damage: 14,
    fireRateMs: 115,
    projectileSpeed: 700,
    projectileRadius: 7,
    projectileKind: 'plasma',
    pellets: 1,
    spreadRad: 0.06,
    pierce: 1,
    explosionRadius: 0,
    magSize: 28,
    reloadMs: 1350,
    color: '#38BDF8',
    glowColor: '#BAE6FD',
    rangePx: 720,
  },
  grenade: {
    id: 'grenade',
    slot: 4,
    name: 'Lanzagranadas',
    projectileName: 'Granada Explosiva',
    description: 'Proyectil pesado que detona al impactar, dañando en área a grupos de slimes.',
    cost: 420,
    upgradeBaseCost: 185,
    damage: 52,
    fireRateMs: 800,
    projectileSpeed: 480,
    projectileRadius: 9,
    projectileKind: 'grenade',
    pellets: 1,
    spreadRad: 0.02,
    pierce: 0,
    explosionRadius: 125,
    magSize: 4,
    reloadMs: 1550,
    color: '#34D399',
    glowColor: '#A7F3D0',
    rangePx: 560,
  },
  laser: {
    id: 'laser',
    slot: 5,
    name: 'Cañón Láser',
    projectileName: 'Haz Perforante',
    description: 'Rayo devastador de alta energía que atraviesa múltiples slimes en línea recta.',
    cost: 750,
    upgradeBaseCost: 290,
    damage: 68,
    fireRateMs: 540,
    projectileSpeed: 1380,
    projectileRadius: 6,
    projectileKind: 'laser',
    pellets: 1,
    spreadRad: 0.0,
    pierce: 6,
    explosionRadius: 0,
    magSize: 8,
    reloadMs: 1450,
    color: '#F43F5E',
    glowColor: '#FECDD3',
    rangePx: 980,
  },
};

export const WEAPON_LIST: WeaponDefinition[] = [
  WEAPONS.pistol,
  WEAPONS.shotgun,
  WEAPONS.plasma,
  WEAPONS.grenade,
  WEAPONS.laser,
];

export const MEDKIT_COST = 45;

export const SPEED_UPGRADE_MAX_LEVEL = 6;
export const SPEED_UPGRADE_STEP = 0.03; // +3% por nivel (mejora muy mínima)

export const WEAPON_MAX_LEVEL = 10;
export const WEAPON_UPGRADE_DAMAGE_STEP = 0.3; // +30% daño por nivel de armería
export const WEAPON_UPGRADE_FIRERATE_STEP = 0.06; // +6% cadencia de disparo por nivel
export const WAVE_WEAPON_POWER_STEP = 0.06; // +6% potencia por cada oleada superada

export function getSpeedUpgradeCost(currentLevel: number): number {
  return Math.round(55 * Math.pow(1.65, currentLevel));
}

export function getWeaponUpgradeCost(weapon: WeaponDefinition, currentLevel: number): number {
  return Math.round(weapon.upgradeBaseCost * Math.pow(1.58, currentLevel - 1));
}

export function computeWeaponDamage(
  weapon: WeaponDefinition,
  upgradeLevel: number,
  damageMultiplier: number,
  wave: number
): number {
  const levelBoost = 1 + (upgradeLevel - 1) * WEAPON_UPGRADE_DAMAGE_STEP;
  const waveMasteryBoost = 1 + Math.max(0, wave - 1) * WAVE_WEAPON_POWER_STEP;
  return Math.round(weapon.damage * levelBoost * waveMasteryBoost * damageMultiplier);
}

export const LEVEL_UP_POOL: LevelUpUpgrade[] = [
  {
    id: 'vitality',
    title: 'Vitalidad Reforzada',
    summary: 'Aumenta tu vida máxima en +25 y restaura 35 puntos de salud al instante.',
    statTag: '+25 HP Máx · +35 Curación',
    accent: 'emerald',
  },
  {
    id: 'heavy_rounds',
    title: 'Munición de Alto Impacto',
    summary: 'Incrementa el daño de todas tus armas y proyectiles de forma permanente.',
    statTag: '+18% Daño Global',
    accent: 'rose',
  },
  {
    id: 'rapid_trigger',
    title: 'Gatillo Acelerado',
    summary: 'Dispara y recarga más rápido con cualquier arma equipada.',
    statTag: '+15% Cadencia de Disparo',
    accent: 'sky',
  },
  {
    id: 'agile_boots',
    title: 'Botas Tácticas',
    summary: 'Aumenta ligeramente tu agilidad para reposicionarte en combate.',
    statTag: '+6% Velocidad',
    accent: 'sky',
  },
  {
    id: 'magnet_field',
    title: 'Campo Magnético',
    summary: 'Atrae monedas y orbes de experiencia desde mucha mayor distancia.',
    statTag: '+50% Radio de Imán',
    accent: 'amber',
  },
  {
    id: 'bounty_hunter',
    title: 'Botín Enriquecido',
    summary: 'Los slimes eliminados otorgan más monedas y puntos de experiencia.',
    statTag: '+20% Monedas y XP',
    accent: 'amber',
  },
];
