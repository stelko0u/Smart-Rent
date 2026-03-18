import React, { useState } from 'react';
import { Car } from '@/types/database';
import EditCarModal from '../modals/EditCarModal';
import DeleteCarModal from '../modals/DeleteCarModal';
import { toast } from 'react-hot-toast';
import { CircleInfo, CircleTrash, PenCircle } from '../icons';

export default function ManageCars({
  cars,
  onRefresh,
}: {
  cars: Car[];
  onRefresh?: () => void;
}) {
  const [editCarId, setEditCarId] = useState<number | null>(null);
  const [deleteCarId, setDeleteCarId] = useState<number | null>(null);

  const handleEdit = (id: number) => {
    setEditCarId(id);
  };

  const handleDelete = (id: number) => {
    setDeleteCarId(id);
  };

  const handleDetails = (id: number) => {
    window.location.href = `/car/${id}`;
  };

  const confirmDelete = async () => {
    if (!deleteCarId) return;

    try {
      const res = await fetch(`/api/company/cars?id=${deleteCarId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete car');
        setDeleteCarId(null);
        return;
      }

      toast.success('Car deleted successfully');
      setDeleteCarId(null);
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting car:', error);
      toast.error('Failed to delete car');
      setDeleteCarId(null);
    }
  };

  const handleEditSuccess = () => {
    toast.success('Car updated successfully');
    setEditCarId(null);
    onRefresh?.();
  };

  const selectedCar = cars.find((c) => c.id === editCarId);

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Manage cars</h2>
          <p className="mt-1 text-sm text-gray-500">
            Keep your vehicle listings updated and organized.
          </p>
        </div>

        {cars.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm">
            <span className="text-sm font-medium text-gray-600">
              Total: <span className="text-gray-900">{cars.length}</span>
            </span>
          </div>
        )}
      </div>

      {cars.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
            <CircleInfo className="h-7 w-7 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            No cars available
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Your added vehicles will appear here once you create a listing.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {cars.map((c) => (
            <li
              key={c.id}
              className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative">
                <div className="h-56 w-full overflow-hidden bg-gray-100">
                  {c.images && c.images.length ? (
                    <img
                      src={c.images[0]}
                      alt={`${c.make} ${c.model}`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                      No image
                    </div>
                  )}
                </div>

                <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur">
                  {c.year}
                </div>

                <div className="absolute right-4 top-4 rounded-full bg-gray-900 px-3 py-1 text-sm font-semibold text-white shadow-sm">
                  {c.pricePerDay}€ / day
                </div>
              </div>

              <div className="p-5">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {c.make} {c.model}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Professional listing overview
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-gray-50 p-3 text-center">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Type
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {c.carType}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-3 text-center">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Gearbox
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {c.transmissionType}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-3 text-center">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Fuel
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {c.fuelType}
                    </p>
                  </div>
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleDetails(c.id)}
                      className="flex-1 min-w-[110px] rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
                      aria-label={`Details ${c.make} ${c.model}`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <CircleInfo className="h-5 w-5" />
                        Details
                      </span>
                    </button>

                    <button
                      onClick={() => handleEdit(c.id)}
                      className="flex-1 min-w-[110px] rounded-2xl bg-amber-100 px-4 py-3 text-sm font-medium text-amber-800 transition hover:bg-amber-200"
                      aria-label={`Edit ${c.make} ${c.model}`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <PenCircle className="h-5 w-5" />
                        Edit
                      </span>
                    </button>

                    <button
                      onClick={() => handleDelete(c.id)}
                      className="flex-1 min-w-[110px] rounded-2xl bg-red-100 px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-200"
                      aria-label={`Delete ${c.make} ${c.model}`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <CircleTrash className="h-5 w-5" />
                        Delete
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editCarId && selectedCar && (
        <EditCarModal
          car={selectedCar}
          onClose={() => setEditCarId(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {deleteCarId && (
        <DeleteCarModal
          onConfirm={confirmDelete}
          onCancel={() => setDeleteCarId(null)}
        />
      )}
    </section>
  );
}
