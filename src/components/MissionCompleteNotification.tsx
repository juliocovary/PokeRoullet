import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Coins, Star, Gem } from 'lucide-react';
import { Mission } from '@/hooks/useMissions';

interface MissionCompleteNotificationProps {
  mission: Mission;
  onClose: () => void;
}

export const MissionCompleteNotification = ({ 
  mission, 
  onClose 
}: MissionCompleteNotificationProps) => {
  const { t } = useTranslation('missions');
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getMissionIcon = () => {
    switch (mission.category) {
      case 'spin': return '🎰';
      case 'sell': return '💰';
      case 'catch_rare': return '✨';
      default: return '📋';
    }
  };

  return (
    <Card className="fixed top-20 right-4 z-50 w-80 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg animate-slide-in-right">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{getMissionIcon()}</span>
              <Badge 
                variant="secondary" 
                className={`text-white ${
                  mission.type === 'daily' ? 'bg-blue-500' : 'bg-purple-500'
                }`}
              >
                {mission.type === 'daily' ? t('type.daily') : t('type.weekly')}
              </Badge>
            </div>
            
            <h3 className="font-semibold text-green-800 text-sm">
              {t('missionCompleted')}
            </h3>
            <p className="text-green-700 text-sm mb-2">
              {mission.title}
            </p>
            
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <Coins className="w-3 h-3 text-yellow-500" />
                <span>{mission.reward_coins}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-blue-500" />
                <span>{mission.reward_xp} XP</span>
              </div>
              {mission.reward_shards > 0 && (
                <div className="flex items-center gap-1">
                  <Gem className="w-3 h-3 text-purple-500" />
                  <span>{mission.reward_shards}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};