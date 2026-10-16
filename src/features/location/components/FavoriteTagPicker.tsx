import { Pressable, StyleSheet, Text, View } from 'react-native';

import { favoriteLocationTagLabels, favoriteLocationTags } from '@/src/domain/location/locationDomain';
import { appTheme } from '@/src/theme/tokens';
import type { FavoriteLocationTag } from '@/src/types/location';

interface FavoriteTagPickerProps {
  value?: FavoriteLocationTag;
  onChange: (tag: FavoriteLocationTag | null) => void;
}

export function FavoriteTagPicker({ value, onChange }: FavoriteTagPickerProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="Quitar etiqueta favorita"
        accessibilityRole="button"
        accessibilityState={{ selected: !value }}
        hitSlop={6}
        onPress={() => onChange(null)}
        style={[styles.chip, value ? null : styles.activeChip]}>
        <Text style={[styles.chipText, value ? null : styles.activeChipText]}>Sin etiqueta</Text>
      </Pressable>
      {favoriteLocationTags.map((tag) => {
        const isActive = value === tag;
        return (
          <Pressable
            accessibilityLabel={`Asignar etiqueta ${favoriteLocationTagLabels[tag]}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            hitSlop={6}
            key={tag}
            onPress={() => onChange(tag)}
            style={[styles.chip, isActive ? styles.activeChip : null]}>
            <Text style={[styles.chipText, isActive ? styles.activeChipText : null]}>
              {favoriteLocationTagLabels[tag]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: appTheme.spacing.xs,
    marginTop: appTheme.spacing.sm,
  },
  chip: {
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.28)',
    borderRadius: appTheme.radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 38,
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: 7,
  },
  activeChip: {
    backgroundColor: 'rgba(157,198,255,0.2)',
    borderColor: 'rgba(157,198,255,0.58)',
  },
  chipText: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11,
    letterSpacing: 0.08,
    lineHeight: 14,
  },
  activeChipText: {
    color: appTheme.colors.primary,
  },
});
