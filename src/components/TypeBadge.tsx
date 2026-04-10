import { PokemonType, TYPE_COLORS, TYPE_ICONS } from '@/data/typeAdvantages';

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-[10px] gap-0.5',
  md: 'px-3 py-1 text-xs gap-1',
  lg: 'px-4 py-1.5 text-sm gap-1.5',
};

interface TypeBadgeProps {
  type: PokemonType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const TypeBadge = ({ 
  type, 
  size = 'md', 
  showIcon = true,
  className = ''
}: TypeBadgeProps) => {
  const bgColor = TYPE_COLORS[type];
  const icon = TYPE_ICONS[type];
  
  return (
    <span 
      className={`inline-flex items-center rounded-full font-bold text-white shadow-lg border border-white/20 ${SIZE_CLASSES[size]} ${className}`}
      style={{ 
        backgroundColor: bgColor,
        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
      }}
    >
      {showIcon && <span className={size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}>{icon}</span>}
      <span className="uppercase tracking-wide">{type}</span>
    </span>
  );
};

export default TypeBadge;
