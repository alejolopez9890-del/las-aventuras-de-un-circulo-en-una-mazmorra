import { PersistentProgress, SkinDefinition, SkinId } from '../types/game';

export const PROGRESS_STORAGE_KEY = 'slime_arena_progress_v2';
const LEGACY_BEST_SCORE_KEY = 'slime_arena_best_score';

export const SKINS: Record<SkinId, SkinDefinition> = {
  sentinel: {
    id: 'sentinel',
    name: 'Centinela Clásico',
    tier: 'Estándar',
    achievementTitle: 'Recluta del Acantilado',
    achievementDesc: 'Disponible desde el inicio de la aventura.',
    primaryColor: '#E2E8F0',
    secondaryColor: '#475569',
    visorColor: '#FBBF24',
    accentColor: '#38BDF8',
  },
  crimson_hunter: {
    id: 'crimson_hunter',
    name: 'Cazador Carmesí',
    tier: 'Estándar',
    achievementTitle: 'Cazador Implacable',
    achievementDesc: 'Elimina 60 enemigos en total dentro de la mazmorra.',
    primaryColor: '#1E293B',
    secondaryColor: '#B91C1C',
    visorColor: '#EF4444',
    accentColor: '#FCA5A5',
  },
  cyber_raider: {
    id: 'cyber_raider',
    name: 'Asaltante Neón',
    tier: 'Estándar',
    achievementTitle: 'Coleccionista Bélico',
    achievementDesc: 'Desbloquea 3 armas en la Armería o alcanza el Nivel 5.',
    primaryColor: '#0F172A',
    secondaryColor: '#0284C7',
    visorColor: '#22D3EE',
    accentColor: '#38BDF8',
  },
  shadow_reaper: {
    id: 'shadow_reaper',
    name: 'Sombra Espectral',
    tier: 'Élite',
    achievementTitle: 'Desafío a la Muerte',
    achievementDesc: 'Alcanza la Oleada 4 enfrentando a los Esqueletos Segadores.',
    primaryColor: '#111827',
    secondaryColor: '#4C1D95',
    visorColor: '#C084FC',
    accentColor: '#EF4444',
  },
  golden_champion: {
    id: 'golden_champion',
    name: 'Campeón Dorado',
    tier: 'Élite',
    achievementTitle: 'Matagigantes',
    achievementDesc: 'Derrota a 2 Jefes Slime en las Zonas de Jefe.',
    primaryColor: '#F59E0B',
    secondaryColor: '#92400E',
    visorColor: '#38BDF8',
    accentColor: '#FEF08A',
  },
  titan_emerald: {
    id: 'titan_emerald',
    name: 'Titán Esmeralda',
    tier: 'Élite',
    achievementTitle: 'Rompeestandartes',
    achievementDesc: 'Alcanza la Oleada 7 y sobrevive al Zombi Líder.',
    primaryColor: '#065F46',
    secondaryColor: '#10B981',
    visorColor: '#BEF264',
    accentColor: '#34D399',
  },
  celestial_god: {
    id: 'celestial_god',
    name: 'Avatar Celestial',
    tier: 'Élite',
    achievementTitle: 'Bendición de un Dios',
    achievementDesc: 'Activa el milagro divino y revive al morir.',
    primaryColor: '#FEF9C3',
    secondaryColor: '#7C3AED',
    visorColor: '#FDE047',
    accentColor: '#E9D5FF',
  },
  abyssal_knight: {
    id: 'abyssal_knight',
    name: 'Caballero del Abismo',
    tier: 'Maestro',
    achievementTitle: 'Señor de la Masacre',
    achievementDesc: 'Elimina 350 enemigos en total en la mazmorra.',
    primaryColor: '#090D16',
    secondaryColor: '#7E22CE',
    visorColor: '#E879F9',
    accentColor: '#C084FC',
  },
  inferno_warden: {
    id: 'inferno_warden',
    name: 'Guardián Infernal',
    tier: 'Maestro',
    achievementTitle: 'Forjado en Fuego',
    achievementDesc: 'Derrota 6 Jefes Slime en total y alcanza el Nivel 10.',
    primaryColor: '#7F1D1D',
    secondaryColor: '#EA580C',
    visorColor: '#FACC15',
    accentColor: '#FB923C',
  },
  arsenal_master: {
    id: 'arsenal_master',
    name: 'Maestro del Arsenal',
    tier: 'Maestro',
    achievementTitle: 'Poder Absoluto',
    achievementDesc: 'Desbloquea las 5 armas y alcanza la Oleada 10.',
    primaryColor: '#0F172A',
    secondaryColor: '#0891B2',
    visorColor: '#F43F5E',
    accentColor: '#22D3EE',
  },
  angel_slayer: {
    id: 'angel_slayer',
    name: 'Azote de Ángeles',
    tier: 'Maestro',
    achievementTitle: 'Verdugo del Cielo Caído',
    achievementDesc: 'Elimina a 3 Ángeles Caídos tras superar la ronda 10.',
    primaryColor: '#334155',
    secondaryColor: '#020617',
    visorColor: '#F8FAFC',
    accentColor: '#FBBF24',
  },
  eternal_monarch: {
    id: 'eternal_monarch',
    name: 'Monarca Eterno',
    tier: 'Maestro',
    achievementTitle: 'Leyenda Inmortal',
    achievementDesc: 'Alcanza la Oleada 15 o supera los 15,000 puntos.',
    primaryColor: '#F8FAFC',
    secondaryColor: '#6D28D9',
    visorColor: '#F59E0B',
    accentColor: '#FDE047',
  },

  // --- 15 Nuevas Skins de Rango Leyenda (Ultra Difíciles) ---
  void_harbinger: {
    id: 'void_harbinger',
    name: 'Heraldo del Vacío',
    tier: 'Leyenda',
    achievementTitle: 'Exterminador Supremo',
    achievementDesc: 'Elimina 1,000 enemigos en total dentro de la mazmorra.',
    primaryColor: '#020617',
    secondaryColor: '#312E81',
    visorColor: '#818CF8',
    accentColor: '#C084FC',
  },
  bone_emperor: {
    id: 'bone_emperor',
    name: 'Emperador de Hueso',
    tier: 'Leyenda',
    achievementTitle: 'Cosechador de Guadañas',
    achievementDesc: 'Elimina a 30 Esqueletos Segadores en combate.',
    primaryColor: '#E2E8F0',
    secondaryColor: '#1E293B',
    visorColor: '#DC2626',
    accentColor: '#94A3B8',
  },
  warbanner_breaker: {
    id: 'warbanner_breaker',
    name: 'Destructor de Hordas',
    tier: 'Leyenda',
    achievementTitle: 'Señor de la Guerra',
    achievementDesc: 'Elimina a 20 Zombis Líderes con Estandarte.',
    primaryColor: '#365314',
    secondaryColor: '#991B1B',
    visorColor: '#BEF264',
    accentColor: '#FACC15',
  },
  seraph_bane: {
    id: 'seraph_bane',
    name: 'Perdición Seráfica',
    tier: 'Leyenda',
    achievementTitle: 'Inquisidor del Cielo',
    achievementDesc: 'Elimina a 12 Ángeles Caídos sin ceder ante su juicio.',
    primaryColor: '#1E1B4B',
    secondaryColor: '#B45309',
    visorColor: '#F43F5E',
    accentColor: '#FDE047',
  },
  colossus_vanquisher: {
    id: 'colossus_vanquisher',
    name: 'Matacolosos',
    tier: 'Leyenda',
    achievementTitle: 'Terror de los Jefes',
    achievementDesc: 'Derrota a 15 Jefes Slime en las Zonas de Jefe.',
    primaryColor: '#450A0A',
    secondaryColor: '#BE123C',
    visorColor: '#FDE047',
    accentColor: '#FDA4AF',
  },
  omega_forged: {
    id: 'omega_forged',
    name: 'Forja Omega',
    tier: 'Leyenda',
    achievementTitle: 'Arma Perfecta',
    achievementDesc: 'Mejora cualquier arma hasta su Nivel 10 máximo en la Armería.',
    primaryColor: '#0C4A6E',
    secondaryColor: '#0284C7',
    visorColor: '#FDE047',
    accentColor: '#67E8F9',
  },
  immortal_phoenix: {
    id: 'immortal_phoenix',
    name: 'Fénix Inmortal',
    tier: 'Leyenda',
    achievementTitle: 'Elegido de los Dioses',
    achievementDesc: 'Sobrevive a la muerte mediante 3 resurrecciones divinas.',
    primaryColor: '#9A3412',
    secondaryColor: '#DC2626',
    visorColor: '#FEF08A',
    accentColor: '#FDBA74',
  },
  chronos_sentinel: {
    id: 'chronos_sentinel',
    name: 'Centinela del Tiempo',
    tier: 'Leyenda',
    achievementTitle: 'Superviviente de Élite',
    achievementDesc: 'Alcanza la Oleada 20 dentro de la mazmorra.',
    primaryColor: '#0F766E',
    secondaryColor: '#134E4A',
    visorColor: '#5EEAD4',
    accentColor: '#FDE047',
  },
  crimson_overlord: {
    id: 'crimson_overlord',
    name: 'Soberano Carmesí',
    tier: 'Leyenda',
    achievementTitle: 'Puntuación Legendaria',
    achievementDesc: 'Supera los 40,000 puntos en una sola incursión.',
    primaryColor: '#881337',
    secondaryColor: '#0F172A',
    visorColor: '#FDA4AF',
    accentColor: '#F43F5E',
  },
  arcane_archon: {
    id: 'arcane_archon',
    name: 'Arconte Arcano',
    tier: 'Leyenda',
    achievementTitle: 'Ascensión Total',
    achievementDesc: 'Alcanza el Nivel 18 con tu personaje en una partida.',
    primaryColor: '#3B0764',
    secondaryColor: '#7E22CE',
    visorColor: '#E9D5FF',
    accentColor: '#38BDF8',
  },
  apocalypse_knight: {
    id: 'apocalypse_knight',
    name: 'Caballero Apocalíptico',
    tier: 'Leyenda',
    achievementTitle: 'Purga Abisal',
    achievementDesc: 'Elimina 2,500 enemigos y derrota 25 Jefes Slime en total.',
    primaryColor: '#18181B',
    secondaryColor: '#991B1B',
    visorColor: '#F97316',
    accentColor: '#EF4444',
  },
  eclipse_valkyrie: {
    id: 'eclipse_valkyrie',
    name: 'Valquiria del Eclipse',
    tier: 'Leyenda',
    achievementTitle: 'Juicio Final',
    achievementDesc: 'Elimina 25 Ángeles Caídos y alcanza la Oleada 22.',
    primaryColor: '#172554',
    secondaryColor: '#F59E0B',
    visorColor: '#FEF08A',
    accentColor: '#F8FAFC',
  },
  galaxy_phantom: {
    id: 'galaxy_phantom',
    name: 'Espectro Astral',
    tier: 'Leyenda',
    achievementTitle: 'Señor del Cosmos',
    achievementDesc: 'Supera los 75,000 puntos y desbloquea las 5 armas.',
    primaryColor: '#09090B',
    secondaryColor: '#4F46E5',
    visorColor: '#22D3EE',
    accentColor: '#A855F7',
  },
  blood_sovereign: {
    id: 'blood_sovereign',
    name: 'Monarca de Sangre',
    tier: 'Leyenda',
    achievementTitle: 'Pesadilla Viviente',
    achievementDesc: 'Elimina 50 Esqueletos Segadores y 35 Zombis Líderes.',
    primaryColor: '#450A0A',
    secondaryColor: '#18181B',
    visorColor: '#EF4444',
    accentColor: '#FCA5A5',
  },
  omnipotent_one: {
    id: 'omnipotent_one',
    name: 'El Omnipotente',
    tier: 'Leyenda',
    achievementTitle: 'Conquistador Absoluto',
    achievementDesc: 'Alcanza la Oleada 30 o supera los 120,000 puntos.',
    primaryColor: '#FFFFFF',
    secondaryColor: '#D97706',
    visorColor: '#0EA5E9',
    accentColor: '#FDE047',
  },
};

