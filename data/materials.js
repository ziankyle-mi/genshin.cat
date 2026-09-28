/**
 * Genshin Impact Leveling Formulas & Domain Schedules
 */

export const ASCENSION_MILESTONES = [
  { level: 20, mora: 20000, sliver: 1, frag: 0, chunk: 0, gem: 0, boss: 0, specialty: 3, commonGrey: 3, commonGreen: 0, commonBlue: 0 },
  { level: 40, mora: 40000, sliver: 0, frag: 3, chunk: 0, gem: 0, boss: 2, specialty: 10, commonGrey: 15, commonGreen: 0, commonBlue: 0 },
  { level: 50, mora: 60000, sliver: 0, frag: 6, chunk: 0, gem: 0, boss: 4, specialty: 20, commonGrey: 0, commonGreen: 12, commonBlue: 0 },
  { level: 60, mora: 80000, sliver: 0, frag: 0, chunk: 3, gem: 0, boss: 8, specialty: 30, commonGrey: 0, commonGreen: 18, commonBlue: 0 },
  { level: 70, mora: 100000, sliver: 0, frag: 0, chunk: 6, gem: 0, boss: 12, specialty: 45, commonGrey: 0, commonGreen: 0, commonBlue: 12 },
  { level: 80, mora: 120000, sliver: 0, frag: 0, chunk: 0, gem: 6, boss: 20, specialty: 60, commonGrey: 0, commonGreen: 0, commonBlue: 24 }
];

export const LEVEL_EXP_TABLE = [
  { level: 1, expTotal: 0, moraExp: 0, wits: 0 },
  { level: 20, expTotal: 120175, moraExp: 24000, wits: 6 },
  { level: 40, expTotal: 578325, moraExp: 115600, wits: 29 },
  { level: 50, expTotal: 962650, moraExp: 192600, wits: 49 },
  { level: 60, expTotal: 1515050, moraExp: 303000, wits: 76 },
  { level: 70, expTotal: 2289525, moraExp: 457800, wits: 115 },
  { level: 80, expTotal: 3374250, moraExp: 674800, wits: 170 },
  { level: 90, expTotal: 8362650, moraExp: 1672530, wits: 419 }
];

export const TALENT_LEVEL_COSTS = [
  { from: 1, to: 2, mora: 12500, teachings: 3, guide: 0, philosophies: 0, commonGrey: 6, commonGreen: 0, commonBlue: 0, weeklyBoss: 0, crown: 0 },
  { from: 2, to: 3, mora: 17500, teachings: 0, guide: 2, philosophies: 0, commonGrey: 0, commonGreen: 3, commonBlue: 0, weeklyBoss: 0, crown: 0 },
  { from: 3, to: 4, mora: 25000, teachings: 0, guide: 4, philosophies: 0, commonGrey: 0, commonGreen: 4, commonBlue: 0, weeklyBoss: 0, crown: 0 },
  { from: 4, to: 5, mora: 30000, teachings: 0, guide: 6, philosophies: 0, commonGrey: 0, commonGreen: 6, commonBlue: 0, weeklyBoss: 0, crown: 0 },
  { from: 5, to: 6, mora: 37500, teachings: 0, guide: 9, philosophies: 0, commonGrey: 0, commonGreen: 9, commonBlue: 0, weeklyBoss: 0, crown: 0 },
  { from: 6, to: 7, mora: 120000, teachings: 0, guide: 0, philosophies: 4, commonGrey: 0, commonGreen: 0, commonBlue: 4, weeklyBoss: 1, crown: 0 },
  { from: 7, to: 8, mora: 260000, teachings: 0, guide: 0, philosophies: 6, commonGrey: 0, commonGreen: 0, commonBlue: 6, weeklyBoss: 1, crown: 0 },
  { from: 8, to: 9, mora: 450000, teachings: 0, guide: 0, philosophies: 12, commonGrey: 0, commonGreen: 0, commonBlue: 9, weeklyBoss: 2, crown: 0 },
  { from: 9, to: 10, mora: 700000, teachings: 0, guide: 0, philosophies: 16, commonGrey: 0, commonGreen: 0, commonBlue: 12, weeklyBoss: 2, crown: 1 }
];

