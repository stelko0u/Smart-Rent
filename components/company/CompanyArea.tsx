'use client';

import React, { useEffect, useState } from 'react';
import CompanySidebar from './CompanySidebar';
import CompanyDashboard from './CompanyDashboard';
import CompanyReservations from './CompanyReservations';
import CompanyPayments from './CompanyPayments';
import ManageCars from './ManageCars';
import AddCarForm from './AddCarForm';
import CompanyOffices from './CompanyOffices';
import { useSearchParams, useRouter } from 'next/navigation';
import { Car } from '@/types/database';

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (!ct.includes('application/json'))
    throw new Error(
      `Expected JSON but got ${ct || 'unknown'} (status ${res.status})`,
    );
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON response');
  }
}

export default function CompanyArea() {
  const searchParams = useSearchParams();
  const [active, setActive] = useState<string>('dashboard');
  const [company, setCompany] = useState<any>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadCompanyData();
  }, []);

  useEffect(() => {
    if (active === 'manage-cars') {
      loadCars();
    }
  }, [active]);

  useEffect(() => {
    const tab = searchParams?.get('tab') ?? searchParams?.get('section');
    if (tab && typeof tab === 'string') {
      setActive(tab);
    }
  }, [searchParams]);

  async function loadCompanyData() {
    setLoading(true);
    try {
      const meRes = await fetch('/api/company/me', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!meRes.ok) throw new Error(`Auth error (${meRes.status})`);
      const me = await parseJsonSafe(meRes);
      setCompany(me.company);
    } catch (err: any) {
      setError(err.message || 'Loading failed');
    } finally {
      setLoading(false);
    }
  }

  async function loadCars() {
    try {
      const carsRes = await fetch('/api/company/cars', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!carsRes.ok) throw new Error(`Cars load error (${carsRes.status})`);
      const carsJson = await parseJsonSafe(carsRes);
      setCars(Array.isArray(carsJson.cars) ? carsJson.cars : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load cars');
    }
  }

  async function handleCarCreated(car: any) {
    await loadCars();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-375 mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <CompanySidebar
              company={company}
              activeTab={active}
              onTabChange={setActive}
            />
          </div>

          <div className="lg:col-span-3">
            {error && (
              <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {active === 'dashboard' && <CompanyDashboard />}
            {active === 'reservations' && <CompanyReservations />}
            {active === 'payments' && <CompanyPayments />}
            {active === 'manage-cars' && (
              <ManageCars cars={cars} onRefresh={loadCars} />
            )}
            {active === 'add-car' && (
              <AddCarForm onCreated={handleCarCreated} />
            )}
            {active === 'offices' && company && (
              <CompanyOffices companyId={company.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
