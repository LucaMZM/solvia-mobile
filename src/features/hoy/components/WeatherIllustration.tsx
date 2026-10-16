import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { isCloudyWeatherCode, isRainWeatherCode } from '@/src/services/weather/weatherCode';
import { withAlpha } from '@/src/theme/colorUtils';
import { appTheme } from '@/src/theme/tokens';
import type { WeatherState } from '@/src/types/recommendations';

type WeatherVisualMood =
  | 'soleado'
  | 'parcialmente_nublado'
  | 'nublado'
  | 'lluvia'
  | 'tormenta'
  | 'viento'
  | 'niebla'
  | 'noche_despejada'
  | 'noche_nublada'
  | 'lluvia_nocturna';

interface WeatherIllustrationProps {
  accentColor: string;
  isDay: boolean;
  precipitationProbability: number;
  weatherCode: number;
  weatherState: WeatherState;
  windSpeedKmh: number;
}

const iconByMood: Record<WeatherVisualMood, keyof typeof MaterialCommunityIcons.glyphMap> = {
  soleado: 'white-balance-sunny',
  parcialmente_nublado: 'weather-partly-cloudy',
  nublado: 'weather-cloudy',
  lluvia: 'weather-pouring',
  tormenta: 'weather-lightning-rainy',
  viento: 'weather-windy',
  niebla: 'weather-fog',
  noche_despejada: 'weather-night',
  noche_nublada: 'weather-night-partly-cloudy',
  lluvia_nocturna: 'weather-night-partly-cloudy',
};

function resolveMood(params: WeatherIllustrationProps): WeatherVisualMood {
  const { isDay, precipitationProbability, weatherCode, weatherState, windSpeedKmh } = params;

  if (weatherCode >= 95) {
    return 'tormenta';
  }
  if (isRainWeatherCode(weatherCode) || precipitationProbability >= 55) {
    return isDay ? 'lluvia' : 'lluvia_nocturna';
  }
  if (weatherCode === 45 || weatherCode === 48) {
    return 'niebla';
  }
  if (weatherState === 'windy' || windSpeedKmh >= 30) {
    return 'viento';
  }
  if (!isDay) {
    return isCloudyWeatherCode(weatherCode) ? 'noche_nublada' : 'noche_despejada';
  }
  if (weatherCode === 2) {
    return 'parcialmente_nublado';
  }
  if (weatherCode === 3 || weatherState === 'soft_cloudy') {
    return 'nublado';
  }
  return 'soleado';
}

export function WeatherIllustration(props: WeatherIllustrationProps) {
  const mood = resolveMood(props);
  const iconName = iconByMood[mood];
  const glowColor = mood.includes('noche') ? appTheme.colors.secondary : props.accentColor;
  const showCloud = ['parcialmente_nublado', 'nublado', 'lluvia', 'tormenta', 'niebla', 'noche_nublada', 'lluvia_nocturna'].includes(mood);
  const showRain = mood === 'lluvia' || mood === 'lluvia_nocturna' || mood === 'tormenta';
  const showWind = mood === 'viento';

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <View style={[styles.halo, { backgroundColor: withAlpha(glowColor, 0.2) }]} />
      <LinearGradient
        colors={[withAlpha(glowColor, 0.44), withAlpha(glowColor, 0.08), withAlpha('#ffffff', 0)]}
        start={{ x: 0.22, y: 0.08 }}
        end={{ x: 0.9, y: 0.92 }}
        style={styles.orb}
      />
      {showCloud ? (
        <>
          <View style={[styles.cloud, styles.cloudBack]} />
          <View style={[styles.cloud, styles.cloudFront]} />
        </>
      ) : null}
      {showWind ? (
        <>
          <View style={[styles.windLine, styles.windLineOne]} />
          <View style={[styles.windLine, styles.windLineTwo]} />
          <View style={[styles.windLine, styles.windLineThree]} />
        </>
      ) : null}
      {showRain ? (
        <View style={styles.rainWrap}>
          {Array.from({ length: 7 }).map((_, index) => (
            <View key={index} style={[styles.rainDrop, { left: 18 + index * 14, height: 18 + (index % 3) * 5 }]} />
          ))}
        </View>
      ) : null}
      <View style={styles.iconPlate}>
        <MaterialCommunityIcons color={appTheme.colors.primary} name={iconName} size={72} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    height: 166,
    justifyContent: 'center',
    position: 'relative',
    width: 166,
  },
  halo: {
    borderRadius: 84,
    height: 168,
    opacity: 0.9,
    position: 'absolute',
    width: 168,
  },
  orb: {
    borderColor: withAlpha('#ffffff', 0.16),
    borderRadius: 66,
    borderWidth: 1,
    height: 132,
    position: 'absolute',
    width: 132,
  },
  cloud: {
    backgroundColor: withAlpha(appTheme.colors.primary, 0.18),
    borderColor: withAlpha(appTheme.colors.primary, 0.2),
    borderRadius: appTheme.radii.full,
    borderWidth: 1,
    position: 'absolute',
  },
  cloudBack: {
    height: 58,
    right: 14,
    top: 72,
    width: 108,
  },
  cloudFront: {
    height: 48,
    right: 42,
    top: 96,
    width: 88,
  },
  iconPlate: {
    alignItems: 'center',
    backgroundColor: withAlpha(appTheme.colors.surface, 0.24),
    borderColor: withAlpha('#ffffff', 0.2),
    borderRadius: 50,
    borderWidth: 1,
    height: 100,
    justifyContent: 'center',
    width: 100,
  },
  rainWrap: {
    height: 54,
    left: 18,
    position: 'absolute',
    top: 114,
    width: 126,
  },
  rainDrop: {
    backgroundColor: withAlpha(appTheme.colors.rainy, 0.72),
    borderRadius: appTheme.radii.full,
    position: 'absolute',
    top: 4,
    transform: [{ rotate: '14deg' }],
    width: 3,
  },
  windLine: {
    backgroundColor: withAlpha(appTheme.colors.primary, 0.36),
    borderRadius: appTheme.radii.full,
    height: 3,
    position: 'absolute',
  },
  windLineOne: {
    right: 8,
    top: 62,
    width: 84,
  },
  windLineTwo: {
    right: 26,
    top: 84,
    width: 108,
  },
  windLineThree: {
    right: 18,
    top: 106,
    width: 76,
  },
});
