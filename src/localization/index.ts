import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { translations } from './translations';

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations['en'];

const getLanguage = async (): Promise<Language> => {
  try {
    const storedSettings = await AsyncStorage.getItem('app_settings');
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      return settings.language || 'en';
    }
  } catch (e) {
    console.error(e);
  }
  return 'en';
};

export const useTranslation = () => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const fetchLanguage = async () => {
      const lang = await getLanguage();
      setLanguage(lang);
    };
    fetchLanguage();

    const subscription = {
      remove: () => {
        // In a real app, you would use a library like 'react-native-localize'
        // to listen for language changes. For now, we will just refetch
        // the language when the settings change.
      }
    };

    return () => {
      subscription.remove();
    };
  }, []);
  
  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations['en'][key];
  };

  return { t, language, setLanguage };
};
