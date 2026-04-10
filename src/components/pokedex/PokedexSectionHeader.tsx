import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Region icons
import kantoIcon from '@/assets/regions/kanto.png';
import johtoIcon from '@/assets/regions/johto.png';
import hoennIcon from '@/assets/regions/hoenn.png';
import sinnohIcon from '@/assets/regions/sinnoh.png';
import unovaIcon from '@/assets/regions/unova.png';
import kalosIcon from '@/assets/regions/kalos.png';
import allRegionsIcon from '@/assets/regions/all-regions.webp';

interface PokedexSectionHeaderProps {
  sectionId: string;
  sectionName: string;
  currentCount: number;
  totalCount: number;
}

const regionIcons: Record<string, string> = {
  kanto: kantoIcon,
  johto: johtoIcon,
  hoenn: hoennIcon,
  sinnoh: sinnohIcon,
  unova: unovaIcon,
  kalos: kalosIcon,
  secretos: allRegionsIcon,
};

export const PokedexSectionHeader = ({
  sectionId,
  sectionName,
  currentCount,
  totalCount,
}: PokedexSectionHeaderProps) => {
  const { t } = useTranslation('modals');
  
  const percentage = totalCount > 0 ? Math.round((currentCount / totalCount) * 100) : 0;
  const icon = regionIcons[sectionId] || allRegionsIcon;

  return (
    <div className="flex flex-col gap-3 mb-4">
      {/* Title with icon */}
      <div className="flex items-center gap-3">
        <img 
          src={icon} 
          alt={sectionName} 
          className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-lg"
        />
        <h3 className="text-lg sm:text-xl font-bold text-yellow-400 tracking-wide">
          🎁 {t('pokedex.rewardsOf')} {sectionName.toUpperCase()}
        </h3>
      </div>
      
      {/* Progress bar with stats */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Progress
            value={percentage}
            className="h-3 sm:h-4 bg-gray-800/80 border border-gray-700"
            indicatorClassName={cn(
              'transition-all duration-500',
              percentage >= 100 
                ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.6)]'
                : percentage >= 50
                ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                : 'bg-gradient-to-r from-blue-400 to-cyan-500'
            )}
          />
        </div>
        
        <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-lg border border-gray-700">
          <span className={cn(
            'font-bold text-sm sm:text-base',
            percentage >= 100 ? 'text-yellow-400' : 'text-white'
          )}>
            {currentCount}/{totalCount}
          </span>
          <span className={cn(
            'font-medium text-xs sm:text-sm',
            percentage >= 100 ? 'text-yellow-400/80' : 'text-gray-400'
          )}>
            ({percentage}%)
          </span>
        </div>
      </div>
    </div>
  );
};
