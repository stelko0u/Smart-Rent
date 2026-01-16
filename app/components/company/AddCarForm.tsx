import React, { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';

export default function AddCarForm({
  onCreated,
}: {
  onCreated?: (car: any) => void;
}) {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [pricePerDay, setPricePerDay] = useState<number | ''>('');
  const [carType, setCarType] = useState<string | ''>('');
  const [transmission, setTransmission] = useState<string | ''>('');
  const [fuelType, setFuelType] = useState<string | ''>(''); // New state for fuel type
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offices, setOffices] = useState<any[]>([]);
  const [officeId, setOfficeId] = useState<number | ''>('');
  const MAX_FILES = 12;
  const ALLOWED = ['image/png', 'image/jpeg'];

  useEffect(() => {
    return () => {
      files.forEach((f) => {
        try {
          URL.revokeObjectURL((f as any).__preview);
        } catch {}
      });
    };
  }, [files]);

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
    valid.forEach((f) => {
      (f as any).__preview = URL.createObjectURL(f);
    });
    setFiles((s) => [...s, ...valid]);
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
        throw new Error('Попълни марка, модел, година и цена на ден.');
      }
      const currentYear = new Date().getFullYear();
      if (typeof year === 'number' && (year < 1980 || year > currentYear)) {
        throw new Error(`Годината трябва да е между 1980 и ${currentYear}.`);
      }
      if (typeof pricePerDay === 'number' && pricePerDay <= 0) {
        throw new Error('Цената трябва да е положително число.');
      }

      const form = new FormData();
      form.append('make', make.trim());
      form.append('model', model.trim());
      form.append('year', String(year));
      if (officeId !== '') form.append('officeId', String(officeId));
      form.append('pricePerDay', String(pricePerDay));
      if (carType !== '') form.append('carType', carType);
      if (transmission !== '') form.append('transmission', transmission);
      if (fuelType !== '') form.append('fuelType', fuelType); // Append fuel type

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
      setCarType('');
      setTransmission('');
      setFuelType(''); // Reset fuel type
      setOfficeId('');
      onCreated?.(created);
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2 className="text-xl font-medium mb-4">Add car</h2>
      {error && <div className="mb-3 text-red-600">{error}</div>}

      <form onSubmit={submit} className="max-w-xl flex flex-col gap-3">
        <input
          placeholder="Make (e.g. Toyota)"
          value={make}
          onChange={(e) => setMake(e.target.value)}
          className="px-3 py-2 border rounded"
          required
        />
        <input
          placeholder="Model (e.g. Corolla)"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="px-3 py-2 border rounded"
          required
        />
        <input
          placeholder="Year (e.g. 2022)"
          type="number"
          value={year === '' ? '' : String(year)}
          onChange={(e) =>
            setYear(e.target.value === '' ? '' : Number(e.target.value))
          }
          className="px-3 py-2 border rounded"
          required
        />
        <input
          placeholder="Price per day"
          type="number"
          value={pricePerDay === '' ? '' : String(pricePerDay)}
          onChange={(e) =>
            setPricePerDay(e.target.value === '' ? '' : Number(e.target.value))
          }
          className="px-3 py-2 border rounded"
          required
        />

        <select
          value={carType}
          onChange={(e) =>
            setCarType(e.target.value === '' ? '' : e.target.value)
          }
          className="px-3 py-2 border rounded"
        >
          <option value="">Select car type</option>
          <option value="sedan">Sedan</option>
          <option value="suv">SUV</option>
          <option value="hatchback">Hatchback</option>
          <option value="van">Van</option>
          <option value="coupe">Coupe</option>
          <option value="convertible">Convertible</option>
          <option value="other">Other</option>
        </select>

        <select
          value={transmission}
          onChange={(e) =>
            setTransmission(e.target.value === '' ? '' : e.target.value)
          }
          className="px-3 py-2 border rounded"
        >
          <option value="">Select transmission</option>
          <option value="manual">Manual</option>
          <option value="automatic">Automatic</option>
          <option value="semi-automatic">Semi-automatic</option>
        </select>

        <select
          value={fuelType}
          onChange={(e) =>
            setFuelType(e.target.value === '' ? '' : e.target.value)
          }
          className="px-3 py-2 border rounded"
        >
          <option value="">Select fuel type</option>
          <option value="petrol">Petrol</option>
          <option value="diesel">Diesel</option>
          <option value="electricity">Electricity</option>
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
            className="px-4 py-2 bg-indigo-600 text-white rounded"
          >
            {busy ? 'Uploading…' : 'Add'}
          </button>
        </div>
      </form>
    </section>
  );
}
