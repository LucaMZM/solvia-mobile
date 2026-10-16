import { useEffect, useMemo, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { buildLocationSubtitle, favoriteLocationTagLabels } from '@/src/domain/location/locationDomain';
import { MotionPressable } from '@/src/components/ui/MotionPressable';
import { PrimaryPillButton } from '@/src/components/ui/PrimaryPillButton';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { useLocationSelectionModel } from '@/src/features/location/useLocationSelectionModel';
import { getSafeRecommendationLabel } from '@/src/features/recommendations/recommendationPolicy';
import { buildWeatherRiskProfile } from '@/src/features/recommendations/weatherRisk';
import { useLocationWeather } from '@/src/hooks/useLocationWeather';
import { loadWeatherSnapshotCache } from '@/src/services/weather/weatherCache';
import { getWeatherLabel } from '@/src/services/weather/weatherCode';
import { WEATHER_FALLBACK_CACHE_MAX_MINUTES } from '@/src/services/weather/weatherService';
import { useAppLifecycleStore } from '@/src/state/appLifecycleStore';
import { appIcons } from '@/src/theme/iconography';
import { appTheme } from '@/src/theme/tokens';
import type { CurrentLocation, SavedLocation } from '@/src/types/location';
import type { WeatherSnapshot } from '@/src/types/weather';

interface LocationCardItem {
  key: string;
  label: string;
  subtitle: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  isCurrent: boolean;
  selected: boolean;
  onPress: () => void;
  location: CurrentLocation | SavedLocation;
}

function isSnapshotForLocation(snapshot: WeatherSnapshot | undefined, cityName: string): boolean {
  if (!snapshot) {
    return false;
  }
  return snapshot.cityName.trim().toLowerCase() === cityName.trim().toLowerCase();
}

function buildStatusLine(snapshot: WeatherSnapshot | undefined): string {
  if (!snapshot) {
    return 'Sin lectura reciente';
  }
  const weatherLabel = getWeatherLabel(snapshot.current.weatherCode, snapshot.current.isDay);
  return weatherLabel;
}

function buildRecommendationLine(snapshot: WeatherSnapshot | undefined): string {
  if (!snapshot) {
    return 'Recomendación pendiente';
  }
  const risk = buildWeatherRiskProfile(snapshot);
  if (risk.flags.rainNow || risk.flags.rainSoon) return 'Paraguas por si acaso';
  if (risk.flags.highUv) return 'Con protección';
  if (risk.flags.strongWind || risk.flags.strongGusts) return 'Evita zonas abiertas';
  return getSafeRecommendationLabel('caminar', risk, 68);
}

export function LocationQuickSwitchCard() {
  const { currentLocation, locationQuery, savedLocations, selectedLocation, selectCurrentLocation, selectSavedLocation } =
    useLocationSelectionModel();
  const { weatherQuery, activeLocation } = useLocationWeather();
  const clearLocationPromptDeferral = useAppLifecycleStore((state) => state.clearLocationPromptDeferral);
  const [cachedSnapshots, setCachedSnapshots] = useState<Record<string, WeatherSnapshot>>({});

  const cards = useMemo<LocationCardItem[]>(() => {
    const items: LocationCardItem[] = [];
    if (currentLocation) {
      items.push({
        key: `current:${currentLocation.id}`,
        label: currentLocation.cityName,
        subtitle: 'Ubicación actual',
        iconName: 'crosshairs-gps',
        isCurrent: true,
        selected: selectedLocation.kind === 'current',
        onPress: selectCurrentLocation,
        location: currentLocation,
      });
    }

    savedLocations.forEach((location) => {
      items.push({
        key: `saved:${location.id}`,
        label: location.cityName,
        subtitle: location.favoriteTag
          ? favoriteLocationTagLabels[location.favoriteTag]
          : buildLocationSubtitle(location),
        iconName: appIcons.modules.ubicaciones,
        isCurrent: false,
        selected: selectedLocation.kind === 'saved' && selectedLocation.id === location.id,
        onPress: () => selectSavedLocation(location.id),
        location,
      });
    });

    return items;
  }, [currentLocation, savedLocations, selectedLocation, selectCurrentLocation, selectSavedLocation]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      if (cards.length === 0) {
        if (mounted) {
          setCachedSnapshots({});
        }
        return;
      }

      const entries = await Promise.all(
        cards.map(async (item) => {
          const cached = await loadWeatherSnapshotCache(item.location);
          if (!cached || cached.cacheAgeMinutes > WEATHER_FALLBACK_CACHE_MAX_MINUTES) {
            return [item.key, undefined] as const;
          }

          return [item.key, cached.snapshot] as const;
        }),
      );

      if (!mounted) {
        return;
      }

      const next: Record<string, WeatherSnapshot> = {};
      entries.forEach(([key, snapshot]) => {
        if (snapshot) {
          next[key] = snapshot;
        }
      });
      setCachedSnapshots(next);
    })();

    return () => {
      mounted = false;
    };
  }, [cards]);

  return (
    <SectionCard>
      <SectionHeading iconName={appIcons.modules.ubicaciones} title="Cambio rápido de ubicación" />
      {currentLocation?.source === 'permission_fallback' ? (
        <View style={styles.permissionBlock}>
          <Text numberOfLines={2} style={styles.permissionHint}>
            Ubicación precisa desactivada. Puedes seguir con ciudades guardadas o activarla ahora.
          </Text>
          <PrimaryPillButton
            accessibilityLabel="Activar ubicación precisa"
            label="Activar ubicación precisa"
            onPress={() => {
              clearLocationPromptDeferral();
              void locationQuery.refetch();
            }}
          />
        </View>
      ) : null}
      {cards.length > 0 ? (
        <ScrollView
          contentContainerStyle={styles.carousel}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start">
          {cards.map((item) => {
            const isActiveLocation = activeLocation?.id === item.location.id;
            const liveSnapshot = isActiveLocation ? weatherQuery.data : undefined;
            const cardSnapshot =
              isSnapshotForLocation(liveSnapshot, item.location.cityName)
                ? liveSnapshot
                : cachedSnapshots[item.key];

            return (
              <MotionPressable
                accessibilityLabel={`Cambiar a ${item.label}`}
                accessibilityRole="button"
                accessibilityState={{ selected: item.selected }}
                hapticType="selection"
                key={item.key}
                onPress={item.onPress}
                pressedOpacity={0.93}
                pressedScale={0.992}
                reducedMotionPressedOpacity={0.88}
                style={[styles.locationCard, item.selected ? styles.locationCardSelected : null]}>
                <View style={styles.cardTopRow}>
                  <View style={styles.metaPill}>
                    <MaterialCommunityIcons
                      color={item.isCurrent ? appTheme.colors.secondary : appTheme.colors.onSurfaceVariant}
                      name={item.iconName}
                      size={13}
                    />
                    <Text numberOfLines={1} style={styles.metaText}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <Text style={[styles.selectionTag, item.selected ? styles.selectionTagSelected : null]}>
                    {item.selected ? 'Activa' : item.isCurrent ? 'Actual' : 'Guardada'}
                  </Text>
                </View>

                <Text numberOfLines={1} style={styles.cityLabel}>
                  {item.label}
                </Text>

                <View style={styles.temperatureRow}>
                  <Text style={styles.temperatureValue}>
                    {cardSnapshot ? `${Math.round(cardSnapshot.current.temperatureC)}°` : '—'}
                  </Text>
                  <Text style={styles.tempRange}>
                    {cardSnapshot
                      ? `↑${Math.round(cardSnapshot.daily.maxTemperatureC)}° ↓${Math.round(cardSnapshot.daily.minTemperatureC)}°`
                      : 'Sin máximas/mínimas'}
                  </Text>
                </View>

                <Text numberOfLines={1} style={styles.statusText}>
                  {buildStatusLine(cardSnapshot)}
                </Text>
                <Text numberOfLines={1} style={styles.recommendationText}>
                  {buildRecommendationLine(cardSnapshot)}
                </Text>
              </MotionPressable>
            );
          })}
        </ScrollView>
      ) : (
        <Text numberOfLines={2} style={styles.placeholder}>
          {locationQuery.isLoading
            ? 'Buscando ubicación actual…'
            : 'Activa la ubicación para cambiar rápido entre ciudades.'}
        </Text>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  carousel: {
    flexDirection: 'row',
    gap: appTheme.spacing.sm,
    paddingRight: appTheme.spacing.md,
  },
  locationCard: {
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.28)',
    borderRadius: appTheme.radii.xl,
    borderWidth: 1,
    minHeight: 138,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.md,
    width: 250,
  },
  locationCardSelected: {
    backgroundColor: 'rgba(157,198,255,0.16)',
    borderColor: 'rgba(157,198,255,0.54)',
  },
  cardTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(31,47,74,0.5)',
    borderColor: 'rgba(154,172,202,0.24)',
    borderRadius: appTheme.radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 5,
    maxWidth: '88%',
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: 5,
  },
  metaText: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 10.8,
    lineHeight: 14,
  },
  selectionTag: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 10.4,
    lineHeight: 13,
  },
  selectionTagSelected: {
    color: appTheme.colors.secondary,
  },
  cityLabel: {
    color: appTheme.colors.primary,
    ...appTheme.typography.title,
    fontSize: 21,
    lineHeight: 26,
    marginTop: appTheme.spacing.sm,
  },
  temperatureRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: appTheme.spacing.sm,
    marginTop: 4,
  },
  temperatureValue: {
    color: appTheme.colors.primary,
    ...appTheme.typography.headline,
    fontSize: 34,
    lineHeight: 38,
  },
  tempRange: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 11.2,
    lineHeight: 15,
    marginBottom: 5,
  },
  statusText: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.functional,
    fontSize: 12.2,
    lineHeight: 16,
    marginTop: 3,
  },
  recommendationText: {
    color: appTheme.colors.secondary,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  placeholder: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  permissionHint: {
    color: appTheme.colors.warning,
    ...appTheme.typography.functional,
    fontSize: 12,
    lineHeight: 18,
  },
  permissionBlock: {
    gap: appTheme.spacing.sm,
    marginBottom: appTheme.spacing.sm,
  },
});
