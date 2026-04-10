import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/hooks/useProfile';
import { usePokemon } from '@/hooks/usePokemon';
import { Star, Sparkles, Trophy, Coins, Users } from 'lucide-react';

export const TrainerStats = () => {
  const { profile, loading, getXPProgress } = useProfile();
  const { inventory } = usePokemon();

  if (loading || !profile) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-16 bg-muted rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  const xpProgress = getXPProgress();
  const totalPokemon = inventory.reduce((total, item) => total + item.quantity, 0);
  const uniquePokemon = inventory.length;

  const rarityCount = inventory.reduce((acc, item) => {
    acc[item.rarity] = (acc[item.rarity] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);

  const stats = [
    {
      title: 'Nível',
      value: profile.level,
      subtitle: 'Treinador',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
    },
    {
      title: 'Experiência',
      value: profile.experience_points.toLocaleString(),
      subtitle: 'XP Total',
      icon: Sparkles,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
    },
    {
      title: 'Pokécoins',
      value: profile.pokecoins.toLocaleString(),
      subtitle: 'Moedas',
      icon: Coins,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
    {
      title: 'Pokémon',
      value: totalPokemon,
      subtitle: `${uniquePokemon} únicos`,
      icon: Trophy,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        {stats.map((stat, index) => (
          <Card 
            key={index} 
            className={`p-3 md:p-4 border-2 ${stat.borderColor} ${stat.bgColor} hover:shadow-md transition-all duration-200`}
          >
            <div className="flex flex-col md:flex-row items-center md:justify-between gap-2">
              <div className="text-center md:text-left">
                <div className={`text-xl md:text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  {stat.title}
                </div>
                <div className="text-xs text-muted-foreground hidden md:block">
                  {stat.subtitle}
                </div>
              </div>
              <div className={`p-2 md:p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* XP Progress Card */}
      <Card className="p-4 md:p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <div className="space-y-3 md:space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
              <Star className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              <span className="text-sm md:text-base">Progresso para o Nível {profile.level + 1}</span>
            </h3>
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Sparkles className="w-3 h-3" />
              {xpProgress.current} / {xpProgress.needed} XP
            </Badge>
          </div>
          
          <div className="space-y-2">
            <Progress value={xpProgress.percentage} className="h-2 md:h-3" />
            <div className="flex justify-between text-xs md:text-sm text-muted-foreground">
              <span>Nível {profile.level}</span>
              <span>{Math.round(xpProgress.percentage)}% completo</span>
              <span>Nível {profile.level + 1}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Pokemon Collection Summary */}
      {inventory.length > 0 && (
        <Card className="p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            <span className="text-sm md:text-base">Coleção de Pokémon</span>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
            {Object.entries(rarityCount).map(([rarity, count]) => {
              const rarityColors = {
                legendary: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400',
                starter: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400',
                pseudo: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400',
                rare: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
                uncommon: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400',
                common: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400',
              };

              const rarityLabels = {
                legendary: 'Lendário',
                starter: 'Inicial',
                pseudo: 'Pseudo',
                rare: 'Raro',
                uncommon: 'Incomum',
                common: 'Comum',
              };

              return (
                <div 
                  key={rarity}
                  className={`text-center p-2 md:p-3 rounded-lg border ${rarityColors[rarity as keyof typeof rarityColors] || rarityColors.common}`}
                >
                  <div className="text-lg md:text-xl font-bold">{count}</div>
                  <div className="text-xs truncate">
                    {rarityLabels[rarity as keyof typeof rarityLabels] || rarity}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};