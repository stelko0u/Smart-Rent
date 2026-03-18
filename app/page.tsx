'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layouts/Sidebar';
import MobileTopBar from '../components/layouts/MobileTopBar';
import Hero from '../components/Hero/Hero';
import FeaturedGrid from '../components/Featured/Featured';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<'user' | 'company' | 'admin' | null>(null);

  const [cars, setCars] = useState<
    {
      id: number;
      name: string;
      type: string;
      pricePerDay: number;
      img: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ac = new AbortController();

    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          signal: ac.signal,
          headers: { Accept: 'application/json' },
        });

        if (!res.ok) {
          setIsLoggedIn(false);
          setRole(null);
          return;
        }

        const data = await res.json();
        const logged =
          Boolean(data?.ok) ||
          Boolean(data?.authenticated) ||
          Boolean(data?.success) ||
          Boolean(data?.user) ||
          false;
        setIsLoggedIn(logged);

        const rawRole =
          data?.role ??
          data?.user?.role ??
          data?.data?.role ??
          data?.user?.profile?.role ??
          data?.user?.type ??
          null;

        let normalizedRole: 'user' | 'company' | 'admin' | null = null;
        if (typeof rawRole === 'string') {
          const rl = rawRole.toLowerCase().trim();
          if (rl === 'user' || rl === 'company' || rl === 'admin') {
            normalizedRole = rl as 'user' | 'company' | 'admin';
          } else if (rl === 'manager') {
            normalizedRole = 'company';
          }
        }
        setRole(normalizedRole);
      } catch (err) {
        setIsLoggedIn(false);
        setRole(null);
      }
    }

    checkAuth();

    async function loadCars() {
      setLoading(true);
      try {
        const res = await fetch('/api/cars', { cache: 'no-store' });
        if (!res.ok) {
          console.warn('Failed loading cars:', res.status);
          setCars([]);
          return;
        }
        const json = await res.json();
        const list = Array.isArray(json.cars) ? json.cars : [];
        const mapped = list.map((c: any) => ({
          id: c.id,
          name: `${c.make} ${c.model}`,
          type: String(c.year ?? ''),
          pricePerDay: Number(c.pricePerDay ?? 0),
          img: Array.isArray(c.images) && c.images.length ? c.images[0] : '',
          companyName: c.company?.name ?? null,
        }));
        setCars(mapped);
      } catch (err) {
        console.warn('loadCars error', err);
        setCars([]);
      } finally {
        setLoading(false);
      }
    }

    loadCars();

    return () => ac.abort();
  }, []);

  const filtered = cars.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.type.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="flex">
        <Sidebar
          active={active}
          setActive={setActive}
          isLoggedIn={isLoggedIn}
          role={role}
        />

        <main className="flex-1 p-6">
          <MobileTopBar
            active={active}
            setActive={setActive}
            isLoggedIn={isLoggedIn}
          />
          <Hero query={query} setQuery={setQuery} setActive={setActive} />
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Featured cars</h2>
              <p className="text-sm text-gray-500">{filtered.length} results</p>
            </div>
            {loading ? (
              <div>Loading cars…</div>
            ) : (
              <FeaturedGrid cars={filtered} />
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
