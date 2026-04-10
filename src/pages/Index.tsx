import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { RouletteWheel } from '@/components/RouletteWheel';
import { RegionSelector } from '@/components/RegionSelector';
import { ResultModal } from '@/components/ResultModal';
import { StarterPackModal } from '@/components/StarterPackModal';
import { getRegionName, getRegionPackConfig } from '@/data/regionPacks';
import { useCardPacks } from '@/hooks/useCardPacks';
import { InventoryModal } from '@/components/InventoryModal';
import { ShopModal } from '@/components/ShopModal';
import { SellModal } from '@/components/SellModal';
import { EvolutionModal } from '@/components/EvolutionModal';
import { EvolutionResultModal } from '@/components/EvolutionResultModal';
import { MarketplaceModal } from '@/components/MarketplaceModal';
import { LaunchEventModal } from '@/components/LaunchEventModal';
import { DailyLoginModal } from '@/components/DailyLoginModal';
import { LegendarySpinModal } from '@/components/LegendarySpinModal';
import { NewsModal } from '@/components/NewsModal';
import { SeasonRewardsModal } from '@/components/clan/SeasonRewardsModal';
import { useClan } from '@/hooks/useClan';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { usePokemon, Pokemon } from '@/hooks/usePokemon';
import { useInventory } from '@/hooks/useInventory';
import { useProfile } from '@/hooks/useProfile';
import { usePokedex } from '@/hooks/usePokedex';
import { toast } from '@/hooks/use-toast';
import { useMissions } from '@/hooks/useMissions';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNews } from '@/hooks/useNews';
import { useDailyLogin } from '@/hooks/useDailyLogin';
import { useBooster } from '@/hooks/useBooster';
import { fetchActiveLaunchEventStatus } from '@/hooks/launchEventStatusCache';

import { AchievementsModal } from '@/components/AchievementsModal';
import { PokedexModal } from '@/components/PokedexModal';
import { PartyPopper, Newspaper, Gift } from 'lucide-react';
import { ActiveBoostersDisplay } from '@/components/ActiveBoostersDisplay';
import pokeball from '@/assets/pokeball.png';
import inventarioIcon from '@/assets/inventario.png';
import lojaIcon from '@/assets/loja_de_itens.png';
import pokedexIcon from '@/assets/pokedex.png';
import evoluirIcon from '@/assets/evoluir_1.png';
import pokecoinIcon from '@/assets/pokecoin.png';
import tradehubIcon from '@/assets/tradehub-icon.png';

interface EvolutionResultData {
  basePokemonId: number;
  basePokemonName: string;
  evolvedPokemonId: number;
  evolvedPokemonName: string;
  evolvedPokemonRarity: string;
}

