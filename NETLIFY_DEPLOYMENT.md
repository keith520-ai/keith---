# Netlify 部署清单 - 3 分钟快速指南

## 📋 预备清单

- [ ] 已将项目推送到 GitHub（确保仓库是公开的或你有访问权限）
- [ ] 已安装必要的配置文件：
  - `netlify.toml` ✅ 已生成
  - `.github/workflows/deploy-netlify.yml` ✅ 已生成（可选）

---

## 🚀 部署步骤（方式一：通过 Netlify UI - 推荐）

### 步骤 1：创建 Netlify 账户
1. 访问 https://www.netlify.com
2. 点击 **Sign up** 注册账户（可用 GitHub 账户直接登录）

### 步骤 2：连接 GitHub 仓库
1. 登录 Netlify 后，点击 **New site from Git**
2. 选择 **GitHub**
3. 授权 Netlify 访问你的 GitHub 账户
4. 搜索并选择你的网站仓库

### 步骤 3：配置构建设置
Netlify 会自动检测到 `netlify.toml` 配置文件，你会看到：
- **Build command**: `echo 'Static site ready for deployment'`
- **Publish directory**: `.`
- 点击 **Deploy site** 按钮

### 步骤 4：等待部署完成
- 首次部署通常需要 30-60 秒
- 网站会自动分配一个 URL，格式如：`https://[random-name].netlify.app`
- 在 **Domains** 部分可以配置自定义域名

---

## 🔗 部署步骤（方式二：通过 GitHub Actions - 自动化）

### 前置要求
1. 已有 GitHub Actions 工作流文件：`.github/workflows/deploy-netlify.yml` ✅

### 步骤 1：在 Netlify 获取 Token 和 Site ID
1. 登录 Netlify
2. 访问 **User settings → Applications → Personal access tokens**
3. 点击 **New access token**，复制生成的 Token
4. 在网站的 **Site settings → General → Site ID** 找到 Site ID

### 步骤 2：配置 GitHub Secrets
1. 进入你的 GitHub 仓库 → **Settings → Secrets and variables → Actions**
2. 点击 **New repository secret**，添加：
   - 名称: `NETLIFY_AUTH_TOKEN`，值：粘贴上面复制的 Token
   - 名称: `NETLIFY_SITE_ID`，值：粘贴上面的 Site ID

### 步骤 3：触发自动部署
- 每次 push 到 `main` 或 `master` 分支时，GitHub Actions 会自动部署到 Netlify
- 在 GitHub 的 **Actions** 选项卡可以查看部署状态

---

## 🎯 核心配置文件说明

### `netlify.toml`
```toml
[build]
  command = "echo 'Static site ready for deployment'"  # 无需构建步骤
  publish = "."                                         # 发布整个目录
```

**重定向规则**（SPA 支持）：
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```
- 所有未匹配的路由都会重定向到 `index.html`
- 这允许你的 JavaScript 进行客户端路由

**缓存策略**：
- `index.html`: 1800 秒（30 分钟）- 较短，便于更新
- `/shared/*`: 86400 秒（1 天）- 较长，资源不经常变化
- 首页其他资源: 3600 秒（1 小时）

---

## 🔒 安全特性

自动配置了以下安全头：
- `X-Content-Type-Options`: MIME 类型嗅探防护
- `X-Frame-Options`: 点击劫持防护
- `X-XSS-Protection`: XSS 防护
- `Referrer-Policy`: 引荐来源防护

---

## 📝 使用自定义域名

### 如果你有自己的域名：
1. 在 Netlify **Site settings → Domain management**
2. 点击 **Add custom domain**
3. 输入你的域名（如 `example.com`）
4. 按照 Netlify 的指示更新你的域名 DNS 记录
5. DNS 生效通常需要 5-48 小时

---

## 🆘 常见问题

### Q: 部署后页面显示 404
**A**: 检查是否正确配置了 SPA 重定向规则（已在 `netlify.toml` 中配置）

### Q: 如何更新网站内容？
**A**: 
- **方式一**：直接 push 到 GitHub，Netlify 会自动检测并部署
- **方式二**：通过 Netlify CLI 本地部署

### Q: 如何本地测试 Netlify 配置？
```bash
npm install -g netlify-cli
cd your-website-directory
netlify dev
```

### Q: 能否添加服务器端功能？
**A**: 目前是纯静态部署。如需添加后端功能：
- 使用 **Netlify Functions** 添加无服务器函数
- 使用 **Supabase** 等第三方服务处理数据库

---

## ✨ 后续优化建议

1. **添加环境变量**：
   - 如果后期需要 API Key，可在 Netlify 中配置

2. **启用分支部署**：
   - 为每个 GitHub 分支创建预览 URL

3. **配置重定向规则**：
   - 如果有页面移动，可添加 301 重定向

4. **启用 Netlify Analytics**：
   - 追踪网站访问统计

---

## 📞 需要帮助？

- Netlify 文档: https://docs.netlify.com
- 支持: https://support.netlify.com

---

**准备好了吗？现在就可以开始部署！** 🎉
