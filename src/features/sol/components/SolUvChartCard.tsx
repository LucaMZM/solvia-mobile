import { StyleSheet, Text, View } from 'react-native';

import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { withAlpha } from '@/src/theme/colorUtils';
import { appTheme } from '@/src/theme/tokens';
import type { SolUvChartPoint } from '@/src/features/sol/solModel';

interface SolUvChartCardProps {
  points: SolUvChartPoint[];
}

function barColorForUv(uvIndex: number, isDay: boolean): string {
  if (!isDay) {
    return withAlpha(appTheme.colors.secondary, 0.35);
  }
  if (uvIndex >= 8) {
    return appTheme.colors.danger;
  }
  if (uvIndex >= 5) {
    return appTheme.colors.warning;
  }
  if (uvIndex >= 2) {
    return appTheme.colors.secondary;
  }
  return withAlpha(appTheme.colors.onSurfaceVariant, 0.42);
}

export function SolUvChartCard({ points }: SolUvChartCardProps) {
  const maxUv = Math.max(1, ...points.map((point) => point.uvIndex));

  return (
    <SectionCard>
      <SectionHeading iconName="chart-bar" title="UV por horas" />

      <View style={styles.chart}>
        {points.map((point) => {
          const baseHeight = point.isDay ? 16 : 10;
          const barHeight = Math.round(baseHeight + (point.uvIndex / maxUv) * 74);
          const barColor = barColorForUv(point.uvIndex, point.isDay);

          return (
            <View key={point.id} style={styles.column}>
              <Text style={styles.uvValue}>{Math.round(point.uvIndex)}</Text>
              <View
                style={[
                  styles.bar,
                  {
                    backgroundColor: withAlpha(barColor, point.isInBestWindow ? 0.95 : 0.72),
                    borderColor: point.isInBestWindow
                      ? withAlpha(appTheme.colors.warning, 0.55)
                      : withAlpha(barColor, 0.4),
                    height: barHeight,
                  },
                ]}
              />
              <Text style={[styles.hourLabel, point.isInBestWindow ? styles.hourLabelActive : null]}>{point.hourLabel}</Text>
            </View>
          );
        })}
      </View>

      <Text numberOfLines={2} style={styles.legend}>
        La franja resaltada marca tu mejor ventana.
      </Text>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  chart: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: appTheme.spacing.xs,
  },
  column: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  uvValue: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.functional,
    fontSize: 10,
    lineHeight: 15,
  },
  bar: {
    borderRadius: appTheme.radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 10,
    width: 15,
  },
  hourLabel: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 10,
    lineHeight: 15,
  },
  hourLabelActive: {
    color: appTheme.colors.warning,
    fontFamily: appTheme.fontFamilies.sansMedium,
  },
  legend: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 11.8,
    lineHeight: 16,
    marginTop: appTheme.spacing.xs,
  },
});
