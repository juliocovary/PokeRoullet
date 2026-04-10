import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Gamepad2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TrainerModeToggleProps {
  currentMode: 'collector' | 'trainer';
  onModeChange: (mode: 'collector' | 'trainer') => void;
}

const TRAINER_MODE_SEEN_KEY = 'trainer_mode_seen';

const TrainerModeToggle = ({ currentMode, onModeChange }: TrainerModeToggleProps) => {
  const { t } = useTranslation('trainer');
  const [showNewBadge, setShowNewBadge] = useState(false);

  useEffect(() => {
    // Check if user has seen trainer mode before
    const hasSeenTrainerMode = localStorage.getItem(TRAINER_MODE_SEEN_KEY);
    if (!hasSeenTrainerMode) {
      setShowNewBadge(true);
    }
  }, []);

  useEffect(() => {
    // Mark as seen when user switches to trainer mode
    if (currentMode === 'trainer' && showNewBadge) {
      localStorage.setItem(TRAINER_MODE_SEEN_KEY, 'true');
      setShowNewBadge(false);
    }
  }, [currentMode, showNewBadge]);

  return (
    <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1 border border-pokemon-yellow/30">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onModeChange('collector')}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200",
          currentMode === 'collector'
            ? "bg-pokemon-yellow text-black font-bold shadow-lg"
            : "text-pokemon-yellow/70 hover:text-pokemon-yellow hover:bg-pokemon-yellow/10"
        )}
      >
        <BookOpen className="h-4 w-4" />
        <span className="hidden sm:inline text-xs">{t('mode.collector')}</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onModeChange('trainer')}
        className={cn(
          "relative flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200",
          currentMode === 'trainer'
            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg"
            : "text-purple-400/70 hover:text-purple-400 hover:bg-purple-500/10"
        )}
      >
        <Gamepad2 className="h-4 w-4" />
        <span className="hidden sm:inline text-xs">{t('mode.trainer')}</span>
        
        {/* New badge indicator */}
        {showNewBadge && currentMode !== 'trainer' && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              !
            </span>
          </span>
        )}
      </Button>
    </div>
  );
};

export default TrainerModeToggle;
