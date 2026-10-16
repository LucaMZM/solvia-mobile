import { useMemo, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { MotionPressable } from '@/src/components/ui/MotionPressable';
import { PremiumDetailSheet } from '@/src/components/ui/PremiumDetailSheet';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { weatherIconName } from '@/src/features/hoy/components/weatherIcon';
import { getWeatherLabel } from '@/src/services/weather/weatherCode';
import { appTheme } from '@/src/theme/tokens';
import type { DailyForecastPoint } from '@/src/types/weather';

interface WeeklyOutlookCardProps {
  dailySeries?: DailyForecastPoint[];
}

function dayLabel(isoDate: string): string {
  return new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(new Date(isoDate));
}

function humanSummary(point: DailyForecastPoint): string {
  const base = getWeatherLabel(point.weatherCode, true);
  if (point.precipitationProbabilityMax >= 65) {
    return `${base}. Lluvia probable.`;
  }
  if (point.precipitationProbabilityMax >= 35) {
    return `${base}. Lluvia posible.`;
  }
  return `${base}. Día estable.`;
}

function shortPhrase(point: DailyForecastPoint): string {
  if (point.precipitationProbabilityMax >= 65) {
    return 'Paraguas';
  }
  if (point.precipitationProbabilityMax >= 35) {
    return 'Por si acaso';
  }
  if (point.maxTemperatureC >= 30) {
    return 'Con protección';
  }
  return 'Tramo estable';
}

export function WeeklyOutlookCard({ dailySeries }: WeeklyOutlookCardProps) {
  const [isDetailVisible, setDetailVisible] = useState(false);
  const week = useMemo(() => (dailySeries ?? []).slice(0, 7), [dailySeries]);

  if (week.length === 0) {
    return null;
  }

  return (
    <>
      <MotionPressable
        accessibilityLabel="Abrir resumen semanal"
        accessibilityRole="button"
        hapticType="selection"
        onPress={() => setDetailVisible(true)}
        pressedOpacity={0.93}
        pressedScale={0.992}
        reducedMotionPressedOpacity={0.88}>
        <SectionCard>
          <SectionHeading iconName="calendar-week-outline" title="Semana" />
          <View style={styles.weekList}>
            {week.slice(0, 5).map((day, index) => (
              <View key={day.timeISO} style={[styles.weekRow, index === Math.min(week.length, 5) - 1 ? styles.lastRow : null]}>
                <Text style={styles.previewDay}>{dayLabel(day.timeISO)}</Text>
                <View style={styles.conditionBlock}>
                  <MaterialCommunityIcons
                    color={appTheme.colors.secondary}
                    name={weatherIconName(day.weatherCode, true)}
                    size={19}
                  />
                  <Text numberOfLines={1} style={styles.previewPhrase}>
                    {shortPhrase(day)}
                  </Text>
                </View>
                <Text style={styles.previewTemp}>
                  {Math.round(day.maxTemperatureC)}° / {Math.round(day.minTemperatureC)}°
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.cta}>Ver semana completa</Text>
        </SectionCard>
      </MotionPressable>

      <PremiumDetailSheet
        iconName="calendar-week-outline"
        onClose={() => setDetailVisible(false)}
        rows={week.map((day) => ({
          label: `${dayLabel(day.timeISO)} · ${Math.round(day.maxTemperatureC)}°/${Math.round(day.minTemperatureC)}°`,
          value: humanSummary(day),
        }))}
        summary="Lectura compacta de la semana para decidir rápido."
        title="Semana"
        visible={isDetailVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  weekList: {
    marginTop: -2,
  },
  weekRow: {
    alignItems: 'center',
    borderBottomColor: 'rgba(154,172,202,0.16)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 44,
    paddingVertical: appTheme.spacing.xs,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  previewDay: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 10.8,
    lineHeight: 14,
    textTransform: 'capitalize',
    width: 42,
  },
  conditionBlock: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: appTheme.spacing.xs,
  },
  previewTemp: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.functional,
    fontSize: 11.2,
    lineHeight: 15,
    textAlign: 'right',
    width: 62,
  },
  previewPhrase: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 10.4,
    lineHeight: 13,
    flex: 1,
  },
  cta: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 11.4,
    lineHeight: 16,
    marginTop: appTheme.spacing.sm,
  },
});