export const SKIN_LIST: SkinDefinition[] = [
  SKINS.sentinel,
  SKINS.crimson_hunter,
  SKINS.cyber_raider,
  SKINS.shadow_reaper,
  SKINS.golden_champion,
  SKINS.titan_emerald,
  SKINS.celestial_god,
  SKINS.abyssal_knight,
  SKINS.inferno_warden,
  SKINS.arsenal_master,
  SKINS.angel_slayer,
  SKINS.eternal_monarch,
  SKINS.void_harbinger,
  SKINS.bone_emperor,
  SKINS.warbanner_breaker,
  SKINS.seraph_bane,
  SKINS.colossus_vanquisher,
  SKINS.omega_forged,
  SKINS.immortal_phoenix,
  SKINS.chronos_sentinel,
  SKINS.crimson_overlord,
  SKINS.arcane_archon,
  SKINS.apocalypse_knight,
  SKINS.eclipse_valkyrie,
  SKINS.galaxy_phantom,
  SKINS.blood_sovereign,
  SKINS.omnipotent_one,
];

export function createDefaultProgress(): PersistentProgress {
  let legacyBest = 0;
  try {
    const rawBest = localStorage.getItem(LEGACY_BEST_SCORE_KEY);
    if (rawBest) legacyBest = parseInt(rawBest, 10) || 0;
  } catch {
    // Ignore storage error
  }
  return {
    bestScore: legacyBest,
    maxWave: 1,
    maxLevel: 1,
    totalKills: 0,
    bossesDefeated: 0,
    fallenAngelsKilled: 0,
    reapersKilled: 0,
    zombieLeadersKilled: 0,
    maxWeaponUpgradeLevel: 1,
    maxWeaponsUnlocked: 1,
    divineRevives: 0,
    unlockedSkins: ['sentinel'],
    selectedSkin: 'sentinel',
  };
}

