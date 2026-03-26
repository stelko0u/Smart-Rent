import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import { OfficeRepository } from '@/lib/repository/OfficeRepository';
import { requireCompanyUser } from '@/lib/auth/requireCompany';

export type OfficePayload = {
  id?: number;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
};

export async function getVerifiedCompanyId(): Promise<number | null> {
  const user = await requireCompanyUser();

  const companyId = user.companyId ?? null;
  if (!companyId) return null;

  const company = await CompanyRepository.findById(Number(companyId));
  if (!company) return null;

  return Number(companyId);
}

export function parseCoordinate(value: unknown): number | null {
  if (value === '' || value == null) return null;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function parseOfficePayload(body: any): OfficePayload {
  return {
    id: body?.id != null ? Number(body.id) : undefined,
    name: String(body?.name || '').trim(),
    address: String(body?.address || '').trim(),
    latitude: parseCoordinate(body?.latitude),
    longitude: parseCoordinate(body?.longitude),
  };
}

export async function getCompanyOffices() {
  const companyId = await getVerifiedCompanyId();

  if (!companyId) {
    throw new Error('COMPANY_NOT_FOUND');
  }

  const offices = await OfficeRepository.findByCompany(companyId);

  return {
    ok: true,
    offices,
  };
}

export async function createCompanyOffice(body: any) {
  const companyId = await getVerifiedCompanyId();

  if (!companyId) {
    throw new Error('COMPANY_NOT_FOUND');
  }

  const { name, address, latitude, longitude } = parseOfficePayload(body);

  if (!name || !address) {
    throw new Error('NAME_AND_ADDRESS_REQUIRED');
  }

  if (latitude === null || longitude === null) {
    throw new Error('Latitude and longitude are required');
  }
  const office = await OfficeRepository.create({
    name,
    address,
    latitude,
    longitude,
    companyId,
  });

  return {
    ok: true,
    office,
  };
}

export async function updateCompanyOffice(body: any) {
  const companyId = await getVerifiedCompanyId();

  if (!companyId) {
    throw new Error('COMPANY_NOT_FOUND');
  }

  const { id, name, address, latitude, longitude } = parseOfficePayload(body);

  if (!id || Number.isNaN(id)) {
    throw new Error('INVALID_OFFICE_ID');
  }

  if (!name || !address) {
    throw new Error('NAME_AND_ADDRESS_REQUIRED');
  }

  const existingOffice = await OfficeRepository.findById(id);

  if (!existingOffice || Number(existingOffice.companyId) !== companyId) {
    throw new Error('OFFICE_NOT_FOUND');
  }

  if (latitude === null || longitude === null) {
    throw new Error('Latitude and longitude are required');
  }

  const office = await OfficeRepository.update(id, {
    name,
    address,
    latitude,
    longitude,
  });

  return {
    ok: true,
    office,
  };
}

export async function deleteCompanyOffice(body: any) {
  const companyId = await getVerifiedCompanyId();

  if (!companyId) {
    throw new Error('COMPANY_NOT_FOUND');
  }

  const { id } = parseOfficePayload(body);

  if (!id || Number.isNaN(id)) {
    throw new Error('INVALID_OFFICE_ID');
  }

  const existingOffice = await OfficeRepository.findById(id);

  if (!existingOffice || Number(existingOffice.companyId) !== companyId) {
    throw new Error('OFFICE_NOT_FOUND');
  }

  await OfficeRepository.delete(id);

  return {
    ok: true,
  };
}
