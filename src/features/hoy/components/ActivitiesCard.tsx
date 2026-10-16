import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { RecommendationBadge } from '@/src/components/ui/RecommendationBadge';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { withAlpha } from '@/src/theme/colorUtils';
import { appIcons } from '@/src/theme/iconography';
import { appTheme } from '@/src/theme/tokens';
import type { ActivityId, ActivityRecommendation, ActivityTone } from '@/src/types/recommendations';

interface ActivitiesCardProps {
  activities: ActivityRecommendation[];
}

const activityIconById: Record<ActivityId, keyof typeof MaterialCommunityIcons.glyphMap> = appIcons.activities;

const toneAccentByTone: Record<ActivityTone, string> = {
  recomendado: appTheme.colors.onSurface,
  posible: appTheme.colors.secondary,
  evitar: appTheme.colors.danger,
  no_recomendado: appTheme.colors.danger,
  desafiante: appTheme.colors.warning,
  interior: appTheme.colors.secondary,
  zonas_protegidas: appTheme.colors.secondary,
};

export function ActivitiesCard({ activities }: ActivitiesCardProps) {
  const compactActivities = activities.slice(0, 4);

  return (
    <SectionCard>
      <SectionHeading iconName={appIcons.activities.caminar} title="Qué hacer ahora" />
      <View style={styles.grid}>
        {compactActivities.map((activity, index) => {
          const iconName = activityIconById[activity.id];
          const accent = toneAccentByTone[activity.tone];

          return (
            <View
              accessible
              accessibilityLabel={`${activity.label}. ${activity.detail}. ${activity.shortRecommendation}`.trim()}
              key={activity.id}
              style={[
                styles.actionRow,
                activity.muted ? styles.mutedCard : null,
                index === compactActivities.length - 1 ? styles.lastCard : null,
              ]}>
              <View
                style={[
                  styles.iconOrb,
                  {
                    backgroundColor: withAlpha(accent, 0.12),
                    borderColor: withAlpha(accent, 0.34),
                  },
                ]}>
                <MaterialCommunityIcons color={accent} name={iconName} size={18} />
              </View>

              <View style={styles.textBlock}>
                <View style={styles.titleRow}>
                  <Text numberOfLines={1} style={[styles.label, activity.muted ? styles.mutedLabel : null]}>
                    {activity.label}
                  </Text>
                  <RecommendationBadge detail={activity.detail} tone={activity.tone} />
                </View>
                <Text numberOfLines={1} style={[styles.hintText, activity.muted ? styles.mutedSupport : null]}>
                  {activity.shortRecommendation}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  grid: {
    marginTop: -2,
  },
  actionRow: {
    alignItems: 'center',
    borderBottomColor: withAlpha(appTheme.colors.outline, 0.16),
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 66,
    paddingVertical: 9,
  },
  lastCard: {
    borderBottomWidth: 0,
  },
  mutedCard: {
    opacity: 0.72,
  },
  iconOrb: {
    alignItems: 'center',
    borderRadius: appTheme.radii.full,
    borderWidth: 1,
    height: 35,
    justifyContent: 'center',
    marginTop: 1,
    width: 35,
  },
  textBlock: {
    flex: 1,
    marginLeft: appTheme.spacing.sm,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: appTheme.spacing.sm,
    justifyContent: 'space-between',
  },
  label: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.bodyLg,
    flexShrink: 1,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 15.2,
    letterSpacing: 0.08,
    lineHeight: 19,
  },
  mutedLabel: {
    color: withAlpha(appTheme.colors.onSurface, 0.72),
  },
  mutedSupport: {
    color: withAlpha(appTheme.colors.onSurfaceVariant, 0.72),
  },
  hintText: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    marginTop: 7,
    fontSize: 11.2,
    letterSpacing: 0.08,
    lineHeight: 14.5,
  },
});
