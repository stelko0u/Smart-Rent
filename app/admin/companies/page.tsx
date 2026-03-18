import { redirect } from 'next/navigation';
import AdminShell from '../../../components/admin/AdminShell';
import AdminCompanies from '../../../components/admin/AdminCompanies';
import { getMe } from '@/lib/auth';

export default async function ManageCompaniesPage() {
  const me = await getMe();

  if (!me || me.role?.toUpperCase() !== 'ADMIN') {
    redirect('/signin');
  }

  return (
    <AdminShell me={{ id: me.id, name: me.name, role: me.role }}>
      <div className="p-6">
        <AdminCompanies />
      </div>
    </AdminShell>
  );
}
