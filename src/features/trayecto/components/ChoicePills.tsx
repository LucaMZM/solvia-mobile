import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { MotionPressable } from '@/src/components/ui/MotionPressable';
import { appTheme } from '@/src/theme/tokens';

export interface ChoicePillOption<T extends string | number> {
  value: T;
  label: string;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
}

interface ChoicePillsProps<T extends string | number> {
  options: readonly ChoicePillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityPrefix: string;
}

export function ChoicePills<T extends string | number>({
  options,
  value,
  onChange,
  accessibilityPrefix,
}: ChoicePillsProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <MotionPressable
            accessibilityLabel={`${accessibilityPrefix} ${option.label}`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            hapticType="selection"
            hitSlop={6}
            key={option.value}
            onPress={() => {
              onChange(option.value);
            }}
            pressedOpacity={0.9}
            pressedScale={0.98}
            reducedMotionPressedOpacity={0.86}
            style={[
              styles.pill,
              active ? styles.pillActive : null,
            ]}>
            {option.iconName ? (
              <MaterialCommunityIcons
                color={active ? appTheme.colors.primary : appTheme.colors.onSurfaceVariant}
                name={option.iconName}
                size={13}
              />
            ) : null}
            <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>{option.label}</Text>
          </MotionPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: appTheme.spacing.xs,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.34)',
    borderRadius: appTheme.radii.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillActive: {
    backgroundColor: 'rgba(157,198,255,0.2)',
    borderColor: 'rgba(157,198,255,0.58)',
  },
  pillText: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.08,
  },
  pillTextActive: {
    color: appTheme.colors.primary,
  },
});
