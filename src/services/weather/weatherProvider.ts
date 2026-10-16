import type { WeatherRequestLocation } from '@/src/types/location';
import type { WeatherSnapshot } from '@/src/types/weather';

export interface WeatherProvider {
  id: string;
  getSnapshot: (location: WeatherRequestLocation) => Promise<WeatherSnapshot>;
}
