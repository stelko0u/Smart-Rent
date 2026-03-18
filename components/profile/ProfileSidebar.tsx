'use client';

import {
  ArrowLeftFromBracket,
  Clipboard,
  EmptyStar,
  Heart,
  House,
  User,
} from '../icons';
import { useRouter } from 'next/dist/client/components/navigation';

interface User {
  id: number;
  email: string;
  name?: string;
  role: string;
  avatar?: string;
}

interface Props {
  user: User;
  activeTab: string;
  onTabChange: (tab: 'profile' | 'rentals' | 'reviews' | 'favorites') => void;
}

export default function ProfileSidebar({
  user,
  activeTab,
  onTabChange,
}: Props) {
  const router = useRouter();

  const handleExitToHome = () => {
    router.push('/');
  };
  const menuItems = [
    {
      id: 'profile',
      label: 'Profile Settings',
      icon: <User className="w-5 h-5" />,
    },
    {
      id: 'rentals',
      label: 'My Rentals',
      icon: <Clipboard className="w-5 h-5" />,
    },
    {
      id: 'reviews',
      label: 'My Reviews',
      icon: <EmptyStar className="w-5 h-5" />,
    },
    {
      id: 'favorites',
      label: 'Liked Cars',
      icon: <Heart className="w-5 h-5" />,
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b bg-linear-to-br from-indigo-500 to-purple-600 text-white">
        <div className="flex items-center gap-4">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name || 'User'}
              className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/20 border-4 border-white flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold">
                {(user.name || user.email)[0].toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">
              {user.name || 'User'}
            </h3>
            <p className="text-sm text-white/80 truncate">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded text-xs">
              {user.role}
            </span>
          </div>
        </div>
      </div>

      <nav className="p-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id as any)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition mb-1 ${
              activeTab === item.id
                ? 'bg-indigo-50 text-indigo-600 font-medium'
                : 'text-gray-700 hover:bg-gray-50 cursor-pointer'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
        <button
          onClick={handleExitToHome}
          className="w-full flex items-center gap-3 px-4 py-3 transition mb-1 text-gray-700 hover:bg-gray-50 mt-2 border-t border-amber-600 pt-3 cursor-pointer"
        >
          <ArrowLeftFromBracket className="w-5 h-5" />
          <span>Back to Home</span>
        </button>
      </nav>
    </div>
  );
}
