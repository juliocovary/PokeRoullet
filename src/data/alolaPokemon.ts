// Alola Pokemon (Generation 7) - IDs 722-809
export interface Pokemon {
  id: number;
  name: string;
  sprite: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'starter' | 'pseudo' | 'legendary' | 'secret';
}

export const ALOLA_POKEMON: Pokemon[] = [
  // Starters
  { id: 722, name: 'rowlet', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/722.png', rarity: 'starter' },
  { id: 723, name: 'dartrix', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/723.png', rarity: 'starter' },
  { id: 724, name: 'decidueye', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/724.png', rarity: 'starter' },
  { id: 725, name: 'litten', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/725.png', rarity: 'starter' },
  { id: 726, name: 'torracat', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/726.png', rarity: 'starter' },
  { id: 727, name: 'incineroar', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/727.png', rarity: 'starter' },
  { id: 728, name: 'popplio', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/728.png', rarity: 'starter' },
  { id: 729, name: 'brionne', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/729.png', rarity: 'starter' },
  { id: 730, name: 'primarina', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/730.png', rarity: 'starter' },

  // Common
  { id: 731, name: 'pikipek', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/731.png', rarity: 'common' },
  { id: 732, name: 'trumbeak', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/732.png', rarity: 'uncommon' },
  { id: 733, name: 'toucannon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/733.png', rarity: 'rare' },
  { id: 734, name: 'yungoos', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/734.png', rarity: 'common' },
  { id: 735, name: 'gumshoos', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/735.png', rarity: 'uncommon' },
  { id: 736, name: 'grubbin', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/736.png', rarity: 'common' },
  { id: 737, name: 'charjabug', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/737.png', rarity: 'uncommon' },
  { id: 738, name: 'vikavolt', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/738.png', rarity: 'rare' },
  { id: 739, name: 'crabrawler', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/739.png', rarity: 'common' },
  { id: 740, name: 'crabominable', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/740.png', rarity: 'uncommon' },
  { id: 741, name: 'oricorio', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/741.png', rarity: 'uncommon' },
  { id: 742, name: 'cutiefly', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/742.png', rarity: 'common' },
  { id: 743, name: 'ribombee', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/743.png', rarity: 'uncommon' },
  { id: 744, name: 'rockruff', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/744.png', rarity: 'common' },
  { id: 745, name: 'lycanroc', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/745.png', rarity: 'rare' },
  { id: 746, name: 'wishiwashi', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/746.png', rarity: 'common' },
  { id: 747, name: 'mareanie', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/747.png', rarity: 'common' },
  { id: 748, name: 'toxapex', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/748.png', rarity: 'rare' },
  { id: 749, name: 'mudbray', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/749.png', rarity: 'common' },
  { id: 750, name: 'mudsdale', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/750.png', rarity: 'uncommon' },
  { id: 751, name: 'dewpider', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/751.png', rarity: 'common' },
  { id: 752, name: 'araquanid', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/752.png', rarity: 'uncommon' },
  { id: 753, name: 'fomantis', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/753.png', rarity: 'common' },
  { id: 754, name: 'lurantis', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/754.png', rarity: 'uncommon' },
  { id: 755, name: 'morelull', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/755.png', rarity: 'common' },
  { id: 756, name: 'shiinotic', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/756.png', rarity: 'uncommon' },
  { id: 757, name: 'salandit', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/757.png', rarity: 'common' },
  { id: 758, name: 'salazzle', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/758.png', rarity: 'uncommon' },
  { id: 759, name: 'stufful', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/759.png', rarity: 'common' },
  { id: 760, name: 'bewear', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/760.png', rarity: 'uncommon' },
  { id: 761, name: 'bounsweet', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/761.png', rarity: 'common' },
  { id: 762, name: 'steenee', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/762.png', rarity: 'uncommon' },
  { id: 763, name: 'tsareena', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/763.png', rarity: 'rare' },
  { id: 764, name: 'comfey', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/764.png', rarity: 'uncommon' },
  { id: 765, name: 'oranguru', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/765.png', rarity: 'uncommon' },
  { id: 766, name: 'passimian', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/766.png', rarity: 'uncommon' },
  { id: 767, name: 'wimpod', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/767.png', rarity: 'common' },
  { id: 768, name: 'golisopod', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/768.png', rarity: 'rare' },
  { id: 769, name: 'sandygast', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/769.png', rarity: 'common' },
  { id: 770, name: 'palossand', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/770.png', rarity: 'uncommon' },
  { id: 771, name: 'pyukumuku', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/771.png', rarity: 'common' },
  { id: 772, name: 'type-null', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/772.png', rarity: 'rare' },
  { id: 773, name: 'silvally', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/773.png', rarity: 'rare' },
  { id: 774, name: 'minior', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/774.png', rarity: 'uncommon' },
  { id: 775, name: 'komala', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/775.png', rarity: 'uncommon' },
  { id: 776, name: 'turtonator', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/776.png', rarity: 'rare' },
  { id: 777, name: 'togedemaru', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/777.png', rarity: 'uncommon' },
  { id: 778, name: 'mimikyu', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/778.png', rarity: 'rare' },
  { id: 779, name: 'bruxish', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/779.png', rarity: 'uncommon' },
  { id: 780, name: 'drampa', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/780.png', rarity: 'rare' },
  { id: 781, name: 'dhelmise', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/781.png', rarity: 'rare' },

  // Pseudo-legendary line
  { id: 782, name: 'jangmo-o', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/782.png', rarity: 'uncommon' },
  { id: 783, name: 'hakamo-o', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/783.png', rarity: 'rare' },
  { id: 784, name: 'kommo-o', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/784.png', rarity: 'pseudo' },

  // Tapu guardians
  { id: 785, name: 'tapu-koko', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/785.png', rarity: 'legendary' },
  { id: 786, name: 'tapu-lele', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/786.png', rarity: 'legendary' },
  { id: 787, name: 'tapu-bulu', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/787.png', rarity: 'legendary' },
  { id: 788, name: 'tapu-fini', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/788.png', rarity: 'legendary' },

  // Cosmog line
  { id: 789, name: 'cosmog', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/789.png', rarity: 'legendary' },
  { id: 790, name: 'cosmoem', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/790.png', rarity: 'legendary' },
  { id: 791, name: 'solgaleo', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/791.png', rarity: 'legendary' },
  { id: 792, name: 'lunala', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/792.png', rarity: 'legendary' },

  // Ultra Beasts
  { id: 793, name: 'nihilego', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/793.png', rarity: 'legendary' },
  { id: 794, name: 'buzzwole', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/794.png', rarity: 'legendary' },
  { id: 795, name: 'pheromosa', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/795.png', rarity: 'legendary' },
  { id: 796, name: 'xurkitree', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/796.png', rarity: 'legendary' },
  { id: 797, name: 'celesteela', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/797.png', rarity: 'legendary' },
  { id: 798, name: 'kartana', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/798.png', rarity: 'legendary' },
  { id: 799, name: 'guzzlord', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/799.png', rarity: 'legendary' },
  { id: 800, name: 'necrozma', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/800.png', rarity: 'legendary' },

  // Mythical / Secret
  { id: 801, name: 'magearna', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/801.png', rarity: 'secret' },
  { id: 802, name: 'marshadow', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/802.png', rarity: 'secret' },

  // USUM additions
  { id: 803, name: 'poipole', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/803.png', rarity: 'legendary' },
  { id: 804, name: 'naganadel', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/804.png', rarity: 'legendary' },
  { id: 805, name: 'stakataka', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/805.png', rarity: 'legendary' },
  { id: 806, name: 'blacephalon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/806.png', rarity: 'legendary' },

  // Mythical / Secret
  { id: 807, name: 'zeraora', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/807.png', rarity: 'secret' },

  // Let's Go additions (Meltan/Melmetal - sometimes considered Gen 7)
  { id: 808, name: 'meltan', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/808.png', rarity: 'secret' },
  { id: 809, name: 'melmetal', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/809.png', rarity: 'secret' },
];
