// 天气心情站 · 配置模板
// 复制本文件为 config.local.js，并填入真实值
// config.local.js 不会被提交到 Git（见 .gitignore）

export const WEATHER_CONFIG = {
  // Supabase 项目 URL（Project Settings → API → Project URL）
  supabaseUrl: '',

  // Supabase anon public key（Project Settings → API → anon public）
  supabaseAnonKey: '',

  // owner 模式令牌：随便生成一串长字符串，越随机越好
  // 访问 /lab/?owner=<这里填的字符串> 才会触发位置写入
  // 例：crypto.randomUUID() + '-' + Date.now()
  ownerToken: '',

  // 站主名字（用于内容区文案）
  ownerName: '万朗',

  // 部署 supabase/functions/generate-mood 后填入：
  // https://<project-ref>.supabase.co/functions/v1/generate-mood
  // 留空则跳过 Claude，使用本地 moods.json 随机句
  edgeFunctionUrl: '',
};
