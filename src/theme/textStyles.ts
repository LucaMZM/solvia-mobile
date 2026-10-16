import { StyleSheet } from 'react-native';

import { appTheme } from '@/src/theme/tokens';

export const textStyles = StyleSheet.create({
  cardTitle: {
    color: appTheme.colors.primary,
    ...appTheme.typography.title,
    fontSize: 28,
    lineHeight: 34,
  },
  support: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  supportOnSurface: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  subtle: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 12,
    lineHeight: 16,
  },
  capsLabel: {
    color: appTheme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    ...appTheme.typography.labelCaps,
    fontSize: 9.8,
    lineHeight: 13,
    letterSpacing: 0.88,
  },
  buttonCaps: {
    color: appTheme.colors.primary,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.12,
  },
});
