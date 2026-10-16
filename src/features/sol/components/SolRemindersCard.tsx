import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { ReadMoreText } from '@/src/components/ui/ReadMoreText';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { appTheme } from '@/src/theme/tokens';
import type { SolReminder } from '@/src/features/sol/solModel';

interface SolRemindersCardProps {
  reminders: SolReminder[];
  confidenceSupport: string;
}

export function SolRemindersCard({ reminders, confidenceSupport }: SolRemindersCardProps) {
  return (
    <SectionCard>
      <SectionHeading iconName="shield-check-outline" title="Protección rápida" />

      <View style={styles.list}>
        {reminders.map((reminder) => (
          <View key={reminder.id} style={styles.item}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons color={appTheme.colors.secondary} name={reminder.iconName} size={16} />
            </View>
            <View style={styles.content}>
              <Text style={styles.title}>{reminder.title}</Text>
              <ReadMoreText
                detailSummary={reminder.title}
                iconName={reminder.iconName}
                numberOfLines={2}
                style={styles.detail}
                text={reminder.detail}
                title={reminder.title}
              />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.confidenceBlock}>
        <MaterialCommunityIcons color={appTheme.colors.onSurfaceVariant} name="information-outline" size={14} />
        <View style={styles.confidenceCopy}>
          <ReadMoreText
            detailSummary="Confianza del pronóstico UV"
            iconName="information-outline"
            numberOfLines={2}
            style={styles.confidenceText}
            text={confidenceSupport}
            title="Confianza del pronóstico"
          />
        </View>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: appTheme.spacing.xs,
  },
  item: {
    alignItems: 'flex-start',
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.26)',
    borderRadius: appTheme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: appTheme.spacing.sm,
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: 9,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surfaceContainer,
    borderColor: 'rgba(154,172,202,0.26)',
    borderRadius: appTheme.radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    height: 30,
    justifyContent: 'center',
    marginTop: 2,
    width: 30,
  },
  content: {
    flex: 1,
  },
  title: {
    color: appTheme.colors.onSurface,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 13.2,
    lineHeight: 17,
  },
  detail: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 11.4,
    lineHeight: 15,
    marginTop: 1,
  },
  confidenceBlock: {
    alignItems: 'flex-start',
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.24)',
    borderRadius: appTheme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: appTheme.spacing.xs,
    marginTop: appTheme.spacing.sm,
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: 9,
  },
  confidenceCopy: {
    flex: 1,
  },
  confidenceText: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 11.2,
    lineHeight: 15,
  },
});
