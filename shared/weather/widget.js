// 天气心情站 · 主入口（Phase 2 重构版）
// 由 lab/index.html 引入：<script type="module" src="/shared/weather/widget.js"></script>
//
// 三态：
//   idle       — 默认；显示一张质感卡片，等用户点击启动
//   immersive  — 已启动；接管 body 背景 + 全屏动效 + 完整文案
//   exit       — 用户点 × 退出沉浸，回到 idle
//
// 站主（owner 模式）仍然在背景静默写入 Supabase，不依赖 idle/immersive

import { WEATHER_CONFIG } from './config.local.js';
import { THEMES, codeToTheme, codeToDescription, themeToMoodKey } from './themes.js';
import * as openMeteo from './open-meteo.js';
import * as store from './store-supabase.js';
import { getMoodFromClaude } from './mood-client.js';

const ROOT_ID = 'weather-mood-station';
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const MOODS_URL = '/shared/weather/moods.json';
const IMMERSED_FLAG = 'weatherImmersed';

let MOODS = null;
let currentTheme = null;
let currentSnapshot = null;
let isImmersed = false;
let immersedShellEl = null;
let fullscreenFxEl = null;
let exitBtnEl = null;
let rootEl = null;
let unsubscribeStore = null;

// =========================
// 工具
// =========================
function pickRandom(arr) {
  if (!arr || !arr.length) return '';
  return arr[Math.floor(Math.random() * arr.length)];
}

async function loadMoods() {
  if (MOODS) return MOODS;
  try {
    const res = await fetch(MOODS_URL);
    MOODS = await res.json();
  } catch (e) {
    console.warn('[weather] moods.json 加载失败', e);
    MOODS = {};
  }
  return MOODS;
}

function localMood(theme) {
  if (!MOODS) return '';
  const key = themeToMoodKey(theme);
  return pickRandom(MOODS[key]);
}

function isStale(fetchedAt) {
  if (!fetchedAt) return true;
  const t = new Date(fetchedAt).getTime();
  if (isNaN(t)) return true;
  return Date.now() - t > REFRESH_INTERVAL_MS;
}

// 根据 Open-Meteo 的 is_day 真实日落判断 + 小时细分
// isDay 来自该城市坐标算出的真实日落时刻，比单看小时准
function formatLocalTime(date = new Date(), isDay = null) {
  const h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  let period = '';
  if (isDay === false) {
    // Open-Meteo 说现在是夜晚 —— 按小时细分到"傍晚 / 夜晚 / 深夜 / 凌晨"
    if (h < 4) period = '凌晨';
    else if (h < 6) period = '黎明前';
    else if (h >= 17 && h < 19) period = '傍晚';
    else if (h >= 19 && h < 23) period = '夜里';
    else period = '深夜';
  } else if (isDay === true) {
    // Open-Meteo 说现在是白天 —— 按小时细分到"清晨 / 上午 / 正午 / 下午"
    if (h < 8) period = '清晨';
    else if (h < 11) period = '上午';
    else if (h < 13) period = '正午';
    else if (h < 16) period = '下午';
    else period = '傍晚';
  } else {
    // 兜底：没有 isDay 信息时纯按小时
    if (h < 5) period = '凌晨';
    else if (h < 8) period = '清晨';
    else if (h < 11) period = '上午';
    else if (h < 13) period = '正午';
    else if (h < 17) period = '下午';
    else if (h < 19) period = '傍晚';
    else if (h < 23) period = '夜里';
    else period = '深夜';
  }
  return `${period} ${h}:${m}`;
}

function timeOpener(date = new Date(), isDay = null) {
  const h = date.getHours();
  if (isDay === false) {
    if (h < 4) return '凌晨';
    if (h < 6) return '天还没亮';
    if (h >= 17 && h < 19) return '傍晚';
    if (h >= 19 && h < 23) return '今晚';
    return '深夜';
  }
  if (isDay === true) {
    if (h < 8) return '清晨';
    if (h < 11) return '上午';
    if (h < 13) return '正午时分';
    if (h < 16) return '午后';
    return '傍晚';
  }
  // 兜底
  if (h < 5)  return '深夜';
  if (h < 8)  return '清晨';
  if (h < 11) return '上午';
  if (h < 13) return '正午时分';
  if (h < 17) return '此刻';
  if (h < 19) return '傍晚';
  if (h < 23) return '今晚';
  return '深夜';
}

