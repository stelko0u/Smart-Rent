import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import prisma from '../../../lib/prisma';
import type {
  CarFormValues,
  CarType,
  TransmissionType,
} from '../../../types/types';
import { FuelType } from '@/app/generated/prisma/enums';

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

// Map to Prisma string enum literals
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

// POST handler
export async function POST(req: NextRequest) {
  try {
    const meRes = await fetchMe(req);
    if (!meRes.ok) {
      const text = await meRes.text().catch(() => '');
      console.error('/api/auth/me failed:', meRes.status, text);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ct = meRes.headers.get('content-type') ?? '';
    if (!ct.includes('application/json')) {
      console.error('/api/auth/me non-json:', await meRes.text());
      return NextResponse.json(
        { error: 'Unexpected auth response' },
        { status: 500 },
      );
    }
    const me = await meRes.json();

    const rawRole = me?.role ?? me?.user?.role ?? null;
    const role =
      typeof rawRole === 'string' ? rawRole.toLowerCase().trim() : null;
    if (role !== 'company')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const companyId = me?.company?.id ?? me?.user?.companyId ?? null;
    const ownerId = me?.user?.id ?? null;
    if (!companyId || !ownerId)
      return NextResponse.json(
        { error: 'Missing company or owner id' },
        { status: 400 },
      );

    const contentType = (req.headers.get('content-type') || '').toLowerCase();

    let make: string | null = null;
    let model: string | null = null;
    let year: number | null = null;
    let pricePerDay: number | null = null;
    const images: string[] = [];
    let carType: CarType | null = null;
    let transmissionType: TransmissionType | null = null;
    let fuelType: FuelType | null = null;
    let officeId: number | null = null;

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      make = String(form.get('make') ?? '').trim();
      model = String(form.get('model') ?? '').trim();
      year = Number(form.get('year') ?? new Date().getFullYear());
      pricePerDay = Number(form.get('pricePerDay') ?? 0);

      carType = mapCarType(form.get('carType')?.toString() ?? null);
      transmissionType = mapTransmissionType(
        form.get('transmission')?.toString() ?? null,
      );
      fuelType = mapFuelType(form.get('fuelType')?.toString() ?? null);

      officeId = form.get('officeId') ? Number(form.get('officeId')) : null;

      const fileEntries = form.getAll('images');
      if (fileEntries.length > MAX_FILES)
        return NextResponse.json({ error: 'Too many files' }, { status: 400 });

      const uploadDir = path.join(
        process.cwd(),
        'public',
        'uploads',
        'company',
        String(companyId),
      );
      ensureDir(uploadDir);

      for (const ent of fileEntries) {
        const file: any = ent;
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
      } catch (err) {
        return NextResponse.json(
          { error: 'Invalid JSON body' },
          { status: 400 },
        );
      }

      make = String(body?.make ?? '').trim();
      model = String(body?.model ?? '').trim();
      year = body?.year ? Number(body.year) : new Date().getFullYear();
      pricePerDay = body?.pricePerDay ? Number(body.pricePerDay) : 0;

      carType = mapCarType((body as any)?.carType ?? null);
      transmissionType =
        mapTransmissionType((body as any).transmission ?? null) ||
        mapTransmissionType((body as any).transmissionType ?? null);
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

    const created = await prisma.car.create({
      data: {
        make,
        model,
        year: Number(year),
        pricePerDay: Number(pricePerDay),
        images,
        ownerId: Number(ownerId),
        companyId: Number(companyId),
        carType: carType as CarType,
        transmissionType: transmissionType as TransmissionType,
        fuelType: fuelType as FuelType,
        officeId: officeId ?? undefined,
      },
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        pricePerDay: true,
        images: true,
        carType: true,
        transmissionType: true,
        fuelType: true,
        officeId: true,
        companyId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ car: created }, { status: 201 });
  } catch (err) {
    console.error('company/cars POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// GET handler
export async function GET(req: NextRequest) {
  try {
    const cars = await prisma.car.findMany({
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        pricePerDay: true,
        images: true,
        carType: true,
        transmissionType: true,
        fuelType: true,
        officeId: true,
        companyId: true,
      },
    });

    return NextResponse.json({ cars }, { status: 200 });
  } catch (err) {
    console.error('company/cars GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
