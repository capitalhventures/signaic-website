"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, ChevronDown } from "lucide-react";

interface ExportOption {
  label: string;
  onClick: () => void;
}

interface ExportButtonProps {
  label?: string;
  onExport?: () => void;
  options?: ExportOption[];
}

export function ExportButton({ label = "Export PDF", onExport, options }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!options || options.length === 0) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={onExport}
        className="border-[#e2e4e8] text-[#333333] text-sm hover:bg-[#f0f2f5] gap-1.5 h-9"
      >
        <Download className="w-3.5 h-3.5" />
        {label}
      </Button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(!open)}
        className="border-[#e2e4e8] text-[#333333] text-sm hover:bg-[#f0f2f5] gap-1.5 h-9"
      >
        <Download className="w-3.5 h-3.5" />
        {label}
        <ChevronDown className="w-3 h-3 ml-1" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[200px] bg-white rounded-lg border border-[#e2e4e8] shadow-lg py-1 max-h-64 overflow-y-auto">
          {options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => {
                option.onClick();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-[#333333] hover:bg-[#f5f6f8] transition-colors"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
