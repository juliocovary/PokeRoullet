// Type-based modifiers for Trainer Mode balancing
// Types without status effects receive compensatory stat bonuses

export interface TypeModifier {
  damageMultiplier: number;    // 1.0 = normal, 1.15 = +15%
  speedMultiplier: number;     // 0.9 = 10% faster, 1.1 = 10% slower
  hasStatusEffect: boolean;    // Whether this type has a special effect
  description: string;         // Explanation for UI
}

// Status effects are defined in statusEffects.ts for:
// fire (burn), water (slow), grass (leech), electric (shock), 
// psychic (confuse), ice (freeze), dragon (power)

export const TYPE_MODIFIERS: Record<string, TypeModifier> = {
  // ========================================
  // Types WITH status effects (balanced 1.0)
  // ========================================
  fire:     { damageMultiplier: 1.0,  speedMultiplier: 1.0,  hasStatusEffect: true, description: 'Queima: Dano ao longo do tempo' },
  water:    { damageMultiplier: 1.0,  speedMultiplier: 1.0,  hasStatusEffect: true, description: 'Lentidão: Reduz velocidade do inimigo' },
  grass:    { damageMultiplier: 1.0,  speedMultiplier: 1.0,  hasStatusEffect: true, description: 'Drenar: Recupera vida do time' },
  electric: { damageMultiplier: 1.0,  speedMultiplier: 1.0,  hasStatusEffect: true, description: 'Choque: Paralisa brevemente' },
  psychic:  { damageMultiplier: 1.0,  speedMultiplier: 1.0,  hasStatusEffect: true, description: 'Confusão: Aumenta dano recebido' },
  ice:      { damageMultiplier: 1.0,  speedMultiplier: 1.0,  hasStatusEffect: true, description: 'Congelamento: Congela o inimigo' },
  dragon:   { damageMultiplier: 1.0,  speedMultiplier: 1.0,  hasStatusEffect: true, description: 'Poder: Buff de dano do time' },
  
  // ========================================
  // Types WITHOUT status effects - COMPENSATION
  // ========================================
  
  // Fighting: Pure aggression - high damage + high speed
  fighting: { 
    damageMultiplier: 1.20, 
    speedMultiplier: 0.85, 
    hasStatusEffect: false, 
    description: 'Agressivo: +20% Dano, +15% Velocidade' 
  },
  
  // Rock: Tank - very high damage but slower
  rock: { 
    damageMultiplier: 1.25, 
    speedMultiplier: 1.10, 
    hasStatusEffect: false, 
    description: 'Tanque: +25% Dano, -10% Velocidade' 
  },
  
  // Ground: Balanced power boost
  ground: { 
    damageMultiplier: 1.15, 
    speedMultiplier: 1.0, 
    hasStatusEffect: false, 
    description: 'Estável: +15% Dano' 
  },
  
  // Steel: Defensive with power
  steel: { 
    damageMultiplier: 1.15, 
    speedMultiplier: 1.0, 
    hasStatusEffect: false, 
    description: 'Blindado: +15% Dano' 
  },
  
  // Flying: Maximum speed, normal damage
  flying: { 
    damageMultiplier: 1.0, 
    speedMultiplier: 0.80, 
    hasStatusEffect: false, 
    description: 'Ágil: +20% Velocidade' 
  },
  
  // Normal: Versatile with moderate bonuses
  normal: { 
    damageMultiplier: 1.10, 
    speedMultiplier: 0.95, 
    hasStatusEffect: false, 
    description: 'Versátil: +10% Dano, +5% Velocidade' 
  },
  
  // Dark: Aggressive assassin
  dark: { 
    damageMultiplier: 1.10, 
    speedMultiplier: 0.90, 
    hasStatusEffect: false, 
    description: 'Assassino: +10% Dano, +10% Velocidade' 
  },
  
  // Ghost: Fast and sneaky
  ghost: { 
    damageMultiplier: 1.05, 
    speedMultiplier: 0.90, 
    hasStatusEffect: false, 
    description: 'Espectral: +5% Dano, +10% Velocidade' 
  },
  
  // Poison: Slight damage boost with speed
  poison: { 
    damageMultiplier: 1.08, 
    speedMultiplier: 0.95, 
    hasStatusEffect: false, 
    description: 'Tóxico: +8% Dano, +5% Velocidade' 
  },
  
  // Bug: Very fast, moderate damage
  bug: { 
    damageMultiplier: 1.05, 
    speedMultiplier: 0.85, 
    hasStatusEffect: false, 
    description: 'Enxame: +5% Dano, +15% Velocidade' 
  },
  
  // Fairy: Balanced with slight bonuses
  fairy: { 
    damageMultiplier: 1.08, 
    speedMultiplier: 0.95, 
    hasStatusEffect: false, 
    description: 'Encantado: +8% Dano, +5% Velocidade' 
  },
};

// Helper to get modifier safely
export const getTypeModifier = (type: string): TypeModifier => {
  return TYPE_MODIFIERS[type.toLowerCase()] || {
    damageMultiplier: 1.0,
    speedMultiplier: 1.0,
    hasStatusEffect: false,
    description: 'Tipo desconhecido'
  };
};

// Calculate effective damage with type modifier
export const getEffectiveDamageMultiplier = (type: string): number => {
  return getTypeModifier(type).damageMultiplier;
};

// Calculate effective speed with type modifier
export const getEffectiveSpeedMultiplier = (type: string): number => {
  return getTypeModifier(type).speedMultiplier;
};
