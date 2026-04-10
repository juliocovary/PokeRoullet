import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Gift, X, Check, Sparkles } from 'lucide-react';
import pokecoinIcon from '@/assets/pokecoin.png';
import pokeshardIcon from '@/assets/pokeshard.png';
import { PokedexCard } from './PokedexCard';
import { PokedexCardDetailModal } from './PokedexCardDetailModal';
import { PokedexRewardCard, PokedexSectionHeader, PokedexRewardTimeline } from './pokedex';
import { usePokedex } from '@/hooks/usePokedex';
import { usePokemon } from '@/hooks/usePokemon';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useAchievements } from '@/hooks/useAchievements';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import pokedexIcon from '@/assets/pokedex-icon.png';

interface PokedexModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CARDS_PER_PAGE = 15;
const PAGE_REWARDS: Record<string, { coins: number; xp: number; shards: number }> = {
  kanto: { coins: 50, xp: 100, shards: 10 },
  johto: { coins: 75, xp: 150, shards: 15 },
  hoenn: { coins: 100, xp: 200, shards: 20 },
  sinnoh: { coins: 125, xp: 250, shards: 25 },
  unova: { coins: 150, xp: 300, shards: 30 },
  kalos: { coins: 175, xp: 350, shards: 35 },
  alola: { coins: 200, xp: 400, shards: 40 },
};

const SECTIONS = [{
  id: 'kanto',
  name: 'Kanto',
  range: [1, 150],
  rewards: [
    { milestone: 50, coins: 100, xp: 500, shards: 25 },
    { milestone: 75, coins: 200, xp: 750, shards: 40, special: 'unlock_johto' },
    { milestone: 100, coins: 250, xp: 1000, shards: 50 },
    { milestone: 150, coins: 500, xp: 2500, shards: 100 }
  ]
}, {
  id: 'johto',
  name: 'Johto',
  range: [152, 250],
  rewards: [
    { milestone: 25, coins: 150, xp: 600, shards: 30 },
    { milestone: 50, coins: 300, xp: 1200, shards: 60, special: 'unlock_hoenn' },
    { milestone: 75, coins: 450, xp: 1800, shards: 90 },
    { milestone: 99, coins: 700, xp: 3000, shards: 150 }
  ]
}, {
  id: 'hoenn',
  name: 'Hoenn',
  range: [252, 386],
  rewards: [
    { milestone: 34, coins: 200, xp: 800, shards: 40 },
    { milestone: 67, coins: 400, xp: 1600, shards: 80, special: 'unlock_sinnoh' },
    { milestone: 101, coins: 600, xp: 2400, shards: 120 },
    { milestone: 135, coins: 900, xp: 3600, shards: 180 }
  ]
}, {
  id: 'sinnoh',
  name: 'Sinnoh',
  range: [387, 492],
  rewards: [
    { milestone: 27, coins: 250, xp: 1000, shards: 50 },
    { milestone: 53, coins: 500, xp: 2000, shards: 100 },
    { milestone: 80, coins: 750, xp: 3000, shards: 150 },
    { milestone: 106, coins: 1200, xp: 5000, shards: 250 }
  ]
}, {
  id: 'unova',
  name: 'Unova',
  range: [495, 646],
  rewards: [
    { milestone: 38, coins: 300, xp: 1200, shards: 60 },
    { milestone: 76, coins: 600, xp: 2400, shards: 120 },
    { milestone: 114, coins: 900, xp: 3600, shards: 180 },
    { milestone: 152, coins: 1500, xp: 6000, shards: 300 }
  ]
}, {
  id: 'kalos',
  name: 'Kalos',
  range: [650, 718],
  rewards: [
    { milestone: 18, coins: 350, xp: 1400, shards: 70 },
    { milestone: 36, coins: 700, xp: 2800, shards: 140 },
    { milestone: 54, coins: 1050, xp: 4200, shards: 210 },
    { milestone: 69, coins: 1750, xp: 7000, shards: 350 }
  ]
}, {
  id: 'alola',
  name: 'Alola',
  range: [722, 809],
  rewards: [
    { milestone: 22, coins: 400, xp: 1600, shards: 80 },
    { milestone: 44, coins: 800, xp: 3200, shards: 160 },
    { milestone: 66, coins: 1200, xp: 4800, shards: 240 },
    { milestone: 83, coins: 2000, xp: 8000, shards: 400 }
  ]
}, {
  id: 'secretos',
  name: 'Secretos',
  range: [151, 809],
  rewards: [
    { milestone: 1, coins: 200, xp: 1000, shards: 50 },
    { milestone: 3, coins: 400, xp: 2000, shards: 100 },
    { milestone: 5, coins: 800, xp: 4000, shards: 200 },
    { milestone: 8, coins: 1500, xp: 7500, shards: 500 },
    { milestone: 11, coins: 3000, xp: 15000, shards: 1000 },
    { milestone: 16, coins: 5000, xp: 25000, shards: 2000 }
  ]
}];

