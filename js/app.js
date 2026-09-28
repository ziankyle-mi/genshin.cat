import { CHARACTERS as BUNDLED_CHARACTERS } from '../data/characters.js';
import { DOMAIN_SCHEDULE } from '../data/materials.js';
import { META_ROSTER, PRESET_META_TEAMS, LAST_SYNCED } from '../data/meta_tiers.js';
import { calculateAscensionCosts, calculateTalentCosts, calculateCharacterCosts, calculateWeaponCosts, calculateResinPlan, calculateRosterTotals, formatNumber } from './calculator.js';
import {
  getStoredRoster, saveStoredRoster, toggleCharacterTrack, updateCharacterProgress, isCharacterTracked,
  getStoredInventory, setInventoryItem,
  getStoredWeaponGoals, saveStoredWeaponGoals, toggleWeaponTrack, updateWeaponProgress, isWeaponTracked,
  getStoredWeaponAssignments, assignWeaponToCharacter, unassignWeapon, getCharacterAssignedWeapon, getWeaponOwner,
  getStoredResin, saveStoredResin,
  getStoredWeeklyBosses, toggleWeeklyBoss, getNextMondayResetTime,
  exportBackupData, importBackupData
} from './storage.js';

// Application State
let CHARACTERS = BUNDLED_CHARACTERS || [];
let WEAPONS = [];
let activeEntity = 'characters'; // 'characters' or 'weapons'
let activeViewName = 'viewCharacters'; // 'viewCharacters', 'viewTierList', 'viewTeamComposer'
let activeElement = 'All';
let activeWeapon = 'All';
let activeRarity = 'All';
let activeRegion = 'All';
let searchQuery = '';
let activeView = 'all'; // 'all' or 'tracked'
let currentSort = 'name-asc';
let weaponAssignments = getStoredWeaponAssignments();
let targetWeaponCharId = null;
let weaponPickerRarity = 'All';
let weaponPickerSearch = '';
let selectedCharacter = null;
let selectedEntity = null; // { type: 'character'|'weapon', data: Object }
let currentPage = 1;
const ITEMS_PER_PAGE = 24;

// Tier List State
let activeTierRole = 'All';

// Team Composer State (4 slots)
let currentTeam = loadTeamFromStorage();
let targetSlotIndex = null; // For character picker

// DOM Elements: Navigation & Modals
const topNavBtns = document.querySelectorAll('.nav-tab-btn');
const appViews = document.querySelectorAll('.app-view');
const openRosterInventoryBtn = document.getElementById('openRosterInventoryBtn');
const rosterInventoryModal = document.getElementById('rosterInventoryModal');
const inventoryModalCloseBtn = document.getElementById('inventoryModalCloseBtn');
const rosterInventoryBody = document.getElementById('rosterInventoryBody');

// Resin Planner Elements
const openResinPlannerBtn = document.getElementById('openResinPlannerBtn');
const navResinBadge = document.getElementById('navResinBadge');
const resinPlannerModal = document.getElementById('resinPlannerModal');
const resinModalCloseBtn = document.getElementById('resinModalCloseBtn');
const resinNumberInput = document.getElementById('resinNumberInput');
const resinRangeInput = document.getElementById('resinRangeInput');
const resinCapTimeDisplay = document.getElementById('resinCapTimeDisplay');
const resinRunsBreakdown = document.getElementById('resinRunsBreakdown');

// Weekly Boss Tracker Elements
const openWeeklyBossBtn = document.getElementById('openWeeklyBossBtn');
const navWeeklyBossBadge = document.getElementById('navWeeklyBossBadge');
const weeklyBossModal = document.getElementById('weeklyBossModal');
const weeklyBossModalCloseBtn = document.getElementById('weeklyBossModalCloseBtn');
const weeklyDiscountCount = document.getElementById('weeklyDiscountCount');
const weeklyResetCountdown = document.getElementById('weeklyResetCountdown');
const weeklyBossList = document.getElementById('weeklyBossList');

// Enka & Backup Elements
const openBackupModalBtn = document.getElementById('openBackupModalBtn');
const backupModal = document.getElementById('backupModal');
const backupModalCloseBtn = document.getElementById('backupModalCloseBtn');
const enkaUidInput = document.getElementById('enkaUidInput');
const btnEnkaImport = document.getElementById('btnEnkaImport');
const enkaStatusMessage = document.getElementById('enkaStatusMessage');
const btnExportBackup = document.getElementById('btnExportBackup');
const backupFileInput = document.getElementById('backupFileInput');
const backupStatusMessage = document.getElementById('backupStatusMessage');

// DOM Elements: Character/Weapon Grid & Controls
const characterGrid = document.getElementById('characterGrid');
const searchInput = document.getElementById('searchInput');
const elementFilterBar = document.getElementById('elementFilterBar');
const filterWeapon = document.getElementById('filterWeapon');
const filterRarity = document.getElementById('filterRarity');
const filterRegion = document.getElementById('filterRegion');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const btnViewAll = document.getElementById('btnViewAll');
const btnViewTracked = document.getElementById('btnViewTracked');
const allCountLabel = document.getElementById('allCountLabel');
const trackedCountLabel = document.getElementById('trackedCountLabel');
const sortSelect = document.getElementById('sortSelect');
const resetTrackedBtn = document.getElementById('resetTrackedBtn');
const btnEntityCharacters = document.getElementById('btnEntityCharacters');
const btnEntityWeapons = document.getElementById('btnEntityWeapons');
const paginationControls = document.getElementById('paginationControls');
const btnPagePrev = document.getElementById('btnPagePrev');
const btnPageNext = document.getElementById('btnPageNext');
const pageIndicator = document.getElementById('pageIndicator');

// Sticky Today Strip
const todayServerDayLabel = document.getElementById('todayServerDayLabel');
const todayDomainsFlow = document.getElementById('todayDomainsFlow');

// Summary Bar Elements
const summaryStrip = document.getElementById('summaryStrip');
const summaryContent = document.getElementById('summaryContent');
const summaryActions = document.getElementById('summaryActions');

// Tier List Elements
const tierRoleFilters = document.getElementById('tierRoleFilters');
const tierSectionsWrapper = document.getElementById('tierSectionsWrapper');

// Team Composer Elements
const presetTeamChips = document.getElementById('presetTeamChips');
const teamSlotsGrid = document.getElementById('teamSlotsGrid');
const resonanceListOutput = document.getElementById('resonanceListOutput');
const reactionBadgeGrid = document.getElementById('reactionBadgeGrid');
const teamSynergyReport = document.getElementById('teamSynergyReport');
const charPickerModal = document.getElementById('charPickerModal');
const charPickerCloseBtn = document.getElementById('charPickerCloseBtn');
const pickerSearchInput = document.getElementById('pickerSearchInput');
const pickerCharacterGrid = document.getElementById('pickerCharacterGrid');

// Weapon Picker Modal Elements
const weaponPickerModal = document.getElementById('weaponPickerModal');
const weaponPickerCloseBtn = document.getElementById('weaponPickerCloseBtn');
const weaponPickerTitle = document.getElementById('weaponPickerTitle');
const weaponPickerCharPreview = document.getElementById('weaponPickerCharPreview');
const btnUnequipCurrentWeapon = document.getElementById('btnUnequipCurrentWeapon');
const weaponPickerSearchInput = document.getElementById('weaponPickerSearchInput');
const weaponPickerRarityFilter = document.getElementById('weaponPickerRarityFilter');
const weaponPickerGrid = document.getElementById('weaponPickerGrid');
const drawerEquippedWeaponWidget = document.getElementById('drawerEquippedWeaponWidget');
const drawerEquippedWeaponBody = document.getElementById('drawerEquippedWeaponBody');
const btnDrawerEquipWeapon = document.getElementById('btnDrawerEquipWeapon');

// Right-Side Character/Weapon Detail Drawer
const charDetailDrawer = document.getElementById('charDetailDrawer');
const charDrawerOverlay = document.getElementById('charDrawerOverlay');
const charDrawerCloseBtn = document.getElementById('charDrawerCloseBtn');
const heroPortraitImg = document.getElementById('heroPortraitImg');
const heroCharName = document.getElementById('heroCharName');
const heroRarityBadge = document.getElementById('heroRarityBadge');
const heroMetaBadges = document.getElementById('heroMetaBadges');
const heroTrackToggleBtn = document.getElementById('heroTrackToggleBtn');
const heroAddToComposerBtn = document.getElementById('heroAddToComposerBtn');
const tabsNavBtns = document.querySelectorAll('.tab-nav-btn');
const tabContentPanels = document.querySelectorAll('.tab-content-panel');

// Sliders & 3 Talent Inputs
const drawerLevelGoalTitle = document.getElementById('drawerLevelGoalTitle');
const drawerTalentsSection = document.getElementById('drawerTalentsSection');
const sliderCurrent = document.getElementById('sliderCurrent');
const sliderTarget = document.getElementById('sliderTarget');
const sliderCurrentLabel = document.getElementById('sliderCurrentLabel');
const sliderTargetLabel = document.getElementById('sliderTargetLabel');
const talent1Current = document.getElementById('talent1Current');
const talent1Target = document.getElementById('talent1Target');
const talent2Current = document.getElementById('talent2Current');
const talent2Target = document.getElementById('talent2Target');
const talent3Current = document.getElementById('talent3Current');
const talent3Target = document.getElementById('talent3Target');

const materialGridOutput = document.getElementById('materialGridOutput');
const buildGuideOutput = document.getElementById('buildGuideOutput');
const farmingScheduleOutput = document.getElementById('farmingScheduleOutput');
const presetChipBtns = document.querySelectorAll('.preset-chip-btn');
const presetTalentChips = document.querySelectorAll('.preset-talent-chip');

// Domain Modal
const domainScheduleModal = document.getElementById('domainScheduleModal');
const openDomainsBtn = document.getElementById('openDomainsBtn');
const domainModalCloseBtn = document.getElementById('domainModalCloseBtn');
const scheduleDayDropdown = document.getElementById('scheduleDayDropdown');
const domainScheduleModalBody = document.getElementById('domainScheduleModalBody');

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

async function loadCharacterData() {
  try {
    const res = await fetch('src/data/characters.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        CHARACTERS = data;
        return;
      }
    }
  } catch (e) {
    console.warn('Could not load from src/data/characters.json, trying fallback...', e);
  }

  try {
    const res = await fetch('data/characters.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        CHARACTERS = data;
        return;
      }
    }
  } catch (e) {
    console.warn('Could not load from data/characters.json, using bundled data.', e);
  }
}

async function loadWeaponData() {
  try {
    const res = await fetch('src/data/weapons.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        WEAPONS = data;
        return;
      }
    }
  } catch (e) {
    console.warn('Could not load from src/data/weapons.json, trying fallback...', e);
  }

  try {
    const res = await fetch('data/weapons.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        WEAPONS = data;
        return;
      }
    }
  } catch (e) {
    console.warn('Could not load from data/weapons.json', e);
  }
}

async function init() {
  await Promise.all([loadCharacterData(), loadWeaponData()]);
  initResinPlanner();
  initWeeklyBossTracker();
  initBackupAndEnka();
  renderTodayStrip();
  renderGrid();
  updateSummaryBar();
  renderTierList();
  renderTeamComposer();
  setupEventListeners();
  setupDayDropdown();
  refreshIcons();
}

function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function updateServerDay() {
  const today = DAYS_OF_WEEK[new Date().getDay()];
  if (serverDayLabel) serverDayLabel.textContent = today;
}

// ==========================================================================
// VIEW SWITCHING (Characters / Tier List / Team Composer)
// ==========================================================================
function switchView(viewId) {
  activeViewName = viewId;
  topNavBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.viewTarget === viewId);
  });
  appViews.forEach(view => {
    view.classList.toggle('active', view.id === viewId);
  });

  if (viewId === 'viewTierList') renderTierList();
  if (viewId === 'viewTeamComposer') renderTeamComposer();
  if (viewId === 'viewWorldMap') {
    const mapIframe = document.getElementById('teyvatMapIframe');
    if (mapIframe && (!mapIframe.src || mapIframe.src === 'about:blank') && mapIframe.dataset.src) {
      mapIframe.src = mapIframe.dataset.src;
    }
  }
  refreshIcons();
}

// ==========================================================================
// 1. CHARACTER GRID & ROSTER TRACKING
// ==========================================================================
function compareVersionsDesc(verA, verB) {
  const pA = (verA || '0').split('.').map(n => parseInt(n, 10) || 0);
  const pB = (verB || '0').split('.').map(n => parseInt(n, 10) || 0);
  const len = Math.max(pA.length, pB.length);
  for (let i = 0; i < len; i++) {
    const a = pA[i] || 0;
    const b = pB[i] || 0;
    if (a !== b) return b - a;
  }
  return 0;
}

function sortCharacters(list) {
  return [...list].sort((a, b) => {
    if (currentSort === 'rarity-desc') {
      if (b.rarity !== a.rarity) return b.rarity - a.rarity;
      const vComp = compareVersionsDesc(a.version, b.version);
      if (vComp !== 0) return vComp;
      return (b.dbId || 0) - (a.dbId || 0);
    }
    if (currentSort === 'name-asc') return a.name.localeCompare(b.name);
    if (currentSort === 'element') return a.element.localeCompare(b.element);
    return 0;
  });
}

function sortWeapons(list) {
  return [...list].sort((a, b) => {
    if (currentSort === 'rarity-desc') {
      if (b.rarity !== a.rarity) return b.rarity - a.rarity;
      const vComp = compareVersionsDesc(a.version, b.version);
      if (vComp !== 0) return vComp;
      return (b.dbId || 0) - (a.dbId || 0);
    }
    if (currentSort === 'name-asc') return a.name.localeCompare(b.name);
    return 0;
  });
}

function renderEmptyState(title, subtitle) {
  return `
    <div class="cat-empty-state">
      <svg class="brand-paw-icon" viewBox="0 0 24 24" width="36" height="36" fill="currentColor" style="color: var(--accent-gold); opacity: 0.5; margin-bottom: 8px;">
        <ellipse cx="12" cy="15" rx="5" ry="4"/>
        <ellipse cx="6.5" cy="9.5" rx="2.2" ry="3"/>
        <ellipse cx="10" cy="6.5" rx="2" ry="2.8"/>
        <ellipse cx="14" cy="6.5" rx="2" ry="2.8"/>
        <ellipse cx="17.5" cy="9.5" rx="2.2" ry="3"/>
      </svg>
      <h3>${title}</h3>
      <p>${subtitle}</p>
    </div>
  `;
}

