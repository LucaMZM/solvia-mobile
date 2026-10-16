import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { withAlpha } from '@/src/theme/colorUtils';
import { appTheme } from '@/src/theme/tokens';

interface MetricChipProps {
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function MetricChip({ iconName, label, accentColor = appTheme.colors.secondary, style }: MetricChipProps) {
  return (
    <View style={[styles.chip, { borderColor: withAlpha(accentColor, 0.28) }, style]}>
      <MaterialCommunityIcons color={accentColor} name={iconName} size={14} />
      <Text numberOfLines={1} style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: 'rgba(24,36,59,0.48)',
    borderRadius: appTheme.radii.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    minHeight: 31,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  label: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11,
    letterSpacing: 0.08,
    lineHeight: 15,
  },
});
