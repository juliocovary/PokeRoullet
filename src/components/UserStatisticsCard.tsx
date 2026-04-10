import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserStatistics } from '@/hooks/useUserStatistics';
import { useTranslation } from 'react-i18next';
import { 
  RotateCw, 
  Sparkles, 
  Crown, 
  Store, 
  ShoppingCart,
  Users, 
  Trophy, 
  Calendar,
  Gift,
  BookOpen,
  Map,
  Layers
} from 'lucide-react';

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  iconColor?: string;
}

const StatItem = ({ icon, label, value, iconColor = "text-primary" }: StatItemProps) => (
  <div className="flex items-center gap-2 py-1.5">
    <div className={`${iconColor} shrink-0`}>{icon}</div>
    <span className="text-xs sm:text-sm text-muted-foreground flex-1 min-w-0 truncate">{label}</span>
    <span className="font-bold text-sm sm:text-base text-foreground">{value.toLocaleString()}</span>
  </div>
);

interface StatCategoryProps {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  children: React.ReactNode;
}

const StatCategory = ({ title, icon, iconBg, children }: StatCategoryProps) => (
  <Card className="p-3 sm:p-4 bg-gradient-to-br from-card to-muted/30">
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
      <div className={`${iconBg} p-1.5 rounded-lg`}>
        {icon}
      </div>
      <h4 className="font-semibold text-sm sm:text-base">{title}</h4>
    </div>
    <div className="space-y-1">
      {children}
    </div>
  </Card>
);

const StatsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <Card key={i} className="p-3 sm:p-4">
        <Skeleton className="h-6 w-24 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </Card>
    ))}
  </div>
);

export const UserStatisticsCard = () => {
  const { t } = useTranslation();
  const { statistics, loading } = useUserStatistics();

  if (loading) {
    return <StatsSkeleton />;
  }

  if (!statistics) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">{t('modals:profile.statistics.noData', { defaultValue: 'Nenhum dado disponível' })}</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {/* Roleta */}
      <StatCategory
        title={t('modals:profile.statistics.roulette', { defaultValue: 'Roleta' })}
        icon={<RotateCw className="w-4 h-4 text-amber-600" />}
        iconBg="bg-amber-100 dark:bg-amber-900/30"
      >
        <StatItem
          icon={<RotateCw className="w-4 h-4" />}
          label={t('modals:profile.statistics.totalSpins', { defaultValue: 'Total de Giros' })}
          value={statistics.total_spins}
          iconColor="text-amber-600"
        />
        <StatItem
          icon={<Sparkles className="w-4 h-4" />}
          label={t('modals:profile.statistics.shinyCaught', { defaultValue: 'Shinies Capturados' })}
          value={statistics.shiny_count}
          iconColor="text-purple-500"
        />
        <StatItem
          icon={<Crown className="w-4 h-4" />}
          label={t('modals:profile.statistics.legendaryCaught', { defaultValue: 'Lendários Capturados' })}
          value={statistics.legendary_count}
          iconColor="text-yellow-500"
        />
      </StatCategory>

      {/* Coleção */}
      <StatCategory
        title={t('modals:profile.statistics.collection', { defaultValue: 'Coleção' })}
        icon={<Layers className="w-4 h-4 text-blue-600" />}
        iconBg="bg-blue-100 dark:bg-blue-900/30"
      >
        <StatItem
          icon={<Layers className="w-4 h-4" />}
          label={t('modals:profile.statistics.totalPokemon', { defaultValue: 'Total de Pokémon' })}
          value={statistics.total_pokemon}
          iconColor="text-blue-600"
        />
        <StatItem
          icon={<BookOpen className="w-4 h-4" />}
          label={t('modals:profile.statistics.uniquePokemon', { defaultValue: 'Espécies Únicas' })}
          value={statistics.unique_pokemon}
          iconColor="text-blue-500"
        />
        <StatItem
          icon={<BookOpen className="w-4 h-4" />}
          label={t('modals:profile.statistics.pokedexPlaced', { defaultValue: 'Pokédex Preenchida' })}
          value={statistics.pokedex_placed}
          iconColor="text-indigo-500"
        />
        <StatItem
          icon={<Map className="w-4 h-4" />}
          label={t('modals:profile.statistics.regionsUnlocked', { defaultValue: 'Regiões Desbloqueadas' })}
          value={statistics.regions_unlocked}
          iconColor="text-cyan-500"
        />
      </StatCategory>

      {/* TradeHub */}
      <StatCategory
        title={t('modals:profile.statistics.tradehub', { defaultValue: 'TradeHub' })}
        icon={<Store className="w-4 h-4 text-emerald-600" />}
        iconBg="bg-emerald-100 dark:bg-emerald-900/30"
      >
        <StatItem
          icon={<Store className="w-4 h-4" />}
          label={t('modals:profile.statistics.cardsSold', { defaultValue: 'Cards Vendidos' })}
          value={statistics.cards_sold}
          iconColor="text-emerald-600"
        />
        <StatItem
          icon={<ShoppingCart className="w-4 h-4" />}
          label={t('modals:profile.statistics.cardsBought', { defaultValue: 'Cards Comprados' })}
          value={statistics.cards_bought}
          iconColor="text-emerald-500"
        />
        <StatItem
          icon={<span className="text-base">🪙</span>}
          label={t('modals:profile.statistics.coinsEarned', { defaultValue: 'Pokecoins Ganhas' })}
          value={statistics.total_coins_earned}
          iconColor="text-yellow-600"
        />
      </StatCategory>

      {/* Social */}
      <StatCategory
        title={t('modals:profile.statistics.social', { defaultValue: 'Social' })}
        icon={<Users className="w-4 h-4 text-pink-600" />}
        iconBg="bg-pink-100 dark:bg-pink-900/30"
      >
        <StatItem
          icon={<Users className="w-4 h-4" />}
          label={t('modals:profile.statistics.friendsCount', { defaultValue: 'Amigos' })}
          value={statistics.friends_count}
          iconColor="text-pink-600"
        />
        <StatItem
          icon={<Gift className="w-4 h-4" />}
          label={t('modals:profile.statistics.giftsSent', { defaultValue: 'Presentes Enviados' })}
          value={statistics.gifts_sent}
          iconColor="text-pink-500"
        />
        <StatItem
          icon={<Gift className="w-4 h-4" />}
          label={t('modals:profile.statistics.giftsReceived', { defaultValue: 'Presentes Recebidos' })}
          value={statistics.gifts_received}
          iconColor="text-rose-500"
        />
      </StatCategory>

      {/* Progresso */}
      <StatCategory
        title={t('modals:profile.statistics.progress', { defaultValue: 'Progresso' })}
        icon={<Trophy className="w-4 h-4 text-orange-600" />}
        iconBg="bg-orange-100 dark:bg-orange-900/30"
      >
        <StatItem
          icon={<Trophy className="w-4 h-4" />}
          label={t('modals:profile.statistics.achievementsCompleted', { defaultValue: 'Conquistas' })}
          value={statistics.achievements_completed}
          iconColor="text-orange-600"
        />
        <StatItem
          icon={<Calendar className="w-4 h-4" />}
          label={t('modals:profile.statistics.daysPlaying', { defaultValue: 'Dias Jogando' })}
          value={statistics.days_playing}
          iconColor="text-orange-500"
        />
      </StatCategory>
    </div>
  );
};
