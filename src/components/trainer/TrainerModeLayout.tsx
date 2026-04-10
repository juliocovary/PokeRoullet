import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTrainerModeContext } from '@/contexts/TrainerModeContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, Swords, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PokemonRoulette from './PokemonRoulette';
import FloatingTeamSlots from './FloatingTeamSlots';
import BattleArena, { type RunRewards } from './BattleArena';
import TrainerActionsCard from './TrainerActionsCard';
import TrainerInventoryModal from './TrainerInventoryModal';
import TrainerUpgradesModal from './TrainerUpgradesModal';
import TrainerEvolutionModal from './TrainerEvolutionModal';
import TrainerProgressModal from './TrainerProgressModal';
import { TrainerRankingModal } from './TrainerRankingModal';
import ShinyFusionModal from './ShinyFusionModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
const TrainerModeLayout = () => {
  const { t } = useTranslation('trainer');
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
  const {
    trainerPokemon,
    trainerTeam,
    trainerProgress,
    pokecoins,
    pokegems,
    isLoading,
    isInitialized,
    updateTeamSlot,
    getTeamPokemon,
    loadTrainerData,
    purchaseAutoFarm,
    applyRunRewards,
    deleteTrainerPokemon,
    rollPokemonStat,
    evolveTrainerPokemon,
    setPetSlot,
    removePet,
  } = useTrainerModeContext();

  const [showInventory, setShowInventory] = useState(false);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [showEvolution, setShowEvolution] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [showFusion, setShowFusion] = useState(false);
  const [mobileTab, setMobileTab] = useState<'arena' | 'summon'>('arena');
  
  // Track if initial load has completed to avoid showing loading screen on data refreshes
  const hasLoadedOnce = useRef(false);
  if (isInitialized && !isLoading) {
    hasLoadedOnce.current = true;
  }

  const teamPokemon = getTeamPokemon();
  const teamPokemonIds = teamPokemon.map(p => p.id);

  // Silent refresh - doesn't trigger loading screen
  const handleDataChange = useCallback(async () => {
    await loadTrainerData({ silent: true });
  }, [loadTrainerData]);

  const handleRunComplete = useCallback(async (rewards: RunRewards) => {
    if (import.meta.env.DEV) console.debug('[TrainerRun]', 'layout_onRunComplete', rewards);
    console.log('[TrainerModeLayout] handleRunComplete called with rewards:', rewards);

    const ok = await applyRunRewards({
      pokegems: rewards.pokegems,
      pokemonXP: rewards.pokemonXP,
      highestStage: rewards.highestStage,
      enemiesDefeated: rewards.enemiesDefeated || 0,
    });

    console.log('[TrainerModeLayout] applyRunRewards result:', ok);

    if (ok) {
      console.log('[TrainerModeLayout] applyRunRewards succeeded, refreshing data silently...');
      // Silent refresh instead of page reload to reduce REST requests
      await loadTrainerData({ silent: true });
    } else {
      console.log('[TrainerModeLayout] applyRunRewards failed!');
    }

    if (import.meta.env.DEV) console.debug('[TrainerRun]', 'layout_applyRunRewards_result', ok);
  }, [applyRunRewards, loadTrainerData]);

  const handleFuse = useCallback(async (targetId: string, sacrificeIds: string[]) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase.rpc('fuse_shiny_pokemon', {
        p_user_id: user.id,
        p_pokemon_id: targetId,
        p_sacrifice_ids: sacrificeIds,
      });
      if (error) {
        console.error('Fusion error:', error);
        toast.error(error.message);
        return null;
      }
      const result = data as any;
      if (!result.success) {
        toast.error(result.message);
        return null;
      }
      await loadTrainerData({ silent: true });
      return { fused: result.fused, chance: result.chance, pokemon_name: result.pokemon_name };
    } catch (err) {
      console.error('Fusion error:', err);
      return null;
    }
  }, [user, loadTrainerData]);

  // Only show full loading screen on initial load, not on data refreshes
  if (isLoading && !hasLoadedOnce.current) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
          <p className="text-slate-400">Loading trainer data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
      {/* Mobile: Tabbed view for Arena/Summon */}
      {isMobile ? (
        <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as 'arena' | 'summon')} className="mb-4">
          <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 p-1 rounded-xl border border-slate-600/50 shadow-lg">
            <TabsTrigger 
              value="arena" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg font-bold transition-all duration-300 data-[state=inactive]:text-slate-400 gap-2"
            >
              <Swords className="h-4 w-4" />
              {t('battle.arena', 'Arena')}
            </TabsTrigger>
            <TabsTrigger 
              value="summon" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg font-bold transition-all duration-300 data-[state=inactive]:text-slate-400 gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {t('banner.title', 'Summon')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="arena" className="mt-3">
            <BattleArena
              teamPokemon={teamPokemon}
              hasAutoFarm={trainerProgress?.has_auto_battle || false}
              pokegems={pokegems}
              highestStageCleared={trainerProgress?.highest_stage_cleared || 0}
              petRarity={trainerTeam?.pet_rarity}
              petIsShiny={trainerTeam?.pet_is_shiny}
              onRunComplete={handleRunComplete}
              onPurchaseAutoFarm={purchaseAutoFarm}
            />
          </TabsContent>
          
          <TabsContent value="summon" className="mt-3">
            <PokemonRoulette 
              pokecoins={pokecoins} 
              pokegems={pokegems}
              onDataChange={handleDataChange} 
            />
          </TabsContent>
        </Tabs>
      ) : (
        /* Desktop: Side by side layout */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="min-h-[400px]">
            <BattleArena
              teamPokemon={teamPokemon}
              hasAutoFarm={trainerProgress?.has_auto_battle || false}
              pokegems={pokegems}
              highestStageCleared={trainerProgress?.highest_stage_cleared || 0}
              petRarity={trainerTeam?.pet_rarity}
              petIsShiny={trainerTeam?.pet_is_shiny}
              onRunComplete={handleRunComplete}
              onPurchaseAutoFarm={purchaseAutoFarm}
            />
          </div>
          <div className="min-h-[400px]">
            <PokemonRoulette 
              pokecoins={pokecoins} 
              pokegems={pokegems}
              onDataChange={handleDataChange} 
            />
          </div>
        </div>
      )}

      {/* Floating Team Slots */}
      <FloatingTeamSlots
        trainerPokemon={trainerPokemon}
        trainerTeam={trainerTeam}
        teamPokemon={teamPokemon}
        onUpdateSlot={updateTeamSlot}
        onSetPet={setPetSlot}
        onRemovePet={removePet}
      />

      {/* Actions Section */}
      <TrainerActionsCard
        onOpenInventory={() => setShowInventory(true)}
        onOpenUpgrades={() => setShowUpgrades(true)}
        onOpenEvolution={() => setShowEvolution(true)}
        onOpenProgress={() => setShowProgress(true)}
        onOpenRanking={() => setShowRanking(true)}
        onOpenFusion={() => setShowFusion(true)}
      />

      {/* Modals */}
      <TrainerInventoryModal
        isOpen={showInventory}
        onClose={() => setShowInventory(false)}
        trainerPokemon={trainerPokemon}
        teamPokemonIds={teamPokemonIds}
        onDeletePokemon={deleteTrainerPokemon}
      />

      <TrainerUpgradesModal
        isOpen={showUpgrades}
        onClose={() => setShowUpgrades(false)}
        trainerPokemon={trainerPokemon}
        onRollStat={rollPokemonStat}
      />

      <TrainerEvolutionModal
        isOpen={showEvolution}
        onClose={() => setShowEvolution(false)}
        trainerPokemon={trainerPokemon}
        onEvolvePokemon={evolveTrainerPokemon}
      />

      <TrainerProgressModal
        isOpen={showProgress}
        onClose={() => setShowProgress(false)}
        trainerProgress={trainerProgress}
        trainerPokemon={trainerPokemon}
      />

      <TrainerRankingModal
        isOpen={showRanking}
        onClose={() => setShowRanking(false)}
      />

      <ShinyFusionModal
        isOpen={showFusion}
        onClose={() => setShowFusion(false)}
        trainerPokemon={trainerPokemon}
        teamPokemonIds={teamPokemonIds}
        onFuse={handleFuse}
      />
    </div>
  );
};

export default TrainerModeLayout;