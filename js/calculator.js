import { ASCENSION_MILESTONES, LEVEL_EXP_TABLE, TALENT_LEVEL_COSTS } from '../data/materials.js';

/**
 * Calculates all ascension materials, EXP books, and Mora needed from startLevel to targetLevel
 */
export function calculateAscensionCosts(startLevel = 1, targetLevel = 90) {
  startLevel = Math.max(1, Math.min(90, parseInt(startLevel, 10) || 1));
  targetLevel = Math.max(startLevel, Math.min(90, parseInt(targetLevel, 10) || 90));

  // EXP & Leveling Mora calculation
  const startExpInfo = getClosestExp(startLevel);
  const targetExpInfo = getClosestExp(targetLevel);
  
  const expMora = Math.max(0, targetExpInfo.moraExp - startExpInfo.moraExp);
  const wits = Math.max(0, targetExpInfo.wits - startExpInfo.wits);

  // Ascension phases calculation (milestones at 20, 40, 50, 60, 70, 80)
  const totals = {
    startLevel,
    targetLevel,
    mora: expMora,
    herosWit: wits,
    sliver: 0,
    frag: 0,
    chunk: 0,
    gem: 0,
    bossMat: 0,
    specialty: 0,
    commonGrey: 0,
    commonGreen: 0,
    commonBlue: 0
  };

  ASCENSION_MILESTONES.forEach(phase => {
    if (targetLevel > phase.level && startLevel <= phase.level) {
      totals.mora += phase.mora;
      totals.sliver += phase.sliver;
      totals.frag += phase.frag;
      totals.chunk += phase.chunk;
      totals.gem += phase.gem;
      totals.bossMat += phase.boss;
      totals.specialty += phase.specialty;
      totals.commonGrey += phase.commonGrey;
      totals.commonGreen += phase.commonGreen;
      totals.commonBlue += phase.commonBlue;
    }
  });

  return totals;
}

/**
 * Calculates costs for leveling a single talent from startLevel to targetLevel (1-10)
 */
export function calculateTalentCosts(startLevel = 1, targetLevel = 10) {
  startLevel = Math.max(1, Math.min(10, parseInt(startLevel, 10) || 1));
  targetLevel = Math.max(startLevel, Math.min(10, parseInt(targetLevel, 10) || 10));

  const totals = {
    startLevel,
    targetLevel,
    mora: 0,
    teachings: 0,
    guide: 0,
    philosophies: 0,
    commonGrey: 0,
    commonGreen: 0,
    commonBlue: 0,
    weeklyBoss: 0,
    crown: 0
  };

  for (let lvl = startLevel; lvl < targetLevel; lvl++) {
    const cost = TALENT_LEVEL_COSTS[lvl - 1];
    if (cost) {
      totals.mora += cost.mora;
      totals.teachings += cost.teachings;
      totals.guide += cost.guide;
      totals.philosophies += cost.philosophies;
      totals.commonGrey += cost.commonGrey;
      totals.commonGreen += cost.commonGreen;
      totals.commonBlue += cost.commonBlue;
      totals.weeklyBoss += cost.weeklyBoss;
      totals.crown += cost.crown;
    }
  }

  return totals;
}

/**
 * Calculates all material requirements for a character given their level and 3 talent goals
 */
