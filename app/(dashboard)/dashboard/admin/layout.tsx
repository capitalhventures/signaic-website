import { requireAdmin } from "@/lib/admin";
import Link from "next/link";
import {
  Shield,
  Bot,
  DollarSign,
} from "lucide-react";

const adminNav = [
  { label: "Overview", href: "/dashboard/admin", icon: Shield },
  { label: "Agents", href: "/dashboard/admin/agents", icon: Bot },
  { label: "Financial", href: "/dashboard/admin/financial", icon: DollarSign },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side admin gate — redirects non-admins to /dashboard
  await requireAdmin();

  return (
    <div>
      {/* Admin header bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-brand-cyan" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-wide">
              ADMIN PANEL
            </h2>
            <p className="text-xs text-slate-400">
              Restricted access — authorized personnel only
            </p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Admin sub-nav */}
      <div className="flex items-center gap-1 mb-6 border-b border-slate-200 pb-3">
        {adminNav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
