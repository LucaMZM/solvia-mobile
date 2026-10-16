import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { weatherIconName } from '@/src/features/hoy/components/weatherIcon';
import { getWeatherLabel } from '@/src/services/weather/weatherCode';
import { withAlpha } from '@/src/theme/colorUtils';
import { appTheme } from '@/src/theme/tokens';
import type { WeatherState } from '@/src/types/recommendations';
import type { HourlyForecastPoint } from '@/src/types/weather';
import { toHourLabel } from '@/src/utils/date';

interface HourlyForecastRowProps {
  point: HourlyForecastPoint;
  index: number;
  isInBestWindow: boolean;
  stateAccent: string;
  weatherState: WeatherState;
}

export function HourlyForecastRow({
  point,
  index,
  isInBestWindow,
  stateAccent,
  weatherState,
}: HourlyForecastRowProps) {
  const timeLabel = index === 0 ? 'Ahora' : toHourLabel(point.timeISO);
  const conditionLabel = getWeatherLabel(point.weatherCode, point.isDay);
  const isCurrent = index === 0;

  return (
    <View
      accessible
      accessibilityLabel={`${timeLabel}. ${Math.round(point.temperatureC)} grados. ${conditionLabel}. Viento ${Math.round(point.windSpeedKmh)} km/h. Lluvia ${Math.round(point.precipitationProbability)}%.${isInBestWindow ? ' Mejor ventana.' : ''}`}
      style={[
        styles.row,
        isCurrent
          ? {
              backgroundColor: withAlpha(stateAccent, 0.09),
              borderColor: withAlpha(stateAccent, 0.44),
            }
          : isInBestWindow
            ? {
                borderColor: withAlpha(stateAccent, 0.3),
                backgroundColor: withAlpha(stateAccent, 0.06),
              }
            : null,
      ]}>
      <View style={styles.topRow}>
        <View style={styles.leftColumn}>
          <View style={styles.timeRow}>
            <Text style={styles.hour}>{timeLabel}</Text>
            {isInBestWindow ? (
              <View style={[styles.windowPill, { borderColor: withAlpha(stateAccent, 0.38) }]}>
                <Text style={[styles.windowPillText, { color: stateAccent }]}>Mejor</Text>
              </View>
            ) : null}
          </View>
          <Text numberOfLines={1} style={styles.condition}>
            {conditionLabel}
          </Text>
        </View>

        <View style={[styles.iconChip, isCurrent ? styles.activeIconChip : null]}>
          <MaterialCommunityIcons
            color={isCurrent ? stateAccent : point.isDay ? appTheme.colors.warning : appTheme.colors.onSurfaceVariant}
            name={weatherIconName(point.weatherCode, point.isDay)}
            size={20}
          />
        </View>

        <View style={styles.rightColumn}>
          <Text style={styles.temp}>{Math.round(point.temperatureC)}°</Text>
          <Text style={styles.feelsLike}>Sensación {Math.round(point.apparentTemperatureC)}°</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={[styles.metaBadge, isCurrent && weatherState === 'windy' ? styles.metaBadgeWind : null]}>
          <MaterialCommunityIcons color={appTheme.colors.onSurfaceVariant} name="weather-windy" size={13} />
          <Text style={styles.metaText}>{Math.round(point.windSpeedKmh)} km/h</Text>
        </View>
        <View style={[styles.metaBadge, isCurrent && weatherState === 'rainy' ? styles.metaBadgeRain : null]}>
          <MaterialCommunityIcons color={appTheme.colors.onSurfaceVariant} name="weather-rainy" size={13} />
          <Text style={styles.metaText}>{Math.round(point.precipitationProbability)}%</Text>
        </View>
        <View style={styles.metaBadge}>
          {point.isDay ? (
            <>
              <MaterialCommunityIcons color={appTheme.colors.onSurfaceVariant} name="white-balance-sunny" size={13} />
              <Text style={styles.metaText}>UV {Math.round(point.uvIndex)}</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons color={appTheme.colors.onSurfaceVariant} name="water-percent" size={13} />
              <Text style={styles.metaText}>{Math.round(point.humidityPct)}%</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: appTheme.colors.surfaceContainer,
    borderColor: 'rgba(154,172,202,0.25)',
    borderRadius: appTheme.radii.lg,
    borderWidth: 1,
    minHeight: 74,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 8,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  leftColumn: {
    flex: 1,
    gap: 3,
  },
  timeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  hour: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 0.12,
  },
  condition: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 11.2,
    lineHeight: 14,
  },
  windowPill: {
    borderRadius: appTheme.radii.full,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  windowPillText: {
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 10,
    letterSpacing: 0.08,
    lineHeight: 12,
  },
  iconChip: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.28)',
    borderRadius: appTheme.radii.full,
    borderWidth: 1,
    height: 37,
    justifyContent: 'center',
    marginHorizontal: appTheme.spacing.xs,
    width: 37,
  },
  activeIconChip: {
    backgroundColor: 'rgba(154,194,255,0.1)',
    borderColor: 'rgba(154,194,255,0.42)',
  },
  rightColumn: {
    alignItems: 'flex-end',
    minWidth: 84,
  },
  temp: {
    color: appTheme.colors.primary,
    ...appTheme.typography.body,
    fontSize: 18,
    lineHeight: 21,
  },
  feelsLike: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 10.5,
    lineHeight: 13,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: appTheme.spacing.xs,
    marginTop: 7,
  },
  metaBadge: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.26)',
    borderRadius: appTheme.radii.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: appTheme.spacing.xs,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  metaBadgeWind: {
    borderColor: 'rgba(154,194,255,0.48)',
  },
  metaBadgeRain: {
    borderColor: 'rgba(142,164,199,0.55)',
  },
  metaText: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 10.2,
    lineHeight: 13,
  },
});
