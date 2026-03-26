import { NextRequest } from 'next/server';
import type {
  Car,
  CarFormValues,
  CarType,
  FuelType,
  TransmissionType,
} from '@/types/types';
import { CarRepository } from '@/lib/repository/CarRepository';
// import { countReservationsByCarId } from '@/lib/repository/ReservationRepository';
import {
  mapCarType,
  mapFuelType,
  mapTransmissionType,
} from '@/lib/utils/carMappers';
import { saveCompanyCarImages } from '@/lib/utils/fileUpload';
import { validateCompanyCarInput } from '@/lib/validators/companyCarValidator';
import { ReservationRepository } from '@/lib/repository/ReservationRepository';

type CompanyUser = {
  id: number;
  companyId: number;
  role: 'COMPANY';
};

type CreateParsedInput = {
  make: string | null;
  model: string | null;
  year: number | null;
  pricePerDay: number | null;
  images: string[];
  carType: CarType | null;
  transmissionType: TransmissionType | null;
  fuelType: FuelType | null;
  power: number | null;
  displacement: number | null;
  officeId: number | null;
};

export async function getCompanyCars(companyId: number) {
  return CarRepository.findManyByCompanyId(companyId);
}

async function parseCreateCompanyCarRequest(
  req: NextRequest,
  companyId: number,
): Promise<CreateParsedInput> {
  const contentType = (req.headers.get('content-type') || '').toLowerCase();

  let make: string | null = null;
  let model: string | null = null;
  let year: number | null = null;
  let pricePerDay: number | null = null;
  let images: string[] = [];
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

    const fileEntries = form.getAll('images') as File[];
    images = await saveCompanyCarImages(fileEntries, companyId);
  } else {
    let body: CarFormValues | null = null;

    try {
      body = (await req.json()) as CarFormValues;
    } catch {
      throw new Error('INVALID_JSON_BODY');
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
      images = (body as any).images.filter(
        (it: unknown) => typeof it === 'string',
      );
    }
  }

  return {
    make,
    model,
    year,
    pricePerDay,
    images,
    carType,
    transmissionType,
    fuelType,
    power,
    displacement,
    officeId,
  };
}

export async function createCompanyCar(req: NextRequest, user: CompanyUser) {
  const parsed = await parseCreateCompanyCarRequest(req, user.companyId);

  validateCompanyCarInput(parsed);

  const created = await CarRepository.create({
    make: parsed.make!,
    model: parsed.model!,
    year: Number(parsed.year),
    pricePerDay: Number(parsed.pricePerDay),
    power: Number(parsed.power),
    displacement: Number(parsed.displacement),
    images: parsed.images,
    ownerId: Number(user.id),
    companyId: Number(user.companyId),
    carType: parsed.carType!,
    transmissionType: parsed.transmissionType!,
    fuelType: parsed.fuelType!,
    officeId: parsed.officeId ?? undefined,
  });

  return {
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
  };
}

export async function deleteCompanyCar(carId: number, companyId: number) {
  if (!carId || Number.isNaN(carId)) {
    throw new Error('INVALID_CAR_ID');
  }

  const car = await CarRepository.findById(carId);

  if (!car) {
    throw new Error('CAR_NOT_FOUND');
  }

  if (car.companyId !== companyId) {
    throw new Error('UNAUTHORIZED_CAR_ACCESS');
  }

  const reservationsCount = await ReservationRepository.countReservationsByCarId(carId);

  if (reservationsCount > 0) {
    throw new Error('CAR_HAS_RESERVATIONS');
  }

  await CarRepository.delete(carId);
}

export async function updateCompanyCar(
  req: NextRequest,
  carId: number,
  companyId: number,
) {
  if (!carId || Number.isNaN(carId)) {
    throw new Error('INVALID_CAR_ID');
  }

  const existingCar = await CarRepository.findById(carId);

  if (!existingCar) {
    throw new Error('CAR_NOT_FOUND');
  }

  if (existingCar.companyId !== companyId) {
    throw new Error('UNAUTHORIZED_CAR_ACCESS');
  }

  let body: any;

  try {
    body = await req.json();
  } catch {
    throw new Error('INVALID_JSON_BODY');
  }

  const updateData: Partial<Omit<Car, 'id' | 'createdAt' | 'updatedAt'>> = {};

  if (body.make !== undefined) updateData.make = String(body.make).trim();
  if (body.model !== undefined) updateData.model = String(body.model).trim();
  if (body.year !== undefined) updateData.year = Number(body.year);
  if (body.pricePerDay !== undefined) {
    updateData.pricePerDay = Number(body.pricePerDay);
  }
  if (body.power !== undefined) updateData.power = Number(body.power);
  if (body.displacement !== undefined) {
    updateData.displacement = Number(body.displacement);
  }

  if (body.carType !== undefined) {
    updateData.carType = mapCarType(body.carType) ?? undefined;
  }

  if (body.transmissionType !== undefined) {
    updateData.transmissionType =
      mapTransmissionType(body.transmissionType) ?? undefined;
  }

  if (body.fuelType !== undefined) {
    updateData.fuelType = mapFuelType(body.fuelType) ?? undefined;
  }

  if (body.officeId !== undefined) {
    updateData.officeId =
      body.officeId === null ? undefined : Number(body.officeId);
  }

  if (body.images !== undefined && Array.isArray(body.images)) {
    updateData.images = body.images.filter(
      (it: unknown) => typeof it === 'string',
    );
  }

  const updated = await CarRepository.update(carId, updateData);

  if (!updated) {
    throw new Error('CAR_NOT_FOUND');
  }

  return updated;
}
