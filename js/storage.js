/**
 * Storage Controller for User Roster, Character Goals & Inventory
 */

const ROSTER_STORAGE_KEY = 'genshin_cat_roster_v1';
const INVENTORY_STORAGE_KEY = 'genshin_cat_inventory_v1';

export function getStoredRoster() {
  try {
    const raw = localStorage.getItem(ROSTER_STORAGE_KEY);
    const roster = raw ? JSON.parse(raw) : {};
    // Ensure all entries have talent structures
    Object.keys(roster).forEach(id => {
      const entry = roster[id];
      if (!entry.talent1) entry.talent1 = { current: 1, target: 10 };
      if (!entry.talent2) entry.talent2 = { current: 1, target: 10 };
      if (!entry.talent3) entry.talent3 = { current: 1, target: 10 };
    });
    return roster;
  } catch (e) {
    console.error('Failed to load roster from localStorage', e);
    return {};
  }
}

export function saveStoredRoster(roster) {
  try {
    localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(roster));
  } catch (e) {
    console.error('Failed to save roster to localStorage', e);
  }
}

export function toggleCharacterTrack(charId, defaultCurrent = 1, defaultTarget = 90) {
  const roster = getStoredRoster();
  if (roster[charId]) {
    delete roster[charId];
  } else {
    roster[charId] = {
      tracked: true,
      currentLevel: defaultCurrent,
      targetLevel: defaultTarget,
      talent1: { current: 1, target: 10 },
      talent2: { current: 1, target: 10 },
      talent3: { current: 1, target: 10 }
    };
  }
  saveStoredRoster(roster);
  return roster;
}

export function updateCharacterProgress(charId, currentLevel, targetLevel, talent1, talent2, talent3) {
  const roster = getStoredRoster();
  if (!roster[charId]) {
    roster[charId] = { tracked: true };
  }
  if (currentLevel !== undefined) roster[charId].currentLevel = currentLevel;
  if (targetLevel !== undefined) roster[charId].targetLevel = targetLevel;
  if (talent1) roster[charId].talent1 = talent1;
  if (talent2) roster[charId].talent2 = talent2;
  if (talent3) roster[charId].talent3 = talent3;

  saveStoredRoster(roster);
  return roster;
}

export function isCharacterTracked(charId) {
  const roster = getStoredRoster();
  return !!roster[charId];
}

export function getStoredInventory() {
  try {
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveStoredInventory(inv) {
  try {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inv));
  } catch (e) {
    console.error('Failed to save inventory to localStorage', e);
  }
}

export function setInventoryItem(key, count) {
  const inv = getStoredInventory();
  inv[key] = Math.max(0, parseInt(count, 10) || 0);
  saveStoredInventory(inv);
  return inv;
}

// ==========================================================================
// WEAPON GOALS STORAGE
// ==========================================================================
const WEAPON_GOALS_STORAGE_KEY = 'genshin_cat_weapons_v1';