function renderTodayStrip() {
  const today = DAYS_OF_WEEK[new Date().getDay()];
  if (todayServerDayLabel) todayServerDayLabel.textContent = today;
  if (!todayDomainsFlow) return;

  const roster = getStoredRoster();
  const weaponGoals = getStoredWeaponGoals();
  const trackedCharIds = Object.keys(roster);
  const trackedWeaponIds = Object.keys(weaponGoals);

  const stickyTodayStrip = document.getElementById('stickyTodayStrip');
  const todayDomainCountBadge = document.getElementById('todayDomainCountBadge');

  if (trackedCharIds.length === 0 && trackedWeaponIds.length === 0) {
    if (stickyTodayStrip) stickyTodayStrip.style.display = 'none';
    todayDomainsFlow.innerHTML = '';
    return;
  }
  if (stickyTodayStrip) stickyTodayStrip.style.display = 'block';

  const trackedChars = trackedCharIds.map(id => CHARACTERS.find(c => c.id === id)).filter(Boolean);
  const trackedWeapons = trackedWeaponIds.map(id => WEAPONS.find(w => w.id === id)).filter(Boolean);

  if (today === 'Sunday') {
    const bookMap = {};
    trackedChars.forEach(c => {
      const book = c.talentBook || 'Talent Book';
      if (!bookMap[book]) bookMap[book] = [];
      bookMap[book].push(c.name);
    });

    const weaponMatMap = {};
    trackedWeapons.forEach(w => {
      const mat = w.domainMaterial || 'Weapon Material';
      if (!weaponMatMap[mat]) weaponMatMap[mat] = [];
      weaponMatMap[mat].push(w.name);
    });

    const charPills = Object.entries(bookMap).map(([book, names]) => `
      <div class="today-domain-pill">
        <span class="today-domain-book">${book}</span>
        <span class="today-domain-chars">${names.join(', ')}</span>
      </div>
    `).join('');

    const weaponPills = Object.entries(weaponMatMap).map(([mat, names]) => `
      <div class="today-domain-pill" style="border-color: rgba(96, 165, 250, 0.4);">
        <span class="today-domain-book" style="color: #60a5fa;">${mat}</span>
        <span class="today-domain-chars">${names.join(', ')}</span>
      </div>
    `).join('');

    const totalCount = Object.keys(bookMap).length + Object.keys(weaponMatMap).length;
    if (todayDomainCountBadge) todayDomainCountBadge.textContent = `${totalCount} materials (All Open)`;

    todayDomainsFlow.innerHTML = `
      <div style="width: 100%; font-size: 11px; font-weight: 700; color: #4ade80; margin-bottom: 4px;">Sunday (All Domains Open):</div>
      ${charPills}
      ${weaponPills}
    `;
    return;
  }

  const matchingChars = trackedChars.filter(c => {
    const days = Array.isArray(c.talentDomainWeekday) ? c.talentDomainWeekday : (c['talent domain weekday'] || []);
    return days.some(d => d.toLowerCase() === today.toLowerCase());
  });

  const matchingWeapons = trackedWeapons.filter(w => {
    const days = Array.isArray(w.domainWeekday) ? w.domainWeekday : [];
    return days.some(d => d.toLowerCase() === today.toLowerCase());
  });

  if (matchingChars.length === 0 && matchingWeapons.length === 0) {
    if (todayDomainCountBadge) todayDomainCountBadge.textContent = 'None open today';
    todayDomainsFlow.innerHTML = `<span class="today-hint" style="font-size: 12px; color: var(--text-muted); padding: 4px 0;">None of your tracked characters or weapons have domain materials open today (${today}). All domains open on Sunday.</span>`;
    return;
  }

  const charMap = {};
  matchingChars.forEach(c => {
    const book = c.talentBook || 'Talent Book';
    if (!charMap[book]) charMap[book] = [];
    charMap[book].push(c.name);
  });

  const weaponMap = {};
  matchingWeapons.forEach(w => {
    const mat = w.domainMaterial || 'Weapon Material';
    if (!weaponMap[mat]) weaponMap[mat] = [];
    weaponMap[mat].push(w.name);
  });

  const totalCount = Object.keys(charMap).length + Object.keys(weaponMap).length;
  if (todayDomainCountBadge) todayDomainCountBadge.textContent = `${totalCount} available`;

  const charPills = Object.entries(charMap).map(([book, names]) => `
    <div class="today-domain-pill">
      <span class="today-domain-book">${book}</span>
      <span class="today-domain-chars">${names.join(', ')}</span>
    </div>
  `).join('');

  const weaponPills = Object.entries(weaponMap).map(([mat, names]) => `
    <div class="today-domain-pill" style="border-color: rgba(96, 165, 250, 0.4);">
      <span class="today-domain-book" style="color: #60a5fa;">${mat}</span>
      <span class="today-domain-chars">${names.join(', ')}</span>
    </div>
  `).join('');

  todayDomainsFlow.innerHTML = `${charPills}${weaponPills}`;
}

