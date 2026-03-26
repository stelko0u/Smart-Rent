'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getNestedValue,
  interpolate,
  translations,
  type Locale,
} from '@/lib/i18n/translations';

type TranslateParams = Record<string, string | number>;

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: TranslateParams) => string;
};

const DEFAULT_LOCALE: Locale = 'bg';
const STORAGE_KEY = 'locale';
const COOKIE_KEY = 'locale';

const LanguageContext = createContext<LanguageContextType | null>(null);

function getInitialLocale(): Locale {
  if (typeof document === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const cookieMatch = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]*)`),
  );

  const cookieLocale = cookieMatch?.[1];
  if (cookieLocale === 'bg' || cookieLocale === 'en') {
    return cookieLocale;
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'bg' || saved === 'en') {
    return saved;
  }

  return DEFAULT_LOCALE;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const initial = getInitialLocale();
    setLocaleState(initial);
    document.documentElement.lang = initial;
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    window.localStorage.setItem(STORAGE_KEY, nextLocale);
    document.cookie = `${COOKIE_KEY}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = nextLocale;
  }, []);

  const t = useCallback(
    (key: string, params?: TranslateParams) => {
      const selected = translations[locale] as unknown as Record<string, any>;
      const fallback = translations.bg as unknown as Record<string, any>;

      const value =
        getNestedValue(selected, key) ?? getNestedValue(fallback, key) ?? key;

      return interpolate(value, params);
    },
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t],
  );

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
