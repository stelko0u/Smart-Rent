'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Car } from '@/types/database';
import EditCarModal from '../modals/EditCarModal';
import DeleteCarModal from '../modals/DeleteCarModal';
import {
  BadgeDollar,
  Car as CarIcon,
  Cars,
  PenCircle,
  CircleTrash,
  Plus,
  Transmission,
  GasPump,
} from '../icons';
import {
  CompanyPanelBadge,
  CompanyPanelCard,
  CompanyPanelEmptyState,
  CompanyPanelInfoCard,
  CompanyPanelMetricCard,
  CompanyPanelPageHeader,
  CompanyPanelPagination,
  CompanyPanelSearch,
  CompanyPanelTabs,
  CompanyPanelToolbar,
} from './CompanyPanelUI';
import { deleteCompanyCar } from '@/lib/api/companyApi';
import { useTranslation } from '@/providers/LanguageProvider';
import {
  localizeCarType,
  localizeFuelType,
  localizeTransmission,
} from '@/lib/utils/vehicleLocalization';

type CarsViewMode = 'grid' | 'list';
const PAGE_SIZE = 9;

interface ManageCarsProps {
  cars: Car[];
  onRefresh?: () => void;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

function buildCarTitle(car: Car) {
  return `${car.make} ${car.model}`.trim();
}

function buildCarSubtitle(
  car: Car,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  return [
    localizeCarType(t, car.carType),
    localizeFuelType(t, car.fuelType),
    localizeTransmission(t, car.transmissionType),
  ]
    .filter(Boolean)
    .join(' • ');
}

export default function ManageCars({ cars, onRefresh }: ManageCarsProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<CarsViewMode>('grid');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editCarId, setEditCarId] = useState<number | null>(null);
  const [deleteCarId, setDeleteCarId] = useState<number | null>(null);

