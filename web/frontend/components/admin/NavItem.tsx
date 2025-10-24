"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ElementType } from "react";

export interface NavItemProps {
  icon: ElementType;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

export function NavItem({ icon: Icon, label, active, collapsed, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "group flex w-full items-center gap-3 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        active ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      )}
    >
      <Icon className={cn("h-5 w-5", active ? "text-blue-700" : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400")}/>
      <motion.span
        className="text-sm font-medium"
        initial={false}
        animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
        transition={{ duration: 0.2 }}
      >
        {collapsed ? null : label}
      </motion.span>
    </button>
  );
}
