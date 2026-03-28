"use client";

interface SignaicLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  variant?: "dark" | "light";
}

const sizeClasses = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-4xl",
  xl: "text-6xl",
};

const taglineSizes = {
  sm: "text-[8px] tracking-[3px]",
  md: "text-[10px] tracking-[4px]",
  lg: "text-[12px] tracking-[6px]",
  xl: "text-[14px] tracking-[6px]",
};

export function SignaicLogo({
  size = "md",
  showTagline = true,
  variant = "dark",
}: SignaicLogoProps) {
  const textColor = variant === "dark" ? "text-white" : "text-[#111111]";
  const taglineColor = variant === "dark" ? "text-[#888]" : "text-[#666666]";

  return (
    <div className="flex flex-col items-center">
      <span
        className={`font-[family-name:var(--font-chakra-petch)] font-bold ${sizeClasses[size]}`}
      >
        <span className={textColor}>SIG</span>
        <span className="text-[#00D4FF] font-light">/</span>
        <span className={textColor}>N</span>
        <span className="text-[#00D4FF]">AI</span>
        <span className={textColor}>C</span>
      </span>
      {showTagline && (
        <span
          className={`font-[family-name:var(--font-chakra-petch)] uppercase ${taglineColor} ${taglineSizes[size]}`}
        >
          Space Intelligence
        </span>
      )}
    </div>
  );
}
