"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

interface CitationProps {
  number: number;
  title: string;
  source: string;
  url?: string;
  snippet?: string;
  className?: string;
}

export function Citation({
  number,
  title,
  source,
  url,
  snippet,
  className,
}: CitationProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <span className="relative inline-block">
      <button
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
        onClick={() => url && window.open(url, "_blank")}
        className={cn(
          "inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold",
          "bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 transition-colors cursor-pointer",
          className
        )}
      >
        {number}
      </button>
      {showPreview && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-white rounded-lg shadow-elevated border border-slate-200 text-left">
          <p className="text-sm font-medium text-slate-900 line-clamp-2">
            {title}
          </p>
          <p className="text-xs text-brand-cyan mt-1">{source}</p>
          {snippet && (
            <p className="text-xs text-slate-500 mt-2 line-clamp-3">
              {snippet}
            </p>
          )}
        </div>
      )}
    </span>
  );
}
