export function isClearWeatherCode(code: number): boolean {
  return code === 0 || code === 1;
}

export function isCloudyWeatherCode(code: number): boolean {
  return [2, 3, 45, 48].includes(code);
}

export function isRainWeatherCode(code: number): boolean {
  return (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    (code >= 95 && code <= 99)
  );
}

export function isStormWeatherCode(code: number): boolean {
  return code >= 95 && code <= 99;
}

export function getWeatherLabel(code: number, isDay: boolean): string {
  if (isRainWeatherCode(code)) {
    return 'Lluvia';
  }

  if (isCloudyWeatherCode(code)) {
    return 'Nubes suaves';
  }

  if (isClearWeatherCode(code)) {
    return isDay ? 'Cielo despejado' : 'Cielo limpio';
  }

  return 'Condiciones variables';
}
