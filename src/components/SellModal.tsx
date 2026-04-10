import { useState, useEffect } from 'react';
import { X, Coins, Minus, Plus, Search } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PokemonCard } from '@/components/PokemonCard';
import { PokemonInventoryItem } from '@/hooks/usePokemon';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

// Helper function to update launch event progress
const updateLaunchEventProgress = async (userId: string, category: string, increment: number = 1) => {
  const { data, error } = await supabase.rpc('update_launch_event_progress', {
    p_user_id: userId,
    p_category: category,
    p_increment: increment,
  });
  
  if (error) {
    console.error('[LAUNCH_EVENT] Error updating progress:', error);
  } else {
    console.log('[LAUNCH_EVENT] Progress updated:', { category, increment, data });
  }
};

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  pokemonInventory: PokemonInventoryItem[];
  onSellSuccess: () => void;
}

const rarityPrices = {
  common: 1,
  uncommon: 2,
  rare: 5,
  pseudo: 25,
  legendary: 150,
  secret: 500
};

const rarityColors = {
  legendary: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
  pseudo: 'bg-gradient-to-r from-orange-400 to-orange-500',
  starter: 'bg-gradient-to-r from-yellow-300 to-yellow-400',
  rare: 'bg-gradient-to-r from-purple-400 to-purple-500',
  uncommon: 'bg-gradient-to-r from-blue-400 to-blue-500',
  common: 'bg-gradient-to-r from-green-400 to-green-500',
  secret: 'bg-gradient-to-r from-violet-500 to-violet-600'
};

