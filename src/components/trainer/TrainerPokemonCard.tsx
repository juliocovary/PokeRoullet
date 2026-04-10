import { useTranslation } from 'react-i18next';
import { Star, Zap, Clock, Sparkles, Shield, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TYPE_COLORS, type PokemonType } from '@/data/typeAdvantages';
import { calculatePokemonDamage, type StatGrade } from '@/data/trainerPokemonPool';
import { getTypeModifier } from '@/data/typeModifiers';

interface TrainerPokemonCardProps {
  pokemonId: number;
  name: string;
  type: PokemonType;
  secondaryType?: PokemonType;
  starRating: number;
  level: number;
  power: number;
  statDamage: StatGrade;
  statSpeed: StatGrade;
  statEffect: StatGrade;
  isEvolved?: boolean;
  isInTeam?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

const STAT_COLORS: Record<StatGrade, string> = {
  'C-': 'text-gray-400',
  'C': 'text-gray-300',
  'C+': 'text-green-300',
  'B-': 'text-green-400',
  'B': 'text-blue-300',
  'B+': 'text-blue-400',
  'A-': 'text-purple-300',
  'A': 'text-purple-400',
  'A+': 'text-purple-500',
  'S-': 'text-yellow-300',
  'S': 'text-yellow-400',
  'S+': 'text-amber-400',
};

const STAT_BG_COLORS: Record<StatGrade, string> = {
  'C-': 'bg-gray-500/20',
  'C': 'bg-gray-400/20',
  'C+': 'bg-green-400/20',
  'B-': 'bg-green-500/20',
  'B': 'bg-blue-400/20',
  'B+': 'bg-blue-500/20',
  'A-': 'bg-purple-400/20',
  'A': 'bg-purple-500/20',
  'A+': 'bg-purple-600/20',
  'S-': 'bg-yellow-400/20',
  'S': 'bg-yellow-500/20',
  'S+': 'bg-amber-500/20',
};

const STAR_COLORS: Record<number, string> = {
  1: 'text-gray-400',
  2: 'text-green-400',
  3: 'text-blue-400',
  4: 'text-purple-400',
  5: 'text-yellow-400',
  6: 'text-pink-400',
};

const RARITY_GLOW: Record<number, string> = {
  1: '',
  2: '',
  3: 'shadow-blue-500/20',
  4: 'shadow-purple-500/30',
  5: 'shadow-yellow-500/40',
  6: 'shadow-pink-500/50',
};

const TrainerPokemonCard = ({
  pokemonId,
  name,
  type,
  secondaryType,
  starRating,
  level,
  power,
  statDamage,
  statSpeed,
  statEffect,
  isEvolved,
  isInTeam,
  onClick,
  compact = false,
}: TrainerPokemonCardProps) => {
  const { t } = useTranslation('trainer');
  
  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
  const typeColor = TYPE_COLORS[type] || '#A8A878';

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          "relative p-2 rounded-lg cursor-pointer transition-all duration-300 border-2 hover:scale-105",
          isInTeam 
            ? "border-pokemon-yellow bg-gradient-to-br from-yellow-500/30 to-amber-500/20 shadow-lg shadow-yellow-500/30" 
            : "border-white/30 bg-gradient-to-br from-slate-800/90 to-slate-900/90 hover:border-white/50 hover:shadow-lg"
        )}
        style={{ 
          borderColor: isInTeam ? undefined : `${typeColor}80`,
          boxShadow: isInTeam ? undefined : `0 0 10px ${typeColor}30`
        }}
      >
        {/* Glow effect for high rarity */}
        {starRating >= 4 && (
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/5 to-transparent animate-pulse" />
        )}
        
        <img
          src={spriteUrl}
          alt={name}
          className="w-14 h-14 mx-auto pixelated drop-shadow-lg relative z-10"
          loading="lazy"
        />
        <div className="text-center relative z-10">
          <div className="flex justify-center gap-0.5 mb-1">
            {Array.from({ length: starRating }).map((_, i) => (
              <Star key={i} className={cn("h-2.5 w-2.5 fill-current drop-shadow", STAR_COLORS[starRating])} />
            ))}
          </div>
          <p className="text-[11px] font-semibold text-white/90 truncate capitalize drop-shadow">{name}</p>
          <p className="text-[10px] text-white/60 font-medium">Lv.{level}</p>
        </div>
        
        {/* In team indicator */}
        {isInTeam && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-lg shadow-yellow-400/50" />
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 overflow-hidden group hover:scale-[1.02] hover:shadow-2xl",
        isInTeam 
          ? "border-pokemon-yellow shadow-xl shadow-pokemon-yellow/40 bg-gradient-to-br from-yellow-900/40 via-amber-900/30 to-yellow-800/40" 
          : "border-white/30 hover:border-white/50 bg-gradient-to-br from-slate-800/95 to-slate-900/95",
        starRating >= 5 && "animate-pulse-subtle",
        RARITY_GLOW[starRating]
      )}
      style={{ 
        borderColor: isInTeam ? undefined : `${typeColor}80`,
        boxShadow: isInTeam ? undefined : `0 4px 20px ${typeColor}30, inset 0 1px 0 rgba(255,255,255,0.1)`
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Animated gradient overlay for high rarity */}
      {starRating >= 5 && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-yellow-400/10 via-transparent to-pink-400/10 animate-pulse-slow" />
        </>
      )}

      {/* Top section: Stars and Team Badge */}
      <div className="relative flex justify-between items-start mb-2 z-10">
        {/* Star rating with glow */}
        <div className="flex gap-0.5">
          {Array.from({ length: starRating }).map((_, i) => (
            <div key={i} className="relative">
              <Star className={cn(
                "h-4 w-4 fill-current drop-shadow-lg transition-transform group-hover:scale-110",
                STAR_COLORS[starRating]
              )} />
              {starRating >= 5 && (
                <Star className={cn(
                  "h-4 w-4 fill-current absolute inset-0 blur-sm opacity-50 animate-pulse",
                  STAR_COLORS[starRating]
                )} />
              )}
            </div>
          ))}
        </div>

        {/* In team badge */}
        {isInTeam && (
          <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
            <Shield className="h-3 w-3" />
            <span>{t('pokemon.inTeam')}</span>
          </div>
        )}
      </div>

      {/* Pokemon sprite with enhanced effects */}
      <div className="relative my-3">
        {/* Glow effect behind sprite */}
        <div 
          className="absolute inset-0 blur-2xl opacity-30 scale-75 transition-transform group-hover:scale-90"
          style={{ 
            background: `radial-gradient(circle, ${typeColor}80 0%, transparent 70%)`
          }}
        />
        
        {/* Type-colored ring */}
        <div 
          className="absolute inset-0 rounded-full opacity-20 scale-90 transition-transform group-hover:scale-95"
          style={{ 
            background: `conic-gradient(from 0deg, ${typeColor}, transparent, ${typeColor})`,
            animation: starRating >= 5 ? 'spin 8s linear infinite' : undefined
          }}
        />

        <img
          src={spriteUrl}
          alt={name}
          className="relative w-24 h-24 mx-auto pixelated drop-shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] z-10"
          loading="lazy"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Legendary/rare particles effect */}
        {starRating >= 5 && (
          <>
            <Sparkles className="absolute top-0 right-6 h-4 w-4 text-yellow-300 animate-ping" style={{ animationDuration: '2s' }} />
            <Sparkles className="absolute bottom-2 left-6 h-3 w-3 text-pink-300 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
          </>
        )}

        {/* Crown for 6-star */}
        {starRating === 6 && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 animate-bounce">
            <Crown className="h-5 w-5 text-pink-400 fill-pink-400 drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* Pokemon info */}
      <div className="relative text-center space-y-2 z-10">
        <h3 className="text-base font-bold text-white capitalize drop-shadow-lg tracking-wide">
          {name}
        </h3>
        
        {/* Types with enhanced styling */}
        <div className="flex justify-center gap-1.5">
          <span 
            className="text-[11px] px-3 py-1 rounded-full text-white font-bold shadow-lg transition-transform hover:scale-105 border border-white/20"
            style={{ 
              backgroundColor: typeColor,
              boxShadow: `0 2px 8px ${typeColor}60`
            }}
          >
            {type}
          </span>
          {secondaryType && (
            <span 
              className="text-[11px] px-3 py-1 rounded-full text-white font-bold shadow-lg transition-transform hover:scale-105 border border-white/20"
              style={{ 
                backgroundColor: TYPE_COLORS[secondaryType],
                boxShadow: `0 2px 8px ${TYPE_COLORS[secondaryType]}60`
              }}
            >
              {secondaryType}
            </span>
          )}
        </div>

        {/* Level and Power with better styling */}
        <div className="flex justify-center gap-4 text-sm">
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 rounded-lg border border-white/10">
            <span className="text-white/70 text-xs">Lv</span>
            <span className="text-white font-bold">{level}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-lg border border-amber-500/30">
            <span className="text-yellow-300">⚔️</span>
            <span className="text-pokemon-yellow font-bold">
              {calculatePokemonDamage(power, statDamage, level, type)}
            </span>
          </div>
        </div>

        {/* Stats with enhanced design */}
        <div className="flex justify-center gap-2 pt-2">
          <div className={cn(
            "flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg border transition-transform hover:scale-105",
            STAT_BG_COLORS[statDamage],
            "border-red-500/30"
          )}>
            <Zap className="h-3.5 w-3.5 text-red-400" />
            <span className={cn("text-xs font-bold", STAT_COLORS[statDamage])}>{statDamage}</span>
          </div>
          <div className={cn(
            "flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg border transition-transform hover:scale-105",
            STAT_BG_COLORS[statSpeed],
            "border-blue-500/30"
          )}>
            <Clock className="h-3.5 w-3.5 text-blue-400" />
            <span className={cn("text-xs font-bold", STAT_COLORS[statSpeed])}>{statSpeed}</span>
          </div>
          <div className={cn(
            "flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg border transition-transform hover:scale-105",
            STAT_BG_COLORS[statEffect],
            "border-purple-500/30"
          )}>
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span className={cn("text-xs font-bold", STAT_COLORS[statEffect])}>{statEffect}</span>
          </div>
        </div>

        {/* Evolved badge with enhanced style */}
        {isEvolved && (
          <div className="flex items-center justify-center gap-1 text-xs text-purple-300 mt-2 bg-purple-500/20 py-1 px-3 rounded-full border border-purple-500/30 shadow-lg">
            <Sparkles className="h-3 w-3" />
            <span className="font-semibold">{t('pokemon.evolved')}</span>
            <Sparkles className="h-3 w-3" />
          </div>
        )}
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          boxShadow: `inset 0 0 20px ${typeColor}40, 0 0 20px ${typeColor}20`
        }}
      />

      {/* Custom animations */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
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
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default TrainerPokemonCard;
