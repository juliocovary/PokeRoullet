export type RegionId =
  | 'kanto'
  | 'johto'
  | 'hoenn'
  | 'sinnoh'
  | 'unova'
  | 'kalos'
  | 'alola'
  | 'galar'
  | 'hisui'
  | 'paldea';

export type RegionRequirement =
  | {
      type: 'pokedex_completion';
      region: RegionId;
      percentage: number;
    }
  | {
      type: 'purchase';
      price: number;
      prerequisite: RegionId;
    };

export interface RegionPackConfig {
  id: RegionId;
  name: string;
  starterPreview: number[];
  glowColor: string;
  requirement?: RegionRequirement;
  isEnabled: boolean;
  dexRange?: [number, number];
}

export const REGION_PACKS: RegionPackConfig[] = [
  {
    id: 'kanto',
    name: 'Kanto',
    starterPreview: [1, 4, 7],
    glowColor: 'rgba(251, 113, 133, 0.5)',
    isEnabled: true,
    dexRange: [1, 151],
  },
  {
    id: 'johto',
    name: 'Johto',
    starterPreview: [152, 155, 158],
    glowColor: 'rgba(56, 189, 248, 0.5)',
    requirement: {
      type: 'pokedex_completion',
      region: 'kanto',
      percentage: 50,
    },
    isEnabled: true,
    dexRange: [152, 251],
  },
  {
    id: 'hoenn',
    name: 'Hoenn',
    starterPreview: [252, 255, 258],
    glowColor: 'rgba(52, 211, 153, 0.5)',
    requirement: {
      type: 'pokedex_completion',
      region: 'johto',
      percentage: 50,
    },
    isEnabled: true,
    dexRange: [252, 386],
  },
  {
    id: 'sinnoh',
    name: 'Sinnoh',
    starterPreview: [387, 390, 393],
    glowColor: 'rgba(167, 139, 250, 0.5)',
    requirement: {
      type: 'pokedex_completion',
      region: 'hoenn',
      percentage: 50,
    },
    isEnabled: true,
    dexRange: [387, 493],
  },
  {
    id: 'unova',
    name: 'Unova',
    starterPreview: [495, 498, 501],
    glowColor: 'rgba(148, 163, 184, 0.4)',
    requirement: {
      type: 'purchase',
      price: 500,
      prerequisite: 'sinnoh',
    },
    isEnabled: true,
    dexRange: [494, 649],
  },
  {
    id: 'kalos',
    name: 'Kalos',
    starterPreview: [650, 653, 656],
    glowColor: 'rgba(244, 114, 182, 0.5)',
    requirement: {
      type: 'purchase',
      price: 600,
      prerequisite: 'unova',
    },
    isEnabled: true,
    dexRange: [650, 721],
  },
  {
    id: 'alola',
    name: 'Alola',
    starterPreview: [722, 725, 728],
    glowColor: 'rgba(45, 212, 191, 0.5)',
    requirement: {
      type: 'purchase',
      price: 700,
      prerequisite: 'kalos',
    },
    isEnabled: true,
    dexRange: [722, 809],
  },
  {
    id: 'galar',
    name: 'Galar',
    starterPreview: [810, 813, 816],
    glowColor: 'rgba(96, 165, 250, 0.45)',
    requirement: {
      type: 'purchase',
      price: 800,
      prerequisite: 'alola',
    },
    isEnabled: false,
    dexRange: [810, 905],
  },
  {
    id: 'hisui',
    name: 'Hisui',
    starterPreview: [152, 501, 722],
    glowColor: 'rgba(148, 163, 184, 0.45)',
    requirement: {
      type: 'purchase',
      price: 900,
      prerequisite: 'galar',
    },
    isEnabled: false,
  },
  {
    id: 'paldea',
    name: 'Paldea',
    starterPreview: [906, 909, 912],
    glowColor: 'rgba(34, 197, 94, 0.45)',
    requirement: {
      type: 'purchase',
      price: 1000,
      prerequisite: 'hisui',
    },
    isEnabled: false,
    dexRange: [906, 1025],
  },
];

export const ACTIVE_REGION_PACKS = REGION_PACKS.filter((region) => region.isEnabled);

export const getRegionPackConfig = (regionId: string): RegionPackConfig | undefined => {
  return REGION_PACKS.find((region) => region.id === regionId);
};

export const getRegionGlowColor = (regionId: string): string => {
  return getRegionPackConfig(regionId)?.glowColor ?? REGION_PACKS[0].glowColor;
};

export const getStarterPreview = (regionId: string): number[] => {
  return getRegionPackConfig(regionId)?.starterPreview ?? REGION_PACKS[0].starterPreview;
};

export const getRegionName = (regionId: string): string => {
  return getRegionPackConfig(regionId)?.name ?? regionId;
};

export const getRegionNameByPokemonId = (pokemonId: number): string => {
  const match = REGION_PACKS.find((region) => {
    if (!region.dexRange) return false;
    return pokemonId >= region.dexRange[0] && pokemonId <= region.dexRange[1];
  });

  return match?.name ?? 'Unknown';
};
