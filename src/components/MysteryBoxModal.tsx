import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Package, Sparkles, Zap, Star, Info } from 'lucide-react';
import { MysteryBoxReward } from '@/hooks/useBooster';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import pokecoinIcon from '@/assets/pokecoin.png';
import pokeshardIcon from '@/assets/pokeshard.png';

interface MysteryBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: (count?: number) => Promise<MysteryBoxReward[]>;
  onComplete?: () => void;
  openCount?: number;
  onRefreshInventory?: () => Promise<void>;
}

export const MysteryBoxModal = ({ isOpen, onClose, onOpen, onComplete, openCount = 1, onRefreshInventory }: MysteryBoxModalProps) => {
  const { t } = useTranslation(['modals']);
  const [phase, setPhase] = useState<'ready' | 'opening' | 'result'>('ready');
  const [rewards, setRewards] = useState<MysteryBoxReward[]>([]);

  useEffect(() => {
    if (isOpen) {
      setPhase('ready');
      setRewards([]);
    }
  }, [isOpen]);

  const handleOpen = async () => {
    setPhase('opening');
    
    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const results = await onOpen(openCount);
    setRewards(results);
    setPhase('result');
  };

  const handleClose = async () => {
    if (onComplete) onComplete();
    // Refresh inventory instead of reloading page
    if (onRefreshInventory) {
      await onRefreshInventory();
    }
    onClose();
  };

  const getRewardDisplay = (reward: MysteryBoxReward, index?: number) => {
    const key = index !== undefined ? index : 0;
    
    switch (reward.type) {
      case 'spins':
        return (
          <div key={key} className="text-center p-3 bg-blue-50 rounded-lg">
            <Zap className="w-10 h-10 mx-auto text-blue-500 mb-2" />
            <p className="text-lg font-bold text-blue-600">
              {reward.amount} {t('modals:boosters.rewards.freeSpins', { defaultValue: 'Giros' })}
            </p>
          </div>
        );
      case 'pokecoins':
        return (
          <div key={key} className="text-center p-3 bg-amber-50 rounded-lg">
            <img src={pokecoinIcon} alt="Pokécoin" className="w-10 h-10 mx-auto mb-2" />
            <p className="text-lg font-bold text-amber-600">
              {reward.amount} Pokécoins
            </p>
          </div>
        );
      case 'pokeshards':
        return (
          <div key={key} className="text-center p-3 bg-purple-50 rounded-lg">
            <img src={pokeshardIcon} alt="Pokeshard" className="w-10 h-10 mx-auto mb-2" />
            <p className="text-lg font-bold text-purple-600">
              {reward.amount} Pokeshards
            </p>
          </div>
        );
      case 'item':
        return (
          <div key={key} className="text-center p-3 bg-pink-50 rounded-lg">
            <Sparkles className="w-10 h-10 mx-auto text-pink-500 mb-2" />
            <p className="text-lg font-bold text-pink-600">
              1x {reward.itemName === 'Shiny Potion' 
                ? t('modals:boosters.shinyPotion', { defaultValue: 'Poção Shiny' })
                : t('modals:boosters.luckPotion', { defaultValue: 'Poção Sorte' })}
            </p>
          </div>
        );
      case 'legendary_spin':
        return (
          <div key={key} className="text-center p-3 bg-yellow-50 rounded-lg">
            <Star className="w-10 h-10 mx-auto text-yellow-500 mb-2 animate-pulse" />
            <p className="text-lg font-bold text-yellow-600">
              🎉 {t('modals:boosters.legendarySpin', { defaultValue: 'Giro Lendário' })}
            </p>
          </div>
        );
    }
  };

  // Chances table data
  const spins = t('modals:boosters.rewards.freeSpins');
  const chancesData = [
    { reward: `10 ${spins}`, chance: '40%' },
    { reward: '100 Pokécoins', chance: '15%' },
    { reward: '25 Pokeshards', chance: '15%' },
    { reward: t('modals:boosters.shinyPotion'), chance: '10%' },
    { reward: t('modals:boosters.luckPotion'), chance: '10%' },
    { reward: `25 ${spins}`, chance: '5%' },
    { reward: '300 Pokécoins', chance: '2.5%' },
    { reward: '100 Pokeshards', chance: '1.5%' },
    { reward: t('modals:boosters.legendarySpin'), chance: '1%' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 border border-slate-200 overflow-hidden">
        {/* Info Button - Always visible */}
        <div className="absolute top-3 right-10 z-10">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow-sm">
                <Info className="h-4 w-4 text-slate-600" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="end">
              <h4 className="font-semibold text-sm mb-2 text-slate-800">
                {t('modals:boosters.chancesTitle', { defaultValue: 'Chances de Recompensa' })}
              </h4>
              <div className="space-y-1.5">
                {chancesData.map((item, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-slate-600">{item.reward}</span>
                    <span className="font-medium text-slate-800">{item.chance}</span>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {phase === 'ready' && (
          <div className="p-8 text-center">
            <div className="relative mb-6">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-indigo-100 to-blue-200 rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="w-16 h-16 text-indigo-600" />
                {openCount > 1 && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-lg">
                    x{openCount}
                  </div>
                )}
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">
              {openCount > 1 
                ? `${t('modals:boosters.mysteryBox', { defaultValue: 'Caixa Misteriosa' })} x${openCount}`
                : t('modals:boosters.mysteryBox', { defaultValue: 'Caixa Misteriosa' })}
            </h2>
            <p className="text-slate-600 mb-6 text-sm">
              {openCount > 1 
                ? t('modals:boosters.mysteryBoxOpenMultiple', { defaultValue: 'Clique para abrir todas e descobrir suas recompensas!' })
                : t('modals:boosters.mysteryBoxOpenPrompt', { defaultValue: 'Clique para abrir e descobrir sua recompensa!' })}
            </p>
            <Button 
              onClick={handleOpen}
              className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-medium px-8 py-3"
            >
              {openCount > 1 
                ? `${t('modals:boosters.open', { defaultValue: 'Abrir' })} ${openCount}`
                : t('modals:boosters.open', { defaultValue: 'Abrir' })}
            </Button>
          </div>
        )}

        {phase === 'opening' && (
          <div className="p-8 text-center">
            <div className="relative mb-6">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-indigo-100 to-blue-200 rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
                <Package className="w-16 h-16 text-indigo-600" />
              </div>
              <Sparkles className="absolute top-0 left-1/4 w-6 h-6 text-indigo-400 animate-ping" />
              <Sparkles className="absolute bottom-0 right-1/4 w-6 h-6 text-blue-400 animate-ping delay-300" />
            </div>
            <h2 className="text-xl font-semibold text-slate-700 animate-pulse">
              {openCount > 1 
                ? t('modals:boosters.openingMultiple', { defaultValue: 'Abrindo caixas...' })
                : t('modals:boosters.opening', { defaultValue: 'Abrindo...' })}
            </h2>
          </div>
        )}

        {phase === 'result' && rewards.length > 0 && (
          <div className="p-8 text-center">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">
                {t('modals:boosters.youWon', { defaultValue: 'Você ganhou!' })}
              </h2>
              <div className={`grid gap-3 ${rewards.length > 1 ? 'grid-cols-1 sm:grid-cols-3' : ''}`}>
                {rewards.map((reward, index) => getRewardDisplay(reward, index))}
              </div>
            </div>
            <Button 
              onClick={handleClose}
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-medium px-8 py-3"
            >
              {t('modals:boosters.collect', { defaultValue: 'Coletar' })} ✓
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};