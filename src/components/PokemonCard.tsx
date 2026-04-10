import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pokemon } from '@/hooks/usePokemon';
import { useTranslation } from 'react-i18next';

interface PokemonWithCount extends Pokemon {
  count?: number;
}

interface PokemonCardProps {
  pokemon: PokemonWithCount;
  quantity?: number;
  isRevealing?: boolean;
  onClick?: () => void;
  isShiny?: boolean;
}

const rarityColors: Record<string, string> = {
  common: 'bg-green-100 text-green-800 border-green-300',
  uncommon: 'bg-blue-100 text-blue-800 border-blue-300',
  rare: 'bg-purple-100 text-purple-800 border-purple-300',
  pseudo: 'bg-orange-100 text-orange-800 border-orange-300',
  starter: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  legendary: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 border-yellow-400',
  secret: 'bg-gradient-to-r from-violet-400 to-violet-600 text-white border-violet-400',
  xerelete: 'bg-gradient-to-r from-pink-400 via-rose-500 to-red-500 text-white border-pink-400'
};

export const PokemonCard = ({ pokemon, quantity, isRevealing = false, onClick, isShiny = false }: PokemonCardProps) => {
  const { t } = useTranslation('game');
  const cardClass = `card-rarity-${pokemon.rarity}`;
  
  const getRarityName = (rarity: string) => {
    return t(`rarities.${rarity}`, rarity);
  };
  
  return (
    <Card 
      className={`card-pokemon ${cardClass} p-4 cursor-pointer card-hover relative ${isRevealing ? 'animate-card-flip' : ''} ${isShiny ? 'border-4 border-yellow-400 animate-shiny-glow' : ''}`}
      onClick={onClick}
    >
      {/* Shiny Badge */}
      {isShiny && (
        <Badge className="absolute top-2 left-2 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-black font-bold border-2 border-yellow-600 shadow-lg animate-pulse z-10">
          ✨ SHINY
        </Badge>
      )}

      {/* Rarity Badge */}
      <Badge className={`absolute top-2 ${isShiny ? 'right-2' : 'right-2'} ${rarityColors[pokemon.rarity]} text-xs font-bold`}>
        {getRarityName(pokemon.rarity)}
      </Badge>

      {/* Count Badge */}
      {(quantity && quantity > 1) || (pokemon.count && pokemon.count > 1) ? (
        <Badge className={`absolute top-2 ${isShiny ? 'left-12' : 'left-2'} bg-gray-600 text-white font-bold`}>
          x{quantity || pokemon.count}
        </Badge>
      ) : null}

      {/* Pokemon Sprite */}
      <div className="flex justify-center mb-3">
        <img 
          src={pokemon.sprite} 
          alt={pokemon.name}
          className="w-24 h-24 object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Pokemon Info */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-1">#{pokemon.id.toString().padStart(3, '0')}</p>
        <h3 className="font-bold text-lg capitalize">{pokemon.name}</h3>
      </div>

      {/* Sparkle effect for rare pokemon */}
      {(pokemon.rarity === 'legendary' || pokemon.rarity === 'pseudo') && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1 left-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
          <div className="absolute top-3 right-3 w-1 h-1 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-3 left-3 w-1 h-1 bg-yellow-500 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
        </div>
      )}

      {/* Special effect for secret pokemon */}
      {pokemon.rarity === 'secret' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1 left-1 w-2 h-2 bg-violet-400 rounded-full animate-ping"></div>
          <div className="absolute top-3 right-3 w-1 h-1 bg-violet-300 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-3 left-3 w-1 h-1 bg-violet-500 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1 right-1 w-2 h-2 bg-violet-600 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
        </div>
      )}

      {/* Special effect for xerelete pokemon */}
      {pokemon.rarity === 'xerelete' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1 left-1 w-2 h-2 bg-pink-400 rounded-full animate-ping"></div>
          <div className="absolute top-3 right-3 w-1 h-1 bg-rose-300 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
          <div className="absolute bottom-3 left-3 w-1 h-1 bg-red-500 rounded-full animate-ping" style={{ animationDelay: '0.6s' }}></div>
          <div className="absolute bottom-1 right-1 w-2 h-2 bg-pink-600 rounded-full animate-ping" style={{ animationDelay: '0.9s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-rose-400 rounded-full animate-ping" style={{ animationDelay: '1.2s' }}></div>
        </div>
      )}
    </Card>
  );
};