"use client";

import React from "react";
import NavItem from "./NavItem";
import SignOutButton from "../auth/SignOutButton";

export default function Sidebar({
  active,
  setActive,
  isLoggedIn,
  role,
}: {
  active: string;
  setActive: (s: string) => void;
  isLoggedIn: boolean;
  role?: "user" | "company" | "admin" | null;
}) {
  const navItems: { label: string; key: string; href?: string }[] = [];

  if (role === "user") {
    navItems.push(
      { label: "Home", key: "home", href: "/" },
      { label: "Browse Cars", key: "browse", href: "/browse" },
      { label: "My Rentals", key: "rentals", href: "/rentals" },
      { label: "Profile", key: "profile", href: "/profile" }
    );
  } else if (role === "company") {
    navItems.push(
      { label: "Dashboard", key: "dashboard", href: "/company" },
      { label: "Add Car", key: "add-car", href: "/company?tab=add-car" },
      { label: "Manage Cars", key: "manage-cars", href: "/company?tab=manage-cars" },
      { label: "Profile", key: "profile", href: "/profile" }
    );
  } else if (role === "admin") {
    navItems.push(
      { label: "Admin Panel", key: "admin-panel", href: "/admin" },
      { label: "Manage Users", key: "manage-users", href: "/admin/users" },
      { label: "Reports", key: "reports", href: "/admin/reports" }
    );
  } else {
    navItems.push({ label: "Home", key: "home", href: "/" });
  }

  return (
    <aside className="w-64 hidden md:flex flex-col bg-white border-r border-gray-200 min-h-screen p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-full bg-linear-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold">
          AR
        </div>
        <div>
          <h3 className="text-lg font-semibold">Smart Rent</h3>
          <h4 className="text-sm text-gray-500">Drive Safe</h4>
        </div>
      </div>

      <nav className="flex-1">
        {navItems.map((item) => (
          <a
            key={item.key}
            href={item.href || "#"}
            onClick={() => setActive(item.key)}
            className="block"
          >
            <NavItem
              label={item.label}
              active={active === item.key}
              onClick={() => setActive(item.key)}
            />
          </a>
        ))}
      </nav>

      <div className="mt-auto">
        {isLoggedIn ? (
          <SignOutButton />
        ) : (
          <div className="flex gap-2">
            <a
              href="/signin"
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold text-center"
            >
              Sign In
            </a>
            <a
              href="/signup"
              className="px-3 py-2 border border-indigo-600 text-indigo-600 rounded-lg text-sm font-semibold text-center"
            >
              Sign Up
            </a>
          </div>
        )}
      </div>
    </aside>
  );
}
