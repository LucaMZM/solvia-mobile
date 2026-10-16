import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { trayectoModeLabels } from '@/src/domain/trayecto/trayectoDomain';
import { withAlpha } from '@/src/theme/colorUtils';
import { appIcons } from '@/src/theme/iconography';
import { appTheme } from '@/src/theme/tokens';
import type { TrayectoMode } from '@/src/types/trayecto';

interface TrayectoHeroCardProps {
  mode: TrayectoMode;
  cityName: string;
  locationSubtitle?: string | null;
  summary: string;
  decision: string;
}

const iconByMode: Record<TrayectoMode, keyof typeof MaterialCommunityIcons.glyphMap> = appIcons.trayectoModes;

const accentByMode: Record<TrayectoMode, string> = {
  paseo_local: '#b9c8de',
  coche_ruta: '#f6bc63',
};

const gradientByMode: Record<TrayectoMode, [string, string, string]> = {
  paseo_local: ['#3f6488', '#2e4867', '#18253f'],
  coche_ruta: ['#6b5444', '#3f4f71', '#18253f'],
};

export function TrayectoHeroCard({ mode, cityName, locationSubtitle, summary, decision }: TrayectoHeroCardProps) {
  const accent = accentByMode[mode];

  return (
    <View style={styles.wrapper}>
      <LinearGradient colors={gradientByMode[mode]} style={StyleSheet.absoluteFillObject} />
      <View style={[styles.routeGlow, { backgroundColor: withAlpha(accent, 0.16) }]} />
      <View style={styles.routeVisual} pointerEvents="none">
        <View style={[styles.routeNode, { borderColor: withAlpha(accent, 0.62) }]} />
        <View style={[styles.routeLine, { backgroundColor: withAlpha(accent, 0.42) }]} />
        <View style={[styles.routeNodeLarge, { backgroundColor: withAlpha(accent, 0.16), borderColor: withAlpha(accent, 0.48) }]}>
          <MaterialCommunityIcons color={accent} name={iconByMode[mode]} size={34} />
        </View>
      </View>
      <View style={styles.topRow}>
        <View style={[styles.modeBadge, { borderColor: withAlpha(accent, 0.46) }]}>
          <MaterialCommunityIcons color={accent} name={iconByMode[mode]} size={14} />
          <Text style={[styles.modeBadgeText, { color: accent }]}>{trayectoModeLabels[mode]}</Text>
        </View>
        <MaterialCommunityIcons color={withAlpha(appTheme.colors.primary, 0.18)} name="vector-polyline" size={28} />
      </View>

      <View style={styles.cityRow}>
        <MaterialCommunityIcons color={appTheme.colors.onSurfaceVariant} name="map-marker-outline" size={14} />
        <Text style={styles.cityText}>{cityName}</Text>
        {locationSubtitle ? <Text style={styles.locationSubtitle}> · {locationSubtitle}</Text> : null}
      </View>

      <Text style={styles.title}>{decision}</Text>
      <Text numberOfLines={2} style={styles.summary}>
        {summary}
      </Text>

      <View style={styles.decisionRow}>
        <MaterialCommunityIcons color={accent} name="star-four-points-outline" size={13} />
        <Text numberOfLines={1} style={styles.decisionText}>
          {mode === 'paseo_local' ? 'Salida, lluvia y viento en 1 vistazo' : 'Ruta, lluvia y llegada en 1 vistazo'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderColor: 'rgba(198,210,232,0.24)',
    borderRadius: appTheme.radii.xl,
    borderWidth: 1,
    minHeight: 204,
    overflow: 'hidden',
    padding: appTheme.spacing.cardPadding,
    ...appTheme.elevation.card,
  },
  routeGlow: {
    borderRadius: 150,
    height: 260,
    position: 'absolute',
    right: -98,
    top: -80,
    width: 260,
  },
  routeVisual: {
    alignItems: 'center',
    flexDirection: 'row',
    opacity: 0.78,
    position: 'absolute',
    right: -6,
    top: 52,
  },
  routeNode: {
    backgroundColor: 'rgba(248,251,255,0.1)',
    borderRadius: appTheme.radii.full,
    borderWidth: 1,
    height: 18,
    width: 18,
  },
  routeLine: {
    height: 2,
    width: 42,
  },
  routeNodeLarge: {
    alignItems: 'center',
    borderRadius: appTheme.radii.full,
    borderWidth: 1,
    height: 82,
    justifyContent: 'center',
    width: 82,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modeBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(24,36,59,0.42)',
    borderRadius: appTheme.radii.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: appTheme.spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modeBadgeText: {
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 10.8,
    lineHeight: 14,
    letterSpacing: 0.08,
  },
  cityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    marginTop: appTheme.spacing.sm,
  },
  cityText: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.1,
  },
  locationSubtitle: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 10,
    lineHeight: 14,
  },
  title: {
    color: appTheme.colors.primary,
    marginTop: appTheme.spacing.sm,
    ...appTheme.typography.title,
    fontSize: 25,
    lineHeight: 30,
    maxWidth: '82%',
  },
  summary: {
    color: appTheme.colors.onSurfaceVariant,
    marginTop: appTheme.spacing.xs,
    ...appTheme.typography.functional,
    fontSize: 12,
    lineHeight: 16,
    maxWidth: '84%',
  },
  decisionRow: {
    alignItems: 'center',
    borderColor: 'rgba(198,210,232,0.24)',
    borderRadius: appTheme.radii.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    marginTop: appTheme.spacing.sm,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  decisionText: {
    color: appTheme.colors.onSurface,
    flex: 1,
    ...appTheme.typography.functional,
    fontSize: 11.5,
    lineHeight: 16,
  },
});
