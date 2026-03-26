import type { Role } from '@/types/home';

export function normalizeRole(role: unknown): Role {
  if (typeof role !== 'string') return null;

  const normalizedRole = role.trim().toLowerCase();

  switch (normalizedRole) {
    case 'manager':
      return 'company';

    case 'user':
    case 'company':
    case 'admin':
      return normalizedRole;

    default:
      return null;
  }
}
