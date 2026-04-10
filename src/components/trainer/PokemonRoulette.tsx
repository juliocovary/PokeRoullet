import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Star, Sparkles, Loader2, RefreshCw, Zap, Crown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useBanner, type SummonResult } from '@/hooks/useBanner';
import { TYPE_COLORS, type PokemonType } from '@/data/typeAdvantages';
import pokecoinIcon from '@/assets/pokecoin.png';
import pokegemIcon from '@/assets/pokegem.png';
import type { TrainerBannerRegion } from '@/data/trainerPokemonPool';

// Animation phases for dramatic reveal
type RevealPhase = 'idle' | 'summoning' | 'silhouette' | 'flash' | 'reveal' | 'complete';

// Rarity-based styling
const STAR_STYLES: Record<number, { text: string; bg: string; border: string; glow: string }> = {
  1: { 
    text: 'text-slate-400', 
    bg: 'bg-slate-800/60', 
    border: 'border-slate-600/40',
    glow: ''
  },
  2: { 
    text: 'text-emerald-400', 
    bg: 'bg-gradient-to-br from-emerald-900/30 to-slate-800/60', 
    border: 'border-emerald-500/30',
    glow: ''
  },
  3: { 
    text: 'text-blue-400', 
    bg: 'bg-gradient-to-br from-blue-900/30 to-slate-800/60', 
    border: 'border-blue-500/40',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]'
  },
  4: { 
    text: 'text-purple-400', 
    bg: 'bg-gradient-to-br from-purple-900/40 to-indigo-900/30', 
    border: 'border-purple-500/50',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]'
  },
  5: { 
    text: 'text-amber-400', 
    bg: 'bg-gradient-to-br from-amber-900/50 to-orange-900/40', 
    border: 'border-amber-400/60',
    glow: 'shadow-[0_0_25px_rgba(251,191,36,0.4)]'
  },
  6: { 
    text: 'text-pink-400', 
    bg: 'bg-gradient-to-br from-pink-900/50 to-purple-900/40', 
    border: 'border-pink-400/60',
    glow: 'shadow-[0_0_30px_rgba(236,72,153,0.5)]'
  },
};

interface PokemonRouletteProps {
  pokecoins: number;
  pokegems: number;
  onDataChange: () => Promise<void>;
}

