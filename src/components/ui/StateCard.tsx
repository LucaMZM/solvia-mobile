import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryPillButton } from '@/src/components/ui/PrimaryPillButton';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { appTheme } from '@/src/theme/tokens';
import { textStyles } from '@/src/theme/textStyles';

interface StateCardProps {
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  body: string;
  actionLabel?: string;
  onActionPress?: () => void;
  secondaryActionLabel?: string;
  onSecondaryActionPress?: () => void;
  tone?: 'default' | 'warning' | 'danger';
}

function toneColor(tone: NonNullable<StateCardProps['tone']>): string {
  if (tone === 'warning') {
    return appTheme.colors.warning;
  }
  if (tone === 'danger') {
    return appTheme.colors.danger;
  }
  return appTheme.colors.secondary;
}

export function StateCard({
  iconName,
  title,
  body,
  actionLabel,
  onActionPress,
  secondaryActionLabel,
  onSecondaryActionPress,
  tone = 'default',
}: StateCardProps) {
  const accent = toneColor(tone);

  return (
    <SectionCard>
      <View style={[styles.iconWrap, { borderColor: `${accent}88`, backgroundColor: `${accent}1a` }]}>
        <MaterialCommunityIcons color={accent} name={iconName} size={18} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>

      {actionLabel && onActionPress ? (
        <PrimaryPillButton label={actionLabel} onPress={onActionPress} style={styles.primaryAction} />
      ) : null}

      {secondaryActionLabel && onSecondaryActionPress ? (
        <Pressable
          accessibilityLabel={secondaryActionLabel}
          accessibilityRole="button"
          onPress={onSecondaryActionPress}
          style={styles.secondaryAction}>
          <Text style={styles.secondaryActionLabel}>{secondaryActionLabel}</Text>
        </Pressable>
      ) : null}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    borderRadius: appTheme.radii.full,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  title: {
    ...textStyles.cardTitle,
    fontSize: 28,
    lineHeight: 33,
    marginTop: appTheme.spacing.md,
  },
  body: {
    ...textStyles.support,
    marginTop: appTheme.spacing.sm,
  },
  primaryAction: {
    marginTop: appTheme.spacing.md,
  },
  secondaryAction: {
    alignSelf: 'flex-start',
    marginTop: appTheme.spacing.sm,
  },
  secondaryActionLabel: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 12,
    letterSpacing: 0.08,
    lineHeight: 16,
  },
});
