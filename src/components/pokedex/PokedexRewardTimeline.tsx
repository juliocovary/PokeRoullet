import { Check, Lock, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineMilestone {
  milestone: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

interface PokedexRewardTimelineProps {
  milestones: TimelineMilestone[];
  currentProgress: number;
}

export const PokedexRewardTimeline = ({
  milestones,
  currentProgress,
}: PokedexRewardTimelineProps) => {
  return (
    <div className="flex items-center justify-between gap-1 px-2 py-3 bg-gray-900/50 rounded-lg border border-gray-700/50 mb-4 overflow-x-auto">
      {milestones.map((item, index) => {
        const isAvailable = item.isCompleted && !item.isClaimed;
        const isLast = index === milestones.length - 1;
        
        return (
          <div key={item.milestone} className="flex items-center flex-1">
            {/* Milestone node */}
            <div className="flex flex-col items-center gap-1 min-w-[48px]">
              <div className={cn(
                'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all',
                {
                  // Claimed
                  'bg-emerald-500/80 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)]': item.isClaimed,
                  // Available
                  'bg-yellow-500/80 border-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.5)] animate-pulse': isAvailable,
                  // Locked
                  'bg-gray-700/60 border-gray-600': !item.isCompleted,
                }
              )}>
                {item.isClaimed ? (
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                ) : isAvailable ? (
                  <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-900" />
                ) : (
                  <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                )}
              </div>
              
              <span className={cn(
                'text-[10px] sm:text-xs font-bold',
                {
                  'text-emerald-400': item.isClaimed,
                  'text-yellow-400': isAvailable,
                  'text-gray-500': !item.isCompleted,
                }
              )}>
                {item.milestone}
              </span>
            </div>
            
            {/* Connector line */}
            {!isLast && (
              <div className="flex-1 h-0.5 mx-1 relative">
                <div className="absolute inset-0 bg-gray-700/60 rounded-full" />
                <div 
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
                    item.isClaimed 
                      ? 'bg-emerald-500 shadow-[0_0_4px_rgba(52,211,153,0.5)]' 
                      : 'bg-gray-600'
                  )}
                  style={{ 
                    width: item.isClaimed ? '100%' : 
                           item.isCompleted ? '50%' : '0%' 
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
