import { CarRepository } from '@/lib/repositories/CarRepository';
import { CompanyRepository } from '@/lib/repositories/CompanyRepository';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params; // ✅ await тук
    const carId = Number(id);

    if (!carId || isNaN(carId)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid car ID' },
        { status: 400 },
      );
    }

    const car = await CarRepository.findById(carId);

    if (!car) {
      return NextResponse.json(
        { ok: false, error: 'Car not found' },
        { status: 404 },
      );
    }

    let company = null;
    if (car.companyId) {
      company = await CompanyRepository.findById(car.companyId);
    }

    return NextResponse.json({
      ok: true,
      car: {
        ...car,
        company: company
          ? {
              id: company.id,
              name: company.name,
              email: company.email,
            }
          : null,
      },
    });
  } catch (err) {
    console.error('GET /api/cars/[id] error:', err);
    return NextResponse.json(
      { ok: false, error: 'Server error' },
      { status: 500 },
    );
  }
}
