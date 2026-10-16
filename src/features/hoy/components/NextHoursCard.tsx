import { useMemo, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { MotionPressable } from '@/src/components/ui/MotionPressable';
import { PremiumDetailSheet } from '@/src/components/ui/PremiumDetailSheet';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { HourlyForecastRow } from '@/src/features/hoy/components/HourlyForecastRow';
import { weatherIconName } from '@/src/features/hoy/components/weatherIcon';
import { compareLocalIso, getLocalClock } from '@/src/services/weather/localTime';
import { withAlpha } from '@/src/theme/colorUtils';
import { appTheme } from '@/src/theme/tokens';
import { textStyles } from '@/src/theme/textStyles';
import type { BestNextWindowRecommendation, WeatherState } from '@/src/types/recommendations';
import type { HourlyForecastPoint } from '@/src/types/weather';

interface NextHoursCardProps {
  hourly: HourlyForecastPoint[];
  weatherState: WeatherState;
  bestNextWindow: BestNextWindowRecommendation;
}

const accentByWeatherState: Record<WeatherState, string> = {
  pleasant_sunny: '#f6bc63',
  strong_sun: '#ffb95f',
  soft_cloudy: '#b9c8de',
  rainy: '#8ea4c7',
  windy: '#9fb7ce',
  cool_evening: '#c2c9d8',
  golden_hour: '#ffb95f',
  night_clear: '#8ea4c7',
};

export function NextHoursCard({ hourly, weatherState, bestNextWindow }: NextHoursCardProps) {
  const [isSheetVisible, setSheetVisible] = useState(false);
  const stateAccent = accentByWeatherState[weatherState];

  const metrics = useMemo(() => {
    const peakRain = hourly.reduce((max, point) => Math.max(max, point.precipitationProbability), 0);
    const peakWind = hourly.reduce((max, point) => Math.max(max, point.windSpeedKmh), 0);
    const firstTemp = hourly[0]?.temperatureC;
    const lastTemp = hourly[hourly.length - 1]?.temperatureC;
    const temperatureDelta = firstTemp != null && lastTemp != null ? Math.round(lastTemp - firstTemp) : null;
    const trendLabel =
      temperatureDelta == null || Math.abs(temperatureDelta) < 1
        ? 'Térmica estable'
        : temperatureDelta > 0
          ? `Sube ${Math.abs(temperatureDelta)}°`
          : `Baja ${Math.abs(temperatureDelta)}°`;

    return {
      peakRain,
      peakWind,
      trendLabel,
    };
  }, [hourly]);

  const windowStart = bestNextWindow.startISO;
  const windowEnd = bestNextWindow.endISO;
  const previewHours = hourly.slice(0, 8);

  return (
    <>
      <MotionPressable
        accessibilityLabel={`Abrir detalle de próximas horas. Mejor ${bestNextWindow.label}`}
        accessibilityRole="button"
        hapticType="selection"
        onPress={() => setSheetVisible(true)}
        pressedOpacity={0.93}
        pressedScale={0.992}
        reducedMotionPressedOpacity={0.88}>
        <SectionCard>
          <SectionHeading
            iconName="timeline-clock-outline"
            title="Próximas horas"
            trailing={<Text style={[styles.windowLabel, { color: stateAccent }]}>Mejor {bestNextWindow.label}</Text>}
          />

          <Text numberOfLines={1} style={styles.windowReason}>
            {bestNextWindow.reason}
          </Text>

          <ScrollView
            contentContainerStyle={styles.hourlyStrip}
            horizontal
            showsHorizontalScrollIndicator={false}>
            {previewHours.map((point) => {
              const inBestWindow =
                compareLocalIso(point.timeISO, windowStart) >= 0 &&
                compareLocalIso(point.timeISO, windowEnd) <= 0;
              const extraLabel =
                point.precipitationProbability >= 35
                  ? `${Math.round(point.precipitationProbability)}%`
                  : point.windSpeedKmh >= 24
                    ? `${Math.round(point.windSpeedKmh)} km/h`
                    : null;

              return (
                <View
                  key={point.timeISO}
                  style={[
                    styles.hourPill,
                    inBestWindow
                      ? { backgroundColor: withAlpha(stateAccent, 0.14), borderColor: withAlpha(stateAccent, 0.46) }
                      : null,
                  ]}>
                  <Text style={styles.hourLabel}>{getLocalClock(point.timeISO)}</Text>
                  <MaterialCommunityIcons
                    color={inBestWindow ? stateAccent : appTheme.colors.onSurface}
                    name={weatherIconName(point.weatherCode, point.isDay)}
                    size={20}
                  />
                  <Text style={styles.hourTemp}>{Math.round(point.temperatureC)}°</Text>
                  {extraLabel ? <Text style={styles.hourExtra}>{extraLabel}</Text> : null}
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.insightsRow}>
            <View style={styles.insightPill}>
              <MaterialCommunityIcons color={appTheme.colors.onSurfaceVariant} name="thermometer-chevron-up" size={13} />
              <Text style={styles.insightText}>{metrics.trendLabel}</Text>
            </View>
            <View style={styles.insightPill}>
              <MaterialCommunityIcons color={appTheme.colors.onSurfaceVariant} name="weather-rainy" size={13} />
              <Text style={styles.insightText}>Lluvia {Math.round(metrics.peakRain)}%</Text>
            </View>
          </View>

          <Text style={styles.cta}>Ver detalle</Text>
        </SectionCard>
      </MotionPressable>

      <PremiumDetailSheet
        iconName="timeline-clock-outline"
        mainValue={`Mejor ${bestNextWindow.label}`}
        onClose={() => setSheetVisible(false)}
        rows={[
          { label: 'Tendencia térmica', value: metrics.trendLabel },
          { label: 'Pico de lluvia', value: `${Math.round(metrics.peakRain)}%` },
          { label: 'Pico de viento', value: `${Math.round(metrics.peakWind)} km/h` },
        ]}
        summary={bestNextWindow.reason}
        title="Próximas horas"
        visible={isSheetVisible}>
        {hourly.length === 0 ? (
          <Text style={textStyles.support}>No hay lectura horaria disponible en este momento.</Text>
        ) : (
          <View style={styles.list}>
            {hourly.map((point, index) => (
              <HourlyForecastRow
                index={index}
                isInBestWindow={
                  compareLocalIso(point.timeISO, windowStart) >= 0 &&
                  compareLocalIso(point.timeISO, windowEnd) <= 0
                }
                key={point.timeISO}
                point={point}
                stateAccent={stateAccent}
                weatherState={weatherState}
              />
            ))}
          </View>
        )}
      </PremiumDetailSheet>
    </>
  );
}

const styles = StyleSheet.create({
  windowLabel: {
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11.4,
    letterSpacing: 0.12,
    lineHeight: 16,
  },
  windowReason: {
    ...appTheme.typography.functional,
    color: appTheme.colors.onSurfaceVariant,
    fontSize: 11.8,
    lineHeight: 15,
    marginTop: -4,
    marginBottom: appTheme.spacing.sm,
  },
  hourlyStrip: {
    gap: appTheme.spacing.xs + 2,
    paddingRight: appTheme.spacing.md,
  },
  hourPill: {
    alignItems: 'center',
    backgroundColor: withAlpha(appTheme.colors.surfaceContainerLowest, 0.72),
    borderColor: withAlpha(appTheme.colors.outline, 0.22),
    borderRadius: appTheme.radii.lg,
    borderWidth: 1,
    minHeight: 92,
    paddingHorizontal: 10,
    paddingVertical: 9,
    width: 68,
  },
  hourLabel: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 10.4,
    lineHeight: 13,
  },
  hourTemp: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 13.2,
    lineHeight: 17,
    marginTop: 2,
  },
  hourExtra: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 9.8,
    lineHeight: 12,
    marginTop: 1,
  },
  insightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: appTheme.spacing.xs,
    marginBottom: appTheme.spacing.xs,
  },
  insightPill: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.28)',
    borderRadius: appTheme.radii.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  insightText: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 10.6,
    letterSpacing: 0.06,
    lineHeight: 14,
  },
  cta: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 11.4,
    lineHeight: 16,
  },
  list: {
    gap: appTheme.spacing.xs + 1,
    marginTop: appTheme.spacing.xs,
  },
});
