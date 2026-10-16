import type { ReactNode } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { appTheme } from '@/src/theme/tokens';

interface SectionHeadingProps {
  title: string;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  trailing?: ReactNode;
  compact?: boolean;
}

export function SectionHeading({ title, iconName, trailing, compact = false }: SectionHeadingProps) {
  return (
    <View style={[styles.container, compact ? styles.compactBottom : null]}>
      <View style={styles.row}>
        {iconName ? (
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons color={appTheme.colors.secondary} name={iconName} size={14} />
          </View>
        ) : null}
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: appTheme.spacing.cardInnerGap,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: appTheme.spacing.xs + 2,
  },
  compactBottom: {
    marginBottom: appTheme.spacing.sm + 2,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(157,198,255,0.08)',
    borderColor: 'rgba(157,198,255,0.18)',
    borderRadius: appTheme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  title: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 13.2,
    letterSpacing: 0.09,
    lineHeight: 18,
  },
});
