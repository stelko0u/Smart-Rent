'use client';

import React from 'react';

type Props = {
  isLoggedIn: boolean;
};

export default function Hero({
  query,
  setQuery,
  setActive,
}: {
  query: string;
  setQuery: (s: string) => void;
  setActive: (s: string) => void;
}) {
  return (
    <section className="bg-linear-to-r from-indigo-600 to-sky-500 text-white rounded-xl p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Find the perfect car for your next trip
          </h1>
          <p className="mt-2 text-sm md:text-base text-indigo-100/90 max-w-xl">
            Affordable rentals, flexible dates, and a wide selection — from
            electric cars to rugged SUVs.
          </p>

          <div className="mt-4 flex gap-3">
            <button
              className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-semibold shadow-sm hover:opacity-95"
              onClick={() => setActive('browse')}
            >
              Browse Cars
            </button>
            <button className="px-4 py-2 border border-white/40 text-white rounded-lg hover:bg-white/10">
              How it Works
            </button>
          </div>
        </div>

        <div className="w-full md:w-1/3">
          <div className="bg-white/10 p-4 rounded-lg">
            <label className="block text-sm text-white/90 mb-2">
              Search cars
            </label>
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by model or type (e.g., Tesla, SUV)"
                className="flex-1 px-3 py-2 rounded-lg bg-white/20 placeholder-white/70 text-white focus:outline-none"
              />
              <button
                onClick={() => setActive('browse')}
                className="px-3 py-2 bg-white text-indigo-600 rounded-lg font-semibold"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
