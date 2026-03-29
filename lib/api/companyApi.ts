import type { Car, Company } from '@/types/database';

export type CompanyAccessState = {
  allowed: boolean;
  onboardingRequired: boolean;
  reason:
    | 'company_not_found'
    | 'missing_company'
    | 'missing_stripe_account'
    | 'stripe_incomplete'
    | 'ready';
  company: Company | null;
  stripe: {
    accountId: string | null;
    detailsSubmitted: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    disabledReason: string | null;
    currentlyDue: string[];
    pastDue: string[];
  } | null;
};

export type CompanyMeResponse = {
  ok?: boolean;
  company?: Company | null;
  error?: string;
};

export type CompanyAccessResponse = {
  ok?: boolean;
  access?: CompanyAccessState | null;
  error?: string;
};

export interface CompanyDashboardStats {
  totalRevenue: number;
  platformFee: number;
  companyEarnings: number;
  totalReservations: number;
  pendingReservations: number;
  completedReservations: number;
  totalCars: number;
  maintenancePercent: number;
  balanceAvailable: number;
  balancePending: number;
  moneySource: 'stripe' | 'database';
}

export interface CompanyRecentReservation {
  id: number;
  carMake: string;
  carModel: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  customerName: string;
}

export type CompanyDashboardResponse = {
  ok?: boolean;
  stats?: CompanyDashboardStats;
  recentReservations?: CompanyRecentReservation[];
  error?: string;
};

export interface CompanyReservation {
  id: number;
  carId: number;
  carMake: string;
  carModel: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: string;
}

export type CompanyReservationsResponse = {
  ok?: boolean;
  reservations?: CompanyReservation[];
  error?: string;
};

export interface CompanyPayment {
  source?: 'stripe' | 'database';
  id?: number;
  reservationId: number | null;
  paymentIntentId?: string;
  chargeId?: string | null;
  amount: number;
  platformFee: number;
  companyEarnings: number;
  paymentMethod: string;
  paymentStatus: string;
  paidAt?: string;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
  carLabel?: string;
}

export type CompanyPaymentsResponse = {
  ok?: boolean;
  payments?: CompanyPayment[];
  source?: 'stripe' | 'database';
  error?: string;
};

export interface CompanyInvoice {
  id: string;
  number: string | null;
  status: string | null;
  currency: string;
  total: number;
  amount_due: number;
  amount_paid: number;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  created: number;
  due_date: number | null;
  reservationId: number;
  customerEmail: string;
  customerName: string;
  grossAmount: number;
  platformFee: number;
  companyEarnings: number;
}

export type CompanyInvoicesResponse = {
  ok?: boolean;
  invoices?: CompanyInvoice[];
  error?: string;
};

export interface CompanyReportItem {
  reservationId: number | null;
  customerName: string;
  customerEmail: string;
  carLabel: string;
  amount: number;
  platformFee: number;
  companyEarnings: number;
  paidAt: string;
}

export interface CompanyReportSummary {
  totalRevenue: number;
  platformFee: number;
  companyEarnings: number;
  paymentsCount: number;
}

export type CompanyReportsResponse = {
  ok?: boolean;
  summary?: CompanyReportSummary | null;
  items?: CompanyReportItem[];
  error?: string;
};

