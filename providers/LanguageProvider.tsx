'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getNestedValue,
  interpolate,
  Locale,
  translations,
  TranslationValue,
} from '@/lib/i18n/translations';

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  mounted: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

type LanguageProviderProps = {
  children: React.ReactNode;
  initialLocale?: Locale;
};

export function LanguageProvider({
  children,
  initialLocale = 'bg',
}: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLocale = window.localStorage.getItem('locale');

    if (savedLocale === 'bg' || savedLocale === 'en') {
      setLocaleState(savedLocale);
    }

    setMounted(true);
  }, []);

  const setLocale = (nextLocale: Locale) => {
    window.localStorage.setItem('locale', nextLocale);
    setLocaleState(nextLocale);
  };

  const value = useMemo<LanguageContextType>(() => {
    return {
      locale,
      setLocale,
      mounted,
      t: (key: string, params?: Record<string, string | number>) => {
        const template = getNestedValue(
          translations[locale] as Record<string, TranslationValue>,
          key,
        );

        if (!template) return key;

        return interpolate(template, params);
      },
    };
  }, [locale, mounted]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useTranslation must be used inside LanguageProvider');
  }

  return context;
}
