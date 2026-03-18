'use client';

import React from 'react';

export default function NavItem({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md mb-1 hover:bg-gray-100 cursor-pointer hover:scale-105 transition-all ${
        active ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-700'
      }`}
    >
      <span className="h-5 w-5 rounded-sm  flex items-center justify-center text-xs ">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}
