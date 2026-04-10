import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Star, Check, X, ArrowRight, FlaskConical, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { TYPE_COLORS, type PokemonType } from '@/data/typeAdvantages';
import type { TrainerPokemonData } from '@/hooks/useTrainerMode';
import { useItems } from '@/hooks/useItems';
import { toast } from 'sonner';
import { ESSENCE_ITEM_IDS } from '@/data/essenceConfig';
import { getTrainerEvolutionRequirements, type TrainerEvolutionRequirement } from '@/data/trainerEvolutionData';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

interface TrainerEvolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainerPokemon: TrainerPokemonData[];
  onEvolvePokemon: (
    pokemonId: string, 
    duplicateId: string, 
    targetPokemonId: number,
    targetPokemonName: string
  ) => Promise<boolean>;
}

const STAR_COLORS: Record<number, string> = {
  1: 'text-gray-400',
  2: 'text-green-400',
  3: 'text-blue-400',
  4: 'text-purple-400',
  5: 'text-amber-400',
  6: 'text-rose-400',
};

const TrainerEvolutionModal = ({
  isOpen,
  onClose,
  trainerPokemon,
  onEvolvePokemon,
}: TrainerEvolutionModalProps) => {
  const { t } = useTranslation('trainer');
  const { userItems } = useItems();
  const isMobile = useIsMobile();
  
  const [selectedPokemon, setSelectedPokemon] = useState<TrainerPokemonData | null>(null);
  const [isEvolving, setIsEvolving] = useState(false);

  // Filter pokemon that can evolve (have evolution requirements)
  const evolvablePokemon = useMemo(() => 
    trainerPokemon.filter(p => getTrainerEvolutionRequirements(p.pokemon_id) !== null)
  , [trainerPokemon]);

  // Sort by star rating and power
  const sortedPokemon = useMemo(() => 
    [...evolvablePokemon].sort((a, b) => {
      if (b.star_rating !== a.star_rating) return b.star_rating - a.star_rating;
      return b.power - a.power;
    }), [evolvablePokemon]
  );

  // Get evolution requirements for selected pokemon
  const evolutionReq = useMemo(() => 
    selectedPokemon ? getTrainerEvolutionRequirements(selectedPokemon.pokemon_id) : null
  , [selectedPokemon]);

  // Get essence count for selected pokemon type
  const essenceCount = useMemo(() => {
    if (!selectedPokemon) return 0;
    const essenceItemId = ESSENCE_ITEM_IDS[selectedPokemon.pokemon_type as PokemonType];
    const item = userItems.find(ui => ui.item_id === essenceItemId);
    return item?.quantity || 0;
  }, [selectedPokemon, userItems]);

  // Count duplicates of selected pokemon
  const duplicateCount = useMemo(() => {
    if (!selectedPokemon) return 0;
    return trainerPokemon.filter(
      p => p.pokemon_id === selectedPokemon.pokemon_id && p.id !== selectedPokemon.id
    ).length;
  }, [selectedPokemon, trainerPokemon]);

  // Find a duplicate to use
  const duplicatePokemon = useMemo(() => {
    if (!selectedPokemon) return null;
    return trainerPokemon.find(
      p => p.pokemon_id === selectedPokemon.pokemon_id && p.id !== selectedPokemon.id
    ) || null;
  }, [selectedPokemon, trainerPokemon]);

  // Check if can evolve
  const canEvolve = useMemo(() => {
    if (!selectedPokemon || !evolutionReq) return false;
    return (
      selectedPokemon.level >= evolutionReq.levelRequired &&
      essenceCount >= evolutionReq.essencesRequired &&
      duplicateCount >= evolutionReq.duplicatesRequired
    );
  }, [selectedPokemon, evolutionReq, essenceCount, duplicateCount]);

  const handleEvolve = async () => {
    if (!selectedPokemon || !evolutionReq || !duplicatePokemon) return;
    
    setIsEvolving(true);
    const success = await onEvolvePokemon(
      selectedPokemon.id,
      duplicatePokemon.id,
      evolutionReq.evolvesTo,
      evolutionReq.evolvedName
    );
    setIsEvolving(false);
    
    if (success) {
      toast.success(t('evolution.success', { 
        from: selectedPokemon.pokemon_name, 
        to: evolutionReq.evolvedName 
      }));
      setSelectedPokemon(null);
    }
  };

  const renderRequirement = (
    label: string,
    current: number,
    required: number,
    icon: React.ReactNode
  ) => {
    const isMet = current >= required;
    return (
      <div className={`flex items-center justify-between ${isMobile ? 'p-2' : 'p-3'} rounded-xl border transition-all duration-300 ${
        isMet 
          ? 'bg-gradient-to-r from-green-500/15 to-emerald-500/10 border-green-500/40 shadow-md' 
          : 'bg-gradient-to-r from-red-500/15 to-rose-500/10 border-red-500/40 shadow-md'
      }`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg ${isMet ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            {icon}
          </div>
          <span className="text-slate-200 font-medium text-xs sm:text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className={`font-bold text-xs sm:text-sm ${isMet ? 'text-green-400' : 'text-red-400'}`}>
            {current}/{required}
          </span>
          {isMet ? (
            <div className="p-0.5 sm:p-1 rounded-full bg-green-500/20">
              <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
            </div>
          ) : (
            <div className="p-0.5 sm:p-1 rounded-full bg-red-500/20">
              <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-400" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const modalHeader = (
    <div className="flex items-center gap-2">
      <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/30">
        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
      </div>
      <div>
        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent font-black text-base sm:text-xl">
          {t('actions.evolution')}
        </span>
        <div className="h-0.5 w-12 sm:w-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-0.5" />
      </div>
    </div>
  );

  // Render evolution details section
  const renderEvolutionDetails = () => {
    if (!selectedPokemon || !evolutionReq) {
      return (
        <div className={`flex flex-col items-center justify-center ${isMobile ? 'py-6' : 'h-full'} text-center relative`}>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl" />
          <div className="relative z-10">
            <div className={`inline-block ${isMobile ? 'p-3' : 'p-4'} rounded-2xl bg-gradient-to-br from-purple-900/30 to-pink-900/20 border border-purple-600/30 shadow-xl mb-3 sm:mb-4`}>
              <Sparkles className={`${isMobile ? 'h-10 w-10' : 'h-16 w-16'} text-purple-400 animate-pulse`} />
            </div>
            <p className="text-slate-300 font-bold text-sm sm:text-lg">{t('evolution.selectUnit')}</p>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 sm:mt-2">Choose a unit to evolve</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`space-y-2 sm:space-y-4 ${isMobile ? 'overflow-auto max-h-[32vh]' : ''}`}>
        {/* Evolution preview */}
        <div className={`flex items-center justify-center gap-3 sm:gap-4 ${isMobile ? 'p-3' : 'p-4'} rounded-xl bg-gradient-to-br from-slate-700/50 to-slate-800/30 border border-slate-600/50 shadow-lg relative overflow-hidden`}>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
              backgroundSize: '15px 15px'
            }} />
          </div>
          
          <div className="text-center relative z-10">
            <div className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-xl bg-slate-800/50 mb-1 sm:mb-2`}>
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${selectedPokemon.pokemon_id}.png`}
                alt={selectedPokemon.pokemon_name}
                className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} mx-auto pixelated`}
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <p className="text-slate-300 text-[10px] sm:text-sm font-bold capitalize">{selectedPokemon.pokemon_name}</p>
          </div>
          <ArrowRight className={`${isMobile ? 'h-5 w-5' : 'h-7 w-7'} text-purple-400 animate-pulse relative z-10`} />
          <div className="text-center relative z-10">
            <div className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 mb-1 sm:mb-2`}>
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evolutionReq.evolvesTo}.png`}
                alt={evolutionReq.evolvedName}
                className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} mx-auto pixelated drop-shadow-lg`}
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <p className="text-purple-400 text-[10px] sm:text-sm font-bold capitalize">{evolutionReq.evolvedName}</p>
          </div>
        </div>

        {/* Requirements */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/5 border border-purple-500/20">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />
            <h3 className="text-purple-300 text-xs sm:text-sm font-bold">{t('evolution.requirements')}</h3>
          </div>
          
          {renderRequirement(
            t('evolution.level', { level: evolutionReq.levelRequired }),
            selectedPokemon.level,
            evolutionReq.levelRequired,
            <Star className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-amber-400`} />
          )}
          
          {renderRequirement(
            t('evolution.essence', { 
              amount: evolutionReq.essencesRequired, 
              type: selectedPokemon.pokemon_type 
            }),
            essenceCount,
            evolutionReq.essencesRequired,
            <FlaskConical className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-cyan-400`} />
          )}
          
          {renderRequirement(
            t('evolution.duplicate'),
            duplicateCount,
            evolutionReq.duplicatesRequired,
            <Users className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-pink-400`} />
          )}
        </div>

        {/* Evolve button */}
        <Button
          onClick={handleEvolve}
          disabled={!canEvolve || isEvolving}
          className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/30 font-bold transition-all h-9 sm:h-10 text-sm"
        >
          <Sparkles className="h-4 w-4" />
          {t('pokemon.evolve')}
        </Button>
      </div>
    );
  };

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={onClose}
      title={modalHeader}
      className={isMobile ? "max-h-[90vh]" : "max-w-4xl max-h-[85vh]"}
    >
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-50" />

      <div className={`${isMobile ? 'flex flex-col gap-3' : 'grid grid-cols-2 gap-4'} relative z-10`}>
        {/* On mobile, show evolution details first if a pokemon is selected */}
        {isMobile && selectedPokemon && evolutionReq && (
          <div>
            {renderEvolutionDetails()}
          </div>
        )}

        {/* Pokemon selection */}
        <div className={isMobile && selectedPokemon ? 'order-2' : ''}>
          <div className="flex items-center gap-2 mb-2 sm:mb-3 p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/5 border border-purple-500/20">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />
            <p className="text-purple-300 text-xs sm:text-sm font-bold">{t('evolution.selectUnit')}</p>
          </div>
          <ScrollArea className={isMobile ? (selectedPokemon ? "h-[25vh]" : "h-[50vh]") : "h-[380px]"}>
            {sortedPokemon.length === 0 ? (
              <div className={`flex flex-col items-center justify-center ${isMobile ? 'py-10' : 'h-full'} text-center relative`}>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl" />
                <div className="relative z-10">
                  <div className={`inline-block ${isMobile ? 'p-3' : 'p-4'} rounded-2xl bg-gradient-to-br from-purple-900/30 to-pink-900/20 border border-purple-600/30 shadow-xl mb-3 sm:mb-4`}>
                    <Sparkles className={`${isMobile ? 'h-12 w-12' : 'h-16 w-16'} text-purple-400 animate-pulse`} />
                  </div>
                  <p className="text-slate-300 font-bold text-base sm:text-lg">{t('evolution.noEvolvable')}</p>
                  <p className="text-slate-400 text-xs sm:text-sm mt-2">No units can evolve yet</p>
                </div>
              </div>
            ) : (
              <div className={`grid ${isMobile ? 'grid-cols-3 gap-2' : 'grid-cols-3 gap-3'} pr-2 sm:pr-4`}>
                {sortedPokemon.map((pokemon) => {
                  const typeColor = TYPE_COLORS[pokemon.pokemon_type as PokemonType];
                  const isSelected = selectedPokemon?.id === pokemon.id;
                  const req = getTrainerEvolutionRequirements(pokemon.pokemon_id);
                  const meetsLevel = req && pokemon.level >= req.levelRequired;
                  const isHighRarity = pokemon.star_rating >= 5;

                  return (
                    <div
                      key={pokemon.id}
                      onClick={() => setSelectedPokemon(pokemon)}
                      className={`
                        relative ${isMobile ? 'p-2' : 'p-3'} rounded-xl cursor-pointer transition-all duration-300 group overflow-hidden
                        ${isSelected 
                          ? 'bg-gradient-to-br from-purple-500/30 to-pink-600/20 border-2 border-purple-400 shadow-lg shadow-purple-500/30 scale-105' 
                          : 'bg-gradient-to-br from-slate-700/60 to-slate-800/40 border-2 border-slate-600/50 hover:border-purple-500/60 hover:shadow-lg hover:shadow-purple-500/20 hover:scale-102'}
                      `}
                    >
                      {/* Background pattern */}
                      <div className="absolute inset-0 opacity-5">
                        <div className="absolute inset-0" style={{
                          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
                          backgroundSize: '15px 15px'
                        }} />
                      </div>

                      {/* Glow effect for selected */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 via-pink-400/5 to-purple-400/10 animate-pulse" />
                      )}

                      {/* Shimmer for high rarity */}
                      {isHighRarity && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/10 to-transparent group-hover:animate-shimmer" />
                      )}

                      {/* Level requirement indicator */}
                      {!meetsLevel && (
                        <Badge 
                          variant="destructive" 
                          className="absolute top-1 right-1 sm:top-2 sm:right-2 text-[7px] sm:text-[8px] px-1 sm:px-1.5 py-0.5 z-20 bg-red-600/90 backdrop-blur-sm border border-red-500/50"
                        >
                          Lv.{req?.levelRequired}
                        </Badge>
                      )}
                      
                      {/* Stars at top */}
                      <div className="relative flex justify-center gap-0.5 mb-1 sm:mb-2 z-10">
                        {Array.from({ length: Math.min(pokemon.star_rating, 6) }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-2 w-2 sm:h-2.5 sm:w-2.5 fill-current ${STAR_COLORS[pokemon.star_rating]} drop-shadow transition-transform group-hover:scale-110`}
                            style={{ transitionDelay: `${i * 30}ms` }}
                          />
                        ))}
                      </div>

                      {/* Pokemon sprite with enhanced effects */}
                      <div className="relative mb-1 sm:mb-2 z-10">
                        <div 
                          className="aspect-square rounded-lg flex items-center justify-center relative overflow-hidden"
                          style={{ 
                            background: `linear-gradient(135deg, ${typeColor}25 0%, ${typeColor}10 50%, ${typeColor}20 100%)`,
                            boxShadow: `0 4px 12px ${typeColor}30, inset 0 1px 0 rgba(255,255,255,0.1)`
                          }}
                        >
                          {/* Glow behind sprite */}
                          <div 
                            className="absolute inset-0 blur-xl opacity-40 transition-opacity group-hover:opacity-60"
                            style={{ 
                              background: `radial-gradient(circle, ${typeColor}80 0%, transparent 70%)`
                            }}
                          />
                          
                          {/* Ring effect for high rarity */}
                          {isHighRarity && (
                            <div 
                              className="absolute inset-0 rounded-lg opacity-20 group-hover:opacity-30 transition-opacity"
                              style={{ 
                                background: `conic-gradient(from 0deg, ${typeColor}, transparent, ${typeColor})`,
                                animation: 'spin 8s linear infinite'
                              }}
                            />
                          )}

                          <img
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemon_id}.png`}
                            alt={pokemon.pokemon_name}
                            className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} object-contain pixelated relative z-10 transition-transform group-hover:scale-110 ${isHighRarity ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : ''}`}
                            style={{ imageRendering: 'pixelated' }}
                          />

                          {/* Sparkles for high rarity */}
                          {isHighRarity && (
                            <>
                              <Sparkles className="absolute top-1 right-1 h-2 w-2 text-amber-300 animate-ping" style={{ animationDuration: '2s' }} />
                              <Sparkles className="absolute bottom-1 left-1 h-1.5 w-1.5 text-yellow-300 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                            </>
                          )}
                        </div>
                      </div>

                      {/* Pokemon name */}
                      <p className="relative text-[9px] sm:text-[10px] text-center text-white font-bold truncate capitalize drop-shadow-lg mb-0.5 sm:mb-1 z-10">
                        {pokemon.pokemon_name}
                      </p>

                      {/* Level display */}
                      <p className="relative text-[8px] sm:text-[9px] text-center text-slate-300 font-medium mb-1 sm:mb-1.5 z-10">
                        Lv.{pokemon.level}
                      </p>

                      {/* Type badge */}
                      <div className="relative flex justify-center z-10">
                        <span
                          className="text-[7px] sm:text-[8px] px-1.5 sm:px-2 py-0.5 rounded-full text-white font-bold shadow-lg border border-white/20 transition-transform group-hover:scale-105"
                          style={{ 
                            backgroundColor: typeColor,
                            boxShadow: `0 2px 6px ${typeColor}60`
                          }}
                        >
                          {pokemon.pokemon_type}
                        </span>
                      </div>

                      {/* Hover glow effect */}
                      <div 
                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                          boxShadow: `inset 0 0 20px ${isSelected ? '#a855f7' : typeColor}40`
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Evolution details - Desktop only (mobile is rendered at the top) */}
        {!isMobile && (
          <div>
            {renderEvolutionDetails()}
          </div>
        )}

        {/* Evolution details for mobile when no pokemon is selected */}
        {isMobile && !selectedPokemon && (
          <div>
            {renderEvolutionDetails()}
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        .pixelated {
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        }
        .scale-102 {
          transform: scale(1.02);
        }
      `}</style>
    </ResponsiveModal>
  );
};

export default TrainerEvolutionModal;
