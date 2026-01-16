'use client';

import React, { useEffect, useState } from 'react';
import CompanySidebar from '../../components/company/CompanySidebar';
import CompanyDashboard from '../../components/company/CompanyDashboard';
import ManageCars from '../../components/company/ManageCars';
import AddCarForm from '../../components/company/AddCarForm';
import { useSearchParams, useRouter } from 'next/navigation';
import CompanyOffices from './CompanyOffices';
import EditCarModal from './EditCarModal';
import DeleteCarModal from './DeleteCarModal';
import { Car, CarFormValues } from '../../types/types';

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (!ct.includes('application/json'))
    throw new Error(
      `Expected JSON but got ${ct || 'unknown'} (status ${res.status})`
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
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<CarFormValues | null>(null);

  // извикване от ManageCars
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (active === 'manage-cars' || active === 'dashboard')
      loadCompanyAndCars();
  }, [active]);

  useEffect(() => {
    const tab = searchParams?.get('tab') ?? searchParams?.get('section');
    if (tab && typeof tab === 'string') {
      setActive(tab);
    }
  }, [searchParams]);

  async function loadCompanyAndCars() {
    setLoading(true);
    setError(null);
    try {
      const meRes = await fetch('/api/company/me', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!meRes.ok) throw new Error(`Auth error (${meRes.status})`);
      const me = await parseJsonSafe(meRes);
      setCompanyName(me.company?.name ?? null);
      setCompanyId(me.company?.id ?? null);

      const carsRes = await fetch('/api/company/cars', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!carsRes.ok) throw new Error(`Cars load error (${carsRes.status})`);
      const carsJson = await parseJsonSafe(carsRes);
      setCars(Array.isArray(carsJson.cars) ? carsJson.cars : []);
    } catch (err: any) {
      setError(err.message || 'Loading failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(data: {
    make: string;
    model: string;
    year: number;
    pricePerDay: number;
    images: string[];
  }) {
    const res = await fetch('/api/company/cars', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Add failed (${res.status}) ${txt}`);
    }
    const json = await parseJsonSafe(res);
    setCars((c) => [json.car, ...c]);
  }

  async function handleDelete(id: number) {
    setDeleteId(id);
    setIsDeleteOpen(true);
  }

  function handleEdit(id: number) {
    const car = cars.find((c) => Number(c.id) === id);
    if (!car) return;
    setEditing({
      id: car.id,
      make: car.make ?? '',
      model: car.model ?? '',
      year: car.year ?? new Date().getFullYear(),
      pricePerDay: car.pricePerDay ?? 0,
      officeId: (car as any).officeId ?? '',
    });
    setIsEditOpen(true);
  }

  function handleDetails(id: number) {
    router.push(`/cars/${id}`);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/company/cars?id=${deleteId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Delete failed (${res.status}) ${txt}`);
      }
      setCars((c) => c.filter((x) => Number(x.id) !== deleteId));
      setIsDeleteOpen(false);
      setDeleteId(null);
    } catch (err: any) {
      setError(err?.message ?? 'Delete failed');
    } finally {
      setLoading(false);
    }
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setFormError(null);
    setFormBusy(true);
    try {
      const payload = {
        id: editing.id,
        make: editing.make,
        model: editing.model,
        year: Number(editing.year),
        pricePerDay: Number(editing.pricePerDay),
        officeId: editing.officeId === '' ? null : editing.officeId,
      };
      const res = await fetch('/api/company/cars', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {}
      if (!res.ok) {
        throw new Error(
          (json && json.error) || text || `Update failed (${res.status})`
        );
      }
      const updated = json?.car ?? json;
      setCars((list) =>
        list.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
      );
      setIsEditOpen(false);
      setEditing(null);
    } catch (err: any) {
      setFormError(err?.message ?? 'Update failed');
    } finally {
      setFormBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="flex">
        <CompanySidebar active={active} setActive={setActive} />
        <main className="flex-1 p-6">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold">
              {companyName ? `Company: ${companyName}` : 'Company area'}
            </h1>
            <p className="text-sm text-gray-500">
              Use the sidebar to manage cars
            </p>
          </header>

          {loading && <div>Loading…</div>}
          {error && <div className="mb-4 text-red-600">{error}</div>}

          {active === 'dashboard' && <CompanyDashboard cars={cars} />}
          {active === 'manage-cars' && (
            <ManageCars
              cars={cars}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDetails={handleDetails}
            />
          )}
          {active === 'add-car' && (
            <AddCarForm onCreated={(car) => setCars((c) => [car, ...c])} />
          )}
          {active === 'offices' && companyId !== null && <CompanyOffices companyId={companyId} />}
        </main>
      </div>

      <DeleteCarModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeleteId(null);
        }}
        onConfirm={confirmDelete}
      />

      <EditCarModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditing(null);
        }}
        editing={editing}
        onChange={setEditing}
        onSubmit={submitEdit}
        busy={formBusy}
        error={formError}
      />
    </div>
  );
}
