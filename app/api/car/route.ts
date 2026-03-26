import { CarRepository } from '@/lib/repository/CarRepository';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const companyId = url.searchParams.get('companyId');
    const id = url.searchParams.get('id');

    if (id) {
      const car = await CarRepository.findById(Number(id));
      return NextResponse.json({ cars: car ? [car] : [] }, { status: 200 });
    } else if (companyId) {
      const cars = await CarRepository.findByCompany(Number(companyId));
      return NextResponse.json({ cars }, { status: 200 });
    } else {
      const cars = await CarRepository.getAll();
      return NextResponse.json({ cars }, { status: 200 });
    }
  } catch (error) {
    console.error('GET /api/cars error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cars' },
      { status: 500 },
    );
  }
}
