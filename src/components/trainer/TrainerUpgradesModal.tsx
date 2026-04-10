import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Star, Zap, Gauge, Sparkles, Dices, RotateCcw, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TYPE_COLORS, type PokemonType } from '@/data/typeAdvantages';
import type { TrainerPokemonData } from '@/hooks/useTrainerMode';
import { useItems } from '@/hooks/useItems';
import { toast } from 'sonner';
import { STATUS_UPGRADE_ITEM_ID } from '@/data/essenceConfig';
import statusUpgradeIcon from '@/assets/status-upgrade.png';
import { type StatGrade, GRADE_ROLL_WEIGHTS } from '@/data/trainerPokemonPool';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

interface TrainerUpgradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainerPokemon: TrainerPokemonData[];
  onRollStat: (pokemonId: string, stat: 'stat_damage' | 'stat_speed' | 'stat_effect') => Promise<StatGrade | null>;
}

const STAT_GRADE_COLORS: Record<StatGrade, string> = {
  'C-': 'bg-gradient-to-r from-slate-500 to-slate-600 text-white',
  'C':  'bg-gradient-to-r from-slate-400 to-slate-500 text-white',
  'C+': 'bg-gradient-to-r from-teal-500 to-teal-600 text-white',
  'B-': 'bg-gradient-to-r from-green-500 to-green-600 text-white',
  'B':  'bg-gradient-to-r from-cyan-500 to-blue-500 text-white',
  'B+': 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
  'A-': 'bg-gradient-to-r from-violet-500 to-purple-500 text-white',
  'A':  'bg-gradient-to-r from-purple-500 to-purple-700 text-white',
  'A+': 'bg-gradient-to-r from-fuchsia-500 to-purple-700 text-white',
  'S-': 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black',
  'S':  'bg-gradient-to-r from-amber-400 to-orange-500 text-black',
  'S+': 'bg-gradient-to-r from-orange-400 to-rose-500 text-white',
};

const GRADE_GLOW: Record<StatGrade, string> = {
  'C-': '', 'C': '', 'C+': '',
  'B-': 'shadow-green-500/30', 'B': 'shadow-blue-500/30', 'B+': 'shadow-blue-600/40',
  'A-': 'shadow-violet-500/40', 'A': 'shadow-purple-500/50', 'A+': 'shadow-fuchsia-500/50',
  'S-': 'shadow-yellow-400/60', 'S': 'shadow-amber-400/60', 'S+': 'shadow-orange-500/60',
};

const STAT_ICONS = {
  stat_damage: { icon: Zap, color: 'text-rose-400', bg: 'from-rose-500/20 to-red-600/20', border: 'border-rose-500/30', label: 'Dano' },
  stat_speed:  { icon: Gauge, color: 'text-cyan-400', bg: 'from-cyan-500/20 to-blue-600/20', border: 'border-cyan-500/30', label: 'Velocidade' },
  stat_effect: { icon: Sparkles, color: 'text-violet-400', bg: 'from-violet-500/20 to-purple-600/20', border: 'border-violet-500/30', label: 'Efeito' },
};

const STAR_COLORS: Record<number, string> = {
  1: 'text-slate-400',
  2: 'text-emerald-400',
  3: 'text-sky-400',
  4: 'text-violet-400',
  5: 'text-amber-400',
  6: 'text-rose-400',
};

const getTrainerSpriteUrl = (pokemonId: number, isShiny?: boolean) => {
  const base = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
  return isShiny ? `${base}/shiny/${pokemonId}.png` : `${base}/${pokemonId}.png`;
};

const getStatMultiplier = (grade: StatGrade): number => {
  const multipliers: Record<StatGrade, number> = {
    'C-': 0.95, 'C': 1.00, 'C+': 1.05,
    'B-': 1.15, 'B': 1.25, 'B+': 1.40,
    'A-': 1.55, 'A': 1.75, 'A+': 1.95,
    'S-': 2.05, 'S': 2.15, 'S+': 2.25,
  };
  return multipliers[grade];
};

