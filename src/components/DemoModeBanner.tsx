import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sparkles, LogIn } from 'lucide-react';

interface DemoModeBannerProps {
  demoSpins: number;
}

export const DemoModeBanner = ({ demoSpins }: DemoModeBannerProps) => {
  const { t } = useTranslation('common');

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 shadow-lg">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="font-medium">{t('demoMode.banner')}</span>
          <span className="bg-white/20 px-2 py-0.5 rounded text-sm">
            {demoSpins} {t('demoMode.spinsRemaining')}
          </span>
        </div>
        <Link to="/auth">
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-white text-amber-600 hover:bg-white/90 font-semibold"
          >
            <LogIn className="w-4 h-4 mr-2" />
            {t('demoMode.createAccount')}
          </Button>
        </Link>
      </div>
    </div>
  );
};
