import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, X, Sparkles, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getPetDamageMultiplier } from '@/data/trainerPokemonPool';
import { useEffect } from 'react';

interface PetData {
  pet_pokemon_id?: number;
  pet_pokemon_name?: string;
  pet_rarity?: string;
  pet_is_shiny?: boolean;
}

interface CollectorCard {
  pokemon_id: number;
  pokemon_name: string;
  rarity: string;
  is_shiny: boolean;
  quantity: number;
}

interface PetSlotProps {
  petData: PetData;
  onSetPet: (pokemonId: number, pokemonName: string, rarity: string, isShiny: boolean) => Promise<boolean>;
  onRemovePet: () => Promise<boolean>;
}

const RARITY_COLORS: Record<string, string> = {
  common: 'from-gray-400 to-gray-600',
  uncommon: 'from-green-400 to-green-600',
  rare: 'from-blue-400 to-blue-600',
  starter: 'from-amber-400 to-orange-500',
  pseudo: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-amber-500',
  secret: 'from-pink-400 to-rose-500',
};

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'starter', 'pseudo', 'legendary', 'secret'];

const PetSlot = ({ petData, onSetPet, onRemovePet }: PetSlotProps) => {
  const { t } = useTranslation('trainer');
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [showSelector, setShowSelector] = useState(false);
  const [collectorCards, setCollectorCards] = useState<CollectorCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  const hasPet = !!petData.pet_pokemon_id;
  const multiplier = hasPet ? getPetDamageMultiplier(petData.pet_rarity || 'common', petData.pet_is_shiny || false) : 1;

  const fetchCollectorCards = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pokemon_inventory')
        .select('pokemon_id, pokemon_name, rarity, is_shiny, quantity')
        .eq('user_id', user.id)
        .gt('quantity', 0);

      if (error) throw error;
      setCollectorCards((data || []) as CollectorCard[]);
    } catch (e) {
      console.error('Error fetching collector cards:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (showSelector) {
      fetchCollectorCards();
    }
  }, [showSelector]);

  const handleSelectPet = async (card: CollectorCard) => {
    const success = await onSetPet(card.pokemon_id, card.pokemon_name, card.rarity, card.is_shiny);
    if (success) setShowSelector(false);
  };

  const handleRemove = async () => {
    await onRemovePet();
  };

  const filteredCards = collectorCards
    .filter(c => c.pokemon_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aIdx = RARITY_ORDER.indexOf(a.rarity);
      const bIdx = RARITY_ORDER.indexOf(b.rarity);
      return bIdx - aIdx; // Higher rarity first
    });

  const rarityColor = RARITY_COLORS[petData.pet_rarity || 'common'] || RARITY_COLORS.common;

  return (
    <>
      <div className="flex flex-col items-center gap-1">
        <span className={cn(
          "font-bold text-amber-400/80",
          isMobile ? "text-[9px]" : "text-xs"
        )}>
          {t('pet.title', 'Pet')}
        </span>
        
        <button
          onClick={() => setShowSelector(true)}
          className={cn(
            "relative rounded-xl border-2 transition-all duration-300 overflow-hidden group",
            isMobile ? "w-20 h-24" : "w-28 h-36",
            hasPet
              ? "hover:scale-105 border-amber-400/60 shadow-lg"
              : "bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-dashed border-amber-500/40 hover:border-amber-400/60 hover:scale-105"
          )}
          style={hasPet ? {
            background: `linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.05) 100%)`,
          } : undefined}
        >
          {hasPet ? (
            <div className="relative flex flex-col items-center justify-center h-full p-1.5">
              {/* Remove button */}
              <button
                onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                className="absolute top-1 right-1 z-20 p-0.5 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"
              >
                <X className="h-2.5 w-2.5 text-white" />
              </button>

              {/* Shiny indicator */}
              {petData.pet_is_shiny && (
                <div className="absolute top-1 left-1 z-20">
                  <Sparkles className={cn(
                    "text-yellow-300 fill-yellow-300/50 animate-pulse",
                    isMobile ? "h-3 w-3" : "h-3.5 w-3.5"
                  )} />
                </div>
              )}

              {/* Pet sprite */}
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${petData.pet_pokemon_id}.png`}
                alt={petData.pet_pokemon_name}
                className={cn(
                  "pixelated drop-shadow-lg",
                  isMobile ? "w-12 h-12" : "w-20 h-20"
                )}
                style={{ imageRendering: 'pixelated' }}
              />

              {/* Name */}
              <span className={cn(
                "font-bold text-white truncate w-full text-center capitalize",
                isMobile ? "text-[8px]" : "text-[10px]"
              )}>
                {petData.pet_pokemon_name}
              </span>

              {/* Multiplier badge */}
              <Badge className={cn(
                "bg-gradient-to-r text-white border-0 font-bold shadow-md",
                rarityColor,
                isMobile ? "text-[7px] px-1.5 py-0" : "text-[9px] px-2 py-0.5"
              )}>
                {multiplier.toFixed(2)}x DMG
              </Badge>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-amber-500/50 transition-all group-hover:text-amber-400/70">
              <Heart className={cn(
                "transition-all group-hover:scale-110",
                isMobile ? "h-5 w-5" : "h-7 w-7"
              )} />
              <span className={cn(
                "font-semibold mt-1",
                isMobile ? "text-[8px]" : "text-[10px]"
              )}>
                {t('pet.add', 'Add Pet')}
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Pet Selection Dialog */}
      <Dialog open={showSelector} onOpenChange={setShowSelector}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-amber-400 flex items-center gap-2">
              <Heart className="h-5 w-5" />
              {t('pet.selectTitle', 'Select Pet Card')}
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-slate-400 -mt-2">
            {t('pet.selectDescription', 'Choose a card from your collection. Higher rarity = higher damage multiplier. Shiny cards give +25% bonus!')}
          </p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('pet.search', 'Search...')}
              className="pl-9 bg-slate-800 border-slate-600 text-white"
            />
          </div>

          <ScrollArea className="h-[300px] pr-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full" />
              </div>
            ) : filteredCards.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                {t('pet.noCards', 'No cards available')}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {filteredCards.map((card) => {
                  const cardMultiplier = getPetDamageMultiplier(card.rarity, card.is_shiny);
                  const cardRarityColor = RARITY_COLORS[card.rarity] || RARITY_COLORS.common;
                  const isCurrentPet = petData.pet_pokemon_id === card.pokemon_id && petData.pet_is_shiny === card.is_shiny;

                  return (
                    <button
                      key={`${card.pokemon_id}-${card.is_shiny}`}
                      onClick={() => handleSelectPet(card)}
                      disabled={isCurrentPet}
                      className={cn(
                        "relative p-2 rounded-xl border-2 transition-all duration-200 overflow-hidden",
                        isCurrentPet
                          ? "opacity-50 cursor-not-allowed border-amber-500/50 bg-amber-900/20"
                          : "border-slate-600/50 hover:scale-105 hover:border-amber-400/50 bg-slate-800/50"
                      )}
                    >
                      {card.is_shiny && (
                        <Sparkles className="absolute top-1 right-1 h-3 w-3 text-yellow-300 fill-yellow-300/50" />
                      )}

                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${card.is_shiny ? 'shiny/' : ''}${card.pokemon_id}.png`}
                        alt={card.pokemon_name}
                        className="w-14 h-14 mx-auto pixelated"
                        style={{ imageRendering: 'pixelated' }}
                      />

                      <p className="text-[9px] font-bold text-white text-center truncate capitalize mt-0.5">
                        {card.pokemon_name}
                      </p>

                      <Badge className={cn(
                        "w-full justify-center bg-gradient-to-r text-white border-0 text-[7px] mt-0.5",
                        cardRarityColor
                      )}>
                        {cardMultiplier.toFixed(2)}x
                      </Badge>

                      {isCurrentPet && (
                        <span className="text-[7px] text-amber-400 font-bold">
                          {t('pet.equipped', 'Equipped')}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PetSlot;
