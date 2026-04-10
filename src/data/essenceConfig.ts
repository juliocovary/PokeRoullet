// Essence Configuration for Trainer Mode
import type { PokemonType } from './typeAdvantages';
import statusUpgradeIcon from '@/assets/status-upgrade.png';

// Mapping of Pokemon types to essence item IDs
export const ESSENCE_ITEM_IDS: Record<PokemonType, number> = {
  fire: 110,
  water: 111,
  grass: 112,
  electric: 113,
  ice: 114,
  fighting: 115,
  poison: 116,
  ground: 117,
  flying: 118,
  psychic: 119,
  bug: 120,
  rock: 121,
  ghost: 122,
  dragon: 123,
  dark: 124,
  steel: 125,
  fairy: 126,
  normal: 127,
};

// Special item IDs
export const ESSENCE_BOX_ITEM_ID = 101;
export const STATUS_UPGRADE_ITEM_ID = 100;

// Badge item IDs
export const BADGE_ITEM_IDS = {
  xp: 200,       // Insígnia XP - Boss fase 10
  luck: 201,     // Insígnia da Sorte - Boss fase 20
  shiny: 202,    // Insígnia Shiny - Boss fase 30
  secret: 203,   // Insígnia Secreta - Boss fase 40
};

// Essence box reward configuration
export const ESSENCE_BOX_REWARD = {
  minEssences: 40,
  maxEssences: 70,
};

// Drop configuration for items
export const ITEM_DROP_CONFIG = {
  statusUpgrade: {
    normal: { chance: 0.01 },      // 1%
    challenger: { chance: 0.02 },   // 2%
    miniBoss: { chance: 0.07 },     // 7%
    boss: { chance: 0.10 },         // 10%
  },
  essenceBox: {
    normal: { chance: 0.02 },       // 2%
    challenger: { chance: 0.04 },   // 4%
    miniBoss: { chance: 0.10 },     // 10%
    boss: { chance: 0.15 },         // 15%
  },
  badges: {
    xp: { stage: 10, chance: 0.02 },      // 2% no boss da fase 10
    luck: { stage: 20, chance: 0.02 },    // 2% no boss da fase 20
    shiny: { stage: 30, chance: 0.02 },   // 2% no boss da fase 30
    secret: { stage: 40, chance: 0.02 },  // 2% no boss da fase 40
  },
};

// Item drop interface
export interface ItemDrop {
  itemId: number;
  name: string;
  iconUrl: string;
  quantity: number;
  type: 'status_upgrade' | 'essence_box' | 'badge';
}

// Get badge icon URL
const getBadgeIcon = (badgeType: string): string => {
  const badgeIcons: Record<string, string> = {
    xp: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges/1.png',      // Boulder Badge
    luck: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges/2.png',    // Cascade Badge
    shiny: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges/3.png',   // Thunder Badge
    secret: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges/4.png',  // Rainbow Badge
  };
  return badgeIcons[badgeType] || badgeIcons.xp;
};

// Badge name mapping
const getBadgeName = (badgeType: string): string => {
  const badgeNames: Record<string, string> = {
    xp: 'XP Badge',
    luck: 'Luck Badge',
    shiny: 'Shiny Badge',
    secret: 'Secret Badge',
  };
  return badgeNames[badgeType] || 'Badge';
};

// Calculate item drops from defeating an enemy
export const calculateItemDrops = (
  isBoss: boolean,
  isMiniBoss: boolean,
  isChallenger: boolean,
  currentStage: number
): ItemDrop[] => {
  const drops: ItemDrop[] = [];
  
  // Determine tier of enemy
  const tier = isBoss ? 'boss' : isMiniBoss ? 'miniBoss' : isChallenger ? 'challenger' : 'normal';
  
  // Status Upgrade drop
  const statusChance = ITEM_DROP_CONFIG.statusUpgrade[tier]?.chance || 0;
  if (Math.random() < statusChance) {
    drops.push({
      itemId: STATUS_UPGRADE_ITEM_ID,
      name: 'Status Upgrade',
      iconUrl: statusUpgradeIcon,
      quantity: 1,
      type: 'status_upgrade',
    });
  }
  
  // Essence Box drop
  const essenceChance = ITEM_DROP_CONFIG.essenceBox[tier]?.chance || 0;
  if (Math.random() < essenceChance) {
    drops.push({
      itemId: ESSENCE_BOX_ITEM_ID,
      name: 'Essence Box',
      iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/moon-ball.png',
      quantity: 1,
      type: 'essence_box',
    });
  }
  
  // Badges - only from bosses at specific stages
  if (isBoss) {
    const badgeConfig = Object.entries(ITEM_DROP_CONFIG.badges).find(
      ([_, config]) => config.stage === currentStage
    );
    
    if (badgeConfig) {
      const [badgeType, config] = badgeConfig;
      if (Math.random() < config.chance) {
        drops.push({
          itemId: BADGE_ITEM_IDS[badgeType as keyof typeof BADGE_ITEM_IDS],
          name: getBadgeName(badgeType),
          iconUrl: getBadgeIcon(badgeType),
          quantity: 1,
          type: 'badge',
        });
      }
    }
  }
  
  return drops;
};

// Get essence name by type
export const getEssenceName = (type: PokemonType): string => {
  const typeNames: Record<PokemonType, string> = {
    fire: 'Fire Essence',
    water: 'Water Essence',
    grass: 'Grass Essence',
    electric: 'Electric Essence',
    ice: 'Ice Essence',
    fighting: 'Fighting Essence',
    poison: 'Poison Essence',
    ground: 'Ground Essence',
    flying: 'Flying Essence',
    psychic: 'Psychic Essence',
    bug: 'Bug Essence',
    rock: 'Rock Essence',
    ghost: 'Ghost Essence',
    dragon: 'Dragon Essence',
    dark: 'Dark Essence',
    steel: 'Steel Essence',
    fairy: 'Fairy Essence',
    normal: 'Normal Essence',
  };
  return typeNames[type];
};

// Get type from essence item ID
export const getTypeFromEssenceId = (itemId: number): PokemonType | null => {
  for (const [type, id] of Object.entries(ESSENCE_ITEM_IDS)) {
    if (id === itemId) return type as PokemonType;
  }
  return null;
};

// Open essence box - returns random type and quantity
export const rollEssenceBoxReward = (): { type: PokemonType; amount: number } => {
  const allTypes: PokemonType[] = [
    'fire', 'water', 'grass', 'electric', 'ice', 'fighting',
    'poison', 'ground', 'flying', 'psychic', 'bug', 'rock',
    'ghost', 'dragon', 'dark', 'steel', 'fairy', 'normal',
  ];
  
  const randomType = allTypes[Math.floor(Math.random() * allTypes.length)];
  const amount = Math.floor(
    Math.random() * (ESSENCE_BOX_REWARD.maxEssences - ESSENCE_BOX_REWARD.minEssences + 1)
  ) + ESSENCE_BOX_REWARD.minEssences;
  
  return { type: randomType, amount };
};
