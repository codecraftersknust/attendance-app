"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Flag, Smartphone, CalendarClock, Users, ChevronLeft, Sun, Moon, Activity, CheckSquare } from "lucide-react";
import { NavItem } from "./NavItem";

export interface SidebarProps {
  active: string;
  onSelect: (key: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function Sidebar({ active, onSelect, mobileOpen, setMobileOpen }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("admin_sidebar_collapsed");
    setCollapsed(saved === "1");
  }, []);

  useEffect(() => {
    localStorage.setItem("admin_sidebar_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  const items = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "flagged", label: "Flagged", icon: Flag },
    { key: "imei", label: "IMEI Resets", icon: Smartphone },
    { key: "sessions", label: "Sessions", icon: CalendarClock },
    { key: "users", label: "Users", icon: Users },
    { key: "activity", label: "Activity", icon: Activity },
    { key: "manual", label: "Manual Mark", icon: CheckSquare },
  ];

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            aria-label="Sidebar overlay"
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {(mobileOpen || true) && (
          <motion.aside
            aria-label="Admin navigation"
            className="fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white dark:bg-slate-900 lg:static"
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            style={{ width: collapsed ? 80 : 288 }}
          >
            <div className="flex items-center justify-between gap-2 px-3 py-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-blue-600" />
                {!collapsed && <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Admin</span>}
              </div>
              <button
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="rounded-md p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 hidden lg:inline-flex"
                onClick={() => setCollapsed(v => !v)}
              >
                <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
                  <ChevronLeft className="h-4 w-4" />
                </motion.div>
              </button>
            </div>

            <nav className="px-2 pb-3 space-y-1">
              {items.map(it => (
                <NavItem
                  key={it.key}
                  icon={it.icon}
                  label={it.label}
                  active={active === it.key}
                  collapsed={collapsed}
                  onClick={() => { onSelect(it.key); setMobileOpen(false); }}
                />
              ))}
            </nav>

            <div className="mt-auto px-2 pb-3">
              <DarkModeToggle collapsed={collapsed} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

function DarkModeToggle({ collapsed }: { collapsed: boolean }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      {dark ? <Moon className="h-5 w-5"/> : <Sun className="h-5 w-5"/>}
      {!collapsed && <span className="text-sm font-medium">{dark ? 'Dark' : 'Light'} mode</span>}
    </button>
  );
}
