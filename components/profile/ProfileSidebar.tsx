'use client';

import React from 'react';
import {
  ArrowLeftFromBracket,
  Clipboard,
  EmptyStar,
  Heart,
  User,
} from '../icons';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface UserProfileSummary {
  id: number;
  email: string;
  name?: string;
  role: string;
  avatar?: string;
}

type MenuItemId = 'profile' | 'rentals' | 'reviews' | 'favorites';

interface ProfileSidebarProps {
  user: UserProfileSummary;
  activeTab: MenuItemId;
}

interface MenuItem {
  id: MenuItemId;
  label: string;
  icon: React.ReactElement;
}

export default function ProfileSidebar({
  user,
  activeTab,
}: ProfileSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleExitToHome = () => {
    router.push('/');
  };

  const handleTabChange = (tab: MenuItemId) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set('tab', tab);

    if (tab === 'reviews') {
      params.set('page', '1');
    } else {
      params.delete('page');
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const menuItems: MenuItem[] = [
    {
      id: 'profile',
      label: 'Profile Settings',
      icon: <User className="h-5 w-5" />,
    },
    {
      id: 'rentals',
      label: 'My Rentals',
      icon: <Clipboard className="h-5 w-5" />,
    },
    {
      id: 'reviews',
      label: 'My Reviews',
      icon: <EmptyStar className="h-5 w-5" />,
    },
    {
      id: 'favorites',
      label: 'Liked Cars',
      icon: <Heart className="h-5 w-5" />,
    },
  ];

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="border-b bg-linear-to-br from-indigo-500 to-purple-600 p-6 text-white">
        <div className="flex items-center gap-4">
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar}
              alt={user.name || 'User'}
              className="h-16 w-16 rounded-full border-4 border-white shadow-lg"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 shadow-lg">
              <span className="text-2xl font-bold">
                {(user.name || user.email)[0].toUpperCase()}
              </span>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold">
              {user.name || 'User'}
            </h3>
            <p className="truncate text-sm text-white/80">{user.email}</p>
            <span className="mt-1 inline-block rounded bg-white/20 px-2 py-0.5 text-xs">
              {user.role}
            </span>
          </div>
        </div>
      </div>

      <nav className="p-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleTabChange(item.id)}
            className={`mb-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 transition ${
              activeTab === item.id
                ? 'bg-indigo-50 font-medium text-indigo-600'
                : 'cursor-pointer text-gray-700 hover:bg-gray-50'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}

        <button
          type="button"
          onClick={handleExitToHome}
          className="mt-2 flex w-full cursor-pointer items-center gap-3 border-t border-amber-600 px-4 py-3 pt-3 text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeftFromBracket className="h-5 w-5" />
          <span>Back to Home</span>
        </button>
      </nav>
    </div>
  );
}
