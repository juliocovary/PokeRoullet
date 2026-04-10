import { useTranslation } from 'react-i18next';
import { BarChart3, Zap, Swords, Timer, Sparkles, Star, Shield, Flame, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { SPEED_VALUES, EFFECT_CHANCES, DAMAGE_MULTIPLIERS, type StatGrade, calculatePokemonDamage } from '@/data/trainerPokemonPool';
import { getTypeModifier, TYPE_MODIFIERS } from '@/data/typeModifiers';

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
  is_shiny: boolean;
  is_evolved: boolean;
  evolved_from?: string | null;
}

interface TeamStatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamPokemon: TrainerPokemonData[];
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

const GRADE_COLORS: Record<string, string> = {
  S: 'text-amber-400',
  A: 'text-purple-400',
  B: 'text-blue-400',
  C: 'text-green-400',
  D: 'text-slate-400',
};

const getTrainerSpriteUrl = (pokemonId: number, isShiny?: boolean) => {
  const base = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
  return isShiny ? `${base}/shiny/${pokemonId}.png` : `${base}/${pokemonId}.png`;
};

const TeamStatsModal = ({ open, onOpenChange, teamPokemon }: TeamStatsModalProps) => {
  const { t } = useTranslation('trainer');

  // Calculate stats for each pokemon
  const pokemonStats = teamPokemon.map(pokemon => {
    const damageGrade = pokemon.stat_damage as StatGrade;
    const speedGrade = pokemon.stat_speed as StatGrade;
    const effectGrade = pokemon.stat_effect as StatGrade;

    // Get type modifier for this pokemon
    const typeModifier = getTypeModifier(pokemon.pokemon_type);

    // Get actual damage from calculatePokemonDamage (includes type modifier)
    let damage = calculatePokemonDamage(pokemon.power, damageGrade, pokemon.level, pokemon.pokemon_type);
    if (pokemon.is_shiny) {
      damage = Math.floor(damage * 1.5);
    }
    
    // Attack interval in seconds (from Battle Arena) - apply type speed modifier
    const baseAttackInterval = SPEED_VALUES[speedGrade] ?? SPEED_VALUES.C;
    const attackInterval = baseAttackInterval * typeModifier.speedMultiplier;
    
    // DPS = damage / attack interval
    const dps = damage / attackInterval;
    
    // Attacks per second
    const attacksPerSecond = 1 / attackInterval;
    
    // Effect chance
    const effectChance = EFFECT_CHANCES[effectGrade] * 100;
    
    // Damage multiplier from grade
    const damageMultiplier = DAMAGE_MULTIPLIERS[damageGrade];

    return {
      ...pokemon,
      damage,
      attackInterval,
      dps,
      attacksPerSecond,
      effectChance,
      damageMultiplier,
      damageGrade,
      speedGrade,
      effectGrade,
      typeModifier,
    };
  });

  // Team totals
  const totalDamage = pokemonStats.reduce((sum, p) => sum + p.damage, 0);
  const totalDPS = pokemonStats.reduce((sum, p) => sum + p.dps, 0);
  
  // Average speed (weighted by contribution)
  const avgAttackInterval = pokemonStats.length > 0 
    ? pokemonStats.reduce((sum, p) => sum + p.attackInterval, 0) / pokemonStats.length 
    : 1;
  
  // Max DPS for progress bar scaling
  const maxDPS = Math.max(...pokemonStats.map(p => p.dps), 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-amber-500/30 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-amber-400 flex items-center gap-2 text-xl">
            <BarChart3 className="h-6 w-6" />
            {t('team.stats', 'Estatísticas do Time')}
          </DialogTitle>
        </DialogHeader>

        {teamPokemon.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t('team.noTeam', 'Nenhum Pokémon no time')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Team Summary */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-amber-500/20">
              <h3 className="text-sm font-semibold text-amber-300 mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                {t('team.summary', 'Resumo do Time')}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">{t('team.totalDamage', 'Dano por Ataque')}</p>
                  <p className="text-xl font-bold text-red-400 flex items-center gap-1">
                    <Swords className="h-4 w-4" />
                    {Math.round(totalDamage)}
                  </p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">{t('team.totalDPS', 'DPS Total')}</p>
                  <p className="text-xl font-bold text-amber-400 flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    {totalDPS.toFixed(1)}/s
                  </p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">{t('team.attackSpeed', 'Intervalo de Ataque')}</p>
                  <p className="text-xl font-bold text-cyan-400 flex items-center gap-1">
                    <Timer className="h-4 w-4" />
                    {avgAttackInterval.toFixed(2)}s
                  </p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">{t('team.teamSize', 'Pokémon no Time')}</p>
                  <p className="text-xl font-bold text-green-400 flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    {teamPokemon.length}/3
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-slate-700/50" />

            {/* Individual Pokemon Stats */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {t('team.individualStats', 'Estatísticas Individuais')}
              </h3>

              {pokemonStats.map((pokemon) => {
                const typeColor = TYPE_COLORS_HEX[pokemon.pokemon_type] || TYPE_COLORS_HEX.normal;
                const dpsPercentage = (pokemon.dps / maxDPS) * 100;

                return (
                  <div 
                    key={pokemon.id}
                    className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50 relative overflow-hidden"
                  >
                    {/* Type gradient background */}
                    <div 
                      className="absolute inset-0 opacity-10"
                      style={{ 
                        background: `linear-gradient(135deg, ${typeColor}40 0%, transparent 60%)`
                      }}
                    />

                    <div className="relative z-10">
                      {/* Header with sprite and name */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="relative">
                          <div 
                            className="absolute inset-0 blur-md opacity-50"
                            style={{ backgroundColor: typeColor }}
                          />
                          <img
                            src={getTrainerSpriteUrl(pokemon.pokemon_id, pokemon.is_shiny)}
                            alt={pokemon.pokemon_name}
                            className="relative w-14 h-14 pixelated"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white capitalize text-lg">
                              {pokemon.pokemon_name}
                            </h4>
                            <span 
                              className="text-[10px] px-2 py-0.5 rounded text-white font-semibold"
                              style={{ backgroundColor: typeColor }}
                            >
                              {pokemon.pokemon_type.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400">
                              Lv.{pokemon.level}
                            </span>
                            <div className="flex gap-0.5">
                              {[...Array(Math.min(pokemon.star_rating, 3))].map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                              ))}
                              {pokemon.star_rating > 3 && (
                                <span className="text-[10px] text-amber-400 font-bold">
                                  +{pokemon.star_rating - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Damage */}
                        <div className="bg-slate-900/50 rounded-lg p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Swords className="h-3 w-3" />
                              {t('stats.damage', 'Dano')}
                            </span>
                            <span className={cn("text-xs font-bold", GRADE_COLORS[pokemon.damageGrade])}>
                              {pokemon.damageGrade}
                            </span>
                          </div>
                          <p className="text-lg font-bold text-red-400">{pokemon.damage}</p>
                          <p className="text-[10px] text-slate-500">
                            ×{pokemon.damageMultiplier.toFixed(2)} grau
                            {pokemon.typeModifier.damageMultiplier !== 1.0 && (
                              <span className="text-green-400 ml-1">
                                ×{pokemon.typeModifier.damageMultiplier.toFixed(2)} tipo
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Speed */}
                        <div className="bg-slate-900/50 rounded-lg p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              {t('stats.speed', 'Velocidade')}
                            </span>
                            <span className={cn("text-xs font-bold", GRADE_COLORS[pokemon.speedGrade])}>
                              {pokemon.speedGrade}
                            </span>
                          </div>
                          <p className="text-lg font-bold text-cyan-400">{pokemon.attacksPerSecond.toFixed(2)}/s</p>
                          <p className="text-[10px] text-slate-500">
                            {pokemon.attackInterval.toFixed(2)}s
                            {pokemon.typeModifier.speedMultiplier !== 1.0 && (
                              <span className={cn(
                                "ml-1",
                                pokemon.typeModifier.speedMultiplier < 1 ? "text-green-400" : "text-orange-400"
                              )}>
                                ({pokemon.typeModifier.speedMultiplier < 1 ? '+' : '-'}
                                {Math.abs((1 - pokemon.typeModifier.speedMultiplier) * 100).toFixed(0)}%)
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Effect */}
                        <div className="bg-slate-900/50 rounded-lg p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              {t('stats.effect', 'Efeito')}
                            </span>
                            <span className={cn("text-xs font-bold", GRADE_COLORS[pokemon.effectGrade])}>
                              {pokemon.effectGrade}
                            </span>
                          </div>
                          <p className="text-lg font-bold text-purple-400">{pokemon.effectChance.toFixed(1)}%</p>
                          <p className="text-[10px] text-slate-500">
                            {pokemon.typeModifier.hasStatusEffect 
                              ? <span className="text-green-400">Tem Efeito ✓</span>
                              : <span className="text-orange-400">Sem Efeito (Stats+)</span>
                            }
                          </p>
                        </div>

                        {/* DPS */}
                        <div className="bg-slate-900/50 rounded-lg p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              DPS
                            </span>
                          </div>
                          <p className="text-lg font-bold text-amber-400">{pokemon.dps.toFixed(1)}</p>
                          <p className="text-[10px] text-slate-500">
                            dano/segundo
                          </p>
                        </div>
                      </div>

                      {/* Type Modifier Badge */}
                      {(!pokemon.typeModifier.hasStatusEffect || pokemon.typeModifier.damageMultiplier !== 1.0 || pokemon.typeModifier.speedMultiplier !== 1.0) && (
                        <div className="mt-3 px-2 py-1.5 bg-gradient-to-r from-slate-800/80 to-slate-700/60 rounded-lg border border-slate-600/50">
                          <div className="flex items-center gap-2">
                            <Info className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            <p className="text-[10px] text-slate-300">
                              {pokemon.typeModifier.description}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* DPS Bar (contribution visualization) */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-400">{t('stats.contribution', 'Contribuição DPS')}</span>
                          <span className="text-amber-400 font-semibold">
                            {((pokemon.dps / totalDPS) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={dpsPercentage} 
                          className="h-2 bg-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Formula explanation */}
            <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
              <h4 className="text-xs font-semibold text-slate-300 mb-2">📊 {t('stats.howCalculated', 'Como é calculado')}:</h4>
              <ul className="text-[10px] text-slate-400 space-y-1">
                <li>• <strong className="text-slate-300">Dano</strong> = Poder Base × 0.08 × Grau × Nível × <span className="text-green-400">Tipo</span></li>
                <li>• <strong className="text-slate-300">Velocidade</strong> = Intervalo Base × <span className="text-green-400">Modificador de Tipo</span></li>
                <li>• <strong className="text-slate-300">DPS</strong> = Dano ÷ Intervalo de Ataque</li>
                <li>• <strong className="text-slate-300">Efeito</strong> = Chance de aplicar efeito (só 3★+)</li>
                <li className="pt-1 border-t border-slate-700/50 mt-1">
                  💡 <span className="text-amber-400">Tipos sem efeito especial</span> recebem bônus de Dano/Velocidade
                </li>
              </ul>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TeamStatsModal;
