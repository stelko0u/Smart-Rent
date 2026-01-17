import { NextResponse } from 'next/server';
import { carService } from '../../lib/api';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const companyId = url.searchParams.get('companyId');
    const id = url.searchParams.get('id');
    
    if (id) {
      // Get single car by ID
      const car = await carService.getById(Number(id));
      return NextResponse.json({ cars: car ? [car] : [] }, { status: 200 });
    } else if (companyId) {
      // Get cars by company
      const cars = await carService.getByCompany(Number(companyId));
      return NextResponse.json({ cars }, { status: 200 });
    } else {
      // Get all cars with search
      const cars = await carService.search({});
      return NextResponse.json({ cars }, { status: 200 });
    }
  } catch (error) {
    console.error('GET /api/cars error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cars' },
      { status: 500 }
    );
  }
}