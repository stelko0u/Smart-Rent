import React from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import AdminShell from '../../components/admin/AdminShell';
import { getMe } from '../../lib/auth';

export default async function AdminPage() {
  const me = await getMe();
  if (
    !me ||
    (typeof me.role === 'string' ? me.role.toUpperCase() !== 'ADMIN' : true)
  ) {
    redirect('/');
  }

  return <AdminShell me={{ id: me.id, name: me.name, role: me.role }} />;
}
