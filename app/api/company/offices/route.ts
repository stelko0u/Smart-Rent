import { NextRequest, NextResponse } from 'next/server';
import { OfficeRepository } from '../../../../lib/repositories';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');

  try {
    const offices = await OfficeRepository.findMany();
    return NextResponse.json(offices, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch offices' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, address, latitude, longitude, companyId } = await req.json();

    if (!companyId) {
      return NextResponse.json(
        { error: 'Missing required field: companyId' },
        { status: 400 },
      );
    }

    const office = await OfficeRepository.create({
      name,
      address,
      latitude,
      longitude,
      companyId: Number(companyId),
    });

    return NextResponse.json(office, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create office' },
      { status: 500 },
    );
  }
}