export function loadProgress(): PersistentProgress {
  const def = createDefaultProgress();
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return def;
    const parsed = JSON.parse(raw) as Partial<PersistentProgress>;
    const unlocked = Array.isArray(parsed.unlockedSkins)
      ? Array.from(
          new Set<SkinId>([
            'sentinel',
            ...parsed.unlockedSkins.filter((s): s is SkinId => s in SKINS),
          ])
        )
      : ['sentinel' as SkinId];
    const selected =
      parsed.selectedSkin && unlocked.includes(parsed.selectedSkin)
        ? parsed.selectedSkin
        : 'sentinel';

    return {
      bestScore: Math.max(def.bestScore, Number(parsed.bestScore) || 0),
      maxWave: Math.max(1, Number(parsed.maxWave) || 1),
      maxLevel: Math.max(1, Number(parsed.maxLevel) || 1),
      totalKills: Math.max(0, Number(parsed.totalKills) || 0),
      bossesDefeated: Math.max(0, Number(parsed.bossesDefeated) || 0),
      fallenAngelsKilled: Math.max(0, Number(parsed.fallenAngelsKilled) || 0),
      reapersKilled: Math.max(0, Number(parsed.reapersKilled) || 0),
      zombieLeadersKilled: Math.max(0, Number(parsed.zombieLeadersKilled) || 0),
      maxWeaponUpgradeLevel: Math.max(1, Number(parsed.maxWeaponUpgradeLevel) || 1),
      maxWeaponsUnlocked: Math.max(1, Number(parsed.maxWeaponsUnlocked) || 1),
      divineRevives: Math.max(0, Number(parsed.divineRevives) || 0),
      unlockedSkins: unlocked,
      selectedSkin: selected,
    };
  } catch {
    return def;
  }
}

