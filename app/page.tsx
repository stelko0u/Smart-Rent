import { cookies } from 'next/headers';
import HomePageClient from './HomePage';
import type { HomeCar, Role } from '@/types/home';

function normalizeRole(rawRole: unknown): Role {
  if (typeof rawRole !== 'string') return null;

  const rl = rawRole.toLowerCase().trim();

  if (rl === 'user' || rl === 'company' || rl === 'admin') {
    return rl;
  }

  if (rl === 'manager') {
    return 'company';
  }

  return null;
}

async function getAuth() {
  const cookieStore = await cookies();

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/me`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Cookie: cookieStore.toString(),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    return {
      isLoggedIn: false,
      role: null as Role,
    };
  }

  const data = await res.json();

  const logged =
    Boolean(data?.ok) ||
    Boolean(data?.authenticated) ||
    Boolean(data?.success) ||
    Boolean(data?.user) ||
    false;

  const rawRole =
    data?.role ??
    data?.user?.role ??
    data?.data?.role ??
    data?.user?.profile?.role ??
    data?.user?.type ??
    null;

  return {
    isLoggedIn: logged,
    role: normalizeRole(rawRole),
  };
}

async function getCars(): Promise<HomeCar[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cars`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return [];
  }

  const json = await res.json();
  const list = Array.isArray(json.cars) ? json.cars : [];

  console.log('first car from api:', list[0]);

  return list.map((c: any) => ({
    id: Number(c.id),
    name: `${c.make ?? ''} ${c.model ?? ''}`.trim(),

    make: String(c.make ?? ''),
    model: String(c.model ?? ''),

    bodyType: String(
      c.bodyType ?? c.body_type ?? c.carBodyType ?? c.category ?? c.type ?? '',
    ),

    year: Number(c.year ?? c.productionYear ?? 0),

    horsepower: Number(
      c.horsepower ?? c.hp ?? c.horse_power ?? c.power ?? c.enginePower ?? 0,
    ),

    transmission: String(
      c.transmission ?? c.gearbox ?? c.transmissionType ?? c.gearBox ?? '',
    ),

    fuelType: String(c.fuelType ?? c.fuel_type ?? c.fuel ?? ''),

    location: String(
      c.location ??
        c.city ??
        c.office?.city ??
        c.office?.name ??
        c.office?.location ??
        c.office?.address ??
        c.company?.city ??
        c.company?.address ??
        '',
    ),

    pricePerDay: Number(c.pricePerDay ?? c.price_per_day ?? 0),

    img:
      Array.isArray(c.images) && c.images.length
        ? c.images[0]
        : (c.imageUrl ?? c.image ?? ''),

    companyName:
      c.companyName ?? c.company?.name ?? c.owner?.companyName ?? null,
  }));
}

export default async function HomePage() {
  const [{ isLoggedIn, role }, cars] = await Promise.all([
    getAuth(),
    getCars(),
  ]);

  return (
    <HomePageClient isLoggedIn={isLoggedIn} role={role} initialCars={cars} />
  );
}