export const DOMAIN_SCHEDULE = {
  Monday: {
    talents: [
      { name: "Freedom (Mondstadt)", characters: "Klee, Sucrose, Tartaglia, Diona, Aloy, Amber, Barbara" },
      { name: "Prosperity (Liyue)", characters: "Yelan, Keqing, Ningguang, Qiqi, Shenhe, Xiao" },
      { name: "Transience (Inazuma)", characters: "Yoimiya, Kokomi, Thoma, Shikanoin Heizou, Kirara" },
      { name: "Admonition (Sumeru)", characters: "Tighnari, Candace, Cyno, Faruzan" },
      { name: "Equity (Fontaine)", characters: "Neuvillette, Navia, Lyney, Sigewinne" }
    ],
    weapons: [
      { name: "Decarabian (Mondstadt)", mats: "Tile / Debris / Fragment / Scattered Piece" },
      { name: "Guyun (Liyue)", mats: "Luminous Sands / Lustrous Stone / Relic / Divine Body" },
      { name: "Distant Sea (Inazuma)", mats: "Coral / Jeweled Branch / Jade Branch / Golden Branch" },
      { name: "Forest Dew (Sumeru)", mats: "Copper / Iron / Silver / Golden Talisman" },
      { name: "Dross (Fontaine)", mats: "Fragment / Broken / Splendid / Masterpiece" }
    ]
  },
  Tuesday: {
    talents: [
      { name: "Resistance (Mondstadt)", characters: "Bennett, Diluc, Jean, Eula, Mona, Razor, Noelle" },
      { name: "Diligence (Liyue)", characters: "Hu Tao, Kaedehara Kazuha, Ganyu, Xiangling, Yun Jin, Yaoyao" },
      { name: "Elegance (Inazuma)", characters: "Kamisato Ayaka, Ayato, Sara, Itto, Kuki Shinobu" },
      { name: "Ingenuity (Sumeru)", characters: "Nahida, Alhaitham, Dori, Layla, Kaveh" },
      { name: "Justice (Fontaine)", characters: "Furina, Clorinde, Charlotte, Freminet" }
    ],
    weapons: [
      { name: "Boreal Wolf (Mondstadt)", mats: "Milk / Cracked Tooth / Broken Fang / Nostalgia" },
      { name: "Mist Veiled (Liyue)", mats: "Lead Elixir / Quicksilver / Gold Elixir / Primo Elixir" },
      { name: "Narukami (Inazuma)", mats: "Wisdom / Joy / Affection / Valor" },
      { name: "Oasis Garden (Sumeru)", mats: "Reminiscence / Kindness / Mourning / Truth" },
      { name: "Sublime Chord (Fontaine)", mats: "Ancient Chord / Movement / Echo / Harmonic" }
    ]
  },
  Wednesday: {
    talents: [
      { name: "Ballad (Mondstadt)", characters: "Venti, Fischl, Rosaria, Albedo, Kaeya, Lisa, Mika" },
      { name: "Gold (Liyue)", characters: "Zhongli, Xingqiu, Beidou, Yanfei, Baizhu, Xianyun" },
      { name: "Light (Inazuma)", characters: "Raiden Shogun, Yae Miko, Sayu, Gorou" },
      { name: "Praxis (Sumeru)", characters: "Wanderer, Dehya, Collei, Nilou, Sethos" },
      { name: "Order (Fontaine)", characters: "Arlecchino, Wriothesley, Lynette, Chevruese, Emilie" }
    ],
    weapons: [
      { name: "Dandelion Gladiator (Mondstadt)", mats: "Fetters / Chains / Shackles / Dream" },
      { name: "Aerosiderite (Liyue)", mats: "Grain / Piece / Bit / Chunk" },
      { name: "Mask (Inazuma)", mats: "Wicked Lieutenant / Tiger's Bite / One-Horned / Kijin" },
      { name: "Scorching Might (Sumeru)", mats: "Echo / Remnant / Glow / Dream" },
      { name: "Pure Sacred Dewdrop (Fontaine)", mats: "Drop / Sublimation / Spring / Essence" }
    ]
  },
  Thursday: {
    talents: [
      { name: "Freedom (Mondstadt)", characters: "Klee, Sucrose, Tartaglia, Diona, Amber, Barbara" },
      { name: "Prosperity (Liyue)", characters: "Yelan, Keqing, Ningguang, Qiqi, Shenhe, Xiao" },
      { name: "Transience (Inazuma)", characters: "Yoimiya, Kokomi, Thoma, Shikanoin Heizou" },
      { name: "Admonition (Sumeru)", characters: "Tighnari, Candace, Cyno, Faruzan" },
      { name: "Equity (Fontaine)", characters: "Neuvillette, Navia, Lyney, Sigewinne" }
    ],
    weapons: [
      { name: "Decarabian (Mondstadt)", mats: "Tile / Debris / Fragment / Scattered Piece" },
      { name: "Guyun (Liyue)", mats: "Luminous Sands / Lustrous Stone / Relic / Divine Body" },
      { name: "Distant Sea (Inazuma)", mats: "Coral / Jeweled Branch / Jade Branch / Golden Branch" },
      { name: "Forest Dew (Sumeru)", mats: "Copper / Iron / Silver / Golden Talisman" },
      { name: "Dross (Fontaine)", mats: "Fragment / Broken / Splendid / Masterpiece" }
    ]
  },
  Friday: {
    talents: [
      { name: "Resistance (Mondstadt)", characters: "Bennett, Diluc, Jean, Eula, Mona, Razor, Noelle" },
      { name: "Diligence (Liyue)", characters: "Hu Tao, Kaedehara Kazuha, Ganyu, Xiangling, Yun Jin" },
      { name: "Elegance (Inazuma)", characters: "Kamisato Ayaka, Ayato, Sara, Itto, Kuki Shinobu" },
      { name: "Ingenuity (Sumeru)", characters: "Nahida, Alhaitham, Dori, Layla, Kaveh" },
      { name: "Justice (Fontaine)", characters: "Furina, Clorinde, Charlotte, Freminet" }
    ],
    weapons: [
      { name: "Boreal Wolf (Mondstadt)", mats: "Milk / Cracked Tooth / Broken Fang / Nostalgia" },
      { name: "Mist Veiled (Liyue)", mats: "Lead Elixir / Quicksilver / Gold Elixir / Primo Elixir" },
      { name: "Narukami (Inazuma)", mats: "Wisdom / Joy / Affection / Valor" },
      { name: "Oasis Garden (Sumeru)", mats: "Reminiscence / Kindness / Mourning / Truth" },
      { name: "Sublime Chord (Fontaine)", mats: "Ancient Chord / Movement / Echo / Harmonic" }
    ]
  },
  Saturday: {
    talents: [
      { name: "Ballad (Mondstadt)", characters: "Venti, Fischl, Rosaria, Albedo, Kaeya, Lisa" },
      { name: "Gold (Liyue)", characters: "Zhongli, Xingqiu, Beidou, Yanfei, Baizhu, Xianyun" },
      { name: "Light (Inazuma)", characters: "Raiden Shogun, Yae Miko, Sayu, Gorou" },
      { name: "Praxis (Sumeru)", characters: "Wanderer, Dehya, Collei, Nilou" },
      { name: "Order (Fontaine)", characters: "Arlecchino, Wriothesley, Lynette, Chevruese" }
    ],
    weapons: [
      { name: "Dandelion Gladiator (Mondstadt)", mats: "Fetters / Chains / Shackles / Dream" },
      { name: "Aerosiderite (Liyue)", mats: "Grain / Piece / Bit / Chunk" },
      { name: "Mask (Inazuma)", mats: "Wicked Lieutenant / Tiger's Bite / One-Horned / Kijin" },
      { name: "Scorching Might (Sumeru)", mats: "Echo / Remnant / Glow / Dream" },
      { name: "Pure Sacred Dewdrop (Fontaine)", mats: "Drop / Sublimation / Spring / Essence" }
    ]
  },
  Sunday: {
    talents: [
      { name: "All Talent Domains Available", characters: "Every character's talent book can be chosen and farmed today!" }
    ],
    weapons: [
      { name: "All Weapon Domains Available", mats: "Every weapon ascension material can be farmed today!" }
    ]
  }
};
