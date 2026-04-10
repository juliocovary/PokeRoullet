// Detector de localização customizado
async function getUserCountry(): Promise<string> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_code; // 'BR', 'US', etc
  } catch {
    return 'US'; // Default para inglês se falhar
  }
}

export const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    // 1. Checar localStorage primeiro
    const savedLang = localStorage.getItem('i18nextLng');
    if (savedLang && (savedLang === 'pt' || savedLang === 'en')) {
      return callback(savedLang);
    }

    // 2. Detectar país do usuário
    const country = await getUserCountry();
    
    // Brasil → Português, Resto do mundo → Inglês
    const lang = country === 'BR' ? 'pt' : 'en';
    callback(lang);
  },
  init: () => {},
  cacheUserLanguage: (lng: string) => {
    localStorage.setItem('i18nextLng', lng);
  }
};
