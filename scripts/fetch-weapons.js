import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import genshindb from 'genshin-db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function getMaxSupportedVersion() {
  try {
    const pkgPath = path.resolve(__dirname, '../node_modules/genshin-db/package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const parts = pkg.version.split('.');
      return `${parts[0]}.${parts[1]}`;
    }
  } catch (e) {
    console.warn('Could not read genshin-db package version, defaulting to 5.2');
  }
  return '5.2';
}

function parseVersionNumbers(ver) {
  return (ver || '0').split('.').map(n => parseInt(n, 10) || 0);
}

function compareVersionsDesc(verA, verB) {
  const pA = parseVersionNumbers(verA);
  const pB = parseVersionNumbers(verB);
  const len = Math.max(pA.length, pB.length);
  for (let i = 0; i < len; i++) {
    const a = pA[i] || 0;
    const b = pB[i] || 0;
    if (a !== b) return b - a;
  }
  return 0;
}

function cleanSlug(name) {
  return name
    .toLowerCase()
    .replace(/['."]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function fetchAllWeapons() {
  const maxVersion = getMaxSupportedVersion();
  const maxVerNum = parseFloat(maxVersion);
  console.log(`[fetch-weapons] Detected genshin-db max release version: ${maxVersion}`);

  const weaponNames = genshindb.weapons('names', { matchCategories: true }) || [];
  console.log(`[fetch-weapons] Found ${weaponNames.length} total entries in genshin-db catalog.`);

  const weapons = [];

  for (const rawName of weaponNames) {
    const w = genshindb.weapons(rawName);
    if (!w) continue;

    // Filter unreleased: version must be <= current game version release
    const weaponVerNum = parseFloat(w.version);
    if (!w.version || isNaN(weaponVerNum) || weaponVerNum > maxVerNum) {
      continue;
    }

    if (!w.rarity || !w.costs) continue;

    const weaponId = cleanSlug(w.name);
    const fileIcon = w.images?.filename_icon || '';
    const portraitUrl = fileIcon ? `https://enka.network/ui/${fileIcon}.png` : (w.images?.mihoyo_icon || w.images?.mihoyo_awakenIcon || '');

    // Extract domain weekday from first ascension domain material
    let domainWeekday = ['Sunday'];
    let domainMaterialName = '';
    let eliteDropName = '';
    let commonDropName = '';

    if (w.costs.ascend1 && Array.isArray(w.costs.ascend1)) {
      for (const item of w.costs.ascend1) {
        if (item.name === 'Mora') continue;
        const mat = genshindb.materials(item.name);
        if (mat?.typeText?.includes('Weapon Ascension Material')) {
          domainMaterialName = item.name;
          if (Array.isArray(mat.daysOfWeek) && mat.daysOfWeek.length > 0) {
            domainWeekday = mat.daysOfWeek;
          }
        } else if (!eliteDropName) {
          eliteDropName = item.name;
        } else if (!commonDropName) {
          commonDropName = item.name;
        }
      }
    }

    weapons.push({
      id: weaponId,
      dbId: w.id,
      name: w.name,
      weaponType: w.weaponText,
      rarity: w.rarity,
      portrait: portraitUrl,
      image: portraitUrl,
      version: w.version || '1.0',
      description: w.description || '',
      baseAtk: w.baseAtkValue || 0,
      mainStat: w.mainStatText || '',
      domainMaterial: domainMaterialName,
      domainWeekday,
      eliteDrop: eliteDropName,
      commonDrop: commonDropName,
      costs: w.costs
    });
  }

  // Sort by rarity (descending: 5★ down to 1★), then release date (newest first), then dbId
  weapons.sort((a, b) => {
    if (b.rarity !== a.rarity) {
      return b.rarity - a.rarity;
    }
    const verComp = compareVersionsDesc(a.version, b.version);
    if (verComp !== 0) return verComp;
    return (b.dbId || 0) - (a.dbId || 0);
  });

  console.log(`[fetch-weapons] Processed ${weapons.length} playable weapons.`);
  return weapons;
}

const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('fetch-weapons.js') || 
  process.argv[1].endsWith('fetch-weapons')
);

if (isDirectRun) {
  try {
    const weapons = fetchAllWeapons();
    const srcDir = path.resolve(rootDir, 'src/data');
    const legacyDir = path.resolve(rootDir, 'data');

    if (!fs.existsSync(srcDir)) fs.mkdirSync(srcDir, { recursive: true });
    if (!fs.existsSync(legacyDir)) fs.mkdirSync(legacyDir, { recursive: true });

    const srcPath = path.join(srcDir, 'weapons.json');
    const legacyPath = path.join(legacyDir, 'weapons.json');

    const jsonContent = JSON.stringify(weapons, null, 2);
    fs.writeFileSync(srcPath, jsonContent, 'utf8');
    fs.writeFileSync(legacyPath, jsonContent, 'utf8');

    console.log(`[fetch-weapons] Successfully saved ${weapons.length} weapons to:`);
    console.log(`  - ${srcPath}`);
    console.log(`  - ${legacyPath}`);
  } catch (err) {
    console.error('[fetch-weapons] Error:', err);
    process.exit(1);
  }
}
