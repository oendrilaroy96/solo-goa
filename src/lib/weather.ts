// Open-Meteo weather integration — no API key required
// Docs: https://open-meteo.com/

const WMO_EMOJI: Record<number, string> = {
  0: '☀',
  1: '🌤', 2: '⛅', 3: '☁',
  45: '🌫', 48: '🌫',
  51: '🌦', 53: '🌦', 55: '🌦',
  61: '🌧', 63: '🌧', 65: '🌧',
  71: '🌨', 73: '🌨', 75: '🌨', 77: '🌨',
  80: '🌦', 81: '🌦', 82: '⛈',
  85: '🌨', 86: '🌨',
  95: '⛈', 96: '⛈', 99: '⛈',
};

function wmoEmoji(code: number): string {
  return WMO_EMOJI[code] ?? '🌡';
}

async function geocode(query: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
    );
    const json = await res.json();
    if (!json.results?.length) return null;
    return { lat: json.results[0].latitude, lon: json.results[0].longitude };
  } catch {
    return null;
  }
}

async function fetchRange(
  lat: number, lon: number,
  startDate: string, endDate: string,
  archive: boolean
): Promise<Record<string, string>> {
  try {
    const base = archive
      ? 'https://archive-api.open-meteo.com/v1/archive'
      : 'https://api.open-meteo.com/v1/forecast';
    const url =
      `${base}?latitude=${lat}&longitude=${lon}` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&timezone=auto&start_date=${startDate}&end_date=${endDate}`;
    const res = await fetch(url);
    const json = await res.json();
    const daily = json.daily;
    if (!daily?.time?.length) return {};
    const out: Record<string, string> = {};
    for (let i = 0; i < daily.time.length; i++) {
      const emoji = wmoEmoji(daily.weather_code[i]);
      const lo    = Math.round(daily.temperature_2m_min[i]);
      const hi    = Math.round(daily.temperature_2m_max[i]);
      out[daily.time[i]] = `${emoji} ${lo}–${hi}°C`;
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Geocodes the destination then fetches daily weather for every date
 * in [startDate, endDate] (YYYY-MM-DD strings).
 * Returns a map of { "YYYY-MM-DD": "☀ 28–32°C" }.
 */
export async function fetchTripWeather(
  destination: string,
  startDate: string,
  endDate: string
): Promise<Record<string, string>> {
  const coords = await geocode(destination);
  if (!coords) return {};

  const today       = new Date().toISOString().split('T')[0];
  const maxForecast = new Date(Date.now() + 15 * 86_400_000).toISOString().split('T')[0];
  const result: Record<string, string> = {};

  // Past dates → archive API
  if (startDate < today) {
    const archiveEnd = endDate < today ? endDate : prev(today);
    Object.assign(result, await fetchRange(coords.lat, coords.lon, startDate, archiveEnd, true));
  }

  // Present / near-future dates → forecast API (≤ 16 days ahead)
  const fStart = startDate >= today ? startDate : today;
  const fEnd   = endDate  <= maxForecast ? endDate  : maxForecast;
  if (fStart <= fEnd) {
    Object.assign(result, await fetchRange(coords.lat, coords.lon, fStart, fEnd, false));
  }

  return result;
}

function prev(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}
