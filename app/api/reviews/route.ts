import { ReviewRepository } from '@/lib/repositories/ReviewRepository';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const carId = Number(searchParams.get('carId'));

    if (!carId) {
      return NextResponse.json(
        { error: 'Car ID is required' },
        { status: 400 },
      );
    }

    const reviews = await ReviewRepository.findByCar(carId);

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 },
    );
  }
}
