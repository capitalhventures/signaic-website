"use client";

import { cn } from "@/lib/utils";

type CardVariant = "default" | "highlighted" | "alert";

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
  padding?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-white border border-slate-200 shadow-card",
  highlighted: "bg-white border border-brand-cyan/20 shadow-card ring-1 ring-brand-cyan/10",
  alert: "bg-red-50 border border-red-200 shadow-card",
};

export function Card({
  children,
  variant = "default",
  className,
  padding = true,
  style,
  onClick,
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl transition-shadow hover:shadow-card-hover",
        variantStyles[variant],
        padding && "p-6",
        className
      )}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4", className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={cn("text-lg font-semibold text-slate-900", className)}>
      {children}
    </h3>
  );
}

export function CardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("p-6", className)}>
      {children}
    </div>
  );
}

export function CardDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-sm text-slate-500 mt-1", className)}>
      {children}
    </p>
  );
}