export function getStoredWeaponGoals() {
  try {
    const raw = localStorage.getItem(WEAPON_GOALS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to load weapon goals from localStorage', e);
    return {};
  }
}

export function saveStoredWeaponGoals(goals) {
  try {
    localStorage.setItem(WEAPON_GOALS_STORAGE_KEY, JSON.stringify(goals));
  } catch (e) {
    console.error('Failed to save weapon goals to localStorage', e);
  }
}

export function toggleWeaponTrack(weaponId, defaultCurrent = 1, defaultTarget = 90) {
  const goals = getStoredWeaponGoals();
  if (goals[weaponId]) {
    delete goals[weaponId];
  } else {
    goals[weaponId] = {
      tracked: true,
      currentLevel: defaultCurrent,
      targetLevel: defaultTarget
    };
  }
  saveStoredWeaponGoals(goals);
  return goals;
}

export function updateWeaponProgress(weaponId, currentLevel, targetLevel) {
  const goals = getStoredWeaponGoals();
  if (!goals[weaponId]) {
    goals[weaponId] = { tracked: true };
  }
  if (currentLevel !== undefined) goals[weaponId].currentLevel = currentLevel;
  if (targetLevel !== undefined) goals[weaponId].targetLevel = targetLevel;
  saveStoredWeaponGoals(goals);
  return goals;
}

export function isWeaponTracked(weaponId) {
  const goals = getStoredWeaponGoals();
  return !!goals[weaponId];
}

// ==========================================================================
// RESIN PLANNER STORAGE (1 resin per 8 min, cap 200)
// ==========================================================================
const RESIN_STORAGE_KEY = 'genshin_cat_resin_v1';

export function getStoredResin() {
  try {
    const raw = localStorage.getItem(RESIN_STORAGE_KEY);
    if (!raw) return { current: 160, updatedAt: Date.now() };
    const data = JSON.parse(raw);
    const now = Date.now();
    const elapsedMinutes = Math.floor((now - (data.updatedAt || now)) / (8 * 60 * 1000));
    const current = Math.min(200, Math.max(0, (data.current ?? 160) + elapsedMinutes));
    return { current, updatedAt: now };
  } catch (e) {
    return { current: 160, updatedAt: Date.now() };
  }
}

export function saveStoredResin(current) {
  const sanitized = Math.min(200, Math.max(0, parseInt(current, 10) || 0));
  const data = { current: sanitized, updatedAt: Date.now() };
  try {
    localStorage.setItem(RESIN_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save resin to localStorage', e);
  }
  return data;
}

// ==========================================================================
// WEEKLY BOSS TRACKER (Resets Monday 4:00 AM server time)
// ==========================================================================
const WEEKLY_BOSSES_KEY = 'genshin_cat_weekly_bosses_v1';

export function getLastMondayResetTime() {
  const now = new Date();
  const d = new Date(now);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(4, 0, 0, 0);
  if (now.getTime() < d.getTime()) {
    d.setDate(d.getDate() - 7);
  }
  return d.getTime();
}

export function getNextMondayResetTime() {
  const lastReset = getLastMondayResetTime();
  return lastReset + 7 * 24 * 60 * 60 * 1000;
}

export function getStoredWeeklyBosses() {
  try {
    const raw = localStorage.getItem(WEEKLY_BOSSES_KEY);
    const lastReset = getLastMondayResetTime();
    if (!raw) return { claimed: [], lastReset };
    const data = JSON.parse(raw);
    // If stored reset is before last Monday 4 AM, clear claimed
    if (!data.lastReset || data.lastReset < lastReset) {
      const fresh = { claimed: [], lastReset };
      saveStoredWeeklyBosses(fresh);
      return fresh;
    }
    return data;
  } catch (e) {
    return { claimed: [], lastReset: getLastMondayResetTime() };
  }
}

export function saveStoredWeeklyBosses(data) {
  try {
    localStorage.setItem(WEEKLY_BOSSES_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save weekly bosses to localStorage', e);
  }
}

export function toggleWeeklyBoss(bossId) {
  const data = getStoredWeeklyBosses();
  const idx = data.claimed.indexOf(bossId);
  if (idx >= 0) {
    data.claimed.splice(idx, 1);
  } else {
    data.claimed.push(bossId);
  }
  saveStoredWeeklyBosses(data);
  return data;
}

// ==========================================================================
// WEAPON ASSIGNMENTS STORAGE (Track which character owns which weapon)
// ==========================================================================
const WEAPON_ASSIGNMENTS_KEY = 'genshin_cat_weapon_assignments_v1';

export function getStoredWeaponAssignments() {
  try {
    const raw = localStorage.getItem(WEAPON_ASSIGNMENTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to load weapon assignments from localStorage', e);
    return {};
  }
}

export function saveStoredWeaponAssignments(assignments) {
  try {
    localStorage.setItem(WEAPON_ASSIGNMENTS_KEY, JSON.stringify(assignments));
  } catch (e) {
    console.error('Failed to save weapon assignments to localStorage', e);
  }
}

export function assignWeaponToCharacter(charId, weaponId) {
  const assignments = getStoredWeaponAssignments();
  // Optional: In Genshin, 1 weapon is equipped to 1 character at a time.
  // If another character had this exact weapon, unassign from previous owner:
  Object.keys(assignments).forEach(cid => {
    if (assignments[cid] === weaponId && cid !== charId) {
      delete assignments[cid];
    }
  });
  assignments[charId] = weaponId;
  saveStoredWeaponAssignments(assignments);
  return assignments;
}

export function unassignWeapon(charId) {
  const assignments = getStoredWeaponAssignments();
  if (assignments[charId]) {
    delete assignments[charId];
    saveStoredWeaponAssignments(assignments);
  }
  return assignments;
}

export function getCharacterAssignedWeapon(charId) {
  const assignments = getStoredWeaponAssignments();
  return assignments[charId] || null;
}

export function getWeaponOwner(weaponId) {
  const assignments = getStoredWeaponAssignments();
  const ownerId = Object.keys(assignments).find(cid => assignments[cid] === weaponId);
  return ownerId || null;
}

// ==========================================================================
// JSON BACKUP EXPORT & IMPORT
// ==========================================================================
export function exportBackupData() {
  return JSON.stringify({
    version: 3,
    exportedAt: new Date().toISOString(),
    roster: getStoredRoster(),
    weaponGoals: getStoredWeaponGoals(),
    weaponAssignments: getStoredWeaponAssignments(),
    inventory: getStoredInventory(),
    weeklyBosses: getStoredWeeklyBosses(),
    resin: getStoredResin()
  }, null, 2);
}

export function importBackupData(jsonString) {
  try {
    const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid JSON backup file');
    }
    if (data.roster) saveStoredRoster(data.roster);
    if (data.weaponGoals) saveStoredWeaponGoals(data.weaponGoals);
    if (data.weaponAssignments) saveStoredWeaponAssignments(data.weaponAssignments);
    if (data.inventory) saveStoredInventory(data.inventory);
    if (data.weeklyBosses) saveStoredWeeklyBosses(data.weeklyBosses);
    if (data.resin && data.resin.current !== undefined) saveStoredResin(data.resin.current);
    return { success: true };
  } catch (e) {
    console.error('Import failed', e);
    return { success: false, error: e.message };
  }
}