export function saveProgress(progress: PersistentProgress): void {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    localStorage.setItem(LEGACY_BEST_SCORE_KEY, String(progress.bestScore));
  } catch {
    // Ignore storage restrictions
  }
}

export function evaluateSkinUnlocks(progress: PersistentProgress): {
  nextProgress: PersistentProgress;
  newlyUnlocked: SkinId[];
} {
  const unlockedSet = new Set<SkinId>(progress.unlockedSkins);
  unlockedSet.add('sentinel');
  const newlyUnlocked: SkinId[] = [];

  const check = (id: SkinId, cond: boolean) => {
    if (cond && !unlockedSet.has(id)) {
      unlockedSet.add(id);
      newlyUnlocked.push(id);
    }
  };

  check('crimson_hunter', progress.totalKills >= 60);
  check('cyber_raider', progress.maxWeaponsUnlocked >= 3 || progress.maxLevel >= 5);
  check('shadow_reaper', progress.maxWave >= 4);
  check('golden_champion', progress.bossesDefeated >= 2);
  check('titan_emerald', progress.maxWave >= 7);
  check('celestial_god', progress.divineRevives >= 1);
  check('abyssal_knight', progress.totalKills >= 350);
  check('inferno_warden', progress.bossesDefeated >= 6 && progress.maxLevel >= 10);
  check('arsenal_master', progress.maxWeaponsUnlocked >= 5 && progress.maxWave >= 10);
  check('angel_slayer', progress.fallenAngelsKilled >= 3);
  check('eternal_monarch', progress.maxWave >= 15 || progress.bestScore >= 15000);

  // 15 Leyenda ultra-hard unlocks
  check('void_harbinger', progress.totalKills >= 1000);
  check('bone_emperor', progress.reapersKilled >= 30);
  check('warbanner_breaker', progress.zombieLeadersKilled >= 20);
  check('seraph_bane', progress.fallenAngelsKilled >= 12);
  check('colossus_vanquisher', progress.bossesDefeated >= 15);
  check('omega_forged', progress.maxWeaponUpgradeLevel >= 10);
  check('immortal_phoenix', progress.divineRevives >= 3);
  check('chronos_sentinel', progress.maxWave >= 20);
  check('crimson_overlord', progress.bestScore >= 40000);
  check('arcane_archon', progress.maxLevel >= 18);
  check('apocalypse_knight', progress.totalKills >= 2500 && progress.bossesDefeated >= 25);
  check('eclipse_valkyrie', progress.fallenAngelsKilled >= 25 && progress.maxWave >= 22);
  check('galaxy_phantom', progress.bestScore >= 75000 && progress.maxWeaponsUnlocked >= 5);
  check('blood_sovereign', progress.reapersKilled >= 50 && progress.zombieLeadersKilled >= 35);
  check('omnipotent_one', progress.maxWave >= 30 || progress.bestScore >= 120000);

  return {
    nextProgress: {
      ...progress,
      unlockedSkins: Array.from(unlockedSet),
    },
    newlyUnlocked,
  };
}

