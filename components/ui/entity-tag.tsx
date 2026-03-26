import Link from "next/link";
import { cn } from "@/lib/utils";

interface EntityTagProps {
  name: string;
  slug: string;
  type?: "company" | "agency" | "program";
  className?: string;
}

const typeColors = {
  company: "bg-blue-50 text-blue-700 hover:bg-blue-100",
  agency: "bg-purple-50 text-purple-700 hover:bg-purple-100",
  program: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
};

export function EntityTag({
  name,
  slug,
  type = "company",
  className,
}: EntityTagProps) {
  return (
    <Link
      href={`/dashboard/entities/${slug}`}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-colors",
        typeColors[type],
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {name}
    </Link>
  );
}
