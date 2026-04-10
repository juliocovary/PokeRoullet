import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { languageDetector } from './detector';

// Import PT translations
import ptCommon from '@/locales/pt/common.json';
import ptAuth from '@/locales/pt/auth.json';
import ptGame from '@/locales/pt/game.json';
import ptModals from '@/locales/pt/modals.json';
import ptMissions from '@/locales/pt/missions.json';
import ptToasts from '@/locales/pt/toasts.json';
import ptShiny from '@/locales/pt/shiny.json';
import ptEvent from '@/locales/pt/event.json';
import ptTrainer from '@/locales/pt/trainer.json';
import ptClan from '@/locales/pt/clan.json';

// Import EN translations
import enCommon from '@/locales/en/common.json';
import enAuth from '@/locales/en/auth.json';
import enGame from '@/locales/en/game.json';
import enModals from '@/locales/en/modals.json';
import enMissions from '@/locales/en/missions.json';
import enToasts from '@/locales/en/toasts.json';
import enShiny from '@/locales/en/shiny.json';
import enEvent from '@/locales/en/event.json';
import enTrainer from '@/locales/en/trainer.json';
import enClan from '@/locales/en/clan.json';

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: {
        common: ptCommon,
        auth: ptAuth,
        game: ptGame,
        modals: ptModals,
        missions: ptMissions,
        toasts: ptToasts,
        shiny: ptShiny,
        event: ptEvent,
        trainer: ptTrainer,
        clan: ptClan
      },
      en: {
        common: enCommon,
        auth: enAuth,
        game: enGame,
        modals: enModals,
        missions: enMissions,
        toasts: enToasts,
        shiny: enShiny,
        event: enEvent,
        trainer: enTrainer,
        clan: enClan
      }
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
