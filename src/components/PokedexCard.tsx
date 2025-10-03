import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePokemon } from '@/hooks/usePokemon';
interface PokedexCardProps {
  pokemonId: number;
  isPlaced: boolean;
  ownedQuantity: number;
  onPlaceCard: (pokemonId: number, pokemonName: string) => Promise<void>;
}
export const PokedexCard = ({
  pokemonId,
  isPlaced,
  ownedQuantity,
  onPlaceCard
}: PokedexCardProps) => {
  const {
    GEN1_POKEMON
  } = usePokemon();
  const pokemon = GEN1_POKEMON.find(p => p.id === pokemonId);
  if (!pokemon) return null;
  const handlePlaceCard = async () => {
    if (ownedQuantity > 0 && !isPlaced) {
      await onPlaceCard(pokemon.id, pokemon.name);
    }
  };
  return <Card className={`relative transition-all duration-300 hover:scale-105 ${isPlaced ? 'bg-gradient-to-br from-pokemon-gold/20 via-card to-pokemon-yellow/20 border-pokemon-gold shadow-lg shadow-pokemon-gold/30' : 'bg-gradient-to-br from-muted/50 to-card border-border shadow-sm hover:shadow-md'}`}>
      <CardContent className="p-4 text-center">
        {/* Pokemon Number */}
        <div className={`text-xs font-bold mb-2 ${isPlaced ? 'text-pokemon-gold' : 'text-muted-foreground'}`}>
          #{pokemon.id.toString().padStart(3, '0')}
        </div>

        {/* Pokemon Image */}
        <div className="relative w-24 h-24 mx-auto mb-3">
          <div className={`w-full h-full rounded-full border-2 ${isPlaced ? 'border-pokemon-gold bg-gradient-to-br from-pokemon-gold/10 to-pokemon-yellow/10' : 'border-border bg-muted/30'} flex items-center justify-center`}>
            <img src={pokemon.sprite} alt={isPlaced ? pokemon.name : '???'} className={`w-20 h-20 object-contain transition-all duration-300 ${!isPlaced ? 'filter brightness-0 contrast-200' : 'filter drop-shadow-sm'}`} />
          </div>
          {isPlaced && <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-pokemon-gold to-pokemon-yellow rounded-full flex items-center justify-center shadow-lg">
              <span className="text-xs font-bold text-lime-600">✓</span>
            </div>}
        </div>

        {/* Pokemon Name */}
        <div className={`text-sm font-bold mb-4 h-5 ${isPlaced ? 'text-foreground' : 'text-muted-foreground'}`}>
          {isPlaced ? pokemon.name : '?????'}
        </div>

        {/* Place Card Button */}
        <div className="space-y-2">
          <Button size="sm" disabled={ownedQuantity === 0 || isPlaced} onClick={handlePlaceCard} className={`w-full text-xs font-bold transition-all duration-300 ${isPlaced ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white cursor-default shadow-md' : ownedQuantity > 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:scale-105' : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'}`}>
            {isPlaced ? '✓ Colado' : 'Colar Card'}
          </Button>
          
          {/* Owned Quantity */}
          <div className={`text-xs font-medium ${ownedQuantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
            Possui: <span className="font-bold">{ownedQuantity}</span>
          </div>
        </div>
      </CardContent>
    </Card>;
};