const Index = () => {
  const {
    t
  } = useTranslation(['game', 'common', 'toasts']);
  const {
    user,
    loading: authLoading
  } = useAuth();
  const {
    inventory,
    profile,
    spins,
    spinRoulette,
    sellPokemon,
    refreshInventory,
    loading: pokemonLoading
  } = usePokemon();
  const {
    openStarterPack,
    isRegionOpened,
    loading: cardPacksLoading
  } = useCardPacks();
  const {
    profile: userProfile,
    updateProfile,
    changeRegion
  } = useProfile();
  const {
    pokedexCards,
    getPokedexCompletionRate,
    refreshPokedex
  } = usePokedex();
  const {
    shopItems,
    userItems,
    buyItem,
    refreshUserItems,
    loadData: loadInventoryData
  } = useInventory();
  const {
    resetMissions
  } = useMissions();
  const isMobile = useIsMobile();
  const {
    unreadCount: unreadNewsCount
  } = useNews();
  const {
    canClaim: canClaimDaily,
    refreshStatus: refreshDailyLogin
  } = useDailyLogin();
  const {
    useLegendarySpin
  } = useBooster();
  const { checkPendingRewards, claimSeasonRewards } = useClan();

  // Event status check
  const [isEventActive, setIsEventActive] = useState(false);
  const [eventConfigId, setEventConfigId] = useState<string | null>(null);
  const [eventDaysRemaining, setEventDaysRemaining] = useState<number | undefined>(undefined);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [selectedPokemons, setSelectedPokemons] = useState<Pokemon[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [starterPackRegion, setStarterPackRegion] = useState<string | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showPokedex, setShowPokedex] = useState(false);
  const [showEvolutions, setShowEvolutions] = useState(false);
  const [showEvolutionResult, setShowEvolutionResult] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [showDailyLogin, setShowDailyLogin] = useState(false);
  const [showLegendarySpin, setShowLegendarySpin] = useState(false);
  const [showSeasonRewards, setShowSeasonRewards] = useState(false);
  const [isStarterOnboardingActive, setIsStarterOnboardingActive] = useState(false);
  const [isChangingRegion, setIsChangingRegion] = useState(false);
  const [pendingSeasonRewards, setPendingSeasonRewards] = useState<{ id: string; season_number: number; clan_rank: number; reward_coins: number; reward_shards: number; reward_spins: number; clan_name: string; clan_emblem: string }[]>([]);
  const [eventSeen, setEventSeen] = useState(false);
  const [evolutionResultData, setEvolutionResultData] = useState<EvolutionResultData | null>(null);
  const [currentRegion, setCurrentRegion] = useState('kanto');
  const hasSelectedStarter = Boolean(profile?.starter_pokemon) || isRegionOpened('kanto');
  const isStarterSelectionOpen = starterPackRegion !== null;

  // OPTIMIZATION: Lazy-load inventory/shop data when modals open
  useEffect(() => {
    if (showInventory || showShop) {
      loadInventoryData();
    }
  }, [showInventory, showShop, loadInventoryData]);

  // OPTIMIZATION: Lazy-load pokedex data for RegionSelector completion rate
  useEffect(() => {
    if (user && !pokemonLoading && hasSelectedStarter) {
      refreshPokedex();
    }
  }, [user, pokemonLoading, hasSelectedStarter]);

  const openEvolutionResult = (result: EvolutionResultData) => {
    setEvolutionResultData(result);
    setShowEvolutionResult(true);
    localStorage.removeItem('evolutionResult');
  };

  // Light check for event active status (only for logged users)
  useEffect(() => {
    const checkEventStatus = async () => {
      const data = await fetchActiveLaunchEventStatus();
      if (data?.is_active) {
        const endDate = new Date(data.end_date);
        const now = new Date();
        if (endDate > now) {
          setIsEventActive(true);
          setEventConfigId(data.id);
          // Calculate days remaining
          const diffTime = endDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setEventDaysRemaining(diffDays);
          const seenKey = `event_seen_${data.id}`;
          const seen = localStorage.getItem(seenKey) === 'true';
          setEventSeen(seen);
          return;
        }
      }

      setIsEventActive(false);
      setEventConfigId(null);
      setEventDaysRemaining(undefined);
      setEventSeen(false);
    };
    if (user) {
      checkEventStatus();
    }
  }, [user]);
  const handleOpenEventModal = () => {
    if (eventConfigId) {
      const seenKey = `event_seen_${eventConfigId}`;
      localStorage.setItem(seenKey, 'true');
      setEventSeen(true);
    }
    setShowEventModal(true);
  };

  // Check for starter selection (only for logged users)
  useEffect(() => {
    if (user && !pokemonLoading && !cardPacksLoading) {
      if (!hasSelectedStarter) {
        setStarterPackRegion('kanto');
        setIsStarterOnboardingActive(true);
      }
    }
  }, [user, pokemonLoading, cardPacksLoading, hasSelectedStarter, isStarterOnboardingActive]);

  // Auto-open daily login modal when there's a reward to claim
  useEffect(() => {
    if (user && !pokemonLoading && canClaimDaily && hasSelectedStarter && !isStarterSelectionOpen && !isStarterOnboardingActive) {
      const timer = setTimeout(() => setShowDailyLogin(true), 800);
      return () => clearTimeout(timer);
    }
  }, [user, pokemonLoading, canClaimDaily, hasSelectedStarter, isStarterSelectionOpen, isStarterOnboardingActive]);

  // Keep daily login from overlapping starter onboarding flow.
  useEffect(() => {
    if ((isStarterSelectionOpen || isStarterOnboardingActive) && showDailyLogin) {
      setShowDailyLogin(false);
    }
  }, [isStarterSelectionOpen, isStarterOnboardingActive, showDailyLogin]);

  // Load current region from profile
  useEffect(() => {
    if (userProfile?.current_region) {
      setCurrentRegion(userProfile.current_region);
    }
  }, [userProfile]);

  // Check for evolution result after page reload
  useEffect(() => {
    const evolutionResult = localStorage.getItem('evolutionResult');
    if (evolutionResult) {
      try {
        const data = JSON.parse(evolutionResult);
        openEvolutionResult(data);
      } catch (error) {
        console.error('Error parsing evolution result:', error);
        localStorage.removeItem('evolutionResult');
      }
    }
  }, []);

  // Show evolution result modal immediately after evolving without requiring reload.
  useEffect(() => {
    const handleEvolutionResultReady = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        openEvolutionResult(customEvent.detail);
      }
    };

    window.addEventListener('evolutionResultReady', handleEvolutionResultReady);
    return () => window.removeEventListener('evolutionResultReady', handleEvolutionResultReady);
  }, []);

  // Check for pending season rewards
  useEffect(() => {
    if (user && !pokemonLoading && hasSelectedStarter) {
      const checkRewards = async () => {
        const rewards = await checkPendingRewards();
        if (rewards.length > 0) {
          setPendingSeasonRewards(rewards);
          setShowSeasonRewards(true);
        }
      };
      const timer = setTimeout(checkRewards, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, pokemonLoading, hasSelectedStarter, checkPendingRewards]);

  // Real spin handler (for logged users)
  const handleSpin = async () => {
    if (!spins || spins.free_spins <= 0) {
      toast({
        title: t('toasts:noSpins.title'),
        description: t('toasts:noSpins.description'),
        variant: 'destructive'
      });
      return;
    }
    setIsSpinning(true);
    setSelectedPokemons([]);
    setTimeout(async () => {
      const caughtPokemon = await spinRoulette(currentRegion);
      if (caughtPokemon) {
        setSelectedPokemon(caughtPokemon);
        setShowResult(true);
      }
      setIsSpinning(false);
    }, 1500);
  };

  // Multi spin handler (only for logged users level 5+)
  const handleMultiSpin = async () => {
    if (!user) {
      toast({
        title: t('common:demoMode.loginRequired'),
        description: t('common:demoMode.createAccount'),
        variant: 'destructive'
      });
      return;
    }
    if (!spins || spins.free_spins <= 0) {
      toast({
        title: t('toasts:noSpins.title'),
        description: t('toasts:noSpins.description'),
        variant: 'destructive'
      });
      return;
    }
    if (!userProfile || userProfile.level < 5) {
      toast({
        title: t('toasts:levelRequired.title'),
        description: t('toasts:levelRequired.description'),
        variant: 'destructive'
      });
      return;
    }
    const spinsToUse = Math.min(3, spins.free_spins);
    const {
      data: deductResult,
      error: deductError
    } = await supabase.rpc('deduct_multi_spins', {
      p_user_id: user.id,
      p_spins_to_deduct: spinsToUse
    });
    if (deductError) {
      console.error('[MULTI_SPIN] Erro RPC ao descontar spins:', deductError);
      toast({
        title: t('toasts:roulette.errorTitle'),
        description: t('toasts:roulette.processMultiSpinError'),
        variant: 'destructive'
      });
      return;
    }
    const result = deductResult?.[0];
    if (!result?.success) {
      console.error('[MULTI_SPIN] Falha ao descontar spins:', result?.message);
      toast({
        title: t('toasts:noSpins.title'),
        description: result?.message || t('toasts:noSpins.description'),
        variant: 'destructive'
      });
      return;
    }
    const actualSpinsToUse = result.spins_deducted;
    setIsSpinning(true);
    setSelectedPokemon(null);
    setTimeout(async () => {
      // skipSpinDeduction=true pois spins já foram descontados via deduct_multi_spins
      const spinPromises = Array.from({
        length: actualSpinsToUse
      }, () => spinRoulette(currentRegion, true, true));
      const results = await Promise.all(spinPromises);
      const caughtPokemons = results.filter((p): p is Pokemon => p !== null);
      await refreshInventory();
      if (caughtPokemons.length > 0) {
        setSelectedPokemons(caughtPokemons);
        setShowResult(true);
      }
      setIsSpinning(false);
    }, 1500);
  };

  // Region change handler
  const handleRegionChange = async (region: string) => {
    if (region === currentRegion || isChangingRegion) return;

    const targetRegionConfig = getRegionPackConfig(region);
    if (!targetRegionConfig || !targetRegionConfig.isEnabled) {
      toast({
        title: t('toasts:regionLocked.title'),
        description: 'Esta regiao ainda nao esta habilitada.',
        variant: 'destructive'
      });
      return;
    }

    if (!user) {
      toast({
        title: t('common:demoMode.loginRequired'),
        description: t('common:demoMode.createAccount'),
        variant: 'destructive'
      });
      return;
    }
    const isUnlocked = userProfile?.unlocked_regions?.includes(region);
    if (!isUnlocked) {
      toast({
        title: t('toasts:regionLocked.title'),
        description: t('toasts:regionLocked.pokedexDescription'),
        variant: 'destructive'
      });
      return;
    }
    setIsChangingRegion(true);
    try {
      const success = await changeRegion(region);
      if (success) {
        setCurrentRegion(region);
        toast({
          title: t('toasts:regionChanged.title'),
          description: t('toasts:regionChanged.description', { region: getRegionName(region) })
        });

        // Authoritative check: show starter only if this region has never been opened by this user.
        const { data: openedRecord, error: openedRecordError } = await supabase
          .from('user_starter_packs_opened')
          .select('id')
          .eq('user_id', user.id)
          .eq('region', region)
          .maybeSingle();

        if (openedRecordError) {
          console.error('Error checking starter pack opened status:', openedRecordError);
          return;
        }

        const isLegacyKantoStarterResolved = region === 'kanto' && Boolean(profile?.starter_pokemon);
        const hasOpenedStarterInRegion = Boolean(openedRecord);

        if (!hasOpenedStarterInRegion && !isLegacyKantoStarterResolved && !isRegionOpened(region)) {
          setStarterPackRegion(region);
        }
      }
    } finally {
      setIsChangingRegion(false);
    }
  };

  // Starter pack handler
  const handleStarterPackComplete = () => {
    setStarterPackRegion(null);
    setIsStarterOnboardingActive(false);
    refreshInventory();
  };

  // Loading state
  if (authLoading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <img src={pokeball} alt="Pokebola" className="w-16 h-16 mx-auto mb-4 animate-spin" style={{
          animationDuration: '2s'
        }} />
          <p className="text-lg">{t('common:loading')}</p>
          <p className="text-muted-foreground">{t('common:preparingAdventure')}</p>
        </div>
      </div>;
  }

  // Logged user loading their Pokemon data
  if (user && pokemonLoading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <img src={pokeball} alt="Pokebola" className="w-16 h-16 mx-auto mb-4 animate-spin" style={{
          animationDuration: '2s'
        }} />
          <p className="text-lg">{t('common:loading')}</p>
          <p className="text-muted-foreground">{t('common:preparingAdventure')}</p>
        </div>
      </div>;
  }

  // Redirect unauthenticated users to login/signup
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // LOGGED USER: Full game experience
  return <div className="min-h-screen bg-white overflow-x-hidden">
      <Header 
        pokécoins={profile?.pokecoins || 0} 
        nickname={profile?.nickname || 'Trainer'} 
        onOpenAchievements={() => setShowAchievements(true)} 
        onOpenPokedex={() => setShowPokedex(true)}
      />
      
      <main className="container mx-auto px-2 md:px-4 py-4 md:py-8">
          {/* Region Selector - Fixed on left side for desktop */}
          <div className="hidden lg:block">
            <RegionSelector 
              currentRegion={currentRegion} 
              onRegionChange={handleRegionChange} 
              kantoCompletion={getPokedexCompletionRate().percentage}
              isEventActive={isEventActive}
              eventDaysRemaining={eventDaysRemaining}
              onOpenEventModal={handleOpenEventModal}
            />
          </div>

          
          {/* Mobile Region Selector - Top of page */}
          <div className="lg:hidden mb-4 flex justify-center">
            <div className="inline-block">
              <RegionSelector currentRegion={currentRegion} onRegionChange={handleRegionChange} kantoCompletion={getPokedexCompletionRate().percentage} />
            </div>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Roulette Section */}
          <div className="lg:col-span-2 flex justify-center">
            <div className={isMobile ? 'relative w-full' : ''}>
              <div className="flex justify-center">
                <RouletteWheel 
                  onSpin={handleSpin} 
                  onMultiSpin={handleMultiSpin} 
                  isSpinning={isSpinning} 
                  freeSpins={spins?.free_spins || 0} 
                  baseSpins={spins?.base_free_spins || 5} 
                  userLevel={userProfile?.level || 1} 
                  onRefresh={refreshInventory} 
                  eventButton={isMobile && isEventActive ? (
                    <Button onClick={handleOpenEventModal} className="relative w-14 h-14 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors">
                      <PartyPopper className="w-6 h-6 text-amber-500" />
                      {!eventSeen && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                          <span className="text-white text-xs font-bold">!</span>
                        </span>
                      )}
                    </Button>
                  ) : undefined}
                  newsButton={isMobile ? (
                    <Button onClick={() => setShowNewsModal(true)} className="relative w-14 h-14 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors">
                      <Newspaper className="w-6 h-6 text-emerald-500" />
                      {unreadNewsCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center bg-red-500 text-white text-xs animate-pulse">
                          {unreadNewsCount}
                        </Badge>
                      )}
                    </Button>
                  ) : undefined}
                />
              </div>
            </div>
          </div>

          {/* Inventory Section */}
          <div className="space-y-4 md:space-y-6">
            {/* Daily Login Button */}
            <Card className={`relative overflow-hidden p-3 md:p-4 cursor-pointer transition-all hover:scale-[1.01] ${canClaimDaily ? 'border-accent/40 bg-accent/5' : 'border-border bg-card'}`} onClick={() => setShowDailyLogin(true)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${canClaimDaily ? 'bg-accent/15' : 'bg-muted'}`}>
                    <Gift className={`w-4 h-4 ${canClaimDaily ? 'text-accent' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${canClaimDaily ? 'text-foreground' : 'text-muted-foreground'}`}>{t('dailyLogin.card.title')}</p>
                    <p className="text-xs text-muted-foreground">
                      {canClaimDaily ? t('dailyLogin.card.available') : t('dailyLogin.card.claimedToday')}
                    </p>
                  </div>
                </div>
                {canClaimDaily && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
                  </span>
                )}
              </div>
            </Card>

            {/* Active Boosters Display */}
            <ActiveBoostersDisplay baseLuckMultiplier={userProfile?.luck_multiplier || 1} />
            
            {/* Actions */}
            <Card className="card-pokemon p-3 md:p-6">
              <h3 className="text-base md:text-xl font-bold mb-3 md:mb-4 text-center">{t('actions.title')}</h3>
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                <Button variant="outline" className="h-16 md:h-20 flex flex-col items-center justify-center gap-1 md:gap-2 rounded-xl border-2 hover:bg-accent/50 transition-colors" onClick={() => setShowInventory(true)}>
                  <img src={inventarioIcon} alt={t('actions.inventory')} className="w-6 h-6 md:w-8 md:h-8" />
                  <span className="text-xs md:text-sm font-medium">{t('actions.inventory')}</span>
                </Button>
                
                <Button variant="outline" className="h-16 md:h-20 flex flex-col items-center justify-center gap-1 md:gap-2 rounded-xl border-2 hover:bg-accent/50 transition-colors" onClick={() => setShowShop(true)}>
                  <img src={lojaIcon} alt={t('actions.shop')} className="w-6 h-6 md:w-8 md:h-8" />
                  <span className="text-xs md:text-sm font-medium">{t('actions.shop')}</span>
                </Button>

                <Button variant="outline" className="h-16 md:h-20 flex flex-col items-center justify-center gap-1 md:gap-2 rounded-xl border-2 hover:bg-accent/50 transition-colors" onClick={() => setShowMarketplace(true)}>
                  <img src={tradehubIcon} alt={t('actions.marketplace')} className="w-6 h-6 md:w-8 md:h-8" />
                  <span className="text-xs md:text-sm font-medium">{t('actions.marketplace')}</span>
                </Button>
                
                <Button variant="outline" className="h-16 md:h-20 flex flex-col items-center justify-center gap-1 md:gap-2 rounded-xl border-2 hover:bg-accent/50 transition-colors" onClick={() => setShowEvolutions(true)}>
                  <img src={evoluirIcon} alt={t('actions.evolutions')} className="w-6 h-6 md:w-8 md:h-8" />
                  <span className="text-xs md:text-sm font-medium">{t('actions.evolutions')}</span>
                </Button>
                
                <Button variant="outline" className="h-16 md:h-20 flex flex-col items-center justify-center gap-1 md:gap-2 rounded-xl border-2 hover:bg-accent/50 transition-colors" onClick={() => setShowPokedex(true)}>
                  <img src={pokedexIcon} alt={t('actions.pokedex')} className="w-6 h-6 md:w-8 md:h-8" />
                  <span className="text-xs md:text-sm font-medium">{t('actions.pokedex')}</span>
                </Button>

                <Button variant="outline" className="h-16 md:h-20 flex flex-col items-center justify-center gap-1 md:gap-2 rounded-xl border-2 hover:bg-accent/50 transition-colors" onClick={() => setShowSell(true)}>
                  <img src={pokecoinIcon} alt={t('actions.sell')} className="w-6 h-6 md:w-8 md:h-8" />
                  <span className="text-xs md:text-sm font-medium">{t('actions.sell')}</span>
                </Button>
              </div>
            </Card>

            
          </div>
        </div>
      </main>

      {/* Result Modal */}
      <ResultModal isOpen={showResult} onClose={() => {
      setShowResult(false);
      setSelectedPokemon(null);
      setSelectedPokemons([]);
    }} pokemon={selectedPokemon} multiplePokemons={selectedPokemons.length > 0 ? selectedPokemons : undefined} />

      {/* Starter Selection Modal */}
      <StarterPackModal
        isOpen={isStarterSelectionOpen}
        region={starterPackRegion || 'kanto'}
        onOpenPack={openStarterPack}
        onComplete={handleStarterPackComplete}
      />

      {/* Inventory Modal */}
      <InventoryModal
        isOpen={showInventory}
        onClose={() => setShowInventory(false)}
        pokemonInventory={inventory}
        itemInventory={userItems}
        onRefresh={() => {
          refreshInventory();
          refreshUserItems();
        }}
      />

      {/* Shop Modal */}
      <ShopModal isOpen={showShop} onClose={() => setShowShop(false)} items={shopItems} userPokecoins={userProfile?.pokecoins || 0} userPokeshards={userProfile?.pokeshards || 0} onBuyItem={buyItem} onPurchaseSuccess={() => {
      refreshInventory();
      refreshUserItems();
    }} />

      {/* Sell Modal */}
      <SellModal isOpen={showSell} onClose={() => setShowSell(false)} pokemonInventory={inventory} onSellSuccess={refreshInventory} />

      {/* Achievements Modal */}
      <AchievementsModal isOpen={showAchievements} onClose={() => setShowAchievements(false)} />

      {/* Pokedex Modal */}
      <PokedexModal
        isOpen={showPokedex}
        onClose={() => setShowPokedex(false)}
      />

      {/* Evolution Modal */}
      <EvolutionModal isOpen={showEvolutions} onClose={() => setShowEvolutions(false)} pokemonInventory={inventory} userItems={userItems} refreshInventory={refreshInventory} refreshUserItems={refreshUserItems} onEvolutionSuccess={openEvolutionResult} />

      {/* Evolution Result Modal */}
      <EvolutionResultModal isOpen={showEvolutionResult} onClose={() => {
      setShowEvolutionResult(false);
      setEvolutionResultData(null);
    }} evolutionData={evolutionResultData} />

      {/* Marketplace Modal */}
      <MarketplaceModal isOpen={showMarketplace} onClose={() => setShowMarketplace(false)} />

      {/* Launch Event Modal */}
      <LaunchEventModal isOpen={showEventModal} onClose={() => setShowEventModal(false)} />

      {/* News Modal */}
      <NewsModal isOpen={showNewsModal} onClose={() => setShowNewsModal(false)} />

      {/* Daily Login Modal */}
      <DailyLoginModal 
        isOpen={showDailyLogin} 
        onClose={() => setShowDailyLogin(false)} 
        onRefresh={() => { refreshInventory(); refreshDailyLogin(); }}
        onLegendarySpin={() => setShowLegendarySpin(true)}
      />

      {/* Legendary Spin Modal (from daily login) */}
      <LegendarySpinModal 
        isOpen={showLegendarySpin} 
        onClose={() => setShowLegendarySpin(false)} 
        onSpin={useLegendarySpin}
        onComplete={() => refreshInventory()}
        onRefreshInventory={refreshInventory}
      />

      {/* Season Rewards Modal */}
      <SeasonRewardsModal
        isOpen={showSeasonRewards}
        onClose={() => setShowSeasonRewards(false)}
        rewards={pendingSeasonRewards}
        onClaim={async () => {
          const success = await claimSeasonRewards();
          if (success) {
            setPendingSeasonRewards([]);
            refreshInventory();
          }
          return success;
        }}
      />
    </div>;
};
export default Index;