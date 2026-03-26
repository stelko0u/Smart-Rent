import { NextResponse } from 'next/server';
import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import { UserRepository } from '@/lib/repository/UserRepository';
import { rollbackStripeAccount } from '@/lib/services/stripe/companyStripe';
import { onboardCompany } from '@/lib/services/company/onBoardCompany';
import { deleteCompanyDeep } from '@/lib/services/admin/deleteEntity';
import { requireAdmin } from '@/lib/auth/requireAdmin';

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

export async function POST(req: Request) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;

  try {
    const body = await req.json();
    const name = String(body?.name ?? '').trim();
    const email = String(body?.email ?? '')
      .trim()
      .toLowerCase();
    const maintenancePercent = body?.maintenancePercent ?? 0;

    if (!name || !email) {
      return NextResponse.json(
        { ok: false, error: 'name_email_required' },
        { status: 400 },
      );
    }

    const m = Number(maintenancePercent);
    if (!Number.isFinite(m) || m < 0 || m > 100) {
      return NextResponse.json(
        { ok: false, error: 'invalid_maintenance_percent' },
        { status: 400 },
      );
    }

    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { ok: false, error: 'email_already_exists' },
        { status: 409 },
      );
    }

    const existingCompany = await CompanyRepository.findByEmail(email);
    if (existingCompany) {
      return NextResponse.json(
        { ok: false, error: 'company_email_already_exists' },
        { status: 409 },
      );
    }

    const { company, mailInfo } = await onboardCompany({
      name,
      email,
      maintenancePercent: m,
    });

    return NextResponse.json(
      {
        ok: true,
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          maintenancePercent: company.maintenancePercent,
          ownerId: company.ownerId,
          stripeAccountId: company.stripeAccountId ?? null,
        },
        onboardingEmail: {
          sentTo: mailInfo.sentTo,
          devOverrideUsed: mailInfo.devOverrideUsed,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('POST /api/admin/companies error:', err);
    return NextResponse.json(
      { ok: false, error: 'company_creation_failed' },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;

  try {
    const body = await req.json();
    const { id, maintenancePercent, name, email } = body;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'id_required' },
        { status: 400 },
      );
    }

    const updates: Partial<{
      name: string;
      email: string;
      maintenancePercent: number;
    }> = {};

    if (name !== undefined) {
      updates.name = name;
    }

    if (email !== undefined) {
      const existingCompany = await CompanyRepository.findByEmail(email);
      if (existingCompany && existingCompany.id !== Number(id)) {
        return NextResponse.json(
          { ok: false, error: 'email_already_in_use' },
          { status: 409 },
        );
      }
      updates.email = email;
    }

    if (maintenancePercent !== undefined) {
      const m = Number(maintenancePercent);
      if (!Number.isFinite(m) || m < 0 || m > 100) {
        return NextResponse.json(
          { ok: false, error: 'invalid_maintenance_percent' },
          { status: 400 },
        );
      }
      updates.maintenancePercent = m;
    }

    const company = await CompanyRepository.update(Number(id), updates);

    if (!company) {
      return NextResponse.json(
        { ok: false, error: 'company_not_found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, company });
  } catch (err) {
    console.error('PATCH /api/admin/companies error:', err);
    return NextResponse.json(
      { ok: false, error: 'update_error' },
      { status: 500 },
    );
  }
}


export async function DELETE(req: Request) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'id_required' },
        { status: 400 },
      );
    }

    const company = await CompanyRepository.findById(Number(id));
    if (!company) {
      return NextResponse.json(
        { ok: false, error: 'company_not_found' },
        { status: 404 },
      );
    }

    const stripeAccountId = (company as any).stripeAccountId as
      | string
      | undefined;

    await deleteCompanyDeep(Number(id));

    if (stripeAccountId) {
      try {
        await rollbackStripeAccount(stripeAccountId);
      } catch (stripeErr) {
        console.warn('Stripe rollback failed:', stripeErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/companies error:', err);

    const message = err instanceof Error ? err.message : 'delete_error';

    if (message === 'company_not_found') {
      return NextResponse.json(
        { ok: false, error: 'company_not_found' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { ok: false, error: 'delete_error' },
      { status: 500 },
    );
  }
}
