import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import { getStripeAccountStatus } from '@/lib/services/stripe/companyStripe';

export type CompanyAccessStatus = {
  allowed: boolean;
  onboardingRequired: boolean;
  reason:
    | 'company_not_found'
    | 'missing_company'
    | 'missing_stripe_account'
    | 'stripe_incomplete'
    | 'ready';
  company: any | null;
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

export async function getCompanyAccessStatus(user: {
  role?: string;
  companyId?: number | null;
  mustChangePassword?: boolean;
}): Promise<CompanyAccessStatus> {
  if (user.role !== 'COMPANY') {
    return {
      allowed: false,
      onboardingRequired: false,
      reason: 'missing_company',
      company: null,
      stripe: null,
    };
  }

  if (!user.companyId) {
    return {
      allowed: false,
      onboardingRequired: true,
      reason: 'missing_company',
      company: null,
      stripe: null,
    };
  }

  const company = await CompanyRepository.findById(Number(user.companyId));

  if (!company) {
    return {
      allowed: false,
      onboardingRequired: true,
      reason: 'company_not_found',
      company: null,
      stripe: null,
    };
  }

  if (!company.stripeAccountId) {
    return {
      allowed: false,
      onboardingRequired: true,
      reason: 'missing_stripe_account',
      company,
      stripe: {
        accountId: null,
        detailsSubmitted: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        disabledReason: null,
        currentlyDue: [],
        pastDue: [],
      },
    };
  }

  const account = await getStripeAccountStatus(company.stripeAccountId);

  const detailsSubmitted = account.details_submitted === true;
  const chargesEnabled = account.charges_enabled === true;
  const payoutsEnabled = account.payouts_enabled === true;
  const currentlyDue = account.requirements?.currently_due ?? [];
  const pastDue = account.requirements?.past_due ?? [];
  const disabledReason = account.requirements?.disabled_reason ?? null;

  const ready = detailsSubmitted && chargesEnabled && payoutsEnabled;

  return {
    allowed: ready,
    onboardingRequired: !ready,
    reason: ready ? 'ready' : 'stripe_incomplete',
    company,
    stripe: {
      accountId: account.id,
      detailsSubmitted,
      chargesEnabled,
      payoutsEnabled,
      disabledReason,
      currentlyDue,
      pastDue,
    },
  };
}

export async function assertCompanyPanelAccess(user: {
  role?: string;
  companyId?: number | null;
  mustChangePassword?: boolean;
}) {
  const status = await getCompanyAccessStatus(user);

  if (!status.allowed) {
    const err = new Error('company_activation_required');
    (err as any).status = 403;
    (err as any).details = status;
    throw err;
  }

  return status;
}
