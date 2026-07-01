// mood-client: 调用 Supabase Edge Function (generate-mood) 获取 Claude 生成的心情
// 每访客每小时每"城市+天气码"限调 1 次，命中缓存直接返回 localStorage 的上一句。
// 调用失败返回空串，由 widget.js 回退到 moods.json 本地随机句。

import { WEATHER_CONFIG } from './config.local.js';

const HOUR_MS = 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const KEY_PREFIX = 'weatherMood:';

function bucketKey(city, weatherCode) {
  const hour = Math.floor(Date.now() / HOUR_MS);
  return `${KEY_PREFIX}${city || 'unknown'}:${weatherCode ?? 'na'}:${hour}`;
}

// 清掉非当前小时的旧缓存，防 localStorage 膨胀
function pruneOldBuckets(currentKey) {
  try {
    const toDel = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(KEY_PREFIX) && k !== currentKey) toDel.push(k);
    }
    toDel.forEach((k) => localStorage.removeItem(k));
  } catch { /* localStorage 不可用时静默 */ }
}

async function fetchWithTimeout(url, init, timeout) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/**
 * 从 Edge Function 取 Claude 生成的心情。
 * 失败/未配置返回 ''，调用方自行降级到本地随机句。
 */
export async function getMoodFromClaude({ city, weatherDesc, temperature, weatherCode, localTime }) {
  const url = WEATHER_CONFIG.edgeFunctionUrl;
  if (!url) return '';

  const key = bucketKey(city, weatherCode);

  try {
    const cached = localStorage.getItem(key);
    if (cached) return cached;
  } catch { /* localStorage 不可用 */ }

  try {
    const r = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          // Supabase Edge Function 要 anon key 作为 apikey 头部
          apikey: WEATHER_CONFIG.supabaseAnonKey,
        },
        body: JSON.stringify({
          city,
          weatherDesc,
          temperature,
          localTime,
          ownerName: WEATHER_CONFIG.ownerName,
        }),
      },
      FETCH_TIMEOUT_MS
    );
    if (!r.ok) throw new Error('HTTP_' + r.status);
    const data = await r.json();
    const mood = (data && data.mood) ? String(data.mood).trim() : '';
    if (mood) {
      try {
        pruneOldBuckets(key);
        localStorage.setItem(key, mood);
      } catch { /* 满了或不可用，忽略 */ }
    }
    return mood;
  } catch (e) {
    console.warn('[mood-client] Claude 调用失败，回退本地心情库', e);
    return '';
  }
}

export function hasEdgeFunction() {
  return Boolean(WEATHER_CONFIG.edgeFunctionUrl);
}
