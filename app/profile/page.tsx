import React from 'react';
import { redirect } from 'next/navigation';
import ProfileSettings from '../../components/profile/ProfileSettings';
import RentedCars from '../../components/profile/RentedCars';
import UserReviews from '../../components/profile/UserReviews';
import LikedCars from '../../components/profile/LikedCars';
import ProfileSidebar from '../../components/profile/ProfileSidebar';
import { getAuthUser } from '@/lib/auth';
import { ReviewRepository } from '@/lib/repository/ReviewRepository';

type TabType = 'profile' | 'rentals' | 'reviews' | 'favorites';

interface ProfilePageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export interface ProfilePageUser {
  id: number;
  email: string;
  role: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  dateOfBirth?: string | Date;
  avatar?: string;
}

function getSingleQueryValue(
  value: string | string[] | undefined,
): string | null {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && value.length > 0) {
    return value[0] ?? null;
  }

  return null;
}

function parseTab(value: string | null): TabType {
  switch (value) {
    case 'profile':
    case 'rentals':
    case 'reviews':
    case 'favorites':
      return value;
    default:
      return 'profile';
  }
}

function parsePage(value: string | null): number {
  if (!value) {
    return 1;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 1;
  }

  return parsed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toProfileUser(value: unknown): ProfilePageUser | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = value.id;
  const email = value.email;
  const role = value.role;

  if (typeof id !== 'number' || typeof email !== 'string') {
    return null;
  }

  return {
    id,
    email,
    role: typeof role === 'string' ? role : 'USER',
    name: typeof value.name === 'string' ? value.name : undefined,
    phone: typeof value.phone === 'string' ? value.phone : undefined,
    address: typeof value.address === 'string' ? value.address : undefined,
    city: typeof value.city === 'string' ? value.city : undefined,
    country: typeof value.country === 'string' ? value.country : undefined,
    postalCode:
      typeof value.postalCode === 'string' ? value.postalCode : undefined,
    dateOfBirth:
      typeof value.dateOfBirth === 'string' || value.dateOfBirth instanceof Date
        ? value.dateOfBirth
        : undefined,
    avatar: typeof value.avatar === 'string' ? value.avatar : undefined,
  };
}

function extractUser(authValue: unknown): ProfilePageUser | null {
  const directUser = toProfileUser(authValue);
  if (directUser) {
    return directUser;
  }

  if (!isRecord(authValue)) {
    return null;
  }

  const nestedKeys = ['user', 'data', 'currentUser', 'authUser'] as const;

  for (const key of nestedKeys) {
    const nestedValue = authValue[key];
    const nestedUser = toProfileUser(nestedValue);

    if (nestedUser) {
      return nestedUser;
    }

    if (isRecord(nestedValue) && 'user' in nestedValue) {
      const doubleNestedUser = toProfileUser(nestedValue.user);
      if (doubleNestedUser) {
        return doubleNestedUser;
      }
    }
  }

  return null;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const authValue = await getAuthUser();
  const user = extractUser(authValue);

  if (!user) {
    redirect('/signin');
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const activeTab = parseTab(getSingleQueryValue(resolvedSearchParams.tab));
  const currentPage = parsePage(getSingleQueryValue(resolvedSearchParams.page));

  const reviewsResult =
    activeTab === 'reviews'
      ? await ReviewRepository.findByUserPaginated(user.id, currentPage, 6)
      : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-1 text-gray-600">
            Manage your account and preferences
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <ProfileSidebar
              user={{
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
              }}
              activeTab={activeTab}
            />
          </div>

          <div className="lg:col-span-3">
            {activeTab === 'profile' && <ProfileSettings user={user} />}

            {activeTab === 'rentals' && <RentedCars userId={user.id} />}

            {activeTab === 'reviews' && (
              <UserReviews
                reviews={reviewsResult?.reviews ?? []}
                currentPage={reviewsResult?.currentPage ?? 1}
                totalPages={reviewsResult?.totalPages ?? 1}
                totalCount={reviewsResult?.totalCount ?? 0}
              />
            )}

            {activeTab === 'favorites' && <LikedCars userId={user.id} />}
          </div>
        </div>
      </div>
    </div>
  );
}
