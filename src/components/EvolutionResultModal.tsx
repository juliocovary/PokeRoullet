import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EvolutionResult {
  basePokemonId: number;
  basePokemonName: string;
  evolvedPokemonId: number;
  evolvedPokemonName: string;
  evolvedPokemonRarity: string;
}

interface EvolutionResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  evolutionData: EvolutionResult | null;
}

export const EvolutionResultModal = ({
  isOpen,
  onClose,
  evolutionData,
}: EvolutionResultModalProps) => {
  const { t } = useTranslation(['modals', 'game']);

  if (!evolutionData) return null;

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common':
        return 'bg-gray-500';
      case 'uncommon':
        return 'bg-green-500';
      case 'rare':
        return 'bg-blue-500';
      case 'pseudo':
        return 'bg-purple-500';
      case 'legendary':
        return 'bg-yellow-500';
      case 'secret':
        return 'bg-pink-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTranslatedRarity = (rarity: string) => {
    const rarityKey = rarity.toLowerCase();
    return t(`game:rarities.${rarityKey}`, { defaultValue: rarity });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-4 border-primary [&>button]:hidden">
        <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-yellow-500 p-1">
          <div className="bg-background rounded-sm">
            <DialogHeader className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1" />
                <DialogTitle className="text-3xl font-bold text-center flex items-center justify-center gap-3">
                  <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                  {t('modals:evolution.resultTitle')}
                  <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                </DialogTitle>
                <div className="flex-1 flex justify-end">
                  <Button variant="ghost" size="icon" onClick={onClose} className="rounded-sm opacity-70 hover:opacity-100">
                    <X className="w-5 h-5" />
                    <span className="sr-only">Close</span>
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="p-6 space-y-6">
              {/* Evolution Display */}
              <div className="grid grid-cols-3 gap-4 items-center">
                {/* Base Pokemon */}
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative group">
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${evolutionData.basePokemonId}.png`}
                      alt={evolutionData.basePokemonName}
                      className="w-32 h-32 object-contain opacity-60 grayscale"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    {evolutionData.basePokemonName}
                  </p>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <div className="bg-primary/10 rounded-full p-4">
                    <ArrowRight className="w-8 h-8 text-primary" />
                  </div>
                </div>

                {/* Evolved Pokemon */}
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 rounded-full blur-xl opacity-50 animate-pulse" />
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${evolutionData.evolvedPokemonId}.png`}
                      alt={evolutionData.evolvedPokemonName}
                      className="w-40 h-40 object-contain relative z-10 drop-shadow-2xl animate-bounce"
                      style={{ animationDuration: '2s' }}
                    />
                    <Sparkles className="absolute top-0 right-0 w-6 h-6 text-yellow-400 animate-spin" />
                    <Sparkles className="absolute bottom-0 left-0 w-6 h-6 text-pink-400 animate-spin" style={{ animationDirection: 'reverse' }} />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xl font-bold text-primary">
                      {evolutionData.evolvedPokemonName}
                    </p>
                    <Badge className={`${getRarityColor(evolutionData.evolvedPokemonRarity)} text-white`}>
                      {getTranslatedRarity(evolutionData.evolvedPokemonRarity)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Success Message */}
              <div className="text-center space-y-2 bg-muted/50 rounded-lg p-4">
                <p className="text-lg font-semibold">
                  {t('modals:evolution.congratulations', { baseName: evolutionData.basePokemonName })}{' '}
                  <span className="text-primary font-bold">{evolutionData.evolvedPokemonName}</span>!
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('modals:evolution.addedToInventory')}
                </p>
              </div>

              {/* Continue Button */}
              <div className="flex justify-center pt-2">
                <Button
                  size="lg"
                  onClick={onClose}
                  className="min-w-[200px] text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-500 hover:from-purple-700 hover:via-pink-600 hover:to-yellow-600"
                >
                  {t('modals:evolution.continue')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
