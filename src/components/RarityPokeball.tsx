import React from 'react';

type Rarity = 'legendary' | 'starter' | 'pseudo' | 'rare' | 'uncommon' | 'common' | 'secret';

interface RarityPokeballProps {
  rarity: Rarity;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const RARITY_COLORS: Record<Rarity, { top: string; accent: string; glow: string }> = {
  legendary: {
    top: 'from-yellow-400 to-amber-500',
    accent: 'bg-yellow-300',
    glow: 'shadow-yellow-400/50',
  },
  secret: {
    top: 'from-violet-500 to-purple-600',
    accent: 'bg-violet-300',
    glow: 'shadow-violet-400/50',
  },
  starter: {
    top: 'from-orange-400 to-amber-500',
    accent: 'bg-orange-300',
    glow: 'shadow-orange-400/40',
  },
  pseudo: {
    top: 'from-orange-500 to-red-500',
    accent: 'bg-orange-200',
    glow: 'shadow-orange-400/40',
  },
  rare: {
    top: 'from-purple-500 to-indigo-600',
    accent: 'bg-purple-300',
    glow: 'shadow-purple-400/40',
  },
  uncommon: {
    top: 'from-blue-400 to-blue-600',
    accent: 'bg-blue-300',
    glow: 'shadow-blue-400/40',
  },
  common: {
    top: 'from-green-400 to-green-600',
    accent: 'bg-green-300',
    glow: 'shadow-green-400/40',
  },
};

const SIZES = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export const RarityPokeball: React.FC<RarityPokeballProps> = ({ rarity, size = 'sm', className = '' }) => {
  const colors = RARITY_COLORS[rarity];
  const sizeClass = SIZES[size];

  return (
    <div className={`relative ${sizeClass} rounded-full overflow-hidden shadow-md ${colors.glow} ${className}`}>
      {/* Top half - Colored based on rarity */}
      <div className={`absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b ${colors.top}`} />
      
      {/* Bottom half - White/cream */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-gray-100 to-white" />
      
      {/* Middle black band */}
      <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-gray-900 transform -translate-y-1/2 z-10" />
      
      {/* Center button */}
      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full bg-white border-2 border-gray-900 z-20 flex items-center justify-center`}>
        <div className={`w-[45%] h-[45%] rounded-full ${colors.accent}`} />
      </div>
      
      {/* Shine effect */}
      <div className="absolute top-[15%] left-[20%] w-[25%] h-[15%] bg-white/50 rounded-full blur-[1px] transform rotate-[-30deg]" />
    </div>
  );
};