export function calculateCharacterCosts(char, progress = {}) {
  const currentLevel = progress.currentLevel ?? 1;
  const targetLevel = progress.targetLevel ?? 90;

  const t1 = progress.talent1 || { current: 1, target: 10 };
  const t2 = progress.talent2 || { current: 1, target: 10 };
  const t3 = progress.talent3 || { current: 1, target: 10 };

  const ascCosts = calculateAscensionCosts(currentLevel, targetLevel);
  const t1Costs = calculateTalentCosts(t1.current, t1.target);
  const t2Costs = calculateTalentCosts(t2.current, t2.target);
  const t3Costs = calculateTalentCosts(t3.current, t3.target);

  const totalMora = ascCosts.mora + t1Costs.mora + t2Costs.mora + t3Costs.mora;
  const totalCommonGrey = ascCosts.commonGrey + t1Costs.commonGrey + t2Costs.commonGrey + t3Costs.commonGrey;
  const totalCommonGreen = ascCosts.commonGreen + t1Costs.commonGreen + t2Costs.commonGreen + t3Costs.commonGreen;
  const totalCommonBlue = ascCosts.commonBlue + t1Costs.commonBlue + t2Costs.commonBlue + t3Costs.commonBlue;

  const totalTeachings = t1Costs.teachings + t2Costs.teachings + t3Costs.teachings;
  const totalGuide = t1Costs.guide + t2Costs.guide + t3Costs.guide;
  const totalPhilosophies = t1Costs.philosophies + t2Costs.philosophies + t3Costs.philosophies;
  const totalWeeklyBoss = t1Costs.weeklyBoss + t2Costs.weeklyBoss + t3Costs.weeklyBoss;
  const totalCrowns = t1Costs.crown + t2Costs.crown + t3Costs.crown;

  return {
    charId: char.id,
    charName: char.name,
    mora: totalMora,
    herosWit: ascCosts.herosWit,
    bossMat: {
      name: char.bossMat || 'Ascension Boss Material',
      count: ascCosts.bossMat
    },
    specialty: {
      name: char.localSpecialty || 'Regional Specialty',
      count: ascCosts.specialty
    },
    gemstones: {
      baseName: char.gemstoneName || `${char.element} Gemstone`,
      sliver: ascCosts.sliver,
      frag: ascCosts.frag,
      chunk: ascCosts.chunk,
      gem: ascCosts.gem
    },
    commonDrops: {
      baseName: char.commonDrop || 'Enemy Drop',
      grey: totalCommonGrey,
      green: totalCommonGreen,
      blue: totalCommonBlue,
      total: totalCommonGrey + totalCommonGreen + totalCommonBlue
    },
    talentBooks: {
      baseName: char.talentBook || 'Talent Book',
      teachings: totalTeachings,
      guide: totalGuide,
      philosophies: totalPhilosophies,
      total: totalTeachings + totalGuide + totalPhilosophies
    },
    weeklyBoss: {
      name: char.weeklyBoss || 'Weekly Trounce Drop',
      count: totalWeeklyBoss
    },
    crowns: totalCrowns,
    ascCosts,
    talentCosts: [t1Costs, t2Costs, t3Costs]
  };
}

/**
 * Calculates costs for weapon ascension and leveling (1-90)
 */
export function calculateWeaponCosts(weapon, startLevel = 1, targetLevel = 90) {
  startLevel = Math.max(1, Math.min(90, parseInt(startLevel, 10) || 1));
  targetLevel = Math.max(startLevel, Math.min(90, parseInt(targetLevel, 10) || 90));

  const maxOreByRarity = { 5: 907, 4: 605, 3: 400, 2: 120, 1: 60 };
  const maxOre = maxOreByRarity[weapon.rarity] || 605;
  const levelFraction = Math.max(0, (Math.pow(targetLevel, 2.3) - Math.pow(startLevel, 2.3)) / (Math.pow(90, 2.3) - 1));
  const mysticOre = Math.round(maxOre * levelFraction);
  const levelingMora = mysticOre * 1000;

  let totalMora = levelingMora;
  const materials = {};

  const phases = [
    { lvl: 20, key: 'ascend1' },
    { lvl: 40, key: 'ascend2' },
    { lvl: 50, key: 'ascend3' },
    { lvl: 60, key: 'ascend4' },
    { lvl: 70, key: 'ascend5' },
    { lvl: 80, key: 'ascend6' }
  ];

  phases.forEach(p => {
    if (targetLevel > p.lvl && startLevel <= p.lvl && weapon.costs?.[p.key]) {
      weapon.costs[p.key].forEach(item => {
        if (item.name === 'Mora') {
          totalMora += item.count;
        } else {
          materials[item.name] = (materials[item.name] || 0) + item.count;
        }
      });
    }
  });

  return {
    weaponId: weapon.id,
    weaponName: weapon.name,
    startLevel,
    targetLevel,
    mora: totalMora,
    mysticOre,
    materials
  };
}

