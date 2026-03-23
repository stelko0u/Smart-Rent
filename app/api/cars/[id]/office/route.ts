import { NextRequest, NextResponse } from 'next/server';
import { CarRepository } from '@/lib/repository/CarRepository';
import { OfficeRepository } from '@/lib/repository/OfficeRepository';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const carId = Number(id);

  if (isNaN(carId)) {
    return NextResponse.json({ error: 'Invalid car ID' }, { status: 400 });
  }

  try {
    const car = await CarRepository.findById(carId);

    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }

    if (!car.officeId) {
      return NextResponse.json(
        { error: 'Car does not have an associated office' },
        { status: 404 },
      );
    }

    const office = await OfficeRepository.findById(car.officeId);

    if (!office) {
      return NextResponse.json({ error: 'Office not found' }, { status: 404 });
    }

    return NextResponse.json(office, { status: 200 });
  } catch (error) {
    console.error('Error fetching office details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch office details' },
      { status: 500 },
    );
  }
}
