import { StyleSheet, Text, View } from 'react-native';

import type { ActivityTone } from '@/src/types/recommendations';
import { appTheme } from '@/src/theme/tokens';

interface RecommendationBadgeProps {
  tone: ActivityTone;
  detail: string;
}

const toneStyles: Record<ActivityTone, { textColor: string; borderColor: string; backgroundColor: string }> = {
  recomendado: {
    textColor: appTheme.colors.primary,
    borderColor: 'rgba(198,210,232,0.5)',
    backgroundColor: 'rgba(198,210,232,0.2)',
  },
  posible: {
    textColor: appTheme.colors.onSurfaceVariant,
    borderColor: 'rgba(198,210,232,0.42)',
    backgroundColor: 'rgba(198,210,232,0.14)',
  },
  evitar: {
    textColor: appTheme.colors.danger,
    borderColor: 'rgba(255,156,166,0.5)',
    backgroundColor: 'rgba(255,156,166,0.15)',
  },
  no_recomendado: {
    textColor: appTheme.colors.danger,
    borderColor: 'rgba(255,156,166,0.5)',
    backgroundColor: 'rgba(255,156,166,0.15)',
  },
  desafiante: {
    textColor: appTheme.colors.warning,
    borderColor: 'rgba(255,198,122,0.44)',
    backgroundColor: 'rgba(255,198,122,0.1)',
  },
  interior: {
    textColor: appTheme.colors.secondary,
    borderColor: 'rgba(154,194,255,0.45)',
    backgroundColor: 'rgba(154,194,255,0.13)',
  },
  zonas_protegidas: {
    textColor: appTheme.colors.secondary,
    borderColor: 'rgba(154,194,255,0.45)',
    backgroundColor: 'rgba(154,194,255,0.13)',
  },
};

export function RecommendationBadge({ tone, detail }: RecommendationBadgeProps) {
  const toneStyle = toneStyles[tone];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: toneStyle.backgroundColor,
          borderColor: toneStyle.borderColor,
        },
      ]}>
      <Text numberOfLines={1} style={[styles.text, { color: toneStyle.textColor }]}>
        {detail}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: appTheme.radii.full,
    borderWidth: 1,
    minHeight: 27,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: {
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 10.8,
    lineHeight: 14,
    letterSpacing: 0.08,
  },
});
