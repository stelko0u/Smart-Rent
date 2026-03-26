import { NextRequest, NextResponse } from 'next/server';
import { getCarsBrowseData } from '@/lib/services/car/carBrowseService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const data = await getCarsBrowseData({
      officeId: searchParams.get('officeId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error('GET /api/cars error:', err);
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 });
  }
}
