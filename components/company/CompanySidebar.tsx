'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeftFromBracket,
  BadgeDollar,
  Building,
  Cars,
  ChartLine,
  Clipboard,
} from '../icons';
import { useTranslation } from '@/providers/LanguageProvider';

type Props = {
  company: { id?: number; name?: string; email?: string } | null;
  activeTab: string;
  onTabChange: React.Dispatch<React.SetStateAction<string>>;
  locked?: boolean;
};

export default function CompanySidebar({ company, locked }: Props) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentTab = searchParams.get('tab') || 'dashboard';

  const menuItems = [
    {
      id: 'dashboard',
      label: t('companySidebar.dashboard'),
      icon: <ChartLine className="w-5 h-5" />,
    },
    {
      id: 'reservations',
      label: t('companySidebar.reservations'),
      icon: <Clipboard className="w-5 h-5" />,
    },
    {
      id: 'payments',
      label: t('companySidebar.payments'),
      icon: <BadgeDollar className="w-5 h-5" />,
    },
    {
      id: 'invoices',
      label: t('companySidebar.invoices'),
      icon: <Clipboard className="w-5 h-5" />,
    },
    {
      id: 'reports',
      label: t('companySidebar.reports'),
      icon: <ChartLine className="w-5 h-5" />,
    },
    {
      id: 'manage-cars',
      label: t('companySidebar.manageCars'),
      icon: <Cars className="w-5 h-5" />,
    },
    // {
    //   id: 'add-car',
    //   label: 'Add Car',
    //   icon: <Plus className="w-5 h-5" />,
    // },
    {
      id: 'offices',
      label: t('companySidebar.offices'),
      icon: <Building className="w-5 h-5" />,
    },
    {
      id: 'audit',
      label: t('companySidebar.auditLogs'),
      icon: <Clipboard className="w-5 h-5" />,
    },
  ];

  const handleTabChange = (tab: string) => {
    if (locked) {
      return;
    }

    router.push(`?tab=${tab}`);
  };

  return (
    <>
      <div className="sticky top-0 z-20 mb-4 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-sm backdrop-blur lg:hidden">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
              {t('companySidebar.companyAccount')}
            </p>
            <h3 className="truncate text-sm font-semibold text-gray-900">
              {company?.name || t('companySidebar.companyPanel')}
            </h3>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600"
          >
            {t('companySidebar.backToSite')}
          </Link>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {menuItems.map((item) => {
            const isActive = currentTab === item.id && !locked;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={
                  'shrink-0 rounded-full border px-3 py-2 text-xs font-medium transition ' +
                  (locked
                    ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 opacity-60'
                    : isActive
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-700')
                }
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <aside className="hidden overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm lg:block">
        <div className="border-b border-white/10 bg-linear-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/15 shadow-lg backdrop-blur">
              <Building className="h-8 w-8" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                {t('companySidebar.companyAccount')}
              </p>
              <h3 className="mt-1 truncate text-xl font-semibold">
                {company?.name || t('companySidebar.companyPanel')}
              </h3>
              <p className="mt-1 truncate text-sm text-white/75">
                {company?.email || t('companySidebar.noEmail')}
              </p>
            </div>
          </div>
        </div>

        <nav className="p-3">
          {menuItems.map((item) => {
            const isActive = currentTab === item.id && !locked;

            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`mb-1.5 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${
                  locked
                    ? 'cursor-not-allowed bg-gray-50 text-gray-400 opacity-60'
                    : isActive
                      ? 'bg-linear-to-r from-indigo-100 to-violet-100 text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                      : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    locked
                      ? 'bg-gray-100 text-gray-400'
                      : isActive
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-3">
          <Link
            href="/"
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-gray-50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
              <ArrowLeftFromBracket className="w-5 h-5" />
            </span>
            <span>{t('companySidebar.backToSite')}</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