  const filteredCars = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return cars;
    }

    return cars.filter((car) =>
      [
        car.make,
        car.model,
        car.year.toString(),
        car.carType,
        car.fuelType,
        car.transmissionType,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [cars, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCars.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const paginatedCars = filteredCars.slice(pageStart, pageStart + PAGE_SIZE);

  React.useEffect(() => {
    setPage(1);
  }, [search]);

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const selectedCar = cars.find((car) => car.id === editCarId) ?? null;

  async function confirmDelete() {
    if (!deleteCarId) {
      return;
    }

    try {
      await deleteCompanyCar(deleteCarId);
      toast.success(t('companyManageCars.deletedSuccess'));
      setDeleteCarId(null);
      onRefresh?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('companyManageCars.deleteFailed'));
      setDeleteCarId(null);
    }
  }

  function handleEditSuccess() {
    toast.success(t('companyManageCars.updatedSuccess'));
    setEditCarId(null);
    onRefresh?.();
  }

  function handleAddCar() {
    router.push('?tab=add-car');
  }

  return (
    <div className="space-y-6">
      <CompanyPanelPageHeader
        eyebrow={t('companyManageCars.eyebrow')}
        title={t('companyManageCars.title')}
        description={t('companyManageCars.description')}
        rightSlot={
          <div className="grid gap-3 sm:grid-cols-2">
            <CompanyPanelInfoCard
              label={t('companyManageCars.visibleCars')}
              value={String(filteredCars.length)}
              description={t('companyManageCars.visibleCarsDescription')}
            />
            <CompanyPanelInfoCard
              label={t('companyManageCars.layout')}
              value={
                viewMode === 'grid'
                  ? t('companyManageCars.compactGrid')
                  : t('companyManageCars.detailedList')
              }
              description={t('companyManageCars.layoutDescription')}
              tone="success"
            />
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CompanyPanelMetricCard
          title={t('companyManageCars.totalVehicles')}
          value={cars.length}
          icon={<Cars className="h-5 w-5 text-indigo-600" />}
          accentClassName="bg-indigo-50"
        />
        <CompanyPanelMetricCard
          title={t('companyManageCars.suvListings')}
          value={cars.filter((car) => car.carType === 'SUV').length}
          icon={<CarIcon className="h-5 w-5 text-blue-600" />}
          accentClassName="bg-blue-50"
        />
        <CompanyPanelMetricCard
          title={t('companyManageCars.automatic')}
          value={
            cars.filter((car) => car.transmissionType === 'AUTOMATIC').length
          }
          icon={<Transmission className="h-5 w-5 text-amber-600" />}
          accentClassName="bg-amber-50"
        />
        <CompanyPanelMetricCard
          title={t('companyManageCars.avgDailyPrice')}
          value={
            cars.length > 0
              ? formatPrice(
                  cars.reduce(
                    (sum, car) => sum + Number(car.pricePerDay || 0),
                    0,
                  ) / cars.length,
                )
              : formatPrice(0)
          }
          icon={<BadgeDollar className="h-5 w-5 text-emerald-600" />}
          accentClassName="bg-emerald-50"
        />
      </section>

      <CompanyPanelCard
        title={t('companyManageCars.inventoryTitle')}
        description={t('companyManageCars.inventoryDescription')}
        rightSlot={
          <button
            type="button"
            onClick={handleAddCar}
            className="inline-flex h-11 items-center rounded-2xl bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
              <Plus className="mr-2 h-4 w-4" />
              {t('companyManageCars.addCar')}
            </button>
          }
      >
        <CompanyPanelToolbar
          leftSlot={
            <CompanyPanelTabs<CarsViewMode>
              value={viewMode}
              onChange={setViewMode}
              options={[
                { value: 'grid', label: t('companyManageCars.compactGrid') },
                { value: 'list', label: t('companyManageCars.detailedList') },
              ]}
            />
          }
          rightSlot={
            <CompanyPanelSearch
              value={search}
              onChange={setSearch}
              placeholder={t('companyManageCars.searchPlaceholder')}
            />
          }
        />

        {filteredCars.length === 0 ? (
          <CompanyPanelEmptyState
            title={t('companyManageCars.noCars')}
            description={t('companyManageCars.noCarsDescription')}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid gap-6 px-6 pb-6 sm:px-8 xl:grid-cols-3">
            {paginatedCars.map((car) => (
              <article
                key={car.id}
                className="group overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-56 w-full overflow-hidden bg-gray-100">
                  {car.images.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={car.images[0]}
                      alt={buildCarTitle(car)}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">
                      {t('companyManageCars.noImage')}
                    </div>
                  )}

                  <div className="absolute left-4 top-4">
                    <CompanyPanelBadge tone="indigo">
                      {car.year}
                    </CompanyPanelBadge>
                  </div>

                  <div className="absolute right-4 top-4 rounded-full bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm">
                    {formatPrice(car.pricePerDay)}
                    <span className="ml-1 text-white/70">
                      {t('companyManageCars.perDay')}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {buildCarTitle(car)}
                    </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {buildCarSubtitle(car, t) || t('companyManageCars.listingOverview')}
                      </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-gray-50 p-3 text-center">
                      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                        <CarIcon className="h-4 w-4" />
                      </div>
                      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                        {t('companyManageCars.type')}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-800">
                        {localizeCarType(t, car.carType)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-gray-50 p-3 text-center">
                      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
                        <Transmission className="h-4 w-4" />
                      </div>
                      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                        {t('companyManageCars.gearbox')}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-800">
                        {localizeTransmission(t, car.transmissionType)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-gray-50 p-3 text-center">
                      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                        <GasPump className="h-4 w-4" />
                      </div>
                      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                        {t('companyManageCars.fuel')}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-800">
                        {localizeFuelType(t, car.fuelType)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/car/${car.id}`)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      {/* <Eye className="h-4 w-4" /> */}
                      {t('companyManageCars.view')}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditCarId(car.id)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-amber-600"
                    >
                      <PenCircle className="h-4 w-4" />
                      {t('companyManageCars.edit')}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteCarId(car.id)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-700"
                    >
                      <CircleTrash className="h-4 w-4" />
                      {t('companyManageCars.delete')}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="space-y-4 px-6 pb-6 sm:px-8">
            {paginatedCars.map((car) => (
              <article
                key={car.id}
                className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
                  <div className="relative h-64 bg-gray-100 lg:h-full">
                    {car.images.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={car.images[0]}
                        alt={buildCarTitle(car)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-gray-400">
                        {t('companyManageCars.noImage')}
                      </div>
                    )}

                    <div className="absolute left-4 top-4">
                      <CompanyPanelBadge tone="indigo">
                        {car.year}
                      </CompanyPanelBadge>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-2xl font-semibold text-gray-900">
                            {buildCarTitle(car)}
                          </h3>
                          <CompanyPanelBadge tone="blue">
                            {localizeCarType(t, car.carType)}
                          </CompanyPanelBadge>
                        </div>

                        <p className="mt-2 text-sm text-gray-500">
                          {buildCarSubtitle(car, t) ||
                            t('companyManageCars.listingOverview')}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-gray-900 px-4 py-3 text-white shadow-sm">
                        <p className="text-xs uppercase tracking-[0.14em] text-white/70">
                          {t('companyManageCars.dailyPrice')}
                        </p>
                        <p className="mt-1 text-xl font-semibold">
                          {formatPrice(car.pricePerDay)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-center gap-2 text-gray-500">
                          {/* <Calendar className="h-4 w-4" /> */}
                          <span className="text-xs font-semibold uppercase tracking-wide">
                            {t('companyManageCars.year')}
                          </span>
                        </div>
                        <p className="mt-2 text-base font-semibold text-gray-900">
                          {car.year}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Transmission className="h-4 w-4" />
                          <span className="text-xs font-semibold uppercase tracking-wide">
                            {t('companyManageCars.transmission')}
                          </span>
                        </div>
                        <p className="mt-2 text-base font-semibold text-gray-900">
                          {localizeTransmission(t, car.transmissionType)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-center gap-2 text-gray-500">
                          <GasPump className="h-4 w-4" />
                          <span className="text-xs font-semibold uppercase tracking-wide">
                            {t('companyManageCars.fuel')}
                          </span>
                        </div>
                        <p className="mt-2 text-base font-semibold text-gray-900">
                          {localizeFuelType(t, car.fuelType)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-center gap-2 text-gray-500">
                          <BadgeDollar className="h-4 w-4" />
                          <span className="text-xs font-semibold uppercase tracking-wide">
                            {t('companyManageCars.pricePerDay')}
                          </span>
                        </div>
                        <p className="mt-2 text-base font-semibold text-gray-900">
                          {formatPrice(car.pricePerDay)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => router.push(`/car/${car.id}`)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        {/* <Eye className="h-4 w-4" /> */}
                        {t('companyManageCars.viewDetails')}
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditCarId(car.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-amber-600"
                      >
                        <PenCircle className="h-4 w-4" />
                        {t('companyManageCars.editListing')}
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteCarId(car.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-700"
                      >
                        <CircleTrash className="h-4 w-4" />
                        {t('companyManageCars.delete')}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <CompanyPanelPagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={filteredCars.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </CompanyPanelCard>

      {editCarId && selectedCar && (
        <EditCarModal
          car={selectedCar}
          onClose={() => setEditCarId(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {deleteCarId && (
        <DeleteCarModal
          isOpen={!!deleteCarId}
          onRequestClose={() => setDeleteCarId(null)}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteCarId(null)}
        />
      )}
    </div>
  );
}
