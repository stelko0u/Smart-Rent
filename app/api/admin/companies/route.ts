import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import { UserRepository } from '@/lib/repository/UserRepository';
import bcrypt from 'bcryptjs';

type UpdateCompanyBody = {
  id?: unknown;
  name?: unknown;
  email?: unknown;
  maintenancePercent?: unknown;
};

type DeleteCompanyBody = {
  id?: unknown;
};

type CreateCompanyBody = {
  name?: unknown;
  email?: unknown;
  maintenancePercent?: unknown;
};

export async function GET(req: Request) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;

  try {
    const companies = await CompanyRepository.findMany();
    return NextResponse.json({ ok: true, companies });
  } catch (err) {
    console.error('GET /api/admin/companies error:', err);
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;

  try {
    const body = (await req.json()) as UpdateCompanyBody;
    const id = Number(body.id);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        { ok: false, error: 'id_required' },
        { status: 400 },
      );
    }

    const existing = await CompanyRepository.findById(id);
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: 'not_found' },
        { status: 404 },
      );
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const maintenancePercent = Number(body.maintenancePercent);

    if (!name || !email || Number.isNaN(maintenancePercent)) {
      return NextResponse.json(
        { ok: false, error: 'invalid_payload' },
        { status: 400 },
      );
    }

    if (maintenancePercent < 0 || maintenancePercent > 100) {
      return NextResponse.json(
        { ok: false, error: 'invalid_maintenance_percent' },
        { status: 400 },
      );
    }

    const updated = await CompanyRepository.update(id, {
      name,
      email,
      maintenancePercent,
    });

    return NextResponse.json({ ok: true, company: updated });
  } catch (err) {
    console.error('PATCH /api/admin/companies error:', err);
    return NextResponse.json(
      { ok: false, error: 'update_error' },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;

  try {
    const body = (await req.json()) as CreateCompanyBody;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const maintenancePercent = Number(body.maintenancePercent);

    if (!name || !email || Number.isNaN(maintenancePercent)) {
      return NextResponse.json(
        { ok: false, error: 'invalid_payload' },
        { status: 400 },
      );
    }

    if (maintenancePercent < 0 || maintenancePercent > 100) {
      return NextResponse.json(
        { ok: false, error: 'invalid_maintenance_percent' },
        { status: 400 },
      );
    }

    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { ok: false, error: 'email_in_use' },
        { status: 409 },
      );
    }

    const temporaryPassword = Math.random().toString(36).slice(-12);
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const user = await UserRepository.create({
      email,
      password: hashedPassword,
      name,
      role: 'COMPANY',
      emailVerified: true,
      mustChangePassword: false,
    });

    try {
      const company = await CompanyRepository.create({
        ownerId: user.id,
        name,
        email,
        maintenancePercent,
      });

      await UserRepository.update(user.id, {
        companyId: company.id,
      });

      return NextResponse.json({ ok: true, company });
    } catch (createErr) {
      await UserRepository.delete(user.id);
      throw createErr;
    }
  } catch (err) {
    console.error('POST /api/admin/companies error:', err);
    return NextResponse.json(
      { ok: false, error: 'create_error' },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;

  try {
    const body = (await req.json()) as DeleteCompanyBody;
    const id = Number(body.id);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        { ok: false, error: 'id_required' },
        { status: 400 },
      );
    }

    const company = await CompanyRepository.findById(id);
    if (!company) {
      return NextResponse.json(
        { ok: false, error: 'not_found' },
        { status: 404 },
      );
    }

    await CompanyRepository.delete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/companies error:', err);
    return NextResponse.json(
      { ok: false, error: 'delete_error' },
      { status: 500 },
    );
  }
}
