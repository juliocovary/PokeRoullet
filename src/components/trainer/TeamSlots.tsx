import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, Plus, X, Star, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { TYPE_COLORS, type PokemonType } from '@/data/typeAdvantages';
import { calculatePokemonDamage, type StatGrade } from '@/data/trainerPokemonPool';
import type { TrainerPokemonData, TrainerTeamData } from '@/hooks/useTrainerMode';

interface TeamSlotsProps {
  trainerPokemon: TrainerPokemonData[];
  trainerTeam: TrainerTeamData | null;
  teamPokemon: TrainerPokemonData[];
  onUpdateSlot: (slot: 1 | 2 | 3, pokemonId: string | null) => Promise<boolean>;
}

const STAR_STYLES: Record<number, { text: string; bg: string; border: string }> = {
  1: { text: 'text-slate-400', bg: 'bg-slate-700/30', border: 'border-slate-600/40' },
  2: { text: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-500/30' },
  3: { text: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-500/40' },
  4: { text: 'text-purple-400', bg: 'bg-purple-900/30', border: 'border-purple-500/50' },
  5: { text: 'text-amber-400', bg: 'bg-amber-900/30', border: 'border-amber-400/50' },
  6: { text: 'text-pink-400', bg: 'bg-pink-900/30', border: 'border-pink-400/50' },
};

const TeamSlots = ({ trainerPokemon, trainerTeam, teamPokemon, onUpdateSlot }: TeamSlotsProps) => {
  const { t } = useTranslation('trainer');
  const [selectedSlot, setSelectedSlot] = useState<1 | 2 | 3 | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Calculate team DPS
  const totalPower = teamPokemon.reduce((sum, p) => sum + p.power, 0);

  const handleSlotClick = (slot: 1 | 2 | 3) => {
    setSelectedSlot(slot);
    setShowSelector(true);
  };

  const handleSelectPokemon = async (pokemonId: string | null) => {
    if (selectedSlot) {
      setIsUpdating(true);
      const success = await onUpdateSlot(selectedSlot, pokemonId);
      setIsUpdating(false);
      if (success) {
        setShowSelector(false);
        setSelectedSlot(null);
      }
    }
  };

  const getSlotPokemon = (slot: 1 | 2 | 3): TrainerPokemonData | null => {
    if (!trainerTeam) return null;
    const slotKey = `slot_${slot}_pokemon_id` as keyof TrainerTeamData;
    const pokemonId = trainerTeam[slotKey] as string | undefined;
    return trainerPokemon.find(p => p.id === pokemonId) || null;
  };

  const hasPokemon = trainerPokemon.length > 0;

  return (
    <>
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700/50 p-4 sm:p-6 h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">{t('team.title')}</h3>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 rounded-full border border-red-500/30">
            <span className="text-xs text-red-400 font-bold">DPS</span>
            <span className="text-sm font-bold text-white">{totalPower}/s</span>
          </div>
        </div>

        {/* Empty state hint */}
        {!hasPokemon && (
          <div className="mb-4 p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-200/80">
              {t('team.summonFirst')}
            </p>
          </div>
        )}

        {/* Team Slots */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((slot) => {
            const pokemon = getSlotPokemon(slot as 1 | 2 | 3);
            const typeColor = pokemon ? TYPE_COLORS[pokemon.pokemon_type as PokemonType] || '#A8A878' : null;
            const styles = pokemon ? STAR_STYLES[pokemon.star_rating] || STAR_STYLES[1] : null;
            const isHighRarity = pokemon && pokemon.star_rating >= 5;

            return (
              <div
                key={slot}
                onClick={() => hasPokemon && handleSlotClick(slot as 1 | 2 | 3)}
                className={cn(
                  "relative rounded-2xl border-2 p-3 transition-all duration-300 min-h-[160px] flex flex-col items-center justify-center overflow-hidden group",
                  pokemon
                    ? cn(
                        "border-solid cursor-pointer hover:scale-[1.03] hover:shadow-xl",
                        isHighRarity && "animate-pulse-subtle"
                      )
                    : cn(
                        "border-dashed",
                        hasPokemon 
                          ? "border-slate-600/60 bg-gradient-to-br from-slate-800/60 to-slate-900/60 hover:border-amber-500/60 hover:from-slate-700/50 hover:to-slate-800/50 cursor-pointer" 
                          : "border-slate-700/30 bg-slate-900/30 cursor-not-allowed opacity-50"
                      )
                )}
                style={{
                  background: pokemon 
                    ? `linear-gradient(135deg, ${typeColor}30 0%, ${typeColor}10 50%, ${typeColor}25 100%)`
                    : undefined,
                  borderColor: pokemon ? `${typeColor}60` : undefined,
                  boxShadow: pokemon ? `0 4px 16px ${typeColor}30, inset 0 1px 0 rgba(255,255,255,0.1)` : undefined
                }}
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
                  <>
                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPokemon(null);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110 z-10"
                    >
                      <X className="h-3.5 w-3.5 text-white" />
                    </button>

                    {/* Stars with enhanced glow */}
                    <div className="relative flex gap-0.5 mb-2 z-10">
                      {Array.from({ length: Math.min(pokemon.star_rating, 5) }).map((_, i) => (
                        <div key={i} className="relative">
                          <Star className={cn("h-3 w-3 fill-current drop-shadow-md", styles?.text)} />
                          {isHighRarity && (
                            <Star className={cn("h-3 w-3 fill-current absolute inset-0 blur-sm opacity-50 animate-pulse", styles?.text)} />
                          )}
                        </div>
                      ))}
                      {pokemon.star_rating === 6 && (
                        <Sparkles className="h-3 w-3 text-pink-400 animate-pulse ml-0.5" />
                      )}
                    </div>

                    {/* Sprite with enhanced glow and ring */}
                    <div className="relative mb-2 z-10">
                      {/* Radial glow */}
                      <div 
                        className="absolute inset-0 blur-xl opacity-50 scale-75"
                        style={{ 
                          background: `radial-gradient(circle, ${typeColor}90 0%, transparent 70%)`
                        }}
                      />
                      
                      {/* Rotating ring for high rarity */}
                      {pokemon.star_rating >= 4 && (
                        <div 
                          className="absolute inset-0 rounded-full opacity-20 scale-110"
                          style={{ 
                            background: `conic-gradient(from 0deg, ${typeColor}, transparent, ${typeColor})`,
                            animation: isHighRarity ? 'spin 8s linear infinite' : 'spin 12s linear infinite'
                          }}
                        />
                      )}

                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemon_id}.png`}
                          alt={pokemon.pokemon_name}
                          className={cn(
                            "w-14 h-14 pixelated transition-transform group-hover:scale-110",
                            isHighRarity && "drop-shadow-[0_0_12px_rgba(251,191,36,0.7)] animate-float"
                          )}
                          style={{ imageRendering: 'pixelated' }}
                        />
                      </div>

                      {/* Sparkle particles */}
                      {isHighRarity && (
                        <>
                          <Sparkles className="absolute top-0 right-0 h-2.5 w-2.5 text-yellow-300 animate-ping" style={{ animationDuration: '2s' }} />
                          <Sparkles className="absolute bottom-0 left-0 h-2 w-2 text-pink-300 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                        </>
                      )}
                    </div>

                    {/* Name with better styling */}
                    <p className="relative text-[11px] font-bold text-white text-center truncate w-full capitalize drop-shadow-lg z-10">
                      {pokemon.pokemon_name}
                    </p>

                    {/* Type badge */}
                    <div className="relative flex justify-center mt-1 z-10">
                      <span
                        className="text-[9px] px-2 py-0.5 rounded-full text-white font-bold shadow-md border border-white/20"
                        style={{ 
                          backgroundColor: typeColor,
                          boxShadow: `0 2px 6px ${typeColor}60`
                        }}
                      >
                        {pokemon.pokemon_type}
                      </span>
                    </div>

                    {/* Level & Power with enhanced design */}
                    <div className="relative flex items-center gap-2 mt-2 z-10">
                      <span className="text-[9px] text-white/80 bg-slate-800/70 px-2 py-1 rounded-lg font-semibold border border-white/10">
                        Lv.{pokemon.level}
                      </span>
                      <span className="text-[9px] text-amber-400 font-bold bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-2 py-1 rounded-lg border border-amber-500/30">
                        ⚔️ {calculatePokemonDamage(pokemon.power, pokemon.stat_damage as StatGrade, pokemon.level, pokemon.pokemon_type)}
                      </span>
                    </div>

                    {/* Hover glow effect */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{
                        boxShadow: `inset 0 0 20px ${typeColor}40`
                      }}
                    />
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-600/60 flex items-center justify-center mb-2 transition-all group-hover:border-amber-500/40 group-hover:bg-slate-700/20">
                      <Plus className="h-6 w-6 text-slate-500 transition-all group-hover:text-amber-400/60 group-hover:scale-110" />
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold">{t('team.slot', { number: slot })}</p>
                    {hasPokemon && (
                      <p className="text-[9px] text-slate-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Clique para adicionar</p>
                    )}
                  </>
                )}

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
            );
          })}
        </div>
      </div>

      {/* Pokemon Selector Dialog */}
      <Dialog open={showSelector} onOpenChange={setShowSelector}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              {t('team.selectPokemon')} - {t('team.slot', { number: selectedSlot })}
              {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="grid grid-cols-3 gap-2 p-2">
              {trainerPokemon.length === 0 ? (
                <div className="col-span-3 text-center py-8">
                  <AlertCircle className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">{t('pokemon.empty')}</p>
                  <p className="text-slate-600 text-xs mt-1">{t('team.summonFirst')}</p>
                </div>
              ) : (
                trainerPokemon.map((pokemon) => {
                  const isInTeam = teamPokemon.some(tp => tp.id === pokemon.id);
                  const typeColor = TYPE_COLORS[pokemon.pokemon_type as PokemonType] || '#A8A878';
                  const styles = STAR_STYLES[pokemon.star_rating] || STAR_STYLES[1];
                  const isHighRarity = pokemon.star_rating >= 5;

                  return (
                    <button
                      key={pokemon.id}
                      onClick={() => !isUpdating && handleSelectPokemon(pokemon.id)}
                      disabled={isInTeam || isUpdating}
                      className={cn(
                        "relative p-3 rounded-xl border-2 transition-all duration-300 overflow-hidden group",
                        isInTeam
                          ? "border-blue-500/40 bg-gradient-to-br from-blue-900/30 to-blue-800/20 opacity-60 cursor-not-allowed"
                          : cn(
                              "cursor-pointer hover:scale-[1.03] hover:shadow-lg",
                              isHighRarity && "animate-pulse-subtle"
                            )
                      )}
                      style={{
                        background: !isInTeam 
                          ? `linear-gradient(135deg, ${typeColor}25 0%, ${typeColor}10 50%, ${typeColor}20 100%)`
                          : undefined,
                        borderColor: !isInTeam ? `${typeColor}60` : undefined,
                        boxShadow: !isInTeam ? `0 2px 12px ${typeColor}25` : undefined
                      }}
                    >
                      {/* Background pattern */}
                      {!isInTeam && (
                        <>
                          <div className="absolute inset-0 opacity-5">
                            <div className="absolute inset-0" style={{
                              backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
                              backgroundSize: '12px 12px'
                            }} />
                          </div>
                          {isHighRarity && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                          )}
                        </>
                      )}

                      {isInTeam && (
                        <div className="absolute top-1 right-1 text-[8px] bg-gradient-to-r from-blue-600 to-blue-500 text-white px-2 py-0.5 rounded-full font-bold shadow-lg z-10">
                          IN TEAM
                        </div>
                      )}

                      {/* Stars with glow */}
                      <div className="relative flex justify-center gap-0.5 mb-1.5 z-10">
                        {Array.from({ length: Math.min(pokemon.star_rating, 3) }).map((_, i) => (
                          <div key={i} className="relative">
                            <Star className={cn("h-2.5 w-2.5 fill-current drop-shadow", styles.text)} />
                            {isHighRarity && (
                              <Star className={cn("h-2.5 w-2.5 fill-current absolute inset-0 blur-sm opacity-40 animate-pulse", styles.text)} />
                            )}
                          </div>
                        ))}
                        {pokemon.star_rating > 3 && (
                          <span className={cn("text-[9px] font-bold ml-0.5", styles.text)}>
                            +{pokemon.star_rating - 3}
                          </span>
                        )}
                      </div>

                      {/* Sprite with enhanced effects */}
                      <div className="relative z-10">
                        {/* Glow */}
                        <div 
                          className="absolute inset-0 blur-lg opacity-40"
                          style={{ 
                            background: pokemon.star_rating >= 4 
                              ? `radial-gradient(circle, ${typeColor}70 0%, transparent 70%)` 
                              : 'transparent'
                          }}
                        />
                        
                        {/* Ring */}
                        {pokemon.star_rating >= 4 && (
                          <div 
                            className="absolute inset-0 rounded-full opacity-15 scale-105"
                            style={{ 
                              background: `conic-gradient(from 0deg, ${typeColor}, transparent, ${typeColor})`,
                              animation: isHighRarity ? 'spin 8s linear infinite' : 'spin 12s linear infinite'
                            }}
                          />
                        )}

                        <div className="w-12 h-12 mx-auto flex items-center justify-center">
                          <img
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemon_id}.png`}
                            alt={pokemon.pokemon_name}
                            className={cn(
                              "w-11 h-11 pixelated transition-transform group-hover:scale-110",
                              isHighRarity && "drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]"
                            )}
                            style={{ imageRendering: 'pixelated' }}
                          />
                        </div>

                        {/* Sparkles */}
                        {isHighRarity && !isInTeam && (
                          <>
                            <Sparkles className="absolute top-0 right-1 h-2 w-2 text-yellow-300 animate-ping" style={{ animationDuration: '2s' }} />
                            <Sparkles className="absolute bottom-0 left-1 h-1.5 w-1.5 text-pink-300 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                          </>
                        )}
                      </div>

                      {/* Name */}
                      <p className="relative text-[10px] text-center text-white truncate mt-1.5 font-semibold capitalize drop-shadow z-10">
                        {pokemon.pokemon_name}
                      </p>

                      {/* Type Badge */}
                      <div className="relative flex justify-center mt-1 z-10">
                        <span
                          className="text-[8px] px-2 py-0.5 rounded-full text-white font-bold shadow-md border border-white/20"
                          style={{ 
                            backgroundColor: typeColor,
                            boxShadow: `0 1px 4px ${typeColor}60`
                          }}
                        >
                          {pokemon.pokemon_type}
                        </span>
                      </div>

                      {/* Power */}
                      <p className="relative text-[9px] text-center text-amber-400 mt-1.5 font-bold bg-gradient-to-r from-amber-500/15 to-yellow-500/15 py-0.5 rounded border border-amber-500/20 z-10">
                        ⚔️ {pokemon.power}
                      </p>

                      {/* Hover glow */}
                      {!isInTeam && (
                        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                          style={{
                            boxShadow: `inset 0 0 15px ${typeColor}30`
                          }}
                        />
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
                })
              )}
            </div>
          </ScrollArea>

          {selectedSlot && getSlotPokemon(selectedSlot) && (
            <Button
              variant="outline"
              onClick={() => handleSelectPokemon(null)}
              disabled={isUpdating}
              className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('team.removeFromSlot')}
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TeamSlots;