import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "outline"
  | "cyan"
  | "company"
  | "agency"
  | "program"
  | "high"
  | "medium"
  | "low"
  | "fcc"
  | "sec"
  | "patent"
  | "contract"
  | "news"
  | "orbital";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-600 border-slate-200",
  outline: "bg-transparent text-slate-600 border-slate-300",
  cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
  company: "bg-blue-50 text-blue-700 border-blue-200",
  agency: "bg-purple-50 text-purple-700 border-purple-200",
  program: "bg-indigo-50 text-indigo-700 border-indigo-200",
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-slate-500 border-slate-200",
  fcc: "bg-emerald-50 text-emerald-700 border-emerald-200",
  sec: "bg-violet-50 text-violet-700 border-violet-200",
  patent: "bg-orange-50 text-orange-700 border-orange-200",
  contract: "bg-teal-50 text-teal-700 border-teal-200",
  news: "bg-sky-50 text-sky-700 border-sky-200",
  orbital: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
