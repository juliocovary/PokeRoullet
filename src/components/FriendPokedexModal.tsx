import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFriendGifts } from '@/hooks/useFriendGifts';

interface FriendPokedexModalProps {
  isOpen: boolean;
  onClose: () => void;
  friendId: string;
  friendNickname: string;
}

interface PokedexEntry {
  pokemon_id: number;
  pokemon_name: string;
  is_shiny: boolean;
  placed_at: string;
}

export const FriendPokedexModal = ({ isOpen, onClose, friendId, friendNickname }: FriendPokedexModalProps) => {
  const { t } = useTranslation('modals');
  const { getFriendPokedex } = useFriendGifts();
  const [pokedex, setPokedex] = useState<PokedexEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && friendId) {
      setLoading(true);
      getFriendPokedex(friendId).then(data => {
        setPokedex(data);
        setLoading(false);
      });
    }
  }, [isOpen, friendId, getFriendPokedex]);

  const getSprite = (pokemonId: number, isShiny: boolean) => {
    const baseUrl = isShiny 
      ? 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/'
      : 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
    return `${baseUrl}${pokemonId}.png`;
  };

  const shinyCount = pokedex.filter(p => p.is_shiny).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            {t('friends.viewCollection', { name: friendNickname })}
          </DialogTitle>
          <div className="flex justify-center gap-4 text-sm text-muted-foreground">
            <span>{pokedex.length} Pokémon</span>
            {shinyCount > 0 && (
              <span className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                {shinyCount} Shiny
              </span>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="h-96">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : pokedex.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t('friends.emptyPokedex')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 p-2">
              {pokedex.map((entry) => (
                <div
                  key={`${entry.pokemon_id}-${entry.is_shiny}`}
                  className={`relative flex flex-col items-center p-1 rounded-lg border ${
                    entry.is_shiny 
                      ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/50' 
                      : 'bg-card/50 border-border'
                  }`}
                >
                  <img
                    src={getSprite(entry.pokemon_id, entry.is_shiny)}
                    alt={entry.pokemon_name}
                    className="w-12 h-12"
                    loading="lazy"
                  />
                  <span className="text-[10px] text-center truncate w-full capitalize">
                    {entry.pokemon_name}
                  </span>
                  {entry.is_shiny && (
                    <Sparkles className="absolute top-0 right-0 w-3 h-3 text-yellow-500" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