const isPokemonInSection = (
  pokemon: { id: number; rarity: string },
  sectionId: string
): boolean => {
  if (sectionId === 'secretos') {
    return pokemon.rarity === 'secret';
  }

  if (pokemon.rarity === 'secret') {
    return false;
  }

  if (sectionId === 'kanto') return pokemon.id >= 1 && pokemon.id <= 150;
  if (sectionId === 'johto') return pokemon.id >= 152 && pokemon.id <= 250;
  if (sectionId === 'hoenn') return pokemon.id >= 252 && pokemon.id <= 386;
  if (sectionId === 'sinnoh') return pokemon.id >= 387 && pokemon.id <= 492;
  if (sectionId === 'unova') return pokemon.id >= 495 && pokemon.id <= 646;
  if (sectionId === 'kalos') return pokemon.id >= 650 && pokemon.id <= 718;
  if (sectionId === 'alola') return pokemon.id >= 722 && pokemon.id <= 809;

  return false;
};

export const PokedexModal = ({
  isOpen,
  onClose
}: PokedexModalProps) => {
  const { t } = useTranslation(['modals', 'toasts']);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { GEN1_POKEMON, inventory } = usePokemon();
  const { profile, loadProfile } = useProfile();
  const { toast } = useToast();
  const { updateAchievementProgress } = useAchievements();
  // Map inventory to the format expected by usePokedex
  const pokemonInventoryForPokedex = inventory?.map(item => ({
    pokemon_id: item.pokemon_id,
    quantity: item.quantity,
    is_shiny: item.is_shiny
  })) || [];
  
  const {
    loading,
    placePokemonInPokedex,
    getOwnedQuantity,
    isPlacedInPokedex,
    getPlacedCardIsShiny,
    getPlacedCardData,
    isFavoriteInPokedex,
    toggleFavoriteInPokedex,
    getPokedexCompletionRate,
    isRewardClaimed,
    claimPokedexReward,
    refreshPokedex
  } = usePokedex(pokemonInventoryForPokedex);
  
  // OPTIMIZATION: Lazy-load pokedex data when modal opens
  useEffect(() => {
    if (isOpen) {
      refreshPokedex();
    }
  }, [isOpen, refreshPokedex]);

  // State for detail modal
  const [selectedPokemonId, setSelectedPokemonId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const handleViewDetail = (pokemonId: number) => {
    setSelectedPokemonId(pokemonId);
    setIsDetailModalOpen(true);
  };
  
  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedPokemonId(null);
  };

  const [selectedSection, setSelectedSection] = useState(() => {
    return localStorage.getItem('pokedex_selected_section') || 'kanto';
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem('pokedex_current_page');
    // Clean up after reading
    localStorage.removeItem('pokedex_current_page');
    return savedPage ? parseInt(savedPage, 10) : 1;
  });
  const [showRewards, setShowRewards] = useState(false);
  const currentSection = SECTIONS.find(s => s.id === selectedSection);

  // Get Pokemon for current section in correct order
  // Secret pokemon are EXCLUDED from regional tabs and only shown in "secretos"
  const sectionPokemon = useMemo(() => {
    return GEN1_POKEMON.filter((pokemon) => isPokemonInSection(pokemon, selectedSection)).sort((a, b) => a.id - b.id);
  }, [GEN1_POKEMON, selectedSection]);

  const sectionPokedexCount = useMemo(() => {
    return sectionPokemon.filter((pokemon) => isPlacedInPokedex(pokemon.id)).length;
  }, [sectionPokemon, isPlacedInPokedex]);
  
  // Calculate pagination with consistent 15 cards per page
  const totalPages = Math.ceil(sectionPokemon.length / CARDS_PER_PAGE);
  const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
  const currentPagePokemon = sectionPokemon.slice(startIndex, startIndex + CARDS_PER_PAGE);
  
  // Debug log to verify pagination
  console.log(`Page ${currentPage}: showing ${currentPagePokemon.length} cards (IDs: ${currentPagePokemon.map(p => p.id).join(', ')})`);
  const completionRate = getPokedexCompletionRate();
  
  const handlePlaceCard = async (pokemonId: number, pokemonName: string, isShiny: boolean) => {
    const success = await placePokemonInPokedex(pokemonId, pokemonName, isShiny);
    if (success) {
      // Just refresh the pokedex data locally, no page reload
      await refreshPokedex();
    }
  };
  
  const handleClose = () => {
    // Reload page when closing modal to update inventory
    window.location.reload();
  };
  
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Pokédex - {t('pokedex.loading')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-4 p-4">
            {Array.from({
            length: 16
          }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
        </DialogContent>
      </Dialog>;
  }

  return <><Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-full sm:max-w-7xl h-[96dvh] sm:max-h-[90vh] bg-gradient-to-br from-red-600 via-red-500 to-red-700 border-4 sm:border-8 border-red-800 shadow-[0_0_60px_rgba(220,38,38,0.6)] !fixed !left-1/2 !top-1/2 !transform !-translate-x-1/2 !-translate-y-1/2 rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col [&>button]:hidden">
        {/* Decorative Top Bar - Pokedex Style */}
        <div className="hidden md:flex absolute -top-2 left-4 right-4 h-16 bg-gradient-to-b from-red-700 to-red-600 rounded-t-2xl border-4 border-red-800 items-center justify-between px-6">
          {/* Left Blue Circle - Iconic Pokedex Element */}
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-300 via-cyan-400 to-cyan-600 rounded-full border-4 border-white shadow-[0_0_20px_rgba(34,211,238,0.8),inset_0_4px_8px_rgba(255,255,255,0.6)]">
              <div className="absolute top-2 left-2 w-4 h-4 bg-white/80 rounded-full blur-sm"></div>
            </div>
          </div>
          
          {/* Right Indicator Lights */}
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-red-700 shadow-inner"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full border-2 border-yellow-600 shadow-inner"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full border-2 border-green-600 shadow-inner animate-pulse"></div>
          </div>
        </div>

        <DialogHeader className="pb-1.5 sm:pb-4 pt-2 sm:pt-16 px-2 sm:px-6 flex-shrink-0">
          <DialogTitle className="flex items-center justify-between text-base sm:text-2xl font-bold">
            <span className="flex items-center gap-1.5 sm:gap-3 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              <img src={pokedexIcon} alt="Pokédex" className="w-5 h-5 sm:w-8 sm:h-8 drop-shadow-lg" />
              {isMobile ? t('pokedex.titleMobile') : t('pokedex.title')}
            </span>
            <div className="flex items-center gap-1.5 sm:gap-4">
              <div className="flex items-center gap-1.5 bg-black/40 px-1.5 py-0.5 sm:px-4 sm:py-2 rounded-md sm:rounded-lg border border-white/20 sm:border-2">
                <Badge variant="outline" className="bg-emerald-400/90 border border-white sm:border-2 text-black font-bold px-1 py-0 sm:px-3 sm:py-1 text-[9px] sm:text-sm shadow-lg">
                  {completionRate.placed}/{completionRate.total}
                </Badge>
                <div className="w-12 sm:w-32 bg-black/60 rounded-full h-1 sm:h-2 border border-white/40">
                  <div className="bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]" style={{
                  width: `${completionRate.percentage}%`
                }} />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-7 w-7 sm:h-10 sm:w-10 rounded-full bg-red-600 hover:bg-red-700 text-white border-2 border-red-800 shadow-lg"
              >
                <X className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-2 sm:px-6 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-6">
          <div className="space-y-2 sm:space-y-4">
          {/* Section Selector - Screen Style */}
          <div className="flex items-center justify-between gap-2 sm:gap-4 bg-gradient-to-br from-gray-800 via-gray-900 to-black p-2 sm:p-4 rounded-lg sm:rounded-xl border sm:border-4 border-gray-700 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-1.5 sm:gap-4 flex-1">
              <Select value={selectedSection} onValueChange={value => {
              setSelectedSection(value);
              setCurrentPage(1);
              setShowRewards(false);
            }}>
                <SelectTrigger className="flex-1 sm:w-56 h-8 sm:h-auto bg-gradient-to-br from-gray-700 to-gray-800 border border-cyan-400/50 sm:border-2 hover:border-cyan-400 transition-all text-white font-semibold shadow-lg text-xs sm:text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-2 border-cyan-400/50">
                  {SECTIONS.map(section => <SelectItem key={section.id} value={section.id} className="hover:bg-cyan-400/20 text-white font-medium">
                      {section.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              onClick={() => setShowRewards(!showRewards)}
              size="sm"
              className={`bg-gradient-to-br from-yellow-500 via-yellow-400 to-yellow-600 hover:from-yellow-400 hover:via-yellow-300 hover:to-yellow-500 border sm:border-4 border-yellow-700 text-black font-bold px-2 sm:px-6 h-8 sm:h-auto text-xs sm:text-base shadow-[0_4px_12px_rgba(234,179,8,0.6)] hover:shadow-[0_0_20px_rgba(234,179,8,0.8)] transition-all duration-200 hover:scale-105 ${showRewards ? 'ring-1 sm:ring-4 ring-yellow-300' : ''}`}
            >
              <Gift className="h-3.5 w-3.5 sm:h-5 sm:w-5 sm:mr-2" />
              <span className="hidden sm:inline">{t('pokedex.rewards')}</span>
            </Button>
          </div>

          {/* Rewards Section - Redesigned */}
          {showRewards && currentSection && (
            <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 p-4 sm:p-6 rounded-xl border-2 border-yellow-600/40 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
              {/* Section Header with Progress */}
              <PokedexSectionHeader
                sectionId={selectedSection}
                sectionName={currentSection.name}
                currentCount={sectionPokedexCount}
                totalCount={currentSection.rewards[currentSection.rewards.length - 1]?.milestone || 0}
              />
              
              {/* Timeline */}
              <PokedexRewardTimeline
                milestones={currentSection.rewards.map(r => {
                  return {
                    milestone: r.milestone,
                    isCompleted: sectionPokedexCount >= r.milestone,
                    isClaimed: isRewardClaimed(selectedSection, r.milestone),
                  };
                })}
                currentProgress={sectionPokedexCount}
              />
              
              {/* Reward Cards */}
              <div className="space-y-3">
                {currentSection.rewards.map((reward, index) => {
                  const isCompleted = sectionPokedexCount >= reward.milestone;
                  const isClaimed = isRewardClaimed(selectedSection, reward.milestone);
                  const specialReward = reward.special as 'unlock_johto' | 'unlock_hoenn' | 'unlock_sinnoh' | undefined;
                  const unlockRegionMap: Record<'unlock_johto' | 'unlock_hoenn' | 'unlock_sinnoh', { key: 'johto' | 'hoenn' | 'sinnoh'; label: string }> = {
                    unlock_johto: { key: 'johto', label: 'Johto' },
                    unlock_hoenn: { key: 'hoenn', label: 'Hoenn' },
                    unlock_sinnoh: { key: 'sinnoh', label: 'Sinnoh' },
                  };
                  
                  const isRegionUnlocked = 
                    (specialReward === 'unlock_johto' && profile?.unlocked_regions?.includes('johto')) ||
                    (specialReward === 'unlock_hoenn' && profile?.unlocked_regions?.includes('hoenn')) ||
                    (specialReward === 'unlock_sinnoh' && profile?.unlocked_regions?.includes('sinnoh'));
                  
                  const handleClaimReward = async () => {
                    if (!isCompleted || !user) return;
                    
                    if (specialReward) {
                      const unlockTarget = unlockRegionMap[specialReward];
                      const alreadyUnlocked = profile?.unlocked_regions?.includes(unlockTarget.key);

                      if (!alreadyUnlocked) {
                        const { data, error } = await supabase.rpc('unlock_region', {
                          p_user_id: user.id,
                          p_region: unlockTarget.key
                        });

                        // Supabase RPCs may return successful HTTP without SQL success; validate both fields.
                        if (error || !data) {
                          toast({
                            title: 'Erro ao desbloquear regiao',
                            description: error?.message || 'Nao foi possivel desbloquear a regiao agora.',
                            variant: 'destructive'
                          });
                          return;
                        }

                        await loadProfile();
                        await updateAchievementProgress('region_unlock', 1, true);
                        toast({
                          title: t('pokedex.regionUnlocked', { region: unlockTarget.label }),
                          description: t('pokedex.nowCanCatch', { region: unlockTarget.label }),
                        });

                      }
                    } else {
                      const success = await claimPokedexReward(
                        selectedSection,
                        reward.milestone,
                        reward.coins || 0,
                        reward.xp || 0,
                        reward.shards || 0
                      );
                      if (success) {
                        await loadProfile();
                      }
                    }
                  };
                  
                  return (
                    <PokedexRewardCard
                      key={index}
                      milestone={reward.milestone}
                      coins={reward.coins}
                      xp={reward.xp}
                      shards={reward.shards}
                      currentProgress={sectionPokedexCount}
                      isCompleted={isCompleted}
                      isClaimed={isClaimed}
                      specialReward={specialReward}
                      onClaim={handleClaimReward}
                      isRegionUnlocked={isRegionUnlocked}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Pokemon Grid - Screen Style */}
          <div className="relative">
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 sm:gap-3 bg-gradient-to-br from-gray-900 via-black to-gray-900 p-1 sm:p-6 rounded-lg sm:rounded-2xl border sm:border-4 border-gray-700 shadow-[inset_0_4px_12px_rgba(0,0,0,0.9)]">
              {currentPagePokemon.map(pokemon => <PokedexCard key={pokemon.id} pokemonId={pokemon.id} isPlaced={isPlacedInPokedex(pokemon.id)} ownedQuantity={getOwnedQuantity(pokemon.id, false)} ownedShinyQuantity={getOwnedQuantity(pokemon.id, true)} isShiny={getPlacedCardIsShiny(pokemon.id)} onPlaceCard={handlePlaceCard} onViewDetail={handleViewDetail} />)}
            </div>

            {/* Page Completion Reward Banner */}
            {selectedSection !== 'secretos' && PAGE_REWARDS[selectedSection] && (() => {
              const placedOnPage = currentPagePokemon.filter(p => isPlacedInPokedex(p.id)).length;
              const totalOnPage = currentPagePokemon.length;
              const isPageComplete = placedOnPage === totalOnPage && totalOnPage > 0;
              const pageRewardSection = `page_${selectedSection}_${currentPage}`;
              const isPageClaimed = isRewardClaimed(pageRewardSection, currentPage);
              const reward = PAGE_REWARDS[selectedSection];

              const handleClaimPageReward = async () => {
                if (!isPageComplete || isPageClaimed) return;
                const success = await claimPokedexReward(
                  pageRewardSection,
                  currentPage,
                  reward.coins,
                  reward.xp,
                  reward.shards
                );
                if (success) {
                  await loadProfile();
                }
              };

              return (
                <div className={`mt-2 sm:mt-3 rounded-lg sm:rounded-xl border-2 p-2.5 sm:p-3 transition-all ${
                  isPageClaimed
                    ? 'bg-gray-800/60 border-gray-600/40'
                    : isPageComplete
                    ? 'bg-gradient-to-r from-yellow-900/40 via-amber-900/30 to-yellow-900/40 border-yellow-500/50 animate-pulse'
                    : 'bg-gray-900/60 border-gray-700/40'
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isPageClaimed ? 'bg-green-500/20' : isPageComplete ? 'bg-yellow-500/20' : 'bg-gray-700/40'
                      }`}>
                        {isPageClaimed ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : isPageComplete ? (
                          <Sparkles className="w-4 h-4 text-yellow-400" />
                        ) : (
                          <Gift className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${
                          isPageClaimed ? 'text-gray-400' : isPageComplete ? 'text-yellow-300' : 'text-gray-400'
                        }`}>
                          Página {currentPage} — {placedOnPage}/{totalOnPage}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-0.5 text-[10px] text-gray-300">
                            <img src={pokecoinIcon} alt="" className="w-3 h-3" />{reward.coins}
                          </span>
                          <span className="flex items-center gap-0.5 text-[10px] text-gray-300">
                            <img src={pokeshardIcon} alt="" className="w-3 h-3" />{reward.shards}
                          </span>
                          <span className="text-[10px] text-gray-300">✨{reward.xp} XP</span>
                        </div>
                      </div>
                    </div>
                    
                    {isPageClaimed ? (
                      <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-400 text-[10px] px-2 py-0.5 flex-shrink-0">
                        Coletado
                      </Badge>
                    ) : isPageComplete ? (
                      <Button
                        size="sm"
                        onClick={handleClaimPageReward}
                        className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold text-xs px-3 py-1 h-7 flex-shrink-0"
                      >
                        <Gift className="w-3 h-3 mr-1" />
                        Coletar
                      </Button>
                    ) : (
                      <div className="w-16 bg-gray-700/60 rounded-full h-1.5 flex-shrink-0">
                        <div 
                          className="bg-cyan-400/60 h-full rounded-full transition-all" 
                          style={{ width: `${totalOnPage > 0 ? (placedOnPage / totalOnPage) * 100 : 0}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Desktop Navigation Buttons - Side positioned */}
            {currentPage > 1 && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => goToPage(currentPage - 1)}
                className="hidden sm:flex absolute left-0 top-[45%] transform -translate-y-1/2 z-20 w-14 h-14 rounded-lg bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 border-4 border-red-700 shadow-[0_4px_12px_rgba(0,0,0,0.8)] hover:shadow-[0_0_20px_rgba(220,38,38,0.6)] transition-all duration-200 hover:scale-110"
              >
                <ChevronLeft className="h-7 w-7 text-white" />
              </Button>
            )}
            
            {currentPage < totalPages && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => goToPage(currentPage + 1)}
                className="hidden sm:flex absolute right-0 top-[45%] transform -translate-y-1/2 z-20 w-14 h-14 rounded-lg bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 border-4 border-red-700 shadow-[0_4px_12px_rgba(0,0,0,0.8)] hover:shadow-[0_0_20px_rgba(220,38,38,0.6)] transition-all duration-200 hover:scale-110"
              >
                <ChevronRight className="h-7 w-7 text-white" />
              </Button>
            )}
            
            {/* Mobile Navigation Bar - Below grid */}
            <div className="flex sm:hidden items-center justify-center gap-4 mt-3 pb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="w-11 h-11 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 border-2 border-red-700 shadow-lg disabled:opacity-40 disabled:pointer-events-none transition-all duration-200"
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </Button>
              
              <div className="px-4 py-1.5 bg-black/80 rounded-full border-2 border-cyan-400/60 backdrop-blur-sm min-w-[80px] text-center">
                <span className="text-cyan-300 font-bold tracking-wider text-sm">
                  {currentPage} / {totalPages}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="w-11 h-11 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 border-2 border-red-700 shadow-lg disabled:opacity-40 disabled:pointer-events-none transition-all duration-200"
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </Button>
            </div>
          </div>
          </div>
        </ScrollArea>
        
        {/* Detail Modal */}
        {selectedPokemonId && (
          <PokedexCardDetailModal
            isOpen={isDetailModalOpen}
            onClose={handleCloseDetail}
            pokemonId={selectedPokemonId}
            pokemonData={getPlacedCardData(selectedPokemonId) || { name: '', rarity: 'common', isShiny: false, placedAt: '' }}
            isFavorite={isFavoriteInPokedex(selectedPokemonId)}
            onToggleFavorite={() => toggleFavoriteInPokedex(selectedPokemonId)}
          />
        )}
      </DialogContent>
    </Dialog></>;
};
