import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { MotionPressable } from '@/src/components/ui/MotionPressable';
import { PremiumDetailSheet } from '@/src/components/ui/PremiumDetailSheet';
import { PrimaryPillButton } from '@/src/components/ui/PrimaryPillButton';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import type { DailyReportSection } from '@/src/features/briefing/dailyReport';
import { appIcons } from '@/src/theme/iconography';
import { appTheme } from '@/src/theme/tokens';
import type { DailyBrief } from '@/src/types/briefing';

interface DailyBriefScheduleCardProps {
  enabled: boolean;
  hour: number;
  minute: number;
  previewBrief: DailyBrief | null;
  dailyReportSections: DailyReportSection[];
  statusMessage: string | null;
  onToggleEnabled: (enabled: boolean) => void;
  onTimeChange: (hour: number, minute: number) => void;
  onApply: () => void;
}

function padTwo(value: number): string {
  return value.toString().padStart(2, '0');
}

function formatTime(hour: number, minute: number): string {
  return `${padTwo(hour)}:${padTwo(minute)}`;
}

function adjustByMinutes(hour: number, minute: number, delta: number): { hour: number; minute: number } {
  const totalMinutes = ((hour * 60 + minute + delta) % (24 * 60) + 24 * 60) % (24 * 60);
  return {
    hour: Math.floor(totalMinutes / 60),
    minute: totalMinutes % 60,
  };
}

export function DailyBriefScheduleCard({
  enabled,
  hour,
  minute,
  previewBrief,
  dailyReportSections,
  statusMessage,
  onToggleEnabled,
  onTimeChange,
  onApply,
}: DailyBriefScheduleCardProps) {
  const [isReportVisible, setReportVisible] = useState(false);

  return (
    <>
      <SectionCard>
        <SectionHeading iconName={appIcons.modules.resumenDiario} title="Resumen diario" />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Activar resumen diario</Text>
          <Switch
            accessibilityLabel="Activar resumen diario"
            onValueChange={onToggleEnabled}
            thumbColor={enabled ? appTheme.colors.warning : appTheme.colors.onSurfaceVariant}
            trackColor={{ false: '#405470', true: 'rgba(246,188,99,0.45)' }}
            value={enabled}
          />
        </View>

        <Text style={[styles.groupLabel, styles.timeLabel]}>Hora</Text>
        <View style={styles.timeRow}>
          <MotionPressable
            accessibilityLabel="Reducir hora del resumen diario"
            accessibilityRole="button"
            hapticType="selection"
            hitSlop={8}
            onPress={() => {
              const next = adjustByMinutes(hour, minute, -15);
              onTimeChange(next.hour, next.minute);
            }}
            pressedOpacity={0.9}
            pressedScale={0.98}
            reducedMotionPressedOpacity={0.86}
            style={styles.timeButton}>
            <MaterialCommunityIcons color={appTheme.colors.onSurfaceVariant} name="minus" size={16} />
          </MotionPressable>
          <Text style={styles.timeValue}>{formatTime(hour, minute)}</Text>
          <MotionPressable
            accessibilityLabel="Aumentar hora del resumen diario"
            accessibilityRole="button"
            hapticType="selection"
            hitSlop={8}
            onPress={() => {
              const next = adjustByMinutes(hour, minute, 15);
              onTimeChange(next.hour, next.minute);
            }}
            pressedOpacity={0.9}
            pressedScale={0.98}
            reducedMotionPressedOpacity={0.86}
            style={styles.timeButton}>
            <MaterialCommunityIcons color={appTheme.colors.onSurfaceVariant} name="plus" size={16} />
          </MotionPressable>
        </View>

        <MotionPressable
          accessibilityLabel="Abrir informe diario completo"
          accessibilityRole="button"
          hapticType="selection"
          onPress={() => setReportVisible(true)}
          pressedOpacity={0.93}
          pressedScale={0.992}
          reducedMotionPressedOpacity={0.88}
          style={styles.previewCard}>
          <Text style={styles.previewTitle}>Resumen de hoy</Text>
          <Text numberOfLines={2} style={styles.previewLine}>
            {previewBrief ? previewBrief.shortLine : 'Aún no hay resumen listo.'}
          </Text>
          <Text style={styles.previewHint}>Toca para ver mañana, mediodía, tarde y noche</Text>
        </MotionPressable>

        <PrimaryPillButton
          accessibilityLabel="Guardar programación del resumen diario"
          label={enabled ? 'Guardar horario' : 'Guardar'}
          onPress={onApply}
          style={styles.applyButton}
        />

        {statusMessage ? (
          <Text numberOfLines={2} style={styles.statusText}>
            {statusMessage}
          </Text>
        ) : null}
      </SectionCard>

      <PremiumDetailSheet
        iconName={appIcons.modules.resumenDiario}
        mainValue="Informe diario"
        onClose={() => setReportVisible(false)}
        rows={dailyReportSections.map((section) => ({
          label: section.title,
          value: section.summary,
        }))}
        summary="Resumen útil por tramo del día, sin detalle hora a hora."
        title="Resumen diario"
        visible={isReportVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  switchLabel: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 13.5,
    lineHeight: 19,
  },
  groupLabel: {
    color: appTheme.colors.onSurfaceVariant,
    marginTop: appTheme.spacing.sm,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11.8,
    letterSpacing: 0.08,
    lineHeight: 15,
  },
  timeLabel: {
    marginTop: appTheme.spacing.md,
  },
  timeRow: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.28)',
    borderRadius: appTheme.radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    marginTop: appTheme.spacing.sm,
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: 4,
  },
  timeButton: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  timeValue: {
    color: appTheme.colors.primary,
    ...appTheme.typography.body,
    fontSize: 18,
    lineHeight: 24,
    minWidth: 74,
    textAlign: 'center',
  },
  previewCard: {
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.24)',
    borderRadius: appTheme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: appTheme.spacing.md,
    padding: appTheme.spacing.md,
  },
  previewTitle: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11,
    letterSpacing: 0.08,
    lineHeight: 14,
  },
  previewLine: {
    color: appTheme.colors.onSurface,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 13,
    letterSpacing: 0.08,
    lineHeight: 18,
    marginTop: 6,
  },
  previewHint: {
    color: appTheme.colors.secondary,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11.2,
    lineHeight: 15,
    marginTop: 6,
  },
  applyButton: {
    marginTop: appTheme.spacing.md,
  },
  statusText: {
    color: appTheme.colors.onSurfaceVariant,
    marginTop: appTheme.spacing.sm,
    ...appTheme.typography.functional,
    fontSize: 12,
    lineHeight: 18,
  },
});
