"use client";

import React from "react";

export default function AdminSidebar({
  active,
  setActive,
}: {
  active: string;
  setActive: (s: string) => void;
}) {
  const items = [
    { key: "dashboard", label: "Dashboard" },
    { key: "companies", label: "Manage Companies" },
    { key: "add-company", label: "Add Company" },
    { key: "cars", label: "Manage Cars" },
  ];

  return (
    <aside className="w-64 hidden md:flex flex-col bg-white border-r border-gray-200 min-h-screen p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
          AD
        </div>
        <div>
          <h3 className="text-lg font-semibold">Admin Panel</h3>
          <p className="text-sm text-gray-500">Site administration</p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => setActive(it.key)}
            className={
              "w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 " +
              (active === it.key ? "bg-indigo-50 border border-indigo-200" : "")
            }
          >
            {it.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto">
        <a href="/" className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-800">
          Back to site
        </a>
      </div>
    </aside>
  );
}
