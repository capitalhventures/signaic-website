"use client";

interface SignaicBrandProps {
  className?: string;
  variant?: "logo" | "inline";
}

export function SignaicBrand({ className, variant = "inline" }: SignaicBrandProps) {
  if (variant === "inline") {
    return <span className={className}>SIG/NAIC</span>;
  }

  return (
    <span className={className}>
      SIG<span style={{ color: "#00D4FF" }}>/</span>N
      <span style={{ color: "#00D4FF" }}>AI</span>C
    </span>
  );
}
