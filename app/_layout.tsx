import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { LaunchGate } from '@/src/features/launch/LaunchGate';
import { runRecommendationRegressionChecksSafely } from '@/src/features/recommendations/recommendationRegressionChecks';
import { AppProviders } from '@/src/providers/AppProviders';
import { runWeatherRegressionChecksSafely } from '@/src/services/weather/weatherRegressionChecks';
import { appTheme } from '@/src/theme/tokens';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
  });

  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      void SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    runWeatherRegressionChecksSafely();
    runRecommendationRegressionChecksSafely();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <AppProviders>
      <LaunchGate>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: appTheme.colors.background,
            },
          }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </LaunchGate>
    </AppProviders>
  );
}
