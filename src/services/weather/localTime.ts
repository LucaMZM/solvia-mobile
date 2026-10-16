interface LocalDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const OPEN_METEO_LOCAL_ISO_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(?::(\d{2}))?(?::(\d{2}))?$/;

function parseOpenMeteoLocalParts(value: string): LocalDateTimeParts | null {
  const normalized = value.trim();
  const match = OPEN_METEO_LOCAL_ISO_REGEX.exec(normalized);
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute = '00', second = '00'] = match;
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
  };
}

function toComparableMs(value: string): number {
  const localParts = parseOpenMeteoLocalParts(value);
  if (!localParts) {
    return new Date(value).getTime();
  }

  return Date.UTC(
    localParts.year,
    localParts.month - 1,
    localParts.day,
    localParts.hour,
    localParts.minute,
    localParts.second,
  );
}

export function getLocalHour(isoDate: string): number {
  const localParts = parseOpenMeteoLocalParts(isoDate);
  if (localParts) {
    return localParts.hour;
  }

  return new Date(isoDate).getHours();
}

export function getLocalClock(isoDate: string): string {
  const localParts = parseOpenMeteoLocalParts(isoDate);
  if (localParts) {
    return `${String(localParts.hour).padStart(2, '0')}:${String(localParts.minute).padStart(2, '0')}`;
  }

  const date = new Date(isoDate);
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
}

export function compareLocalIso(a: string, b: string): number {
  return toComparableMs(a) - toComparableMs(b);
}

export function minutesBetweenLocalIso(startISO: string, endISO: string): number {
  return Math.round((toComparableMs(endISO) - toComparableMs(startISO)) / 60_000);
}

export function getNowLocalIsoForTimezone(timezone: string): string | null {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    const parts = formatter.formatToParts(new Date());
    const get = (type: Intl.DateTimeFormatPartTypes): string | null =>
      parts.find((part) => part.type === type)?.value ?? null;

    const year = get('year');
    const month = get('month');
    const day = get('day');
    const hour = get('hour');
    const minute = get('minute');

    if (!year || !month || !day || !hour || !minute) {
      return null;
    }

    return `${year}-${month}-${day}T${hour}:${minute}`;
  } catch {
    return null;
  }
}