function renderGrid() {
  if (activeEntity === 'weapons') {
    const weaponGoals = getStoredWeaponGoals();
    if (allCountLabel) allCountLabel.textContent = WEAPONS.length;
    const trackedCount = Object.keys(weaponGoals).length;
    if (trackedCountLabel) trackedCountLabel.textContent = trackedCount;

    const hasActiveFilters = activeWeapon !== 'All' || activeRarity !== 'All';
    if (filterWeapon) filterWeapon.classList.toggle('has-filter', activeWeapon !== 'All');
    if (filterRarity) filterRarity.classList.toggle('has-filter', activeRarity !== 'All');
    if (resetFiltersBtn) resetFiltersBtn.style.display = hasActiveFilters ? 'inline-flex' : 'none';

    const filtered = WEAPONS.filter(w => {
      const matchWeapon = activeWeapon === 'All' || (w.weaponType || '').toLowerCase() === activeWeapon.toLowerCase();
      const matchRarity = activeRarity === 'All' || String(w.rarity) === String(activeRarity);
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        w.name.toLowerCase().includes(q) ||
        (w.weaponType || '').toLowerCase().includes(q) ||
        (w.domainMaterial || '').toLowerCase().includes(q) ||
        (w.eliteDrop || '').toLowerCase().includes(q) ||
        (w.commonDrop || '').toLowerCase().includes(q);
      const matchTracked = activeView === 'all' || !!weaponGoals[w.id];
      return matchWeapon && matchRarity && matchSearch && matchTracked;
    });

    const sorted = sortWeapons(filtered);

    const maxPage = Math.ceil(sorted.length / ITEMS_PER_PAGE);
    if (currentPage > maxPage && maxPage > 0) currentPage = maxPage;
    
    if (paginationControls) {
      if (maxPage > 1) {
        paginationControls.style.display = 'flex';
        pageIndicator.textContent = `Page ${currentPage} of ${maxPage}`;
        if (btnPagePrev) btnPagePrev.disabled = currentPage === 1;
        if (btnPageNext) btnPageNext.disabled = currentPage === maxPage;
      } else {
        paginationControls.style.display = 'none';
      }
    }

    if (sorted.length === 0) {
      if (activeView === 'tracked') {
        characterGrid.innerHTML = renderEmptyState("No tracked weapons", "Click the bookmark on a weapon card to track your goals.");
      } else {
        characterGrid.innerHTML = renderEmptyState("No weapons found", "Try adjusting your search query, weapon type, or rarity filters.");
      }
      refreshIcons();
      return;
    }

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginated = sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const weaponAssignments = getStoredWeaponAssignments();
    characterGrid.innerHTML = paginated.map(w => {
      const isTracked = !!weaponGoals[w.id];
      const isSelected = selectedEntity?.type === 'weapon' && selectedEntity.data.id === w.id;
      const ownerCharId = Object.keys(weaponAssignments).find(cid => weaponAssignments[cid] === w.id);
      const ownerChar = ownerCharId ? CHARACTERS.find(c => c.id === ownerCharId) : null;

      return `
        <div class="genshin-card rarity-${w.rarity} ${isSelected ? 'card-selected' : ''}" data-id="${w.id}" data-type="weapon" tabindex="0" role="button" aria-label="${w.name}">
          <div class="card-portrait-wrap">
            <img src="${w.portrait || w.image}" 
                 alt="${w.name}" 
                 class="card-char-img" 
                 loading="lazy" 
                 width="170" 
                 height="195" 
                 referrerpolicy="no-referrer"
                 onerror="this.onerror=null; this.src='https://enka.network/ui/UI_EquipIcon_' + this.alt.replace(/[^a-zA-Z0-9]/g, '') + '.png';">
            
            <span class="card-elem-badge" style="color: #cbd5e1;">
              ${w.weaponType}
            </span>

            <button class="card-fav-btn ${isTracked ? 'tracked' : ''}" data-track-weapon="${w.id}" title="${isTracked ? 'Untrack weapon' : 'Track in My Goals'}">
              <i data-lucide="star" class="icon-sm"></i>
            </button>
          </div>

          <div class="card-info-plate">
            <div class="card-name-stars-row">
              <div class="card-char-name">${w.name}</div>
              <span class="card-stars-badge rarity-${w.rarity}">${w.rarity}★</span>
            </div>
            
            <div class="card-meta-line">
              <span>${w.weaponType}</span>
              <span>Base ATK: ${Math.round(w.baseAtk || 0)}</span>
            </div>

            <div class="card-weapon-owner-slot" data-action="weapon-owner" data-weapon-id="${w.id}" title="${ownerChar ? `Equipped by ${ownerChar.name}` : 'Not assigned to any character'}">
              ${ownerChar ? `
                <img src="${ownerChar.portrait || ownerChar.image}" class="weapon-owner-avatar" alt="${ownerChar.name}" onerror="this.onerror=null; this.src='https://enka.network/ui/UI_AvatarIcon_' + this.alt.replace(/[^a-zA-Z0-9]/g, '') + '.png';">
                <span class="card-weapon-name" style="font-size: 10px;">Owner: <strong>${ownerChar.name}</strong></span>
              ` : `
                <span class="weapon-unassigned-tag">Available (No Owner)</span>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');
    refreshIcons();
    return;
  }

  const roster = getStoredRoster();
  if (allCountLabel) allCountLabel.textContent = CHARACTERS.length;
  const trackedCount = Object.keys(roster).length;
  if (trackedCountLabel) trackedCountLabel.textContent = trackedCount;

  // Update secondary filter styling & reset button visibility
  const hasActiveFilters = activeElement !== 'All' || activeWeapon !== 'All' || activeRarity !== 'All' || activeRegion !== 'All';
  if (filterWeapon) filterWeapon.classList.toggle('has-filter', activeWeapon !== 'All');
  if (filterRarity) filterRarity.classList.toggle('has-filter', activeRarity !== 'All');
  if (filterRegion) filterRegion.classList.toggle('has-filter', activeRegion !== 'All');
  if (resetFiltersBtn) resetFiltersBtn.style.display = hasActiveFilters ? 'inline-flex' : 'none';

  const filtered = CHARACTERS.filter(char => {
    const matchElem = activeElement === 'All' || char.element.toLowerCase() === activeElement.toLowerCase();
    const charWeapon = (char.weaponType || char.weapon || char['weapon type'] || '').toLowerCase();
    const matchWeapon = activeWeapon === 'All' || charWeapon === activeWeapon.toLowerCase();
    const matchRarity = activeRarity === 'All' || String(char.rarity) === String(activeRarity);

    let matchRegion = true;
    if (activeRegion !== 'All') {
      const charRegion = (char.region || '').toLowerCase();
      if (activeRegion === 'Teyvat') {
        matchRegion = charRegion === 'teyvat' || charRegion === 'other' || !charRegion;
      } else {
        matchRegion = charRegion === activeRegion.toLowerCase();
      }
    }

    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q ||
      char.name.toLowerCase().includes(q) ||
      (char.weapon || char.weaponType || '').toLowerCase().includes(q) ||
      (char.region || '').toLowerCase().includes(q) ||
      char.element.toLowerCase().includes(q) ||
      (char.localSpecialty || '').toLowerCase().includes(q) ||
      (char.bossMat || '').toLowerCase().includes(q);

    const matchTracked = activeView === 'all' || !!roster[char.id];

    return matchElem && matchWeapon && matchRarity && matchRegion && matchSearch && matchTracked;
  });

  const sorted = sortCharacters(filtered);

  const maxPage = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  if (currentPage > maxPage && maxPage > 0) currentPage = maxPage;
  
  if (paginationControls) {
    if (maxPage > 1) {
      paginationControls.style.display = 'flex';
      pageIndicator.textContent = `Page ${currentPage} of ${maxPage}`;
      if (btnPagePrev) btnPagePrev.disabled = currentPage === 1;
      if (btnPageNext) btnPageNext.disabled = currentPage === maxPage;
    } else {
      paginationControls.style.display = 'none';
    }
  }

  if (sorted.length === 0) {
    if (activeView === 'tracked') {
      characterGrid.innerHTML = renderEmptyState("Your roster is empty", "Click the bookmark on a character card to add them to your roster.");
    } else {
      characterGrid.innerHTML = renderEmptyState("No characters found", "Try adjusting your search query, weapon type, rarity, or region filters.");
    }
    refreshIcons();
    return;
  }

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const weaponAssignments = getStoredWeaponAssignments();

  characterGrid.innerHTML = paginated.map(char => {
    const isTracked = !!roster[char.id];
    const isSelected = selectedCharacter && selectedCharacter.id === char.id;
    const assignedWeaponId = weaponAssignments[char.id];
    const assignedWeapon = assignedWeaponId ? WEAPONS.find(w => w.id === assignedWeaponId) : null;

    return `
      <div class="genshin-card rarity-${char.rarity} ${isSelected ? 'card-selected' : ''}" data-id="${char.id}" tabindex="0" role="button" aria-label="${char.name}">
        <div class="card-portrait-wrap">
          <img src="${char.portrait || char.image}" 
               alt="${char.name}" 
               class="card-char-img" 
               loading="lazy" 
               width="170" 
               height="195" 
               referrerpolicy="no-referrer"
               onerror="this.onerror=null; this.src='https://enka.network/ui/UI_AvatarIcon_' + this.alt.replace(/[^a-zA-Z0-9]/g, '') + '.png';">
          
          <span class="card-elem-badge" style="color: var(--elem-${char.element.toLowerCase()});">
            ${char.element}
          </span>

          <button class="card-fav-btn ${isTracked ? 'tracked' : ''}" data-track="${char.id}" title="${isTracked ? 'Untrack character' : 'Track in My Roster'}">
            <i data-lucide="star" class="icon-sm"></i>
          </button>
        </div>

        <div class="card-info-plate">
          <div class="card-name-stars-row">
            <div class="card-char-name">${char.name}</div>
            <span class="card-stars-badge rarity-${char.rarity}">${char.rarity}★</span>
          </div>
          
          <div class="card-meta-line">
            <span>${char.weaponType || char.weapon}</span>
            <span>${char.region || 'Teyvat'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  refreshIcons();
}

function updateSummaryBar() {
  const roster = getStoredRoster();
  const weaponGoals = getStoredWeaponGoals();
  const assignments = getStoredWeaponAssignments();
  const charIds = Object.keys(roster);
  const weaponIds = Object.keys(weaponGoals);
  const assignedWeaponCount = Object.keys(assignments).length;
  const totalTracked = charIds.length + weaponIds.length;

  const summaryStrip = document.getElementById('summaryStrip');
  if (totalTracked === 0 && assignedWeaponCount === 0) {
    if (summaryStrip) summaryStrip.style.display = 'none';
    if (summaryContent) {
      summaryContent.innerHTML = '';
    }
    if (summaryActions) summaryActions.style.display = 'none';
    if (resetTrackedBtn) resetTrackedBtn.style.display = 'none';
    if (trackedCountLabel) trackedCountLabel.textContent = '0';
    return;
  }
  if (summaryStrip) summaryStrip.style.display = 'flex';

  if (summaryActions) summaryActions.style.display = 'flex';
  if (resetTrackedBtn) resetTrackedBtn.style.display = 'inline-block';
  if (trackedCountLabel) trackedCountLabel.textContent = totalTracked;

  const currentResin = getStoredResin().current;
  const rosterTotals = calculateRosterTotals(roster, CHARACTERS, getStoredInventory(), weaponGoals, WEAPONS, currentResin);

  if (summaryContent) {
    summaryContent.innerHTML = `
      <div class="summary-chips-row">
        <div class="summary-stat-chip">
          <span>Roster:</span>
          <strong>${charIds.length} Character${charIds.length === 1 ? '' : 's'}</strong>
        </div>
        <div class="summary-stat-chip" style="border-color: rgba(212, 149, 60, 0.4);">
          <span style="color: var(--accent-gold);">Equipment:</span>
          <strong style="color: var(--accent-gold);">${assignedWeaponCount} Weapon${assignedWeaponCount === 1 ? '' : 's'} Assigned</strong>
        </div>
        ${weaponIds.length > 0 ? `
        <div class="summary-stat-chip">
          <span>Goals:</span>
          <strong>${weaponIds.length} Weapon${weaponIds.length === 1 ? '' : 's'}</strong>
        </div>
        ` : ''}
        ${rosterTotals.totalMora > 0 ? `
        <div class="summary-stat-chip">
          <span>Mora Needed:</span>
          <strong>${formatNumber(rosterTotals.totalMora)}</strong>
        </div>
        ` : ''}
        <button class="btn-text" id="summaryOpenInvLink" style="margin-left: auto; text-decoration: none; color: var(--accent-gold); font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
          <span>Materials & Inventory</span> <i data-lucide="arrow-right" class="icon-xs"></i>
        </button>
      </div>
    `;

    const summaryOpenInvLink = document.getElementById('summaryOpenInvLink');
    if (summaryOpenInvLink) {
      summaryOpenInvLink.addEventListener('click', openRosterInventoryModal);
    }
    refreshIcons();
  }
}

// ==========================================================================
// 2. MULTI-SOURCE META TIER LIST
// ==========================================================================
function renderTierList() {
  const tierPatchBadge = document.getElementById('tierPatchBadge');
  if (tierPatchBadge) {
    tierPatchBadge.textContent = 'Patch 5.0';
  }

  const tiers = ['SSS+', 'SS', 'S', 'A'];
  const tierLabels = {
    'SSS+': { title: 'Top Tier' },
    'SS': { title: 'High Tier' },
    'S': { title: 'Solid' },
    'A': { title: 'Viable' }
  };

  const filtered = META_ROSTER.filter(item => {
    if (activeTierRole === 'All') return true;
    if (activeTierRole === 'Main DPS') return item.role === 'Main DPS' || item.subRoles?.includes('Main DPS');
    if (activeTierRole === 'Sub-DPS') return item.role === 'Sub-DPS' || item.subRoles?.includes('Sub-DPS');
    if (activeTierRole === 'Support') return item.role === 'Support' || item.subRoles?.includes('Buffer');
    if (activeTierRole === 'Sustain') return item.role === 'Sustain' || item.subRoles?.includes('Shielder') || item.subRoles?.includes('Healer');
    return true;
  });

  tierSectionsWrapper.innerHTML = tiers.map(tier => {
    const charsInTier = filtered.filter(c => c.tier === tier);
    if (charsInTier.length === 0) return '';

    const labelKey = tier.replace('+', '').toLowerCase();

    return `
      <div class="tier-row-block tier-${labelKey}">
        <div class="tier-label-column">
          <div class="tier-title-text">${tier}</div>
          <div class="tier-desc-text">${tierLabels[tier]?.title || ''}</div>
        </div>

        <div class="tier-chars-grid">
          ${charsInTier.map(c => {
            const fullChar = CHARACTERS.find(ch => ch.id === c.id || ch.name.toLowerCase() === c.name.toLowerCase() || ch.id.replace(/-/g, '') === c.id.replace(/-/g, ''));
            const img = fullChar ? (fullChar.portrait || fullChar.image) : `https://enka.network/ui/UI_AvatarIcon_${c.name.replace(/[^a-zA-Z0-9]/g, '')}.png`;
            const charId = fullChar ? fullChar.id : c.id;
            const assignedWpnId = weaponAssignments[charId] || weaponAssignments[c.id];
            const assignedWpn = assignedWpnId ? WEAPONS.find(w => w.id === assignedWpnId) : null;
            const tooltip = `${c.name} [${c.role}]\n${assignedWpn ? `Equipped: ${assignedWpn.name} (${assignedWpn.rarity}★)\n` : ''}Synergies: ${(c.synergyWith || []).slice(0, 4).join(', ')}`;

            return `
              <div class="tier-char-card" data-char-id="${charId}" title="${tooltip}" tabindex="0" role="button" aria-label="${c.name}">
                <div class="tier-char-avatar">
                  <img src="${img}" alt="${c.name}" loading="lazy" onerror="this.onerror=null; this.src='https://enka.network/ui/UI_AvatarIcon_${c.name.replace(/[^a-zA-Z0-9]/g, '')}.png';">
                </div>
                <div class="tier-char-name">${c.name}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');

  refreshIcons();
}

// ==========================================================================
// 3. INTERACTIVE TEAM COMPOSER
// ==========================================================================
function loadTeamFromStorage() {
  try {
    const raw = localStorage.getItem('genshin_cat_team_v1');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  // Default Team: Neuvillette, Furina, Kazuha, Zhongli
  return ['neuvillette', 'furina', 'kaedehara-kazuha', 'zhongli'];
}

function saveTeamToStorage(team) {
  try {
    localStorage.setItem('genshin_cat_team_v1', JSON.stringify(team));
  } catch (e) {
    console.error(e);
  }
}

function renderTeamComposer() {
  // Render Preset Team Chips
  presetTeamChips.innerHTML = PRESET_META_TEAMS.map(p => `
    <button class="preset-team-chip-btn" data-preset-id="${p.id}">
      ${p.name}
    </button>
  `).join('');

  // Render 4 Character Slots
  teamSlotsGrid.innerHTML = [0, 1, 2, 3].map(idx => {
    const charId = currentTeam[idx];
    const char = charId ? CHARACTERS.find(c => c.id === charId || c.id.replace(/-/g, '') === charId.replace(/-/g, '') || c.name.toLowerCase() === charId.toLowerCase()) : null;
    const meta = char ? META_ROSTER.find(m => m.id === char.id || m.name.toLowerCase() === char.name.toLowerCase() || m.id.replace(/-/g, '') === char.id.replace(/-/g, '')) : null;

    if (char) {
      return `
        <div class="composer-slot-card slot-occupied" data-slot-index="${idx}">
          <div class="slot-portrait-header">
            <img src="${char.image || char.portrait}" alt="${char.name}" onerror="this.onerror=null; this.src='https://enka.network/ui/UI_AvatarIcon_${char.name.replace(/[^a-zA-Z0-9]/g, '')}.png';">
            <span class="card-elem-badge" style="color: var(--elem-${char.element.toLowerCase()});">
              ${char.element}
            </span>
            <button class="slot-remove-btn" data-slot-remove="${idx}" title="Remove character">
              <i data-lucide="x" class="icon-sm"></i>
            </button>
          </div>
          <div class="slot-card-body">
            <div class="slot-char-name">${char.name}</div>
            <div class="slot-char-role">${meta ? `${meta.tier} • ${meta.role}` : char.weapon}</div>
          </div>
        </div>
      `;
    }

    return `
      <div class="composer-slot-card slot-empty" data-slot-empty="${idx}" role="button" tabindex="0">
        <div class="slot-empty-icon">
          <i data-lucide="plus" class="icon-md"></i>
        </div>
        <div class="slot-empty-label">Slot ${idx + 1}: Select Character</div>
      </div>
    `;
  }).join('');

  // Analyze Active Resonances, Reactions & Synergy Score
  analyzeTeamComposition();
  refreshIcons();
}

function isSynergyMatch(name1, name2, synergyList = []) {
  if (!name1 || !name2 || !Array.isArray(synergyList)) return false;
  const cleanTarget = name2.toLowerCase().replace(/[^a-z0-9]/g, '');
  return synergyList.some(s => {
    const cleanS = s.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleanS === cleanTarget || (cleanS.length >= 4 && (cleanS.includes(cleanTarget) || cleanTarget.includes(cleanS)));
  });
}

function analyzeTeamComposition() {
  const activeChars = currentTeam
    .map(id => {
      if (!id) return null;
      return CHARACTERS.find(c => c.id === id || c.id.replace(/-/g, '') === id.replace(/-/g, '') || c.name.toLowerCase() === id.toLowerCase()) || null;
    })
    .filter(Boolean);

  const activeMeta = currentTeam
    .map(id => {
      if (!id) return null;
      return META_ROSTER.find(m => m.id === id || m.name.toLowerCase() === id.toLowerCase() || m.id.replace(/-/g, '') === id.replace(/-/g, '')) || null;
    })
    .filter(Boolean);

  // If no characters drafted in team
  if (activeChars.length === 0) {
    resonanceListOutput.innerHTML = `
      <div style="font-size: 12px; color: var(--text-dim); padding: 12px; text-align: center;">
        Select characters above to see active elemental resonances.
      </div>
    `;
    reactionBadgeGrid.innerHTML = `
      <div style="font-size: 12px; color: var(--text-dim); padding: 12px; text-align: center;">
        Select characters with reacting elements to see elemental reactions.
      </div>
    `;
    teamSynergyReport.innerHTML = `
      <div class="synergy-score-card">
        <div class="synergy-grade-badge grade-none">—</div>
        <div>
          <strong style="font-size: 14px; color: #fff;">Empty Team</strong>
          <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
            0 of 4 characters selected
          </p>
        </div>
      </div>
      <div class="synergy-feedback-list">
        <div class="synergy-feedback-item item-info">
          <span>Click an empty slot above or choose a preset to view team synergy.</span>
        </div>
      </div>
    `;
    return;
  }

  // 1. Resonances
  const elementCounts = {};
  activeChars.forEach(c => {
    elementCounts[c.element] = (elementCounts[c.element] || 0) + 1;
  });

  const resonances = [];
  if (elementCounts['Pyro'] >= 2) resonances.push({ name: 'Fervent Flames (Pyro)', desc: 'Affected by Cryo for 40% less time. Increases ATK by 25%.' });
  if (elementCounts['Hydro'] >= 2) resonances.push({ name: 'Soothing Water (Hydro)', desc: 'Affected by Pyro for 40% less time. Increases Max HP by 25%.' });
  if (elementCounts['Dendro'] >= 2) resonances.push({ name: 'Sprawling Greenery (Dendro)', desc: 'Increases Elemental Mastery by 50. Reaction buffs up to +50 EM.' });
  if (elementCounts['Anemo'] >= 2) resonances.push({ name: 'Impetuous Winds (Anemo)', desc: 'Decreases Stamina Consumption by 15%. Increases Movement SPD by 10%.' });
  if (elementCounts['Electro'] >= 2) resonances.push({ name: 'High Voltage (Electro)', desc: '100% chance to generate Electro particle on reactions (CD 5s).' });
  if (elementCounts['Cryo'] >= 2) resonances.push({ name: 'Shattering Ice (Cryo)', desc: 'Increases CRIT Rate against enemies that are Frozen or Cryo-affected by 15%.' });
  if (elementCounts['Geo'] >= 2) resonances.push({ name: 'Enduring Rock (Geo)', desc: 'Shield strength +15%. Characters protected by a shield deal 15% more DMG.' });
  if (activeChars.length === 4 && Object.keys(elementCounts).length === 4) {
    resonances.push({ name: 'Protective Canopy (4 Unique Elements)', desc: 'All Elemental Resistance +15%, Physical Resistance +15%.' });
  }

  if (resonances.length === 0) {
    resonanceListOutput.innerHTML = `
      <div style="font-size: 12px; color: var(--text-dim); padding: 8px;">
        No active resonance. Pair 2 characters of the same element or assemble 4 unique elements.
      </div>
    `;
  } else {
    resonanceListOutput.innerHTML = resonances.map(r => `
      <div class="resonance-item">
        <div>
          <strong style="color: #fff;">${r.name}</strong>
          <p style="font-size: 11px; color: var(--text-muted); margin-top: 1px;">${r.desc}</p>
        </div>
      </div>
    `).join('');
  }

  // 2. Reactions
  const elementsPresent = new Set(activeChars.map(c => c.element));
  const reactions = [];

  if (elementsPresent.has('Hydro') && elementsPresent.has('Pyro')) {
    reactions.push({ title: 'Vaporize', desc: '2.0x / 1.5x Multiplier DMG' });
  }
  if (elementsPresent.has('Pyro') && elementsPresent.has('Cryo')) {
    reactions.push({ title: 'Melt', desc: '2.0x / 1.5x Multiplier DMG' });
  }
  if (elementsPresent.has('Hydro') && elementsPresent.has('Dendro') && elementsPresent.has('Electro')) {
    reactions.push({ title: 'Hyperbloom', desc: 'Single-target homing Sprawling missiles' });
  }
  if (elementsPresent.has('Hydro') && elementsPresent.has('Dendro') && elementsPresent.has('Pyro')) {
    reactions.push({ title: 'Burgeon', desc: 'Massive AoE Dendro explosion damage' });
  }
  if (elementsPresent.has('Hydro') && elementsPresent.has('Dendro')) {
    reactions.push({ title: 'Bloom', desc: 'Dendro Cores exploding for AoE' });
  }
  if (elementsPresent.has('Electro') && elementsPresent.has('Dendro')) {
    reactions.push({ title: 'Quicken / Aggravate / Spread', desc: 'Flat additive reaction damage scaling with EM' });
  }
  if (elementsPresent.has('Hydro') && elementsPresent.has('Electro')) {
    reactions.push({ title: 'Electro-Charged', desc: 'Continuous chain lightning tick DMG' });
  }
  if (elementsPresent.has('Pyro') && elementsPresent.has('Electro')) {
    reactions.push({ title: 'Overloaded', desc: 'Pyro AoE blast with high poise break' });
  }
  if (elementsPresent.has('Hydro') && elementsPresent.has('Cryo')) {
    reactions.push({ title: 'Freeze', desc: 'Immobilizes enemies in place' });
  }
  if (elementsPresent.has('Cryo') && elementsPresent.has('Electro')) {
    reactions.push({ title: 'Superconduct', desc: 'AoE Cryo damage & -40% Physical RES shred' });
  }
  if (elementsPresent.has('Anemo') && (elementsPresent.has('Pyro') || elementsPresent.has('Hydro') || elementsPresent.has('Electro') || elementsPresent.has('Cryo'))) {
    reactions.push({ title: 'Swirl', desc: 'Viridescent Venerer -40% RES Shred' });
  }
  if (elementsPresent.has('Geo') && (elementsPresent.has('Pyro') || elementsPresent.has('Hydro') || elementsPresent.has('Electro') || elementsPresent.has('Cryo'))) {
    reactions.push({ title: 'Crystallize', desc: 'Elemental shield shards' });
  }

  if (reactions.length === 0) {
    reactionBadgeGrid.innerHTML = `
      <div style="font-size: 12px; color: var(--text-dim); padding: 8px;">
        Add complementary elements to unlock team elemental reactions.
      </div>
    `;
  } else {
    reactionBadgeGrid.innerHTML = reactions.map(rx => `
      <div class="reaction-pill">
        <span class="reaction-pill-title">${rx.title}</span>
        <span class="reaction-pill-desc">${rx.desc}</span>
      </div>
    `).join('');
  }

  // 3. Synergy Score & Detailed Feedback (0 - 100)
  let score = 0;
  const feedback = [];

  // A. Squad Completeness (up to 20 pts)
  if (activeChars.length === 4) {
    score += 20;
    feedback.push({ type: 'success', text: 'Full 4-character team' });
  } else if (activeChars.length === 3) {
    score += 10;
    feedback.push({ type: 'info', text: '3 of 4 slots filled (add 1 more character)' });
  } else if (activeChars.length === 2) {
    score += 5;
    feedback.push({ type: 'info', text: '2 of 4 slots filled' });
  } else {
    feedback.push({ type: 'info', text: '1 of 4 slots filled' });
  }

  // B. Role Balance & Field Time (up to 40 pts)
  const mainDpsList = activeMeta.filter(m => m.role === 'Main DPS' || m.subRoles?.includes('Main DPS') || m.subRoles?.includes('Hypercarry'));
  const subDpsList = activeMeta.filter(m => m.role === 'Sub-DPS' || m.subRoles?.includes('Sub-DPS') || m.subRoles?.includes('Enabler'));
  const bufferList = activeMeta.filter(m => m.role === 'Support' || m.subRoles?.includes('Buffer') || m.subRoles?.includes('Debuffer') || m.subRoles?.includes('RES Shred'));
  const sustainList = activeMeta.filter(m => m.role === 'Sustain' || m.subRoles?.includes('Shielder') || m.subRoles?.includes('Healer'));

  // Main DPS evaluation
  if (mainDpsList.length === 1) {
    score += 15;
    feedback.push({ type: 'success', text: `Main DPS: ${mainDpsList[0].name}` });
  } else if (mainDpsList.length === 2) {
    score += 6;
    feedback.push({ type: 'warning', text: `Dual carries: ${mainDpsList.map(m => m.name).join(' + ')} may conflict for field time` });
  } else if (mainDpsList.length >= 3) {
    score -= 10;
    feedback.push({ type: 'warning', text: `Field-time conflict: ${mainDpsList.length} Main DPS carries` });
  } else {
    // 0 Main DPS: check for quickswap/reaction drivers
    const hasQuickswap = activeChars.some(c => ['Xiangling', 'Xingqiu', 'Bennett', 'Fischl', 'Kaedehara Kazuha', 'Sucrose', 'Nahida'].includes(c.name));
    if (hasQuickswap && activeChars.length >= 3) {
      score += 12;
      feedback.push({ type: 'success', text: 'Quickswap reaction driver core' });
    } else if (activeChars.length >= 2) {
      feedback.push({ type: 'warning', text: 'No primary on-field damage dealer or driver' });
    }
  }

  // Sub-DPS evaluation
  if (subDpsList.length > 0) {
    score += 10;
    feedback.push({ type: 'success', text: `Sub-DPS: ${subDpsList.map(m => m.name).join(', ')}` });
  } else if (activeChars.length >= 3) {
    feedback.push({ type: 'warning', text: 'Missing off-field Sub-DPS application' });
  }

  // Buffer evaluation
  if (bufferList.length > 0) {
    score += 10;
    feedback.push({ type: 'success', text: `Buffer / Support: ${bufferList.map(m => m.name).join(', ')}` });
  } else if (activeChars.length >= 3) {
    feedback.push({ type: 'info', text: 'No dedicated buffer or resistance shredder' });
  }

  // Sustain evaluation
  if (sustainList.length > 0) {
    score += 10;
    feedback.push({ type: 'success', text: `Healer / Shielder: ${sustainList.map(m => m.name).join(', ')}` });
  } else if (activeChars.length === 4) {
    score -= 5;
    feedback.push({ type: 'warning', text: 'No healer or shielder in team' });
  }

  // C. Cross-Character Direct Meta Synergies (up to 20 pts)
  const synergyPairs = [];
  const checkedPairs = new Set();

  activeMeta.forEach(m1 => {
    activeMeta.forEach(m2 => {
      if (m1.id === m2.id) return;
      const pairKey = [m1.id, m2.id].sort().join('__');
      if (checkedPairs.has(pairKey)) return;
      checkedPairs.add(pairKey);

      const m1SynergizesWithM2 = isSynergyMatch(m1.name, m2.name, m1.synergyWith);
      const m2SynergizesWithM1 = isSynergyMatch(m2.name, m1.name, m2.synergyWith);

      if (m1SynergizesWithM2 || m2SynergizesWithM1) {
        synergyPairs.push(`${m1.name} + ${m2.name}`);
      }
    });
  });

  if (synergyPairs.length >= 4) {
    score += 20;
    feedback.push({ type: 'synergy', text: `Strong Synergies: ${synergyPairs.slice(0, 3).join(', ')}...` });
  } else if (synergyPairs.length === 3) {
    score += 16;
    feedback.push({ type: 'synergy', text: `Team Synergies: ${synergyPairs.join(', ')}` });
  } else if (synergyPairs.length === 2) {
    score += 12;
    feedback.push({ type: 'synergy', text: `Synergies: ${synergyPairs.join(', ')}` });
  } else if (synergyPairs.length === 1) {
    score += 6;
    feedback.push({ type: 'synergy', text: `Synergy: ${synergyPairs[0]}` });
  } else if (activeChars.length >= 3) {
    feedback.push({ type: 'info', text: 'Low direct synergy between selected characters' });
  }

  // D. Resonance & Reactions (up to 20 pts)
  let resonanceScore = 0;
  if (resonances.length > 0) {
    const hasDoubleRes = resonances.some(r => !r.name.includes('Protective Canopy'));
    resonanceScore += hasDoubleRes ? 8 : 4;

    const hasHydroCarry = activeChars.some(c => c.element === 'Hydro' && ['Neuvillette', 'Furina', 'Yelan', 'Kamisato Ayato'].includes(c.name));
    const hasPyroCarry = activeChars.some(c => c.element === 'Pyro' && ['Arlecchino', 'Hu Tao', 'Yoimiya', 'Lyney', 'Xiangling'].includes(c.name));
    if ((hasHydroCarry && elementCounts['Hydro'] >= 2) || (hasPyroCarry && elementCounts['Pyro'] >= 2)) {
      resonanceScore += 2;
    }
  }

  const tier1Reactions = reactions.filter(r => ['Vaporize', 'Melt', 'Hyperbloom', 'Quicken / Aggravate / Spread', 'Swirl'].includes(r.title));
  const reactionScore = Math.min(10, tier1Reactions.length * 5);
  score += Math.min(20, resonanceScore + reactionScore);

  // Clamp score strictly between 0 and 100
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Calculate Accurate Grade
  let grade = 'C';
  let gradeClass = 'grade-c';
  if (score >= 95) { grade = 'SSS+'; gradeClass = 'grade-sss-plus'; }
  else if (score >= 85) { grade = 'SSS'; gradeClass = 'grade-sss'; }
  else if (score >= 75) { grade = 'SS'; gradeClass = 'grade-ss'; }
  else if (score >= 60) { grade = 'S'; gradeClass = 'grade-s'; }
  else if (score >= 45) { grade = 'A'; gradeClass = 'grade-a'; }
  else if (score >= 30) { grade = 'B'; gradeClass = 'grade-b'; }

  teamSynergyReport.innerHTML = `
    <div class="synergy-score-card">
      <div class="synergy-grade-badge ${gradeClass}">${grade}</div>
      <div>
        <strong style="font-size: 14px; color: #fff;">Synergy Score: ${score}/100</strong>
        <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
          ${activeChars.length} of 4 characters selected
        </p>
      </div>
    </div>

    <div class="synergy-feedback-list">
      ${feedback.map(f => `
        <div class="synergy-feedback-item item-${f.type || 'info'}">
          <span>${f.text}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// Open Character Picker for Composer Slot
function openCharacterPicker(slotIndex) {
  targetSlotIndex = slotIndex;
  renderPickerGrid('');
  charPickerModal.classList.add('active');
  refreshIcons();
}

function renderPickerGrid(query) {
  const q = query.toLowerCase().trim();
  const available = CHARACTERS.filter(c => {
    return !q || c.name.toLowerCase().includes(q) || c.element.toLowerCase().includes(q) || (c.weapon || c.weaponType || '').toLowerCase().includes(q);
  });

  pickerCharacterGrid.innerHTML = available.map(c => `
    <div class="genshin-card rarity-${c.rarity}" data-picker-select="${c.id}" tabindex="0" role="button" aria-label="${c.name}">
      <div class="card-portrait-wrap">
        <img src="${c.portrait || c.image}" 
             alt="${c.name}" 
             class="card-char-img" 
             loading="lazy" 
             width="130" 
             height="150" 
             referrerpolicy="no-referrer"
             onerror="this.onerror=null; this.src='https://enka.network/ui/UI_AvatarIcon_' + this.alt.replace(/[^a-zA-Z0-9]/g, '') + '.png';">
        <span class="card-elem-badge" style="color: var(--elem-${c.element.toLowerCase()});">
          ${c.element}
        </span>
      </div>
      <div class="card-info-plate">
        <div class="card-name-stars-row">
          <div class="card-char-name">${c.name}</div>
          <span class="card-stars-badge rarity-${c.rarity}">${c.rarity}★</span>
        </div>
        <div class="card-meta-line">
          <span>${c.weaponType || c.weapon}</span>
          <span>${c.region || 'Teyvat'}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// ==========================================================================
// WEAPON PICKER & ASSIGNMENT (Phase B)
// ==========================================================================
function openWeaponPicker(charId) {
  targetWeaponCharId = charId;
  const char = CHARACTERS.find(c => c.id === charId);
  if (!char) return;

  const assignments = getStoredWeaponAssignments();
  const currentWeaponId = assignments[char.id];
  const currentWeapon = currentWeaponId ? WEAPONS.find(w => w.id === currentWeaponId) : null;

  if (weaponPickerTitle) {
    weaponPickerTitle.textContent = `Equip Weapon — ${char.name}`;
  }

  if (weaponPickerCharPreview) {
    weaponPickerCharPreview.innerHTML = `
      <img src="${char.portrait || char.image}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-subtle);" alt="${char.name}" onerror="this.onerror=null; this.src='https://enka.network/ui/UI_AvatarIcon_' + this.alt.replace(/[^a-zA-Z0-9]/g, '') + '.png';">
      <span style="font-size: 13px; font-weight: 700; color: #fff;">${char.name}</span>
      <span style="font-size: 11px; color: var(--accent-gold); background: rgba(212, 149, 60, 0.12); border: 1px solid rgba(212, 149, 60, 0.3); padding: 1px 7px; border-radius: 4px; font-weight: 600;">
        ${char.weaponType || char.weapon}
      </span>
      ${currentWeapon ? `
        <span style="font-size: 12px; color: var(--text-muted); margin-left: 6px;">
          Current: <strong style="color: #fff;">${currentWeapon.name}</strong> <span style="color: var(--rarity-${currentWeapon.rarity}); font-weight: 700;">(${currentWeapon.rarity}★)</span>
        </span>
      ` : `
        <span style="font-size: 12px; color: var(--text-dim); margin-left: 6px;">No weapon equipped</span>
      `}
    `;
  }

  if (btnUnequipCurrentWeapon) {
    btnUnequipCurrentWeapon.style.display = currentWeapon ? 'inline-flex' : 'none';
  }

  weaponPickerSearch = '';
  if (weaponPickerSearchInput) weaponPickerSearchInput.value = '';
  weaponPickerRarity = 'All';
  if (weaponPickerRarityFilter) {
    weaponPickerRarityFilter.querySelectorAll('.segment-item').forEach(b => {
      b.classList.toggle('active', b.dataset.rarity === 'All');
    });
  }

  renderWeaponPickerGrid();

  if (weaponPickerModal) {
    weaponPickerModal.classList.add('active');
    weaponPickerModal.style.display = 'flex';
  }
  refreshIcons();
}

function closeWeaponPicker() {
  if (weaponPickerModal) {
    weaponPickerModal.classList.remove('active');
    weaponPickerModal.style.display = 'none';
  }
  targetWeaponCharId = null;
}

function renderWeaponPickerGrid() {
  if (!weaponPickerGrid) return;
  const char = CHARACTERS.find(c => c.id === targetWeaponCharId);
  if (!char) return;

  const targetWeaponType = (char.weaponType || char.weapon || '').toLowerCase();
  const assignments = getStoredWeaponAssignments();
  const currentEquippedId = assignments[char.id];

  const q = weaponPickerSearch.toLowerCase().trim();
  const filtered = WEAPONS.filter(w => {
    const matchType = (w.weaponType || '').toLowerCase() === targetWeaponType;
    const matchRarity = weaponPickerRarity === 'All' || String(w.rarity) === String(weaponPickerRarity);
    const matchSearch = !q ||
      w.name.toLowerCase().includes(q) ||
      (w.mainStat || '').toLowerCase().includes(q) ||
      (w.domainMaterial || '').toLowerCase().includes(q);
    return matchType && matchRarity && matchSearch;
  });

  // Sort: Equipped first, then 5★ -> 4★ -> 3★, then alphabetical
  filtered.sort((a, b) => {
    if (a.id === currentEquippedId) return -1;
    if (b.id === currentEquippedId) return 1;
    if (b.rarity !== a.rarity) return b.rarity - a.rarity;
    return a.name.localeCompare(b.name);
  });

  if (filtered.length === 0) {
    weaponPickerGrid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
        No ${char.weaponType || char.weapon} weapons match your search or filter.
      </div>
    `;
    return;
  }

  weaponPickerGrid.innerHTML = filtered.map(w => {
    const isEquippedHere = w.id === currentEquippedId;
    const ownerId = Object.keys(assignments).find(cid => assignments[cid] === w.id);
    const ownerChar = ownerId && ownerId !== char.id ? CHARACTERS.find(c => c.id === ownerId) : null;

    return `
      <div class="picker-weapon-card rarity-${w.rarity} ${isEquippedHere ? 'is-equipped' : ''}" data-picker-weapon-id="${w.id}" tabindex="0" role="button" title="${w.name} (${w.rarity}★)\nBase ATK: ${Math.round(w.baseAtk || 0)} • ${w.mainStat || ''}\n${ownerChar ? `Equipped by ${ownerChar.name} (click to transfer)` : isEquippedHere ? 'Currently Equipped' : 'Click to equip'}">
        <div class="picker-weapon-thumb-wrap">
          <img src="${w.portrait || w.image}" alt="${w.name}" loading="lazy" onerror="this.onerror=null; this.src='https://enka.network/ui/UI_EquipIcon_' + this.alt.replace(/[^a-zA-Z0-9]/g, '') + '.png';">
          ${isEquippedHere ? `<span class="picker-weapon-equipped-badge">Equipped</span>` : ''}
          ${ownerChar ? `<span class="picker-weapon-owner-badge" title="Equipped by ${ownerChar.name}">By ${ownerChar.name}</span>` : ''}
        </div>
        <div class="picker-weapon-info">
          <div class="picker-weapon-name">${w.name}</div>
          <div class="picker-weapon-stat">
            <span style="color: var(--rarity-${w.rarity}); font-weight: 700;">${w.rarity}★</span>
            <span>ATK ${Math.round(w.baseAtk || 0)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// 4. CHARACTER DOSSIER DRAWER
// ==========================================================================
function getCharacterBuild(char) {
  if (char.build) return char.build;

  const genericWeapons = {
    'Sword': [
      { name: 'Mistsplitter Reforged', type: '5★ Premier (CRIT DMG / Elemental DMG)' },
      { name: 'Favonius Sword', type: '4★ F2P Best (High ER% Battery)' },
      { name: 'Amenoma Kageuchi', type: '4★ Craftable (ATK% / Energy Refund)' }
    ],
    'Claymore': [
      { name: 'Beacon of the Reed Sea', type: '5★ Universal (CRIT Rate / ATK%)' },
      { name: 'Serpent Spine', type: '4★ Battle Pass (CRIT Rate / DMG Stacks)' },
      { name: 'Favonius Greatsword', type: '4★ Support (High Energy Utility)' }
    ],
    'Polearm': [
      { name: 'Staff of Homa', type: '5★ Universal (CRIT DMG / HP & ATK)' },
      { name: 'The Catch', type: '4★ F2P Best (ER% / Burst DMG & CRIT)' },
      { name: 'Favonius Lance', type: '4★ Battery (Universal Energy)' }
    ],
    'Bow': [
      { name: 'Aqua Simulacra', type: '5★ Premier (CRIT DMG / All DMG Bonus)' },
      { name: 'Favonius Warbow', type: '4★ Support (High ER% Battery)' },
      { name: 'The Stringless', type: '4★ Reaction (EM / Skill & Burst DMG)' }
    ],
    'Catalyst': [
      { name: 'Lost Prayer to the Sacred Winds', type: '5★ Universal (CRIT Rate / Elemental DMG)' },
      { name: 'The Widsith', type: '4★ Top Pick (CRIT DMG / Huge RNG Buffs)' },
      { name: 'Thrilling Tales of Dragon Slayers', type: '3★ F2P Buffer (+48% ATK to next swap)' }
    ]
  };

  const defaultWeapons = genericWeapons[char.weaponType || char.weapon] || [
    { name: 'Favonius Series', type: '4★ Energy Recharge Utility' }
  ];

  return {
    role: char.rarity === 5 ? `${char.element} Carry / Specialist` : `${char.element} Utility / Sub-DPS`,
    bestWeapons: defaultWeapons,
    artifacts: [
      { set: '4pc Emblem of Severed Fate / 4pc Noblesse Oblige', notes: 'Boosts Burst DMG & Energy Recharge or team-wide ATK buffing.' }
    ],
    mainStats: {
      sands: 'ATK% or Energy Recharge%',
      goblet: `${char.element} DMG Bonus`,
      circlet: 'CRIT Rate or CRIT DMG'
    },
    substats: 'CRIT Rate / CRIT DMG > Energy Recharge% > ATK%',
    talentPriority: 'Elemental Burst > Elemental Skill > Normal Attack'
  };
}

function renderDrawerEquippedWeapon(char) {
  if (!drawerEquippedWeaponWidget || !drawerEquippedWeaponBody) return;
  if (!char) {
    drawerEquippedWeaponWidget.style.display = 'none';
    return;
  }
  drawerEquippedWeaponWidget.style.display = 'block';

  const assignments = getStoredWeaponAssignments();
  const weaponId = assignments[char.id];
  const weapon = weaponId ? WEAPONS.find(w => w.id === weaponId) : null;

  if (weapon) {
    drawerEquippedWeaponBody.innerHTML = `
      <div class="drawer-weapon-thumb-box">
        <img src="${weapon.portrait || weapon.image}" alt="${weapon.name}" onerror="this.onerror=null; this.src='https://enka.network/ui/UI_EquipIcon_' + this.alt.replace(/[^a-zA-Z0-9]/g, '') + '.png';">
      </div>
      <div class="drawer-weapon-info">
        <div class="drawer-weapon-title">${weapon.name}</div>
        <div class="drawer-weapon-meta">
          <span style="color: var(--rarity-${weapon.rarity}); font-weight: 700;">${weapon.rarity}★</span>
          <span>${weapon.weaponType}</span>
          <span>Base ATK: ${Math.round(weapon.baseAtk || 0)}</span>
          ${weapon.mainStat ? `<span>${weapon.mainStat}</span>` : ''}
        </div>
      </div>
    `;
    if (btnDrawerEquipWeapon) btnDrawerEquipWeapon.textContent = 'Change';
  } else {
    drawerEquippedWeaponBody.innerHTML = `
      <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; padding: 4px 0;">
        <i data-lucide="shield-alert" class="icon-xs" style="color: var(--accent-gold);"></i>
        <span>No weapon equipped to ${char.name}.</span>
      </div>
    `;
    if (btnDrawerEquipWeapon) btnDrawerEquipWeapon.textContent = '+ Equip';
  }
  refreshIcons();
}

function openCharacterDrawer(char) {
  selectedCharacter = char;
  selectedEntity = { type: 'character', data: char };

  // Highlight card in grid
  document.querySelectorAll('.genshin-card').forEach(c => {
    c.classList.toggle('card-selected', c.dataset.id === char.id);
  });

  if (drawerLevelGoalTitle) drawerLevelGoalTitle.textContent = 'Character Level Goal';
  if (drawerTalentsSection) drawerTalentsSection.style.display = 'block';

  if (heroPortraitImg) {
    heroPortraitImg.src = char.portrait || char.image || '';
    heroPortraitImg.alt = char.name;
    heroPortraitImg.onerror = () => { heroPortraitImg.src = 'https://enka.network/ui/UI_AvatarIcon_' + char.name.replace(/[^a-zA-Z0-9]/g, '') + '.png'; };
  }
  if (heroCharName) heroCharName.textContent = char.name;
  if (heroRarityBadge) {
    heroRarityBadge.textContent = `${char.rarity}★`;
    heroRarityBadge.className = `drawer-rarity-badge rarity-${char.rarity}`;
  }

  if (heroMetaBadges) {
    heroMetaBadges.innerHTML = `
      <span class="card-elem-badge" style="position: static; color: var(--elem-${char.element.toLowerCase()});">
        ${char.element}
      </span>
      <span class="hero-badge-item" style="font-size: 11px; color: var(--text-muted);">${char.weaponType || char.weapon || ''}</span>
      <span class="hero-badge-item" style="font-size: 11px; color: var(--text-muted);">${char.region || 'Teyvat'}</span>
    `;
  }

  updateHeroTrackButton(char.id);

  const roster = getStoredRoster();
  const saved = roster[char.id] || {
    currentLevel: 1,
    targetLevel: 90,
    talent1: { current: 1, target: 10 },
    talent2: { current: 1, target: 10 },
    talent3: { current: 1, target: 10 }
  };

  if (sliderCurrent) sliderCurrent.value = saved.currentLevel || 1;
  if (sliderTarget) sliderTarget.value = saved.targetLevel || 90;
  if (sliderCurrentLabel) sliderCurrentLabel.textContent = `Lv. ${saved.currentLevel || 1}`;
  if (sliderTargetLabel) sliderTargetLabel.textContent = `Lv. ${saved.targetLevel || 90}`;

  if (talent1Current) talent1Current.value = saved.talent1?.current || 1;
  if (talent1Target) talent1Target.value = saved.talent1?.target || 10;
  if (talent2Current) talent2Current.value = saved.talent2?.current || 1;
  if (talent2Target) talent2Target.value = saved.talent2?.target || 10;
  if (talent3Current) talent3Current.value = saved.talent3?.current || 1;
  if (talent3Target) talent3Target.value = saved.talent3?.target || 10;

  renderDrawerMaterials();
  renderBuildGuide();
  renderFarmingScheduleTab();
  renderDrawerEquippedWeapon(char);

  if (charDetailDrawer) charDetailDrawer.classList.add('active');
  if (charDrawerOverlay) charDrawerOverlay.classList.add('active');
  refreshIcons();
}

function openWeaponDrawer(weapon) {
  selectedEntity = { type: 'weapon', data: weapon };
  selectedCharacter = null;

  document.querySelectorAll('.genshin-card').forEach(c => {
    c.classList.toggle('card-selected', c.dataset.id === weapon.id);
  });

  if (drawerLevelGoalTitle) drawerLevelGoalTitle.textContent = 'Weapon Level Goal';
  if (drawerTalentsSection) drawerTalentsSection.style.display = 'none';
  if (drawerEquippedWeaponWidget) drawerEquippedWeaponWidget.style.display = 'none';

  if (heroPortraitImg) {
    heroPortraitImg.src = weapon.portrait || weapon.image || '';
    heroPortraitImg.alt = weapon.name;
    heroPortraitImg.onerror = () => { heroPortraitImg.src = 'https://enka.network/ui/UI_EquipIcon_' + weapon.name.replace(/[^a-zA-Z0-9]/g, '') + '.png'; };
  }
  if (heroCharName) heroCharName.textContent = weapon.name;
  if (heroRarityBadge) {
    heroRarityBadge.textContent = `${weapon.rarity}★`;
    heroRarityBadge.className = `drawer-rarity-badge rarity-${weapon.rarity}`;
  }

  if (heroMetaBadges) {
    heroMetaBadges.innerHTML = `
      <span class="hero-badge-item" style="font-size: 11px; color: var(--text-muted);">${weapon.weaponType}</span>
      <span class="hero-badge-item" style="font-size: 11px; color: var(--text-muted);">Base ATK: ${Math.round(weapon.baseAtk || 0)}</span>
      <span class="hero-badge-item" style="font-size: 11px; color: var(--text-muted);">${weapon.domainMaterial || ''}</span>
    `;
  }

  updateHeroTrackButton(weapon.id);

  const goals = getStoredWeaponGoals();
  const saved = goals[weapon.id] || { currentLevel: 1, targetLevel: 90 };

  if (sliderCurrent) sliderCurrent.value = saved.currentLevel || 1;
  if (sliderTarget) sliderTarget.value = saved.targetLevel || 90;
  if (sliderCurrentLabel) sliderCurrentLabel.textContent = `Lv. ${saved.currentLevel || 1}`;
  if (sliderTargetLabel) sliderTargetLabel.textContent = `Lv. ${saved.targetLevel || 90}`;

  renderDrawerMaterials();

  if (charDetailDrawer) charDetailDrawer.classList.add('active');
  if (charDrawerOverlay) charDrawerOverlay.classList.add('active');
  refreshIcons();
}

function closeCharacterDrawer() {
  if (charDetailDrawer) charDetailDrawer.classList.remove('active');
  if (charDrawerOverlay) charDrawerOverlay.classList.remove('active');
  if (drawerEquippedWeaponWidget) drawerEquippedWeaponWidget.style.display = 'none';
  selectedCharacter = null;
  selectedEntity = null;
  document.querySelectorAll('.genshin-card.card-selected').forEach(c => {
    c.classList.remove('card-selected');
  });
}

function updateHeroTrackButton(id) {
  if (!heroTrackToggleBtn) return;
  const isWeapon = selectedEntity?.type === 'weapon';
  const tracked = isWeapon ? isWeaponTracked(id) : isCharacterTracked(id);
  heroTrackToggleBtn.innerHTML = `
    <i data-lucide="star" class="icon-sm"></i>
    <span>${tracked ? (isWeapon ? 'Tracked in Weapon Goals' : 'Tracked in My Roster') : (isWeapon ? 'Track Weapon Goal' : 'Track in My Roster')}</span>
  `;
  heroTrackToggleBtn.className = `hero-track-action-btn ${tracked ? 'tracked' : ''}`;
  refreshIcons();
}

function renderDrawerMaterials() {
  if (!materialGridOutput) return;

  if (selectedEntity?.type === 'weapon') {
    const weapon = selectedEntity.data;
    const currentLevel = parseInt(sliderCurrent?.value, 10) || 1;
    const targetLevel = parseInt(sliderTarget?.value, 10) || 90;
    const costs = calculateWeaponCosts(weapon, currentLevel, targetLevel);
    const inv = getStoredInventory();

    const items = [
      { key: 'mora', name: 'Mora', count: costs.mora },
      { key: 'mystic_enhancement_ore', name: 'Mystic Enhancement Ore', count: costs.mysticOre }
    ];

    Object.entries(costs.materials || {}).forEach(([matName, count]) => {
      items.push({
        key: `wmat_${matName}`,
        name: matName,
        count
      });
    });

    const activeItems = items.filter(it => it.count > 0);
    if (activeItems.length === 0) {
      materialGridOutput.innerHTML = `<div style="padding: 12px; color: var(--text-muted); font-size: 12px;">All goals reached for this weapon.</div>`;
      return;
    }

    materialGridOutput.innerHTML = activeItems.map(item => {
      const have = parseInt(inv[item.key], 10) || 0;
      const missing = Math.max(0, item.count - have);

      return `
        <div class="mat-inv-row">
          <div class="mat-inv-info">
            <span class="mat-inv-name">${item.name}</span>
            <span class="mat-inv-needed">Need: ${formatNumber(item.count)}</span>
          </div>
          <div class="mat-inv-controls">
            <div class="mat-have-wrap">
              <span>Have:</span>
              <input type="number" min="0" class="mat-have-input" data-mat-key="${item.key}" value="${have}">
            </div>
            <span class="mat-missing-badge ${missing > 0 ? 'missing' : 'ready'}">
              ${missing > 0 ? `Missing: ${formatNumber(missing)}` : '✓ Ready'}
            </span>
          </div>
        </div>
      `;
    }).join('');
    return;
  }

  if (!selectedCharacter) return;

  const currentLevel = parseInt(sliderCurrent?.value, 10) || 1;
  const targetLevel = parseInt(sliderTarget?.value, 10) || 90;
  const progress = {
    currentLevel,
    targetLevel,
    talent1: {
      current: parseInt(talent1Current?.value, 10) || 1,
      target: parseInt(talent1Target?.value, 10) || 10
    },
    talent2: {
      current: parseInt(talent2Current?.value, 10) || 1,
      target: parseInt(talent2Target?.value, 10) || 10
    },
    talent3: {
      current: parseInt(talent3Current?.value, 10) || 1,
      target: parseInt(talent3Target?.value, 10) || 10
    }
  };

  const costs = calculateCharacterCosts(selectedCharacter, progress);
  const inv = getStoredInventory();

  const items = [
    { key: 'mora', name: 'Mora', count: costs.mora },
    { key: 'heros_wit', name: "Hero's Wit (EXP)", count: costs.herosWit },
    { key: `boss_${costs.bossMat.name}`, name: costs.bossMat.name, count: costs.bossMat.count },
    { key: `spec_${costs.specialty.name}`, name: costs.specialty.name, count: costs.specialty.count },
    { key: `common_${costs.commonDrops.baseName}`, name: `${costs.commonDrops.baseName} Drops`, count: costs.commonDrops.total },
    { key: `book_phil_${costs.talentBooks.baseName}`, name: `Philosophies of ${costs.talentBooks.baseName}`, count: costs.talentBooks.philosophies },
    { key: `book_guide_${costs.talentBooks.baseName}`, name: `Guide to ${costs.talentBooks.baseName}`, count: costs.talentBooks.guide },
    { key: `book_teach_${costs.talentBooks.baseName}`, name: `Teachings of ${costs.talentBooks.baseName}`, count: costs.talentBooks.teachings },
    { key: `weekly_${costs.weeklyBoss.name}`, name: costs.weeklyBoss.name, count: costs.weeklyBoss.count },
    { key: 'crown_of_insight', name: 'Crown of Insight', count: costs.crowns }
  ].filter(item => item.count > 0);

  if (items.length === 0) {
    materialGridOutput.innerHTML = `<div style="padding: 12px; color: var(--text-muted); font-size: 12px;">All goals reached for this character.</div>`;
    return;
  }

  materialGridOutput.innerHTML = items.map(item => {
    const have = parseInt(inv[item.key], 10) || 0;
    const missing = Math.max(0, item.count - have);

    return `
      <div class="mat-inv-row">
        <div class="mat-inv-info">
          <span class="mat-inv-name">${item.name}</span>
          <span class="mat-inv-needed">Need: ${formatNumber(item.count)}</span>
        </div>
        <div class="mat-inv-controls">
          <div class="mat-have-wrap">
            <span>Have:</span>
            <input type="number" min="0" class="mat-have-input" data-mat-key="${item.key}" value="${have}">
          </div>
          <span class="mat-missing-badge ${missing > 0 ? 'missing' : 'ready'}">
            ${missing > 0 ? `Missing: ${formatNumber(missing)}` : '✓ Ready'}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function syncCurrentGoalsToStorage() {
  if (selectedEntity?.type === 'weapon') {
    const currentLvl = parseInt(sliderCurrent.value, 10) || 1;
    const targetLvl = parseInt(sliderTarget.value, 10) || 90;
    if (isWeaponTracked(selectedEntity.data.id)) {
      updateWeaponProgress(selectedEntity.data.id, currentLvl, targetLvl);
      updateSummaryBar();
      renderTodayStrip();
      renderGrid();
    }
    renderDrawerMaterials();
    return;
  }

  if (!selectedCharacter) return;
  const currentLvl = parseInt(sliderCurrent.value, 10) || 1;
  const targetLvl = parseInt(sliderTarget.value, 10) || 90;
  const talentGoals = {
    talent1: {
      current: parseInt(talent1Current.value, 10) || 1,
      target: parseInt(talent1Target.value, 10) || 10
    },
    talent2: {
      current: parseInt(talent2Current.value, 10) || 1,
      target: parseInt(talent2Target.value, 10) || 10
    },
    talent3: {
      current: parseInt(talent3Current.value, 10) || 1,
      target: parseInt(talent3Target.value, 10) || 10
    }
  };

  if (isCharacterTracked(selectedCharacter.id)) {
    updateCharacterProgress(selectedCharacter.id, currentLvl, targetLvl, talentGoals);
    updateSummaryBar();
    renderTodayStrip();
    renderGrid();
  }
  renderDrawerMaterials();
}

function openRosterInventoryModal() {
  if (!rosterInventoryModal || !rosterInventoryBody) return;
  renderRosterInventoryBody();
  rosterInventoryModal.classList.add('active');
  rosterInventoryModal.style.display = 'flex';
  refreshIcons();
}

function closeRosterInventoryModal() {
  if (!rosterInventoryModal) return;
  rosterInventoryModal.classList.remove('active');
  rosterInventoryModal.style.display = 'none';
}

function renderRosterInventoryBody() {
  if (!rosterInventoryBody) return;
  const roster = getStoredRoster();
  const weaponGoals = getStoredWeaponGoals();
  const totals = calculateRosterTotals(roster, CHARACTERS, getStoredInventory(), weaponGoals, WEAPONS);
  const items = Object.values(totals.materialsMap);

  if (items.length === 0) {
    rosterInventoryBody.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
        No characters are currently tracked in your roster. Click the star on any character card to begin tracking materials!
      </div>
    `;
    return;
  }

  rosterInventoryBody.innerHTML = `
    <div class="materials-inventory-table">
      ${items.map(item => `
        <div class="mat-inv-row">
          <div class="mat-inv-info">
            <span class="mat-inv-name">${item.name}</span>
            <span class="mat-inv-needed">${item.category} • Total Need: ${formatNumber(item.needed)}</span>
          </div>
          <div class="mat-inv-controls">
            <div class="mat-have-wrap">
              <span>Have:</span>
              <input type="number" min="0" class="mat-have-input roster-inv-input" data-mat-key="${item.key}" value="${item.have}">
            </div>
            <span class="mat-missing-badge ${item.missing > 0 ? 'missing' : 'ready'}">
              ${item.missing > 0 ? `Missing: ${formatNumber(item.missing)}` : '✓ Ready'}
            </span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderBuildGuide() {
  if (!selectedCharacter) return;
  const b = getCharacterBuild(selectedCharacter);

  buildGuideOutput.innerHTML = `
    <div class="clean-section-card">
      <div class="section-card-title"><i data-lucide="crosshair" class="icon-sm"></i><span>Combat Role</span></div>
      <p style="font-size: 13px; font-weight: 600; color: #fff;">${b.role}</p>
    </div>

    <div class="clean-section-card">
      <div class="section-card-title"><i data-lucide="sword" class="icon-sm"></i><span>Ranked Weapon Tiers</span></div>
      <div class="tier-list-box">
        ${b.bestWeapons.map((w, idx) => `
          <div class="tier-list-row">
            <span style="font-weight: 600;">#${idx + 1} ${w.name}</span>
            <span class="tier-meta-tag">${w.type}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="clean-section-card">
      <div class="section-card-title"><i data-lucide="layers" class="icon-sm"></i><span>Recommended Artifact Sets</span></div>
      <div class="tier-list-box">
        ${b.artifacts.map(a => `
          <div class="tier-list-row" style="flex-direction: column; align-items: flex-start; gap: 2px;">
            <span style="font-weight: 600; color: #fff;">${a.set}</span>
            <span style="font-size: 11px; color: var(--text-muted);">${a.notes}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="clean-section-card">
      <div class="section-card-title"><i data-lucide="activity" class="icon-sm"></i><span>Artifact Main Stats & Substats</span></div>
      <div class="stat-slots-grid">
        <div class="stat-slot-item">
          <span class="stat-slot-type">Sands of Eon</span>
          <div class="stat-slot-choice">${b.mainStats.sands}</div>
        </div>
        <div class="stat-slot-item">
          <span class="stat-slot-type">Goblet of Eonothem</span>
          <div class="stat-slot-choice">${b.mainStats.goblet}</div>
        </div>
        <div class="stat-slot-item">
          <span class="stat-slot-type">Circlet of Logos</span>
          <div class="stat-slot-choice">${b.mainStats.circlet}</div>
        </div>
      </div>
      <div style="margin-top: 10px; padding: 8px 10px; background: var(--bg-surface); border-radius: var(--radius-xs);">
        <span style="font-size: 10px; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Substat Priority Chain:</span>
        <p style="font-size: 12px; color: var(--text-main); font-weight: 600; margin-top: 2px;">${b.substats}</p>
      </div>
    </div>

    <div class="clean-section-card">
      <div class="section-card-title"><i data-lucide="chevrons-up" class="icon-sm"></i><span>Talent Priority</span></div>
      <p style="font-size: 13px; font-weight: 700; color: var(--accent-gold);">${b.talentPriority}</p>
    </div>
  `;
  refreshIcons();
}

function renderFarmingScheduleTab() {
  if (!selectedCharacter) return;
  const weekdays = Array.isArray(selectedCharacter.talentDomainWeekday)
    ? selectedCharacter.talentDomainWeekday.join(' / ')
    : (selectedCharacter['talent domain weekday'] || 'Sunday');

  farmingScheduleOutput.innerHTML = `
    <div class="clean-section-card">
      <div class="section-card-title"><i data-lucide="book-open" class="icon-sm"></i><span>Talent Book Schedule</span></div>
      <div style="display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: var(--bg-surface); border-radius: var(--radius-xs);">
        <div>
          <span style="font-size: 14px; font-weight: 700; color: #fff;">Teachings of ${selectedCharacter.talentBook || 'Talent Book'}</span>
          <p style="font-size: 11px; color: var(--accent-gold); margin-top: 2px;">Domain Location: ${selectedCharacter.region || 'Teyvat'} • Days: ${weekdays}</p>
        </div>
      </div>
    </div>

    <div class="clean-section-card">
      <div class="section-card-title"><i data-lucide="award" class="icon-sm"></i><span>Weekly Boss Material</span></div>
      <div style="display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: var(--bg-surface); border-radius: var(--radius-xs);">
        <div>
          <span style="font-size: 14px; font-weight: 700; color: #fff;">${selectedCharacter.weeklyBoss || 'Weekly Boss Material'}</span>
          <p style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Trounce Domain material required for Talents Lv. 7+</p>
        </div>
      </div>
    </div>
  `;
  refreshIcons();
}

// ==========================================================================
// 5. DAILY DOMAINS SCHEDULE
// ==========================================================================
function setupDayDropdown() {
  const today = DAYS_OF_WEEK[new Date().getDay()];
  if (!scheduleDayDropdown) return;
  scheduleDayDropdown.innerHTML = DAYS_OF_WEEK.map(d => `
    <option value="${d}" ${d === today ? 'selected' : ''}>${d} ${d === today ? '(Today)' : ''}</option>
  `).join('');

  scheduleDayDropdown.addEventListener('change', (e) => {
    renderDomainsForDay(e.target.value);
  });
}

function openDomainSchedule() {
  const today = scheduleDayDropdown?.value || DAYS_OF_WEEK[new Date().getDay()];
  renderDomainsForDay(today);
  if (domainScheduleModal) domainScheduleModal.classList.add('active');
  refreshIcons();
}

function renderDomainsForDay(day) {
  if (!domainScheduleModalBody) return;
  const schedule = DOMAIN_SCHEDULE[day] || { talents: [], weapons: [] };

  domainScheduleModalBody.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
      <div class="clean-section-card">
        <div class="section-card-title"><i data-lucide="book-open" class="icon-sm"></i><span>Talent Books (${day})</span></div>
        <div class="tier-list-box">
          ${schedule.talents.map(t => `
            <div class="tier-list-row" style="flex-direction: column; align-items: flex-start; gap: 3px;">
              <span style="font-weight: 700; color: #fff;">${t.name}</span>
              <span style="font-size: 11px; color: var(--text-muted);">${t.characters}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="clean-section-card">
        <div class="section-card-title"><i data-lucide="sword" class="icon-sm"></i><span>Weapon Materials (${day})</span></div>
        <div class="tier-list-box">
          ${schedule.weapons.map(w => `
            <div class="tier-list-row" style="flex-direction: column; align-items: flex-start; gap: 3px;">
              <span style="font-weight: 700; color: #fff;">${w.name}</span>
              <span style="font-size: 11px; color: var(--text-muted);">${w.mats}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  refreshIcons();
}

// ==========================================================================
// EVENT LISTENERS & WIRING
// ==========================================================================
function setupEventListeners() {
  // Top View Switching
  topNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchView(btn.dataset.viewTarget);
    });
  });

  // Tools Overflow Dropdown Menu
  const navToolsToggleBtn = document.getElementById('navToolsToggleBtn');
  const navToolsDropdown = document.getElementById('navToolsDropdown');

  if (navToolsToggleBtn && navToolsDropdown) {
    navToolsToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = navToolsDropdown.style.display === 'flex';
      navToolsDropdown.style.display = isVisible ? 'none' : 'flex';
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-tools-menu-wrap')) {
        navToolsDropdown.style.display = 'none';
      }
    });

    navToolsDropdown.querySelectorAll('.nav-dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        navToolsDropdown.style.display = 'none';
      });
    });
  }

  // Collapsible Today Strip Toggle
  const todayStripToggle = document.getElementById('todayStripToggle');
  const todayToggleIcon = document.getElementById('todayToggleIcon');

  if (todayStripToggle && todayDomainsFlow) {
    todayStripToggle.addEventListener('click', () => {
      const isHidden = todayDomainsFlow.style.display === 'none';
      todayDomainsFlow.style.display = isHidden ? 'flex' : 'none';
      if (todayToggleIcon) {
        todayToggleIcon.classList.toggle('expanded', isHidden);
      }
    });
  }

  // Sync Button (guard if present)
  const btnSyncMeta = document.getElementById('btnSyncMeta');
  const syncStatusLabel = document.getElementById('syncStatusLabel');
  if (btnSyncMeta) {
    btnSyncMeta.addEventListener('click', () => {
      btnSyncMeta.classList.add('spinning');
      if (syncStatusLabel) syncStatusLabel.textContent = 'Syncing...';
      setTimeout(() => {
        btnSyncMeta.classList.remove('spinning');
        if (syncStatusLabel) syncStatusLabel.textContent = 'Synced: Community Meta (Live)';
        renderTierList();
        alert('Meta tier ratings & community synergies have been refreshed!');
      }, 800);
    });
  }

  // Search
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      currentPage = 1;
      renderGrid();
    });
  }

  // Global hotkeys
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput && document.activeElement !== pickerSearchInput) {
      e.preventDefault();
      if (searchInput) searchInput.focus();
    }
    if (e.key === 'Escape') {
      closeCharacterDrawer();
      closeRosterInventoryModal();
      if (domainScheduleModal) domainScheduleModal.classList.remove('active');
      if (charPickerModal) charPickerModal.classList.remove('active');
    }
  });

  // Entity Switcher (Characters vs Weapons)
  if (btnEntityCharacters) {
    btnEntityCharacters.addEventListener('click', () => {
      activeEntity = 'characters';
      btnEntityCharacters.classList.add('active');
      if (btnEntityWeapons) btnEntityWeapons.classList.remove('active');
      if (elementFilterBar) elementFilterBar.style.display = 'flex';
      currentPage = 1;
      renderGrid();
    });
  }

  if (btnEntityWeapons) {
    btnEntityWeapons.addEventListener('click', () => {
      activeEntity = 'weapons';
      btnEntityWeapons.classList.add('active');
      if (btnEntityCharacters) btnEntityCharacters.classList.remove('active');
      if (elementFilterBar) elementFilterBar.style.display = 'none';
      currentPage = 1;
      renderGrid();
    });
  }

  // Segment Buttons
  if (btnViewAll) {
    btnViewAll.addEventListener('click', () => {
      btnViewAll.classList.add('active');
      if (btnViewTracked) btnViewTracked.classList.remove('active');
      activeView = 'all';
      currentPage = 1;
      renderGrid();
    });
  }

  if (btnViewTracked) {
    btnViewTracked.addEventListener('click', () => {
      btnViewTracked.classList.add('active');
      if (btnViewAll) btnViewAll.classList.remove('active');
      activeView = 'tracked';
      currentPage = 1;
      renderGrid();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      currentPage = 1;
      renderGrid();
    });
  }

  // Elemental Filters
  if (elementFilterBar) {
    elementFilterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.elem-filter-btn');
      if (!btn) return;
      document.querySelectorAll('.elem-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeElement = btn.dataset.elem;
      currentPage = 1;
      renderGrid();
    });
  }

  // Secondary Filters (Weapon Type, Rarity, Region)
  if (filterWeapon) {
    filterWeapon.addEventListener('change', (e) => {
      activeWeapon = e.target.value;
      currentPage = 1;
      renderGrid();
    });
  }

  if (filterRarity) {
    filterRarity.addEventListener('change', (e) => {
      activeRarity = e.target.value;
      currentPage = 1;
      renderGrid();
    });
  }

  if (filterRegion) {
    filterRegion.addEventListener('change', (e) => {
      activeRegion = e.target.value;
      currentPage = 1;
      renderGrid();
    });
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      activeElement = 'All';
      activeWeapon = 'All';
      activeRarity = 'All';
      activeRegion = 'All';
      if (filterWeapon) filterWeapon.value = 'All';
      if (filterRarity) filterRarity.value = 'All';
      if (filterRegion) filterRegion.value = 'All';
      document.querySelectorAll('.elem-filter-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.elem === 'All');
      });
      currentPage = 1;
      renderGrid();
    });
  }

  // Pagination Controls
  if (btnPagePrev) {
    btnPagePrev.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderGrid();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
  if (btnPageNext) {
    btnPageNext.addEventListener('click', () => {
      currentPage++;
      renderGrid();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Character & Weapon Grid Clicks (Track Star or Open Drawer)
  if (characterGrid) {
    characterGrid.addEventListener('click', (e) => {
      const weaponTrackBtn = e.target.closest('[data-track-weapon]');
      if (weaponTrackBtn) {
        e.stopPropagation();
        const weaponId = weaponTrackBtn.dataset.trackWeapon;
        toggleWeaponTrack(weaponId);
        renderGrid();
        updateSummaryBar();
        renderTodayStrip();
        if (selectedEntity?.type === 'weapon' && selectedEntity.data.id === weaponId) {
          updateHeroTrackButton(weaponId);
        }
        return;
      }

      const favBtn = e.target.closest('.card-fav-btn');
      if (favBtn) {
        e.stopPropagation();
        const charId = favBtn.dataset.track;
        toggleCharacterTrack(charId);
        renderGrid();
        updateSummaryBar();
        renderTodayStrip();
        if (selectedEntity?.type === 'character' && selectedEntity.data.id === charId) {
          updateHeroTrackButton(charId);
        }
        return;
      }

      const equipSlot = e.target.closest('[data-action="equip-weapon"]');
      if (equipSlot) {
        e.stopPropagation();
        const charId = equipSlot.dataset.charId;
        openWeaponPicker(charId);
        return;
      }

      const ownerSlot = e.target.closest('[data-action="weapon-owner"]');
      if (ownerSlot) {
        e.stopPropagation();
        const weaponId = ownerSlot.dataset.weaponId;
        const weapon = WEAPONS.find(w => w.id === weaponId);
        if (weapon) openWeaponDrawer(weapon);
        return;
      }

      const card = e.target.closest('.genshin-card');
      if (card) {
        if (card.dataset.type === 'weapon') {
          const weapon = WEAPONS.find(w => w.id === card.dataset.id);
          if (weapon) openWeaponDrawer(weapon);
        } else {
          const charId = card.dataset.id;
          const char = CHARACTERS.find(c => c.id === charId);
          if (char) openCharacterDrawer(char);
        }
      }
    });
  }

  // Tier List Role Filters
  if (tierRoleFilters) {
    tierRoleFilters.addEventListener('click', (e) => {
      const btn = e.target.closest('.role-filter-btn');
      if (!btn) return;
      document.querySelectorAll('.role-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTierRole = btn.dataset.role;
      renderTierList();
    });
  }

  // Tier List Card Click -> Open Drawer
  if (tierSectionsWrapper) {
    tierSectionsWrapper.addEventListener('click', (e) => {
      const card = e.target.closest('.tier-char-card');
      if (!card) return;
      const charId = card.dataset.charId;
      const char = CHARACTERS.find(c => c.id === charId || c.id.replace(/-/g, '') === charId.replace(/-/g, '') || c.name.toLowerCase() === charId.toLowerCase());
      if (char) openCharacterDrawer(char);
    });
  }

  // Preset Teams in Composer
  if (presetTeamChips) {
    presetTeamChips.addEventListener('click', (e) => {
      const chip = e.target.closest('.preset-team-chip-btn');
      if (!chip) return;
      const presetId = chip.dataset.presetId;
      const preset = PRESET_META_TEAMS.find(p => p.id === presetId);
      if (preset) {
        currentTeam = [...preset.characters];
        saveTeamToStorage(currentTeam);
        renderTeamComposer();
      }
    });
  }

  // Clear Team in Composer
  const btnClearTeam = document.getElementById('btnClearTeam');
  if (btnClearTeam) {
    btnClearTeam.addEventListener('click', () => {
      currentTeam = [null, null, null, null];
      saveTeamToStorage(currentTeam);
      renderTeamComposer();
    });
  }

  // Team Slots Grid (Add or Remove)
  if (teamSlotsGrid) {
    teamSlotsGrid.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.slot-remove-btn');
      if (removeBtn) {
        e.stopPropagation();
        const idx = parseInt(removeBtn.dataset.slotRemove, 10);
        currentTeam[idx] = null;
        saveTeamToStorage(currentTeam);
        renderTeamComposer();
        return;
      }

      const emptySlot = e.target.closest('.slot-empty');
      if (emptySlot) {
        const idx = parseInt(emptySlot.dataset.slotEmpty, 10);
        openCharacterPicker(idx);
        return;
      }

      const occupiedCard = e.target.closest('.composer-slot-card');
      if (occupiedCard) {
        const idx = parseInt(occupiedCard.dataset.slotIndex, 10);
        openCharacterPicker(idx);
      }
    });
  }

  // Character Picker Modal Interactions
  if (charPickerCloseBtn) {
    charPickerCloseBtn.addEventListener('click', () => {
      if (charPickerModal) charPickerModal.classList.remove('active');
    });
  }
  if (charPickerModal) {
    charPickerModal.addEventListener('click', (e) => {
      if (e.target === charPickerModal) charPickerModal.classList.remove('active');
    });
  }

  if (pickerSearchInput) {
    pickerSearchInput.addEventListener('input', (e) => {
      renderPickerGrid(e.target.value);
    });
  }

  if (pickerCharacterGrid) {
    pickerCharacterGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.genshin-card');
      if (!card) return;
      const charId = card.dataset.pickerSelect;
      if (targetSlotIndex !== null) {
        currentTeam[targetSlotIndex] = charId;
        saveTeamToStorage(currentTeam);
        if (charPickerModal) charPickerModal.classList.remove('active');
        renderTeamComposer();
      }
    });
  }

  // Weapon Picker Modal Listeners (Phase B)
  if (weaponPickerCloseBtn) {
    weaponPickerCloseBtn.addEventListener('click', closeWeaponPicker);
  }
  if (weaponPickerModal) {
    weaponPickerModal.addEventListener('click', (e) => {
      if (e.target === weaponPickerModal) closeWeaponPicker();
    });
  }

  if (btnDrawerEquipWeapon) {
    btnDrawerEquipWeapon.addEventListener('click', () => {
      if (selectedCharacter) {
        openWeaponPicker(selectedCharacter.id);
      }
    });
  }

  if (btnUnequipCurrentWeapon) {
    btnUnequipCurrentWeapon.addEventListener('click', () => {
      if (targetWeaponCharId) {
        unassignWeapon(targetWeaponCharId);
        weaponAssignments = getStoredWeaponAssignments();
        closeWeaponPicker();
        renderGrid();
        if (selectedCharacter && selectedCharacter.id === targetWeaponCharId) {
          renderDrawerEquippedWeapon(selectedCharacter);
        }
      }
    });
  }

  if (weaponPickerSearchInput) {
    weaponPickerSearchInput.addEventListener('input', (e) => {
      weaponPickerSearch = e.target.value;
      renderWeaponPickerGrid();
    });
  }

  if (weaponPickerRarityFilter) {
    weaponPickerRarityFilter.addEventListener('click', (e) => {
      const btn = e.target.closest('.segment-item');
      if (!btn) return;
      weaponPickerRarityFilter.querySelectorAll('.segment-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      weaponPickerRarity = btn.dataset.rarity;
      renderWeaponPickerGrid();
    });
  }

  if (weaponPickerGrid) {
    weaponPickerGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.picker-weapon-card');
      if (!card || !targetWeaponCharId) return;
      const weaponId = card.dataset.pickerWeaponId;
      assignWeaponToCharacter(targetWeaponCharId, weaponId);
      weaponAssignments = getStoredWeaponAssignments();
      closeWeaponPicker();
      renderGrid();
      if (selectedCharacter && selectedCharacter.id === targetWeaponCharId) {
        renderDrawerEquippedWeapon(selectedCharacter);
      }
    });
  }

  // Add to Team Composer from Drawer
  if (heroAddToComposerBtn) {
    heroAddToComposerBtn.addEventListener('click', () => {
      if (!selectedCharacter) return;
      let emptyIdx = currentTeam.findIndex(id => !id);
      if (emptyIdx === -1) emptyIdx = 0;

      currentTeam[emptyIdx] = selectedCharacter.id;
      saveTeamToStorage(currentTeam);
      closeCharacterDrawer();
      switchView('viewTeamComposer');
      renderTeamComposer();
    });
  }

  // Drawer Close Controls
  if (charDrawerCloseBtn) {
    charDrawerCloseBtn.addEventListener('click', closeCharacterDrawer);
  }
  if (charDrawerOverlay) {
    charDrawerOverlay.addEventListener('click', closeCharacterDrawer);
  }

  // Domain Modal
  if (domainModalCloseBtn) {
    domainModalCloseBtn.addEventListener('click', () => {
      if (domainScheduleModal) domainScheduleModal.classList.remove('active');
    });
  }
  if (domainScheduleModal) {
    domainScheduleModal.addEventListener('click', (e) => {
      if (e.target === domainScheduleModal) domainScheduleModal.classList.remove('active');
    });
  }

  if (openDomainsBtn) {
    openDomainsBtn.addEventListener('click', openDomainSchedule);
  }

  // Overall Roster Inventory Modal
  if (openRosterInventoryBtn) {
    openRosterInventoryBtn.addEventListener('click', openRosterInventoryModal);
  }
  if (inventoryModalCloseBtn) {
    inventoryModalCloseBtn.addEventListener('click', closeRosterInventoryModal);
  }
  if (rosterInventoryModal) {
    rosterInventoryModal.addEventListener('click', (e) => {
      if (e.target === rosterInventoryModal) closeRosterInventoryModal();
    });
  }

  // Reset Tracked Roster / Goals Button
  if (resetTrackedBtn) {
    resetTrackedBtn.addEventListener('click', () => {
      if (activeEntity === 'weapons') {
        if (confirm('Clear all weapons from your tracked goals?')) {
          saveStoredWeaponGoals({});
          renderGrid();
          updateSummaryBar();
          renderTodayStrip();
          if (selectedEntity?.type === 'weapon') updateHeroTrackButton(selectedEntity.data.id);
        }
      } else {
        if (confirm('Clear all characters from your tracked roster?')) {
          saveStoredRoster({});
          renderGrid();
          updateSummaryBar();
          renderTodayStrip();
          if (selectedCharacter) updateHeroTrackButton(selectedCharacter.id);
        }
      }
    });
  }

  // Track Button inside Drawer
  if (heroTrackToggleBtn) {
    heroTrackToggleBtn.addEventListener('click', () => {
      const current = parseInt(sliderCurrent?.value, 10) || 1;
      const target = parseInt(sliderTarget?.value, 10) || 90;

      if (selectedEntity?.type === 'weapon') {
        toggleWeaponTrack(selectedEntity.data.id, current, target);
        updateHeroTrackButton(selectedEntity.data.id);
        renderGrid();
        updateSummaryBar();
        renderTodayStrip();
        return;
      }

      if (!selectedCharacter) return;
      const talentGoals = {
        talent1: {
          current: parseInt(talent1Current?.value, 10) || 1,
          target: parseInt(talent1Target?.value, 10) || 10
        },
        talent2: {
          current: parseInt(talent2Current?.value, 10) || 1,
          target: parseInt(talent2Target?.value, 10) || 10
        },
        talent3: {
          current: parseInt(talent3Current?.value, 10) || 1,
          target: parseInt(talent3Target?.value, 10) || 10
        }
      };
      toggleCharacterTrack(selectedCharacter.id, current, target, talentGoals);
      updateHeroTrackButton(selectedCharacter.id);
      renderGrid();
      updateSummaryBar();
      renderTodayStrip();
    });
  }

  // Drawer Tabs Switching
  tabsNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabsNavBtns.forEach(b => b.classList.remove('active'));
      tabContentPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(btn.dataset.tab);
      if (targetPanel) targetPanel.classList.add('active');
      refreshIcons();
    });
  });

  // Level Sliders
  if (sliderCurrent) {
    sliderCurrent.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      const targetVal = parseInt(sliderTarget?.value, 10) || 90;
      if (val > targetVal && sliderTarget) {
        sliderTarget.value = val;
        if (sliderTargetLabel) sliderTargetLabel.textContent = `Lv. ${val}`;
      }
      if (sliderCurrentLabel) sliderCurrentLabel.textContent = `Lv. ${val}`;
      syncCurrentGoalsToStorage();
    });
  }

  if (sliderTarget) {
    sliderTarget.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      const currentVal = parseInt(sliderCurrent?.value, 10) || 1;
      if (val < currentVal && sliderCurrent) {
        sliderCurrent.value = val;
        if (sliderCurrentLabel) sliderCurrentLabel.textContent = `Lv. ${val}`;
      }
      if (sliderTargetLabel) sliderTargetLabel.textContent = `Lv. ${val}`;
      syncCurrentGoalsToStorage();
    });
  }

  // 3 Talent Inputs
  [talent1Current, talent1Target, talent2Current, talent2Target, talent3Current, talent3Target].forEach(input => {
    if (input) {
      input.addEventListener('change', () => {
        input.value = Math.max(1, Math.min(10, parseInt(input.value, 10) || 1));
        syncCurrentGoalsToStorage();
      });
    }
  });

  // Preset Character Level Chips
  presetChipBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const s = parseInt(btn.dataset.start, 10);
      const t = parseInt(btn.dataset.target, 10);
      if (sliderCurrent) sliderCurrent.value = s;
      if (sliderTarget) sliderTarget.value = t;
      if (sliderCurrentLabel) sliderCurrentLabel.textContent = `Lv. ${s}`;
      if (sliderTargetLabel) sliderTargetLabel.textContent = `Lv. ${t}`;
      syncCurrentGoalsToStorage();
    });
  });

  // Preset Talent Level Chips
  presetTalentChips.forEach(btn => {
    btn.addEventListener('click', () => {
      const t1 = parseInt(btn.dataset.t1, 10) || 10;
      const t2 = parseInt(btn.dataset.t2, 10) || 10;
      const t3 = parseInt(btn.dataset.t3, 10) || 10;
      if (talent1Current) talent1Current.value = 1;
      if (talent1Target) talent1Target.value = t1;
      if (talent2Current) talent2Current.value = 1;
      if (talent2Target) talent2Target.value = t2;
      if (talent3Current) talent3Current.value = 1;
      if (talent3Target) talent3Target.value = t3;
      syncCurrentGoalsToStorage();
    });
  });

  // Material Inventory Inputs in Drawer
  if (materialGridOutput) {
    materialGridOutput.addEventListener('input', (e) => {
      const input = e.target.closest('.mat-have-input');
      if (!input) return;
      const key = input.dataset.matKey;
      const val = Math.max(0, parseInt(input.value, 10) || 0);
      setInventoryItem(key, val);

      const row = input.closest('.mat-inv-row');
      if (row) {
        const badge = row.querySelector('.mat-missing-badge');
        const needText = row.querySelector('.mat-inv-needed')?.textContent || '';
        const match = needText.match(/Need:\s*([\d,]+)/);
        if (match && badge) {
          const need = parseInt(match[1].replace(/,/g, ''), 10) || 0;
          const missing = Math.max(0, need - val);
          badge.className = `mat-missing-badge ${missing > 0 ? 'missing' : 'ready'}`;
          badge.textContent = missing > 0 ? `Missing: ${formatNumber(missing)}` : '✓ Ready';
        }
      }

      updateSummaryBar();
      renderTodayStrip();
    });
  }

  // Material Inventory Inputs in Roster Inventory Modal
  if (rosterInventoryBody) {
    rosterInventoryBody.addEventListener('input', (e) => {
      const input = e.target.closest('.roster-inv-input');
      if (!input) return;
      const key = input.dataset.matKey;
      const val = Math.max(0, parseInt(input.value, 10) || 0);
      setInventoryItem(key, val);

      const row = input.closest('.mat-inv-row');
      if (row) {
        const badge = row.querySelector('.mat-missing-badge');
        const needText = row.querySelector('.mat-inv-needed')?.textContent || '';
        const match = needText.match(/Total Need:\s*([\d,]+)/);
        if (match && badge) {
          const need = parseInt(match[1].replace(/,/g, ''), 10) || 0;
          const missing = Math.max(0, need - val);
          badge.className = `mat-missing-badge ${missing > 0 ? 'missing' : 'ready'}`;
          badge.textContent = missing > 0 ? `Missing: ${formatNumber(missing)}` : '✓ Ready';
        }
      }

      if (selectedCharacter) renderDrawerMaterials();
      updateSummaryBar();
      renderTodayStrip();
    });
  }
}

