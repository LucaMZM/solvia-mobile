import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { appTheme } from '@/src/theme/tokens';

interface OfflineBannerProps {
  title?: string;
  body: string;
}

export function OfflineBanner({ title = 'Actualización pendiente', body }: OfflineBannerProps) {
  return (
    <View accessibilityLabel={`${title}. ${body}`} accessibilityRole="text" accessible style={styles.banner}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons color={appTheme.colors.warning} name="wifi-strength-alert-outline" size={14} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: 'rgba(246,188,99,0.1)',
    borderColor: 'rgba(246,188,99,0.35)',
    borderRadius: appTheme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: appTheme.spacing.sm,
    paddingTop: 2,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: appTheme.colors.warning,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11.2,
    letterSpacing: 0.08,
    lineHeight: 14,
  },
  body: {
    color: appTheme.colors.onSurface,
    marginTop: 4,
    ...appTheme.typography.functional,
    fontSize: 12,
    lineHeight: 18,
  },
});
