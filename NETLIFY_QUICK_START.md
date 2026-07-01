# 🚀 Netlify 部署 - 快速参考卡

## 最快方式（推荐）- 5 步完成

1. **注册 Netlify** → https://netlify.com → 用 GitHub 登录
2. **点击** "New site from Git"
3. **选择** GitHub 仓库
4. **点击** "Deploy site"（配置已自动读取 `netlify.toml`）
5. **完成** ✅ - 你的网站已上线！

---

## 获取网站 URL
部署后，Netlify 会分配一个免费 URL：
```
https://[random-name].netlify.app
```
在 Netlify 的 **Site overview** 可以看到

---

## 自定义域名
1. 在 Netlify **Domain management** 添加你的域名
2. 更新域名的 DNS 记录（按 Netlify 指示）
3. 等待 DNS 生效（通常 5-48 小时）

---

## 已生成的文件

| 文件 | 用途 |
|------|------|
| `netlify.toml` | 主配置文件（构建、缓存、重定向） |
| `.github/workflows/deploy-netlify.yml` | 自动化部署工作流（可选） |
| `NETLIFY_DEPLOYMENT.md` | 完整部署指南 |

---

## 配置特性

✅ **SPA 路由支持** - 所有路由自动指向 `index.html`  
✅ **智能缓存** - HTML 快速更新，资源长期缓存  
✅ **安全头** - MIME、XSS、点击劫持防护  
✅ **零构建时间** - 静态文件直接部署  

---

## 每次更新网站

只需 push 到 GitHub：
```bash
git add .
git commit -m "Update website content"
git push origin main
```

Netlify 会自动检测并部署（通常 1 分钟内完成）

---

## 需要帮助？
- 📖 完整指南：看 `NETLIFY_DEPLOYMENT.md`
- 🔗 官方文档：https://docs.netlify.com
- 💬 支持：https://support.netlify.com