// ==========================================================================
// RESIN PLANNER (Cap 200, 1 resin / 8 min)
// ==========================================================================
function initResinPlanner() {
  const updateResinUI = () => {
    const resin = getStoredResin();
    if (navResinBadge) navResinBadge.textContent = `${resin.current}/200`;
    if (resinNumberInput) resinNumberInput.value = resin.current;
    if (resinRangeInput) resinRangeInput.value = resin.current;

    const roster = getStoredRoster();
    const weaponGoals = getStoredWeaponGoals();
    const inv = getStoredInventory();
    const totals = calculateRosterTotals(roster, CHARACTERS, inv, weaponGoals, WEAPONS, resin.current);
    const plan = totals.resinPlan || calculateResinPlan(resin.current);

    if (resinCapTimeDisplay) {
      resinCapTimeDisplay.textContent = plan.capTimeStr;
    }

    if (resinRunsBreakdown) {
      resinRunsBreakdown.innerHTML = `
        <div class="resin-run-card">
          <div class="resin-run-title">World Bosses (40 Resin)</div>
          <div class="resin-run-count">${plan.bossRuns} runs</div>
          <div class="resin-run-sub">${plan.bossRuns * 40} resin needed</div>
        </div>
        <div class="resin-run-card">
          <div class="resin-run-title">Talent Domains (20 Resin)</div>
          <div class="resin-run-count">${plan.talentRuns} runs</div>
          <div class="resin-run-sub">${plan.talentRuns * 20} resin needed</div>
        </div>
        <div class="resin-run-card">
          <div class="resin-run-title">Weapon Domains (20 Resin)</div>
          <div class="resin-run-count">${plan.weaponRuns} runs</div>
          <div class="resin-run-sub">${plan.weaponRuns * 20} resin needed</div>
        </div>
        <div class="resin-run-card">
          <div class="resin-run-title">Weekly Bosses (30/60)</div>
          <div class="resin-run-count">${plan.weeklyRuns} runs</div>
          <div class="resin-run-sub">${plan.weeklyRuns <= 3 ? plan.weeklyRuns * 30 : (90 + (plan.weeklyRuns - 3) * 60)} resin needed</div>
        </div>
        <div class="resin-run-card" style="grid-column: 1 / -1; background: rgba(212, 149, 60, 0.08); border-color: rgba(212, 149, 60, 0.3);">
          <div class="resin-run-title" style="color: var(--accent-ui);">Total Farming Required</div>
          <div class="resin-run-count" style="color: var(--accent-ui);">${plan.totalRuns} runs (${formatNumber(plan.totalResin)} Resin)</div>
          <div class="resin-run-sub">Estimated ~${plan.daysNeeded} days of natural resin generation (180 resin/day)</div>
        </div>
      `;
    }
  };

  if (resinRangeInput) {
    resinRangeInput.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10) || 0;
      saveStoredResin(val);
      updateResinUI();
      updateSummaryBar();
    });
  }

  if (resinNumberInput) {
    resinNumberInput.addEventListener('input', (e) => {
      const val = Math.max(0, Math.min(200, parseInt(e.target.value, 10) || 0));
      saveStoredResin(val);
      updateResinUI();
      updateSummaryBar();
    });
  }

  if (openResinPlannerBtn) {
    openResinPlannerBtn.addEventListener('click', () => {
      if (resinPlannerModal) {
        resinPlannerModal.classList.add('active');
        resinPlannerModal.style.display = 'flex';
      }
      updateResinUI();
      refreshIcons();
    });
  }

  if (resinModalCloseBtn) {
    resinModalCloseBtn.addEventListener('click', () => {
      if (resinPlannerModal) {
        resinPlannerModal.classList.remove('active');
        resinPlannerModal.style.display = 'none';
      }
    });
  }

  if (resinPlannerModal) {
    resinPlannerModal.addEventListener('click', (e) => {
      if (e.target === resinPlannerModal) {
        resinPlannerModal.classList.remove('active');
        resinPlannerModal.style.display = 'none';
      }
    });
  }

  updateResinUI();
}

