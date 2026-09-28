import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import genshindb from 'genshin-db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Helper to determine the current max release version supported by installed genshin-db
function getMaxSupportedVersion() {
  try {
    const pkgPath = path.resolve(__dirname, '../node_modules/genshin-db/package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const parts = pkg.version.split('.');
      return `${parts[0]}.${parts[1]}`; // e.g. "5.2"
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
    if (a !== b) return b - a; // Descending: newer version first
  }
  return 0;
}

function cleanSlug(name) {
  return name
    .toLowerCase()
    .replace(/['.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function fetchAllCharacters() {
  const maxVersion = getMaxSupportedVersion();
  const maxVerNum = parseFloat(maxVersion);
  console.log(`[fetch-characters] Detected genshin-db max release version: ${maxVersion}`);

  const characterNames = genshindb.characters('names', { matchCategories: true }) || [];
  console.log(`[fetch-characters] Found ${characterNames.length} total entries in genshin-db catalog.`);

  const characters = [];

  for (const rawName of characterNames) {
    // Exclude Lumine so Traveler is represented as exactly one entry (Aether -> Traveler)
    if (rawName === 'Lumine') continue;

    // Exclude unreleased mannequin / test models
    if (rawName === 'Manekin' || rawName === 'Manekina' || rawName.startsWith('Test')) {
      continue;
    }

    const c = genshindb.characters(rawName);
    if (!c) continue;

    // Filter unreleased: version must be <= current game version release
    const charVerNum = parseFloat(c.version);
    if (!c.version || isNaN(charVerNum) || charVerNum > maxVerNum) {
      continue;
    }

    // Must be playable: has rarity and weapon
    if (!c.rarity || !c.weaponText) continue;

    const isTraveler = (rawName === 'Aether');
    const charName = isTraveler ? 'Traveler' : c.name;
    const charId = isTraveler ? 'traveler' : cleanSlug(c.name);

    // Region & Element
    let region = c.region || '';
    if (isTraveler) region = 'Teyvat';
    else if (c.name === 'Aloy') region = 'Other';
    else if (!region && c.associationType === 'ASSOC_MAINACTOR') region = 'Teyvat';

    let element = c.elementText;
    if (isTraveler || element === 'None' || !element) {
      element = 'Anemo'; // Default traveler resonance
    }

    // Reliable high-availability CDN image (enka.network / hoyoverse fallback)
    const fileIcon = isTraveler ? 'UI_AvatarIcon_PlayerBoy' : (c.images?.filename_icon || '');
    const portraitUrl = fileIcon ? `https://enka.network/ui/${fileIcon}.png` : (c.images?.mihoyo_icon || c.images?.['hoyolab-avatar'] || '');

    // Ascension Materials Extraction
    const ascensionTotalMap = {};
    let bossMatName = '';
    let localSpecialtyName = '';
    let gemstoneBaseName = '';
    let commonDropName = '';

    if (c.costs) {
      for (const phase of Object.keys(c.costs)) {
        const items = c.costs[phase] || [];
        for (const it of items) {
          if (it.name === 'Mora') continue;
          ascensionTotalMap[it.name] = (ascensionTotalMap[it.name] || 0) + it.count;

          // Identify material categories
          if (it.name.includes('Sliver') || it.name.includes('Fragment') || it.name.includes('Chunk') || it.name.includes('Gemstone')) {
            gemstoneBaseName = it.name.replace(/( Sliver| Fragment| Chunk| Gemstone)/g, '');
          }
        }
      }

      // Identify Boss Material & Local Specialty from ascend2 (which has 4 items: Mora, Gem Fragment, Boss Mat, Local Spec, Common Mat)
      const a2 = c.costs.ascend2 || [];
      for (const it of a2) {
        if (it.name === 'Mora') continue;
        if (it.name.includes('Fragment') || it.name.includes('Sliver')) continue;
        // Boss materials require 2 at ascend2
        if (it.count === 2) {
          bossMatName = it.name;
        } else if (it.count === 10) {
          localSpecialtyName = it.name;
        } else if (it.count === 15) {
          commonDropName = it.name.replace(/^(Old |Damaged |Divining |Firm |Slime |Whopperflower |Treasure Hoarder |Stained |Recruit's |Tattered )/, '');
        }
      }

      // Ascend 1 fallback for local specialty if not found
      if (!localSpecialtyName && c.costs.ascend1) {
        const a1 = c.costs.ascend1.find(it => it.count === 3 && !it.name.includes('Sliver') && it.name !== 'Mora');
        if (a1) localSpecialtyName = a1.name;
      }
    }

    if (isTraveler) {
      gemstoneBaseName = 'Brilliant Diamond';
      localSpecialtyName = 'Windwheel Aster';
      bossMatName = 'Adventure Rank Rewards';
      commonDropName = 'Damaged Mask';
    }

    const ascensionMaterials = Object.entries(ascensionTotalMap).map(([name, count]) => ({
      name,
      count
    }));

    // Talent Materials Extraction
    const talentQuery = isTraveler ? 'Traveler (Anemo)' : c.name;
    const t = genshindb.talents(talentQuery);
    const talentTotalMap = {};
    let talentBookName = '';
    let weeklyBossName = '';

    if (t && t.costs) {
      for (const lvl of Object.keys(t.costs)) {
        const items = t.costs[lvl] || [];
        for (const it of items) {
          if (it.name === 'Mora') continue;
          talentTotalMap[it.name] = (talentTotalMap[it.name] || 0) + it.count;
        }
      }

      // Talent book from lvl2
      const lvl2Book = t.costs.lvl2?.find(it => it.name.includes('Teachings of') || it.name.startsWith('Teachings'));
      if (lvl2Book) {
        talentBookName = lvl2Book.name.replace(/^Teachings of\s+/, '');
      }

      // Weekly boss from lvl7 (count === 1)
      const lvl7Weekly = t.costs.lvl7?.find(it => {
        return it.count === 1 && it.name !== 'Crown of Insight' && !it.name.includes('Philosophies');
      });
      if (lvl7Weekly) {
        weeklyBossName = lvl7Weekly.name;
      }
    }

    const talentMaterials = Object.entries(talentTotalMap).map(([name, count]) => ({
      name,
      count
    }));

    // Talent Domain Weekday Extraction
    let talentDomainWeekday = [];
    if (talentBookName) {
      const bookMat = genshindb.materials(`Teachings of ${talentBookName}`);
      if (bookMat && Array.isArray(bookMat.daysOfWeek)) {
        talentDomainWeekday = [...bookMat.daysOfWeek];
      }
    }
    if (talentDomainWeekday.length === 0) {
      talentDomainWeekday = ['Sunday']; // All domains open Sunday
    }

    // Build Character Record matching all required keys and convenient aliases
    const charRecord = {
      id: charId,
      dbId: c.id,
      name: charName,
      title: c.title || '',
      description: c.description || '',
      element: element,
      weaponType: c.weaponText,
      'weapon type': c.weaponText,
      weapon: c.weaponText,
      rarity: c.rarity,
      region: region,
      portrait: portraitUrl,
      portraitUrl: portraitUrl,
      'portrait URL': portraitUrl,
      image: portraitUrl, // For backward compatibility with existing card templates
      version: c.version || '1.0',
      // Ascension
      ascensionMaterials,
      'ascension materials': ascensionMaterials,
      bossMat: bossMatName || 'Ascension Boss Drop',
      localSpecialty: localSpecialtyName || 'Regional Specialty',
      gemstoneName: gemstoneBaseName || `${element} Gemstone`,
      commonDrop: commonDropName || 'Enemy Drop',
      // Talents
      talentMaterials,
      'talent materials': talentMaterials,
      talentBook: talentBookName || 'Talent Book',
      weeklyBoss: weeklyBossName || 'Weekly Trounce Drop',
      talentDomainWeekday,
      'talent domain weekday': talentDomainWeekday,
      talent_domain_weekday: talentDomainWeekday
    };

    characters.push(charRecord);
  }

  // Sort by rarity (5★ first, then 4★), then release date / version (newest first within tier)
  characters.sort((a, b) => {
    // 1. Rarity descending (5★ before 4★)
    if (b.rarity !== a.rarity) return b.rarity - a.rarity;

    // 2. Release date / version descending (newest first)
    const verComp = compareVersionsDesc(a.version, b.version);
    if (verComp !== 0) return verComp;

    // 3. ID tie-breaker descending (higher internal id = newer addition in same version)
    return (b.dbId || 0) - (a.dbId || 0);
  });

  return characters;
}

// Main execution
function main() {
  const characters = fetchAllCharacters();

  // Create src/data directory
  const srcDataDir = path.join(rootDir, 'src', 'data');
  if (!fs.existsSync(srcDataDir)) {
    fs.mkdirSync(srcDataDir, { recursive: true });
  }

  // Also ensure data directory exists
  const publicDataDir = path.join(rootDir, 'data');
  if (!fs.existsSync(publicDataDir)) {
    fs.mkdirSync(publicDataDir, { recursive: true });
  }

  const srcDataPath = path.join(srcDataDir, 'characters.json');
  const publicDataPath = path.join(publicDataDir, 'characters.json');
  const publicJsPath = path.join(publicDataDir, 'characters.js');

  const jsonContent = JSON.stringify(characters, null, 2);
  const jsContent = `/**
 * Generated by scripts/fetch-characters.js
 * Total Playable Characters: ${characters.length}
 */

export const CHARACTERS = ${jsonContent};
`;

  fs.writeFileSync(srcDataPath, jsonContent, 'utf8');
  fs.writeFileSync(publicDataPath, jsonContent, 'utf8');
  fs.writeFileSync(publicJsPath, jsContent, 'utf8');

  console.log(`\n======================================================`);
  console.log(`[fetch-characters] SUCCESS!`);
  console.log(`[fetch-characters] Total playable characters: ${characters.length}`);
  console.log(`[fetch-characters] 5-Star characters: ${characters.filter(c => c.rarity === 5).length}`);
  console.log(`[fetch-characters] 4-Star characters: ${characters.filter(c => c.rarity === 4).length}`);
  console.log(`[fetch-characters] Written to:`);
  console.log(`  - ${srcDataPath}`);
  console.log(`  - ${publicDataPath}`);
  console.log(`  - ${publicJsPath}`);
  console.log(`======================================================\n`);
}

main();
