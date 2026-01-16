'use client';

import React from 'react';
import SignOutButton from '../auth/SignOutButton';

export default function MobileTopBar({
  active,
  setActive,
  isLoggedIn,
}: {
  active: string;
  setActive: (s: string) => void;
  isLoggedIn: boolean;
}) {
  return (
    <div className="md:hidden mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-linear-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold">
          AR
        </div>
        <div>
          <h2 className="text-lg font-semibold">Smart Rent</h2>
          <p className="text-xs text-gray-500">Drive Safe</p>
        </div>
      </div>
      <div>
        {isLoggedIn ? (
          <SignOutButton />
        ) : (
          <div className="flex gap-2">
            <a
              href="/signin"
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold"
            >
              Sign In
            </a>
            <a
              href="/signup"
              className="px-3 py-2 border border-indigo-600 text-indigo-600 rounded-lg text-sm font-semibold"
            >
              Sign Up
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
