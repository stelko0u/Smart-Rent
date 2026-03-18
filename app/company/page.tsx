import CompanyArea from '../../components/company/CompanyArea';
import { getMe } from '../../lib/auth';
import { redirect } from 'next/navigation';

export default async function CompanyPage() {
  const me = await getMe();
  if (
    !me ||
    (typeof me.role === 'string' ? me.role.toUpperCase() !== 'COMPANY' : true)
  ) {
    redirect('/');
  }

  return <CompanyArea />;
}
