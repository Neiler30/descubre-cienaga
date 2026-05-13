// Descubre Ciénaga — Design System
export const Colors = {
  // Backgrounds
  bgDeep: '#070B14',
  bgPrimary: '#0A0E1A',
  bgSurface: '#111827',
  bgCard: '#1A2035',
  bgCardAlt: '#1E2845',

  // Brand
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#1D4ED8',

  // Accents
  gold: '#F59E0B',
  goldLight: '#FCD34D',
  success: '#10B981',
  successLight: '#34D399',
  purple: '#8B5CF6',
  purpleLight: '#A78BFA',
  danger: '#EF4444',
  pink: '#EC4899',

  // Text
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#4B5563',
  textInverse: '#0A0E1A',

  // Borders
  border: '#1F2937',
  borderLight: '#374151',

  // Overlays
  overlay: 'rgba(0,0,0,0.7)',
  overlayLight: 'rgba(10,14,26,0.85)',
  glass: 'rgba(26,32,53,0.8)',
  glassLight: 'rgba(59,130,246,0.08)',

  // Gradients (as arrays for LinearGradient)
  gradientHero: ['#0A0E1A', '#0D1A3A', '#0A0E1A'] as string[],
  gradientCard: ['#1A2035', '#111827'] as string[],
  gradientGold: ['#F59E0B', '#D97706'] as string[],
  gradientBlue: ['#3B82F6', '#1D4ED8'] as string[],
  gradientPurple: ['#8B5CF6', '#6D28D9'] as string[],
  gradientGreen: ['#10B981', '#059669'] as string[],
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  display: 34,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  blue: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  gold: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};
