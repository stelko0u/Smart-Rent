'use client';

import React from 'react';
import { useTranslation } from '@/providers/LanguageProvider';

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2">
      <span className="text-sm font-medium text-gray-600">
        {t('language.label')}:
      </span>

      <button
        type="button"
        onClick={() => setLocale('bg')}
        className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
          locale === 'bg'
            ? 'bg-black text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        BG
      </button>

      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
          locale === 'en'
            ? 'bg-black text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        EN
      </button>
    </div>
  );
}
