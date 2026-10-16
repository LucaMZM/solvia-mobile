import { StyleSheet, Text, View } from 'react-native';

import { LaunchFrame } from '@/src/features/launch/components/LaunchFrame';
import { appTheme } from '@/src/theme/tokens';
import type { WeatherState } from '@/src/types/recommendations';

interface SolviaLaunchSplashProps {
  weatherState: WeatherState;
  accentColor: string;
  gradient: [string, string, string];
}

export function SolviaLaunchSplash({ weatherState, accentColor, gradient }: SolviaLaunchSplashProps) {
  return (
    <LaunchFrame
      accentColor={accentColor}
      gradient={gradient}
      subtitle="Tu asistente premium para decidir cada salida."
      title="Tu clima, traducido en decisiones."
      weatherState={weatherState}>
      <View style={styles.bottomBlock}>
        <Text style={styles.wordmark}>Solvía</Text>
        <Text style={styles.pulse}>Preparando tu día…</Text>
      </View>
    </LaunchFrame>
  );
}

const styles = StyleSheet.create({
  bottomBlock: {
    alignItems: 'center',
    gap: appTheme.spacing.sm,
    justifyContent: 'center',
    paddingBottom: appTheme.spacing.lg,
  },
  wordmark: {
    color: appTheme.colors.onSurface,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 31,
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  pulse: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 13,
    lineHeight: 18,
  },
});
