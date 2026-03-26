import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyUser } from '@/lib/auth/requireCompany';
import { handleCompanyCarsError } from '@/lib/errors/handleCompanyCarsError';
import {
  createCompanyCar,
  deleteCompanyCar,
  getCompanyCars,
  updateCompanyCar,
} from '@/lib/services/company/companyCarsService';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await requireCompanyUser();
    const cars = await getCompanyCars(user.companyId);
    return NextResponse.json({ cars }, { status: 200 });
  } catch (error) {
    return handleCompanyCarsError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireCompanyUser();
    const car = await createCompanyCar(req, user);
    return NextResponse.json({ car }, { status: 201 });
  } catch (error) {
    return handleCompanyCarsError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireCompanyUser();
    const { searchParams } = new URL(req.url);
    const carId = Number(searchParams.get('id'));

    await deleteCompanyCar(carId, user.companyId);

    return NextResponse.json({ message: 'Car deleted successfully' });
  } catch (error) {
    return handleCompanyCarsError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireCompanyUser();
    const { searchParams } = new URL(req.url);
    const carId = Number(searchParams.get('id'));

    const car = await updateCompanyCar(req, carId, user.companyId);
    return NextResponse.json({ car }, { status: 200 });
  } catch (error) {
    return handleCompanyCarsError(error);
  }
}
