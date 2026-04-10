import { useTranslation } from 'react-i18next';
import { Package, BarChart3, Star, Swords, Trophy, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TYPE_COLORS, type PokemonType } from '@/data/typeAdvantages';
import type { TrainerPokemonData, TrainerProgressData } from '@/hooks/useTrainerMode';

interface TrainerTabsProps {
  activeTab: 'inventory' | 'stats';
  onTabChange: (tab: 'inventory' | 'stats') => void;
  trainerPokemon: TrainerPokemonData[];
  trainerProgress: TrainerProgressData | null;
  teamPokemon: TrainerPokemonData[];
}

const STAR_COLORS: Record<number, string> = {
  1: 'text-slate-400',
  2: 'text-green-400',
  3: 'text-blue-400',
  4: 'text-purple-400',
  5: 'text-amber-400',
  6: 'text-pink-400',
};

const TrainerTabs = ({ activeTab, onTabChange, trainerPokemon, trainerProgress, teamPokemon }: TrainerTabsProps) => {
  const { t } = useTranslation('trainer');

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 rounded-2xl border border-slate-700/50 overflow-hidden shadow-lg">
      {/* Tab Headers */}
      <div className="flex border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
        <button
          onClick={() => onTabChange('inventory')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 px-4 font-bold transition-all duration-300 relative group",
            activeTab === 'inventory'
              ? "text-amber-400"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          {activeTab === 'inventory' && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-t" />
          )}
          <div className={cn(
            "p-1.5 rounded-lg transition-colors",
            activeTab === 'inventory' ? "bg-amber-500/20" : "bg-slate-700/30 group-hover:bg-slate-700/50"
          )}>
            <Package className="h-4 w-4" />
          </div>
          <span>{t('pokemon.title')}</span>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full font-bold transition-colors",
            activeTab === 'inventory' 
              ? "bg-amber-500/20 text-amber-300" 
              : "bg-slate-600/50 text-slate-400"
          )}>
            {trainerPokemon.length}
          </span>
        </button>

        <button
          onClick={() => onTabChange('stats')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 px-4 font-bold transition-all duration-300 relative group",
            activeTab === 'stats'
              ? "text-blue-400"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          {activeTab === 'stats' && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t" />
          )}
          <div className={cn(
            "p-1.5 rounded-lg transition-colors",
            activeTab === 'stats' ? "bg-blue-500/20" : "bg-slate-700/30 group-hover:bg-slate-700/50"
          )}>
            <BarChart3 className="h-4 w-4" />
          </div>
          <span>{t('progress.title')}</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'inventory' ? (
          <InventoryTab trainerPokemon={trainerPokemon} teamPokemon={teamPokemon} />
        ) : (
          <StatsTab trainerProgress={trainerProgress} trainerPokemon={trainerPokemon} />
        )}
      </div>
    </div>
  );
};

