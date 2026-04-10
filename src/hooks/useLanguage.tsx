import { useTranslation } from 'react-i18next';

export const useLanguage = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang: 'pt' | 'en') => {
    i18n.changeLanguage(lang);
  };

  const currentLanguage = i18n.language as 'pt' | 'en';

  return {
    t,
    changeLanguage,
    currentLanguage,
    isPortuguese: currentLanguage === 'pt',
    isEnglish: currentLanguage === 'en'
  };
};
