'use client';

import React from 'react';
import { useTranslation } from '@/providers/LanguageProvider';

export default function Hero({
  query,
  setQuery,
  setActive,
}: {
  query: string;
  setQuery: (s: string) => void;
  setActive: (s: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <section className="mb-6 rounded-xl bg-linear-to-r from-indigo-600 to-sky-500 p-6 text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{t('hero.title')}</h1>

          <p className="mt-2 max-w-xl text-sm text-indigo-100/90 md:text-base">
            {t('hero.subtitle')}
          </p>

          <div className="mt-4 flex gap-3">
            <button
              className="rounded-lg bg-white px-4 py-2 font-semibold text-indigo-600 shadow-sm hover:opacity-95"
              onClick={() => setActive('browse')}
            >
              {t('hero.browseCars')}
            </button>

            <button className="rounded-lg border border-white/40 px-4 py-2 text-white hover:bg-white/10">
              {t('hero.howItWorks')}
            </button>
          </div>
        </div>

        <div className="w-full md:w-1/3">
          <div className="rounded-lg bg-white/10 p-4">
            <label className="mb-2 block text-sm text-white/90">
              {t('hero.searchCars')}
            </label>

            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('hero.searchPlaceholder')}
                className="flex-1 rounded-lg bg-white/20 px-3 py-2 text-white placeholder-white/70 focus:outline-none"
              />

              <button
                onClick={() => setActive('browse')}
                className="rounded-lg bg-white px-3 py-2 font-semibold text-indigo-600"
              >
                {t('hero.searchButton')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
