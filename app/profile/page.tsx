'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProfileSettings from '../../components/profile/ProfileSettings';
import RentedCars from '../../components/profile/RentedCars';
import UserReviews from '../../components/profile/UserReviews';
import LikedCars from '../../components/profile/LikedCars';
import ProfileSidebar from '../../components/profile/ProfileSidebar';

interface User {
  id: number;
  email: string;
  name?: string;
  role: string;
}

type TabType = 'profile' | 'rentals' | 'reviews' | 'favorites';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (!res.ok) {
        router.push('/signin');
        return;
      }

      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      router.push('/signin');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">
            Manage your account and preferences
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <ProfileSidebar
              user={user}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <ProfileSettings user={user} onUpdate={loadUser} />
            )}
            {activeTab === 'rentals' && <RentedCars userId={user.id} />}
            {activeTab === 'reviews' && <UserReviews userId={user.id} />}
            {activeTab === 'favorites' && <LikedCars userId={user.id} />}
          </div>
        </div>
      </div>
    </div>
  );
}
