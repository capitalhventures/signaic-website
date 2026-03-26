// Signaic Design Tokens
// Defense-grade intelligence aesthetic

export const colors = {
  // Brand
  brand: {
    cyan: "#06b6d4",
    cyanLight: "#22d3ee",
    cyanDark: "#0891b2",
  },

  // Backgrounds
  bg: {
    dark: "#0f172a", // slate-900 - landing, sidebar
    darkElevated: "#1e293b", // slate-800
    light: "#f8fafc", // slate-50 - dashboard
    card: "#ffffff",
  },

  // Text
  text: {
    primary: "#0f172a", // slate-900
    secondary: "#64748b", // slate-500
    muted: "#94a3b8", // slate-400
    onDark: "#f1f5f9", // slate-100
    onDarkMuted: "#94a3b8", // slate-400
  },

  // Status
  status: {
    success: "#10b981", // emerald-500
    warning: "#f59e0b", // amber-500
    danger: "#ef4444", // red-500
  },

  // Impact levels
  impact: {
    high: "#ef4444", // red-500
    medium: "#f59e0b", // amber-500
    low: "#94a3b8", // slate-400
  },
} as const;

export const spacing = {
  sidebar: "280px",
  topBar: "64px",
  pagePadding: "32px",
  cardPadding: "24px",
  sectionGap: "32px",
} as const;

export const typography = {
  fonts: {
    sans: "'Space Grotesk', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
    display: "'Orbitron', sans-serif",
  },
  sizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
  },
} as const;