// =========================
// idle 卡片渲染
// =========================
function renderIdle(root, recap) {
  root.innerHTML = `
    <button type="button" class="weather-card-idle" data-weather-start>
      <div class="idle-icon">🌤️</div>
      <div class="idle-badge-row">
        <span class="idle-status">
          <span class="idle-pulse-dot"></span>待启动
        </span>
        <span class="idle-exp-num">Experiment #001</span>
      </div>
      <div class="idle-title">天气心情站</div>
      <div class="idle-subtitle">Click to feel today's weather with me</div>
      <p class="idle-desc">
        根据${WEATHER_CONFIG.ownerName || '万朗'}所在城市的天气，触发整个实验场的色调与动效变化，并让 AI 为此刻写一句心情。
      </p>
      <div class="idle-tags">
        <span>Open-Meteo</span>
        <span>Supabase Realtime</span>
        <span>Claude AI</span>
      </div>
      <div class="idle-cta">
        启动体验
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      </div>
      ${recap ? `<div class="idle-recap">上次体验：${recap}</div>` : ''}
    </button>
  `;

  const btn = root.querySelector('[data-weather-start]');
  btn.addEventListener('click', () => enterImmersive());
}

// =========================
// 沉浸态渲染
// =========================
function buildImmersiveDom() {
  const shell = document.createElement('div');
  shell.className = 'weather-immersive-shell';
  shell.innerHTML = `
    <header class="flex items-start justify-between gap-4 mb-10">
      <div class="flex items-center gap-3">
        <span class="text-3xl md:text-4xl" data-weather-icon>🌤️</span>
        <div>
          <p class="text-xs tracking-[3px] uppercase opacity-60" data-weather-label>WEATHER</p>
          <p class="text-sm opacity-70 mt-1" data-weather-fetched>正在连接…</p>
        </div>
      </div>
      <button type="button" data-visitor-toggle
        class="text-xs px-3 py-2 rounded-full border border-current/30 bg-white/15 hover:bg-white/30 transition opacity-80 hover:opacity-100"
        style="backdrop-filter:blur(8px);">
        🌍 切换到我所在的城市
      </button>
    </header>

    <div class="mb-2">
      <p class="text-2xl md:text-4xl font-semibold leading-snug" data-weather-headline>
        正在感受天气…
      </p>
      <p class="text-base md:text-lg mt-4 opacity-80" data-weather-mood></p>
      <p class="text-xs opacity-50 mt-6" data-mood-source>—</p>
    </div>

    <div class="visitor-overlay" data-visitor-overlay>
      <div class="visitor-overlay-card" style="position:relative;">
        <p class="text-xs tracking-[3px] uppercase text-gray-400">你所在的城市</p>
        <p class="text-2xl font-semibold mt-2 text-gray-900" data-visitor-headline>正在请求定位…</p>
        <p class="text-sm text-gray-500 mt-3" data-visitor-detail></p>
        <form data-visitor-manual class="hidden mt-4 flex gap-2">
          <input type="text" name="city" placeholder="手动输入城市，如：东京"
            class="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-400" />
          <button type="submit" class="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-gray-700 transition">查询</button>
        </form>
        <div class="mt-6 pt-5 border-t border-gray-100">
          <p class="text-xs text-gray-400 mb-2">你可能会有同感</p>
          <a href="/story/" class="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition">
            📖 阅读一段相关的故事
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </a>
        </div>
        <button type="button" data-visitor-close class="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
      </div>
    </div>
  `;
  return shell;
}

function applyTheme(theme) {
  if (!theme) return;
  const prev = currentTheme;
  currentTheme = theme;

  // body 上的 CSS 变量
  document.documentElement.style.setProperty('--weather-bg', theme.bgGradient);
  document.documentElement.style.setProperty('--weather-overlay', theme.bodyOverlay);
  document.documentElement.style.setProperty('--weather-text', theme.textColor);

  // 深浅类
  document.body.classList.toggle('theme-dark', !!theme.isDark);
  document.body.classList.toggle('theme-light', !theme.isDark);

  // 沉浸 shell 的文字色
  if (immersedShellEl) {
    immersedShellEl.style.color = theme.textColor;
  }

  // 全屏动效层切类（淡出 → 换 class → 淡入）
  if (fullscreenFxEl) {
    fullscreenFxEl.classList.remove('is-visible');
    setTimeout(() => {
      fullscreenFxEl.className = 'weather-fullscreen-fx ' + theme.effectClass;
      requestAnimationFrame(() => fullscreenFxEl.classList.add('is-visible'));
    }, 320);
  }
}