const TrainerUpgradesModal = ({
  isOpen,
  onClose,
  trainerPokemon,
  onRollStat,
}: TrainerUpgradesModalProps) => {
  const { t } = useTranslation('trainer');
  const { userItems, loadUserItems } = useItems();
  const isMobile = useIsMobile();
  
  const [selectedPokemon, setSelectedPokemon] = useState<TrainerPokemonData | null>(null);
  const [isRolling, setIsRolling] = useState<Record<string, boolean>>({});
  const [rollingGrades, setRollingGrades] = useState<Record<string, StatGrade>>({});

  const statusUpgradeCount = useMemo(() => {
    const item = userItems.find(ui => ui.item_id === STATUS_UPGRADE_ITEM_ID);
    return item?.quantity || 0;
  }, [userItems]);

  const sortedPokemon = useMemo(() => 
    [...trainerPokemon].sort((a, b) => {
      if (b.star_rating !== a.star_rating) return b.star_rating - a.star_rating;
      return b.power - a.power;
    }), [trainerPokemon]
  );

  const handleRoll = async (stat: 'stat_damage' | 'stat_speed' | 'stat_effect') => {
    if (!selectedPokemon) return;
    if (statusUpgradeCount < 1) {
      toast.error('Você precisa de pelo menos 1 Status Upgrade para rolar!');
      return;
    }
    
    // Marcar este stat como rolando
    setIsRolling(prev => ({ ...prev, [stat]: true }));
    const grades = Object.keys(GRADE_ROLL_WEIGHTS) as StatGrade[];
    
    // Animação fluida com desaceleração progressiva
    const startTime = Date.now();
    const duration = 2500; // 2.5 segundos
    let animationFrameId: number;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing exponencial para desaceleração suave
      const easeOut = 1 - Math.pow(1 - progress, 4);
      
      // Velocidade inicial rápida que desacelera
      const totalSpins = 20; // Número de ciclos completos
      const currentSpin = easeOut * totalSpins;
      const gradeIndex = Math.floor(currentSpin * grades.length) % grades.length;
      
      // Atualizar apenas o grade deste stat específico
      setRollingGrades(prev => ({ ...prev, [stat]: grades[gradeIndex] }));
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        // Finalizar animação e obter resultado real
        (async () => {
          const result = await onRollStat(selectedPokemon.id, stat);
          
          if (result) {
            setRollingGrades(prev => ({ ...prev, [stat]: result }));
            setSelectedPokemon(prev => prev ? { ...prev, [stat]: result } : null);
            await loadUserItems();
          }
          
          // Desmarcar este stat como rolando
          setIsRolling(prev => ({ ...prev, [stat]: false }));
        })();
      }
    };
    
    animationFrameId = requestAnimationFrame(animate);
  };

  const renderStatRollRow = (
    stat: 'stat_damage' | 'stat_speed' | 'stat_effect',
    currentGrade?: StatGrade
  ) => {
    if (!selectedPokemon) return null;
    const cfg = STAT_ICONS[stat];
    const IconComp = cfg.icon;
    const gradeToUse = currentGrade || (selectedPokemon[stat] as StatGrade);
    const isCurrentlyRolling = isRolling[stat] || false;
    const displayGrade = isCurrentlyRolling && rollingGrades[stat] ? rollingGrades[stat] : gradeToUse;
    const multiplier = getStatMultiplier(displayGrade);
    const pct = Math.round((multiplier - 1) * 100);
    const pctLabel = pct >= 0 ? `+${pct}%` : `${pct}%`;
    const glowClass = GRADE_GLOW[displayGrade];

    return (
      <div key={stat} className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${cfg.bg} ${cfg.border} transition-all duration-300 ${isCurrentlyRolling ? 'scale-[1.02] shadow-2xl' : 'hover:scale-[1.01]'}`}>
        {isCurrentlyRolling && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/20 to-white/5 animate-pulse" />
        )}
        <div className="relative z-10 flex items-center gap-3 p-3">
          {/* Icon */}
          <div className={`p-2 rounded-lg bg-gradient-to-br ${cfg.bg} border ${cfg.border} flex-shrink-0 transition-all duration-200 ${isCurrentlyRolling ? 'scale-110' : ''}`}>
            {isCurrentlyRolling
              ? <RotateCcw className={`h-4 w-4 ${cfg.color} animate-spin`} />
              : <IconComp className={`h-4 w-4 ${cfg.color}`} />
            }
          </div>
          {/* Label + grade */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{cfg.label}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`px-2 py-0.5 rounded-md text-xs font-black tracking-wide shadow-lg ${STAT_GRADE_COLORS[displayGrade]} ${glowClass} transition-all duration-150 ${isCurrentlyRolling ? 'animate-pulse scale-105' : ''}`}>
                {displayGrade}
              </span>
              <span className={`text-xs font-bold text-white/80 transition-opacity ${isCurrentlyRolling ? 'opacity-50' : 'opacity-100'}`}>{multiplier}x</span>
              <span className={`text-xs font-semibold ${pct >= 0 ? 'text-emerald-400' : 'text-red-400'} transition-opacity ${isCurrentlyRolling ? 'opacity-50' : 'opacity-100'}`}>{pctLabel}</span>
            </div>
          </div>
          {/* Roll button */}
          <Button
            size="sm"
            onClick={() => handleRoll(stat)}
            disabled={statusUpgradeCount < 1 || isCurrentlyRolling}
            className={`gap-1 font-bold h-8 px-3 rounded-lg text-xs transition-all duration-200 flex-shrink-0 
              bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 
              text-white shadow-lg shadow-indigo-500/30 hover:scale-105 
              disabled:opacity-40 disabled:hover:scale-100`}
          >
            <Dices className="h-3 w-3" />
            {isCurrentlyRolling ? '...' : 'Rolar'}
          </Button>
        </div>
      </div>
    );
  };

  const modalHeader = (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl blur-xl opacity-60" />
        <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 shadow-xl">
          <Dices className="h-5 w-5 text-white" />
        </div>
      </div>
      <div>
        <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-300 bg-clip-text text-transparent font-black text-xl tracking-tight">
          Roleta de Status
        </span>
        <p className="text-slate-400 text-xs mt-0.5">Melhore os atributos das suas unidades</p>
      </div>
    </div>
  );

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={onClose}
      title={modalHeader}
      className={isMobile ? "h-[90vh] max-h-[90vh] flex flex-col" : "max-w-5xl h-[80vh] max-h-[80vh] flex flex-col"}
    >
      <div className="flex flex-col gap-3 h-full overflow-hidden">

        {/* Item counter banner */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-purple-500/10 border border-violet-500/25 flex-shrink-0">
          <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30">
            <img src={statusUpgradeIcon} alt="Status Upgrade" className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">
              Status Upgrade  
              <span className="ml-2 px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-400/40 text-violet-300 text-xs font-black">
                ×{statusUpgradeCount}
              </span>
            </p>
            <p className="text-slate-400 text-xs">Cada rolar consome 1 item</p>
          </div>
          {statusUpgradeCount === 0 && (
            <span className="text-xs text-rose-400 font-semibold px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20">
              Sem estoque
            </span>
          )}
        </div>

        {/* Main grid */}
        <div className="flex-1 min-h-0">
          <div className={`${isMobile ? 'flex flex-col gap-3 h-full' : 'grid grid-cols-5 gap-4'} h-full`}>

            {/* Pokemon list */}
            <div className={`flex flex-col min-h-0 ${isMobile ? 'h-[45%]' : 'col-span-3'}`}>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2 flex items-center gap-1.5 flex-shrink-0">
                <Star className="h-3 w-3 text-amber-400" /> Selecionar Unidade
              </p>
              <div className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                  <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3'} gap-3 pr-2 pb-2`}>
                    {sortedPokemon.map((pokemon) => {
                      const typeColor = TYPE_COLORS[pokemon.pokemon_type as PokemonType];
                      const isSelected = selectedPokemon?.id === pokemon.id;
                      const isHighRarity = pokemon.star_rating >= 5;

                      return (
                        <div
                          key={pokemon.id}
                          onClick={() => setSelectedPokemon(pokemon)}
                          className={`
                            relative rounded-xl cursor-pointer transition-all duration-300 overflow-hidden
                            ${isSelected
                              ? 'border-2 border-violet-400 shadow-xl shadow-violet-500/30 scale-[1.03]'
                              : 'border border-slate-600/60 hover:border-slate-400/60 hover:scale-[1.02]'
                            }
                          `}
                          style={{
                            background: isSelected
                              ? `linear-gradient(135deg, ${typeColor}30 0%, #1e1b4b 60%, ${typeColor}20 100%)`
                              : `linear-gradient(135deg, ${typeColor}18 0%, #1e293b 60%, ${typeColor}12 100%)`
                          }}
                        >
                          {/* Top glow for selected */}
                          {isSelected && (
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent" />
                          )}

                          <div className="p-3">
                            {/* Stars */}
                            <div className="flex justify-center gap-0.5 mb-2">
                              {Array.from({ length: Math.min(pokemon.star_rating, 6) }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-2.5 w-2.5 fill-current ${STAR_COLORS[pokemon.star_rating]}`}
                                />
                              ))}
                            </div>

                            {/* Sprite */}
                            <div
                              className="aspect-square rounded-lg flex items-center justify-center overflow-hidden mb-2 border border-white/10"
                              style={{ background: `linear-gradient(135deg, ${typeColor}35, ${typeColor}15)` }}
                            >
                              <img
                                src={getTrainerSpriteUrl(pokemon.pokemon_id, pokemon.is_shiny)}
                                alt={pokemon.pokemon_name}
                                className="w-14 h-14 object-contain drop-shadow-lg"
                                style={{ imageRendering: 'pixelated' }}
                              />
                              {isHighRarity && (
                                <Sparkles className="absolute top-1 right-1 h-3 w-3 text-amber-300" />
                              )}
                              {pokemon.is_shiny && (
                                <span className="absolute bottom-1 right-1 text-[9px] px-1 py-0.5 rounded bg-amber-400/90 text-black font-black tracking-wide border border-amber-300/80">
                                  SHINY
                                </span>
                              )}
                            </div>

                            {/* Name */}
                            <p className="text-xs text-center text-white font-bold truncate capitalize mb-2">
                              {pokemon.pokemon_name}
                            </p>

                            {/* Type badge */}
                            <div className="flex justify-center">
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full text-white font-bold border border-white/20"
                                style={{ backgroundColor: `${typeColor}cc` }}
                              >
                                {pokemon.pokemon_type}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Stats panel */}
            <div className={`flex flex-col min-h-0 ${isMobile ? 'h-[52%]' : 'col-span-2'}`}>
              {selectedPokemon ? (
                <ScrollArea className="h-full">
                  <div className="flex flex-col gap-3 pr-2">
                    {/* Selected pokemon header */}
                    <div
                      className="rounded-xl p-3 border border-white/10 flex items-center gap-3 flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${TYPE_COLORS[selectedPokemon.pokemon_type as PokemonType]}30, #1e1b4b)`
                      }}
                    >
                      <img
                        src={getTrainerSpriteUrl(selectedPokemon.pokemon_id, selectedPokemon.is_shiny)}
                        alt={selectedPokemon.pokemon_name}
                        className="w-12 h-12 object-contain drop-shadow-lg"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <div>
                        <p className="text-white font-black capitalize text-base leading-tight flex items-center gap-1.5">
                          {selectedPokemon.pokemon_name}
                          {selectedPokemon.is_shiny && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/90 text-black font-black tracking-wide border border-amber-300/80">
                              SHINY
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {Array.from({ length: Math.min(selectedPokemon.star_rating, 6) }).map((_, i) => (
                            <Star key={i} className={`h-2.5 w-2.5 fill-current ${STAR_COLORS[selectedPokemon.star_rating]}`} />
                          ))}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                      <Shield className="h-3 w-3 text-violet-400" /> Atributos
                    </p>

                    {/* Stat rows */}
                    <div className="flex flex-col gap-2">
                      {renderStatRollRow('stat_damage', selectedPokemon.stat_damage)}
                      {renderStatRollRow('stat_speed', selectedPokemon.stat_speed)}
                      {renderStatRollRow('stat_effect', selectedPokemon.stat_effect)}
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/15 to-indigo-500/15 border border-violet-500/20">
                    <TrendingUp className="h-10 w-10 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Nenhuma unidade selecionada</p>
                    <p className="text-slate-500 text-xs mt-1">Escolha um Pokémon para rolar seus status</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default TrainerUpgradesModal;
