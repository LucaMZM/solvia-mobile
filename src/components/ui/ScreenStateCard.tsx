import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import { AppScreen } from '@/src/components/ui/AppScreen';
import { PrimaryPillButton } from '@/src/components/ui/PrimaryPillButton';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { appTheme } from '@/src/theme/tokens';
import { textStyles } from '@/src/theme/textStyles';

interface ScreenStateCardProps {
  title: string;
  body: string;
  loading?: boolean;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function ScreenStateCard({
  title,
  body,
  loading = false,
  actionLabel,
  onActionPress,
}: ScreenStateCardProps) {
  return (
    <AppScreen>
      <SectionCard style={styles.card}>
        {loading ? <ActivityIndicator color={appTheme.colors.secondary} /> : null}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        {actionLabel && onActionPress ? (
          <PrimaryPillButton label={actionLabel} onPress={onActionPress} style={styles.button} />
        ) : null}
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: appTheme.spacing.section,
  },
  title: {
    ...textStyles.cardTitle,
    fontSize: 34,
    lineHeight: 40,
    marginTop: appTheme.spacing.md,
  },
  body: {
    ...textStyles.support,
    marginTop: appTheme.spacing.sm,
  },
  button: {
    marginTop: appTheme.spacing.lg,
  },
});
