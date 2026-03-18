'use client';

import React from 'react';
import {
  ArrowLeftFromBracket,
  BadgeDollar,
  Building,
  Cars,
  ChartLine,
  Clipboard,
  Plus,
} from '../icons';

interface CompanyInfo {
  id: number;
  name: string;
  email: string;
}

interface Props {
  company: CompanyInfo | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function CompanySidebar({
  company,
  activeTab,
  onTabChange,
}: Props) {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <ChartLine className="w-5 h-5" />,
    },
    {
      id: 'reservations',
      label: 'Reservations',
      icon: <Clipboard className="w-5 h-5" />,
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: <BadgeDollar className="w-5 h-5" />,
    },
    {
      id: 'manage-cars',
      label: 'Manage Cars',
      icon: <Cars className="w-5 h-5" />,
    },
    {
      id: 'add-car',
      label: 'Add Car',
      icon: <Plus className="w-5 h-5" />,
    },
    {
      id: 'offices',
      label: 'Offices',
      icon: <Building className="w-5 h-5" />,
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b bg-linear-to-br from-indigo-500 to-purple-600 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 border-4 border-white flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">
              {company?.name || 'Company Panel'}
            </h3>
            <p className="text-sm text-white/80 truncate">
              {company?.email || ''}
            </p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded text-xs">
              COMPANY
            </span>
          </div>
        </div>
      </div>

      <nav className="p-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition mb-1 hover:bg-gray-100 hover:transition hover:scale-105 cursor-pointer ${
              activeTab === item.id
                ? 'bg-indigo-50 text-indigo-600 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <a
          href="/"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition mb-1 text-gray-600 hover:bg-gray-100 hover:transition hover:scale-105 cursor-pointer"
        >
          <ArrowLeftFromBracket className="w- h-5" />
          Back to Site
        </a>
      </div>
    </div>
  );
}
