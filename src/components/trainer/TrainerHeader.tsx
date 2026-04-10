import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTrainerModeContext } from '@/contexts/TrainerModeContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import pokecoinIcon from '@/assets/pokecoin.png';
import pokegemIcon from '@/assets/pokegem.png';
import pokeroulletLogo from '@/assets/pokeroullet-logo.png';

const TrainerHeader = () => {
  const { t } = useTranslation('trainer');
  const navigate = useNavigate();
  const { pokegems, pokecoins } = useTrainerModeContext();
  const isMobile = useIsMobile();

  console.log('[TrainerHeader] Rendering with pokegems:', pokegems, 'pokecoins:', pokecoins);
  
  return (
    <header className="sticky top-0 z-50 w-full bg-zinc-900/95 backdrop-blur border-b border-zinc-700/50">
      <div className={cn(
        "max-w-7xl mx-auto flex items-center justify-between",
        isMobile ? "px-2 py-2" : "px-4 py-3"
      )}>
        {/* Left - Logo and Back */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className={cn(
              "text-zinc-400 hover:text-white hover:bg-zinc-800",
              isMobile && "p-2"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            {!isMobile && <span className="ml-2">{t('mode.collector')}</span>}
          </Button>
          
          {!isMobile && (
            <div className="flex items-center gap-2">
              <img src={pokeroulletLogo} alt="PokeRoullet" className="h-8" />
              <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30">
                <Sparkles className="h-3 w-3 text-purple-400" />
                <span className="text-xs font-medium text-purple-300">{t('mode.trainerMode')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right - Currencies */}
        <div className="flex items-center gap-1.5 sm:gap-4">
          {/* PokeCoins */}
          <div className={cn(
            "flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-full border border-amber-500/30",
            isMobile ? "px-2 py-1" : "px-3 py-1.5"
          )}>
            <img src={pokecoinIcon} alt="PokeCoins" className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />
            <span className={cn(
              "font-bold text-amber-400",
              isMobile ? "text-xs" : "text-sm"
            )}>
              {isMobile ? (pokecoins >= 1000 ? `${(pokecoins / 1000).toFixed(1)}k` : pokecoins?.toLocaleString() || 0) : (pokecoins?.toLocaleString() || 0)}
            </span>
          </div>

          {/* PokeGems */}
          <div className={cn(
            "flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full border border-pink-500/30",
            isMobile ? "px-2 py-1" : "px-3 py-1.5"
          )}>
            <img src={pokegemIcon} alt="PokeGems" className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />
            <span className={cn(
              "font-bold text-pink-400",
              isMobile ? "text-xs" : "text-sm"
            )} data-testid="pokegems-display">
              {isMobile ? (pokegems >= 1000 ? `${(pokegems / 1000).toFixed(1)}k` : pokegems?.toLocaleString() || 0) : (pokegems?.toLocaleString() || 0)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TrainerHeader;
