"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, ScanLine, BarChart3, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/host/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/host/events", label: "Events", icon: CalendarDays },
  { href: "/host/scan", label: "Scan", icon: ScanLine },
  { href: "/host/reports", label: "Reports", icon: BarChart3 },
];

interface HostSidebarProps {
  hostName: string;
  hostEmail: string;
}

export function HostSidebar({ hostName, hostEmail }: HostSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white flex-col z-40">
        <div className="px-6 py-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <ScanLine size={18} strokeWidth={2} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">TimApp</p>
              <p className="text-slate-400 text-xs">Host Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href} className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}>
                <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-slate-700">
          <div className="mb-3">
            <p className="text-white text-sm font-medium truncate">{hostName}</p>
            <p className="text-slate-400 text-xs truncate">{hostEmail}</p>
          </div>
          <a href="/host/logout" className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition-colors">
            <LogOut size={16} />
            Sign Out
          </a>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 text-white flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
            <ScanLine size={15} strokeWidth={2} />
          </div>
          <span className="font-bold text-sm">TimApp Host</span>
        </div>
        <a href="/host/logout" className="text-slate-400 hover:text-white p-1">
          <LogOut size={18} />
        </a>
      </header>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-40 flex">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} className={cn(
              "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors",
              active ? "text-blue-400" : "text-slate-400"
            )}>
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
