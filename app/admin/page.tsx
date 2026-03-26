import React from 'react';
import { redirect } from 'next/navigation';
import AdminShell from '../../components/admin/AdminShell';
import { getAuthUser } from '../../lib/auth';

export default async function AdminPage() {
  const authUser = await getAuthUser();
  if (
    !authUser ||
    (typeof authUser.role === 'string'
      ? authUser.role.toUpperCase() !== 'ADMIN'
      : true)
  ) {
    redirect('/');
  }

  return (
    <AdminShell
      me={{ id: authUser.id, name: authUser.name, role: authUser.role }}
    />
  );
}
