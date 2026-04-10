import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Sparkles } from 'lucide-react';
import pokecoinIcon from '@/assets/pokecoin.png';
import pokeshardIcon from '@/assets/pokeshard.png';
import pokgemIcon from '@/assets/pokegem.png';

interface Rewards {
  coins?: number;
  shards?: number;
  gems?: number;
  spins?: number;
  status_upgrades?: number;
  luck_potions?: number;
  shiny_potions?: number;
}

interface PromoCodeRewardAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  rewards: Rewards;
  codeName: string;
}

const REWARD_CONFIG: { key: keyof Rewards; label: string; icon: string | null; img?: string; color: string }[] = [
  { key: 'coins', label: 'PokéCoins', icon: null, img: 'pokecoin', color: 'text-yellow-500' },
  { key: 'shards', label: 'PokéShards', icon: null, img: 'pokeshard', color: 'text-purple-500' },
  { key: 'gems', label: 'PokéGems', icon: null, img: 'pokegem', color: 'text-cyan-500' },
  { key: 'spins', label: 'Spins', icon: '🎰', color: 'text-green-500' },
  { key: 'status_upgrades', label: 'Status Upgrades', icon: '⬆️', color: 'text-orange-500' },
  { key: 'luck_potions', label: 'Poções de Sorte', icon: '🍀', color: 'text-emerald-500' },
  { key: 'shiny_potions', label: 'Poções Shiny', icon: '✨', color: 'text-pink-500' },
];

export const PromoCodeRewardAnimation = ({ isOpen, onClose, rewards, codeName }: PromoCodeRewardAnimationProps) => {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const [showCollect, setShowCollect] = useState(false);

  const activeRewards = REWARD_CONFIG.filter(r => rewards[r.key] && rewards[r.key]! > 0);

  useEffect(() => {
    if (!isOpen) {
      setVisibleItems([]);
      setShowCollect(false);
      return;
    }

    activeRewards.forEach((_, i) => {
      setTimeout(() => {
        setVisibleItems(prev => [...prev, i]);
      }, 400 + i * 300);
    });

    setTimeout(() => {
      setShowCollect(true);
    }, 400 + activeRewards.length * 300 + 200);
  }, [isOpen]);

  const getImg = (item: typeof REWARD_CONFIG[0]) => {
    if (item.img === 'pokecoin') return pokecoinIcon;
    if (item.img === 'pokeshard') return pokeshardIcon;
    if (item.img === 'pokegem') return pokgemIcon;
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm sm:max-w-md p-0 border-0 bg-transparent shadow-none [&>button]:hidden">
        <div className="relative bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-2xl border-2 border-yellow-500/50 overflow-hidden p-6">
          {/* Sparkle effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1.5 + Math.random()}s`,
                }}
              />
            ))}
          </div>

          {/* Header */}
          <div className="text-center mb-6 relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-3 animate-bounce">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Código Resgatado!</h2>
            <p className="text-yellow-400 font-semibold text-sm mt-1">
              <Sparkles className="w-3 h-3 inline mr-1" />
              {codeName}
            </p>
          </div>

          {/* Rewards */}
          <div className="space-y-3 relative z-10 mb-6">
            {activeRewards.map((item, i) => {
              const img = getImg(item);
              return (
                <div
                  key={item.key}
                  className={`flex items-center gap-3 bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/10 transition-all duration-500 ${
                    visibleItems.includes(i)
                      ? 'opacity-100 translate-x-0 scale-100'
                      : 'opacity-0 -translate-x-8 scale-90'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    {img ? (
                      <img src={img} alt={item.label} className="w-6 h-6" />
                    ) : (
                      <span className="text-xl">{item.icon}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white/70 text-xs">{item.label}</p>
                    <p className={`text-lg font-bold ${item.color}`}>
                      +{rewards[item.key]?.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Collect button */}
          <div className={`relative z-10 transition-all duration-500 ${showCollect ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Button
              onClick={onClose}
              className="w-full h-12 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold text-lg border-0"
            >
              Coletar! 🎉
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
