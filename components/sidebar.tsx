"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Building2,
  BookOpen,
  Database,
  Settings,
  Key,
  LogOut,
} from "lucide-react";

const intelligenceLinks = [
  {
    label: "Command Center",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Ask Raptor",
    href: "/dashboard/ask-raptor",
    icon: MessageSquare,
  },
  {
    label: "Orbital Brief",
    href: "/dashboard/orbital-brief",
    icon: FileText,
  },
  {
    label: "Entities",
    href: "/dashboard/entities",
    icon: Building2,
  },
];

const dataLinks = [
  {
    label: "Regulatory Guide",
    href: "/dashboard/regulatory-guide",
    icon: BookOpen,
  },
  {
    label: "Data Sources Status",
    href: "/dashboard/data-sources",
    icon: Database,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    label: "API Keys",
    href: "/dashboard/api-keys",
    icon: Key,
    comingSoon: true,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed right-0 top-0 bottom-0 w-[280px] bg-surface-dark border-l border-slate-800 flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-6">
        <Link href="/dashboard" className="block">
          <div className="font-display font-black text-2xl tracking-wider text-white select-none">
            SIG<span className="text-brand-cyan">/</span>N
            <span className="text-brand-cyan">AI</span>C
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto dark-scroll">
        {/* Intelligence Section */}
        <div className="mb-6">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
            Intelligence
          </p>
          <ul className="space-y-0.5">
            {intelligenceLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <li key={link.href} className="relative">
                  <Link
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      active
                        ? "bg-brand-cyan/10 text-brand-cyan"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <link.icon
                      className={cn(
                        "w-5 h-5",
                        active ? "text-brand-cyan" : "text-slate-400"
                      )}
                      fill={active ? "currentColor" : "none"}
                      strokeWidth={active ? 0 : 1.5}
                    />
                    {link.label}
                  </Link>
                  {active && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-brand-cyan rounded-l-full" />
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Data & Reference Section */}
        <div className="mb-6">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">
            Data & Reference
          </p>
          <ul className="space-y-0.5">
            {dataLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <li key={link.href} className="relative">
                  {link.comingSoon ? (
                    <span className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 cursor-not-allowed">
                      <link.icon className="w-5 h-5 text-slate-600" strokeWidth={1.5} />
                      {link.label}
                      <span className="ml-auto text-[10px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">
                        soon
                      </span>
                    </span>
                  ) : (
                    <>
                      <Link
                        href={link.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                          active
                            ? "bg-brand-cyan/10 text-brand-cyan"
                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        )}
                      >
                        <link.icon
                          className={cn(
                            "w-5 h-5",
                            active ? "text-brand-cyan" : "text-slate-500"
                          )}
                          strokeWidth={1.5}
                        />
                        {link.label}
                      </Link>
                      {active && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-brand-cyan rounded-l-full" />
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* User section */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-cyan/20 flex items-center justify-center">
            <span className="text-xs font-bold text-brand-cyan">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">User</p>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
