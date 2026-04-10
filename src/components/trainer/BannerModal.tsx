import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Star, Sparkles, Coins, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBanner, type SummonResult } from '@/hooks/useBanner';
import { useProfile } from '@/hooks/useProfile';
import { TYPE_COLORS, type PokemonType } from '@/data/typeAdvantages';
import pokecoinIcon from '@/assets/pokecoin.png';

interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STAR_COLORS: Record<number, string> = {
  1: 'text-gray-400',
  2: 'text-green-400',
  3: 'text-blue-400',
  4: 'text-purple-400',
  5: 'text-yellow-400',
  6: 'text-pink-400',
};

const BannerModal = ({ isOpen, onClose }: BannerModalProps) => {
  const { t } = useTranslation('trainer');
  const { profile, loadProfile } = useProfile();
  
  // Callback to refresh data after summons
  const handleDataChange = async () => {
    await loadProfile();
  };
  
  const {
    bannerSlots,
    rotationTimeFormatted,
    isSummoning,
    lastSummonResult,
    summonSingle,
    summonMulti,
    clearSummonResult,
    SUMMON_COST_SINGLE,
    SUMMON_COST_MULTI,
  } = useBanner(handleDataChange);

  const [showResult, setShowResult] = useState(false);

  const handleSummonSingle = async () => {
    const result = await summonSingle(profile?.pokecoins || 0);
    if (result) {
      setShowResult(true);
    }
  };

  const handleSummonMulti = async () => {
    const results = await summonMulti(profile?.pokecoins || 0);
    if (results) {
      setShowResult(true);
    }
  };

  const handleCloseResult = () => {
    setShowResult(false);
    clearSummonResult();
  };

  const canAffordSingle = (profile?.pokecoins || 0) >= SUMMON_COST_SINGLE;
  const canAffordMulti = (profile?.pokecoins || 0) >= SUMMON_COST_MULTI;

  // Summon Result View
  if (showResult && lastSummonResult) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-gradient-to-b from-gray-900 to-black border-2 border-pokemon-yellow/50 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-pokemon text-center text-pokemon-yellow">
              {t('banner.summonResult')}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {lastSummonResult.map((result, index) => (
              <SummonResultCard key={index} result={result} delay={index * 200} />
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <Button
              onClick={handleCloseResult}
              className="bg-pokemon-yellow text-black font-bold hover:bg-pokemon-yellow/80"
            >
              {t('battle.continue')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-b from-gray-900 via-purple-900/20 to-black border-2 border-purple-500/50 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-pokemon text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {t('banner.title')}
          </DialogTitle>
        </DialogHeader>

        {/* Rotation Timer */}
        <div className="flex items-center justify-center gap-2 text-white/80 mb-4">
          <Clock className="h-4 w-4 text-purple-400" />
          <span className="text-sm">{t('banner.rotation')}</span>
          <span className="font-mono text-purple-400 font-bold">{rotationTimeFormatted}</span>
        </div>

        {/* Banner Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {bannerSlots.map((slot, index) => {
            const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${slot.pokemon.id}.png`;
            const typeColor = TYPE_COLORS[slot.pokemon.type as PokemonType] || '#A8A878';
            const is5Star = slot.pokemon.starRating === 5;
            const is4Star = slot.pokemon.starRating === 4;

            return (
              <div
                key={index}
                className={cn(
                  "relative p-3 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] overflow-hidden group",
                  is5Star
                    ? "border-yellow-400 bg-gradient-to-br from-yellow-900/60 via-amber-900/50 to-orange-900/50 shadow-xl shadow-yellow-500/40 animate-pulse-subtle"
                    : is4Star
                    ? "border-purple-400/60 bg-gradient-to-br from-purple-900/40 to-pink-900/30 shadow-lg shadow-purple-500/30"
                    : "border-white/30 bg-gradient-to-br from-slate-800/80 to-slate-900/80 hover:border-white/50"
                )}
                style={{ 
                  borderColor: is5Star || is4Star ? undefined : `${typeColor}60`,
                  boxShadow: is5Star || is4Star ? undefined : `0 4px 12px ${typeColor}30`
                }}
              >
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }} />
                </div>

                {/* Shimmer effect for 5-star */}
                {is5Star && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                )}

                {/* Star Rating with glow */}
                <div className="relative flex gap-0.5 mb-2 z-10">
                  {Array.from({ length: slot.pokemon.starRating }).map((_, i) => (
                    <div key={i} className="relative">
                      <Star
                        className={cn("h-3.5 w-3.5 fill-current drop-shadow-lg", STAR_COLORS[slot.pokemon.starRating])}
                      />
                      {is5Star && (
                        <Star className="h-3.5 w-3.5 fill-current absolute inset-0 blur-sm opacity-50 animate-pulse" style={{ color: STAR_COLORS[5].replace('text-', '') }} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Chance badge */}
                <div className="absolute top-2 right-2 text-[10px] text-white font-bold bg-gradient-to-r from-black/80 to-black/60 px-2 py-1 rounded-lg backdrop-blur-sm border border-white/20 z-10">
                  {slot.pokemon.bannerChance}%
                </div>

                {/* Pokemon Sprite with enhanced effects */}
                <div className="relative flex justify-center my-3 z-10">
                  {/* Glow behind sprite */}
                  <div 
                    className="absolute inset-0 blur-xl opacity-40 scale-75"
                    style={{ 
                      background: `radial-gradient(circle, ${typeColor}80 0%, transparent 70%)`
                    }}
                  />
                  
                  {/* Rotating ring for high rarity */}
                  {(is5Star || is4Star) && (
                    <div 
                      className="absolute inset-0 rounded-full opacity-20"
                      style={{ 
                        background: `conic-gradient(from 0deg, ${typeColor}, transparent, ${typeColor})`,
                        animation: 'spin 6s linear infinite'
                      }}
                    />
                  )}

                  <img
                    src={spriteUrl}
                    alt={slot.pokemon.name}
                    className={cn(
                      "relative w-16 h-16 pixelated transition-all duration-300 group-hover:scale-110",
                      is5Star && "drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] animate-float",
                      is4Star && "drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]"
                    )}
                    loading="lazy"
                    style={{ imageRendering: 'pixelated' }}
                  />

                  {/* Sparkles for legendary */}
                  {is5Star && (
                    <>
                      <Sparkles className="absolute top-0 right-0 h-3 w-3 text-yellow-300 animate-ping" style={{ animationDuration: '2s' }} />
                      <Sparkles className="absolute bottom-0 left-0 h-3 w-3 text-pink-300 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                    </>
                  )}
                </div>

                {/* Name and Type */}
                <div className="relative text-center space-y-1.5 z-10">
                  <p className="text-xs font-bold text-white capitalize drop-shadow-lg">{slot.pokemon.name}</p>
                  <span
                    className="text-[10px] px-2.5 py-1 rounded-full text-white inline-block font-bold shadow-lg border border-white/20"
                    style={{ 
                      backgroundColor: typeColor,
                      boxShadow: `0 2px 8px ${typeColor}60`
                    }}
                  >
                    {slot.pokemon.type}
                  </span>
                </div>

                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    boxShadow: `inset 0 0 20px ${typeColor}40`
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Secret Mew Hint */}
        <div className="text-center text-xs text-pink-400/60 mb-4">
          <Sparkles className="h-3 w-3 inline mr-1" />
          ??? - 0.5% {t('banner.chance', { percent: 0.5 })}
        </div>

        {/* Coins Display */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <img src={pokecoinIcon} alt="PokéCoins" className="h-6 w-6" />
          <span className="text-lg font-bold text-pokemon-yellow">
            {profile?.pokecoins?.toLocaleString() || 0}
          </span>
        </div>

        {/* Summon Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* Single Summon Button */}
          <Button
            onClick={handleSummonSingle}
            disabled={isSummoning || !canAffordSingle}
            className={cn(
              "flex items-center justify-center gap-2 px-8 py-4 font-bold transition-all duration-300 relative rounded-xl overflow-hidden group",
              canAffordSingle
                ? "bg-gradient-to-br from-purple-600 via-purple-500 to-pink-600 hover:from-purple-500 hover:via-purple-400 hover:to-pink-500 text-white shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 border border-purple-400/30 hover:border-purple-300/60"
                : "bg-gray-700 text-gray-400 cursor-not-allowed opacity-60"
            )}
          >
            {/* Animated background shimmer */}
            {canAffordSingle && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            )}
            
            {/* Content */}
            <div className="relative flex items-center gap-3 z-10">
              <div className={cn(
                "p-2 rounded-lg transition-all duration-300",
                canAffordSingle ? "bg-purple-400/30 group-hover:bg-purple-300/40" : ""
              )}>
                <Coins className="h-5 w-5" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold opacity-90">{t('banner.summon1x')}</span>
                <span className="text-lg font-bold">{SUMMON_COST_SINGLE}</span>
              </div>
            </div>

            {/* Pulse effect on hover */}
            {canAffordSingle && (
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 blur transition-opacity duration-300 -z-10" />
            )}
          </Button>

          {/* Multi Summon Button */}
          <div className="relative group">
            <Button
              onClick={handleSummonMulti}
              disabled={isSummoning || !canAffordMulti}
              className={cn(
                "flex items-center justify-center gap-2 px-8 py-4 font-bold transition-all duration-300 relative rounded-xl overflow-hidden w-full",
                canAffordMulti
                  ? "bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600 hover:from-amber-400 hover:via-yellow-400 hover:to-orange-500 text-white shadow-lg hover:shadow-2xl hover:shadow-amber-500/50 border border-amber-400/40 hover:border-amber-300/70"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed opacity-60"
              )}
            >
              {/* Animated background shimmer */}
              {canAffordMulti && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-40 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              )}
              
              {/* Content */}
              <div className="relative flex items-center gap-3 z-10">
                <div className={cn(
                  "p-2 rounded-lg transition-all duration-300",
                  canAffordMulti ? "bg-amber-400/30 group-hover:bg-amber-300/40" : ""
                )}>
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold opacity-90">{t('banner.summon5x')}</span>
                  <span className="text-lg font-bold">{SUMMON_COST_MULTI}</span>
                </div>
              </div>

              {/* Pulse effect on hover */}
              {canAffordMulti && (
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 opacity-0 group-hover:opacity-20 blur transition-opacity duration-300 -z-10" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Summon Result Card Component
const SummonResultCard = ({ result, delay }: { result: SummonResult; delay: number }) => {
  const { t } = useTranslation('trainer');
  const [isRevealed, setIsRevealed] = useState(false);

  // Reveal animation with delay
  useState(() => {
    const timer = setTimeout(() => setIsRevealed(true), delay);
    return () => clearTimeout(timer);
  });

  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${result.pokemon.id}.png`;
  const typeColor = TYPE_COLORS[result.pokemon.type as PokemonType] || '#A8A878';
  const is5Star = result.pokemon.starRating >= 5;

  const STAT_COLORS: Record<string, string> = {
    'S': 'text-yellow-400',
    'A': 'text-purple-400',
    'B': 'text-blue-400',
    'C': 'text-green-400',
    'D': 'text-gray-400',
  };

  const STAT_BG: Record<string, string> = {
    'S': 'bg-yellow-500/20 border-yellow-500/30',
    'A': 'bg-purple-500/20 border-purple-500/30',
    'B': 'bg-blue-500/20 border-blue-500/30',
    'C': 'bg-green-500/20 border-green-500/30',
    'D': 'bg-gray-500/20 border-gray-500/30',
  };

  return (
    <div
      className={cn(
        "relative p-5 rounded-2xl border-2 transition-all duration-500 transform overflow-hidden",
        isRevealed ? "scale-100 opacity-100" : "scale-90 opacity-0",
        is5Star
          ? "border-yellow-400 bg-gradient-to-br from-yellow-900/60 via-amber-900/50 to-orange-900/50 shadow-2xl shadow-yellow-500/50"
          : "border-white/40 bg-gradient-to-br from-slate-800/95 to-slate-900/95 shadow-xl"
      )}
      style={{ 
        borderColor: is5Star ? undefined : `${typeColor}80`,
        boxShadow: is5Star ? undefined : `0 8px 24px ${typeColor}40`
      }}
    >
      {/* Background effects */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
      </div>

      {/* Shimmer for legendary */}
      {is5Star && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      )}

      {/* New/Duplicate Badge */}
      <div className={cn(
        "absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg backdrop-blur-sm border z-10",
        result.isNew 
          ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white border-green-400/30" 
          : "bg-gradient-to-r from-gray-700 to-gray-600 text-gray-200 border-gray-500/30"
      )}>
        {result.isNew ? '✨ ' + t('banner.newPokemon') : t('banner.duplicate')}
      </div>

      {/* Stars with glow */}
      <div className="relative flex justify-center gap-1 mb-3 z-10">
        {Array.from({ length: result.pokemon.starRating }).map((_, i) => (
          <div key={i} className="relative">
            <Star
              className={cn("h-4 w-4 fill-current drop-shadow-lg", STAR_COLORS[result.pokemon.starRating])}
            />
            {is5Star && (
              <Star className={cn("h-4 w-4 fill-current absolute inset-0 blur-sm opacity-50 animate-pulse", STAR_COLORS[result.pokemon.starRating])} />
            )}
          </div>
        ))}
      </div>

      {/* Sprite with effects */}
      <div className="relative flex justify-center my-4 z-10">
        {/* Glow */}
        <div 
          className="absolute inset-0 blur-2xl opacity-50"
          style={{ 
            background: `radial-gradient(circle, ${typeColor}90 0%, transparent 70%)`
          }}
        />
        
        {/* Ring */}
        {is5Star && (
          <div 
            className="absolute inset-0 rounded-full opacity-30"
            style={{ 
              background: `conic-gradient(from 0deg, ${typeColor}, transparent, ${typeColor})`,
              animation: 'spin 6s linear infinite'
            }}
          />
        )}

        <img
          src={spriteUrl}
          alt={result.pokemon.name}
          className={cn(
            "relative w-24 h-24 pixelated",
            is5Star && "drop-shadow-[0_0_20px_rgba(251,191,36,0.9)] animate-float"
          )}
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Particles */}
        {is5Star && (
          <>
            <Sparkles className="absolute top-0 right-2 h-4 w-4 text-yellow-300 animate-ping" style={{ animationDuration: '2s' }} />
            <Sparkles className="absolute bottom-2 left-2 h-3 w-3 text-pink-300 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
          </>
        )}
      </div>

      {/* Name */}
      <p className="relative text-center text-base font-bold text-white capitalize drop-shadow-lg z-10">
        {result.pokemon.name}
      </p>

      {/* Type */}
      <div className="relative flex justify-center mt-2 z-10">
        <span
          className="text-[11px] px-3 py-1 rounded-full text-white font-bold shadow-lg border border-white/20"
          style={{ 
            backgroundColor: typeColor,
            boxShadow: `0 2px 8px ${typeColor}70`
          }}
        >
          {result.pokemon.type}
        </span>
      </div>

      {/* Stats */}
      <div className="relative flex justify-center gap-2 mt-4 z-10">
        <div className={cn("text-center px-2 py-1.5 rounded-lg border", STAT_BG[result.statDamage])}>
          <Zap className="h-3.5 w-3.5 text-red-400 mx-auto mb-0.5" />
          <p className="text-white/70 text-[9px] mb-0.5">{t('banner.stats.damage')}</p>
          <p className={cn("font-bold text-sm", STAT_COLORS[result.statDamage])}>
            {result.statDamage}
          </p>
        </div>
        <div className={cn("text-center px-2 py-1.5 rounded-lg border", STAT_BG[result.statSpeed])}>
          <Clock className="h-3.5 w-3.5 text-blue-400 mx-auto mb-0.5" />
          <p className="text-white/70 text-[9px] mb-0.5">{t('banner.stats.speed')}</p>
          <p className={cn("font-bold text-sm", STAT_COLORS[result.statSpeed])}>
            {result.statSpeed}
          </p>
        </div>
        <div className={cn("text-center px-2 py-1.5 rounded-lg border", STAT_BG[result.statEffect])}>
          <Sparkles className="h-3.5 w-3.5 text-purple-400 mx-auto mb-0.5" />
          <p className="text-white/70 text-[9px] mb-0.5">{t('banner.stats.effect')}</p>
          <p className={cn("font-bold text-sm", STAT_COLORS[result.statEffect])}>
            {result.statEffect}
          </p>
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.01); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 3s ease-in-out infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default BannerModal;