export const SellModal = ({ isOpen, onClose, pokemonInventory, onSellSuccess }: SellModalProps) => {
  const { t } = useTranslation(['modals', 'toasts']);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonInventoryItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [localInventory, setLocalInventory] = useState<PokemonInventoryItem[]>(pokemonInventory);
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Update local inventory when prop changes
  useEffect(() => {
    setLocalInventory(pokemonInventory);
  }, [pokemonInventory]);

  // Filter out starter pokemon from sellable list
  const sellablePokemon = localInventory.filter(pokemon => pokemon.rarity !== 'starter');

  // Filter pokemon by rarity and search term
  const filteredPokemon = sellablePokemon
    .filter(pokemon => {
      const matchesRarity = selectedRarity === 'all' || pokemon.rarity === selectedRarity;
      const matchesSearch = pokemon.pokemon_name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRarity && matchesSearch;
    });

  const uniqueRarities = Array.from(new Set(sellablePokemon.map(p => p.rarity)));

  const handleSelectPokemon = (pokemon: PokemonInventoryItem) => {
    setSelectedPokemon(pokemon);
    setQuantity(1);
  };

  const handleQuantityChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1 && selectedPokemon && numValue <= selectedPokemon.quantity) {
      setQuantity(numValue);
    }
  };

  const incrementQuantity = () => {
    if (selectedPokemon && quantity < selectedPokemon.quantity) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const calculateTotalPrice = () => {
    if (!selectedPokemon) return 0;
    const price = rarityPrices[selectedPokemon.rarity as keyof typeof rarityPrices] || 1;
    const shinyMultiplier = selectedPokemon.is_shiny ? 3 : 1; // Shiny vale 3x mais
    return price * quantity * shinyMultiplier;
  };

  const handleSell = async () => {
    if (!user || !selectedPokemon) return;

    setIsLoading(true);
    try {
      let { data, error } = await supabase.rpc('sell_pokemon', {
        p_user_id: user.id,
        p_pokemon_id: selectedPokemon.pokemon_id,
        p_quantity: quantity,
        p_is_shiny: selectedPokemon.is_shiny
      });

      // Backward compatibility: some environments may still have the old
      // 3-argument sell_pokemon signature without p_is_shiny.
      if (error && !selectedPokemon.is_shiny) {
        const fallback = await supabase.rpc('sell_pokemon', {
          p_user_id: user.id,
          p_pokemon_id: selectedPokemon.pokemon_id,
          p_quantity: quantity,
        });
        data = fallback.data;
        error = fallback.error;
      }

      if (error) {
        console.error('Error selling pokemon:', error);
        toast({
          title: t('modals:sell.errorTitle'),
          description: error.message || t('modals:sell.errorDescription'),
          variant: "destructive",
        });
        return;
      }

      const result = data?.[0];
      if (result && result.success) {
        toast({
          title: t('modals:sell.successTitle'),
          description: t('modals:sell.successDescription', {
            amount: 'coins_earned' in result
              ? result.coins_earned
              : (result as any).pokecoins_earned
          }),
        });
        
        // Update launch event progress for selling
        await updateLaunchEventProgress(user.id, 'sell', quantity);
        
        // Update local inventory
        setLocalInventory(prevInventory => {
          return prevInventory
            .map(pokemon => {
              if (pokemon.pokemon_id === selectedPokemon.pokemon_id && pokemon.is_shiny === selectedPokemon.is_shiny) {
                const newQuantity = pokemon.quantity - quantity;
                return { ...pokemon, quantity: newQuantity };
              }
              return pokemon;
            })
            .filter(pokemon => pokemon.quantity > 0);
        });
        
        setSelectedPokemon(null);
        setQuantity(1);
      } else {
        toast({
          title: t('modals:sell.errorTitle'),
          description: result?.message || t('modals:sell.errorDescription'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error selling pokemon:', error);
      toast({
        title: t('modals:sell.errorTitle'),
        description: t('modals:sell.errorDescription'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedPokemon(null);
    setQuantity(1);
    setSelectedRarity('all');
    setSearchTerm('');
    setLocalInventory(pokemonInventory);
    onSellSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-full sm:max-w-5xl w-full h-[95vh] sm:max-h-[90vh] p-0 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 [&>button]:hidden overflow-hidden flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b bg-white/80 backdrop-blur-sm rounded-t-lg shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <Coins className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
            <h2 className="text-xl sm:text-3xl font-bold text-orange-500">{t('modals:sell.title')}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose} className="h-10 w-10">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-hidden">
          <div className={`grid grid-cols-1 ${isMobile ? '' : 'lg:grid-cols-2'} gap-3 sm:gap-6 h-full p-3 sm:p-6`}>
            {/* Pokemon Selection */}
            <div className="flex flex-col space-y-3 sm:space-y-4 h-full overflow-hidden">
              <h3 className="text-base sm:text-xl font-bold shrink-0">{t('modals:sell.selectPokemon')}</h3>
              
              {/* Search and Filter */}
              <div className="space-y-3 shrink-0">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t('modals:sell.searchPokemon')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>

                {/* Rarity Filter */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedRarity === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedRarity('all')}
                    className="text-xs sm:text-sm h-8"
                  >
                    Todos
                  </Button>
                  {uniqueRarities.map((rarity) => (
                    <Button
                      key={rarity}
                      variant={selectedRarity === rarity ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedRarity(rarity)}
                      className={`text-xs sm:text-sm h-8 capitalize ${
                        selectedRarity === rarity ? rarityColors[rarity as keyof typeof rarityColors] : ''
                      }`}
                    >
                      {rarity}
                    </Button>
                  ))}
                </div>
              </div>

              <ScrollArea className="flex-1 w-full">
                <div className="bg-white/50 rounded-lg p-3 sm:p-4 pr-3">
                  {filteredPokemon.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🔍</div>
                      <p className="text-sm sm:text-lg text-muted-foreground">{t('modals:sell.noPokemonAvailable')}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 pb-3">
                      {filteredPokemon.map((pokemon) => (
                        <div 
                          key={`${pokemon.pokemon_id}-${pokemon.is_shiny}`}
                          className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                            selectedPokemon?.pokemon_id === pokemon.pokemon_id && selectedPokemon?.is_shiny === pokemon.is_shiny
                              ? 'ring-4 ring-orange-400 ring-opacity-75' 
                              : ''
                          }`}
                          onClick={() => handleSelectPokemon(pokemon)}
                        >
                          <PokemonCard 
                            pokemon={{
                              id: pokemon.pokemon_id,
                              name: pokemon.pokemon_name,
                              sprite: pokemon.is_shiny 
                                ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.pokemon_id}.png`
                                : pokemon.sprite,
                              rarity: pokemon.rarity as any
                            }}
                            quantity={pokemon.quantity}
                            isShiny={pokemon.is_shiny}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Sell Details */}
            <div className="flex flex-col space-y-3 sm:space-y-4 h-full overflow-hidden">
              <h3 className="text-base sm:text-xl font-bold shrink-0">{t('modals:sell.saleDetails')}</h3>
              <ScrollArea className="flex-1 w-full">
                <div className="bg-white/50 rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6 pr-3">
                  {selectedPokemon ? (
                    <>
                      {/* Selected Pokemon Info */}
                      <div className="text-center">
                        <div className="inline-block mb-3 sm:mb-4">
                          <PokemonCard 
                            pokemon={{
                              id: selectedPokemon.pokemon_id,
                              name: selectedPokemon.pokemon_name,
                              sprite: selectedPokemon.is_shiny 
                                ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${selectedPokemon.pokemon_id}.png`
                                : selectedPokemon.sprite,
                              rarity: selectedPokemon.rarity as any
                            }}
                            quantity={selectedPokemon.quantity}
                            isShiny={selectedPokemon.is_shiny}
                          />
                        </div>
                        <Badge 
                          className={`${rarityColors[selectedPokemon.rarity as keyof typeof rarityColors]} text-white text-xs sm:text-sm`}
                        >
                          {selectedPokemon.rarity} {selectedPokemon.is_shiny && '✨'}
                        </Badge>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                          {t('modals:sell.pricePerUnit')}: {rarityPrices[selectedPokemon.rarity as keyof typeof rarityPrices] || 1}{selectedPokemon.is_shiny && ' x3 (Shiny)'} Pokécoins
                        </p>
                      </div>

                      {/* Quantity Selection */}
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-medium">{t('modals:sell.quantity')} ({t('modals:sell.max')}: {selectedPokemon.quantity})</label>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size={isMobile ? "default" : "sm"}
                            onClick={decrementQuantity}
                            disabled={quantity <= 1}
                            className="h-10 w-10"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => handleQuantityChange(e.target.value)}
                            min="1"
                            max={selectedPokemon.quantity}
                            className="text-center w-16 sm:w-20 h-10"
                          />
                          <Button 
                            variant="outline" 
                            size={isMobile ? "default" : "sm"}
                            onClick={incrementQuantity}
                            disabled={quantity >= selectedPokemon.quantity}
                            className="h-10 w-10"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Total Price */}
                      <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg">
                        <p className="text-lg sm:text-2xl font-bold text-orange-600">
                          {t('modals:sell.total')}: {calculateTotalPrice()} Pokécoins
                        </p>
                      </div>

                      {/* Sell Button */}
                      <Button 
                        onClick={handleSell} 
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 h-11 sm:h-10 text-sm sm:text-base"
                        size={isMobile ? "default" : "lg"}
                      >
                        {isLoading ? t('modals:sell.selling') : t('modals:sell.confirmSale')}
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">👆</div>
                      <p className="text-sm sm:text-lg text-muted-foreground">{t('modals:sell.selectToSell')}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};