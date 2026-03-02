import React, { useState } from 'react';
import Modal from 'react-modal';
import { Car } from '@/app/types/database';

interface EditCarModalProps {
  car: Car;
  onClose: () => void;
  onSuccess: () => void;
}

if (typeof window !== 'undefined') {
  Modal.setAppElement('body');
}

export default function EditCarModal({
  car,
  onClose,
  onSuccess,
}: EditCarModalProps) {
  const [formData, setFormData] = useState<Partial<Car>>({
    make: car.make,
    model: car.model,
    year: car.year,
    pricePerDay: car.pricePerDay,
    carType: car.carType,
    transmissionType: car.transmissionType,
    fuelType: car.fuelType,
    power: car.power,
    displacement: car.displacement,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'year' ||
        name === 'pricePerDay' ||
        name === 'power' ||
        name === 'displacement'
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/company/cars?id=${car.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        return;
      }

      onSuccess();
    } catch (error) {
      console.error('Error updating car:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onRequestClose={onClose}
      contentLabel="Edit Car"
      className="bg-white rounded-lg py-4 max-w-lg w-full relative z-50 flex items-center justify-center"
      overlayClassName="fixed inset-0 bg-black/50 z-40 flex items-center justify-center"
    >
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Edit Car</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Make
              </label>
              <input
                type="text"
                name="make"
                value={formData.make || ''}
                onChange={handleChange}
                required
                className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={handleChange}
                required
                className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="number"
                name="year"
                value={formData.year || ''}
                onChange={handleChange}
                required
                min="1900"
                max={new Date().getFullYear() + 1}
                className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price per Day (€)
              </label>
              <input
                type="number"
                name="pricePerDay"
                value={formData.pricePerDay || ''}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Car Type
              </label>
              <select
                name="carType"
                value={formData.carType || ''}
                onChange={handleChange}
                required
                className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select</option>
                <option value="SEDAN">Sedan</option>
                <option value="HATCHBACK">Hatchback</option>
                <option value="SUV">SUV</option>
                <option value="COUPE">Coupe</option>
                <option value="CONVERTIBLE">Convertible</option>
                <option value="CABRIO">Cabrio</option>
                <option value="WAGON">Wagon</option>
                <option value="VAN">Van</option>
                <option value="PICKUP">Pickup</option>
                <option value="COMBI">Combi</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transmission Type
              </label>
              <select
                name="transmissionType"
                value={formData.transmissionType || ''}
                onChange={handleChange}
                required
                className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select</option>
                <option value="MANUAL">Manual</option>
                <option value="AUTOMATIC">Automatic</option>
                <option value="SEMI_AUTOMATIC">Semi-Automatic</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fuel Type
              </label>
              <select
                name="fuelType"
                value={formData.fuelType || ''}
                onChange={handleChange}
                required
                className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select</option>
                <option value="PETROL">Petrol</option>
                <option value="DIESEL">Diesel</option>
                <option value="ELECTRICITY">Electricity</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Power (HP)
              </label>
              <input
                type="number"
                name="power"
                value={formData.power || ''}
                onChange={handleChange}
                required
                min="0"
                className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Displacement (cc)
              </label>
              <input
                type="number"
                name="displacement"
                value={formData.displacement || ''}
                onChange={handleChange}
                required
                min="0"
                className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