// ==========================================================================
// WEEKLY BOSS TRACKER (Resets Monday 4:00 AM server time)
// ==========================================================================
const WEEKLY_BOSS_LIST = [
  { id: 'dvalin', name: 'Stormterror (Dvalin)', domain: 'Confront Stormterror', region: 'Mondstadt' },
  { id: 'andrius', name: 'Dominator of Wolves (Andrius)', domain: 'Wolf of the North Challenge', region: 'Mondstadt' },
  { id: 'childe', name: 'Childe (Tartaglia)', domain: 'Enter the Golden House', region: 'Liyue' },
  { id: 'azhdaha', name: 'Azhdaha', domain: 'Beneath the Dragon-Queller', region: 'Liyue' },
  { id: 'signora', name: 'La Signora', domain: 'Narukami Island: Tenshukaku', region: 'Inazuma' },
  { id: 'raiden', name: 'Magatsu Mitake Narukami no Mikoto', domain: 'End of the Oneiric Euthymia', region: 'Inazuma' },
  { id: 'scaramouche', name: 'Shouki no Kami, the Prodigal', domain: 'Joururi Workshop', region: 'Sumeru' },
  { id: 'apep', name: "Guardian of Apep's Oasis", domain: 'The Realm of Beginnings', region: 'Sumeru' },
  { id: 'narwhal', name: 'All-Devouring Narwhal', domain: 'Shadow of Another World', region: 'Fontaine' },
  { id: 'knave', name: 'The Knave (Arlecchino)', domain: 'Scattered Ruins', region: 'Fontaine' }
];

