import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePokemon } from '@/hooks/usePokemon';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface PokedexCardProps {
  pokemonId: number;
  isPlaced: boolean;
  ownedQuantity: number;
  ownedShinyQuantity: number;
  onPlaceCard: (pokemonId: number, pokemonName: string, isShiny: boolean) => Promise<void>;
  isShiny?: boolean;
  onViewDetail?: (pokemonId: number) => void;
}

export const PokedexCard = ({
  pokemonId,
  isPlaced,
  ownedQuantity,
  ownedShinyQuantity,
  onPlaceCard,
  isShiny = false,
  onViewDetail
}: PokedexCardProps) => {
  const { t } = useTranslation('modals');
  const { GEN1_POKEMON } = usePokemon();
  const isMobile = useIsMobile();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const pokemon = GEN1_POKEMON.find(p => p.id === pokemonId);
  if (!pokemon) return null;
  
  const pokemonSprite = isShiny 
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.id}.png`
    : pokemon.sprite;
  
  const handlePlaceNormalCard = async () => {
    if (ownedQuantity > 0) {
      await onPlaceCard(pokemon.id, pokemon.name, false);
      setIsPopoverOpen(false);
    }
  };
  
  const handlePlaceShinyCard = async () => {
    if (ownedShinyQuantity > 0) {
      await onPlaceCard(pokemon.id, pokemon.name, true);
      setIsPopoverOpen(false);
    }
  };

  const handleShinyButtonClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await handlePlaceShinyCard();
  };

  // Allow placing normal card only if not placed yet
  const canPlaceNormal = ownedQuantity > 0 && !isPlaced;
  // Allow placing shiny card if: has shiny AND (not placed OR placed with normal card)
  const canPlaceShiny = ownedShinyQuantity > 0 && !isShiny;
  const canPlace = canPlaceNormal || canPlaceShiny;

  // Handle card click for placed cards
  const handleCardClick = (e: React.MouseEvent) => {
    if (isPlaced && onViewDetail) {
      e.preventDefault();
      e.stopPropagation();
      onViewDetail(pokemonId);
    }
  };

  // Mobile compact version
  if (isMobile) {
    // If card is placed, clicking opens detail modal instead of popover
    if (isPlaced && onViewDetail) {
      return (
        <Card 
          onClick={handleCardClick}
          className={`relative transition-all duration-200 active:scale-95 cursor-pointer overflow-visible bg-gradient-to-br from-pokemon-gold/20 via-card to-pokemon-yellow/20 border-pokemon-gold shadow-md shadow-pokemon-gold/20 ${isShiny ? 'ring-1 ring-yellow-400' : ''}`}
        >
          <CardContent className="p-2 text-center">
            {/* Pokemon Number */}
            <div className="text-[9px] font-bold text-pokemon-gold">
              #{pokemon.id.toString().padStart(3, '0')}
            </div>

            {/* Pokemon Image */}
            <div className="relative w-14 h-14 mx-auto">
              <div className="w-full h-full rounded-full border-2 border-pokemon-gold bg-gradient-to-br from-pokemon-gold/10 to-pokemon-yellow/10 flex items-center justify-center">
                <img 
                  src={pokemonSprite} 
                  alt={pokemon.name} 
                  className="w-11 h-11 object-contain" 
                />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-gradient-to-r from-pokemon-gold to-pokemon-yellow rounded-full flex items-center justify-center">
                <span className="text-[7px] font-bold text-lime-600">✓</span>
              </div>
              {isShiny && (
                <div className="absolute -top-0.5 -left-0.5 w-3.5 h-3.5 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-[7px]">✨</span>
                </div>
              )}
            </div>

            {/* Pokemon Name */}
            <div className="text-[8px] font-bold truncate mt-1 text-foreground">
              {pokemon.name}
            </div>

            {/* Always show shiny paste button (disabled if none / already shiny placed) */}
            <div className="mt-2">
              <Button
                size="sm"
                disabled={!canPlaceShiny}
                onClick={handleShinyButtonClick}
                className={`w-full text-[10px] font-bold py-1 h-7 ${
                  canPlaceShiny
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black'
                    : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                }`}
              >
                {t('pokedex.placeShiny')} ✨ ({ownedShinyQuantity})
              </Button>
            </div>

          </CardContent>
        </Card>
      );
    }

    return (
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Card 
            className={`relative transition-all duration-200 active:scale-95 cursor-pointer overflow-visible ${
              isPlaced 
                ? 'bg-gradient-to-br from-pokemon-gold/20 via-card to-pokemon-yellow/20 border-pokemon-gold shadow-md shadow-pokemon-gold/20' 
                : canPlace 
                  ? 'bg-gradient-to-br from-emerald-900/30 to-card border-emerald-500/70 shadow-md shadow-emerald-500/20' 
                  : 'bg-gradient-to-br from-muted/50 to-card border-border'
            } ${isShiny ? 'ring-1 ring-yellow-400' : ''} ${canPlace ? 'animate-pulse-subtle' : ''}`}
          >
            {/* Green dot indicator for placeable cards */}
            {canPlace && (
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 w-3 h-3 bg-emerald-500 rounded-full shadow-lg" />
            )}
            
            {/* Shiny available indicator */}
            {canPlaceShiny && !isPlaced && (
              <div className="absolute -top-1 -right-1 z-10 w-4 h-4 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <span className="text-[8px]">✨</span>
              </div>
            )}
            
            <CardContent className="p-2 text-center">
              {/* Pokemon Number */}
              <div className={`text-[9px] font-bold ${isPlaced ? 'text-pokemon-gold' : canPlace ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                #{pokemon.id.toString().padStart(3, '0')}
              </div>

              {/* Pokemon Image */}
              <div className="relative w-14 h-14 mx-auto">
                <div className={`w-full h-full rounded-full border-2 ${
                  isPlaced 
                    ? 'border-pokemon-gold bg-gradient-to-br from-pokemon-gold/10 to-pokemon-yellow/10' 
                    : canPlace
                      ? 'border-emerald-500 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10'
                      : 'border-border bg-muted/30'
                } flex items-center justify-center`}>
                  <img 
                    src={pokemonSprite} 
                    alt={isPlaced ? pokemon.name : '???'} 
                    className={`w-11 h-11 object-contain ${!isPlaced ? 'filter brightness-0 contrast-200' : ''}`} 
                  />
                </div>
                {isPlaced && (
                  <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-gradient-to-r from-pokemon-gold to-pokemon-yellow rounded-full flex items-center justify-center">
                    <span className="text-[7px] font-bold text-lime-600">✓</span>
                  </div>
                )}
                {isShiny && isPlaced && (
                  <div className="absolute -top-0.5 -left-0.5 w-3.5 h-3.5 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-[7px]">✨</span>
                  </div>
                )}
              </div>

              {/* Pokemon Name */}
              <div className={`text-[8px] font-bold truncate mt-1 ${isPlaced ? 'text-foreground' : canPlace ? 'text-emerald-300' : 'text-muted-foreground'}`}>
                {isPlaced ? pokemon.name : '???'}
              </div>

              {/* Quantity indicators - More prominent */}
              <div className="flex justify-center gap-1.5 mt-0.5">
                {ownedQuantity > 0 && (
                  <span className={`text-[8px] font-bold px-1 rounded ${canPlaceNormal ? 'bg-emerald-500/30 text-emerald-300' : 'text-emerald-500'}`}>
                    {ownedQuantity}x
                  </span>
                )}
                {ownedShinyQuantity > 0 && (
                  <span className={`text-[8px] font-bold px-1 rounded ${canPlaceShiny ? 'bg-yellow-500/30 text-yellow-300' : 'text-yellow-500'}`}>
                    ✨{ownedShinyQuantity}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </PopoverTrigger>
        
        {/* Popover for placing options */}
        <PopoverContent className="w-40 p-2 bg-gray-900 border-gray-700" side="top" align="center">
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-center text-white mb-2 truncate">
              {pokemon.name}
            </div>
            <Button 
              size="sm" 
              disabled={!canPlaceNormal} 
              onClick={handlePlaceNormalCard} 
              className={`w-full text-[10px] font-bold py-1 h-7 ${
                canPlaceNormal 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
              }`}
            >
              {t('pokedex.placeNormal')} ({ownedQuantity})
            </Button>
            
            <Button 
              size="sm" 
              disabled={!canPlaceShiny}
              onClick={handlePlaceShinyCard} 
              className={`w-full text-[10px] font-bold py-1 h-7 ${
                canPlaceShiny 
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
              }`}
            >
              {t('pokedex.placeShiny')} ✨ ({ownedShinyQuantity})
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Desktop version (original layout)
  // If card is placed, clicking opens detail modal
  if (isPlaced && onViewDetail) {
    return (
      <Card 
        onClick={handleCardClick}
        className={`relative transition-all duration-300 hover:scale-105 cursor-pointer bg-gradient-to-br from-pokemon-gold/20 via-card to-pokemon-yellow/20 border-pokemon-gold shadow-lg shadow-pokemon-gold/30 ${isShiny ? 'ring-2 ring-yellow-400' : ''}`}
      >
        <CardContent className="p-4 text-center">
          {/* Pokemon Number */}
          <div className="text-xs font-bold mb-2 text-pokemon-gold">
            #{pokemon.id.toString().padStart(3, '0')}
          </div>

          {/* Pokemon Image */}
          <div className="relative w-24 h-24 mx-auto mb-3">
            <div className="w-full h-full rounded-full border-2 border-pokemon-gold bg-gradient-to-br from-pokemon-gold/10 to-pokemon-yellow/10 flex items-center justify-center">
              <img src={pokemonSprite} alt={pokemon.name} className="w-20 h-20 object-contain filter drop-shadow-sm" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-pokemon-gold to-pokemon-yellow rounded-full flex items-center justify-center shadow-lg">
              <span className="text-xs font-bold text-lime-600">✓</span>
            </div>
            {isShiny && (
              <div className="absolute -top-1 -left-1 w-6 h-6 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-xs">✨</span>
              </div>
            )}
          </div>

          {/* Pokemon Name */}
          <div className="text-sm font-bold mb-4 h-5 truncate text-foreground">
            {pokemon.name}
          </div>

          {/* Always show shiny paste button (disabled if none / already shiny placed) */}
          <Button
            size="sm"
            disabled={!canPlaceShiny}
            onClick={handleShinyButtonClick}
            className={`w-full text-xs font-bold py-2 h-auto transition-all duration-300 ${
              canPlaceShiny
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black shadow-lg hover:shadow-xl hover:scale-105'
                : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
            }`}
          >
            {t('pokedex.placeShiny')} ✨ ({ownedShinyQuantity})
          </Button>

        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`relative transition-all duration-300 hover:scale-105 ${isPlaced ? 'bg-gradient-to-br from-pokemon-gold/20 via-card to-pokemon-yellow/20 border-pokemon-gold shadow-lg shadow-pokemon-gold/30' : 'bg-gradient-to-br from-muted/50 to-card border-border shadow-sm hover:shadow-md'} ${isShiny ? 'ring-2 ring-yellow-400' : ''}`}>
      <CardContent className="p-4 text-center">
        {/* Pokemon Number */}
        <div className={`text-xs font-bold mb-2 ${isPlaced ? 'text-pokemon-gold' : 'text-muted-foreground'}`}>
          #{pokemon.id.toString().padStart(3, '0')}
        </div>

        {/* Pokemon Image */}
        <div className="relative w-24 h-24 mx-auto mb-3">
          <div className={`w-full h-full rounded-full border-2 ${isPlaced ? 'border-pokemon-gold bg-gradient-to-br from-pokemon-gold/10 to-pokemon-yellow/10' : 'border-border bg-muted/30'} flex items-center justify-center`}>
            <img src={pokemonSprite} alt={isPlaced ? pokemon.name : '???'} className={`w-20 h-20 object-contain transition-all duration-300 ${!isPlaced ? 'filter brightness-0 contrast-200' : 'filter drop-shadow-sm'}`} />
          </div>
          {isPlaced && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-pokemon-gold to-pokemon-yellow rounded-full flex items-center justify-center shadow-lg">
              <span className="text-xs font-bold text-lime-600">✓</span>
            </div>
          )}
          {isShiny && isPlaced && (
            <div className="absolute -top-1 -left-1 w-6 h-6 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-xs">✨</span>
            </div>
          )}
        </div>

        {/* Pokemon Name */}
        <div className={`text-sm font-bold mb-4 h-5 truncate ${isPlaced ? 'text-foreground' : 'text-muted-foreground'}`}>
          {isPlaced ? pokemon.name : '?????'}
        </div>

        {/* Place Card Buttons */}
        <div className="space-y-2">
          <Button 
            size="sm" 
            disabled={ownedQuantity === 0 || isPlaced} 
            onClick={handlePlaceNormalCard} 
            className={`w-full text-xs font-bold py-2 h-auto transition-all duration-300 ${(ownedQuantity > 0 && !isPlaced) ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:scale-105' : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'}`}
          >
            {t('pokedex.placeNormal')}
          </Button>
          
          <Button 
            size="sm" 
            disabled={!canPlaceShiny}
            onClick={handlePlaceShinyCard} 
            className={`w-full text-xs font-bold py-2 h-auto transition-all duration-300 ${canPlaceShiny ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black shadow-lg hover:shadow-xl hover:scale-105' : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'}`}
          >
            {t('pokedex.placeShiny')}
          </Button>
          
          {/* Owned Quantity */}
          <div className="text-xs font-medium space-y-1">
            <div className={`${ownedQuantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
              {t('pokedex.normal')}: <span className="font-bold">{ownedQuantity}</span>
            </div>
            {ownedShinyQuantity > 0 && (
              <div className="text-yellow-600 dark:text-yellow-400">
                {t('pokedex.shiny')}: <span className="font-bold">{ownedShinyQuantity} ✨</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
