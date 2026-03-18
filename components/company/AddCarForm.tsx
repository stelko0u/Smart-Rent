import React, { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import CarImageCropper from './CarImageCropper';
import { Images } from '../icons';

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
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 py-10 px-4 text-slate-700">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur">
          <div className="border-b border-slate-100 px-8 py-6">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-800">
              Add car
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Fill in the car details, choose an office, and upload up to{' '}
              {MAX_FILES} images.
            </p>
          </div>

          <div className="px-8 py-6">
            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-6">
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Basic information
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">
                      Make
                    </label>
                    <input
                      placeholder="e.g. Audi"
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">
                      Model
                    </label>
                    <input
                      placeholder="e.g. S2"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Pricing & specs
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">
                      Year
                    </label>
                    <input
                      placeholder="e.g. 1994"
                      type="number"
                      value={year === '' ? '' : String(year)}
                      onChange={(e) =>
                        setYear(
                          e.target.value === '' ? '' : Number(e.target.value),
                        )
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">
                      Price per day (€)
                    </label>
                    <input
                      placeholder="e.g. 79.99"
                      type="number"
                      step="0.01"
                      value={pricePerDay === '' ? '' : String(pricePerDay)}
                      onChange={(e) =>
                        setPricePerDay(
                          e.target.value === '' ? '' : Number(e.target.value),
                        )
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">
                      Power (HP)
                    </label>
                    <input
                      placeholder="e.g. 220"
                      type="number"
                      value={power === '' ? '' : String(power)}
                      onChange={(e) =>
                        setPower(
                          e.target.value === '' ? '' : Number(e.target.value),
                        )
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">
                      Displacement (cc)
                    </label>
                    <input
                      placeholder="e.g. 1998"
                      type="number"
                      value={displacement === '' ? '' : String(displacement)}
                      onChange={(e) =>
                        setDisplacement(
                          e.target.value === '' ? '' : Number(e.target.value),
                        )
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Configuration
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">
                      Car type
                    </label>
                    <select
                      value={carType}
                      onChange={(e) =>
                        setCarType(e.target.value === '' ? '' : e.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
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
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">
                      Transmission
                    </label>
                    <select
                      value={transmission}
                      onChange={(e) =>
                        setTransmission(
                          e.target.value === '' ? '' : e.target.value,
                        )
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                      required
                    >
                      <option value="">Select transmission</option>
                      <option value="MANUAL">Manual</option>
                      <option value="AUTOMATIC">Automatic</option>
                      <option value="SEMI_AUTOMATIC">Semi-Automatic</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">
                      Fuel type
                    </label>
                    <select
                      value={fuelType}
                      onChange={(e) =>
                        setFuelType(e.target.value === '' ? '' : e.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                      required
                    >
                      <option value="">Select fuel type</option>
                      <option value="PETROL">Petrol</option>
                      <option value="DIESEL">Diesel</option>
                      <option value="ELECTRICITY">Electricity</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">
                      Office
                    </label>
                    <select
                      value={officeId}
                      onChange={(e) =>
                        setOfficeId(
                          e.target.value === '' ? '' : Number(e.target.value),
                        )
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    >
                      <option value="">No specific office</option>
                      {offices.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name ?? o.address ?? `Office #${o.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Images
                </h3>

                <div
                  {...getRootProps()}
                  className={`group rounded-3xl border-2 border-dashed px-6 py-10 text-center transition ${
                    isDragActive
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50'
                  } cursor-pointer`}
                >
                  <input {...getInputProps()} />
                  <div className="mx-auto max-w-md">
                    <div className="mb-3 text-4xl">
                      {/* 📷 */}

                    <Images className="mx-auto h-12 w-12 text-slate-400" />
                    </div>
                    {isDragActive ? (
                      <p className="text-base font-medium text-indigo-700">
                        Drop images here...
                      </p>
                    ) : (
                      <>
                        <p className="text-base font-medium text-slate-700">
                          Drag & drop .png/.jpeg images here
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          or click to browse files (max {MAX_FILES})
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {files.map((f, i) => (
                      <div
                        key={i}
                        className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                      >
                        <img
                          src={(f as any).__preview}
                          alt={f.name}
                          className="h-32 w-full object-cover transition duration-300 group-hover:scale-105"
                        />

                        <div className="p-3">
                          <p className="truncate text-xs font-medium text-slate-600">
                            {f.name}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm text-slate-700 shadow hover:bg-red-50 hover:text-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Make sure all details are correct before submitting.
                </p>

                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3 font-medium text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? 'Uploading…' : 'Add Car'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showCropper && currentImageToCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl overflow-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-800">
                  Crop Image
                </h3>
                <p className="text-sm text-slate-500">
                  Adjust the image before saving it.
                </p>
              </div>

              <button
                onClick={handleCropCancel}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>

            <div className="p-6">
              <CarImageCropper
                image={currentImageToCrop}
                onSave={handleCropSave}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
