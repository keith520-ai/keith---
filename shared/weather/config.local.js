// 天气心情站 · 本地配置（**不要提交此文件**）
// 由 config.example.js 复制而来。填入你的真实凭证后生效。
// 若未填写，页面会显示占位提示，不报错。

export const WEATHER_CONFIG = {
  supabaseUrl: 'https://ibqhaclnuueghnipwvvd.supabase.co',
  supabaseAnonKey: 'sb_publishable_yRp74avkC-5tAluXp7MKBw_JFRz_K9-',
  ownerToken: 'wl-owner-2026-fbc4d9e2-7a31-48c6-b9d1-0e58a3c7f221',
  ownerName: '万朗',
  // 部署 supabase/functions/generate-mood 后填入：
  // https://<project-ref>.supabase.co/functions/v1/generate-mood
  edgeFunctionUrl: '',
};
