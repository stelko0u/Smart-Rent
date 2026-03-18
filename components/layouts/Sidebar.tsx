'use client';

import React from 'react';
import NavItem from './NavItem';
import SignOutButton from '../auth/SignOutButton';
import {
  Car,
  CarKey,
  Cars,
  ChartLine,
  House,
  MagnifyingGlassPlus,
  ScrewdriverWrench,
  TriangleExclamation,
  User,
  UsersGear,
} from '../icons';

export default function Sidebar({
  active,
  setActive,
  isLoggedIn,
  role,
}: {
  active: string;
  setActive: (s: string) => void;
  isLoggedIn: boolean;
  role?: 'user' | 'company' | 'admin' | null;
}) {
  const navItems: {
    label: string;
    key: string;
    href?: string;
    icon?: React.ReactNode;
  }[] = [];

  if (role === 'user') {
    navItems.push(
      {
        label: 'Home',
        key: 'home',
        href: '/',
        icon: <House className="w-6 h-6" />,
      },
      {
        label: 'Browse Cars',
        key: 'browse',
        href: '/',
        icon: <MagnifyingGlassPlus className="w-6 h-6" />,
      },
      {
        label: 'My Rentals',
        key: 'rentals',
        href: 'profile?tab=rentals',
        icon: <CarKey className="w-6 h-6" />,
      },
      {
        label: 'Profile',
        key: 'profile',
        href: '/profile',
        icon: <User className="w-6 h-6" />,
      },
    );
  } else if (role === 'company') {
    navItems.push(
      {
        label: 'Dashboard',
        key: 'dashboard',
        href: '/company?tab=dashboard',
        icon: <ChartLine className="w-6 h-6" />,
      },
      {
        label: 'Add Car',
        key: 'add-car',
        href: '/company?tab=add-car',
        icon: <Car className="w-6 h-6" />,
      },
      {
        label: 'Manage Cars',
        key: 'manage-cars',
        href: '/company?tab=manage-cars',
        icon: <Cars className="w-6 h-6" />,
      },
      {
        label: 'Profile',
        key: 'profile',
        href: '/profile',
        icon: <User className="w-6 h-6" />,
      },
    );
  } else if (role === 'admin') {
    navItems.push(
      {
        label: 'Admin Panel',
        key: 'admin-panel',
        href: '/admin',
        icon: <ScrewdriverWrench className="w-6 h-6" />,
      },
      {
        label: 'Manage Users',
        key: 'manage-users',
        href: '/admin?tab=users',
        icon: <UsersGear className="w-6 h-6" />,
      },
      {
        label: 'Reports',
        key: 'reports',
        href: '/admin/reports',
        icon: <TriangleExclamation className="w-6 h-6" />,
      },
    );
  } else {
    navItems.push({
      label: 'Home',
      key: 'home',
      href: '/',
      icon: <House className="w-6 h-6" />,
    });
  }

  return (
    <aside className="w-64 hidden md:flex flex-col bg-white border-r border-gray-200 min-h-screen p-6">
      <div className="flex items-center gap-3">
        <img
          src="/logo.png"
          alt="Smart Rent Logo"
          className="h-24 w-24 object-contain"
        />
        <div>
          <h3 className="text-lg font-semibold">Smart Rent</h3>
          <h4 className="text-sm text-gray-500">Drive Safe</h4>
        </div>
      </div>

      <nav className="flex-1">
        {navItems.map((item) => (
          <a
            key={item.key}
            href={item.href || '#'}
            onClick={() => setActive(item.key)}
            className="block cursor-pointer"
          >
            <NavItem
              label={item.label}
              active={active === item.key}
              onClick={() => setActive(item.key)}
              icon={item.icon}
            />
          </a>
        ))}
      </nav>

      <div className="mt-auto">
        {isLoggedIn ? (
          <SignOutButton />
        ) : (
          <div className="flex gap-2 flex-col">
            <a
              href="/signin"
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold text-center cursor-pointer hover:scale-102 transition-all"
            >
              Sign In
            </a>
            <a
              href="/signup"
              className="px-3 py-2 border border-indigo-600 text-indigo-600 rounded-lg text-sm font-semibold text-center cursor-pointer hover:scale-102 transition-all"
            >
              Sign Up
            </a>
          </div>
        )}
      </div>
    </aside>
  );
}
