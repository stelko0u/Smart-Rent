'use client';

import React, { useState } from 'react';
import Sidebar from '../components/layouts/Sidebar';
import MobileTopBar from '../components/layouts/MobileTopBar';
import Hero from '../components/Hero/Hero';
import FeaturedGrid from '../components/Featured/Featured';
import { CarSearchProvider, useCarSearch } from '@/providers/CarSearchProvider';
import type { HomeCar, Role } from '@/types/home';
import CarSearchBar from '@/components/home/CarSearchBar';
import FilteredCarsList from '@/components/home/FilteredCarsList';

type Props = {
  isLoggedIn: boolean;
  role: Role;
  initialCars: HomeCar[];
};

function HomeContent({
  isLoggedIn,
  role,
}: {
  isLoggedIn: boolean;
  role: Role;
}) {
  const [active, setActive] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { filteredCars, filters, setFilter } = useCarSearch();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#f8fafc_40%,_#eef2f7_100%)] text-gray-800">
      <div className="flex min-h-screen">
        <aside className="hidden xl:sticky xl:top-0 xl:block xl:h-screen">
          <Sidebar
            active={active}
            setActive={setActive}
            isLoggedIn={isLoggedIn}
            role={role}
          />
        </aside>

        <div
          className={`fixed inset-0 z-50 xl:hidden transition ${
            mobileMenuOpen
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0'
          }`}
        >
          <button
            type="button"
            aria-label="Close mobile menu"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div
            className={`relative h-full w-[290px] max-w-[85vw] bg-white shadow-2xl transition-transform duration-300 ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <Sidebar
              active={active}
              setActive={(value) => {
                setActive(value);
                setMobileMenuOpen(false);
              }}
              isLoggedIn={isLoggedIn}
              role={role}
            />
          </div>
        </div>

        <main className="flex-1">
          <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-5 md:px-6 lg:px-8 lg:py-6">
            <div className="rounded-[30px] border border-white/60 bg-white/70 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <div className="p-4 sm:p-5 md:p-6 lg:p-8">
                <MobileTopBar
                  active={active}
                  setActive={setActive}
                  isLoggedIn={isLoggedIn}
                  mobileMenuOpen={mobileMenuOpen}
                  setMobileMenuOpen={setMobileMenuOpen}
                />

                <div className="space-y-8">
                  <CarSearchBar />

                  <section className="space-y-5">
                    <div className="flex flex-col gap-4 rounded-[24px] border border-gray-200/70 bg-white/90 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                          Available vehicles
                        </p>
                        <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
                          Featured cars
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                          Разгледай наличните автомобили според избраните от теб
                          критерии.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Results
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          {filteredCars.length}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-gray-200/70 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
                      <FilteredCarsList />
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function HomePageClient({
  isLoggedIn,
  role,
  initialCars,
}: Props) {
  return (
    <CarSearchProvider cars={initialCars}>
      <HomeContent isLoggedIn={isLoggedIn} role={role} />
    </CarSearchProvider>
  );
}
