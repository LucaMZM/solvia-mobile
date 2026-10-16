import { StyleSheet, Text, View } from 'react-native';

import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { ChoicePills } from '@/src/features/trayecto/components/ChoicePills';
import { DepartureTimeControls } from '@/src/features/trayecto/components/DepartureTimeControls';
import {
  formatDurationLabel,
  localTrayectoActivityLabels,
  localTrayectoActivityOptions,
  localTrayectoDurationOptions,
} from '@/src/domain/trayecto/trayectoDomain';
import { appIcons } from '@/src/theme/iconography';
import { appTheme } from '@/src/theme/tokens';
import { textStyles } from '@/src/theme/textStyles';
import type { LocalTrayectoConfig, TrayectoActivityType, TrayectoDepartureMode } from '@/src/types/trayecto';

interface TrayectoLocalPlannerCardProps {
  config: LocalTrayectoConfig;
  onDurationChange: (durationMin: LocalTrayectoConfig['durationMin']) => void;
  onDepartureModeChange: (mode: TrayectoDepartureMode) => void;
  onDepartureTimeChange: (hour: number, minute: number) => void;
  onActivityTypeChange: (activityType: TrayectoActivityType) => void;
}

export function TrayectoLocalPlannerCard({
  config,
  onDurationChange,
  onDepartureModeChange,
  onDepartureTimeChange,
  onActivityTypeChange,
}: TrayectoLocalPlannerCardProps) {
  return (
    <SectionCard>
      <SectionHeading iconName={appIcons.trayectoModes.paseo_local} title="Planificar paseo local" />

      <View style={styles.block}>
        <Text style={styles.label}>Duración</Text>
        <ChoicePills
          accessibilityPrefix="Seleccionar duración"
          onChange={onDurationChange}
          options={localTrayectoDurationOptions.map((value) => ({
            value,
            label: formatDurationLabel(value),
            iconName: 'timer-outline',
          }))}
          value={config.durationMin}
        />
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>Salida</Text>
        <DepartureTimeControls
          hour={config.departureCustomHour}
          minute={config.departureCustomMinute}
          mode={config.departureMode}
          onModeChange={onDepartureModeChange}
          onTimeChange={onDepartureTimeChange}
        />
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>Actividad</Text>
        <ChoicePills
          accessibilityPrefix="Seleccionar actividad"
          onChange={onActivityTypeChange}
          options={localTrayectoActivityOptions.map((value) => ({
            value,
            label: localTrayectoActivityLabels[value],
            iconName: appIcons.trayectoActivities[value],
          }))}
          value={config.activityType}
        />
      </View>

      <Text style={[textStyles.subtle, styles.footnote]}>
        Solvía cruza lluvia, viento y sensación para decidir si salir ahora o esperar.
      </Text>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  block: {
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
  footnote: {
    marginTop: 2,
  },
});
