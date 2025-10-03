import { useState } from 'react';
import { X, Package, Gem, Search } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PokemonCard } from '@/components/PokemonCard';
import { PokemonInventoryItem } from '@/hooks/usePokemon';

export interface Item {
  id: number;
  name: string;
  description: string;
  type: string;
  icon_url: string;
  quantity: number;
}

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  pokemonInventory: PokemonInventoryItem[];
  itemInventory: Item[];
}

const rarityOrder = {
  secret: 0,
  legendary: 1,
  pseudo: 2,
  starter: 3,
  rare: 4,
  uncommon: 5,
  common: 6
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

export const InventoryModal = ({ isOpen, onClose, pokemonInventory, itemInventory }: InventoryModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');

  // Filter and sort Pokemon
  const filteredPokemon = pokemonInventory
    .filter(pokemon => {
      const matchesSearch = pokemon.pokemon_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRarity = selectedRarity === 'all' || pokemon.rarity === selectedRarity;
      return matchesSearch && matchesRarity;
    })
    .sort((a, b) => {
      const rarityA = rarityOrder[a.rarity as keyof typeof rarityOrder] ?? 999;
      const rarityB = rarityOrder[b.rarity as keyof typeof rarityOrder] ?? 999;
      return rarityA - rarityB;
    });

  const uniqueRarities = Array.from(new Set(pokemonInventory.map(p => p.rarity)));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh] p-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 [&>button]:hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-white/80 backdrop-blur-sm rounded-t-lg">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-primary">Inventário</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-hidden">
            <Tabs defaultValue="cards" className="h-full flex flex-col">
              <TabsList className="grid w-fit grid-cols-2 mb-6">
                <TabsTrigger value="cards" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Cards ({pokemonInventory.length})
                </TabsTrigger>
                <TabsTrigger value="items" className="flex items-center gap-2">
                  <Gem className="w-4 h-4" />
                  Itens ({itemInventory.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cards" className="flex-1 space-y-4">
                {/* Search and Filter */}
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar Pokémon..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedRarity === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedRarity('all')}
                    >
                      Todos
                    </Button>
                    {uniqueRarities.map(rarity => (
                      <Button
                        key={rarity}
                        variant={selectedRarity === rarity ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedRarity(rarity)}
                        className={selectedRarity === rarity ? rarityColors[rarity as keyof typeof rarityColors] : ''}
                      >
                        {rarity}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Pokemon Grid */}
                <div className="flex-1 overflow-y-auto max-h-[calc(90vh-280px)]">
                  {filteredPokemon.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📭</div>
                      <p className="text-lg text-muted-foreground">Nenhum Pokémon encontrado</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-6 px-1">
                      {filteredPokemon.map((pokemon) => (
                        <div key={pokemon.pokemon_id} className="card-hover">
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
              </TabsContent>

              <TabsContent value="items" className="flex-1">
                <div className="flex-1 overflow-y-auto max-h-[calc(90vh-220px)]">
                  {itemInventory.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">💎</div>
                      <p className="text-lg text-muted-foreground">Nenhum item no inventário</p>
                      <p className="text-sm text-muted-foreground">Visite a Loja de Itens para comprar Evolution Stones!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 pb-6 px-1">
                      {itemInventory.map((item) => (
                        <div 
                          key={item.id} 
                          className="card-pokemon p-4 text-center card-hover bg-gradient-to-br from-purple-50 to-blue-50"
                        >
                          <div className="text-4xl mb-2">{item.icon_url}</div>
                          <h3 className="font-bold text-sm mb-1">{item.name}</h3>
                          <Badge variant="secondary" className="mb-2">
                            x{item.quantity}
                          </Badge>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};