const PokemonRoulette = ({ pokecoins, pokegems, onDataChange }: PokemonRouletteProps) => {
  const { t } = useTranslation('trainer');
  const [selectedBanner, setSelectedBanner] = useState<TrainerBannerRegion>('kanto');
  const {
    bannerSlots,
    rotationTimeFormatted,
    isSummoning,
    isLoadingBanner,
    lastSummonResult,
    autoDeleteStars,
    toggleAutoDeleteStar,
    summonSingle,
    summonMulti,
    clearSummonResult,
    refreshBanner,
    SUMMON_COST_SINGLE,
    SUMMON_COST_MULTI,
  } = useBanner(onDataChange, selectedBanner);

  const [showResult, setShowResult] = useState(false);
  const [revealPhase, setRevealPhase] = useState<RevealPhase>('idle');
  const [showSummonAnimation, setShowSummonAnimation] = useState(false);
  const [pendingResults, setPendingResults] = useState<SummonResult[] | null>(null);
  const [showAutoDeleteMenu, setShowAutoDeleteMenu] = useState(false);

  useEffect(() => {
    setShowResult(false);
    setRevealPhase('idle');
    setShowSummonAnimation(false);
    setPendingResults(null);
    setShowAutoDeleteMenu(false);
    clearSummonResult();
  }, [selectedBanner, clearSummonResult]);

  // Check if any result is high rarity (5★ or 6★)
  const currentResults = pendingResults || lastSummonResult;
  const hasHighRarity = currentResults?.some(r => r.pokemon.starRating >= 5) ?? false;
  const hasSecret = currentResults?.some(r => r.pokemon.starRating === 6) ?? false;
  const currentCurrency = selectedBanner === 'kanto' ? pokecoins : pokegems;

  const runRevealAnimation = useCallback(async (results: SummonResult[], isHighRarity: boolean, isSecret: boolean) => {
    // Store results for animation BEFORE starting
    setPendingResults(results);
    setShowSummonAnimation(true);
    setRevealPhase('summoning');
    
    // Summoning phase - orb charging
    await new Promise(r => setTimeout(r, isHighRarity ? 1200 : 600));
    
    if (isHighRarity) {
      // Silhouette phase for high rarity
      setRevealPhase('silhouette');
      await new Promise(r => setTimeout(r, isSecret ? 1500 : 1000));
      
      // Flash phase
      setRevealPhase('flash');
      await new Promise(r => setTimeout(r, 400));
    }
    
    // Reveal phase
    setRevealPhase('reveal');
    await new Promise(r => setTimeout(r, 300));
    
    // Complete - show result cards
    setRevealPhase('complete');
    setShowResult(true);
    setShowSummonAnimation(false);
  }, []);

  const handleSummonSingle = async () => {
    const result = await summonSingle(currentCurrency);
    if (result) {
      // summonSingle returns a single SummonResult, not an array
      const results = [result];
      const isHigh = result.pokemon.starRating >= 5;
      const isSecret = result.pokemon.starRating === 6;
      await runRevealAnimation(results, isHigh, isSecret);
    }
  };

  const handleSummonMulti = async () => {
    const results = await summonMulti(currentCurrency);
    if (results && results.length > 0) {
      const isHigh = results.some(r => r.pokemon.starRating >= 5);
      const isSecret = results.some(r => r.pokemon.starRating === 6);
      await runRevealAnimation(results, isHigh, isSecret);
    }
  };

  const handleCloseResult = async () => {
    setShowResult(false);
    setRevealPhase('idle');
    setPendingResults(null);
    clearSummonResult();
  };

  const canAffordSingle = currentCurrency >= SUMMON_COST_SINGLE && !showSummonAnimation;
  const canAffordMulti = currentCurrency >= SUMMON_COST_MULTI && !showSummonAnimation;

  // Pick featured unit: prefer 5★+; otherwise highest rarity
  const featuredSlot = bannerSlots.length
    ? (bannerSlots.find((s) => s.pokemon.starRating >= 5) ??
       bannerSlots.reduce((best, cur) => cur.pokemon.starRating > best.pokemon.starRating ? cur : best, bannerSlots[0]))
    : undefined;
  const gridSlots = featuredSlot
    ? bannerSlots.filter((s) => s !== featuredSlot).slice(0, 8)
    : bannerSlots.slice(0, 8);

  // Reorder grid slots by rarity: 4★, 3★, 3★, 2★, 2★, 1★, 1★, 1★
  const orderedGridSlots = [
    ...gridSlots.filter(s => s.pokemon.starRating === 4),
    ...gridSlots.filter(s => s.pokemon.starRating === 3).slice(0, 2),
    ...gridSlots.filter(s => s.pokemon.starRating === 2),
    ...gridSlots.filter(s => s.pokemon.starRating === 1).slice(0, 3)
  ].slice(0, 8);

  // Loading state
  if (isLoadingBanner) {
    return (
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700/50 p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          <p className="text-slate-400 text-sm">{t('banner.loading')}</p>
        </div>
      </div>
    );
  }

  // Summon Animation Overlay - use pendingResults for animation
  if (showSummonAnimation && pendingResults && pendingResults.length > 0) {
    return (
      <SummonRevealAnimation 
        phase={revealPhase}
        results={pendingResults}
        hasHighRarity={hasHighRarity}
        hasSecret={hasSecret}
      />
    );
  }

  // Summon Result View - use pendingResults or lastSummonResult
  if (showResult && currentResults && currentResults.length > 0) {
    return (
      <div className={cn(
        "bg-slate-800/80 rounded-2xl border border-slate-700/50 p-6 relative overflow-hidden",
        hasHighRarity && "animate-result-glow"
      )}>
        {/* Background effects for high rarity */}
        {hasHighRarity && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10 animate-pulse" />
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-amber-400 rounded-full animate-float-particle"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${3 + Math.random() * 2}s`
                  }}
                />
              ))}
            </div>
          </>
        )}
        
        {hasSecret && (
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/15 via-purple-500/10 to-pink-500/15 animate-pulse" />
        )}

        <h3 className={cn(
          "text-xl font-bold text-center mb-4 relative z-10",
          hasSecret ? "text-pink-400 animate-pulse" : hasHighRarity ? "text-amber-400" : "text-amber-400"
        )}>
          {hasSecret ? '✨ SECRET PULL! ✨' : hasHighRarity ? '🌟 LEGENDARY! 🌟' : t('banner.summonResult')}
        </h3>

        <div className={cn(
          "grid gap-3 mb-4 relative z-10",
          currentResults.length === 1 ? "grid-cols-1 max-w-[200px] mx-auto" : "grid-cols-2 sm:grid-cols-3"
        )}>
          {currentResults.map((result, index) => (
            <SummonResultCard 
              key={index} 
              result={result} 
              delay={index * 150} 
              isHighlight={result.pokemon.starRating >= 5}
            />
          ))}
        </div>

        <Button
          onClick={handleCloseResult}
          className={cn(
            "w-full font-bold relative z-10",
            hasSecret 
              ? "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white"
              : hasHighRarity 
                ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900"
                : "bg-amber-500 hover:bg-amber-400 text-slate-900"
          )}
        >
          {t('battle.continue')}
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 rounded-2xl border border-slate-700/50 p-4 sm:p-6">
      <Tabs value={selectedBanner} onValueChange={(value) => setSelectedBanner(value as TrainerBannerRegion)} className="mb-4">
        <TabsList className="grid w-full grid-cols-2 bg-slate-900/70 border border-slate-700/60 p-1 rounded-xl">
          <TabsTrigger
            value="kanto"
            className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=inactive]:text-slate-400 font-bold"
          >
            Kanto
          </TabsTrigger>
          <TabsTrigger
            value="johto"
            className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=inactive]:text-slate-400 font-bold"
          >
            Johto
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <h3 className="text-2xl font-black text-white">{t('banner.title')}</h3>
            <div className="absolute -bottom-1 left-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full w-24"></div>
          </div>
          <button
            onClick={refreshBanner}
            className="p-1.5 hover:bg-indigo-500/30 rounded-full transition-all duration-200"
            title="Refresh banner"
          >
            <RefreshCw className="h-4 w-4 text-indigo-400 hover:rotate-180" />
          </button>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-900/80 to-indigo-900/40 rounded-full border border-indigo-500/40 shadow-lg">
          <Clock className="h-4 w-4 text-indigo-400" />
          <span className="text-sm text-indigo-300 font-bold">{t('banner.rotation')}</span>
          <span className="font-mono text-sm text-indigo-300 font-bold">{rotationTimeFormatted}</span>
        </div>
      </div>

      {/* Chance Summary */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-slate-900/60 to-slate-800/60 border border-slate-700/50 shadow-lg relative">
        <div className="flex items-center justify-between gap-3 mb-3 px-1">
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{t('banner.ratesTitle', 'Summon Rates')}</p>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAutoDeleteMenu((current) => !current)}
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-rose-400/40 text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t('banner.autoDelete.title', 'Auto Delete')}</span>
              {autoDeleteStars.length > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-rose-500/30 text-[10px]">{autoDeleteStars.length}</span>
              )}
            </button>

            {showAutoDeleteMenu && (
              <div className="absolute top-9 right-0 z-20 w-[280px] p-3 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-2xl">
                <p className="text-[11px] text-slate-300 font-semibold mb-2">
                  {t('banner.autoDelete.description', 'Selected rarities are discarded automatically and do not enter your inventory.')}
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[4, 3, 2, 1].map((star) => {
                    const isActive = autoDeleteStars.includes(star as 1 | 2 | 3 | 4);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => toggleAutoDeleteStar(star)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200',
                          isActive
                            ? 'bg-rose-600/30 text-rose-200 border-rose-400/60 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                            : 'bg-slate-800/70 text-slate-300 border-slate-600/60 hover:border-rose-400/40 hover:text-rose-200'
                        )}
                      >
                        {t('banner.autoDelete.option', { star })}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-amber-300/90 font-medium">
                  {t('banner.autoDelete.protected', '5★ and 6★ (legendary/mythic) are always protected.')}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5 text-[10px]">
          <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-slate-700/60 to-slate-600/40 text-slate-300 font-bold border border-slate-600/50 shadow-md hover:shadow-lg transition-all">★ 60%</span>
          <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-900/50 to-emerald-800/30 text-emerald-300 font-bold border border-emerald-600/50 shadow-md hover:shadow-lg transition-all">★★ 21%</span>
          <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-900/50 to-blue-800/30 text-blue-300 font-bold border border-blue-600/50 shadow-md hover:shadow-lg transition-all">★★★ 15%</span>
          <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-900/50 to-purple-800/30 text-purple-300 font-bold border border-purple-600/50 shadow-md hover:shadow-lg transition-all">★★★★ 2.5%</span>
          <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-900/60 to-orange-800/40 text-amber-300 font-bold border border-amber-600/50 shadow-md hover:shadow-lg transition-all">★★★★★ 1%</span>
        </div>
      </div>

      {/* Banner Layout: Featured left + units grid right (no scroll) */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-6 gap-3 md:gap-4 items-stretch">
        {/* Featured Area (left) */}
        <div className="md:col-span-2 relative rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-900/70 min-h-[260px] sm:min-h-[320px] md:min-h-[360px]">
          {featuredSlot && (() => {
            const f = featuredSlot;
            const fSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${f.pokemon.id}.png`;
            const fTypeColor = TYPE_COLORS[f.pokemon.type as PokemonType] || '#A8A878';
            const fStyles = STAR_STYLES[f.pokemon.starRating] || STAR_STYLES[1];
            const isLegend = f.pokemon.starRating >= 5;
            return (
              <>
                {/* Background layers: diagonal lines, dark gradients, light rays */}
                <div className="absolute inset-0">
                  {/* Dark radial vignette */}
                  <div className="absolute inset-0" style={{
                    background: 'radial-gradient(circle at 60% 50%, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0.85) 100%)'
                  }} />
                  {/* Diagonal stripes */}
                  <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{
                    backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 6px, transparent 6px, transparent 16px)'
                  }} />
                  {/* Light rays */}
                  <div className="absolute -left-10 -top-10 right-0 bottom-0 opacity-40" style={{
                    backgroundImage: `conic-gradient(from 200deg at 30% 55%, ${fTypeColor}66, transparent 30%, ${fTypeColor}22 60%, transparent 85%)`
                  }} />
                  {/* Subtle color wash */}
                  <div className="absolute inset-0" style={{
                    background: `linear-gradient(120deg, ${fTypeColor}15, transparent 40%)`
                  }} />
                </div>

                {/* Crown for 6★ */}
                {f.pokemon.starRating === 6 && (
                  <div className="absolute top-3 left-4 z-20 animate-bounce">
                    <Crown className="h-5 w-5 text-pink-400 fill-pink-400 drop-shadow" />
                  </div>
                )}

                {/* Stars Display - Top of card */}
                <div className="absolute top-3 right-3 z-20 flex gap-1.5 flex-wrap justify-end bg-gradient-to-r from-slate-900/60 to-slate-800/40 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-700/50 shadow-lg">
                  {Array.from({ length: f.pokemon.starRating }).map((_, i) => (
                    <div key={i} className="relative group">
                      <Star 
                        className={cn(
                          "h-5 w-5 fill-current transition-all duration-300 drop-shadow",
                          fStyles.text,
                          "group-hover:scale-110 animate-pulse-subtle"
                        )}
                        style={{
                          animationDelay: `${i * 100}ms`
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Big sprite, dramatic zoom and partial crop */}
                <div className="absolute inset-0 pointer-events-none">
                  <div
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 md:-translate-x-1/3 animate-hero-sway"
                    style={{
                      filter: `drop-shadow(0 16px 36px ${fTypeColor}55)`,
                      width: 'clamp(270px, 50vw, 420px)',
                      height: 'clamp(190px, 30vw, 270px)'
                    }}
                  >
                    <img
                      src={fSprite}
                      alt={f.pokemon.name}
                      className="w-full h-full pixelated select-none"
                      style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
                    />
                  </div>
                </div>

                {/* Overlay info: Name + Type */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6 z-20">
                  <div className="backdrop-blur-[2px] bg-slate-900/50 rounded-xl border border-slate-700/50 p-3 sm:p-4 mx-auto w-fit shadow-[0_0_25px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <h4 className="text-white font-extrabold text-lg sm:text-xl drop-shadow capitalize truncate max-w-[16rem] sm:max-w-[18rem]">
                        {f.pokemon.name}
                      </h4>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="px-2 py-0.5 rounded-md text-[11px] font-bold text-white border border-white/20" style={{ backgroundColor: fTypeColor }}>
                        {f.pokemon.type}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative frame */}
                <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{
                  boxShadow: `inset 0 0 0 2px rgba(255,255,255,0.06), 0 0 24px ${fTypeColor}25`
                }} />
              </>
            );
          })()}
        </div>

        {/* Units grid (right) - fixed 4x2 for 8 cards, keeps square-ish shape */}
        <div className="md:col-span-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 grid-rows-2 auto-rows-fr gap-3 sm:gap-3 md:gap-4">
        {orderedGridSlots.map((slot, index) => {
          const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${slot.pokemon.id}.png`;
          const typeColor = TYPE_COLORS[slot.pokemon.type as PokemonType] || '#A8A878';
          const styles = STAR_STYLES[slot.pokemon.starRating] || STAR_STYLES[1];
          const isHighRarity = slot.pokemon.starRating >= 5;
          const is4Star = slot.pokemon.starRating === 4;

          return (
            <div key={index} className="relative">
              {/* Wider ratio with minimum footprint to avoid tiny cards */}
              <div className="relative w-full pb-[65%] min-h-[135px] sm:min-h-[150px] md:min-h-[165px]">
                <div
                  className={cn(
                    "absolute inset-0 p-2 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] overflow-hidden group",
                    // Extra emphasis for 5★+
                    isHighRarity && "ring-1 ring-amber-300/60",
                    styles.border,
                    styles.glow,
                    isHighRarity && "animate-pulse-subtle"
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${typeColor}30 0%, ${typeColor}10 50%, ${typeColor}25 100%)`,
                    boxShadow: `0 4px 12px ${typeColor}30, inset 0 1px 0 rgba(255,255,255,0.1)`
                  }}
                >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
                  backgroundSize: '15px 15px'
                }} />
              </div>

              {/* Shimmer for legendary */}
              {isHighRarity && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
              )}

              {/* Stars with glow */}
              <div className="relative flex gap-0.5 mb-1 z-10">
                {Array.from({ length: Math.min(slot.pokemon.starRating, 3) }).map((_, i) => (
                  <div key={i} className="relative">
                    <Star className={cn("h-2.5 w-2.5 fill-current drop-shadow", styles.text)} />
                    {isHighRarity && (
                      <Star className={cn("h-2.5 w-2.5 fill-current absolute inset-0 blur-sm opacity-40 animate-pulse", styles.text)} />
                    )}
                  </div>
                ))}
                {slot.pokemon.starRating > 3 && (
                  <span className={cn("text-[9px] font-bold ml-0.5", styles.text)}>
                    +{slot.pokemon.starRating - 3}
                  </span>
                )}
              </div>

              {/* Crown for 6 star */}
              {slot.pokemon.starRating === 6 && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 animate-bounce z-10">
                  <Crown className="h-3 w-3 text-pink-400 fill-pink-400" />
                </div>
              )}

              {/* Sprite with enhanced effects */}
              <div className="relative flex justify-center py-2 z-10">
                {/* Glow */}
                <div 
                  className="absolute inset-0 blur-xl opacity-40"
                  style={{ 
                    background: `radial-gradient(circle, ${typeColor}80 0%, transparent 70%)`
                  }}
                />
                
                {/* Ring */}
                {(isHighRarity || is4Star) && (
                  <div 
                    className="absolute inset-0 rounded-full opacity-20"
                    style={{ 
                      background: `conic-gradient(from 0deg, ${typeColor}, transparent, ${typeColor})`,
                      animation: isHighRarity ? 'spin 6s linear infinite' : 'spin 10s linear infinite'
                    }}
                  />
                )}

                <div className={cn(
                  "flex items-center justify-center transition-transform",
                  isHighRarity ? "scale-110" : is4Star ? "scale-105" : "scale-100",
                  isHighRarity ? "w-16 h-16 sm:w-20 sm:h-20" : "w-14 h-14 sm:w-16 sm:h-16"
                )}>
                  <img
                    src={spriteUrl}
                    alt={slot.pokemon.name}
                    className={cn(
                      isHighRarity ? "w-14 h-14 sm:w-16 sm:h-16" : "w-12 h-12 sm:w-14 sm:h-14",
                      "pixelated transition-transform group-hover:scale-110",
                      isHighRarity && "drop-shadow-[0_0_14px_rgba(251,191,36,0.75)] animate-float"
                    )}
                    loading="lazy"
                    style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
                  />
                </div>

                {/* Sparkles */}
                {isHighRarity && (
                  <>
                    <Sparkles className="absolute top-0 right-0 h-2 w-2 text-yellow-300 animate-ping" style={{ animationDuration: '2s' }} />
                    <Sparkles className="absolute bottom-0 left-0 h-1.5 w-1.5 text-pink-300 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                  </>
                )}
              </div>

              {/* Name */}
              <p className="relative text-[10px] sm:text-xs text-center text-white font-bold truncate capitalize drop-shadow z-10">
                {slot.pokemon.name}
              </p>

              {/* Type Badge */}
              <div className="relative flex justify-center mt-1 z-10">
                <span
                  className="text-[8px] px-2 py-0.5 rounded-full text-white font-bold shadow border border-white/20"
                  style={{ 
                    backgroundColor: typeColor,
                    boxShadow: `0 1px 3px ${typeColor}40`
                  }}
                >
                  {slot.pokemon.type}
                </span>
              </div>

              {/* Hover glow */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  boxShadow: `inset 0 0 15px ${typeColor}40`
                }}
              />

              {/* Animations */}
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
                  50% { transform: translateY(-3px); }
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
                  animation: float 2.5s ease-in-out infinite;
                }
              `}</style>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Secret Hint */}
      <div className="text-center text-[11px] text-pink-400/70 mb-4 flex items-center justify-center gap-1">
        <Sparkles className="h-3 w-3" />
        <span className="font-medium">??? - 0.5%</span>
        <Sparkles className="h-3 w-3" />
      </div>

      {/* Summon Buttons */}
      <div className="flex gap-4">
        {/* Single Summon Button */}
        <Button
          onClick={handleSummonSingle}
          disabled={isSummoning || !canAffordSingle}
          className={cn(
            "flex-1 flex items-center justify-center gap-3 py-7 font-bold transition-all duration-300 rounded-xl overflow-hidden relative group",
            canAffordSingle
              ? "bg-gradient-to-br from-purple-600 via-purple-500 to-pink-600 hover:from-purple-500 hover:via-purple-400 hover:to-pink-500 text-white shadow-lg hover:shadow-2xl hover:shadow-purple-500/40 border border-purple-400/30 hover:border-purple-300/50"
              : "bg-slate-700/50 text-slate-500 cursor-not-allowed opacity-60"
          )}
        >
          {/* Animated shimmer background */}
          {canAffordSingle && !isSummoning && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          )}

          {/* Glow effect */}
          {canAffordSingle && !isSummoning && (
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 blur transition-opacity duration-300 -z-10" />
          )}

          <div className="relative z-10 flex items-center justify-center gap-3">
            {isSummoning ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <div className={cn(
                  "p-2.5 rounded-lg transition-all duration-300",
                  canAffordSingle ? "bg-purple-400/30 group-hover:bg-purple-300/40" : ""
                )}>
                  {selectedBanner === 'kanto' ? <img src={pokecoinIcon} className="h-5 w-5" alt="" /> : <img src={pokegemIcon} className="h-5 w-5" alt="" />}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs opacity-80 font-medium">{t('banner.summon1x')}</span>
                  <span className="text-lg font-bold">{SUMMON_COST_SINGLE}</span>
                </div>
              </>
            )}
          </div>
        </Button>

        {/* Multi Summon Button */}
        <div className="flex-1 relative group">
          <Button
            onClick={handleSummonMulti}
            disabled={isSummoning || !canAffordMulti}
            className={cn(
              "w-full flex items-center justify-center gap-3 py-7 font-bold transition-all duration-300 rounded-xl overflow-hidden relative",
              canAffordMulti
                ? "bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600 hover:from-amber-400 hover:via-yellow-400 hover:to-orange-500 text-white shadow-lg hover:shadow-2xl hover:shadow-amber-500/40 border border-amber-400/40 hover:border-amber-300/60"
                : "bg-slate-700/50 text-slate-500 cursor-not-allowed opacity-60"
            )}
          >
            {/* Animated shimmer background */}
            {canAffordMulti && !isSummoning && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-40 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            )}

            {/* Glow effect */}
            {canAffordMulti && !isSummoning && (
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 opacity-0 group-hover:opacity-20 blur transition-opacity duration-300 -z-10" />
            )}

            <div className="relative z-10 flex items-center justify-center gap-3">
              {isSummoning ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <div className={cn(
                    "p-2.5 rounded-lg transition-all duration-300",
                    canAffordMulti ? "bg-amber-400/30 group-hover:bg-amber-300/40" : ""
                  )}>
                      {selectedBanner === 'kanto' ? <img src={pokecoinIcon} className="h-5 w-5" alt="" /> : <img src={pokegemIcon} className="h-5 w-5" alt="" />}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-xs opacity-80 font-medium">{t('banner.summon5x')}</span>
                    <span className="text-lg font-bold">{SUMMON_COST_MULTI}</span>
                  </div>
                </>
              )}
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

// Summon Reveal Animation - Full screen dramatic reveal
const SummonRevealAnimation = ({ 
  phase, 
  results,
  hasHighRarity,
  hasSecret
}: { 
  phase: RevealPhase;
  results: SummonResult[];
  hasHighRarity: boolean;
  hasSecret: boolean;
}) => {
  // Get the highest rarity result for the reveal animation
  const featuredResult = results.reduce((best, curr) => 
    curr.pokemon.starRating > best.pokemon.starRating ? curr : best, results[0]);
  
  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${featuredResult.pokemon.id}.png`;
  const typeColor = TYPE_COLORS[featuredResult.pokemon.type as PokemonType] || '#A8A878';
  
  const bgColor = hasSecret ? '#ec4899' : hasHighRarity ? '#f59e0b' : '#8b5cf6';

  return (
    <div className={cn(
      "bg-slate-900 rounded-2xl border border-slate-700/50 p-6 relative overflow-hidden min-h-[400px] flex items-center justify-center",
      phase === 'flash' && "animate-screen-flash"
    )}>
      {/* Dynamic background based on phase */}
      <div 
        className={cn(
          "absolute inset-0 transition-all duration-500",
          phase === 'summoning' && "opacity-100",
          phase === 'silhouette' && "opacity-100",
          phase === 'flash' && "opacity-0",
          phase === 'reveal' && "opacity-80"
        )}
        style={{
          background: phase === 'silhouette' || phase === 'reveal'
            ? `radial-gradient(circle at 50% 50%, ${bgColor}40 0%, transparent 60%)`
            : 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.2) 0%, transparent 60%)'
        }}
      />

      {/* Summoning particles */}
      {(phase === 'summoning' || phase === 'silhouette') && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-2 h-2 rounded-full animate-summon-particle",
                hasSecret ? "bg-pink-400" : hasHighRarity ? "bg-amber-400" : "bg-purple-400"
              )}
              style={{
                left: `${50 + (Math.random() - 0.5) * 60}%`,
                top: `${50 + (Math.random() - 0.5) * 60}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1.5 + Math.random()}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Light rays for high rarity */}
      {(phase === 'silhouette' || phase === 'reveal') && hasHighRarity && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-2 h-full origin-center animate-light-ray"
              style={{
                background: `linear-gradient(to top, transparent, ${hasSecret ? '#ec4899' : '#f59e0b'}40, transparent)`,
                transform: `rotate(${i * 45}deg)`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Flash overlay */}
      {phase === 'flash' && (
        <div 
          className="absolute inset-0 z-20 animate-flash-burst"
          style={{ backgroundColor: hasSecret ? '#fce7f3' : '#fef3c7' }}
        />
      )}

      {/* Central orb / summoning animation */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Orb during summoning */}
        {phase === 'summoning' && (
          <div className="relative">
            <div 
              className={cn(
                "w-32 h-32 rounded-full animate-orb-pulse",
                hasSecret ? "bg-gradient-to-br from-pink-500 to-purple-600" 
                  : hasHighRarity ? "bg-gradient-to-br from-amber-400 to-orange-500" 
                  : "bg-gradient-to-br from-purple-500 to-indigo-600"
              )}
              style={{
                boxShadow: `0 0 60px ${bgColor}, 0 0 120px ${bgColor}80`
              }}
            />
            <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-spin" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-2 rounded-full border-2 border-white/20 animate-spin-reverse" />
          </div>
        )}

        {/* Silhouette phase */}
        {phase === 'silhouette' && (
          <div className="relative animate-silhouette-entrance">
            {/* Glow behind silhouette */}
            <div 
              className="absolute inset-0 blur-3xl animate-pulse"
              style={{ 
                background: `radial-gradient(circle, ${bgColor} 0%, transparent 70%)`,
                transform: 'scale(2)'
              }}
            />
            
            {/* Pokemon silhouette */}
            <div className="relative">
              <img
                src={spriteUrl}
                alt="???"
                className="w-40 h-40 pixelated animate-silhouette-float"
                style={{ 
                  imageRendering: 'pixelated',
                  filter: 'brightness(0) drop-shadow(0 0 20px white)',
                }}
              />
            </div>

            {/* "Who's that Pokémon?" text */}
            <div className="mt-4 text-center">
              <p className="text-white text-xl font-bold animate-pulse">???</p>
              {hasSecret && (
                <p className="text-pink-400 text-sm font-bold mt-1 animate-bounce">✦ SECRET ✦</p>
              )}
              {hasHighRarity && !hasSecret && (
                <p className="text-amber-400 text-sm font-bold mt-1 animate-bounce">★ LEGENDARY ★</p>
              )}
            </div>
          </div>
        )}

        {/* Reveal phase */}
        {phase === 'reveal' && (
          <div className="relative animate-reveal-entrance">
            {/* Intense glow */}
            <div 
              className="absolute inset-0 blur-2xl"
              style={{ 
                background: `radial-gradient(circle, ${typeColor}90 0%, transparent 70%)`,
                transform: 'scale(1.5)'
              }}
            />
            
            {/* Revealed Pokemon */}
            <div className="relative">
              <img
                src={spriteUrl}
                alt={featuredResult.pokemon.name}
                className={cn(
                  "w-40 h-40 pixelated",
                  hasHighRarity && "drop-shadow-[0_0_30px_rgba(251,191,36,1)]"
                )}
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            {/* Stars burst */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-1 animate-stars-burst">
              {Array.from({ length: featuredResult.pokemon.starRating }).map((_, i) => (
                <Star 
                  key={i} 
                  className={cn(
                    "w-6 h-6 fill-current",
                    hasSecret ? "text-pink-400" : hasHighRarity ? "text-amber-400" : "text-purple-400"
                  )}
                  style={{ animationDelay: `${i * 50}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes summon-particle {
          0% { transform: scale(0) translate(0, 0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: scale(1) translate(${Math.random() > 0.5 ? '-' : ''}${20 + Math.random() * 40}px, ${Math.random() > 0.5 ? '-' : ''}${20 + Math.random() * 40}px); opacity: 0; }
        }
        @keyframes orb-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes light-ray {
          0%, 100% { opacity: 0.3; transform: rotate(var(--rotation)) scaleY(1); }
          50% { opacity: 0.8; transform: rotate(var(--rotation)) scaleY(1.2); }
        }
        @keyframes flash-burst {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes silhouette-entrance {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes silhouette-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes reveal-entrance {
          0% { transform: scale(1.5); opacity: 0; filter: brightness(3); }
          100% { transform: scale(1); opacity: 1; filter: brightness(1); }
        }
        @keyframes stars-burst {
          0% { transform: translateX(-50%) scale(0); opacity: 0; }
          50% { transform: translateX(-50%) scale(1.3); }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        @keyframes screen-flash {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(2); }
        }
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 1; }
        }
        @keyframes result-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.3); }
          50% { box-shadow: 0 0 40px rgba(251, 191, 36, 0.6); }
        }
        .animate-summon-particle { animation: summon-particle 2s ease-out infinite; }
        .animate-orb-pulse { animation: orb-pulse 1s ease-in-out infinite; }
        .animate-spin-reverse { animation: spin-reverse 3s linear infinite; }
        .animate-light-ray { animation: light-ray 1.5s ease-in-out infinite; }
        .animate-flash-burst { animation: flash-burst 0.4s ease-out forwards; }
        .animate-silhouette-entrance { animation: silhouette-entrance 0.5s ease-out forwards; }
        .animate-silhouette-float { animation: silhouette-float 2s ease-in-out infinite; }
        .animate-reveal-entrance { animation: reveal-entrance 0.4s ease-out forwards; }
        .animate-stars-burst { animation: stars-burst 0.5s ease-out forwards; }
        .animate-screen-flash { animation: screen-flash 0.3s ease-out; }
        .animate-float-particle { animation: float-particle 3s ease-in-out infinite; }
        .animate-result-glow { animation: result-glow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

// Summon Result Card Component with enhanced visuals
const SummonResultCard = ({ result, delay, isHighlight = false }: { result: SummonResult; delay: number; isHighlight?: boolean }) => {
  const { t } = useTranslation('trainer');
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsRevealed(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${result.pokemon.id}.png`;
  const typeColor = TYPE_COLORS[result.pokemon.type as PokemonType] || '#A8A878';
  const styles = STAR_STYLES[result.pokemon.starRating] || STAR_STYLES[1];
  const isHighRarity = result.pokemon.starRating >= 5;
  const is4Star = result.pokemon.starRating === 4;

  return (
    <div
      className={cn(
        "relative p-4 rounded-2xl border-2 transition-all duration-500 transform overflow-hidden",
        isRevealed ? "scale-100 opacity-100 rotate-0" : "scale-75 opacity-0 rotate-12",
        styles.border,
        styles.glow,
        isHighRarity && "animate-pulse-subtle",
        isHighlight && "ring-2 ring-amber-400/50"
      )}
      style={{
        background: `linear-gradient(135deg, ${typeColor}35 0%, ${typeColor}15 50%, ${typeColor}30 100%)`,
        boxShadow: `0 8px 24px ${typeColor}40, inset 0 1px 0 rgba(255,255,255,0.1)`
      }}
    >
      {/* Background effects */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
      </div>

      {/* Shimmer */}
      {isHighRarity && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      )}

      {/* New/Duplicate Badge */}
      {!result.autoDeleted && (
        <div className={cn(
          "absolute top-2 right-2 text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg backdrop-blur-sm border z-10",
          result.isNew
            ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white border-green-400/30"
            : "bg-gradient-to-r from-gray-700 to-gray-600 text-gray-200 border-gray-500/30"
        )}>
          {result.isNew ? '✨ NEW!' : 'DUP'}
        </div>
      )}

      {/* Stars with glow */}
      <div className="relative flex justify-center gap-1 mb-2 z-10">
        {Array.from({ length: result.pokemon.starRating }).map((_, i) => (
          <div key={i} className="relative">
            <Star
              className={cn(
                "h-4 w-4 fill-current drop-shadow-lg transition-all",
                styles.text
              )}
              style={{ animationDelay: `${i * 100}ms` }}
            />
            {isHighRarity && (
              <Star className={cn("h-4 w-4 fill-current absolute inset-0 blur-sm opacity-50 animate-pulse", styles.text)} />
            )}
          </div>
        ))}
      </div>

      {/* Sprite with enhanced effects */}
      <div className="relative flex justify-center mb-3 z-10">
        {/* Glow */}
        <div 
          className="absolute inset-0 blur-2xl opacity-50"
          style={{ 
            background: `radial-gradient(circle, ${typeColor}90 0%, transparent 70%)`
          }}
        />
        
        {/* Ring */}
        {(isHighRarity || is4Star) && (
          <div 
            className="absolute inset-0 rounded-full opacity-30"
            style={{ 
              background: `conic-gradient(from 0deg, ${typeColor}, transparent, ${typeColor})`,
              animation: isHighRarity ? 'spin 6s linear infinite' : 'spin 10s linear infinite'
            }}
          />
        )}

        <div className={cn(
          "w-24 h-24 flex items-center justify-center",
          isHighRarity && "animate-float"
        )}>
          <img
            src={spriteUrl}
            alt={result.pokemon.name}
            className={cn(
              "w-20 h-20 pixelated",
              isHighRarity && "drop-shadow-[0_0_20px_rgba(251,191,36,0.9)]"
            )}
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        {/* Sparkles */}
        {isHighRarity && (
          <>
            <Sparkles className="absolute top-2 right-4 h-4 w-4 text-yellow-300 animate-ping" style={{ animationDuration: '2s' }} />
            <Sparkles className="absolute bottom-2 left-4 h-3 w-3 text-pink-300 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
          </>
        )}
      </div>

      {/* Name */}
      <p className={cn(
        "relative text-center font-bold truncate mb-2 capitalize drop-shadow-lg z-10",
        isHighRarity ? "text-lg" : "text-base",
        "text-white"
      )}>
        {result.pokemon.name}
      </p>

      {/* Type Badge */}
      <div className="relative flex justify-center mb-3 z-10">
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

      {/* Stats with icons */}
      <div className="relative grid grid-cols-3 gap-2 z-10">
        <div className="flex flex-col items-center p-2 bg-red-500/20 rounded-lg border border-red-500/30">
          <Zap className="h-3.5 w-3.5 text-red-400 mb-0.5" />
          <span className="text-white/70 text-[9px] mb-0.5">DMG</span>
          <span className={cn("font-bold text-sm", styles.text)}>{result.statDamage}</span>
        </div>
        <div className="flex flex-col items-center p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
          <Clock className="h-3.5 w-3.5 text-blue-400 mb-0.5" />
          <span className="text-white/70 text-[9px] mb-0.5">SPD</span>
          <span className={cn("font-bold text-sm", styles.text)}>{result.statSpeed}</span>
        </div>
        <div className="flex flex-col items-center p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
          <Sparkles className="h-3.5 w-3.5 text-purple-400 mb-0.5" />
          <span className="text-white/70 text-[9px] mb-0.5">EFF</span>
          <span className={cn("font-bold text-sm", styles.text)}>{result.statEffect}</span>
        </div>
      </div>

      {/* Animations */}
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
        .animate-hero-sway {
          animation: hero-sway 6s ease-in-out infinite;
        }
        @keyframes hero-sway {
          0% { transform: translate(-50%, 0) scale(1); }
          25% { transform: translate(-52%, -2px) scale(1.02); }
          50% { transform: translate(-50%, -4px) scale(1.03); }
          75% { transform: translate(-48%, -2px) scale(1.02); }
          100% { transform: translate(-50%, 0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default PokemonRoulette;