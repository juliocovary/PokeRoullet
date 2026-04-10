import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSpinTimer } from '@/hooks/useSpinTimer';
import { useAffiliateBonus } from '@/hooks/useAffiliateBonus';
import { useBadges } from '@/hooks/useBadges';
import { useRouletteBoosts } from '@/hooks/useRouletteBoosts';
import { BadgeSlotsPanel } from '@/components/BadgeSlotsPanel';
import { RarityPokeball } from '@/components/RarityPokeball';
import { RouletteBoostsModal } from '@/components/RouletteBoostsModal';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Gift, Loader2, Zap } from 'lucide-react';
import pokeballIcon from '@/assets/pokeball_icon.png';
import masterballIcon from '@/assets/masterball.png';

interface RouletteWheelProps {
  onSpin: () => void;
  onMultiSpin?: () => void;
  isSpinning: boolean;
  freeSpins: number;
  baseSpins?: number;
  userLevel?: number;
  eventButton?: React.ReactNode;
  newsButton?: React.ReactNode;
  onRefresh?: () => void;
}
export const RouletteWheel = ({
  onSpin,
  onMultiSpin,
  isSpinning,
  freeSpins,
  baseSpins,
  userLevel = 1,
  eventButton,
  newsButton,
  onRefresh
}: RouletteWheelProps) => {
  const {
    t
  } = useTranslation('game');
  const {
    isTimerActive,
    formattedTime
  } = useSpinTimer(freeSpins, baseSpins, onRefresh);
  const {
    canClaim: canClaimAffiliate,
    isLoading: isAffiliateLoading,
    timeRemaining: affiliateTimeRemaining,
    shouldShowButton: shouldShowAffiliateButton,
    claimBonus
  } = useAffiliateBonus(freeSpins, onRefresh);
  const {
    equippedBadges,
    availableBadges,
    buffs,
    loading: badgesLoading,
    equipBadge,
    unequipBadge
  } = useBadges(onRefresh);
  const { activeBoosts, getCompletedCount, getTotalBoosts } = useRouletteBoosts(onRefresh);
  const [rotation, setRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSlowingDown, setIsSlowingDown] = useState(false);
  const [isBoostsModalOpen, setIsBoostsModalOpen] = useState(false);
  const handleClaimAffiliate = async () => {
    const result = await claimBonus();
    if (result.success) {
      toast({
        title: t('roulette.affiliateBonusSuccess'),
        description: t('roulette.affiliateBonusDescription')
      });
    } else if (result.error === 'cooldown_active') {
      toast({
        title: t('roulette.affiliateCooldown'),
        description: t('roulette.affiliateCooldownDescription', {
          time: affiliateTimeRemaining
        }),
        variant: "destructive"
      });
    }
  };

  // Trigger animation when isSpinning becomes true (for multi-spin)
  useEffect(() => {
    if (isSpinning && !isAnimating) {
      setIsAnimating(true);

      // Calculate rotation
      const fullRotations = 12 + Math.floor(Math.random() * 7);
      const targetRotation = fullRotations * 360;
      const currentPosition = rotation % 360;
      const rotationToAdd = targetRotation - currentPosition + Math.floor(rotation / 360) * 360;
      setRotation(rotation + rotationToAdd);

      // Trigger slowing down effect near the end
      setTimeout(() => setIsSlowingDown(true), 3500);
    }
  }, [isSpinning]);

  // Reset animation states when spinning stops
  useEffect(() => {
    if (!isSpinning && isAnimating) {
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setIsSlowingDown(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isSpinning, isAnimating]);
  const handleSpin = () => {
    if (freeSpins <= 0) {
      toast({
        title: t('roulette.noSpins'),
        description: `${t('roulette.nextReset')} ${formattedTime}`,
        variant: "destructive"
      });
      return;
    }

    // Haptic feedback for mobile
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50]);
    }
    setIsAnimating(true);

    // Calculate base rotations (12-18 full spins for longer animation)
    const fullRotations = 12 + Math.floor(Math.random() * 7);
    const targetRotation = fullRotations * 360;
    const currentPosition = rotation % 360;
    const rotationToAdd = targetRotation - currentPosition + Math.floor(rotation / 360) * 360;
    setRotation(rotation + rotationToAdd);

    // Trigger slowing down effect near the end
    setTimeout(() => setIsSlowingDown(true), 3500);
    onSpin();
  };
  return <div className="flex flex-col items-center space-y-6 md:space-y-10 py-4">
      {/* Free Spins Counter with Event/News Buttons on sides */}
      <div className="flex items-center justify-center gap-3 w-full max-w-sm">
        {/* Event Button - Left side */}
        <div className="w-14 flex justify-center flex-shrink-0">
          {eventButton}
        </div>
        
        {/* Spins Counter - Center */}
        <Card className="relative overflow-hidden border-2 border-accent/30 bg-gradient-to-br from-card via-card to-accent/5 px-6 md:px-8 py-4 md:py-5 shadow-2xl flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/10 to-transparent animate-pulse" />
          <div className="relative text-center space-y-1">
            <p className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('roulette.availableSpins')}</p>
            <p className="text-4xl md:text-5xl font-black bg-gradient-to-br from-accent via-yellow-400 to-accent bg-clip-text text-transparent drop-shadow-lg">{freeSpins}</p>
          </div>
        </Card>
        
        {/* News Button - Right side */}
        <div className="w-14 flex justify-center flex-shrink-0">
          {newsButton}
        </div>
      </div>

      {/* Roulette Wheel */}
      <div className="relative">
        {/* Sparkle particles during spin */}
        {isAnimating && <div className="absolute inset-0 pointer-events-none z-50">
            {[...Array(10)].map((_, i) => <div key={i} className="absolute w-2 h-2 rounded-full animate-roulette-sparkle" style={{
          left: `${50 + 52 * Math.cos(i * Math.PI * 2 / 10)}%`,
          top: `${50 + 52 * Math.sin(i * Math.PI * 2 / 10)}%`,
          animationDelay: `${i * 0.15}s`,
          background: i % 2 === 0 ? 'linear-gradient(135deg, hsl(var(--accent)), hsl(45, 100%, 60%))' : 'linear-gradient(135deg, hsl(45, 100%, 70%), hsl(var(--accent)))',
          boxShadow: '0 0 8px hsl(var(--accent) / 0.8)'
        }} />)}
          </div>}

        {/* Wheel Container */}
        <div className={`relative w-72 h-72 md:w-96 md:h-96 rounded-full transition-all duration-300 ${isAnimating ? 'animate-roulette-glow' : ''} ${isSlowingDown ? 'animate-roulette-anticipation' : ''}`}>
          
          {/* Pointer - Animated during spin */}
          <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 z-40 transition-all duration-200 ${isAnimating ? 'animate-pointer-bounce' : ''}`}>
            <div className={`w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent drop-shadow-lg transition-colors duration-300 ${isSlowingDown ? 'border-b-red-500' : 'border-b-accent'}`} />
            {isAnimating && <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-accent/50 rounded-full animate-ping" />}
          </div>

          {/* Tick marks around the wheel */}
          <div className="absolute inset-0 rounded-full pointer-events-none">
            {[...Array(24)].map((_, i) => <div key={i} className="absolute w-1 h-2 bg-gray-800/40 rounded-full" style={{
            left: '50%',
            top: '4px',
            transformOrigin: '50% 140px',
            transform: `translateX(-50%) rotate(${i * 15}deg)`
          }} />)}
          </div>

          {/* Main Wheel */}
          <div className={`relative w-full h-full transition-transform duration-[4000ms] ${isAnimating ? 'will-change-transform' : ''}`} style={{
          transform: `rotate(${rotation}deg)`,
          transitionTimingFunction: 'cubic-bezier(0.12, 0.8, 0.18, 1.0)'
        }}>
            {/* Colored background with soft tones */}
            <div className="absolute inset-0 rounded-full shadow-2xl border border-gray-200 overflow-hidden">
              {/* Top half - Soft red */}
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-red-400/80 to-red-500/70" />
              
              {/* Bottom half - Soft white/cream */}
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-gray-50 to-white" />
              
              {/* Subtle middle divider */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-800/60 transform -translate-y-1/2" />
            </div>
            
            {/* Concentric circles */}
            <div className="absolute inset-0 rounded-full border-2 border-yellow-500/30" />
            <div className="absolute inset-8 rounded-full border-2 border-yellow-400/25" />
            <div className="absolute inset-16 rounded-full border border-blue-400/20" />
            
            {/* Center Pokéball - Clean design */}
            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 md:w-24 md:h-24 rounded-full shadow-xl z-50 transition-transform duration-300 ${isSlowingDown ? 'scale-110' : ''}`}>
              {/* Top half - Red */}
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-red-500 to-red-600 rounded-t-full" />
              
              {/* Bottom half - White */}
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white to-gray-50 rounded-b-full" />
              
              {/* Black middle line */}
              <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-900 transform -translate-y-1/2 z-10" />
              
              {/* Center button */}
              <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white border-4 border-gray-900 shadow-lg z-20 ${isSlowingDown ? 'animate-pulse' : ''}`}>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 rounded-full bg-gray-900" />
              </div>
            </div>
          </div>
        </div>

        {/* Outer decorative rings - faster during spin */}
        <div className="absolute -inset-4 rounded-full border border-dashed border-accent/20 animate-spin" style={{
        animationDuration: isAnimating ? '3s' : '30s'
      }} />
        <div className="absolute -inset-6 rounded-full border border-dotted border-accent/10 animate-spin" style={{
        animationDuration: isAnimating ? '4s' : '40s',
        animationDirection: 'reverse'
      }} />

        {/* Glow ring during spin */}
        {isAnimating && <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-accent/20 via-yellow-400/30 to-accent/20 blur-xl animate-pulse pointer-events-none" />}
      </div>

      {/* Buttons Container */}
      <div className="flex flex-col items-center space-y-3">
        {/* Affiliate Bonus Button - Only shows when freeSpins is 0 and can claim */}
        {shouldShowAffiliateButton && canClaimAffiliate && <Button onClick={handleClaimAffiliate} disabled={isAffiliateLoading} className="relative group text-sm md:text-lg lg:text-xl px-6 md:px-10 lg:px-12 py-4 md:py-5 lg:py-6 hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl overflow-hidden bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:via-green-400 hover:to-emerald-500 border-2 border-emerald-300/50 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            {isAffiliateLoading ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 mr-2 animate-spin" /> : <Gift className="w-5 h-5 md:w-6 md:h-6 mr-2 drop-shadow-md" />}
            <span className="relative whitespace-nowrap font-bold tracking-wide text-white drop-shadow-lg">
              {t('roulette.affiliateBonus')}
            </span>
          </Button>}

        {/* Affiliate Cooldown Display - Shows when button is on cooldown */}
        {shouldShowAffiliateButton && !canClaimAffiliate && affiliateTimeRemaining && <div className="text-center px-4 py-2 bg-muted/50 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground">
              {t('roulette.affiliateNextBonus')} <span className="font-mono font-bold text-foreground">{affiliateTimeRemaining}</span>
            </p>
          </div>}

        {/* Spin Button - Hide when affiliate button is showing */}
        {!(shouldShowAffiliateButton && canClaimAffiliate) && <Button onClick={handleSpin} disabled={isSpinning || freeSpins <= 0} className="relative group btn-casino text-sm md:text-lg lg:text-xl px-6 md:px-10 lg:px-12 py-4 md:py-5 lg:py-6 hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <img src={pokeballIcon} alt="Pokebola" className="w-5 h-5 md:w-6 md:h-6 mr-2 drop-shadow-md" />
            <span className="relative whitespace-nowrap font-bold tracking-wide">{isSpinning ? t('roulette.spinning') : freeSpins <= 0 ? t('roulette.noSpins') : t('roulette.spinButton')}</span>
          </Button>}

        {/* Multi Spin Button - Masterball design */}
        <Button onClick={onMultiSpin} disabled={isSpinning || freeSpins <= 0 || userLevel < 5} className={`relative group text-xs md:text-sm px-4 md:px-6 py-2.5 md:py-3.5 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden border-2 ${userLevel >= 5 ? 'bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 border-purple-400/50 hover:from-purple-500 hover:via-purple-600 hover:to-indigo-700' : 'bg-muted border-muted-foreground/30 cursor-not-allowed'}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <img src={userLevel >= 5 ? masterballIcon : pokeballIcon} alt={userLevel >= 5 ? "Masterball" : "Bloqueado"} className="w-4 h-4 md:w-5 md:h-5 mr-1.5 drop-shadow-md" />
          <span className="relative whitespace-nowrap font-black tracking-wider text-white uppercase" style={{
          fontFamily: 'Impact, sans-serif',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>
            {userLevel < 5 ? t('roulette.locked') : isSpinning ? t('roulette.spinning') : t('roulette.multiSpin')}
          </span>
        </Button>
      </div>

      
      
      {/* Timer Display - Tamanho e espaçamento reduzidos */}
      {freeSpins === 0 && isTimerActive && <Card className="relative overflow-hidden border-2 border-accent/30 bg-gradient-to-br from-card via-background to-card p-4 md:p-6 w-full max-w-md shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-yellow-400/10 to-accent/5 animate-pulse" />
          <div className="relative text-center space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
              <h3 className="text-base md:text-lg font-bold bg-gradient-to-r from-accent via-yellow-400 to-accent bg-clip-text text-transparent">{t('roulette.resetTimer')}</h3>
              <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            </div>
            <div className="bg-gradient-to-r from-accent/20 via-yellow-400/20 to-accent/20 rounded-lg p-4 md:p-5 border border-accent/30 shadow-lg">
              <p className="text-xs md:text-sm text-muted-foreground mb-2 font-medium">{t('roulette.nextReset')}</p>
              <div className="text-3xl md:text-4xl font-mono font-bold bg-gradient-to-br from-accent via-yellow-300 to-accent bg-clip-text text-transparent tracking-wider">
                {formattedTime}
              </div>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
              <p className="text-xs text-muted-foreground font-medium">{t('roulette.waitReset', {
              count: baseSpins || 5
            })}</p>
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </Card>}

      {/* Impulsos Button */}
      <Card 
        className="relative overflow-hidden border border-accent/30 bg-gradient-to-br from-accent/10 via-background to-yellow-500/10 p-3 w-full max-w-md shadow-lg cursor-pointer hover:border-accent/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
        onClick={() => setIsBoostsModalOpen(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-accent/20 to-yellow-500/20">
              <Zap className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h4 className="font-bold text-sm">{t('roulette.boostsTitle')}</h4>
              <p className="text-xs text-muted-foreground">
                {t('roulette.boostsUnlocked', { completed: getCompletedCount(), total: getTotalBoosts() })}
              </p>
            </div>
          </div>
          
          {/* Active Boosts Preview */}
          <div className="flex items-center gap-1.5">
            {activeBoosts.shiny_chance > 0 && (
              <span className="text-xs font-bold text-yellow-400 bg-yellow-500/20 px-2 py-0.5 rounded">
                +{activeBoosts.shiny_chance}% Shiny ✨
              </span>
            )}
            {activeBoosts.luck_bonus > 0 && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                +{activeBoosts.luck_bonus}% 🍀
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Badge Slots Panel */}
      <BadgeSlotsPanel equippedBadges={equippedBadges} availableBadges={availableBadges} buffs={buffs} onEquip={equipBadge} onUnequip={unequipBadge} loading={badgesLoading} />

      {/* Probability Display - Enhanced Design */}
      <Card className="relative overflow-hidden border border-accent/30 bg-gradient-to-br from-card via-background to-card p-4 md:p-5 w-full max-w-md shadow-lg">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />
        
        <h3 className="relative font-bold text-center mb-4 text-sm md:text-base bg-gradient-to-r from-accent via-yellow-400 to-accent bg-clip-text text-transparent">
          {t('roulette.dropChances')}
        </h3>
        
        <div className="relative grid grid-cols-2 gap-2 md:gap-2.5">
          {/* Legendary */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/15 via-amber-400/10 to-transparent rounded-lg p-2 md:p-2.5 border border-yellow-400/30 hover:border-yellow-400/50 transition-colors">
            <RarityPokeball rarity="legendary" size="md" />
            <div className="flex-1 flex justify-between items-center">
              <span className="font-semibold text-xs md:text-sm text-accent">{t('rarities.legendary')}</span>
              <span className="font-bold text-xs md:text-sm text-yellow-400">0.1%</span>
            </div>
          </div>
          
          {/* Starter */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500/15 via-amber-400/10 to-transparent rounded-lg p-2 md:p-2.5 border border-orange-400/30 hover:border-orange-400/50 transition-colors">
            <RarityPokeball rarity="starter" size="md" />
            <div className="flex-1 flex justify-between items-center">
              <span className="font-semibold text-xs md:text-sm text-orange-600">{t('rarities.starter')}</span>
              <span className="font-bold text-xs md:text-sm text-orange-400">0.5%</span>
            </div>
          </div>
          
          {/* Pseudo */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-orange-600/15 via-red-500/10 to-transparent rounded-lg p-2 md:p-2.5 border border-orange-500/30 hover:border-orange-500/50 transition-colors">
            <RarityPokeball rarity="pseudo" size="md" />
            <div className="flex-1 flex justify-between items-center">
              <span className="font-semibold text-xs md:text-sm text-destructive">{t('rarities.pseudo')}</span>
              <span className="font-bold text-xs md:text-sm text-orange-500">1%</span>
            </div>
          </div>
          
          {/* Rare */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-transparent rounded-lg p-2 md:p-2.5 border border-purple-400/30 hover:border-purple-400/50 transition-colors">
            <RarityPokeball rarity="rare" size="md" />
            <div className="flex-1 flex justify-between items-center">
              <span className="font-semibold text-xs md:text-sm text-violet-600">{t('rarities.rare')}</span>
              <span className="font-bold text-xs md:text-sm text-purple-400">10%</span>
            </div>
          </div>
          
          {/* Uncommon */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/15 via-blue-400/10 to-transparent rounded-lg p-2 md:p-2.5 border border-blue-400/30 hover:border-blue-400/50 transition-colors">
            <RarityPokeball rarity="uncommon" size="md" />
            <div className="flex-1 flex justify-between items-center">
              <span className="font-semibold text-xs md:text-sm text-primary">{t('rarities.uncommon')}</span>
              <span className="font-bold text-xs md:text-sm text-blue-400">25%</span>
            </div>
          </div>
          
          {/* Common */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-green-500/15 via-green-400/10 to-transparent rounded-lg p-2 md:p-2.5 border border-green-400/30 hover:border-green-400/50 transition-colors">
            <RarityPokeball rarity="common" size="md" />
            <div className="flex-1 flex justify-between items-center">
              <span className="font-semibold text-xs md:text-sm text-lime-700">{t('rarities.common')}</span>
              <span className="font-bold text-xs md:text-sm text-green-400">65%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Boosts Modal */}
      <RouletteBoostsModal 
        isOpen={isBoostsModalOpen} 
        onClose={() => setIsBoostsModalOpen(false)} 
        onRefresh={onRefresh}
      />
    </div>;
};