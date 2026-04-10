import { useMemo, useState } from 'react';
import PetSlot from './PetSlot';
import { useTranslation } from 'react-i18next';
import { Plus, Star, Zap, Sparkles, Crown, Shield, BarChart3 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import TeamStatsModal from './TeamStatsModal';
import { calculatePokemonDamage, type StatGrade } from '@/data/trainerPokemonPool';

interface TrainerPokemonData {
  id: string;
  pokemon_id: number;
  pokemon_name: string;
  pokemon_type: string;
  secondary_type?: string | null;
  star_rating: number;
  level: number;
  experience: number;
  power: number;
  stat_damage: string;
  stat_speed: string;
  stat_effect: string;
  is_evolved: boolean;
  evolved_from?: string | null;
  is_shiny: boolean;
}

interface TrainerTeamData {
  slot_1_pokemon_id?: string | null;
  slot_2_pokemon_id?: string | null;
  slot_3_pokemon_id?: string | null;
  pet_pokemon_id?: number;
  pet_pokemon_name?: string;
  pet_rarity?: string;
  pet_is_shiny?: boolean;
}

interface FloatingTeamSlotsProps {
  trainerPokemon: TrainerPokemonData[];
  trainerTeam: TrainerTeamData | null;
  teamPokemon: TrainerPokemonData[];
  onUpdateSlot: (slot: 1 | 2 | 3, pokemonId: string | null) => Promise<boolean>;
  onSetPet: (pokemonId: number, pokemonName: string, rarity: string, isShiny: boolean) => Promise<boolean>;
  onRemovePet: () => Promise<boolean>;
}

const TYPE_COLORS_HEX: Record<string, string> = {
  fire: '#F08030',
  water: '#6890F0',
  grass: '#78C850',
  electric: '#F8D030',
  psychic: '#F85888',
  ice: '#98D8D8',
  dragon: '#7038F8',
  dark: '#705848',
  fairy: '#EE99AC',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  steel: '#B8B8D0',
  normal: '#A8A878',
};

const TYPE_COLORS: Record<string, string> = {
  fire: 'from-orange-500 to-red-500',
  water: 'from-blue-400 to-blue-600',
  grass: 'from-green-400 to-green-600',
  electric: 'from-yellow-400 to-amber-500',
  psychic: 'from-pink-400 to-purple-500',
  ice: 'from-cyan-300 to-blue-400',
  dragon: 'from-indigo-500 to-purple-600',
  dark: 'from-gray-600 to-gray-800',
  fairy: 'from-pink-300 to-pink-500',
  fighting: 'from-red-600 to-orange-700',
  poison: 'from-purple-500 to-purple-700',
  ground: 'from-amber-600 to-yellow-700',
  flying: 'from-sky-400 to-indigo-400',
  bug: 'from-lime-500 to-green-600',
  rock: 'from-stone-500 to-stone-700',
  ghost: 'from-purple-600 to-indigo-700',
  steel: 'from-gray-400 to-slate-500',
  normal: 'from-gray-300 to-gray-500',
};

const getTrainerSpriteUrl = (pokemonId: number, isShiny?: boolean) => {
  const base = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
  return isShiny ? `${base}/shiny/${pokemonId}.png` : `${base}/${pokemonId}.png`;
};

const FloatingTeamSlots = ({ 
  trainerPokemon, 
  trainerTeam, 
  teamPokemon,
  onUpdateSlot,
  onSetPet,
  onRemovePet,
}: FloatingTeamSlotsProps) => {
  const { t } = useTranslation('trainer');
  const isMobile = useIsMobile();
  const [selectedSlot, setSelectedSlot] = useState<1 | 2 | 3 | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  const getSlotPokemon = (slot: 1 | 2 | 3): TrainerPokemonData | null => {
    if (!trainerTeam) return null;
    const pokemonId = trainerTeam[`slot_${slot}_pokemon_id` as keyof TrainerTeamData];
    return trainerPokemon.find(p => p.id === pokemonId) || null;
  };

  const handleSlotClick = (slot: 1 | 2 | 3) => {
    setSelectedSlot(slot);
  };

  const handleSelectPokemon = async (pokemonId: string | null) => {
    if (selectedSlot) {
      await onUpdateSlot(selectedSlot, pokemonId);
      setSelectedSlot(null);
    }
  };

  const isPokemonInTeam = (pokemonId: string): boolean => {
    if (!trainerTeam) return false;
    return (
      trainerTeam.slot_1_pokemon_id === pokemonId ||
      trainerTeam.slot_2_pokemon_id === pokemonId ||
      trainerTeam.slot_3_pokemon_id === pokemonId
    );
  };

  const getRealDamage = (pokemon: TrainerPokemonData): number => {
    let damage = calculatePokemonDamage(
      pokemon.power,
      pokemon.stat_damage as StatGrade,
      pokemon.level,
      pokemon.pokemon_type
    );

    if (pokemon.is_shiny) {
      damage = Math.floor(damage * 1.5);
    }

    return damage;
  };

  const sortedSelectorPokemon = useMemo(() => {
    return [...trainerPokemon].sort((a, b) => {
      if (b.star_rating !== a.star_rating) return b.star_rating - a.star_rating;
      return getRealDamage(b) - getRealDamage(a);
    });
  }, [trainerPokemon]);

  const totalDPS = teamPokemon.reduce((sum, p) => sum + p.power, 0);

  return (
    <>
      <div className="flex flex-col items-center gap-2 sm:gap-3 py-3 sm:py-4">
        <button
          onClick={() => setShowStatsModal(true)}
          className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-red-500/20 to-amber-500/20 rounded-full border border-red-500/30 shadow-lg hover:from-red-500/30 hover:to-amber-500/30 hover:border-amber-400/50 transition-all duration-200 hover:scale-105 cursor-pointer group"
        >
          <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 group-hover:text-amber-300 transition-colors" />
          <span className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-100 transition-colors">
            {t('team.stats', 'Estatísticas do Time')}
          </span>
        </button>
        
        {/* Mobile: Stack Pet below, Desktop: Side by side centered */}
        {isMobile ? (
          <div className="flex flex-col items-center gap-3">
            {/* Pokemon Slots */}
            <div className="flex justify-center gap-2">
              {([1, 2, 3] as const).map((slot) => {
            const pokemon = getSlotPokemon(slot);
            const typeColorHex = pokemon ? (TYPE_COLORS_HEX[pokemon.pokemon_type] || TYPE_COLORS_HEX.normal) : '';
            const isHighRarity = pokemon && pokemon.star_rating >= 5;

            return (
              <button
                key={slot}
                onClick={() => handleSlotClick(slot)}
                className={cn(
                  "relative rounded-xl sm:rounded-2xl border-2 transition-all duration-300 overflow-hidden group",
                  isMobile ? "w-24 h-32" : "w-40 h-52",
                  pokemon 
                    ? "hover:scale-105 sm:hover:scale-110 hover:shadow-2xl border-white/50 shadow-xl" 
                    : "bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-dashed border-slate-600/60 hover:border-amber-400/60 hover:scale-105",
                  isHighRarity && "animate-pulse-subtle ring-2 ring-amber-300/60"
                )}
                style={pokemon ? {
                  background: `linear-gradient(135deg, ${typeColorHex}50 0%, ${typeColorHex}20 50%, ${typeColorHex}40 100%)`,
                  boxShadow: `0 8px 28px ${typeColorHex}70, inset 0 1px 0 rgba(255,255,255,0.15)`
                } : undefined}
              >
                {/* Background pattern */}
                {pokemon && (
                  <>
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
                        backgroundSize: '15px 15px'
                      }} />
                    </div>
                    {isHighRarity && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                    )}
                  </>
                )}

                {pokemon ? (
                  <div className={cn(
                    "relative flex flex-col items-center justify-center h-full z-10",
                    isMobile ? "p-1.5" : "p-2.5"
                  )}>
                    {/* Type Badge - Top Left */}
                    <div className="absolute top-2 left-2 z-20">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-lg text-white font-bold shadow-lg border border-white/40",
                          isMobile ? "text-[8px]" : "text-[10px] px-3 py-1.5"
                        )}
                        style={{ 
                          backgroundColor: typeColorHex,
                          boxShadow: `0 4px 12px ${typeColorHex}90`
                        }}
                      >
                        {pokemon.pokemon_type.toUpperCase()}
                      </span>
                    </div>

                    {/* Team indicator - Top Right */}
                    <div className="absolute top-2 right-2">
                      <Shield className={cn(
                        "text-yellow-400 fill-yellow-400/50 drop-shadow-lg animate-pulse",
                        isMobile ? "h-3 w-3" : "h-3.5 w-3.5"
                      )} />
                    </div>

                    {/* Crown for 6 star */}
                    {pokemon.star_rating === 6 && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 animate-bounce">
                        <Crown className={cn(
                          "text-pink-400 fill-pink-400 drop-shadow-lg",
                          isMobile ? "h-3 w-3" : "h-4 w-4"
                        )} />
                      </div>
                    )}

                    {/* Sprite with effects */}
                    <div className={cn(
                      "relative",
                      isMobile ? "mb-1 mt-4" : "mb-1.5 mt-2"
                    )}>
                      {/* Glow */}
                      <div 
                        className="absolute inset-0 blur-xl opacity-50"
                        style={{ 
                          background: pokemon.star_rating >= 4
                            ? `radial-gradient(circle, ${typeColorHex}90 0%, transparent 70%)`
                            : 'transparent'
                        }}
                      />
                      
                      {/* Ring */}
                      {pokemon.star_rating >= 4 && (
                        <div 
                          className="absolute inset-0 rounded-full opacity-25"
                          style={{ 
                            background: `conic-gradient(from 0deg, ${typeColorHex}, transparent, ${typeColorHex})`,
                            animation: isHighRarity ? 'spin 8s linear infinite' : 'spin 12s linear infinite'
                          }}
                        />
                      )}

                      <img
                        src={getTrainerSpriteUrl(pokemon.pokemon_id, pokemon.is_shiny)}
                        alt={pokemon.pokemon_name}
                        className={cn(
                          "relative pixelated drop-shadow-2xl transition-transform group-hover:scale-110 sm:group-hover:scale-120",
                          isMobile ? "w-16 h-16" : "w-28 h-28",
                          isHighRarity && "drop-shadow-[0_0_18px_rgba(251,191,36,0.9)] animate-float"
                        )}
                        style={{ imageRendering: 'pixelated' }}
                      />

                      {pokemon.is_shiny && (
                        <Badge className="absolute -top-1.5 -left-1.5 text-[8px] px-1 py-0 bg-gradient-to-r from-yellow-400 to-amber-500 text-black border-0 z-20">
                          SHINY
                        </Badge>
                      )}

                      {/* Sparkles */}
                      {isHighRarity && !isMobile && (
                        <>
                          <Sparkles className="absolute top-0 right-0 h-3 w-3 text-yellow-300 animate-ping" style={{ animationDuration: '2s' }} />
                          <Sparkles className="absolute bottom-0 left-0 h-2 w-2 text-pink-300 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                        </>
                      )}
                    </div>

                    {/* Name */}
                    <span className={cn(
                      "font-bold text-white truncate w-full text-center capitalize drop-shadow-lg px-1",
                      isMobile ? "text-[10px] mt-1" : "text-sm mt-2"
                    )}>
                      {pokemon.pokemon_name}
                    </span>

                    {/* Level and Stars */}
                    <div className={cn(
                      "flex items-center gap-1 sm:gap-2",
                      isMobile ? "mt-1" : "mt-2"
                    )}>
                      <span className={cn(
                        "text-white bg-slate-900/90 rounded-lg font-bold border border-white/30 shadow-md",
                        isMobile ? "text-[9px] px-2 py-0.5" : "text-[11px] px-3 py-1.5"
                      )}>
                        Lv.{pokemon.level}
                      </span>
                      <div className="flex gap-0.5">
                        {[...Array(Math.min(pokemon.star_rating, 3))].map((_, i) => (
                          <Star key={i} className={cn(
                            "fill-amber-400 text-amber-400 drop-shadow-lg",
                            isMobile ? "h-2 w-2" : "h-2.5 w-2.5"
                          )} />
                        ))}
                        {pokemon.star_rating > 3 && (
                          <span className={cn(
                            "text-amber-400 font-bold drop-shadow",
                            isMobile ? "text-[7px]" : "text-[9px]"
                          )}>+{pokemon.star_rating - 3}</span>
                        )}
                      </div>
                    </div>

                    {/* Damage per attack - hide on mobile */}
                    {!isMobile && (
                      <div className="mt-1.5 px-3 py-1 bg-gradient-to-r from-red-500/20 to-amber-500/20 rounded-lg border border-amber-500/30 shadow-md">
                        <span className="text-[10px] text-amber-400 font-bold">
                          ⚔️ {calculatePokemonDamage(
                            pokemon.power,
                            pokemon.stat_damage as StatGrade,
                            pokemon.level,
                            pokemon.pokemon_type
                          )}
                        </span>
                      </div>
                    )}

                    {/* Hover glow */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{
                        boxShadow: `inset 0 0 25px ${typeColorHex}50`
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 transition-all group-hover:text-amber-400/70">
                    <div className={cn(
                      "rounded-full border-2 border-dashed border-slate-600/60 flex items-center justify-center mb-1 sm:mb-2 transition-all group-hover:border-amber-400/50 group-hover:bg-slate-700/30",
                      isMobile ? "w-10 h-10" : "w-16 h-16"
                    )}>
                      <Plus className={cn(
                        "transition-all group-hover:scale-110",
                        isMobile ? "h-5 w-5" : "h-8 w-8"
                      )} />
                    </div>
                    <span className={cn(
                      "font-semibold",
                      isMobile ? "text-[10px]" : "text-xs"
                    )}>Slot {slot}</span>
                    {!isMobile && (
                      <span className="text-[10px] text-slate-600 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">Adicionar</span>
                    )}
                  </div>
                )}

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
              </button>
            );
          })}
            </div>
            
            {/* Pet Slot below on mobile */}
            <PetSlot
              petData={{
                pet_pokemon_id: trainerTeam?.pet_pokemon_id,
                pet_pokemon_name: trainerTeam?.pet_pokemon_name,
                pet_rarity: trainerTeam?.pet_rarity,
                pet_is_shiny: trainerTeam?.pet_is_shiny,
              }}
              onSetPet={onSetPet}
              onRemovePet={onRemovePet}
            />
          </div>
        ) : (
          /* Desktop: Centered pokemon slots with pet on the side */
          <div className="relative flex justify-center w-full">
            {/* Centered Pokemon Slots */}
            <div className="flex justify-center gap-4">
              {([1, 2, 3] as const).map((slot) => {
                const pokemon = getSlotPokemon(slot);
                const typeColorHex = pokemon ? (TYPE_COLORS_HEX[pokemon.pokemon_type] || TYPE_COLORS_HEX.normal) : '';
                const isHighRarity = pokemon && pokemon.star_rating >= 5;

                return (
                  <button
                    key={slot}
                    onClick={() => handleSlotClick(slot)}
                    className={cn(
                      "relative rounded-2xl border-2 transition-all duration-300 overflow-hidden group w-40 h-52",
                      pokemon 
                        ? "hover:scale-110 hover:shadow-2xl border-white/50 shadow-xl" 
                        : "bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-dashed border-slate-600/60 hover:border-amber-400/60 hover:scale-105",
                      isHighRarity && "animate-pulse-subtle ring-2 ring-amber-300/60"
                    )}
                    style={pokemon ? {
                      background: `linear-gradient(135deg, ${typeColorHex}50 0%, ${typeColorHex}20 50%, ${typeColorHex}40 100%)`,
                      boxShadow: `0 8px 28px ${typeColorHex}70, inset 0 1px 0 rgba(255,255,255,0.15)`
                    } : undefined}
                  >
                    {/* Same content as mobile but without isMobile conditionals */}
                    {pokemon && (
                      <>
                        <div className="absolute inset-0 opacity-5">
                          <div className="absolute inset-0" style={{
                            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
                            backgroundSize: '15px 15px'
                          }} />
                        </div>
                        {isHighRarity && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                        )}
                      </>
                    )}

                    {pokemon ? (
                      <div className="relative flex flex-col items-center justify-center h-full z-10 p-2.5">
                        <div className="absolute top-2 left-2 z-20">
                          <span
                            className="px-3 py-1.5 rounded-lg text-white font-bold shadow-lg border border-white/40 text-[10px]"
                            style={{ 
                              backgroundColor: typeColorHex,
                              boxShadow: `0 4px 12px ${typeColorHex}90`
                            }}
                          >
                            {pokemon.pokemon_type.toUpperCase()}
                          </span>
                        </div>

                        <div className="absolute top-2 right-2">
                          <Shield className="text-yellow-400 fill-yellow-400/50 drop-shadow-lg animate-pulse h-3.5 w-3.5" />
                        </div>

                        {pokemon.star_rating === 6 && (
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 animate-bounce">
                            <Crown className="text-pink-400 fill-pink-400 drop-shadow-lg h-4 w-4" />
                          </div>
                        )}

                        <div className="relative mb-1.5 mt-2">
                          <div 
                            className="absolute inset-0 blur-xl opacity-50"
                            style={{ 
                              background: pokemon.star_rating >= 4
                                ? `radial-gradient(circle, ${typeColorHex}90 0%, transparent 70%)`
                                : 'transparent'
                            }}
                          />
                          
                          {pokemon.star_rating >= 4 && (
                            <div 
                              className="absolute inset-0 rounded-full opacity-25"
                              style={{ 
                                background: `conic-gradient(from 0deg, ${typeColorHex}, transparent, ${typeColorHex})`,
                                animation: isHighRarity ? 'spin 8s linear infinite' : 'spin 12s linear infinite'
                              }}
                            />
                          )}

                          <img
                            src={getTrainerSpriteUrl(pokemon.pokemon_id, pokemon.is_shiny)}
                            alt={pokemon.pokemon_name}
                            className={cn(
                              "relative pixelated drop-shadow-2xl transition-transform group-hover:scale-120 w-28 h-28",
                              isHighRarity && "drop-shadow-[0_0_18px_rgba(251,191,36,0.9)] animate-float"
                            )}
                            style={{ imageRendering: 'pixelated' }}
                          />

                          {pokemon.is_shiny && (
                            <Badge className="absolute -top-1.5 -left-1.5 text-[8px] px-1 py-0 bg-gradient-to-r from-yellow-400 to-amber-500 text-black border-0 z-20">
                              SHINY
                            </Badge>
                          )}

                          {isHighRarity && (
                            <>
                              <Sparkles className="absolute top-0 right-0 h-3 w-3 text-yellow-300 animate-ping" style={{ animationDuration: '2s' }} />
                              <Sparkles className="absolute bottom-0 left-0 h-2 w-2 text-pink-300 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                            </>
                          )}
                        </div>

                        <span className="font-bold text-white truncate w-full text-center capitalize drop-shadow-lg px-1 text-sm mt-2">
                          {pokemon.pokemon_name}
                        </span>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-white bg-slate-900/90 rounded-lg font-bold border border-white/30 shadow-md text-[11px] px-3 py-1.5">
                            Lv.{pokemon.level}
                          </span>
                          <div className="flex gap-0.5">
                            {[...Array(Math.min(pokemon.star_rating, 3))].map((_, i) => (
                              <Star key={i} className="fill-amber-400 text-amber-400 drop-shadow-lg h-2.5 w-2.5" />
                            ))}
                            {pokemon.star_rating > 3 && (
                              <span className="text-amber-400 font-bold drop-shadow text-[9px]">+{pokemon.star_rating - 3}</span>
                            )}
                          </div>
                        </div>

                        <div className="mt-1.5 px-3 py-1 bg-gradient-to-r from-red-500/20 to-amber-500/20 rounded-lg border border-amber-500/30 shadow-md">
                          <span className="text-[10px] text-amber-400 font-bold">
                            ⚔️ {calculatePokemonDamage(
                              pokemon.power,
                              pokemon.stat_damage as StatGrade,
                              pokemon.level,
                              pokemon.pokemon_type
                            )}
                          </span>
                        </div>

                        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                          style={{
                            boxShadow: `inset 0 0 25px ${typeColorHex}50`
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-500 transition-all group-hover:text-amber-400/70">
                        <div className="rounded-full border-2 border-dashed border-slate-600/60 flex items-center justify-center mb-2 transition-all group-hover:border-amber-400/50 group-hover:bg-slate-700/30 w-16 h-16">
                          <Plus className="transition-all group-hover:scale-110 h-8 w-8" />
                        </div>
                        <span className="font-semibold text-xs">Slot {slot}</span>
                        <span className="text-[10px] text-slate-600 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">Adicionar</span>
                      </div>
                    )}

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
                  </button>
                );
              })}
            </div>
            
            {/* Pet Slot - positioned to the right of the centered slots */}
            <div className="absolute top-0 left-[calc(50%+280px)]">
              <PetSlot
                petData={{
                  pet_pokemon_id: trainerTeam?.pet_pokemon_id,
                  pet_pokemon_name: trainerTeam?.pet_pokemon_name,
                  pet_rarity: trainerTeam?.pet_rarity,
                  pet_is_shiny: trainerTeam?.pet_is_shiny,
                }}
                onSetPet={onSetPet}
                onRemovePet={onRemovePet}
              />
            </div>
          </div>
        )}
      </div>

      {/* Pokemon Selector Dialog */}
      <Dialog open={selectedSlot !== null} onOpenChange={() => setSelectedSlot(null)}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-amber-400 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('team.selectPokemon')} - Slot {selectedSlot}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[300px] pr-2">
            <div className="grid grid-cols-3 gap-2">
              {sortedSelectorPokemon.map((pokemon) => {
                const inTeam = isPokemonInTeam(pokemon.id);
                const typeColorGradient = TYPE_COLORS[pokemon.pokemon_type] || TYPE_COLORS.normal;
                const typeColorHex = TYPE_COLORS_HEX[pokemon.pokemon_type] || TYPE_COLORS_HEX.normal;
                const isHighRarity = pokemon.star_rating >= 5;
                const realDamage = getRealDamage(pokemon);

                return (
                  <button
                    key={pokemon.id}
                    onClick={() => handleSelectPokemon(pokemon.id)}
                    disabled={inTeam}
                    className={cn(
                      "relative p-2 rounded-xl border-2 transition-all duration-300 overflow-hidden",
                      inTeam 
                        ? 'opacity-50 cursor-not-allowed border-blue-500/40 bg-gradient-to-br from-blue-900/30 to-blue-800/20' 
                        : `border-white/30 hover:scale-105 hover:shadow-lg ${isHighRarity && 'animate-pulse-subtle'}`
                    )}
                    style={!inTeam ? {
                      background: `linear-gradient(135deg, ${typeColorHex}30 0%, ${typeColorHex}10 50%, ${typeColorHex}25 100%)`,
                      boxShadow: `0 2px 12px ${typeColorHex}30`
                    } : undefined}
                  >
                    {/* Background */}
                    {!inTeam && (
                      <>
                        <div className="absolute inset-0 opacity-5">
                          <div className="absolute inset-0" style={{
                            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
                            backgroundSize: '10px 10px'
                          }} />
                        </div>
                        {isHighRarity && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                        )}
                      </>
                    )}

                    {inTeam && (
                      <Badge className="absolute top-1 right-1 text-[8px] px-1.5 py-0.5 bg-gradient-to-r from-blue-600 to-blue-500 border-0 z-10">
                        IN TEAM
                      </Badge>
                    )}

                    {/* Stars */}
                    <div className="relative flex justify-center gap-0.5 mb-1 z-10">
                      {[...Array(Math.min(pokemon.star_rating, 3))].map((_, i) => (
                        <Star key={i} className={cn(
                          "h-2 w-2 fill-amber-400 text-amber-400 drop-shadow",
                          isHighRarity && "animate-pulse"
                        )} />
                      ))}
                      {pokemon.star_rating > 3 && (
                        <span className="text-[8px] text-amber-400 font-bold">
                          +{pokemon.star_rating - 3}
                        </span>
                      )}
                    </div>

                    {/* Sprite */}
                    <div className="relative z-10">
                      {/* Glow */}
                      {pokemon.star_rating >= 4 && (
                        <div 
                          className="absolute inset-0 blur-lg opacity-30"
                          style={{ 
                            background: `radial-gradient(circle, ${typeColorHex}70 0%, transparent 70%)`
                          }}
                        />
                      )}
                      
                      {/* Ring */}
                      {pokemon.star_rating >= 4 && (
                        <div 
                          className="absolute inset-0 rounded-full opacity-15"
                          style={{ 
                            background: `conic-gradient(from 0deg, ${typeColorHex}, transparent, ${typeColorHex})`,
                            animation: isHighRarity ? 'spin 8s linear infinite' : 'spin 12s linear infinite'
                          }}
                        />
                      )}

                      <img
                        src={getTrainerSpriteUrl(pokemon.pokemon_id, pokemon.is_shiny)}
                        alt={pokemon.pokemon_name}
                        className={cn(
                          "relative w-12 h-12 mx-auto pixelated",
                          isHighRarity && "drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]"
                        )}
                        style={{ imageRendering: 'pixelated' }}
                      />

                      {pokemon.is_shiny && (
                        <Badge className="absolute top-0 left-0 text-[7px] px-1 py-0 bg-gradient-to-r from-yellow-400 to-amber-500 text-black border-0 z-20">
                          SHINY
                        </Badge>
                      )}

                      {/* Sparkles */}
                      {isHighRarity && !inTeam && (
                        <>
                          <Sparkles className="absolute top-0 right-1 h-1.5 w-1.5 text-yellow-300 animate-ping" style={{ animationDuration: '2s' }} />
                          <Sparkles className="absolute bottom-0 left-1 h-1 w-1 text-pink-300 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                        </>
                      )}
                    </div>

                    {/* Name */}
                    <p className="relative text-[10px] text-white text-center truncate capitalize font-semibold mt-1 drop-shadow z-10">
                      {pokemon.pokemon_name}
                    </p>

                    {/* Power */}
                    <p className="relative text-[9px] text-center text-amber-400 mt-1 font-bold bg-amber-500/15 py-0.5 rounded border border-amber-500/20 z-10">
                      ⚔️ {realDamage}
                    </p>

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
                    `}</style>
                  </button>
                );
              })}
            </div>

            {sortedSelectorPokemon.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm">{t('pokemon.noPokemon')}</p>
              </div>
            )}
          </ScrollArea>

          {selectedSlot && getSlotPokemon(selectedSlot) && (
            <Button
              variant="outline"
              onClick={() => handleSelectPokemon(null)}
              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
            >
              {t('team.removeFromSlot')}
            </Button>
          )}
        </DialogContent>
      </Dialog>

      {/* Team Stats Modal */}
      <TeamStatsModal 
        open={showStatsModal}
        onOpenChange={setShowStatsModal}
        teamPokemon={teamPokemon}
      />
    </>
  );
};

export default FloatingTeamSlots;
