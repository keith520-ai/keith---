// Open-Meteo API 封装
// 文档：https://open-meteo.com/en/docs
//
// 注：Open-Meteo 没有 reverse geocoding 端点（官方 geocoding-api 仅支持 /search）。
//     反查城市名走 BigDataCloud client-side API（免费、无需 key、CORS 友好）。

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const REVERSE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

async function fetchWithTimeout(url, timeout = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/**
 * 根据经纬度拉当前天气。
 * 返回 { weatherCode, temperature, isDay, fetchedAt }
 */
export async function getCurrentWeather(lat, lon) {
  const url = `${FORECAST_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`;
  const data = await fetchWithTimeout(url);
  const c = data.current || {};
  return {
    weatherCode: c.weather_code ?? null,
    temperature: typeof c.temperature_2m === 'number' ? c.temperature_2m : null,
    isDay: c.is_day === 1,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * 城市名搜坐标。返回 { lat, lon, name, country }，未找到返回 null。
 */
export async function geocodeCity(name, language = 'zh') {
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(name)}&count=1&language=${language}&format=json`;
  const data = await fetchWithTimeout(url);
  const r = data.results && data.results[0];
  if (!r) return null;
  return {
    lat: r.latitude,
    lon: r.longitude,
    name: r.name,
    country: r.country,
    admin1: r.admin1 || '',
  };
}

/**
 * 经纬度反查城市名。返回 { name, country, admin1 } 或 null。
 *
 * 使用 BigDataCloud 的 reverse-geocode-client 端点：免费、无需 key、支持 CORS。
 * 返回字段优先级：locality > city > principalSubdivision（省/州）。
 * language 接受 'zh' / 'en' 等，BigDataCloud 用 `localityLanguage` 参数。
 */
export async function reverseGeocode(lat, lon, language = 'zh') {
  async function tryLang(lang) {
    try {
      const url = `${REVERSE_URL}?latitude=${lat}&longitude=${lon}&localityLanguage=${lang}`;
      const data = await fetchWithTimeout(url);
      // BigDataCloud 字段：city / locality / principalSubdivision / countryName
      const name = data.city || data.locality || data.principalSubdivision || '';
      if (!name) return null;
      return {
        name,
        country: data.countryName || '',
        admin1: data.principalSubdivision || '',
      };
    } catch {
      return null;
    }
  }
  const primary = await tryLang(language);
  if (primary) return primary;
  if (language !== 'en') {
    const fallback = await tryLang('en');
    if (fallback) return fallback;
  }
  return null;
}

/**
 * 一站式：根据坐标拿天气 + 城市名（反查失败则只返回天气，city 留空）
 */
export async function fetchByCoords(lat, lon) {
  const [weather, place] = await Promise.all([
    getCurrentWeather(lat, lon),
    reverseGeocode(lat, lon),
  ]);
  // city 名优先使用 name，name 缺失时用 admin1（省/州）兜底
  const cityName = place ? (place.name || place.admin1 || '') : '';
  return {
    ...weather,
    lat,
    lon,
    city: cityName,
    country: place ? place.country : '',
  };
}
