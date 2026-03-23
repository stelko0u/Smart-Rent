import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type {
  Car,
  CarFormValues,
  CarType,
  TransmissionType,
  FuelType,
} from '../../../../types/types';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { CarRepository } from '@/lib/repository/CarRepository';

export const runtime = 'nodejs';

const ALLOWED = ['image/png', 'image/jpeg'];
const MAX_FILES = 12;

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function fetchMe(req: NextRequest) {
  const origin =
    req.nextUrl?.origin ??
    `${req.headers.get('x-forwarded-proto') || 'http'}://${req.headers.get(
      'host',
    )}`;
  const meRes = await fetch(`${origin}/api/auth/me`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Cookie: req.headers.get('cookie') ?? '',
    },
    cache: 'no-store',
    redirect: 'follow',
  });
  return meRes;
}

function mapCarType(input?: string | null): CarType | null {
  if (!input) return null;
  const v = input.toString().trim().toLowerCase();
  const map: Record<string, CarType> = {
    sedan: 'SEDAN',
    hatchback: 'HATCHBACK',
    suv: 'SUV',
    coupe: 'COUPE',
    convertible: 'CONVERTIBLE',
    wagon: 'WAGON',
    van: 'VAN',
    pickup: 'PICKUP',
    other: 'OTHER',
  };
  return map[v] ?? null;
}

function mapTransmissionType(input?: string | null): TransmissionType | null {
  if (!input) return null;
  const v = input.toString().trim().toLowerCase();
  const map: Record<string, TransmissionType> = {
    manual: 'MANUAL',
    automatic: 'AUTOMATIC',
    other: 'OTHER',
  };
  return map[v] ?? null;
}

