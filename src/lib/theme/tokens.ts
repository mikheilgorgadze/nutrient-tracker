export const colors = {
  // Backgrounds
  background: '#0F0F0F',
  surface: '#1A1A1A',
  surfaceAlt: '#242424',
  border: '#2E2E2E',

  // Text
  textPrimary: '#F5F5F5',
  textSecondary: '#8A8A8A',
  textTertiary: '#555555',

  // Semantic
  accent: '#4ADE80',   // on-track / positive
  warning: '#FBBF24',  // approaching limit
  danger: '#FB7185',   // over limit / negative

  // Macros
  protein: '#60A5FA',
  carbs: '#FBBF24',
  fat: '#F97316',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 22,
  xl: 28,
  display: 36,
  hero: 52,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

const tokens = { colors, spacing, fontSize, fontWeight, borderRadius };
export default tokens;
