"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface CollapsibleCardProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
}

export function CollapsibleCard({
  title,
  children,
  defaultOpen = false,
  className,
  headerClassName,
}: CollapsibleCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 shadow-card transition-shadow hover:shadow-card-hover overflow-hidden",
        className
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-6 text-left",
          headerClassName
        )}
      >
        <div className="flex-1 min-w-0">{title}</div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ml-4",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-6 border-t border-slate-100 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}
