'use client';

import { createCompany } from '@/lib/api/adminApi';
import React, { useState } from 'react';
import { useTranslation } from '@/providers/LanguageProvider';

export default function AdminAddCompany() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [maintenancePercent, setMaintenancePercent] = useState<number | ''>(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setBusy(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        maintenancePercent:
          maintenancePercent === '' ? 0 : Number(maintenancePercent),
        // password: String(password),
      };

      await createCompany(payload);

      setOk(t('adminAddCompany.companyCreated'));
      setName('');
      setEmail('');
      setMaintenancePercent(0);

      window.dispatchEvent(new CustomEvent('company:created'));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('adminAddCompany.failedCreate'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="min-h-screen bg-linear-to-br from-slate-50 via-white to-indigo-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 sm:mb-10">
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:mt-3 sm:text-4xl">
            {t('adminAddCompany.title')}
          </h2>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            {t('adminAddCompany.subtitle')}
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          <div className="border-b border-slate-100 bg-linear-to-r from-indigo-600 to-violet-600 px-4 py-5 text-white sm:px-8 sm:py-8">
            <h3 className="text-lg font-semibold sm:text-xl">{t('adminAddCompany.newCompanyDetails')}</h3>
            <p className="mt-1 text-indigo-100">
              {t('adminAddCompany.formDescription')}
            </p>
          </div>

          <div className="p-4 sm:p-8 lg:p-10">
            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700 shadow-sm">
                {error}
              </div>
            )}

            {ok && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700 shadow-sm">
                {ok}
              </div>
            )}

            <form onSubmit={submit} className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {/* Company Name */}
              <div className="xl:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t('adminAddCompany.companyName')}
                </label>
                <input
                  placeholder={t('adminAddCompany.companyNamePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  required
                />
              </div>

              {/* Email */}
              <div className="xl:col-span-1">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t('adminAddCompany.email')}
                </label>
                <input
                  placeholder="company@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  required
                />
              </div>

              {/* Maintenance Percent */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t('adminAddCompany.maintenancePercent')}
                </label>

                <div className="relative">
                  <input
                    placeholder="0"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={
                      maintenancePercent === ''
                        ? ''
                        : String(maintenancePercent)
                    }
                    onChange={(e) =>
                      setMaintenancePercent(
                        e.target.value === '' ? '' : Number(e.target.value),
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 shadow-sm transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  />

                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-slate-400">
                    %
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  {t('adminAddCompany.maintenanceHint')}
                </p>
              </div>

              {/* Password */}
              {/* <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Password for Owner User
                </label>

                <input
                  placeholder="Enter password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  required
                  minLength={6}
                />

                <p className="mt-2 text-xs text-slate-500">
                  Minimum 6 characters.
                </p>
              </div> */}

              {/* Submit */}
              <div className="flex justify-stretch pt-2 md:col-span-2 md:justify-end xl:col-span-3 xl:pt-4">
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:scale-[1.01] hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto md:px-8"
                >
                  {busy ? t('adminAddCompany.creating') : t('adminAddCompany.createCompany')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
