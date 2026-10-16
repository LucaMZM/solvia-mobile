export const colors = {
  background: '#07111f',
  surface: '#101d31',
  surfaceDim: '#0b1628',
  surfaceBright: '#2c4767',
  surfaceContainerLowest: '#12233a',
  surfaceContainerLow: '#162943',
  surfaceContainer: '#1b3150',
  surfaceContainerHigh: '#254263',
  surfaceContainerHighest: '#315981',
  onSurface: '#f6f8ff',
  onSurfaceVariant: '#d2dced',
  primary: '#f8fbff',
  secondary: '#93c5ff',
  tertiaryFixedDim: '#ffd08a',
  outline: '#a8b8d2',
  outlineVariant: '#435b7b',
  rainy: '#88add5',
  warning: '#ffc36d',
  success: '#8fdbb2',
  danger: '#ff8f9c',
  navyShadow: '#020815',
} as const;

export const spacing = {
  unit: 8,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  section: 20,
  pageHorizontal: 14,
  pageTop: 16,
  bottomInset: 112,
  cardPadding: 16,
  cardInnerGap: 12,
  screenGap: 14,
  headerHeight: 56,
  heroPadding: 22,
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

export const fontFamilies = {
  serif: 'Inter_500Medium',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
} as const;

export const typography = {
  display: {
    fontFamily: fontFamilies.serif,
    fontSize: 56,
    lineHeight: 62,
    letterSpacing: -1,
  },
  headline: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.45,
  },
  title: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.28,
  },
  bodyLg: {
    fontFamily: fontFamilies.sans,
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: 0.1,
  },
  body: {
    fontFamily: fontFamilies.sans,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.06,
  },
  functional: {
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.15,
  },
  labelCaps: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.95,
  },
  tabLabel: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.12,
  },
} as const;

export const elevation = {
  card: {
    shadowColor: colors.navyShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 3,
  },
} as const;

export const appTheme = {
  colors,
  spacing,
  radii,
  typography,
  fontFamilies,
  elevation,
} as const;

export type AppTheme = typeof appTheme;
