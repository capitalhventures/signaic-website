"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface CollapsibleStatusGroupProps {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badgeColor?: string;
}

export function CollapsibleStatusGroup({
  title,
  count,
  defaultOpen = true,
  children,
  badgeColor = "bg-[#f0f2f5] text-[#666666]",
}: CollapsibleStatusGroupProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2.5 bg-[#f8f9fb] hover:bg-[#f0f2f5] rounded-md transition-colors group"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-[#666666]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[#666666]" />
        )}
        <span className="text-sm font-semibold text-[#333333] font-[family-name:var(--font-chakra-petch)]">
          {title}
        </span>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>
          {count}
        </span>
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  );
}
