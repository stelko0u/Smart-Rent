import { NextRequest, NextResponse } from 'next/server';
import {
  createCompanyOffice,
  deleteCompanyOffice,
  getCompanyOffices,
  updateCompanyOffice,
} from '@/lib/services/company/companyOfficesService';
import { handleCompanyOfficesError } from '@/lib/errors/handleCompanyOfficesError';

export async function GET() {
  try {
    const result = await getCompanyOffices();
    return NextResponse.json(result);
  } catch (err: any) {
    return handleCompanyOfficesError(err, 'GET');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await createCompanyOffice(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return handleCompanyOfficesError(err, 'POST');
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await updateCompanyOffice(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return handleCompanyOfficesError(err, 'PATCH');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await deleteCompanyOffice(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return handleCompanyOfficesError(err, 'DELETE');
  }
}
