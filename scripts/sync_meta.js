import fs from 'fs';
import path from 'path';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

// Numeric rank per tier label — higher = better
const TIER_RANK = {
  'SSS+': 10, 'SSS': 9, 'SS+': 8, 'SS': 7,
  'S+': 6, 'S': 5, 'A+': 4, 'A': 3,
  'B+': 2, 'B': 1, 'C': 0, 'D': -1,
};

function normalizeTier(raw) {
  if (!raw) return null;
  const t = raw.toUpperCase().trim();
  if (t.includes('SSS') || t === 'APEX' || t === 'BROKEN') return 'SSS';
  if (t === 'SS') return 'SS';
  if (t === 'S') return 'S';
  if (t === 'A') return 'A';
  if (t === 'B') return 'B';
  if (t === 'C') return 'C';
  if (t === 'D') return 'D';
  return null;
}

function normalizeName(raw) {
  return raw
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

// ─── SOURCE 1: genshin.gg ─────────────────────────────────────────────────

async function fetchGenshinGG() {
  console.log('  Fetching genshin.gg/tier-list ...');
  const result = {};
  try {
    const res = await fetch('https://genshin.gg/tier-list/', { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // data-tier="S" ... alt="CharacterName"
    const re = /data-tier="([^"]+)"[^>]*>[\s\S]*?alt="([^"]+)"/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const tier = normalizeTier(m[1]);
      const name = normalizeName(m[2].replace(/\s*-\s*Genshin Impact.*$/i, '').trim());
      if (tier && name && !result[name]) result[name] = tier;
    }

    // Fallback: tier="S" pattern (older structure)
    if (Object.keys(result).length < 5) {
      const re2 = /\btier="([^"]+)"[^>]*>[\s\S]{0,400}?alt="([^"]+)"/g;
      while ((m = re2.exec(html)) !== null) {
        const tier = normalizeTier(m[1]);
        const name = normalizeName(m[2]);
        if (tier && name && !result[name]) result[name] = tier;
      }
    }

    console.log(`    ✓ genshin.gg: ${Object.keys(result).length} characters`);
  } catch (e) {
    console.error(`    ✗ genshin.gg failed: ${e.message}`);
  }
  return result;
}

// ─── SOURCE 2: game8.co ───────────────────────────────────────────────────

async function fetchGame8() {
  console.log('  Fetching game8.co ...');
  const result = {};
  try {
    const res = await fetch('https://game8.co/games/Genshin-Impact/archives/297465', { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // Game8 uses h3 headings like "SS Tier" then character links below
    const tierSections = html.split(/<h[23][^>]*>/i);
    for (const section of tierSections) {
      const tierMatch = section.match(/^(SSS\+?|SSS|SS\+?|S\+?|A\+?|B\+?|C|D)\s*Tier/i);
      if (!tierMatch) continue;
      const tier = normalizeTier(tierMatch[1]);
      if (!tier) continue;

      const nameRe = /alt="([^"]+?)(?:\s*[-|]\s*(?:Genshin[^"]*)?)?"/gi;
      let nm;
      while ((nm = nameRe.exec(section)) !== null) {
        const name = normalizeName(nm[1]);
        if (name.length > 1 && !result[name]) result[name] = tier;
      }
    }

    console.log(`    ✓ game8.co: ${Object.keys(result).length} characters`);
  } catch (e) {
    console.error(`    ✗ game8.co failed: ${e.message}`);
  }
  return result;
}

// ─── SOURCE 3: prydwen.gg ─────────────────────────────────────────────────

async function fetchPrydwen() {
  console.log('  Fetching prydwen.gg ...');
  const result = {};
  try {
    const res = await fetch('https://www.prydwen.gg/genshin-impact/tier-list', { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // Prydwen embeds JSON data in Next.js __NEXT_DATA__ script tag
    const jsonMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(\{[\s\S]+?\})<\/script>/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        const pageProps = data?.props?.pageProps;
        const chars = pageProps?.tierListCharacters || pageProps?.characters || [];
        for (const c of chars) {
          const tier = normalizeTier(c.tier || c.rating);
          if (!tier) continue;
          if (c.slug) result[normalizeName(c.slug)] = tier;
          if (c.name) result[normalizeName(c.name)] = tier;
        }
      } catch (_) { /* JSON parse failed */ }
    }

    // HTML fallback: tier sections with character alt texts
    if (Object.keys(result).length < 5) {
      const sectionRe = /class="[^"]*tier-([SABCD][+]?)[^"]*">([\s\S]*?)(?=class="[^"]*tier-[SABCD]|<\/section)/gi;
      let tb;
      while ((tb = sectionRe.exec(html)) !== null) {
        const tier = normalizeTier(tb[1]);
        if (!tier) continue;
        const nameRe = /alt="([^"]+?)(?:\s*[-|][^"]+)?"/gi;
        let nm;
        while ((nm = nameRe.exec(tb[2])) !== null) {
          const name = normalizeName(nm[1]);
          if (name.length > 1 && !result[name]) result[name] = tier;
        }
      }
    }

    console.log(`    ✓ prydwen.gg: ${Object.keys(result).length} characters`);
  } catch (e) {
    console.error(`    ✗ prydwen.gg failed: ${e.message}`);
  }
  return result;
}

// ─── CONSENSUS MERGE ──────────────────────────────────────────────────────

function mergeConsensus(gg, g8, prydwen) {
  const allNames = new Set([...Object.keys(gg), ...Object.keys(g8), ...Object.keys(prydwen)]);
  const consensus = {};

  for (const name of allNames) {
    const tiers = [gg[name], g8[name], prydwen[name]].filter(Boolean);
    if (tiers.length === 0) continue;

    const ranks = tiers.map(t => TIER_RANK[t] ?? 3);
    const avg = ranks.reduce((a, b) => a + b, 0) / ranks.length;

    let best = 'A';
    let bestDiff = Infinity;
    for (const [label, rank] of Object.entries(TIER_RANK)) {
      const diff = Math.abs(rank - avg);
      if (diff < bestDiff) { bestDiff = diff; best = label; }
    }

    consensus[name] = {
      tier: best,
      sources: {
        genshinGG: gg[name] || null,
        game8: g8[name] || null,
        prydwen: prydwen[name] || null,
      }
    };
  }

  return consensus;
}

// ─── ROLE / ELEMENT LOOKUP ────────────────────────────────────────────────

const KNOWN_ROLES = {
  'neuvillette': { role: 'Main DPS', element: 'Hydro' },
  'furina': { role: 'Support', element: 'Hydro' },
  'arlecchino': { role: 'Main DPS', element: 'Pyro' },
  'kaedehara-kazuha': { role: 'Support', element: 'Anemo' },
  'nahida': { role: 'Support', element: 'Dendro' },
  'zhongli': { role: 'Sustain', element: 'Geo' },
  'bennett': { role: 'Support', element: 'Pyro' },
  'raiden-shogun': { role: 'Sub-DPS', element: 'Electro' },
  'yelan': { role: 'Sub-DPS', element: 'Hydro' },
  'hu-tao': { role: 'Main DPS', element: 'Pyro' },
  'navia': { role: 'Main DPS', element: 'Geo' },
  'kamisato-ayaka': { role: 'Main DPS', element: 'Cryo' },
  'xiangling': { role: 'Sub-DPS', element: 'Pyro' },
  'xingqiu': { role: 'Sub-DPS', element: 'Hydro' },
  'ganyu': { role: 'Main DPS', element: 'Cryo' },
  'kokomi': { role: 'Sustain', element: 'Hydro' },
  'shenhe': { role: 'Support', element: 'Cryo' },
  'albedo': { role: 'Sub-DPS', element: 'Geo' },
  'fischl': { role: 'Sub-DPS', element: 'Electro' },
  'yoimiya': { role: 'Main DPS', element: 'Pyro' },
  'tartaglia': { role: 'Main DPS', element: 'Hydro' },
  'eula': { role: 'Main DPS', element: 'Cryo' },
  'klee': { role: 'Main DPS', element: 'Pyro' },
  'jean': { role: 'Sustain', element: 'Anemo' },
  'venti': { role: 'Support', element: 'Anemo' },
  'xiao': { role: 'Main DPS', element: 'Anemo' },
  'alhaitham': { role: 'Main DPS', element: 'Dendro' },
  'nilou': { role: 'Sub-DPS', element: 'Hydro' },
  'kuki-shinobu': { role: 'Sustain', element: 'Electro' },
  'cyno': { role: 'Main DPS', element: 'Electro' },
  'wanderer': { role: 'Main DPS', element: 'Anemo' },
  'baizhu': { role: 'Sustain', element: 'Dendro' },
  'chiori': { role: 'Sub-DPS', element: 'Geo' },
  'wriothesley': { role: 'Main DPS', element: 'Cryo' },
  'lyney': { role: 'Main DPS', element: 'Pyro' },
  'sigewinne': { role: 'Sustain', element: 'Hydro' },
  'emilie': { role: 'Sub-DPS', element: 'Dendro' },
  'chasca': { role: 'Main DPS', element: 'Anemo' },
  'mavuika': { role: 'Main DPS', element: 'Pyro' },
  'citlali': { role: 'Support', element: 'Cryo' },
  'kinich': { role: 'Main DPS', element: 'Dendro' },
  'xilonen': { role: 'Support', element: 'Geo' },
  'ororon': { role: 'Sub-DPS', element: 'Electro' },
  'varesa': { role: 'Main DPS', element: 'Electro' },
  'escoffier': { role: 'Support', element: 'Cryo' },
  'lan-yan': { role: 'Support', element: 'Anemo' },
  'sara': { role: 'Support', element: 'Electro' },
  'diona': { role: 'Sustain', element: 'Cryo' },
  'sucrose': { role: 'Support', element: 'Anemo' },
  'beidou': { role: 'Sub-DPS', element: 'Electro' },
  'rosaria': { role: 'Sub-DPS', element: 'Cryo' },
  'chongyun': { role: 'Sub-DPS', element: 'Cryo' },
  'xinyan': { role: 'Sub-DPS', element: 'Pyro' },
  'noelle': { role: 'Main DPS', element: 'Geo' },
  'razor': { role: 'Main DPS', element: 'Electro' },
  'amber': { role: 'Support', element: 'Pyro' },
  'barbara': { role: 'Sustain', element: 'Hydro' },
  'lisa': { role: 'Sub-DPS', element: 'Electro' },
  'kaeya': { role: 'Sub-DPS', element: 'Cryo' },
};

// ─── MAIN ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔄 Syncing tier list from 3 sources...\n');

  const [gg, g8, prydwen] = await Promise.all([
    fetchGenshinGG(),
    fetchGame8(),
    fetchPrydwen(),
  ]);

  const okCount = [gg, g8, prydwen].filter(s => Object.keys(s).length > 0).length;

  if (okCount === 0) {
    console.error('\n❌ All 3 sources failed. Keeping existing data/meta_tiers.js unchanged.');
    process.exit(1);
  }

  if (okCount < 3) {
    console.warn(`\n⚠️  Only ${okCount}/3 sources returned data. Continuing with partial data.`);
  }

  console.log('\n🧮 Computing consensus tiers...');
  const consensus = mergeConsensus(gg, g8, prydwen);

  const META_ROSTER = Object.entries(consensus)
    .map(([nameKey, data]) => {
      const known = KNOWN_ROLES[nameKey] || {};
      const displayName = nameKey
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      return {
        id: nameKey,
        name: displayName,
        element: known.element || 'Unknown',
        role: known.role || 'Unknown',
        tier: data.tier,
        scores: data.sources,
      };
    })
    .sort((a, b) => (TIER_RANK[b.tier] ?? -1) - (TIER_RANK[a.tier] ?? -1));

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const output = `/**
 * AUTO-GENERATED by scripts/sync_meta.js — DO NOT EDIT MANUALLY
 * Sources: genshin.gg, game8.co, prydwen.gg
 * Last synced: ${now.toISOString()}
 *
 * genshin.gg → ${Object.keys(gg).length} chars
 * game8.co   → ${Object.keys(g8).length} chars
 * prydwen.gg → ${Object.keys(prydwen).length} chars
 */

export const LAST_SYNCED = "${dateStr}";
export const SOURCES = ["genshin.gg", "game8.co", "prydwen.gg"];

export const META_ROSTER = ${JSON.stringify(META_ROSTER, null, 2)};
`;

  const outPath = path.resolve('data/meta_tiers.js');
  fs.writeFileSync(outPath, output, 'utf-8');
  console.log(`\n✅ Written ${META_ROSTER.length} characters to ${outPath}`);
  console.log(`   Synced: ${dateStr}`);
}

main();

