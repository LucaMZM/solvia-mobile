import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { DepartureTimeControls } from '@/src/features/trayecto/components/DepartureTimeControls';
import { RoutePointSelector } from '@/src/features/trayecto/components/RoutePointSelector';
import { buildRoutePointSubtitle } from '@/src/domain/trayecto/trayectoDomain';
import { appIcons } from '@/src/theme/iconography';
import { appTheme } from '@/src/theme/tokens';
import { textStyles } from '@/src/theme/textStyles';
import type { CarTrayectoConfig, RouteCityPoint, TrayectoDepartureMode } from '@/src/types/trayecto';

interface TrayectoRoutePlannerCardProps {
  carConfig: CarTrayectoConfig;
  quickPoints: RouteCityPoint[];
  originSearchText: string;
  destinationSearchText: string;
  stopSearchText: string;
  originSearchResults: RouteCityPoint[];
  destinationSearchResults: RouteCityPoint[];
  stopSearchResults: RouteCityPoint[];
  originSearchLoading: boolean;
  destinationSearchLoading: boolean;
  stopSearchLoading: boolean;
  originSearchError: boolean;
  destinationSearchError: boolean;
  stopSearchError: boolean;
  onOriginSearchTextChange: (value: string) => void;
  onDestinationSearchTextChange: (value: string) => void;
  onStopSearchTextChange: (value: string) => void;
  onSetOrigin: (point: RouteCityPoint | null) => void;
  onSetDestination: (point: RouteCityPoint | null) => void;
  onSwap: () => void;
  onAddStop: (point: RouteCityPoint) => void;
  onRemoveStop: (stopId: string) => void;
  onClearStops: () => void;
  onDepartureModeChange: (mode: TrayectoDepartureMode) => void;
  onDepartureTimeChange: (hour: number, minute: number) => void;
}

export function TrayectoRoutePlannerCard({
  carConfig,
  quickPoints,
  originSearchText,
  destinationSearchText,
  stopSearchText,
  originSearchResults,
  destinationSearchResults,
  stopSearchResults,
  originSearchLoading,
  destinationSearchLoading,
  stopSearchLoading,
  originSearchError,
  destinationSearchError,
  stopSearchError,
  onOriginSearchTextChange,
  onDestinationSearchTextChange,
  onStopSearchTextChange,
  onSetOrigin,
  onSetDestination,
  onSwap,
  onAddStop,
  onRemoveStop,
  onClearStops,
  onDepartureModeChange,
  onDepartureTimeChange,
}: TrayectoRoutePlannerCardProps) {
  return (
    <SectionCard>
      <SectionHeading
        iconName={appIcons.modules.trayecto}
        title="Planificar ruta en coche"
        trailing={
          <Pressable
            accessibilityLabel="Intercambiar origen y destino"
            hitSlop={8}
            onPress={onSwap}
            style={styles.swapButton}>
            <MaterialCommunityIcons color={appTheme.colors.onSurfaceVariant} name="swap-horizontal" size={15} />
          </Pressable>
        }
      />

      <RoutePointSelector
        onSearchTextChange={onOriginSearchTextChange}
        onSelectPoint={onSetOrigin}
        quickPoints={quickPoints}
        searchError={originSearchError}
        searchLoading={originSearchLoading}
        searchResults={originSearchResults}
        searchText={originSearchText}
        selectedPoint={carConfig.origin}
        title="Origen"
      />

      <RoutePointSelector
        onSearchTextChange={onDestinationSearchTextChange}
        onSelectPoint={onSetDestination}
        quickPoints={quickPoints}
        searchError={destinationSearchError}
        searchLoading={destinationSearchLoading}
        searchResults={destinationSearchResults}
        searchText={destinationSearchText}
        selectedPoint={carConfig.destination}
        title="Destino"
      />

      <View style={styles.selectorBlock}>
        <Text style={styles.label}>Hora de salida</Text>
        <DepartureTimeControls
          hour={carConfig.departureCustomHour}
          minute={carConfig.departureCustomMinute}
          mode={carConfig.departureMode}
          onModeChange={onDepartureModeChange}
          onTimeChange={onDepartureTimeChange}
        />
      </View>

      <View style={styles.selectorBlock}>
        <View style={styles.stopHeader}>
          <Text style={styles.label}>Paradas opcionales</Text>
          {carConfig.optionalStops.length > 0 ? (
            <Pressable accessibilityLabel="Limpiar paradas" hitSlop={8} onPress={onClearStops}>
              <Text style={styles.clearText}>Limpiar</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.searchBox}>
          <MaterialCommunityIcons color={appTheme.colors.onSurfaceVariant} name="plus" size={15} />
          <TextInput
            accessibilityLabel="Añadir parada opcional"
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={onStopSearchTextChange}
            placeholder="Añadir parada..."
            placeholderTextColor="rgba(198,210,232,0.48)"
            style={styles.input}
            value={stopSearchText}
          />
        </View>

        {stopSearchLoading ? <Text style={styles.statusText}>Buscando paradas…</Text> : null}
        {stopSearchError ? <Text style={styles.errorText}>No pudimos buscar paradas por ahora.</Text> : null}

        {stopSearchResults.length > 0 ? (
          <View style={styles.searchResults}>
            {stopSearchResults.slice(0, 4).map((point) => (
              <Pressable
                accessibilityLabel={`Añadir parada ${point.cityName}`}
                accessibilityRole="button"
                key={point.id}
                onPress={() => onAddStop(point)}
                style={styles.searchResultRow}>
                <View style={styles.searchResultCopy}>
                  <Text style={styles.searchResultTitle}>{point.cityName}</Text>
                  <Text style={styles.searchResultSubtitle}>{buildRoutePointSubtitle(point) || 'Ciudad sugerida'}</Text>
                </View>
                <MaterialCommunityIcons color={appTheme.colors.secondary} name="plus-circle-outline" size={14} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {carConfig.optionalStops.length > 0 ? (
          <View style={styles.stopList}>
            {carConfig.optionalStops.map((stop) => (
              <View key={stop.id} style={styles.stopRow}>
                <View style={styles.stopCopy}>
                  <Text style={styles.stopTitle}>{stop.cityName}</Text>
                  <Text style={styles.stopSubtitle}>{buildRoutePointSubtitle(stop) || 'Parada opcional'}</Text>
                </View>
                <Pressable
                  accessibilityLabel={`Eliminar parada ${stop.cityName}`}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => onRemoveStop(stop.id)}
                  style={styles.deleteButton}>
                  <MaterialCommunityIcons color={appTheme.colors.onSurfaceVariant} name="close" size={14} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[textStyles.subtle, styles.noStops]}>Sin paradas intermedias definidas.</Text>
        )}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  selectorBlock: {
    marginBottom: appTheme.spacing.sm,
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
  stopHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clearText: {
    color: appTheme.colors.secondary,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11,
    letterSpacing: 0.08,
    lineHeight: 14,
  },
  stopList: {
    gap: appTheme.spacing.xs,
    marginTop: appTheme.spacing.sm,
  },
  stopRow: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.24)',
    borderRadius: appTheme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 8,
  },
  stopCopy: {
    flex: 1,
    paddingRight: appTheme.spacing.sm,
  },
  stopTitle: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  stopSubtitle: {
    ...textStyles.subtle,
    marginTop: 1,
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surfaceContainer,
    borderColor: 'rgba(154,172,202,0.26)',
    borderRadius: appTheme.radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  noStops: {
    marginTop: appTheme.spacing.sm,
  },
  swapButton: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surfaceContainer,
    borderColor: 'rgba(154,172,202,0.26)',
    borderRadius: appTheme.radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
});