/**
 * Calculates resin plan: time to 200 cap and number of runs needed to complete goals
 */
export function calculateResinPlan(currentResin = 160, missingBoss = 0, missingTalentGuides = 0, missingWeaponMats = 0, missingWeekly = 0) {
  const resin = Math.max(0, Math.min(200, parseInt(currentResin, 10) || 0));
  const missingToCap = Math.max(0, 200 - resin);
  const minutesToCap = missingToCap * 8;
  const hoursToCap = Math.floor(minutesToCap / 60);
  const minsToCap = minutesToCap % 60;

  const capTimeStr = missingToCap === 0
    ? 'Resin is Capped'
    : `${hoursToCap > 0 ? `${hoursToCap}h ` : ''}${minsToCap}m to cap`;

  // Runs needed
  const bossRuns = Math.ceil(missingBoss / 2.5); // 2.5 drops per 40 resin run
  const talentRuns = Math.ceil(missingTalentGuides / 2.2); // ~2.2 guide equiv per 20 resin domain run
  const weaponRuns = Math.ceil(missingWeaponMats / 2.2); // ~2.2 tier-3 equiv per 20 resin domain run
  const weeklyRuns = Math.ceil(missingWeekly); // 1 weekly boss per run

  const bossResin = bossRuns * 40;
  const talentResin = talentRuns * 20;
  const weaponResin = weaponRuns * 20;
  const weeklyResin = weeklyRuns <= 3 ? weeklyRuns * 30 : (90 + (weeklyRuns - 3) * 60);

  const totalRuns = bossRuns + talentRuns + weaponRuns + weeklyRuns;
  const totalResin = bossResin + talentResin + weaponResin + weeklyResin;
  const daysNeeded = (totalResin / 180).toFixed(1);

  return {
    currentResin: resin,
    missingToCap,
    minutesToCap,
    capTimeStr,
    bossRuns,
    talentRuns,
    weaponRuns,
    weeklyRuns,
    totalRuns,
    totalResin,
    daysNeeded
  };
}

/**
 * Calculates aggregate material needs across the whole tracked roster and weapons, and checks against inventory
 */
