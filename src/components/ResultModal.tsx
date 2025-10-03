import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PokemonCard } from './PokemonCard';
import { Pokemon } from '@/hooks/usePokemon';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  pokemon: Pokemon | null;
  pokécoinsEarned?: number;
}

export const ResultModal = ({ isOpen, onClose, pokemon, pokécoinsEarned = 0 }: ResultModalProps) => {
  if (!pokemon) return null;

  const isSpecialPokemon = pokemon.rarity === 'legendary' || pokemon.rarity === 'starter' || pokemon.rarity === 'pseudo' || pokemon.rarity === 'secret';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {isSpecialPokemon ? '🎉 POKÉMON ESPECIAL! 🎉' : '✨ Novo Pokémon! ✨'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-6">
          {/* Confetti effect for special pokemon */}
          {isSpecialPokemon && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-bounce"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random()}s`
                  }}
                >
                  {['⭐', '✨', '🎊', '🎉'][Math.floor(Math.random() * 4)]}
                </div>
              ))}
            </div>
          )}

          {/* Pokemon Card */}
          <div className="flex justify-center">
            <div className="scale-110">
              <PokemonCard pokemon={pokemon} isRevealing />
            </div>
          </div>

          {/* Congratulations Message */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold capitalize">Você obteve {pokemon.name}!</h3>
            {pokécoinsEarned > 0 && (
              <p className="text-muted-foreground">
                +{pokécoinsEarned} Pokécoins adicionadas! 🪙
              </p>
            )}
          </div>

          {/* Special Messages */}
          {pokemon.rarity === 'legendary' && (
            <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 p-4 rounded-lg border border-yellow-300">
              <p className="text-yellow-800 font-bold">
                🏆 INCRÍVEL! Você capturou um Pokémon Lendário! 
              </p>
              <p className="text-yellow-700 text-sm">
                Apenas 0.1% de chance! Você teve muita sorte!
              </p>
            </div>
          )}

          {pokemon.rarity === 'starter' && (
            <div className="bg-gradient-to-r from-orange-100 to-orange-200 p-4 rounded-lg border border-orange-300">
              <p className="text-orange-800 font-bold">
                🔥 Pokémon Inicial capturado!
              </p>
              <p className="text-orange-700 text-sm">
                Apenas 0.5% de chance! Excelente!
              </p>
            </div>
          )}

          {pokemon.rarity === 'pseudo' && (
            <div className="bg-gradient-to-r from-purple-100 to-purple-200 p-4 rounded-lg border border-purple-300">
              <p className="text-purple-800 font-bold">
                🐉 Pseudo-Lendário encontrado!
              </p>
              <p className="text-purple-700 text-sm">
                Apenas 1% de chance! Muito raro!
              </p>
            </div>
          )}

          {pokemon.rarity === 'secret' && (
            <div className="bg-gradient-to-r from-violet-100 to-violet-200 p-4 rounded-lg border border-violet-300">
              <p className="text-violet-800 font-bold">
                🌟 POKÉMON SECRETO! IMPOSSÍVEL!
              </p>
              <p className="text-violet-700 text-sm">
                Apenas 0.01% de chance! LENDÁRIO ABSOLUTO!
              </p>
            </div>
          )}

          {/* Close Button */}
          <Button 
            onClick={onClose}
            className="btn-casino w-full"
          >
            ✨ Continuar Aventura
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};