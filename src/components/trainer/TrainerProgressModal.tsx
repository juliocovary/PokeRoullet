import { useTranslation } from 'react-i18next';
import { X, Trophy, Star, Swords, Crosshair } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { TrainerPokemonData, TrainerProgressData } from '@/hooks/useTrainerMode';

interface TrainerProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainerProgress: TrainerProgressData | null;
  trainerPokemon: TrainerPokemonData[];
}

const STAR_COLORS: Record<number, string> = {
  1: 'text-slate-400',
  2: 'text-green-400',
  3: 'text-blue-400',
  4: 'text-purple-400',
  5: 'text-amber-400',
  6: 'text-pink-400',
};

const TrainerProgressModal = ({
  isOpen,
  onClose,
  trainerProgress,
  trainerPokemon,
}: TrainerProgressModalProps) => {
  const { t } = useTranslation('trainer');

  const stats = [
    {
      icon: Trophy,
      label: t('progress.currentStage'),
      value: trainerProgress?.current_stage || 1,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
    {
      icon: Star,
      label: t('progress.highestStage'),
      value: trainerProgress?.highest_stage_cleared || 0,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
    },
    {
      icon: Swords,
      label: t('progress.battlesWon'),
      value: trainerProgress?.total_battles_won || 0,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      icon: Crosshair,
      label: t('progress.pokemonDefeated'),
      value: trainerProgress?.total_pokemon_defeated || 0,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
    },
  ];

  // Count pokemon by star rating
  const starCounts = [1, 2, 3, 4, 5, 6].map(star => ({
    star,
    count: trainerPokemon.filter(p => p.star_rating === star).length,
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-amber-400 flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {t('progress.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={cn(
                  "p-4 rounded-xl border border-slate-700/50",
                  stat.bgColor
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                  <span className="text-xs text-slate-400">{stat.label}</span>
                </div>
                <p className={cn("text-2xl font-bold", stat.color)}>
                  {stat.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Pokemon Collection Stats */}
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h4 className="text-sm font-medium text-slate-300 mb-3">{t('pokemon.collection')}</h4>
            <div className="grid grid-cols-6 gap-2">
              {starCounts.map(({ star, count }) => (
                <div
                  key={star}
                  className="text-center p-2 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex justify-center gap-0.5 mb-1">
                    {star <= 3 ? (
                      Array.from({ length: star }).map((_, i) => (
                        <Star key={i} className={cn("h-3 w-3 fill-current", STAR_COLORS[star])} />
                      ))
                    ) : (
                      <>
                        <Star className={cn("h-3 w-3 fill-current", STAR_COLORS[star])} />
                        <span className={cn("text-[10px] font-bold", STAR_COLORS[star])}>
                          {star}★
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-lg font-bold text-white">{count}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 text-center text-sm text-slate-400">
              {t('pokemon.total')}: <span className="font-bold text-white">{trainerPokemon.length}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrainerProgressModal;
