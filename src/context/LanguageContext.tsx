import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useEffect, useState } from 'react';
import * as RNLocalize from 'react-native-localize';

import { translations } from '../localization/translations';

type Language = keyof typeof translations;
type TranslationKey = keyof typeof translations['en'];

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    console.log(RNLocalize);
    const loadLanguage = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem('app_settings');
        if (storedSettings) {
          const settings = JSON.parse(storedSettings);
          setLanguageState(settings.language || 'en');
        } else {
          const locales = RNLocalize.getLocales();
          const bestLanguage = RNLocalize.findBestLanguageTag(Object.keys(translations));
          setLanguageState((bestLanguage?.languageTag as Language) || 'en');
        }
      } catch (e) {
        console.error('Failed to load language from storage', e);
      }
    };
    loadLanguage();

    // RNLocalize v3 removed addEventListener. 
    // Language changes usually require app restart or valid state updates on focus if critical.
    // For now, removing the listener to prevent crash.
  }, []);

  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);
      const storedSettings = await AsyncStorage.getItem('app_settings');
      const settings = storedSettings ? JSON.parse(storedSettings) : {};
      settings.language = lang;
      await AsyncStorage.setItem('app_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save language to storage', e);
    }
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let text = translations[language][key] || translations['en'][key] || key;

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }

    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = React.useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
