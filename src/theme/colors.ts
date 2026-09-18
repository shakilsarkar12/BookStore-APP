/**
 * Literary & Editorial Color System for the Book Store Mobile App.
 * Tailored for high contrast, clean typography, and 60fps rendering.
 */

export const colors = {
  // Primary Brand - Midnight / Oxford Blue
  primary: '#0F172A',
  primaryLight: '#1E293B',
  primaryDark: '#020617',

  // Accent Brand - Warm Antique Amber / Gold Foil
  accent: '#D97706',
  accentLight: '#FBBF24',
  accentDark: '#B45309',
  accentMuted: '#FEF3C7',

  // Neutral Backgrounds
  background: '#F8FAFC',
  card: '#FFFFFF',
  surface: '#F1F5F9',
  surfaceSubtle: '#F8FAFC',

  // Typography
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  textAccent: '#B45309',

  // Structural & Borders
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  divider: '#CBD5E1',

  // Status & Feedback
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  rating: '#F59E0B',

  // Overlays
  overlay: 'rgba(15, 23, 42, 0.6)',
  skeleton: '#E2E8F0',
} as const;

export type ColorName = keyof typeof colors;
