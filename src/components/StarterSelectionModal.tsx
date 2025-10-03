import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pokemon } from '@/hooks/usePokemon';
import { toast } from '@/hooks/use-toast';

interface StarterSelectionModalProps {
  isOpen: boolean;
  onSelect: (starter: Pokemon) => Promise<void>;
}

const STARTER_POKEMON: Pokemon[] = [
  {
    id: 4,
    name: 'charmander',
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
    rarity: 'starter'
  },
  {
    id: 7,
    name: 'squirtle',
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png',
    rarity: 'starter'
  },
  {
    id: 1,
    name: 'bulbasaur',
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
    rarity: 'starter'
  }
];

export const StarterSelectionModal = ({ isOpen, onSelect }: StarterSelectionModalProps) => {
  const [selectedStarter, setSelectedStarter] = useState<Pokemon | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const handleConfirmSelection = async () => {
    if (!selectedStarter) {
      toast({
        title: 'Nenhum Pokémon selecionado',
        description: 'Por favor, escolha seu Pokémon inicial!',
        variant: 'destructive',
      });
      return;
    }

    setIsSelecting(true);
    try {
      await onSelect(selectedStarter);
      toast({
        title: `🌟 ${selectedStarter.name} escolhido!`,
        description: 'Seu Pokémon inicial foi adicionado ao seu inventário!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao selecionar Pokémon inicial. Tente novamente.',
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
      charmander: { type: 'Fogo', emoji: '🔥', color: 'from-red-400 to-orange-500' },
      squirtle: { type: 'Água', emoji: '💧', color: 'from-blue-400 to-cyan-500' },
      bulbasaur: { type: 'Planta', emoji: '🌱', color: 'from-green-400 to-emerald-500' }
    };
    return types[name as keyof typeof types] || { type: 'Normal', emoji: '⭐', color: 'from-gray-400 to-gray-500' };
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-center text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            🌟 Escolha seu Pokémon Inicial! 🌟
          </DialogTitle>
          <p className="text-center text-muted-foreground mt-2">
            Esta é uma decisão única e permanente. Escolha sabiamente, jovem treinador!
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
          {STARTER_POKEMON.map((pokemon) => {
            const typeInfo = getTypeInfo(pokemon.name);
            const isSelected = selectedStarter?.id === pokemon.id;
            
            return (
              <Card
                key={pokemon.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isSelected 
                    ? 'ring-4 ring-yellow-400 shadow-xl scale-105' 
                    : 'hover:shadow-lg'
                } card-pokemon`}
                onClick={() => setSelectedStarter(pokemon)}
              >
                <div className="p-6 text-center">
                  {/* Pokémon Image */}
                  <div className={`w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br ${typeInfo.color} p-4 shadow-lg`}>
                    <img
                      src={pokemon.sprite}
                      alt={pokemon.name}
                      className="w-full h-full object-contain filter drop-shadow-lg"
                    />
                  </div>

                  {/* Pokémon Info */}
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-mono">
                      {getPokedexNumber(pokemon)}
                    </p>
                    <h3 className="text-2xl font-bold capitalize text-foreground">
                      {pokemon.name}
                    </h3>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl">{typeInfo.emoji}</span>
                      <span className="text-lg font-semibold">{typeInfo.type}</span>
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-yellow-600">
                      <span className="text-2xl animate-bounce">✨</span>
                      <span className="font-bold">SELECIONADO</span>
                      <span className="text-2xl animate-bounce">✨</span>
                    </div>
                  )}

                  {/* Selection Button */}
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    className={`mt-4 w-full ${
                      isSelected 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600' 
                        : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStarter(pokemon);
                    }}
                  >
                    {isSelected ? '🌟 Escolhido!' : 'Escolher'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Confirm Button */}
        <div className="flex justify-center pt-4 border-t">
          <Button
            onClick={handleConfirmSelection}
            disabled={!selectedStarter || isSelecting}
            className="btn-casino px-8 py-3 text-lg"
          >
            {isSelecting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Confirmando...
              </>
            ) : (
              `🎉 Confirmar ${selectedStarter ? selectedStarter.name : 'Seleção'}`
            )}
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground mt-4">
          💡 <strong>Dica:</strong> Cada Pokémon inicial tem suas próprias vantagens. 
          Charmander é forte contra Pokémon de Planta, Squirtle contra Pokémon de Fogo, 
          e Bulbasaur contra Pokémon de Água!
        </div>
      </DialogContent>
    </Dialog>
  );
};