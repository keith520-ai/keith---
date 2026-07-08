// 天气心情站 · 本地配置
// Supabase anon key 为公开密钥，可安全用于前端
// 此文件不会被提交到 Git（见 .gitignore）

export const WEATHER_CONFIG = {
  // Supabase 项目 URL
  supabaseUrl: 'https://ibqhaclnuueghnipwvvd.supabase.co',

  // Supabase anon public key（公开密钥）
  supabaseAnonKey: 'sb_publishable_yRp74avkC-5tAluXp7MKBw_JFRz_K9-',

  // owner 模式令牌：访问 /lab/?owner=<此令牌> 以激活位置写入
  ownerToken: 'wl-owner-2026-fbc4d9e2-7a31-48c6-b9d1-0e58a3c7f221',

  // 站主名字
  ownerName: '万朗',

  // Supabase Edge Function URL（可选，留空则使用本地心情库）
  // 部署 supabase/functions/generate-mood 后填入：
  // https://ibqhaclnuueghnipwvvd.supabase.co/functions/v1/generate-mood
  edgeFunctionUrl: '',
};
