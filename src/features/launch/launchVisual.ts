import type { WeatherState } from '@/src/types/recommendations';

interface LaunchAtmosphereVisual {
  weatherState: WeatherState;
  accentColor: string;
  gradient: [string, string, string];
}

const visualByState: Record<WeatherState, LaunchAtmosphereVisual> = {
  pleasant_sunny: {
    weatherState: 'pleasant_sunny',
    accentColor: '#f6bc63',
    gradient: ['#3f6289', '#28435f', '#17253b'],
  },
  strong_sun: {
    weatherState: 'strong_sun',
    accentColor: '#ffb95f',
    gradient: ['#745242', '#3e4863', '#1b263a'],
  },
  soft_cloudy: {
    weatherState: 'soft_cloudy',
    accentColor: '#b9c8de',
    gradient: ['#42566f', '#2f4056', '#1a273a'],
  },
  rainy: {
    weatherState: 'rainy',
    accentColor: '#9fb7ce',
    gradient: ['#3f5570', '#2a3c53', '#182639'],
  },
  windy: {
    weatherState: 'windy',
    accentColor: '#b9c8de',
    gradient: ['#465d79', '#2f425a', '#1a273a'],
  },
  cool_evening: {
    weatherState: 'cool_evening',
    accentColor: '#9db9ea',
    gradient: ['#3d4f73', '#27354f', '#162136'],
  },
  golden_hour: {
    weatherState: 'golden_hour',
    accentColor: '#f6bc63',
    gradient: ['#7a5846', '#3f4464', '#1b263b'],
  },
  night_clear: {
    weatherState: 'night_clear',
    accentColor: '#9eb0e3',
    gradient: ['#2f3c5c', '#202a42', '#141d31'],
  },
};

export function resolveLaunchStateFromLocalTime(date = new Date()): WeatherState {
  const hour = date.getHours();
  if (hour >= 7 && hour <= 10) {
    return 'pleasant_sunny';
  }
  if (hour >= 11 && hour <= 16) {
    return 'strong_sun';
  }
  if (hour >= 17 && hour <= 20) {
    return 'golden_hour';
  }
  if (hour >= 21 || hour <= 5) {
    return 'night_clear';
  }
  return 'cool_evening';
}

export function resolveLaunchVisual(state: WeatherState): LaunchAtmosphereVisual {
  return visualByState[state];
}
