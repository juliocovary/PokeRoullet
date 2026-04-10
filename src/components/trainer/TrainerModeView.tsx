import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Swords, Users, Trophy, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTrainerMode, type TrainerPokemonData } from '@/hooks/useTrainerMode';
import { useProfile } from '@/hooks/useProfile';
import BannerModal from './BannerModal';
import BattleArena from './BattleArena';
import TrainerPokemonCard from './TrainerPokemonCard';
import pokecoinIcon from '@/assets/pokecoin.png';
import pokegemIcon from '@/assets/pokegem.png';
import type { PokemonType } from '@/data/typeAdvantages';
import type { StatGrade } from '@/data/trainerPokemonPool';

const TrainerModeView = () => {
  const { t } = useTranslation('trainer');
  const { profile } = useProfile();
  const {
    trainerPokemon,
    trainerTeam,
    trainerProgress,
    pokegems,
    isLoading,
    updateTeamSlot,
    getTeamPokemon,
  } = useTrainerMode();

  const [showBanner, setShowBanner] = useState(false);
  const [showBattle, setShowBattle] = useState(false);
  const [showTeamManager, setShowTeamManager] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<1 | 2 | 3 | null>(null);

  // Check if user is new to trainer mode
  useEffect(() => {
    if (trainerPokemon.length === 0 && !isLoading) {
      setShowTutorial(true);
    }
  }, [trainerPokemon, isLoading]);

  const teamPokemon = getTeamPokemon();
  const canBattle = teamPokemon.length > 0;

  const handleSelectForTeam = async (pokemon: TrainerPokemonData) => {
    if (selectedSlot) {
      await updateTeamSlot(selectedSlot, pokemon.id);
      setSelectedSlot(null);
    }
  };

  const handleBattleVictory = (rewards: { pokegems: number; experience: number }) => {
    // TODO: Apply rewards
    console.log('Victory rewards:', rewards);
    setShowBattle(false);
  };

  const handleBattleDefeat = () => {
    setShowBattle(false);
  };

  // Note: TrainerModeView is deprecated, use TrainerModeLayout instead
  // This component kept for backwards compatibility

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/20 via-black to-black p-4">
      {/* Currency Display */}
      <div className="flex items-center justify-center gap-6 mb-6">
        <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-pokemon-yellow/30">
          <img src={pokecoinIcon} alt="PokéCoins" className="h-6 w-6" />
          <span className="font-bold text-pokemon-yellow">
            {profile?.pokecoins?.toLocaleString() || 0}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-pink-500/30">
          <img src={pokegemIcon} alt="PokeGems" className="h-6 w-6" />
          <span className="font-bold text-pink-400">
            {pokegems.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Progress Display */}
      {trainerProgress && (
        <Card className="bg-black/40 border-purple-500/30 p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-white/60">{t('progress.currentStage')}</p>
              <p className="text-2xl font-bold text-purple-400">{trainerProgress.current_stage}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">{t('progress.highestStage')}</p>
              <p className="text-2xl font-bold text-green-400">{trainerProgress.highest_stage_cleared}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">{t('progress.battlesWon')}</p>
              <p className="text-2xl font-bold text-yellow-400">{trainerProgress.total_battles_won}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">{t('progress.pokemonDefeated')}</p>
              <p className="text-2xl font-bold text-red-400">{trainerProgress.total_pokemon_defeated}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Button
          onClick={() => setShowBanner(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-6 flex flex-col items-center gap-2"
        >
          <Sparkles className="h-6 w-6" />
          <span>{t('banner.title')}</span>
        </Button>

        <Button
          onClick={() => setShowBattle(true)}
          disabled={!canBattle}
          className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-6 flex flex-col items-center gap-2 disabled:opacity-50"
        >
          <Swords className="h-6 w-6" />
          <span>{t('battle.title')}</span>
        </Button>

        <Button
          onClick={() => setShowTeamManager(!showTeamManager)}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-6 flex flex-col items-center gap-2"
        >
          <Users className="h-6 w-6" />
          <span>{t('team.title')}</span>
        </Button>

        <Button
          onClick={() => setShowTutorial(true)}
          variant="outline"
          className="border-white/30 text-white font-bold py-6 flex flex-col items-center gap-2"
        >
          <HelpCircle className="h-6 w-6" />
          <span>Tutorial</span>
        </Button>
      </div>

      {/* Team Manager */}
      {showTeamManager && (
        <Card className="bg-black/40 border-blue-500/30 p-4 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">{t('team.title')}</h3>
          
          {/* Team Slots */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[1, 2, 3].map((slot) => {
              const slotKey = `slot_${slot}_pokemon_id` as const;
              const pokemonId = trainerTeam?.[slotKey as keyof typeof trainerTeam] as string | undefined;
              const pokemon = trainerPokemon.find(p => p.id === pokemonId);

              return (
                <div
                  key={slot}
                  onClick={() => setSelectedSlot(slot as 1 | 2 | 3)}
                  className={`
                    border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all min-h-[120px]
                    flex items-center justify-center
                    ${selectedSlot === slot ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/30 hover:border-white/50'}
                  `}
                >
                  {pokemon ? (
                    <TrainerPokemonCard
                      pokemonId={pokemon.pokemon_id}
                      name={pokemon.pokemon_name}
                      type={pokemon.pokemon_type as PokemonType}
                      secondaryType={pokemon.secondary_type as PokemonType | undefined}
                      starRating={pokemon.star_rating}
                      level={pokemon.level}
                      power={pokemon.power}
                      statDamage={pokemon.stat_damage as StatGrade}
                      statSpeed={pokemon.stat_speed as StatGrade}
                      statEffect={pokemon.stat_effect as StatGrade}
                      isEvolved={pokemon.is_evolved}
                      compact
                    />
                  ) : (
                    <div className="text-center text-white/50">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">{t('team.slot', { number: slot })}</p>
                      <p className="text-[10px]">{t('team.empty')}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pokemon Selection (when slot is selected) */}
          {selectedSlot && (
            <div>
              <p className="text-sm text-white/80 mb-2">
                {t('team.selectPokemon')} ({t('team.slot', { number: selectedSlot })})
              </p>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-[300px] overflow-y-auto">
                {trainerPokemon.map(pokemon => (
                  <TrainerPokemonCard
                    key={pokemon.id}
                    pokemonId={pokemon.pokemon_id}
                    name={pokemon.pokemon_name}
                    type={pokemon.pokemon_type as PokemonType}
                    secondaryType={pokemon.secondary_type as PokemonType | undefined}
                    starRating={pokemon.star_rating}
                    level={pokemon.level}
                    power={pokemon.power}
                    statDamage={pokemon.stat_damage as StatGrade}
                    statSpeed={pokemon.stat_speed as StatGrade}
                    statEffect={pokemon.stat_effect as StatGrade}
                    isEvolved={pokemon.is_evolved}
                    isInTeam={teamPokemon.some(tp => tp.id === pokemon.id)}
                    onClick={() => handleSelectForTeam(pokemon)}
                    compact
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedSlot(null)}
                className="mt-2 text-white/60"
              >
                Cancel
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Pokemon Collection */}
      <Card className="bg-black/40 border-purple-500/30 p-4">
        <h3 className="text-lg font-bold text-white mb-4">
          {t('pokemon.title')} ({trainerPokemon.length})
        </h3>
        
        {trainerPokemon.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('pokemon.empty')}</p>
            <Button
              onClick={() => setShowBanner(true)}
              className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {t('banner.title')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {trainerPokemon.map(pokemon => (
              <TrainerPokemonCard
                key={pokemon.id}
                pokemonId={pokemon.pokemon_id}
                name={pokemon.pokemon_name}
                type={pokemon.pokemon_type as PokemonType}
                secondaryType={pokemon.secondary_type as PokemonType | undefined}
                starRating={pokemon.star_rating}
                level={pokemon.level}
                power={pokemon.power}
                statDamage={pokemon.stat_damage as StatGrade}
                statSpeed={pokemon.stat_speed as StatGrade}
                statEffect={pokemon.stat_effect as StatGrade}
                isEvolved={pokemon.is_evolved}
                isInTeam={teamPokemon.some(tp => tp.id === pokemon.id)}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Banner Modal */}
      <BannerModal isOpen={showBanner} onClose={() => setShowBanner(false)} />

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-gradient-to-b from-gray-900 to-black border-2 border-purple-500 max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-center text-purple-400 mb-4">
              {t('tutorial.welcome')}
            </h2>
            
            <div className="space-y-4 text-white/80 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-purple-400 font-bold">1.</span>
                <p>{t('tutorial.step1')}</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400 font-bold">2.</span>
                <p>{t('tutorial.step2')}</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400 font-bold">3.</span>
                <p>{t('tutorial.step3')}</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400 font-bold">4.</span>
                <p>{t('tutorial.step4')}</p>
              </div>
            </div>

            <Button
              onClick={() => setShowTutorial(false)}
              className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {t('tutorial.gotIt')}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TrainerModeView;
