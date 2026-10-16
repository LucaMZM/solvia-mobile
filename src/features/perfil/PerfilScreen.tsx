import { useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { Linking, StyleSheet, Switch, Text, View } from 'react-native';

import { AppScreen } from '@/src/components/ui/AppScreen';
import { MotionPressable } from '@/src/components/ui/MotionPressable';
import { PrimaryPillButton } from '@/src/components/ui/PrimaryPillButton';
import { ScreenSurface } from '@/src/components/ui/ScreenSurface';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { DailyBriefScheduleCard } from '@/src/features/perfil/components/DailyBriefScheduleCard';
import { NotificationPreferencesCard } from '@/src/features/perfil/components/NotificationPreferencesCard';
import { RoutinesCard } from '@/src/features/perfil/components/RoutinesCard';
import { buildDailyReportSections } from '@/src/features/briefing/dailyReport';
import {
  notificationCategoryLabels,
  thermalProfileLabels,
  thermalProfiles,
} from '@/src/features/perfil/perfilCopy';
import { LocationQuickSwitchCard } from '@/src/features/location/components/LocationQuickSwitchCard';
import { LocationSearchCard } from '@/src/features/location/components/LocationSearchCard';
import { SavedLocationsCard } from '@/src/features/location/components/SavedLocationsCard';
import { useLocationSelectionModel } from '@/src/features/location/useLocationSelectionModel';
import { useWeatherBriefing } from '@/src/hooks/useWeatherBriefing';
import {
  cancelDecisionNotificationsByCategory,
  cancelScheduledNotification,
  getNotificationPermissionStatus,
  openNotificationSettings,
  requestNotificationPermissionFlow,
  scheduleDailyBriefNotification,
  scheduleDailySunscreenReminder,
} from '@/src/services/notifications/notificationService';
import { usePreferencesStore } from '@/src/state/preferencesStore';
import { useRoutinesStore } from '@/src/state/routinesStore';
import { appIcons } from '@/src/theme/iconography';
import { appTheme } from '@/src/theme/tokens';
import { textStyles } from '@/src/theme/textStyles';
import type { NotificationCategory } from '@/src/types/notifications';
import type { CreateRoutineInput } from '@/src/types/routines';

export function PerfilScreen() {
  const [weatherSourceError, setWeatherSourceError] = useState(false);
  const [notificationSettingsMessage, setNotificationSettingsMessage] = useState<string | null>(null);
  const [dailyBriefMessage, setDailyBriefMessage] = useState<string | null>(null);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  const sunscreenReminderEnabled = usePreferencesStore((state) => state.sunscreenReminderEnabled);
  const setSunscreenReminderEnabled = usePreferencesStore((state) => state.setSunscreenReminderEnabled);
  const thermalProfile = usePreferencesStore((state) => state.thermalProfile);
  const setThermalProfile = usePreferencesStore((state) => state.setThermalProfile);
  const dailyBriefEnabled = usePreferencesStore((state) => state.dailyBriefEnabled);
  const dailyBriefHour = usePreferencesStore((state) => state.dailyBriefHour);
  const dailyBriefMinute = usePreferencesStore((state) => state.dailyBriefMinute);
  const dailyBriefNotificationId = usePreferencesStore((state) => state.dailyBriefNotificationId);
  const setDailyBriefEnabled = usePreferencesStore((state) => state.setDailyBriefEnabled);
  const setDailyBriefTime = usePreferencesStore((state) => state.setDailyBriefTime);
  const setDailyBriefNotificationId = usePreferencesStore((state) => state.setDailyBriefNotificationId);
  const notificationPermissionStatus = usePreferencesStore((state) => state.notificationPermissionStatus);
  const notificationCategories = usePreferencesStore((state) => state.notificationCategories);
  const setNotificationPermissionStatus = usePreferencesStore((state) => state.setNotificationPermissionStatus);
  const setNotificationCategoryEnabled = usePreferencesStore((state) => state.setNotificationCategoryEnabled);

  const routines = useRoutinesStore((state) => state.routines);
  const addRoutine = useRoutinesStore((state) => state.addRoutine);
  const setRoutineEnabled = useRoutinesStore((state) => state.setRoutineEnabled);
  const removeRoutine = useRoutinesStore((state) => state.removeRoutine);
  const { currentLocation, savedLocations } = useLocationSelectionModel();
  const { dailyBriefByMoment, snapshot } = useWeatherBriefing();
  const dailyReportSections = buildDailyReportSections(dailyBriefByMoment);
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const scheduledBriefMoment = dailyBriefHour < 12 ? 'manana' : dailyBriefHour < 20 ? 'tarde' : 'noche_siguiente';

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const status = await getNotificationPermissionStatus();
      if (mounted) {
        setNotificationPermissionStatus(status);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [setNotificationPermissionStatus]);

  const refreshPermissionStatus = async () => {
    const status = await getNotificationPermissionStatus();
    setNotificationPermissionStatus(status);
    return status;
  };

  const handleRequestNotificationPermission = async () => {
    const status = await requestNotificationPermissionFlow();
    setNotificationPermissionStatus(status);

    if (status === 'granted') {
      setNotificationSettingsMessage('Permisos activos.');
      return;
    }
    if (status === 'denied') {
      setNotificationSettingsMessage('Permisos bloqueados. Revísalos en Ajustes.');
      return;
    }
    setNotificationSettingsMessage('No pudimos confirmar permisos ahora.');
  };

  const handleOpenNotificationSettings = async () => {
    await openNotificationSettings();
    setNotificationSettingsMessage('Abriendo ajustes del sistema.');
  };

  const handleNotificationCategoryToggle = (category: NotificationCategory, enabled: boolean) => {
    setNotificationCategoryEnabled(category, enabled);
    const categoryLabel = notificationCategoryLabels[category];

    if (!enabled) {
      void cancelDecisionNotificationsByCategory(category);
      if (category === 'daily_brief') {
        void (async () => {
          await cancelScheduledNotification(dailyBriefNotificationId);
          setDailyBriefNotificationId(null);
        })();
        setDailyBriefMessage('Resumen diario desactivado.');
      }
      setNotificationSettingsMessage(`Notificaciones de ${categoryLabel} desactivadas.`);
      return;
    }

    if (category === 'daily_brief') {
      setDailyBriefMessage('Resumen diario activo. Guarda cambios.');
    }
    setNotificationSettingsMessage(`Notificaciones de ${categoryLabel} activadas.`);
  };

  const handleEnableReminder = async () => {
    const id = await scheduleDailySunscreenReminder();
    await refreshPermissionStatus();
    if (id) {
      setReminderMessage('Recordatorio diario activado a las 11:00.');
      setSunscreenReminderEnabled(true);
      return;
    }

    setReminderMessage('No pudimos activar el recordatorio.');
  };

  const handleDailyBriefToggle = (enabled: boolean) => {
    setDailyBriefEnabled(enabled);

    if (!enabled) {
      void (async () => {
        await cancelScheduledNotification(dailyBriefNotificationId);
        setDailyBriefNotificationId(null);
        setDailyBriefMessage('Resumen diario desactivado.');
      })();
      return;
    }

    setDailyBriefMessage('Resumen diario activo. Guarda cambios.');
  };

  const handleDailyBriefSchedule = async () => {
    const brief = dailyBriefByMoment?.[scheduledBriefMoment];
    if (!brief) {
      setDailyBriefMessage('Aún no hay resumen listo para programar.');
      return;
    }

    await cancelScheduledNotification(dailyBriefNotificationId);

    const scheduledId = await scheduleDailyBriefNotification({
      cityName: snapshot?.cityName ?? brief.cityName,
      moment: scheduledBriefMoment,
      summaryLine: brief.shortLine,
      hour: dailyBriefHour,
      minute: dailyBriefMinute,
    });
    await refreshPermissionStatus();

    if (scheduledId) {
      setDailyBriefEnabled(true);
      setDailyBriefNotificationId(scheduledId);
      setDailyBriefMessage('Programación guardada correctamente.');
      return;
    }

    setDailyBriefMessage('No pudimos programar el resumen diario.');
  };

  const handleDailyBriefTimeChange = (hour: number, minute: number) => {
    setDailyBriefTime(hour, minute);
  };

  const handleAddRoutine = (input: CreateRoutineInput) => {
    addRoutine(input);
  };

  return (
    <AppScreen>
      <View style={styles.profileHero}>
        <LinearGradient
          colors={['rgba(73,105,146,0.98)', 'rgba(31,51,83,0.98)', 'rgba(17,29,52,0.98)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.profileGlow}>
          <MaterialCommunityIcons color="rgba(248,251,255,0.7)" name="account-circle-outline" size={70} />
        </View>
        <Text style={styles.profileKicker}>Perfil</Text>
        <Text style={styles.title}>Control personal</Text>
        <Text numberOfLines={2} style={styles.profileSupport}>
          {currentLocation
            ? `${currentLocation.cityName} · ${thermalProfileLabels[thermalProfile]} · ${savedLocations.length} guardadas`
            : `${thermalProfileLabels[thermalProfile]} · ajustes meteorológicos`}
        </Text>
      </View>

      <ScreenSurface>
        <LocationQuickSwitchCard />
        <LocationSearchCard />
        <SavedLocationsCard />

        <SectionCard>
          <SectionHeading iconName="thermometer" title="Perfil térmico" />
          <Text numberOfLines={1} style={textStyles.supportOnSurface}>
            Ajusta cómo percibes el frío o calor.
          </Text>
          <View style={styles.thermalRow}>
            {thermalProfiles.map((profile) => {
              const active = thermalProfile === profile;
              return (
                <MotionPressable
                  accessibilityLabel={`Seleccionar perfil ${thermalProfileLabels[profile]}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  hapticType="selection"
                  hitSlop={6}
                  key={profile}
                  onPress={() => setThermalProfile(profile)}
                  pressedOpacity={0.9}
                  pressedScale={0.985}
                  reducedMotionPressedOpacity={0.86}
                  style={[styles.thermalChip, active ? styles.thermalChipActive : null]}>
                  <Text style={[styles.thermalChipLabel, active ? styles.thermalChipLabelActive : null]}>
                    {thermalProfileLabels[profile]}
                  </Text>
                </MotionPressable>
              );
            })}
          </View>
        </SectionCard>

        <DailyBriefScheduleCard
          dailyReportSections={dailyReportSections}
          enabled={dailyBriefEnabled}
          hour={dailyBriefHour}
          minute={dailyBriefMinute}
          onApply={() => void handleDailyBriefSchedule()}
          onTimeChange={handleDailyBriefTimeChange}
          onToggleEnabled={handleDailyBriefToggle}
          previewBrief={dailyBriefByMoment?.[scheduledBriefMoment] ?? null}
          statusMessage={dailyBriefMessage}
        />

        <NotificationPreferencesCard
          categories={notificationCategories}
          onOpenSystemSettings={() => void handleOpenNotificationSettings()}
          onRequestPermission={() => void handleRequestNotificationPermission()}
          onToggleCategory={handleNotificationCategoryToggle}
          permissionStatus={notificationPermissionStatus}
          statusMessage={notificationSettingsMessage}
        />

        <RoutinesCard
          currentLocation={currentLocation}
          onAddRoutine={handleAddRoutine}
          onRemoveRoutine={removeRoutine}
          onSetRoutineEnabled={setRoutineEnabled}
          routines={routines}
          savedLocations={savedLocations}
        />

        <SectionCard>
          <SectionHeading iconName={appIcons.modules.notificaciones} title="Recordatorios" />
          <View style={styles.switchRow}>
            <Text style={styles.supportText}>Aviso de protección solar</Text>
            <Switch
              accessibilityHint="Activa o desactiva sugerencias de protección solar."
              accessibilityLabel="Sugerir protección solar"
              onValueChange={setSunscreenReminderEnabled}
              thumbColor={sunscreenReminderEnabled ? appTheme.colors.warning : appTheme.colors.onSurfaceVariant}
              trackColor={{ false: '#405470', true: 'rgba(246,188,99,0.45)' }}
              value={sunscreenReminderEnabled}
            />
          </View>

          <PrimaryPillButton
            accessibilityHint="Solicita permisos y programa un recordatorio de protección solar."
            accessibilityLabel="Activar aviso diario"
            label="Activar aviso diario"
            onPress={() => void handleEnableReminder()}
            style={styles.button}
          />

          {reminderMessage ? <Text style={styles.subtle}>{reminderMessage}</Text> : null}
        </SectionCard>

        <SectionCard>
          <SectionHeading iconName="information-outline" title="Acerca de" />
          <View style={styles.aboutHeader}>
            <Text style={styles.aboutTitle}>Solvía by Mazmi Systems</Text>
            <Text style={styles.aboutVersion}>Versión {appVersion}</Text>
          </View>
          <View style={styles.aboutRows}>
            <View style={styles.aboutRow}>
              <MaterialCommunityIcons color={appTheme.colors.primary} name="shield-check-outline" size={18} />
              <View style={styles.aboutCopy}>
                <Text style={styles.aboutLabel}>Privacidad</Text>
                <Text style={styles.aboutText}>
                  Con tu permiso, enviamos coordenadas a Open-Meteo para consultar el tiempo. Tus preferencias se guardan en este dispositivo.
                </Text>
              </View>
            </View>
            <View style={styles.aboutRow}>
              <MaterialCommunityIcons color={appTheme.colors.primary} name="cloud-sync-outline" size={18} />
              <View style={styles.aboutCopy}>
                <Text style={styles.aboutLabel}>Fuentes meteorológicas</Text>
                <Text style={styles.aboutText}>Pronósticos de Open-Meteo; Solvía los interpreta para ayudarte a decidir.</Text>
                <MotionPressable
                  accessibilityLabel="Weather data by Open-Meteo. Abrir fuente meteorológica"
                  accessibilityRole="link"
                  onPress={() => {
                    setWeatherSourceError(false);
                    void Linking.openURL('https://open-meteo.com/').catch(() => setWeatherSourceError(true));
                  }}
                  style={styles.sourceLink}>
                  <Text style={styles.sourceLinkText}>Weather data by Open-Meteo</Text>
                </MotionPressable>
                {weatherSourceError ? <Text style={styles.aboutText}>No se pudo abrir el enlace. Visita open-meteo.com.</Text> : null}
              </View>
            </View>
            <View style={styles.aboutRow}>
              <MaterialCommunityIcons color={appTheme.colors.warning} name="compass-outline" size={18} />
              <View style={styles.aboutCopy}>
                <Text style={styles.aboutLabel}>Recomendaciones</Text>
                <Text style={styles.aboutText}>Son orientativas: revisa siempre el entorno real antes de salir.</Text>
              </View>
            </View>
          </View>
        </SectionCard>
      </ScreenSurface>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  profileHero: {
    borderColor: 'rgba(198,210,232,0.22)',
    borderRadius: appTheme.radii.xl,
    borderWidth: 1,
    minHeight: 178,
    overflow: 'hidden',
    padding: appTheme.spacing.cardPadding + 1,
    ...appTheme.elevation.card,
  },
  profileGlow: {
    alignItems: 'center',
    backgroundColor: 'rgba(248,251,255,0.08)',
    borderColor: 'rgba(248,251,255,0.12)',
    borderRadius: 90,
    borderWidth: 1,
    height: 158,
    justifyContent: 'center',
    position: 'absolute',
    right: -38,
    top: -26,
    width: 158,
  },
  profileKicker: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11,
    letterSpacing: 0.14,
    lineHeight: 15,
  },
  title: {
    ...textStyles.cardTitle,
    fontSize: 31,
    lineHeight: 36,
    marginTop: appTheme.spacing.md,
    maxWidth: '74%',
  },
  profileSupport: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 12.4,
    lineHeight: 17,
    marginTop: appTheme.spacing.xs,
    maxWidth: '78%',
  },
  subtle: {
    ...textStyles.subtle,
    marginTop: appTheme.spacing.sm,
  },
  supportText: {
    ...textStyles.supportOnSurface,
    marginTop: 2,
  },
  thermalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: appTheme.spacing.xs,
    marginTop: appTheme.spacing.sm,
  },
  thermalChip: {
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.28)',
    borderRadius: appTheme.radii.full,
    borderWidth: 1,
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  thermalChipActive: {
    backgroundColor: 'rgba(157,198,255,0.2)',
    borderColor: 'rgba(157,198,255,0.58)',
  },
  thermalChipLabel: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 12,
    letterSpacing: 0.08,
    lineHeight: 16,
  },
  thermalChipLabelActive: {
    color: appTheme.colors.primary,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    marginTop: appTheme.spacing.md,
  },
  aboutHeader: {
    borderBottomColor: 'rgba(154,172,202,0.14)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 3,
    paddingBottom: appTheme.spacing.sm,
  },
  aboutTitle: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.bodyLg,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  aboutVersion: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 11,
    lineHeight: 15,
  },
  aboutRows: {
    gap: appTheme.spacing.sm,
    marginTop: appTheme.spacing.md,
  },
  aboutRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: appTheme.spacing.sm,
  },
  aboutCopy: {
    flex: 1,
    gap: 2,
  },
  aboutLabel: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 12.5,
    lineHeight: 17,
  },
  aboutText: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 11.5,
    lineHeight: 16,
  },
  sourceLink: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: 44,
  },
  sourceLinkText: {
    color: appTheme.colors.secondary,
    ...appTheme.typography.functional,
    fontSize: 12,
    lineHeight: 18,
    textDecorationLine: 'underline',
  },
});
