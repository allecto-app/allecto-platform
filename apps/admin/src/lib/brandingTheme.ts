import type { Doc } from "./convexGenerated";

const DEFAULT_PRIMARY = "#042940";
const DEFAULT_SECONDARY = "#9FC131";
const DEFAULT_ACCENT = "#005C53";

export const DEFAULT_BRANDING_COLORS = {
  primaryColor: DEFAULT_PRIMARY,
  secondaryColor: DEFAULT_SECONDARY,
  accentColor: DEFAULT_ACCENT,
};

type BrandingConfig = Doc<"condos">["branding"] | null | undefined;

type ResolvedColors = {
  primary: string;
  secondary: string;
  accent: string;
  primaryForeground: string;
  secondaryForeground: string;
  accentForeground: string;
};

const COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function sanitizeColor(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (COLOR_PATTERN.test(trimmed)) return trimmed.toUpperCase();
  return fallback;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  const expand = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;
  const value = parseInt(expand, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channels = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function getReadableTextColor(hex: string): string {
  return getLuminance(hex) > 0.5 ? "#1F2933" : "#FFFFFF";
}

function resolveColors(branding: BrandingConfig): ResolvedColors {
  const primary = sanitizeColor(branding?.primaryColor, DEFAULT_PRIMARY);
  const secondary = sanitizeColor(branding?.secondaryColor, DEFAULT_SECONDARY);
  const accent = sanitizeColor(branding?.accentColor, DEFAULT_ACCENT);

  return {
    primary,
    secondary,
    accent,
    primaryForeground: getReadableTextColor(primary),
    secondaryForeground: getReadableTextColor(secondary),
    accentForeground: getReadableTextColor(accent),
  };
}

function setCssVariable(key: string, value: string) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty(key, value);
}

export function applyBrandingTheme(branding: BrandingConfig) {
  if (typeof document === "undefined") return;

  const colors = resolveColors(branding);

  setCssVariable("--primary", colors.primary);
  setCssVariable("--primary-foreground", colors.primaryForeground);
  setCssVariable("--secondary", colors.secondary);
  setCssVariable("--secondary-foreground", colors.secondaryForeground);
  setCssVariable("--accent", colors.accent);
  setCssVariable("--accent-foreground", colors.accentForeground);

  setCssVariable("--sidebar-primary", colors.primary);
  setCssVariable("--sidebar-primary-foreground", colors.primaryForeground);
  setCssVariable("--sidebar-ring", colors.primary);
  setCssVariable("--ring", colors.primary);

  setCssVariable("--chart-1", colors.primary);
  setCssVariable("--chart-2", colors.secondary);
  setCssVariable("--chart-3", colors.accent);
}
