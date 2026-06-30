// WMO Weather Code → 主题映射
// 参考：https://open-meteo.com/en/docs#weathervariables

export const THEMES = {
  sunny: {
    key: 'sunny',
    label: '晴',
    isDark: false,
    bgGradient: 'linear-gradient(135deg, #FFF6D5 0%, #FFD27D 45%, #FFB347 100%)',
    bodyOverlay: 'rgba(255, 244, 220, 0.35)',
    textColor: '#3a2a00',
    softTextColor: 'rgba(58, 42, 0, 0.7)',
    accentColor: '#FF8E72',
    effectClass: 'effect-sunny',
    icon: '☀️',
  },
  sunnyNight: {
    key: 'sunnyNight',
    label: '晴夜',
    isDark: true,
    bgGradient: 'linear-gradient(135deg, #1a1a3e 0%, #2d2d5f 50%, #3a3a7a 100%)',
    bodyOverlay: 'rgba(20, 20, 40, 0.55)',
    textColor: '#f4f4ff',
    softTextColor: 'rgba(244, 244, 255, 0.7)',
    accentColor: '#A78BFA',
    effectClass: 'effect-stars',
    icon: '🌙',
  },
  cloudy: {
    key: 'cloudy',
    label: '多云',
    isDark: false,
    bgGradient: 'linear-gradient(135deg, #E5E9F2 0%, #C9D1E0 60%, #B8C2CC 100%)',
    bodyOverlay: 'rgba(220, 225, 235, 0.45)',
    textColor: '#2a3144',
    softTextColor: 'rgba(42, 49, 68, 0.65)',
    accentColor: '#7C8DA8',
    effectClass: 'effect-cloudy',
    icon: '⛅',
  },
  foggy: {
    key: 'foggy',
    label: '雾',
    isDark: false,
    bgGradient: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 60%, #D1D5DB 100%)',
    bodyOverlay: 'rgba(240, 240, 245, 0.45)',
    textColor: '#3a4154',
    softTextColor: 'rgba(58, 65, 84, 0.65)',
    accentColor: '#9CA3AF',
    effectClass: 'effect-foggy',
    icon: '🌫️',
  },
  rainy: {
    key: 'rainy',
    label: '雨',
    isDark: true,
    bgGradient: 'linear-gradient(135deg, #1E3A5F 0%, #15294A 50%, #0F2540 100%)',
    bodyOverlay: 'rgba(15, 35, 55, 0.55)',
    textColor: '#e9f0fb',
    softTextColor: 'rgba(233, 240, 251, 0.7)',
    accentColor: '#60A5FA',
    effectClass: 'effect-rainy',
    icon: '🌧️',
  },
  snowy: {
    key: 'snowy',
    label: '雪',
    isDark: false,
    bgGradient: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 50%, #DBEAFE 100%)',
    bodyOverlay: 'rgba(235, 245, 255, 0.4)',
    textColor: '#1a3a5a',
    softTextColor: 'rgba(26, 58, 90, 0.65)',
    accentColor: '#3B82F6',
    effectClass: 'effect-snowy',
    icon: '❄️',
  },
  stormy: {
    key: 'stormy',
    label: '雷暴',
    isDark: true,
    bgGradient: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F0F1F 100%)',
    bodyOverlay: 'rgba(15, 15, 30, 0.55)',
    textColor: '#f4f4ff',
    softTextColor: 'rgba(244, 244, 255, 0.7)',
    accentColor: '#F472B6',
    effectClass: 'effect-stormy',
    icon: '⛈️',
  },
};

// Open-Meteo WMO 天气码 → THEMES key
export function codeToTheme(code, isDay = true) {
  if (code === 0) return isDay ? THEMES.sunny : THEMES.sunnyNight;
  if (code === 1 || code === 2 || code === 3) return THEMES.cloudy;
  if (code === 45 || code === 48) return THEMES.foggy;
  if (code >= 51 && code <= 67) return THEMES.rainy;
  if (code >= 80 && code <= 82) return THEMES.rainy;
  if (code >= 71 && code <= 77) return THEMES.snowy;
  if (code === 85 || code === 86) return THEMES.snowy;
  if (code >= 95 && code <= 99) return THEMES.stormy;
  return THEMES.cloudy;
}

// 天气描述（中文短句）
const WEATHER_DESC = {
  0: '晴空万里', 1: '大致晴', 2: '局部多云', 3: '阴',
  45: '有雾', 48: '冻雾',
  51: '小毛毛雨', 53: '毛毛雨', 55: '大毛毛雨',
  56: '冻毛毛雨', 57: '强冻毛毛雨',
  61: '小雨', 63: '中雨', 65: '大雨',
  66: '冻雨', 67: '强冻雨',
  71: '小雪', 73: '中雪', 75: '大雪',
  77: '雪粒',
  80: '阵雨', 81: '强阵雨', 82: '暴雨',
  85: '阵雪', 86: '强阵雪',
  95: '雷暴', 96: '雷暴伴冰雹', 99: '强雷暴伴冰雹',
};

export function codeToDescription(code) {
  return WEATHER_DESC[code] || '天气未知';
}

// 心情库 key（与 moods.json 顶层 key 对齐）。
// 注意 sunnyNight 也用 sunny 心情库。
export function themeToMoodKey(theme) {
  if (theme.key === 'sunnyNight') return 'sunny';
  return theme.key;
}
