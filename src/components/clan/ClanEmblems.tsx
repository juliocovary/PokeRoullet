import psyduckImg from '@/assets/clan-emblems/psyduck.png';
import altariaImg from '@/assets/clan-emblems/altaria.png';
import pichuImg from '@/assets/clan-emblems/pichu.png';
import tyranitarImg from '@/assets/clan-emblems/tyranitar.png';
import lucarioImg from '@/assets/clan-emblems/lucario.png';
import charizardImg from '@/assets/clan-emblems/charizard.png';
import mewImg from '@/assets/clan-emblems/mew.png';
import pokeballImg from '@/assets/clan-emblems/pokeball.png';
import mewtwoImg from '@/assets/clan-emblems/mewtwo.png';
import greninjaImg from '@/assets/clan-emblems/greninja.png';

export const CLAN_EMBLEMS = [
  { id: 'psyduck', image: psyduckImg, label: 'Psyduck' },
  { id: 'altaria', image: altariaImg, label: 'Altaria' },
  { id: 'pichu', image: pichuImg, label: 'Pichu' },
  { id: 'tyranitar', image: tyranitarImg, label: 'Tyranitar' },
  { id: 'lucario', image: lucarioImg, label: 'Lucario' },
  { id: 'charizard', image: charizardImg, label: 'Charizard' },
  { id: 'mew', image: mewImg, label: 'Mew' },
  { id: 'pokeball', image: pokeballImg, label: 'Pokéball' },
  { id: 'mewtwo', image: mewtwoImg, label: 'Mewtwo' },
  { id: 'greninja', image: greninjaImg, label: 'Greninja' },
] as const;

export const getEmblemById = (id: string) => {
  return CLAN_EMBLEMS.find(e => e.id === id) || CLAN_EMBLEMS[0];
};

interface ClanEmblemProps {
  emblemId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ClanEmblem = ({ emblemId, size = 'md', className = '' }: ClanEmblemProps) => {
  const emblem = getEmblemById(emblemId);
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center bg-muted ${className}`}>
      <img src={emblem.image} alt={emblem.label} className="w-full h-full object-cover" />
    </div>
  );
};