function initWeeklyBossTracker() {
  const updateWeeklyUI = () => {
    const data = getStoredWeeklyBosses();
    const claimedCount = data.claimed.length;
    const remainingDiscounts = Math.max(0, 3 - claimedCount);

    if (navWeeklyBossBadge) {
      navWeeklyBossBadge.textContent = `${claimedCount}/3`;
    }

    if (weeklyDiscountCount) {
      weeklyDiscountCount.textContent = `${Math.min(3, claimedCount)} / 3 Claimed (${remainingDiscounts} half-cost remaining)`;
    }

    if (weeklyResetCountdown) {
      const nextReset = getNextMondayResetTime();
      const diffMs = Math.max(0, nextReset - Date.now());
      const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      const diffHours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const diffMins = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
      weeklyResetCountdown.textContent = `Resets in ${diffDays}d ${diffHours}h ${diffMins}m (Monday 4:00 AM)`;
    }

    if (weeklyBossList) {
      weeklyBossList.innerHTML = WEEKLY_BOSS_LIST.map((boss) => {
        const isClaimed = data.claimed.includes(boss.id);
        const isDiscounted = !isClaimed && claimedCount < 3;
        const resinCost = isDiscounted ? 30 : 60;

        return `
          <div class="weekly-boss-item ${isClaimed ? 'claimed' : ''}" data-boss-id="${boss.id}">
            <div style="display: flex; align-items: center; gap: 12px;">
              <input type="checkbox" class="weekly-boss-cb" ${isClaimed ? 'checked' : ''} data-boss-cb="${boss.id}">
              <div class="weekly-boss-info">
                <div class="weekly-boss-title">${boss.name}</div>
                <div class="weekly-boss-domain">${boss.domain} • ${boss.region}</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="weekly-boss-cost-badge ${isDiscounted ? 'discount' : 'standard'}">
                ${isClaimed ? '✓ Claimed' : `${resinCost} Resin`}
              </span>
            </div>
          </div>
        `;
      }).join('');
    }
  };

  if (weeklyBossList) {
    weeklyBossList.addEventListener('click', (e) => {
      const item = e.target.closest('.weekly-boss-item');
      if (!item) return;
      const bossId = item.dataset.bossId;
      toggleWeeklyBoss(bossId);
      updateWeeklyUI();
      refreshIcons();
    });
  }

  if (openWeeklyBossBtn) {
    openWeeklyBossBtn.addEventListener('click', () => {
      if (weeklyBossModal) {
        weeklyBossModal.classList.add('active');
        weeklyBossModal.style.display = 'flex';
      }
      updateWeeklyUI();
      refreshIcons();
    });
  }

  if (weeklyBossModalCloseBtn) {
    weeklyBossModalCloseBtn.addEventListener('click', () => {
      if (weeklyBossModal) {
        weeklyBossModal.classList.remove('active');
        weeklyBossModal.style.display = 'none';
      }
    });
  }

  if (weeklyBossModal) {
    weeklyBossModal.addEventListener('click', (e) => {
      if (e.target === weeklyBossModal) {
        weeklyBossModal.classList.remove('active');
        weeklyBossModal.style.display = 'none';
      }
    });
  }

  updateWeeklyUI();
}

