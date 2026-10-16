import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChoicePills } from '@/src/features/trayecto/components/ChoicePills';
import {
  normalizeDepartureTime,
  trayectoDepartureModeLabels,
  trayectoDepartureModes,
} from '@/src/domain/trayecto/trayectoDomain';
import { appTheme } from '@/src/theme/tokens';
import type { TrayectoDepartureMode } from '@/src/types/trayecto';

interface DepartureTimeControlsProps {
  mode: TrayectoDepartureMode;
  hour: number;
  minute: number;
  onModeChange: (mode: TrayectoDepartureMode) => void;
  onTimeChange: (hour: number, minute: number) => void;
}

function formatTime(hour: number, minute: number): string {
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return `${hh}:${mm}`;
}

function TimeAdjustButton({
  iconName,
  label,
  onPress,
}: {
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={styles.adjustButton}>
      <MaterialCommunityIcons color={appTheme.colors.onSurfaceVariant} name={iconName} size={15} />
    </Pressable>
  );
}

export function DepartureTimeControls({
  mode,
  hour,
  minute,
  onModeChange,
  onTimeChange,
}: DepartureTimeControlsProps) {
  const normalized = normalizeDepartureTime(hour, minute);

  const adjustMinutes = (delta: number) => {
    const total = normalized.hour * 60 + normalized.minute + delta;
    const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
    const nextHour = Math.floor(wrapped / 60);
    const nextMinute = wrapped % 60;
    onTimeChange(nextHour, nextMinute);
  };

  return (
    <View style={styles.container}>
      <ChoicePills
        accessibilityPrefix="Seleccionar salida"
        onChange={onModeChange}
        options={trayectoDepartureModes.map((value) => ({
          value,
          label: trayectoDepartureModeLabels[value],
          iconName: value === 'ahora' ? 'clock-fast' : 'clock-time-four-outline',
        }))}
        value={mode}
      />

      {mode === 'personalizada' ? (
        <View style={styles.timeEditor}>
          <Text style={styles.timeLabel}>Hora de salida</Text>
          <View style={styles.timeRow}>
            <TimeAdjustButton iconName="minus" label="Restar 15 minutos" onPress={() => adjustMinutes(-15)} />
            <Text style={styles.timeValue}>{formatTime(normalized.hour, normalized.minute)}</Text>
            <TimeAdjustButton iconName="plus" label="Sumar 15 minutos" onPress={() => adjustMinutes(15)} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: appTheme.spacing.md,
  },
  timeEditor: {
    alignItems: 'flex-start',
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.28)',
    borderRadius: appTheme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 10,
  },
  timeLabel: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11.5,
    letterSpacing: 0.08,
    lineHeight: 15,
  },
  timeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: appTheme.spacing.sm,
    marginTop: appTheme.spacing.sm,
  },
  adjustButton: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surfaceContainer,
    borderColor: 'rgba(154,172,202,0.28)',
    borderRadius: appTheme.radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  timeValue: {
    color: appTheme.colors.primary,
    ...appTheme.typography.bodyLg,
    fontSize: 20,
    lineHeight: 24,
    minWidth: 82,
    textAlign: 'center',
  },
});