// Inventory Tab Content
const InventoryTab = ({ trainerPokemon, teamPokemon }: { trainerPokemon: TrainerPokemonData[]; teamPokemon: TrainerPokemonData[] }) => {
  const { t } = useTranslation('trainer');

  if (trainerPokemon.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>{t('pokemon.empty')}</p>
        <p className="text-sm mt-2">{t('banner.hint')}</p>
      </div>
    );
  }

  // Sort by star rating (descending) then by power (descending)
  const sortedPokemon = [...trainerPokemon].sort((a, b) => {
    if (b.star_rating !== a.star_rating) return b.star_rating - a.star_rating;
    return b.power - a.power;
  });

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
      {sortedPokemon.map((pokemon) => {
        const isInTeam = teamPokemon.some(tp => tp.id === pokemon.id);
        const typeColor = TYPE_COLORS[pokemon.pokemon_type as PokemonType] || '#A8A878';

        return (
          <div
            key={pokemon.id}
            className={cn(
              "relative p-2 rounded-xl border transition-all",
              isInTeam
                ? "border-amber-500/50 bg-amber-500/10"
                : "border-slate-600/50 bg-slate-700/30 hover:border-slate-500"
            )}
          >
            {isInTeam && (
              <div className="absolute top-1 left-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                <Swords className="h-2.5 w-2.5 text-slate-900" />
              </div>
            )}

            {/* Stars */}
            <div className="flex justify-center gap-0.5 mb-1">
              {Array.from({ length: Math.min(pokemon.star_rating, 3) }).map((_, i) => (
                <Star key={i} className={cn("h-2 w-2 fill-current", STAR_COLORS[pokemon.star_rating])} />
              ))}
              {pokemon.star_rating > 3 && (
                <span className={cn("text-[8px] font-bold", STAR_COLORS[pokemon.star_rating])}>
                  +{pokemon.star_rating - 3}
                </span>
              )}
            </div>

            {/* Sprite */}
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemon_id}.png`}
              alt={pokemon.pokemon_name}
              className="w-12 h-12 mx-auto pixelated"
            />

            {/* Name */}
            <p className="text-[10px] text-center text-white font-medium truncate mt-1">
              {pokemon.pokemon_name}
            </p>

            {/* Type Badge */}
            <div className="flex justify-center mt-1">
              <span
                className="text-[8px] px-1.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: typeColor }}
              >
                {pokemon.pokemon_type}
              </span>
            </div>

            {/* Level */}
            <p className="text-[9px] text-center text-slate-400 mt-1">
              Lv.{pokemon.level} • {pokemon.power} PWR
            </p>
          </div>
        );
      })}
    </div>
  );
};

// Stats Tab Content
const StatsTab = ({ trainerProgress, trainerPokemon }: { trainerProgress: TrainerProgressData | null; trainerPokemon: TrainerPokemonData[] }) => {
  const { t } = useTranslation('trainer');

  const stats = [
    {
      icon: Trophy,
      label: t('progress.currentStage'),
      value: trainerProgress?.current_stage || 1,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
    {
      icon: Star,
      label: t('progress.highestStage'),
      value: trainerProgress?.highest_stage_cleared || 0,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
    },
    {
      icon: Swords,
      label: t('progress.battlesWon'),
      value: trainerProgress?.total_battles_won || 0,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      icon: Crosshair,
      label: t('progress.pokemonDefeated'),
      value: trainerProgress?.total_pokemon_defeated || 0,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
    },
  ];

  // Count pokemon by star rating
  const starCounts = [1, 2, 3, 4, 5, 6].map(star => ({
    star,
    count: trainerPokemon.filter(p => p.star_rating === star).length,
  }));

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={cn(
              "p-4 rounded-xl border border-slate-700/50",
              stat.bgColor
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={cn("h-5 w-5", stat.color)} />
              <span className="text-xs text-slate-400">{stat.label}</span>
            </div>
            <p className={cn("text-2xl font-bold", stat.color)}>
              {stat.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Pokemon Collection Stats */}
      <div className="bg-slate-700/30 rounded-xl p-4">
        <h4 className="text-sm font-medium text-slate-300 mb-3">{t('pokemon.collection')}</h4>
        <div className="grid grid-cols-6 gap-2">
          {starCounts.map(({ star, count }) => (
            <div
              key={star}
              className="text-center p-2 bg-slate-800/50 rounded-lg"
            >
              <div className="flex justify-center gap-0.5 mb-1">
                {star <= 3 ? (
                  Array.from({ length: star }).map((_, i) => (
                    <Star key={i} className={cn("h-3 w-3 fill-current", STAR_COLORS[star])} />
                  ))
                ) : (
                  <>
                    <Star className={cn("h-3 w-3 fill-current", STAR_COLORS[star])} />
                    <span className={cn("text-[10px] font-bold", STAR_COLORS[star])}>
                      {star}★
                    </span>
                  </>
                )}
              </div>
              <p className="text-lg font-bold text-white">{count}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 text-center text-sm text-slate-400">
          {t('pokemon.total')}: <span className="font-bold text-white">{trainerPokemon.length}</span>
        </div>
      </div>
    </div>
  );
};

export default TrainerTabs;