export interface CompanyOffice {
  id?: number;
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export type CompanyOfficesResponse = {
  ok?: boolean;
  offices?: CompanyOffice[];
  error?: string;
};

export type CreateCompanyPayload = {
  name: string;
  email: string;
  password: string;
  maintenancePercent: number;
};

export type CreateCompanyResponse = {
  ok: boolean;
  error?: string;
  company?: unknown;
};

export type StripeOnboardingLinkResponse = {
  ok: boolean;
  url?: string;
  error?: string;
};

export type SaveCompanyOfficePayload = {
  companyId: number;
  id?: number;
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

async function parseJsonSafe<T>(res: Response): Promise<T> {
  const text = await res.text();
  const contentType = (res.headers.get('content-type') || '').toLowerCase();

  if (!contentType.includes('application/json')) {
    throw new Error(
      `Expected JSON but got ${contentType || 'unknown'} (status ${res.status})`,
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Invalid JSON response');
  }
}

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  const data = await parseJsonSafe<T & { error?: string }>(res);

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

async function apiJson<TResponse, TBody>(
  url: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: TBody,
): Promise<TResponse> {
  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await parseJsonSafe<TResponse & { error?: string }>(res);

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export async function createCompany(
  payload: CreateCompanyPayload,
): Promise<CreateCompanyResponse> {
  const res = await fetch('/api/admin/company', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to create company');
  }

  return data;
}

export async function getCompanyMe(): Promise<Company | null> {
  const data = await apiGet<CompanyMeResponse>('/api/company/me');
  return data.company ?? null;
}

export async function getCompanyAccessStatus(): Promise<CompanyAccessState | null> {
  const data = await apiGet<CompanyAccessResponse>(
    '/api/company/access-status',
  );
  return data.access ?? null;
}

export async function getCompanyCars(): Promise<Car[]> {
  const data = await apiGet<{ ok?: boolean; cars?: Car[]; error?: string }>(
    '/api/company/cars',
  );

  return Array.isArray(data.cars) ? data.cars : [];
}

export async function createCompanyCar(formData: FormData): Promise<unknown> {
  const res = await fetch('/api/company/cars', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to create car');
  }

  return data.car;
}

export async function deleteCompanyCar(carId: number): Promise<void> {
  const res = await fetch(`/api/company/cars?id=${carId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to delete car');
  }
}

export async function getCompanyDashboard(): Promise<{
  stats: CompanyDashboardStats;
  recentReservations: CompanyRecentReservation[];
}> {
  const data = await apiGet<CompanyDashboardResponse>('/api/company/dashboard');

  if (!data.stats) {
    throw new Error('Missing dashboard stats');
  }

  return {
    stats: data.stats,
    recentReservations: Array.isArray(data.recentReservations)
      ? data.recentReservations
      : [],
  };
}

export async function getCompanyReservations(): Promise<CompanyReservation[]> {
  const data = await apiGet<CompanyReservationsResponse>(
    '/api/company/reservations',
  );

  return Array.isArray(data.reservations) ? data.reservations : [];
}

export async function getCompanyPayments(): Promise<{
  payments: CompanyPayment[];
  source: 'stripe' | 'database';
}> {
  const data = await apiGet<CompanyPaymentsResponse>('/api/company/payments');

  return {
    payments: Array.isArray(data.payments) ? data.payments : [],
    source: data.source === 'database' ? 'database' : 'stripe',
  };
}

export async function getCompanyInvoices(): Promise<CompanyInvoice[]> {
  const data = await apiGet<CompanyInvoicesResponse>('/api/company/invoices');
  return Array.isArray(data.invoices) ? data.invoices : [];
}

export async function getCompanyReport(params: {
  startDate: string;
  endDate: string;
}): Promise<{
  summary: CompanyReportSummary | null;
  items: CompanyReportItem[];
}> {
  const search = new URLSearchParams({
    startDate: params.startDate,
    endDate: params.endDate,
  });

  const data = await apiGet<CompanyReportsResponse>(
    `/api/company/reports?${search.toString()}`,
  );

  return {
    summary: data.summary ?? null,
    items: Array.isArray(data.items) ? data.items : [],
  };
}

export function getCompanyReportPdfUrl(params: {
  startDate: string;
  endDate: string;
}): string {
  const search = new URLSearchParams({
    startDate: params.startDate,
    endDate: params.endDate,
    format: 'pdf',
  });

  return `/api/company/reports?${search.toString()}`;
}

export async function getCompanyOffices(): Promise<CompanyOffice[]> {
  const data = await apiGet<CompanyOfficesResponse>('/api/company/offices');
  return Array.isArray(data.offices) ? data.offices : [];
}

export async function saveCompanyOffice(
  payload: SaveCompanyOfficePayload,
): Promise<void> {
  const method = payload.id ? 'PATCH' : 'POST';
  await apiJson<{ ok?: boolean; error?: string }, SaveCompanyOfficePayload>(
    '/api/company/offices',
    method,
    payload,
  );
}

export async function deleteCompanyOffice(id: number): Promise<void> {
  await apiJson<{ ok?: boolean; error?: string }, { id: number }>(
    '/api/company/offices',
    'DELETE',
    { id },
  );
}

export async function getCompanyStripeOnboardingLink(): Promise<string> {
  const data = await apiGet<StripeOnboardingLinkResponse>(
    '/api/company/stripe/onboarding-link',
  );

  if (!data?.ok || !data.url) {
    throw new Error(data.error || 'Failed to generate onboarding link');
  }

  return data.url;
}

export async function getStripeLoginLink(): Promise<string> {
  const data = await apiJson<{ ok: boolean; url: string }, undefined>(
    '/api/company/stripe-login',
    'POST',
  );

  return data.url;
}
