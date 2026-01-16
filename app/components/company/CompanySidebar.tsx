'use client';

import React from 'react';

export default function CompanySidebar({
  active,
  setActive,
}: {
  active: string;
  setActive: (s: string) => void;
}) {
  const items = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'manage-cars', label: 'Manage cars' },
    { key: 'add-car', label: 'Add car' },
    { key: 'offices', label: 'Offices' },
  ];

  return (
    <aside className="w-64 hidden md:flex flex-col bg-white border-r border-gray-200 min-h-screen p-6">
      <div className="flex items-center gap-3 mb-8">
        <div>
          <h3 className="text-lg font-semibold">Company panel</h3>
          <p className="text-sm text-gray-500">Manage your company</p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => setActive(it.key)}
            className={
              'w-full px-3 py-2 bg-yellow-200/50 rounded text-left ' +
              (active === it.key
                ? 'font-semibold bg-yellow-300'
                : 'hover:bg-yellow-100')
            }
          >
            {it.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto">
        <a
          href="/"
          className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Back to site
        </a>
      </div>
    </aside>
  );
}
