"use client";

import React from "react";

export default function NavItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md mb-1 hover:bg-gray-50 ${
        active ? "bg-indigo-50 text-indigo-600 font-semibold" : "text-gray-700"
      }`}
    >
      <span className="h-4 w-4 rounded-sm bg-gray-200 flex items-center justify-center text-xs text-gray-500">
        {label[0].toUpperCase()}
      </span>
      <span>{label}</span>
    </button>
  );
}