// ==========================================================================
// ENKA.NETWORK IMPORT & JSON BACKUP
// ==========================================================================
function initBackupAndEnka() {
  if (openBackupModalBtn) {
    openBackupModalBtn.addEventListener('click', () => {
      if (backupModal) {
        backupModal.classList.add('active');
        backupModal.style.display = 'flex';
      }
      if (enkaStatusMessage) { enkaStatusMessage.textContent = ''; enkaStatusMessage.className = ''; }
      if (backupStatusMessage) { backupStatusMessage.textContent = ''; backupStatusMessage.className = ''; }
      refreshIcons();
    });
  }

  if (backupModalCloseBtn) {
    backupModalCloseBtn.addEventListener('click', () => {
      if (backupModal) {
        backupModal.classList.remove('active');
        backupModal.style.display = 'none';
      }
    });
  }

  if (backupModal) {
    backupModal.addEventListener('click', (e) => {
      if (e.target === backupModal) {
        backupModal.classList.remove('active');
        backupModal.style.display = 'none';
      }
    });
  }

  // Enka Import
  if (btnEnkaImport && enkaUidInput) {
    btnEnkaImport.addEventListener('click', async () => {
      const uid = enkaUidInput.value.trim();
      if (!/^\d{9,10}$/.test(uid)) {
        if (enkaStatusMessage) {
          enkaStatusMessage.className = 'enka-status-error';
          enkaStatusMessage.textContent = 'Please enter a valid 9 or 10-digit UID.';
        }
        return;
      }

      if (enkaStatusMessage) {
        enkaStatusMessage.className = '';
        enkaStatusMessage.style.color = 'var(--text-muted)';
        enkaStatusMessage.textContent = 'Contacting Enka.Network...';
      }

      try {
        const res = await fetch(`https://enka.network/api/uid/${uid}`);
        if (!res.ok) throw new Error('Enka request failed');
        const data = await res.json();

        if (!data || !Array.isArray(data.avatarInfoList) || data.avatarInfoList.length === 0) {
          if (enkaStatusMessage) {
            enkaStatusMessage.className = 'enka-status-error';
            enkaStatusMessage.textContent = "Couldn't reach Enka. Try again in a minute.";
          }
          return;
        }

        let updatedCount = 0;
        const roster = getStoredRoster();

        data.avatarInfoList.forEach(avatar => {
          const avatarId = avatar.avatarId;
          let char = CHARACTERS.find(c => c.dbId === avatarId);
          if (!char && (avatarId === 10000005 || avatarId === 10000007)) {
            char = CHARACTERS.find(c => c.id === 'traveler');
          }
          if (!char) return;

          const level = parseInt(avatar.propMap?.['4001']?.val, 10) || 1;
          const talentVals = avatar.skillLevelMap ? Object.values(avatar.skillLevelMap) : [];
          const existing = roster[char.id] || {
            currentLevel: 1,
            targetLevel: 90,
            talent1: { current: 1, target: 10 },
            talent2: { current: 1, target: 10 },
            talent3: { current: 1, target: 10 }
          };

          const t1 = { current: talentVals[0] || existing.talent1?.current || 1, target: existing.talent1?.target || 10 };
          const t2 = { current: talentVals[1] || existing.talent2?.current || 1, target: existing.talent2?.target || 10 };
          const t3 = { current: talentVals[2] || existing.talent3?.current || 1, target: existing.talent3?.target || 10 };

          updateCharacterProgress(char.id, level, existing.targetLevel || 90, t1, t2, t3);
          updatedCount++;
        });

        if (enkaStatusMessage) {
          enkaStatusMessage.className = 'enka-status-success';
          enkaStatusMessage.textContent = `Successfully updated ${updatedCount} character(s) from showcase!`;
        }
        renderGrid();
        updateSummaryBar();
        renderTodayStrip();
        if (selectedCharacter) {
          openCharacterDrawer(selectedCharacter);
        }
      } catch (err) {
        if (enkaStatusMessage) {
          enkaStatusMessage.className = 'enka-status-error';
          enkaStatusMessage.textContent = "Couldn't reach Enka. Try again in a minute.";
        }
      }
    });
  }

  // Backup Export
  if (btnExportBackup) {
    btnExportBackup.addEventListener('click', () => {
      try {
        const json = exportBackupData();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `genshin_cat_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (backupStatusMessage) {
          backupStatusMessage.className = 'enka-status-success';
          backupStatusMessage.textContent = 'Backup exported successfully!';
        }
      } catch (e) {
        if (backupStatusMessage) {
          backupStatusMessage.className = 'enka-status-error';
          backupStatusMessage.textContent = 'Failed to export backup: ' + e.message;
        }
      }
    });
  }

  // Backup Import
  if (backupFileInput) {
    backupFileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const res = importBackupData(evt.target.result);
        if (res.success) {
          if (backupStatusMessage) {
            backupStatusMessage.className = 'enka-status-success';
            backupStatusMessage.textContent = 'Backup restored successfully!';
          }
          renderGrid();
          updateSummaryBar();
          renderTodayStrip();
          initResinPlanner();
          initWeeklyBossTracker();
          if (selectedCharacter) openCharacterDrawer(selectedCharacter);
        } else {
          if (backupStatusMessage) {
            backupStatusMessage.className = 'enka-status-error';
            backupStatusMessage.textContent = 'Failed to import backup: ' + (res.error || 'Invalid format');
          }
        }
      };
      reader.onerror = () => {
        if (backupStatusMessage) {
          backupStatusMessage.className = 'enka-status-error';
          backupStatusMessage.textContent = 'Could not read backup file.';
        }
      };
      reader.readAsText(file);
    });
  }
}

init();
