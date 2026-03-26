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

export async function getCompanyStripeOnboardingLink(): Promise<string> {
  const res = await fetch('/api/company/stripe/onboarding-link', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  const data: StripeOnboardingLinkResponse = await res
    .json()
    .catch(() => ({ ok: false, error: 'Failed to generate onboarding link' }));

  if (!res.ok || !data?.ok || !data?.url) {
    throw new Error(data?.error || 'Failed to generate onboarding link');
  }

  return data.url;
}

