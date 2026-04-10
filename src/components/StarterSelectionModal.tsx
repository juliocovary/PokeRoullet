import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { type Pokemon } from '@/hooks/usePokemon';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface StarterSelectionModalProps {
  isOpen: boolean;
  onSelect: (starter: Pokemon) => Promise<void>;
}

interface StarterPokemon extends Pokemon {
  description: string;
}

const STARTER_POKEMON: StarterPokemon[] = [
  {
    id: 4,
    name: 'charmander',
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
    rarity: 'starter',
    description: 'O clássico starter de fogo com cauda em chamas'
  },
  {
    id: 7,
    name: 'squirtle',
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png',
    rarity: 'starter',
    description: 'O protetor aquático com defesa lendária'
  },
  {
    id: 1,
    name: 'bulbasaur',
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
    rarity: 'starter',
    description: 'O sábio erva com poder especial impressionante'
  }
];

export const StarterSelectionModal = ({ isOpen, onSelect }: StarterSelectionModalProps) => {
  const { t } = useTranslation('modals');
  const [selectedStarter, setSelectedStarter] = useState<StarterPokemon | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const handleConfirmSelection = async () => {
    if (!selectedStarter) {
      toast({
        title: t('starter.noneSelected'),
        description: t('starter.pleaseChoose'),
        variant: 'destructive',
      });
      return;
    }

    setIsSelecting(true);
    try {
      await onSelect(selectedStarter);
      toast({
        title: t('starter.chosen', { name: selectedStarter.name }),
        description: t('starter.addedToInventory'),
      });
    } catch (error) {
      toast({
        title: t('starter.error'),
        description: t('starter.errorDescription'),
        variant: 'destructive',
      });
    }
    setIsSelecting(false);
  };

  const getPokedexNumber = (pokemon: Pokemon) => {
    return `#${pokemon.id.toString().padStart(3, '0')}`;
  };

  const getTypeInfo = (name: string) => {
    const types = {
      charmander: { typeId: 10, color: 'from-red-400 to-orange-500' },
      squirtle: { typeId: 11, color: 'from-blue-400 to-cyan-500' },
      bulbasaur: { typeId: 12, color: 'from-green-400 to-emerald-500' }
    };
    return types[name as keyof typeof types] || { typeId: 1, color: 'from-gray-400 to-gray-500' };
  };

  const getTypeSprite = (typeId: number) => {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/${typeId}.png`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-slate-700/50 shadow-2xl p-4 sm:p-6 flex flex-col">
        <DialogHeader className="relative z-10 pb-2 sm:pb-3 border-b border-slate-700/30">
          <div className="text-center space-y-1">
            <DialogTitle className="text-lg sm:text-xl font-semibold text-slate-200">
              {t('starter.title')}
            </DialogTitle>
            <p className="text-xs text-slate-400">
              {t('starter.subtitle')}
            </p>
          </div>
        </DialogHeader>

        <div className="relative z-10 my-3 sm:my-4 max-h-[calc(90vh-280px)] overflow-y-auto md:overflow-hidden">
          {/* Grid de Starters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 px-1">
            {STARTER_POKEMON.map((pokemon) => {
              const typeInfo = getTypeInfo(pokemon.name);
              const isSelected = selectedStarter?.id === pokemon.id;
              
              return (
                <div
                  key={pokemon.id}
                  className="relative group"
                >
                  {/* Glow effect on selection */}
                  {isSelected && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse"></div>
                  )}
                  
                  <Card
                    className={`relative cursor-pointer transition-all duration-300 overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-2 backdrop-blur-sm ${
                      isSelected 
                        ? 'border-yellow-400/80 shadow-xl ring-2 ring-yellow-400/40' 
                        : 'border-slate-700/50 hover:border-slate-600/80'
                    } hover:shadow-lg group-hover:scale-102 transform`}
                    onClick={() => setSelectedStarter(pokemon)}
                  >
                    {/* Top accent bar */}
                    <div className={`h-1 bg-gradient-to-r ${typeInfo.color}`}></div>
                    
                    <div className="p-4 sm:p-5 text-center space-y-3">
                      {/* Pokémon Image Container */}
                      <div className="relative inline-block w-full">
                        <div className={`w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mx-auto rounded-2xl bg-gradient-to-br ${typeInfo.color} p-4 sm:p-5 shadow-xl relative overflow-hidden group-hover:scale-110 transition duration-300`}>
                          <div className="absolute inset-0 opacity-20">
                            <div className="absolute top-0 right-0 w-12 h-12 bg-white rounded-full blur-2xl"></div>
                          </div>
                          
                          <img
                            src={pokemon.sprite}
                            alt={pokemon.name}
                            className="w-full h-full object-contain filter drop-shadow-lg relative z-10"
                          />
                        </div>
                        
                        {/* Pokédex Number Badge */}
                        <div className="absolute -top-3 -right-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full w-11 h-11 sm:w-13 sm:h-13 flex items-center justify-center shadow-lg border-2 border-white">
                          <p className="text-xs sm:text-sm font-bold text-gray-900">
                            {getPokedexNumber(pokemon).replace('#', '')}
                          </p>
                        </div>
                      </div>

                      {/* Pokémon Info */}
                      <div className="space-y-2">
                        <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent capitalize drop-shadow-lg">
                          {pokemon.name}
                        </h3>
                        
                        {/* Type Badge */}
                        <div className="flex items-center justify-center gap-1">
                          <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${typeInfo.color} text-white text-xs font-bold shadow-lg`}>
                            {pokemon.name === 'charmander' && 'Fogo'}
                            {pokemon.name === 'squirtle' && 'Água'}
                            {pokemon.name === 'bulbasaur' && 'Grama'}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-300 italic min-h-6 line-clamp-2">
                          {pokemon.description}
                        </p>
                      </div>

                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="pt-2 space-y-2">
                          <div className="flex items-center justify-center gap-1.5 text-yellow-300 animate-bounce text-sm">
                            <span>⭐</span>
                            <span className="font-bold uppercase text-xs">{t('starter.selected')}</span>
                            <span>⭐</span>
                          </div>
                          <div className="h-0.5 w-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-full animate-pulse"></div>
                        </div>
                      )}

                      {/* Selection Button */}
                      <Button
                        className={`w-full mt-3 font-bold text-xs sm:text-sm transition-all duration-300 uppercase tracking-wide h-10 ${
                          isSelected 
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 shadow-lg hover:shadow-xl scale-100 hover:scale-102' 
                            : 'bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white border border-slate-600/50'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStarter(pokemon);
                        }}
                      >
                        {isSelected ? '✓ ' + t('starter.chosen') : '○ ' + t('starter.choose')}
                      </Button>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Confirm Button Section */}
        <div className="relative z-10 border-t border-slate-700/30 pt-3 sm:pt-4 px-1">
          <div className="space-y-2">
            <Button
              onClick={handleConfirmSelection}
              disabled={!selectedStarter || isSelecting}
              className={`w-full btn-casino py-2.5 sm:py-3 text-sm sm:text-base font-bold uppercase tracking-widest transition-all duration-300 h-10 sm:h-11 ${
                selectedStarter && !isSelecting
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl scale-100 hover:scale-102'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              {isSelecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  {t('starter.confirming')}
                </>
              ) : selectedStarter ? (
                `🎮 Escolher ${selectedStarter.name.toUpperCase()}`
              ) : (
                t('starter.confirmButton', { name: t('starter.selection') })
              )}
            </Button>
            
            <p className="text-center text-xs text-slate-400/70 italic">
              {t('starter.hint')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};