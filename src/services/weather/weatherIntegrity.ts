import { compareLocalIso, getLocalHour, getNowLocalIsoForTimezone } from '@/src/services/weather/localTime';
import type { WeatherSnapshot } from '@/src/types/weather';

const NIGHT_UV_MAX = 1;

function isLikelyNight(snapshot: WeatherSnapshot): boolean {
  const isNightByFlag = !snapshot.current.isDay;
  const hour = getLocalHour(snapshot.current.timeISO);
  const likelyNightByHour = hour <= 5 || hour >= 22;
  const beforeSunrise = compareLocalIso(snapshot.current.timeISO, snapshot.daily.sunriseISO) < 0;
  const afterSunset = compareLocalIso(snapshot.current.timeISO, snapshot.daily.sunsetISO) > 0;
  const outsideDaylightWindow = beforeSunrise || afterSunset;

  return isNightByFlag || (likelyNightByHour && outsideDaylightWindow);
}

function isNightPoint(isDay: boolean): boolean {
  // Open-Meteo already resolves `is_day` per hourly point and timezone. Reusing
  // today's sunrise/sunset for tomorrow's points would incorrectly erase UV.
  return !isDay;
}

function applyUvCoherenceToHourly(snapshot: WeatherSnapshot, warnings: string[]): WeatherSnapshot['hourly'] {
  return snapshot.hourly.map((point) => {
    const rawUv = Number.isFinite(point.uvIndex) ? point.uvIndex : 0;
    if (!Number.isFinite(point.uvIndex)) {
      warnings.push('hourly_uv_missing');
      return {
        ...point,
        uvIndex: 0,
      };
    }

    if (isNightPoint(point.isDay) && rawUv > NIGHT_UV_MAX) {
      warnings.push('hourly_uv_night_incoherent');
      return {
        ...point,
        uvIndex: 0,
      };
    }

    return point;
  });
}

function alignCurrentFromHourly(snapshot: WeatherSnapshot, warnings: string[]) {
  const nowLocalISO = getNowLocalIsoForTimezone(snapshot.timezone);
  if (!nowLocalISO || snapshot.hourly.length === 0) {
    return snapshot.current;
  }

  const nearestPoint = snapshot.hourly.reduce((best, point) => {
    const pointDelta = Math.abs(compareLocalIso(point.timeISO, nowLocalISO));
    const bestDelta = Math.abs(compareLocalIso(best.timeISO, nowLocalISO));
    return pointDelta < bestDelta ? point : best;
  }, snapshot.hourly[0]);

  const currentDelta = Math.abs(compareLocalIso(snapshot.current.timeISO, nowLocalISO));
  const nearestDelta = Math.abs(compareLocalIso(nearestPoint.timeISO, nowLocalISO));
  if (nearestDelta + 15 * 60_000 >= currentDelta) {
    return snapshot.current;
  }

  warnings.push('current_reanchored_from_hourly');
  return {
    ...snapshot.current,
    timeISO: nearestPoint.timeISO,
    temperatureC: nearestPoint.temperatureC,
    apparentTemperatureC: nearestPoint.apparentTemperatureC,
    isDay: nearestPoint.isDay,
    weatherCode: nearestPoint.weatherCode,
    precipitationMm: nearestPoint.precipitationMm,
    precipitationProbability: nearestPoint.precipitationProbability,
    windSpeedKmh: nearestPoint.windSpeedKmh,
    windGustKmh: nearestPoint.windGustKmh,
    uvIndex: nearestPoint.uvIndex,
    cloudCoverPct: nearestPoint.cloudCoverPct,
    humidityPct: nearestPoint.humidityPct,
  };
}

export function normalizeWeatherSnapshot(snapshot: WeatherSnapshot): WeatherSnapshot {
  const warnings: string[] = [];
  const normalizedHourly = applyUvCoherenceToHourly(snapshot, warnings);
  const alignedCurrent = alignCurrentFromHourly(
    {
      ...snapshot,
      hourly: normalizedHourly,
    },
    warnings,
  );
  const currentPoint = normalizedHourly.reduce<WeatherSnapshot['hourly'][number] | undefined>((nearest, point) => {
    if (!nearest) {
      return point;
    }
    return Math.abs(compareLocalIso(point.timeISO, alignedCurrent.timeISO)) <
      Math.abs(compareLocalIso(nearest.timeISO, alignedCurrent.timeISO))
      ? point
      : nearest;
  }, undefined);
  const candidateUv = currentPoint?.uvIndex ?? alignedCurrent.uvIndex;
  let uvIndex = 0;
  let uvStatus: 'available' | 'unavailable' = 'unavailable';

  const snapshotWithAlignedCurrent: WeatherSnapshot = {
    ...snapshot,
    current: alignedCurrent,
    hourly: normalizedHourly,
  };

  if (isLikelyNight(snapshotWithAlignedCurrent)) {
    if (Number.isFinite(candidateUv) && Number(candidateUv) > NIGHT_UV_MAX) {
      warnings.push('uv_night_incoherent');
    }
  } else if (Number.isFinite(candidateUv)) {
    uvIndex = Number(candidateUv);
    uvStatus = 'available';
  } else {
    warnings.push('uv_missing');
  }

  if (!Number.isFinite(alignedCurrent.temperatureC)) {
    warnings.push('current_temp_missing');
  }

  if (!Number.isFinite(alignedCurrent.apparentTemperatureC)) {
    warnings.push('current_apparent_missing');
  }

  const baseMeta = snapshot.meta ?? {
    source: 'live' as const,
    cacheAgeMinutes: 0,
    isStale: false,
  };
  const hasCriticalMissing = warnings.includes('current_temp_missing');
  const inferredDataStatus =
    baseMeta.source === 'demo'
      ? 'demo'
      : hasCriticalMissing
        ? 'unavailable'
        : warnings.length > 0
          ? 'partial'
          : 'available';

  const next: WeatherSnapshot = {
    ...snapshotWithAlignedCurrent,
    current: {
      ...snapshotWithAlignedCurrent.current,
      uvIndex,
      uvStatus,
    },
    hourly: normalizedHourly,
    meta: {
      ...baseMeta,
      dataStatus: inferredDataStatus,
      integrityWarnings: warnings,
    },
  };

  if (__DEV__ && warnings.length > 0) {
    const context = `${snapshot.cityName} @ ${snapshot.current.timeISO}`;
    // eslint-disable-next-line no-console
    console.warn('[weather] Se ajustó lectura incoherente:', context, warnings.join(', '));
  }

  return next;
}
