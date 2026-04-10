import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LegendarySpinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpin: () => Promise<{ id: number; name: string; isShiny: boolean } | null>;
  onComplete?: () => void;
  onRefreshInventory?: () => Promise<void>;
}

export const LegendarySpinModal = ({ isOpen, onClose, onSpin, onComplete, onRefreshInventory }: LegendarySpinModalProps) => {
  const { t } = useTranslation(['modals']);
  const [phase, setPhase] = useState<'ready' | 'spinning' | 'result'>('ready');
  const [result, setResult] = useState<{ id: number; name: string; isShiny: boolean } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPhase('ready');
      setResult(null);
    }
  }, [isOpen]);

  const handleSpin = async () => {
    try {
      setPhase('spinning');
      
      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const legendary = await onSpin();
      
      if (legendary) {
        setResult(legendary);
        setPhase('result');
      } else {
        // If no result, reset to ready state
        setPhase('ready');
      }
    } catch (error) {
      console.error('Error during legendary spin:', error);
      setPhase('ready');
    }
  };

  const handleClose = async () => {
    if (onComplete) onComplete();
    // Refresh inventory instead of reloading page
    if (onRefreshInventory) {
      await onRefreshInventory();
    }
    onClose();
  };

  const getSprite = () => {
    if (!result) return '';
    return result.isShiny
      ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${result.id}.png`
      : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${result.id}.png`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 bg-gradient-to-br from-yellow-900 via-amber-900 to-orange-900 border-2 border-yellow-400 overflow-hidden">
        {phase === 'ready' && (
          <div className="p-8 text-center">
            <div className="relative mb-6">
              <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center animate-pulse">
                <Star className="w-16 h-16 text-white" />
              </div>
              <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full" />
            </div>
            <h2 className="text-3xl font-bold text-yellow-400 mb-4">
              {t('modals:boosters.legendarySpin', { defaultValue: 'Giro Lendário' })}
            </h2>
            <p className="text-gray-300 mb-6">
              {t('modals:boosters.legendarySpinDesc', { defaultValue: 'Garante um Pokémon Lendário aleatório!' })}
            </p>
            <Button 
              onClick={handleSpin}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold px-8 py-3 text-lg"
            >
              {t('modals:boosters.spin', { defaultValue: 'Girar' })} ⭐
            </Button>
          </div>
        )}

        {phase === 'spinning' && (
          <div className="p-8 text-center">
            <div className="relative mb-6">
              <div className="w-40 h-40 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center animate-spin">
                <Star className="w-20 h-20 text-white" />
              </div>
              <div className="absolute inset-0 bg-yellow-400/30 blur-3xl rounded-full animate-pulse" />
              <Sparkles className="absolute top-0 left-1/4 w-8 h-8 text-yellow-300 animate-ping" />
              <Sparkles className="absolute bottom-0 right-1/4 w-8 h-8 text-orange-300 animate-ping delay-300" />
              <Sparkles className="absolute top-1/2 right-0 w-8 h-8 text-amber-300 animate-ping delay-500" />
              <Sparkles className="absolute top-1/2 left-0 w-8 h-8 text-yellow-200 animate-ping delay-700" />
            </div>
            <h2 className="text-2xl font-bold text-yellow-400 animate-pulse">
              {t('modals:boosters.spinning', { defaultValue: 'Girando...' })}
            </h2>
          </div>
        )}

        {phase === 'result' && result && (
          <div className="p-8 text-center">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">
                🏆 {t('modals:boosters.legendaryObtained', { defaultValue: 'Lendário Obtido!' })} 🏆
              </h2>
              
              <div className={`relative ${result.isShiny ? 'animate-pulse' : ''}`}>
                {result.isShiny && (
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 blur-2xl opacity-50 animate-pulse" />
                )}
                <div className={`relative bg-gradient-to-br ${result.isShiny ? 'from-pink-100 via-purple-100 to-blue-100' : 'from-yellow-100 to-orange-100'} rounded-xl p-6`}>
                  <img 
                    src={getSprite()} 
                    alt={result.name}
                    className="w-32 h-32 mx-auto pixelated"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <h3 className="text-2xl font-bold capitalize mt-4 text-gray-800">
                    {result.name}
                  </h3>
                  {result.isShiny && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Sparkles className="w-5 h-5 text-pink-500" />
                      <span className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                        ✨ SHINY ✨
                      </span>
                      <Sparkles className="w-5 h-5 text-purple-500" />
                    </div>
                  )}
                  <span className="inline-block mt-2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold rounded-full">
                    LEGENDARY
                  </span>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleClose}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-8 py-3"
            >
              {t('modals:boosters.collect', { defaultValue: 'Coletar' })} ✓
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
