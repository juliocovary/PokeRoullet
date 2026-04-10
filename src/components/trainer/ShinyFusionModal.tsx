import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Flame, AlertTriangle, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { TrainerPokemonData } from '@/hooks/useTrainerMode';

interface ShinyFusionModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainerPokemon: TrainerPokemonData[];
  teamPokemonIds: string[];
  onFuse: (targetId: string, sacrificeIds: string[]) => Promise<{ fused: boolean; chance: number; pokemon_name: string } | null>;
}

const CHANCE_BY_TOTAL: Record<number, number> = {
  2: 25,
  3: 50,
  4: 80,
  5: 100,
};

const ShinyFusionModal = ({ isOpen, onClose, trainerPokemon, teamPokemonIds, onFuse }: ShinyFusionModalProps) => {
  const { t } = useTranslation('trainer');
  const isMobile = useIsMobile();
  const [selectedSpecies, setSelectedSpecies] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isFusing, setIsFusing] = useState(false);
  const [result, setResult] = useState<{ fused: boolean; chance: number; name: string } | null>(null);

  // Group non-shiny pokemon by pokemon_id, only show species with 2+ units
  const fusableGroups = useMemo(() => {
    const groups: Record<number, TrainerPokemonData[]> = {};
    trainerPokemon
      .filter(p => !p.is_shiny)
      .forEach(p => {
        if (!groups[p.pokemon_id]) groups[p.pokemon_id] = [];
        groups[p.pokemon_id].push(p);
      });
    return Object.entries(groups)
      .filter(([, arr]) => arr.length >= 2)
      .map(([id, arr]) => ({ pokemonId: Number(id), pokemon: arr }));
  }, [trainerPokemon]);

  const speciesUnits = useMemo(() => {
    if (!selectedSpecies) return [];
    return fusableGroups.find(g => g.pokemonId === selectedSpecies)?.pokemon || [];
  }, [selectedSpecies, fusableGroups]);

  const totalSelected = selectedIds.length;
  const successChance = CHANCE_BY_TOTAL[totalSelected] || 0;

  const toggleUnit = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(x => x !== id));
    } else if (selectedIds.length < 5) {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleFuse = async () => {
    if (totalSelected < 2) return;
    setIsFusing(true);
    // First selected = target (kept), rest = sacrifices
    const [targetId, ...sacrificeIds] = selectedIds;
    const res = await onFuse(targetId, sacrificeIds);
    if (res) {
      setResult({ fused: res.fused, chance: res.chance, name: res.pokemon_name });
    }
    setIsFusing(false);
  };

  const handleReset = () => {
    setResult(null);
    setSelectedIds([]);
    setSelectedSpecies(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border-amber-500/30 text-white max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-400">
            <Sparkles className="h-5 w-5" />
            {t('fusion.title', 'Shiny Fusion')}
          </DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col items-center gap-4 py-6">
            {result.fused ? (
              <>
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 via-amber-300 to-yellow-500 flex items-center justify-center animate-pulse shadow-lg shadow-yellow-500/50">
                    <Sparkles className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-yellow-300">{t('fusion.success', 'Fusion Successful!')}</h3>
                <p className="text-slate-300 text-center">
                  {t('fusion.nowShiny', '{{name}} is now SHINY! (+50% damage)', { name: result.name })}
                </p>
              </>
            ) : (
              <>
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30">
                  <X className="h-12 w-12 text-red-300" />
                </div>
                <h3 className="text-xl font-bold text-red-400">{t('fusion.failed', 'Fusion Failed!')}</h3>
                <p className="text-slate-400 text-center">
                  {t('fusion.sacrificesLost', 'The sacrificed units were lost. The target unit was preserved.')}
                </p>
              </>
            )}
            <p className="text-xs text-slate-500">
              {t('fusion.chanceWas', 'Success chance was {{chance}}%', { chance: result.chance })}
            </p>
            <Button onClick={handleReset} className="bg-amber-600 hover:bg-amber-500 text-white">
              {t('fusion.tryAgain', 'Try Again')}
            </Button>
          </div>
        ) : !selectedSpecies ? (
          // Step 1: Select species
          <div className="space-y-3">
            <p className="text-sm text-slate-400">{t('fusion.selectSpecies', 'Select a Pokémon species to fuse:')}</p>
            {fusableGroups.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t('fusion.noFusable', 'You need at least 2 identical units to fuse.')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {fusableGroups.map(group => {
                  const sample = group.pokemon[0];
                  return (
                    <button
                      key={group.pokemonId}
                      onClick={() => setSelectedSpecies(group.pokemonId)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl border-2 border-zinc-700/50 bg-zinc-800/50 hover:border-amber-500/50 hover:bg-zinc-700/50 transition-all"
                    >
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${group.pokemonId}.png`}
                        alt={sample.pokemon_name}
                        className="w-14 h-14 pixelated"
                      />
                      <span className="text-xs font-bold text-slate-200">{sample.pokemon_name}</span>
                      <span className="text-[10px] text-amber-400">x{group.pokemon.length}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          // Step 2: Select units to fuse
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <button onClick={() => { setSelectedSpecies(null); setSelectedIds([]); }} className="text-sm text-slate-400 hover:text-white">
                ← {t('fusion.back', 'Back')}
              </button>
              <span className="text-xs text-slate-500">
                {t('fusion.selected', '{{count}}/5 selected', { count: totalSelected })}
              </span>
            </div>

            {/* Explanation */}
            <div className="bg-zinc-800/80 rounded-lg p-3 border border-zinc-700/50">
              <p className="text-xs text-slate-400 mb-1">
                {t('fusion.description', 'Select 2-5 identical units. The first selected becomes Shiny, the rest are sacrificed.')}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <AlertTriangle className="h-3 w-3 text-amber-400 flex-shrink-0" />
                <p className="text-[10px] text-amber-400/80">
                  {t('fusion.warning', 'Sacrificed units are lost even if fusion fails!')}
                </p>
              </div>
            </div>

            {/* Chance bar */}
            {totalSelected >= 2 && (
              <div className="bg-zinc-800/80 rounded-lg p-3 border border-zinc-700/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-300">{t('fusion.chance', 'Success Chance')}</span>
                  <span className={cn(
                    "text-sm font-bold",
                    successChance === 100 ? "text-green-400" : successChance >= 80 ? "text-yellow-400" : successChance >= 50 ? "text-orange-400" : "text-red-400"
                  )}>
                    {successChance}%
                  </span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all duration-500",
                      successChance === 100 ? "bg-green-500" : successChance >= 80 ? "bg-yellow-500" : successChance >= 50 ? "bg-orange-500" : "bg-red-500"
                    )}
                    style={{ width: `${successChance}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>2 = 25%</span>
                  <span>3 = 50%</span>
                  <span>4 = 80%</span>
                  <span>5 = 100%</span>
                </div>
              </div>
            )}

            {/* Unit grid */}
            <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
              {speciesUnits.map((unit, idx) => {
                const isSelected = selectedIds.includes(unit.id);
                const isTarget = selectedIds[0] === unit.id;
                const isInTeam = teamPokemonIds.includes(unit.id);
                const selectionIndex = selectedIds.indexOf(unit.id);
                
                return (
                  <button
                    key={unit.id}
                    onClick={() => !isInTeam && toggleUnit(unit.id)}
                    disabled={isInTeam}
                    className={cn(
                      "relative flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all",
                      isInTeam && "opacity-40 cursor-not-allowed",
                      isTarget
                        ? "border-yellow-400 bg-yellow-500/10 shadow-lg shadow-yellow-500/20"
                        : isSelected
                          ? "border-red-400/50 bg-red-500/10"
                          : "border-zinc-700/50 bg-zinc-800/50 hover:border-zinc-500/50"
                    )}
                  >
                    {isSelected && (
                      <div className={cn(
                        "absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                        isTarget ? "bg-yellow-500 text-black" : "bg-red-500 text-white"
                      )}>
                        {isTarget ? '★' : selectionIndex}
                      </div>
                    )}
                    {isInTeam && (
                      <div className="absolute top-1 left-1 text-[8px] bg-blue-500/80 text-white px-1 rounded">
                        {t('team.title', 'Team')}
                      </div>
                    )}
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${unit.pokemon_id}.png`}
                      alt={unit.pokemon_name}
                      className="w-12 h-12 pixelated"
                    />
                    <span className="text-[10px] text-slate-300">Lv.{unit.level}</span>
                    <span className="text-[10px] text-yellow-400">{'★'.repeat(unit.star_rating)}</span>
                    {isTarget && (
                      <span className="text-[8px] text-yellow-300 font-bold">{t('fusion.target', 'TARGET')}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Fuse button */}
            <Button
              onClick={handleFuse}
              disabled={totalSelected < 2 || isFusing}
              className={cn(
                "w-full font-bold transition-all",
                totalSelected >= 2
                  ? "bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black shadow-lg shadow-amber-500/30"
                  : "bg-zinc-700 text-zinc-400"
              )}
            >
              {isFusing ? (
                <span className="animate-pulse">{t('fusion.fusing', 'Fusing...')}</span>
              ) : (
                <>
                  <Flame className="h-4 w-4 mr-2" />
                  {t('fusion.fuse', 'Fuse')} ({successChance}%)
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShinyFusionModal;
