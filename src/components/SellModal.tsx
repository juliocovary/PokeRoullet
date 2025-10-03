import { useState } from 'react';
import { X, Coins, Minus, Plus } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PokemonCard } from '@/components/PokemonCard';
import { PokemonInventoryItem } from '@/hooks/usePokemon';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

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
  const { user } = useAuth();
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonInventoryItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Filter out starter pokemon from sellable list
  const sellablePokemon = pokemonInventory.filter(pokemon => pokemon.rarity !== 'starter');

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
    return price * quantity;
  };

  const handleSell = async () => {
    if (!user || !selectedPokemon) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('sell_pokemon', {
        p_user_id: user.id,
        p_pokemon_id: selectedPokemon.pokemon_id,
        p_quantity: quantity
      });

      if (error) {
        console.error('Error selling pokemon:', error);
        toast({
          title: "Erro",
          description: "Erro ao vender Pokémon",
          variant: "destructive",
        });
        return;
      }

      const result = data[0];
      if (result && result.success) {
        toast({
          title: "Sucesso!",
          description: `${result.message} Você ganhou ${result.pokecoins_earned} Pokécoins!`,
        });
        onSellSuccess();
        setSelectedPokemon(null);
        setQuantity(1);
      } else {
        toast({
          title: "Erro",
          description: result?.message || "Erro ao vender Pokémon",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error selling pokemon:', error);
      toast({
        title: "Erro",
        description: "Erro ao vender Pokémon",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedPokemon(null);
    setQuantity(1);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl w-full h-[90vh] p-0 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 [&>button]:hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-white/80 backdrop-blur-sm rounded-t-lg">
            <div className="flex items-center gap-3">
              <Coins className="w-8 h-8 text-orange-500" />
              <h2 className="text-3xl font-bold text-orange-500">Vender Pokémon</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Pokemon Selection */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Selecione um Pokémon para vender</h3>
                <div className="overflow-y-auto max-h-[calc(90vh-300px)] bg-white/50 rounded-lg p-4">
                  {sellablePokemon.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🚫</div>
                      <p className="text-lg text-muted-foreground">Nenhum Pokémon disponível para venda</p>
                      <p className="text-sm text-muted-foreground">Pokémon iniciais não podem ser vendidos</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {sellablePokemon.map((pokemon) => (
                        <div 
                          key={pokemon.pokemon_id} 
                          className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                            selectedPokemon?.pokemon_id === pokemon.pokemon_id 
                              ? 'ring-4 ring-orange-400 ring-opacity-75' 
                              : ''
                          }`}
                          onClick={() => handleSelectPokemon(pokemon)}
                        >
                          <PokemonCard 
                            pokemon={{
                              id: pokemon.pokemon_id,
                              name: pokemon.pokemon_name,
                              sprite: pokemon.sprite,
                              rarity: pokemon.rarity as any
                            }}
                            quantity={pokemon.quantity}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sell Details */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Detalhes da Venda</h3>
                <div className="bg-white/50 rounded-lg p-6 space-y-6">
                  {selectedPokemon ? (
                    <>
                      {/* Selected Pokemon Info */}
                      <div className="text-center">
                        <div className="inline-block mb-4">
                          <PokemonCard 
                            pokemon={{
                              id: selectedPokemon.pokemon_id,
                              name: selectedPokemon.pokemon_name,
                              sprite: selectedPokemon.sprite,
                              rarity: selectedPokemon.rarity as any
                            }}
                            quantity={selectedPokemon.quantity}
                          />
                        </div>
                        <Badge 
                          className={`${rarityColors[selectedPokemon.rarity as keyof typeof rarityColors]} text-white`}
                        >
                          {selectedPokemon.rarity}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-2">
                          Valor por unidade: {rarityPrices[selectedPokemon.rarity as keyof typeof rarityPrices] || 1} Pokécoins
                        </p>
                      </div>

                      {/* Quantity Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Quantidade (máx: {selectedPokemon.quantity})</label>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={decrementQuantity}
                            disabled={quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => handleQuantityChange(e.target.value)}
                            min="1"
                            max={selectedPokemon.quantity}
                            className="text-center w-20"
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={incrementQuantity}
                            disabled={quantity >= selectedPokemon.quantity}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Total Price */}
                      <div className="text-center p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">
                          Total: {calculateTotalPrice()} Pokécoins
                        </p>
                      </div>

                      {/* Sell Button */}
                      <Button 
                        onClick={handleSell} 
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                        size="lg"
                      >
                        {isLoading ? 'Vendendo...' : 'Confirmar Venda'}
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">👆</div>
                      <p className="text-lg text-muted-foreground">Selecione um Pokémon para vender</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};