// ownerWeatherStore: 站主天气状态的实时存储抽象
//
// 暴露 3 个方法：
//   subscribe(callback)          → 订阅最新数据；callback({city, lat, lon, weatherCode, temperature, isDay, fetchedAt})
//   pushLocation(lat, lon, city) → 写入站主位置（owner 模式）
//   pushWeather(payload)         → 写入站主天气（owner 模式）
//
// 实现：Supabase Realtime（owner_state 表单行 id=1）
// 未来切到 Edge Function 时，只需替换本文件内部实现，调用方零改动

import { WEATHER_CONFIG } from './config.local.js';

const SUPABASE_JS_CDN = 'https://esm.sh/@supabase/supabase-js@2';

let _client = null;
let _channel = null;
const _listeners = new Set();
let _lastSnapshot = null;

export function isConfigured() {
  return Boolean(WEATHER_CONFIG.supabaseUrl && WEATHER_CONFIG.supabaseAnonKey);
}

async function getClient() {
  if (_client) return _client;
  if (!isConfigured()) throw new Error('SUPABASE_NOT_CONFIGURED');
  const { createClient } = await import(SUPABASE_JS_CDN);
  _client = createClient(WEATHER_CONFIG.supabaseUrl, WEATHER_CONFIG.supabaseAnonKey);
  return _client;
}

function emit(snapshot) {
  _lastSnapshot = snapshot;
  for (const fn of _listeners) {
    try { fn(snapshot); } catch (e) { console.error('[ownerWeatherStore] listener error', e); }
  }
}

function normalizeRow(row) {
  if (!row) return null;
  return {
    city: row.city || '',
    lat: row.lat,
    lon: row.lon,
    weatherCode: row.weather_code,
    temperature: row.temperature,
    isDay: row.is_day !== false,
    fetchedAt: row.fetched_at,
    updatedAt: row.updated_at,
  };
}

async function fetchCurrentRow() {
  const client = await getClient();
  const { data, error } = await client
    .from('owner_state')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  return normalizeRow(data);
}

async function ensureSubscription() {
  if (_channel) return;
  const client = await getClient();
  _channel = client
    .channel('owner_state_realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'owner_state', filter: 'id=eq.1' },
      (payload) => {
        const row = payload.new || payload.record;
        emit(normalizeRow(row));
      }
    )
    .subscribe();
}

/**
 * 订阅站主天气。首次调用会拉一次当前值并启动 Realtime。
 * 返回 unsubscribe 函数。
 */
export async function subscribe(callback) {
  _listeners.add(callback);

  // 若已有快照立即派发一次
  if (_lastSnapshot) {
    queueMicrotask(() => callback(_lastSnapshot));
  } else {
    try {
      const row = await fetchCurrentRow();
      if (row) emit(row);
    } catch (e) {
      console.warn('[ownerWeatherStore] initial fetch failed', e);
    }
  }

  try {
    await ensureSubscription();
  } catch (e) {
    console.warn('[ownerWeatherStore] subscribe failed', e);
  }

  return () => _listeners.delete(callback);
}

/**
 * 写入站主位置（owner 模式才调用）
 */
export async function pushLocation({ lat, lon, city }) {
  if (!isOwner()) throw new Error('NOT_OWNER');
  const client = await getClient();
  const { error } = await client
    .from('owner_state')
    .update({
      lat,
      lon,
      city: city || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);
  if (error) throw error;
}

/**
 * 写入站主天气数据（owner 模式才调用）
 */
export async function pushWeather({ lat, lon, city, weatherCode, temperature, isDay, fetchedAt }) {
  if (!isOwner()) throw new Error('NOT_OWNER');
  const client = await getClient();
  const { error } = await client
    .from('owner_state')
    .update({
      lat: lat ?? undefined,
      lon: lon ?? undefined,
      city: city || null,
      weather_code: weatherCode,
      temperature,
      is_day: isDay,
      fetched_at: fetchedAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);
  if (error) throw error;
}

/**
 * owner 模式判定：URL ?owner=<token> 与 config.ownerToken 匹配
 * 注：此校验仅在前端，安全等级"防君子不防小人"；
 * 数据本身是公开的位置/天气，可接受。Phase 2 改 Edge Function。
 */
export function isOwner() {
  if (!WEATHER_CONFIG.ownerToken) return false;
  const params = new URLSearchParams(window.location.search);
  const token = params.get('owner');
  return token && token === WEATHER_CONFIG.ownerToken;
}

export function getLastSnapshot() {
  return _lastSnapshot;
}
