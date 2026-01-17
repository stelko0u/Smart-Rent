import React from 'react';
import { carService } from '../../lib/api';
import { Car } from '../../types/types';
import Link from 'next/link';

export default async function CarDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // <- тук unwrapp-ваш Promise
  const carId = parseInt(id, 10);

  if (isNaN(carId) || carId <= 0) {
    return <div className="p-6">Invalid car id</div>;
  }

  // Get car data using API service
  const carData = await carService.getById(carId);

  if (!carData) {
    return <div className="p-6">Car not found</div>;
  }

  const car = carData;

  const lat = car.office?.latitude;
  const lng = car.office?.longitude;
  const hasLocation = typeof lat === 'number' && typeof lng === 'number';

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white text-gray-900">
      <header className="w-full bg-white/60 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold">
            SmartRent
          </Link>
          <div className="text-sm text-gray-600">Car #{car.id}</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="rounded-3xl overflow-hidden shadow-lg bg-white">
          {/* Hero */}
          <div className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-3">
              <div className="lg:col-span-2 relative">
                {car.images && car.images.length ? (
                  <img
                    src={car.images[0]}
                    alt={`${car.make} ${car.model}`}
                    className="w-full h-140 object-cover"
                  />
                ) : (
                  <div className="w-full h-140 flex items-center justify-center text-gray-400 bg-gray-100">
                    No image
                  </div>
                )}

                {car.images && car.images.length > 1 && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex gap-3 overflow-x-auto py-2 px-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
                      {car.images.map((src: string, i: number) => (
                        <div
                          key={i}
                          className="w-32 h-20 shrink-0 rounded-lg overflow-hidden border cursor-pointer"
                        >
                          <img
                            src={src}
                            alt={`${car.make} ${car.model} ${i + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transform transition"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <aside className="p-6 border-l bg-white/80">
                <div className="sticky top-6">
                  <div className="mb-4">
                    <div className="text-3xl font-bold">
                      {car.make} {car.model}
                    </div>
                    <div className="text-sm text-gray-500">{car.year}</div>
                  </div>

                  <div className="mb-4">
                    <div className="text-2xl text-indigo-600 font-semibold">
                      {car.pricePerDay} EUR
                    </div>
                    <div className="text-sm text-gray-500">per day</div>
                  </div>

                  <div className="mb-5">
                    <div className="flex gap-2">
                      <Link
                        href={`/reservation/${car.id}`}
                        className="flex-1 px-4 py-3 text-center rounded-lg bg-indigo-600 text-white shadow hover:shadow-lg transform hover:-translate-y-0.5 transition"
                      >
                        Rent now
                      </Link>
                      <Link
                        href="#contact"
                        className="px-4 py-3 rounded-lg border text-gray-700 hover:bg-gray-50 transition"
                      >
                        Contact
                      </Link>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-gray-600">
                      <div>
                        <strong>Company:</strong>{' '}
                        {car.company?.name ?? 'Independent'}
                      </div>
                      <div className="mt-1">
                        <strong>Office:</strong>{' '}
                        {car.office?.name ?? 'No office'}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 text-sm text-gray-600">
                    <div>
                      <strong>Created:</strong>{' '}
                      {new Date(car.createdAt).toLocaleDateString()}
                    </div>
                    {car.updatedAt && (
                      <div>
                        <strong>Updated:</strong>{' '}
                        {new Date(car.updatedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 text-md text-gray-500">
                    <div className="mb-2">
                      <strong>Details</strong>
                    </div>
                    <ul className="space-y-1">
                      <li>
                        <span className="font-medium">Brand:</span> {car.make}
                      </li>
                      <li>
                        <span className="font-medium">Model:</span> {car.model}
                      </li>
                      <li>
                        <span className="font-medium">Year:</span> {car.year}
                      </li>
                      <li>
                        <span className="font-medium">Car type:</span>{' '}
                        {car.carType}
                      </li>
                      <li>
                        <span className="font-medium">Fuel Type:</span>{' '}
                        {car.fuelType}
                      </li>
                      <li>
                        <span className="font-medium">Transmission:</span>{' '}
                        {car.transmissionType}
                      </li>
                      <li>
                        <span className="font-medium">Price per day:</span>{' '}
                        {car.pricePerDay} EUR
                      </li>
                    </ul>

                    {/* Debugging */}
                    {/* <ul className="space-y-2">
                      <li>
                        <span className="font-medium">ID:</span> {car.id}
                      </li>
                      <li>
                        <span className="font-medium">Company ID:</span>{' '}
                        {car.companyId ?? '—'}
                      </li>
                      <li>
                        <span className="font-medium">Office ID:</span>{' '}
                        {(car as any).officeId ?? '—'}
                      </li>
                    </ul> */}
                  </div>
                </div>
              </aside>
            </div>
          </div>

          <div className="p-8 border-t bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Gallery</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {car.images && car.images.length > 0 ? (
                      car.images.map((src: string, i: number) => (
                        <div
                          key={i}
                          className="rounded overflow-hidden border h-36"
                        >
                          <img
                            src={src}
                            alt={`${car.make} ${car.model} ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500">No photos available</div>
                    )}
                  </div>
                </div>

                <div id="contact" className="mt-6">
                  <h3 className="font-medium mb-2">Contact & pickup</h3>
                  <p className="text-gray-600 mb-2">
                    To rent this car, contact the company or use the Rent button
                    above. Pickup details depend on the selected office.
                  </p>

                  {hasLocation && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Office location</h4>
                      <div className="w-full h-56 rounded overflow-hidden border">
                        <iframe
                          title="Car location"
                          width="100%"
                          height="100%"
                          loading="lazy"
                          src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <aside className="space-y-4">
                <div className="p-4 rounded-lg bg-gray-50 border">
                  <h4 className="font-medium mb-2">Quick info</h4>
                  <div className="text-sm text-gray-700">
                    <div>
                      <strong>Make:</strong> {car.make}
                    </div>
                    <div>
                      <strong>Model:</strong> {car.model}
                    </div>
                    <div>
                      <strong>Year:</strong> {car.year}
                    </div>
                    <div>
                      <strong>Price/day:</strong> {car.pricePerDay} лв
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 border">
                  <h4 className="font-medium mb-2">Office</h4>
                  <div className="text-sm text-gray-700">
                    {car.office ? (
                      <>
                        <div className="font-medium">{car.office.name}</div>
                        <div className="text-gray-600 text-sm">
                          {car.office.address}
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-600">No office assigned</div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 border">
                  <h4 className="font-medium mb-2">Share</h4>
                  <div className="flex gap-2">
                    <button className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm">
                      Copy link
                    </button>
                    <button className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm">
                      Share
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
