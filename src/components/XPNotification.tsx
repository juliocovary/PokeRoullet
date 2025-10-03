import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, Sparkles, Trophy } from 'lucide-react';

interface XPNotificationProps {
  isVisible: boolean;
  onHide: () => void;
  xpGained: number;
  source: string;
  newLevel?: number;
  isLevelUp?: boolean;
}

export const XPNotification = ({
  isVisible,
  onHide,
  xpGained,
  source,
  newLevel,
  isLevelUp = false
}: XPNotificationProps) => {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldShow(true);
      const timer = setTimeout(() => {
        setShouldShow(false);
        setTimeout(onHide, 300); // Wait for animation to complete
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onHide]);

  if (!isVisible) return null;

  return (
    <div className={`fixed top-20 right-4 z-50 transition-all duration-300 ${
      shouldShow ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <Card className={`p-4 min-w-64 ${
        isLevelUp 
          ? 'bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border-yellow-400'
          : 'bg-gradient-to-r from-purple-400/20 to-blue-500/20 border-purple-400'
      }`}>
        <div className="flex items-center space-x-3">
          {/* Icon */}
          <div className={`p-2 rounded-full ${
            isLevelUp 
              ? 'bg-yellow-400 text-yellow-900'
              : 'bg-purple-400 text-purple-900'
          }`}>
            {isLevelUp ? (
              <Trophy className="w-5 h-5" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            {isLevelUp ? (
              <>
                <div className="font-bold text-yellow-600 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Level Up! Nível {newLevel}
                </div>
                <div className="text-sm text-muted-foreground">
                  Parabéns pelo avanço!
                </div>
              </>
            ) : (
              <>
                <div className="font-bold text-purple-600 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  +{xpGained} XP
                </div>
                <div className="text-sm text-muted-foreground">
                  {source}
                </div>
              </>
            )}
          </div>

          {/* Badge */}
          <Badge variant={isLevelUp ? "default" : "secondary"}>
            {isLevelUp ? `Nv. ${newLevel}` : `+${xpGained}`}
          </Badge>
        </div>

        {/* Level up animation */}
        {isLevelUp && (
          <div className="mt-3">
            <Progress value={100} className="h-2" />
            <div className="text-xs text-center mt-1 text-yellow-600 font-medium">
              🎉 Nível {newLevel} alcançado!
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};