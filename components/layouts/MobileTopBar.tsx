'use client';

import React from 'react';

type Props = {
  active: string;
  setActive: (value: string) => void;
  isLoggedIn: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (value: boolean) => void;
};

export default function MobileTopBar({
  active,
  setActive,
  isLoggedIn,
  mobileMenuOpen,
  setMobileMenuOpen,
}: Props) {
  return (
    <div className="mb-4 flex items-center justify-between md:hidden">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50"
        >
          <div className="flex flex-col gap-1.5">
            <span className="block h-0.5 w-5 bg-gray-800" />
            <span className="block h-0.5 w-5 bg-gray-800" />
            <span className="block h-0.5 w-5 bg-gray-800" />
          </div>
        </button>

        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Menu</p>
          <h1 className="text-base font-semibold capitalize text-gray-900">
            {active}
          </h1>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setActive('home')}
        className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
      >
        Home
      </button>
    </div>
  );
}