function renderSnapshotIntoShell(snapshot) {
  if (!immersedShellEl || !snapshot || snapshot.weatherCode == null) {
    if (immersedShellEl) {
      immersedShellEl.querySelector('[data-weather-headline]').textContent =
        '此刻还没有连上天气信号…';
      immersedShellEl.querySelector('[data-weather-mood]').textContent =
        '等站主打开页面授权定位后，这里会有专属的天气和心情。';
    }
    return;
  }
  const theme = codeToTheme(snapshot.weatherCode, snapshot.isDay);
  applyTheme(theme);

  const desc = codeToDescription(snapshot.weatherCode);
  const city = snapshot.city || '某个城市';
  const tempStr = snapshot.temperature != null
    ? `，温度 ${Math.round(snapshot.temperature)}°C`
    : '';
  const opener = timeOpener(new Date(), snapshot.isDay);
  const headline = `${opener}，${WEATHER_CONFIG.ownerName || '我'}在 ${city}，${desc}${tempStr}。`;

  immersedShellEl.querySelector('[data-weather-icon]').textContent = theme.icon;
  immersedShellEl.querySelector('[data-weather-label]').textContent = theme.label.toUpperCase();
  immersedShellEl.querySelector('[data-weather-headline]').textContent = headline;

  // 心情：先放本地，再 Claude 覆盖
  const moodEl = immersedShellEl.querySelector('[data-weather-mood]');
  const sourceEl = immersedShellEl.querySelector('[data-mood-source]');
  moodEl.textContent = localMood(theme);
  sourceEl.textContent = '— 本地心情库';

  // 异步去拿 Claude 生成
  getMoodFromClaude({
    city,
    weatherDesc: desc,
    temperature: snapshot.temperature,
    weatherCode: snapshot.weatherCode,
    localTime: formatLocalTime(new Date(), snapshot.isDay),
  }).then((aiMood) => {
    if (!aiMood) return;
    if (currentSnapshot !== snapshot) return;  // 切换太快
    moodEl.textContent = aiMood;
    sourceEl.textContent = `— Claude · ${formatLocalTime(new Date(), snapshot.isDay)}`;
  });

  const fetched = snapshot.fetchedAt ? new Date(snapshot.fetchedAt) : null;
  if (fetched) {
    const fmt = fetched.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    immersedShellEl.querySelector('[data-weather-fetched]').textContent = `更新于 ${fmt}`;
  }
}

// =========================
// 访客模式：用站主坐标实时拉天气，盖掉缓存里的旧天气
// =========================
async function refreshSnapshotForVisitor() {
  if (!currentSnapshot) return;
  if (currentSnapshot.lat == null || currentSnapshot.lon == null) return;
  try {
    const fresh = await openMeteo.getCurrentWeather(currentSnapshot.lat, currentSnapshot.lon);
    const merged = { ...currentSnapshot, ...fresh };
    currentSnapshot = merged;
    if (isImmersed) renderSnapshotIntoShell(merged);
  } catch (e) {
    console.warn('[weather] visitor refresh failed', e);
  }
}

// 沉浸态启动时的中性 loading 渲染（不应用任何天气主题，避免闪现旧天气）
function renderImmersiveLoading() {
  if (!immersedShellEl) return;
  immersedShellEl.querySelector('[data-weather-headline]').textContent = '正在感受此刻的天气…';
  immersedShellEl.querySelector('[data-weather-mood]').textContent = '';
  immersedShellEl.querySelector('[data-mood-source]').textContent = '—';
  immersedShellEl.querySelector('[data-weather-fetched]').textContent = '正在连接…';
}

