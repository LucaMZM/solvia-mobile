import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ChoicePills } from '@/src/features/trayecto/components/ChoicePills';
import { buildRoutePointSubtitle } from '@/src/domain/trayecto/trayectoDomain';
import { appTheme } from '@/src/theme/tokens';
import { textStyles } from '@/src/theme/textStyles';
import type { RouteCityPoint } from '@/src/types/trayecto';

interface RoutePointSelectorProps {
  title: string;
  selectedPoint: RouteCityPoint | null;
  quickPoints: RouteCityPoint[];
  searchText: string;
  searchResults: RouteCityPoint[];
  searchLoading: boolean;
  searchError: boolean;
  onSearchTextChange: (value: string) => void;
  onSelectPoint: (point: RouteCityPoint) => void;
}

export function RoutePointSelector({
  title,
  selectedPoint,
  quickPoints,
  searchText,
  searchResults,
  searchLoading,
  searchError,
  onSearchTextChange,
  onSelectPoint,
}: RoutePointSelectorProps) {
  return (
    <View style={styles.selectorBlock}>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.selectedPointCard}>
        <MaterialCommunityIcons color={appTheme.colors.secondary} name="map-marker-outline" size={15} />
        <View style={styles.selectedCopy}>
          <Text style={styles.selectedTitle}>{selectedPoint?.cityName ?? 'Sin seleccionar'}</Text>
          {selectedPoint ? (
            <Text style={styles.selectedSubtitle}>{buildRoutePointSubtitle(selectedPoint) || 'Punto de referencia'}</Text>
          ) : (
            <Text style={styles.selectedSubtitle}>Busca una ciudad o usa una ubicación guardada.</Text>
          )}
        </View>
      </View>

      {quickPoints.length > 0 ? (
        <ChoicePills
          accessibilityPrefix={`Seleccionar ${title.toLowerCase()}`}
          onChange={(value) => {
            const selected = quickPoints.find((point) => point.id === value);
            if (selected) {
              onSelectPoint(selected);
            }
          }}
          options={quickPoints.map((point) => ({
            value: point.id,
            label: point.cityName,
            iconName: 'crosshairs-gps',
          }))}
          value={selectedPoint?.id ?? ''}
        />
      ) : null}

      <View style={styles.searchBox}>
        <MaterialCommunityIcons color={appTheme.colors.onSurfaceVariant} name="magnify" size={15} />
        <TextInput
          accessibilityLabel={`Buscar ${title.toLowerCase()}`}
          autoCapitalize="words"
          autoCorrect={false}
          onChangeText={onSearchTextChange}
          placeholder={`Buscar ${title.toLowerCase()}...`}
          placeholderTextColor="rgba(198,210,232,0.48)"
          style={styles.input}
          value={searchText}
        />
      </View>

      {searchLoading ? <Text style={styles.statusText}>Buscando ciudades…</Text> : null}
      {searchError ? <Text style={styles.errorText}>No pudimos completar la búsqueda.</Text> : null}

      {searchResults.length > 0 ? (
        <View style={styles.searchResults}>
          {searchResults.slice(0, 4).map((point) => (
            <Pressable
              accessibilityLabel={`Elegir ${point.cityName}`}
              accessibilityRole="button"
              key={point.id}
              onPress={() => onSelectPoint(point)}
              style={styles.searchResultRow}>
              <View style={styles.searchResultCopy}>
                <Text style={styles.searchResultTitle}>{point.cityName}</Text>
                <Text style={styles.searchResultSubtitle}>{buildRoutePointSubtitle(point) || 'Ciudad sugerida'}</Text>
              </View>
              <MaterialCommunityIcons color={appTheme.colors.secondary} name="arrow-top-right" size={14} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  selectorBlock: {
    marginBottom: appTheme.spacing.md,
  },
  label: {
    color: appTheme.colors.onSurfaceVariant,
    marginBottom: appTheme.spacing.xs,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.08,
  },
  selectedPointCard: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.28)',
    borderRadius: appTheme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: appTheme.spacing.sm,
    marginBottom: appTheme.spacing.sm,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
  },
  selectedCopy: {
    flex: 1,
  },
  selectedTitle: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  selectedSubtitle: {
    ...textStyles.subtle,
    marginTop: 2,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.28)',
    borderRadius: appTheme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: appTheme.spacing.sm,
    marginTop: appTheme.spacing.sm,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
  },
  input: {
    color: appTheme.colors.primary,
    flex: 1,
    ...appTheme.typography.functional,
    fontSize: 13,
    lineHeight: 18,
    paddingVertical: 0,
  },
  searchResults: {
    gap: appTheme.spacing.xs,
    marginTop: appTheme.spacing.sm,
  },
  searchResultRow: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.24)',
    borderRadius: appTheme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 8,
  },
  searchResultCopy: {
    flex: 1,
    paddingRight: appTheme.spacing.sm,
  },
  searchResultTitle: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.functional,
    fontSize: 13,
    lineHeight: 18,
  },
  searchResultSubtitle: {
    ...textStyles.subtle,
    marginTop: 1,
  },
  statusText: {
    ...textStyles.subtle,
    marginTop: appTheme.spacing.xs,
  },
  errorText: {
    color: appTheme.colors.danger,
    marginTop: appTheme.spacing.xs,
    ...appTheme.typography.functional,
    fontSize: 12,
    lineHeight: 16,
  },
});
