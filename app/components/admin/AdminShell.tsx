"use client";

import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminDashboard from "./AdminDashboard";
import AdminCompanies from "./AdminCompanies";
import AdminAddCompany from "./AdminAddCompany";
import AdminCars from "./AdminCars";

export default function AdminShell({ me }: { me: any }) {
  const [active, setActive] = useState<string>("dashboard");

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="flex">
        <AdminSidebar active={active} setActive={setActive} />
        <main className="flex-1 p-6">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold">Admin — {me?.name ?? "User"}</h1>
            <p className="text-sm text-gray-500">Use the sidebar to navigate</p>
          </header>

          {active === "dashboard" && <AdminDashboard />}
          {active === "companies" && <AdminCompanies />}
          {active === "add-company" && <AdminAddCompany />}
          {active === "cars" && <AdminCars />} {/* new panel */}
        </main>
      </div>
    </div>
  );
}