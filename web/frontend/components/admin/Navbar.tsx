"use client";

import { Menu, LogOut } from "lucide-react";

export interface NavbarProps {
  onMenuClick: () => void;
  onLogout: () => void;
}

export function Navbar({ onMenuClick, onLogout }: NavbarProps) {
  return (
    <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
      <button aria-label="Open menu" className="lg:hidden text-white" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="text-xl sm:text-2xl font-semibold">Admin Dashboard</h1>
      <button aria-label="Logout" onClick={onLogout} className="inline-flex items-center gap-1 rounded-md bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 text-sm">
        <LogOut className="h-4 w-4"/>
        <span className="hidden sm:inline">Logout</span>
      </button>
    </div>
  );
}