export function getSkinProgressLabel(
  id: SkinId,
  p: PersistentProgress
): {
  label: string;
  ratio: number;
} {
  switch (id) {
    case 'sentinel':
      return { label: 'Desbloqueada', ratio: 1 };
    case 'crimson_hunter':
      return {
        label: `${Math.min(60, p.totalKills)} / 60 enemigos`,
        ratio: Math.min(1, p.totalKills / 60),
      };
    case 'cyber_raider':
      return {
        label: `${Math.min(3, p.maxWeaponsUnlocked)}/3 armas o Nv.${Math.min(5, p.maxLevel)}/5`,
        ratio: Math.max(Math.min(1, p.maxWeaponsUnlocked / 3), Math.min(1, p.maxLevel / 5)),
      };
    case 'shadow_reaper':
      return {
        label: `Oleada ${Math.min(4, p.maxWave)} / 4`,
        ratio: Math.min(1, p.maxWave / 4),
      };
    case 'golden_champion':
      return {
        label: `${Math.min(2, p.bossesDefeated)} / 2 jefes`,
        ratio: Math.min(1, p.bossesDefeated / 2),
      };
    case 'titan_emerald':
      return {
        label: `Oleada ${Math.min(7, p.maxWave)} / 7`,
        ratio: Math.min(1, p.maxWave / 7),
      };
    case 'celestial_god':
      return {
        label: p.divineRevives >= 1 ? '1 / 1 milagro' : '0 / 1 milagro (6% al morir)',
        ratio: p.divineRevives >= 1 ? 1 : 0,
      };
    case 'abyssal_knight':
      return {
        label: `${Math.min(350, p.totalKills)} / 350 enemigos`,
        ratio: Math.min(1, p.totalKills / 350),
      };
    case 'inferno_warden':
      return {
        label: `${Math.min(6, p.bossesDefeated)}/6 jefes · Nv.${Math.min(10, p.maxLevel)}/10`,
        ratio: (Math.min(1, p.bossesDefeated / 6) + Math.min(1, p.maxLevel / 10)) / 2,
      };
    case 'arsenal_master':
      return {
        label: `${Math.min(5, p.maxWeaponsUnlocked)}/5 armas · Oleada ${Math.min(10, p.maxWave)}/10`,
        ratio: (Math.min(1, p.maxWeaponsUnlocked / 5) + Math.min(1, p.maxWave / 10)) / 2,
      };
    case 'angel_slayer':
      return {
        label: `${Math.min(3, p.fallenAngelsKilled)} / 3 Ángeles Caídos`,
        ratio: Math.min(1, p.fallenAngelsKilled / 3),
      };
    case 'eternal_monarch':
      return {
        label: `Oleada ${Math.min(15, p.maxWave)}/15 o ${Math.min(15000, p.bestScore)}/15000 pts`,
        ratio: Math.max(Math.min(1, p.maxWave / 15), Math.min(1, p.bestScore / 15000)),
      };
    case 'void_harbinger':
      return {
        label: `${Math.min(1000, p.totalKills)} / 1,000 enemigos`,
        ratio: Math.min(1, p.totalKills / 1000),
      };
    case 'bone_emperor':
      return {
        label: `${Math.min(30, p.reapersKilled)} / 30 Segadores`,
        ratio: Math.min(1, p.reapersKilled / 30),
      };
    case 'warbanner_breaker':
      return {
        label: `${Math.min(20, p.zombieLeadersKilled)} / 20 Zombis Líderes`,
        ratio: Math.min(1, p.zombieLeadersKilled / 20),
      };
    case 'seraph_bane':
      return {
        label: `${Math.min(12, p.fallenAngelsKilled)} / 12 Ángeles Caídos`,
        ratio: Math.min(1, p.fallenAngelsKilled / 12),
      };
    case 'colossus_vanquisher':
      return {
        label: `${Math.min(15, p.bossesDefeated)} / 15 Jefes`,
        ratio: Math.min(1, p.bossesDefeated / 15),
      };
    case 'omega_forged':
      return {
        label: `Arma Nv.${Math.min(10, p.maxWeaponUpgradeLevel)} / 10`,
        ratio: Math.min(1, p.maxWeaponUpgradeLevel / 10),
      };
    case 'immortal_phoenix':
      return {
        label: `${Math.min(3, p.divineRevives)} / 3 milagros divinos`,
        ratio: Math.min(1, p.divineRevives / 3),
      };
    case 'chronos_sentinel':
      return {
        label: `Oleada ${Math.min(20, p.maxWave)} / 20`,
        ratio: Math.min(1, p.maxWave / 20),
      };
    case 'crimson_overlord':
      return {
        label: `${Math.min(40000, p.bestScore)} / 40,000 pts`,
        ratio: Math.min(1, p.bestScore / 40000),
      };
    case 'arcane_archon':
      return {
        label: `Nivel ${Math.min(18, p.maxLevel)} / 18`,
        ratio: Math.min(1, p.maxLevel / 18),
      };
    case 'apocalypse_knight':
      return {
        label: `${Math.min(2500, p.totalKills)}/2500 bajas · ${Math.min(25, p.bossesDefeated)}/25 jefes`,
        ratio: (Math.min(1, p.totalKills / 2500) + Math.min(1, p.bossesDefeated / 25)) / 2,
      };
    case 'eclipse_valkyrie':
      return {
        label: `${Math.min(25, p.fallenAngelsKilled)}/25 Ángeles · Oleada ${Math.min(22, p.maxWave)}/22`,
        ratio: (Math.min(1, p.fallenAngelsKilled / 25) + Math.min(1, p.maxWave / 22)) / 2,
      };
    case 'galaxy_phantom':
      return {
        label: `${Math.min(75000, p.bestScore)}/75000 pts · ${Math.min(5, p.maxWeaponsUnlocked)}/5 armas`,
        ratio: (Math.min(1, p.bestScore / 75000) + Math.min(1, p.maxWeaponsUnlocked / 5)) / 2,
      };
    case 'blood_sovereign':
      return {
        label: `${Math.min(50, p.reapersKilled)}/50 Segadores · ${Math.min(35, p.zombieLeadersKilled)}/35 Líderes`,
        ratio: (Math.min(1, p.reapersKilled / 50) + Math.min(1, p.zombieLeadersKilled / 35)) / 2,
      };
    case 'omnipotent_one':
      return {
        label: `Oleada ${Math.min(30, p.maxWave)}/30 o ${Math.min(120000, p.bestScore)}/120000 pts`,
        ratio: Math.max(Math.min(1, p.maxWave / 30), Math.min(1, p.bestScore / 120000)),
      };
  }
}