// =========================
// 进入沉浸
// =========================
async function enterImmersive() {
  if (isImmersed) return;
  isImmersed = true;
  try { localStorage.setItem(IMMERSED_FLAG, '1'); } catch {}

  // 1. 清空 root，挂载 immersive shell
  rootEl.innerHTML = '';
  immersedShellEl = buildImmersiveDom();
  rootEl.appendChild(immersedShellEl);

  // 2. 全屏动效层
  fullscreenFxEl = document.createElement('div');
  fullscreenFxEl.className = 'weather-fullscreen-fx';
  document.body.appendChild(fullscreenFxEl);

  // 3. body 沉浸标记
  document.body.classList.add('weather-immersed');

  // 4. 退出按钮
  exitBtnEl = document.createElement('button');
  exitBtnEl.type = 'button';
  exitBtnEl.className = 'weather-exit-btn';
  exitBtnEl.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
    退出沉浸
  `;
  exitBtnEl.addEventListener('click', exitImmersive);
  document.body.appendChild(exitBtnEl);

  // 5. 访客切换浮层绑定
  setupVisitorOverlay(immersedShellEl);

  // 6. 已有快照直接渲染；否则等订阅推送
  //    访客模式：即便有旧 snapshot 也不立刻渲染——避免"闪一下旧天气主题（常为晴天）再切到当前天气"
  //    改为：先显示中性 loading，await 新天气后再 renderSnapshotIntoShell
  if (currentSnapshot && store.isOwner()) {
    renderSnapshotIntoShell(currentSnapshot);
  } else if (currentSnapshot && !store.isOwner()) {
    renderImmersiveLoading();
    await refreshSnapshotForVisitor();
  } else if (!store.isConfigured()) {
    immersedShellEl.querySelector('[data-weather-headline]').textContent =
      '天气心情站 · 等待配置中';
    immersedShellEl.querySelector('[data-weather-mood]').textContent =
      '请把 Supabase 凭证填进 /shared/weather/config.local.js 即可启用。';
    applyTheme(THEMES.cloudy);
  } else {
    renderImmersiveLoading();
  }
}

// =========================
// 退出沉浸
// =========================
function exitImmersive() {
  if (!isImmersed) return;
  isImmersed = false;
  try { localStorage.removeItem(IMMERSED_FLAG); } catch {}

  // 记录一段 recap 给 idle 卡片
  let recap = '';
  if (currentSnapshot && currentSnapshot.weatherCode != null) {
    const t = codeToTheme(currentSnapshot.weatherCode, currentSnapshot.isDay);
    const desc = codeToDescription(currentSnapshot.weatherCode);
    const tempStr = currentSnapshot.temperature != null
      ? `${Math.round(currentSnapshot.temperature)}°C`
      : '';
    recap = `${t.icon} ${currentSnapshot.city || ''} · ${desc} ${tempStr}`.trim();
  }

  // body 标记 + 主题变量清掉
  document.body.classList.remove('weather-immersed', 'theme-dark', 'theme-light');
  document.documentElement.style.removeProperty('--weather-bg');
  document.documentElement.style.removeProperty('--weather-overlay');
  document.documentElement.style.removeProperty('--weather-text');

  // 移除全屏动效与退出按钮
  if (fullscreenFxEl) {
    fullscreenFxEl.classList.remove('is-visible');
    setTimeout(() => fullscreenFxEl && fullscreenFxEl.remove(), 600);
    fullscreenFxEl = null;
  }
  if (exitBtnEl) {
    exitBtnEl.remove();
    exitBtnEl = null;
  }

  immersedShellEl = null;
  currentTheme = null;

  // 回到 idle
  renderIdle(rootEl, recap);
}

// =========================
// 访客浮层
// =========================
function setupVisitorOverlay(scope) {
  const overlay = scope.querySelector('[data-visitor-overlay]');
  const toggle = scope.querySelector('[data-visitor-toggle]');
  const closeBtn = scope.querySelector('[data-visitor-close]');
  const headline = scope.querySelector('[data-visitor-headline]');
  const detail = scope.querySelector('[data-visitor-detail]');
  const manualForm = scope.querySelector('[data-visitor-manual]');

  function open() {
    overlay.classList.add('is-open');
    requestVisitorLocation();
  }
  function close() {
    overlay.classList.remove('is-open');
    manualForm.classList.add('hidden');
    headline.textContent = '正在请求定位…';
    detail.textContent = '';
  }
  function showManualInput(reason) {
    headline.textContent = '告诉我你在哪？';
    detail.textContent = reason || '我们无法自动获取你的位置，手动输入即可。';
    manualForm.classList.remove('hidden');
    manualForm.querySelector('input[name="city"]').focus();
  }
  function renderVisitor(weather) {
    const theme = codeToTheme(weather.weatherCode, weather.isDay);
    const desc = codeToDescription(weather.weatherCode);
    const tempStr = weather.temperature != null ? `，温度 ${Math.round(weather.temperature)}°C` : '';
    headline.textContent = `你在 ${weather.city || '这里'}，${desc}${tempStr}`;
    detail.textContent = `${theme.icon} ${theme.label}`;
  }
  function requestVisitorLocation() {
    if (!window.isSecureContext || !('geolocation' in navigator)) {
      showManualInput('当前环境不支持自动定位');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await openMeteo.fetchByCoords(pos.coords.latitude, pos.coords.longitude);
          renderVisitor(data);
        } catch {
          showManualInput('网络好像有点儿不顺，手动来一次？');
        }
      },
      (err) => showManualInput(err.code === 1 ? '你拒绝了定位授权，可以手动输入。' : '定位失败，手动来一次？'),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  }
  manualForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cityInput = manualForm.querySelector('input[name="city"]').value.trim();
    if (!cityInput) return;
    headline.textContent = '正在查询…';
    detail.textContent = '';
    try {
      const place = await openMeteo.geocodeCity(cityInput);
      if (!place) { detail.textContent = '没找到这个城市，换个名字试试？'; return; }
      const weather = await openMeteo.getCurrentWeather(place.lat, place.lon);
      renderVisitor({ city: place.name, ...weather });
      manualForm.classList.add('hidden');
    } catch {
      detail.textContent = '查询失败，稍后再试。';
    }
  });
  toggle.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}

// =========================
// Owner 模式（与 idle/immersive 无关，始终运行）
// =========================
async function refreshOwnerWeather(forceLocation = false) {
  if (!('geolocation' in navigator)) return;
  const last = store.getLastSnapshot();
  const hasCoords = last && last.lat != null && last.lon != null;

  let lat, lon, city;
  if (hasCoords && !forceLocation) {
    lat = last.lat; lon = last.lon; city = last.city;
  } else {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000,
      });
    });
    lat = pos.coords.latitude;
    lon = pos.coords.longitude;
    const place = await openMeteo.reverseGeocode(lat, lon);
    city = place ? place.name : '';
  }
  const weather = await openMeteo.getCurrentWeather(lat, lon);
  await store.pushWeather({ lat, lon, city, ...weather });
}

async function startOwnerLoop() {
  try { await refreshOwnerWeather(true); } catch (e) { console.warn('[weather] owner 初次刷新失败', e); }
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible') return;
    const snap = store.getLastSnapshot();
    if (isStale(snap?.fetchedAt)) {
      try { await refreshOwnerWeather(false); } catch {}
    }
  });
}

// =========================
// 入口
// =========================
async function init() {
  rootEl = document.getElementById(ROOT_ID);
  if (!rootEl) return;

  await loadMoods();

  // 默认渲染 idle 卡片
  renderIdle(rootEl, '');

  // 后台：订阅 store（即使在 idle 态也维持订阅，但不渲染——存到 currentSnapshot 备用）
  if (store.isConfigured()) {
    unsubscribeStore = await store.subscribe((snapshot) => {
      if (!snapshot) return;
      const isFirstSnapshot = currentSnapshot == null;
      currentSnapshot = snapshot;
      if (isImmersed) {
        // 访客模式 + 首次拿到快照：snapshot 里的 weatherCode 可能是 Supabase 缓存的旧值
        // 不要立刻 render，先让 refreshSnapshotForVisitor 用坐标拉新天气覆盖再 render
        if (isFirstSnapshot && !store.isOwner()) {
          refreshSnapshotForVisitor();
        } else {
          renderSnapshotIntoShell(snapshot);
        }
      }
    });
  }

  // owner 模式：背景静默运行（点不点开 idle 卡都跑）
  if (store.isConfigured() && store.isOwner()) {
    startOwnerLoop();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
