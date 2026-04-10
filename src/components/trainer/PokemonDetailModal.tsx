import { useTranslation } from 'react-i18next';
import { X, Star, Zap, Gauge, Sparkles } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TYPE_COLORS, type PokemonType } from '@/data/typeAdvantages';
import type { TrainerPokemonData } from '@/hooks/useTrainerMode';
import { getXPForNextLevel, getLevelFromTotalXP, MAX_POKEMON_LEVEL } from '@/data/trainerPokemonPool';
import { Progress } from '@/components/ui/progress';

interface PokemonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  pokemon: TrainerPokemonData | null;
}

const STAR_COLORS: Record<number, string> = {
  1: 'text-gray-400',
  2: 'text-green-400',
  3: 'text-blue-400',
  4: 'text-purple-400',
  5: 'text-amber-400',
  6: 'text-rose-400',
};

const STAT_GRADE_COLORS: Record<string, string> = {
  D: 'bg-gray-500',
  C: 'bg-green-500',
  B: 'bg-blue-500',
  A: 'bg-purple-500',
  S: 'bg-amber-500',
};

const PokemonDetailModal = ({ isOpen, onClose, pokemon }: PokemonDetailModalProps) => {
  const { t } = useTranslation('trainer');

  if (!pokemon) return null;

  const pokemonType = pokemon.pokemon_type as PokemonType;
  const typeColor = TYPE_COLORS[pokemonType] || '#A8A878';
  
  // Calculate XP progress
  const currentLevel = pokemon.level;
  const isMaxLevel = currentLevel >= MAX_POKEMON_LEVEL;
  const xpForNextLevel = isMaxLevel ? 0 : getXPForNextLevel(currentLevel);
  const currentLevelXP = getLevelFromTotalXP(pokemon.experience) === currentLevel 
    ? pokemon.experience % xpForNextLevel 
    : 0;
  const xpProgress = isMaxLevel ? 100 : (currentLevelXP / xpForNextLevel) * 100;

  const renderStatGrade = (label: string, grade: string, icon: React.ReactNode) => (
    <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-slate-300">{label}</span>
      </div>
      <div className={`px-3 py-1 rounded-full text-white font-bold ${STAT_GRADE_COLORS[grade]}`}>
        {grade}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-slate-900 border border-slate-700/80 p-0 overflow-hidden rounded-2xl shadow-2xl">
        {/* Hero header */}
        <div 
          className="relative pt-8 pb-8 px-6 overflow-hidden"
          style={{ background: `radial-gradient(circle at 30% 20%, ${typeColor}30 0%, transparent 40%), linear-gradient(135deg, ${typeColor}35 0%, ${typeColor}08 100%)` }}
        >
          <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 8px, transparent 8px, transparent 18px)' }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 70% 0%, rgba(255,255,255,0.08), transparent 45%)' }} />

          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-white/80 hover:text-white hover:bg-white/15"
          >
            <X className="h-5 w-5" />
          </Button>
          
          {/* Pokemon sprite */}
          <div className="flex justify-center mb-4 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-44 h-44 rounded-full blur-3xl" style={{ background: `${typeColor}35` }} />
            </div>
            <div className="relative rounded-full bg-slate-900/40 border border-white/10 shadow-xl p-4">
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.pokemon_id}.png`}
                alt={pokemon.pokemon_name}
                className="h-40 w-40 object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.6)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemon_id}.png`;
                }}
              />
            </div>
          </div>
          
          {/* Name / stars / types */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-white capitalize drop-shadow">
              {pokemon.pokemon_name}
            </h2>
            <div className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-slate-900/60 border border-white/10 shadow-sm">
              {Array.from({ length: pokemon.star_rating }).map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-5 w-5 fill-current ${STAR_COLORS[pokemon.star_rating]}`} 
                />
              ))}
              {pokemon.star_rating > 3 && (
                <span className={`text-xs font-semibold ${STAR_COLORS[pokemon.star_rating]}`}>
                  {pokemon.star_rating}★
                </span>
              )}
            </div>
            <div className="flex justify-center gap-2">
              <Badge 
                style={{ backgroundColor: typeColor }}
                className="text-white capitalize shadow-lg"
              >
                {pokemon.pokemon_type}
              </Badge>
              {pokemon.secondary_type && (
                <Badge 
                  style={{ backgroundColor: TYPE_COLORS[pokemon.secondary_type as PokemonType] }}
                  className="text-white capitalize shadow-lg"
                >
                  {pokemon.secondary_type}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Stats section */}
        <div className="p-6 space-y-5 bg-slate-950">
          {/* Level and XP */}
          <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/60 shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-200 font-semibold text-sm">
                {t('level.current', { level: currentLevel })}
              </span>
              {isMaxLevel ? (
                <Badge variant="secondary" className="bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {t('level.max')}
                </Badge>
              ) : (
                <span className="text-slate-400 text-xs">
                  {t('level.xpToNext', { xp: xpForNextLevel - currentLevelXP })}
                </span>
              )}
            </div>
            <Progress value={xpProgress} className="h-2 bg-slate-700" />
          </div>
          
          {/* Power */}
          <div className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-850 rounded-xl p-4 border border-slate-700/60 shadow">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Sparkles className="h-4 w-4 text-amber-400" />
              {t('team.power')}
            </div>
            <span className="text-2xl font-black text-amber-400 drop-shadow">{pokemon.power}</span>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-[0.12em]">
              {t('pokemon.stats')}
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {renderStatGrade(
                t('banner.stats.damage'),
                pokemon.stat_damage,
                <Zap className="h-4 w-4 text-red-400" />
              )}
              {renderStatGrade(
                t('banner.stats.speed'),
                pokemon.stat_speed,
                <Gauge className="h-4 w-4 text-blue-400" />
              )}
              {renderStatGrade(
                t('banner.stats.effect'),
                pokemon.stat_effect,
                <Sparkles className="h-4 w-4 text-purple-400" />
              )}
            </div>
          </div>
          
          {/* Evolution status */}
          {pokemon.is_evolved && (
            <div className="text-center text-slate-400 text-xs bg-slate-800/60 border border-slate-700/60 rounded-lg py-2">
              {t('pokemon.evolved')} {pokemon.evolved_from && `from ${pokemon.evolved_from}`}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PokemonDetailModal;
