'use client';

import React, { useEffect, useState } from 'react';
import CompanySidebar from './CompanySidebar';
import CompanyDashboard from './CompanyDashboard';
import CompanyReservations from './CompanyReservations';
import CompanyPayments from './CompanyPayments';
import ManageCars from './ManageCars';
import AddCarForm from './AddCarForm';
import CompanyOffices from './CompanyOffices';
import { useSearchParams } from 'next/navigation';
import { Car } from '@/types/database';
import CompanyInvoices from './CompanyInvoices';
import CompanyReports from './CompanyReports';

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (!ct.includes('application/json')) {
    throw new Error(
      `Expected JSON but got ${ct || 'unknown'} (status ${res.status})`,
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON response');
  }
}

type CompanyAccessState = {
  allowed: boolean;
  onboardingRequired: boolean;
  reason:
    | 'company_not_found'
    | 'missing_company'
    | 'missing_stripe_account'
    | 'stripe_incomplete'
    | 'ready';
  company: any | null;
  stripe: {
    accountId: string | null;
    detailsSubmitted: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    disabledReason: string | null;
    currentlyDue: string[];
    pastDue: string[];
  } | null;
};

export default function CompanyArea() {
  const searchParams = useSearchParams();
  const [active, setActive] = useState<string>('dashboard');
  const [company, setCompany] = useState<any>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [access, setAccess] = useState<CompanyAccessState | null>(null);
  const [creatingOnboardingLink, setCreatingOnboardingLink] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCompanyData();
  }, []);

  useEffect(() => {
    if (active === 'manage-cars' && access?.allowed) {
      loadCars();
    }
  }, [active, access?.allowed]);

  useEffect(() => {
    const tab = searchParams?.get('tab') ?? searchParams?.get('section');
    if (tab && typeof tab === 'string') {
      setActive(tab);
    }
  }, [searchParams]);

  async function loadCompanyData() {
    setLoading(true);
    setCheckingAccess(true);

    try {
      const [meRes, accessRes] = await Promise.all([
        fetch('/api/company/me', {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch('/api/company/access-status', {
          credentials: 'include',
          cache: 'no-store',
        }),
      ]);

      if (!meRes.ok) {
        throw new Error(`Auth error (${meRes.status})`);
      }

      const me = await parseJsonSafe(meRes);
      setCompany(me.company);

      if (!accessRes.ok) {
        throw new Error(`Access status error (${accessRes.status})`);
      }

      const accessJson = await parseJsonSafe(accessRes);
      setAccess(accessJson.access ?? null);
    } catch (err: any) {
      setError(err.message || 'Loading failed');
    } finally {
      setLoading(false);
      setCheckingAccess(false);
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

  async function handleCarCreated() {
    await loadCars();
  }

  async function goToStripeOnboarding() {
    try {
      setCreatingOnboardingLink(true);
      setError(null);

      const res = await fetch('/api/company/stripe/onboarding-link', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await parseJsonSafe(res);

      if (!res.ok || !data?.ok || !data?.url) {
        throw new Error(data?.error || 'Failed to create onboarding link');
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Failed to redirect to Stripe onboarding');
    } finally {
      setCreatingOnboardingLink(false);
    }
  }

  const isLocked =
    !checkingAccess &&
    access &&
    access.onboardingRequired &&
    access.allowed === false;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-375 mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <CompanySidebar
              company={company}
              activeTab={active}
              onTabChange={setActive}
              locked={Boolean(isLocked)}
            />
          </div>

          <div className="lg:col-span-3">
            {error && (
              <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {checkingAccess ? (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8">
                <div className="text-lg text-gray-600">
                  Checking company access...
                </div>
              </div>
            ) : isLocked ? (
              <div className="rounded-2xl border border-amber-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-amber-50 border-b border-amber-200 px-6 py-5">
                  <h2 className="text-2xl font-bold text-amber-900">
                    Finish company activation
                  </h2>
                  <p className="mt-2 text-amber-800">
                    Your company account is created, but the panel is locked
                    until you complete the required Stripe company details.
                  </p>
                </div>

                <div className="p-6 space-y-5">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Activation checklist
                    </h3>

                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-center justify-between gap-4">
                        <span>Stripe details submitted</span>
                        <span
                          className={`font-medium ${
                            access?.stripe?.detailsSubmitted
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {access?.stripe?.detailsSubmitted
                            ? 'Done'
                            : 'Missing'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span>Charges enabled</span>
                        <span
                          className={`font-medium ${
                            access?.stripe?.chargesEnabled
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {access?.stripe?.chargesEnabled
                            ? 'Enabled'
                            : 'Not enabled'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span>Payouts enabled</span>
                        <span
                          className={`font-medium ${
                            access?.stripe?.payoutsEnabled
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {access?.stripe?.payoutsEnabled
                            ? 'Enabled'
                            : 'Not enabled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {access?.stripe?.disabledReason && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      Stripe status: {access.stripe.disabledReason}
                    </div>
                  )}

                  {Array.isArray(access?.stripe?.currentlyDue) &&
                    access!.stripe!.currentlyDue.length > 0 && (
                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          Still required in Stripe
                        </h3>
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                          {access!.stripe!.currentlyDue.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={goToStripeOnboarding}
                      disabled={creatingOnboardingLink}
                      className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {creatingOnboardingLink
                        ? 'Redirecting...'
                        : 'Fill company details'}
                    </button>

                    <button
                      type="button"
                      onClick={loadCompanyData}
                      className="inline-flex items-center justify-center rounded-xl bg-gray-200 px-5 py-3 text-gray-800 font-medium hover:bg-gray-300"
                    >
                      Refresh status
                    </button>
                  </div>

                  <p className="text-sm text-gray-500">
                    Until activation is completed, access to dashboard, cars,
                    offices, reservations, payments, invoices and reports stays
                    locked.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {active === 'dashboard' && <CompanyDashboard />}
                {active === 'reservations' && <CompanyReservations />}
                {active === 'payments' && <CompanyPayments />}
                {active === 'invoices' && <CompanyInvoices />}
                {active === 'reports' && <CompanyReports />}

                {active === 'manage-cars' && (
                  <ManageCars cars={cars} onRefresh={loadCars} />
                )}

                {active === 'add-car' && (
                  <AddCarForm onCreated={handleCarCreated} />
                )}

                {active === 'offices' && company && (
                  <CompanyOffices companyId={company.id} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