export function calculateRosterTotals(roster = {}, characters = [], inventory = {}, weaponGoals = {}, weapons = [], currentResin = 160) {
  const trackedCharIds = Object.keys(roster);
  const trackedWeaponIds = Object.keys(weaponGoals);

  const result = {
    trackedCount: trackedCharIds.length,
    trackedWeaponsCount: trackedWeaponIds.length,
    totalMora: 0,
    totalWits: 0,
    totalMysticOre: 0,
    totalBossDrops: 0,
    totalSpecialties: 0,
    totalCommonDrops: 0,
    totalTalentBooks: 0,
    totalWeaponMaterials: 0,
    totalWeeklyBoss: 0,
    totalCrowns: 0,
    materialsMap: {}, // key -> { name, category, needed, have, missing }
    characterCosts: [],
    weaponCosts: [],
    resinPlan: null
  };

  const addMat = (key, name, category, count) => {
    if (!count) return;
    if (!result.materialsMap[key]) {
      const have = parseInt(inventory[key], 10) || 0;
      result.materialsMap[key] = {
        key,
        name,
        category,
        needed: 0,
        have,
        missing: 0
      };
    }
    result.materialsMap[key].needed += count;
    result.materialsMap[key].missing = Math.max(0, result.materialsMap[key].needed - result.materialsMap[key].have);
  };

  // 1. Characters
  trackedCharIds.forEach(id => {
    const char = characters.find(c => c.id === id);
    if (!char) return;

    const costs = calculateCharacterCosts(char, roster[id]);
    result.characterCosts.push({ char, costs });

    result.totalMora += costs.mora;
    result.totalWits += costs.herosWit;
    result.totalBossDrops += costs.bossMat.count;
    result.totalSpecialties += costs.specialty.count;
    result.totalCommonDrops += costs.commonDrops.total;
    result.totalTalentBooks += costs.talentBooks.total;
    result.totalWeeklyBoss += costs.weeklyBoss.count;
    result.totalCrowns += costs.crowns;

    // Track detailed materials
    addMat('mora', 'Mora', 'Currency', costs.mora);
    addMat('heros_wit', "Hero's Wit (EXP)", 'EXP', costs.herosWit);
    if (costs.bossMat.count) {
      addMat(`boss_${costs.bossMat.name}`, costs.bossMat.name, 'Boss Drop', costs.bossMat.count);
    }
    if (costs.specialty.count) {
      addMat(`spec_${costs.specialty.name}`, costs.specialty.name, 'Local Specialty', costs.specialty.count);
    }
    if (costs.weeklyBoss.count) {
      addMat(`weekly_${costs.weeklyBoss.name}`, costs.weeklyBoss.name, 'Weekly Boss', costs.weeklyBoss.count);
    }
    if (costs.talentBooks.philosophies) {
      addMat(`book_phil_${costs.talentBooks.baseName}`, `Philosophies of ${costs.talentBooks.baseName}`, 'Talent Book', costs.talentBooks.philosophies);
    }
    if (costs.talentBooks.guide) {
      addMat(`book_guide_${costs.talentBooks.baseName}`, `Guide to ${costs.talentBooks.baseName}`, 'Talent Book', costs.talentBooks.guide);
    }
    if (costs.talentBooks.teachings) {
      addMat(`book_teach_${costs.talentBooks.baseName}`, `Teachings of ${costs.talentBooks.baseName}`, 'Talent Book', costs.talentBooks.teachings);
    }
    if (costs.crowns) {
      addMat('crown_of_insight', 'Crown of Insight', 'Special', costs.crowns);
    }
    if (costs.commonDrops.total) {
      addMat(`common_${costs.commonDrops.baseName}`, `${costs.commonDrops.baseName} Materials`, 'Common Drop', costs.commonDrops.total);
    }
  });

  // 2. Weapons
  trackedWeaponIds.forEach(id => {
    const weapon = weapons.find(w => w.id === id);
    if (!weapon) return;

    const userGoal = weaponGoals[id] || { currentLevel: 1, targetLevel: 90 };
    const wCosts = calculateWeaponCosts(weapon, userGoal.currentLevel, userGoal.targetLevel);
    result.weaponCosts.push({ weapon, costs: wCosts });

    result.totalMora += wCosts.mora;
    result.totalMysticOre += wCosts.mysticOre;

    addMat('mora', 'Mora', 'Currency', wCosts.mora);
    addMat('mystic_enhancement_ore', 'Mystic Enhancement Ore', 'Weapon EXP', wCosts.mysticOre);

    Object.entries(wCosts.materials).forEach(([matName, count]) => {
      result.totalWeaponMaterials += count;
      addMat(`wmat_${matName}`, matName, 'Weapon Material', count);
    });
  });

  // Calculate missing sums for resin plan
  let missingBoss = 0;
  let missingTalentGuides = 0;
  let missingWeaponMats = 0;
  let missingWeekly = 0;

  Object.values(result.materialsMap).forEach(mat => {
    if (mat.category === 'Boss Drop') missingBoss += mat.missing;
    if (mat.category === 'Talent Book') missingTalentGuides += mat.missing;
    if (mat.category === 'Weapon Material') missingWeaponMats += mat.missing;
    if (mat.category === 'Weekly Boss') missingWeekly += mat.missing;
  });

  result.resinPlan = calculateResinPlan(currentResin, missingBoss, missingTalentGuides, missingWeaponMats, missingWeekly);

  return result;
}

function getClosestExp(level) {
  let result = LEVEL_EXP_TABLE[0];
  for (const entry of LEVEL_EXP_TABLE) {
    if (entry.level <= level) {
      result = entry;
    } else {
      break;
    }
  }
  return result;
}

export function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

