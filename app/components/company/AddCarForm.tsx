import React, { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import CarImageCropper from './CarImageCropper';

export default function AddCarForm({
  onCreated,
}: {
  onCreated?: (car: any) => void;
}) {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [pricePerDay, setPricePerDay] = useState<number | ''>('');
  const [power, setPower] = useState<number | ''>('');
  const [displacement, setDisplacement] = useState<number | ''>('');
  const [carType, setCarType] = useState<string | ''>('');
  const [transmission, setTransmission] = useState<string | ''>('');
  const [fuelType, setFuelType] = useState<string | ''>('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offices, setOffices] = useState<any[]>([]);
  const [officeId, setOfficeId] = useState<number | ''>('');
  const [currentImageToCrop, setCurrentImageToCrop] = useState<string | null>(
    null,
  );
  const [currentImageFile, setCurrentImageFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const MAX_FILES = 12;
  const ALLOWED = ['image/png', 'image/jpeg'];

  useEffect(() => {
    return () => {
      files.forEach((f) => {
        try {
          URL.revokeObjectURL((f as any).__preview);
        } catch {}
      });
      if (currentImageToCrop) {
        try {
          URL.revokeObjectURL(currentImageToCrop);
        } catch {}
      }
    };
  }, [files, currentImageToCrop]);

  const onDrop = (accepted: File[], rejected: any[]) => {
    setError(null);
    if (rejected && rejected.length) {
      setError('Some files were rejected (allowed: .png, .jpeg).');
    }
    const total = files.length + accepted.length;
    if (total > MAX_FILES) {
      setError(`Max ${MAX_FILES} images allowed.`);
      return;
    }
    const valid = accepted.filter((f) => ALLOWED.includes(f.type));

    // Open cropper for the first valid image
    if (valid.length > 0) {
      const imageUrl = URL.createObjectURL(valid[0]);
      setCurrentImageFile(valid[0]);
      setCurrentImageToCrop(imageUrl);
      setShowCropper(true);
    }
  };

  const handleCropSave = async (croppedImageDataUrl: string) => {
    // Convert base64 data URL to Blob
    const response = await fetch(croppedImageDataUrl);
    const blob = await response.blob();

    // Convert blob to File
    const croppedFile = new File(
      [blob],
      currentImageFile?.name || 'cropped-image.jpg',
      { type: 'image/jpeg' },
    );

    // Create preview URL
    (croppedFile as any).__preview = URL.createObjectURL(croppedFile);

    // Add to files array
    setFiles((s) => [...s, croppedFile]);

    // Cleanup and close cropper
    if (currentImageToCrop) {
      try {
        URL.revokeObjectURL(currentImageToCrop);
      } catch {}
    }
    setCurrentImageToCrop(null);
    setCurrentImageFile(null);
    setShowCropper(false);
  };

  const handleCropCancel = () => {
    // Cleanup URL
    if (currentImageToCrop) {
      try {
        URL.revokeObjectURL(currentImageToCrop);
      } catch {}
    }
    setCurrentImageToCrop(null);
    setCurrentImageFile(null);
    setShowCropper(false);
  };

  useEffect(() => {
    fetch('/api/company/offices', { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setOffices(Array.isArray(j) ? j : []))
      .catch(() => {});
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] },
    maxFiles: MAX_FILES,
  });

  function removeFile(idx: number) {
    const f = files[idx];
    try {
      URL.revokeObjectURL((f as any).__preview);
    } catch {}
    setFiles((s) => s.filter((_, i) => i !== idx));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      if (!make.trim() || !model.trim() || !year || !pricePerDay) {
        throw new Error('Please fill in make, model, year and price per day.');
      }
      if (!power || !displacement) {
        throw new Error('Please fill in power (HP) and displacement (cc).');
      }
      if (!carType || !transmission || !fuelType) {
        throw new Error('Please fill in car type, transmission and fuel type.');
      }

      const currentYear = new Date().getFullYear();
      if (typeof year === 'number' && (year < 1980 || year > currentYear)) {
        throw new Error(`The year must be between 1980 and ${currentYear}.`);
      }
      if (typeof pricePerDay === 'number' && pricePerDay <= 0) {
        throw new Error('The price must be a positive number.');
      }
      if (typeof power === 'number' && power <= 0) {
        throw new Error('The power must be a positive number.');
      }
      if (typeof displacement === 'number' && displacement <= 0) {
        throw new Error('The displacement must be a positive number.');
      }

      const form = new FormData();
      form.append('make', make.trim());
      form.append('model', model.trim());
      form.append('year', String(year));
      form.append('pricePerDay', String(pricePerDay));
      form.append('power', String(power));
      form.append('displacement', String(displacement));
      form.append('carType', carType);
      form.append('transmission', transmission);
      form.append('fuelType', fuelType);
      if (officeId !== '') form.append('officeId', String(officeId));

      files.forEach((f) => form.append('images', f, f.name));

      const res = await fetch('/api/company/cars', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });

      const text = await res.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {}

      if (!res.ok) {
        throw new Error(
          (json && json.error) || text || `Upload failed (${res.status})`,
        );
      }

      const created = json?.car ?? json;
      files.forEach((f) => {
        try {
          URL.revokeObjectURL((f as any).__preview);
        } catch {}
      });
      setFiles([]);
      setMake('');
      setModel('');
      setYear('');
      setPricePerDay('');
      setPower('');
      setDisplacement('');
      setCarType('');
      setTransmission('');
      setFuelType('');
      setOfficeId('');
      onCreated?.(created);
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="text-gray-600">
      <h2 className="text-xl font-medium mb-4 text-gray-600">Add car</h2>
      {error && <div className="mb-3 text-red-600">{error}</div>}

      <form onSubmit={submit} className="max-w-xl flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Make (e.g. Audi)"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            className="px-3 py-2 border rounded"
            required
          />
          <input
            placeholder="Model (e.g. S2)"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="px-3 py-2 border rounded"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Year (e.g. 1994)"
            type="number"
            value={year === '' ? '' : String(year)}
            onChange={(e) =>
              setYear(e.target.value === '' ? '' : Number(e.target.value))
            }
            className="px-3 py-2 border rounded"
            required
          />
          <input
            placeholder="Price per day (€)"
            type="number"
            step="0.01"
            value={pricePerDay === '' ? '' : String(pricePerDay)}
            onChange={(e) =>
              setPricePerDay(
                e.target.value === '' ? '' : Number(e.target.value),
              )
            }
            className="px-3 py-2 border rounded"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Power (HP)"
            type="number"
            value={power === '' ? '' : String(power)}
            onChange={(e) =>
              setPower(e.target.value === '' ? '' : Number(e.target.value))
            }
            className="px-3 py-2 border rounded"
            required
          />
          <input
            placeholder="Displacement (cc)"
            type="number"
            value={displacement === '' ? '' : String(displacement)}
            onChange={(e) =>
              setDisplacement(
                e.target.value === '' ? '' : Number(e.target.value),
              )
            }
            className="px-3 py-2 border rounded"
            required
          />
        </div>

        <select
          value={carType}
          onChange={(e) =>
            setCarType(e.target.value === '' ? '' : e.target.value)
          }
          className="px-3 py-2 border rounded"
          required
        >
          <option value="">Select car type</option>
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

        <select
          value={transmission}
          onChange={(e) =>
            setTransmission(e.target.value === '' ? '' : e.target.value)
          }
          className="px-3 py-2 border rounded"
          required
        >
          <option value="">Select transmission</option>
          <option value="MANUAL">Manual</option>
          <option value="AUTOMATIC">Automatic</option>
          <option value="SEMI_AUTOMATIC">Semi-Automatic</option>
          <option value="OTHER">Other</option>
        </select>

        <select
          value={fuelType}
          onChange={(e) =>
            setFuelType(e.target.value === '' ? '' : e.target.value)
          }
          className="px-3 py-2 border rounded"
          required
        >
          <option value="">Select fuel type</option>
          <option value="PETROL">Petrol</option>
          <option value="DIESEL">Diesel</option>
          <option value="ELECTRICITY">Electricity</option>
        </select>

        <select
          value={officeId}
          onChange={(e) =>
            setOfficeId(e.target.value === '' ? '' : Number(e.target.value))
          }
          className="px-3 py-2 border rounded"
        >
          <option value="">No specific office</option>
          {offices.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name ?? o.address ?? `Office #${o.id}`}
            </option>
          ))}
        </select>

        <div
          {...getRootProps()}
          className="p-4 border-dashed border-2 rounded text-center cursor-pointer"
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop images here...</p>
          ) : (
            <p>
              Drag & drop .png/.jpeg images here, or click to select (max{' '}
              {MAX_FILES})
            </p>
          )}
        </div>

        {files.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-2">
            {files.map((f, i) => (
              <div
                key={i}
                className="w-24 h-24 relative border rounded overflow-hidden"
              >
                <img
                  src={(f as any).__preview}
                  alt={f.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute top-1 right-1 bg-white bg-opacity-80 rounded px-1 text-sm"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            {busy ? 'Uploading…' : 'Add Car'}
          </button>
        </div>
      </form>

      {showCropper && currentImageToCrop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <h3 className="text-lg font-medium mb-4">Crop Image</h3>
            <CarImageCropper
              image={currentImageToCrop}
              onSave={handleCropSave}
            />
            <button
              onClick={handleCropCancel}
              className="mt-4 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
