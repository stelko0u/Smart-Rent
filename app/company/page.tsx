import { getAuthUser } from '@/lib/auth';
import CompanyArea from '../../components/company/CompanyArea';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Company Panel',
};

export default async function CompanyPage() {
  const authUser = await getAuthUser();
  if (
    !authUser ||
    (typeof authUser.role === 'string' ? authUser.role.toUpperCase() !== 'COMPANY' : true)
  ) {
    redirect('/');
  }

  return <CompanyArea />;
}
