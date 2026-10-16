import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { MotionPressable } from '@/src/components/ui/MotionPressable';
import { PrimaryPillButton } from '@/src/components/ui/PrimaryPillButton';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { appIcons, type AppIconName } from '@/src/theme/iconography';
import { appTheme } from '@/src/theme/tokens';
import type {
  NotificationCategory,
  NotificationCategoryPreferences,
  NotificationPermissionStatus,
} from '@/src/types/notifications';

interface NotificationPreferencesCardProps {
  permissionStatus: NotificationPermissionStatus;
  categories: NotificationCategoryPreferences;
  statusMessage: string | null;
  onRequestPermission: () => void;
  onOpenSystemSettings: () => void;
  onToggleCategory: (category: NotificationCategory, enabled: boolean) => void;
}

interface CategoryMeta {
  category: NotificationCategory;
  icon: AppIconName;
  title: string;
  support: string;
}

const categoryMeta: readonly CategoryMeta[] = [
  {
    category: 'daily_brief',
    icon: appIcons.notificationCategories.daily_brief,
    title: 'Resumen diario',
    support: 'Resumen breve a tu hora elegida.',
  },
  {
    category: 'weather_adaptive',
    icon: appIcons.notificationCategories.weather_adaptive,
    title: 'Cambios del tiempo',
    support: 'Avisos por cambios clave del clima.',
  },
  {
    category: 'routine',
    icon: appIcons.notificationCategories.routine,
    title: 'Rutinas personales',
    support: 'Avisos para hábitos repetidos.',
  },
  {
    category: 'route_trip',
    icon: appIcons.notificationCategories.route_trip,
    title: 'Trayectos',
    support: 'Avisos antes de salir en ruta.',
  },
];

function permissionBadge(status: NotificationPermissionStatus): {
  label: string;
  support: string;
  tone: 'ok' | 'pending' | 'blocked';
} {
  if (status === 'granted') {
    return {
      label: 'Permisos activos',
      support: 'Las alertas están listas.',
      tone: 'ok',
    };
  }
  if (status === 'denied') {
    return {
      label: 'Permisos bloqueados',
      support: 'Actívalos en Ajustes.',
      tone: 'blocked',
    };
  }
  return {
    label: 'Permisos pendientes',
    support: 'Concede permisos para activar alertas.',
    tone: 'pending',
  };
}

export function NotificationPreferencesCard({
  permissionStatus,
  categories,
  statusMessage,
  onRequestPermission,
  onOpenSystemSettings,
  onToggleCategory,
}: NotificationPreferencesCardProps) {
  const badge = permissionBadge(permissionStatus);
  const permissionActionLabel = permissionStatus === 'unknown' ? 'Conceder permisos' : 'Abrir ajustes';
  const onPermissionAction = permissionStatus === 'unknown' ? onRequestPermission : onOpenSystemSettings;

  return (
    <SectionCard>
      <SectionHeading iconName={appIcons.modules.notificaciones} title="Notificaciones inteligentes" />
      <Text numberOfLines={1} style={styles.intro}>
        Activa solo lo importante.
      </Text>

      <View
        accessibilityLabel={`${badge.label}. ${badge.support}`}
        accessibilityRole="text"
        accessible
        style={[
          styles.permissionBadge,
          badge.tone === 'ok' ? styles.permissionBadgeOk : null,
          badge.tone === 'blocked' ? styles.permissionBadgeBlocked : null,
        ]}>
        <Text style={styles.permissionLabel}>{badge.label}</Text>
        <Text style={styles.permissionSupport}>{badge.support}</Text>
      </View>

      <PrimaryPillButton
        accessibilityLabel={permissionActionLabel}
        label={permissionActionLabel}
        onPress={onPermissionAction}
        style={styles.permissionButton}
      />

      <View style={styles.categoriesWrap}>
        {categoryMeta.map((meta) => {
          const enabled = categories[meta.category];
          return (
            <View key={meta.category} style={styles.categoryRow}>
              <MotionPressable
                accessibilityHint="Toca para activar o desactivar esta categoría."
                accessibilityLabel={`${meta.title}. ${enabled ? 'Activo' : 'Desactivado'}`}
                accessibilityRole="button"
                accessibilityState={{ selected: enabled }}
                hapticType="selection"
                hitSlop={6}
                onPress={() => onToggleCategory(meta.category, !enabled)}
                pressedOpacity={0.9}
                pressedScale={0.99}
                reducedMotionPressedOpacity={0.86}
                style={styles.categoryMainAction}>
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons
                    color={enabled ? appTheme.colors.secondary : appTheme.colors.onSurfaceVariant}
                    name={meta.icon}
                    size={16}
                  />
                </View>
                <View style={styles.categoryCopy}>
                  <Text style={styles.categoryTitle}>{meta.title}</Text>
                  <Text numberOfLines={2} style={styles.categorySupport}>
                    {meta.support}
                  </Text>
                </View>
              </MotionPressable>
              <Switch
                accessibilityLabel={`Activar o desactivar ${meta.title}`}
                onValueChange={(value) => onToggleCategory(meta.category, value)}
                thumbColor={enabled ? appTheme.colors.secondary : appTheme.colors.onSurfaceVariant}
                trackColor={{ false: '#405470', true: 'rgba(154,194,255,0.45)' }}
                value={enabled}
              />
            </View>
          );
        })}
      </View>

      {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  intro: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  permissionBadge: {
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.26)',
    borderRadius: appTheme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: appTheme.spacing.md,
    padding: appTheme.spacing.md,
  },
  permissionBadgeOk: {
    borderColor: 'rgba(159,204,143,0.56)',
  },
  permissionBadgeBlocked: {
    borderColor: 'rgba(255,143,147,0.56)',
  },
  permissionLabel: {
    color: appTheme.colors.primary,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11.4,
    letterSpacing: 0.08,
    lineHeight: 14,
  },
  permissionSupport: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  permissionButton: {
    marginTop: appTheme.spacing.sm,
  },
  categoriesWrap: {
    gap: appTheme.spacing.xs,
    marginTop: appTheme.spacing.sm,
  },
  categoryRow: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.24)',
    borderRadius: appTheme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
  },
  categoryMainAction: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    minHeight: 44,
    paddingRight: appTheme.spacing.sm,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(157,198,255,0.12)',
    borderRadius: appTheme.radii.full,
    height: 28,
    justifyContent: 'center',
    marginRight: appTheme.spacing.sm,
    width: 28,
  },
  categoryCopy: {
    flex: 1,
    paddingRight: appTheme.spacing.sm,
  },
  categoryTitle: {
    color: appTheme.colors.onSurface,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 14,
    lineHeight: 19,
  },
  categorySupport: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 11.8,
    lineHeight: 16,
    marginTop: 1,
  },
  statusText: {
    color: appTheme.colors.onSurfaceVariant,
    marginTop: appTheme.spacing.sm,
    ...appTheme.typography.functional,
    fontSize: 12,
    lineHeight: 18,
  },
});
