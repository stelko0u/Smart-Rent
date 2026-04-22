'use client';

import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import CompanySidebar from './CompanySidebar';
import { useSearchParams } from 'next/navigation';
import { Car } from '@/types/database';
import {
  getCompanyAccessStatus,
  getCompanyCars,
  getCompanyStripeOnboardingLink,
  type CompanyAccessState,
} from '@/lib/api/companyApi';
import { useTranslation } from '@/providers/LanguageProvider';

const CompanyDashboard = dynamic(() => import('./CompanyDashboard'));
const CompanyReservations = dynamic(() => import('./CompanyReservations'));
const CompanyPayments = dynamic(() => import('./CompanyPayments'));
const CompanyInvoices = dynamic(() => import('./CompanyInvoices'));
const CompanyReports = dynamic(() => import('./CompanyReports'));
const ManageCars = dynamic(() => import('./ManageCars'));
const AddCarForm = dynamic(() => import('./AddCarForm'));
const CompanyOffices = dynamic(() => import('./CompanyOffices'));
const CompanyAuditPageClient = dynamic(() =>
  import('../audit/CompanyAuditPageClient').then(
    (module) => module.CompanyAuditPageClient,
  ),
);

export default function CompanyArea() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [active, setActive] = useState<string>('dashboard');
  const [company, setCompany] = useState<
    import('@/types/database').Company | null
  >(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [access, setAccess] = useState<CompanyAccessState | null>(null);
  const [creatingOnboardingLink, setCreatingOnboardingLink] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCompanyData = useCallback(async () => {
    setCheckingAccess(true);

    try {
      setError(null);

      const accessData = await getCompanyAccessStatus();
      setCompany(accessData?.company ?? null);
      setAccess(accessData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('companyArea.loadingFailed'));
    } finally {
      setCheckingAccess(false);
    }
  }, [t]);

  const loadCars = useCallback(async () => {
    try {
      setError(null);
      const nextCars = await getCompanyCars();
      setCars(nextCars);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('companyArea.failedLoadCars'));
    }
  }, [t]);

  useEffect(() => {
    void loadCompanyData();
  }, [loadCompanyData]);

  useEffect(() => {
    if (active === 'manage-cars' && access?.allowed) {
      void loadCars();
    }
  }, [active, access?.allowed, loadCars]);

  useEffect(() => {
    const tab = searchParams?.get('tab') ?? searchParams?.get('section');
    if (tab && typeof tab === 'string') {
      setActive(tab);
    }
  }, [searchParams]);

  async function handleCarCreated() {
    await loadCars();
  }

  async function goToStripeOnboarding() {
    try {
      setCreatingOnboardingLink(true);
      setError(null);

      const url = await getCompanyStripeOnboardingLink();
      window.location.href = url;
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : t('companyArea.failedStripeRedirect'),
      );
    } finally {
      setCreatingOnboardingLink(false);
    }
  }

  const isLocked =
    !checkingAccess &&
    access &&
    access.onboardingRequired &&
    access.allowed === false;

  useEffect(() => {
    const tabTitleMap: Record<string, string> = {
      dashboard: t('companySidebar.dashboard'),
      reservations: t('companySidebar.reservations'),
      payments: t('companySidebar.payments'),
      invoices: t('companySidebar.invoices'),
      reports: t('companySidebar.reports'),
      'manage-cars': t('companySidebar.manageCars'),
      offices: t('companySidebar.offices'),
      audit: t('companySidebar.auditLogs'),
      'add-car': t('nav.addCar'),
    };

    const tabTitle = tabTitleMap[active] || t('companySidebar.companyPanel');
    document.title = `${tabTitle} | Smart Rent`;
  }, [active, t]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <div className="mx-auto max-w-375 px-3 py-4 sm:px-4 sm:py-6 lg:py-8">
        <div className="grid gap-4 lg:grid-cols-4 lg:gap-6">
          <div className="lg:col-span-1">
            <CompanySidebar
              company={company}
              activeTab={active}
              onTabChange={setActive}
              locked={Boolean(isLocked)}
            />
          </div>

          <div className="min-w-0 lg:col-span-3">
            {error && (
              <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700 sm:mb-6">
                {error}
              </div>
            )}

            {checkingAccess ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="text-lg text-gray-600">
                  {t('companyArea.checkingAccess')}
                </div>
              </div>
            ) : isLocked ? (
              <div className="rounded-2xl border border-amber-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-amber-200 bg-amber-50 px-4 py-4 sm:px-6 sm:py-5">
                  <h2 className="text-xl font-bold text-amber-900 sm:text-2xl">
                    {t('companyArea.finishActivation')}
                  </h2>
                  <p className="mt-2 text-sm text-amber-800 sm:text-base">
                    {t('companyArea.lockedDescription')}
                  </p>
                </div>

                <div className="space-y-5 p-4 sm:p-6">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      {t('companyArea.activationChecklist')}
                    </h3>

                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-center justify-between gap-4">
                        <span>{t('companyArea.stripeDetailsSubmitted')}</span>
                        <span
                          className={`font-medium ${
                            access?.stripe?.detailsSubmitted
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {access?.stripe?.detailsSubmitted
                            ? t('companyArea.done')
                            : t('companyArea.missing')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span>{t('companyArea.chargesEnabled')}</span>
                        <span
                          className={`font-medium ${
                            access?.stripe?.chargesEnabled
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {access?.stripe?.chargesEnabled
                            ? t('companyArea.enabled')
                            : t('companyArea.notEnabled')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span>{t('companyArea.payoutsEnabled')}</span>
                        <span
                          className={`font-medium ${
                            access?.stripe?.payoutsEnabled
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {access?.stripe?.payoutsEnabled
                            ? t('companyArea.enabled')
                            : t('companyArea.notEnabled')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {access?.stripe?.disabledReason && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      {t('companyArea.stripeStatus')}: {access.stripe.disabledReason}
                    </div>
                  )}

                  {Array.isArray(access?.stripe?.currentlyDue) &&
                    access!.stripe!.currentlyDue.length > 0 && (
                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {t('companyArea.stillRequired')}
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
                        ? t('companyArea.redirecting')
                        : t('companyArea.fillCompanyDetails')}
                    </button>

                    <button
                      type="button"
                      onClick={loadCompanyData}
                      className="inline-flex items-center justify-center rounded-xl bg-gray-200 px-5 py-3 text-gray-800 font-medium hover:bg-gray-300"
                    >
                      {t('companyArea.refreshStatus')}
                    </button>
                  </div>

                  <p className="text-sm text-gray-500">
                    {t('companyArea.lockedFooter')}
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
                  <CompanyOffices companyId={company.id ?? 0} />
                )}
                {active === 'audit' && <CompanyAuditPageClient />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
