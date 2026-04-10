// Kalos Pokemon (Generation 6) - IDs 650-721
export interface Pokemon {
  id: number;
  name: string;
  sprite: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'starter' | 'pseudo' | 'legendary' | 'secret';
}

export const KALOS_POKEMON: Pokemon[] = [
  // Starters
  { id: 650, name: 'chespin', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/650.png', rarity: 'starter' },
  { id: 651, name: 'quilladin', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/651.png', rarity: 'starter' },
  { id: 652, name: 'chesnaught', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/652.png', rarity: 'starter' },
  { id: 653, name: 'fennekin', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/653.png', rarity: 'starter' },
  { id: 654, name: 'braixen', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/654.png', rarity: 'starter' },
  { id: 655, name: 'delphox', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/655.png', rarity: 'starter' },
  { id: 656, name: 'froakie', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/656.png', rarity: 'starter' },
  { id: 657, name: 'frogadier', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/657.png', rarity: 'starter' },
  { id: 658, name: 'greninja', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/658.png', rarity: 'starter' },
  
  // Common/Uncommon/Rare Pokemon
  { id: 659, name: 'bunnelby', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/659.png', rarity: 'common' },
  { id: 660, name: 'diggersby', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/660.png', rarity: 'uncommon' },
  { id: 661, name: 'fletchling', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/661.png', rarity: 'common' },
  { id: 662, name: 'fletchinder', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/662.png', rarity: 'uncommon' },
  { id: 663, name: 'talonflame', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/663.png', rarity: 'rare' },
  { id: 664, name: 'scatterbug', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/664.png', rarity: 'common' },
  { id: 665, name: 'spewpa', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/665.png', rarity: 'common' },
  { id: 666, name: 'vivillon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/666.png', rarity: 'uncommon' },
  { id: 667, name: 'litleo', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/667.png', rarity: 'common' },
  { id: 668, name: 'pyroar', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/668.png', rarity: 'uncommon' },
  { id: 669, name: 'flabebe', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/669.png', rarity: 'common' },
  { id: 670, name: 'floette', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/670.png', rarity: 'uncommon' },
  { id: 671, name: 'florges', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/671.png', rarity: 'rare' },
  { id: 672, name: 'skiddo', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/672.png', rarity: 'common' },
  { id: 673, name: 'gogoat', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/673.png', rarity: 'uncommon' },
  { id: 674, name: 'pancham', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/674.png', rarity: 'common' },
  { id: 675, name: 'pangoro', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/675.png', rarity: 'uncommon' },
  { id: 676, name: 'furfrou', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/676.png', rarity: 'uncommon' },
  { id: 677, name: 'espurr', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/677.png', rarity: 'common' },
  { id: 678, name: 'meowstic', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/678.png', rarity: 'uncommon' },
  { id: 679, name: 'honedge', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/679.png', rarity: 'common' },
  { id: 680, name: 'doublade', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/680.png', rarity: 'uncommon' },
  { id: 681, name: 'aegislash', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/681.png', rarity: 'rare' },
  { id: 682, name: 'spritzee', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/682.png', rarity: 'common' },
  { id: 683, name: 'aromatisse', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/683.png', rarity: 'uncommon' },
  { id: 684, name: 'swirlix', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/684.png', rarity: 'common' },
  { id: 685, name: 'slurpuff', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/685.png', rarity: 'uncommon' },
  { id: 686, name: 'inkay', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/686.png', rarity: 'common' },
  { id: 687, name: 'malamar', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/687.png', rarity: 'uncommon' },
  { id: 688, name: 'binacle', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/688.png', rarity: 'common' },
  { id: 689, name: 'barbaracle', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/689.png', rarity: 'uncommon' },
  { id: 690, name: 'skrelp', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/690.png', rarity: 'common' },
  { id: 691, name: 'dragalge', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/691.png', rarity: 'rare' },
  { id: 692, name: 'clauncher', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/692.png', rarity: 'common' },
  { id: 693, name: 'clawitzer', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/693.png', rarity: 'uncommon' },
  { id: 694, name: 'helioptile', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/694.png', rarity: 'common' },
  { id: 695, name: 'heliolisk', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/695.png', rarity: 'uncommon' },
  { id: 696, name: 'tyrunt', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/696.png', rarity: 'uncommon' },
  { id: 697, name: 'tyrantrum', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/697.png', rarity: 'rare' },
  { id: 698, name: 'amaura', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/698.png', rarity: 'uncommon' },
  { id: 699, name: 'aurorus', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/699.png', rarity: 'rare' },
  { id: 700, name: 'sylveon', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/700.png', rarity: 'rare' },
  { id: 701, name: 'hawlucha', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/701.png', rarity: 'uncommon' },
  { id: 702, name: 'dedenne', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/702.png', rarity: 'uncommon' },
  { id: 703, name: 'carbink', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/703.png', rarity: 'uncommon' },
  
  // Pseudo-legendary line (Goomy)
  { id: 704, name: 'goomy', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/704.png', rarity: 'common' },
  { id: 705, name: 'sliggoo', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/705.png', rarity: 'uncommon' },
  { id: 706, name: 'goodra', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/706.png', rarity: 'pseudo' },
  
  // More uncommon/common Pokemon
  { id: 707, name: 'klefki', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/707.png', rarity: 'uncommon' },
  { id: 708, name: 'phantump', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/708.png', rarity: 'common' },
  { id: 709, name: 'trevenant', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/709.png', rarity: 'uncommon' },
  { id: 710, name: 'pumpkaboo', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/710.png', rarity: 'common' },
  { id: 711, name: 'gourgeist', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/711.png', rarity: 'uncommon' },
  { id: 712, name: 'bergmite', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/712.png', rarity: 'common' },
  { id: 713, name: 'avalugg', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/713.png', rarity: 'uncommon' },
  
  // Noibat and Noivern (FIXED - was incorrectly set as xerelete)
  { id: 714, name: 'noibat', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/714.png', rarity: 'uncommon' },
  { id: 715, name: 'noivern', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/715.png', rarity: 'rare' },
  
  // Legendaries
  { id: 716, name: 'xerneas', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/716.png', rarity: 'legendary' },
  { id: 717, name: 'yveltal', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/717.png', rarity: 'legendary' },
  { id: 718, name: 'zygarde', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/718.png', rarity: 'legendary' },
  
  // Secret/Mythical Pokemon
  { id: 719, name: 'diancie', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/719.png', rarity: 'secret' },
  { id: 720, name: 'hoopa', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/720.png', rarity: 'secret' },
  { id: 721, name: 'volcanion', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/721.png', rarity: 'secret' },
];

// Evolution data for Kalos Pokemon
export const KALOS_EVOLUTIONS: Record<number, Array<{
  evolvesTo: number;
  name: string;
  cardsRequired: number;
  itemRequired?: number;
  rarity: string;
}>> = {
  // Starter evolutions
  650: [{ evolvesTo: 651, name: 'quilladin', cardsRequired: 3, rarity: 'starter' }],
  651: [{ evolvesTo: 652, name: 'chesnaught', cardsRequired: 5, rarity: 'starter' }],
  653: [{ evolvesTo: 654, name: 'braixen', cardsRequired: 3, rarity: 'starter' }],
  654: [{ evolvesTo: 655, name: 'delphox', cardsRequired: 5, rarity: 'starter' }],
  656: [{ evolvesTo: 657, name: 'frogadier', cardsRequired: 3, rarity: 'starter' }],
  657: [{ evolvesTo: 658, name: 'greninja', cardsRequired: 5, rarity: 'starter' }],
  
  // Regular evolutions
  659: [{ evolvesTo: 660, name: 'diggersby', cardsRequired: 3, rarity: 'uncommon' }],
  661: [{ evolvesTo: 662, name: 'fletchinder', cardsRequired: 3, rarity: 'uncommon' }],
  662: [{ evolvesTo: 663, name: 'talonflame', cardsRequired: 5, rarity: 'rare' }],
  664: [{ evolvesTo: 665, name: 'spewpa', cardsRequired: 2, rarity: 'common' }],
  665: [{ evolvesTo: 666, name: 'vivillon', cardsRequired: 3, rarity: 'uncommon' }],
  667: [{ evolvesTo: 668, name: 'pyroar', cardsRequired: 3, rarity: 'uncommon' }],
  669: [{ evolvesTo: 670, name: 'floette', cardsRequired: 3, rarity: 'uncommon' }],
  670: [{ evolvesTo: 671, name: 'florges', cardsRequired: 5, rarity: 'rare' }],
  672: [{ evolvesTo: 673, name: 'gogoat', cardsRequired: 3, rarity: 'uncommon' }],
  674: [{ evolvesTo: 675, name: 'pangoro', cardsRequired: 3, rarity: 'uncommon' }],
  677: [{ evolvesTo: 678, name: 'meowstic', cardsRequired: 3, rarity: 'uncommon' }],
  679: [{ evolvesTo: 680, name: 'doublade', cardsRequired: 3, rarity: 'uncommon' }],
  680: [{ evolvesTo: 681, name: 'aegislash', cardsRequired: 5, rarity: 'rare' }],
  682: [{ evolvesTo: 683, name: 'aromatisse', cardsRequired: 3, rarity: 'uncommon' }],
  684: [{ evolvesTo: 685, name: 'slurpuff', cardsRequired: 3, rarity: 'uncommon' }],
  686: [{ evolvesTo: 687, name: 'malamar', cardsRequired: 3, rarity: 'uncommon' }],
  688: [{ evolvesTo: 689, name: 'barbaracle', cardsRequired: 3, rarity: 'uncommon' }],
  690: [{ evolvesTo: 691, name: 'dragalge', cardsRequired: 5, rarity: 'rare' }],
  692: [{ evolvesTo: 693, name: 'clawitzer', cardsRequired: 3, rarity: 'uncommon' }],
  694: [{ evolvesTo: 695, name: 'heliolisk', cardsRequired: 3, rarity: 'uncommon' }],
  696: [{ evolvesTo: 697, name: 'tyrantrum', cardsRequired: 5, rarity: 'rare' }],
  698: [{ evolvesTo: 699, name: 'aurorus', cardsRequired: 5, rarity: 'rare' }],
  704: [{ evolvesTo: 705, name: 'sliggoo', cardsRequired: 3, rarity: 'uncommon' }],
  705: [{ evolvesTo: 706, name: 'goodra', cardsRequired: 7, rarity: 'pseudo' }],
  708: [{ evolvesTo: 709, name: 'trevenant', cardsRequired: 3, rarity: 'uncommon' }],
  710: [{ evolvesTo: 711, name: 'gourgeist', cardsRequired: 3, rarity: 'uncommon' }],
  712: [{ evolvesTo: 713, name: 'avalugg', cardsRequired: 3, rarity: 'uncommon' }],
  714: [{ evolvesTo: 715, name: 'noivern', cardsRequired: 5, rarity: 'rare' }],
};
