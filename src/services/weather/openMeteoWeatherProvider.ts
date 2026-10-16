import { fetchOpenMeteoForecast } from '@/src/services/weather/openMeteoApi';
import { parseOpenMeteoForecast } from '@/src/services/weather/parsers';
import type { WeatherProvider } from '@/src/services/weather/weatherProvider';

export const openMeteoWeatherProvider: WeatherProvider = {
  id: 'open-meteo',
  getSnapshot: async (location) => {
    const payload = await fetchOpenMeteoForecast(location.coordinates);
    return parseOpenMeteoForecast(payload, location.cityName);
  },
};