function mapFuelType(input?: string | null): FuelType | null {
  if (!input) return null;
  const v = input.toString().trim().toLowerCase();
  const map: Record<string, FuelType> = {
    petrol: 'PETROL',
    diesel: 'DIESEL',
    electricity: 'ELECTRICITY',
  };
  return map[v] ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!user || user.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!user.companyId) {
      return NextResponse.json(
        { error: 'Missing company ID' },
        { status: 400 },
      );
    }

    const cars = await CarRepository.findManyByCompanyId(user.companyId);

    return NextResponse.json({ cars }, { status: 200 });
  } catch (err) {
    console.error('company/cars GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!user || user.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const companyId = user.companyId ?? null;
    const ownerId = user.id ?? null;

    if (!companyId || !ownerId) {
      return NextResponse.json(
        { error: 'Missing company or owner id' },
        { status: 400 },
      );
    }

    const contentType = (req.headers.get('content-type') || '').toLowerCase();

    let make: string | null = null;
    let model: string | null = null;
    let year: number | null = null;
    let pricePerDay: number | null = null;
    const images: string[] = [];
    let carType: CarType | null = null;
    let transmissionType: TransmissionType | null = null;
    let fuelType: FuelType | null = null;
    let power: number | null = null;
    let displacement: number | null = null;
    let officeId: number | null = null;

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      make = String(form.get('make') ?? '').trim();
      model = String(form.get('model') ?? '').trim();
      year = Number(form.get('year') ?? new Date().getFullYear());
      pricePerDay = Number(form.get('pricePerDay') ?? 0);
      power = Number(form.get('power') ?? 0);
      displacement = Number(form.get('displacement') ?? 0);

      carType = mapCarType(form.get('carType')?.toString() ?? null);
      transmissionType = mapTransmissionType(
        form.get('transmission')?.toString() ?? null,
      );
      fuelType = mapFuelType(form.get('fuelType')?.toString() ?? null);

      officeId = form.get('officeId') ? Number(form.get('officeId')) : null;

      const fileEntries = form.getAll('images');
      if (fileEntries.length > MAX_FILES) {
        return NextResponse.json({ error: 'Too many files' }, { status: 400 });
      }

      const uploadDir = path.join(
        process.cwd(),
        'public',
        'uploads',
        'company',
        String(companyId),
      );
      ensureDir(uploadDir);

      for (const ent of fileEntries) {
        const file = ent as File;
        if (!file || !file.type || !ALLOWED.includes(file.type)) continue;

        const arrayBuf = await file.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuf);
        const ext = file.type === 'image/png' ? '.png' : '.jpg';
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}${ext}`;

        fs.writeFileSync(path.join(uploadDir, fileName), uint8);
        images.push(`/uploads/company/${companyId}/${fileName}`);
      }
    } else {
      let body: CarFormValues | null = null;

      try {
        body = (await req.json()) as CarFormValues;
      } catch {
        return NextResponse.json(
          { error: 'Invalid JSON body' },
          { status: 400 },
        );
      }

      make = String(body?.make ?? '').trim();
      model = String(body?.model ?? '').trim();
      year = body?.year ? Number(body.year) : new Date().getFullYear();
      pricePerDay = body?.pricePerDay ? Number(body.pricePerDay) : 0;
      power = (body as any)?.power ? Number((body as any).power) : 0;
      displacement = (body as any)?.displacement
        ? Number((body as any).displacement)
        : 0;

      carType = mapCarType((body as any)?.carType ?? null);
      transmissionType =
        mapTransmissionType((body as any)?.transmission ?? null) ||
        mapTransmissionType((body as any)?.transmissionType ?? null);
      fuelType = mapFuelType((body as any)?.fuelType ?? null);

      officeId =
        body?.officeId && body.officeId !== null ? Number(body.officeId) : null;

      if (Array.isArray((body as any).images)) {
        for (const it of (body as any).images) {
          if (typeof it === 'string') images.push(it);
        }
      }
    }

    if (!make || !model) {
      return NextResponse.json(
        { error: 'Missing required fields: make or model' },
        { status: 400 },
      );
    }
    if (!year || Number.isNaN(Number(year))) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
    }
    if (
      !pricePerDay ||
      Number.isNaN(Number(pricePerDay)) ||
      Number(pricePerDay) <= 0
    ) {
      return NextResponse.json(
        { error: 'Invalid pricePerDay' },
        { status: 400 },
      );
    }
    if (!carType) {
      return NextResponse.json(
        { error: 'Missing or invalid carType' },
        { status: 400 },
      );
    }
    if (!transmissionType) {
      return NextResponse.json(
        { error: 'Missing or invalid transmission' },
        { status: 400 },
      );
    }
    if (!fuelType) {
      return NextResponse.json(
        { error: 'Missing or invalid fuelType' },
        { status: 400 },
      );
    }
    if (!power || Number.isNaN(Number(power)) || Number(power) <= 0) {
      return NextResponse.json(
        { error: 'Invalid power (HP)' },
        { status: 400 },
      );
    }
    if (
      !displacement ||
      Number.isNaN(Number(displacement)) ||
      Number(displacement) <= 0
    ) {
      return NextResponse.json(
        { error: 'Invalid displacement (cc)' },
        { status: 400 },
      );
    }

    const created = await CarRepository.create({
      make,
      model,
      year: Number(year),
      pricePerDay: Number(pricePerDay),
      power: Number(power),
      displacement: Number(displacement),
      images,
      ownerId: Number(ownerId),
      companyId: Number(companyId),
      carType,
      transmissionType,
      fuelType,
      officeId: officeId ?? undefined,
    });

    return NextResponse.json(
      {
        car: {
          id: created.id,
          make: created.make,
          model: created.model,
          year: created.year,
          pricePerDay: created.pricePerDay,
          power: created.power,
          displacement: created.displacement,
          images: created.images,
          carType: created.carType,
          transmissionType: created.transmissionType,
          fuelType: created.fuelType,
          officeId: created.officeId,
          companyId: created.companyId,
          createdAt: created.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('company/cars POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Car ID is required' },
        { status: 400 },
      );
    }

    const carId = parseInt(id);

    // Check if car belongs to the company
    const car = await CarRepository.findById(carId);

    if (!car || car.companyId !== user.companyId) {
      return NextResponse.json(
        { error: 'Car not found or unauthorized' },
        { status: 404 },
      );
    }

    // Check if car has any reservations
    const reservations = await query(
      'SELECT COUNT(*) as count FROM "Reservation" WHERE "carId" = $1',
      [carId],
    );

    if (parseInt(reservations[0].count) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete car with existing reservations' },
        { status: 400 },
      );
    }

    await CarRepository.delete(carId);

    return NextResponse.json({ message: 'Car deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/company/cars error:', error);
    return NextResponse.json(
      { error: 'Failed to delete car' },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!user || user.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const companyId = user.companyId ?? null;
    const ownerId = user.id ?? null;

    if (!companyId || !ownerId) {
      return NextResponse.json(
        { error: 'Missing company or owner id' },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(req.url);
    const carId = searchParams.get('id');

    if (!carId) {
      return NextResponse.json({ error: 'Missing car ID' }, { status: 400 });
    }

    const existingCar = await CarRepository.findById(Number(carId));
    if (!existingCar) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }

    if (existingCar.companyId !== companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const updateData: Partial<Omit<Car, 'id' | 'createdAt' | 'updatedAt'>> = {};

    if (body.make !== undefined) updateData.make = String(body.make).trim();
    if (body.model !== undefined) updateData.model = String(body.model).trim();
    if (body.year !== undefined) updateData.year = Number(body.year);
    if (body.pricePerDay !== undefined)
      updateData.pricePerDay = Number(body.pricePerDay);
    if (body.power !== undefined) updateData.power = Number(body.power);
    if (body.displacement !== undefined)
      updateData.displacement = Number(body.displacement);
    if (body.carType !== undefined) updateData.carType = body.carType;
    if (body.transmissionType !== undefined)
      updateData.transmissionType = body.transmissionType;
    if (body.fuelType !== undefined) updateData.fuelType = body.fuelType;

    if (body.officeId !== undefined) {
      updateData.officeId =
        body.officeId === null ? undefined : Number(body.officeId);
    }

    const updated = await CarRepository.update(Number(carId), updateData);

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update car' },
        { status: 500 },
      );
    }

    return NextResponse.json({ car: updated }, { status: 200 });
  } catch (err) {
    console.error('company/cars PATCH error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
