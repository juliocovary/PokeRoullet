import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage } from '@/hooks/useLanguage';
import { Globe } from 'lucide-react';

export const LanguageSelector = () => {
  const { changeLanguage, currentLanguage } = useLanguage();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">{currentLanguage === 'pt' ? '🇧🇷 PT' : '🇺🇸 EN'}</span>
          <span className="sm:hidden">{currentLanguage === 'pt' ? '🇧🇷' : '🇺🇸'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-2">
        <div className="flex flex-col gap-1">
          <Button
            variant={currentLanguage === 'pt' ? 'default' : 'ghost'}
            onClick={() => changeLanguage('pt')}
            className="justify-start"
          >
            🇧🇷 Português
          </Button>
          <Button
            variant={currentLanguage === 'en' ? 'default' : 'ghost'}
            onClick={() => changeLanguage('en')}
            className="justify-start"
          >
            🇺🇸 English
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
