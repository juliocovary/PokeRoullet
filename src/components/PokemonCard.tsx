import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pokemon } from '@/hooks/usePokemon';

interface PokemonWithCount extends Pokemon {
  count?: number;
}

interface PokemonCardProps {
  pokemon: PokemonWithCount;
  quantity?: number;
  isRevealing?: boolean;
  onClick?: () => void;
}

const rarityColors = {
  common: 'bg-green-100 text-green-800 border-green-300',
  uncommon: 'bg-blue-100 text-blue-800 border-blue-300',
  rare: 'bg-purple-100 text-purple-800 border-purple-300',
  pseudo: 'bg-orange-100 text-orange-800 border-orange-300',
  starter: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  legendary: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 border-yellow-400',
  secret: 'bg-gradient-to-r from-violet-400 to-violet-600 text-white border-violet-400'
};

const rarityNames = {
  common: 'Comum',
  uncommon: 'Incomum', 
  rare: 'Raro',
  pseudo: 'Pseudo-Lendário',
  starter: 'Inicial',
  legendary: 'Lendário',
  secret: 'Secreto'
};

export const PokemonCard = ({ pokemon, quantity, isRevealing = false, onClick }: PokemonCardProps) => {
  const cardClass = `card-rarity-${pokemon.rarity}`;
  
  return (
    <Card 
      className={`card-pokemon ${cardClass} p-4 cursor-pointer card-hover relative ${isRevealing ? 'animate-card-flip' : ''}`}
      onClick={onClick}
    >
      {/* Rarity Badge */}
      <Badge className={`absolute top-2 right-2 ${rarityColors[pokemon.rarity]} text-xs font-bold`}>
        {rarityNames[pokemon.rarity]}
      </Badge>

      {/* Count Badge */}
      {(quantity && quantity > 1) || (pokemon.count && pokemon.count > 1) ? (
        <Badge className="absolute top-2 left-2 bg-gray-600 text-white font-bold">
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
    </Card>
  );
};