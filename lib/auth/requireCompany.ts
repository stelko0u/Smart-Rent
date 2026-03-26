import { getAuthUser } from '@/lib/auth';

export async function requireCompanyUser() {
  const user = await getAuthUser();

  if (!user || user.role !== 'COMPANY') {
    throw new Error('FORBIDDEN');
  }

  if (!user.companyId || !user.id) {
    throw new Error('MISSING_COMPANY_CONTEXT');
  }

  return {
    id: user.id,
    companyId: user.companyId,
    role: user.role,
  };
}
