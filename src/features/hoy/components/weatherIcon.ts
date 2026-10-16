import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

import { isCloudyWeatherCode, isRainWeatherCode } from '@/src/services/weather/weatherCode';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function weatherIconName(code: number, isDay: boolean): IconName {
  if (isRainWeatherCode(code)) {
    return 'weather-rainy';
  }

  if (isCloudyWeatherCode(code)) {
    return 'weather-cloudy';
  }

  return isDay ? 'weather-sunny' : 'weather-night';
}
